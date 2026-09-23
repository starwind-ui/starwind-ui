import { renderToggleGroup } from "../../shared-recipes/toggle-selection/recipe.js";
import type { AdapterComponentFile, AdapterIndexFile, AdapterPrintedFile } from "../types.js";
import { toggleOperations } from "./recipe-toggle.js";
export function printSvelteToggleGroupIndex(file: AdapterIndexFile): AdapterPrintedFile {
  if (
    file.family?.kind !== "grouped-value-control" ||
    file.family.facts.runtime.factory !== "createToggleGroup"
  )
    throw new TypeError("Toggle Group requires its Runtime facts.");
  const { exports: e } = file.family.facts;
  return {
    path: file.path,
    contents: `import ${e.root} from "./${e.root}.svelte";const ${e.namespace}={Root:${e.root}};export {${e.namespace},${e.root}};export default ${e.namespace};\n`,
  };
}
export function printSvelteToggleGroupComponent(file: AdapterComponentFile): AdapterPrintedFile {
  if (
    file.component.family?.kind !== "grouped-value-control" ||
    file.component.family.facts.runtime.factory !== "createToggleGroup"
  )
    throw new TypeError("Toggle Group requires its Runtime facts.");
  return {
    path: `${file.path}.svelte`,
    contents: renderToggleGroup(toggleOperations("toggle-group"), file.component.family.facts),
  };
}
