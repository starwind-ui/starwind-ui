import { renderToggle } from "../../shared-recipes/toggle-selection/recipe.js";
import type { AdapterComponentFile, AdapterIndexFile, AdapterPrintedFile } from "../types.js";
import { printVueFamilyIndex } from "./primitive/shared-fragments.js";
import { toggleOperations } from "./recipe-toggle.js";

export function printVueSingleBooleanControlIndex(file: AdapterIndexFile): AdapterPrintedFile {
  return printVueFamilyIndex(file, "single-boolean-control");
}

export function printVueSingleBooleanControlComponent(
  file: AdapterComponentFile,
): AdapterPrintedFile {
  const family = file.component.family;
  if (family?.kind !== "single-boolean-control") {
    throw new TypeError(
      "Vue single-boolean-control projection requires a single-boolean-control component model.",
    );
  }

  return {
    path: `${file.path}.vue`,
    contents: renderToggle(toggleOperations("toggle"), family.facts),
  };
}
