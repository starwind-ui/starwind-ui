import { type RemoveResult, removeComponent } from "@/utils/component.js";
import { getConfig, updateConfig } from "@/utils/config.js";
import { PATHS } from "@/utils/constants.js";
import { fileExists } from "@/utils/fs.js";
import { highlighter } from "@/utils/highlighter.js";
import { sleep } from "@/utils/sleep.js";
import * as p from "@clack/prompts";

export async function remove(components?: string[], options?: { all?: boolean }) {
	try {
		p.intro(highlighter.title(" Welcome to the Starwind CLI "));

		// Check if starwind.config.json exists
		const configExists = await fileExists(PATHS.LOCAL_CONFIG_FILE);

		if (!configExists) {
			p.log.error("No Starwind configuration found. Please run starwind init first.");
			process.exit(1);
		}

		// Get current config and installed components
		const config = await getConfig();
		const installedComponents = config.components;

		if (installedComponents.length === 0) {
			p.log.warn("No components are currently installed.");
			process.exit(0);
		}

		let componentsToRemove: string[] = [];

		// ================================================================
		//                     Get components to remove
		// ================================================================
		if (options?.all) {
			// Remove all installed components
			componentsToRemove = installedComponents.map((comp) => comp.name);
			p.log.info(`Removing all ${componentsToRemove.length} installed components...`);
		} else if (components && components.length > 0) {
			// Validate that all specified components are installed
			const invalid = components.filter(
				(comp) => !installedComponents.some((ic) => ic.name === comp),
			);

			if (invalid.length > 0) {
				p.log.warn(
					`${highlighter.warn("Components not found:")}\n${invalid
						.map((name) => `  ${name}`)
						.join("\n")}`,
				);
			}

			componentsToRemove = components.filter((comp) =>
				installedComponents.some((ic) => ic.name === comp),
			);

			if (componentsToRemove.length === 0) {
				p.log.warn("No valid components to remove");
				process.exit(0);
			}
		} else {
			// Show interactive prompt with installed components
			const choices = installedComponents.map((comp) => ({
				value: comp.name,
				label: comp.name,
			}));

			const selected = await p.multiselect({
				message: "Select components to remove",
				options: choices,
			});

			if (p.isCancel(selected)) {
				p.cancel("Operation cancelled");
				process.exit(0);
			}

			componentsToRemove = selected as string[];
		}

		if (componentsToRemove.length === 0) {
			p.log.warn("No components selected for removal");
			process.exit(0);
		}

		// Confirm removal
		const confirmed = await p.confirm({
			message: `Remove ${componentsToRemove
				.map((comp) => highlighter.info(comp))
				.join(", ")} ${componentsToRemove.length > 1 ? "components" : "component"}?`,
		});

		if (!confirmed || p.isCancel(confirmed)) {
			p.cancel("Operation cancelled");
			process.exit(0);
		}

		const results = {
			removed: [] as RemoveResult[],
			failed: [] as RemoveResult[],
		};

		// ================================================================
		//                     Remove Components
		// ================================================================
		for (const comp of componentsToRemove) {
			const result = await removeComponent(comp, config.componentDir);
			if (result.status === "removed") {
				results.removed.push(result);
			} else {
				results.failed.push(result);
			}
		}

		// ================================================================
		//                     Update Config File
		// ================================================================
		// Update config file by writing the filtered components directly
		const updatedComponents = config.components.filter(
			(comp) => !componentsToRemove.includes(comp.name),
		);
		await updateConfig(
			{
				...config,
				components: updatedComponents,
			},
			{ appendComponents: false },
		);

		// ================================================================
		//                     Removal summary
		// ================================================================
		p.log.message(`\n\n${highlighter.underline("Removal Summary")}`);

		if (results.failed.length > 0) {
			p.log.error(
				`${highlighter.error("Failed to remove components:")}\n${results.failed
					.map((r) => `  ${r.name} - ${r.error}`)
					.join("\n")}`,
			);
		}

		if (results.removed.length > 0) {
			p.log.success(
				`${highlighter.success("Successfully removed components:")}\n${results.removed
					.map((r) => `  ${r.name}`)
					.join("\n")}`,
			);
		}

		await sleep(1000);

		if (results.removed.length > 0) {
			p.outro("Components removed successfully 🗑️");
		} else {
			p.cancel("Errors occurred while removing components");
			process.exit(1);
		}
	} catch (error) {
		p.log.error(error instanceof Error ? error.message : "Failed to remove components");
		p.cancel("Operation cancelled");
		process.exit(1);
	}
}
