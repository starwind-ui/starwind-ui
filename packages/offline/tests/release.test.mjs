import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import { existsSync } from "node:fs";
import { mkdir, mkdtemp, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";

import { afterEach, describe, expect, it, vi } from "vitest";

import { resolveKitRelease } from "../src/kit-channel.mjs";
import { SUPPORTED_PLATFORMS } from "../src/platforms.mjs";
import {
  checkReleaseInputs,
  planPublication,
  prepareOfflineKitRelease,
  publishOfflineKitRelease,
  readCliArchiveRequirements,
  readExistingBuild,
  releaseTag,
  verifyBuildAgainstNpm,
} from "../src/release.mjs";

const temporaryDirectories = [];
afterEach(async () => {
  for (const directory of temporaryDirectories.splice(0)) {
    await rm(directory, { recursive: true, force: true });
  }
});

async function temporaryDirectory() {
  const directory = await mkdtemp(path.join(os.tmpdir(), "offline-release-test-"));
  temporaryDirectories.push(directory);
  return directory;
}

/** Fake npm registry: { name: [versions] } or { name: { version: integrity } }. */
function registry(published) {
  return async (name) => {
    const entry = published[name];
    if (!entry) throw new Error(`npm has no package named ${name}.`);
    const pairs = Array.isArray(entry)
      ? entry.map((version) => [version, undefined])
      : Object.entries(entry);
    const versions = Object.fromEntries(
      pairs.map(([version, integrity]) => [
        version,
        { dist: { integrity, tarball: `https://registry.example/${name}-${version}.tgz` } },
      ]),
    );
    return { name, versions };
  };
}

/** Writes a packed npm archive with a package.json and optional extra files. */
async function packedArchive(name, version, files = {}) {
  const directory = await temporaryDirectory();
  await mkdir(path.join(directory, "package"));
  await writeFile(path.join(directory, "package/package.json"), JSON.stringify({ name, version }));
  for (const [file, content] of Object.entries(files)) {
    await mkdir(path.dirname(path.join(directory, "package", file)), { recursive: true });
    await writeFile(path.join(directory, "package", file), content);
  }
  const file = path.join(directory, `${name.replace("/", "__")}-${version}.tgz`);
  execFileSync("tar", ["-czf", file, "-C", directory, "package"]);
  return file;
}

const platforms = SUPPORTED_PLATFORMS.filter(
  ({ key }) => key === "darwin-arm64" || key === "win32-x64",
);

const ROOTS = ["@starwind-ui/runtime@^1.5.0", "tailwindcss@^4"];
const NPM = {
  starwind: ["3.5.0"],
  "@starwind-ui/runtime": ["1.4.0"],
};

async function outputDirectory() {
  return path.join(await temporaryDirectory(), "kit");
}

/** Returns a build function that writes kit directories the way `writeKit` lays them out. */
function fakeBuild(kitVersion = "3.6.0", extra = {}, cliVersion = kitVersion) {
  return vi.fn(async ({ outputDirectory: output }) => {
    await mkdir(path.join(output, "offline/store"), { recursive: true });
    await writeFile(
      path.join(output, "offline/store/index.json"),
      JSON.stringify({ kitVersion, packages: {}, requirements: [...ROOTS].sort(), ...extra }),
    );
    await writeFile(
      path.join(output, "offline/package.json"),
      JSON.stringify({ version: kitVersion, dependencies: { starwind: cliVersion } }),
    );
    const platformDirectories = [];
    for (const { key } of platforms) {
      const directory = path.join(output, `offline-${key}`);
      await mkdir(path.join(directory, "store"), { recursive: true });
      await writeFile(
        path.join(directory, "store/platform.json"),
        JSON.stringify({ platform: key }),
      );
      platformDirectories.push({ platform: key, directory });
    }
    return { mainDirectory: path.join(output, "offline"), platformDirectories };
  });
}

/** Prepare inputs for a release of starwind 3.6.0 with Runtime 1.5.0, after the kit beta. */
async function releaseInputs(overrides = {}) {
  return {
    beta: null,
    cliVersion: "3.6.0",
    releaseArchives: [
      await packedArchive("starwind", "3.6.0"),
      await packedArchive("@starwind-ui/runtime", "1.5.0"),
    ],
    outputDirectory: await outputDirectory(),
    platforms,
    fetchPackument: registry(NPM),
    readRequirements: vi.fn(async () => ROOTS),
    downloadCliArchive: vi.fn(),
    build: fakeBuild(),
    log: () => {},
    ...overrides,
  };
}

describe("offline kit release inputs", () => {
  it("refuses Starwind requirements that neither npm nor the release has", async () => {
    await expect(
      checkReleaseInputs({
        roots: ["@starwind-ui/astro@^1.5.0", "@starwind-ui/vue@0.4.0", "tailwindcss@^4"],
        fetchPackument: registry({ "@starwind-ui/astro": ["1.4.0"] }),
      }),
    ).rejects.toThrow(
      "The offline kit needs @starwind-ui/astro@^1.5.0, @starwind-ui/vue@0.4.0, which neither npm nor this release has.",
    );
  });

  it("accepts a prerelease that the release publishes", async () => {
    await expect(
      checkReleaseInputs({
        roots: ["@starwind-ui/runtime@^1.5.0-beta.1"],
        fetchPackument: registry({ "@starwind-ui/runtime": ["1.5.0-beta.1"] }),
      }),
    ).resolves.toBeUndefined();
  });

  it("keeps latest for stable kits only", () => {
    expect(releaseTag("3.6.0")).toBe("latest");
    expect(releaseTag("3.7.0-beta.1")).toBe("beta");
    expect(releaseTag("3.7.0-0")).toBe("next");
  });
});

describe("CLI archive requirements", () => {
  it("reads code and registry requirements and leaves out host frameworks", async () => {
    const archive = await packedArchive("starwind", "3.6.0", {
      "dist/offline-requirements.js": [
        'export const getOfflineCodeRequirements = () => ["react@^19.2.0"];',
        'export const getOfflineRegistryRequirements = () => ["tailwindcss@^4", "astro@>=5"];',
      ].join("\n"),
    });
    expect(await readCliArchiveRequirements(archive)).toEqual(["react@^19.2.0", "tailwindcss@^4"]);
  });

  it("reports no offline support for a CLI without the requirements file", async () => {
    expect(await readCliArchiveRequirements(await packedArchive("starwind", "3.5.0"))).toBe(
      undefined,
    );
  });

  it("stops on an archive that cannot be read", async () => {
    const directory = await temporaryDirectory();
    const damaged = path.join(directory, "starwind.tgz");
    await writeFile(damaged, "not a gzip archive");
    await expect(readCliArchiveRequirements(damaged)).rejects.toThrow();
    await expect(readCliArchiveRequirements(path.join(directory, "missing.tgz"))).rejects.toThrow();
  });
});

describe("offline kit preparation", () => {
  it("builds from the requirements in the release's starwind archive", async () => {
    const inputs = await releaseInputs();
    const prepared = await prepareOfflineKitRelease(inputs);

    expect(inputs.readRequirements).toHaveBeenCalledWith(inputs.releaseArchives[0]);
    expect(inputs.downloadCliArchive).not.toHaveBeenCalled();
    const [{ roots, cliVersion, fetchPackument }] = inputs.build.mock.calls[0];
    expect({ roots, cliVersion }).toEqual({ roots: ROOTS, cliVersion: "3.6.0" });
    // The build sees the versions npm has and the versions this release is about to publish.
    const runtime = await fetchPackument("@starwind-ui/runtime");
    expect(Object.keys(runtime.versions).sort()).toEqual(["1.4.0", "1.5.0"]);
    expect(runtime.versions["1.5.0"].dist.localFile).toBe(inputs.releaseArchives[1]);
    expect(prepared).toMatchObject({ skip: false, kitVersion: "3.6.0", tag: "latest" });
    expect(prepared.plan.map(({ name }) => name)).toEqual([
      "@starwind-ui/offline-darwin-arm64",
      "@starwind-ui/offline-win32-x64",
      "@starwind-ui/offline",
    ]);
  });

  it("skips a kit version that is already on npm", async () => {
    const inputs = await releaseInputs({
      fetchPackument: registry({ ...NPM, "@starwind-ui/offline": ["3.6.0"] }),
    });
    await expect(prepareOfflineKitRelease(inputs)).resolves.toMatchObject({ skip: true });
    expect(inputs.build).not.toHaveBeenCalled();
  });

  it("stops the release when its starwind archive has no offline support", async () => {
    const inputs = await releaseInputs({ readRequirements: async () => undefined });
    await expect(prepareOfflineKitRelease(inputs)).rejects.toThrow(
      "The starwind@3.6.0 archive in this release has no offline support.",
    );
  });

  it("reads the published CLI when the release does not include starwind", async () => {
    const cleanup = vi.fn();
    const inputs = await releaseInputs({
      cliVersion: "3.5.0",
      releaseArchives: [await packedArchive("@starwind-ui/runtime", "1.5.0")],
      downloadCliArchive: vi.fn(async () => ({ archive: "/tmp/starwind.tgz", cleanup })),
      build: fakeBuild("3.5.0"),
    });
    await prepareOfflineKitRelease(inputs);
    expect(inputs.downloadCliArchive).toHaveBeenCalledWith(
      "https://registry.example/starwind-3.5.0.tgz",
    );
    expect(inputs.readRequirements).toHaveBeenCalledWith("/tmp/starwind.tgz");
    expect(cleanup).toHaveBeenCalled();
    expect(inputs.build).toHaveBeenCalledTimes(1);
  });

  it("skips the kit for a published CLI without offline support", async () => {
    const inputs = await releaseInputs({
      cliVersion: "3.5.0",
      releaseArchives: [],
      downloadCliArchive: async () => ({ archive: "/tmp/starwind.tgz", cleanup: async () => {} }),
      readRequirements: async () => undefined,
    });
    await expect(prepareOfflineKitRelease(inputs)).resolves.toMatchObject({ skip: true });
    expect(inputs.build).not.toHaveBeenCalled();
  });

  it("stops when the CLI is neither on npm nor in the release", async () => {
    const inputs = await releaseInputs({ releaseArchives: [] });
    await expect(prepareOfflineKitRelease(inputs)).rejects.toThrow(
      "starwind@3.6.0 is neither on npm nor in this release",
    );
  });

  it("reuses a saved build of the same requirements", async () => {
    const inputs = await releaseInputs();
    await fakeBuild()({ outputDirectory: inputs.outputDirectory });
    await prepareOfflineKitRelease(inputs);
    expect(inputs.build).not.toHaveBeenCalled();
  });

  it("rebuilds when the saved build came from other CLI requirements", async () => {
    const inputs = await releaseInputs();
    await fakeBuild("3.6.0", { requirements: ["tailwindcss@^4"] })({
      outputDirectory: inputs.outputDirectory,
    });
    await prepareOfflineKitRelease(inputs);
    expect(inputs.build).toHaveBeenCalledTimes(1);
  });

  it("never reuses a test build made from local archives", async () => {
    const output = await outputDirectory();
    await fakeBuild("3.6.0", { testBuild: true })({ outputDirectory: output });
    expect(await readExistingBuild(output, "3.6.0", platforms)).toBeUndefined();
  });

  it("ignores a saved build of another kit version", async () => {
    const output = await outputDirectory();
    await fakeBuild("3.4.0")({ outputDirectory: output });
    expect(await readExistingBuild(output, "3.6.0", platforms)).toBeUndefined();
    expect(await readExistingBuild(output, "3.4.0", platforms)).toMatchObject({
      mainDirectory: `${output}/offline`,
    });
  });

  it("publishes the beta kit at its own version on the beta tag", async () => {
    const inputs = await releaseInputs({
      beta: { version: "0.1.0", tag: "beta" },
      build: fakeBuild("0.1.0", {}, "3.6.0"),
    });
    const prepared = await prepareOfflineKitRelease(inputs);
    expect(inputs.build.mock.calls[0][0]).toMatchObject({
      kitVersion: "0.1.0",
      cliVersion: "3.6.0",
    });
    expect(prepared).toMatchObject({ kitVersion: "0.1.0", cliVersion: "3.6.0", tag: "beta" });
    expect(prepared.plan.map(({ version }) => version)).toEqual(["0.1.0", "0.1.0", "0.1.0"]);
  });

  it("keeps the published beta kit when a later starwind version releases", async () => {
    const log = vi.fn();
    const inputs = await releaseInputs({
      cliVersion: "3.6.1",
      beta: { version: "0.1.0", tag: "beta" },
      fetchPackument: registry({ ...NPM, "@starwind-ui/offline": ["0.1.0"] }),
      log,
    });
    await expect(prepareOfflineKitRelease(inputs)).resolves.toMatchObject({
      skip: true,
      kitVersion: "0.1.0",
    });
    expect(log).toHaveBeenCalledWith(expect.stringMatching(/Set a new beta version/));
    expect(inputs.build).not.toHaveBeenCalled();
  });

  it("rebuilds a saved beta kit that holds another starwind version", async () => {
    const inputs = await releaseInputs({
      beta: { version: "0.1.0", tag: "beta" },
      build: fakeBuild("0.1.0", {}, "3.6.0"),
    });
    await fakeBuild("0.1.0", {}, "3.5.0")({ outputDirectory: inputs.outputDirectory });
    await prepareOfflineKitRelease(inputs);
    expect(inputs.build).toHaveBeenCalledTimes(1);
  });

  it("uses the beta channel by default", async () => {
    expect(resolveKitRelease("3.6.0")).toEqual({ kitVersion: "0.1.0", tag: "beta" });
    expect(resolveKitRelease("3.6.0", null)).toEqual({ kitVersion: "3.6.0", tag: "latest" });
    expect(resolveKitRelease("3.7.0-beta.1", null)).toEqual({
      kitVersion: "3.7.0-beta.1",
      tag: "beta",
    });
  });

  it("refuses to rebuild after a partial publication", async () => {
    const inputs = await releaseInputs({
      fetchPackument: registry({ ...NPM, "@starwind-ui/offline-darwin-arm64": ["3.6.0"] }),
    });
    await expect(prepareOfflineKitRelease(inputs)).rejects.toThrow(
      /build that published them is missing/,
    );
    expect(inputs.build).not.toHaveBeenCalled();
  });

  it("never rebuilds after a kit upload started, even before npm lists it", async () => {
    const inputs = await releaseInputs();
    await mkdir(inputs.outputDirectory, { recursive: true });
    await writeFile(path.join(inputs.outputDirectory, "publication-started.json"), "{}");
    await expect(prepareOfflineKitRelease(inputs)).rejects.toThrow(
      /build that published them is missing/,
    );
    await fakeBuild("3.6.0", { requirements: ["tailwindcss@^4"] })({
      outputDirectory: inputs.outputDirectory,
    });
    await writeFile(path.join(inputs.outputDirectory, "publication-started.json"), "{}");
    await expect(prepareOfflineKitRelease(inputs)).rejects.toThrow(/other CLI requirements/);
    expect(inputs.build).not.toHaveBeenCalled();
  });
});

/** A prepared kit in a temporary build directory. */
async function preparedKit(kitVersion = "3.6.0") {
  const output = await outputDirectory();
  const platformDirectories = platforms.map(({ key }) => ({
    platform: key,
    directory: `${output}/offline-${key}`,
  }));
  return {
    skip: false,
    kitVersion,
    outputDirectory: output,
    tag: releaseTag(kitVersion),
    build: { index: { packages: {} }, mainDirectory: `${output}/offline`, platformDirectories },
    plan: planPublication({
      kitVersion,
      platforms,
      mainDirectory: `${output}/offline`,
      platformDirectories,
    }),
  };
}

function tarballName(directory, version = "3.6.0") {
  return `starwind-ui-${path.basename(directory)}-${version}.tgz`;
}

function sha512(text) {
  return `sha512-${createHash("sha512").update(text).digest("base64")}`;
}

/** Fake npm: `pack` writes a tarball whose content is its file name. */
function fakeNpm() {
  return vi.fn(async (args) => {
    if (args[0] !== "pack") return "";
    const filename = tarballName(args[1]);
    await writeFile(path.join(args[args.indexOf("--pack-destination") + 1], filename), filename);
    return JSON.stringify([{ filename }]);
  });
}

describe("offline kit publication", () => {
  it("checks every saved tarball with a dry run in publication order", async () => {
    const prepared = await preparedKit();
    const runNpm = fakeNpm();
    const result = await publishOfflineKitRelease(prepared, {
      dryRun: true,
      createFetcher: () => registry(NPM),
      runNpm,
      log: () => {},
    });
    const publishCalls = runNpm.mock.calls.filter(([args]) => args[0] === "publish");
    expect(publishCalls).toEqual(
      prepared.plan.map(({ directory }) => [
        [
          "publish",
          path.join(prepared.outputDirectory, "packs", tarballName(directory)),
          "--access",
          "public",
          "--tag",
          "latest",
          "--dry-run",
        ],
        { interactive: false },
      ]),
    );
    expect(result.published).toHaveLength(3);
    expect(existsSync(path.join(prepared.outputDirectory, "publication-started.json"))).toBe(false);
  });

  it("publishes in the terminal, so npm can ask for a one-time password", async () => {
    const prepared = await preparedKit();
    const darwin = tarballName("offline-darwin-arm64");
    const runNpm = fakeNpm();
    await publishOfflineKitRelease(prepared, {
      dryRun: false,
      otp: "123456",
      createFetcher: () =>
        registry({ ...NPM, "@starwind-ui/offline-darwin-arm64": { "3.6.0": sha512(darwin) } }),
      runNpm,
      log: () => {},
    });
    const publishCalls = runNpm.mock.calls.filter(([args]) => args[0] === "publish");
    expect(publishCalls).toEqual(
      ["offline-win32-x64", "offline"].map((directory) => [
        [
          "publish",
          path.join(prepared.outputDirectory, "packs", tarballName(directory)),
          "--access",
          "public",
          "--tag",
          "latest",
          "--otp",
          "123456",
        ],
        { interactive: true },
      ]),
    );
    expect(existsSync(path.join(prepared.outputDirectory, "publication-started.json"))).toBe(true);
  });

  it("compares a rerun with the tarballs of the first run", async () => {
    const prepared = await preparedKit();
    await publishOfflineKitRelease(prepared, {
      dryRun: true,
      createFetcher: () => registry(NPM),
      runNpm: fakeNpm(),
      log: () => {},
    });
    const runNpm = fakeNpm();
    const darwin = tarballName("offline-darwin-arm64");
    await publishOfflineKitRelease(prepared, {
      dryRun: false,
      createFetcher: () =>
        registry({ ...NPM, "@starwind-ui/offline-darwin-arm64": { "3.6.0": sha512(darwin) } }),
      runNpm,
      log: () => {},
    });
    expect(runNpm.mock.calls.filter(([args]) => args[0] === "pack")).toEqual([]);
    expect(runNpm.mock.calls.filter(([args]) => args[0] === "publish")).toHaveLength(2);
  });

  it("stops when a published platform package differs from the build", async () => {
    await expect(
      publishOfflineKitRelease(await preparedKit(), {
        dryRun: false,
        createFetcher: () =>
          registry({ ...NPM, "@starwind-ui/offline-darwin-arm64": { "3.6.0": "sha512-old" } }),
        runNpm: fakeNpm(),
        log: () => {},
      }),
    ).rejects.toThrow(/@starwind-ui\/offline-darwin-arm64@3.6.0 on npm does not match/);
  });

  it("waits for npm to list the routine versions before publishing", async () => {
    const prepared = await preparedKit();
    const mainDirectory = prepared.build.mainDirectory;
    await mkdir(path.join(mainDirectory, "store/archives"), { recursive: true });
    await writeFile(path.join(mainDirectory, "store/archives/runtime.tgz"), "runtime archive");
    const integrity = sha512("runtime archive");
    prepared.build.index = {
      packages: {
        "@starwind-ui/runtime": {
          versions: { "1.5.0": { dist: { file: "runtime.tgz", integrity, platforms: null } } },
        },
      },
    };
    const fetchers = [
      registry(NPM),
      registry({ ...NPM, "@starwind-ui/runtime": { "1.4.0": "x", "1.5.0": integrity } }),
    ];
    const wait = vi.fn(async () => {});
    const runNpm = fakeNpm();
    await publishOfflineKitRelease(prepared, {
      dryRun: false,
      createFetcher: () => fetchers.shift(),
      runNpm,
      wait,
      log: () => {},
    });
    expect(wait).toHaveBeenCalledTimes(1);
    expect(runNpm.mock.calls.filter(([args]) => args[0] === "publish")).toHaveLength(3);
  });

  it("fails at once when npm serves other bytes", async () => {
    const prepared = await preparedKit();
    const mainDirectory = prepared.build.mainDirectory;
    await mkdir(path.join(mainDirectory, "store/archives"), { recursive: true });
    await writeFile(path.join(mainDirectory, "store/archives/runtime.tgz"), "runtime archive");
    prepared.build.index = {
      packages: {
        "@starwind-ui/runtime": {
          versions: {
            "1.5.0": { dist: { file: "runtime.tgz", integrity: "sha512-x", platforms: null } },
          },
        },
      },
    };
    const wait = vi.fn(async () => {});
    const runNpm = vi.fn();
    await expect(
      publishOfflineKitRelease(prepared, {
        dryRun: false,
        createFetcher: () => registry({ "@starwind-ui/runtime": { "1.5.0": "sha512-npm" } }),
        runNpm,
        wait,
        log: () => {},
      }),
    ).rejects.toThrow(/does not match npm for @starwind-ui\/runtime@1.5.0/);
    expect(wait).not.toHaveBeenCalled();
    expect(runNpm).not.toHaveBeenCalled();
    expect(existsSync(path.join(prepared.outputDirectory, "publication-started.json"))).toBe(false);
  });

  it("does nothing for a skipped kit", async () => {
    const runNpm = vi.fn();
    await expect(
      publishOfflineKitRelease({ skip: true }, { dryRun: false, runNpm }),
    ).resolves.toEqual({ published: [] });
    expect(runNpm).not.toHaveBeenCalled();
  });

  it("rejects a malformed one-time password", async () => {
    await expect(
      publishOfflineKitRelease(await preparedKit(), { otp: "abc", log: () => {} }),
    ).rejects.toThrow(/numeric one-time password/);
  });

  it("reads saved archives and compares them with npm", async () => {
    const output = await temporaryDirectory();
    const mainDirectory = path.join(output, "offline");
    await mkdir(path.join(mainDirectory, "store/archives"), { recursive: true });
    const bytes = Buffer.from("tailwind archive");
    await writeFile(path.join(mainDirectory, "store/archives/tailwindcss-4.3.4.tgz"), bytes);
    const integrity = `sha512-${createHash("sha512").update(bytes).digest("base64")}`;
    const build = {
      mainDirectory,
      platformDirectories: [],
      index: {
        packages: {
          tailwindcss: {
            versions: {
              "4.3.4": { dist: { file: "tailwindcss-4.3.4.tgz", integrity, platforms: null } },
            },
          },
          "lightningcss-freebsd-x64": {
            versions: { "1.0.0": { dist: { file: "x.tgz", platforms: [] } } },
          },
        },
      },
    };
    await expect(
      verifyBuildAgainstNpm(build, registry({ tailwindcss: { "4.3.4": integrity } })),
    ).resolves.toBeUndefined();
    await expect(
      verifyBuildAgainstNpm(build, registry({ tailwindcss: { "4.3.4": "sha512-npm" } })),
    ).rejects.toMatchObject({
      message: expect.stringMatching(/does not match npm for tailwindcss@4.3.4/),
      missingOnly: false,
    });
    await expect(verifyBuildAgainstNpm(build, registry({}))).rejects.toMatchObject({
      message: expect.stringMatching(/tailwindcss@4.3.4 \(not on npm\)/),
      missingOnly: true,
    });
    await rm(path.join(mainDirectory, "store/archives/tailwindcss-4.3.4.tgz"));
    await expect(
      verifyBuildAgainstNpm(build, registry({ tailwindcss: { "4.3.4": integrity } })),
    ).rejects.toThrow(/tailwindcss@4.3.4 \(missing archive\)/);
  });
});
