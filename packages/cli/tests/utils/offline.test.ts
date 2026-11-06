import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";

import { afterEach, describe, expect, it } from "vitest";

import {
  assertOfflinePackagesAvailable,
  assertOnlineFeature,
  createOfflinePackument,
  detectYarnMajor,
  findUnavailableOfflinePackages,
  getCurrentOfflinePlatform,
  getOfflinePackageManagerEnv,
  getOfflineStoreDirectories,
  getYarnBerryIsolationEnv,
  loadOfflineStore,
  OFFLINE_INDEX_SCHEMA_VERSION,
  type OfflineIndex,
  OfflineKitError,
  parseOfflineRequestPath,
  repairOfflineLockfiles,
  repairOfflineLockfilesSync,
  selectOfflineVersion,
  splitPackageSpec,
  startOfflineRegistry,
} from "../../src/utils/offline.js";
import {
  createProjectPackageSource,
  readNpmLockfile,
  readPnpmLockfile,
  splitPnpmLockKey,
} from "../../src/utils/offline-project-packages.js";

const temporaryDirectories: string[] = [];

function temporaryDirectory(): string {
  const directory = mkdtempSync(path.join(tmpdir(), "starwind-offline-test-"));
  temporaryDirectories.push(directory);
  return directory;
}

afterEach(() => {
  for (const directory of temporaryDirectories.splice(0)) {
    rmSync(directory, { recursive: true, force: true });
  }
});

function manifestRecord(
  name: string,
  versions: Record<string, { file?: string; platforms?: string[] | null; manifest?: object }>,
) {
  return {
    distTags: { latest: Object.keys(versions).at(-1)! },
    time: Object.fromEntries(
      Object.keys(versions).map((version) => [version, "2026-10-01T00:00:00.000Z"]),
    ),
    versions: Object.fromEntries(
      Object.entries(versions).map(([version, entry]) => [
        version,
        {
          manifest: { name, version, ...entry.manifest },
          dist: {
            integrity: `sha512-${name}-${version}`,
            shasum: "0".repeat(40),
            file: entry.file ?? `${name.replace("/", "__")}-${version}.tgz`,
            platforms: entry.platforms ?? null,
          },
        },
      ]),
    ),
  };
}

/** Writes a kit with a main store and a darwin-arm64 platform store. */
function createStore({
  platform = "darwin-arm64",
  withPlatformPackage = true,
  kitVersion = "3.6.0",
} = {}) {
  const root = temporaryDirectory();
  const main = path.join(root, "main");
  const native = path.join(root, "native");
  mkdirSync(path.join(main, "archives"), { recursive: true });
  mkdirSync(path.join(native, "archives"), { recursive: true });
  const index: OfflineIndex = {
    schemaVersion: OFFLINE_INDEX_SCHEMA_VERSION,
    kitVersion: "3.6.0",
    createdAt: "2026-11-05T00:00:00.000Z",
    platforms: ["darwin-arm64", "linux-x64-gnu"],
    packages: {
      tailwindcss: manifestRecord("tailwindcss", { "4.1.0": {}, "4.3.4": {} }),
      "@starwind-ui/astro": manifestRecord("@starwind-ui/astro", {
        "1.5.0": { manifest: { peerDependencies: { astro: ">=5" } } },
      }),
      "lightningcss-darwin-arm64": manifestRecord("lightningcss-darwin-arm64", {
        "1.33.0": { platforms: ["darwin-arm64"], manifest: { os: ["darwin"], cpu: ["arm64"] } },
      }),
      "metadata-only": manifestRecord("metadata-only", { "1.0.0": {} }),
    },
  };
  writeFileSync(path.join(main, "index.json"), JSON.stringify(index));
  for (const file of [
    "tailwindcss-4.1.0.tgz",
    "tailwindcss-4.3.4.tgz",
    "@starwind-ui__astro-1.5.0.tgz",
  ]) {
    writeFileSync(path.join(main, "archives", file), `archive:${file}`);
  }
  writeFileSync(path.join(native, "archives", "lightningcss-darwin-arm64-1.33.0.tgz"), "native");
  if (withPlatformPackage) {
    writeFileSync(path.join(native, "platform.json"), JSON.stringify({ platform, kitVersion }));
  }
  return { directories: [main, native], index };
}

describe("offline mode switch", () => {
  it("reads store directories from the offline kit environment", () => {
    expect(getOfflineStoreDirectories({})).toBeNull();
    expect(getOfflineStoreDirectories({ STARWIND_OFFLINE_STORE: " " })).toBeNull();
    expect(
      getOfflineStoreDirectories({
        STARWIND_OFFLINE_STORE: ["/kit/store", "/native/store"].join(path.delimiter),
      }),
    ).toEqual(["/kit/store", "/native/store"]);
  });

  it("reports network-only features in offline mode", () => {
    expect(() => assertOnlineFeature("Starwind Pro", {})).not.toThrow();
    expect(() => assertOnlineFeature("Starwind Pro", { STARWIND_OFFLINE_STORE: "/kit" })).toThrow(
      OfflineKitError,
    );
    expect(() => assertOnlineFeature("Starwind Pro", { STARWIND_OFFLINE_STORE: "/kit" })).toThrow(
      /Starwind Pro needs a network connection/,
    );
  });

  it("names Linux platforms by libc", () => {
    expect(getCurrentOfflinePlatform("linux", "x64", "musl")).toBe("linux-x64-musl");
    expect(getCurrentOfflinePlatform("darwin", "arm64", "gnu")).toBe("darwin-arm64");
  });
});

describe("offline store", () => {
  it("selects versions by dist-tag and range", () => {
    const { index } = createStore();
    const record = index.packages.tailwindcss!;
    expect(selectOfflineVersion(record, undefined)).toBe("4.3.4");
    expect(selectOfflineVersion(record, "latest")).toBe("4.3.4");
    expect(selectOfflineVersion(record, "~4.1.0")).toBe("4.1.0");
    expect(selectOfflineVersion(record, "^5")).toBeUndefined();
    expect(selectOfflineVersion(record, "next")).toBeUndefined();
  });

  it("splits scoped and plain specs", () => {
    expect(splitPackageSpec("@starwind-ui/astro@^1.5.0")).toEqual({
      name: "@starwind-ui/astro",
      version: "^1.5.0",
    });
    expect(splitPackageSpec("@starwind-ui/astro")).toEqual({ name: "@starwind-ui/astro" });
    expect(splitPackageSpec("astro@latest")).toEqual({ name: "astro", version: "latest" });
  });

  it("accepts packages that the kit can install on this platform", () => {
    const store = loadOfflineStore(createStore().directories);
    expect(
      findUnavailableOfflinePackages(
        store,
        ["tailwindcss@^4", "@starwind-ui/astro@1.5.0"],
        "darwin-arm64",
      ),
    ).toEqual([]);
  });

  it("names every missing package, version, archive, and platform package", () => {
    const store = loadOfflineStore(createStore({ withPlatformPackage: false }).directories);
    expect(
      findUnavailableOfflinePackages(
        store,
        ["astro@latest", "tailwindcss@^5", "metadata-only@1.0.0", "tailwindcss@^4"],
        "darwin-arm64",
      ),
    ).toEqual([
      "the native packages for darwin-arm64 (install @starwind-ui/offline-darwin-arm64 at the kit version)",
      "astro@latest",
      "tailwindcss@^5",
      "metadata-only@1.0.0",
    ]);
    expect(() => assertOfflinePackagesAvailable(store, ["astro@latest"])).toThrow(
      /cannot install .*astro@latest/,
    );
  });

  it("ignores a platform package from another kit version", () => {
    const store = loadOfflineStore(createStore({ kitVersion: "3.5.0" }).directories);
    expect(findUnavailableOfflinePackages(store, [], "darwin-arm64")).toEqual([
      "the native packages for darwin-arm64 (install @starwind-ui/offline-darwin-arm64 at the kit version)",
    ]);
  });

  it("reports an unsupported platform", () => {
    const store = loadOfflineStore(createStore().directories);
    expect(findUnavailableOfflinePackages(store, [], "freebsd-x64")).toEqual([
      "native packages for freebsd-x64, which the kit does not support (supported: darwin-arm64, linux-x64-gnu)",
    ]);
  });

  it("explains an unreadable kit index", () => {
    expect(() => loadOfflineStore([temporaryDirectory()])).toThrow(
      /Reinstall @starwind-ui\/offline/,
    );
  });
});

describe("offline registry", () => {
  it("parses metadata and archive paths for plain and scoped names", () => {
    expect(parseOfflineRequestPath("/tailwindcss")).toEqual({ packageName: "tailwindcss" });
    expect(parseOfflineRequestPath("/@starwind-ui%2fastro")).toEqual({
      packageName: "@starwind-ui/astro",
    });
    expect(parseOfflineRequestPath("/@starwind-ui/astro/-/astro-1.5.0.tgz")).toEqual({
      packageName: "@starwind-ui/astro",
      archive: "astro-1.5.0.tgz",
    });
    expect(parseOfflineRequestPath("/-/npm/v1/security/advisories/bulk")).toBeUndefined();
    expect(parseOfflineRequestPath("/%E0%A4%A")).toBeUndefined();
  });

  it("serves metadata and archives on the loopback interface only", async () => {
    const store = loadOfflineStore(createStore().directories);
    const registry = await startOfflineRegistry(store, { versions: () => [] });
    try {
      expect(registry.origin).toMatch(/^http:\/\/127\.0\.0\.1:\d+$/);
      const packument = (await (await fetch(`${registry.origin}/@starwind-ui%2fastro`)).json()) as {
        versions: Record<string, { dist: { tarball: string; integrity: string } }>;
        "dist-tags": Record<string, string>;
      };
      expect(packument["dist-tags"]).toEqual({ latest: "1.5.0" });
      const dist = packument.versions["1.5.0"]!.dist;
      expect(dist.tarball).toBe(`${registry.origin}/@starwind-ui/astro/-/astro-1.5.0.tgz`);
      expect(dist.integrity).toBe("sha512-@starwind-ui/astro-1.5.0");
      expect(await (await fetch(dist.tarball)).text()).toBe(
        "archive:@starwind-ui__astro-1.5.0.tgz",
      );

      const native = await fetch(
        `${registry.origin}/lightningcss-darwin-arm64/-/lightningcss-darwin-arm64-1.33.0.tgz`,
      );
      expect(await native.text()).toBe("native");

      expect((await fetch(`${registry.origin}/astro`)).status).toBe(404);
      expect(
        (await fetch(`${registry.origin}/metadata-only/-/metadata-only-1.0.0.tgz`)).status,
      ).toBe(404);
      expect(
        (await fetch(`${registry.origin}/-/npm/v1/security/audits`, { method: "POST" })).status,
      ).toBe(405);
      expect((await fetch(`${registry.origin}/tailwindcss`, { method: "HEAD" })).status).toBe(200);
    } finally {
      await registry.close();
    }
  });

  it("describes installed project packages that the kit does not contain", async () => {
    const store = loadOfflineStore(createStore().directories);
    const registry = await startOfflineRegistry(store, {
      versions: (name) =>
        name === "astro"
          ? [
              {
                version: "7.4.5",
                manifest: { name: "astro", version: "7.4.5" },
                integrity: "sha512-astro",
              },
            ]
          : [],
    });
    try {
      const packument = (await (await fetch(`${registry.origin}/astro`)).json()) as {
        versions: Record<string, { dist: { integrity: string } }>;
        "dist-tags": Record<string, string>;
        time: Record<string, string>;
      };
      expect(packument["dist-tags"].latest).toBe("7.4.5");
      expect(packument.versions["7.4.5"]!.dist.integrity).toBe("sha512-astro");
      expect(packument.time["7.4.5"]).toBe("2000-01-01T00:00:00.000Z");
      expect((await fetch(`${registry.origin}/astro/-/astro-7.4.5.tgz`)).status).toBe(404);
    } finally {
      await registry.close();
    }
  });

  it("keeps kit versions ahead of installed copies of the same version", () => {
    const { index } = createStore();
    const packument = createOfflinePackument(
      "tailwindcss",
      index.packages.tailwindcss,
      "http://x",
      [
        { version: "4.3.4", manifest: { name: "tailwindcss", version: "4.3.4" } },
        { version: "4.0.0", manifest: { name: "tailwindcss", version: "4.0.0" } },
      ],
    ) as { versions: Record<string, { dist: { integrity?: string } }> };
    expect(Object.keys(packument.versions).sort()).toEqual(["4.0.0", "4.1.0", "4.3.4"]);
    expect(packument.versions["4.3.4"]!.dist.integrity).toBe("sha512-tailwindcss-4.3.4");
    expect(packument.versions["4.0.0"]!.dist.integrity).toBeUndefined();
  });
});

describe("package manager settings", () => {
  it("routes every package manager to the local registry", () => {
    const env = getOfflinePackageManagerEnv("http://127.0.0.1:4000");
    expect(env).toMatchObject({
      npm_config_registry: "http://127.0.0.1:4000/",
      npm_config_audit: "false",
      npm_config_fund: "false",
      pnpm_config_registry: "http://127.0.0.1:4000/",
      YARN_REGISTRY: "http://127.0.0.1:4000/",
      YARN_NPM_REGISTRY_SERVER: "http://127.0.0.1:4000",
      YARN_UNSAFE_HTTP_WHITELIST: "127.0.0.1",
    });
  });

  it("detects the Yarn major and isolates Yarn 2+ metadata", async () => {
    const runYarn = async (args: string[]) =>
      args[0] === "--version" ? "4.18.1\n" : "/cache/yarn/berry\n";
    expect(await detectYarnMajor(runYarn)).toBe(4);
    expect(await detectYarnMajor(async () => "1.22.22")).toBe(1);
    expect(
      await detectYarnMajor(async () => {
        throw new Error("missing");
      }),
    ).toBeUndefined();
    expect(await getYarnBerryIsolationEnv(runYarn, "/tmp/global")).toEqual({
      YARN_GLOBAL_FOLDER: "/tmp/global",
      YARN_ENABLE_GLOBAL_CACHE: "false",
      YARN_CACHE_FOLDER: "/cache/yarn/berry",
      YARN_ENABLE_MIRROR: "false",
    });
  });
});

describe("lockfile repair", () => {
  const origin = "http://127.0.0.1:4000";

  it("restores public registry URLs in the project and parent lockfiles", async () => {
    const root = temporaryDirectory();
    const project = path.join(root, "apps/site");
    mkdirSync(path.join(project, "node_modules"), { recursive: true });
    writeFileSync(path.join(root, "pnpm-lock.yaml"), `tarball: ${origin}/a/-/a-1.0.0.tgz\n`);
    writeFileSync(
      path.join(project, "package-lock.json"),
      `{"resolved":"${origin}/b/-/b-1.0.0.tgz"}`,
    );
    writeFileSync(path.join(project, "node_modules/.modules.yaml"), `default: ${origin}/\n`);
    writeFileSync(path.join(project, "yarn.lock"), "unchanged\n");

    const changed = await repairOfflineLockfiles(origin, project);

    expect(changed.sort()).toEqual(
      [
        path.join(project, "node_modules/.modules.yaml"),
        path.join(project, "package-lock.json"),
        path.join(root, "pnpm-lock.yaml"),
      ].sort(),
    );
    expect(readFileSync(path.join(root, "pnpm-lock.yaml"), "utf8")).toBe(
      "tarball: https://registry.npmjs.org/a/-/a-1.0.0.tgz\n",
    );
    expect(readFileSync(path.join(project, "node_modules/.modules.yaml"), "utf8")).toBe(
      "default: https://registry.npmjs.org/\n",
    );
  });
});

describe("installed project packages", () => {
  it("reads hoisted and pnpm layouts with lockfile integrity", () => {
    const project = temporaryDirectory();
    const hoisted = path.join(project, "node_modules/astro");
    mkdirSync(hoisted, { recursive: true });
    writeFileSync(
      path.join(hoisted, "package.json"),
      JSON.stringify({
        name: "astro",
        version: "7.4.5",
        dependencies: { vite: "^8" },
        scripts: { build: "x" },
      }),
    );
    const pnpmCopy = path.join(
      project,
      "node_modules/.pnpm/@scope+tool@2.0.0/node_modules/@scope/tool",
    );
    mkdirSync(pnpmCopy, { recursive: true });
    writeFileSync(
      path.join(pnpmCopy, "package.json"),
      JSON.stringify({ name: "@scope/tool", version: "2.0.0" }),
    );
    writeFileSync(
      path.join(project, "package-lock.json"),
      JSON.stringify({
        packages: { "node_modules/astro": { version: "7.4.5", integrity: "sha512-npm" } },
      }),
    );
    writeFileSync(
      path.join(project, "pnpm-lock.yaml"),
      "packages:\n\n  '@scope/tool@2.0.0':\n    resolution: {integrity: sha512-pnpm}\n",
    );

    const source = createProjectPackageSource(project);

    expect(source.versions("astro")).toEqual([
      {
        version: "7.4.5",
        manifest: { name: "astro", version: "7.4.5", dependencies: { vite: "^8" } },
        integrity: "sha512-npm",
      },
    ]);
    expect(source.versions("@scope/tool")).toEqual([
      {
        version: "2.0.0",
        manifest: { name: "@scope/tool", version: "2.0.0" },
        integrity: "sha512-pnpm",
      },
    ]);
    expect(source.versions("missing")).toEqual([]);
  });

  it("reads Yarn 1 and Bun lockfile integrity", () => {
    const project = temporaryDirectory();
    for (const name of ["left-pad", "right-pad"]) {
      mkdirSync(path.join(project, "node_modules", name), { recursive: true });
      writeFileSync(
        path.join(project, "node_modules", name, "package.json"),
        JSON.stringify({ name, version: "1.3.0" }),
      );
    }
    writeFileSync(
      path.join(project, "yarn.lock"),
      'left-pad@^1.3.0:\n  version "1.3.0"\n  resolved "https://registry.yarnpkg.com/left-pad/-/left-pad-1.3.0.tgz"\n  integrity sha512-yarn\n',
    );
    writeFileSync(
      path.join(project, "bun.lock"),
      '    "right-pad": ["right-pad@1.3.0", "", {}, "sha512-bun"],\n',
    );
    const source = createProjectPackageSource(project);
    expect(source.versions("left-pad")[0]?.integrity).toBe("sha512-yarn");
    expect(source.versions("right-pad")[0]?.integrity).toBe("sha512-bun");
  });
});

describe("locked project packages", () => {
  it("reads pnpm package and snapshot entries, including other platforms", () => {
    const lockfile = [
      "lockfileVersion: '9.0'",
      "",
      "importers:",
      "",
      "  .:",
      "    dependencies:",
      "      astro:",
      "        specifier: ^7.4.5",
      "        version: 7.4.5",
      "",
      "packages:",
      "",
      "  '@astrojs/compiler-binding-wasm32-wasi@0.5.2':",
      "    resolution: {integrity: sha512-wasm}",
      "    engines: {node: ^20.19.0 || >=22.12.0}",
      "    cpu: [wasm32]",
      "",
      "  '@vitejs/plugin-react@5.2.0':",
      "    resolution: {integrity: sha512-react}",
      "    peerDependencies:",
      "      vite: ^4.2.0 || ^5.0.0 || ^6.0.0 || ^7.0.0 || ^8.0.0",
      "    peerDependenciesMeta:",
      "      '@types/node':",
      "        optional: true",
      "",
      "snapshots:",
      "",
      "  '@astrojs/compiler-binding-wasm32-wasi@0.5.2':",
      "    dependencies:",
      "      '@napi-rs/wasm-runtime': 1.2.7(@emnapi/core@1.11.3)",
      "    optional: true",
      "",
      "  '@vitejs/plugin-react@5.2.0(vite@8.1.6)':",
      "    dependencies:",
      "      '@babel/core': 7.29.7",
      "",
    ].join("\n");

    const locked = readPnpmLockfile(lockfile);

    expect(locked.get("@astrojs/compiler-binding-wasm32-wasi")?.get("0.5.2")).toEqual({
      version: "0.5.2",
      integrity: "sha512-wasm",
      manifest: {
        name: "@astrojs/compiler-binding-wasm32-wasi",
        version: "0.5.2",
        engines: { node: "^20.19.0 || >=22.12.0" },
        cpu: ["wasm32"],
        dependencies: { "@napi-rs/wasm-runtime": "1.2.7" },
      },
    });
    expect(locked.get("@vitejs/plugin-react")?.get("5.2.0")?.manifest).toMatchObject({
      peerDependencies: { vite: "^4.2.0 || ^5.0.0 || ^6.0.0 || ^7.0.0 || ^8.0.0" },
      peerDependenciesMeta: { "@types/node": { optional: true } },
      dependencies: { "@babel/core": "7.29.7" },
    });
    expect(locked.has("astro")).toBe(false);
    expect(splitPnpmLockKey("@scope/name@1.2.3(peer@1.0.0)")).toEqual({
      name: "@scope/name",
      version: "1.2.3",
    });
    expect(splitPnpmLockKey("link:../pkg")).toBeUndefined();
  });

  it("reads npm lockfile entries for every platform", () => {
    const locked = readNpmLockfile(
      JSON.stringify({
        packages: {
          "": { name: "site" },
          "node_modules/@esbuild/win32-x64": {
            version: "0.25.12",
            integrity: "sha512-win",
            optional: true,
            os: ["win32"],
            cpu: ["x64"],
          },
          "node_modules/local": { link: true, resolved: "../local" },
        },
      }),
    );
    expect(locked.get("@esbuild/win32-x64")?.get("0.25.12")).toEqual({
      version: "0.25.12",
      integrity: "sha512-win",
      manifest: { name: "@esbuild/win32-x64", version: "0.25.12", os: ["win32"], cpu: ["x64"] },
    });
    expect(locked.has("local")).toBe(false);
  });

  it("describes locked packages that are not installed", () => {
    const project = temporaryDirectory();
    writeFileSync(
      path.join(project, "pnpm-lock.yaml"),
      "packages:\n\n  '@esbuild/win32-x64@0.25.12':\n    resolution: {integrity: sha512-win}\n    os: [win32]\n",
    );
    expect(createProjectPackageSource(project).versions("@esbuild/win32-x64")).toEqual([
      {
        version: "0.25.12",
        integrity: "sha512-win",
        manifest: { name: "@esbuild/win32-x64", version: "0.25.12", os: ["win32"] },
      },
    ]);
  });
});
