import * as p from "@clack/prompts";
import fs from "fs-extra";
import { beforeEach, describe, expect, it, vi } from "vitest";

import {
  hasEnvLocalInGitignore,
  hasStarwindLicenseKey,
  setupEnvLocal,
  setupGitignore,
  setupStarwindProEnv,
} from "../env.js";
import * as fsUtils from "../fs.js";

// Mock dependencies
vi.mock("fs-extra");
vi.mock("@clack/prompts");
vi.mock("../fs.js");

const mockReadFile = vi.mocked(fs.readFile);
const mockWriteFile = vi.mocked(fs.writeFile);
const mockFileExists = vi.mocked(fsUtils.fileExists);
const mockLogError = vi.fn();

describe("env", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(p.log).error = mockLogError;
  });

  describe("hasStarwindLicenseKey", () => {
    it("should return true if STARWIND_LICENSE_KEY exists with value", () => {
      const content = `# Some comment
STARWIND_LICENSE_KEY=abc123
OTHER_KEY=value`;
      expect(hasStarwindLicenseKey(content)).toBe(true);
    });

    it("should return true if STARWIND_LICENSE_KEY exists with empty value", () => {
      const content = `STARWIND_LICENSE_KEY=`;
      expect(hasStarwindLicenseKey(content)).toBe(true);
    });

    it("should return true if STARWIND_LICENSE_KEY exists with spaces around =", () => {
      const content = `STARWIND_LICENSE_KEY = abc123`;
      expect(hasStarwindLicenseKey(content)).toBe(true);
    });

    it("should return false if STARWIND_LICENSE_KEY doesn't exist", () => {
      const content = `OTHER_KEY=value
ANOTHER_KEY=value2`;
      expect(hasStarwindLicenseKey(content)).toBe(false);
    });

    it("should return false for empty content", () => {
      expect(hasStarwindLicenseKey("")).toBe(false);
    });

    it("should return false if key is part of another key name", () => {
      const content = `MY_STARWIND_LICENSE_KEY=value`;
      expect(hasStarwindLicenseKey(content)).toBe(false);
    });

    it("should return true if key is at start of file", () => {
      const content = `STARWIND_LICENSE_KEY=value`;
      expect(hasStarwindLicenseKey(content)).toBe(true);
    });

    it("should handle Windows line endings", () => {
      const content = `OTHER_KEY=value\r\nSTARWIND_LICENSE_KEY=abc123\r\n`;
      expect(hasStarwindLicenseKey(content)).toBe(true);
    });

    it("should return false if key is in a comment", () => {
      const content = `# STARWIND_LICENSE_KEY=commented_out\nOTHER_KEY=value`;
      expect(hasStarwindLicenseKey(content)).toBe(false);
    });

    it("should return true if key exists after a comment with the key", () => {
      const content = `# STARWIND_LICENSE_KEY=commented\nSTARWIND_LICENSE_KEY=actual_value`;
      expect(hasStarwindLicenseKey(content)).toBe(true);
    });
  });

  describe("hasEnvLocalInGitignore", () => {
    it("should return true for exact .env.local match", () => {
      const content = `node_modules
.env.local
dist`;
      expect(hasEnvLocalInGitignore(content)).toBe(true);
    });

    it("should return true for .env.local with trailing slash", () => {
      const content = `.env.local/`;
      expect(hasEnvLocalInGitignore(content)).toBe(true);
    });

    it("should return true for .env* pattern", () => {
      const content = `.env*`;
      expect(hasEnvLocalInGitignore(content)).toBe(true);
    });

    it("should return true for .env.* pattern", () => {
      const content = `.env.*`;
      expect(hasEnvLocalInGitignore(content)).toBe(true);
    });

    it("should return true for *.local pattern", () => {
      const content = `*.local`;
      expect(hasEnvLocalInGitignore(content)).toBe(true);
    });

    it("should return false if .env.local is not present", () => {
      const content = `node_modules
dist
.env`;
      expect(hasEnvLocalInGitignore(content)).toBe(false);
    });

    it("should return false for empty content", () => {
      expect(hasEnvLocalInGitignore("")).toBe(false);
    });

    it("should handle .env.local with leading whitespace", () => {
      const content = `  .env.local`;
      expect(hasEnvLocalInGitignore(content)).toBe(true);
    });

    it("should handle .env.local with trailing whitespace", () => {
      const content = `.env.local  `;
      expect(hasEnvLocalInGitignore(content)).toBe(true);
    });

    it("should handle Windows line endings", () => {
      const content = `node_modules\r\n.env.local\r\ndist`;
      expect(hasEnvLocalInGitignore(content)).toBe(true);
    });

    it("should not match .env.local as part of a path", () => {
      const content = `some/path/.env.local.bak`;
      expect(hasEnvLocalInGitignore(content)).toBe(false);
    });

    it("should not match commented out .env.local", () => {
      const content = `# .env.local`;
      expect(hasEnvLocalInGitignore(content)).toBe(false);
    });

    it("should not match negated .env.local pattern", () => {
      const content = `!.env.local`;
      expect(hasEnvLocalInGitignore(content)).toBe(false);
    });

    it("should return true when .env.local exists alongside negation", () => {
      const content = `.env.local\n!.env.local.example`;
      expect(hasEnvLocalInGitignore(content)).toBe(true);
    });
  });

  describe("setupEnvLocal", () => {
    describe("when .env.local doesn't exist", () => {
      it("should create file with license key placeholder", async () => {
        mockFileExists.mockResolvedValue(false);
        mockWriteFile.mockResolvedValue(undefined);

        const result = await setupEnvLocal();

        expect(result).toBe(true);
        expect(mockWriteFile).toHaveBeenCalledWith(
          ".env.local",
          expect.stringContaining("STARWIND_LICENSE_KEY=your_starwind_pro_license_key"),
          "utf-8",
        );
      });

      it("should include comment in created file", async () => {
        mockFileExists.mockResolvedValue(false);
        mockWriteFile.mockResolvedValue(undefined);

        await setupEnvLocal();

        expect(mockWriteFile).toHaveBeenCalledWith(
          ".env.local",
          expect.stringContaining("# Starwind Pro registry setup"),
          "utf-8",
        );
      });
    });

    describe("when .env.local exists", () => {
      it("should add key at top if not present", async () => {
        mockFileExists.mockResolvedValue(true);
        mockReadFile.mockResolvedValue(`OTHER_KEY=value\n` as any);
        mockWriteFile.mockResolvedValue(undefined);

        const result = await setupEnvLocal();

        expect(result).toBe(true);
        const writtenContent = mockWriteFile.mock.calls[0]?.[1] as string;
        expect(writtenContent).toMatch(/^# Starwind Pro registry setup/);
        expect(writtenContent).toContain("STARWIND_LICENSE_KEY=your_starwind_pro_license_key");
        expect(writtenContent).toContain("OTHER_KEY=value");
      });

      it("should not modify file if key already exists", async () => {
        mockFileExists.mockResolvedValue(true);
        mockReadFile.mockResolvedValue(`STARWIND_LICENSE_KEY=existing_key\n` as any);

        const result = await setupEnvLocal();

        expect(result).toBe(true);
        expect(mockWriteFile).not.toHaveBeenCalled();
      });

      it("should not modify file if key exists with different value", async () => {
        mockFileExists.mockResolvedValue(true);
        mockReadFile.mockResolvedValue(`STARWIND_LICENSE_KEY=my-actual-key-123\n` as any);

        const result = await setupEnvLocal();

        expect(result).toBe(true);
        expect(mockWriteFile).not.toHaveBeenCalled();
      });

      it("should preserve existing content when adding key", async () => {
        mockFileExists.mockResolvedValue(true);
        mockReadFile.mockResolvedValue(
          `# My env file\nAPI_KEY=secret\nDATABASE_URL=postgres://localhost\n` as any,
        );
        mockWriteFile.mockResolvedValue(undefined);

        await setupEnvLocal();

        const writtenContent = mockWriteFile.mock.calls[0]?.[1] as string;
        expect(writtenContent).toContain("# My env file");
        expect(writtenContent).toContain("API_KEY=secret");
        expect(writtenContent).toContain("DATABASE_URL=postgres://localhost");
      });

      it("should handle empty .env.local file", async () => {
        mockFileExists.mockResolvedValue(true);
        mockReadFile.mockResolvedValue(`` as any);
        mockWriteFile.mockResolvedValue(undefined);

        const result = await setupEnvLocal();

        expect(result).toBe(true);
        const writtenContent = mockWriteFile.mock.calls[0]?.[1] as string;
        expect(writtenContent).toContain("STARWIND_LICENSE_KEY=your_starwind_pro_license_key");
      });
    });

    describe("error handling", () => {
      it("should return false and log error if read fails", async () => {
        mockFileExists.mockResolvedValue(true);
        mockReadFile.mockRejectedValue(new Error("Read error"));

        const result = await setupEnvLocal();

        expect(result).toBe(false);
        expect(mockLogError).toHaveBeenCalledWith(
          expect.stringContaining("Failed to setup .env.local"),
        );
      });

      it("should return false and log error if write fails", async () => {
        mockFileExists.mockResolvedValue(false);
        mockWriteFile.mockRejectedValue(new Error("Write error"));

        const result = await setupEnvLocal();

        expect(result).toBe(false);
        expect(mockLogError).toHaveBeenCalledWith(
          expect.stringContaining("Failed to setup .env.local"),
        );
      });

      it("should handle unknown errors gracefully", async () => {
        mockFileExists.mockRejectedValue("Unknown error");

        const result = await setupEnvLocal();

        expect(result).toBe(false);
        expect(mockLogError).toHaveBeenCalledWith(
          expect.stringContaining("An unknown error occurred"),
        );
      });
    });
  });

  describe("setupGitignore", () => {
    describe("when .gitignore doesn't exist", () => {
      it("should create file with full default content", async () => {
        mockFileExists.mockResolvedValue(false);
        mockWriteFile.mockResolvedValue(undefined);

        const result = await setupGitignore();

        expect(result).toBe(true);
        const writtenContent = mockWriteFile.mock.calls[0]?.[1] as string;
        // Should include key sections
        expect(writtenContent).toContain("# build output");
        expect(writtenContent).toContain("dist/");
        expect(writtenContent).toContain("# generated types");
        expect(writtenContent).toContain(".astro/");
        expect(writtenContent).toContain("# dependencies");
        expect(writtenContent).toContain("node_modules/");
        expect(writtenContent).toContain("# environment variables");
        expect(writtenContent).toContain(".env.local");
        expect(writtenContent).toContain(".env");
        expect(writtenContent).toContain(".env.production");
        expect(writtenContent).toContain("# macOS-specific files");
        expect(writtenContent).toContain(".DS_Store");
        expect(writtenContent).toContain("# jetbrains setting folder");
        expect(writtenContent).toContain(".idea/");
      });

      it("should include .env.local in default content", async () => {
        mockFileExists.mockResolvedValue(false);
        mockWriteFile.mockResolvedValue(undefined);

        await setupGitignore();

        const writtenContent = mockWriteFile.mock.calls[0]?.[1] as string;
        expect(writtenContent).toContain(".env.local");
      });
    });

    describe("when .gitignore exists", () => {
      it("should add .env.local at end if not present", async () => {
        mockFileExists.mockResolvedValue(true);
        mockReadFile.mockResolvedValue(`node_modules\ndist\n` as any);
        mockWriteFile.mockResolvedValue(undefined);

        const result = await setupGitignore();

        expect(result).toBe(true);
        expect(mockWriteFile).toHaveBeenCalledWith(
          ".gitignore",
          "node_modules\ndist\n.env.local\n",
          "utf-8",
        );
      });

      it("should add newline before .env.local if file doesn't end with newline", async () => {
        mockFileExists.mockResolvedValue(true);
        mockReadFile.mockResolvedValue(`node_modules\ndist` as any);
        mockWriteFile.mockResolvedValue(undefined);

        await setupGitignore();

        expect(mockWriteFile).toHaveBeenCalledWith(
          ".gitignore",
          "node_modules\ndist\n.env.local\n",
          "utf-8",
        );
      });

      it("should not modify file if .env.local already present", async () => {
        mockFileExists.mockResolvedValue(true);
        mockReadFile.mockResolvedValue(`node_modules\n.env.local\ndist\n` as any);

        const result = await setupGitignore();

        expect(result).toBe(true);
        expect(mockWriteFile).not.toHaveBeenCalled();
      });

      it("should not modify file if .env* pattern exists", async () => {
        mockFileExists.mockResolvedValue(true);
        mockReadFile.mockResolvedValue(`node_modules\n.env*\ndist\n` as any);

        const result = await setupGitignore();

        expect(result).toBe(true);
        expect(mockWriteFile).not.toHaveBeenCalled();
      });

      it("should not modify file if .env.* pattern exists", async () => {
        mockFileExists.mockResolvedValue(true);
        mockReadFile.mockResolvedValue(`node_modules\n.env.*\ndist\n` as any);

        const result = await setupGitignore();

        expect(result).toBe(true);
        expect(mockWriteFile).not.toHaveBeenCalled();
      });

      it("should not modify file if *.local pattern exists", async () => {
        mockFileExists.mockResolvedValue(true);
        mockReadFile.mockResolvedValue(`node_modules\n*.local\ndist\n` as any);

        const result = await setupGitignore();

        expect(result).toBe(true);
        expect(mockWriteFile).not.toHaveBeenCalled();
      });

      it("should handle empty gitignore file", async () => {
        mockFileExists.mockResolvedValue(true);
        mockReadFile.mockResolvedValue(`` as any);
        mockWriteFile.mockResolvedValue(undefined);

        await setupGitignore();

        expect(mockWriteFile).toHaveBeenCalledWith(".gitignore", ".env.local\n", "utf-8");
      });

      it("should handle gitignore with only whitespace", async () => {
        mockFileExists.mockResolvedValue(true);
        mockReadFile.mockResolvedValue(`   \n  \n` as any);
        mockWriteFile.mockResolvedValue(undefined);

        await setupGitignore();

        expect(mockWriteFile).toHaveBeenCalledWith(".gitignore", "   \n  \n.env.local\n", "utf-8");
      });
    });

    describe("error handling", () => {
      it("should return false and log error if read fails", async () => {
        mockFileExists.mockResolvedValue(true);
        mockReadFile.mockRejectedValue(new Error("Read error"));

        const result = await setupGitignore();

        expect(result).toBe(false);
        expect(mockLogError).toHaveBeenCalledWith(
          expect.stringContaining("Failed to setup .gitignore"),
        );
      });

      it("should return false and log error if write fails", async () => {
        mockFileExists.mockResolvedValue(false);
        mockWriteFile.mockRejectedValue(new Error("Write error"));

        const result = await setupGitignore();

        expect(result).toBe(false);
        expect(mockLogError).toHaveBeenCalledWith(
          expect.stringContaining("Failed to setup .gitignore"),
        );
      });

      it("should handle unknown errors gracefully", async () => {
        mockFileExists.mockRejectedValue("Unknown error");

        const result = await setupGitignore();

        expect(result).toBe(false);
        expect(mockLogError).toHaveBeenCalledWith(
          expect.stringContaining("An unknown error occurred"),
        );
      });
    });
  });

  describe("setupStarwindProEnv", () => {
    it("should return true if both operations succeed", async () => {
      // First call for setupEnvLocal, second for setupGitignore
      mockFileExists.mockResolvedValue(false);
      mockWriteFile.mockResolvedValue(undefined);

      const result = await setupStarwindProEnv();

      expect(result).toBe(true);
      expect(mockWriteFile).toHaveBeenCalledTimes(2);
    });

    it("should return false if setupEnvLocal fails", async () => {
      mockFileExists.mockResolvedValueOnce(false);
      mockWriteFile.mockRejectedValueOnce(new Error("Write error"));
      // Second call succeeds
      mockFileExists.mockResolvedValueOnce(false);
      mockWriteFile.mockResolvedValueOnce(undefined);

      const result = await setupStarwindProEnv();

      expect(result).toBe(false);
    });

    it("should return false if setupGitignore fails", async () => {
      // First call succeeds
      mockFileExists.mockResolvedValueOnce(false);
      mockWriteFile.mockResolvedValueOnce(undefined);
      // Second call fails
      mockFileExists.mockResolvedValueOnce(false);
      mockWriteFile.mockRejectedValueOnce(new Error("Write error"));

      const result = await setupStarwindProEnv();

      expect(result).toBe(false);
    });

    it("should call both setup functions even if first fails", async () => {
      mockFileExists.mockResolvedValue(false);
      mockWriteFile
        .mockRejectedValueOnce(new Error("First error"))
        .mockResolvedValueOnce(undefined);

      await setupStarwindProEnv();

      // Both writes should be attempted
      expect(mockWriteFile).toHaveBeenCalledTimes(2);
    });

    it("should handle both files already configured", async () => {
      mockFileExists.mockResolvedValue(true);
      mockReadFile
        .mockResolvedValueOnce(`STARWIND_LICENSE_KEY=existing\n` as any)
        .mockResolvedValueOnce(`node_modules\n.env.local\n` as any);

      const result = await setupStarwindProEnv();

      expect(result).toBe(true);
      expect(mockWriteFile).not.toHaveBeenCalled();
    });
  });
});
