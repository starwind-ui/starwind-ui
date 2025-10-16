import * as p from "@clack/prompts";
import { execa } from "execa";

import { fileExists } from "./fs.js";

export type PackageManager = "npm" | "pnpm" | "yarn" | "bun";

/**
 * Prompts the user to select their preferred package manager
 * @returns The selected package manager, defaults to npm if cancelled
 */
export async function requestPackageManager(): Promise<PackageManager> {
  const pm = await p.select({
    message: "Select your preferred package manager",
    options: [
      { value: "pnpm", label: "pnpm", hint: "Default" },
      { value: "npm", label: "npm" },
      { value: "yarn", label: "yarn" },
      { value: "bun", label: "bun" },
    ],
  });

  if (p.isCancel(pm)) {
    p.log.warn("No package manager selected, defaulting to npm");
    return "npm";
  }

  return pm as PackageManager;
}

/**
 * Detects the currently running package manager from user agent
 * @returns The detected package manager, or null if not detected
 */
export function getCurrentPackageManager(): PackageManager | null {
  const userAgent = process.env.npm_config_user_agent;

  if (userAgent) {
    if (userAgent.includes("pnpm")) {
      return "pnpm";
    } else if (userAgent.includes("yarn")) {
      return "yarn";
    } else if (userAgent.includes("npm")) {
      return "npm";
    } else if (userAgent.includes("bun")) {
      return "bun";
    }
  }

  return null;
}

/**
 * Detects and returns the default package manager based on lock files
 * @returns The detected package manager, defaults to npm if no lock file is found
 */
export async function getDefaultPackageManager(): Promise<PackageManager> {
  // First try to detect the currently running package manager
  const current = getCurrentPackageManager();
  if (current) {
    return current;
  }

  // Fallback to lock file detection
  if (await fileExists("yarn.lock")) {
    return "yarn";
  } else if (await fileExists("pnpm-lock.yaml")) {
    return "pnpm";
  } else {
    return "npm";
  }
}

/**
 * Gets the appropriate command to run shadcn with the detected package manager
 * @returns The command array for execa
 */
export async function getShadcnCommand(): Promise<[string, string[]]> {
  const pm = await getDefaultPackageManager();

  switch (pm) {
    case "pnpm":
      return ["pnpm", ["dlx", "shadcn@3"]];
    case "yarn":
      return ["yarn", ["dlx", "shadcn@3"]];
    case "bun":
      return ["bunx", ["shadcn@3"]];
    case "npm":
    default:
      return ["npx", ["shadcn@3"]];
  }
}

/**
 * Installs the specified packages using the detected package manager
 * @param packages - Array of package names to install
 * @param pm - The package manager to use
 * @param dev - Whether to install as dev dependencies
 * @param force - Whether to force install packages
 */
export async function installDependencies(
  packages: string[],
  pm: PackageManager,
  dev = false,
  force = false,
): Promise<void> {
  const args = [
    pm === "npm" ? "install" : "add",
    ...packages,
    dev ? (pm === "npm" || pm === "pnpm" ? "-D" : "--dev") : "",
    force ? "--force" : "",
  ].filter(Boolean);

  await execa(pm, args);
}
