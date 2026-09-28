import type { MenuItemOperations } from "../../shared-recipes/structured/menu-item-operations.js";

const upper = (n: string) => n[0]!.toUpperCase() + n.slice(1);
export const reactMenuItemOperations: MenuItemOperations = {
  input: (n) => `${n}Ref.current`,
  owner: (p) => (p === "checkboxItem" ? "itemRef.current" : "groupRef.current"),
  alive: (p) =>
    `${p === "checkboxItem" ? "itemRef" : "groupRef"}.current === ownerElement && ownerElement.isConnected`,
  proposal: (n, v) => `on${upper(n)}ChangeRef.current?.(${v},details);`,
  render: (n, v) => `setUncontrolled${upper(n)}(${v});`,
  publish: () => "",
  project: (p, v) =>
    `${p === "checkboxItem" ? "syncCheckboxItemState" : "syncRadioGroupState"}(ownerElement,${v});`,
  settle: "",
};
