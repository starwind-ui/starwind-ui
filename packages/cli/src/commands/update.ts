import path from "node:path";
import { getConfig } from "@/utils/config.js";
import { PATHS } from "@/utils/constants.js";
import { fileExists, writeJsonFile } from "@/utils/fs.js";
import { highlighter } from "@/utils/highlighter.js";
import { sleep } from "@/utils/sleep.js";
import * as p from "@clack/prompts";
import { type UpdateResult, updateComponent } from "@/utils/component.js";
import { updateConfig } from "@/utils/config.js";

export async function update(components?: string[], options?: { all?: boolean }) {
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

		let componentsToUpdate: string[] = [];

		// ================================================================
		//                     Get components to update
		// ================================================================
		if (options?.all) {
			// Update all installed components
			componentsToUpdate = installedComponents.map((comp) => comp.name);
			p.log.info(`Checking updates for all ${componentsToUpdate.length} installed components...`);
		} else if (components && components.length > 0) {
			// Validate that all specified components are installed
			const invalid = components.filter(
				(comp) => !installedComponents.some((ic) => ic.name === comp),
			);

			if (invalid.length > 0) {
				p.log.warn(
					`${highlighter.warn("Components not found in project:")}\n${invalid
						.map((name) => `  ${name}`)
						.join("\n")}`,
				);
			}

			componentsToUpdate = components.filter((comp) =>
				installedComponents.some((ic) => ic.name === comp),
			);

			if (componentsToUpdate.length === 0) {
				p.log.warn("No valid components to update");
				process.exit(0);
			}
		} else {
			// Show interactive prompt with installed components
			const choices = installedComponents.map((comp) => ({
				value: comp.name,
				label: comp.name,
			}));

			const selected = await p.multiselect({
				message: "Select components to update",
				options: choices,
			});

			if (p.isCancel(selected)) {
				p.cancel("Operation cancelled");
				process.exit(0);
			}

			componentsToUpdate = selected as string[];
		}

		if (componentsToUpdate.length === 0) {
			p.log.warn("No components selected for update");
			process.exit(0);
		}

		// Confirm update
		const confirmed = await p.confirm({
			message: `Check for updates to ${componentsToUpdate
				.map((comp) => highlighter.info(comp))
				.join(", ")} ${componentsToUpdate.length > 1 ? "components" : "component"}?`,
		});

		if (!confirmed || p.isCancel(confirmed)) {
			p.cancel("Operation cancelled");
			process.exit(0);
		}

		const results = {
			updated: [] as UpdateResult[],
			skipped: [] as UpdateResult[],
			failed: [] as UpdateResult[],
		};

		// ================================================================
		//                     Update Components
		// ================================================================
		for (const comp of componentsToUpdate) {
			const currentVersion = installedComponents.find((ic) => ic.name === comp)?.version;
			if (!currentVersion) {
				results.failed.push({
					name: comp,
					status: "failed",
					error: "Could not determine current version",
				});
				continue;
			}

			const result = await updateComponent(comp, currentVersion);
			switch (result.status) {
				case "updated":
					results.updated.push(result);
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
		if (results.updated.length > 0) {
			try {
				// Create a map of current components, excluding updated ones
				const updatedComponentNames = new Set(results.updated.map((r) => r.name));
				const currentComponents = config.components.filter(
					(comp) => !updatedComponentNames.has(comp.name),
				);

				// Add the updated components with their new versions
				const updatedComponents = [
					...currentComponents,
					...results.updated.map((r) => ({
						name: r.name,
						version: r.newVersion!,
					})),
				];

				await updateConfig(
					{
						components: updatedComponents,
					},
					{ appendComponents: false },
				);
			} catch (error) {
				p.log.error(
					`Failed to update config: ${error instanceof Error ? error.message : "Unknown error"}`,
				);
				process.exit(1);
			}
		}

		// ================================================================
		//                     Update summary
		// ================================================================
		p.log.message(`\n\n${highlighter.underline("Update Summary")}`);

		if (results.skipped.length > 0) {
			p.log.info(
				`${highlighter.info("Components already up to date:")}\n${results.skipped
					.map((r) => `  ${r.name} (${r.newVersion})`)
					.join("\n")}`,
			);
		}

		if (results.updated.length > 0) {
			p.log.success(
				`${highlighter.success("Successfully updated components:")}\n${results.updated
					.map((r) => `  ${r.name} (${r.oldVersion} → ${r.newVersion})`)
					.join("\n")}`,
			);
		}

		if (results.failed.length > 0) {
			p.log.error(
				`${highlighter.error("Failed to update components:")}\n${results.failed
					.map((r) => `  ${r.name} - ${r.error}`)
					.join("\n")}`,
			);
		}

		await sleep(1000);

		if (results.updated.length > 0) {
			p.outro("Components updated successfully 🚀");
		} else if (results.skipped.length > 0 && results.failed.length === 0) {
			p.outro("All components are up to date ✨");
		} else {
			p.cancel("No components were updated");
			process.exit(1);
		}
	} catch (error) {
		p.log.error(error instanceof Error ? error.message : "Failed to update components");
		p.cancel("Operation cancelled");
		process.exit(1);
	}
}
