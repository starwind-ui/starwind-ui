import type { MenuItemOperations } from "../../shared-recipes/structured/menu-item-operations.js";

const upper = (n: string) => n[0]!.toUpperCase() + n.slice(1);
export const vueMenuItemOperations: MenuItemOperations = {
  input: (n) => `props.${n === "value" ? "modelValue" : n}`,
  owner: () => "element.value",
  alive: () => "!disposed && element.value === ownerElement && ownerElement.isConnected",
  proposal: (n, v) => `emit("${n}Change",${v},details);`,
  render: (n, v) => `uncontrolled${upper(n)}.value=${v};`,
  publish: (n, v) => `emit("update:${n === "value" ? "modelValue" : n}",${v});`,
  project: (_p, v) => `sync(${v});`,
  settle: "await nextTick();",
};
