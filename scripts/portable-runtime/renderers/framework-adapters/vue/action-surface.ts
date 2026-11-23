import { renderSimpleRoot } from "../../shared-recipes/simple/frame.js";

import type { AdapterComponentFile, AdapterIndexFile, AdapterPrintedFile } from "../types.js";
import { printVueFamilyIndex } from "./primitive/shared-fragments.js";

export function printVueActionSurfaceIndex(file: AdapterIndexFile): AdapterPrintedFile {
  return printVueFamilyIndex(file, "action-surface");
}

export function printVueActionSurfaceComponent(file: AdapterComponentFile): AdapterPrintedFile {
  if (file.component.family?.kind !== "action-surface")
    throw new TypeError("Expected action surface facts.");
  return {
    path: file.path + ".vue",
    contents: renderSimpleRoot("vue", "button", file.component.family.facts),
  };
}
