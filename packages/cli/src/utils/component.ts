import * as path from "node:path";
import { fileURLToPath } from "node:url";

import * as p from "@clack/prompts";
import fs from "fs-extra";
import semver from "semver";

import { getConfig } from "./config.js";
import { PATHS } from "./constants.js";
import { highlighter } from "./highlighter.js";
import { getComponent, getRegistry } from "./registry.js";

export type InstallResult = {
  status: "installed" | "skipped" | "failed";
  name: string;
  version?: string;
  error?: string;
};

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

/**
 * Copies a component from the core package to the local components directory
 * @param name - The name of the component to copy
 * @param overwrite - If true, will overwrite existing component instead of skipping
 * @returns A result object indicating the installation status
 */
export async function copyComponent(name: string, overwrite = false): Promise<InstallResult> {
  const config = await getConfig();

  // Ensure components array exists
  const currentComponents = Array.isArray(config.components) ? config.components : [];

  // Check if component already exists
  if (!overwrite && currentComponents.some((component) => component.name === name)) {
    const existingComponent = currentComponents.find((c) => c.name === name);
    return {
      status: "skipped",
      name,
      version: existingComponent?.version,
    };
  }

  const componentDir = path.join(config.componentDir, "starwind", name);

  try {
    await fs.ensureDir(componentDir);

    // Get the path to the installed @starwind/core package
    const pkgUrl = import.meta.resolve?.(PATHS.STARWIND_CORE);
    if (!pkgUrl) {
      throw new Error(`Could not resolve ${PATHS.STARWIND_CORE} package, is it installed?`);
    }

    const coreDir = path.dirname(fileURLToPath(pkgUrl));
    const sourceDir = path.join(coreDir, PATHS.STARWIND_CORE_COMPONENTS, name);

    const files = await fs.readdir(sourceDir);

    for (const file of files) {
      const sourcePath = path.join(sourceDir, file);
      const destPath = path.join(componentDir, file);
      await fs.copy(sourcePath, destPath, { overwrite: true });
    }

    // Get component version from registry
    const registry = await getRegistry();
    const componentInfo = registry.find((c) => c.name === name);
    if (!componentInfo) {
      throw new Error(`Component ${name} not found in registry`);
    }

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
        error: result.error || "Failed to update component",
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
