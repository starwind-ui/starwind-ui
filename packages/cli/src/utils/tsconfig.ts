import * as p from "@clack/prompts";
import fs from "fs-extra";

import { fileExists, readJsonFile, writeJsonFile } from "@/utils/fs.js";
import { highlighter } from "@/utils/highlighter.js";

/**
 * Required tsconfig.json configuration for Starwind UI
 */
const REQUIRED_TSCONFIG = {
  extends: "astro/tsconfigs/strict",
  compilerOptions: {
    baseUrl: ".",
    paths: {
      "@/*": ["src/*"],
    },
  },
} as const;

interface TsConfigPaths {
  [key: string]: string[];
}

interface TsConfigCompilerOptions {
  baseUrl?: string;
  paths?: TsConfigPaths;
  [key: string]: unknown;
}

interface TsConfig {
  extends?: string;
  compilerOptions?: TsConfigCompilerOptions;
  [key: string]: unknown;
}

/**
 * Checks if the tsconfig.json has the required path alias configuration
 * @param config - The parsed tsconfig.json content
 * @returns Object indicating what's missing
 */
export function validateTsConfig(config: TsConfig): {
  hasExtends: boolean;
  hasBaseUrl: boolean;
  hasPathAlias: boolean;
  isComplete: boolean;
} {
  const hasExtends = config.extends === REQUIRED_TSCONFIG.extends;
  const hasBaseUrl = config.compilerOptions?.baseUrl === REQUIRED_TSCONFIG.compilerOptions.baseUrl;

  // Check if the @/* path alias exists and points to src/*
  const paths = config.compilerOptions?.paths;
  const hasPathAlias =
    paths !== undefined &&
    "@/*" in paths &&
    Array.isArray(paths["@/*"]) &&
    paths["@/*"].includes("src/*");

  return {
    hasExtends,
    hasBaseUrl,
    hasPathAlias,
    isComplete: hasExtends && hasBaseUrl && hasPathAlias,
  };
}

/**
 * Merges the required configuration into an existing tsconfig
 * @param existingConfig - The existing tsconfig.json content
 * @returns The merged configuration
 */
export function mergeTsConfig(existingConfig: TsConfig): TsConfig {
  const validation = validateTsConfig(existingConfig);

  // If already complete, return as-is
  if (validation.isComplete) {
    return existingConfig;
  }

  const merged: TsConfig = { ...existingConfig };

  // Add extends if missing
  if (!validation.hasExtends) {
    merged.extends = REQUIRED_TSCONFIG.extends;
  }

  // Ensure compilerOptions exists
  if (!merged.compilerOptions) {
    merged.compilerOptions = {};
  }

  // Add baseUrl if missing
  if (!validation.hasBaseUrl) {
    merged.compilerOptions.baseUrl = REQUIRED_TSCONFIG.compilerOptions.baseUrl;
  }

  // Add or merge paths
  if (!validation.hasPathAlias) {
    if (!merged.compilerOptions.paths) {
      merged.compilerOptions.paths = {};
    }
    // Only add the @/* alias if it doesn't exist or doesn't have src/*
    if (
      !merged.compilerOptions.paths["@/*"] ||
      !merged.compilerOptions.paths["@/*"].includes("src/*")
    ) {
      merged.compilerOptions.paths["@/*"] = REQUIRED_TSCONFIG.compilerOptions.paths["@/*"];
    }
  }

  return merged;
}

/**
 * Creates a new tsconfig.json with the required configuration
 * @returns The default tsconfig configuration
 */
export function createDefaultTsConfig(): TsConfig {
  return {
    extends: REQUIRED_TSCONFIG.extends,
    compilerOptions: {
      baseUrl: REQUIRED_TSCONFIG.compilerOptions.baseUrl,
      paths: {
        "@/*": [...REQUIRED_TSCONFIG.compilerOptions.paths["@/*"]],
      },
    },
  };
}

/**
 * Sets up the tsconfig.json file with required path aliases
 * Creates the file if it doesn't exist, or updates it if configuration is missing
 * @returns true if successful, false otherwise
 */
export async function setupTsConfig(): Promise<boolean> {
  const TSCONFIG_PATH = "tsconfig.json";

  try {
    const exists = await fileExists(TSCONFIG_PATH);

    if (exists) {
      // Read existing config
      const existingConfig = (await readJsonFile(TSCONFIG_PATH)) as TsConfig;
      const validation = validateTsConfig(existingConfig);

      if (validation.isComplete) {
        // Config is already complete, nothing to do
        return true;
      }

      // Merge required configuration
      const mergedConfig = mergeTsConfig(existingConfig);
      await writeJsonFile(TSCONFIG_PATH, mergedConfig);
    } else {
      // Create new config file
      const defaultConfig = createDefaultTsConfig();
      await writeJsonFile(TSCONFIG_PATH, defaultConfig);
    }

    return true;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "An unknown error occurred";
    p.log.error(highlighter.error(`Failed to setup tsconfig.json: ${errorMessage}`));
    return false;
  }
}
