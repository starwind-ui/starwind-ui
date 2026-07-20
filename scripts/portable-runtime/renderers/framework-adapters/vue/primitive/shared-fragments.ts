import type { AdapterIndexFile, AdapterPrintedFile } from "../../types.js";
import { printVueIndexFile, type VueIndexPrintOptions } from "../exports.js";

export const VUE_NON_SHIPPING_COMMENT =
  "Internal non-shipping Vue adapter output. Do not publish, expose through the CLI registry, claim in public docs, or copy into public demo dependencies.";

/** Prints the common Vue-owned cleanup bridge for a single Runtime controller instance. */
export function printVueOwnedInstanceDestroy(): string {
  return `function destroyOwnedInstance(): void {
  const ownedInstance = instance;
  if (!ownedInstance) return;

  if (instance === ownedInstance) instance = undefined;
  ownedInstance.destroy();
}`;
}

export type CurrentVuePrimitiveFamilyKind =
  | "action-surface"
  | "boolean-form-control"
  | "media-status"
  | "option-collection-overlay"
  | "range-status"
  | "viewport-measurement";

/** Preserves the common namespace/index bytes while requiring a typed family projection. */
export function printVueFamilyIndex(
  file: AdapterIndexFile,
  expectedKind: CurrentVuePrimitiveFamilyKind,
  options: VueIndexPrintOptions = {},
): AdapterPrintedFile {
  if (file.family?.kind !== expectedKind) {
    throw new TypeError(`Vue ${expectedKind} index projection requires ${expectedKind} facts.`);
  }
  return { contents: printVueIndexFile(file, options), path: file.path };
}
