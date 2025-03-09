import { join } from "node:path";
import { fileURLToPath } from "node:url";
import componentRegistry from "./registry.json" with { type: "json" };

/**
 * Component metadata interface describing a Starwind UI component
 */
export interface ComponentMeta {
	name: string;
	version: string;
	type: "component";
	dependencies: string[];
}

/**
 * Registry interface containing all available components
 */
export interface Registry {
	components: ComponentMeta[];
}

const __dirname = fileURLToPath(new URL(".", import.meta.url));

/**
 * Get the absolute path to a component file
 * @param {string} componentName - The name of the component
 * @param {string} fileName - The name of the file within the component
 * @returns {string} The absolute path to the component file
 */
export const getComponentPath = (componentName: string, fileName: string): string => {
	// In production (when installed as a dependency), the components will be in dist/src/components
	// In development, they will be in src/components
	const componentsDir = __dirname.includes("dist") ? "src/components" : "src/components";
	return join(__dirname, componentsDir, componentName, fileName);
};

/**
 * Map of all components and their metadata from registry
 */
export const registry = componentRegistry.components as ComponentMeta[];
