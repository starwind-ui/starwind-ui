import * as p from "@clack/prompts";
import { execa } from "execa";

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
