import { astroFrameworkAdapterTarget } from "./astro/index.js";
import { reactFrameworkAdapterTarget } from "./react/index.js";
import type { FrameworkAdapterTargetRegistration } from "./types.js";

export const primitiveFrameworkAdapterTargets = [
  astroFrameworkAdapterTarget,
  reactFrameworkAdapterTarget,
] as const satisfies readonly FrameworkAdapterTargetRegistration[];

export const frameworkAdapterTargets = primitiveFrameworkAdapterTargets;

export type FrameworkAdapterRegisteredTarget = (typeof frameworkAdapterTargets)[number]["target"];

export type PrimitiveFrameworkAdapterTarget = FrameworkAdapterRegisteredTarget;

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
  target: FrameworkAdapterRegisteredTarget;
};

const primitiveFrameworkAdapterTargetMap = new Map<
  PrimitiveFrameworkAdapterTarget,
  (typeof frameworkAdapterTargets)[number]
>(frameworkAdapterTargets.map((registration) => [registration.target, registration]));

export function getPrimitiveFrameworkAdapterTarget(
  target: PrimitiveFrameworkAdapterTarget,
): (typeof frameworkAdapterTargets)[number] {
  const registration = primitiveFrameworkAdapterTargetMap.get(target);

  if (!registration) {
    throw new Error(`Unsupported primitive Framework Adapter target: ${target}`);
  }

  return registration;
}

export function getPrimitiveFrameworkAdapterTargetNames(): readonly PrimitiveFrameworkAdapterTarget[] {
  return frameworkAdapterTargets.map((registration) => registration.target);
}

export function getPrimitiveFrameworkAdapterTargetsWithOutputModelCapability<
  TCapability extends PrimitiveFrameworkAdapterOutputModelCapability,
>(
  capability: TCapability,
): readonly PrimitiveFrameworkAdapterOutputModelCapabilityEntry<TCapability>[] {
  return frameworkAdapterTargets
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
