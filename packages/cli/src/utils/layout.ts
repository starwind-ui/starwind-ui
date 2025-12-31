import * as p from "@clack/prompts";
import fs from "fs-extra";

import { fileExists } from "@/utils/fs.js";
import { highlighter } from "@/utils/highlighter.js";

const LAYOUT_PATHS = ["src/layouts/Layout.astro", "src/layouts/BaseLayout.astro"] as const;

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
export function hasCssImport(content: string, cssPath: string): boolean {
  // Normalize the path for comparison (handle both forward and back slashes)
  const normalizedCssPath = cssPath.replace(/\\/g, "/");

  // Check for various import formats
  const importPatterns = [
    // import "@/styles/starwind.css"
    new RegExp(`import\\s+["']${escapeRegExp(normalizedCssPath)}["']`),
    // import "@/styles/starwind.css";
    new RegExp(`import\\s+["']${escapeRegExp(normalizedCssPath)}["'];?`),
    // Handle paths without @/ prefix if cssPath starts with src/
    ...(normalizedCssPath.startsWith("src/")
      ? [new RegExp(`import\\s+["']@/${escapeRegExp(normalizedCssPath.slice(4))}["']`)]
      : []),
    // Handle @/ paths if cssPath doesn't have it
    ...(!normalizedCssPath.startsWith("@/")
      ? [new RegExp(`import\\s+["']@/${escapeRegExp(normalizedCssPath)}["']`)]
      : []),
  ];

  return importPatterns.some((pattern) => pattern.test(content));
}

/**
 * Escapes special regex characters in a string
 */
function escapeRegExp(string: string): string {
  return string.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
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
  const importPath = toImportPath(cssPath);
  const importStatement = `import "${importPath}";`;

  // Check if file has frontmatter (starts with ---)
  const frontmatterMatch = content.match(/^---\r?\n/);

  if (frontmatterMatch) {
    // File has frontmatter, add import after the opening ---
    const insertPosition = frontmatterMatch[0].length;
    return (
      content.slice(0, insertPosition) + importStatement + "\n" + content.slice(insertPosition)
    );
  } else {
    // File doesn't have frontmatter, add it with the import
    return `---\n${importStatement}\n---\n\n${content}`;
  }
}

/**
 * Sets up the CSS import in the main layout file
 * @param cssPath - The CSS file path to import
 * @returns true if successful or no layout file found, false on error
 */
export async function setupLayoutCssImport(cssPath: string): Promise<boolean> {
  try {
    const layoutPath = await findLayoutFile();

    if (!layoutPath) {
      // No layout file found, skip silently (not an error)
      return true;
    }

    const content = await fs.readFile(layoutPath, "utf-8");

    // Check if import already exists
    if (hasCssImport(content, cssPath)) {
      // Import already exists, nothing to do
      return true;
    }

    // Add the import
    const updatedContent = addCssImportToLayout(content, cssPath);
    await fs.writeFile(layoutPath, updatedContent, "utf-8");

    return true;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "An unknown error occurred";
    p.log.error(highlighter.error(`Failed to setup CSS import in layout: ${errorMessage}`));
    return false;
  }
}
