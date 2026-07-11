import * as clackPrompts from "@clack/prompts";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import * as config from "../../src/utils/config.js";
import * as fs from "../../src/utils/fs.js";
import * as packageManager from "../../src/utils/package-manager.js";
import * as proRegistry from "../../src/utils/pro-registry.js";
import * as registry from "../../src/utils/registry.js";
import * as runtimeComponent from "../../src/utils/runtime-component.js";
import * as shadcnConfig from "../../src/utils/shadcn-config.js";
import * as validate from "../../src/utils/validate.js";
import { add } from "../../src/commands/add.js";
import * as initModule from "../../src/commands/init.js";
import * as migrateModule from "../../src/commands/migrate.js";

vi.mock("@clack/prompts");
vi.mock("../../src/utils/config.js");
vi.mock("../../src/utils/fs.js");
vi.mock("../../src/utils/package-manager.js", () => ({
  detectPackageManager: vi.fn(() => ({ name: "npm" })),
  getShadcnCommand: vi.fn(async () => {
    throw new Error("shadcn command helper should not be used for Pro installs");
  }),
}));
vi.mock("../../src/utils/registry.js");
vi.mock("../../src/utils/pro-registry.js");
vi.mock("../../src/utils/runtime-component.js");
vi.mock("../../src/utils/shadcn-config.js");
vi.mock("../../src/utils/validate.js");
vi.mock("../../src/utils/sleep.js", () => ({
  sleep: vi.fn().mockResolvedValue(undefined),
}));
vi.mock("../../src/commands/init.js");
vi.mock("../../src/commands/migrate.js");

const mockCancel = vi.mocked(clackPrompts.cancel);
const mockConfirm = vi.mocked(clackPrompts.confirm);
const mockIsCancel = vi.mocked(clackPrompts.isCancel);
const mockMultiselect = vi.mocked(clackPrompts.multiselect);
const mockNote = vi.mocked(clackPrompts.note);
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
const mockGetShadcnCommand = vi.mocked(packageManager.getShadcnCommand);
const mockLoadRegistry = vi.mocked(registry.loadRegistry);
const mockParseRegistrySource = vi.mocked(registry.parseRegistrySource);
const mockGetConfiguredRegistrySource = vi.mocked(registry.getConfiguredRegistrySource);
const mockInstallProRegistryItems = vi.mocked(proRegistry.installProRegistryItems);
const mockInstallRuntimeComponents = vi.mocked(runtimeComponent.installRuntimeComponents);
const mockImportStarwindProRegistryFromComponentsJson = vi.mocked(
  shadcnConfig.importStarwindProRegistryFromComponentsJson,
);
const mockIsValidComponent = vi.mocked(validate.isValidComponent);
const mockInit = vi.mocked(initModule.init);
const mockMigrate = vi.mocked(migrateModule.migrate);

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
    components: [],
    ...overrides,
  };
}

const registryFixture: registry.StarwindRegistry = {
  $schema: "https://starwind.dev/registry-schema.v2.json",
  version: "0.1.0",
  components: [
    { name: "button", version: "2.0.0", dependencies: [], type: "component" },
    { name: "card", version: "2.0.0", dependencies: [], type: "component" },
  ],
};

describe("add command", () => {
  let mockExit: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    vi.clearAllMocks();
    mockExit = vi.spyOn(process, "exit").mockImplementation(() => {
      throw new Error("process.exit called");
    });

    mockFileExists.mockResolvedValue(true);
    mockGetConfigState.mockResolvedValue({ status: "current", config: runtimeConfig() });
    mockIsCancel.mockReturnValue(false);
    mockImportStarwindProRegistryFromComponentsJson.mockResolvedValue({
      status: "missing",
    });
    mockInit.mockResolvedValue(undefined);
    mockInstallRuntimeComponents.mockResolvedValue({
      installed: [],
      skipped: [],
      failed: [],
    });
    mockInstallProRegistryItems.mockResolvedValue({
      installed: [],
      skipped: [],
      failed: [],
    });
    mockLoadRegistry.mockResolvedValue(registryFixture);
    mockGetConfiguredRegistrySource.mockReturnValue({ type: "bundled" });
    mockParseRegistrySource.mockImplementation((value) =>
      value ? { type: "remote", url: value } : undefined,
    );
    mockIsValidComponent.mockResolvedValue(true);
    mockMigrate.mockResolvedValue(undefined);
  });

  afterEach(() => {
    mockExit.mockRestore();
  });

  it("exits when config is missing and user declines init", async () => {
    mockFileExists.mockResolvedValue(false);
    mockConfirm.mockResolvedValue(false);

    await expect(add(["button"])).rejects.toThrow("process.exit called");

    expect(mockInit).not.toHaveBeenCalled();
    expect(mockLog.error).toHaveBeenCalledWith(expect.stringContaining("starwind init"));
    expect(mockExit).toHaveBeenCalledWith(1);
    expect(mockInstallRuntimeComponents).not.toHaveBeenCalled();
  });

  it("runs init for missing config but refuses legacy fallback if no v2 config is available", async () => {
    mockFileExists.mockResolvedValue(false);
    mockConfirm.mockResolvedValue(true);
    mockGetConfigState.mockResolvedValue({ status: "missing", config: runtimeConfig() });

    await expect(add(["button"], { yes: true })).rejects.toThrow("process.exit called");

    expect(mockInit).toHaveBeenCalledWith(true, {
      defaults: true,
      packageManager: "npm",
    });
    expect(mockLog.error).toHaveBeenCalledWith(expect.stringContaining("starwind init"));
    expect(mockInstallRuntimeComponents).not.toHaveBeenCalled();
  });

  it("installs v2 components through the Runtime registry installer", async () => {
    mockInstallRuntimeComponents.mockResolvedValue({
      installed: [{ name: "button", status: "installed", version: "2.0.0" }],
      skipped: [],
      failed: [],
    });

    await add(["button"], { yes: true, packageManager: "pnpm" });

    expect(mockLoadRegistry).toHaveBeenCalledWith({ type: "bundled" });
    expect(mockInstallRuntimeComponents).toHaveBeenCalledWith(
      ["button"],
      expect.objectContaining({
        config: expect.objectContaining({ framework: "react" }),
        packageManager: "pnpm",
        skipPrompts: true,
      }),
    );
  });

  it("passes explicit framework targets to Runtime styled installs", async () => {
    mockGetConfigState.mockResolvedValue({
      status: "current",
      config: runtimeConfig({
        framework: "astro",
        components: [{ name: "button", version: "1.0.0", framework: "astro" }],
      }),
    });
    mockInstallRuntimeComponents.mockResolvedValue({
      installed: [{ name: "button", status: "installed", version: "2.0.0" }],
      skipped: [],
      failed: [],
    });

    await add(["button"], { yes: true, framework: "react", packageManager: "pnpm" });

    expect(mockInstallRuntimeComponents).toHaveBeenCalledWith(
      ["button"],
      expect.objectContaining({
        framework: "react",
        packageManager: "pnpm",
      }),
    );
  });

  it("treats private-beta componentLayer as inert for styled component adds", async () => {
    mockGetConfigState.mockResolvedValue({
      status: "current",
      config: runtimeConfig({
        componentLayer: "primitives",
        primitiveDir: "src/components/starwind-primitives",
        primitives: [{ name: "card", version: "0.1.0", framework: "react", source: "bundled" }],
      }),
    });

    await add(["button"], { yes: true, packageManager: "pnpm" });

    expect(mockInstallRuntimeComponents).toHaveBeenCalledWith(
      ["button"],
      expect.objectContaining({
        config: expect.objectContaining({
          componentLayer: "primitives",
          framework: "react",
          primitives: [{ name: "card", version: "0.1.0", framework: "react", source: "bundled" }],
        }),
        packageManager: "pnpm",
        skipPrompts: true,
      }),
    );
  });

  it("installs all components from the Runtime registry", async () => {
    await add(undefined, { all: true, yes: true });

    expect(mockInstallRuntimeComponents).toHaveBeenCalledWith(
      ["button", "card"],
      expect.objectContaining({
        config: expect.objectContaining({ framework: "react" }),
      }),
    );
  });

  it("installs only uninstalled Runtime components with --all", async () => {
    mockGetConfigState.mockResolvedValue({
      status: "current",
      config: runtimeConfig({
        components: [{ name: "button", version: "2.0.0" }],
      }),
    });

    await add(undefined, { all: true, yes: true });

    expect(mockInstallRuntimeComponents).toHaveBeenCalledWith(
      ["card"],
      expect.objectContaining({
        config: expect.objectContaining({ framework: "react" }),
      }),
    );
  });

  it("uses Runtime registry components for interactive selection", async () => {
    mockMultiselect.mockResolvedValue(["card"]);

    await add(undefined, { yes: true });

    expect(mockMultiselect).toHaveBeenCalledWith(
      expect.objectContaining({
        options: [
          { label: "button", value: "button" },
          { label: "card", value: "card" },
        ],
      }),
    );
    expect(mockInstallRuntimeComponents).toHaveBeenCalledWith(
      ["card"],
      expect.objectContaining({ config: expect.any(Object) }),
    );
  });

  it("shows only uninstalled Runtime components for interactive selection", async () => {
    mockGetConfigState.mockResolvedValue({
      status: "current",
      config: runtimeConfig({
        components: [{ name: "button", version: "2.0.0" }],
      }),
    });
    mockMultiselect.mockResolvedValue(["card"]);

    await add(undefined, { yes: true });

    expect(mockMultiselect).toHaveBeenCalledWith(
      expect.objectContaining({
        options: [{ label: "card", value: "card" }],
      }),
    );
    expect(mockInstallRuntimeComponents).toHaveBeenCalledWith(
      ["card"],
      expect.objectContaining({ config: expect.any(Object) }),
    );
  });

  it("still allows explicitly named installed Runtime components for deliberate reinstalls", async () => {
    mockGetConfigState.mockResolvedValue({
      status: "current",
      config: runtimeConfig({
        components: [{ name: "button", version: "2.0.0" }],
      }),
    });

    await add(["button"], { overwrite: true, yes: true });

    expect(mockInstallRuntimeComponents).toHaveBeenCalledWith(
      ["button"],
      expect.objectContaining({
        overwrite: true,
      }),
    );
  });

  it("prompts to migrate legacy configs and stops when migration is declined", async () => {
    mockGetConfigState.mockResolvedValue({
      status: "legacy",
      config: runtimeConfig({
        $schema: "https://starwind.dev/config-schema.json",
        version: undefined,
        componentDir: "src/components",
      }),
    });
    mockConfirm.mockResolvedValue(false);

    await add(["button"], { packageManager: "pnpm" });

    expect(mockConfirm).toHaveBeenCalledWith(
      expect.objectContaining({
        message: expect.stringContaining("run `starwind migrate` now"),
        initialValue: true,
      }),
    );
    expect(mockMigrate).not.toHaveBeenCalled();
    expect(mockLog.warn).toHaveBeenCalledWith(expect.stringContaining("starwind migrate"));
    expect(mockInstallRuntimeComponents).not.toHaveBeenCalled();
  });

  it("auto-migrates legacy configs with --yes and continues into Pro installs", async () => {
    mockGetConfigState
      .mockResolvedValueOnce({
        status: "legacy",
        config: runtimeConfig({
          $schema: "https://starwind.dev/config-schema.json",
          version: undefined,
          componentDir: "src/components",
        }),
      })
      .mockResolvedValueOnce({
        status: "current",
        config: runtimeConfig(),
      });
    mockInstallProRegistryItems.mockResolvedValue({
      installed: [
        {
          name: "@starwind-pro/shader-glass-aurora",
          status: "installed",
          version: "1.0.0",
        },
      ],
      skipped: [],
      failed: [],
    });

    await add(["@starwind-pro/shader-glass-aurora"], {
      yes: true,
      packageManager: "pnpm",
    });

    expect(mockConfirm).not.toHaveBeenCalled();
    expect(mockMigrate).toHaveBeenCalledWith({
      packageManager: "pnpm",
      withinInit: true,
      yes: true,
    });
    expect(mockInstallProRegistryItems).toHaveBeenCalledWith(
      ["@starwind-pro/shader-glass-aurora"],
      expect.objectContaining({
        config: expect.objectContaining({ version: 2 }),
        packageManager: "pnpm",
      }),
    );
  });

  it("passes explicit remote registries through v2 add", async () => {
    await add(["button"], {
      yes: true,
      registry: "https://starwind.dev/registry/0.1.0/registry.json",
    });

    expect(mockLoadRegistry).toHaveBeenCalledWith({
      type: "remote",
      url: "https://starwind.dev/registry/0.1.0/registry.json",
    });
    expect(mockInstallRuntimeComponents).toHaveBeenCalledWith(
      ["button"],
      expect.objectContaining({
        registrySource: {
          type: "remote",
          url: "https://starwind.dev/registry/0.1.0/registry.json",
        },
      }),
    );
  });

  it("installs Pro registry components through the native installer and forwards overwrite", async () => {
    mockInstallProRegistryItems.mockResolvedValue({
      installed: [
        {
          name: "@starwind-pro/shader-glass-aurora",
          status: "installed",
          version: "1.0.0",
        },
      ],
      skipped: [],
      failed: [],
    });

    await add(["@starwind-pro/shader-glass-aurora"], {
      yes: true,
      overwrite: true,
    });

    expect(mockImportStarwindProRegistryFromComponentsJson).toHaveBeenCalledWith(
      expect.objectContaining({
        version: 2,
      }),
      { warn: expect.any(Function) },
    );
    expect(mockInstallProRegistryItems).toHaveBeenCalledWith(
      ["@starwind-pro/shader-glass-aurora"],
      expect.objectContaining({
        config: expect.objectContaining({ version: 2 }),
        overwrite: true,
      }),
    );
    expect(mockGetShadcnCommand).not.toHaveBeenCalled();
    expect(mockLoadRegistry).not.toHaveBeenCalled();
    expect(mockInstallRuntimeComponents).not.toHaveBeenCalled();
  });

  it("supports mixed Runtime component and Pro registry installs", async () => {
    mockInstallRuntimeComponents.mockResolvedValue({
      installed: [{ name: "button", status: "installed", version: "2.0.0" }],
      skipped: [],
      failed: [],
    });
    mockInstallProRegistryItems.mockResolvedValue({
      installed: [{ name: "@starwind-pro/free-card", status: "installed", version: "1.0.0" }],
      skipped: [],
      failed: [],
    });

    await add(["button", "@starwind-pro/free-card"], {
      framework: "react",
      yes: true,
      packageManager: "pnpm",
    });

    expect(mockLoadRegistry).toHaveBeenCalledWith({ type: "bundled" });
    expect(mockInstallRuntimeComponents).toHaveBeenCalledWith(
      ["button"],
      expect.objectContaining({
        framework: "react",
        packageManager: "pnpm",
      }),
    );
    expect(mockInstallProRegistryItems).toHaveBeenCalledWith(
      ["@starwind-pro/free-card"],
      expect.objectContaining({
        packageManager: "pnpm",
      }),
    );
    expect(mockInstallProRegistryItems).not.toHaveBeenCalledWith(
      ["@starwind-pro/free-card"],
      expect.objectContaining({
        framework: expect.any(String),
      }),
    );
    expect(mockGetShadcnCommand).not.toHaveBeenCalled();
    expect(mockLog.success).toHaveBeenCalledWith(
      expect.stringContaining("Successfully installed components:"),
    );
    expect(mockLog.success).toHaveBeenCalledWith(
      expect.stringContaining("Successfully installed Pro registry components:"),
    );
  });

  it("reports native Pro installed, skipped, and failed results", async () => {
    mockInstallProRegistryItems.mockResolvedValue({
      installed: [{ name: "@starwind-pro/free-card", status: "installed", version: "1.0.0" }],
      skipped: [{ name: "@starwind-pro/existing-card", status: "skipped", version: "1.0.0" }],
      failed: [{ name: "@starwind-pro/bad-card", status: "failed", error: "Invalid item" }],
    });

    await add(
      ["@starwind-pro/free-card", "@starwind-pro/existing-card", "@starwind-pro/bad-card"],
      {
        yes: true,
      },
    );

    expect(mockLog.success).toHaveBeenCalledWith(
      expect.stringContaining("Successfully installed Pro registry components:"),
    );
    expect(mockLog.warn).toHaveBeenCalledWith(
      expect.stringContaining("Skipped Pro registry components:"),
    );
    expect(mockLog.error).toHaveBeenCalledWith(
      expect.stringContaining("Failed to install Pro registry components:"),
    );

    const proSuccessMessage = mockLog.success.mock.calls
      .map(([message]) => String(message))
      .find((message) => message.includes("Successfully installed Pro registry components:"));
    const proSkippedMessage = mockLog.warn.mock.calls
      .map(([message]) => String(message))
      .find((message) => message.includes("Skipped Pro registry components:"));

    expect(proSuccessMessage).toContain("  @starwind-pro/free-card");
    expect(proSuccessMessage).not.toContain("v1.0.0");
    expect(proSkippedMessage).toContain("  @starwind-pro/existing-card");
    expect(proSkippedMessage).not.toContain("v1.0.0");
    expect(mockNote).not.toHaveBeenCalled();
  });

  it("shows Pro authorization guidance as a note for auth failures", async () => {
    mockInstallProRegistryItems.mockResolvedValue({
      installed: [],
      skipped: [],
      failed: [
        {
          name: "@starwind-pro/shader-glass-aurora",
          status: "failed",
          authFailure: true,
          error: "401 Unauthorized - Unable to validate license key.",
        },
      ],
    });

    await add(["@starwind-pro/shader-glass-aurora"], { yes: true });

    expect(mockLog.error).toHaveBeenCalledWith(
      expect.stringContaining(
        "@starwind-pro/shader-glass-aurora - 401 Unauthorized - Unable to validate license key.",
      ),
    );
    expect(mockLog.error).not.toHaveBeenCalledWith(expect.stringContaining(".env.local"));
    expect(mockNote).toHaveBeenCalledWith(
      expect.stringContaining("STARWIND_LICENSE_KEY"),
      "Starwind Pro authorization",
    );

    const noteMessage = String(mockNote.mock.calls[0]?.[0]);
    expect(noteMessage).toContain(".env.local");
    expect(noteMessage).toContain("https://pro.starwind.dev");
  });

  it("continues Pro registry installs with Starwind config when components.json conflicts", async () => {
    const configuredPro = {
      registry: {
        url: "https://pro.starwind.dev/r/{name}",
      },
    };
    mockGetConfigState.mockResolvedValue({
      status: "current",
      config: runtimeConfig({
        pro: configuredPro,
      }),
    });
    mockImportStarwindProRegistryFromComponentsJson.mockResolvedValue({
      status: "conflict",
      pro: configuredPro,
      registry: {
        url: "http://localhost:4321/r/{name}",
      },
    });

    await add(["@starwind-pro/shader-glass-aurora"], {
      yes: true,
    });

    expect(mockInstallProRegistryItems).toHaveBeenCalledWith(
      ["@starwind-pro/shader-glass-aurora"],
      expect.objectContaining({
        config: expect.objectContaining({
          pro: configuredPro,
        }),
      }),
    );
  });

  it("stops when v2 config validation fails instead of falling back to legacy install", async () => {
    mockGetConfigState.mockRejectedValue(new Error("Invalid Starwind config registry version"));

    await expect(add(["button"], { yes: true })).rejects.toThrow("process.exit called");

    expect(mockLog.error).toHaveBeenCalledWith("Invalid Starwind config registry version");
    expect(mockInstallRuntimeComponents).not.toHaveBeenCalled();
  });

  it("handles cancellation of interactive Runtime selection", async () => {
    mockMultiselect.mockResolvedValue([]);

    await expect(add(undefined, { yes: true })).rejects.toThrow("process.exit called");

    expect(mockCancel).toHaveBeenCalledWith("No components selected");
    expect(mockExit).toHaveBeenCalledWith(0);
    expect(mockInstallRuntimeComponents).not.toHaveBeenCalled();
  });
});
