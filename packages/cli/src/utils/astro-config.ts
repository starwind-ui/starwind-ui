import { highlighter } from "@/utils/highlighter.js";
import * as p from "@clack/prompts";
import fs from "fs-extra";
import { fileExists } from "./fs.js";

const CONFIG_EXTENSIONS = ["ts", "js", "mjs", "cjs"] as const;
// type ConfigExtension = (typeof CONFIG_EXTENSIONS)[number];

/**
 * Finds the Astro config file in the current directory
 * @returns The path to the config file if found, null otherwise
 */
async function findAstroConfig(): Promise<string | null> {
	for (const ext of CONFIG_EXTENSIONS) {
		const configPath = `astro.config.${ext}`;
		if (await fileExists(configPath)) {
			return configPath;
		}
	}
	return null;
}

/**
 * Updates or creates the Astro configuration file
 * @returns true if successful, false otherwise
 */
export async function setupAstroConfig(): Promise<boolean> {
	try {
		let configPath = await findAstroConfig();
		let content = "";

		if (configPath) {
			content = await fs.readFile(configPath, "utf-8");
		} else {
			configPath = "astro.config.ts";
			content = `import { defineConfig } from "astro/config";\n\nexport default defineConfig({});\n`;
		}

		// Add tailwindcss import if not present
		if (!content.includes('import tailwindcss from "@tailwindcss/vite"')) {
			content = `import tailwindcss from "@tailwindcss/vite";\n${content}`;
		}

		// Parse the configuration object
		const configStart = content.indexOf("defineConfig(") + "defineConfig(".length;
		const configEnd = content.lastIndexOf(");");
		let config = content.slice(configStart, configEnd);

		// Remove outer braces and trim
		config = config.trim().replace(/^{|}$/g, "").trim();

		// Add experimental configuration
		if (!config.includes("experimental")) {
			config += `\n\texperimental: {
		svg: true,
	},`;
		} else if (!config.includes("svg: {")) {
			// Insert svg config into existing experimental block
			const expEnd = config.indexOf("experimental:") + "experimental:".length;
			const blockStart = config.indexOf("{", expEnd) + 1;
			config = config.slice(0, blockStart) + `\n\t\tsvg: true,` + config.slice(blockStart);
		}

		// Add vite configuration
		if (!config.includes("vite:")) {
			config += `\n\tvite: {
		plugins: [tailwindcss()],
	},`;
		} else if (!config.includes("plugins: [")) {
			// Insert plugins into existing vite block
			const viteEnd = config.indexOf("vite:") + "vite:".length;
			const blockStart = config.indexOf("{", viteEnd) + 1;
			config =
				config.slice(0, blockStart) + `\n\t\tplugins: [tailwindcss()],` + config.slice(blockStart);
		} else if (!config.includes("tailwindcss()")) {
			// Add tailwindcss to existing plugins array
			const pluginsStart = config.indexOf("plugins:") + "plugins:".length;
			const arrayStart = config.indexOf("[", pluginsStart) + 1;
			config = config.slice(0, arrayStart) + `tailwindcss(), ` + config.slice(arrayStart);
		}

		// Reconstruct the file content
		const newContent = `${content.slice(0, configStart)}{\n\t${config}\n}${content.slice(configEnd)}`;

		await fs.writeFile(configPath, newContent, "utf-8");
		return true;
	} catch (error) {
		const errorMessage = error instanceof Error ? error.message : "An unknown error occurred";
		p.log.error(highlighter.error(`Failed to setup Astro config: ${errorMessage}`));
		return false;
	}
}
