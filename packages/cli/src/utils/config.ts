import { PATHS } from "./constants.js";
import { fileExists, readJsonFile, writeJsonFile } from "./fs.js";

interface ComponentConfig {
	name: string;
	version: string;
}

interface TailwindConfig {
	css: string;
	baseColor: "slate" | "gray" | "zinc" | "neutral" | "stone";
	cssVariables: boolean;
}

// interface AliasConfig {
// 	components: string;
// }

export interface StarwindConfig {
	$schema: string;
	tailwind: TailwindConfig;
	// aliases: AliasConfig;
	componentDir: string;
	components: ComponentConfig[];
}

const defaultConfig: StarwindConfig = {
	$schema: "https://starwind.dev/config-schema.json",
	tailwind: {
		css: "src/styles/starwind.css",
		baseColor: "neutral",
		cssVariables: true,
	},
	// aliases: {
	// 	components: "@/components",
	// },
	componentDir: "src/components/starwind",
	components: [],
};

/**
 * Get the current config, ensuring the file is fully read
 */
export async function getConfig(): Promise<StarwindConfig> {
	try {
		if (await fileExists(PATHS.LOCAL_CONFIG_FILE)) {
			const config = await readJsonFile(PATHS.LOCAL_CONFIG_FILE);
			return {
				...defaultConfig,
				...config,
				components: Array.isArray(config.components) ? config.components : [],
			};
		}
	} catch (error) {
		console.error("Error reading config:", error);
	}

	return defaultConfig;
}

/**
 * Options for updating the config file
 */
export interface UpdateConfigOptions {
	/** If true, append new components to existing array. If false, replace the components array. */
	appendComponents?: boolean;
}

/**
 * Update the config file, ensuring the write operation is completed
 * @param updates - Partial config object to update
 * @param options - Options for updating the config
 */
export async function updateConfig(
	updates: Partial<StarwindConfig>,
	options: UpdateConfigOptions = { appendComponents: true },
): Promise<void> {
	const currentConfig = await getConfig();

	// Ensure components array exists
	const currentComponents = Array.isArray(currentConfig.components) ? currentConfig.components : [];

	const newConfig = {
		...currentConfig,
		tailwind: {
			...currentConfig.tailwind,
			...(updates.tailwind || {}),
		},
		componentDir: updates.componentDir ? updates.componentDir : currentConfig.componentDir,
		components: updates.components
			? options.appendComponents
				? [...currentComponents, ...updates.components]
				: updates.components
			: currentComponents,
	};

	try {
		await writeJsonFile(PATHS.LOCAL_CONFIG_FILE, newConfig);
	} catch (error) {
		throw new Error(
			`Failed to update config: ${error instanceof Error ? error.message : "Unknown error"}`,
		);
	}
}
