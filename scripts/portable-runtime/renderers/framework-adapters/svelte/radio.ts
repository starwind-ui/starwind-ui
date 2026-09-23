import { renderRadioIndicator, renderRadioRoot } from "../../shared-recipes/grouped/radio.js";
import type {
  AdapterBooleanFormControlFacts,
  AdapterComponentFile,
  AdapterIndexFile,
  AdapterPrintedFile,
} from "../types.js";
import { radioOperations } from "./recipe-radio.js";

export function printSvelteRadioIndex(file: AdapterIndexFile): AdapterPrintedFile {
  if (file.family?.kind !== "boolean-form-control")
    throw new TypeError("Radio requires boolean form-control facts.");
  const facts = file.family.facts;
  return {
    path: file.path,
    contents: `import ${facts.exports.root} from "./${facts.exports.root}.svelte";
import ${facts.exports.stateIndicator} from "./${facts.exports.stateIndicator}.svelte";
const ${facts.exports.namespace} = {Root:${facts.exports.root},Indicator:${facts.exports.stateIndicator}};
export {${facts.exports.namespace},${facts.exports.root},${facts.exports.stateIndicator}};
export default ${facts.exports.namespace};
`,
  };
}
export function printSvelteRadioComponent(file: AdapterComponentFile): AdapterPrintedFile {
  const family = file.component.family;
  if (
    family?.kind !== "boolean-form-control" ||
    family.facts.runtime.factory !== "createRadio" ||
    !family.facts.parts.stateIndicator
  )
    throw new TypeError("Radio requires its root, indicator and form input facts.");
  return {
    path: `${file.path}.svelte`,
    contents: family.part === "root" ? printRoot(family.facts) : printIndicator(family.facts),
  };
}
function printRoot(facts: AdapterBooleanFormControlFacts): string {
  return renderRadioRoot(radioOperations, facts);
}
function printIndicator(facts: AdapterBooleanFormControlFacts): string {
  return renderRadioIndicator(radioOperations, facts);
}
