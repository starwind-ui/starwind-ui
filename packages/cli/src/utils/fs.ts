import fs from "fs-extra";
import { parse, printParseErrorCode, type ParseError } from "jsonc-parser";

import { resolveProjectMutationPath } from "./project-path.js";

/**
 * Ensures a directory exists, creating it and its parents if necessary
 * @param dir - Directory path to ensure exists
 */
export async function ensureDirectory(dir: string) {
  await fs.ensureDir(await resolveProjectMutationPath(dir));
}

/**
 * Copies a file from source to destination
 * @param src - Source file path
 * @param dest - Destination file path
 */
export async function copyFile(src: string, dest: string) {
  await fs.copy(src, dest);
}

/**
 * Reads and parses a JSON file
 * @param filePath - Path to the JSON file
 * @returns Parsed JSON content
 */
export async function readJsonFile(filePath: string) {
  return fs.readJson(filePath);
}

export async function readJsoncFile(filePath: string): Promise<unknown> {
  const source = await fs.readFile(filePath, "utf8");
  const errors: ParseError[] = [];
  const value = parse(source, errors, { allowTrailingComma: true });

  if (errors.length > 0) {
    const firstError = errors[0]!;
    throw new Error(
      `${filePath}: ${printParseErrorCode(firstError.error)} at offset ${firstError.offset}`,
    );
  }

  return value;
}

/**
 * Writes data to a JSON file
 * @param filePath - Path to write the JSON file
 * @param data - Data to write to the file
 */
export async function writeJsonFile(filePath: string, data: unknown) {
  await fs.writeJson(await resolveProjectMutationPath(filePath), data, { spaces: 2 });
}

/**
 * Checks if a file exists
 * @param filePath - Path to check
 * @returns True if the file exists, false otherwise
 */
export async function fileExists(filePath: string) {
  return fs.pathExists(filePath);
}

/**
 * Creates a CSS file with the provided content
 * @param filePath - Path to write the CSS file
 * @param content - CSS content to write
 */
export async function writeCssFile(filePath: string, content: string) {
  await fs.writeFile(await resolveProjectMutationPath(filePath), content, "utf-8");
}
