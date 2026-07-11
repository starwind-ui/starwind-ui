import { createTsHeader, renderTsValue } from "../../../renderers/shared.js";
import type { LayeredDocsMetadata } from "../types.js";

export const renderCanonicalLayeredDocsMetadata = (metadata: LayeredDocsMetadata) =>
  renderCanonicalMetadataSource(metadata);

export const renderCanonicalMetadataSource = (metadata: LayeredDocsMetadata) => `${createTsHeader(
  "scripts/portable-runtime/generate-layered-docs-metadata.ts",
)}
import type { LayeredDocsMetadata } from "../types.js";

export const layeredDocsMetadata: LayeredDocsMetadata = ${renderTsValue(metadata)} as const satisfies LayeredDocsMetadata;

export default layeredDocsMetadata;
`;

export const renderDocsExportSource = (metadata: LayeredDocsMetadata) => `${createTsHeader(
  "scripts/portable-runtime/generate-layered-docs-metadata.ts",
)}
import type { LayeredDocsMetadata } from "./layered-docs-types.js";

export const layeredDocsMetadata: LayeredDocsMetadata = ${renderTsValue(metadata)} as const satisfies LayeredDocsMetadata;

export default layeredDocsMetadata;
`;
