import * as clackPrompts from "@clack/prompts";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import * as config from "../../src/utils/config.js";
import * as fs from "../../src/utils/fs.js";
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

describe("update command", () => {
  let consoleLogSpy: ReturnType<typeof vi.spyOn>;
  let mockExit: ReturnType<typeof vi.spyOn>;

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
