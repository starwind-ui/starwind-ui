import semver from "semver";

import { readJsonFile } from "./fs.js";

/**
 * Checks if npm dependencies are already installed with valid versions.
 */
export async function filterUninstalledDependencies(dependencies: string[]): Promise<string[]> {
  try {
    const pkg = await readJsonFile("package.json");
    const installedDeps = { ...(pkg.dependencies || {}), ...(pkg.devDependencies || {}) };

    const dependenciesToInstall: string[] = [];

    for (const dep of dependencies) {
      let packageName: string;
      let requiredVersion: string;

      if (dep.startsWith("@")) {
        const lastAtIndex = dep.lastIndexOf("@");
        if (lastAtIndex > 0) {
          packageName = dep.substring(0, lastAtIndex);
          requiredVersion = dep.substring(lastAtIndex + 1);
        } else {
          packageName = dep;
          requiredVersion = "*";
        }
      } else {
        const atIndex = dep.indexOf("@");
        if (atIndex > 0) {
          packageName = dep.substring(0, atIndex);
          requiredVersion = dep.substring(atIndex + 1);
        } else {
          packageName = dep;
          requiredVersion = "*";
        }
      }

      const installedVersion = installedDeps[packageName];

      if (!installedVersion) {
        dependenciesToInstall.push(dep);
      } else if (isLocalDependencySpec(installedVersion)) {
        continue;
      } else if (requiredVersion && requiredVersion !== "*") {
        const cleanInstalledVersion =
          semver.clean(installedVersion) || installedVersion.replace(/^[\^~>=<= ]+/, "");

        try {
          if (!semver.satisfies(cleanInstalledVersion, requiredVersion)) {
            dependenciesToInstall.push(dep);
          }
        } catch {
          dependenciesToInstall.push(dep);
        }
      }
    }

    return dependenciesToInstall;
  } catch {
    return dependencies;
  }
}

function isLocalDependencySpec(version: string): boolean {
  return /^(file|link|portal|workspace):/i.test(version);
}
