import { svelteInventory } from "../../../../../scripts/portable-runtime/renderers/framework-adapters/svelte/inventory.js";

export function load() {
  const implemented = svelteInventory.styled.filter((entry) => entry.status === "implemented");
  return {
    catalog: implemented
      .filter((entry) => entry.component !== "sidebar")
      .map(({ component, status }) => ({ component, status })),
    pages: implemented
      .filter((entry) => entry.component === "sidebar")
      .map(({ component }) => ({ component, href: "/review/sidebar/" })),
  };
}
