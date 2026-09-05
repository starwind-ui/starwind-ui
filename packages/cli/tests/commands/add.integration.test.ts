import { mkdir, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";

import {
  buildRuntimeRegistry,
  createCliRegistryBuildPolicy,
} from "../../../../scripts/portable-runtime/generate-cli-registry.js";
import { vueFrameworkAdapterTarget } from "../../../../scripts/portable-runtime/renderers/framework-adapters/vue/index.js";

import { add } from "../../src/commands/add.js";
import { ensureAstroReactIntegration } from "../../src/utils/astro-react-integration.js";
import { PRIVATE_VUE_FRAMEWORK_TARGET_POLICY } from "../../src/utils/framework-target-policy.js";
import type { StarwindRegistryFor } from "../../src/utils/registry.js";

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

vi.mock("../../src/utils/astro-react-integration.js", () => ({
  ensureAstroReactIntegration: vi.fn().mockResolvedValue({ status: "ready" }),
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
  installDependenciesWithProgress: vi.fn(),
}));

import { installDependenciesWithProgress } from "../../src/utils/package-manager.js";
import { loadRegistry, parseRegistrySource } from "../../src/utils/registry.js";
import { isValidComponent } from "../../src/utils/validate.js";
import * as clackPrompts from "@clack/prompts";

const mockInstallDependencies = vi.mocked(installDependenciesWithProgress);
const mockEnsureAstroReactIntegration = vi.mocked(ensureAstroReactIntegration);
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
      sourceVersion: "2.1.0",
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
      sourceVersion: "2.1.0",
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

const repoRoot = fileURLToPath(new URL("../../../..", import.meta.url));
let vueRegistryFixture: StarwindRegistryFor<"astro" | "react" | "vue">;

const customRegistryFixture = {
  $schema: "https://starwind.dev/registry-schema.v2.json",
  version: "0.2.0",
  components: [
    {
      name: "button",
      version: "3.0.0",
      sourceVersion: "3.0.0",
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
      sourceVersion: "3.0.0",
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
  let previousFetch: typeof globalThis.fetch;
  let mockExit: ReturnType<typeof vi.spyOn>;

  beforeAll(async () => {
    vueRegistryFixture = await buildRuntimeRegistry({
      repoRoot,
      targetPolicy: createCliRegistryBuildPolicy([vueFrameworkAdapterTarget]),
    });
  });

  beforeEach(async () => {
    tempDir = await mkdtemp(join(tmpdir(), "starwind-add-test-"));
    previousCwd = process.cwd();
    previousFetch = globalThis.fetch;
    process.chdir(tempDir);
    mockExit = vi.spyOn(process, "exit").mockImplementation(() => {
      throw new Error("process.exit called");
    });

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
    mockEnsureAstroReactIntegration.mockResolvedValue({ status: "ready" });
    mockMultiselect.mockResolvedValue(["card"]);
  });

  afterEach(async () => {
    process.chdir(previousCwd);
    globalThis.fetch = previousFetch;
    mockExit.mockRestore();
    await rm(tempDir, { recursive: true, force: true });
    vi.clearAllMocks();
  });

  async function writeLegacyConfig(
    options: {
      components?: { name: string; version: string }[];
      pro?: Record<string, unknown>;
    } = {},
  ) {
    await writeFile(
      "starwind.config.json",
      JSON.stringify(
        {
          $schema: "https://starwind.dev/config-schema.json",
          tailwind: {
            css: "src/styles/starwind.css",
            baseColor: "neutral",
            cssVariables: true,
          },
          componentDir: "src/components/starwind",
          components: options.components ?? [],
          ...(options.pro ? { pro: options.pro } : {}),
        },
        null,
        2,
      ),
      "utf-8",
    );
  }

  function archivedProItem(
    options: {
      dependencies?: string[];
      major?: number;
      name?: string;
      plan?: "free" | "pro";
    } = {},
  ) {
    const name = options.name ?? "hero-01";
    return {
      name,
      type: "registry:block",
      dependencies: [],
      registryDependencies: [],
      files: [
        {
          path: "blocks/Hero1.astro",
          type: "registry:block",
          target: `components/starwind-pro/${name}/Hero1.astro`,
          content: "---\n---\n<section>Archived hero</section>\n",
        },
      ],
      meta: {
        plan: options.plan ?? "free",
        version: "1.0.0",
        framework: "astro",
        starwindUiMajor: options.major ?? 2,
        starwindUiDependencies: options.dependencies ?? ["button"],
      },
    };
  }

  function mockProResponse(body: unknown, status = 200) {
    globalThis.fetch = vi.fn(async () => ({
      ok: status >= 200 && status < 300,
      status,
      statusText:
        status === 200
          ? "OK"
          : status === 401
            ? "Unauthorized"
            : status === 404
              ? "Not Found"
              : "Error",
      headers: new Headers(),
      json: async () => body,
    })) as unknown as typeof fetch;
  }

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

  it("installs the exact generated Vue payload while preserving mixed framework records", async () => {
    const config = JSON.parse(await readFile("starwind.config.json", "utf-8"));
    config.framework = "astro";
    config.components = [
      { name: "button", version: "2.0.0", framework: "astro", registry: "default" },
    ];
    await writeFile("starwind.config.json", JSON.stringify(config, null, 2) + "\n", "utf-8");

    const generatedButton = vueRegistryFixture.components.find(
      (component) => component.name === "button",
    )!;
    const vueButton = generatedButton.targets!.vue!;

    await add(
      ["button"],
      { framework: "vue", packageManager: "pnpm", yes: true },
      {
        registry: vueRegistryFixture,
        targetPolicy: PRIVATE_VUE_FRAMEWORK_TARGET_POLICY,
      },
    );

    const updatedConfig = JSON.parse(await readFile("starwind.config.json", "utf-8"));
    expect(updatedConfig.componentDirs).toEqual({ vue: "src/components/starwind-vue" });
    expect(updatedConfig.components).toEqual([
      { name: "button", version: "2.0.0", framework: "astro", registry: "default" },
      {
        name: "button",
        version: generatedButton.version,
        framework: "vue",
        registry: "default",
      },
    ]);
    for (const file of vueButton.files) {
      const destination = file.path.replace(
        "src/components/starwind",
        "src/components/starwind-vue",
      );
      await expect(readFile(destination, "utf-8")).resolves.toBe(file.content);
    }
    expect(vueButton.files.find((file) => file.path.endsWith("/Button.vue"))!.content).toContain(
      'from "@starwind-ui/vue/button"',
    );
    expect(mockInstallDependencies).toHaveBeenCalledWith(
      ["@starwind-ui/vue@0.1.0", "tailwind-variants@^3.2.2", "vue@>=3.5"],
      "pnpm",
    );
    expect(mockLoadRegistry).not.toHaveBeenCalled();
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
    expect(mockEnsureAstroReactIntegration).toHaveBeenCalledWith({
      packageManager: "pnpm",
      skipPrompts: true,
    });
  });

  it.each(["cancelled", "declined"] as const)(
    "ends configured React add without component records when setup is %s",
    async (status) => {
      await writeFile(
        "starwind.config.json",
        JSON.stringify({
          $schema: "https://starwind.dev/config-schema.v2.json",
          version: 2,
          framework: "astro",
          registry: { source: "bundled", version: "0.1.0" },
          tailwind: { css: "src/styles/starwind.css", baseColor: "neutral", cssVariables: true },
          componentDir: "src/components/starwind",
          components: [],
        }),
        "utf-8",
      );
      mockEnsureAstroReactIntegration.mockResolvedValue({ status });

      await add(["button"], { framework: "react", packageManager: "pnpm" });

      const updatedConfig = JSON.parse(await readFile("starwind.config.json", "utf-8"));
      expect(updatedConfig.components).toEqual([]);
      expect(mockPromptLog.message).not.toHaveBeenCalledWith(
        expect.stringContaining("Installation Summary"),
      );
      expect(clackPrompts.outro).not.toHaveBeenCalled();
    },
  );

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
          { label: "card", value: "card" },
          { label: "custom-card", value: "custom-card" },
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

  it("installs a free archived Pro block when its V2 dependency is present", async () => {
    await writeLegacyConfig({ components: [{ name: "button", version: "2.1.0" }] });
    mockProResponse(archivedProItem());

    await add(["@starwind-pro/hero-01"], {
      packageManager: "pnpm",
      starwindUiVersion: "2",
      yes: true,
    });

    expect(globalThis.fetch).toHaveBeenCalledWith(
      "https://pro.starwind.dev/r/starwind-ui-v2/hero-01",
      expect.objectContaining({ headers: {} }),
    );
    await expect(
      readFile("src/components/starwind-pro/hero-01/Hero1.astro", "utf-8"),
    ).resolves.toContain("Archived hero");
  });

  it("writes no archived block when a V2 dependency is missing", async () => {
    await writeLegacyConfig();
    mockProResponse(archivedProItem());

    await add(["@starwind-pro/hero-01"], {
      packageManager: "pnpm",
      starwindUiVersion: "2",
      yes: true,
    });

    expect(mockPromptLog.error).toHaveBeenCalledWith(
      expect.stringContaining("pnpm dlx starwind@2 add button"),
    );
    await expect(
      readFile("src/components/starwind-pro/hero-01/Hero1.astro", "utf-8"),
    ).rejects.toMatchObject({ code: "ENOENT" });
  });

  it("keeps the configured bearer authorization for a paid archived block", async () => {
    await writeLegacyConfig({ components: [{ name: "button", version: "2.1.0" }] });
    const savedConfig = await readFile("starwind.config.json", "utf-8");
    await writeFile(
      "components.json",
      JSON.stringify({
        registries: {
          "@starwind-pro": {
            url: "https://pro.starwind.dev/r/{name}",
            headers: { Authorization: "Bearer ${STARWIND_LICENSE_KEY}" },
          },
        },
      }),
      "utf-8",
    );
    await writeFile(".env.local", "STARWIND_LICENSE_KEY=sw_v2_paid\n", "utf-8");
    mockProResponse(archivedProItem({ plan: "pro" }));

    await add(["@starwind-pro/hero-01"], {
      packageManager: "pnpm",
      starwindUiVersion: "2",
      yes: true,
    });

    expect(globalThis.fetch).toHaveBeenCalledWith(
      "https://pro.starwind.dev/r/starwind-ui-v2/hero-01",
      expect.objectContaining({
        headers: { Authorization: "Bearer sw_v2_paid" },
      }),
    );
    await expect(
      readFile("src/components/starwind-pro/hero-01/Hero1.astro", "utf-8"),
    ).resolves.toContain("Archived hero");
    await expect(readFile("starwind.config.json", "utf-8")).resolves.toBe(savedConfig);
  });

  it("preserves the Pro access error for an unauthorized archived block", async () => {
    await writeLegacyConfig({ components: [{ name: "button", version: "2.1.0" }] });
    mockProResponse({ message: "Unable to validate license key." }, 401);

    await add(["@starwind-pro/hero-01"], {
      packageManager: "pnpm",
      starwindUiVersion: "2",
      yes: true,
    });

    expect(mockPromptLog.error).toHaveBeenCalledWith(
      expect.stringContaining("401 Unauthorized - Unable to validate license key."),
    );
    expect(clackPrompts.note).toHaveBeenCalledWith(
      expect.stringContaining("STARWIND_LICENSE_KEY"),
      "Starwind Pro authorization",
    );
  });

  it("rejects the V2 flag in a Runtime V3 project before fetches and writes", async () => {
    globalThis.fetch = vi.fn() as unknown as typeof fetch;

    await expect(
      add(["@starwind-pro/hero-01"], {
        packageManager: "pnpm",
        starwindUiVersion: "2",
        yes: true,
      }),
    ).rejects.toThrow("process.exit called");

    expect(globalThis.fetch).not.toHaveBeenCalled();
    expect(mockPromptLog.error).toHaveBeenCalledWith(expect.stringContaining("Runtime V3 project"));
    await expect(
      readFile("src/components/starwind-pro/hero-01/Hero1.astro", "utf-8"),
    ).rejects.toMatchObject({ code: "ENOENT" });
  });

  it("rejects mixed V2 Pro and base names before fetches and writes", async () => {
    await writeLegacyConfig({ components: [{ name: "button", version: "2.1.0" }] });
    globalThis.fetch = vi.fn() as unknown as typeof fetch;

    await expect(
      add(["@starwind-pro/hero-01", "button"], {
        packageManager: "pnpm",
        starwindUiVersion: "2",
        yes: true,
      }),
    ).rejects.toThrow("process.exit called");

    expect(globalThis.fetch).not.toHaveBeenCalled();
    expect(mockPromptLog.error).toHaveBeenCalledWith(
      expect.stringContaining("separate Pro and base-component commands"),
    );
  });

  it("rejects a custom Pro URL before archived fetches and writes", async () => {
    await writeLegacyConfig({
      components: [{ name: "button", version: "2.1.0" }],
      pro: {
        registry: {
          url: "https://pro.starwind.dev/custom/{name}",
        },
      },
    });
    globalThis.fetch = vi.fn() as unknown as typeof fetch;

    await add(["@starwind-pro/hero-01"], {
      packageManager: "pnpm",
      starwindUiVersion: "2",
      yes: true,
    });

    expect(globalThis.fetch).not.toHaveBeenCalled();
    expect(mockPromptLog.error).toHaveBeenCalledWith(
      expect.stringContaining("immutable V2 archive"),
    );
    await expect(
      readFile("src/components/starwind-pro/hero-01/Hero1.astro", "utf-8"),
    ).rejects.toMatchObject({ code: "ENOENT" });
  });

  it("reports a missing archived block with its frozen V2 route", async () => {
    await writeLegacyConfig({ components: [{ name: "button", version: "2.1.0" }] });
    mockProResponse({ message: "Block not found" }, 404);

    await add(["@starwind-pro/missing-card"], {
      packageManager: "pnpm",
      starwindUiVersion: "2",
      yes: true,
    });

    expect(mockPromptLog.error).toHaveBeenCalledWith(
      expect.stringContaining(
        "frozen Starwind UI V2 route: https://pro.starwind.dev/r/starwind-ui-v2/missing-card",
      ),
    );
    await expect(
      readFile("src/components/starwind-pro/missing-card/Hero1.astro", "utf-8"),
    ).rejects.toMatchObject({ code: "ENOENT" });
  });

  it("keeps explicit and default V3 Pro installs on the same fetch plan and output", async () => {
    mockProResponse(archivedProItem({ dependencies: [], major: 3 }));

    await add(["@starwind-pro/hero-01"], { packageManager: "pnpm", yes: true });
    const defaultFetchCall = vi.mocked(globalThis.fetch).mock.calls[0];
    const defaultOutput = await readFile(
      "src/components/starwind-pro/hero-01/Hero1.astro",
      "utf-8",
    );
    await rm("src/components/starwind-pro/hero-01", { recursive: true, force: true });
    vi.mocked(globalThis.fetch).mockClear();

    await add(["@starwind-pro/hero-01"], {
      packageManager: "pnpm",
      starwindUiVersion: "3",
      yes: true,
    });

    expect(vi.mocked(globalThis.fetch).mock.calls[0]).toEqual(defaultFetchCall);
    await expect(
      readFile("src/components/starwind-pro/hero-01/Hero1.astro", "utf-8"),
    ).resolves.toBe(defaultOutput);
  });

  it("rejects wrong-major Pro metadata before writing files", async () => {
    mockProResponse(archivedProItem({ dependencies: [], major: 2 }));

    await add(["@starwind-pro/hero-01"], {
      packageManager: "pnpm",
      starwindUiVersion: "3",
      yes: true,
    });

    expect(mockPromptLog.error).toHaveBeenCalledWith(
      expect.stringContaining("requested Starwind UI major 3"),
    );
    await expect(
      readFile("src/components/starwind-pro/hero-01/Hero1.astro", "utf-8"),
    ).rejects.toMatchObject({ code: "ENOENT" });
  });
});
