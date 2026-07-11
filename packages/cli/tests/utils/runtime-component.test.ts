import { mkdir, mkdtemp, readFile, rm, stat, symlink, utimes, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";

import * as clackPrompts from "@clack/prompts";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import type { StarwindConfig } from "../../src/utils/config.js";
import * as config from "../../src/utils/config.js";
import * as dependencyResolver from "../../src/utils/dependency-resolver.js";
import * as packageManager from "../../src/utils/package-manager.js";
import type { StarwindRegistry } from "../../src/utils/registry.js";
import * as registry from "../../src/utils/registry.js";
import {
  installRuntimeComponents,
  planRuntimeComponentUpdates,
  updateRuntimeComponents,
} from "../../src/utils/runtime-component.js";

vi.mock("@clack/prompts", () => ({
  cancel: vi.fn(),
  confirm: vi.fn(),
  isCancel: vi.fn().mockReturnValue(false),
  log: {
    warn: vi.fn(),
  },
}));
vi.mock("../../src/utils/config.js");
vi.mock("../../src/utils/dependency-resolver.js");
vi.mock("../../src/utils/package-manager.js");
vi.mock("../../src/utils/registry.js");

const mockLoadRegistry = vi.mocked(registry.loadRegistry);
const mockGetStyledRegistrySource = vi.mocked(registry.getStyledRegistrySource);
const mockUpdateConfig = vi.mocked(config.updateConfig);
const mockGetStyledComponentDir = vi.mocked(config.getStyledComponentDir);
const mockGetStyledComponentDirConfigUpdate = vi.mocked(config.getStyledComponentDirConfigUpdate);
const mockFilterUninstalledDependencies = vi.mocked(
  dependencyResolver.filterUninstalledDependencies,
);
const mockInstallDependencies = vi.mocked(packageManager.installDependencies);
const mockConfirm = vi.mocked(clackPrompts.confirm);
const mockIsCancel = vi.mocked(clackPrompts.isCancel);
const mockPromptLog = vi.mocked(clackPrompts.log);

const runtimeConfig: StarwindConfig = {
  $schema: "https://starwind.dev/config-schema.v2.json",
  version: 2,
  framework: "react",
  registry: {
    source: "bundled",
    version: "0.1.0",
  },
  tailwind: {
    css: "src/styles/starwind.css",
    baseColor: "neutral",
    cssVariables: true,
  },
  componentDir: "src/components/starwind",
  utilsDir: "src/lib/utils",
  components: [],
};

const registryFixture: StarwindRegistry = {
  $schema: "https://starwind.dev/registry-schema.v2.json",
  version: "0.1.0",
  components: [
    {
      name: "button",
      version: "2.0.0",
      type: "component",
      dependencies: [],
      targets: {
        react: {
          files: [
            {
              path: "src/components/starwind/button/index.tsx",
              content: "export function Button() { return null; }\n",
            },
          ],
          componentDependencies: [],
          packageRequirements: [{ name: "@starwind-ui/react", range: "^1.0.0" }],
        },
      },
    },
  ],
};

function createRegistryComponent(name: string, componentDependencies: string[] = []) {
  return {
    name,
    version: "1.0.0",
    type: "component" as const,
    dependencies: [],
    targets: {
      react: {
        files: [
          {
            path: `src/components/starwind/${name}/index.tsx`,
            content: `export function ${name.toUpperCase()}() { return null; }\n`,
          },
        ],
        componentDependencies,
        packageRequirements: [{ name: "@starwind-ui/react", range: "^1.0.0" }],
      },
    },
  };
}

async function createDirectoryLink(target: string, linkPath: string): Promise<Error | undefined> {
  try {
    await symlink(target, linkPath, process.platform === "win32" ? "junction" : "dir");
  } catch (error) {
    if (
      process.platform === "win32" &&
      error instanceof Error &&
      "code" in error &&
      error.code === "EPERM"
    ) {
      return error;
    }

    throw error;
  }
}

describe.sequential("runtime component installs", () => {
  let tempDir = "";
  let previousCwd = "";

  beforeEach(async () => {
    vi.clearAllMocks();

    tempDir = await mkdtemp(join(tmpdir(), "starwind-runtime-component-test-"));
    previousCwd = process.cwd();
    process.chdir(tempDir);
    await writeFile("package.json", JSON.stringify({ dependencies: {} }), "utf-8");

    mockLoadRegistry.mockResolvedValue(registryFixture);
    mockGetStyledRegistrySource.mockImplementation((starwindConfig, registryReference) => {
      if (!registryReference || registryReference === "default") {
        return { type: "bundled" };
      }

      const styledRegistry = starwindConfig.registries?.[registryReference];
      if (!styledRegistry) return undefined;

      if (styledRegistry.source === "local" && styledRegistry.path) {
        return { type: "local", path: styledRegistry.path };
      }

      if (styledRegistry.source === "remote" && styledRegistry.url) {
        return { type: "remote", url: styledRegistry.url };
      }

      return undefined;
    });
    mockFilterUninstalledDependencies.mockImplementation(async (packages) => packages);
    mockInstallDependencies.mockResolvedValue(undefined);
    mockUpdateConfig.mockResolvedValue(undefined);
    mockGetStyledComponentDir.mockImplementation((starwindConfig, framework) => {
      const targetFramework = framework ?? starwindConfig.framework;
      if (
        targetFramework &&
        starwindConfig.framework &&
        targetFramework !== starwindConfig.framework
      ) {
        return (
          starwindConfig.componentDirs?.[targetFramework] ??
          `src/components/starwind-${targetFramework}`
        );
      }

      return starwindConfig.componentDir;
    });
    mockGetStyledComponentDirConfigUpdate.mockImplementation(
      (starwindConfig, framework, componentDir) => {
        if (!starwindConfig.framework || framework === starwindConfig.framework) {
          return { componentDir };
        }

        return {
          componentDirs: {
            [framework]: componentDir,
          },
        };
      },
    );
    mockConfirm.mockResolvedValue(true);
    mockIsCancel.mockReturnValue(false);
  });

  afterEach(async () => {
    process.chdir(previousCwd);
    await rm(tempDir, { recursive: true, force: true });
  });

  it.each(["../button", "nested/button", "."])(
    "rejects unsafe styled registry component name %s",
    async (name) => {
      const actualRegistry = await vi.importActual<typeof import("../../src/utils/registry.js")>(
        "../../src/utils/registry.js",
      );
      const registryPath = join(tempDir, "unsafe-registry.json");
      await writeFile(
        registryPath,
        JSON.stringify({
          ...registryFixture,
          components: [{ ...registryFixture.components[0], name }],
        }),
        "utf-8",
      );

      await expect(
        actualRegistry.loadRegistry({ type: "local", path: registryPath }, { forceRefresh: true }),
      ).rejects.toThrow(/name|path segment/i);
    },
  );

  it.each(["--global", "../react"])(
    "rejects unsafe styled registry package name %s before side effects",
    async (packageName) => {
      const actualRegistry = await vi.importActual<typeof import("../../src/utils/registry.js")>(
        "../../src/utils/registry.js",
      );
      const registryPath = join(tempDir, "unsafe-package-registry.json");
      const destination = join(tempDir, "src", "components", "starwind", "button", "index.tsx");
      await writeFile(
        registryPath,
        JSON.stringify({
          ...registryFixture,
          components: [
            {
              ...registryFixture.components[0],
              targets: {
                react: {
                  ...registryFixture.components[0]!.targets!.react!,
                  packageRequirements: [{ name: packageName, range: "^1.0.0" }],
                },
              },
            },
          ],
        }),
        "utf-8",
      );
      mockLoadRegistry.mockImplementation((source, options) =>
        actualRegistry.loadRegistry(source, options),
      );

      await expect(
        installRuntimeComponents(["button"], {
          config: runtimeConfig,
          packageManager: "pnpm",
          registrySource: { type: "local", path: registryPath },
          skipPrompts: true,
        }),
      ).rejects.toThrow(/package/i);
      await expect(readFile(destination, "utf-8")).rejects.toThrow();
      expect(mockFilterUninstalledDependencies).not.toHaveBeenCalled();
      expect(mockInstallDependencies).not.toHaveBeenCalled();
      expect(mockUpdateConfig).not.toHaveBeenCalled();
    },
  );

  it("rejects styled writes through an external directory link before package or config mutations", async ({
    skip,
  }) => {
    const externalDir = await mkdtemp(join(tmpdir(), "starwind-runtime-external-test-"));
    const componentRoot = join(tempDir, "src", "components", "starwind");
    await mkdir(dirname(componentRoot), { recursive: true });

    try {
      const linkError = await createDirectoryLink(externalDir, componentRoot);
      if (linkError) skip(`Windows junction creation failed with EPERM: ${linkError.message}`);

      const result = await installRuntimeComponents(["button"], {
        config: runtimeConfig,
        packageManager: "pnpm",
        skipPrompts: true,
      });

      expect(result.failed).toEqual([
        expect.objectContaining({ name: "button", error: expect.stringMatching(/outside/i) }),
      ]);
      await expect(readFile(join(externalDir, "button", "index.tsx"), "utf-8")).rejects.toThrow();
      expect(mockInstallDependencies).not.toHaveBeenCalled();
      expect(mockUpdateConfig).not.toHaveBeenCalled();
    } finally {
      await rm(externalDir, { recursive: true, force: true });
    }
  });

  it("copies prepared target files, installs target packages, and records styled metadata", async () => {
    const result = await installRuntimeComponents(["button"], {
      config: runtimeConfig,
      packageManager: "pnpm",
      skipPrompts: true,
    });

    expect(result.failed).toEqual([]);
    expect(result.installed).toEqual([{ name: "button", status: "installed", version: "2.0.0" }]);
    await expect(
      readFile(join(tempDir, "src", "components", "starwind", "button", "index.tsx"), "utf-8"),
    ).resolves.toContain("export function Button");
    await expect(
      readFile(
        join(tempDir, "src", "components", "starwind", "starwind", "button", "index.tsx"),
        "utf-8",
      ),
    ).rejects.toThrow();
    expect(mockInstallDependencies).toHaveBeenCalledWith(["@starwind-ui/react@^1.0.0"], "pnpm");
    expect(mockUpdateConfig).toHaveBeenCalledWith(
      {
        components: [
          {
            name: "button",
            version: "2.0.0",
            framework: "react",
            registry: "default",
          },
        ],
      },
      { appendComponents: true },
    );
  });

  it("installs metadata without rewriting byte-identical styled files", async () => {
    const destination = join(tempDir, "src", "components", "starwind", "button", "index.tsx");
    await mkdir(dirname(destination), { recursive: true });
    await writeFile(destination, "export function Button() { return null; }\n", "utf-8");
    const preservedTimestamp = new Date("2020-01-01T00:00:00.000Z");
    await utimes(destination, preservedTimestamp, preservedTimestamp);
    const before = await stat(destination);

    const result = await installRuntimeComponents(["button"], {
      config: runtimeConfig,
      packageManager: "pnpm",
      skipPrompts: true,
    });

    expect(result).toEqual({
      failed: [],
      installed: [{ name: "button", status: "installed", version: "2.0.0" }],
      skipped: [],
    });
    expect((await stat(destination)).mtimeMs).toBe(before.mtimeMs);
    expect(mockInstallDependencies).toHaveBeenCalledWith(["@starwind-ui/react@^1.0.0"], "pnpm");
    expect(mockUpdateConfig).toHaveBeenCalledWith(
      {
        components: [
          {
            framework: "react",
            name: "button",
            registry: "default",
            version: "2.0.0",
          },
        ],
      },
      { appendComponents: true },
    );
  });

  it("skips a styled component with a conflicting existing file before side effects", async () => {
    const destination = join(tempDir, "src", "components", "starwind", "button", "index.tsx");
    await mkdir(dirname(destination), { recursive: true });
    await writeFile(destination, "export const locallyCustomized = true;\n", "utf-8");

    const result = await installRuntimeComponents(["button"], {
      config: runtimeConfig,
      packageManager: "pnpm",
      skipPrompts: true,
    });

    expect(result).toEqual({
      failed: [],
      installed: [],
      skipped: [
        {
          error:
            "Existing file conflicts: src/components/starwind/button/index.tsx. Re-run with --overwrite to replace it.",
          name: "button",
          status: "skipped",
          version: "2.0.0",
        },
      ],
    });
    await expect(readFile(destination, "utf-8")).resolves.toBe(
      "export const locallyCustomized = true;\n",
    );
    expect(mockInstallDependencies).not.toHaveBeenCalled();
    expect(mockUpdateConfig).not.toHaveBeenCalled();
  });

  it("does not create absent sibling files when a styled component has a conflict", async () => {
    mockLoadRegistry.mockResolvedValue({
      ...registryFixture,
      components: [
        {
          ...registryFixture.components[0],
          targets: {
            react: {
              ...registryFixture.components[0].targets!.react!,
              files: [
                ...registryFixture.components[0].targets!.react!.files,
                {
                  path: "src/components/starwind/button/variants.ts",
                  content: "export const buttonVariants = {};\n",
                },
              ],
            },
          },
        },
      ],
    });
    const conflictingDestination = join(
      tempDir,
      "src",
      "components",
      "starwind",
      "button",
      "index.tsx",
    );
    const absentSibling = join(tempDir, "src", "components", "starwind", "button", "variants.ts");
    await mkdir(dirname(conflictingDestination), { recursive: true });
    await writeFile(conflictingDestination, "export const locallyCustomized = true;\n", "utf-8");

    const result = await installRuntimeComponents(["button"], {
      config: runtimeConfig,
      packageManager: "pnpm",
      skipPrompts: true,
    });

    expect(result).toEqual({
      failed: [],
      installed: [],
      skipped: [
        {
          error:
            "Existing file conflicts: src/components/starwind/button/index.tsx. Re-run with --overwrite to replace it.",
          name: "button",
          status: "skipped",
          version: "2.0.0",
        },
      ],
    });
    await expect(readFile(absentSibling, "utf-8")).rejects.toThrow();
    expect(mockInstallDependencies).not.toHaveBeenCalled();
    expect(mockUpdateConfig).not.toHaveBeenCalled();
  });

  it("replaces a conflicting styled file when overwrite is explicit", async () => {
    const destination = join(tempDir, "src", "components", "starwind", "button", "index.tsx");
    await mkdir(dirname(destination), { recursive: true });
    await writeFile(destination, "export const locallyCustomized = true;\n", "utf-8");

    const result = await installRuntimeComponents(["button"], {
      config: runtimeConfig,
      overwrite: true,
      packageManager: "pnpm",
      skipPrompts: true,
    });

    expect(result).toEqual({
      failed: [],
      installed: [{ name: "button", status: "installed", version: "2.0.0" }],
      skipped: [],
    });
    await expect(readFile(destination, "utf-8")).resolves.toBe(
      "export function Button() { return null; }\n",
    );
    expect(mockInstallDependencies).toHaveBeenCalledWith(["@starwind-ui/react@^1.0.0"], "pnpm");
    expect(mockUpdateConfig).toHaveBeenCalledWith(
      {
        components: [
          {
            framework: "react",
            name: "button",
            registry: "default",
            version: "2.0.0",
          },
        ],
      },
      { appendComponents: true },
    );
  });

  it("installs an independent requested component when another requested component conflicts", async () => {
    mockLoadRegistry.mockResolvedValue({
      ...registryFixture,
      components: [
        {
          ...registryFixture.components[0],
          targets: {
            react: {
              ...registryFixture.components[0].targets!.react!,
              packageRequirements: [{ name: "shared-package", range: "^2.0.0" }],
            },
          },
        },
        {
          name: "card",
          version: "3.0.0",
          type: "component",
          dependencies: [],
          targets: {
            react: {
              files: [
                {
                  path: "src/components/starwind/card/index.tsx",
                  content: "export function Card() { return null; }\n",
                },
              ],
              componentDependencies: [],
              packageRequirements: [{ name: "shared-package", range: "^3.0.0" }],
            },
          },
        },
      ],
    });
    const buttonDestination = join(tempDir, "src", "components", "starwind", "button", "index.tsx");
    const cardDestination = join(tempDir, "src", "components", "starwind", "card", "index.tsx");
    await mkdir(dirname(buttonDestination), { recursive: true });
    await writeFile(buttonDestination, "export const locallyCustomized = true;\n", "utf-8");

    const result = await installRuntimeComponents(["button", "card"], {
      config: runtimeConfig,
      packageManager: "pnpm",
      skipPrompts: true,
    });

    expect(result).toEqual({
      failed: [],
      installed: [{ name: "card", status: "installed", version: "3.0.0" }],
      skipped: [
        {
          error:
            "Existing file conflicts: src/components/starwind/button/index.tsx. Re-run with --overwrite to replace it.",
          name: "button",
          status: "skipped",
          version: "2.0.0",
        },
      ],
    });
    await expect(readFile(cardDestination, "utf-8")).resolves.toBe(
      "export function Card() { return null; }\n",
    );
    expect(mockInstallDependencies).toHaveBeenCalledWith(["shared-package@^3.0.0"], "pnpm");
    expect(mockUpdateConfig).toHaveBeenCalledWith(
      {
        components: [
          {
            framework: "react",
            name: "card",
            registry: "default",
            version: "3.0.0",
          },
        ],
      },
      { appendComponents: true },
    );
  });

  it("records custom styled registry metadata for explicit registry installs", async () => {
    const customRegistrySource = {
      type: "remote" as const,
      url: "https://example.com/custom-registry.json",
    };

    const result = await installRuntimeComponents(["button"], {
      config: runtimeConfig,
      packageManager: "pnpm",
      registryMode: "custom",
      registrySource: customRegistrySource,
      skipPrompts: true,
    });

    expect(result.failed).toEqual([]);

    const [updates] = mockUpdateConfig.mock.calls.at(-1)!;
    const component = updates.components![0]!;
    expect(component.registry).toMatch(/^remote-/);
    expect(updates.registries).toEqual({
      [component.registry!]: {
        source: "remote",
        url: customRegistrySource.url,
        version: "0.1.0",
      },
    });
  });

  it("reuses existing custom styled registry catalog entries for the same source", async () => {
    const customRegistrySource = {
      type: "remote" as const,
      url: "https://example.com/custom-registry.json",
    };

    await installRuntimeComponents(["button"], {
      config: {
        ...runtimeConfig,
        registries: {
          "remote-existing": {
            source: "remote",
            url: customRegistrySource.url,
            version: "0.0.1",
          },
        },
      },
      packageManager: "pnpm",
      registryMode: "custom",
      registrySource: customRegistrySource,
      skipPrompts: true,
    });

    const [updates] = mockUpdateConfig.mock.calls.at(-1)!;
    expect(updates.components).toEqual([
      {
        name: "button",
        version: "2.0.0",
        framework: "react",
        registry: "remote-existing",
      },
    ]);
    expect(updates.registries).toEqual({
      "remote-existing": {
        source: "remote",
        url: customRegistrySource.url,
        version: "0.1.0",
      },
    });
  });

  it("installs Astro styled target packages through the Astro adapter only", async () => {
    mockLoadRegistry.mockResolvedValue({
      ...registryFixture,
      components: [
        {
          ...registryFixture.components[0],
          targets: {
            astro: {
              files: [
                {
                  path: "src/components/starwind/button/Button.astro",
                  content: "---\n---\n<button><slot /></button>\n",
                },
              ],
              componentDependencies: [],
              packageRequirements: [{ name: "@starwind-ui/astro", range: "^1.0.0" }],
            },
          },
        },
      ],
    });

    const result = await installRuntimeComponents(["button"], {
      config: {
        ...runtimeConfig,
        framework: "astro",
      },
      packageManager: "pnpm",
      skipPrompts: true,
    });

    expect(result.failed).toEqual([]);
    expect(result.installed).toEqual([{ name: "button", status: "installed", version: "2.0.0" }]);
    expect(mockInstallDependencies).toHaveBeenCalledWith(["@starwind-ui/astro@^1.0.0"], "pnpm");
  });

  it("installs alternative-framework styled components into framework-specific directories", async () => {
    const result = await installRuntimeComponents(["button"], {
      config: {
        ...runtimeConfig,
        framework: "astro",
        components: [{ name: "button", version: "1.0.0", framework: "astro" }],
      },
      framework: "react",
      packageManager: "pnpm",
      skipPrompts: true,
    });

    expect(result.failed).toEqual([]);
    expect(result.installed).toEqual([{ name: "button", status: "installed", version: "2.0.0" }]);
    await expect(
      readFile(
        join(tempDir, "src", "components", "starwind-react", "button", "index.tsx"),
        "utf-8",
      ),
    ).resolves.toContain("export function Button");
    expect(mockInstallDependencies).toHaveBeenCalledWith(["@starwind-ui/react@^1.0.0"], "pnpm");
    expect(mockUpdateConfig).toHaveBeenCalledWith(
      {
        componentDirs: {
          react: "src/components/starwind-react",
        },
        components: [
          {
            name: "button",
            version: "2.0.0",
            framework: "react",
            registry: "default",
          },
        ],
      },
      { appendComponents: true },
    );
  });

  it("uses configured alternative-framework styled component directories", async () => {
    const result = await installRuntimeComponents(["button"], {
      config: {
        ...runtimeConfig,
        framework: "astro",
        componentDirs: {
          react: "src/vendor/starwind-react",
        },
      },
      framework: "react",
      packageManager: "pnpm",
      skipPrompts: true,
    });

    expect(result.failed).toEqual([]);
    await expect(
      readFile(join(tempDir, "src", "vendor", "starwind-react", "button", "index.tsx"), "utf-8"),
    ).resolves.toContain("export function Button");
    expect(mockUpdateConfig).toHaveBeenCalledWith(
      {
        componentDirs: {
          react: "src/vendor/starwind-react",
        },
        components: [
          {
            name: "button",
            version: "2.0.0",
            framework: "react",
            registry: "default",
          },
        ],
      },
      { appendComponents: true },
    );
  });

  it("installs target-scoped Starwind component dependencies before the requested component", async () => {
    mockLoadRegistry.mockResolvedValue({
      ...registryFixture,
      components: [
        {
          name: "separator",
          version: "1.0.0",
          type: "component",
          dependencies: [],
          targets: {
            react: {
              files: [
                {
                  path: "src/components/starwind/separator/index.tsx",
                  content: "export function Separator() { return null; }\n",
                },
              ],
              componentDependencies: [],
              packageRequirements: [{ name: "@starwind-ui/react", range: "^1.0.0" }],
            },
          },
        },
        {
          ...registryFixture.components[0],
          targets: {
            react: {
              ...registryFixture.components[0].targets!.react!,
              componentDependencies: ["separator"],
            },
          },
        },
      ],
    });

    const result = await installRuntimeComponents(["button"], {
      config: runtimeConfig,
      packageManager: "pnpm",
      skipPrompts: true,
    });

    expect(result.installed.map((item) => item.name)).toEqual(["separator", "button"]);
    await expect(
      readFile(join(tempDir, "src", "components", "starwind", "separator", "index.tsx"), "utf-8"),
    ).resolves.toContain("Separator");
    expect(mockUpdateConfig).toHaveBeenCalledWith(
      {
        components: [
          {
            name: "separator",
            version: "1.0.0",
            framework: "react",
            registry: "default",
          },
          {
            name: "button",
            version: "2.0.0",
            framework: "react",
            registry: "default",
          },
        ],
      },
      { appendComponents: true },
    );
  });

  it.each([
    {
      components: [createRegistryComponent("a", ["a"])],
      expectedChain: "a -> a",
    },
    {
      components: [createRegistryComponent("a", ["b"]), createRegistryComponent("b", ["a"])],
      expectedChain: "a -> b -> a",
    },
    {
      components: [
        createRegistryComponent("a", ["b"]),
        createRegistryComponent("b", ["c"]),
        createRegistryComponent("c", ["a"]),
      ],
      expectedChain: "a -> b -> c -> a",
    },
  ])(
    "rejects the styled dependency cycle $expectedChain before side effects",
    async ({ components, expectedChain }) => {
      mockLoadRegistry.mockResolvedValue({
        ...registryFixture,
        components,
      });

      const result = await installRuntimeComponents(["a"], {
        config: runtimeConfig,
        packageManager: "pnpm",
        skipPrompts: true,
      });

      expect(result).toEqual({
        failed: [
          {
            error: `Dependency cycle detected in styled component dependencies: ${expectedChain}`,
            name: "a",
            status: "failed",
          },
        ],
        installed: [],
        skipped: [],
      });
      await expect(stat(join(tempDir, "src", "components", "starwind"))).rejects.toThrow();
      expect(mockFilterUninstalledDependencies).not.toHaveBeenCalled();
      expect(mockInstallDependencies).not.toHaveBeenCalled();
      expect(mockUpdateConfig).not.toHaveBeenCalled();
    },
    1_000,
  );

  it("plans a shared styled dependency once in dependency-first order", async () => {
    mockLoadRegistry.mockResolvedValue({
      ...registryFixture,
      components: [
        createRegistryComponent("a", ["b", "c"]),
        createRegistryComponent("b", ["d"]),
        createRegistryComponent("c", ["d"]),
        createRegistryComponent("d"),
      ],
    });

    const result = await installRuntimeComponents(["a"], {
      config: runtimeConfig,
      packageManager: "pnpm",
      skipPrompts: true,
    });

    expect(result.installed.map(({ name }) => name)).toEqual(["d", "b", "c", "a"]);
    expect(mockInstallDependencies).toHaveBeenCalledWith(["@starwind-ui/react@^1.0.0"], "pnpm");
  });

  it("blocks a requested component when a newly planned dependency has a file conflict", async () => {
    mockLoadRegistry.mockResolvedValue({
      ...registryFixture,
      components: [
        {
          name: "separator",
          version: "1.0.0",
          type: "component",
          dependencies: [],
          targets: {
            react: {
              files: [
                {
                  path: "src/components/starwind/separator/index.tsx",
                  content: "export function Separator() { return null; }\n",
                },
              ],
              componentDependencies: [],
              packageRequirements: [{ name: "@starwind-ui/react", range: "^1.0.0" }],
            },
          },
        },
        {
          ...registryFixture.components[0],
          targets: {
            react: {
              ...registryFixture.components[0].targets!.react!,
              componentDependencies: ["separator"],
            },
          },
        },
      ],
    });
    const separatorDestination = join(
      tempDir,
      "src",
      "components",
      "starwind",
      "separator",
      "index.tsx",
    );
    const buttonDestination = join(tempDir, "src", "components", "starwind", "button", "index.tsx");
    await mkdir(dirname(separatorDestination), { recursive: true });
    await writeFile(separatorDestination, "export const locallyCustomized = true;\n", "utf-8");

    const result = await installRuntimeComponents(["button"], {
      config: runtimeConfig,
      packageManager: "pnpm",
      skipPrompts: true,
    });

    expect(result).toEqual({
      failed: [],
      installed: [],
      skipped: [
        {
          error:
            "Existing file conflicts: src/components/starwind/separator/index.tsx. Re-run with --overwrite to replace it.",
          name: "separator",
          status: "skipped",
          version: "1.0.0",
        },
        {
          error:
            'Required component "separator" was skipped: Existing file conflicts: src/components/starwind/separator/index.tsx. Re-run with --overwrite to replace it.',
          name: "button",
          status: "skipped",
          version: "2.0.0",
        },
      ],
    });
    await expect(readFile(buttonDestination, "utf-8")).rejects.toThrow();
    expect(mockInstallDependencies).not.toHaveBeenCalled();
    expect(mockUpdateConfig).not.toHaveBeenCalled();
  });

  it("treats an already configured dependency as satisfied", async () => {
    mockLoadRegistry.mockResolvedValue({
      ...registryFixture,
      components: [
        {
          name: "separator",
          version: "1.0.0",
          type: "component",
          dependencies: [],
          targets: {
            react: {
              files: [
                {
                  path: "src/components/starwind/separator/index.tsx",
                  content: "export function Separator() { return null; }\n",
                },
              ],
              componentDependencies: [],
              packageRequirements: [{ name: "separator-package", range: "^1.0.0" }],
            },
          },
        },
        {
          ...registryFixture.components[0],
          targets: {
            react: {
              ...registryFixture.components[0].targets!.react!,
              componentDependencies: ["separator"],
            },
          },
        },
      ],
    });
    const separatorDestination = join(
      tempDir,
      "src",
      "components",
      "starwind",
      "separator",
      "index.tsx",
    );
    await mkdir(dirname(separatorDestination), { recursive: true });
    await writeFile(separatorDestination, "export const locallyCustomized = true;\n", "utf-8");

    const result = await installRuntimeComponents(["button"], {
      config: {
        ...runtimeConfig,
        components: [{ framework: "react", name: "separator", version: "0.9.0" }],
      },
      packageManager: "pnpm",
      skipPrompts: true,
    });

    expect(result).toEqual({
      failed: [],
      installed: [{ name: "button", status: "installed", version: "2.0.0" }],
      skipped: [{ name: "separator", status: "skipped", version: "1.0.0" }],
    });
    expect(mockInstallDependencies).toHaveBeenCalledWith(["@starwind-ui/react@^1.0.0"], "pnpm");
    expect(mockUpdateConfig).toHaveBeenCalledWith(
      {
        components: [
          {
            framework: "react",
            name: "button",
            registry: "default",
            version: "2.0.0",
          },
        ],
      },
      { appendComponents: true },
    );
  });

  it("refuses unsupported configured targets before writing files", async () => {
    const result = await installRuntimeComponents(["button"], {
      config: {
        ...runtimeConfig,
        framework: undefined,
      },
      packageManager: "pnpm",
      skipPrompts: true,
    });

    expect(result.installed).toEqual([]);
    expect(result.failed).toEqual([
      {
        name: "button",
        status: "failed",
        error: expect.stringContaining("framework"),
      },
    ]);
    expect(mockUpdateConfig).not.toHaveBeenCalled();
  });

  it("rejects registry files outside the configured component directory before installing packages", async () => {
    mockLoadRegistry.mockResolvedValue({
      ...registryFixture,
      components: [
        {
          ...registryFixture.components[0],
          targets: {
            react: {
              ...registryFixture.components[0].targets!.react!,
              files: [
                {
                  path: "src/main.ts",
                  content: "console.log('not a component');\n",
                },
              ],
            },
          },
        },
      ],
    });

    const result = await installRuntimeComponents(["button"], {
      config: runtimeConfig,
      packageManager: "pnpm",
      skipPrompts: true,
    });

    expect(result.installed).toEqual([]);
    expect(result.failed).toEqual([
      {
        name: "button",
        status: "failed",
        error: expect.stringContaining("src/components/starwind/button"),
      },
    ]);
    expect(mockInstallDependencies).not.toHaveBeenCalled();
    expect(mockUpdateConfig).not.toHaveBeenCalled();
    await expect(readFile(join(tempDir, "src", "main.ts"), "utf-8")).rejects.toThrow();
  });

  it("validates all planned file payloads before installing packages", async () => {
    mockLoadRegistry.mockResolvedValue({
      ...registryFixture,
      components: [
        {
          ...registryFixture.components[0],
          targets: {
            react: {
              ...registryFixture.components[0].targets!.react!,
              files: [
                {
                  path: "src/components/starwind/button/index.tsx",
                  sourcePath: "generated/button/index.tsx",
                },
              ],
            },
          },
        },
      ],
    });

    const result = await installRuntimeComponents(["button"], {
      config: runtimeConfig,
      packageManager: "pnpm",
      skipPrompts: true,
    });

    expect(result.installed).toEqual([]);
    expect(result.failed).toEqual([
      {
        name: "button",
        status: "failed",
        error: expect.stringContaining("inline content"),
      },
    ]);
    expect(mockInstallDependencies).not.toHaveBeenCalled();
    expect(mockUpdateConfig).not.toHaveBeenCalled();
  });

  it("marks a styled component failed when its prepared file cannot be written", async () => {
    const destination = join(tempDir, "src", "components", "starwind", "button", "index.tsx");
    mockFilterUninstalledDependencies.mockImplementationOnce(async (packages) => {
      await mkdir(destination, { recursive: true });
      return packages;
    });

    const result = await installRuntimeComponents(["button"], {
      config: runtimeConfig,
      packageManager: "pnpm",
      skipPrompts: true,
    });

    expect(result.installed).toEqual([]);
    expect(result.skipped).toEqual([]);
    expect(result.failed).toEqual([
      {
        error: expect.any(String),
        name: "button",
        status: "failed",
      },
    ]);
    expect(mockInstallDependencies).toHaveBeenCalledWith(["@starwind-ui/react@^1.0.0"], "pnpm");
    expect(mockUpdateConfig).not.toHaveBeenCalled();
  });

  it("rechecks prepared files immediately before writing", async () => {
    const destination = join(tempDir, "src", "components", "starwind", "button", "index.tsx");
    mockFilterUninstalledDependencies.mockImplementationOnce(async (packages) => {
      await mkdir(dirname(destination), { recursive: true });
      await writeFile(destination, "export const appearedAfterPlanning = true;\n", "utf-8");
      return packages;
    });

    const result = await installRuntimeComponents(["button"], {
      config: runtimeConfig,
      packageManager: "pnpm",
      skipPrompts: true,
    });

    expect(result).toEqual({
      failed: [],
      installed: [],
      skipped: [
        {
          error:
            "Existing file conflicts: src/components/starwind/button/index.tsx. Re-run with --overwrite to replace it.",
          name: "button",
          status: "skipped",
          version: "2.0.0",
        },
      ],
    });
    await expect(readFile(destination, "utf-8")).resolves.toBe(
      "export const appearedAfterPlanning = true;\n",
    );
    expect(mockInstallDependencies).toHaveBeenCalledWith(["@starwind-ui/react@^1.0.0"], "pnpm");
    expect(mockUpdateConfig).not.toHaveBeenCalled();
  });

  it("rejects conflicting package requirement ranges before installing packages", async () => {
    mockLoadRegistry.mockResolvedValue({
      ...registryFixture,
      components: [
        {
          name: "separator",
          version: "1.0.0",
          type: "component",
          dependencies: [],
          targets: {
            react: {
              files: [
                {
                  path: "src/components/starwind/separator/index.tsx",
                  content: "export function Separator() { return null; }\n",
                },
              ],
              componentDependencies: [],
              packageRequirements: [{ name: "@starwind-ui/react", range: "^1.0.0" }],
            },
          },
        },
        {
          ...registryFixture.components[0],
          targets: {
            react: {
              ...registryFixture.components[0].targets!.react!,
              componentDependencies: ["separator"],
              packageRequirements: [{ name: "@starwind-ui/react", range: "^2.0.0" }],
            },
          },
        },
      ],
    });

    const result = await installRuntimeComponents(["button"], {
      config: runtimeConfig,
      packageManager: "pnpm",
      skipPrompts: true,
    });

    expect(result.installed).toEqual([]);
    expect(result.failed).toEqual([
      {
        name: "button",
        status: "failed",
        error: expect.stringContaining("@starwind-ui/react"),
      },
    ]);
    expect(mockInstallDependencies).not.toHaveBeenCalled();
    expect(mockUpdateConfig).not.toHaveBeenCalled();
  });

  it("updates only requested styled component files and metadata when packages are already satisfied", async () => {
    const currentConfig: StarwindConfig = {
      ...runtimeConfig,
      components: [
        {
          name: "button",
          version: "1.0.0",
          framework: "react",
        },
        {
          name: "card",
          version: "1.0.0",
          framework: "react",
        },
      ],
    };
    await mkdir(dirname(join(tempDir, "src", "components", "starwind", "button", "index.tsx")), {
      recursive: true,
    });
    await writeFile(
      join(tempDir, "src", "components", "starwind", "button", "index.tsx"),
      "export function Button() { return 'old'; }\n",
      "utf-8",
    );
    mockFilterUninstalledDependencies.mockResolvedValue([]);

    const result = await updateRuntimeComponents(["button"], {
      config: currentConfig,
      packageManager: "pnpm",
      skipPrompts: true,
    });

    expect(result.updated).toEqual([
      {
        name: "button",
        status: "updated",
        oldVersion: "1.0.0",
        newVersion: "2.0.0",
      },
    ]);
    await expect(
      readFile(join(tempDir, "src", "components", "starwind", "button", "index.tsx"), "utf-8"),
    ).resolves.toContain("return null");
    expect(mockInstallDependencies).not.toHaveBeenCalled();
    expect(mockUpdateConfig).toHaveBeenCalledWith(
      {
        components: [
          {
            name: "button",
            version: "2.0.0",
            framework: "react",
            registry: "default",
          },
          {
            name: "card",
            version: "1.0.0",
            framework: "react",
          },
        ],
      },
      { appendComponents: false },
    );
  });

  it("updates an explicit alternative-framework styled entry without replacing the primary-framework entry", async () => {
    mockLoadRegistry.mockResolvedValue({
      ...registryFixture,
      components: [
        {
          ...registryFixture.components[0],
          targets: {
            astro: {
              files: [
                {
                  path: "src/components/starwind/button/Button.astro",
                  content: "---\n---\n<button>new astro</button>\n",
                },
              ],
              componentDependencies: [],
              packageRequirements: [{ name: "@starwind-ui/astro", range: "^1.0.0" }],
            },
            react: registryFixture.components[0].targets!.react!,
          },
        },
      ],
    });
    const currentConfig: StarwindConfig = {
      ...runtimeConfig,
      framework: "astro",
      componentDirs: {
        react: "src/components/starwind-react",
      },
      components: [
        {
          name: "button",
          version: "1.0.0",
          framework: "astro",
          registry: "default",
        },
        {
          name: "button",
          version: "1.0.0",
          framework: "react",
          registry: "default",
        },
      ],
    };
    const astroPath = join(tempDir, "src", "components", "starwind", "button", "Button.astro");
    const reactPath = join(tempDir, "src", "components", "starwind-react", "button", "index.tsx");
    await mkdir(dirname(astroPath), { recursive: true });
    await mkdir(dirname(reactPath), { recursive: true });
    await writeFile(astroPath, "---\n---\n<button>old astro</button>\n", "utf-8");
    await writeFile(reactPath, "export function Button() { return 'old react'; }\n", "utf-8");
    mockFilterUninstalledDependencies.mockResolvedValue([]);

    const result = await updateRuntimeComponents(["button"], {
      config: currentConfig,
      framework: "react",
      packageManager: "pnpm",
      skipPrompts: true,
    });

    expect(result.updated).toEqual([
      {
        name: "button",
        framework: "react",
        status: "updated",
        oldVersion: "1.0.0",
        newVersion: "2.0.0",
      },
    ]);
    await expect(readFile(astroPath, "utf-8")).resolves.toContain("old astro");
    await expect(readFile(reactPath, "utf-8")).resolves.toContain("return null");
    expect(mockUpdateConfig).toHaveBeenCalledWith(
      {
        components: [
          {
            name: "button",
            version: "1.0.0",
            framework: "astro",
            registry: "default",
          },
          {
            name: "button",
            version: "2.0.0",
            framework: "react",
            registry: "default",
          },
        ],
      },
      { appendComponents: false },
    );
  });

  it("updates every installed framework target for a styled component when requested", async () => {
    mockLoadRegistry.mockResolvedValue({
      ...registryFixture,
      components: [
        {
          ...registryFixture.components[0],
          targets: {
            astro: {
              files: [
                {
                  path: "src/components/starwind/button/Button.astro",
                  content: "---\n---\n<button>new astro</button>\n",
                },
              ],
              componentDependencies: [],
              packageRequirements: [{ name: "@starwind-ui/astro", range: "^1.0.0" }],
            },
            react: registryFixture.components[0].targets!.react!,
          },
        },
      ],
    });
    const currentConfig: StarwindConfig = {
      ...runtimeConfig,
      framework: "astro",
      componentDirs: {
        react: "src/components/starwind-react",
      },
      components: [
        {
          name: "button",
          version: "1.0.0",
          framework: "astro",
          registry: "default",
        },
        {
          name: "button",
          version: "1.0.0",
          framework: "react",
          registry: "default",
        },
      ],
    };
    const astroPath = join(tempDir, "src", "components", "starwind", "button", "Button.astro");
    const reactPath = join(tempDir, "src", "components", "starwind-react", "button", "index.tsx");
    await mkdir(dirname(astroPath), { recursive: true });
    await mkdir(dirname(reactPath), { recursive: true });
    await writeFile(astroPath, "---\n---\n<button>old astro</button>\n", "utf-8");
    await writeFile(reactPath, "export function Button() { return 'old react'; }\n", "utf-8");
    mockFilterUninstalledDependencies.mockResolvedValue([]);

    const result = await updateRuntimeComponents(["button"], {
      config: currentConfig,
      framework: "all",
      packageManager: "pnpm",
      skipPrompts: true,
    });

    expect(result.updated).toEqual([
      {
        name: "button",
        framework: "astro",
        status: "updated",
        oldVersion: "1.0.0",
        newVersion: "2.0.0",
      },
      {
        name: "button",
        framework: "react",
        status: "updated",
        oldVersion: "1.0.0",
        newVersion: "2.0.0",
      },
    ]);
    await expect(readFile(astroPath, "utf-8")).resolves.toContain("new astro");
    await expect(readFile(reactPath, "utf-8")).resolves.toContain("return null");
  });

  it("installs adapter package requirements before a styled update when prompts are skipped", async () => {
    const currentConfig: StarwindConfig = {
      ...runtimeConfig,
      components: [
        {
          name: "button",
          version: "1.0.0",
          framework: "react",
        },
      ],
    };
    const targetPath = join(tempDir, "src", "components", "starwind", "button", "index.tsx");
    await mkdir(dirname(targetPath), { recursive: true });
    await writeFile(targetPath, "export function Button() { return 'old'; }\n", "utf-8");
    mockFilterUninstalledDependencies.mockResolvedValue(["@starwind-ui/react@^1.0.0"]);

    const result = await updateRuntimeComponents(["button"], {
      config: currentConfig,
      packageManager: "pnpm",
      skipPrompts: true,
    });

    expect(result.updated).toEqual([
      {
        name: "button",
        status: "updated",
        oldVersion: "1.0.0",
        newVersion: "2.0.0",
      },
    ]);
    expect(mockInstallDependencies).toHaveBeenCalledWith(["@starwind-ui/react@^1.0.0"], "pnpm");
    expect(mockConfirm).not.toHaveBeenCalled();
    await expect(readFile(targetPath, "utf-8")).resolves.toContain("return null");
  });

  it("continues updating valid components when another requested component fails planning", async () => {
    const currentConfig: StarwindConfig = {
      ...runtimeConfig,
      components: [
        {
          name: "button",
          version: "1.0.0",
          framework: "react",
        },
        {
          name: "card",
          version: "1.0.0",
          framework: "react",
        },
      ],
    };
    const targetPath = join(tempDir, "src", "components", "starwind", "button", "index.tsx");
    await mkdir(dirname(targetPath), { recursive: true });
    await writeFile(targetPath, "export function Button() { return 'old'; }\n", "utf-8");
    mockFilterUninstalledDependencies.mockResolvedValue([]);

    const result = await updateRuntimeComponents(["button", "card"], {
      config: currentConfig,
      packageManager: "pnpm",
      skipPrompts: true,
    });

    expect(result.failed).toEqual([
      {
        name: "card",
        status: "failed",
        error: 'Component not found in registry "default"',
      },
    ]);
    expect(result.updated).toEqual([
      {
        name: "button",
        status: "updated",
        oldVersion: "1.0.0",
        newVersion: "2.0.0",
      },
    ]);
    await expect(readFile(targetPath, "utf-8")).resolves.toContain("return null");
    expect(mockUpdateConfig).toHaveBeenCalledWith(
      {
        components: [
          {
            name: "button",
            version: "2.0.0",
            framework: "react",
            registry: "default",
          },
          {
            name: "card",
            version: "1.0.0",
            framework: "react",
          },
        ],
      },
      { appendComponents: false },
    );
  });

  it("installs shared package requirements once across a multi-component styled update", async () => {
    mockLoadRegistry.mockResolvedValue({
      ...registryFixture,
      components: [
        registryFixture.components[0],
        {
          name: "card",
          version: "2.0.0",
          type: "component",
          dependencies: [],
          targets: {
            react: {
              files: [
                {
                  path: "src/components/starwind/card/index.tsx",
                  content: "export function Card() { return null; }\n",
                },
              ],
              componentDependencies: [],
              packageRequirements: [{ name: "@starwind-ui/react", range: "^1.0.0" }],
            },
          },
        },
      ],
    });
    const currentConfig: StarwindConfig = {
      ...runtimeConfig,
      components: [
        {
          name: "button",
          version: "1.0.0",
          framework: "react",
        },
        {
          name: "card",
          version: "1.0.0",
          framework: "react",
        },
      ],
    };
    const buttonPath = join(tempDir, "src", "components", "starwind", "button", "index.tsx");
    const cardPath = join(tempDir, "src", "components", "starwind", "card", "index.tsx");
    await mkdir(dirname(buttonPath), { recursive: true });
    await mkdir(dirname(cardPath), { recursive: true });
    await writeFile(buttonPath, "export function Button() { return 'old'; }\n", "utf-8");
    await writeFile(cardPath, "export function Card() { return 'old'; }\n", "utf-8");
    mockFilterUninstalledDependencies.mockResolvedValue(["@starwind-ui/react@^1.0.0"]);

    const result = await updateRuntimeComponents(["button", "card"], {
      config: currentConfig,
      packageManager: "pnpm",
      skipPrompts: true,
    });

    expect(result.failed).toEqual([]);
    expect(result.updated.map((item) => item.name)).toEqual(["button", "card"]);
    expect(mockInstallDependencies).toHaveBeenCalledTimes(1);
    expect(mockInstallDependencies).toHaveBeenCalledWith(["@starwind-ui/react@^1.0.0"], "pnpm");
    await expect(readFile(buttonPath, "utf-8")).resolves.toContain("return null");
    await expect(readFile(cardPath, "utf-8")).resolves.toContain("return null");
  });

  it("updates styled components from their recorded registries", async () => {
    const customRegistry: StarwindRegistry = {
      ...registryFixture,
      version: "0.2.0",
      components: [
        {
          name: "card",
          version: "3.0.0",
          type: "component",
          dependencies: [],
          targets: {
            react: {
              files: [
                {
                  path: "src/components/starwind/card/index.tsx",
                  content: "export function Card() { return 'custom'; }\n",
                },
              ],
              componentDependencies: [],
              packageRequirements: [{ name: "@starwind-ui/react", range: "^1.0.0" }],
            },
          },
        },
      ],
    };
    mockLoadRegistry.mockImplementation(async (source) =>
      source?.type === "remote" ? customRegistry : registryFixture,
    );
    mockFilterUninstalledDependencies.mockResolvedValue([]);
    const currentConfig: StarwindConfig = {
      ...runtimeConfig,
      registries: {
        "remote-custom": {
          source: "remote",
          url: "https://example.com/custom-registry.json",
          version: "0.2.0",
        },
      },
      components: [
        {
          name: "button",
          version: "1.0.0",
          framework: "react",
          registry: "default",
        },
        {
          name: "card",
          version: "1.0.0",
          framework: "react",
          registry: "remote-custom",
        },
      ],
    };
    const buttonPath = join(tempDir, "src", "components", "starwind", "button", "index.tsx");
    const cardPath = join(tempDir, "src", "components", "starwind", "card", "index.tsx");
    await mkdir(dirname(buttonPath), { recursive: true });
    await mkdir(dirname(cardPath), { recursive: true });
    await writeFile(buttonPath, "export function Button() { return 'old'; }\n", "utf-8");
    await writeFile(cardPath, "export function Card() { return 'old'; }\n", "utf-8");

    const result = await updateRuntimeComponents(["button", "card"], {
      config: currentConfig,
      packageManager: "pnpm",
      skipPrompts: true,
    });

    expect(result.failed).toEqual([]);
    expect(result.updated.map((item) => item.name)).toEqual(["button", "card"]);
    expect(mockLoadRegistry).toHaveBeenCalledWith({ type: "bundled" });
    expect(mockLoadRegistry).toHaveBeenCalledWith({
      type: "remote",
      url: "https://example.com/custom-registry.json",
    });
    await expect(readFile(buttonPath, "utf-8")).resolves.toContain("return null");
    await expect(readFile(cardPath, "utf-8")).resolves.toContain("custom");
    expect(mockUpdateConfig).toHaveBeenCalledWith(
      {
        components: [
          {
            name: "button",
            version: "2.0.0",
            framework: "react",
            registry: "default",
          },
          {
            name: "card",
            version: "3.0.0",
            framework: "react",
            registry: "remote-custom",
          },
        ],
      },
      { appendComponents: false },
    );
  });

  it("reports clear failures when an installed component references a missing styled registry", async () => {
    const plan = await planRuntimeComponentUpdates(["card"], {
      config: {
        ...runtimeConfig,
        components: [
          {
            name: "card",
            version: "1.0.0",
            framework: "react",
            registry: "remote-missing",
          },
        ],
      },
      packageManager: "pnpm",
      skipPrompts: true,
    });

    expect(plan.updates).toEqual([]);
    expect(plan.failed).toEqual([
      {
        name: "card",
        status: "failed",
        error: 'Styled registry "remote-missing" is not configured.',
      },
    ]);
  });

  it("reports clear failures when a recorded styled registry cannot be loaded", async () => {
    mockLoadRegistry.mockRejectedValueOnce(new Error("network down"));

    const plan = await planRuntimeComponentUpdates(["button"], {
      config: {
        ...runtimeConfig,
        components: [
          {
            name: "button",
            version: "1.0.0",
            framework: "react",
            registry: "default",
          },
        ],
      },
      packageManager: "pnpm",
      skipPrompts: true,
    });

    expect(plan.updates).toEqual([]);
    expect(plan.failed).toEqual([
      {
        name: "button",
        status: "failed",
        error: 'Failed to load styled registry "default": network down',
      },
    ]);
  });

  it("updates with an explicit registry override and records the override source", async () => {
    const overrideRegistry: StarwindRegistry = {
      ...registryFixture,
      version: "0.2.0",
      components: [
        {
          ...registryFixture.components[0],
          version: "3.0.0",
          targets: {
            react: {
              files: [
                {
                  path: "src/components/starwind/button/index.tsx",
                  content: "export function Button() { return 'override'; }\n",
                },
              ],
              componentDependencies: [],
              packageRequirements: [{ name: "@starwind-ui/react", range: "^1.0.0" }],
            },
          },
        },
      ],
    };
    mockLoadRegistry.mockResolvedValue(overrideRegistry);
    mockFilterUninstalledDependencies.mockResolvedValue([]);
    const targetPath = join(tempDir, "src", "components", "starwind", "button", "index.tsx");
    await mkdir(dirname(targetPath), { recursive: true });
    await writeFile(targetPath, "export function Button() { return 'old'; }\n", "utf-8");
    const overrideSource = {
      type: "remote" as const,
      url: "https://example.com/override-registry.json",
    };

    const result = await updateRuntimeComponents(["button"], {
      config: {
        ...runtimeConfig,
        components: [
          {
            name: "button",
            version: "1.0.0",
            framework: "react",
            registry: "default",
          },
        ],
      },
      packageManager: "pnpm",
      registrySource: overrideSource,
      skipPrompts: true,
    });

    expect(result.failed).toEqual([]);
    const [updates] = mockUpdateConfig.mock.calls.at(-1)!;
    const componentRegistry = updates.components![0]!.registry!;
    expect(componentRegistry).toMatch(/^remote-/);
    expect(updates).toEqual({
      components: [
        {
          name: "button",
          version: "3.0.0",
          framework: "react",
          registry: componentRegistry,
        },
      ],
      registries: {
        [componentRegistry]: {
          source: "remote",
          url: overrideSource.url,
          version: "0.2.0",
        },
      },
    });
    await expect(readFile(targetPath, "utf-8")).resolves.toContain("override");
  });

  it("fails conflicted update components before installing incompatible package requirements", async () => {
    mockLoadRegistry.mockResolvedValue({
      ...registryFixture,
      components: [
        registryFixture.components[0],
        {
          name: "card",
          version: "2.0.0",
          type: "component",
          dependencies: [],
          targets: {
            react: {
              files: [
                {
                  path: "src/components/starwind/card/index.tsx",
                  content: "export function Card() { return null; }\n",
                },
              ],
              componentDependencies: [],
              packageRequirements: [{ name: "@starwind-ui/react", range: "^2.0.0" }],
            },
          },
        },
      ],
    });
    const currentConfig: StarwindConfig = {
      ...runtimeConfig,
      components: [
        {
          name: "button",
          version: "1.0.0",
          framework: "react",
        },
        {
          name: "card",
          version: "1.0.0",
          framework: "react",
        },
      ],
    };
    const buttonPath = join(tempDir, "src", "components", "starwind", "button", "index.tsx");
    const cardPath = join(tempDir, "src", "components", "starwind", "card", "index.tsx");
    await mkdir(dirname(buttonPath), { recursive: true });
    await mkdir(dirname(cardPath), { recursive: true });
    await writeFile(buttonPath, "export function Button() { return 'old'; }\n", "utf-8");
    await writeFile(cardPath, "export function Card() { return 'old'; }\n", "utf-8");

    const result = await updateRuntimeComponents(["button", "card"], {
      config: currentConfig,
      packageManager: "pnpm",
      skipPrompts: true,
    });

    expect(result.updated).toEqual([]);
    expect(result.failed).toEqual([
      expect.objectContaining({
        name: "button",
        status: "failed",
        error: expect.stringContaining("Conflicting package requirements for @starwind-ui/react"),
      }),
      expect.objectContaining({
        name: "card",
        status: "failed",
        error: expect.stringContaining("Conflicting package requirements for @starwind-ui/react"),
      }),
    ]);
    expect(mockInstallDependencies).not.toHaveBeenCalled();
    expect(mockUpdateConfig).not.toHaveBeenCalled();
    await expect(readFile(buttonPath, "utf-8")).resolves.toContain("return 'old'");
    await expect(readFile(cardPath, "utf-8")).resolves.toContain("return 'old'");
  });

  it("plans styled updates without writing files, installing packages, or updating config", async () => {
    const currentConfig: StarwindConfig = {
      ...runtimeConfig,
      components: [
        {
          name: "button",
          version: "1.0.0",
          framework: "react",
        },
      ],
    };
    const targetPath = join(tempDir, "src", "components", "starwind", "button", "index.tsx");
    await mkdir(dirname(targetPath), { recursive: true });
    await writeFile(targetPath, "export function Button() { return 'old'; }\n", "utf-8");
    mockFilterUninstalledDependencies.mockResolvedValue(["@starwind-ui/react@^1.0.0"]);

    const plan = await planRuntimeComponentUpdates(["button"], {
      config: currentConfig,
      packageManager: "pnpm",
      skipPrompts: true,
    });

    expect(plan.failed).toEqual([]);
    expect(plan.updates).toHaveLength(1);
    expect(plan.packageRequirements).toEqual([{ name: "@starwind-ui/react", range: "^1.0.0" }]);
    expect(plan.packagesToInstall).toEqual(["@starwind-ui/react@^1.0.0"]);
    const update = plan.updates[0]!;
    expect(update.files).toEqual([
      expect.objectContaining({
        path: "src/components/starwind/button/index.tsx",
        currentContent: "export function Button() { return 'old'; }\n",
        content: "export function Button() { return null; }\n",
        changed: true,
      }),
    ]);
    await expect(readFile(targetPath, "utf-8")).resolves.toContain("return 'old'");
    expect(mockInstallDependencies).not.toHaveBeenCalled();
    expect(mockUpdateConfig).not.toHaveBeenCalled();
  });

  it("warns and skips a styled update when new package requirements are declined", async () => {
    const currentConfig: StarwindConfig = {
      ...runtimeConfig,
      components: [
        {
          name: "button",
          version: "1.0.0",
          framework: "react",
        },
      ],
    };
    const targetPath = join(tempDir, "src", "components", "starwind", "button", "index.tsx");
    await mkdir(dirname(targetPath), { recursive: true });
    await writeFile(targetPath, "export function Button() { return 'old'; }\n", "utf-8");
    mockFilterUninstalledDependencies.mockResolvedValue(["@starwind-ui/react@^1.0.0"]);
    mockConfirm.mockResolvedValue(false);

    const result = await updateRuntimeComponents(["button"], {
      config: currentConfig,
      packageManager: "pnpm",
      skipPrompts: false,
    });

    expect(mockPromptLog.warn).toHaveBeenCalledWith(
      expect.stringContaining("@starwind-ui/react@^1.0.0"),
    );
    expect(mockConfirm).toHaveBeenCalledWith(
      expect.objectContaining({
        message: expect.stringContaining("Install required package updates"),
      }),
    );
    expect(result.updated).toEqual([]);
    expect(result.skipped).toEqual([
      {
        name: "button",
        status: "skipped",
        oldVersion: "1.0.0",
        newVersion: "2.0.0",
      },
    ]);
    await expect(readFile(targetPath, "utf-8")).resolves.toContain("return 'old'");
    expect(mockInstallDependencies).not.toHaveBeenCalled();
    expect(mockUpdateConfig).not.toHaveBeenCalled();
  });

  it("plans alternative-framework styled update destinations from componentDirs", async () => {
    const currentConfig: StarwindConfig = {
      ...runtimeConfig,
      framework: "astro",
      componentDirs: {
        react: "src/components/starwind-react",
      },
      components: [
        {
          name: "button",
          version: "1.0.0",
          framework: "astro",
          registry: "default",
        },
        {
          name: "button",
          version: "1.0.0",
          framework: "react",
          registry: "default",
        },
      ],
    };
    const targetPath = join(tempDir, "src", "components", "starwind-react", "button", "index.tsx");
    await mkdir(dirname(targetPath), { recursive: true });
    await writeFile(targetPath, "export function Button() { return 'old'; }\n", "utf-8");
    mockFilterUninstalledDependencies.mockResolvedValue([]);

    const plan = await planRuntimeComponentUpdates(["button"], {
      config: currentConfig,
      framework: "react",
      packageManager: "pnpm",
      skipPrompts: true,
    });

    expect(plan.failed).toEqual([]);
    expect(plan.updates).toHaveLength(1);
    expect(plan.updates[0]).toEqual(
      expect.objectContaining({
        framework: "react",
        componentIndex: 1,
      }),
    );
    expect(plan.updates[0]!.files[0]).toEqual(
      expect.objectContaining({
        path: "src/components/starwind-react/button/index.tsx",
        destination: targetPath,
      }),
    );
  });
});
