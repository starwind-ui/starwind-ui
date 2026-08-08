import * as p from "@clack/prompts";
import { beforeEach, describe, expect, it, vi } from "vitest";

import * as astroConfig from "../../src/utils/astro-config.js";
import * as fsUtils from "../../src/utils/fs.js";
import * as packageManager from "../../src/utils/package-manager.js";
import * as tsconfig from "../../src/utils/tsconfig.js";
import {
  ensureAstroReactIntegration,
  preflightAstroReactIntegration,
} from "../../src/utils/astro-react-integration.js";

vi.mock("@clack/prompts");
vi.mock("../../src/utils/astro-config.js");
vi.mock("../../src/utils/fs.js");
vi.mock("../../src/utils/package-manager.js");
vi.mock("../../src/utils/tsconfig.js");

const mockReadJsonFile = vi.mocked(fsUtils.readJsonFile);
const mockInspectConfig = vi.mocked(astroConfig.inspectAstroReactConfigFile);
const mockSetupConfig = vi.mocked(astroConfig.setupAstroReactConfig);
const mockSetupTsConfig = vi.mocked(tsconfig.setupAstroReactTsConfig);
const mockIsTsConfigReady = vi.mocked(tsconfig.isAstroReactTsConfigReady);
const mockInstallDependencies = vi.mocked(packageManager.installDependencies);
const mockConfirm = vi.mocked(p.confirm);

describe("Astro React integration readiness", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(p.isCancel).mockReturnValue(false);
    mockInspectConfig.mockResolvedValue({ status: "configurable" });
    mockSetupConfig.mockResolvedValue(true);
    mockSetupTsConfig.mockResolvedValue(true);
    mockIsTsConfigReady.mockResolvedValue(true);
    mockInstallDependencies.mockResolvedValue(undefined);
    mockConfirm.mockResolvedValue(true);
  });

  it("records the Astro-major and official React peer package policy", async () => {
    mockReadJsonFile.mockResolvedValue({
      dependencies: { astro: "^5.11.0", react: "^18.3.1", "react-dom": "^18.3.1" },
      devDependencies: { "@types/react": "^18.3.20" },
    });

    await expect(preflightAstroReactIntegration()).resolves.toEqual({
      status: "configurable",
      packages: {
        production: ["@astrojs/react@^4.4.2"],
        development: ["@types/react-dom@^18.3.7"],
      },
    });
  });

  it("selects matching integration majors for supported Astro majors", async () => {
    mockReadJsonFile.mockResolvedValue({ dependencies: { astro: "^7.1.0" } });

    await expect(preflightAstroReactIntegration()).resolves.toEqual({
      status: "configurable",
      packages: {
        production: ["@astrojs/react@^6.0.2", "react@^19.2.0", "react-dom@^19.2.0"],
        development: ["@types/react@^19.2.0", "@types/react-dom@^19.2.0"],
      },
    });
  });

  it("uses the installed Astro major when the declared range spans supported majors", async () => {
    mockReadJsonFile.mockResolvedValue({ dependencies: { astro: ">=5 <8" } });
    const readInstalledVersion = vi.fn(async (packageName: string) =>
      packageName === "astro" ? "7.1.6" : undefined,
    );

    await expect(preflightAstroReactIntegration({ readInstalledVersion })).resolves.toEqual({
      status: "configurable",
      packages: {
        production: ["@astrojs/react@^6.0.2", "react@^19.2.0", "react-dom@^19.2.0"],
        development: ["@types/react@^19.2.0", "@types/react-dom@^19.2.0"],
      },
    });
  });

  it("requires manual action when an unresolved Astro range spans supported majors", async () => {
    mockReadJsonFile.mockResolvedValue({ dependencies: { astro: ">=5 <8" } });

    await expect(
      preflightAstroReactIntegration({ readInstalledVersion: async () => undefined }),
    ).resolves.toEqual(
      expect.objectContaining({
        status: "manual-action-required",
        guidance: expect.stringContaining("installed Astro version"),
      }),
    );
  });

  it("updates a declared Astro React integration below the selected policy floor", async () => {
    mockReadJsonFile.mockResolvedValue({
      dependencies: {
        "@astrojs/react": "^4.0.0",
        astro: "^5.11.0",
        react: "^18.3.1",
        "react-dom": "^18.3.1",
      },
      devDependencies: {
        "@types/react": "^18.3.20",
        "@types/react-dom": "^18.3.7",
      },
    });

    await expect(
      preflightAstroReactIntegration({ readInstalledVersion: async () => undefined }),
    ).resolves.toEqual({
      status: "configurable",
      packages: { production: ["@astrojs/react@^4.4.2"], development: [] },
    });
  });

  it("preserves an installed Astro React integration that meets the policy floor", async () => {
    mockReadJsonFile.mockResolvedValue({
      dependencies: {
        "@astrojs/react": "^4.0.0",
        astro: "^5.11.0",
        react: "^18.3.1",
        "react-dom": "^18.3.1",
      },
      devDependencies: {
        "@types/react": "^18.3.20",
        "@types/react-dom": "^18.3.7",
      },
    });
    const readInstalledVersion = vi.fn(async (packageName: string) => {
      if (packageName === "astro") return "5.11.0";
      if (packageName === "@astrojs/react") return "4.4.2";
      return undefined;
    });

    await expect(preflightAstroReactIntegration({ readInstalledVersion })).resolves.toEqual({
      status: "configurable",
      packages: { production: [], development: [] },
    });
  });

  it("rejects installed React 20 when the selected integration supports React 18 and 19", async () => {
    mockReadJsonFile.mockResolvedValue({
      dependencies: {
        "@astrojs/react": "^6.0.2",
        astro: "^7.1.0",
        react: ">=18",
        "react-dom": ">=18",
      },
    });
    const readInstalledVersion = vi.fn(
      async (packageName: string) =>
        ({ astro: "7.1.6", "@astrojs/react": "6.0.2", react: "20.0.0", "react-dom": "20.0.0" })[
          packageName
        ],
    );

    await expect(preflightAstroReactIntegration({ readInstalledVersion })).resolves.toEqual(
      expect.objectContaining({
        status: "manual-action-required",
        guidance: expect.stringContaining("React 18 or React 19"),
      }),
    );
  });

  it("rejects installed React and React DOM with different majors", async () => {
    mockReadJsonFile.mockResolvedValue({
      dependencies: {
        "@astrojs/react": "^6.0.2",
        astro: "^7.1.0",
        react: ">=18",
        "react-dom": ">=18",
      },
    });
    const readInstalledVersion = vi.fn(
      async (packageName: string) =>
        ({ astro: "7.1.6", "@astrojs/react": "6.0.2", react: "19.2.0", "react-dom": "18.3.1" })[
          packageName
        ],
    );

    await expect(preflightAstroReactIntegration({ readInstalledVersion })).resolves.toEqual(
      expect.objectContaining({
        status: "manual-action-required",
        guidance: expect.stringContaining("same supported major"),
      }),
    );
  });

  it.each([
    {
      major: 18,
      react: "18.3.1",
      reactTypes: "^18.3.20",
      reactDomTypes: "^18.3.7",
    },
    {
      major: 19,
      react: "19.2.0",
      reactTypes: "^19.2.0",
      reactDomTypes: "^19.2.0",
    },
  ])("preserves compatible installed React $major packages and broad specs", async (fixture) => {
    mockInspectConfig.mockResolvedValue({ status: "ready" });
    mockReadJsonFile.mockResolvedValue({
      dependencies: {
        "@astrojs/react": "^6.0.2",
        astro: "^7.1.0",
        react: ">=18",
        "react-dom": ">=18",
      },
      devDependencies: {
        "@types/react": fixture.reactTypes,
        "@types/react-dom": fixture.reactDomTypes,
      },
    });
    const readInstalledVersion = vi.fn(
      async (packageName: string) =>
        ({
          astro: "7.1.6",
          "@astrojs/react": "6.0.2",
          react: fixture.react,
          "react-dom": fixture.react,
        })[packageName],
    );

    await expect(preflightAstroReactIntegration({ readInstalledVersion })).resolves.toEqual({
      status: "ready",
      packages: { production: [], development: [] },
    });
  });

  it("requires manual action when unread React declarations span multiple majors", async () => {
    mockReadJsonFile.mockResolvedValue({
      dependencies: {
        "@astrojs/react": "^6.0.2",
        astro: "^7.1.0",
        react: ">=18",
        "react-dom": ">=18",
      },
    });
    const readInstalledVersion = vi.fn(async (packageName: string) => {
      if (packageName === "astro") return "7.1.6";
      if (packageName === "@astrojs/react") return "6.0.2";
      return undefined;
    });

    await expect(preflightAstroReactIntegration({ readInstalledVersion })).resolves.toEqual(
      expect.objectContaining({
        status: "manual-action-required",
        guidance: expect.stringContaining("installed React"),
      }),
    );
  });

  it("stops before dependency changes when config mutation needs manual action", async () => {
    mockReadJsonFile.mockResolvedValue({ dependencies: { astro: "^5.11.0" } });
    mockInspectConfig.mockResolvedValue({
      status: "manual-action-required",
      guidance: "Add react() to the integrations array manually.",
    });

    await expect(
      ensureAstroReactIntegration({ packageManager: "pnpm", skipPrompts: true }),
    ).rejects.toThrow("Add react() to the integrations array manually.");
    expect(mockInstallDependencies).not.toHaveBeenCalled();
    expect(mockSetupConfig).not.toHaveBeenCalled();
  });

  it("prompts interactively and applies packages, config, and JSX settings once accepted", async () => {
    mockReadJsonFile.mockResolvedValue({ dependencies: { astro: "^6.0.0" } });

    await expect(
      ensureAstroReactIntegration({ packageManager: "pnpm", skipPrompts: false }),
    ).resolves.toEqual({ status: "configured" });

    expect(mockConfirm).toHaveBeenCalledWith(
      expect.objectContaining({ message: expect.stringContaining("Astro React") }),
    );
    expect(mockInstallDependencies).toHaveBeenNthCalledWith(
      1,
      ["@astrojs/react@^5.0.7", "react@^19.2.0", "react-dom@^19.2.0"],
      "pnpm",
    );
    expect(mockInstallDependencies).toHaveBeenNthCalledWith(
      2,
      ["@types/react@^19.2.0", "@types/react-dom@^19.2.0"],
      "pnpm",
      true,
    );
    expect(mockSetupConfig).toHaveBeenCalledTimes(1);
    expect(mockSetupTsConfig).toHaveBeenCalledTimes(1);
  });

  it("returns a distinct cancelled outcome without dependency changes", async () => {
    mockReadJsonFile.mockResolvedValue({ dependencies: { astro: "^6.0.0" } });
    mockConfirm.mockResolvedValue(Symbol("cancel"));
    vi.mocked(p.isCancel).mockReturnValue(true);

    await expect(ensureAstroReactIntegration({ packageManager: "pnpm" })).resolves.toEqual({
      status: "cancelled",
    });
    expect(p.cancel).toHaveBeenCalledWith("Operation cancelled");
    expect(mockInstallDependencies).not.toHaveBeenCalled();
  });

  it("returns a distinct declined outcome without dependency changes", async () => {
    mockReadJsonFile.mockResolvedValue({ dependencies: { astro: "^6.0.0" } });
    mockConfirm.mockResolvedValue(false);

    await expect(ensureAstroReactIntegration({ packageManager: "pnpm" })).resolves.toEqual({
      status: "declined",
    });
    expect(p.log.warn).toHaveBeenCalledWith(expect.stringContaining("astro add react"));
    expect(mockInstallDependencies).not.toHaveBeenCalled();
  });
});
