import * as p from "@clack/prompts";

import { copyComponent, type InstallResult } from "./component.js";
import { getConfig, updateConfig } from "./config.js";
import {
  type DependencyResolution,
  filterUninstalledDependencies,
  separateDependencies,
} from "./dependency-resolver.js";
import { highlighter } from "./highlighter.js";
import { installDependencies, requestPackageManager } from "./package-manager.js";
import { confirmInstall, getStarwindDependencyResolutions } from "./prompts.js";
import { getComponent } from "./registry.js";

export async function installComponent(name: string): Promise<InstallResult> {
  const component = await getComponent(name);

  if (!component) {
    return {
      status: "failed",
      name,
      error: "Component not found in registry",
    };
  }

  // Initialize dependency results
  let dependencyResults: InstallResult[] = [];

  // Handle dependencies installation
  if (component.dependencies.length > 0) {
    const confirmed = await confirmInstall(component);
    if (!confirmed) {
      return {
        status: "failed",
        name,
        error: "Installation cancelled by user",
      };
    }

    const { starwindDependencies, npmDependencies } = separateDependencies(component.dependencies);

    // Install npm dependencies
    if (npmDependencies.length > 0) {
      try {
        // Filter out already installed dependencies with valid versions
        const dependenciesToInstall = await filterUninstalledDependencies(npmDependencies);

        if (dependenciesToInstall.length > 0) {
          const pm = await requestPackageManager();

          const installTasks = [
            {
              title: `Installing ${dependenciesToInstall.length === 1 ? "dependency" : "dependencies"}`,
              task: async () => {
                await installDependencies(dependenciesToInstall, pm);
                return `${highlighter.info("Dependencies installed successfully")}`;
              },
            },
          ];

          await p.tasks(installTasks);
        } else {
          // All dependencies are already installed with valid versions
          p.log.info(
            `${highlighter.info("All npm dependencies are already installed with valid versions")}`,
          );
        }
      } catch (error) {
        return {
          status: "failed",
          name,
          error: `Failed to install npm dependencies: ${error instanceof Error ? error.message : String(error)}`,
        };
      }
    }

    // Install Starwind component dependencies
    if (starwindDependencies.length > 0) {
      let resolutions: DependencyResolution[] = [];
      try {
        resolutions = await getStarwindDependencyResolutions([name]);
      } catch (error) {
        console.warn(
          "Proceeding without Starwind dependency installs due to resolution error:",
          error,
        );
        resolutions = [];
      }

      if (resolutions.length > 0) {
        const installResults = await installStarwindDependencies(resolutions);
        dependencyResults = installResults;

        // Check if any dependency installation failed
        const failedDeps = installResults.filter((r: InstallResult) => r.status === "failed");
        if (failedDeps.length > 0) {
          return {
            status: "failed",
            name,
            error: `Failed to install Starwind dependencies: ${failedDeps.map((r: InstallResult) => r.name).join(", ")}`,
            dependencyResults,
          };
        }
      }
    }
  }

  // Copy the component files
  const result = await copyComponent(name);

  // Include dependency results if any
  if (dependencyResults.length > 0) {
    return {
      ...result,
      dependencyResults,
    };
  }

  return result;
}

/**
 * Installs Starwind component dependencies based on dependency resolutions
 * @param resolutions - Array of dependency resolutions
 * @returns Promise<InstallResult[]> - Array of installation results
 */
export async function installStarwindDependencies(
  resolutions: DependencyResolution[],
): Promise<InstallResult[]> {
  const results: InstallResult[] = [];
  const componentsToInstall: Array<{ name: string; version: string }> = [];
  const componentsToUpdate: Array<{ name: string; version: string }> = [];

  for (const resolution of resolutions) {
    if (resolution.needsInstall) {
      // Install the component
      const result = await copyComponent(resolution.component);
      results.push(result);

      if (result.status === "installed" && result.version) {
        componentsToInstall.push({ name: result.name, version: result.version });
      }
    } else if (resolution.needsUpdate) {
      // Update the component
      const result = await copyComponent(resolution.component, true); // overwrite = true
      results.push(result);

      if (result.status === "installed" && result.version) {
        componentsToUpdate.push({ name: result.name, version: result.version });
      }
    }
  }

  // Update config with newly installed components (append)
  if (componentsToInstall.length > 0) {
    try {
      await updateConfig({ components: componentsToInstall }, { appendComponents: true });
    } catch (error) {
      console.error("Failed to update config after installing new dependencies:", error);
    }
  }

  // Update config with updated components (replace existing entries)
  if (componentsToUpdate.length > 0) {
    try {
      await updateExistingComponents(componentsToUpdate);
    } catch (error) {
      console.error("Failed to update config after updating dependencies:", error);
    }
  }

  return results;
}

/**
 * Updates existing components in the config by replacing their versions
 * @param componentsToUpdate - Array of components with their new versions
 */
async function updateExistingComponents(
  componentsToUpdate: Array<{ name: string; version: string }>,
): Promise<void> {
  const config = await getConfig();
  const updatedComponents = [...config.components];

  // Update existing components or add new ones
  for (const componentUpdate of componentsToUpdate) {
    const existingIndex = updatedComponents.findIndex((comp) => comp.name === componentUpdate.name);

    if (existingIndex >= 0) {
      // Update existing component version
      updatedComponents[existingIndex] = {
        name: componentUpdate.name,
        version: componentUpdate.version,
      };
    } else {
      // Add new component if not found (shouldn't happen in update case, but safety net)
      updatedComponents.push(componentUpdate);
    }
  }

  // Replace the entire components array
  await updateConfig({ components: updatedComponents }, { appendComponents: false });
}
