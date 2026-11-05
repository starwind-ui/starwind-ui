// The Astro compiler's standalone output asks for component metadata, and only Astro's Vite plugin
// strips that call. The emission check needs the render functions only, so metadata stays empty.
export * from "../../../../../apps/demo/node_modules/astro/dist/runtime/compiler/index.js";

export function createMetadata(): Record<string, never> {
  return {};
}
