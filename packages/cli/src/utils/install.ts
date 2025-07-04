import { copyComponent, type InstallResult } from "./component.js";
import { installDependencies, requestPackageManager } from "./package-manager.js";
import { confirmInstall } from "./prompts.js";
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

    try {
      const pm = await requestPackageManager();
      await installDependencies(component.dependencies, pm);
    } catch (error) {
      return {
        status: "failed",
        name,
        error: `Failed to install dependencies: ${error instanceof Error ? error.message : String(error)}`,
      };
    }
  }

  // Copy the component files
  return await copyComponent(name);
}
