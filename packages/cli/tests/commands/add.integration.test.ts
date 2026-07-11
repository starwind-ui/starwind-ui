import { mkdir, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { add } from "../../src/commands/add.js";

vi.mock("@clack/prompts", () => ({
  intro: vi.fn(),
  outro: vi.fn(),
  cancel: vi.fn(),
  confirm: vi.fn(),
  isCancel: vi.fn().mockReturnValue(false),
  tasks: vi.fn(),
  note: vi.fn(),
  multiselect: vi.fn(),
  log: {
    error: vi.fn(),
    warn: vi.fn(),
    warning: vi.fn(),
    info: vi.fn(),
    success: vi.fn(),
    message: vi.fn(),
    step: vi.fn(),
  },
}));

vi.mock("../../src/utils/sleep.js", () => ({
  sleep: vi.fn().mockResolvedValue(undefined),
}));

vi.mock("../../src/utils/registry.js", () => ({
  getConfiguredRegistrySource: vi.fn(() => ({ type: "bundled" })),
  loadRegistry: vi.fn(),
  parseRegistrySource: vi.fn((value: string | undefined) =>
    value ? { type: "remote", url: value } : undefined,
  ),
}));

vi.mock("../../src/utils/validate.js", () => ({
  isValidComponent: vi.fn(),
}));

vi.mock("../../src/utils/package-manager.js", () => ({
  detectPackageManager: vi.fn(() => ({ name: "npm" })),
  installDependencies: vi.fn(),
}));

import { installDependencies } from "../../src/utils/package-manager.js";
import { loadRegistry, parseRegistrySource } from "../../src/utils/registry.js";
import { isValidComponent } from "../../src/utils/validate.js";
import * as clackPrompts from "@clack/prompts";

const mockInstallDependencies = vi.mocked(installDependencies);
const mockLoadRegistry = vi.mocked(loadRegistry);
const mockParseRegistrySource = vi.mocked(parseRegistrySource);
const mockIsValidComponent = vi.mocked(isValidComponent);
const mockMultiselect = vi.mocked(clackPrompts.multiselect);
const mockPromptLog = vi.mocked(clackPrompts.log);

const defaultRegistryFixture = {
  $schema: "https://starwind.dev/registry-schema.v2.json",
  version: "0.1.0",
  components: [
    {
      name: "button",
      version: "2.1.0",
      dependencies: [],
      type: "component" as const,
      targets: {
        astro: {
          files: [
            {
              path: "src/components/starwind/button/Button.astro",
              content: "---\n---\n<button>default astro</button>\n",
            },
          ],
          componentDependencies: [],
          packageRequirements: [{ name: "@starwind-ui/astro", range: "^1.0.0" }],
        },
        react: {
          files: [
            {
              path: "src/components/starwind/button/index.tsx",
              content: "export function Button() { return 'default'; }\n",
            },
          ],
          componentDependencies: [],
          packageRequirements: [{ name: "@starwind-ui/react", range: "^1.0.0" }],
        },
      },
    },
    {
      name: "card",
      version: "2.1.0",
      dependencies: [],
      type: "component" as const,
      targets: {
        astro: {
          files: [
            {
              path: "src/components/starwind/card/Card.astro",
              content: "---\n---\n<div>default astro card</div>\n",
            },
          ],
          componentDependencies: [],
          packageRequirements: [{ name: "@starwind-ui/astro", range: "^1.0.0" }],
        },
        react: {
          files: [
            {
              path: "src/components/starwind/card/index.tsx",
              content: "export function Card() { return 'default'; }\n",
            },
          ],
          componentDependencies: [],
          packageRequirements: [{ name: "@starwind-ui/react", range: "^1.0.0" }],
        },
      },
    },
  ],
};

const customRegistryFixture = {
  $schema: "https://starwind.dev/registry-schema.v2.json",
  version: "0.2.0",
  components: [
    {
      name: "button",
      version: "3.0.0",
      dependencies: [],
      type: "component" as const,
      targets: {
        react: {
          files: [
            {
              path: "src/components/starwind/button/index.tsx",
              content: "export function Button() { return 'custom'; }\n",
            },
          ],
          componentDependencies: [],
          packageRequirements: [{ name: "@starwind-ui/react", range: "^1.0.0" }],
        },
      },
    },
    {
      name: "custom-card",
      version: "3.0.0",
      dependencies: [],
      type: "component" as const,
      targets: {
        react: {
          files: [
            {
              path: "src/components/starwind/custom-card/index.tsx",
              content: "export function CustomCard() { return 'custom'; }\n",
            },
          ],
          componentDependencies: [],
          packageRequirements: [{ name: "@starwind-ui/react", range: "^1.0.0" }],
        },
      },
    },
  ],
};

describe.sequential("add command integration", () => {
  let tempDir = "";
  let previousCwd = "";

  beforeEach(async () => {
    tempDir = await mkdtemp(join(tmpdir(), "starwind-add-test-"));
    previousCwd = process.cwd();
    process.chdir(tempDir);

    await writeFile(
      "starwind.config.json",
      JSON.stringify(
        {
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
          components: [],
        },
        null,
        2,
      ),
      "utf-8",
    );

    mockLoadRegistry.mockImplementation(async (source) =>
      source?.type === "remote" || source?.type === "local"
        ? customRegistryFixture
        : defaultRegistryFixture,
    );
    mockParseRegistrySource.mockImplementation((value) =>
      value ? { type: "remote", url: value } : undefined,
    );
    mockIsValidComponent.mockResolvedValue(true);
    mockInstallDependencies.mockResolvedValue(undefined);
    mockMultiselect.mockResolvedValue(["card"]);
  });

  afterEach(async () => {
    process.chdir(previousCwd);
    await rm(tempDir, { recursive: true, force: true });
    vi.clearAllMocks();
  });

  it("updates starwind.config.json with installed component using real config utils", async () => {
    await add(["button"], { yes: true });

    const updatedConfig = JSON.parse(
      await readFile(join(tempDir, "starwind.config.json"), "utf-8"),
    );

    expect(updatedConfig.components).toEqual([
      {
        name: "button",
        version: "2.1.0",
        framework: "react",
        registry: "default",
      },
    ]);
    await expect(
      readFile(join(tempDir, "src", "components", "starwind", "button", "index.tsx"), "utf-8"),
    ).resolves.toContain("Button");
    expect(mockInstallDependencies).toHaveBeenCalledWith(["@starwind-ui/react@^1.0.0"], "npm");
  });

  it("reports styled file conflicts without recording installation metadata", async () => {
    const destination = join(tempDir, "src", "components", "starwind", "button", "index.tsx");
    await mkdir(dirname(destination), { recursive: true });
    await writeFile(destination, "export const locallyCustomized = true;\n", "utf-8");

    await add(["button"], { yes: true });

    const updatedConfig = JSON.parse(
      await readFile(join(tempDir, "starwind.config.json"), "utf-8"),
    );
    expect(updatedConfig.components).toEqual([]);
    await expect(readFile(destination, "utf-8")).resolves.toBe(
      "export const locallyCustomized = true;\n",
    );
    expect(mockInstallDependencies).not.toHaveBeenCalled();
    expect(mockPromptLog.warn).toHaveBeenCalledWith(
      expect.stringContaining(
        "button - Existing file conflicts: src/components/starwind/button/index.tsx. Re-run with --overwrite to replace it.",
      ),
    );
  });

  it("deduplicates components across repeated installs using real updateConfig behavior", async () => {
    await add(["button"], { yes: true });
    await add(["button"], { yes: true });

    const updatedConfig = JSON.parse(
      await readFile(join(tempDir, "starwind.config.json"), "utf-8"),
    );

    expect(updatedConfig.components).toEqual([
      {
        name: "button",
        version: "2.1.0",
        framework: "react",
        registry: "default",
      },
    ]);
  });

  it("installs explicit framework styled components next to primary-framework entries", async () => {
    await writeFile(
      "starwind.config.json",
      JSON.stringify(
        {
          $schema: "https://starwind.dev/config-schema.v2.json",
          version: 2,
          framework: "astro",
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
          components: [
            {
              name: "button",
              version: "2.0.0",
              framework: "astro",
              registry: "default",
            },
          ],
        },
        null,
        2,
      ),
      "utf-8",
    );

    await add(["button"], { yes: true, framework: "react", packageManager: "pnpm" });

    const updatedConfig = JSON.parse(
      await readFile(join(tempDir, "starwind.config.json"), "utf-8"),
    );

    expect(updatedConfig.componentDir).toBe("src/components/starwind");
    expect(updatedConfig.componentDirs).toEqual({
      react: "src/components/starwind-react",
    });
    expect(updatedConfig.components).toEqual([
      {
        name: "button",
        version: "2.0.0",
        framework: "astro",
        registry: "default",
      },
      {
        name: "button",
        version: "2.1.0",
        framework: "react",
        registry: "default",
      },
    ]);
    await expect(
      readFile(
        join(tempDir, "src", "components", "starwind-react", "button", "index.tsx"),
        "utf-8",
      ),
    ).resolves.toContain("default");
    expect(mockInstallDependencies).toHaveBeenCalledWith(["@starwind-ui/react@^1.0.0"], "pnpm");
  });

  it("installs Astro styled components in a React-primary project when requested", async () => {
    await add(["button"], { yes: true, framework: "astro", packageManager: "pnpm" });

    const updatedConfig = JSON.parse(
      await readFile(join(tempDir, "starwind.config.json"), "utf-8"),
    );

    expect(updatedConfig.componentDirs).toEqual({
      astro: "src/components/starwind-astro",
    });
    expect(updatedConfig.components).toEqual([
      {
        name: "button",
        version: "2.1.0",
        framework: "astro",
        registry: "default",
      },
    ]);
    await expect(
      readFile(
        join(tempDir, "src", "components", "starwind-astro", "button", "Button.astro"),
        "utf-8",
      ),
    ).resolves.toContain("default astro");
    expect(mockInstallDependencies).toHaveBeenCalledWith(["@starwind-ui/astro@^1.0.0"], "pnpm");
  });

  it("records explicit remote registry installs in the styled registry catalog", async () => {
    const registryUrl = "https://example.com/custom-registry.json";

    await add(["button"], { yes: true, registry: registryUrl });

    const updatedConfig = JSON.parse(
      await readFile(join(tempDir, "starwind.config.json"), "utf-8"),
    );
    const componentRegistry = updatedConfig.components[0].registry;

    expect(componentRegistry).toMatch(/^remote-/);
    expect(updatedConfig.registries).toEqual({
      [componentRegistry]: {
        source: "remote",
        url: registryUrl,
        version: "0.2.0",
      },
    });
    expect(updatedConfig.components[0]).toMatchObject({
      name: "button",
      version: "3.0.0",
    });
    await expect(
      readFile(join(tempDir, "src", "components", "starwind", "button", "index.tsx"), "utf-8"),
    ).resolves.toContain("custom");
  });

  it("falls back to the default registry when a custom component lacks the selected framework target", async () => {
    await add(["button"], {
      framework: "astro",
      packageManager: "pnpm",
      registry: "https://example.com/custom-registry.json",
      yes: true,
    });

    const updatedConfig = JSON.parse(
      await readFile(join(tempDir, "starwind.config.json"), "utf-8"),
    );

    expect(updatedConfig.componentDirs).toEqual({
      astro: "src/components/starwind-astro",
    });
    expect(updatedConfig.components).toEqual([
      {
        name: "button",
        version: "2.1.0",
        framework: "astro",
        registry: "default",
      },
    ]);
    expect(updatedConfig.registries).toBeUndefined();
    await expect(
      readFile(
        join(tempDir, "src", "components", "starwind-astro", "button", "Button.astro"),
        "utf-8",
      ),
    ).resolves.toContain("default astro");
    expect(mockInstallDependencies).toHaveBeenCalledWith(["@starwind-ui/astro@^1.0.0"], "pnpm");
  });

  it("records explicit local registry installs in the styled registry catalog", async () => {
    const registryPath = "fixtures/custom-registry.json";
    mockParseRegistrySource.mockImplementation((value) =>
      value ? { type: "local", path: value } : undefined,
    );

    await add(["button"], { yes: true, registry: registryPath });

    const updatedConfig = JSON.parse(
      await readFile(join(tempDir, "starwind.config.json"), "utf-8"),
    );
    const componentRegistry = updatedConfig.components[0].registry;

    expect(componentRegistry).toMatch(/^local-/);
    expect(updatedConfig.registries).toEqual({
      [componentRegistry]: {
        source: "local",
        path: registryPath,
        version: "0.2.0",
      },
    });
  });

  it("falls back to the default registry when the explicit registry misses a component", async () => {
    await add(["card"], { yes: true, registry: "https://example.com/custom-registry.json" });

    const updatedConfig = JSON.parse(
      await readFile(join(tempDir, "starwind.config.json"), "utf-8"),
    );

    expect(updatedConfig.components).toEqual([
      {
        name: "card",
        version: "2.1.0",
        framework: "react",
        registry: "default",
      },
    ]);
    expect(updatedConfig.registries).toBeUndefined();
    await expect(
      readFile(join(tempDir, "src", "components", "starwind", "card", "index.tsx"), "utf-8"),
    ).resolves.toContain("default");
  });

  it("installs custom-only component names from an explicit registry", async () => {
    await add(["custom-card"], { yes: true, registry: "https://example.com/custom-registry.json" });

    const updatedConfig = JSON.parse(
      await readFile(join(tempDir, "starwind.config.json"), "utf-8"),
    );
    const componentRegistry = updatedConfig.components[0].registry;

    expect(componentRegistry).toMatch(/^remote-/);
    expect(updatedConfig.components).toEqual([
      {
        name: "custom-card",
        version: "3.0.0",
        framework: "react",
        registry: componentRegistry,
      },
    ]);
    await expect(
      readFile(join(tempDir, "src", "components", "starwind", "custom-card", "index.tsx"), "utf-8"),
    ).resolves.toContain("custom");
  });

  it("installs mixed custom and default components in one explicit registry command", async () => {
    await add(["button", "card", "custom-card"], {
      yes: true,
      registry: "https://example.com/custom-registry.json",
    });

    const updatedConfig = JSON.parse(
      await readFile(join(tempDir, "starwind.config.json"), "utf-8"),
    );
    const customRegistry = updatedConfig.components.find(
      (component: { name: string }) => component.name === "button",
    ).registry;

    expect(updatedConfig.components).toEqual([
      {
        name: "button",
        version: "3.0.0",
        framework: "react",
        registry: customRegistry,
      },
      {
        name: "card",
        version: "2.1.0",
        framework: "react",
        registry: "default",
      },
      {
        name: "custom-card",
        version: "3.0.0",
        framework: "react",
        registry: customRegistry,
      },
    ]);
    expect(updatedConfig.registries).toEqual({
      [customRegistry]: {
        source: "remote",
        url: "https://example.com/custom-registry.json",
        version: "0.2.0",
      },
    });
  });

  it("adds all framework-supported overlay components without unsupported custom-only entries", async () => {
    await add(undefined, {
      all: true,
      framework: "astro",
      packageManager: "pnpm",
      registry: "https://example.com/custom-registry.json",
      yes: true,
    });

    const updatedConfig = JSON.parse(
      await readFile(join(tempDir, "starwind.config.json"), "utf-8"),
    );

    expect(updatedConfig.components).toEqual([
      {
        name: "button",
        version: "2.1.0",
        framework: "astro",
        registry: "default",
      },
      {
        name: "card",
        version: "2.1.0",
        framework: "astro",
        registry: "default",
      },
    ]);
    await expect(
      readFile(
        join(tempDir, "src", "components", "starwind-astro", "button", "Button.astro"),
        "utf-8",
      ),
    ).resolves.toContain("default astro");
    await expect(
      readFile(join(tempDir, "src", "components", "starwind-astro", "card", "Card.astro"), "utf-8"),
    ).resolves.toContain("default astro card");
  });

  it("adds all overlay components with custom-first de-duped names", async () => {
    await add(undefined, {
      all: true,
      yes: true,
      registry: "https://example.com/custom-registry.json",
    });

    const updatedConfig = JSON.parse(
      await readFile(join(tempDir, "starwind.config.json"), "utf-8"),
    );
    const customRegistry = updatedConfig.components.find(
      (component: { name: string }) => component.name === "button",
    ).registry;

    expect(updatedConfig.components).toEqual([
      {
        name: "button",
        version: "3.0.0",
        framework: "react",
        registry: customRegistry,
      },
      {
        name: "custom-card",
        version: "3.0.0",
        framework: "react",
        registry: customRegistry,
      },
      {
        name: "card",
        version: "2.1.0",
        framework: "react",
        registry: "default",
      },
    ]);
  });

  it("shows de-duped overlay components for interactive selection", async () => {
    mockMultiselect.mockResolvedValue(["button", "card"]);

    await add(undefined, { yes: true, registry: "https://example.com/custom-registry.json" });

    expect(mockMultiselect).toHaveBeenCalledWith(
      expect.objectContaining({
        options: [
          { label: "button", value: "button" },
          { label: "custom-card", value: "custom-card" },
          { label: "card", value: "card" },
        ],
      }),
    );

    const updatedConfig = JSON.parse(
      await readFile(join(tempDir, "starwind.config.json"), "utf-8"),
    );
    expect(updatedConfig.components.map((component: { name: string }) => component.name)).toEqual([
      "button",
      "card",
    ]);
  });
});
