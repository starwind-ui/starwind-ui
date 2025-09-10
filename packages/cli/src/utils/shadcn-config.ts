import { fileExists, readJsonFile, writeJsonFile } from "./fs.js";

export interface ShadcnRegistry {
  url: string;
  headers?: Record<string, string>;
}

export interface ShadcnConfig {
  $schema?: string;
  registries?: Record<string, ShadcnRegistry>;
  aliases?: {
    components?: string;
    utils?: string;
  };
  tailwind?: {
    config?: string;
    css?: string;
    baseColor?: string;
    cssVariables?: boolean;
  };
  style?: string;
  rsc?: boolean;
}

const COMPONENTS_JSON_PATH = "components.json";

/**
 * Creates a default shadcn components.json configuration with Starwind Pro registry
 */
export function createDefaultShadcnConfig(
  cssFilePath: string,
  baseColor: string = "neutral",
): ShadcnConfig {
  return {
    $schema: "https://ui.shadcn.com/schema.json",
    registries: {
      "@starwind-pro": {
        url: "http://localhost:4321/r/{name}",
        headers: {
          Authorization: "Bearer ${STARWIND_LICENSE_KEY}",
        },
      },
    },
    aliases: {
      components: "@/components",
      utils: "@/lib/utils",
    },
    tailwind: {
      config: "",
      css: cssFilePath,
      baseColor,
      cssVariables: true,
    },
    style: "default",
    rsc: true,
  };
}

/**
 * Checks if components.json exists in the project root
 */
export async function componentsJsonExists(): Promise<boolean> {
  return fileExists(COMPONENTS_JSON_PATH);
}

/**
 * Reads the existing components.json file
 */
export async function readComponentsJson(): Promise<ShadcnConfig> {
  try {
    return await readJsonFile(COMPONENTS_JSON_PATH);
  } catch (error) {
    throw new Error(`Failed to read components.json: ${error}`);
  }
}

/**
 * Writes the components.json file
 */
export async function writeComponentsJson(config: ShadcnConfig): Promise<void> {
  try {
    await writeJsonFile(COMPONENTS_JSON_PATH, config);
  } catch (error) {
    throw new Error(`Failed to write components.json: ${error}`);
  }
}

/**
 * Adds or updates the Starwind Pro registry in an existing components.json
 */
export function addStarwindProRegistry(config: ShadcnConfig): ShadcnConfig {
  const updatedConfig = { ...config };

  // Initialize registries if it doesn't exist
  if (!updatedConfig.registries) {
    updatedConfig.registries = {};
  }

  // Add or update the Starwind Pro registry
  updatedConfig.registries["@starwind-pro"] = {
    url: "http://localhost:4321/r/{name}",
    headers: {
      Authorization: "Bearer ${STARWIND_LICENSE_KEY}",
    },
  };

  return updatedConfig;
}

/**
 * Sets up shadcn components.json for Starwind Pro
 * Creates new file if it doesn't exist, or updates existing file
 */
export async function setupShadcnProConfig(
  cssFilePath: string,
  baseColor: string = "neutral",
): Promise<void> {
  const exists = await componentsJsonExists();

  if (!exists) {
    // Create new components.json with pro registry
    const config = createDefaultShadcnConfig(cssFilePath, baseColor);
    await writeComponentsJson(config);
  } else {
    // Update existing components.json to add pro registry
    const existingConfig = await readComponentsJson();
    const updatedConfig = addStarwindProRegistry(existingConfig);
    await writeComponentsJson(updatedConfig);
  }
}

/**
 * Checks if the Starwind Pro registry is already configured
 */
export async function hasStarwindProRegistry(): Promise<boolean> {
  if (!(await componentsJsonExists())) {
    return false;
  }

  try {
    const config = await readComponentsJson();
    return !!(config.registries && config.registries["@starwind-pro"]);
  } catch {
    return false;
  }
}
