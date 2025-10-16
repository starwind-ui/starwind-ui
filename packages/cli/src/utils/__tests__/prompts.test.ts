import * as clackPrompts from "@clack/prompts";
import { beforeEach, describe, expect, it, vi } from "vitest";

import * as dependencyResolver from "../dependency-resolver.js";
import {
  confirmInstall,
  confirmStarwindDependencies,
  getStarwindDependencyResolutions,
  selectComponents,
} from "../prompts.js";
import * as registry from "../registry.js";

// Mock dependencies
vi.mock("@clack/prompts");
vi.mock("../dependency-resolver.js");
vi.mock("../registry.js");

const mockConfirm = vi.mocked(clackPrompts.confirm);
const mockMultiselect = vi.mocked(clackPrompts.multiselect);
const mockResolveAllStarwindDependencies = vi.mocked(
  dependencyResolver.resolveAllStarwindDependencies,
);
const mockSeparateDependencies = vi.mocked(dependencyResolver.separateDependencies);
const mockFilterUninstalledDependencies = vi.mocked(
  dependencyResolver.filterUninstalledDependencies,
);
const mockGetAllComponents = vi.mocked(registry.getAllComponents);

describe("prompts", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("selectComponents", () => {
    it("should return selected components", async () => {
      const mockComponents = [
        { name: "button", version: "2.1.0", dependencies: [], type: "component" as const },
        { name: "input", version: "1.0.0", dependencies: [], type: "component" as const },
      ];

      mockGetAllComponents.mockResolvedValue(mockComponents);
      mockMultiselect.mockResolvedValue(["button", "input"]);

      const result = await selectComponents();

      expect(result).toEqual(["button", "input"]);
      expect(mockMultiselect).toHaveBeenCalledWith({
        message: "Select components to add",
        options: [
          { label: "button", value: "button" },
          { label: "input", value: "input" },
        ],
        required: false,
      });
    });

    it("should return empty array if user cancels", async () => {
      const mockComponents = [
        { name: "button", version: "2.1.0", dependencies: [], type: "component" as const },
      ];

      mockGetAllComponents.mockResolvedValue(mockComponents);
      mockMultiselect.mockResolvedValue(Symbol("cancel"));

      const result = await selectComponents();

      expect(result).toEqual([]);
    });
  });

  describe("confirmInstall", () => {
    it("should return true for component without dependencies", async () => {
      const component = {
        name: "button",
        version: "2.1.0",
        dependencies: [],
        type: "component" as const,
      };

      const result = await confirmInstall(component);

      expect(result).toBe(true);
      expect(mockConfirm).not.toHaveBeenCalled();
    });

    it("should handle npm dependencies only", async () => {
      const component = {
        name: "form",
        version: "1.0.0",
        dependencies: ["react@^18.0.0", "zod@^3.0.0"],
        type: "component" as const,
      };

      mockSeparateDependencies.mockReturnValue({
        starwindDependencies: [],
        npmDependencies: ["react@^18.0.0", "zod@^3.0.0"],
      });
      mockFilterUninstalledDependencies.mockResolvedValue(["react@^18.0.0", "zod@^3.0.0"]);
      mockConfirm.mockResolvedValue(true);

      const result = await confirmInstall(component);

      expect(result).toBe(true);
      expect(mockConfirm).toHaveBeenCalledWith({
        message:
          "This component requires the following npm dependencies: react@^18.0.0, zod@^3.0.0. Install them?",
      });
    });

    it("should handle Starwind dependencies only", async () => {
      const component = {
        name: "alert-dialog",
        version: "1.0.0",
        dependencies: ["@starwind-ui/core/button@^2.1.0"],
        type: "component" as const,
      };

      mockSeparateDependencies.mockReturnValue({
        starwindDependencies: ["@starwind-ui/core/button@^2.1.0"],
        npmDependencies: [],
      });
      mockResolveAllStarwindDependencies.mockResolvedValue([
        {
          component: "button",
          currentVersion: undefined,
          requiredVersion: "^2.1.0",
          needsInstall: true,
          needsUpdate: false,
          isStarwindComponent: true,
        },
      ]);
      mockConfirm.mockResolvedValue(true);

      const result = await confirmInstall(component);

      expect(result).toBe(true);
    });

    it("should handle mixed dependencies", async () => {
      const component = {
        name: "complex-form",
        version: "1.0.0",
        dependencies: ["react@^18.0.0", "@starwind-ui/core/button@^2.1.0"],
        type: "component" as const,
      };

      mockSeparateDependencies.mockReturnValue({
        starwindDependencies: ["@starwind-ui/core/button@^2.1.0"],
        npmDependencies: ["react@^18.0.0"],
      });
      mockFilterUninstalledDependencies.mockResolvedValue(["react@^18.0.0"]);
      mockResolveAllStarwindDependencies.mockResolvedValue([
        {
          component: "button",
          currentVersion: undefined,
          requiredVersion: "^2.1.0",
          needsInstall: true,
          needsUpdate: false,
          isStarwindComponent: true,
        },
      ]);
      mockConfirm.mockResolvedValueOnce(true).mockResolvedValueOnce(true);

      const result = await confirmInstall(component);

      expect(result).toBe(true);
      expect(mockConfirm).toHaveBeenCalledTimes(2);
    });

    it("should return false if user cancels npm dependencies", async () => {
      const component = {
        name: "form",
        version: "1.0.0",
        dependencies: ["react@^18.0.0"],
        type: "component" as const,
      };

      mockSeparateDependencies.mockReturnValue({
        starwindDependencies: [],
        npmDependencies: ["react@^18.0.0"],
      });
      mockFilterUninstalledDependencies.mockResolvedValue(["react@^18.0.0"]);
      mockConfirm.mockResolvedValue(false);

      const result = await confirmInstall(component);

      expect(result).toBe(false);
    });

    it("should return false if user cancels Starwind dependencies", async () => {
      const component = {
        name: "alert-dialog",
        version: "1.0.0",
        dependencies: ["@starwind-ui/core/button@^2.1.0"],
        type: "component" as const,
      };

      mockSeparateDependencies.mockReturnValue({
        starwindDependencies: ["@starwind-ui/core/button@^2.1.0"],
        npmDependencies: [],
      });
      mockResolveAllStarwindDependencies.mockResolvedValue([
        {
          component: "button",
          currentVersion: undefined,
          requiredVersion: "^2.1.0",
          needsInstall: true,
          needsUpdate: false,
          isStarwindComponent: true,
        },
      ]);
      mockConfirm.mockResolvedValue(false);

      const result = await confirmInstall(component);

      expect(result).toBe(false);
    });

    it("should return false if confirm returns symbol (cancel)", async () => {
      const component = {
        name: "form",
        version: "1.0.0",
        dependencies: ["react@^18.0.0"],
        type: "component" as const,
      };

      mockSeparateDependencies.mockReturnValue({
        starwindDependencies: [],
        npmDependencies: ["react@^18.0.0"],
      });
      mockFilterUninstalledDependencies.mockResolvedValue(["react@^18.0.0"]);
      mockConfirm.mockResolvedValue(Symbol("cancel"));

      const result = await confirmInstall(component);

      expect(result).toBe(false);
    });
  });

  describe("confirmStarwindDependencies", () => {
    it("should return true if no dependencies to handle", async () => {
      mockResolveAllStarwindDependencies.mockResolvedValue([]);

      const result = await confirmStarwindDependencies(["button"]);

      expect(result).toBe(true);
      expect(mockConfirm).not.toHaveBeenCalled();
    });

    it("should show install dependencies and get confirmation", async () => {
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
          currentVersion: undefined,
          requiredVersion: "^1.0.0",
          needsInstall: true,
          needsUpdate: false,
          isStarwindComponent: true,
        },
      ];

      mockResolveAllStarwindDependencies.mockResolvedValue(resolutions);
      mockConfirm.mockResolvedValue(true);

      const result = await confirmStarwindDependencies(["alert-dialog"]);

      expect(result).toBe(true);
      expect(mockConfirm).toHaveBeenCalledWith({
        message: expect.stringContaining("This component has Starwind component dependencies:"),
      });

      const callArgs = mockConfirm.mock.calls[0][0];
      expect(callArgs.message).toContain("Components to install:");
      expect(callArgs.message).toContain("• button (requires ^2.1.0)");
      expect(callArgs.message).toContain("• input (requires ^1.0.0)");
    });

    it("should show update dependencies and get confirmation", async () => {
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

      mockResolveAllStarwindDependencies.mockResolvedValue(resolutions);
      mockConfirm.mockResolvedValue(true);

      const result = await confirmStarwindDependencies(["alert-dialog"]);

      expect(result).toBe(true);

      const callArgs = mockConfirm.mock.calls[0][0];
      expect(callArgs.message).toContain("Components to update:");
      expect(callArgs.message).toContain("• button (2.0.0 → latest, requires ^2.1.0)");
    });

    it("should show mixed install and update dependencies", async () => {
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

      mockResolveAllStarwindDependencies.mockResolvedValue(resolutions);
      mockConfirm.mockResolvedValue(true);

      const result = await confirmStarwindDependencies(["complex-component"]);

      expect(result).toBe(true);

      const callArgs = mockConfirm.mock.calls[0][0];
      expect(callArgs.message).toContain("Components to install:");
      expect(callArgs.message).toContain("• button (requires ^2.1.0)");
      expect(callArgs.message).toContain("Components to update:");
      expect(callArgs.message).toContain("• input (1.0.0 → latest, requires ^1.1.0)");
    });

    it("should return false if user cancels", async () => {
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

      mockResolveAllStarwindDependencies.mockResolvedValue(resolutions);
      mockConfirm.mockResolvedValue(false);

      const result = await confirmStarwindDependencies(["alert-dialog"]);

      expect(result).toBe(false);
    });

    it("should return false if confirm returns symbol (cancel)", async () => {
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

      mockResolveAllStarwindDependencies.mockResolvedValue(resolutions);
      mockConfirm.mockResolvedValue(Symbol("cancel"));

      const result = await confirmStarwindDependencies(["alert-dialog"]);

      expect(result).toBe(false);
    });

    it("should handle errors gracefully", async () => {
      mockResolveAllStarwindDependencies.mockRejectedValue(new Error("Registry error"));
      mockConfirm.mockResolvedValue(true);

      const result = await confirmStarwindDependencies(["alert-dialog"]);

      expect(result).toBe(true);
      expect(mockConfirm).toHaveBeenCalledWith({
        message: "Error resolving dependencies: Registry error. Continue anyway?",
      });
    });

    it("should return false if user cancels after error", async () => {
      mockResolveAllStarwindDependencies.mockRejectedValue(new Error("Registry error"));
      mockConfirm.mockResolvedValue(false);

      const result = await confirmStarwindDependencies(["alert-dialog"]);

      expect(result).toBe(false);
    });
  });

  describe("getStarwindDependencyResolutions", () => {
    it("should return dependency resolutions", async () => {
      const expectedResolutions = [
        {
          component: "button",
          currentVersion: undefined,
          requiredVersion: "^2.1.0",
          needsInstall: true,
          needsUpdate: false,
          isStarwindComponent: true,
        },
      ];

      mockResolveAllStarwindDependencies.mockResolvedValue(expectedResolutions);

      const result = await getStarwindDependencyResolutions(["alert-dialog"]);

      expect(result).toEqual(expectedResolutions);
      expect(mockResolveAllStarwindDependencies).toHaveBeenCalledWith(["alert-dialog"]);
    });

    it("should handle empty component list", async () => {
      mockResolveAllStarwindDependencies.mockResolvedValue([]);

      const result = await getStarwindDependencyResolutions([]);

      expect(result).toEqual([]);
      expect(mockResolveAllStarwindDependencies).toHaveBeenCalledWith([]);
    });
  });
});
