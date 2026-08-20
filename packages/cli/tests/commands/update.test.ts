import { join } from "node:path";
import { fileURLToPath } from "node:url";

import * as clackPrompts from "@clack/prompts";
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";

import {
  buildRuntimeRegistry,
  createCliRegistryBuildPolicy,
} from "../../../../scripts/portable-runtime/generate-cli-registry.js";
import { vueFrameworkAdapterTarget } from "../../../../scripts/portable-runtime/renderers/framework-adapters/vue/index.js";

import * as config from "../../src/utils/config.js";
import * as fs from "../../src/utils/fs.js";
import { PRIVATE_VUE_FRAMEWORK_TARGET_POLICY } from "../../src/utils/framework-target-policy.js";
import * as registry from "../../src/utils/registry.js";
import * as runtimeComponent from "../../src/utils/runtime-component.js";
import { update } from "../../src/commands/update.js";

vi.mock("@clack/prompts");
vi.mock("../../src/utils/config.js");
vi.mock("../../src/utils/fs.js");
vi.mock("../../src/utils/registry.js");
vi.mock("../../src/utils/runtime-component.js");
vi.mock("../../src/utils/sleep.js", () => ({
  sleep: vi.fn().mockResolvedValue(undefined),
}));

const mockLog = {
  error: vi.fn(),
  info: vi.fn(),
  message: vi.fn(),
  step: vi.fn(),
  success: vi.fn(),
  warn: vi.fn(),
  warning: vi.fn(),
};
vi.mocked(clackPrompts).log = mockLog as typeof clackPrompts.log;

const mockFileExists = vi.mocked(fs.fileExists);
const mockGetConfigState = vi.mocked(config.getConfigState);
const mockUpdateRuntimeComponents = vi.mocked(runtimeComponent.updateRuntimeComponents);
const mockPlanRuntimeComponentUpdates = vi.mocked(runtimeComponent.planRuntimeComponentUpdates);
const mockParseRegistrySource = vi.mocked(registry.parseRegistrySource);

function runtimeConfig(overrides: Partial<config.StarwindConfig> = {}): config.StarwindConfig {
  return {
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
    components: [
      {
        name: "button",
        version: "1.0.0",
        framework: "react",
      },
    ],
    ...overrides,
  };
}

let vueRegistryFixture: registry.StarwindRegistryFor<"astro" | "react" | "vue">;

describe("update command", () => {
  let consoleLogSpy: ReturnType<typeof vi.spyOn>;
  let mockExit: ReturnType<typeof vi.spyOn>;

  beforeAll(async () => {
    vueRegistryFixture = await buildRuntimeRegistry({
      repoRoot: fileURLToPath(new URL("../../../..", import.meta.url)),
      targetPolicy: createCliRegistryBuildPolicy([vueFrameworkAdapterTarget]),
    });
  });

  beforeEach(() => {
    vi.clearAllMocks();
    mockExit = vi.spyOn(process, "exit").mockImplementation(() => {
      throw new Error("process.exit called");
    });
    consoleLogSpy = vi.spyOn(console, "log").mockImplementation(() => {});

    mockFileExists.mockResolvedValue(true);
    mockGetConfigState.mockResolvedValue({ status: "current", config: runtimeConfig() });
    mockParseRegistrySource.mockImplementation((value) =>
      value ? { type: "local", path: value } : undefined,
    );
    mockUpdateRuntimeComponents.mockResolvedValue({
      updated: [],
      skipped: [],
      failed: [],
    });
    mockPlanRuntimeComponentUpdates.mockResolvedValue({
      failed: [],
      packageRequirements: [{ name: "@starwind-ui/react", range: "^1.0.0" }],
      packagesToInstall: ["@starwind-ui/react@^1.0.0"],
      skipped: [],
      updates: [
        {
          component: {
            name: "button",
            version: "2.0.0",
            dependencies: [],
            type: "component",
          },
          componentIndex: 0,
          delivery: "source",
          files: [
            {
              path: "src/components/starwind/button/index.tsx",
              destination: "C:/project/src/components/starwind/button/index.tsx",
              currentContent: "export function Button() { return 'old'; }\n",
              content: "export function Button() { return 'new'; }\n",
              exists: true,
              changed: true,
            },
            {
              path: "src/components/starwind/button/variants.ts",
              destination: "C:/project/src/components/starwind/button/variants.ts",
              currentContent: "export const oldVariant = true;\n",
              content: "export const newVariant = true;\n",
              exists: true,
              changed: true,
            },
          ],
          framework: "react",
          newVersion: "2.0.0",
          oldVersion: "1.0.0",
          packageRequirements: [{ name: "@starwind-ui/react", range: "^1.0.0" }],
          packagesToInstall: ["@starwind-ui/react@^1.0.0"],
          registryReference: {
            componentRegistry: "default",
          },
          target: {
            files: [],
            componentDependencies: [],
            packageRequirements: [{ name: "@starwind-ui/react", range: "^1.0.0" }],
          },
        },
      ],
    });
  });

  afterEach(() => {
    mockExit.mockRestore();
    consoleLogSpy.mockRestore();
  });

  it("updates v2 components through the Runtime updater", async () => {
    mockUpdateRuntimeComponents.mockResolvedValue({
      updated: [
        {
          delivery: "source",
          name: "button",
          status: "updated",
          oldVersion: "1.0.0",
          newVersion: "2.0.0",
        },
      ],
      skipped: [],
      failed: [],
    });

    await update(["button"], {
      packageManager: "pnpm",
      registry: "fixtures/registry.json",
      yes: true,
    });

    expect(mockUpdateRuntimeComponents).toHaveBeenCalledWith(
      ["button"],
      expect.objectContaining({
        config: expect.objectContaining({ framework: "react" }),
        packageManager: "pnpm",
        registrySource: { type: "local", path: "fixtures/registry.json" },
        skipPrompts: true,
      }),
    );
  });

  it("classifies source and behavior deliveries in a mixed update summary", async () => {
    mockGetConfigState.mockResolvedValue({
      status: "current",
      config: runtimeConfig({
        components: [
          { name: "button", version: "1.0.0", framework: "react" },
          { name: "card", version: "1.0.0", framework: "react" },
        ],
      }),
    });
    mockUpdateRuntimeComponents.mockResolvedValue({
      updated: [
        {
          delivery: "source",
          name: "button",
          status: "updated",
          oldVersion: "1.0.0",
          newVersion: "2.0.0",
        },
        {
          delivery: "behavior",
          name: "card",
          status: "updated",
          oldVersion: "1.0.0",
          newVersion: "2.0.0",
        },
      ],
      skipped: [],
      failed: [],
    });

    await update(["button", "card"], { yes: true });

    const summary = mockLog.success.mock.calls[0]![0] as string;
    expect(summary).toContain("button (1.0.0 → 2.0.0) [source]");
    expect(summary).toContain("card (1.0.0 → 2.0.0) [behavior]");
  });

  it("classifies declined behavior delivery while leaving ordinary skips unlabeled", async () => {
    mockGetConfigState.mockResolvedValue({
      status: "current",
      config: runtimeConfig({
        components: [
          { name: "button", version: "1.0.0", framework: "react" },
          { name: "card", version: "1.0.0", framework: "react" },
        ],
      }),
    });
    mockUpdateRuntimeComponents.mockResolvedValue({
      updated: [],
      skipped: [
        {
          delivery: "behavior",
          name: "button",
          status: "skipped",
          oldVersion: "1.0.0",
          newVersion: "2.0.0",
        },
        {
          name: "card",
          status: "skipped",
          oldVersion: "1.0.0",
          newVersion: "1.0.0",
        },
      ],
      failed: [],
    });

    await update(["button", "card"], { yes: true });

    const summary = mockLog.info.mock.calls[0]![0] as string;
    expect(summary).toContain("button (1.0.0) [behavior]");
    expect(summary).toContain("card (1.0.0)");
    expect(summary).not.toContain("card (1.0.0) [");
  });

  it("recommends migrate for legacy configs instead of mixing Runtime updates", async () => {
    mockGetConfigState.mockResolvedValue({
      status: "legacy",
      config: runtimeConfig({
        $schema: "https://starwind.dev/config-schema.json",
        version: undefined,
        componentDir: "src/components",
      }),
    });

    await update(["button"], { yes: true });

    expect(mockLog.warn).toHaveBeenCalledWith(expect.stringContaining("starwind migrate"));
    expect(mockUpdateRuntimeComponents).not.toHaveBeenCalled();
  });

  it("exits for missing config state instead of using the old updater", async () => {
    mockGetConfigState.mockResolvedValue({ status: "missing", config: runtimeConfig() });

    await expect(update(["button"], { yes: true })).rejects.toThrow("process.exit called");

    expect(mockLog.error).toHaveBeenCalledWith(expect.stringContaining("starwind init"));
    expect(mockUpdateRuntimeComponents).not.toHaveBeenCalled();
    expect(mockExit).toHaveBeenCalledWith(1);
  });

  it("prints a dry-run update plan without invoking the Runtime writer", async () => {
    await update(["button"], { dryRun: true, packageManager: "pnpm" });

    expect(mockPlanRuntimeComponentUpdates).toHaveBeenCalledWith(
      ["button"],
      expect.objectContaining({
        config: expect.objectContaining({ framework: "react" }),
        packageManager: "pnpm",
        skipPrompts: true,
      }),
    );
    expect(mockPlanRuntimeComponentUpdates.mock.calls[0]![1]).not.toHaveProperty("registrySource");
    expect(mockUpdateRuntimeComponents).not.toHaveBeenCalled();

    const output = getConsoleOutput(consoleLogSpy);
    expect(output).toContain("Package requirements:");
    expect(output).toContain("@starwind-ui/react@^1.0.0");
    expect(output).toContain("Packages to install:");
    expect(output).toContain("File changes:");
    expect(output).toContain("src/components/starwind/button/index.tsx");
  });

  it("reports behavior delivery with package effects and no file blocks in every preview mode", async () => {
    mockPlanRuntimeComponentUpdates.mockResolvedValue({
      failed: [],
      packageRequirements: [{ name: "@starwind-ui/react", range: "^2.0.0" }],
      packagesToInstall: ["@starwind-ui/react@^2.0.0"],
      skipped: [],
      updates: [
        {
          component: {
            name: "button",
            version: "2.0.0",
            dependencies: [],
            type: "component",
          },
          componentIndex: 0,
          delivery: "behavior",
          files: [],
          framework: "react",
          newVersion: "2.0.0",
          oldVersion: "1.0.0",
          packageRequirements: [{ name: "@starwind-ui/react", range: "^2.0.0" }],
          packagesToInstall: ["@starwind-ui/react@^2.0.0"],
          registryReference: { componentRegistry: "default" },
          target: {
            files: [],
            componentDependencies: [],
            packageRequirements: [{ name: "@starwind-ui/react", range: "^2.0.0" }],
          },
        },
      ],
    });

    await update(["button"], { dryRun: true });

    const output = getConsoleOutput(consoleLogSpy);
    expect(output).toContain("Update delivery:");
    expect(output).toContain("button [react]: behavior");
    expect(output).toContain("@starwind-ui/react@^2.0.0");
    expect(output).toContain("File changes:\n  - none");

    consoleLogSpy.mockClear();
    await update(["button"], { diff: true });
    const diffOutput = getConsoleOutput(consoleLogSpy);
    expect(diffOutput).toContain("button [react]: behavior");
    expect(diffOutput).toContain("File changes:\n  - none");
    expect(diffOutput).not.toContain("diff --");

    consoleLogSpy.mockClear();
    await update(["button"], { view: true });
    const viewOutput = getConsoleOutput(consoleLogSpy);
    expect(viewOutput).toContain("button [react]: behavior");
    expect(viewOutput).toContain("File changes:\n  - none");
    expect(viewOutput).not.toContain("### ");
  });

  it("reports each delivery mode in a mixed update preview", async () => {
    mockGetConfigState.mockResolvedValue({
      status: "current",
      config: runtimeConfig({
        components: [
          { name: "button", version: "1.0.0", framework: "react" },
          { name: "card", version: "1.0.0", framework: "react" },
        ],
      }),
    });
    mockPlanRuntimeComponentUpdates.mockResolvedValueOnce({
      failed: [],
      packageRequirements: [],
      packagesToInstall: [],
      skipped: [],
      updates: [
        {
          component: {
            name: "button",
            version: "2.0.0",
            dependencies: [],
            type: "component",
          },
          componentIndex: 0,
          delivery: "source",
          files: [
            {
              path: "src/components/starwind/button/index.tsx",
              destination: "C:/project/src/components/starwind/button/index.tsx",
              currentContent: "old button\n",
              content: "new button\n",
              exists: true,
              changed: true,
            },
          ],
          framework: "react",
          newVersion: "2.0.0",
          oldVersion: "1.0.0",
          packageRequirements: [],
          packagesToInstall: [],
          registryReference: { componentRegistry: "default" },
          target: { files: [], componentDependencies: [], packageRequirements: [] },
        },
        {
          component: {
            name: "card",
            version: "2.0.0",
            dependencies: [],
            type: "component",
          },
          componentIndex: 1,
          delivery: "behavior",
          files: [],
          framework: "react",
          newVersion: "2.0.0",
          oldVersion: "1.0.0",
          packageRequirements: [],
          packagesToInstall: [],
          registryReference: { componentRegistry: "default" },
          target: { files: [], componentDependencies: [], packageRequirements: [] },
        },
      ],
    });

    await update(["button", "card"], { dryRun: true });

    const output = getConsoleOutput(consoleLogSpy);
    expect(output).toContain("button [react]: source");
    expect(output).toContain("card [react]: behavior");
    expect(output).toContain("src/components/starwind/button/index.tsx");
  });

  it("updates all installed components without passing a registry override by default", async () => {
    mockGetConfigState.mockResolvedValue({
      status: "current",
      config: runtimeConfig({
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
      }),
    });
    mockUpdateRuntimeComponents.mockResolvedValue({
      updated: [
        {
          delivery: "source",
          name: "button",
          status: "updated",
          oldVersion: "1.0.0",
          newVersion: "2.0.0",
        },
      ],
      skipped: [],
      failed: [],
    });

    await update(undefined, { all: true, yes: true });

    expect(mockUpdateRuntimeComponents).toHaveBeenCalledWith(
      ["button", "card"],
      expect.objectContaining({
        config: expect.objectContaining({ framework: "react" }),
        skipPrompts: true,
      }),
    );
    expect(mockUpdateRuntimeComponents.mock.calls[0]![1]).not.toHaveProperty("registrySource");
  });

  it("updates only primary-framework components by default when duplicate styled names exist", async () => {
    mockGetConfigState.mockResolvedValue({
      status: "current",
      config: runtimeConfig({
        framework: "astro",
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
          {
            name: "card",
            version: "1.0.0",
            framework: "react",
            registry: "default",
          },
        ],
      }),
    });
    mockUpdateRuntimeComponents.mockResolvedValue({
      updated: [
        {
          delivery: "source",
          name: "button",
          status: "updated",
          oldVersion: "1.0.0",
          newVersion: "2.0.0",
        },
      ],
      skipped: [],
      failed: [],
    });

    await update(undefined, { all: true, yes: true });

    expect(mockUpdateRuntimeComponents).toHaveBeenCalledWith(
      ["button"],
      expect.objectContaining({
        config: expect.objectContaining({ framework: "astro" }),
        skipPrompts: true,
      }),
    );
    expect(mockUpdateRuntimeComponents.mock.calls[0]![1]).not.toHaveProperty("framework");
  });

  it("passes explicit framework targets through to Runtime styled updates", async () => {
    mockGetConfigState.mockResolvedValue({
      status: "current",
      config: runtimeConfig({
        framework: "astro",
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
      }),
    });
    mockUpdateRuntimeComponents.mockResolvedValue({
      updated: [
        {
          delivery: "source",
          name: "button",
          framework: "react",
          status: "updated",
          oldVersion: "1.0.0",
          newVersion: "2.0.0",
        },
      ],
      skipped: [],
      failed: [],
    });

    await update(["button"], { framework: "react", yes: true });

    expect(mockUpdateRuntimeComponents).toHaveBeenCalledWith(
      ["button"],
      expect.objectContaining({
        framework: "react",
        skipPrompts: true,
      }),
    );
  });

  it.each([
    ["dry-run", { dryRun: true }],
    ["diff", { diff: true }],
    ["view", { view: true }],
  ] as const)(
    "previews Vue styled updates in %s mode under the private policy",
    async (_label, mode) => {
      mockGetConfigState.mockResolvedValue({
        status: "current",
        config: runtimeConfig({
          framework: "astro",
          components: [
            { name: "button", version: "1.0.0", framework: "astro", registry: "default" },
          ],
        }),
      });

      await update(
        ["button"],
        { ...mode, framework: "vue" },
        {
          registry: vueRegistryFixture,
          targetPolicy: PRIVATE_VUE_FRAMEWORK_TARGET_POLICY,
        },
      );

      expect(mockGetConfigState).toHaveBeenCalledWith(PRIVATE_VUE_FRAMEWORK_TARGET_POLICY);
      expect(mockPlanRuntimeComponentUpdates).toHaveBeenCalledWith(
        ["button"],
        expect.objectContaining({
          framework: "vue",
          registry: vueRegistryFixture,
          targetPolicy: PRIVATE_VUE_FRAMEWORK_TARGET_POLICY,
        }),
      );
      expect(mockUpdateRuntimeComponents).not.toHaveBeenCalled();
    },
  );

  it("rejects Vue through the public update API default", async () => {
    // @ts-expect-error Public update calls cannot select Vue without private dependencies.
    await expect(update(["button"], { framework: "vue", yes: true })).rejects.toThrow(
      "process.exit called",
    );

    expect(mockUpdateRuntimeComponents).not.toHaveBeenCalled();
    expect(mockLog.error).toHaveBeenCalledWith(expect.stringContaining("public target policy"));
  });

  it("updates every installed framework target when --framework all is used", async () => {
    mockGetConfigState.mockResolvedValue({
      status: "current",
      config: runtimeConfig({
        framework: "astro",
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
          {
            name: "card",
            version: "1.0.0",
            framework: "react",
            registry: "default",
          },
        ],
      }),
    });
    mockUpdateRuntimeComponents.mockResolvedValue({
      updated: [
        {
          delivery: "source",
          name: "button",
          framework: "astro",
          status: "updated",
          oldVersion: "1.0.0",
          newVersion: "2.0.0",
        },
        {
          delivery: "source",
          name: "button",
          framework: "react",
          status: "updated",
          oldVersion: "1.0.0",
          newVersion: "2.0.0",
        },
      ],
      skipped: [],
      failed: [],
    });

    await update(undefined, { all: true, framework: "all", yes: true });

    expect(mockUpdateRuntimeComponents).toHaveBeenCalledWith(
      ["button", "card"],
      expect.objectContaining({
        framework: "all",
        skipPrompts: true,
      }),
    );
  });

  it("labels summary rows with framework when update results include one", async () => {
    mockUpdateRuntimeComponents.mockResolvedValue({
      updated: [
        {
          delivery: "source",
          name: "button",
          framework: "react",
          status: "updated",
          oldVersion: "1.0.0",
          newVersion: "2.0.0",
        },
      ],
      skipped: [],
      failed: [],
    });

    await update(["button"], { framework: "react", yes: true });

    expect(mockLog.success).toHaveBeenCalledWith(expect.stringContaining("button [react]"));
  });

  it("sorts update summaries without changing the updater request order", async () => {
    mockGetConfigState.mockResolvedValue({
      status: "current",
      config: runtimeConfig({
        components: [
          { name: "zebra", version: "1.0.0", framework: "react" },
          { name: "Alpha", version: "1.0.0", framework: "react" },
        ],
      }),
    });
    mockUpdateRuntimeComponents.mockResolvedValue({
      updated: [
        {
          delivery: "source",
          name: "zebra",
          status: "updated",
          oldVersion: "1.0.0",
          newVersion: "2.0.0",
        },
        {
          delivery: "source",
          name: "Alpha",
          status: "updated",
          oldVersion: "1.0.0",
          newVersion: "2.0.0",
        },
      ],
      skipped: [],
      failed: [],
    });

    await update(["zebra", "Alpha"], { yes: true });

    expect(mockUpdateRuntimeComponents).toHaveBeenCalledWith(
      ["zebra", "Alpha"],
      expect.any(Object),
    );
    const summary = mockLog.success.mock.calls.find(([message]) =>
      String(message).includes("Successfully updated components:"),
    )?.[0] as string;
    expect(summary.indexOf("Alpha")).toBeLessThan(summary.indexOf("zebra"));
  });

  it("lets explicit wrong-framework component names reach the Runtime planner", async () => {
    mockGetConfigState.mockResolvedValue({
      status: "current",
      config: runtimeConfig({
        framework: "astro",
        components: [
          {
            name: "button",
            version: "1.0.0",
            framework: "astro",
            registry: "default",
          },
        ],
      }),
    });
    mockUpdateRuntimeComponents.mockResolvedValue({
      updated: [],
      skipped: [],
      failed: [
        {
          name: "button",
          status: "failed",
          error: 'Component is not installed for the "react" framework.',
        },
      ],
    });

    await expect(update(["button"], { framework: "react", yes: true })).rejects.toThrow(
      "process.exit called",
    );

    expect(mockUpdateRuntimeComponents).toHaveBeenCalledWith(
      ["button"],
      expect.objectContaining({
        framework: "react",
      }),
    );
    expect(mockLog.warn).not.toHaveBeenCalledWith(expect.stringContaining("No components"));
    expect(mockLog.error).toHaveBeenCalledWith(expect.stringContaining('"react" framework'));
  });

  it("passes framework scope to preview planning", async () => {
    await update(["button"], { dryRun: true, framework: "react", packageManager: "pnpm" });

    expect(mockPlanRuntimeComponentUpdates).toHaveBeenCalledWith(
      ["button"],
      expect.objectContaining({
        framework: "react",
        packageManager: "pnpm",
        skipPrompts: true,
      }),
    );
  });

  it("passes explicit registry overrides to every preview mode", async () => {
    const overrideSource = { type: "local" as const, path: "fixtures/registry.json" };

    await update(["button"], { dryRun: true, registry: "fixtures/registry.json" });
    await update(["button"], { diff: true, registry: "fixtures/registry.json" });
    await update(["button"], { view: true, registry: "fixtures/registry.json" });

    expect(mockPlanRuntimeComponentUpdates).toHaveBeenCalledTimes(3);
    for (const [, options] of mockPlanRuntimeComponentUpdates.mock.calls) {
      expect(options).toEqual(expect.objectContaining({ registrySource: overrideSource }));
    }
  });

  it("prints diffs and treats --diff as dry-run", async () => {
    await update(["button"], { diff: true });

    expect(mockUpdateRuntimeComponents).not.toHaveBeenCalled();

    const output = getConsoleOutput(consoleLogSpy);
    expect(output).toContain("diff -- src/components/starwind/button/index.tsx");
    expect(output).toContain("-export function Button() { return 'old'; }");
    expect(output).toContain("+export function Button() { return 'new'; }");
  });

  it("filters --diff output to one planned file path", async () => {
    await update(["button"], { diff: "src/components/starwind/button/variants.ts" });

    const output = getConsoleOutput(consoleLogSpy);
    expect(output).toContain("diff -- src/components/starwind/button/variants.ts");
    expect(output).toContain("+export const newVariant = true;");
    expect(output).not.toContain("diff -- src/components/starwind/button/index.tsx");
  });

  it("omits unchanged files from diff and view previews", async () => {
    const planWithUnchangedFile = {
      failed: [],
      packageRequirements: [],
      packagesToInstall: [],
      skipped: [],
      updates: [
        {
          component: {
            name: "button",
            version: "2.0.0",
            dependencies: [],
            type: "component" as const,
          },
          componentIndex: 0,
          delivery: "source" as const,
          files: [
            {
              path: "src/components/starwind/button/index.tsx",
              destination: "C:/project/src/components/starwind/button/index.tsx",
              currentContent: "export function Button() { return 'old'; }\n",
              content: "export function Button() { return 'new'; }\n",
              exists: true,
              changed: true,
            },
            {
              path: "src/components/starwind/button/unchanged.ts",
              destination: "C:/project/src/components/starwind/button/unchanged.ts",
              currentContent: "export const unchanged = true;\n",
              content: "export const unchanged = true;\n",
              exists: true,
              changed: false,
            },
          ],
          framework: "react" as const,
          newVersion: "2.0.0",
          oldVersion: "1.0.0",
          packageRequirements: [],
          packagesToInstall: [],
          registryReference: {
            componentRegistry: "default",
          },
          target: {
            files: [],
            componentDependencies: [],
            packageRequirements: [],
          },
        },
      ],
    };

    mockPlanRuntimeComponentUpdates.mockResolvedValueOnce(planWithUnchangedFile);
    await update(["button"], { diff: true });

    let output = getConsoleOutput(consoleLogSpy);
    expect(output).toContain("diff -- src/components/starwind/button/index.tsx");
    expect(output).not.toContain("src/components/starwind/button/unchanged.ts");
    expect(output).not.toContain("export const unchanged = true;");

    consoleLogSpy.mockClear();
    mockPlanRuntimeComponentUpdates.mockResolvedValueOnce(planWithUnchangedFile);
    await update(["button"], { view: true });

    output = getConsoleOutput(consoleLogSpy);
    expect(output).toContain("### src/components/starwind/button/index.tsx");
    expect(output).not.toContain("### src/components/starwind/button/unchanged.ts");
    expect(output).not.toContain("export const unchanged = true;");
  });

  it("filters --view output to one planned file path", async () => {
    await update(["button"], { view: "src/components/starwind/button/index.tsx" });

    expect(mockUpdateRuntimeComponents).not.toHaveBeenCalled();

    const output = getConsoleOutput(consoleLogSpy);
    expect(output).toContain("### src/components/starwind/button/index.tsx");
    expect(output).toContain("export function Button() { return 'new'; }");
    expect(output).not.toContain("export const newVariant = true;");
  });

  it("prints new contents for every planned file with --view", async () => {
    await update(["button"], { view: true });

    const output = getConsoleOutput(consoleLogSpy);
    expect(output).toContain("### src/components/starwind/button/index.tsx");
    expect(output).toContain("export function Button() { return 'new'; }");
    expect(output).toContain("### src/components/starwind/button/variants.ts");
    expect(output).toContain("export const newVariant = true;");
  });

  it("updates styled components even when a private-beta componentLayer is present", async () => {
    mockGetConfigState.mockResolvedValue({
      status: "current",
      config: runtimeConfig({ componentLayer: "runtime" }),
    });
    mockUpdateRuntimeComponents.mockResolvedValue({
      updated: [
        {
          delivery: "source",
          name: "button",
          status: "updated",
          oldVersion: "1.0.0",
          newVersion: "2.0.0",
        },
      ],
      skipped: [],
      failed: [],
    });

    await update(["button"], { packageManager: "pnpm", yes: true });

    expect(mockUpdateRuntimeComponents).toHaveBeenCalledWith(
      ["button"],
      expect.objectContaining({
        config: expect.objectContaining({
          componentLayer: "runtime",
          framework: "react",
        }),
        packageManager: "pnpm",
        skipPrompts: true,
      }),
    );
    expect(mockLog.warn).not.toHaveBeenCalledWith(expect.stringContaining("Runtime-only projects"));
  });
});

function getConsoleOutput(consoleLogSpy: ReturnType<typeof vi.spyOn>): string {
  return consoleLogSpy.mock.calls.map((call: unknown[]) => String(call[0])).join("\n");
}
