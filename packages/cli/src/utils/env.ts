import * as p from "@clack/prompts";
import fs from "fs-extra";

import { fileExists } from "@/utils/fs.js";
import { highlighter } from "@/utils/highlighter.js";

const ENV_LOCAL_PATH = ".env.local";
const GITIGNORE_PATH = ".gitignore";

const STARWIND_ENV_CONTENT = `# Starwind Pro registry setup
STARWIND_LICENSE_KEY=your_starwind_pro_license_key
`;

const DEFAULT_GITIGNORE_CONTENT = `# build output
dist/

# generated types
.astro/

# dependencies
node_modules/

# logs
npm-debug.log*
yarn-debug.log*
yarn-error.log*
pnpm-debug.log*

# environment variables
.env
.env.local
.env.production

# macOS-specific files
.DS_Store

# jetbrains setting folder
.idea/
`;

/**
 * Checks if the .env.local file contains the STARWIND_LICENSE_KEY
 * @param content - The .env.local file content
 * @returns true if the key already exists
 */
export function hasStarwindLicenseKey(content: string): boolean {
  // Check for the key with any value (including empty)
  return /^STARWIND_LICENSE_KEY\s*=/m.test(content);
}

/**
 * Checks if the .gitignore file contains .env.local
 * @param content - The .gitignore file content
 * @returns true if .env.local is already ignored
 */
export function hasEnvLocalInGitignore(content: string): boolean {
  // Check for .env.local on its own line (with optional leading/trailing whitespace)
  // Also handle patterns like *.env.local or .env.local*
  const lines = content.split(/\r?\n/);
  return lines.some((line) => {
    const trimmed = line.trim();
    // Exact match or common patterns that would include .env.local
    return (
      trimmed === ".env.local" ||
      trimmed === ".env.local/" ||
      trimmed === ".env*" ||
      trimmed === ".env.*" ||
      trimmed === "*.local"
    );
  });
}

/**
 * Adds the Starwind license key placeholder to .env.local
 * Creates the file if it doesn't exist
 * @returns true if successful, false on error
 */
export async function setupEnvLocal(): Promise<boolean> {
  try {
    const exists = await fileExists(ENV_LOCAL_PATH);

    if (exists) {
      const content = await fs.readFile(ENV_LOCAL_PATH, "utf-8");

      if (hasStarwindLicenseKey(content)) {
        // Key already exists, nothing to do
        return true;
      }

      // Add the key at the top of the file
      const newContent = STARWIND_ENV_CONTENT + "\n" + content;
      await fs.writeFile(ENV_LOCAL_PATH, newContent, "utf-8");
    } else {
      // Create new file with the key
      await fs.writeFile(ENV_LOCAL_PATH, STARWIND_ENV_CONTENT, "utf-8");
    }

    return true;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "An unknown error occurred";
    p.log.error(highlighter.error(`Failed to setup .env.local: ${errorMessage}`));
    return false;
  }
}

/**
 * Adds .env.local to .gitignore
 * Creates the file if it doesn't exist
 * @returns true if successful, false on error
 */
export async function setupGitignore(): Promise<boolean> {
  try {
    const exists = await fileExists(GITIGNORE_PATH);

    if (exists) {
      const content = await fs.readFile(GITIGNORE_PATH, "utf-8");

      if (hasEnvLocalInGitignore(content)) {
        // Already ignored, nothing to do
        return true;
      }

      // Add .env.local at the end of the file
      const needsNewline = content.length > 0 && !content.endsWith("\n");
      const newContent = content + (needsNewline ? "\n" : "") + ".env.local\n";
      await fs.writeFile(GITIGNORE_PATH, newContent, "utf-8");
    } else {
      // Create new file with default content (includes .env.local)
      await fs.writeFile(GITIGNORE_PATH, DEFAULT_GITIGNORE_CONTENT, "utf-8");
    }

    return true;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "An unknown error occurred";
    p.log.error(highlighter.error(`Failed to setup .gitignore: ${errorMessage}`));
    return false;
  }
}

/**
 * Sets up both .env.local and .gitignore for Starwind Pro
 * @returns true if both operations succeed, false if either fails
 */
export async function setupStarwindProEnv(): Promise<boolean> {
  const envResult = await setupEnvLocal();
  const gitignoreResult = await setupGitignore();

  return envResult && gitignoreResult;
}

/**
 * Checks if the Starwind Pro environment is already configured
 * @returns true if .env.local has the key and .gitignore includes .env.local
 */
export async function checkStarwindProEnv(): Promise<boolean> {
  // Check .env.local
  const envExists = await fileExists(ENV_LOCAL_PATH);
  if (!envExists) return false;

  const envContent = await fs.readFile(ENV_LOCAL_PATH, "utf-8");
  if (!hasStarwindLicenseKey(envContent)) return false;

  // Check .gitignore
  const gitignoreExists = await fileExists(GITIGNORE_PATH);
  if (gitignoreExists) {
    const gitignoreContent = await fs.readFile(GITIGNORE_PATH, "utf-8");
    if (!hasEnvLocalInGitignore(gitignoreContent)) return false;
  } else {
    // If .gitignore doesn't exist, we consider the env not set up
    // because we want to create it with the default content
    return false;
  }

  return true;
}
