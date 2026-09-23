import { renderFormGroup } from "../../shared-recipes/grouped/groups.js";
import type { AdapterComponentFile, AdapterIndexFile, AdapterPrintedFile } from "../types.js";
import { groupOperations } from "./recipe-form-group.js";

export function printSvelteCheckboxGroupIndex(file: AdapterIndexFile): AdapterPrintedFile {
  const family = file.family;
  if (
    family?.kind !== "grouped-value-control" ||
    family.facts.runtime.factory !== "createCheckboxGroup"
  )
    throw new TypeError("Svelte Checkbox Group requires its grouped-value facts.");
  const { facts } = family;
  return {
    path: file.path,
    contents: `import ${facts.exports.root} from "./${facts.exports.root}.svelte";
const ${facts.exports.namespace} = { Root: ${facts.exports.root} };
export { ${facts.exports.namespace}, ${facts.exports.root} };
export default ${facts.exports.namespace};
`,
  };
}

export function printSvelteCheckboxGroupComponent(file: AdapterComponentFile): AdapterPrintedFile {
  const family = file.component.family;
  if (family?.kind !== "grouped-value-control") throw new Error("Expected grouped value facts");
  return { path: `${file.path}.svelte`, contents: renderFormGroup(groupOperations, family.facts) };
}
