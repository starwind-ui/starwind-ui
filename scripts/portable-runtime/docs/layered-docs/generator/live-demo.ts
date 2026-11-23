import type { PrimitiveDocsLiveDemoMetadata } from "../types.js";

/** Docs site folder that holds one live demo per Primitive page. */
export const PRIMITIVE_LIVE_DEMO_DIRECTORY = "src/components/demos/primitives";

/** Live demo location for a Primitive, by the docs site naming convention. */
export const getPrimitiveLiveDemo = (primitiveId: string): PrimitiveDocsLiveDemoMetadata => {
  const componentName = `${primitiveId
    .split("-")
    .map((part) => `${part.charAt(0).toUpperCase()}${part.slice(1)}`)
    .join("")}PrimitiveDemo`;

  return {
    componentName,
    importPath: `@/components/demos/primitives/${componentName}.astro`,
    sourcePath: `${PRIMITIVE_LIVE_DEMO_DIRECTORY}/${componentName}.astro`,
  };
};
