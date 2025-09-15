import { confirm, multiselect } from "@clack/prompts";

import {
  type DependencyResolution,
  filterUninstalledDependencies,
  resolveAllStarwindDependencies,
  separateDependencies,
} from "./dependency-resolver.js";
import { highlighter } from "./highlighter.js";
import type { Component } from "./registry.js";
import { getAllComponents } from "./registry.js";

export async function selectComponents(): Promise<string[]> {
  const components = await getAllComponents();

  const selected = await multiselect({
    message: "Select components to add",
    options: components.map((component) => ({
      label: component.name,
      value: component.name,
    })),
    required: false,
  });

  // Return empty array if user cancels selection
  if (typeof selected === "symbol") {
    return [];
  }

  return selected;
}

/**
 * Confirms installation of Starwind component dependencies
 * @param componentNames - Array of component names to check dependencies for
 * @returns Promise<boolean> - true if user confirms, false otherwise
 */
export async function confirmStarwindDependencies(componentNames: string[]): Promise<boolean> {
  try {
    const resolutions = await resolveAllStarwindDependencies(componentNames);

    if (resolutions.length === 0) {
      return true; // No Starwind dependencies to handle
    }

    const toInstall = resolutions.filter((r) => r.needsInstall);
    const toUpdate = resolutions.filter((r) => r.needsUpdate);

    let message = "This component has Starwind component dependencies:\n\n";

    if (toInstall.length > 0) {
      message += `${highlighter.info("Components to install:")}\n`;
      for (const dep of toInstall) {
        message += `  • ${dep.component} (requires ${dep.requiredVersion})\n`;
      }
      message += "\n";
    }

    if (toUpdate.length > 0) {
      message += `${highlighter.warn("Components to update:")}\n`;
      for (const dep of toUpdate) {
        message += `  • ${dep.component} (${dep.currentVersion} → latest, requires ${dep.requiredVersion})\n`;
      }
      message += "\n";
    }

    message += "Proceed with installation?";

    const confirmed = await confirm({ message });

    if (typeof confirmed === "symbol") {
      return false;
    }

    return confirmed;
  } catch (error) {
    console.error("Error resolving Starwind dependencies:", error);
    const confirmed = await confirm({
      message: `Error resolving dependencies: ${error instanceof Error ? error.message : "Unknown error"}. Continue anyway?`,
    });

    if (typeof confirmed === "symbol") {
      return false;
    }

    return confirmed;
  }
}

/**
 * Gets the dependency resolutions for given component names
 * @param componentNames - Array of component names to resolve dependencies for
 * @returns Promise<DependencyResolution[]> - Array of dependency resolutions
 */
export async function getStarwindDependencyResolutions(
  componentNames: string[],
): Promise<DependencyResolution[]> {
  return resolveAllStarwindDependencies(componentNames);
}

export async function confirmInstall(component: Component): Promise<boolean> {
  if (component.dependencies.length === 0) return true;

  const { starwindDependencies, npmDependencies } = separateDependencies(component.dependencies);

  // Handle npm dependencies - only prompt for dependencies that need to be installed
  if (npmDependencies.length > 0) {
    const dependenciesToInstall = await filterUninstalledDependencies(npmDependencies);

    if (dependenciesToInstall.length > 0) {
      const confirmed = await confirm({
        message: `This component requires the following npm dependencies: ${dependenciesToInstall.join(", ")}. Install them?`,
      });

      if (typeof confirmed === "symbol" || !confirmed) {
        return false;
      }
    }
  }

  // Handle Starwind component dependencies
  if (starwindDependencies.length > 0) {
    const confirmed = await confirmStarwindDependencies([component.name]);
    if (!confirmed) {
      return false;
    }
  }

  return true;
}
