import type { SvelteStyledRenderOptions } from "./types.js";

export function sveltePrimitiveImport(
  component: string,
  options: SvelteStyledRenderOptions,
): string {
  const source = `${options.primitiveImportBase}/${component}`;
  return options.primitiveImportBase.startsWith(".") ? `${source}/index.js` : source;
}
