import { reactMenuItemOperations } from "../../framework-adapters/react/recipe-menu-item-operations.js";
import { svelteMenuItemOperations } from "../../framework-adapters/svelte/recipe-menu-item-operations.js";
import { vueMenuItemOperations } from "../../framework-adapters/vue/recipe-menu-item-operations.js";
import type { MenuItemKind } from "./menu-items.js";
import type { Target } from "./operations.js";
export interface MenuItemOperations {
  input(model: string): string;
  owner(part: MenuItemKind): string;
  alive(part: MenuItemKind): string;
  proposal(model: string, value: string): string;
  render(model: string, value: string): string;
  publish(model: string, value: string): string;
  project(part: MenuItemKind, value: string): string;
  settle: string;
}
export const menuItemOperations: Record<Target, MenuItemOperations> = {
  react: reactMenuItemOperations,
  vue: vueMenuItemOperations,
  svelte: svelteMenuItemOperations,
};
