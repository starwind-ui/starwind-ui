import {
  type ComponentGroupMetadata,
  type LayeredDocsMetadata,
  type PrimitiveDocsEnrichment,
  type PrimitiveDocsExampleCoveragePolicy,
  type PrimitiveDocsExampleRegistry,
  type StyledDocsAnnotation,
} from "../types.js";
import type { RuntimeAdapterContract } from "../../../contracts/primitive/types.js";
import type { StyledAdapterContract } from "../../../contracts/styled/types.js";

export type LayeredDocsRuntimeContract = RuntimeAdapterContract;

export type DocsExportResult =
  | {
      readonly status: "written";
      readonly path: string;
    }
  | {
      readonly status: "skipped";
      readonly reason: string;
    };

export type GenerateLayeredDocsMetadataOptions = {
  readonly outputRoot?: string;
  readonly docsRoot?: string;
  readonly requireDocs?: boolean;
  readonly primitiveDocsUsageRoot?: string | false;
};

export type CheckLayeredDocsMetadataOptions = GenerateLayeredDocsMetadataOptions;

export type GenerateLayeredDocsMetadataResult = {
  readonly metadata: LayeredDocsMetadata;
  readonly canonicalPath: string;
  readonly docsExport: DocsExportResult;
  readonly messages: readonly string[];
};

export type CheckLayeredDocsMetadataResult = {
  readonly metadata: LayeredDocsMetadata;
  readonly canonicalPath: string;
  readonly report: LayeredDocsValidationReport;
  readonly messages: readonly string[];
};

export type BuildLayeredDocsMetadataOptions = {
  readonly groups?: readonly ComponentGroupMetadata[];
  readonly initStarwindSource?: string;
  readonly primitiveDocsExampleCoveragePolicy?: PrimitiveDocsExampleCoveragePolicy;
  readonly primitiveDocsExamples?: PrimitiveDocsExampleRegistry;
  readonly primitiveDocsEnrichment?: Readonly<Record<string, PrimitiveDocsEnrichment>>;
  readonly primitiveDocsUsageRoot?: string | false;
  readonly runtimeExports?: ReadonlySet<string>;
  readonly runtimeIndexSource?: string;
  readonly styledAnnotations?: Readonly<Record<string, StyledDocsAnnotation>>;
  readonly styledContracts?: readonly StyledAdapterContract[];
  readonly themeTemplateSource?: string;
};

export type LayeredDocsValidationReport = {
  readonly requiredFailures: readonly string[];
  readonly optionalGaps: readonly string[];
  readonly missingDocsPages: readonly string[];
  readonly missingPublishedPages: readonly string[];
  readonly plannedDocsPages: readonly string[];
};

export type ValidateLayeredDocsMetadataOptions = {
  readonly docsRoot?: string;
};

export type LayeredDocsCheckFailureOptions = {
  readonly requireDocs?: boolean;
};
