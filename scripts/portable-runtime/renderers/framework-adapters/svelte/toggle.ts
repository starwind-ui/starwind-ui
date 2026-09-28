import { renderToggle } from "../../shared-recipes/toggle-selection/recipe.js";
import type { AdapterComponentFile, AdapterIndexFile, AdapterPrintedFile } from "../types.js";
import { toggleOperations } from "./recipe-toggle.js";
export function printSvelteToggleIndex(file: AdapterIndexFile): AdapterPrintedFile {
  if (file.family?.kind !== "single-boolean-control")
    throw new TypeError("Toggle requires single boolean facts.");
  const { exports: e } = file.family.facts;
  return {
    path: file.path,
    contents: `import ${e.root} from "./${e.root}.svelte";const ${e.namespace}={Root:${e.root}};export {${e.namespace},${e.root}};export default ${e.namespace};\n`,
  };
}
export function printSvelteToggleComponent(file: AdapterComponentFile): AdapterPrintedFile {
  if (
    file.component.family?.kind !== "single-boolean-control" ||
    file.component.family.facts.runtime.factory !== "createToggle"
  )
    throw new TypeError("Toggle requires its Runtime facts.");
  return {
    path: `${file.path}.svelte`,
    contents: renderToggle(toggleOperations("toggle"), file.component.family.facts),
  };
}
