import { confirm, multiselect } from "@clack/prompts";

import type { Component } from "./registry.js";
import { getAllComponents } from "./registry.js";

export async function selectComponents(): Promise<string[]> {
  const components = await getAllComponents();

  const selected = await multiselect({
    message: "Select components to add",
    options: components.map((component) => ({
      label: component.name,
      value: component.name,
    })),
    required: false,
  });

  // Return empty array if user cancels selection
  if (typeof selected === "symbol") {
    return [];
  }

  return selected;
}

export async function confirmInstall(component: Component): Promise<boolean> {
  if (component.dependencies.length === 0) return true;

  const confirmed = await confirm({
    message: `This component requires the following dependencies: ${component.dependencies.join(", ")}. Install them?`,
  });

  if (typeof confirmed === "symbol") {
    return false;
  }

  return confirmed;
}
