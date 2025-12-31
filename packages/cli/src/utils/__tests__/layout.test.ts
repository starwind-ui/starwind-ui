import * as p from "@clack/prompts";
import fs from "fs-extra";
import { beforeEach, describe, expect, it, vi } from "vitest";

import * as fsUtils from "../fs.js";
import {
  addCssImportToLayout,
  findLayoutFile,
  hasCssImport,
  setupLayoutCssImport,
  toImportPath,
} from "../layout.js";

// Mock dependencies
vi.mock("fs-extra");
vi.mock("@clack/prompts");
vi.mock("../fs.js");

const mockReadFile = vi.mocked(fs.readFile);
const mockWriteFile = vi.mocked(fs.writeFile);
const mockFileExists = vi.mocked(fsUtils.fileExists);
const mockLogError = vi.fn();

describe("layout", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(p.log).error = mockLogError;
  });

  describe("findLayoutFile", () => {
    it("should return Layout.astro if it exists", async () => {
      mockFileExists.mockResolvedValueOnce(true);

      const result = await findLayoutFile();

      expect(result).toBe("src/layouts/Layout.astro");
      expect(mockFileExists).toHaveBeenCalledWith("src/layouts/Layout.astro");
    });

    it("should return BaseLayout.astro if Layout.astro doesn't exist", async () => {
      mockFileExists.mockResolvedValueOnce(false).mockResolvedValueOnce(true);

      const result = await findLayoutFile();

      expect(result).toBe("src/layouts/BaseLayout.astro");
      expect(mockFileExists).toHaveBeenCalledWith("src/layouts/Layout.astro");
      expect(mockFileExists).toHaveBeenCalledWith("src/layouts/BaseLayout.astro");
    });

    it("should return null if no layout file exists", async () => {
      mockFileExists.mockResolvedValue(false);

      const result = await findLayoutFile();

      expect(result).toBeNull();
    });

    it("should prefer Layout.astro over BaseLayout.astro", async () => {
      mockFileExists.mockResolvedValueOnce(true);

      const result = await findLayoutFile();

      expect(result).toBe("src/layouts/Layout.astro");
      // Should not check for BaseLayout.astro if Layout.astro exists
      expect(mockFileExists).toHaveBeenCalledTimes(1);
    });

    it("should handle fileExists throwing an error", async () => {
      mockFileExists.mockRejectedValue(new Error("Permission denied"));

      await expect(findLayoutFile()).rejects.toThrow("Permission denied");
    });
  });

  describe("toImportPath", () => {
    it("should convert src/ path to @/ path", () => {
      expect(toImportPath("src/styles/starwind.css")).toBe("@/styles/starwind.css");
    });

    it("should keep @/ path as-is", () => {
      expect(toImportPath("@/styles/starwind.css")).toBe("@/styles/starwind.css");
    });

    it("should prepend @/ to paths without src/ prefix", () => {
      expect(toImportPath("styles/starwind.css")).toBe("@/styles/starwind.css");
    });

    it("should handle nested paths", () => {
      expect(toImportPath("src/assets/css/main.css")).toBe("@/assets/css/main.css");
    });

    it("should normalize backslashes to forward slashes", () => {
      expect(toImportPath("src\\styles\\starwind.css")).toBe("@/styles/starwind.css");
    });

    it("should handle mixed slashes", () => {
      expect(toImportPath("src/styles\\nested/file.css")).toBe("@/styles/nested/file.css");
    });
  });

  describe("hasCssImport", () => {
    it("should detect import with double quotes", () => {
      const content = `---
import "@/styles/starwind.css";
---`;
      expect(hasCssImport(content, "src/styles/starwind.css")).toBe(true);
    });

    it("should detect import with single quotes", () => {
      const content = `---
import '@/styles/starwind.css';
---`;
      expect(hasCssImport(content, "src/styles/starwind.css")).toBe(true);
    });

    it("should detect import without semicolon", () => {
      const content = `---
import "@/styles/starwind.css"
---`;
      expect(hasCssImport(content, "src/styles/starwind.css")).toBe(true);
    });

    it("should detect import with @/ prefix in cssPath", () => {
      const content = `---
import "@/styles/starwind.css";
---`;
      expect(hasCssImport(content, "@/styles/starwind.css")).toBe(true);
    });

    it("should return false if import doesn't exist", () => {
      const content = `---
import "@/styles/other.css";
---`;
      expect(hasCssImport(content, "src/styles/starwind.css")).toBe(false);
    });

    it("should return false for empty content", () => {
      expect(hasCssImport("", "src/styles/starwind.css")).toBe(false);
    });

    it("should handle different CSS file names", () => {
      const content = `---
import "@/styles/global.css";
---`;
      expect(hasCssImport(content, "src/styles/global.css")).toBe(true);
      expect(hasCssImport(content, "src/styles/starwind.css")).toBe(false);
    });

    it("should handle nested paths", () => {
      const content = `---
import "@/assets/css/main.css";
---`;
      expect(hasCssImport(content, "src/assets/css/main.css")).toBe(true);
    });

    it("should handle backslashes in cssPath", () => {
      const content = `---
import "@/styles/starwind.css";
---`;
      expect(hasCssImport(content, "src\\styles\\starwind.css")).toBe(true);
    });

    it("should not match partial paths", () => {
      const content = `---
import "@/styles/starwind.css";
---`;
      expect(hasCssImport(content, "src/styles/star.css")).toBe(false);
    });

    it("should handle import among other imports", () => {
      const content = `---
import Nav from "@/components/Nav.astro";
import "@/styles/starwind.css";
import Footer from "@/components/Footer.astro";
---`;
      expect(hasCssImport(content, "src/styles/starwind.css")).toBe(true);
    });
  });

  describe("addCssImportToLayout", () => {
    describe("when file has frontmatter", () => {
      it("should add import after opening ---", () => {
        const content = `---
const title = "Hello";
---

<html></html>`;

        const result = addCssImportToLayout(content, "src/styles/starwind.css");

        expect(result).toBe(`---
import "@/styles/starwind.css";
const title = "Hello";
---

<html></html>`);
      });

      it("should add import to empty frontmatter", () => {
        const content = `---
---

<html></html>`;

        const result = addCssImportToLayout(content, "src/styles/starwind.css");

        expect(result).toBe(`---
import "@/styles/starwind.css";
---

<html></html>`);
      });

      it("should add import before existing imports", () => {
        const content = `---
import Nav from "@/components/Nav.astro";
---

<html></html>`;

        const result = addCssImportToLayout(content, "src/styles/starwind.css");

        expect(result).toBe(`---
import "@/styles/starwind.css";
import Nav from "@/components/Nav.astro";
---

<html></html>`);
      });

      it("should handle Windows line endings (CRLF)", () => {
        const content = '---\r\nconst title = "Hello";\r\n---\r\n\r\n<html></html>';

        const result = addCssImportToLayout(content, "src/styles/starwind.css");

        expect(result).toContain('import "@/styles/starwind.css";');
        expect(result.startsWith("---\r\n")).toBe(true);
      });

      it("should convert src/ path to @/ in import", () => {
        const content = `---
---`;

        const result = addCssImportToLayout(content, "src/styles/global.css");

        expect(result).toContain('import "@/styles/global.css";');
      });

      it("should handle @/ path directly", () => {
        const content = `---
---`;

        const result = addCssImportToLayout(content, "@/styles/starwind.css");

        expect(result).toContain('import "@/styles/starwind.css";');
      });
    });

    describe("when file has no frontmatter", () => {
      it("should add frontmatter with import", () => {
        const content = `<html>
  <body>Hello</body>
</html>`;

        const result = addCssImportToLayout(content, "src/styles/starwind.css");

        expect(result).toBe(`---
import "@/styles/starwind.css";
---

<html>
  <body>Hello</body>
</html>`);
      });

      it("should handle empty file", () => {
        const result = addCssImportToLayout("", "src/styles/starwind.css");

        expect(result).toBe(`---
import "@/styles/starwind.css";
---

`);
      });

      it("should handle file with only whitespace", () => {
        const result = addCssImportToLayout("   \n  ", "src/styles/starwind.css");

        expect(result).toBe(`---
import "@/styles/starwind.css";
---

   \n  `);
      });

      it("should handle file starting with HTML comment", () => {
        const content = `<!-- This is a layout -->
<html></html>`;

        const result = addCssImportToLayout(content, "src/styles/starwind.css");

        expect(result).toBe(`---
import "@/styles/starwind.css";
---

<!-- This is a layout -->
<html></html>`);
      });

      it("should treat file with --- not at start as no frontmatter", () => {
        const content = `<html>
---
some content
---
</html>`;

        const result = addCssImportToLayout(content, "src/styles/starwind.css");

        expect(result).toBe(`---
import "@/styles/starwind.css";
---

<html>
---
some content
---
</html>`);
      });
    });

    describe("path handling", () => {
      it("should handle deeply nested CSS paths", () => {
        const content = `---
---`;

        const result = addCssImportToLayout(content, "src/assets/styles/themes/dark.css");

        expect(result).toContain('import "@/assets/styles/themes/dark.css";');
      });

      it("should handle CSS file in root src directory", () => {
        const content = `---
---`;

        const result = addCssImportToLayout(content, "src/global.css");

        expect(result).toContain('import "@/global.css";');
      });

      it("should normalize backslashes in path", () => {
        const content = `---
---`;

        const result = addCssImportToLayout(content, "src\\styles\\starwind.css");

        expect(result).toContain('import "@/styles/starwind.css";');
      });
    });
  });

  describe("setupLayoutCssImport", () => {
    describe("when no layout file exists", () => {
      it("should return true without error", async () => {
        mockFileExists.mockResolvedValue(false);

        const result = await setupLayoutCssImport("src/styles/starwind.css");

        expect(result).toBe(true);
        expect(mockWriteFile).not.toHaveBeenCalled();
        expect(mockLogError).not.toHaveBeenCalled();
      });
    });

    describe("when Layout.astro exists", () => {
      it("should add import to Layout.astro", async () => {
        mockFileExists.mockResolvedValueOnce(true);
        mockReadFile.mockResolvedValue(
          `---
const title = "Hello";
---

<html></html>` as any,
        );
        mockWriteFile.mockResolvedValue(undefined);

        const result = await setupLayoutCssImport("src/styles/starwind.css");

        expect(result).toBe(true);
        expect(mockWriteFile).toHaveBeenCalledWith(
          "src/layouts/Layout.astro",
          expect.stringContaining('import "@/styles/starwind.css";'),
          "utf-8",
        );
      });

      it("should not modify file if import already exists", async () => {
        mockFileExists.mockResolvedValueOnce(true);
        mockReadFile.mockResolvedValue(
          `---
import "@/styles/starwind.css";
const title = "Hello";
---

<html></html>` as any,
        );

        const result = await setupLayoutCssImport("src/styles/starwind.css");

        expect(result).toBe(true);
        expect(mockWriteFile).not.toHaveBeenCalled();
      });

      it("should add frontmatter if file has none", async () => {
        mockFileExists.mockResolvedValueOnce(true);
        mockReadFile.mockResolvedValue(`<html></html>` as any);
        mockWriteFile.mockResolvedValue(undefined);

        const result = await setupLayoutCssImport("src/styles/starwind.css");

        expect(result).toBe(true);
        expect(mockWriteFile).toHaveBeenCalledWith(
          "src/layouts/Layout.astro",
          expect.stringMatching(/^---\nimport "@\/styles\/starwind\.css";\n---\n\n<html>/),
          "utf-8",
        );
      });
    });

    describe("when BaseLayout.astro exists", () => {
      it("should add import to BaseLayout.astro if Layout.astro doesn't exist", async () => {
        mockFileExists.mockResolvedValueOnce(false).mockResolvedValueOnce(true);
        mockReadFile.mockResolvedValue(
          `---
---

<html></html>` as any,
        );
        mockWriteFile.mockResolvedValue(undefined);

        const result = await setupLayoutCssImport("src/styles/starwind.css");

        expect(result).toBe(true);
        expect(mockWriteFile).toHaveBeenCalledWith(
          "src/layouts/BaseLayout.astro",
          expect.stringContaining('import "@/styles/starwind.css";'),
          "utf-8",
        );
      });
    });

    describe("error handling", () => {
      it("should return false and log error if read fails", async () => {
        mockFileExists.mockResolvedValueOnce(true);
        mockReadFile.mockRejectedValue(new Error("Read error"));

        const result = await setupLayoutCssImport("src/styles/starwind.css");

        expect(result).toBe(false);
        expect(mockLogError).toHaveBeenCalledWith(
          expect.stringContaining("Failed to setup CSS import in layout"),
        );
      });

      it("should return false and log error if write fails", async () => {
        mockFileExists.mockResolvedValueOnce(true);
        mockReadFile.mockResolvedValue(
          `---
---` as any,
        );
        mockWriteFile.mockRejectedValue(new Error("Write error"));

        const result = await setupLayoutCssImport("src/styles/starwind.css");

        expect(result).toBe(false);
        expect(mockLogError).toHaveBeenCalledWith(
          expect.stringContaining("Failed to setup CSS import in layout"),
        );
      });

      it("should handle unknown errors gracefully", async () => {
        mockFileExists.mockRejectedValue("Unknown error");

        const result = await setupLayoutCssImport("src/styles/starwind.css");

        expect(result).toBe(false);
        expect(mockLogError).toHaveBeenCalledWith(
          expect.stringContaining("An unknown error occurred"),
        );
      });
    });

    describe("different CSS file paths", () => {
      it("should handle custom CSS file name", async () => {
        mockFileExists.mockResolvedValueOnce(true);
        mockReadFile.mockResolvedValue(
          `---
---` as any,
        );
        mockWriteFile.mockResolvedValue(undefined);

        const result = await setupLayoutCssImport("src/styles/global.css");

        expect(result).toBe(true);
        expect(mockWriteFile).toHaveBeenCalledWith(
          "src/layouts/Layout.astro",
          expect.stringContaining('import "@/styles/global.css";'),
          "utf-8",
        );
      });

      it("should handle CSS file in different directory", async () => {
        mockFileExists.mockResolvedValueOnce(true);
        mockReadFile.mockResolvedValue(
          `---
---` as any,
        );
        mockWriteFile.mockResolvedValue(undefined);

        const result = await setupLayoutCssImport("src/assets/css/main.css");

        expect(result).toBe(true);
        expect(mockWriteFile).toHaveBeenCalledWith(
          "src/layouts/Layout.astro",
          expect.stringContaining('import "@/assets/css/main.css";'),
          "utf-8",
        );
      });

      it("should handle @/ prefixed path", async () => {
        mockFileExists.mockResolvedValueOnce(true);
        mockReadFile.mockResolvedValue(
          `---
---` as any,
        );
        mockWriteFile.mockResolvedValue(undefined);

        const result = await setupLayoutCssImport("@/styles/starwind.css");

        expect(result).toBe(true);
        expect(mockWriteFile).toHaveBeenCalledWith(
          "src/layouts/Layout.astro",
          expect.stringContaining('import "@/styles/starwind.css";'),
          "utf-8",
        );
      });
    });

    describe("complex layout file scenarios", () => {
      it("should preserve existing content when adding import", async () => {
        mockFileExists.mockResolvedValueOnce(true);
        mockReadFile.mockResolvedValue(
          `---
import Nav from "@/components/Nav.astro";
import Footer from "@/components/Footer.astro";

interface Props {
  title: string;
}

const { title } = Astro.props;
---

<!doctype html>
<html lang="en">
  <head>
    <title>{title}</title>
  </head>
  <body>
    <Nav />
    <slot />
    <Footer />
  </body>
</html>` as any,
        );
        mockWriteFile.mockResolvedValue(undefined);

        const result = await setupLayoutCssImport("src/styles/starwind.css");

        expect(result).toBe(true);
        const writtenContent = mockWriteFile.mock.calls[0]?.[1] as string;
        expect(writtenContent).toContain('import "@/styles/starwind.css";');
        expect(writtenContent).toContain('import Nav from "@/components/Nav.astro";');
        expect(writtenContent).toContain("interface Props");
        expect(writtenContent).toContain("<slot />");
      });

      it("should not duplicate import if called twice", async () => {
        mockFileExists.mockResolvedValueOnce(true);
        const contentWithImport = `---
import "@/styles/starwind.css";
---

<html></html>`;
        mockReadFile.mockResolvedValue(contentWithImport as any);

        const result = await setupLayoutCssImport("src/styles/starwind.css");

        expect(result).toBe(true);
        expect(mockWriteFile).not.toHaveBeenCalled();
      });

      it("should detect existing import with different quote style", async () => {
        mockFileExists.mockResolvedValueOnce(true);
        mockReadFile.mockResolvedValue(
          `---
import '@/styles/starwind.css';
---

<html></html>` as any,
        );

        const result = await setupLayoutCssImport("src/styles/starwind.css");

        expect(result).toBe(true);
        expect(mockWriteFile).not.toHaveBeenCalled();
      });
    });
  });
});
