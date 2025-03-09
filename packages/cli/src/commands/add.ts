import type { InstallResult } from "@/utils/component.js";
import { updateConfig } from "@/utils/config.js";
import { PATHS } from "@/utils/constants.js";
import { fileExists } from "@/utils/fs.js";
import { highlighter } from "@/utils/highlighter.js";
import { installComponent } from "@/utils/install.js";
import { selectComponents } from "@/utils/prompts.js";
import { getAllComponents } from "@/utils/registry.js";
import { sleep } from "@/utils/sleep.js";
import { isValidComponent } from "@/utils/validate.js";
import * as p from "@clack/prompts";
const { init } = await import("./init.js");

export async function add(components?: string[], options?: { all?: boolean }) {
	try {
		p.intro(highlighter.title(" Welcome to the Starwind CLI "));

		// Check if starwind.config.json exists
		const configExists = await fileExists(PATHS.LOCAL_CONFIG_FILE);

		if (!configExists) {
			const shouldInit = await p.confirm({
				message: `Starwind configuration not found. Would you like to run ${highlighter.info("starwind init")} now?`,
				initialValue: true,
			});

			if (p.isCancel(shouldInit)) {
				p.cancel("Operation cancelled");
				process.exit(0);
			}

			if (shouldInit) {
				await init(true);
			} else {
				p.log.error(
					`Please initialize starwind with ${highlighter.info("starwind init")} before adding components`,
				);
				process.exit(1);
			}
		}

		let componentsToInstall: string[] = [];

		// ================================================================
		//                  Get components to install
		// ================================================================
		if (options?.all) {
			// Get all available components
			const availableComponents = await getAllComponents();
			componentsToInstall = availableComponents.map((c) => c.name);
			p.log.info(`Adding all ${componentsToInstall.length} available components...`);
		} else if (components && components.length > 0) {
			// Get all available components once to avoid multiple registry calls
			const availableComponents = await getAllComponents();

			// Filter valid components and collect invalid ones
			const { valid, invalid } = await components.reduce<
				Promise<{ valid: string[]; invalid: string[] }>
			>(
				async (accPromise, component) => {
					const acc = await accPromise;
					const isValid = await isValidComponent(component, availableComponents);
					if (isValid) {
						acc.valid.push(component);
					} else {
						acc.invalid.push(component);
					}
					return acc;
				},
				Promise.resolve({ valid: [], invalid: [] }),
			);

			// Warn about invalid components
			if (invalid.length > 0) {
				p.log.warn(
					`${highlighter.warn("Invalid components found:")}\n${invalid
						.map((name) => `  ${name}`)
						.join("\n")}`,
				);
			}

			// Proceed with valid components
			if (valid.length > 0) {
				componentsToInstall = valid;
			} else {
				p.log.warn(`${highlighter.warn("No valid components to install")}`);
				p.cancel("Operation cancelled");
				return process.exit(0);
			}
		} else {
			// If no components provided, show the interactive prompt
			const selected = await selectComponents();
			if (!selected) {
				p.cancel("No components selected");
				return process.exit(0);
			}
			componentsToInstall = selected;
		}

		if (componentsToInstall.length === 0) {
			p.log.warn(`${highlighter.warn("No components selected")}`);
			p.cancel("Operation cancelled");
			return process.exit(0);
		}

		// confirm installation
		// const confirmed = await p.confirm({
		// 	message: `Install ${componentsToInstall
		// 		.map((comp) => highlighter.info(comp))
		// 		.join(", ")} ${componentsToInstall.length > 1 ? "components" : "component"}?`,
		// });

		// if (!confirmed || p.isCancel(confirmed)) {
		// 	p.cancel("Operation cancelled");
		// 	return process.exit(0);
		// }

		const results = {
			installed: [] as InstallResult[],
			skipped: [] as InstallResult[],
			failed: [] as InstallResult[],
		};

		// ================================================================
		//                      Install components
		// ================================================================
		const installedComponents = [];
		for (const comp of componentsToInstall) {
			const result = await installComponent(comp);
			switch (result.status) {
				case "installed":
					results.installed.push(result);
					installedComponents.push({ name: result.name, version: result.version! });
					break;
				case "skipped":
					results.skipped.push(result);
					break;
				case "failed":
					results.failed.push(result);
					break;
			}
		}

		// ================================================================
		//                     Update Config File
		// ================================================================
		if (installedComponents.length > 0) {
			try {
				await updateConfig({ components: installedComponents }, { appendComponents: true });
			} catch (error) {
				p.log.error(
					`Failed to update config: ${error instanceof Error ? error.message : "Unknown error"}`,
				);
				process.exit(1);
			}
		}

		// ================================================================
		//                     Installation summary
		// ================================================================
		p.log.message(`\n\n${highlighter.underline("Installation Summary")}`);

		if (results.installed.length > 0) {
			p.log.success(
				`${highlighter.success("Successfully installed components:")}\n${results.installed
					.map((r) => `  ${r.name} v${r.version}`)
					.join("\n")}`,
			);
		}

		if (results.skipped.length > 0) {
			p.log.warn(
				`${highlighter.warn("Skipped components (already installed):")}\n${results.skipped
					.map((r) => `  ${r.name} v${r.version}`)
					.join("\n")}`,
			);
		}

		if (results.failed.length > 0) {
			p.log.error(
				`${highlighter.error("Failed to install components:")}\n${results.failed
					.map((r) => `  ${r.name} - ${r.error}`)
					.join("\n")}`,
			);
		}

		await sleep(1000);

		p.outro("Enjoy using Starwind UI 🚀");
	} catch (error) {
		p.log.error(error instanceof Error ? error.message : "Failed to add components");
		p.cancel("Operation cancelled");
		process.exit(1);
	}
}
