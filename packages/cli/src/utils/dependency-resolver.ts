import semver from "semver";

import { getConfig } from "./config.js";
import { readJsonFile } from "./fs.js";
import { getComponent } from "./registry.js";

/**
 * Checks if npm dependencies are already installed with valid versions
 * @param dependencies - Array of dependency strings (e.g., ["react@^18.0.0", "typescript@^5.0.0"])
 * @returns Array of dependencies that need to be installed
 */
export async function filterUninstalledDependencies(dependencies: string[]): Promise<string[]> {
  try {
    const pkg = await readJsonFile("package.json");
    const installedDeps = { ...pkg.dependencies, ...pkg.devDependencies };

    const dependenciesToInstall: string[] = [];

    for (const dep of dependencies) {
      const [packageName, requiredVersion] =
        dep.includes("@") && !dep.startsWith("@") ? dep.split("@") : [dep, "*"];

      const installedVersion = installedDeps[packageName];

      if (!installedVersion) {
        // Package not installed, needs installation
        dependenciesToInstall.push(dep);
      } else if (requiredVersion && requiredVersion !== "*") {
        // Check if installed version satisfies required version
        const cleanInstalledVersion = installedVersion.replace(/^\^|~/, "");
        try {
          if (!semver.satisfies(cleanInstalledVersion, requiredVersion)) {
            dependenciesToInstall.push(dep);
          }
        } catch (error) {
          // If semver comparison fails, assume we need to install
          dependenciesToInstall.push(dep);
        }
      }
      // If no version specified or version satisfies, skip installation
    }

    return dependenciesToInstall;
  } catch (error) {
    // If we can't read package.json, install all dependencies
    return dependencies;
  }
}

export interface StarwindDependency {
  name: string;
  version: string;
  originalSpec: string;
}

export interface DependencyResolution {
  component: string;
  currentVersion?: string;
  requiredVersion: string;
  needsInstall: boolean;
  needsUpdate: boolean;
  isStarwindComponent: boolean;
}

/**
 * Parses a Starwind component dependency string
 * @param dependency - Dependency string like "@starwind-ui/core/button@^2.1.0"
 * @returns Parsed dependency object or null if not a Starwind component
 */
export function parseStarwindDependency(dependency: string): StarwindDependency | null {
  const starwindPattern = /^@starwind-ui\/core\/([^@]+)@(.+)$/;
  const match = dependency.match(starwindPattern);

  if (!match) {
    return null;
  }

  const [, name, version] = match;
  return {
    name,
    version,
    originalSpec: dependency,
  };
}

/**
 * Checks if a dependency is a Starwind component dependency
 * @param dependency - Dependency string to check
 * @returns True if it's a Starwind component dependency
 */
export function isStarwindDependency(dependency: string): boolean {
  return parseStarwindDependency(dependency) !== null;
}

/**
 * Gets the currently installed version of a Starwind component
 * @param componentName - Name of the component to check
 * @returns Version string if installed, undefined if not installed
 */
export async function getInstalledComponentVersion(
  componentName: string,
): Promise<string | undefined> {
  try {
    const config = await getConfig();
    const installedComponent = config.components.find((comp) => comp.name === componentName);
    return installedComponent?.version;
  } catch {
    return undefined;
  }
}

/**
 * Resolves a single Starwind component dependency
 * @param dependency - Dependency string to resolve
 * @returns Resolution information for the dependency
 */
export async function resolveStarwindDependency(
  dependency: string,
): Promise<DependencyResolution | null> {
  const parsed = parseStarwindDependency(dependency);

  if (!parsed) {
    return {
      component: dependency,
      requiredVersion: "",
      needsInstall: false,
      needsUpdate: false,
      isStarwindComponent: false,
    };
  }

  const currentVersion = await getInstalledComponentVersion(parsed.name);
  const registryComponent = await getComponent(parsed.name);

  if (!registryComponent) {
    throw new Error(`Starwind component "${parsed.name}" not found in registry`);
  }

  let needsInstall = false;
  let needsUpdate = false;

  if (!currentVersion) {
    // Component not installed
    needsInstall = true;
  } else {
    // Component is installed, check if version satisfies requirement
    if (!semver.satisfies(currentVersion, parsed.version)) {
      // Current version doesn't satisfy requirement
      // Check if registry version satisfies requirement
      if (semver.satisfies(registryComponent.version, parsed.version)) {
        needsUpdate = true;
      } else {
        throw new Error(
          `No version of "${parsed.name}" satisfies requirement "${parsed.version}". ` +
            `Latest available: ${registryComponent.version}, currently installed: ${currentVersion}`,
        );
      }
    }
  }

  return {
    component: parsed.name,
    currentVersion,
    requiredVersion: parsed.version,
    needsInstall,
    needsUpdate,
    isStarwindComponent: true,
  };
}

/**
 * Recursively resolves all Starwind component dependencies
 * @param componentNames - Array of component names to resolve dependencies for
 * @param resolved - Set of already resolved components to avoid circular dependencies
 * @returns Array of dependency resolutions
 */
export async function resolveAllStarwindDependencies(
  componentNames: string[],
  resolved: Set<string> = new Set(),
): Promise<DependencyResolution[]> {
  const resolutions: DependencyResolution[] = [];

  for (const componentName of componentNames) {
    if (resolved.has(componentName)) {
      continue;
    }

    resolved.add(componentName);

    const component = await getComponent(componentName);
    if (!component) {
      throw new Error(`Component "${componentName}" not found in registry`);
    }

    // Process dependencies of this component
    for (const dependency of component.dependencies) {
      const resolution = await resolveStarwindDependency(dependency);

      if (resolution && resolution.isStarwindComponent) {
        // Add this dependency to resolutions if it needs action
        if (resolution.needsInstall || resolution.needsUpdate) {
          resolutions.push(resolution);
        }

        // Recursively resolve dependencies of this dependency
        const nestedResolutions = await resolveAllStarwindDependencies(
          [resolution.component],
          resolved,
        );
        resolutions.push(...nestedResolutions);
      }
    }
  }

  // Remove duplicates and prioritize installs over updates
  const uniqueResolutions = new Map<string, DependencyResolution>();

  for (const resolution of resolutions) {
    const existing = uniqueResolutions.get(resolution.component);

    if (!existing) {
      uniqueResolutions.set(resolution.component, resolution);
    } else {
      // If we have both install and update for same component, prioritize install
      if (resolution.needsInstall && !existing.needsInstall) {
        uniqueResolutions.set(resolution.component, resolution);
      }
    }
  }

  return Array.from(uniqueResolutions.values());
}

/**
 * Separates regular npm dependencies from Starwind component dependencies
 * @param dependencies - Array of dependency strings
 * @returns Object with separated dependencies
 */
export function separateDependencies(dependencies: string[]): {
  starwindDependencies: string[];
  npmDependencies: string[];
} {
  const starwindDependencies: string[] = [];
  const npmDependencies: string[] = [];

  for (const dependency of dependencies) {
    if (isStarwindDependency(dependency)) {
      starwindDependencies.push(dependency);
    } else {
      npmDependencies.push(dependency);
    }
  }

  return { starwindDependencies, npmDependencies };
}
