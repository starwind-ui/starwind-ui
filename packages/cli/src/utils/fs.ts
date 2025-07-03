import fs from "fs-extra";

/**
 * Ensures a directory exists, creating it and its parents if necessary
 * @param dir - Directory path to ensure exists
 */
export async function ensureDirectory(dir: string) {
  await fs.ensureDir(dir);
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

/**
 * Writes data to a JSON file
 * @param filePath - Path to write the JSON file
 * @param data - Data to write to the file
 */
export async function writeJsonFile(filePath: string, data: unknown) {
  await fs.writeJson(filePath, data, { spaces: 2 });
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
  await fs.writeFile(filePath, content, "utf-8");
}
