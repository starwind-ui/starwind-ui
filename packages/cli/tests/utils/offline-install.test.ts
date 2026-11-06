import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";

import { execa } from "execa";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { OfflineKitError } from "../../src/utils/offline.js";
import { detectPackageManager, installDependencies } from "../../src/utils/package-manager.js";
import { installProRegistryItems } from "../../src/utils/pro-registry.js";
import { loadRegistry } from "../../src/utils/registry.js";

vi.mock("execa", () => ({ execa: vi.fn() }));

const mockExeca = vi.mocked(execa);
type ExecaResult = Awaited<ReturnType<typeof execa>>;

let root: string;
let project: string;

function writeKit() {
  const main = path.join(root, "kit/store");
  const native = path.join(root, "kit-native/store");
  mkdirSync(path.join(main, "archives"), { recursive: true });
  mkdirSync(path.join(native, "archives"), { recursive: true });
  writeFileSync(
    path.join(main, "index.json"),
    JSON.stringify({
      schemaVersion: 1,
      kitVersion: "3.6.0",
      createdAt: "2026-11-05T00:00:00.000Z",
      platforms: ["test-platform"],
      packages: {
        tailwindcss: {
          distTags: { latest: "4.3.4" },
          time: { "4.3.4": "2026-10-01T00:00:00.000Z" },
          versions: {
            "4.3.4": {
              manifest: { name: "tailwindcss", version: "4.3.4" },
              dist: {
                integrity: "sha512-tw",
                shasum: "0".repeat(40),
                file: "tailwindcss-4.3.4.tgz",
                platforms: null,
              },
            },
          },
        },
      },
    }),
  );
  writeFileSync(path.join(main, "archives/tailwindcss-4.3.4.tgz"), "tailwind");
  writeFileSync(
    path.join(native, "platform.json"),
    JSON.stringify({ platform: "test-platform", kitVersion: "3.6.0" }),
  );
  return [main, native].join(path.delimiter);
}

beforeEach(() => {
  vi.clearAllMocks();
  root = mkdtempSync(path.join(tmpdir(), "starwind-offline-install-"));
  project = path.join(root, "project");
  mkdirSync(project);
  vi.spyOn(process, "cwd").mockReturnValue(project);
  vi.stubEnv("STARWIND_OFFLINE_STORE", writeKit());
  // The fixture kit supports one invented platform name, so every machine runs these tests.
  vi.spyOn(process, "platform", "get").mockReturnValue("test" as NodeJS.Platform);
  vi.spyOn(process, "arch", "get").mockReturnValue("platform" as NodeJS.Architecture);
});

afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllEnvs();
  rmSync(root, { recursive: true, force: true });
});

describe("offline installs", () => {
  it("runs the package manager against the local registry and repairs the lockfile", async () => {
    let registry = "";
    mockExeca.mockImplementation((async (
      _command: string,
      _args: string[],
      options: { env: NodeJS.ProcessEnv },
    ) => {
      registry = options.env.npm_config_registry!;
      const packument = await fetch(`${registry}tailwindcss`);
      expect(packument.status).toBe(200);
      writeFileSync(
        path.join(project, "package-lock.json"),
        JSON.stringify({ resolved: `${registry}tailwindcss/-/tailwindcss-4.3.4.tgz` }),
      );
      return {} as ExecaResult;
    }) as never);

    await installDependencies(["tailwindcss@^4"], "npm");

    expect(mockExeca).toHaveBeenCalledWith(
      "npm",
      ["install", "--", "tailwindcss@^4"],
      expect.objectContaining({ env: expect.objectContaining({ npm_config_audit: "false" }) }),
    );
    expect(registry).toMatch(/^http:\/\/127\.0\.0\.1:\d+\/$/);
    expect(readFileSync(path.join(project, "package-lock.json"), "utf8")).toBe(
      JSON.stringify({
        resolved: "https://registry.npmjs.org/tailwindcss/-/tailwindcss-4.3.4.tgz",
      }),
    );
    await expect(fetch(`${registry}tailwindcss`)).rejects.toThrow();
  });

  it("stops before the package manager runs when the kit lacks a package", async () => {
    await expect(installDependencies(["astro@latest", "tailwindcss@^4"], "npm")).rejects.toThrow(
      OfflineKitError,
    );
    await expect(installDependencies(["astro@latest"], "npm")).rejects.toThrow(
      /cannot install astro@latest/,
    );
    expect(mockExeca).not.toHaveBeenCalled();
  });

  it("names a package outside the kit that the package manager asked for", async () => {
    mockExeca.mockImplementation((async (
      _command: string,
      _args: string[],
      options: { env: NodeJS.ProcessEnv },
    ) => {
      expect((await fetch(`${options.env.npm_config_registry}astro`)).status).toBe(404);
      throw new Error("npm error 404 Not Found - GET astro");
    }) as never);

    await expect(installDependencies(["tailwindcss@^4"], "npm")).rejects.toThrow(
      /offline kit does not contain astro, which the package manager needed[\s\S]*npm error 404/,
    );
  });

  it("keeps the package manager error when the missing packages are not its cause", async () => {
    mockExeca.mockImplementation((async (
      _command: string,
      _args: string[],
      options: { env: NodeJS.ProcessEnv },
    ) => {
      // npm asks for optional peers such as sass and gets 404 without needing them.
      expect((await fetch(`${options.env.npm_config_registry}sass`)).status).toBe(404);
      throw new Error("npm error code ERESOLVE: sass-embedded conflicts");
    }) as never);

    await expect(installDependencies(["tailwindcss@^4"], "npm")).rejects.toThrow(
      /^npm error code ERESOLVE: sass-embedded conflicts$/,
    );
  });

  it("does not blame a missing package for a scoped package with the same last name", async () => {
    mockExeca.mockImplementation((async (
      _command: string,
      _args: string[],
      options: { env: NodeJS.ProcessEnv },
    ) => {
      await fetch(`${options.env.npm_config_registry}react`);
      throw new Error("npm error peer @types/react@19 conflicts");
    }) as never);

    await expect(installDependencies(["tailwindcss@^4"], "npm")).rejects.toThrow(
      /^npm error peer @types\/react@19 conflicts$/,
    );
  });

  it("names a missing package that appears in npm's registry URL", async () => {
    mockExeca.mockImplementation((async (
      _command: string,
      _args: string[],
      options: { env: NodeJS.ProcessEnv },
    ) => {
      await fetch(`${options.env.npm_config_registry}astro`);
      throw new Error(
        `npm error 404 Not Found - GET ${options.env.npm_config_registry}astro - not_found`,
      );
    }) as never);

    await expect(installDependencies(["tailwindcss@^4"], "npm")).rejects.toThrow(
      /offline kit does not contain astro,/,
    );
  });

  it("refuses Yarn 1 before it starts the local registry", async () => {
    mockExeca.mockResolvedValue({ stdout: "1.22.22" } as ExecaResult);

    await expect(installDependencies(["tailwindcss@^4"], "yarn")).rejects.toThrow(
      /does not support Yarn 1/,
    );
    expect(mockExeca).toHaveBeenCalledTimes(1);
    expect(mockExeca).toHaveBeenCalledWith("yarn", ["--version"], expect.anything());
  });

  it("refuses Bun before it starts the local registry", async () => {
    await expect(installDependencies(["tailwindcss@^4"], "bun")).rejects.toThrow(
      /does not support Bun/,
    );
    expect(mockExeca).not.toHaveBeenCalled();
  });

  it("finds the workspace package manager from a member folder", () => {
    writeFileSync(path.join(root, "pnpm-lock.yaml"), "lockfileVersion: '9.0'\n");
    expect(detectPackageManager({ cwd: project }).name).toBe("pnpm");
    vi.stubEnv("npm_config_user_agent", "");
    vi.stubEnv("STARWIND_OFFLINE_STORE", "");
    expect(detectPackageManager({ cwd: project }).name).toBe("npm");
  });

  it("gives Yarn 2+ a temporary global folder and keeps its package cache", async () => {
    let installEnv: NodeJS.ProcessEnv = {};
    mockExeca.mockImplementation((async (
      _command: string,
      args: string[],
      options: { env: NodeJS.ProcessEnv },
    ) => {
      if (args[0] === "--version") return { stdout: "4.18.1" } as ExecaResult;
      if (args[0] === "config") return { stdout: "/cache/yarn/berry" } as ExecaResult;
      installEnv = options.env;
      return {} as ExecaResult;
    }) as never);

    await installDependencies(["tailwindcss@^4"], "yarn");

    expect(installEnv.YARN_CACHE_FOLDER).toBe("/cache/yarn/berry");
    expect(installEnv.YARN_GLOBAL_FOLDER).toMatch(/starwind-offline-/);
    expect(installEnv.YARN_NPM_REGISTRY_SERVER).toMatch(/^http:\/\/127\.0\.0\.1:\d+$/);
  });

  it("repairs the lockfile when the package manager fails", async () => {
    mockExeca.mockImplementation((async (
      _command: string,
      _args: string[],
      options: { env: NodeJS.ProcessEnv },
    ) => {
      writeFileSync(
        path.join(project, "pnpm-lock.yaml"),
        `tarball: ${options.env.npm_config_registry}x.tgz\n`,
      );
      throw new Error("pnpm failed");
    }) as never);

    await expect(installDependencies(["tailwindcss@^4"], "pnpm")).rejects.toThrow("pnpm failed");
    expect(readFileSync(path.join(project, "pnpm-lock.yaml"), "utf8")).toBe(
      "tarball: https://registry.npmjs.org/x.tgz\n",
    );
  });
});

describe("network-only features in offline mode", () => {
  it("reports that a remote registry needs a network connection", async () => {
    await expect(
      loadRegistry({ type: "remote", url: "https://registry.example.com/registry.json" }),
    ).rejects.toThrow(/A remote Starwind registry needs a network connection/);
  });

  it("reports that Starwind Pro installs need a network connection", async () => {
    await expect(
      installProRegistryItems(
        ["@starwind-pro/login1"],
        {} as Parameters<typeof installProRegistryItems>[1],
      ),
    ).rejects.toThrow(/Installing Starwind Pro components needs a network connection/);
  });
});
