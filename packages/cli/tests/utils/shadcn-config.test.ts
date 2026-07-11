import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
  addStarwindProRegistry,
  componentsJsonExists,
  createDefaultShadcnConfig,
  getStarwindProRegistryFromComponentsConfig,
  hasStarwindProRegistry,
  importStarwindProRegistryFromComponentsJson,
  readComponentsJson,
  resolveStarwindProRegistryImport,
  type ShadcnConfig,
  setupShadcnProConfig,
  writeComponentsJson,
} from "../../src/utils/shadcn-config.js";
import { updateConfig, type StarwindConfig } from "../../src/utils/config.js";

// Mock fs-extra
vi.mock("fs-extra");

// Mock the fs utilities
vi.mock("../../src/utils/fs.js", () => ({
  fileExists: vi.fn(),
  readJsonFile: vi.fn(),
  writeJsonFile: vi.fn(),
}));

vi.mock("../../src/utils/config.js", async (importOriginal) => {
  const actual = await importOriginal<typeof import("../../src/utils/config.js")>();

  return {
    ...actual,
    updateConfig: vi.fn(),
  };
});

import { fileExists, readJsonFile, writeJsonFile } from "../../src/utils/fs.js";

const mockFileExists = vi.mocked(fileExists);
const mockReadJsonFile = vi.mocked(readJsonFile);
const mockWriteJsonFile = vi.mocked(writeJsonFile);
const mockUpdateConfig = vi.mocked(updateConfig);

function runtimeConfig(overrides: Partial<StarwindConfig> = {}): StarwindConfig {
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
    components: [],
    ...overrides,
  };
}

describe("shadcn-config utilities", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  describe("createDefaultShadcnConfig", () => {
    it("should create default config with Starwind Pro registry", () => {
      const cssFilePath = "src/styles/starwind.css";
      const baseColor = "neutral";

      const config = createDefaultShadcnConfig(cssFilePath, baseColor);

      expect(config).toEqual({
        $schema: "https://ui.shadcn.com/schema.json",
        registries: {
          "@starwind-pro": {
            url: "https://pro.starwind.dev/r/{name}",
            headers: {
              Authorization: "Bearer ${STARWIND_LICENSE_KEY}",
            },
          },
        },
        aliases: {
          components: "@/components",
          utils: "@/lib/utils",
        },
        tailwind: {
          config: "",
          css: cssFilePath,
          baseColor,
          cssVariables: true,
        },
        style: "new-york",
        rsc: true,
      });
    });

    it("should use default base color when not provided", () => {
      const cssFilePath = "src/styles/starwind.css";

      const config = createDefaultShadcnConfig(cssFilePath);

      expect(config.tailwind?.baseColor).toBe("neutral");
    });
  });

  describe("componentsJsonExists", () => {
    it("should return true when components.json exists", async () => {
      mockFileExists.mockResolvedValue(true);

      const result = await componentsJsonExists();

      expect(result).toBe(true);
      expect(mockFileExists).toHaveBeenCalledWith("components.json");
    });

    it("should return false when components.json does not exist", async () => {
      mockFileExists.mockResolvedValue(false);

      const result = await componentsJsonExists();

      expect(result).toBe(false);
      expect(mockFileExists).toHaveBeenCalledWith("components.json");
    });
  });

  describe("readComponentsJson", () => {
    it("should read and return components.json content", async () => {
      const mockConfig: ShadcnConfig = {
        $schema: "https://ui.shadcn.com/schema.json",
        aliases: { components: "@/components" },
      };

      mockReadJsonFile.mockResolvedValue(mockConfig);

      const result = await readComponentsJson();

      expect(result).toEqual(mockConfig);
      expect(mockReadJsonFile).toHaveBeenCalledWith("components.json");
    });

    it("should throw error when reading fails", async () => {
      const error = new Error("File not found");
      mockReadJsonFile.mockRejectedValue(error);

      await expect(readComponentsJson()).rejects.toThrow(
        "Failed to read components.json: Error: File not found",
      );
    });
  });

  describe("writeComponentsJson", () => {
    it("should write components.json content", async () => {
      const mockConfig: ShadcnConfig = {
        $schema: "https://ui.shadcn.com/schema.json",
        aliases: { components: "@/components" },
      };

      mockWriteJsonFile.mockResolvedValue();

      await writeComponentsJson(mockConfig);

      expect(mockWriteJsonFile).toHaveBeenCalledWith("components.json", mockConfig);
    });

    it("should throw error when writing fails", async () => {
      const mockConfig: ShadcnConfig = {};
      const error = new Error("Permission denied");
      mockWriteJsonFile.mockRejectedValue(error);

      await expect(writeComponentsJson(mockConfig)).rejects.toThrow(
        "Failed to write components.json: Error: Permission denied",
      );
    });
  });

  describe("addStarwindProRegistry", () => {
    it("should add Starwind Pro registry to existing config", () => {
      const existingConfig: ShadcnConfig = {
        $schema: "https://ui.shadcn.com/schema.json",
        aliases: { components: "@/components" },
      };

      const result = addStarwindProRegistry(existingConfig);

      expect(result).toEqual({
        $schema: "https://ui.shadcn.com/schema.json",
        aliases: { components: "@/components" },
        registries: {
          "@starwind-pro": {
            url: "https://pro.starwind.dev/r/{name}",
            headers: {
              Authorization: "Bearer ${STARWIND_LICENSE_KEY}",
            },
          },
        },
      });
    });

    it("should update existing registries without overwriting other registries", () => {
      const existingConfig: ShadcnConfig = {
        $schema: "https://ui.shadcn.com/schema.json",
        registries: {
          "@other-registry": {
            url: "https://example.com/registry",
          },
        },
        aliases: { components: "@/components" },
      };

      const result = addStarwindProRegistry(existingConfig);

      expect(result.registries).toEqual({
        "@other-registry": {
          url: "https://example.com/registry",
        },
        "@starwind-pro": {
          url: "https://pro.starwind.dev/r/{name}",
          headers: {
            Authorization: "Bearer ${STARWIND_LICENSE_KEY}",
          },
        },
      });
    });

    it("should not mutate the original config", () => {
      const existingConfig: ShadcnConfig = {
        $schema: "https://ui.shadcn.com/schema.json",
        aliases: { components: "@/components" },
      };

      const originalConfig = { ...existingConfig };
      const result = addStarwindProRegistry(existingConfig);

      expect(existingConfig).toEqual(originalConfig);
      expect(result).not.toBe(existingConfig);
    });
  });

  describe("hasStarwindProRegistry", () => {
    it("should return false when components.json does not exist", async () => {
      mockFileExists.mockResolvedValue(false);

      const result = await hasStarwindProRegistry();

      expect(result).toBe(false);
    });

    it("should return true when Starwind Pro registry exists", async () => {
      const mockConfig: ShadcnConfig = {
        registries: {
          "@starwind-pro": {
            url: "https://pro.starwind.dev/r/{name}",
          },
        },
      };

      mockFileExists.mockResolvedValue(true);
      mockReadJsonFile.mockResolvedValue(mockConfig);

      const result = await hasStarwindProRegistry();

      expect(result).toBe(true);
    });

    it("should return false when Starwind Pro registry does not exist", async () => {
      const mockConfig: ShadcnConfig = {
        registries: {
          "@other-registry": {
            url: "https://example.com/registry",
          },
        },
      };

      mockFileExists.mockResolvedValue(true);
      mockReadJsonFile.mockResolvedValue(mockConfig);

      const result = await hasStarwindProRegistry();

      expect(result).toBe(false);
    });

    it("should return false when registries is undefined", async () => {
      const mockConfig: ShadcnConfig = {
        $schema: "https://ui.shadcn.com/schema.json",
      };

      mockFileExists.mockResolvedValue(true);
      mockReadJsonFile.mockResolvedValue(mockConfig);

      const result = await hasStarwindProRegistry();

      expect(result).toBe(false);
    });

    it("should return false when reading config fails", async () => {
      mockFileExists.mockResolvedValue(true);
      mockReadJsonFile.mockRejectedValue(new Error("Read error"));

      const result = await hasStarwindProRegistry();

      expect(result).toBe(false);
    });
  });

  describe("setupShadcnProConfig", () => {
    it("should create new components.json when it does not exist", async () => {
      const cssFilePath = "src/styles/starwind.css";
      const baseColor = "slate";

      mockFileExists.mockResolvedValue(false);
      mockWriteJsonFile.mockResolvedValue();

      await setupShadcnProConfig(cssFilePath, baseColor);

      expect(mockWriteJsonFile).toHaveBeenCalledWith(
        "components.json",
        expect.objectContaining({
          $schema: "https://ui.shadcn.com/schema.json",
          registries: {
            "@starwind-pro": {
              url: "https://pro.starwind.dev/r/{name}",
              headers: {
                Authorization: "Bearer ${STARWIND_LICENSE_KEY}",
              },
            },
          },
          tailwind: expect.objectContaining({
            css: cssFilePath,
            baseColor,
          }),
        }),
      );
    });

    it("should update existing components.json when it exists", async () => {
      const cssFilePath = "src/styles/starwind.css";
      const baseColor = "neutral";

      const existingConfig: ShadcnConfig = {
        $schema: "https://ui.shadcn.com/schema.json",
        aliases: { components: "@/components" },
      };

      mockFileExists.mockResolvedValue(true);
      mockReadJsonFile.mockResolvedValue(existingConfig);
      mockWriteJsonFile.mockResolvedValue();

      await setupShadcnProConfig(cssFilePath, baseColor);

      expect(mockReadJsonFile).toHaveBeenCalledWith("components.json");
      expect(mockWriteJsonFile).toHaveBeenCalledWith(
        "components.json",
        expect.objectContaining({
          $schema: "https://ui.shadcn.com/schema.json",
          aliases: { components: "@/components" },
          registries: {
            "@starwind-pro": {
              url: "https://pro.starwind.dev/r/{name}",
              headers: {
                Authorization: "Bearer ${STARWIND_LICENSE_KEY}",
              },
            },
          },
        }),
      );
    });

    it("should use default base color when not provided", async () => {
      const cssFilePath = "src/styles/starwind.css";

      mockFileExists.mockResolvedValue(false);
      mockWriteJsonFile.mockResolvedValue();

      await setupShadcnProConfig(cssFilePath);

      expect(mockWriteJsonFile).toHaveBeenCalledWith(
        "components.json",
        expect.objectContaining({
          tailwind: expect.objectContaining({
            baseColor: "neutral",
          }),
        }),
      );
    });
  });

  describe("Starwind Pro registry import", () => {
    it("extracts URL, headers, and params from components.json registry config", () => {
      expect(
        getStarwindProRegistryFromComponentsConfig({
          registries: {
            "@starwind-pro": {
              url: "http://localhost:4321/r/{name}",
              headers: {
                Authorization: "Bearer ${LOCAL_STARWIND_KEY}",
              },
              params: {
                channel: "${STARWIND_PRO_CHANNEL}",
              },
            },
          },
        }),
      ).toEqual({
        url: "http://localhost:4321/r/{name}",
        headers: {
          Authorization: "Bearer ${LOCAL_STARWIND_KEY}",
        },
        params: {
          channel: "${STARWIND_PRO_CHANNEL}",
        },
      });
    });

    it("preserves a missing components.json header config as an empty Starwind header override", () => {
      expect(
        getStarwindProRegistryFromComponentsConfig({
          registries: {
            "@starwind-pro": {
              url: "http://localhost:4321/r/{name}",
            },
          },
        }),
      ).toEqual({
        url: "http://localhost:4321/r/{name}",
        headers: {},
      });
    });

    it("treats malformed components.json headers as incompatible", () => {
      expect(
        getStarwindProRegistryFromComponentsConfig({
          registries: {
            "@starwind-pro": {
              url: "http://localhost:4321/r/{name}",
              headers: {
                Authorization: 123,
              } as unknown as Record<string, string>,
            },
          },
        }),
      ).toBeUndefined();
    });

    it("silently imports compatible components.json Pro config when Starwind config has none", async () => {
      const componentsConfig: ShadcnConfig = {
        registries: {
          "@starwind-pro": {
            url: "http://localhost:4321/r/{name}",
            headers: {
              Authorization: "Bearer ${LOCAL_STARWIND_KEY}",
            },
            params: {
              channel: "beta",
            },
          },
        },
      };

      mockFileExists.mockResolvedValue(true);
      mockReadJsonFile.mockResolvedValue(componentsConfig);
      mockUpdateConfig.mockResolvedValue(undefined);

      const warn = vi.fn();
      const result = await importStarwindProRegistryFromComponentsJson(runtimeConfig(), { warn });

      expect(result.status).toBe("imported");
      expect(warn).not.toHaveBeenCalled();
      expect(mockUpdateConfig).toHaveBeenCalledWith({
        pro: {
          registry: {
            url: "http://localhost:4321/r/{name}",
            headers: {
              Authorization: "Bearer ${LOCAL_STARWIND_KEY}",
            },
            params: {
              channel: "beta",
            },
          },
        },
      });
      expect(mockWriteJsonFile).not.toHaveBeenCalled();
    });

    it("keeps Starwind config and warns when components.json disagrees", () => {
      const warn = vi.fn();
      const result = resolveStarwindProRegistryImport(
        runtimeConfig({
          pro: {
            registry: {
              url: "https://pro.starwind.dev/r/{name}",
              headers: {
                Authorization: "Bearer ${STARWIND_LICENSE_KEY}",
              },
            },
          },
        }),
        {
          url: "http://localhost:4321/r/{name}",
          headers: {
            Authorization: "Bearer ${LOCAL_STARWIND_KEY}",
          },
        },
        warn,
      );

      expect(result.status).toBe("conflict");
      expect(result.pro).toEqual({
        registry: {
          url: "https://pro.starwind.dev/r/{name}",
          headers: {
            Authorization: "Bearer ${STARWIND_LICENSE_KEY}",
          },
        },
      });
      expect(warn).toHaveBeenCalledWith(expect.stringContaining("starwind.config.json"));
    });

    it("does not import missing or irrelevant components.json config", async () => {
      mockFileExists.mockResolvedValue(true);
      mockReadJsonFile.mockResolvedValue({
        registries: {
          "@other": {
            url: "https://example.com/r/{name}",
          },
        },
      });

      const result = await importStarwindProRegistryFromComponentsJson(runtimeConfig());

      expect(result.status).toBe("missing");
      expect(mockUpdateConfig).not.toHaveBeenCalled();
    });
  });
});
