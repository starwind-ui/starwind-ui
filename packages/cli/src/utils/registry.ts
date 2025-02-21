import { registry } from "@starwind-ui/core";
import { z } from "zod";

const componentSchema = z.object({
	name: z.string(),
	version: z.string(),
	dependencies: z.array(z.string()).default([]),
	type: z.enum(["component"]),
});

export type Component = z.infer<typeof componentSchema>;

const registrySchema = z.array(componentSchema);

export async function getRegistry(): Promise<Component[]> {
	try {
		return registrySchema.parse(registry);
	} catch (error) {
		console.error("Failed to load registry:", error);
		throw error;
	}
}

export async function getComponent(name: string): Promise<Component | undefined> {
	const registry = await getRegistry();
	return registry.find((component) => component.name === name);
}

export async function getAllComponents(): Promise<Component[]> {
	return getRegistry();
}
