import type { FrameworkAdapterTarget, FrameworkAdapterTargetRegistration } from "./types.js";

export function defineFrameworkAdapterTarget<
  const TTarget extends FrameworkAdapterTarget,
>(registration: FrameworkAdapterTargetRegistration<TTarget>): FrameworkAdapterTargetRegistration<TTarget> {
  if (registration.adapter.target !== registration.target) {
    throw new Error(
      `Framework Adapter target mismatch: registration "${registration.target}" wraps adapter "${registration.adapter.target}".`,
    );
  }

  return registration;
}
