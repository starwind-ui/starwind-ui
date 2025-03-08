import { z } from "zod";
import { PATHS } from "./constants.js";

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
const registryCache = new Map<string, Promise<any>>();

/**
 * Fetches the component registry from the remote server
 * @param forceRefresh Whether to force a refresh of the cache
 * @returns A promise that resolves to an array of Components
 */
export async function getRegistry(forceRefresh = false): Promise<Component[]> {
	const cacheKey = PATHS.STARWIND_COMPONENT_REGISTRY;

	// Return cached promise if available and refresh not forced
	if (!forceRefresh && registryCache.has(cacheKey)) {
		return registryCache.get(cacheKey)!;
	}

	// Create a new promise for the fetch operation
	const fetchPromise = fetchRegistry();

	// Cache the promise
	registryCache.set(cacheKey, fetchPromise);

	return fetchPromise;
}

/**
 * Internal function to fetch the registry from the remote server
 */
async function fetchRegistry(): Promise<Component[]> {
	try {
		const response = await fetch(PATHS.STARWIND_COMPONENT_REGISTRY);

		if (!response.ok) {
			throw new Error(`Failed to fetch registry: ${response.status} ${response.statusText}`);
		}

		const data = await response.json();
		const parsedRegistry = registryRootSchema.parse(data);

		return parsedRegistry.components;
	} catch (error) {
		console.error("Failed to load registry:", error);
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
