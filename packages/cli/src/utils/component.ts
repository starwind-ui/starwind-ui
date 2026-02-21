import * as path from "node:path";
import { fileURLToPath } from "node:url";

import * as p from "@clack/prompts";
import fs from "fs-extra";
import semver from "semver";

import { getConfig } from "./config.js";
import { PATHS } from "./constants.js";
import { highlighter } from "./highlighter.js";
import { getComponent, getRegistry } from "./registry.js";

type BaseInstallResult = {
  name: string;
  dependencyResults?: InstallResult[];
};

type InstalledResult = BaseInstallResult & {
  status: "installed";
  version: string;
};

type SkippedResult = BaseInstallResult & {
  status: "skipped";
  version: string;
};

type FailedResult = BaseInstallResult & {
  status: "failed";
  version?: string;
  error: string;
};

export type InstallResult = InstalledResult | SkippedResult | FailedResult;

export interface RemoveResult {
  name: string;
  status: "removed" | "failed";
  error?: string;
}

export interface UpdateResult {
  name: string;
  status: "updated" | "skipped" | "failed";
  oldVersion?: string;
  newVersion?: string;
  error?: string;
}

interface CopyComponentOptions {
  resolvePackageUrl?: (specifier: string) => string | undefined;
}

function resolveConfigPath(directory: string): string {
  if (directory.startsWith("@/")) {
    return path.join("src", directory.slice(2));
  }

  return directory;
}

function normalizeFileDependencyPath(fileDependency: string): string {
  const normalized = fileDependency.replace(/\\/g, "/");

  if (path.posix.isAbsolute(normalized)) {
    throw new Error(`File dependency "${fileDependency}" must be a relative path`);
  }

  const trimmed = normalized.startsWith("starwind/")
    ? normalized.slice("starwind/".length)
    : normalized;
  const safePath = path.posix.normalize(trimmed);

  if (safePath.startsWith("..") || safePath === "." || safePath.length === 0) {
    throw new Error(`File dependency "${fileDependency}" contains an invalid path`);
  }

  return safePath;
}

async function copyFileDependencies(options: {
  coreDir: string;
  fileDependencies: string[];
  utilsDir: string;
}): Promise<void> {
  const { coreDir, fileDependencies, utilsDir } = options;

  if (fileDependencies.length === 0) return;

  const targetUtilsRoot = path.join(resolveConfigPath(utilsDir), "starwind");
  const sourceUtilsRoot = path.join(coreDir, PATHS.STARWIND_CORE_UTILS, "starwind");

  await fs.ensureDir(targetUtilsRoot);

  for (const fileDependency of fileDependencies) {
    const relativePath = normalizeFileDependencyPath(fileDependency);
    const sourcePath = path.join(sourceUtilsRoot, relativePath);
    const destinationPath = path.join(targetUtilsRoot, relativePath);

    if (!(await fs.pathExists(sourcePath))) {
      throw new Error(
        `File dependency "${fileDependency}" for component is missing from ${PATHS.STARWIND_CORE_UTILS}/starwind`,
      );
    }

    await fs.ensureDir(path.dirname(destinationPath));
    await fs.copy(sourcePath, destinationPath, { overwrite: true });
  }
}

/**
 * Copies a component from the core package to the local components directory
 * @param name - The name of the component to copy
 * @param overwrite - If true, will overwrite existing component instead of skipping
 * @param options - Optional overrides used internally for testing
 * @returns A result object indicating the installation status
 */
export async function copyComponent(
  name: string,
  overwrite = false,
  options?: CopyComponentOptions,
): Promise<InstallResult> {
  const config = await getConfig();

  // Ensure components array exists
  const currentComponents = Array.isArray(config.components) ? config.components : [];

  try {
    const registry = await getRegistry();
    const componentInfo = registry.find((component) => component.name === name);
    if (!componentInfo) {
      throw new Error(`Component ${name} not found in registry`);
    }

    const fileDependencies = componentInfo.fileDependencies ?? [];

    const resolvePackageUrl =
      options?.resolvePackageUrl ?? ((specifier: string) => import.meta.resolve?.(specifier));

    // Get the path to the installed @starwind/core package
    const pkgUrl = resolvePackageUrl(PATHS.STARWIND_CORE);
    if (!pkgUrl) {
      throw new Error(`Could not resolve ${PATHS.STARWIND_CORE} package, is it installed?`);
    }

    const coreDir = path.dirname(fileURLToPath(pkgUrl));

    // Check if component already exists
    if (!overwrite && currentComponents.some((component) => component.name === name)) {
      await copyFileDependencies({
        coreDir,
        fileDependencies,
        utilsDir: config.utilsDir || PATHS.LOCAL_UTILS_DIR,
      });

      const existingComponent = currentComponents.find((c) => c.name === name);
      return {
        status: "skipped",
        name,
        version: existingComponent?.version ?? "unknown",
      };
    }

    const componentDir = path.join(config.componentDir, "starwind", name);
    await fs.ensureDir(componentDir);

    const sourceDir = path.join(coreDir, PATHS.STARWIND_CORE_COMPONENTS, name);

    const files = await fs.readdir(sourceDir);

    for (const file of files) {
      const sourcePath = path.join(sourceDir, file);
      const destPath = path.join(componentDir, file);
      await fs.copy(sourcePath, destPath, { overwrite: true });
    }

    await copyFileDependencies({
      coreDir,
      fileDependencies,
      utilsDir: config.utilsDir || PATHS.LOCAL_UTILS_DIR,
    });

    return {
      status: "installed",
      name,
      version: componentInfo.version,
    };
  } catch (error) {
    return {
      status: "failed",
      name,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

/**
 * Removes a component from the project's component directory
 * @param name - The name of the component to remove
 * @param componentDir - The base directory where components are installed
 * @returns A result object indicating the removal status and any errors
 */
export async function removeComponent(name: string, componentDir: string): Promise<RemoveResult> {
  try {
    const componentPath = path.join(componentDir, "starwind", name);

    // Check if component directory exists
    if (await fs.pathExists(componentPath)) {
      // Remove the component directory
      await fs.remove(componentPath);
      return { name, status: "removed" };
    } else {
      return {
        name,
        status: "failed",
        error: "Component directory not found",
      };
    }
  } catch (error) {
    return {
      name,
      status: "failed",
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

/**
 * Updates a component to its latest version from the registry
 * @param name - The name of the component to update
 * @param currentVersion - The currently installed version
 * @param skipConfirm - If true, skips the confirmation prompt
 * @returns A result object indicating the update status
 */
export async function updateComponent(
  name: string,
  currentVersion: string,
  skipConfirm?: boolean,
): Promise<UpdateResult> {
  try {
    // Get latest version from registry
    const registryComponent = await getComponent(name);
    if (!registryComponent) {
      return {
        name,
        status: "failed",
        error: "Component not found in registry",
      };
    }

    // Compare versions
    if (!semver.gt(registryComponent.version, currentVersion)) {
      return {
        name,
        status: "skipped",
        oldVersion: currentVersion,
        newVersion: registryComponent.version,
      };
    }

    // Confirm the component update with warning about overriding, unless skipConfirm is true
    let confirmUpdate = true; // Default to true if skipping confirmation
    if (!skipConfirm) {
      // Only prompt if skipConfirm is false or undefined
      const confirmedResult = await p.confirm({
        message: `Update component ${highlighter.info(
          name,
        )} from ${highlighter.warn(`v${currentVersion}`)} to ${highlighter.success(
          `v${registryComponent.version}`,
        )}? This will override the existing implementation.`,
      });

      // Check for cancellation immediately
      if (p.isCancel(confirmedResult)) {
        p.cancel("Update cancelled.");
        return {
          name,
          status: "skipped",
          oldVersion: currentVersion,
          newVersion: registryComponent.version, // Still useful to return the target version
        };
      }

      // If not cancelled, confirmedResult is boolean. Assign it.
      confirmUpdate = confirmedResult;
    }

    // Now confirmUpdate is guaranteed to be boolean, proceed with the check
    if (!confirmUpdate) {
      // Handle non-confirmation ('No' was selected)
      p.log.info(`Skipping update for ${highlighter.info(name)}`);
      return {
        name,
        status: "skipped",
        oldVersion: currentVersion,
        newVersion: registryComponent.version,
      };
    }

    // Remove and reinstall component with overwrite enabled
    const result = await copyComponent(name, true);

    if (result.status === "installed") {
      return {
        name,
        status: "updated",
        oldVersion: currentVersion,
        newVersion: result.version,
      };
    } else {
      return {
        name,
        status: "failed",
        error: result.status === "failed" ? result.error : "Failed to update component",
      };
    }
  } catch (error) {
    return {
      name,
      status: "failed",
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}
