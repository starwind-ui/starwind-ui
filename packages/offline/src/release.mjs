// Offline kit release steps. `scripts/release-packages.mjs` runs them inside the routine
// publication. `kit-channel.mjs` decides the kit version and npm tag.
import { execFile, spawn } from "node:child_process";
import { createHash } from "node:crypto";
import { existsSync } from "node:fs";
import { mkdir, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { promisify } from "node:util";

import semver from "semver";
import { buildOfflineKit, DEFAULT_OUTPUT_DIRECTORY } from "./build.mjs";
import { KIT_BETA, releaseTag, resolveKitRelease } from "./kit-channel.mjs";
import {
  createNpmPackumentFetcher,
  downloadArchive,
  loadRootRequirements,
  MAIN_PACKAGE_NAME,
  readArchiveManifest,
  splitSpec,
  withLocalPackages,
} from "./builder.mjs";
import { createSpawnCommand } from "../../../scripts/command-process.mjs";
import { platformPackageName, SUPPORTED_PLATFORMS } from "./platforms.mjs";

const execFileAsync = promisify(execFile);
const npmCommand = process.platform === "win32" ? "npm.cmd" : "npm";
const REGISTRY_ATTEMPTS = 31;
const REGISTRY_RETRY_DELAY_MS = 10_000;

/**
 * Runs npm. A publication inherits the terminal, so npm can ask for a one-time password or show
 * its web login link. Other commands return their output. On Windows, `createSpawnCommand` quotes
 * each argument for cmd.exe, so a path with spaces stays one argument.
 */
async function defaultRunNpm(args, { interactive = false } = {}) {
  const command = createSpawnCommand(npmCommand, args);
  if (!interactive) {
    const { stdout } = await execFileAsync(command.command, command.args, {
      maxBuffer: 64 * 1024 * 1024,
    });
    return stdout;
  }
  await new Promise((resolve, reject) => {
    const child = spawn(command.command, command.args, { stdio: "inherit" });
    child.on("error", reject);
    child.on("exit", (code) =>
      code === 0 ? resolve() : reject(new Error(`npm ${args[0]} failed with exit code ${code}.`)),
    );
  });
  return "";
}

async function npmHasVersion(fetchPackument, name, version) {
  try {
    const packument = await fetchPackument(name);
    return Boolean(packument.versions?.[version]);
  } catch (error) {
    if (/no package named/.test(error.message)) return false;
    throw error;
  }
}

export { releaseTag };

/**
 * Reads the package requirements of a packed starwind CLI: the specs its code installs and the
 * specs of its bundled registry. Returns undefined for a CLI without offline support.
 */
export async function readCliArchiveRequirements(archive) {
  const member = "package/dist/offline-requirements.js";
  // A damaged or unreadable archive must stop the release, so only a missing file means no support.
  const { stdout: listing } = await execFileAsync("tar", ["-tzf", archive], {
    maxBuffer: 16 * 1024 * 1024,
  });
  if (!listing.split(/\r?\n/).includes(member)) return undefined;
  const directory = await mkdtemp(path.join(os.tmpdir(), "starwind-offline-cli-"));
  try {
    const { stdout: source } = await execFileAsync("tar", ["-xzOf", archive, member], {
      maxBuffer: 16 * 1024 * 1024,
    });
    const entry = path.join(directory, "offline-requirements.mjs");
    await writeFile(entry, source);
    const requirementsModule = await import(pathToFileURL(entry).href);
    if (!requirementsModule.getOfflineRegistryRequirements?.()) return undefined;
    return await loadRootRequirements({ requirementsModule });
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
}

async function defaultDownloadCliArchive(tarballUrl) {
  const directory = await mkdtemp(path.join(os.tmpdir(), "starwind-offline-cli-"));
  const archive = path.join(directory, "starwind.tgz");
  await writeFile(archive, await downloadArchive(tarballUrl));
  return { archive, cleanup: () => rm(directory, { recursive: true, force: true }) };
}

/**
 * Checks that every Starwind package the CLI asks for exists on npm or in this release. A kit
 * built without them could not install the components.
 */
export async function checkReleaseInputs({ roots, fetchPackument }) {
  const problems = [];
  for (const spec of roots) {
    const { name, range } = splitSpec(spec);
    if (!name.startsWith("@starwind-ui/")) continue;
    let versions = [];
    try {
      versions = Object.keys((await fetchPackument(name)).versions ?? {});
    } catch (error) {
      if (!/no package named/.test(error.message)) throw error;
    }
    if (!semver.maxSatisfying(versions, range, { includePrerelease: true })) problems.push(spec);
  }
  if (problems.length > 0) {
    throw new Error(
      `The offline kit needs ${problems.join(", ")}, which neither npm nor this release has.`,
    );
  }
}

/**
 * Returns an earlier build of the same kit version and starwind version, so a resumed release
 * publishes the same files.
 */
export async function readExistingBuild(outputDirectory, kitVersion, platforms, cliVersion) {
  const mainDirectory = path.join(outputDirectory, "offline");
  let index;
  let manifest;
  try {
    index = JSON.parse(await readFile(path.join(mainDirectory, "store/index.json"), "utf8"));
    manifest = JSON.parse(await readFile(path.join(mainDirectory, "package.json"), "utf8"));
  } catch {
    return undefined;
  }
  // A test build holds local archives that npm does not serve.
  if (index.kitVersion !== kitVersion || index.testBuild) return undefined;
  if (cliVersion && manifest.dependencies?.starwind !== cliVersion) return undefined;
  const platformDirectories = platforms.map((platform) => ({
    platform: platform.key,
    directory: path.join(outputDirectory, `offline-${platform.key}`),
  }));
  if (
    !platformDirectories.every(({ directory }) =>
      existsSync(path.join(directory, "store/platform.json")),
    )
  ) {
    return undefined;
  }
  return { index, mainDirectory, platformDirectories };
}

/**
 * Checks every archive of a build against a packument source, reading the stored files
 * themselves. Before the routine publication the source includes this release's archives. After
 * it, the source is npm alone. A mismatch would give users lockfile integrity that npm cannot
 * satisfy. The error has `missingOnly` when every problem is a version that the source lacks.
 */
export async function verifyBuildAgainstNpm(build, fetchPackument) {
  const { index, mainDirectory, platformDirectories } = build;
  const platformDirectory = new Map(
    platformDirectories.map(({ platform, directory }) => [platform, directory]),
  );
  const problems = [];
  let missingOnly = true;
  for (const [name, record] of Object.entries(index.packages ?? {})) {
    for (const [version, entry] of Object.entries(record.versions)) {
      const { platforms } = entry.dist;
      if (Array.isArray(platforms) && platforms.length === 0) continue;
      const directories = platforms
        ? platforms.map((key) => platformDirectory.get(key))
        : [mainDirectory];
      let remote;
      try {
        remote = (await fetchPackument(name)).versions?.[version]?.dist;
      } catch (error) {
        if (!/no package named/.test(error.message)) throw error;
      }
      if (!remote) {
        problems.push(`${name}@${version} (not on npm)`);
        continue;
      }
      for (const directory of directories) {
        let bytes;
        try {
          bytes = await readFile(path.join(directory, "store/archives", entry.dist.file));
        } catch {
          problems.push(`${name}@${version} (missing archive)`);
          missingOnly = false;
          continue;
        }
        const sha512 = `sha512-${createHash("sha512").update(bytes).digest("base64")}`;
        const matchesNpm = remote.integrity?.startsWith("sha512-")
          ? remote.integrity === sha512
          : Boolean(remote.shasum) &&
            remote.shasum === createHash("sha1").update(bytes).digest("hex");
        // The index integrity is what package managers check, so it must describe the same bytes.
        if (!matchesNpm || entry.dist.integrity !== sha512) {
          problems.push(`${name}@${version}`);
          missingOnly = false;
        }
      }
    }
  }
  if (problems.length > 0) {
    const error = new Error(
      `The offline kit build does not match npm for ${problems.slice(0, 10).join(", ")}${problems.length > 10 ? ", and more" : ""}.`,
    );
    error.missingOnly = missingOnly;
    throw error;
  }
}

/** True when a saved build was resolved from the same CLI requirements as this release. */
export function buildMatchesRequirements(index, roots) {
  return JSON.stringify(index.requirements ?? null) === JSON.stringify([...roots].sort());
}

/** Lists the kit packages in publication order: platform packages first, the main package last. */
export function planPublication({ kitVersion, platforms, mainDirectory, platformDirectories }) {
  return [
    ...platforms.map((platform) => ({
      name: platformPackageName(platform.key),
      version: kitVersion,
      directory: platformDirectories.find((entry) => entry.platform === platform.key).directory,
    })),
    { name: MAIN_PACKAGE_NAME, version: kitVersion, directory: mainDirectory },
  ];
}

// Written before the first kit upload. A later run must publish the same build, even when npm does
// not list the uploaded packages yet.
const PUBLICATION_MARKER = "publication-started.json";

function kitPackageNames(platforms) {
  return [...platforms.map((platform) => platformPackageName(platform.key)), MAIN_PACKAGE_NAME];
}

/**
 * Builds or reuses the offline kit for the starwind version of a release, before any package is
 * published. `releaseArchives` are the packed archives that the routine publication is about to
 * upload. They take part in the build, because npm will serve those exact bytes. The kit uses the
 * requirements recorded in the starwind archive it ships, so it follows the CLI code with no
 * separate list.
 *
 * Returns `{ skip }` when the kit is already on npm, or when the CLI on npm has no offline
 * support. A failure here stops the release before the routine publication starts.
 */
export async function prepareOfflineKitRelease({
  cliVersion,
  releaseArchives = [],
  outputDirectory = DEFAULT_OUTPUT_DIRECTORY,
  platforms = SUPPORTED_PLATFORMS,
  fetchPackument = createNpmPackumentFetcher(),
  readArchiveManifestOf = readArchiveManifest,
  readRequirements = readCliArchiveRequirements,
  downloadCliArchive = defaultDownloadCliArchive,
  build = buildOfflineKit,
  beta = KIT_BETA,
  log = (message) => console.log(`[offline-kit] ${message}`),
} = {}) {
  if (!semver.valid(cliVersion)) throw new Error(`Invalid starwind version: ${cliVersion}.`);
  const { kitVersion, tag } = resolveKitRelease(cliVersion, beta);
  if (await npmHasVersion(fetchPackument, MAIN_PACKAGE_NAME, kitVersion)) {
    log(
      beta
        ? `${MAIN_PACKAGE_NAME}@${kitVersion} is already on npm. Set a new beta version in packages/offline/src/kit-channel.mjs to publish a newer kit.`
        : `${MAIN_PACKAGE_NAME}@${kitVersion} is already on npm.`,
    );
    return { skip: true, kitVersion };
  }

  const cliArchive = releaseArchives.find((file) => {
    const manifest = readArchiveManifestOf(file);
    return manifest.name === "starwind" && manifest.version === cliVersion;
  });
  let roots;
  if (cliArchive) {
    roots = await readRequirements(cliArchive);
    if (!roots) {
      throw new Error(
        `The starwind@${cliVersion} archive in this release has no offline support. Build the CLI again before you publish.`,
      );
    }
  } else {
    const tarball = (await fetchPackument("starwind").catch(() => undefined))?.versions?.[
      cliVersion
    ]?.dist?.tarball;
    if (!tarball) {
      throw new Error(
        `starwind@${cliVersion} is neither on npm nor in this release, so the offline kit has no CLI.`,
      );
    }
    const downloaded = await downloadCliArchive(tarball);
    try {
      roots = await readRequirements(downloaded.archive);
    } finally {
      await downloaded.cleanup();
    }
    if (!roots) {
      log(`starwind@${cliVersion} on npm has no offline support, so no offline kit is published.`);
      return { skip: true, kitVersion };
    }
  }

  const source =
    releaseArchives.length > 0
      ? (await withLocalPackages(fetchPackument, releaseArchives, { merge: true })).fetchPackument
      : fetchPackument;
  await checkReleaseInputs({ roots, fetchPackument: source });

  // A resumed release must publish the files of the first attempt. A rebuild could resolve newer
  // native packages that the already published platform packages do not contain.
  const partlyPublished = [];
  for (const name of kitPackageNames(platforms)) {
    if (await npmHasVersion(fetchPackument, name, kitVersion)) partlyPublished.push(name);
  }
  const publicationStarted = existsSync(path.join(outputDirectory, PUBLICATION_MARKER));
  const keepBuild = partlyPublished.length > 0 || publicationStarted;
  let result = await readExistingBuild(outputDirectory, kitVersion, platforms, cliVersion);
  // A saved build from other CLI requirements could miss a package the published CLI installs.
  if (result && !buildMatchesRequirements(result.index, roots)) {
    if (keepBuild) {
      throw new Error(
        `The saved offline kit build in ${outputDirectory} has other CLI requirements than the kit packages that npm already has.`,
      );
    }
    result = undefined;
  }
  if (result) {
    try {
      await verifyBuildAgainstNpm(result, source);
      log(`Reusing the build of ${MAIN_PACKAGE_NAME}@${kitVersion} in ${outputDirectory}`);
    } catch (error) {
      if (keepBuild) throw error;
      log(`${error.message} Building it again.`);
      result = undefined;
    }
  }
  if (!result) {
    if (keepBuild) {
      throw new Error(
        `${partlyPublished.join(", ")} at ${kitVersion} are already on npm, but the build that published them is missing from ${outputDirectory}. A new build could differ from the published packages.`,
      );
    }
    result = await build({
      outputDirectory,
      platforms,
      cliVersion,
      kitVersion,
      roots,
      fetchPackument: source,
      log,
    });
  }
  return {
    skip: false,
    kitVersion,
    cliVersion,
    outputDirectory,
    tag,
    plan: planPublication({ kitVersion, platforms, ...result }),
    build: result,
  };
}

/** Packs a kit package into the build once and returns the saved tarball. */
async function packOnce(entry, packDirectory, runNpm) {
  const tarball = path.join(
    packDirectory,
    `${entry.name.replace(/^@/, "").replace("/", "-")}-${entry.version}.tgz`,
  );
  if (existsSync(tarball)) return tarball;
  const [packed] = JSON.parse(
    await runNpm(["pack", entry.directory, "--pack-destination", packDirectory, "--json"]),
  );
  if (path.join(packDirectory, packed?.filename ?? "") !== tarball) {
    throw new Error(`npm pack wrote ${packed?.filename} for ${entry.name}@${entry.version}.`);
  }
  return tarball;
}

/**
 * Publishes a prepared kit: platform packages first, the main package last. A real publication
 * runs after the routine packages are on npm, and it first checks every stored archive against
 * npm alone. A package that is already on npm with the same files is skipped, so the release
 * command can run again after a failure.
 */
export async function publishOfflineKitRelease(
  prepared,
  {
    dryRun = true,
    otp,
    createFetcher = () => createNpmPackumentFetcher(),
    runNpm = defaultRunNpm,
    attempts = REGISTRY_ATTEMPTS,
    retryDelayMs = REGISTRY_RETRY_DELAY_MS,
    wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms)),
    log = (message) => console.log(`[offline-kit] ${message}`),
  } = {},
) {
  if (prepared.skip) return { published: [] };
  if (otp !== undefined && !/^\d{6,8}$/.test(otp)) {
    throw new Error("Expected --otp to be a numeric one-time password.");
  }
  let fetchPackument = createFetcher();
  if (!dryRun) {
    // npm can take a short time to list a version it just accepted.
    for (let attempt = 1; ; attempt += 1) {
      try {
        await verifyBuildAgainstNpm(prepared.build, fetchPackument);
        break;
      } catch (error) {
        if (!error.missingOnly || attempt >= attempts) throw error;
        log(`Waiting for npm to list the new versions (${attempt}/${attempts - 1})`);
        await wait(retryDelayMs);
        fetchPackument = createFetcher();
      }
    }
  }

  // Each package is packed once into the build, so a later run compares and uploads the same
  // bytes, even with another npm or Node version.
  const packDirectory = path.join(prepared.outputDirectory, "packs");
  await mkdir(packDirectory, { recursive: true });
  if (!dryRun) {
    await writeFile(
      path.join(prepared.outputDirectory, PUBLICATION_MARKER),
      `${JSON.stringify({ kitVersion: prepared.kitVersion }, null, 2)}\n`,
    );
  }
  const published = [];
  for (const entry of prepared.plan) {
    const tarball = await packOnce(entry, packDirectory, runNpm);
    if (await npmHasVersion(fetchPackument, entry.name, entry.version)) {
      const local = `sha512-${createHash("sha512")
        .update(await readFile(tarball))
        .digest("base64")}`;
      const remote = (await fetchPackument(entry.name)).versions[entry.version]?.dist?.integrity;
      if (local !== remote) {
        throw new Error(`${entry.name}@${entry.version} on npm does not match ${tarball}.`);
      }
      log(`Skipping ${entry.name}@${entry.version}, which is already on npm with the same files`);
      continue;
    }
    const args = ["publish", tarball, "--access", "public", "--tag", prepared.tag];
    if (dryRun) args.push("--dry-run");
    if (otp) args.push("--otp", otp);
    log(`${dryRun ? "Checking" : "Publishing"} ${entry.name}@${entry.version} on ${prepared.tag}`);
    await runNpm(args, { interactive: !dryRun });
    published.push(`${entry.name}@${entry.version}`);
  }
  log(
    dryRun
      ? `Dry run passed for ${published.length} offline kit packages.`
      : `Published ${published.length} offline kit packages.`,
  );
  return { published };
}
