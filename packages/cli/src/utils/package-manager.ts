import { existsSync } from "node:fs";
import { resolve } from "node:path";

import * as p from "@clack/prompts";
import { execa } from "execa";

export type PackageManager = "npm" | "pnpm" | "yarn" | "bun";

/**
 * Configuration options for package manager detection
 */
export interface PackageManagerOptions {
  /** Root directory to check for lock files (defaults to process.cwd()) */
  cwd?: string;
  /** Default package manager to use if detection fails (defaults to 'npm') */
  defaultManager?: PackageManager;
}

/**
 * Contains information about the detected package manager
 */
export interface PackageManagerInfo {
  /** The name of the detected package manager */
  name: PackageManager;
  /** The command to use for installing packages */
  installCmd: string;
  /** The command to use for adding a package */
  addCmd: string;
  /** The command to use for removing a package */
  removeCmd: string;
  /** The command to use for running scripts */
  runCmd: string;
}

/**
 * Map of package managers to their lock files
 */
const LOCK_FILES: Record<PackageManager, string> = {
  npm: "package-lock.json",
  yarn: "yarn.lock",
  pnpm: "pnpm-lock.yaml",
  bun: "bun.lockb",
};

/**
 * Map of package managers to their command information
 */
const PACKAGE_MANAGER_COMMANDS: Record<PackageManager, Omit<PackageManagerInfo, "name">> = {
  npm: {
    installCmd: "npm install",
    addCmd: "npm install",
    removeCmd: "npm uninstall",
    runCmd: "npm run",
  },
  yarn: {
    installCmd: "yarn",
    addCmd: "yarn add",
    removeCmd: "yarn remove",
    runCmd: "yarn",
  },
  pnpm: {
    installCmd: "pnpm install",
    addCmd: "pnpm add",
    removeCmd: "pnpm remove",
    runCmd: "pnpm",
  },
  bun: {
    installCmd: "bun install",
    addCmd: "bun add",
    removeCmd: "bun remove",
    runCmd: "bun run",
  },
};

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
 * Detects the package manager used in the project by checking lock files
 *
 * @param options - Configuration options for detection
 * @returns Information about the detected package manager
 *
 * @example
 * ```ts
 * // Get the user's package manager with default options
 * const pm = detectPackageManager();
 * console.log(`Using ${pm.name} with install command: ${pm.installCmd}`);
 *
 * // Specify custom options
 * const pm2 = detectPackageManager({
 *   cwd: '/path/to/project',
 *   defaultManager: 'yarn',
 * });
 * ```
 */
export function detectPackageManager(options: PackageManagerOptions = {}): PackageManagerInfo {
  const { cwd = process.cwd(), defaultManager = "npm" } = options;

  // First try to detect from npm_config_user_agent
  const current = getCurrentPackageManager();
  if (current) {
    return {
      name: current,
      ...PACKAGE_MANAGER_COMMANDS[current],
    };
  }

  // Determine priorities for checking lock files
  const packageManagers: PackageManager[] = ["pnpm", "yarn", "bun", "npm"];

  // Check for each lock file
  for (const pm of packageManagers) {
    const lockFile = LOCK_FILES[pm];
    const lockFilePath = resolve(cwd, lockFile);

    if (existsSync(lockFilePath)) {
      return {
        name: pm,
        ...PACKAGE_MANAGER_COMMANDS[pm],
      };
    }
  }

  // Return the default package manager if no lock file is found
  return {
    name: defaultManager,
    ...PACKAGE_MANAGER_COMMANDS[defaultManager],
  };
}

/**
 * Detects and returns the default package manager based on lock files
 * @returns The detected package manager, defaults to npm if no lock file is found
 */
export async function getDefaultPackageManager(): Promise<PackageManager> {
  return detectPackageManager().name;
}

/**
 * Gets the command for the given package manager and action
 *
 * @param action - The action to perform ('install', 'add', 'remove', or 'run')
 * @param options - Package manager detection options
 * @returns The command string for the specified action
 */
export function getPackageManagerCommand(
  action: "install" | "add" | "remove" | "run",
  options: PackageManagerOptions = {},
): string {
  const pmInfo = detectPackageManager(options);

  switch (action) {
    case "install":
      return pmInfo.installCmd;
    case "add":
      return pmInfo.addCmd;
    case "remove":
      return pmInfo.removeCmd;
    case "run":
      return pmInfo.runCmd;
    default:
      throw new Error(`Unknown action: ${action}`);
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
