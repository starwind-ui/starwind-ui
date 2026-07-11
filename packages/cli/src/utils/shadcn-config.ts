import { PATHS } from "./constants.js";
import {
  resolveStarwindProRegistryConfig,
  type StarwindConfig,
  type StarwindProConfig,
  type StarwindProRegistryConfig,
  updateConfig,
} from "./config.js";
import { fileExists, readJsonFile, writeJsonFile } from "./fs.js";

export interface ShadcnRegistry {
  url: string;
  headers?: Record<string, string>;
  params?: Record<string, string>;
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
const STARWIND_PRO_REGISTRY_NAME = "@starwind-pro";

export type StarwindProRegistryImportStatus = "missing" | "imported" | "matched" | "conflict";

export interface StarwindProRegistryImportResult {
  pro?: StarwindProConfig;
  registry?: StarwindProRegistryConfig;
  status: StarwindProRegistryImportStatus;
}

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
      [STARWIND_PRO_REGISTRY_NAME]: {
        url: PATHS.STARWIND_PRO_REGISTRY,
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
    style: "new-york",
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
  updatedConfig.registries[STARWIND_PRO_REGISTRY_NAME] = {
    url: PATHS.STARWIND_PRO_REGISTRY,
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

function isStringRecord(value: unknown): value is Record<string, string> {
  return (
    typeof value === "object" &&
    value !== null &&
    !Array.isArray(value) &&
    Object.values(value).every((entry) => typeof entry === "string")
  );
}

export function getStarwindProRegistryFromComponentsConfig(
  config: ShadcnConfig,
): StarwindProRegistryConfig | undefined {
  const registry = config.registries?.[STARWIND_PRO_REGISTRY_NAME];
  if (!registry || typeof registry.url !== "string" || registry.url.length === 0) {
    return undefined;
  }

  const normalized: StarwindProRegistryConfig = {
    url: registry.url,
  };

  if (registry.headers === undefined) {
    normalized.headers = {};
  } else {
    if (!isStringRecord(registry.headers)) return undefined;
    normalized.headers = { ...registry.headers };
  }

  if (registry.params !== undefined) {
    if (!isStringRecord(registry.params)) return undefined;
    normalized.params = { ...registry.params };
  }

  return normalized;
}

export async function readStarwindProRegistryFromComponentsJson(): Promise<
  StarwindProRegistryConfig | undefined
> {
  if (!(await componentsJsonExists())) {
    return undefined;
  }

  try {
    return getStarwindProRegistryFromComponentsConfig(await readComponentsJson());
  } catch {
    return undefined;
  }
}

function normalizeResolvedProRegistryConfig(config: StarwindProRegistryConfig) {
  return {
    url: config.url ?? PATHS.STARWIND_PRO_REGISTRY,
    headers: Object.fromEntries(
      Object.entries(config.headers ?? {}).sort(([a], [b]) => a.localeCompare(b)),
    ),
    params: Object.fromEntries(
      Object.entries(config.params ?? {}).sort(([a], [b]) => a.localeCompare(b)),
    ),
  };
}

function starwindProRegistryConfigsMatch(
  starwindConfig: StarwindConfig,
  componentsRegistry: StarwindProRegistryConfig,
) {
  const resolvedStarwindConfig = resolveStarwindProRegistryConfig(starwindConfig);

  return (
    JSON.stringify(normalizeResolvedProRegistryConfig(resolvedStarwindConfig)) ===
    JSON.stringify(normalizeResolvedProRegistryConfig(componentsRegistry))
  );
}

export function resolveStarwindProRegistryImport(
  starwindConfig: StarwindConfig,
  componentsRegistry: StarwindProRegistryConfig | undefined,
  warn?: (message: string) => void,
): StarwindProRegistryImportResult {
  if (!componentsRegistry) {
    return { status: "missing", pro: starwindConfig.pro };
  }

  if (starwindConfig.pro?.registry) {
    if (!starwindProRegistryConfigsMatch(starwindConfig, componentsRegistry)) {
      warn?.(
        "Starwind Pro registry settings in starwind.config.json differ from components.json. Using starwind.config.json.",
      );
      return { status: "conflict", pro: starwindConfig.pro, registry: componentsRegistry };
    }

    return { status: "matched", pro: starwindConfig.pro, registry: componentsRegistry };
  }

  return {
    status: "imported",
    pro: {
      registry: componentsRegistry,
    },
    registry: componentsRegistry,
  };
}

export async function importStarwindProRegistryFromComponentsJson(
  starwindConfig: StarwindConfig,
  options: {
    warn?: (message: string) => void;
  } = {},
): Promise<StarwindProRegistryImportResult> {
  const result = resolveStarwindProRegistryImport(
    starwindConfig,
    await readStarwindProRegistryFromComponentsJson(),
    options.warn,
  );

  if (result.status === "imported") {
    await updateConfig({ pro: result.pro });
  }

  return result;
}

/**
 * Checks if the Starwind Pro registry is already configured with authorized URL
 */
export async function hasStarwindProRegistry(): Promise<boolean> {
  if (!(await componentsJsonExists())) {
    return false;
  }

  try {
    const config = await readComponentsJson();
    const starwindProRegistry = config.registries?.[STARWIND_PRO_REGISTRY_NAME];

    if (!starwindProRegistry?.url) {
      return false;
    }

    // Validate that the registry URL is from authorized domains
    const url = starwindProRegistry.url;
    const isAuthorized =
      url.startsWith("http://localhost") || url.startsWith("https://pro.starwind.dev");

    return isAuthorized;
  } catch {
    return false;
  }
}
