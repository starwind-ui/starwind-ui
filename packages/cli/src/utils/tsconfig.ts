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
type ReactSourceRoot = "." | "app" | "src";

const REACT_JAVASCRIPT_COMPILER_PROFILE = {
  allowJs: true,
  checkJs: false,
  jsx: "react-jsx",
  lib: ["ES2022", "DOM", "DOM.Iterable"],
  module: "ESNext",
  moduleResolution: "Bundler",
  noEmit: true,
  skipLibCheck: true,
  target: "ES2022",
  types: ["vite/client"],
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
  include?: string[];
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
  reactSourceRoot: ReactSourceRoot = "src",
  includeJavaScript = false,
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
    framework === "react"
      ? getReactPathAlias(reactSourceRoot)
      : REQUIRED_TSCONFIG.compilerOptions.paths["@/*"][0];
  const hasPathAlias =
    paths !== undefined &&
    "@/*" in paths &&
    Array.isArray(paths["@/*"]) &&
    (framework === "react"
      ? paths["@/*"][0] === requiredPathAlias
      : paths["@/*"].includes(requiredPathAlias));

  const hasReactJavaScriptProfile =
    framework !== "react" ||
    !includeJavaScript ||
    hasCompleteReactJavaScriptProfile(config, reactSourceRoot);

  return {
    hasExtends,
    hasBaseUrl,
    hasPathAlias,
    isComplete: hasExtends && hasBaseUrl && hasPathAlias && hasReactJavaScriptProfile,
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
  reactSourceRoot: ReactSourceRoot = "src",
  includeJavaScript = false,
): TsConfig {
  const validation = validateTsConfig(
    existingConfig,
    framework,
    reactSourceRoot,
    includeJavaScript,
  );

  // If already complete, return as-is
  if (validation.isComplete) {
    return existingConfig;
  }

  const merged: TsConfig = {
    ...existingConfig,
    ...(existingConfig.compilerOptions
      ? {
          compilerOptions: {
            ...existingConfig.compilerOptions,
            ...(existingConfig.compilerOptions.paths
              ? { paths: { ...existingConfig.compilerOptions.paths } }
              : {}),
          },
        }
      : {}),
  };

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
    const requiredAlias =
      framework === "react"
        ? getReactPathAlias(reactSourceRoot)
        : REQUIRED_TSCONFIG.compilerOptions.paths["@/*"][0];
    const existingTargets = merged.compilerOptions.paths["@/*"] ?? [];
    merged.compilerOptions.paths["@/*"] =
      framework === "react"
        ? [requiredAlias, ...existingTargets.filter((target) => target !== requiredAlias)]
        : [requiredAlias];
  }

  if (framework === "react" && includeJavaScript) {
    merged.compilerOptions = mergeReactJavaScriptCompilerProfile(merged.compilerOptions);
    merged.include = mergeReactSourceIncludes(merged.include, reactSourceRoot);
  }

  return merged;
}

/**
 * Creates a new tsconfig.json with the required configuration
 * @returns The default tsconfig configuration
 */
export function createDefaultTsConfig(
  framework: StarwindFramework = "astro",
  reactSourceRoot: ReactSourceRoot = "src",
  includeJavaScript = false,
): TsConfig {
  return {
    ...(framework === "astro" ? { extends: REQUIRED_TSCONFIG.extends } : {}),
    compilerOptions: {
      ...(framework === "astro" ? { baseUrl: REQUIRED_TSCONFIG.compilerOptions.baseUrl } : {}),
      ...(framework === "react" && includeJavaScript
        ? { ...REACT_JAVASCRIPT_COMPILER_PROFILE }
        : {}),
      paths: {
        "@/*": [
          framework === "react"
            ? getReactPathAlias(reactSourceRoot)
            : REQUIRED_TSCONFIG.compilerOptions.paths["@/*"][0],
        ],
      },
    },
    ...(framework === "react" && includeJavaScript
      ? { include: [getReactIncludeRoot(reactSourceRoot)] }
      : {}),
  };
}

/**
 * Sets up the tsconfig.json file with required path aliases
 * Creates the file if it doesn't exist, or updates it if configuration is missing
 * @returns true if successful, false otherwise
 */
export async function setupTsConfig(
  framework: StarwindFramework = "astro",
  reactSourceRoot: ReactSourceRoot = "src",
  includeJavaScript = false,
): Promise<boolean> {
  try {
    const TSCONFIG_PATH =
      framework === "react" && (await fileExists("tsconfig.app.json"))
        ? "tsconfig.app.json"
        : "tsconfig.json";
    const exists = await fileExists(TSCONFIG_PATH);

    if (exists) {
      // Read existing config
      const existingConfig = (await readJsoncFile(TSCONFIG_PATH)) as TsConfig;
      const validation = validateTsConfig(
        existingConfig,
        framework,
        reactSourceRoot,
        includeJavaScript,
      );

      if (validation.isComplete) {
        // Config is already complete, nothing to do
        return true;
      }

      // Merge required configuration
      const mergedConfig = mergeTsConfig(
        existingConfig,
        framework,
        reactSourceRoot,
        includeJavaScript,
      );
      await writeJsonFile(TSCONFIG_PATH, mergedConfig);
    } else {
      // Create new config file
      const defaultConfig = createDefaultTsConfig(framework, reactSourceRoot, includeJavaScript);
      await writeJsonFile(TSCONFIG_PATH, defaultConfig);
    }

    return true;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "An unknown error occurred";
    p.log.error(highlighter.error(`Failed to setup tsconfig.json: ${errorMessage}`));
    return false;
  }
}

export function mergeVueTsConfig(existingConfig: TsConfig, includeJavaScript = false): TsConfig {
  const compilerOptions = {
    ...(existingConfig.compilerOptions ?? {}),
    ...(includeJavaScript
      ? {
          allowJs: true,
          checkJs:
            typeof existingConfig.compilerOptions?.checkJs === "boolean"
              ? existingConfig.compilerOptions.checkJs
              : false,
        }
      : {}),
    paths: {
      ...(existingConfig.compilerOptions?.paths ?? {}),
      "@/*": [
        "./src/*",
        ...(existingConfig.compilerOptions?.paths?.["@/*"] ?? []).filter(
          (target) => target !== "./src/*",
        ),
      ],
    },
  };
  const include = existingConfig.include ?? [];
  const hasVueSources = include.some(
    (entry) => entry === "src/**/*" || entry === "src/**/*.vue" || entry === "src",
  );

  return {
    ...existingConfig,
    compilerOptions,
    ...(!hasVueSources ? { include: [...include, "src/**/*.vue"] } : {}),
  };
}

export async function setupVueTsConfig(includeJavaScript = false): Promise<boolean> {
  try {
    const configPath = (await fileExists("tsconfig.app.json"))
      ? "tsconfig.app.json"
      : "tsconfig.json";
    const existingConfig = (await fileExists(configPath))
      ? ((await readJsoncFile(configPath)) as TsConfig)
      : {};
    const mergedConfig = mergeVueTsConfig(existingConfig, includeJavaScript);
    if (JSON.stringify(mergedConfig) !== JSON.stringify(existingConfig)) {
      await writeJsonFile(configPath, mergedConfig);
    }
    return true;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "An unknown error occurred";
    p.log.error(highlighter.error(`Failed to setup Vue tsconfig: ${errorMessage}`));
    return false;
  }
}

/** Adds the JSX settings required by Astro's official React integration. */
export async function setupAstroReactTsConfig(): Promise<boolean> {
  try {
    const TSCONFIG_PATH = "tsconfig.json";
    const existingConfig = (await fileExists(TSCONFIG_PATH))
      ? ((await readJsoncFile(TSCONFIG_PATH)) as TsConfig)
      : createDefaultTsConfig("astro");
    const compilerOptions = {
      ...(existingConfig.compilerOptions ?? {}),
      jsx: "react-jsx",
      jsxImportSource: "react",
    };

    if (
      existingConfig.compilerOptions?.jsx === "react-jsx" &&
      existingConfig.compilerOptions.jsxImportSource === "react"
    ) {
      return true;
    }

    await writeJsonFile(TSCONFIG_PATH, { ...existingConfig, compilerOptions });
    return true;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "An unknown error occurred";
    p.log.error(highlighter.error(`Failed to setup Astro React JSX settings: ${errorMessage}`));
    return false;
  }
}

export async function isAstroReactTsConfigReady(): Promise<boolean> {
  if (!(await fileExists("tsconfig.json"))) return false;
  try {
    const config = (await readJsoncFile("tsconfig.json")) as TsConfig;
    return (
      config.compilerOptions?.jsx === "react-jsx" &&
      config.compilerOptions.jsxImportSource === "react"
    );
  } catch {
    return false;
  }
}

function getReactPathAlias(sourceRoot: ReactSourceRoot): string {
  if (sourceRoot === ".") return "./*";
  return `./${sourceRoot}/*`;
}

function hasCompleteReactJavaScriptProfile(config: TsConfig, sourceRoot: ReactSourceRoot): boolean {
  const options = config.compilerOptions;
  if (!options) return false;

  const hasRequiredBooleans =
    options.allowJs === true &&
    typeof options.checkJs === "boolean" &&
    options.noEmit === true &&
    options.skipLibCheck === true;
  const lib = Array.isArray(options.lib) ? options.lib : [];
  const types = Array.isArray(options.types) ? options.types : [];

  return (
    isCompatibleReactJsx(options.jsx) &&
    isCompatibleReactJsxImportSource(options.jsxImportSource) &&
    isCompatibleReactModule(options.module) &&
    isBundlerModuleResolution(options.moduleResolution) &&
    isCompatibleReactTarget(options.target) &&
    hasRequiredBooleans &&
    REACT_JAVASCRIPT_COMPILER_PROFILE.lib.every((entry) => lib.includes(entry)) &&
    types.includes("vite/client") &&
    hasReactSourceIncludes(config.include, sourceRoot)
  );
}

function mergeReactJavaScriptCompilerProfile(
  existingOptions: TsConfigCompilerOptions,
): TsConfigCompilerOptions {
  const existingLib = Array.isArray(existingOptions.lib) ? existingOptions.lib : [];
  const existingTypes = Array.isArray(existingOptions.types) ? existingOptions.types : [];

  return {
    ...REACT_JAVASCRIPT_COMPILER_PROFILE,
    ...existingOptions,
    allowJs: true,
    checkJs: typeof existingOptions.checkJs === "boolean" ? existingOptions.checkJs : false,
    jsx: isCompatibleReactJsx(existingOptions.jsx) ? existingOptions.jsx : "react-jsx",
    ...(isCompatibleReactJsxImportSource(existingOptions.jsxImportSource)
      ? {}
      : { jsxImportSource: "react" }),
    lib: [...new Set([...existingLib, ...REACT_JAVASCRIPT_COMPILER_PROFILE.lib])],
    noEmit: true,
    module: isCompatibleReactModule(existingOptions.module) ? existingOptions.module : "ESNext",
    moduleResolution: "Bundler",
    skipLibCheck: true,
    target: isCompatibleReactTarget(existingOptions.target) ? existingOptions.target : "ES2022",
    types: [...new Set([...existingTypes, ...REACT_JAVASCRIPT_COMPILER_PROFILE.types])],
  };
}

function isCompatibleReactJsx(value: unknown): value is string {
  return (
    typeof value === "string" &&
    ["preserve", "react-jsx", "react-jsxdev"].includes(value.toLowerCase())
  );
}

function isCompatibleReactJsxImportSource(value: unknown): boolean {
  return value === undefined || (typeof value === "string" && value.toLowerCase() === "react");
}

function isCompatibleReactModule(value: unknown): value is string {
  return (
    typeof value === "string" &&
    ["es6", "es2015", "es2020", "es2022", "esnext", "preserve"].includes(value.toLowerCase())
  );
}

function isBundlerModuleResolution(value: unknown): boolean {
  return typeof value === "string" && value.toLowerCase() === "bundler";
}

function isCompatibleReactTarget(value: unknown): value is string {
  return (
    typeof value === "string" &&
    ["es2020", "es2021", "es2022", "es2023", "es2024", "esnext"].includes(value.toLowerCase())
  );
}

function mergeReactSourceIncludes(
  existingIncludes: string[] | undefined,
  sourceRoot: ReactSourceRoot,
): string[] {
  if (!existingIncludes) return [getReactIncludeRoot(sourceRoot)];
  if (hasReactSourceIncludes(existingIncludes, sourceRoot)) return existingIncludes;

  const root = getReactIncludeRoot(sourceRoot);
  const requiredPatterns = ["js", "jsx", "ts", "tsx"].map(
    (extension) => `${root}/**/*.${extension}`,
  );
  return [...new Set([...existingIncludes, ...requiredPatterns])];
}

function hasReactSourceIncludes(
  includes: string[] | undefined,
  sourceRoot: ReactSourceRoot,
): boolean {
  if (!includes) return false;
  const root = getReactIncludeRoot(sourceRoot);
  if (includes.includes(root) || includes.includes(`${root}/**/*`)) return true;

  return ["js", "jsx", "ts", "tsx"].every((extension) =>
    includes.includes(`${root}/**/*.${extension}`),
  );
}

function getReactIncludeRoot(sourceRoot: ReactSourceRoot): string {
  return sourceRoot === "." ? "." : sourceRoot;
}
