import { getPrimitivePackageExportNames } from "../primitive-inventory.js";
import { astroFrameworkAdapterTarget } from "./astro/index.js";
import { reactFrameworkAdapterTarget } from "./react/index.js";
import { vueFrameworkAdapterTarget } from "./vue/index.js";
import type {
  FrameworkAdapterTargetPrimitiveSupport,
  FrameworkAdapterTargetRegistration,
} from "./types.js";

export const primitiveFrameworkAdapterTargets = [
  astroFrameworkAdapterTarget,
  reactFrameworkAdapterTarget,
  vueFrameworkAdapterTarget,
] as const satisfies readonly FrameworkAdapterTargetRegistration[];

export const frameworkAdapterTargets = primitiveFrameworkAdapterTargets;

export type PrimitiveFrameworkAdapterTarget =
  (typeof primitiveFrameworkAdapterTargets)[number]["target"];

export type FrameworkAdapterRegisteredTarget = Exclude<
  PrimitiveFrameworkAdapterTarget,
  typeof vueFrameworkAdapterTarget.target
>;

type PrimitiveFrameworkAdapterTargetRegistration =
  (typeof primitiveFrameworkAdapterTargets)[number];

type PrimitiveFrameworkAdapterRegistrationFor<TTarget extends PrimitiveFrameworkAdapterTarget> =
  Extract<PrimitiveFrameworkAdapterTargetRegistration, { target: TTarget }>;

export type PrimitiveFrameworkAdapterOutputModelCapability = keyof NonNullable<
  FrameworkAdapterTargetRegistration["primitive"]["outputModel"]["capabilities"]
>;

export type PrimitiveFrameworkAdapterOutputModelCapabilityEntry<
  TCapability extends PrimitiveFrameworkAdapterOutputModelCapability,
> = {
  capability: NonNullable<
    NonNullable<
      FrameworkAdapterTargetRegistration["primitive"]["outputModel"]["capabilities"]
    >[TCapability]
  >;
  target: PrimitiveFrameworkAdapterTarget;
};

export type FrameworkAdapterTargetStyledCapabilityEntry = {
  capability: NonNullable<FrameworkAdapterTargetRegistration["styled"]>;
  target: PrimitiveFrameworkAdapterTarget;
};

const primitiveFrameworkAdapterTargetMap = new Map<
  PrimitiveFrameworkAdapterTarget,
  PrimitiveFrameworkAdapterTargetRegistration
>(primitiveFrameworkAdapterTargets.map((registration) => [registration.target, registration]));

export function getPrimitiveFrameworkAdapterTarget<TTarget extends PrimitiveFrameworkAdapterTarget>(
  target: TTarget,
): PrimitiveFrameworkAdapterRegistrationFor<TTarget> {
  const registration = primitiveFrameworkAdapterTargetMap.get(target);

  if (!registration) {
    throw new Error(`Unsupported primitive Framework Adapter target: ${target}`);
  }

  return registration as PrimitiveFrameworkAdapterRegistrationFor<TTarget>;
}

export function getPrimitiveFrameworkAdapterTargetNames(): readonly PrimitiveFrameworkAdapterTarget[] {
  return primitiveFrameworkAdapterTargets.map((registration) => registration.target);
}

export function getPrimitiveFrameworkAdapterTargetsForComponent(
  component: string,
): readonly PrimitiveFrameworkAdapterTarget[] {
  return primitiveFrameworkAdapterTargets
    .filter((registration) =>
      resolveFrameworkAdapterPrimitiveSupport(
        registration.target,
        registration.primitive.support,
      ).includes(component),
    )
    .map((registration) => registration.target);
}

export function resolvePrimitiveFrameworkAdapterTargetComponents(
  target: PrimitiveFrameworkAdapterTarget,
  requestedComponents?: readonly string[],
): readonly string[] {
  const registration = getPrimitiveFrameworkAdapterTarget(target);
  return resolveFrameworkAdapterPrimitiveSupport(
    target,
    registration.primitive.support,
    requestedComponents,
  );
}

export function resolveFrameworkAdapterPrimitiveSupport(
  target: string,
  support: FrameworkAdapterTargetPrimitiveSupport | undefined,
  requestedComponents?: readonly string[],
): readonly string[] {
  const inventory = getPrimitivePackageExportNames();
  const inventorySet = new Set(inventory);
  const declaration = support ?? { kind: "all" };
  const declaredComponents = declaration.kind === "all" ? inventory : declaration.components;

  if (declaration.kind === "subset" && declaredComponents.length === 0) {
    throw new Error(
      `Primitive Framework Adapter target "${target}" declares an empty supported component subset.`,
    );
  }

  assertKnownComponents(target, declaredComponents, inventorySet, "declares unknown supported");
  assertNoDuplicateComponents(target, declaredComponents);

  if (requestedComponents) {
    assertKnownComponents(target, requestedComponents, inventorySet, "requested unknown");
    assertNoDuplicateComponents(target, requestedComponents, "requested duplicate");

    const supportedSet = new Set(declaredComponents);
    const unsupported = requestedComponents.find((component) => !supportedSet.has(component));
    if (unsupported) {
      throw new Error(
        `Primitive Framework Adapter target "${target}" does not support component "${unsupported}".`,
      );
    }
  }

  const selected = new Set(requestedComponents ?? declaredComponents);
  return inventory.filter((component) => selected.has(component));
}

function assertKnownComponents(
  target: string,
  components: readonly string[],
  inventory: ReadonlySet<string>,
  diagnostic: string,
): void {
  const unknown = components.find((component) => !inventory.has(component));
  if (unknown) {
    throw new Error(
      `Primitive Framework Adapter target "${target}" ${diagnostic} component "${unknown}".`,
    );
  }
}

function assertNoDuplicateComponents(
  target: string,
  components: readonly string[],
  diagnostic = "declares duplicate supported",
): void {
  const seen = new Set<string>();
  const duplicate = components.find((component) => {
    if (seen.has(component)) return true;
    seen.add(component);
    return false;
  });
  if (duplicate) {
    throw new Error(
      `Primitive Framework Adapter target "${target}" ${diagnostic} component "${duplicate}".`,
    );
  }
}

export function getPrimitiveFrameworkAdapterTargetsWithOutputModelCapability<
  TCapability extends PrimitiveFrameworkAdapterOutputModelCapability,
>(
  capability: TCapability,
): readonly PrimitiveFrameworkAdapterOutputModelCapabilityEntry<TCapability>[] {
  return primitiveFrameworkAdapterTargets
    .map((registration) => ({
      capability: registration.primitive.outputModel.capabilities?.[capability],
      target: registration.target,
    }))
    .filter((entry): entry is PrimitiveFrameworkAdapterOutputModelCapabilityEntry<TCapability> =>
      Boolean(entry.capability),
    );
}

export function getFrameworkAdapterTargetsWithStyledCapability(): readonly FrameworkAdapterTargetStyledCapabilityEntry[] {
  return frameworkAdapterTargets
    .map((registration) => ({
      capability: registration.styled,
      target: registration.target,
    }))
    .filter((entry): entry is FrameworkAdapterTargetStyledCapabilityEntry =>
      Boolean(entry.capability),
    );
}
