import { beforeEach, describe, expect, it, vi } from "vitest";

import * as component from "../component.js";
import * as config from "../config.js";
import * as dependencyResolver from "../dependency-resolver.js";
import { installComponent, installStarwindDependencies } from "../install.js";
import * as packageManager from "../package-manager.js";
import * as prompts from "../prompts.js";
import * as registry from "../registry.js";

// Mock all dependencies
vi.mock("../component.js");
vi.mock("../config.js");
vi.mock("../dependency-resolver.js");
vi.mock("../package-manager.js");
vi.mock("../prompts.js");
vi.mock("../registry.js");

const mockCopyComponent = vi.mocked(component.copyComponent);
const mockGetConfig = vi.mocked(config.getConfig);
const mockUpdateConfig = vi.mocked(config.updateConfig);
const mockSeparateDependencies = vi.mocked(dependencyResolver.separateDependencies);
const mockFilterUninstalledDependencies = vi.mocked(
  dependencyResolver.filterUninstalledDependencies,
);
const mockInstallDependencies = vi.mocked(packageManager.installDependencies);
const mockDetectPackageManager = vi.mocked(packageManager.detectPackageManager);
const mockConfirmInstall = vi.mocked(prompts.confirmInstall);
const mockGetStarwindDependencyResolutions = vi.mocked(prompts.getStarwindDependencyResolutions);
const mockGetComponent = vi.mocked(registry.getComponent);

describe("install", () => {
  beforeEach(() => {
    vi.clearAllMocks();

    // Default mocks
    mockGetConfig.mockResolvedValue({
      $schema: "test",
      tailwind: { css: "test", baseColor: "neutral", cssVariables: true },
      componentDir: "test",
      components: [],
    });
  });

  describe("installComponent", () => {
    it("should install component without dependencies", async () => {
      const mockComponent = {
        name: "button",
        version: "2.1.0",
        dependencies: [],
        type: "component" as const,
      };

      mockGetComponent.mockResolvedValue(mockComponent);
      mockCopyComponent.mockResolvedValue({
        status: "installed",
        name: "button",
        version: "2.1.0",
      });

      const result = await installComponent("button");

      expect(result).toEqual({
        status: "installed",
        name: "button",
        version: "2.1.0",
      });

      expect(mockGetComponent).toHaveBeenCalledWith("button");
      expect(mockCopyComponent).toHaveBeenCalledWith("button");
      expect(mockConfirmInstall).not.toHaveBeenCalled();
    });

    it("should return error if component not found", async () => {
      mockGetComponent.mockResolvedValue(undefined);

      const result = await installComponent("nonexistent");

      expect(result).toEqual({
        status: "failed",
        name: "nonexistent",
        error: "Component not found in registry",
      });
    });

    it("should handle npm dependencies", async () => {
      const mockComponent = {
        name: "form",
        version: "1.0.0",
        dependencies: ["react@^18.0.0", "zod@^3.0.0"],
        type: "component" as const,
      };

      mockGetComponent.mockResolvedValue(mockComponent);
      mockConfirmInstall.mockResolvedValue(true);
      mockSeparateDependencies.mockReturnValue({
        starwindDependencies: [],
        npmDependencies: ["react@^18.0.0", "zod@^3.0.0"],
      });
      mockFilterUninstalledDependencies.mockResolvedValue(["react@^18.0.0", "zod@^3.0.0"]);
      mockDetectPackageManager.mockReturnValue({
        name: "npm",
        installCmd: "npm install",
        addCmd: "npm install",
        removeCmd: "npm uninstall",
        runCmd: "npm run",
      });
      mockInstallDependencies.mockResolvedValue();
      mockCopyComponent.mockResolvedValue({
        status: "installed",
        name: "form",
        version: "1.0.0",
      });

      const result = await installComponent("form");

      expect(result).toEqual({
        status: "installed",
        name: "form",
        version: "1.0.0",
      });

      expect(mockConfirmInstall).toHaveBeenCalledWith(mockComponent);
      expect(mockInstallDependencies).toHaveBeenCalledWith(["react@^18.0.0", "zod@^3.0.0"], "npm");
    });

    it("should handle Starwind component dependencies", async () => {
      const mockComponent = {
        name: "alert-dialog",
        version: "1.0.0",
        dependencies: ["@starwind-ui/core/button@^2.1.0"],
        type: "component" as const,
      };

      const mockResolutions = [
        {
          component: "button",
          currentVersion: undefined,
          requiredVersion: "^2.1.0",
          needsInstall: true,
          needsUpdate: false,
          isStarwindComponent: true,
        },
      ];

      const mockDependencyResults = [
        {
          status: "installed" as const,
          name: "button",
          version: "2.1.0",
        },
      ];

      mockGetComponent.mockResolvedValue(mockComponent);
      mockConfirmInstall.mockResolvedValue(true);
      mockSeparateDependencies.mockReturnValue({
        starwindDependencies: ["@starwind-ui/core/button@^2.1.0"],
        npmDependencies: [],
      });
      mockGetStarwindDependencyResolutions.mockResolvedValue(mockResolutions);
      mockCopyComponent.mockResolvedValue({
        status: "installed",
        name: "alert-dialog",
        version: "1.0.0",
      });

      // Mock installStarwindDependencies by mocking the functions it uses
      mockCopyComponent
        .mockResolvedValueOnce({
          status: "installed",
          name: "button",
          version: "2.1.0",
        })
        .mockResolvedValueOnce({
          status: "installed",
          name: "alert-dialog",
          version: "1.0.0",
        });

      const result = await installComponent("alert-dialog");

      expect(result).toEqual({
        status: "installed",
        name: "alert-dialog",
        version: "1.0.0",
        dependencyResults: mockDependencyResults,
      });

      expect(mockGetStarwindDependencyResolutions).toHaveBeenCalledWith(["alert-dialog"]);
    });

    it("should return error if user cancels installation", async () => {
      const mockComponent = {
        name: "form",
        version: "1.0.0",
        dependencies: ["react@^18.0.0"],
        type: "component" as const,
      };

      mockGetComponent.mockResolvedValue(mockComponent);
      mockConfirmInstall.mockResolvedValue(false);

      const result = await installComponent("form");

      expect(result).toEqual({
        status: "failed",
        name: "form",
        error: "Installation cancelled by user",
      });
    });

    it("should return error if npm dependency installation fails", async () => {
      const mockComponent = {
        name: "form",
        version: "1.0.0",
        dependencies: ["react@^18.0.0"],
        type: "component" as const,
      };

      mockGetComponent.mockResolvedValue(mockComponent);
      mockConfirmInstall.mockResolvedValue(true);
      mockSeparateDependencies.mockReturnValue({
        starwindDependencies: [],
        npmDependencies: ["react@^18.0.0"],
      });
      mockFilterUninstalledDependencies.mockResolvedValue(["react@^18.0.0"]);
      mockDetectPackageManager.mockReturnValue({
        name: "npm",
        installCmd: "npm install",
        addCmd: "npm install",
        removeCmd: "npm uninstall",
        runCmd: "npm run",
      });
      mockInstallDependencies.mockRejectedValue(new Error("Package not found"));

      const result = await installComponent("form");

      expect(result).toEqual({
        status: "failed",
        name: "form",
        error: "Failed to install npm dependencies: Package not found",
      });
    });

    it("should return error if Starwind dependency installation fails", async () => {
      const mockComponent = {
        name: "alert-dialog",
        version: "1.0.0",
        dependencies: ["@starwind-ui/core/button@^2.1.0"],
        type: "component" as const,
      };

      const mockResolutions = [
        {
          component: "button",
          currentVersion: undefined,
          requiredVersion: "^2.1.0",
          needsInstall: true,
          needsUpdate: false,
          isStarwindComponent: true,
        },
      ];

      const mockDependencyResults = [
        {
          status: "failed" as const,
          name: "button",
          error: "Component files not found",
        },
      ];

      mockGetComponent.mockResolvedValue(mockComponent);
      mockConfirmInstall.mockResolvedValue(true);
      mockSeparateDependencies.mockReturnValue({
        starwindDependencies: ["@starwind-ui/core/button@^2.1.0"],
        npmDependencies: [],
      });
      mockGetStarwindDependencyResolutions.mockResolvedValue(mockResolutions);

      // Mock failed dependency installation
      mockCopyComponent.mockResolvedValueOnce({
        status: "failed",
        name: "button",
        error: "Component files not found",
      });

      const result = await installComponent("alert-dialog");

      expect(result).toEqual({
        status: "failed",
        name: "alert-dialog",
        error: "Failed to install Starwind dependencies: button",
        dependencyResults: mockDependencyResults,
      });
    });
  });

  describe("installStarwindDependencies", () => {
    it("should install new components", async () => {
      const resolutions = [
        {
          component: "button",
          currentVersion: undefined,
          requiredVersion: "^2.1.0",
          needsInstall: true,
          needsUpdate: false,
          isStarwindComponent: true,
        },
      ];

      mockCopyComponent.mockResolvedValue({
        status: "installed",
        name: "button",
        version: "2.1.0",
      });

      const result = await installStarwindDependencies(resolutions);

      expect(result).toEqual([
        {
          status: "installed",
          name: "button",
          version: "2.1.0",
        },
      ]);

      expect(mockCopyComponent).toHaveBeenCalledWith("button", true);
      expect(mockUpdateConfig).toHaveBeenCalledWith(
        { components: [{ name: "button", version: "2.1.0" }] },
        { appendComponents: true },
      );
    });

    it("should update existing components", async () => {
      const resolutions = [
        {
          component: "button",
          currentVersion: "2.0.0",
          requiredVersion: "^2.1.0",
          needsInstall: false,
          needsUpdate: true,
          isStarwindComponent: true,
        },
      ];

      mockCopyComponent.mockResolvedValue({
        status: "installed",
        name: "button",
        version: "2.1.0",
      });

      mockGetConfig.mockResolvedValue({
        $schema: "test",
        tailwind: { css: "test", baseColor: "neutral", cssVariables: true },
        componentDir: "test",
        components: [{ name: "button", version: "2.0.0" }],
      });

      const result = await installStarwindDependencies(resolutions);

      expect(result).toEqual([
        {
          status: "installed",
          name: "button",
          version: "2.1.0",
        },
      ]);

      expect(mockCopyComponent).toHaveBeenCalledWith("button", true); // overwrite = true
      expect(mockUpdateConfig).toHaveBeenCalledWith(
        { components: [{ name: "button", version: "2.1.0" }] },
        { appendComponents: false },
      );
    });

    it("should handle mixed install and update operations", async () => {
      const resolutions = [
        {
          component: "button",
          currentVersion: undefined,
          requiredVersion: "^2.1.0",
          needsInstall: true,
          needsUpdate: false,
          isStarwindComponent: true,
        },
        {
          component: "input",
          currentVersion: "1.0.0",
          requiredVersion: "^1.1.0",
          needsInstall: false,
          needsUpdate: true,
          isStarwindComponent: true,
        },
      ];

      mockCopyComponent
        .mockResolvedValueOnce({
          status: "installed",
          name: "button",
          version: "2.1.0",
        })
        .mockResolvedValueOnce({
          status: "installed",
          name: "input",
          version: "1.1.0",
        });

      mockGetConfig.mockResolvedValue({
        $schema: "test",
        tailwind: { css: "test", baseColor: "neutral", cssVariables: true },
        componentDir: "test",
        components: [{ name: "input", version: "1.0.0" }],
      });

      const result = await installStarwindDependencies(resolutions);

      expect(result).toEqual([
        {
          status: "installed",
          name: "button",
          version: "2.1.0",
        },
        {
          status: "installed",
          name: "input",
          version: "1.1.0",
        },
      ]);

      // Should call updateConfig twice - once for installs, once for updates
      expect(mockUpdateConfig).toHaveBeenCalledTimes(2);
      expect(mockUpdateConfig).toHaveBeenNthCalledWith(
        1,
        { components: [{ name: "button", version: "2.1.0" }] },
        { appendComponents: true },
      );
      expect(mockUpdateConfig).toHaveBeenNthCalledWith(
        2,
        { components: [{ name: "input", version: "1.1.0" }] },
        { appendComponents: false },
      );
    });

    it("should handle empty resolutions", async () => {
      const result = await installStarwindDependencies([]);

      expect(result).toEqual([]);
      expect(mockCopyComponent).not.toHaveBeenCalled();
      expect(mockUpdateConfig).not.toHaveBeenCalled();
    });

    it("should handle failed component installations", async () => {
      const resolutions = [
        {
          component: "button",
          currentVersion: undefined,
          requiredVersion: "^2.1.0",
          needsInstall: true,
          needsUpdate: false,
          isStarwindComponent: true,
        },
      ];

      mockCopyComponent.mockResolvedValue({
        status: "failed",
        name: "button",
        error: "Component files not found",
      });

      const result = await installStarwindDependencies(resolutions);

      expect(result).toEqual([
        {
          status: "failed",
          name: "button",
          error: "Component files not found",
        },
      ]);

      expect(mockUpdateConfig).not.toHaveBeenCalled();
    });

    it("should continue processing even if config update fails", async () => {
      const resolutions = [
        {
          component: "button",
          currentVersion: undefined,
          requiredVersion: "^2.1.0",
          needsInstall: true,
          needsUpdate: false,
          isStarwindComponent: true,
        },
      ];

      mockCopyComponent.mockResolvedValue({
        status: "installed",
        name: "button",
        version: "2.1.0",
      });

      mockUpdateConfig.mockRejectedValue(new Error("Config write failed"));

      // Should not throw, just log error
      const result = await installStarwindDependencies(resolutions);

      expect(result).toEqual([
        {
          status: "installed",
          name: "button",
          version: "2.1.0",
        },
      ]);
    });
  });
});
