import { multiselect } from "@clack/prompts";

import type { Component } from "./registry.js";
import { getAllComponents } from "./registry.js";

export async function selectComponents(availableComponents?: Component[]): Promise<string[]> {
  const components = availableComponents ?? (await getAllComponents());

  const selected = await multiselect({
    message: "Select components to add ('a' for all, space to select, enter to confirm)",
    options: components.map((component) => ({
      label: component.name,
      value: component.name,
    })),
    required: false,
  });

  if (typeof selected === "symbol") {
    return [];
  }

  return selected;
}
