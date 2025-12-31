import * as p from "@clack/prompts";
import { beforeEach, describe, expect, it, vi } from "vitest";

import * as fsUtils from "../fs.js";
import {
  createDefaultTsConfig,
  mergeTsConfig,
  setupTsConfig,
  validateTsConfig,
} from "../tsconfig.js";

// Mock dependencies
vi.mock("@clack/prompts");
vi.mock("../fs.js");

const mockFileExists = vi.mocked(fsUtils.fileExists);
const mockReadJsonFile = vi.mocked(fsUtils.readJsonFile);
const mockWriteJsonFile = vi.mocked(fsUtils.writeJsonFile);
const mockLogError = vi.fn();

describe("tsconfig", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(p.log).error = mockLogError;
  });

  describe("validateTsConfig", () => {
    it("should return all false for empty config", () => {
      const result = validateTsConfig({});

      expect(result).toEqual({
        hasExtends: false,
        hasBaseUrl: false,
        hasPathAlias: false,
        isComplete: false,
      });
    });

    it("should detect valid extends", () => {
      const result = validateTsConfig({
        extends: "astro/tsconfigs/strict",
      });

      expect(result.hasExtends).toBe(true);
      expect(result.isComplete).toBe(false);
    });

    it("should detect invalid extends", () => {
      const result = validateTsConfig({
        extends: "some/other/config",
      });

      expect(result.hasExtends).toBe(false);
    });

    it("should detect valid baseUrl", () => {
      const result = validateTsConfig({
        compilerOptions: {
          baseUrl: ".",
        },
      });

      expect(result.hasBaseUrl).toBe(true);
      expect(result.isComplete).toBe(false);
    });

    it("should detect invalid baseUrl", () => {
      const result = validateTsConfig({
        compilerOptions: {
          baseUrl: "./src",
        },
      });

      expect(result.hasBaseUrl).toBe(false);
    });

    it("should detect valid path alias", () => {
      const result = validateTsConfig({
        compilerOptions: {
          paths: {
            "@/*": ["src/*"],
          },
        },
      });

      expect(result.hasPathAlias).toBe(true);
      expect(result.isComplete).toBe(false);
    });

    it("should detect missing @/* path alias", () => {
      const result = validateTsConfig({
        compilerOptions: {
          paths: {
            "~/*": ["src/*"],
          },
        },
      });

      expect(result.hasPathAlias).toBe(false);
    });

    it("should detect @/* alias without src/*", () => {
      const result = validateTsConfig({
        compilerOptions: {
          paths: {
            "@/*": ["lib/*"],
          },
        },
      });

      expect(result.hasPathAlias).toBe(false);
    });

    it("should detect @/* alias with src/* among other paths", () => {
      const result = validateTsConfig({
        compilerOptions: {
          paths: {
            "@/*": ["src/*", "lib/*"],
          },
        },
      });

      expect(result.hasPathAlias).toBe(true);
    });

    it("should return isComplete true when all requirements are met", () => {
      const result = validateTsConfig({
        extends: "astro/tsconfigs/strict",
        compilerOptions: {
          baseUrl: ".",
          paths: {
            "@/*": ["src/*"],
          },
        },
      });

      expect(result).toEqual({
        hasExtends: true,
        hasBaseUrl: true,
        hasPathAlias: true,
        isComplete: true,
      });
    });

    it("should handle missing compilerOptions", () => {
      const result = validateTsConfig({
        extends: "astro/tsconfigs/strict",
      });

      expect(result.hasBaseUrl).toBe(false);
      expect(result.hasPathAlias).toBe(false);
    });

    it("should handle missing paths in compilerOptions", () => {
      const result = validateTsConfig({
        compilerOptions: {
          baseUrl: ".",
        },
      });

      expect(result.hasPathAlias).toBe(false);
    });

    it("should handle paths that is not an array", () => {
      const result = validateTsConfig({
        compilerOptions: {
          paths: {
            "@/*": "src/*" as unknown as string[],
          },
        },
      });

      expect(result.hasPathAlias).toBe(false);
    });
  });

  describe("mergeTsConfig", () => {
    it("should return existing config if already complete", () => {
      const existingConfig = {
        extends: "astro/tsconfigs/strict",
        compilerOptions: {
          baseUrl: ".",
          paths: {
            "@/*": ["src/*"],
          },
        },
      };

      const result = mergeTsConfig(existingConfig);

      expect(result).toEqual(existingConfig);
    });

    it("should add extends if missing", () => {
      const existingConfig = {
        compilerOptions: {
          baseUrl: ".",
          paths: {
            "@/*": ["src/*"],
          },
        },
      };

      const result = mergeTsConfig(existingConfig);

      expect(result.extends).toBe("astro/tsconfigs/strict");
    });

    it("should not override existing extends", () => {
      const existingConfig = {
        extends: "astro/tsconfigs/strict",
        compilerOptions: {},
      };

      const result = mergeTsConfig(existingConfig);

      expect(result.extends).toBe("astro/tsconfigs/strict");
    });

    it("should add baseUrl if missing", () => {
      const existingConfig = {
        extends: "astro/tsconfigs/strict",
        compilerOptions: {
          paths: {
            "@/*": ["src/*"],
          },
        },
      };

      const result = mergeTsConfig(existingConfig);

      expect(result.compilerOptions?.baseUrl).toBe(".");
    });

    it("should not override existing baseUrl that matches", () => {
      const existingConfig = {
        extends: "astro/tsconfigs/strict",
        compilerOptions: {
          baseUrl: ".",
          strict: true,
        },
      };

      const result = mergeTsConfig(existingConfig);

      expect(result.compilerOptions?.baseUrl).toBe(".");
      expect(result.compilerOptions?.strict).toBe(true);
    });

    it("should add paths if missing", () => {
      const existingConfig = {
        extends: "astro/tsconfigs/strict",
        compilerOptions: {
          baseUrl: ".",
        },
      };

      const result = mergeTsConfig(existingConfig);

      expect(result.compilerOptions?.paths).toEqual({
        "@/*": ["src/*"],
      });
    });

    it("should add @/* path alias if paths exists but @/* is missing", () => {
      const existingConfig = {
        extends: "astro/tsconfigs/strict",
        compilerOptions: {
          baseUrl: ".",
          paths: {
            "~/*": ["lib/*"],
          },
        },
      };

      const result = mergeTsConfig(existingConfig);

      expect(result.compilerOptions?.paths).toEqual({
        "~/*": ["lib/*"],
        "@/*": ["src/*"],
      });
    });

    it("should preserve existing path aliases when adding @/*", () => {
      const existingConfig = {
        extends: "astro/tsconfigs/strict",
        compilerOptions: {
          baseUrl: ".",
          paths: {
            "$lib/*": ["src/lib/*"],
            "~/*": ["src/components/*"],
          },
        },
      };

      const result = mergeTsConfig(existingConfig);

      expect(result.compilerOptions?.paths).toEqual({
        "$lib/*": ["src/lib/*"],
        "~/*": ["src/components/*"],
        "@/*": ["src/*"],
      });
    });

    it("should not modify @/* if it already includes src/*", () => {
      const existingConfig = {
        extends: "astro/tsconfigs/strict",
        compilerOptions: {
          baseUrl: ".",
          paths: {
            "@/*": ["src/*", "lib/*"],
          },
        },
      };

      const result = mergeTsConfig(existingConfig);

      expect(result.compilerOptions?.paths?.["@/*"]).toEqual(["src/*", "lib/*"]);
    });

    it("should replace @/* if it doesn't include src/*", () => {
      const existingConfig = {
        extends: "astro/tsconfigs/strict",
        compilerOptions: {
          baseUrl: ".",
          paths: {
            "@/*": ["lib/*"],
          },
        },
      };

      const result = mergeTsConfig(existingConfig);

      expect(result.compilerOptions?.paths?.["@/*"]).toEqual(["src/*"]);
    });

    it("should create compilerOptions if missing", () => {
      const existingConfig = {
        extends: "astro/tsconfigs/strict",
      };

      const result = mergeTsConfig(existingConfig);

      expect(result.compilerOptions).toBeDefined();
      expect(result.compilerOptions?.baseUrl).toBe(".");
      expect(result.compilerOptions?.paths?.["@/*"]).toEqual(["src/*"]);
    });

    it("should preserve other config properties", () => {
      const existingConfig = {
        extends: "astro/tsconfigs/strict",
        include: ["src/**/*"],
        exclude: ["node_modules"],
        compilerOptions: {
          baseUrl: ".",
          strict: true,
          paths: {
            "@/*": ["src/*"],
          },
        },
      };

      const result = mergeTsConfig(existingConfig);

      expect(result.include).toEqual(["src/**/*"]);
      expect(result.exclude).toEqual(["node_modules"]);
      expect(result.compilerOptions?.strict).toBe(true);
    });

    it("should preserve other compilerOptions when adding required ones", () => {
      const existingConfig = {
        compilerOptions: {
          target: "ES2022",
          module: "ESNext",
          strict: true,
          jsx: "react-jsx",
        },
      };

      const result = mergeTsConfig(existingConfig);

      expect(result.compilerOptions?.target).toBe("ES2022");
      expect(result.compilerOptions?.module).toBe("ESNext");
      expect(result.compilerOptions?.strict).toBe(true);
      expect(result.compilerOptions?.jsx).toBe("react-jsx");
      expect(result.compilerOptions?.baseUrl).toBe(".");
      expect(result.compilerOptions?.paths?.["@/*"]).toEqual(["src/*"]);
    });
  });

  describe("createDefaultTsConfig", () => {
    it("should create a valid default config", () => {
      const result = createDefaultTsConfig();

      expect(result).toEqual({
        extends: "astro/tsconfigs/strict",
        compilerOptions: {
          baseUrl: ".",
          paths: {
            "@/*": ["src/*"],
          },
        },
      });
    });

    it("should create a new object each time", () => {
      const result1 = createDefaultTsConfig();
      const result2 = createDefaultTsConfig();

      expect(result1).not.toBe(result2);
      expect(result1.compilerOptions).not.toBe(result2.compilerOptions);
      expect(result1.compilerOptions?.paths).not.toBe(result2.compilerOptions?.paths);
    });
  });

  describe("setupTsConfig", () => {
    describe("when tsconfig.json does not exist", () => {
      it("should create a new tsconfig.json with default config", async () => {
        mockFileExists.mockResolvedValue(false);
        mockWriteJsonFile.mockResolvedValue(undefined);

        const result = await setupTsConfig();

        expect(result).toBe(true);
        expect(mockWriteJsonFile).toHaveBeenCalledWith("tsconfig.json", {
          extends: "astro/tsconfigs/strict",
          compilerOptions: {
            baseUrl: ".",
            paths: {
              "@/*": ["src/*"],
            },
          },
        });
      });
    });

    describe("when tsconfig.json exists", () => {
      it("should not modify complete config", async () => {
        mockFileExists.mockResolvedValue(true);
        mockReadJsonFile.mockResolvedValue({
          extends: "astro/tsconfigs/strict",
          compilerOptions: {
            baseUrl: ".",
            paths: {
              "@/*": ["src/*"],
            },
          },
        });

        const result = await setupTsConfig();

        expect(result).toBe(true);
        expect(mockWriteJsonFile).not.toHaveBeenCalled();
      });

      it("should add missing extends", async () => {
        mockFileExists.mockResolvedValue(true);
        mockReadJsonFile.mockResolvedValue({
          compilerOptions: {
            baseUrl: ".",
            paths: {
              "@/*": ["src/*"],
            },
          },
        });
        mockWriteJsonFile.mockResolvedValue(undefined);

        const result = await setupTsConfig();

        expect(result).toBe(true);
        expect(mockWriteJsonFile).toHaveBeenCalledWith(
          "tsconfig.json",
          expect.objectContaining({
            extends: "astro/tsconfigs/strict",
          }),
        );
      });

      it("should add missing baseUrl", async () => {
        mockFileExists.mockResolvedValue(true);
        mockReadJsonFile.mockResolvedValue({
          extends: "astro/tsconfigs/strict",
          compilerOptions: {
            paths: {
              "@/*": ["src/*"],
            },
          },
        });
        mockWriteJsonFile.mockResolvedValue(undefined);

        const result = await setupTsConfig();

        expect(result).toBe(true);
        expect(mockWriteJsonFile).toHaveBeenCalledWith(
          "tsconfig.json",
          expect.objectContaining({
            compilerOptions: expect.objectContaining({
              baseUrl: ".",
            }),
          }),
        );
      });

      it("should add missing path alias", async () => {
        mockFileExists.mockResolvedValue(true);
        mockReadJsonFile.mockResolvedValue({
          extends: "astro/tsconfigs/strict",
          compilerOptions: {
            baseUrl: ".",
          },
        });
        mockWriteJsonFile.mockResolvedValue(undefined);

        const result = await setupTsConfig();

        expect(result).toBe(true);
        expect(mockWriteJsonFile).toHaveBeenCalledWith(
          "tsconfig.json",
          expect.objectContaining({
            compilerOptions: expect.objectContaining({
              paths: {
                "@/*": ["src/*"],
              },
            }),
          }),
        );
      });

      it("should preserve existing paths when adding @/*", async () => {
        mockFileExists.mockResolvedValue(true);
        mockReadJsonFile.mockResolvedValue({
          extends: "astro/tsconfigs/strict",
          compilerOptions: {
            baseUrl: ".",
            paths: {
              "~/*": ["lib/*"],
            },
          },
        });
        mockWriteJsonFile.mockResolvedValue(undefined);

        const result = await setupTsConfig();

        expect(result).toBe(true);
        expect(mockWriteJsonFile).toHaveBeenCalledWith(
          "tsconfig.json",
          expect.objectContaining({
            compilerOptions: expect.objectContaining({
              paths: {
                "~/*": ["lib/*"],
                "@/*": ["src/*"],
              },
            }),
          }),
        );
      });

      it("should preserve all existing config properties", async () => {
        mockFileExists.mockResolvedValue(true);
        mockReadJsonFile.mockResolvedValue({
          extends: "astro/tsconfigs/strict",
          include: ["src/**/*"],
          exclude: ["node_modules"],
          compilerOptions: {
            baseUrl: ".",
            strict: true,
            target: "ES2022",
          },
        });
        mockWriteJsonFile.mockResolvedValue(undefined);

        const result = await setupTsConfig();

        expect(result).toBe(true);
        expect(mockWriteJsonFile).toHaveBeenCalledWith(
          "tsconfig.json",
          expect.objectContaining({
            include: ["src/**/*"],
            exclude: ["node_modules"],
            compilerOptions: expect.objectContaining({
              strict: true,
              target: "ES2022",
            }),
          }),
        );
      });

      it("should handle empty tsconfig.json", async () => {
        mockFileExists.mockResolvedValue(true);
        mockReadJsonFile.mockResolvedValue({});
        mockWriteJsonFile.mockResolvedValue(undefined);

        const result = await setupTsConfig();

        expect(result).toBe(true);
        expect(mockWriteJsonFile).toHaveBeenCalledWith("tsconfig.json", {
          extends: "astro/tsconfigs/strict",
          compilerOptions: {
            baseUrl: ".",
            paths: {
              "@/*": ["src/*"],
            },
          },
        });
      });

      it("should handle config with only extends", async () => {
        mockFileExists.mockResolvedValue(true);
        mockReadJsonFile.mockResolvedValue({
          extends: "astro/tsconfigs/strict",
        });
        mockWriteJsonFile.mockResolvedValue(undefined);

        const result = await setupTsConfig();

        expect(result).toBe(true);
        expect(mockWriteJsonFile).toHaveBeenCalledWith("tsconfig.json", {
          extends: "astro/tsconfigs/strict",
          compilerOptions: {
            baseUrl: ".",
            paths: {
              "@/*": ["src/*"],
            },
          },
        });
      });

      it("should handle config with different extends value", async () => {
        mockFileExists.mockResolvedValue(true);
        mockReadJsonFile.mockResolvedValue({
          extends: "some/other/config",
          compilerOptions: {
            baseUrl: ".",
            paths: {
              "@/*": ["src/*"],
            },
          },
        });
        mockWriteJsonFile.mockResolvedValue(undefined);

        const result = await setupTsConfig();

        expect(result).toBe(true);
        // Should update extends to the required value
        expect(mockWriteJsonFile).toHaveBeenCalledWith(
          "tsconfig.json",
          expect.objectContaining({
            extends: "astro/tsconfigs/strict",
          }),
        );
      });
    });

    describe("error handling", () => {
      it("should return false and log error if file read fails", async () => {
        mockFileExists.mockResolvedValue(true);
        mockReadJsonFile.mockRejectedValue(new Error("Read error"));

        const result = await setupTsConfig();

        expect(result).toBe(false);
        expect(mockLogError).toHaveBeenCalledWith(
          expect.stringContaining("Failed to setup tsconfig.json"),
        );
      });

      it("should return false and log error if file write fails", async () => {
        mockFileExists.mockResolvedValue(false);
        mockWriteJsonFile.mockRejectedValue(new Error("Write error"));

        const result = await setupTsConfig();

        expect(result).toBe(false);
        expect(mockLogError).toHaveBeenCalledWith(
          expect.stringContaining("Failed to setup tsconfig.json"),
        );
      });

      it("should return false and log error if fileExists check fails", async () => {
        mockFileExists.mockRejectedValue(new Error("Permission denied"));

        const result = await setupTsConfig();

        expect(result).toBe(false);
        expect(mockLogError).toHaveBeenCalledWith(
          expect.stringContaining("Failed to setup tsconfig.json"),
        );
      });

      it("should handle unknown errors gracefully", async () => {
        mockFileExists.mockRejectedValue("Unknown error");

        const result = await setupTsConfig();

        expect(result).toBe(false);
        expect(mockLogError).toHaveBeenCalledWith(
          expect.stringContaining("An unknown error occurred"),
        );
      });
    });

    describe("edge cases", () => {
      it("should handle tsconfig with comments stripped (valid JSON)", async () => {
        mockFileExists.mockResolvedValue(true);
        mockReadJsonFile.mockResolvedValue({
          extends: "astro/tsconfigs/strict",
          compilerOptions: {
            baseUrl: ".",
            paths: {
              "@/*": ["src/*"],
            },
          },
        });

        const result = await setupTsConfig();

        expect(result).toBe(true);
        expect(mockWriteJsonFile).not.toHaveBeenCalled();
      });

      it("should handle deeply nested existing config", async () => {
        mockFileExists.mockResolvedValue(true);
        mockReadJsonFile.mockResolvedValue({
          extends: "astro/tsconfigs/strict",
          compilerOptions: {
            baseUrl: ".",
            paths: {
              "@/*": ["src/*"],
              "@components/*": ["src/components/*"],
              "@utils/*": ["src/utils/*"],
            },
            lib: ["ES2022", "DOM"],
            moduleResolution: "bundler",
          },
          include: ["src/**/*", "tests/**/*"],
          exclude: ["node_modules", "dist"],
        });

        const result = await setupTsConfig();

        expect(result).toBe(true);
        expect(mockWriteJsonFile).not.toHaveBeenCalled();
      });

      it("should handle @/* with empty array", async () => {
        mockFileExists.mockResolvedValue(true);
        mockReadJsonFile.mockResolvedValue({
          extends: "astro/tsconfigs/strict",
          compilerOptions: {
            baseUrl: ".",
            paths: {
              "@/*": [],
            },
          },
        });
        mockWriteJsonFile.mockResolvedValue(undefined);

        const result = await setupTsConfig();

        expect(result).toBe(true);
        expect(mockWriteJsonFile).toHaveBeenCalledWith(
          "tsconfig.json",
          expect.objectContaining({
            compilerOptions: expect.objectContaining({
              paths: {
                "@/*": ["src/*"],
              },
            }),
          }),
        );
      });
    });
  });
});
