import { sidebarRecipe } from "./recipe.js";
/** Native Runtime events coordinate the nearest Sheet; no adapter model binding intercepts requests. */
export function sidebarSheetBindings(): { name: string; expression: string }[] {
  return [...sidebarRecipe.sheet.bindings];
}
