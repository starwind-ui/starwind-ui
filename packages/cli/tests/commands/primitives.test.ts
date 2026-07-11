import * as clackPrompts from "@clack/prompts";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import * as config from "../../src/utils/config.js";
import * as fs from "../../src/utils/fs.js";
import * as primitiveComponent from "../../src/utils/primitive-component.js";
import { primitivesAdd, primitivesList, primitivesUpdate } from "../../src/commands/primitives.js";
import * as initModule from "../../src/commands/init.js";
import * as migrateModule from "../../src/commands/migrate.js";

vi.mock("@clack/prompts");
vi.mock("../../src/utils/config.js");
vi.mock("../../src/utils/fs.js");
vi.mock("../../src/utils/primitive-component.js");
vi.mock("../../src/utils/sleep.js", () => ({
  sleep: vi.fn().mockResolvedValue(undefined),
}));
vi.mock("../../src/commands/init.js");
vi.mock("../../src/commands/migrate.js");

const mockCancel = vi.mocked(clackPrompts.cancel);
const mockConfirm = vi.mocked(clackPrompts.confirm);
const mockIsCancel = vi.mocked(clackPrompts.isCancel);
const mockMultiselect = vi.mocked(clackPrompts.multiselect);
const mockOutro = vi.mocked(clackPrompts.outro);
const mockLog = {
  error: vi.fn(),
  warn: vi.fn(),
  warning: vi.fn(),
  info: vi.fn(),
  success: vi.fn(),
  message: vi.fn(),
  step: vi.fn(),
};
vi.mocked(clackPrompts).log = mockLog as typeof clackPrompts.log;

const mockFileExists = vi.mocked(fs.fileExists);
const mockGetConfigState = vi.mocked(config.getConfigState);
const mockGetPrimitiveComponents = vi.mocked(primitiveComponent.getPrimitiveComponents);
const mockInstallPrimitiveComponents = vi.mocked(primitiveComponent.installPrimitiveComponents);
const mockPlanPrimitiveComponentUpdates = vi.mocked(
  primitiveComponent.planPrimitiveComponentUpdates,
);
const mockUpdatePrimitiveComponents = vi.mocked(primitiveComponent.updatePrimitiveComponents);
const mockInit = vi.mocked(initModule.init);
const mockMigrate = vi.mocked(migrateModule.migrate);

function runtimeConfig(overrides: Partial<config.StarwindConfig> = {}): config.StarwindConfig {
  return {
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
    utilsDir: "src/lib/utils",
    components: [],
    ...overrides,
  };
}

describe("primitives command", () => {
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
    mockGetPrimitiveComponents.mockReturnValue([
      {
        component: "button",
        framework: "astro",
        version: "0.1.0",
        files: [],
        packageRequirements: [],
      },
      {
        component: "checkbox",
        framework: "astro",
        version: "0.1.0",
        files: [],
        packageRequirements: [],
      },
      {
        component: "switch",
        framework: "astro",
        version: "0.1.0",
        files: [],
        packageRequirements: [],
      },
    ]);
    mockInstallPrimitiveComponents.mockResolvedValue({
      installed: [{ name: "button", status: "installed", version: "0.1.0" }],
      skipped: [],
      failed: [],
    });
    mockUpdatePrimitiveComponents.mockResolvedValue({
      updated: [{ name: "button", status: "updated", oldVersion: "0.1.0", newVersion: "0.2.0" }],
      skipped: [],
      failed: [],
    });
    mockPlanPrimitiveComponentUpdates.mockResolvedValue({
      failed: [],
      packageRequirements: [{ name: "@starwind-ui/runtime", range: "^1.0.0" }],
      packagesToInstall: ["@starwind-ui/runtime@^1.0.0"],
      skipped: [],
      updates: [
        {
          component: {
            name: "button",
            version: "0.2.0",
            dependencies: [],
            type: "component",
          },
          componentIndex: 0,
          files: [
            {
              path: "src/components/starwind-primitives/button/ButtonRoot.astro",
              destination: "C:/project/src/components/starwind-primitives/button/ButtonRoot.astro",
              currentContent: "<button>old</button>\n",
              content: "<button>new</button>\n",
              exists: true,
              changed: true,
            },
            {
              path: "src/components/starwind-primitives/button/index.ts",
              destination: "C:/project/src/components/starwind-primitives/button/index.ts",
              currentContent: "export const oldButton = true;\n",
              content: "export const newButton = true;\n",
              exists: true,
              changed: true,
            },
          ],
          framework: "astro",
          newVersion: "0.2.0",
          oldVersion: "0.1.0",
          packageRequirements: [{ name: "@starwind-ui/runtime", range: "^1.0.0" }],
          packagesToInstall: ["@starwind-ui/runtime@^1.0.0"],
          target: {
            files: [],
            componentDependencies: [],
            packageRequirements: [{ name: "@starwind-ui/runtime", range: "^1.0.0" }],
          },
        },
      ],
    });
    mockInit.mockResolvedValue(undefined);
    mockMigrate.mockResolvedValue(undefined);
    mockIsCancel.mockReturnValue(false);
  });

  afterEach(() => {
    mockExit.mockRestore();
    consoleLogSpy.mockRestore();
  });

  it("adds a named primitive through the primitive vendoring installer", async () => {
    mockGetConfigState.mockResolvedValue({
      status: "current",
      config: runtimeConfig({
        components: [{ name: "card", version: "2.0.0", framework: "astro" }],
      }),
    });
    mockInstallPrimitiveComponents.mockResolvedValue({
      installed: [{ name: "button", status: "installed", version: "0.1.0" }],
      skipped: [],
      failed: [],
    });

    await primitivesAdd(["button"], { yes: true, packageManager: "pnpm" });

    expect(mockInstallPrimitiveComponents).toHaveBeenCalledWith(
      ["button"],
      expect.objectContaining({
        config: expect.objectContaining({
          components: [{ name: "card", version: "2.0.0", framework: "astro" }],
          framework: "astro",
        }),
        packageManager: "pnpm",
        skipPrompts: true,
      }),
    );
    expect(mockLog.success).toHaveBeenCalledWith(
      expect.stringContaining("Successfully installed primitives:"),
    );
  });

  it("installs multiple valid primitives while warning about invalid names", async () => {
    mockInstallPrimitiveComponents.mockResolvedValue({
      installed: [
        { name: "button", status: "installed", version: "0.1.0" },
        { name: "checkbox", status: "installed", version: "0.1.0" },
      ],
      skipped: [],
      failed: [],
    });

    await primitivesAdd(["button", "missing", "checkbox"], { yes: true, packageManager: "pnpm" });

    expect(mockLog.warn).toHaveBeenCalledWith(expect.stringContaining("Invalid primitives found:"));
    expect(mockLog.warn).toHaveBeenCalledWith(expect.stringContaining("missing"));
    expect(mockInstallPrimitiveComponents).toHaveBeenCalledWith(
      ["button", "checkbox"],
      expect.objectContaining({
        packageManager: "pnpm",
      }),
    );
  });

  it("installs all uninstalled primitives with --all", async () => {
    mockGetConfigState.mockResolvedValue({
      status: "current",
      config: runtimeConfig({
        primitives: [{ name: "button", version: "0.1.0", framework: "astro", source: "bundled" }],
      }),
    });
    mockInstallPrimitiveComponents.mockResolvedValue({
      installed: [
        { name: "checkbox", status: "installed", version: "0.1.0" },
        { name: "switch", status: "installed", version: "0.1.0" },
      ],
      skipped: [],
      failed: [],
    });

    await primitivesAdd(undefined, { all: true, yes: true });

    expect(mockInstallPrimitiveComponents).toHaveBeenCalledWith(
      ["checkbox", "switch"],
      expect.any(Object),
    );
    expect(mockLog.info).toHaveBeenCalledWith("Adding all 2 uninstalled primitives...");
  });

  it("does not let --all silently override explicit primitive names", async () => {
    await expect(primitivesAdd(["button"], { all: true, yes: true })).rejects.toThrow(
      "process.exit called",
    );

    expect(mockLog.error).toHaveBeenCalledWith("Use either primitive names or --all, not both.");
    expect(mockGetConfigState).not.toHaveBeenCalled();
    expect(mockInstallPrimitiveComponents).not.toHaveBeenCalled();
    expect(mockExit).toHaveBeenCalledWith(1);
  });

  it("does not hide same-name primitives installed for a different framework", async () => {
    mockGetConfigState.mockResolvedValue({
      status: "current",
      config: runtimeConfig({
        framework: "react",
        primitives: [{ name: "button", version: "0.1.0", framework: "astro", source: "bundled" }],
      }),
    });
    mockGetPrimitiveComponents.mockReturnValue([
      {
        component: "button",
        framework: "react",
        version: "0.1.0",
        files: [],
        packageRequirements: [],
      },
    ]);
    mockInstallPrimitiveComponents.mockResolvedValue({
      installed: [{ name: "button", status: "installed", version: "0.1.0" }],
      skipped: [],
      failed: [],
    });

    await primitivesAdd(undefined, { all: true, yes: true });

    expect(mockGetPrimitiveComponents).toHaveBeenCalledWith({ framework: "react" });
    expect(mockInstallPrimitiveComponents).toHaveBeenCalledWith(["button"], expect.any(Object));
  });

  it("adds an explicit framework primitive with a destination override", async () => {
    mockGetPrimitiveComponents.mockReturnValue([
      {
        component: "button",
        framework: "react",
        version: "0.1.0",
        files: [],
        packageRequirements: [],
      },
    ]);

    await primitivesAdd(["button"], {
      framework: "react",
      to: "src/reference/react-primitives",
      yes: true,
    });

    expect(mockGetPrimitiveComponents).toHaveBeenCalledWith({ framework: "react" });
    expect(mockInstallPrimitiveComponents).toHaveBeenCalledWith(
      ["button"],
      expect.objectContaining({
        framework: "react",
        primitiveDir: "src/reference/react-primitives",
      }),
    );
  });

  it("opens interactive primitive selection and excludes installed primitives", async () => {
    mockGetConfigState.mockResolvedValue({
      status: "current",
      config: runtimeConfig({
        primitives: [{ name: "button", version: "0.1.0", framework: "astro", source: "bundled" }],
      }),
    });
    mockMultiselect.mockResolvedValue(["checkbox"]);
    mockInstallPrimitiveComponents.mockResolvedValue({
      installed: [{ name: "checkbox", status: "installed", version: "0.1.0" }],
      skipped: [],
      failed: [],
    });

    await primitivesAdd(undefined, { yes: true });

    expect(mockMultiselect).toHaveBeenCalledWith(
      expect.objectContaining({
        options: [
          { label: "checkbox", value: "checkbox" },
          { label: "switch", value: "switch" },
        ],
      }),
    );
    expect(mockInstallPrimitiveComponents).toHaveBeenCalledWith(["checkbox"], expect.any(Object));
  });

  it("passes --to as the primitive destination override", async () => {
    await primitivesAdd(["button"], { to: "src/reference/primitives", yes: true });

    expect(mockInstallPrimitiveComponents).toHaveBeenCalledWith(
      ["button"],
      expect.objectContaining({
        primitiveDir: "src/reference/primitives",
      }),
    );
  });

  it("treats --path as a primitive destination alias", async () => {
    await primitivesAdd(["button"], { path: "src/reference/path-primitives", yes: true });

    expect(mockInstallPrimitiveComponents).toHaveBeenCalledWith(
      ["button"],
      expect.objectContaining({
        primitiveDir: "src/reference/path-primitives",
      }),
    );
  });

  it("runs init for missing config in --yes mode before adding primitives", async () => {
    mockFileExists.mockResolvedValue(false);
    mockGetConfigState.mockResolvedValue({ status: "current", config: runtimeConfig() });

    await primitivesAdd(["button"], { yes: true, packageManager: "pnpm" });

    expect(mockInit).toHaveBeenCalledWith(true, {
      defaults: true,
      packageManager: "pnpm",
    });
    expect(mockInstallPrimitiveComponents).toHaveBeenCalledWith(
      ["button"],
      expect.objectContaining({
        packageManager: "pnpm",
      }),
    );
  });

  it("prompts to run init for missing config before adding primitives", async () => {
    mockFileExists.mockResolvedValue(false);
    mockConfirm.mockResolvedValue(true);
    mockGetConfigState.mockResolvedValue({ status: "current", config: runtimeConfig() });

    await primitivesAdd(["button"], { packageManager: "pnpm" });

    expect(mockConfirm).toHaveBeenCalledWith(
      expect.objectContaining({
        message: expect.stringContaining("starwind init"),
        initialValue: true,
      }),
    );
    expect(mockInit).toHaveBeenCalledWith(true, {
      defaults: undefined,
      packageManager: "pnpm",
    });
    expect(mockInstallPrimitiveComponents).toHaveBeenCalled();
  });

  it("prompts to migrate legacy configs before adding primitives", async () => {
    mockGetConfigState
      .mockResolvedValueOnce({
        status: "legacy",
        config: runtimeConfig({
          $schema: "https://starwind.dev/config-schema.json",
          version: undefined,
        }),
      })
      .mockResolvedValueOnce({ status: "current", config: runtimeConfig() });
    mockConfirm.mockResolvedValue(true);

    await primitivesAdd(["button"], { packageManager: "pnpm" });

    expect(mockConfirm).toHaveBeenCalledWith(
      expect.objectContaining({
        message: expect.stringContaining("starwind migrate"),
      }),
    );
    expect(mockMigrate).toHaveBeenCalledWith({
      packageManager: "pnpm",
      withinInit: true,
      yes: undefined,
    });
    expect(mockInstallPrimitiveComponents).toHaveBeenCalled();
  });

  it("auto-migrates legacy configs with --yes before adding primitives", async () => {
    mockGetConfigState
      .mockResolvedValueOnce({
        status: "legacy",
        config: runtimeConfig({
          $schema: "https://starwind.dev/config-schema.json",
          version: undefined,
        }),
      })
      .mockResolvedValueOnce({
        status: "current",
        config: runtimeConfig({
          primitiveDir: "src/components/starwind-primitives",
        }),
      });

    await primitivesAdd(["button"], { yes: true, packageManager: "pnpm" });

    expect(mockConfirm).not.toHaveBeenCalled();
    expect(mockMigrate).toHaveBeenCalledWith({
      packageManager: "pnpm",
      withinInit: true,
      yes: true,
    });
    expect(mockInstallPrimitiveComponents).toHaveBeenCalledWith(
      ["button"],
      expect.objectContaining({
        config: expect.objectContaining({
          primitiveDir: "src/components/starwind-primitives",
        }),
        packageManager: "pnpm",
        skipPrompts: true,
      }),
    );
  });

  it("cancels when interactive primitive selection returns no names", async () => {
    mockMultiselect.mockResolvedValue([]);

    await expect(primitivesAdd(undefined, { yes: true })).rejects.toThrow("process.exit called");

    expect(mockCancel).toHaveBeenCalledWith("No primitives selected");
    expect(mockInstallPrimitiveComponents).not.toHaveBeenCalled();
    expect(mockExit).toHaveBeenCalledWith(0);
  });

  it("updates an installed primitive by name", async () => {
    mockGetConfigState.mockResolvedValue({
      status: "current",
      config: runtimeConfig({
        primitives: [{ name: "button", version: "0.1.0", framework: "astro", source: "bundled" }],
      }),
    });

    await primitivesUpdate(["button"], { packageManager: "pnpm" });

    expect(mockUpdatePrimitiveComponents).toHaveBeenCalledWith(
      ["button"],
      expect.objectContaining({
        config: expect.objectContaining({
          primitives: [{ name: "button", version: "0.1.0", framework: "astro", source: "bundled" }],
        }),
        packageManager: "pnpm",
        skipPrompts: undefined,
      }),
    );
    expect(mockLog.success).toHaveBeenCalledWith(
      expect.stringContaining("Successfully updated primitives:"),
    );
    expect(mockLog.success).toHaveBeenCalledWith(
      expect.stringContaining("button (0.1.0 -> 0.2.0)"),
    );
  });

  it("updates all installed primitives with --all", async () => {
    mockGetConfigState.mockResolvedValue({
      status: "current",
      config: runtimeConfig({
        primitives: [
          { name: "button", version: "0.1.0", framework: "astro", source: "bundled" },
          { name: "checkbox", version: "0.1.0", framework: "astro", source: "bundled" },
        ],
      }),
    });

    await primitivesUpdate(undefined, { all: true, yes: true });

    expect(mockUpdatePrimitiveComponents).toHaveBeenCalledWith(
      ["button", "checkbox"],
      expect.objectContaining({
        skipPrompts: true,
      }),
    );
    expect(mockLog.info).toHaveBeenCalledWith("Checking updates for all 2 installed primitives...");
  });

  it("updates only primary framework primitives by default when --all is used", async () => {
    mockGetConfigState.mockResolvedValue({
      status: "current",
      config: runtimeConfig({
        primitives: [
          { name: "button", version: "0.1.0", framework: "astro", source: "bundled" },
          { name: "button", version: "0.1.0", framework: "react", source: "bundled" },
          { name: "toast", version: "0.1.0", framework: "react", source: "bundled" },
        ],
      }),
    });

    await primitivesUpdate(undefined, { all: true, yes: true });

    expect(mockUpdatePrimitiveComponents).toHaveBeenCalledWith(
      ["button"],
      expect.objectContaining({
        framework: "astro",
        skipPrompts: true,
      }),
    );
    expect(mockLog.info).toHaveBeenCalledWith("Checking updates for all 1 installed primitive...");
  });

  it("updates explicit framework primitives when --framework is used", async () => {
    mockGetConfigState.mockResolvedValue({
      status: "current",
      config: runtimeConfig({
        primitives: [
          { name: "button", version: "0.1.0", framework: "astro", source: "bundled" },
          { name: "button", version: "0.1.0", framework: "react", source: "bundled" },
          { name: "toast", version: "0.1.0", framework: "react", source: "bundled" },
        ],
      }),
    });

    await primitivesUpdate(undefined, { all: true, framework: "react", yes: true });

    expect(mockUpdatePrimitiveComponents).toHaveBeenCalledWith(
      ["button", "toast"],
      expect.objectContaining({
        framework: "react",
        skipPrompts: true,
      }),
    );
    expect(mockLog.info).toHaveBeenCalledWith("Checking updates for all 2 installed primitives...");
  });

  it("passes an explicit framework through to single primitive updates", async () => {
    mockGetConfigState.mockResolvedValue({
      status: "current",
      config: runtimeConfig({
        primitives: [
          { name: "button", version: "0.1.0", framework: "astro", source: "bundled" },
          { name: "button", version: "0.1.0", framework: "react", source: "bundled" },
        ],
      }),
    });

    await primitivesUpdate(["button"], { framework: "react", yes: true });

    expect(mockUpdatePrimitiveComponents).toHaveBeenCalledWith(
      ["button"],
      expect.objectContaining({
        framework: "react",
      }),
    );
  });

  it("passes uninstalled primitive names to the updater so they are reported as failures", async () => {
    mockGetConfigState.mockResolvedValue({
      status: "current",
      config: runtimeConfig({
        primitives: [{ name: "button", version: "0.1.0", framework: "astro", source: "bundled" }],
      }),
    });
    mockUpdatePrimitiveComponents.mockResolvedValue({
      updated: [],
      skipped: [],
      failed: [
        {
          name: "switch",
          status: "failed",
          error: "Primitive component is not installed in this project.",
        },
      ],
    });

    await expect(primitivesUpdate(["switch"], { yes: true })).rejects.toThrow(
      "process.exit called",
    );

    expect(mockUpdatePrimitiveComponents).toHaveBeenCalledWith(["switch"], expect.any(Object));
    expect(mockLog.error).toHaveBeenCalledWith(
      expect.stringContaining("Failed to update primitives:"),
    );
    expect(mockLog.error).toHaveBeenCalledWith(
      expect.stringContaining("Primitive component is not installed in this project."),
    );
    expect(mockCancel).toHaveBeenCalledWith("Some primitives failed to update");
    expect(mockExit).toHaveBeenCalledWith(1);
  });

  it("rejects primitive update names mixed with --all before loading config", async () => {
    await expect(primitivesUpdate(["button"], { all: true, yes: true })).rejects.toThrow(
      "process.exit called",
    );

    expect(mockLog.error).toHaveBeenCalledWith("Use either primitive names or --all, not both.");
    expect(mockGetConfigState).not.toHaveBeenCalled();
    expect(mockUpdatePrimitiveComponents).not.toHaveBeenCalled();
    expect(mockExit).toHaveBeenCalledWith(1);
  });

  it("reports partial primitive update failures as a failed command", async () => {
    mockGetConfigState.mockResolvedValue({
      status: "current",
      config: runtimeConfig({
        primitives: [{ name: "button", version: "0.1.0", framework: "astro", source: "bundled" }],
      }),
    });
    mockUpdatePrimitiveComponents.mockResolvedValue({
      updated: [
        {
          name: "button",
          status: "updated",
          oldVersion: "0.1.0",
          newVersion: "0.2.0",
        },
      ],
      skipped: [],
      failed: [
        {
          name: "switch",
          status: "failed",
          error: "Primitive component is not installed in this project.",
        },
      ],
    });

    await expect(primitivesUpdate(["button", "switch"], { yes: true })).rejects.toThrow(
      "process.exit called",
    );

    expect(mockUpdatePrimitiveComponents).toHaveBeenCalledWith(
      ["button", "switch"],
      expect.any(Object),
    );
    expect(mockLog.success).toHaveBeenCalledWith(
      expect.stringContaining("Successfully updated primitives:"),
    );
    expect(mockLog.error).toHaveBeenCalledWith(
      expect.stringContaining("Failed to update primitives:"),
    );
    expect(mockOutro).not.toHaveBeenCalledWith("Primitive source updated successfully");
    expect(mockCancel).toHaveBeenCalledWith("Some primitives failed to update");
    expect(mockExit).toHaveBeenCalledWith(1);
  });

  it("reports already-current primitive updates as skipped", async () => {
    mockGetConfigState.mockResolvedValue({
      status: "current",
      config: runtimeConfig({
        primitives: [{ name: "button", version: "0.1.0", framework: "astro", source: "bundled" }],
      }),
    });
    mockUpdatePrimitiveComponents.mockResolvedValue({
      updated: [],
      skipped: [{ name: "button", status: "skipped", oldVersion: "0.1.0", newVersion: "0.1.0" }],
      failed: [],
    });

    await primitivesUpdate(["button"], { yes: true });

    expect(mockLog.info).toHaveBeenCalledWith(
      expect.stringContaining("Primitives already up to date or skipped:"),
    );
    expect(mockLog.info).toHaveBeenCalledWith(expect.stringContaining("button (0.1.0 -> 0.1.0)"));
  });

  it("passes --yes through so package update prompts are skipped by the primitive updater", async () => {
    mockGetConfigState.mockResolvedValue({
      status: "current",
      config: runtimeConfig({
        primitives: [{ name: "button", version: "0.1.0", framework: "astro", source: "bundled" }],
      }),
    });

    await primitivesUpdate(["button"], { yes: true, packageManager: "pnpm" });

    expect(mockUpdatePrimitiveComponents).toHaveBeenCalledWith(
      ["button"],
      expect.objectContaining({
        packageManager: "pnpm",
        skipPrompts: true,
      }),
    );
  });

  it("lists Astro primitives by default when no config exists", async () => {
    mockGetConfigState.mockResolvedValue({
      status: "missing",
      config: runtimeConfig(),
    });

    await primitivesList();

    expect(mockGetPrimitiveComponents).toHaveBeenCalledWith({ framework: "astro" });
    const output = getPromptLogOutput(mockLog.info);
    expect(output).toContain("button");
    expect(output).toContain("starwind primitives add button");
  });

  it("uses the configured framework when listing primitives", async () => {
    mockGetConfigState.mockResolvedValue({
      status: "current",
      config: runtimeConfig({ framework: "react" }),
    });

    await primitivesList();

    expect(mockGetPrimitiveComponents).toHaveBeenCalledWith({ framework: "react" });
  });

  it("does not list primitive install commands for unsupported current Runtime configs", async () => {
    mockGetConfigState.mockResolvedValue({
      status: "current",
      config: runtimeConfig({ framework: undefined }),
    });

    await primitivesList();

    expect(mockGetPrimitiveComponents).not.toHaveBeenCalled();
    expect(mockLog.warn).toHaveBeenCalledWith(
      "Primitive source discovery supports Astro and React Runtime projects only.",
    );
    expect(getPromptLogOutput(mockLog.info)).not.toContain("starwind primitives add");
  });

  it("outputs primitive list JSON for a framework override", async () => {
    mockGetPrimitiveComponents.mockReturnValueOnce([
      {
        component: "button",
        framework: "react",
        version: "0.1.0",
        files: [],
        packageRequirements: [{ name: "@starwind-ui/runtime", range: "^1.0.0" }],
      },
    ]);

    await primitivesList({ json: true, framework: "react" });

    expect(mockGetConfigState).not.toHaveBeenCalled();
    expect(mockGetPrimitiveComponents).toHaveBeenCalledWith({ framework: "react" });

    const output = JSON.parse(consoleLogSpy.mock.calls[0][0] as string);
    expect(output.filters.framework).toBe("react");
    expect(output.primitives.total).toBe(1);
    expect(output.primitives.results[0]).toMatchObject({
      name: "button",
      framework: "react",
      installCommand: "starwind primitives add button --framework react",
    });
  });

  it("outputs primitive list JSON across all frameworks", async () => {
    mockGetPrimitiveComponents.mockImplementation((options = {}) => {
      if (options.framework === "react") {
        return [
          {
            component: "button",
            framework: "react",
            version: "0.1.0",
            files: [],
            packageRequirements: [],
          },
        ];
      }

      return [
        {
          component: "button",
          framework: "astro",
          version: "0.1.0",
          files: [],
          packageRequirements: [],
        },
      ];
    });

    await primitivesList({ json: true, framework: "all" });

    const output = JSON.parse(consoleLogSpy.mock.calls[0][0] as string);
    expect(output.filters.framework).toBe("all");
    expect(output.primitives.total).toBe(2);
    expect(output.primitives.results).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          framework: "astro",
          installCommand: "starwind primitives add button --framework astro",
        }),
        expect.objectContaining({
          framework: "react",
          installCommand: "starwind primitives add button --framework react",
        }),
      ]),
    );
  });

  it("prints a primitive update dry-run plan without invoking the writer", async () => {
    mockGetConfigState.mockResolvedValue({
      status: "current",
      config: runtimeConfig({
        primitives: [{ name: "button", version: "0.1.0", framework: "astro", source: "bundled" }],
      }),
    });

    await primitivesUpdate(["button"], { dryRun: true, packageManager: "pnpm" });

    expect(mockPlanPrimitiveComponentUpdates).toHaveBeenCalledWith(
      ["button"],
      expect.objectContaining({
        framework: "astro",
        packageManager: "pnpm",
        skipPrompts: true,
      }),
    );
    expect(mockUpdatePrimitiveComponents).not.toHaveBeenCalled();

    const output = getConsoleOutput(consoleLogSpy);
    expect(output).toContain("Package requirements:");
    expect(output).toContain("@starwind-ui/runtime@^1.0.0");
    expect(output).toContain("File changes:");
    expect(output).toContain("src/components/starwind-primitives/button/ButtonRoot.astro");
  });

  it("does not bootstrap missing config while previewing primitive updates", async () => {
    mockGetConfigState.mockResolvedValue({
      status: "missing",
      config: runtimeConfig(),
    });

    await expect(primitivesUpdate(["button"], { dryRun: true, yes: true })).rejects.toThrow(
      "process.exit called",
    );

    expect(mockInit).not.toHaveBeenCalled();
    expect(mockMigrate).not.toHaveBeenCalled();
    expect(mockPlanPrimitiveComponentUpdates).not.toHaveBeenCalled();
    expect(mockUpdatePrimitiveComponents).not.toHaveBeenCalled();
    expect(mockLog.error).toHaveBeenCalledWith(
      expect.stringContaining("No Runtime Starwind configuration found"),
    );
  });

  it("does not migrate legacy config while previewing primitive updates", async () => {
    mockGetConfigState.mockResolvedValue({
      status: "legacy",
      config: runtimeConfig(),
    });

    await primitivesUpdate(["button"], { diff: true, yes: true });

    expect(mockInit).not.toHaveBeenCalled();
    expect(mockMigrate).not.toHaveBeenCalled();
    expect(mockPlanPrimitiveComponentUpdates).not.toHaveBeenCalled();
    expect(mockUpdatePrimitiveComponents).not.toHaveBeenCalled();
    expect(mockLog.warn).toHaveBeenCalledWith(expect.stringContaining("legacy Starwind"));
  });

  it("prints failed and skipped primitive update preview results", async () => {
    mockGetConfigState.mockResolvedValue({
      status: "current",
      config: runtimeConfig({
        primitives: [{ name: "button", version: "0.1.0", framework: "astro", source: "bundled" }],
      }),
    });
    mockPlanPrimitiveComponentUpdates.mockResolvedValueOnce({
      failed: [
        {
          name: "button",
          status: "failed",
          error: "Primitive component not found in registry",
        },
      ],
      packageRequirements: [],
      packagesToInstall: [],
      skipped: [
        {
          name: "checkbox",
          status: "skipped",
          oldVersion: "0.1.0",
          newVersion: "0.1.0",
        },
      ],
      updates: [],
    });

    await primitivesUpdate(["button"], { dryRun: true });

    const output = getConsoleOutput(consoleLogSpy);
    expect(output).toContain("Failed:");
    expect(output).toContain("button: Primitive component not found in registry");
    expect(output).toContain("Skipped:");
    expect(output).toContain("checkbox: 0.1.0 -> 0.1.0");
  });

  it("prints primitive update diffs", async () => {
    mockGetConfigState.mockResolvedValue({
      status: "current",
      config: runtimeConfig({
        primitives: [{ name: "button", version: "0.1.0", framework: "astro", source: "bundled" }],
      }),
    });

    await primitivesUpdate(["button"], { diff: true });

    const output = getConsoleOutput(consoleLogSpy);
    expect(output).toContain("diff -- src/components/starwind-primitives/button/ButtonRoot.astro");
    expect(output).toContain("-<button>old</button>");
    expect(output).toContain("+<button>new</button>");
    expect(mockUpdatePrimitiveComponents).not.toHaveBeenCalled();
  });

  it("filters primitive update diff output to one planned file path", async () => {
    mockGetConfigState.mockResolvedValue({
      status: "current",
      config: runtimeConfig({
        primitives: [{ name: "button", version: "0.1.0", framework: "astro", source: "bundled" }],
      }),
    });

    await primitivesUpdate(["button"], {
      diff: "src/components/starwind-primitives/button/index.ts",
    });

    const output = getConsoleOutput(consoleLogSpy);
    expect(output).toContain("diff -- src/components/starwind-primitives/button/index.ts");
    expect(output).toContain("+export const newButton = true;");
    expect(output).not.toContain(
      "diff -- src/components/starwind-primitives/button/ButtonRoot.astro",
    );
  });

  it("prints primitive update new file contents with --view", async () => {
    mockGetConfigState.mockResolvedValue({
      status: "current",
      config: runtimeConfig({
        primitives: [{ name: "button", version: "0.1.0", framework: "astro", source: "bundled" }],
      }),
    });

    await primitivesUpdate(["button"], { view: true });

    const output = getConsoleOutput(consoleLogSpy);
    expect(output).toContain("### src/components/starwind-primitives/button/ButtonRoot.astro");
    expect(output).toContain("<button>new</button>");
    expect(output).toContain("### src/components/starwind-primitives/button/index.ts");
  });

  it("filters primitive update view output to one planned file path", async () => {
    mockGetConfigState.mockResolvedValue({
      status: "current",
      config: runtimeConfig({
        primitives: [{ name: "button", version: "0.1.0", framework: "astro", source: "bundled" }],
      }),
    });

    await primitivesUpdate(["button"], {
      view: "src/components/starwind-primitives/button/index.ts",
    });

    const output = getConsoleOutput(consoleLogSpy);
    expect(output).toContain("### src/components/starwind-primitives/button/index.ts");
    expect(output).toContain("export const newButton = true;");
    expect(output).not.toContain("### src/components/starwind-primitives/button/ButtonRoot.astro");
  });
});

function getConsoleOutput(consoleLogSpy: ReturnType<typeof vi.spyOn>): string {
  return consoleLogSpy.mock.calls.map((call: unknown[]) => String(call[0])).join("\n");
}

function getPromptLogOutput(mock: typeof mockLog.info): string {
  return mock.mock.calls.map((call: unknown[]) => String(call[0])).join("\n");
}
