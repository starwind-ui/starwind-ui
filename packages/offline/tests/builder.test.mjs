import { createHash } from "node:crypto";
import { mkdtemp, readdir, readFile, rm } from "node:fs/promises";
import os from "node:os";
import path from "node:path";

import { afterEach, describe, expect, it } from "vitest";

import {
  addMetadataOnlyNodes,
  archiveFileName,
  createIndex,
  loadRootRequirements,
  normalizeDependency,
  pickManifestFields,
  resolveClosure,
  selectVersion,
  verifyArchive,
  writeKit,
} from "../src/builder.mjs";
import {
  currentPlatform,
  isNativeManifest,
  manifestMatchesPlatform,
  platformsForManifest,
  SUPPORTED_PLATFORMS,
} from "../src/platforms.mjs";

const NOW = Date.parse("2026-11-05T00:00:00.000Z");
const OLD = "2026-10-01T00:00:00.000Z";
const RECENT = "2026-11-04T12:00:00.000Z";

const temporaryDirectories = [];
afterEach(async () => {
  for (const directory of temporaryDirectories.splice(0)) {
    await rm(directory, { recursive: true, force: true });
  }
});

function archiveBytes(name, version) {
  return Buffer.from(`archive ${name}@${version}`);
}

function integrity(bytes) {
  return `sha512-${createHash("sha512").update(bytes).digest("base64")}`;
}

/** Fake npm registry: { name: { version: { time, ...manifest } } } */
function fakeRegistry(packages) {
  const fetchPackument = async (name) => {
    const versions = packages[name];
    if (!versions) throw new Error(`npm has no package named ${name}.`);
    const documents = {};
    const time = {};
    for (const [version, { time: published = OLD, ...manifest }] of Object.entries(versions)) {
      const bytes = archiveBytes(name, version);
      documents[version] = {
        name,
        version,
        ...manifest,
        dist: {
          tarball: `https://registry.example/${name}/-/${version}.tgz`,
          integrity: integrity(bytes),
        },
      };
      time[version] = published;
    }
    const latest = Object.keys(documents).at(-1);
    return { name, "dist-tags": { latest }, time, versions: documents };
  };
  const download = async (url) => {
    const match = /^https:\/\/registry\.example\/(.+)\/-\/(.+)\.tgz$/.exec(url);
    return archiveBytes(match[1], match[2]);
  };
  return { fetchPackument, download };
}

describe("platform placement", () => {
  it("matches npm os, cpu, and libc rules", () => {
    const linuxGnu = SUPPORTED_PLATFORMS.find(({ key }) => key === "linux-x64-gnu");
    const darwin = SUPPORTED_PLATFORMS.find(({ key }) => key === "darwin-arm64");
    expect(
      manifestMatchesPlatform({ os: ["linux"], cpu: ["x64"], libc: ["glibc"] }, linuxGnu),
    ).toBe(true);
    expect(manifestMatchesPlatform({ os: ["linux"], cpu: ["x64"], libc: ["musl"] }, linuxGnu)).toBe(
      false,
    );
    expect(manifestMatchesPlatform({ os: ["!win32"] }, darwin)).toBe(true);
    expect(manifestMatchesPlatform({ os: ["darwin"], libc: ["glibc"] }, darwin)).toBe(true);
    expect(isNativeManifest({ os: [] })).toBe(false);
    expect(platformsForManifest({ os: ["darwin"] })).toEqual(["darwin-arm64", "darwin-x64"]);
    expect(platformsForManifest({ os: ["freebsd"], cpu: ["x64"] })).toEqual([]);
    expect(currentPlatform("linux", "arm64", false)?.key).toBe("linux-arm64-musl");
    expect(currentPlatform("sunos", "x64", false)).toBeUndefined();
  });
});

describe("version selection", () => {
  const packument = {
    name: "pkg",
    "dist-tags": { latest: "2.1.0" },
    time: { "1.0.0": OLD, "2.0.0": OLD, "2.1.0": RECENT, "3.0.0-beta.1": OLD },
    versions: { "1.0.0": {}, "2.0.0": {}, "2.1.0": {}, "3.0.0-beta.1": {} },
  };
  const options = { now: NOW, minimumAgeMs: 2 * 24 * 3600 * 1000, ageExempt: () => false };

  it("skips versions younger than the minimum release age", () => {
    expect(selectVersion(packument, "^2", options)).toBe("2.0.0");
    expect(selectVersion(packument, "latest", options)).toBe("2.0.0");
    expect(selectVersion(packument, "^2", { ...options, ageExempt: () => true })).toBe("2.1.0");
    expect(selectVersion(packument, "^4", options)).toBeUndefined();
  });

  it("resolves aliases and rejects non-registry dependencies", () => {
    expect(normalizeDependency("string-width-cjs", "npm:string-width@^4.2.0")).toEqual({
      name: "string-width",
      range: "^4.2.0",
    });
    expect(normalizeDependency("pkg", "")).toEqual({ name: "pkg", range: "latest" });
    for (const range of ["file:../pkg", "github:user/repo", "git+https://x/y.git", "user/repo"]) {
      expect(() => normalizeDependency("pkg", range)).toThrow(/not an npm registry dependency/);
    }
  });
});

describe("dependency closure", () => {
  const registry = fakeRegistry({
    root: {
      "1.0.0": {
        dependencies: { dep: "^1" },
        optionalDependencies: { "native-mac": "1.0.0", "native-bsd": "1.0.0" },
        peerDependencies: { vite: "^8", peer: "^1", optionalPeer: "^1" },
        peerDependenciesMeta: { optionalPeer: { optional: true } },
      },
    },
    dep: { "1.0.0": {}, "1.1.0": { time: RECENT } },
    "native-mac": { "1.0.0": { os: ["darwin"], cpu: ["arm64"] } },
    "native-bsd": { "1.0.0": { os: ["freebsd"], cpu: ["x64"] } },
    peer: { "1.0.0": { dependencies: { aliased: "npm:dep@^1" } } },
    optionalPeer: { "1.0.0": {} },
    vite: { "8.0.0": {} },
  });

  it("follows dependencies, optional dependencies, and non-host peers", async () => {
    const nodes = await resolveClosure({
      roots: ["root@^1"],
      fetchPackument: registry.fetchPackument,
      now: NOW,
    });
    expect([...nodes.keys()].sort()).toEqual([
      "dep@1.0.0",
      "native-bsd@1.0.0",
      "native-mac@1.0.0",
      "peer@1.0.0",
      "root@1.0.0",
    ]);
  });

  it("names the package that needs a missing version", async () => {
    await expect(
      resolveClosure({ roots: ["dep@^2"], fetchPackument: registry.fetchPackument, now: NOW }),
    ).rejects.toThrow(/No version of dep matches \^2 .*needed by CLI requirements/);
  });

  it("writes verified archives into the main and platform packages", async () => {
    const nodes = await resolveClosure({
      roots: ["root@^1"],
      fetchPackument: registry.fetchPackument,
      now: NOW,
    });
    const output = await mkdtemp(path.join(os.tmpdir(), "offline-kit-test-"));
    temporaryDirectories.push(output);
    const platforms = SUPPORTED_PLATFORMS.filter(({ key }) =>
      ["darwin-arm64", "linux-x64-gnu"].includes(key),
    );

    const result = await writeKit({
      nodes,
      outputDirectory: output,
      kitVersion: "3.6.0",
      cliVersion: "3.6.0",
      platforms,
      createdAt: "2026-11-05T00:00:00.000Z",
      download: registry.download,
    });

    expect((await readdir(path.join(output, "offline/store/archives"))).sort()).toEqual([
      "dep-1.0.0.tgz",
      "peer-1.0.0.tgz",
      "root-1.0.0.tgz",
    ]);
    expect(await readdir(path.join(output, "offline-darwin-arm64/store/archives"))).toEqual([
      "native-mac-1.0.0.tgz",
    ]);
    expect(await readdir(path.join(output, "offline-linux-x64-gnu/store/archives"))).toEqual([]);

    const index = JSON.parse(await readFile(path.join(output, "offline/store/index.json"), "utf8"));
    expect(index.platforms).toEqual(["darwin-arm64", "linux-x64-gnu"]);
    expect(index.packages["native-bsd"].versions["1.0.0"].dist.platforms).toEqual([]);
    expect(index.packages["native-mac"].versions["1.0.0"].dist.platforms).toEqual(["darwin-arm64"]);
    expect(index.packages.dep.versions["1.0.0"].dist.integrity).toBe(
      integrity(archiveBytes("dep", "1.0.0")),
    );
    expect(result.index).toEqual(index);

    const main = JSON.parse(await readFile(path.join(output, "offline/package.json"), "utf8"));
    expect(main).toMatchObject({
      name: "@starwind-ui/offline",
      version: "3.6.0",
      bin: { "starwind-offline": "bin/starwind-offline.mjs" },
      dependencies: { starwind: "3.6.0" },
      optionalDependencies: {
        "@starwind-ui/offline-darwin-arm64": "3.6.0",
        "@starwind-ui/offline-linux-x64-gnu": "3.6.0",
      },
    });
    const linux = JSON.parse(
      await readFile(path.join(output, "offline-linux-x64-gnu/package.json"), "utf8"),
    );
    expect(linux).toMatchObject({ os: ["linux"], cpu: ["x64"], libc: ["glibc"] });
    const bin = await readFile(path.join(output, "offline/bin/starwind-offline.mjs"), "utf8");
    expect(bin).toContain(
      '["@starwind-ui/offline-darwin-arm64","@starwind-ui/offline-linux-x64-gnu"]',
    );
    expect(bin.startsWith("#!/usr/bin/env node")).toBe(true);
  });

  it("serves pnpm metadata without archives and marks test builds", async () => {
    const nodes = await resolveClosure({
      roots: ["dep@^1"],
      fetchPackument: registry.fetchPackument,
      now: NOW,
    });
    await addMetadataOnlyNodes(nodes, async () => ({
      name: "pnpm",
      time: { "8.15.0": OLD, "11.8.0": OLD },
      versions: {
        "8.15.0": { name: "pnpm", version: "8.15.0", dist: { integrity: "sha512-8" } },
        "11.8.0": { name: "pnpm", version: "11.8.0", dist: { integrity: "sha512-11" } },
      },
    }));
    const output = await mkdtemp(path.join(os.tmpdir(), "offline-kit-test-"));
    temporaryDirectories.push(output);
    const download = async (url) => {
      if (url === undefined) throw new Error("metadata-only packages must not download");
      return registry.download(url);
    };
    const result = await writeKit({
      nodes,
      outputDirectory: output,
      kitVersion: "3.6.0",
      cliVersion: "3.6.0",
      platforms: [],
      download,
      testBuild: true,
    });
    expect(Object.keys(result.index.packages.pnpm.versions)).toEqual(["11.8.0"]);
    expect(result.index.packages.pnpm.versions["11.8.0"].dist).toMatchObject({
      integrity: "sha512-11",
      platforms: [],
    });
    expect(result.index.testBuild).toBe(true);
    expect(await readdir(path.join(output, "offline/store/archives"))).toEqual(["dep-1.0.0.tgz"]);
  });

  it("stops when a required launcher dependency is missing and skips a missing optional one", async () => {
    const launcher = (dependencies) => async (name) => {
      if (name !== "@pnpm/exe") throw new Error(`npm has no package named ${name}.`);
      return {
        name,
        time: { "11.16.0": OLD },
        versions: { "11.16.0": { name, version: "11.16.0", ...dependencies } },
      };
    };
    const roots = [{ name: "@pnpm/exe", range: ">=9.0.0-0", follow: true }];
    await expect(
      addMetadataOnlyNodes(
        new Map(),
        launcher({ optionalDependencies: { "@pnpm/macos-x64": "11.16.0" } }),
        roots,
      ),
    ).resolves.toBeInstanceOf(Map);
    await expect(
      addMetadataOnlyNodes(
        new Map(),
        launcher({ dependencies: { "@reflink/reflink": "0.1.19" } }),
        roots,
      ),
    ).rejects.toThrow(/no package named @reflink\/reflink/);
  });

  it("refuses an archive that does not match its npm integrity", () => {
    const bytes = archiveBytes("dep", "1.0.0");
    expect(() =>
      verifyArchive("dep", "1.0.0", bytes, { integrity: integrity(Buffer.from("other")) }),
    ).toThrow(/does not match its npm integrity/);
    expect(() => verifyArchive("dep", "1.0.0", bytes, {})).toThrow(/no npm integrity/);
    expect(() =>
      verifyArchive("dep", "1.0.0", bytes, {
        shasum: createHash("sha1").update(bytes).digest("hex"),
      }),
    ).not.toThrow();
  });
});

describe("index format", () => {
  it("keeps install metadata and drops scripts that do not run on install", () => {
    expect(
      pickManifestFields({
        name: "a",
        version: "1.0.0",
        readme: "long",
        scripts: { test: "vitest", postinstall: "node setup.js" },
        bin: { a: "a.js" },
      }),
    ).toEqual({
      name: "a",
      version: "1.0.0",
      bin: { a: "a.js" },
      scripts: { postinstall: "node setup.js" },
    });
    expect(archiveFileName("@scope/pkg", "1.0.0")).toBe("@scope__pkg-1.0.0.tgz");
  });

  it("tags the highest stable version as latest", () => {
    const nodes = new Map(
      ["1.0.0", "1.2.0", "2.0.0-beta.1"].map((version) => [
        `a@${version}`,
        {
          name: "a",
          version,
          manifest: { name: "a", version },
          time: OLD,
          integrity: "sha512-x",
          shasum: "x",
        },
      ]),
    );
    const index = createIndex({ nodes, kitVersion: "3.6.0", createdAt: OLD, platforms: [] });
    expect(index.packages.a.distTags).toEqual({ latest: "1.2.0" });
    expect(index.packages.a.time.created).toBe(OLD);
  });
});

describe("CLI requirements", () => {
  it("collects registry and code requirements and leaves out host frameworks", async () => {
    // CI runs these tests without a CLI build, so read the CLI source module directly.
    const requirementsModule = await import("../../cli/src/offline-requirements.ts");
    const roots = await loadRootRequirements({ requirementsModule });
    expect(roots).toEqual(
      expect.arrayContaining([
        "tailwindcss@^4",
        "@astrojs/react@^6.0.2",
        "@tailwindcss/postcss@^4",
      ]),
    );
    expect(roots.some((spec) => spec.startsWith("@starwind-ui/astro@"))).toBe(true);
    expect(roots.some((spec) => spec.startsWith("astro@"))).toBe(false);
  });

  it("stores the lowest version of each Starwind range, which init installs", async () => {
    const roots = await loadRootRequirements({
      requirementsModule: {
        getOfflineCodeRequirements: () => ["react@^19.2.0"],
        getOfflineRegistryRequirements: () => ["@starwind-ui/astro@^1.4.0", "tailwindcss@^4"],
      },
    });
    expect(roots).toEqual([
      "@starwind-ui/astro@1.4.0",
      "@starwind-ui/astro@^1.4.0",
      "react@^19.2.0",
      "tailwindcss@^4",
    ]);
  });
});
