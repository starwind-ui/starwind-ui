import * as p from "@clack/prompts";
import fs from "fs-extra";
import semver from "semver";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { setupAstroConfig } from "../astro-config.js";
import * as fsUtils from "../fs.js";

// Mock dependencies
vi.mock("fs-extra");
vi.mock("@clack/prompts");
vi.mock("../fs.js");

const mockReadFile = vi.mocked(fs.readFile);
const mockWriteFile = vi.mocked(fs.writeFile);
const mockFileExists = vi.mocked(fsUtils.fileExists);
const mockReadJsonFile = vi.mocked(fsUtils.readJsonFile);
const mockLogError = vi.fn();

describe("astro-config", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Mock p.log.error
    vi.mocked(p.log).error = mockLogError;
  });

  describe("setupAstroConfig", () => {
    describe("when no config file exists", () => {
      it("should create a new astro.config.ts with all required configurations", async () => {
        mockFileExists.mockResolvedValue(false);
        mockReadJsonFile.mockResolvedValue({
          dependencies: {
            astro: "^5.7.0",
          },
        });

        const result = await setupAstroConfig();

        expect(result).toBe(true);
        expect(mockWriteFile).toHaveBeenCalledWith(
          "astro.config.ts",
          expect.stringContaining('import tailwindcss from "@tailwindcss/vite"'),
          "utf-8",
        );
        expect(mockWriteFile).toHaveBeenCalledWith(
          "astro.config.ts",
          expect.stringContaining("vite:"),
          "utf-8",
        );
        expect(mockWriteFile).toHaveBeenCalledWith(
          "astro.config.ts",
          expect.stringContaining("plugins: [tailwindcss()]"),
          "utf-8",
        );
      });

      it("should add experimental svg config for Astro < 5.7.0", async () => {
        mockFileExists.mockResolvedValue(false);
        mockReadJsonFile.mockResolvedValue({
          dependencies: {
            astro: "^5.6.0",
          },
        });

        const result = await setupAstroConfig();

        expect(result).toBe(true);
        expect(mockWriteFile).toHaveBeenCalledWith(
          "astro.config.ts",
          expect.stringContaining("experimental:"),
          "utf-8",
        );
        expect(mockWriteFile).toHaveBeenCalledWith(
          "astro.config.ts",
          expect.stringContaining("svg: true"),
          "utf-8",
        );
      });

      it("should not add experimental svg config for Astro >= 5.7.0", async () => {
        mockFileExists.mockResolvedValue(false);
        mockReadJsonFile.mockResolvedValue({
          dependencies: {
            astro: "^5.7.0",
          },
        });

        const result = await setupAstroConfig();

        expect(result).toBe(true);
        const writeCall = mockWriteFile.mock.calls[0];
        const writtenContent = writeCall?.[1] as string;
        expect(writtenContent).not.toContain("experimental:");
      });
    });

    describe("when config file exists", () => {
      it("should find and update astro.config.ts", async () => {
        mockFileExists
          .mockResolvedValueOnce(true) // astro.config.ts exists
          .mockResolvedValue(false);

        mockReadFile.mockResolvedValue(
          `import { defineConfig } from "astro/config";\n\nexport default defineConfig({});\n` as any,
        );

        mockReadJsonFile.mockResolvedValue({
          dependencies: {
            astro: "^5.7.0",
          },
        });

        const result = await setupAstroConfig();

        expect(result).toBe(true);
        expect(mockReadFile).toHaveBeenCalledWith("astro.config.ts", "utf-8");
        expect(mockWriteFile).toHaveBeenCalledWith(
          "astro.config.ts",
          expect.stringContaining('import tailwindcss from "@tailwindcss/vite"'),
          "utf-8",
        );
      });

      it("should find and update astro.config.js", async () => {
        mockFileExists
          .mockResolvedValueOnce(false) // astro.config.ts doesn't exist
          .mockResolvedValueOnce(true) // astro.config.js exists
          .mockResolvedValue(false);

        mockReadFile.mockResolvedValue(
          `import { defineConfig } from "astro/config";\n\nexport default defineConfig({});\n` as any,
        );

        mockReadJsonFile.mockResolvedValue({
          dependencies: {
            astro: "^5.7.0",
          },
        });

        const result = await setupAstroConfig();

        expect(result).toBe(true);
        expect(mockReadFile).toHaveBeenCalledWith("astro.config.js", "utf-8");
        expect(mockWriteFile).toHaveBeenCalledWith("astro.config.js", expect.any(String), "utf-8");
      });

      it("should find and update astro.config.mjs", async () => {
        mockFileExists
          .mockResolvedValueOnce(false) // astro.config.ts
          .mockResolvedValueOnce(false) // astro.config.js
          .mockResolvedValueOnce(true) // astro.config.mjs exists
          .mockResolvedValue(false);

        mockReadFile.mockResolvedValue(
          `import { defineConfig } from "astro/config";\n\nexport default defineConfig({});\n` as any,
        );

        mockReadJsonFile.mockResolvedValue({
          dependencies: {
            astro: "^5.7.0",
          },
        });

        const result = await setupAstroConfig();

        expect(result).toBe(true);
        expect(mockReadFile).toHaveBeenCalledWith("astro.config.mjs", "utf-8");
        expect(mockWriteFile).toHaveBeenCalledWith("astro.config.mjs", expect.any(String), "utf-8");
      });

      it("should find and update astro.config.cjs", async () => {
        mockFileExists
          .mockResolvedValueOnce(false) // astro.config.ts
          .mockResolvedValueOnce(false) // astro.config.js
          .mockResolvedValueOnce(false) // astro.config.mjs
          .mockResolvedValueOnce(true) // astro.config.cjs exists
          .mockResolvedValue(false);

        mockReadFile.mockResolvedValue(
          `import { defineConfig } from "astro/config";\n\nexport default defineConfig({});\n` as any,
        );

        mockReadJsonFile.mockResolvedValue({
          dependencies: {
            astro: "^5.7.0",
          },
        });

        const result = await setupAstroConfig();

        expect(result).toBe(true);
        expect(mockReadFile).toHaveBeenCalledWith("astro.config.cjs", "utf-8");
        expect(mockWriteFile).toHaveBeenCalledWith("astro.config.cjs", expect.any(String), "utf-8");
      });

      it("should not add tailwindcss import if already present", async () => {
        mockFileExists.mockResolvedValueOnce(true).mockResolvedValue(false);

        mockReadFile.mockResolvedValue(
          `import tailwindcss from "@tailwindcss/vite";\nimport { defineConfig } from "astro/config";\n\nexport default defineConfig({});\n` as any,
        );

        mockReadJsonFile.mockResolvedValue({
          dependencies: {
            astro: "^5.7.0",
          },
        });

        const result = await setupAstroConfig();

        expect(result).toBe(true);
        const writeCall = mockWriteFile.mock.calls[0];
        const writtenContent = writeCall?.[1] as string;
        // Should only have one import statement for tailwindcss
        const importCount = (writtenContent.match(/import tailwindcss from "@tailwindcss\/vite"/g) || []).length;
        expect(importCount).toBe(1);
      });

      it("should add vite config to existing config without vite", async () => {
        mockFileExists.mockResolvedValueOnce(true).mockResolvedValue(false);

        mockReadFile.mockResolvedValue(
          `import { defineConfig } from "astro/config";\n\nexport default defineConfig({\n\tintegrations: [],\n});\n` as any,
        );

        mockReadJsonFile.mockResolvedValue({
          dependencies: {
            astro: "^5.7.0",
          },
        });

        const result = await setupAstroConfig();

        expect(result).toBe(true);
        expect(mockWriteFile).toHaveBeenCalledWith(
          "astro.config.ts",
          expect.stringContaining("vite:"),
          "utf-8",
        );
        expect(mockWriteFile).toHaveBeenCalledWith(
          "astro.config.ts",
          expect.stringContaining("plugins: [tailwindcss()]"),
          "utf-8",
        );
      });

      it("should add plugins to existing vite config without plugins", async () => {
        mockFileExists.mockResolvedValueOnce(true).mockResolvedValue(false);

        mockReadFile.mockResolvedValue(
          `import { defineConfig } from "astro/config";\n\nexport default defineConfig({\n\tvite: {\n\t\tresolve: {},\n\t},\n});\n` as any,
        );

        mockReadJsonFile.mockResolvedValue({
          dependencies: {
            astro: "^5.7.0",
          },
        });

        const result = await setupAstroConfig();

        expect(result).toBe(true);
        expect(mockWriteFile).toHaveBeenCalledWith(
          "astro.config.ts",
          expect.stringContaining("plugins: [tailwindcss()]"),
          "utf-8",
        );
      });

      it("should add tailwindcss to existing plugins array", async () => {
        mockFileExists.mockResolvedValueOnce(true).mockResolvedValue(false);

        mockReadFile.mockResolvedValue(
          `import { defineConfig } from "astro/config";\nimport react from "@astrojs/react";\n\nexport default defineConfig({\n\tvite: {\n\t\tplugins: [react()],\n\t},\n});\n` as any,
        );

        mockReadJsonFile.mockResolvedValue({
          dependencies: {
            astro: "^5.7.0",
          },
        });

        const result = await setupAstroConfig();

        expect(result).toBe(true);
        expect(mockWriteFile).toHaveBeenCalledWith(
          "astro.config.ts",
          expect.stringContaining("plugins: [tailwindcss(), react()]"),
          "utf-8",
        );
      });

      it("should not add tailwindcss if already in plugins array", async () => {
        mockFileExists.mockResolvedValueOnce(true).mockResolvedValue(false);

        mockReadFile.mockResolvedValue(
          `import tailwindcss from "@tailwindcss/vite";\nimport { defineConfig } from "astro/config";\n\nexport default defineConfig({\n\tvite: {\n\t\tplugins: [tailwindcss()],\n\t},\n});\n` as any,
        );

        mockReadJsonFile.mockResolvedValue({
          dependencies: {
            astro: "^5.7.0",
          },
        });

        const result = await setupAstroConfig();

        expect(result).toBe(true);
        const writeCall = mockWriteFile.mock.calls[0];
        const writtenContent = writeCall?.[1] as string;
        // Should only have one tailwindcss() call
        const tailwindCount = (writtenContent.match(/tailwindcss\(\)/g) || []).length;
        expect(tailwindCount).toBe(1);
      });

      it("should add experimental config for Astro < 5.7.0 to existing config", async () => {
        mockFileExists.mockResolvedValueOnce(true).mockResolvedValue(false);

        mockReadFile.mockResolvedValue(
          `import { defineConfig } from "astro/config";\n\nexport default defineConfig({\n\tintegrations: [],\n});\n` as any,
        );

        mockReadJsonFile.mockResolvedValue({
          dependencies: {
            astro: "^5.5.0",
          },
        });

        const result = await setupAstroConfig();

        expect(result).toBe(true);
        expect(mockWriteFile).toHaveBeenCalledWith(
          "astro.config.ts",
          expect.stringContaining("experimental:"),
          "utf-8",
        );
        expect(mockWriteFile).toHaveBeenCalledWith(
          "astro.config.ts",
          expect.stringContaining("svg: true"),
          "utf-8",
        );
      });

      it("should add svg to existing experimental config", async () => {
        mockFileExists.mockResolvedValueOnce(true).mockResolvedValue(false);

        mockReadFile.mockResolvedValue(
          `import { defineConfig } from "astro/config";\n\nexport default defineConfig({\n\texperimental: {\n\t\tactions: true,\n\t},\n});\n` as any,
        );

        mockReadJsonFile.mockResolvedValue({
          dependencies: {
            astro: "^5.5.0",
          },
        });

        const result = await setupAstroConfig();

        expect(result).toBe(true);
        expect(mockWriteFile).toHaveBeenCalledWith(
          "astro.config.ts",
          expect.stringContaining("svg: true"),
          "utf-8",
        );
      });

      it("should not add svg if already in experimental config", async () => {
        mockFileExists.mockResolvedValueOnce(true).mockResolvedValue(false);

        mockReadFile.mockResolvedValue(
          `import { defineConfig } from "astro/config";\n\nexport default defineConfig({\n\texperimental: {\n\t\tsvg: true,\n\t},\n});\n` as any,
        );

        mockReadJsonFile.mockResolvedValue({
          dependencies: {
            astro: "^5.5.0",
          },
        });

        const result = await setupAstroConfig();

        expect(result).toBe(true);
        const writeCall = mockWriteFile.mock.calls[0];
        const writtenContent = writeCall?.[1] as string;
        // Should only have one svg: true
        const svgCount = (writtenContent.match(/svg: true/g) || []).length;
        expect(svgCount).toBe(1);
      });

      it("should not add svg if svg config object exists", async () => {
        mockFileExists.mockResolvedValueOnce(true).mockResolvedValue(false);

        mockReadFile.mockResolvedValue(
          `import { defineConfig } from "astro/config";\n\nexport default defineConfig({\n\texperimental: {\n\t\tsvg: { mode: 'inline' },\n\t},\n});\n` as any,
        );

        mockReadJsonFile.mockResolvedValue({
          dependencies: {
            astro: "^5.5.0",
          },
        });

        const result = await setupAstroConfig();

        expect(result).toBe(true);
        const writeCall = mockWriteFile.mock.calls[0];
        const writtenContent = writeCall?.[1] as string;
        // Should not add another svg config
        expect(writtenContent).toContain("svg: { mode: 'inline' }");
        expect(writtenContent).not.toContain("svg: true");
      });
    });

    describe("error handling", () => {
      it("should still create config but log error if Astro is not installed", async () => {
        mockFileExists.mockResolvedValue(false);
        mockReadJsonFile.mockResolvedValue({
          dependencies: {},
        });

        const result = await setupAstroConfig();

        // Function continues even without Astro version
        expect(result).toBe(true);
        expect(mockLogError).toHaveBeenCalledWith(
          expect.stringContaining("Astro seems not installed"),
        );
        expect(mockWriteFile).toHaveBeenCalled();
      });

      it("should still create config but log error if package.json read fails", async () => {
        mockFileExists.mockResolvedValue(false);
        mockReadJsonFile.mockRejectedValue(new Error("File not found"));

        const result = await setupAstroConfig();

        // Function continues even without Astro version
        expect(result).toBe(true);
        expect(mockLogError).toHaveBeenCalledWith(
          expect.stringContaining("Failed to check Astro version"),
        );
        expect(mockWriteFile).toHaveBeenCalled();
      });

      it("should return false and log error if config file write fails", async () => {
        mockFileExists.mockResolvedValue(false);
        mockReadJsonFile.mockResolvedValue({
          dependencies: {
            astro: "^5.7.0",
          },
        });
        mockWriteFile.mockRejectedValue(new Error("Permission denied"));

        const result = await setupAstroConfig();

        expect(result).toBe(false);
        expect(mockLogError).toHaveBeenCalledWith(
          expect.stringContaining("Failed to setup Astro config"),
        );
      });

      it("should return false and log error if config file read fails", async () => {
        mockFileExists.mockResolvedValueOnce(true).mockResolvedValue(false);
        mockReadFile.mockRejectedValue(new Error("Read error"));
        mockReadJsonFile.mockResolvedValue({
          dependencies: {
            astro: "^5.7.0",
          },
        });

        const result = await setupAstroConfig();

        expect(result).toBe(false);
        expect(mockLogError).toHaveBeenCalledWith(
          expect.stringContaining("Failed to setup Astro config"),
        );
      });

      it("should handle unknown errors gracefully", async () => {
        mockFileExists.mockResolvedValue(false);
        mockReadJsonFile.mockRejectedValue("Unknown error");

        const result = await setupAstroConfig();

        expect(result).toBe(false);
        expect(mockLogError).toHaveBeenCalledWith(
          expect.stringContaining("An unknown error occurred"),
        );
      });
    });

    describe("version handling", () => {
      it("should handle version with caret prefix and add experimental config", async () => {
        mockFileExists.mockResolvedValueOnce(true).mockResolvedValue(false);
        mockReadFile.mockResolvedValue(
          `import { defineConfig } from "astro/config";\n\nexport default defineConfig({});\n` as any,
        );
        mockReadJsonFile.mockResolvedValue({
          dependencies: {
            astro: "^5.6.0",
          },
        });
        mockWriteFile.mockResolvedValue();

        const result = await setupAstroConfig();

        expect(result).toBe(true);
        // Should add experimental config for version < 5.7.0
        expect(mockWriteFile).toHaveBeenCalledWith(
          "astro.config.ts",
          expect.stringContaining("experimental:"),
          "utf-8",
        );
      });

      it("should handle version with tilde prefix and add experimental config", async () => {
        mockFileExists.mockResolvedValueOnce(true).mockResolvedValue(false);
        mockReadFile.mockResolvedValue(
          `import { defineConfig } from "astro/config";\n\nexport default defineConfig({});\n` as any,
        );
        mockReadJsonFile.mockResolvedValue({
          dependencies: {
            astro: "~5.6.0",
          },
        });
        mockWriteFile.mockResolvedValue();

        const result = await setupAstroConfig();

        expect(result).toBe(true);
        // Should add experimental config for version < 5.7.0
        expect(mockWriteFile).toHaveBeenCalledWith(
          "astro.config.ts",
          expect.stringContaining("experimental:"),
          "utf-8",
        );
      });

      it("should handle exact version without prefix and add experimental config", async () => {
        mockFileExists.mockResolvedValueOnce(true).mockResolvedValue(false);
        mockReadFile.mockResolvedValue(
          `import { defineConfig } from "astro/config";\n\nexport default defineConfig({});\n` as any,
        );
        mockReadJsonFile.mockResolvedValue({
          dependencies: {
            astro: "5.6.0",
          },
        });
        mockWriteFile.mockResolvedValue();

        const result = await setupAstroConfig();

        expect(result).toBe(true);
        // Should add experimental config for version < 5.7.0
        expect(mockWriteFile).toHaveBeenCalledWith(
          "astro.config.ts",
          expect.stringContaining("experimental:"),
          "utf-8",
        );
      });
    });
  });
});
