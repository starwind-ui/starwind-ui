import { highlighter } from "../utils/highlighter.js";
import { type Component, getAllComponents } from "./registry.js";

/**
 * Checks if a component name exists in the registry
 * @param component - The component name to validate
 * @param availableComponents - Optional array of available components from registry
 */
export async function isValidComponent(
	component: string,
	availableComponents?: Component[],
): Promise<boolean> {
	const components = availableComponents || (await getAllComponents());
	return components.some((c) => c.name === component);
}

/**
 * Validates that a component exists in the registry
 * @param component - The component name to validate
 * @throws {Error} If the component is not found in the registry
 */
export async function validateComponent(component: string): Promise<void> {
	const components = await getAllComponents();
	if (!(await isValidComponent(component, components))) {
		const availableComponents = components.map((c) => highlighter.info(c.name));
		throw new Error(
			`Invalid component: ${highlighter.error(component)}.\nAvailable components:\n  ${availableComponents.join("\n  ")}`,
		);
	}
}
