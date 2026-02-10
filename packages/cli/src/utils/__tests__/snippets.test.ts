import { beforeEach, describe, expect, it, vi } from "vitest";

import { PATHS } from "../constants.js";
import * as fsUtils from "../fs.js";
import { setupSnippets } from "../snippets.js";

// Mock dependencies
vi.mock("../fs.js");

const mockFileExists = vi.mocked(fsUtils.fileExists);
const mockReadJsonFile = vi.mocked(fsUtils.readJsonFile);
const mockWriteJsonFile = vi.mocked(fsUtils.writeJsonFile);
const mockEnsureDirectory = vi.mocked(fsUtils.ensureDirectory);

describe("snippets", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("setupSnippets", () => {
    it("should create .vscode/starwind.code-snippets if no snippet file exists", async () => {
      mockFileExists.mockResolvedValue(false);
      mockWriteJsonFile.mockResolvedValue(undefined);
      mockEnsureDirectory.mockResolvedValue(undefined);

      const result = await setupSnippets();

      expect(result).toBe(true);
      expect(mockEnsureDirectory).toHaveBeenCalledWith(PATHS.VSCODE_DIR);
      expect(mockWriteJsonFile).toHaveBeenCalledWith(
        PATHS.VSCODE_SNIPPETS_FILE,
        expect.objectContaining({
          "Starwind UI Theme Toggle": expect.objectContaining({
            prefix: "starwind-theme-toggle",
            scope: "astro,typescript",
          }),
        }),
      );
    });

    it("should merge into .vscode/starwind.code-snippets if it exists", async () => {
      mockFileExists.mockImplementation(async (path) => {
        return path === PATHS.VSCODE_SNIPPETS_FILE;
      });
      mockReadJsonFile.mockResolvedValue({
        "Other Starwind Snippet": {
          prefix: "other",
          body: ["test"],
        },
      });
      mockWriteJsonFile.mockResolvedValue(undefined);
      mockEnsureDirectory.mockResolvedValue(undefined);

      const result = await setupSnippets();

      expect(result).toBe(true);
      expect(mockWriteJsonFile).toHaveBeenCalledWith(
        PATHS.VSCODE_SNIPPETS_FILE,
        expect.objectContaining({
          "Other Starwind Snippet": expect.any(Object),
          "Starwind UI Theme Toggle": expect.objectContaining({
            scope: "astro,typescript",
          }),
        }),
      );
    });

    it("should handle invalid existing JSON by starting fresh", async () => {
      mockFileExists.mockImplementation(async (path) => {
        return path === PATHS.VSCODE_SNIPPETS_FILE;
      });
      mockReadJsonFile.mockRejectedValue(new Error("Invalid JSON"));
      mockWriteJsonFile.mockResolvedValue(undefined);
      mockEnsureDirectory.mockResolvedValue(undefined);

      const result = await setupSnippets();

      expect(result).toBe(true);
      expect(mockWriteJsonFile).toHaveBeenCalledWith(
        PATHS.VSCODE_SNIPPETS_FILE,
        expect.objectContaining({
          "Starwind UI Theme Toggle": expect.any(Object),
        }),
      );
      expect(Object.keys(mockWriteJsonFile.mock.calls[0][1] as any).length).toBe(1);
    });
  });
});
