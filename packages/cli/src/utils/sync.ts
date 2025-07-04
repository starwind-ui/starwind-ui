import * as path from "node:path";

import * as fs from "fs-extra";

import { highlighter } from "./highlighter.js";

/**
 * Synchronizes components from a source directory to a target directory
 * @param source - The source directory path containing components to sync
 * @param target - The target directory path where components will be synced to
 */
export async function syncComponents(source: string, target: string): Promise<void> {
  try {
    // Ensure target directory exists
    await fs.ensureDir(target);

    // Copy entire directory contents
    await fs.copy(source, target);
    highlighter.info(`Synced components from ${path.basename(source)} to ${path.basename(target)}`);
  } catch (error) {
    throw new Error(
      `Failed to sync components: ${error instanceof Error ? error.message : String(error)}`,
    );
  }
}
