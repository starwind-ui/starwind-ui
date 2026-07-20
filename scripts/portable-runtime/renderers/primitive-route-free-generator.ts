import type { RuntimeAdapterContract } from "../contracts/primitive/types.js";
import type { AdapterOutputModel } from "./framework-adapters/index.js";
import {
  getPrimitiveFrameworkAdapterTarget,
  getPrimitiveFrameworkAdapterTargetsForComponent,
  primitiveFrameworkAdapterTargets,
  resolvePrimitiveFrameworkAdapterTargetComponents,
} from "./framework-adapters/target-registry.js";
import {
  buildGenericAdapterOutputModel,
  buildGenericAdapterPlan,
} from "./generic-adapter-plan/index.js";
import type {
  PrimitiveGeneratorRegistryEntry,
  PrimitiveGeneratorSource,
  PrimitiveRouteFreeTarget,
} from "./primitive-generator-types.js";

type GenericAdapterPlanSource = Extract<PrimitiveGeneratorSource, "adapter-family-plan">;

type AdapterOutputModelBuilder = (target: PrimitiveRouteFreeTarget) => AdapterOutputModel;

export function getRouteFreePrimitiveFrameworkAdapter(target: PrimitiveRouteFreeTarget) {
  return getPrimitiveFrameworkAdapterTarget(target).adapter;
}

export function getRouteFreePrimitiveTargets(
  component: string,
): readonly PrimitiveRouteFreeTarget[] {
  return getPrimitiveFrameworkAdapterTargetsForComponent(component);
}

export function createGenericAdapterPlanPrimitiveGeneratorEntry({
  component,
  contract,
  source,
}: {
  component: string;
  contract: RuntimeAdapterContract;
  source: GenericAdapterPlanSource;
}): PrimitiveGeneratorRegistryEntry {
  const plan = buildGenericAdapterPlan(contract);

  return createAdapterOutputPrimitiveGeneratorEntry({
    buildOutputModel: () => buildGenericAdapterOutputModel(plan),
    component,
    componentName: contract.displayName,
    source,
    strategy: "generic-adapter-plan",
  });
}

export function createSpecializedAdapterSpecPrimitiveGeneratorEntry<TSpec>({
  buildOutputModel,
  buildSpec,
  component,
  contract,
}: {
  buildOutputModel: (spec: TSpec) => AdapterOutputModel;
  buildSpec: (contract: RuntimeAdapterContract) => TSpec;
  component: string;
  contract: RuntimeAdapterContract;
}): PrimitiveGeneratorRegistryEntry {
  const spec = buildSpec(contract);

  return createAdapterOutputPrimitiveGeneratorEntry({
    buildOutputModel: (target) => {
      const targetRegistration = getPrimitiveFrameworkAdapterTarget(target);
      return targetRegistration.primitive.outputModel.projectSpecialized(buildOutputModel(spec));
    },
    component,
    componentName: contract.displayName,
    source: "specialized-adapter-spec",
    strategy: "specialized-adapter-spec",
  });
}

export function createManualPrimitiveGeneratorEntry({
  component,
  reason,
}: {
  component: string;
  reason: string;
}): PrimitiveGeneratorRegistryEntry {
  const supportingTargets = getPrimitiveFrameworkAdapterTargetsForComponent(component);
  const targets = primitiveFrameworkAdapterTargets
    .filter(
      (registration) =>
        supportingTargets.includes(registration.target) &&
        typeof registration.primitive.manualPrimitives?.[component] === "function",
    )
    .map((registration) => registration.target);

  return {
    component,
    async generateTarget(args) {
      resolvePrimitiveFrameworkAdapterTargetComponents(args.target, [component]);
      const targetRegistration = getPrimitiveFrameworkAdapterTarget(args.target);
      const generate = targetRegistration.primitive.manualPrimitives?.[component];
      if (!generate) {
        throw new Error(
          `${component} manual primitive generator does not support target "${args.target}".`,
        );
      }

      await generate(args);
    },
    routeFree: {
      kind: "manual-route",
      reason,
      targets,
    },
    source: "manual",
  };
}

function createAdapterOutputPrimitiveGeneratorEntry({
  buildOutputModel,
  component,
  componentName,
  source,
  strategy,
}: {
  buildOutputModel: AdapterOutputModelBuilder;
  component: string;
  componentName: string;
  source: Exclude<PrimitiveGeneratorSource, "manual">;
  strategy: "generic-adapter-plan" | "specialized-adapter-spec";
}): PrimitiveGeneratorRegistryEntry {
  return {
    component,
    generateTarget: (args) => {
      resolvePrimitiveFrameworkAdapterTargetComponents(args.target, [component]);
      return writeRouteFreePrimitiveOutput({
        buildOutputModel,
        componentHeader: args.componentHeader,
        componentName,
        moduleHeader: args.moduleHeader,
        outputRoot: args.outputRoot,
        target: args.target,
      });
    },
    routeFree: {
      kind: "adapter-output-model",
      strategy,
      targets: getRouteFreePrimitiveTargets(component),
    },
    source,
  };
}

async function writeRouteFreePrimitiveOutput({
  buildOutputModel,
  componentHeader,
  componentName,
  moduleHeader,
  outputRoot,
  target,
}: {
  buildOutputModel: AdapterOutputModelBuilder;
  componentHeader?: string;
  componentName: string;
  moduleHeader: string;
  outputRoot: string;
  target: PrimitiveRouteFreeTarget;
}): Promise<void> {
  const targetRegistration = getPrimitiveFrameworkAdapterTarget(target);
  const outputModel = buildOutputModel(target);

  await targetRegistration.primitive.outputModel.write({
    componentHeader,
    componentName,
    moduleHeader,
    outputModel,
    outputRoot,
  });
}
