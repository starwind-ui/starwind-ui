import path from "node:path";

import { parse } from "@babel/parser";
import fs from "fs-extra";

import { fileExists } from "@/utils/fs.js";

export const LAYOUT_PATHS = ["src/layouts/Layout.astro", "src/layouts/BaseLayout.astro"] as const;

/**
 * Finds the main layout file in the project
 * @returns The path to the layout file if found, null otherwise
 */
export async function findLayoutFile(): Promise<string | null> {
  for (const layoutPath of LAYOUT_PATHS) {
    if (await fileExists(layoutPath)) {
      return layoutPath;
    }
  }
  return null;
}

/**
 * Checks if the layout file already has the CSS import
 * @param content - The layout file content
 * @param cssPath - The CSS file path to check for
 * @returns true if the import already exists
 */
export function hasCssImport(
  content: string,
  cssPath: string,
  targetPath = "src/layouts/Layout.astro",
): boolean {
  const frontmatter = getFrontmatter(content);
  if (!frontmatter) return false;

  const ast = parse(frontmatter.code, {
    sourceType: "module",
    plugins: ["typescript"],
    allowAwaitOutsideFunction: true,
  });
  const expected = resolveImportPath(cssPath, targetPath);
  return ast.program.body.some(
    (statement) =>
      statement.type === "ImportDeclaration" &&
      statement.importKind !== "type" &&
      resolveImportPath(statement.source.value, targetPath) === expected,
  );
}

function resolveImportPath(value: string, targetPath: string): string {
  const normalized = value.replace(/\\/g, "/");
  if (normalized.startsWith("@/")) return path.posix.normalize(`src/${normalized.slice(2)}`);
  if (normalized.startsWith(".")) {
    return path.posix.normalize(path.posix.join(path.posix.dirname(targetPath), normalized));
  }
  return path.posix.normalize(normalized.startsWith("src/") ? normalized : `src/${normalized}`);
}

function getFrontmatter(content: string): { code: string; start: number } | undefined {
  const opening = content.match(/^\uFEFF?---[ \t]*\r?\n/);
  if (!opening) {
    if (/^\uFEFF?---/.test(content)) throw new Error("Incomplete Astro frontmatter");
    return undefined;
  }
  const start = opening[0].length;
  const closing = content.slice(start).match(/^---[ \t]*(?:\r?\n|$)/m);
  if (!closing || closing.index === undefined) throw new Error("Incomplete Astro frontmatter");
  return { code: content.slice(start, start + closing.index), start };
}

/**
 * Converts a CSS file path to an import path using @/ alias
 * @param cssPath - The CSS file path (e.g., "src/styles/starwind.css")
 * @returns The import path (e.g., "@/styles/starwind.css")
 */
export function toImportPath(cssPath: string): string {
  const normalizedPath = cssPath.replace(/\\/g, "/");

  // If already has @/ prefix, return as-is
  if (normalizedPath.startsWith("@/")) {
    return normalizedPath;
  }

  // If starts with src/, replace with @/
  if (normalizedPath.startsWith("src/")) {
    return `@/${normalizedPath.slice(4)}`;
  }

  // Otherwise, prepend @/
  return `@/${normalizedPath}`;
}

/**
 * Adds a CSS import to the layout file content
 * @param content - The current layout file content
 * @param cssPath - The CSS file path to import
 * @returns The updated content with the CSS import
 */
export function addCssImportToLayout(content: string, cssPath: string): string {
  const importStatement = `import ${JSON.stringify(toImportPath(cssPath))};`;
  const newline = content.includes("\r\n") ? "\r\n" : "\n";
  const frontmatter = getFrontmatter(content);
  if (frontmatter) {
    return (
      content.slice(0, frontmatter.start) +
      importStatement +
      newline +
      content.slice(frontmatter.start)
    );
  }
  const bom = content.startsWith("\uFEFF") ? "\uFEFF" : "";
  return `${bom}---${newline}${importStatement}${newline}---${newline}${newline}${content.slice(bom.length)}`;
}

export type CssImportResult =
  | { status: "added" | "present"; path: string; message: string }
  | { status: "manual" | "error"; message: string };

/** Connect the stylesheet to a known Astro layout or the minimal starter page. */
export async function setupLayoutCssImport(cssPath: string): Promise<CssImportResult> {
  let targetPath: string | null = null;
  try {
    targetPath = await findLayoutFile();
    if (!targetPath && (await fileExists("src/pages/index.astro"))) {
      targetPath = "src/pages/index.astro";
    }
    const manualStep = `Add this line between the --- lines at the top\nof your Astro layout or page:\n\nimport ${JSON.stringify(toImportPath(cssPath))};`;
    if (!targetPath) {
      return {
        status: "manual",
        message: `Starwind CSS still needs to be imported.\nNo supported layout or home page was found.\n\n${manualStep}`,
      };
    }

    const content = await fs.readFile(targetPath, "utf-8");
    let updatedContent: string;
    try {
      if (hasCssImport(content, cssPath, targetPath)) {
        return {
          status: "present",
          path: targetPath,
          message: `Starwind CSS is already imported in ${targetPath}`,
        };
      }
      updatedContent = addCssImportToLayout(content, cssPath);
    } catch {
      return {
        status: "manual",
        message: `Starwind could not safely edit ${targetPath}.\n\n${manualStep}`,
      };
    }
    await fs.writeFile(targetPath, updatedContent, "utf-8");
    return {
      status: "added",
      path: targetPath,
      message: `Added Starwind CSS import to ${targetPath}`,
    };
  } catch (error) {
    const detail = error instanceof Error ? error.message : "An unknown error occurred";
    return {
      status: "error",
      message: `Could not add the Starwind CSS import${targetPath ? ` to ${targetPath}` : ""}: ${detail}`,
    };
  }
}
