import { registry as localRegistry } from "@starwind-ui/core";
import { z } from "zod";
import { PATHS } from "./constants.js";

// Configuration to select registry source
const REGISTRY_CONFIG = {
	// Set to 'remote' to fetch from remote server or 'local' to use the imported registry
	SOURCE: "local" as "remote" | "local",
};

const componentSchema = z.object({
	name: z.string(),
	version: z.string(),
	dependencies: z.array(z.string()).default([]),
	type: z.enum(["component"]),
});

export type Component = z.infer<typeof componentSchema>;

// Schema for the root registry object
const registryRootSchema = z.object({
	$schema: z.string().optional(),
	components: z.array(componentSchema),
});

// Cache for registry data - stores the promise of fetching to avoid multiple simultaneous requests
const registryCache = new Map<string, Promise<Component[]>>();

/**
 * Fetches the component registry from either the remote server or the local import
 * @param forceRefresh Whether to force a refresh of the cache
 * @returns A promise that resolves to an array of Components
 */
export async function getRegistry(forceRefresh = false): Promise<Component[]> {
	const cacheKey =
		REGISTRY_CONFIG.SOURCE === "remote"
			? PATHS.STARWIND_REMOTE_COMPONENT_REGISTRY
			: "local-registry";

	// Return cached promise if available and refresh not forced
	if (!forceRefresh && registryCache.has(cacheKey)) {
		return registryCache.get(cacheKey)!;
	}

	// Create a new promise for the registry operation based on source
	const registryPromise =
		REGISTRY_CONFIG.SOURCE === "remote"
			? fetchRemoteRegistry()
			: Promise.resolve(getLocalRegistry());

	// Cache the promise
	registryCache.set(cacheKey, registryPromise);

	return registryPromise;
}

/**
 * Internal function to fetch the registry from the remote server
 */
async function fetchRemoteRegistry(): Promise<Component[]> {
	try {
		const response = await fetch(PATHS.STARWIND_REMOTE_COMPONENT_REGISTRY);

		if (!response.ok) {
			throw new Error(`Failed to fetch registry: ${response.status} ${response.statusText}`);
		}

		const data = await response.json();
		const parsedRegistry = registryRootSchema.parse(data);

		return parsedRegistry.components;
	} catch (error) {
		console.error("Failed to load remote registry:", error);
		throw error;
	}
}

/**
 * Internal function to get the registry from the local import
 */
function getLocalRegistry(): Component[] {
	try {
		// Validate the local registry with the schema
		const components = localRegistry.map((comp) => componentSchema.parse(comp));
		return components;
	} catch (error) {
		console.error("Failed to validate local registry:", error);
		throw error;
	}
}

/**
 * Clear the registry cache
 */
export function clearRegistryCache(): void {
	registryCache.clear();
}

/**
 * Get a component by name from the registry
 * @param name The name of the component to find
 * @param forceRefresh Whether to force a refresh of the registry cache
 * @returns The component or undefined if not found
 */
export async function getComponent(
	name: string,
	forceRefresh = false,
): Promise<Component | undefined> {
	const registry = await getRegistry(forceRefresh);
	return registry.find((component) => component.name === name);
}

/**
 * Get all components from the registry
 * @param forceRefresh Whether to force a refresh of the registry cache
 * @returns All components in the registry
 */
export async function getAllComponents(forceRefresh = false): Promise<Component[]> {
	return getRegistry(forceRefresh);
}

/**
 * Set the registry source
 * @param source The source to use: 'remote' or 'local'
 */
export function setRegistrySource(source: "remote" | "local"): void {
	if (REGISTRY_CONFIG.SOURCE !== source) {
		REGISTRY_CONFIG.SOURCE = source;
		clearRegistryCache(); // Clear cache when changing sources
	}
}
