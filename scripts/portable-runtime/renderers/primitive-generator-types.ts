import type { PrimitiveFrameworkAdapterTarget } from "./framework-adapters/index.js";

export type PrimitiveGeneratorSource =
  | "adapter-family-plan"
  | "manual"
  | "specialized-adapter-spec";

export type PrimitiveRouteFreeTarget = PrimitiveFrameworkAdapterTarget;

export type PrimitiveGeneratorTargetArgs = {
  componentHeader?: string;
  moduleHeader: string;
  outputRoot: string;
  target: PrimitiveRouteFreeTarget;
};

export type PrimitiveTargetGenerator = (args: PrimitiveGeneratorTargetArgs) => Promise<void>;

export type PrimitiveRouteFreeAdapterOutputMetadata = {
  kind: "adapter-output-model";
  strategy: "generic-adapter-plan" | "specialized-adapter-spec";
  targets: readonly PrimitiveRouteFreeTarget[];
};

export type PrimitiveManualRouteMetadata = {
  kind: "manual-route";
  reason: string;
  targets: readonly PrimitiveRouteFreeTarget[];
};

export type PrimitiveRouteFreeMetadata =
  | PrimitiveManualRouteMetadata
  | PrimitiveRouteFreeAdapterOutputMetadata;

export type PrimitiveGeneratorRegistryEntry = {
  component: string;
  generateTarget: PrimitiveTargetGenerator;
  routeFree?: PrimitiveRouteFreeMetadata;
  source: PrimitiveGeneratorSource;
};
