import { beforeEach, describe, expect, it, vi } from "vitest";

import * as config from "../config.js";
import {
  getInstalledComponentVersion,
  isStarwindDependency,
  parseStarwindDependency,
  resolveAllStarwindDependencies,
  resolveStarwindDependency,
  separateDependencies,
} from "../dependency-resolver.js";
import * as registry from "../registry.js";

// Mock the dependencies
vi.mock("../config.js");
vi.mock("../registry.js");

const mockGetConfig = vi.mocked(config.getConfig);
const mockGetComponent = vi.mocked(registry.getComponent);

describe("dependency-resolver", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("parseStarwindDependency", () => {
    it("should parse valid Starwind dependency", () => {
      const result = parseStarwindDependency("@starwind-ui/core/button@^2.1.0");
      expect(result).toEqual({
        name: "button",
        version: "^2.1.0",
        originalSpec: "@starwind-ui/core/button@^2.1.0",
      });
    });

    it("should parse dependency with exact version", () => {
      const result = parseStarwindDependency("@starwind-ui/core/input@1.0.0");
      expect(result).toEqual({
        name: "input",
        version: "1.0.0",
        originalSpec: "@starwind-ui/core/input@1.0.0",
      });
    });

    it("should return null for non-Starwind dependency", () => {
      const result = parseStarwindDependency("react@^18.0.0");
      expect(result).toBeNull();
    });

    it("should return null for malformed Starwind dependency", () => {
      const result = parseStarwindDependency("@starwind-ui/core/button");
      expect(result).toBeNull();
    });

    it("should return null for empty string", () => {
      const result = parseStarwindDependency("");
      expect(result).toBeNull();
    });
  });

  describe("isStarwindDependency", () => {
    it("should return true for valid Starwind dependency", () => {
      expect(isStarwindDependency("@starwind-ui/core/button@^2.1.0")).toBe(true);
    });

    it("should return false for npm dependency", () => {
      expect(isStarwindDependency("react@^18.0.0")).toBe(false);
    });

    it("should return false for empty string", () => {
      expect(isStarwindDependency("")).toBe(false);
    });
  });

  describe("separateDependencies", () => {
    it("should separate Starwind and npm dependencies", () => {
      const dependencies = [
        "@starwind-ui/core/button@^2.1.0",
        "react@^18.0.0",
        "@starwind-ui/core/input@^1.0.0",
        "zod@^3.0.0",
      ];

      const result = separateDependencies(dependencies);

      expect(result).toEqual({
        starwindDependencies: ["@starwind-ui/core/button@^2.1.0", "@starwind-ui/core/input@^1.0.0"],
        npmDependencies: ["react@^18.0.0", "zod@^3.0.0"],
      });
    });

    it("should handle empty array", () => {
      const result = separateDependencies([]);
      expect(result).toEqual({
        starwindDependencies: [],
        npmDependencies: [],
      });
    });

    it("should handle only Starwind dependencies", () => {
      const dependencies = ["@starwind-ui/core/button@^2.1.0"];
      const result = separateDependencies(dependencies);
      expect(result).toEqual({
        starwindDependencies: ["@starwind-ui/core/button@^2.1.0"],
        npmDependencies: [],
      });
    });

    it("should handle only npm dependencies", () => {
      const dependencies = ["react@^18.0.0", "zod@^3.0.0"];
      const result = separateDependencies(dependencies);
      expect(result).toEqual({
        starwindDependencies: [],
        npmDependencies: ["react@^18.0.0", "zod@^3.0.0"],
      });
    });
  });

  describe("getInstalledComponentVersion", () => {
    it("should return version if component is installed", async () => {
      mockGetConfig.mockResolvedValue({
        $schema: "test",
        tailwind: { css: "test", baseColor: "neutral", cssVariables: true },
        componentDir: "test",
        components: [
          { name: "button", version: "2.0.0" },
          { name: "input", version: "1.0.0" },
        ],
      });

      const result = await getInstalledComponentVersion("button");
      expect(result).toBe("2.0.0");
    });

    it("should return undefined if component is not installed", async () => {
      mockGetConfig.mockResolvedValue({
        $schema: "test",
        tailwind: { css: "test", baseColor: "neutral", cssVariables: true },
        componentDir: "test",
        components: [{ name: "input", version: "1.0.0" }],
      });

      const result = await getInstalledComponentVersion("button");
      expect(result).toBeUndefined();
    });

    it("should return undefined if config fails to load", async () => {
      mockGetConfig.mockRejectedValue(new Error("Config not found"));

      const result = await getInstalledComponentVersion("button");
      expect(result).toBeUndefined();
    });
  });

  describe("resolveStarwindDependency", () => {
    beforeEach(() => {
      mockGetConfig.mockResolvedValue({
        $schema: "test",
        tailwind: { css: "test", baseColor: "neutral", cssVariables: true },
        componentDir: "test",
        components: [],
      });
    });

    it("should return non-Starwind dependency as is", async () => {
      const result = await resolveStarwindDependency("react@^18.0.0");
      expect(result).toEqual({
        component: "react@^18.0.0",
        requiredVersion: "",
        needsInstall: false,
        needsUpdate: false,
        isStarwindComponent: false,
      });
    });

    it("should resolve new component installation", async () => {
      mockGetComponent.mockResolvedValue({
        name: "button",
        version: "2.1.0",
        dependencies: [],
        type: "component",
      });

      const result = await resolveStarwindDependency("@starwind-ui/core/button@^2.1.0");
      expect(result).toEqual({
        component: "button",
        currentVersion: undefined,
        requiredVersion: "^2.1.0",
        needsInstall: true,
        needsUpdate: false,
        isStarwindComponent: true,
      });
    });

    it("should resolve component update when version doesn't satisfy", async () => {
      mockGetConfig.mockResolvedValue({
        $schema: "test",
        tailwind: { css: "test", baseColor: "neutral", cssVariables: true },
        componentDir: "test",
        components: [{ name: "button", version: "2.0.0" }],
      });

      mockGetComponent.mockResolvedValue({
        name: "button",
        version: "2.1.0",
        dependencies: [],
        type: "component",
      });

      const result = await resolveStarwindDependency("@starwind-ui/core/button@^2.1.0");
      expect(result).toEqual({
        component: "button",
        currentVersion: "2.0.0",
        requiredVersion: "^2.1.0",
        needsInstall: false,
        needsUpdate: true,
        isStarwindComponent: true,
      });
    });

    it("should not require action when version satisfies requirement", async () => {
      mockGetConfig.mockResolvedValue({
        $schema: "test",
        tailwind: { css: "test", baseColor: "neutral", cssVariables: true },
        componentDir: "test",
        components: [{ name: "button", version: "2.1.0" }],
      });

      mockGetComponent.mockResolvedValue({
        name: "button",
        version: "2.1.0",
        dependencies: [],
        type: "component",
      });

      const result = await resolveStarwindDependency("@starwind-ui/core/button@^2.1.0");
      expect(result).toEqual({
        component: "button",
        currentVersion: "2.1.0",
        requiredVersion: "^2.1.0",
        needsInstall: false,
        needsUpdate: false,
        isStarwindComponent: true,
      });
    });

    it("should throw error if component not found in registry", async () => {
      mockGetComponent.mockResolvedValue(undefined);

      await expect(
        resolveStarwindDependency("@starwind-ui/core/nonexistent@^1.0.0"),
      ).rejects.toThrow('Starwind component "nonexistent" not found in registry');
    });

    it("should throw error if no version satisfies requirement", async () => {
      mockGetConfig.mockResolvedValue({
        $schema: "test",
        tailwind: { css: "test", baseColor: "neutral", cssVariables: true },
        componentDir: "test",
        components: [{ name: "button", version: "1.0.0" }],
      });

      mockGetComponent.mockResolvedValue({
        name: "button",
        version: "1.5.0",
        dependencies: [],
        type: "component",
      });

      await expect(resolveStarwindDependency("@starwind-ui/core/button@^2.0.0")).rejects.toThrow(
        'No version of "button" satisfies requirement "^2.0.0". Latest available: 1.5.0, currently installed: 1.0.0',
      );
    });
  });

  describe("resolveAllStarwindDependencies", () => {
    beforeEach(() => {
      mockGetConfig.mockResolvedValue({
        $schema: "test",
        tailwind: { css: "test", baseColor: "neutral", cssVariables: true },
        componentDir: "test",
        components: [],
      });
    });

    it("should resolve dependencies recursively", async () => {
      // Mock alert-dialog component with button dependency
      mockGetComponent
        .mockResolvedValueOnce({
          name: "alert-dialog",
          version: "1.0.0",
          dependencies: ["@starwind-ui/core/button@^2.1.0"],
          type: "component",
        })
        .mockResolvedValueOnce({
          name: "button",
          version: "2.1.0",
          dependencies: [],
          type: "component",
        });

      const result = await resolveAllStarwindDependencies(["alert-dialog"]);

      expect(result).toEqual([
        {
          component: "button",
          currentVersion: undefined,
          requiredVersion: "^2.1.0",
          needsInstall: true,
          needsUpdate: false,
          isStarwindComponent: true,
        },
      ]);
    });

    it("should handle components with no dependencies", async () => {
      mockGetComponent.mockResolvedValue({
        name: "button",
        version: "2.1.0",
        dependencies: [],
        type: "component",
      });

      const result = await resolveAllStarwindDependencies(["button"]);
      expect(result).toEqual([]);
    });

    it("should avoid circular dependencies", async () => {
      // This would be an edge case, but the Set should prevent infinite loops
      mockGetComponent.mockResolvedValue({
        name: "button",
        version: "2.1.0",
        dependencies: [],
        type: "component",
      });

      const result = await resolveAllStarwindDependencies(["button", "button"]);
      expect(result).toEqual([]);
    });

    it("should throw error if component not found", async () => {
      mockGetComponent.mockResolvedValue(undefined);

      await expect(resolveAllStarwindDependencies(["nonexistent"])).rejects.toThrow(
        'Component "nonexistent" not found in registry',
      );
    });

    it("should remove duplicates and prioritize installs over updates", async () => {
      mockGetConfig.mockResolvedValue({
        $schema: "test",
        tailwind: { css: "test", baseColor: "neutral", cssVariables: true },
        componentDir: "test",
        components: [{ name: "button", version: "2.0.0" }],
      });

      // Mock components - button component should be returned for dependency resolution
      mockGetComponent.mockImplementation((name: string) => {
        if (name === "alert-dialog") {
          return Promise.resolve({
            name: "alert-dialog",
            version: "1.0.0",
            dependencies: ["@starwind-ui/core/button@^2.1.0"],
            type: "component",
          });
        }
        if (name === "button") {
          return Promise.resolve({
            name: "button",
            version: "2.1.0",
            dependencies: [],
            type: "component",
          });
        }
        return Promise.resolve(undefined);
      });

      const result = await resolveAllStarwindDependencies(["alert-dialog"]);

      // Should have one button resolution (update)
      expect(result).toHaveLength(1);
      expect(result[0]).toEqual({
        component: "button",
        currentVersion: "2.0.0",
        requiredVersion: "^2.1.0",
        needsInstall: false,
        needsUpdate: true,
        isStarwindComponent: true,
      });
    });
  });
});
