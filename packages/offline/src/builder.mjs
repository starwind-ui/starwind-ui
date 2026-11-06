import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import { mkdir, readFile, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

import semver from "semver";

import {
  isNativeManifest,
  platformPackageName,
  platformsForManifest,
  SUPPORTED_PLATFORMS,
} from "./platforms.mjs";

const PACKAGE_DIRECTORY = fileURLToPath(new URL("..", import.meta.url));
export const REPO_ROOT = path.resolve(PACKAGE_DIRECTORY, "../..");
export const NPM_REGISTRY = "https://registry.npmjs.org";
export const MAIN_PACKAGE_NAME = "@starwind-ui/offline";
export const OFFLINE_INDEX_SCHEMA_VERSION = 1;
export const MINIMUM_RELEASE_AGE_MS = 2 * 24 * 60 * 60 * 1000;

/**
 * Peers that the host project owns. The kit follows other non-optional peers, so a package
 * manager that installs peers automatically finds them offline.
 */
export const HOST_PEER_EXCLUDES = Object.freeze([
  "astro",
  "vite",
  "next",
  "nuxt",
  "@sveltejs/kit",
  "@types/node",
  "less",
  "sass",
  "sass-embedded",
  "stylus",
  "sugarss",
  "terser",
  "lightningcss",
  "tsx",
  "yaml",
  "jiti",
]);

/**
 * Packages whose registry metadata the kit serves without archives. The pnpm launcher reads this
 * metadata to switch to a project's pinned version, which it already keeps in its own store. Newer
 * launchers resolve `@pnpm/exe`, so the kit follows that package's dependencies as metadata too.
 */
export const METADATA_ONLY_PACKAGES = Object.freeze([
  { name: "pnpm", range: ">=9.0.0-0", follow: false },
  { name: "@pnpm/exe", range: ">=9.0.0-0", follow: true },
]);

/** The launcher packages whose dependencies the kit describes: the pnpm binaries and reflink. */
function followsLauncherDependency(name) {
  return name.startsWith("@pnpm/") || name.startsWith("@reflink/");
}

/**
 * Adds metadata-only nodes for every matching launcher version and for the matching versions of
 * the `@pnpm/*` and `@reflink/*` packages they name. A package that the kit stores for real keeps
 * only its real versions, so a project install never picks a version without an archive. A failed
 * fetch stops the build, except a missing optional platform package.
 */
export async function addMetadataOnlyNodes(
  nodes,
  fetchPackument,
  packages = METADATA_ONLY_PACKAGES,
) {
  const storedNames = new Set(
    [...nodes.values()].filter((node) => !node.metadataOnly).map((node) => node.name),
  );
  const queue = packages.map((entry) => ({ ...entry, root: true }));
  const seen = new Set();
  while (queue.length > 0) {
    const { name, range, follow, root, optional } = queue.shift();
    const key = `${name}@${range}`;
    if (seen.has(key) || storedNames.has(name)) continue;
    seen.add(key);
    let packument;
    try {
      packument = await fetchPackument(name);
    } catch (error) {
      // Only an optional platform package may be missing; anything else stops the build.
      if (!root && optional && /no package named/.test(error.message)) continue;
      throw error;
    }
    for (const [version, manifest] of Object.entries(packument.versions ?? {})) {
      // Prereleases count too: a project can pin one, and the launcher needs its metadata.
      if (!semver.satisfies(version, range, { includePrerelease: true })) continue;
      if (!nodes.has(`${name}@${version}`)) {
        nodes.set(`${name}@${version}`, {
          name,
          version,
          manifest,
          time: packument.time?.[version],
          metadataOnly: true,
        });
      }
      if (!follow) continue;
      for (const field of ["dependencies", "optionalDependencies"]) {
        for (const [dependency, dependencyRange] of Object.entries(manifest[field] ?? {})) {
          if (
            followsLauncherDependency(dependency) &&
            typeof dependencyRange === "string" &&
            semver.validRange(dependencyRange)
          ) {
            queue.push({
              name: dependency,
              range: dependencyRange,
              follow: true,
              optional: field === "optionalDependencies",
            });
          }
        }
      }
    }
  }
  return nodes;
}

/** Supported platforms that store this archive, null for the main package, or [] for none. */
function archivePlatforms(node, platforms) {
  if (node.metadataOnly) return [];
  return isNativeManifest(node.manifest) ? platformsForManifest(node.manifest, platforms) : null;
}

/** Host frameworks that a project installs itself; the kit never resolves them as roots. */
export const HOST_ROOT_EXCLUDES = Object.freeze([
  "astro",
  "next",
  "nuxt",
  "@sveltejs/kit",
  "quasar",
]);

/** Manifest fields that package managers read from registry metadata. */
const MANIFEST_FIELDS = [
  "name",
  "version",
  "description",
  "license",
  "main",
  "module",
  "types",
  "bin",
  "directories",
  "engines",
  "os",
  "cpu",
  "libc",
  "dependencies",
  "optionalDependencies",
  "peerDependencies",
  "peerDependenciesMeta",
  "bundleDependencies",
  "bundledDependencies",
  "deprecated",
  "hasInstallScript",
  "_hasShrinkwrap",
  "gypfile",
];
const INSTALL_SCRIPT_NAMES = ["preinstall", "install", "postinstall"];

export function splitSpec(spec) {
  const separator = spec.lastIndexOf("@");
  if (separator <= 0) return { name: spec, range: "latest" };
  return { name: spec.slice(0, separator), range: spec.slice(separator + 1) || "latest" };
}

const DIST_TAG = /^[a-z][a-z0-9._-]*$/i;

/** Resolves `npm:` aliases to the target package and rejects non-registry specifications. */
export function normalizeDependency(name, range) {
  if (typeof range !== "string") throw new Error(`Invalid dependency range for ${name}.`);
  const trimmed = range.trim() || "latest";
  if (trimmed.startsWith("npm:")) return splitSpec(trimmed.slice(4));
  if (!semver.validRange(trimmed) && !DIST_TAG.test(trimmed)) {
    throw new Error(
      `The offline kit cannot store ${name}@${range}, which is not an npm registry dependency.`,
    );
  }
  return { name, range: trimmed };
}

/** Reads the CLI requirement lists from the built CLI and its bundled registry files. */
export async function loadRootRequirements({ repoRoot = REPO_ROOT, requirementsModule } = {}) {
  const cliRoot = path.join(repoRoot, "packages/cli");
  if (!requirementsModule) {
    const entry = path.join(cliRoot, "dist/offline-requirements.js");
    try {
      requirementsModule = await import(pathToFileURL(entry).href);
    } catch (error) {
      throw new Error(
        `Build the starwind CLI before building the offline kit (${entry}): ${error.message}`,
      );
    }
  }
  const requirements = new Set(requirementsModule.getOfflineCodeRequirements());
  // A built CLI records its registry list. Source modules in tests read the registry files.
  const recorded = requirementsModule.getOfflineRegistryRequirements?.();
  if (recorded) {
    for (const spec of recorded) requirements.add(spec);
  } else {
    for (const file of ["bundled-registry.json", "primitive-vendoring-artifacts.json"]) {
      const document = JSON.parse(await readFile(path.join(cliRoot, "src/registry", file), "utf8"));
      requirementsModule.collectRegistryPackageRequirements(document, requirements);
    }
  }
  // `init` installs a Starwind adapter at the lowest version of its range, so the kit stores that
  // exact version next to the highest one that the range resolves to.
  for (const spec of [...requirements]) {
    const { name, range } = splitSpec(spec);
    const lowest = name.startsWith("@starwind-ui/") ? semver.minVersion(range)?.version : undefined;
    if (lowest) requirements.add(`${name}@${lowest}`);
  }
  return [...requirements]
    .filter((spec) => !HOST_ROOT_EXCLUDES.includes(splitSpec(spec).name))
    .sort();
}

export function createNpmPackumentFetcher({ registry = NPM_REGISTRY, fetchImpl = fetch } = {}) {
  const cache = new Map();
  return (name) => {
    if (!cache.has(name)) {
      cache.set(
        name,
        (async () => {
          const url = `${registry}/${name.startsWith("@") ? name.replace("/", "%2f") : name}`;
          for (let attempt = 1; ; attempt += 1) {
            const response = await fetchImpl(url, { headers: { accept: "application/json" } });
            if (response.ok) return response.json();
            if (response.status === 404) throw new Error(`npm has no package named ${name}.`);
            if (attempt >= 4) throw new Error(`npm returned ${response.status} for ${name}.`);
            await new Promise((resolve) => setTimeout(resolve, attempt * 1000));
          }
        })(),
      );
    }
    return cache.get(name);
  };
}

function eligibleVersions(packument, { now, minimumAgeMs, ageExempt }) {
  return Object.keys(packument.versions ?? {}).filter((version) => {
    if (ageExempt(packument.name)) return true;
    const published = Date.parse(packument.time?.[version] ?? "");
    return Number.isFinite(published) && now - published >= minimumAgeMs;
  });
}

/** Picks the version a package manager would pick, limited to versions old enough to trust. */
export function selectVersion(packument, range, options) {
  const versions = eligibleVersions(packument, options);
  const tagged = packument["dist-tags"]?.[range];
  if (tagged) {
    if (versions.includes(tagged)) return tagged;
    const stable = versions.filter((version) => !semver.prerelease(version));
    return semver.maxSatisfying(stable, "*") ?? undefined;
  }
  const valid = semver.validRange(range);
  if (!valid) return undefined;
  return semver.maxSatisfying(versions, valid) ?? undefined;
}

/**
 * Resolves the root specs and their dependencies, optional dependencies, and non-optional peers.
 * Returns a map of `name@version` to the npm version document and its publish time.
 */
export async function resolveClosure({
  roots,
  fetchPackument,
  now = Date.now(),
  minimumAgeMs = MINIMUM_RELEASE_AGE_MS,
  ageExempt = (name) => name.startsWith("@starwind-ui/") || name === "starwind",
  peerExcludes = HOST_PEER_EXCLUDES,
}) {
  const nodes = new Map();
  const queue = roots.map((spec) => ({ ...splitSpec(spec), from: "CLI requirements" }));
  const seen = new Set();
  while (queue.length > 0) {
    const batch = queue.splice(0, 24);
    await Promise.all(
      batch.map(async ({ name: rawName, range: rawRange, from }) => {
        const { name, range } = normalizeDependency(rawName, rawRange);
        const edgeKey = `${name}@${range}`;
        if (seen.has(edgeKey)) return;
        seen.add(edgeKey);
        const packument = await fetchPackument(name);
        const version = selectVersion(packument, range, { now, minimumAgeMs, ageExempt });
        if (!version) {
          throw new Error(
            `No version of ${name} matches ${range} and is at least ${Math.round(minimumAgeMs / 3_600_000)} hours old (needed by ${from}).`,
          );
        }
        const key = `${name}@${version}`;
        if (nodes.has(key)) return;
        const manifest = packument.versions[version];
        nodes.set(key, {
          name,
          version,
          manifest,
          time: packument.time?.[version] ?? new Date(now).toISOString(),
        });
        const enqueue = (dependencies) => {
          for (const [dependency, dependencyRange] of Object.entries(dependencies ?? {})) {
            queue.push({ name: dependency, range: dependencyRange, from: key });
          }
        };
        enqueue(manifest.dependencies);
        enqueue(manifest.optionalDependencies);
        for (const [peer, peerRange] of Object.entries(manifest.peerDependencies ?? {})) {
          if (manifest.peerDependenciesMeta?.[peer]?.optional || peerExcludes.includes(peer))
            continue;
          queue.push({ name: peer, range: peerRange, from: key });
        }
      }),
    );
  }
  return nodes;
}

export function sha512Integrity(bytes) {
  return `sha512-${createHash("sha512").update(bytes).digest("base64")}`;
}

export function sha1Hex(bytes) {
  return createHash("sha1").update(bytes).digest("hex");
}

/** Throws unless the archive matches the integrity or shasum that npm recorded. */
export function verifyArchive(name, version, bytes, dist = {}) {
  const integrities = String(dist.integrity ?? "")
    .split(/\s+/)
    .filter(Boolean);
  for (const integrity of integrities) {
    const [algorithm, expected] = [
      integrity.slice(0, integrity.indexOf("-")),
      integrity.slice(integrity.indexOf("-") + 1),
    ];
    if (!["sha512", "sha384", "sha256", "sha1"].includes(algorithm)) continue;
    const actual = createHash(algorithm).update(bytes).digest("base64");
    if (actual !== expected)
      throw new Error(`${name}@${version} does not match its npm integrity.`);
    return;
  }
  if (dist.shasum) {
    if (sha1Hex(bytes) !== dist.shasum)
      throw new Error(`${name}@${version} does not match its npm shasum.`);
    return;
  }
  throw new Error(`${name}@${version} has no npm integrity to verify.`);
}

export function archiveFileName(name, version) {
  return `${name.replace("/", "__")}-${version}.tgz`;
}

export function pickManifestFields(manifest) {
  const picked = {};
  for (const field of MANIFEST_FIELDS) {
    if (manifest[field] !== undefined) picked[field] = manifest[field];
  }
  const scripts = Object.fromEntries(
    INSTALL_SCRIPT_NAMES.filter((name) => manifest.scripts?.[name]).map((name) => [
      name,
      manifest.scripts[name],
    ]),
  );
  if (Object.keys(scripts).length > 0) picked.scripts = scripts;
  return picked;
}

/** Reads `package/package.json` from a packed archive with the system tar. */
export function readArchiveManifest(file) {
  const output = execFileSync("tar", ["-xzOf", file, "package/package.json"], {
    maxBuffer: 16 * 1024 * 1024,
  });
  return JSON.parse(output.toString("utf8"));
}

/**
 * Wraps a packument fetcher so local packed archives replace the npm versions of those packages.
 * A test kit replaces the whole packument. A release adds the archives it is about to publish to
 * the versions that npm already has (`merge`), because npm will serve those exact bytes.
 */
export async function withLocalPackages(
  fetchPackument,
  localArchives,
  { now = Date.now(), merge = false } = {},
) {
  const local = new Map();
  for (const file of localArchives) {
    const manifest = readArchiveManifest(file);
    const bytes = await readFile(file);
    const entries = local.get(manifest.name) ?? [];
    entries.push({
      file,
      manifest: {
        ...manifest,
        dist: { integrity: sha512Integrity(bytes), shasum: sha1Hex(bytes), localFile: file },
      },
    });
    local.set(manifest.name, entries);
  }
  return {
    localNames: [...local.keys()],
    fetchPackument: async (name) => {
      const entries = local.get(name);
      if (!entries) return fetchPackument(name);
      const time = Object.fromEntries(
        entries.map(({ manifest }) => [manifest.version, new Date(now).toISOString()]),
      );
      const versions = Object.fromEntries(
        entries.map(({ manifest }) => [manifest.version, manifest]),
      );
      let base;
      if (merge) {
        try {
          base = await fetchPackument(name);
        } catch (error) {
          if (!/no package named/.test(error.message)) throw error;
        }
      }
      const allVersions = { ...base?.versions, ...versions };
      const latest = semver.maxSatisfying(Object.keys(allVersions), "*", {
        includePrerelease: true,
      });
      return {
        ...base,
        name,
        "dist-tags": { ...base?.["dist-tags"], latest: base?.["dist-tags"]?.latest ?? latest },
        time: { ...base?.time, ...time },
        versions: allVersions,
      };
    },
  };
}

export async function downloadArchive(url, fetchImpl = fetch) {
  for (let attempt = 1; ; attempt += 1) {
    const response = await fetchImpl(url);
    if (response.ok) return Buffer.from(await response.arrayBuffer());
    if (attempt >= 4) throw new Error(`Download failed with ${response.status}: ${url}`);
    await new Promise((resolve) => setTimeout(resolve, attempt * 1000));
  }
}

function sortObject(value) {
  return Object.fromEntries(Object.entries(value).sort(([a], [b]) => a.localeCompare(b)));
}

/** Builds the kit index from resolved nodes after `writeKit` records their archive hashes. */
export function createIndex({
  nodes,
  kitVersion,
  createdAt,
  platforms,
  testBuild = false,
  requirements = [],
}) {
  const packages = {};
  for (const node of [...nodes.values()].sort(
    (a, b) => a.name.localeCompare(b.name) || semver.compare(a.version, b.version),
  )) {
    packages[node.name] ??= { distTags: {}, time: {}, versions: {} };
    const record = packages[node.name];
    const nativePlatforms = archivePlatforms(node, platforms);
    record.versions[node.version] = {
      manifest: pickManifestFields(node.manifest),
      dist: {
        integrity: node.integrity,
        shasum: node.shasum,
        file: archiveFileName(node.name, node.version),
        platforms: nativePlatforms,
      },
    };
    record.time[node.version] = node.time;
  }
  for (const record of Object.values(packages)) {
    const versions = Object.keys(record.versions);
    const stable = versions.filter((version) => !semver.prerelease(version));
    record.distTags.latest = semver.maxSatisfying(stable.length ? stable : versions, "*", {
      includePrerelease: true,
    });
    const times = Object.values(record.time).sort();
    record.time = { created: times[0], modified: times.at(-1), ...sortObject(record.time) };
    record.versions = sortObject(record.versions);
  }
  return {
    schemaVersion: OFFLINE_INDEX_SCHEMA_VERSION,
    kitVersion,
    createdAt,
    // A test build stores local archives that npm does not serve, so it must never be published.
    ...(testBuild ? { testBuild: true } : {}),
    // The CLI requirements that produced this kit, so a release can tell whether it is current.
    requirements: [...requirements].sort(),
    platforms: platforms.map(({ key }) => key),
    packages: sortObject(packages),
  };
}

const LICENSE_TEXT = "MIT";

function mainPackageJson({ kitVersion, cliVersion, platforms }) {
  return {
    name: MAIN_PACKAGE_NAME,
    version: kitVersion,
    description:
      "Run the Starwind UI CLI without a network connection. Contains the CLI and every npm package it installs.",
    license: LICENSE_TEXT,
    type: "module",
    homepage: "https://starwind.dev/docs/getting-started/cli/#offline-use",
    repository: {
      type: "git",
      url: "https://github.com/starwind-ui/starwind-ui.git",
      directory: "packages/offline",
    },
    keywords: ["starwind", "starwind-ui", "offline", "cli"],
    bin: { "starwind-offline": "bin/starwind-offline.mjs" },
    files: ["bin", "store", "README.md"],
    engines: { node: ">=22.12.0" },
    dependencies: { starwind: cliVersion },
    optionalDependencies: Object.fromEntries(
      platforms.map(({ key }) => [platformPackageName(key), kitVersion]),
    ),
  };
}

function platformPackageJson({ kitVersion, platform }) {
  return {
    name: platformPackageName(platform.key),
    version: kitVersion,
    description: `Native packages for the Starwind UI offline kit on ${platform.key}.`,
    license: LICENSE_TEXT,
    homepage: "https://starwind.dev/docs/getting-started/cli/#offline-use",
    repository: {
      type: "git",
      url: "https://github.com/starwind-ui/starwind-ui.git",
      directory: "packages/offline",
    },
    os: [platform.os],
    cpu: [platform.cpu],
    ...(platform.libc ? { libc: [platform.libc] } : {}),
    files: ["store", "README.md"],
  };
}

/**
 * Downloads and verifies every archive, then writes the main package and one package for each
 * platform into `outputDirectory`. Returns the package directories, main package last.
 */
export async function writeKit({
  nodes,
  outputDirectory,
  kitVersion,
  cliVersion,
  platforms = SUPPORTED_PLATFORMS,
  createdAt = new Date().toISOString(),
  download = (url) => downloadArchive(url),
  testBuild = false,
  requirements = [],
  log = () => {},
}) {
  await rm(outputDirectory, { recursive: true, force: true });
  const mainDirectory = path.join(outputDirectory, "offline");
  const platformDirectories = new Map(
    platforms.map((platform) => [
      platform.key,
      path.join(outputDirectory, `offline-${platform.key}`),
    ]),
  );
  for (const directory of [mainDirectory, ...platformDirectories.values()]) {
    await mkdir(path.join(directory, "store/archives"), { recursive: true });
  }

  const ordered = [...nodes.values()];
  let completed = 0;
  for (let index = 0; index < ordered.length; index += 8) {
    await Promise.all(
      ordered.slice(index, index + 8).map(async (node) => {
        const dist = node.manifest.dist ?? {};
        const nativePlatforms = archivePlatforms(node, platforms);
        if (nativePlatforms && nativePlatforms.length === 0) {
          node.integrity = dist.integrity;
          node.shasum = dist.shasum;
          return;
        }
        const bytes = dist.localFile
          ? await readFile(dist.localFile)
          : await download(dist.tarball);
        verifyArchive(node.name, node.version, bytes, dist);
        node.integrity = sha512Integrity(bytes);
        node.shasum = sha1Hex(bytes);
        const file = archiveFileName(node.name, node.version);
        const targets = nativePlatforms
          ? nativePlatforms.map((key) => platformDirectories.get(key))
          : [mainDirectory];
        for (const target of targets)
          await writeFile(path.join(target, "store/archives", file), bytes);
        completed += 1;
        if (completed % 50 === 0) log(`Stored ${completed} archives`);
      }),
    );
  }

  const index = createIndex({ nodes, kitVersion, createdAt, platforms, testBuild, requirements });
  await writeFile(path.join(mainDirectory, "store/index.json"), `${JSON.stringify(index)}\n`);
  await writeFile(
    path.join(mainDirectory, "package.json"),
    `${JSON.stringify(mainPackageJson({ kitVersion, cliVersion, platforms }), null, 2)}\n`,
  );
  await mkdir(path.join(mainDirectory, "bin"), { recursive: true });
  const bin = (
    await readFile(path.join(PACKAGE_DIRECTORY, "src/bin-template.mjs"), "utf8")
  ).replace(
    "/* PLATFORM_PACKAGES */ []",
    JSON.stringify(platforms.map(({ key }) => platformPackageName(key))),
  );
  await writeFile(path.join(mainDirectory, "bin/starwind-offline.mjs"), bin, { mode: 0o755 });
  const readme = await readFile(path.join(PACKAGE_DIRECTORY, "src/kit-readme.md"), "utf8");
  await writeFile(path.join(mainDirectory, "README.md"), readme);

  for (const platform of platforms) {
    const directory = platformDirectories.get(platform.key);
    await writeFile(
      path.join(directory, "package.json"),
      `${JSON.stringify(platformPackageJson({ kitVersion, platform }), null, 2)}\n`,
    );
    await writeFile(
      path.join(directory, "store/platform.json"),
      `${JSON.stringify({ platform: platform.key, kitVersion })}\n`,
    );
    await writeFile(
      path.join(directory, "README.md"),
      `# ${platformPackageName(platform.key)}\n\nNative packages for the [Starwind UI offline kit](https://www.npmjs.com/package/${MAIN_PACKAGE_NAME}) on ${platform.key}. Install \`${MAIN_PACKAGE_NAME}\`, which adds this package on matching machines.\n`,
    );
  }

  return {
    index,
    mainDirectory,
    platformDirectories: platforms.map((platform) => ({
      platform: platform.key,
      directory: platformDirectories.get(platform.key),
    })),
  };
}
