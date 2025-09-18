import { beforeEach, describe, expect, it, vi } from "vitest";

import * as config from "../config.js";
import {
  filterUninstalledDependencies,
  getInstalledComponentVersion,
  isStarwindDependency,
  parseStarwindDependency,
  resolveAllStarwindDependencies,
  resolveStarwindDependency,
  separateDependencies,
} from "../dependency-resolver.js";
import * as fs from "../fs.js";
import * as registry from "../registry.js";

// Mock the dependencies
vi.mock("../config.js");
vi.mock("../registry.js");
vi.mock("../fs.js");

const mockGetConfig = vi.mocked(config.getConfig);
const mockGetComponent = vi.mocked(registry.getComponent);
const mockReadJsonFile = vi.mocked(fs.readJsonFile);

describe("dependency-resolver", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("filterUninstalledDependencies", () => {
    it("should return all dependencies when package.json cannot be read", async () => {
      mockReadJsonFile.mockRejectedValue(new Error("File not found"));

      const dependencies = ["react@^18.0.0", "@types/node@^18.0.0"];
      const result = await filterUninstalledDependencies(dependencies);

      expect(result).toEqual(dependencies);
    });

    it("should handle package.json with undefined dependencies and devDependencies", async () => {
      mockReadJsonFile.mockResolvedValue({
        name: "test-package",
        version: "1.0.0",
        // No dependencies or devDependencies fields
      });

      const dependencies = ["react@^18.0.0", "@types/node@^18.0.0"];
      const result = await filterUninstalledDependencies(dependencies);

      expect(result).toEqual(dependencies);
    });

    it("should handle package.json with null dependencies and devDependencies", async () => {
      mockReadJsonFile.mockResolvedValue({
        name: "test-package",
        version: "1.0.0",
        dependencies: null,
        devDependencies: null,
      });

      const dependencies = ["react@^18.0.0", "@types/node@^18.0.0"];
      const result = await filterUninstalledDependencies(dependencies);

      expect(result).toEqual(dependencies);
    });

    it("should correctly parse regular packages with versions", async () => {
      mockReadJsonFile.mockResolvedValue({
        dependencies: {
          react: "^18.2.0",
          lodash: "4.17.21",
        },
        devDependencies: {
          typescript: "^5.0.0",
        },
      });

      const dependencies = [
        "react@^18.0.0",
        "lodash@^4.17.0",
        "typescript@^5.0.0",
        "missing@^1.0.0",
      ];
      const result = await filterUninstalledDependencies(dependencies);

      expect(result).toEqual(["missing@^1.0.0"]);
    });

    it("should correctly parse scoped packages with versions", async () => {
      mockReadJsonFile.mockResolvedValue({
        dependencies: {
          "@types/node": "^18.15.0",
          "@babel/core": "^7.20.0",
        },
        devDependencies: {
          "@typescript-eslint/parser": "^5.57.0",
        },
      });

      const dependencies = [
        "@types/node@^18.0.0",
        "@babel/core@^7.19.0",
        "@typescript-eslint/parser@^5.50.0",
        "@missing/package@^1.0.0",
      ];
      const result = await filterUninstalledDependencies(dependencies);

      expect(result).toEqual(["@missing/package@^1.0.0"]);
    });

    it("should handle scoped packages without versions", async () => {
      mockReadJsonFile.mockResolvedValue({
        dependencies: {
          "@types/node": "^18.15.0",
        },
      });

      const dependencies = ["@types/node", "@missing/package"];
      const result = await filterUninstalledDependencies(dependencies);

      expect(result).toEqual(["@missing/package"]);
    });

    it("should handle regular packages without versions", async () => {
      mockReadJsonFile.mockResolvedValue({
        dependencies: {
          react: "^18.2.0",
        },
      });

      const dependencies = ["react", "missing"];
      const result = await filterUninstalledDependencies(dependencies);

      expect(result).toEqual(["missing"]);
    });

    it("should handle complex scoped package names with multiple slashes", async () => {
      mockReadJsonFile.mockResolvedValue({
        dependencies: {
          "@org/sub/package": "^1.0.0",
        },
      });

      const dependencies = ["@org/sub/package@^1.0.0"];
      const result = await filterUninstalledDependencies(dependencies);

      expect(result).toEqual([]);
    });

    it("should handle version ranges and prefixes correctly", async () => {
      mockReadJsonFile.mockResolvedValue({
        dependencies: {
          react: "^18.2.0",
          lodash: "~4.17.21",
          axios: ">=1.0.0",
          moment: "2.29.4",
        },
      });

      const dependencies = [
        "react@^18.0.0", // Should satisfy ^18.2.0
        "lodash@^4.17.0", // Should satisfy ~4.17.21
        "axios@^1.0.0", // Should satisfy >=1.0.0
        "moment@^2.29.0", // Should satisfy 2.29.4
      ];
      const result = await filterUninstalledDependencies(dependencies);

      expect(result).toEqual([]);
    });

    it("should require installation when versions don't satisfy", async () => {
      mockReadJsonFile.mockResolvedValue({
        dependencies: {
          react: "^17.0.0", // Doesn't satisfy ^18.0.0
          lodash: "^3.0.0", // Doesn't satisfy ^4.0.0
        },
      });

      const dependencies = ["react@^18.0.0", "lodash@^4.0.0"];
      const result = await filterUninstalledDependencies(dependencies);

      expect(result).toEqual(["react@^18.0.0", "lodash@^4.0.0"]);
    });

    it("should handle malformed version strings gracefully", async () => {
      mockReadJsonFile.mockResolvedValue({
        dependencies: {
          react: "invalid-version",
          lodash: "file:../local-package",
          axios: "git+https://github.com/axios/axios.git",
        },
      });

      const dependencies = ["react@^18.0.0", "lodash@^4.0.0", "axios@^1.0.0"];
      const result = await filterUninstalledDependencies(dependencies);

      // All should be marked for installation due to semver comparison failures
      expect(result).toEqual(["react@^18.0.0", "lodash@^4.0.0", "axios@^1.0.0"]);
    });

    it("should handle empty dependency arrays", async () => {
      mockReadJsonFile.mockResolvedValue({
        dependencies: {},
        devDependencies: {},
      });

      const result = await filterUninstalledDependencies([]);
      expect(result).toEqual([]);
    });

    it("should handle edge case scoped packages with @ in the middle", async () => {
      mockReadJsonFile.mockResolvedValue({
        dependencies: {
          "@scope/name": "^1.0.0",
        },
      });

      // Test various edge cases with @ placement
      const dependencies = [
        "@scope/name@^1.0.0", // Normal case - should be satisfied
        "@scope/name@with@symbols@^2.0.0", // Multiple @ symbols - should need installation
        "@scope/name", // No version - should be satisfied (no version check)
      ];
      const result = await filterUninstalledDependencies(dependencies);

      // Only the one with multiple @ symbols should need installation
      // The package without version (@scope/name) should be satisfied since it exists
      expect(result).toEqual(["@scope/name@with@symbols@^2.0.0"]);
    });

    it("should handle packages with pre-release versions", async () => {
      mockReadJsonFile.mockResolvedValue({
        dependencies: {
          react: "18.0.0-beta.1",
          "@types/node": "18.0.0-alpha.2",
        },
      });

      const dependencies = ["react@^18.0.0-beta.0", "@types/node@^18.0.0-alpha.1"];
      const result = await filterUninstalledDependencies(dependencies);

      expect(result).toEqual([]);
    });

    it("should handle mixed dependencies and devDependencies", async () => {
      mockReadJsonFile.mockResolvedValue({
        dependencies: {
          react: "^18.0.0",
        },
        devDependencies: {
          "@types/react": "^18.0.0",
          typescript: "^5.0.0",
        },
      });

      const dependencies = [
        "react@^18.0.0",
        "@types/react@^18.0.0",
        "typescript@^5.0.0",
        "missing@^1.0.0",
      ];
      const result = await filterUninstalledDependencies(dependencies);

      expect(result).toEqual(["missing@^1.0.0"]);
    });

    it("should handle packages with build metadata in versions", async () => {
      mockReadJsonFile.mockResolvedValue({
        dependencies: {
          react: "18.0.0+build.123",
        },
      });

      const dependencies = ["react@^18.0.0"];
      const result = await filterUninstalledDependencies(dependencies);

      expect(result).toEqual([]);
    });
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
