import type { MenuItemOperations } from "../../shared-recipes/structured/menu-item-operations.js";

const upper = (n: string) => n[0]!.toUpperCase() + n.slice(1);
export const svelteMenuItemOperations: MenuItemOperations = {
  input: (n) => n,
  owner: () => "element",
  alive: () => "alive && ownerElement.isConnected",
  proposal: (n, v) => `on${upper(n)}Change?.(${v},details);`,
  render: (_n, v) => `accepted=${v};`,
  publish: (n, v) => `if (${n} !== ${v}) ${n}=${v};`,
  project: (_p, v) => `project(${v});`,
  settle: "",
};
