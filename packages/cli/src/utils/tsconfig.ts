import * as p from "@clack/prompts";

import { fileExists, readJsoncFile, writeJsonFile } from "@/utils/fs.js";
import { highlighter } from "@/utils/highlighter.js";
import type { StarwindFramework } from "@/utils/config.js";

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
const REACT_PATH_ALIAS = "./src/*";

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
export function validateTsConfig(
  config: TsConfig,
  framework: StarwindFramework = "astro",
): {
  hasExtends: boolean;
  hasBaseUrl: boolean;
  hasPathAlias: boolean;
  isComplete: boolean;
} {
  const hasExtends = framework === "react" || config.extends === REQUIRED_TSCONFIG.extends;
  const hasBaseUrl =
    framework === "react" ||
    config.compilerOptions?.baseUrl === REQUIRED_TSCONFIG.compilerOptions.baseUrl;

  // Check if the @/* path alias exists and points to src/*
  const paths = config.compilerOptions?.paths;
  const requiredPathAlias =
    framework === "react" ? REACT_PATH_ALIAS : REQUIRED_TSCONFIG.compilerOptions.paths["@/*"][0];
  const hasPathAlias =
    paths !== undefined &&
    "@/*" in paths &&
    Array.isArray(paths["@/*"]) &&
    paths["@/*"].includes(requiredPathAlias);

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
export function mergeTsConfig(
  existingConfig: TsConfig,
  framework: StarwindFramework = "astro",
): TsConfig {
  const validation = validateTsConfig(existingConfig, framework);

  // If already complete, return as-is
  if (validation.isComplete) {
    return existingConfig;
  }

  const merged: TsConfig = { ...existingConfig };

  // Add extends if missing
  if (framework === "astro" && !validation.hasExtends) {
    merged.extends = REQUIRED_TSCONFIG.extends;
  }

  // Ensure compilerOptions exists
  if (!merged.compilerOptions) {
    merged.compilerOptions = {};
  }

  // Add baseUrl if missing
  if (framework === "astro" && !validation.hasBaseUrl) {
    merged.compilerOptions.baseUrl = REQUIRED_TSCONFIG.compilerOptions.baseUrl;
  }

  // Add or merge paths
  if (!validation.hasPathAlias) {
    if (!merged.compilerOptions.paths) {
      merged.compilerOptions.paths = {};
    }
    merged.compilerOptions.paths["@/*"] = [
      framework === "react" ? REACT_PATH_ALIAS : REQUIRED_TSCONFIG.compilerOptions.paths["@/*"][0],
    ];
  }

  return merged;
}

/**
 * Creates a new tsconfig.json with the required configuration
 * @returns The default tsconfig configuration
 */
export function createDefaultTsConfig(framework: StarwindFramework = "astro"): TsConfig {
  return {
    ...(framework === "astro" ? { extends: REQUIRED_TSCONFIG.extends } : {}),
    compilerOptions: {
      ...(framework === "astro" ? { baseUrl: REQUIRED_TSCONFIG.compilerOptions.baseUrl } : {}),
      paths: {
        "@/*": [
          framework === "react"
            ? REACT_PATH_ALIAS
            : REQUIRED_TSCONFIG.compilerOptions.paths["@/*"][0],
        ],
      },
    },
  };
}

/**
 * Sets up the tsconfig.json file with required path aliases
 * Creates the file if it doesn't exist, or updates it if configuration is missing
 * @returns true if successful, false otherwise
 */
export async function setupTsConfig(framework: StarwindFramework = "astro"): Promise<boolean> {
  try {
    const TSCONFIG_PATH =
      framework === "react" && (await fileExists("tsconfig.app.json"))
        ? "tsconfig.app.json"
        : "tsconfig.json";
    const exists = await fileExists(TSCONFIG_PATH);

    if (exists) {
      // Read existing config
      const existingConfig = (await readJsoncFile(TSCONFIG_PATH)) as TsConfig;
      const validation = validateTsConfig(existingConfig, framework);

      if (validation.isComplete) {
        // Config is already complete, nothing to do
        return true;
      }

      // Merge required configuration
      const mergedConfig = mergeTsConfig(existingConfig, framework);
      await writeJsonFile(TSCONFIG_PATH, mergedConfig);
    } else {
      // Create new config file
      const defaultConfig = createDefaultTsConfig(framework);
      await writeJsonFile(TSCONFIG_PATH, defaultConfig);
    }

    return true;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "An unknown error occurred";
    p.log.error(highlighter.error(`Failed to setup tsconfig.json: ${errorMessage}`));
    return false;
  }
}
