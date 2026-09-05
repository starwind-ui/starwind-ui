import type { FrameworkAdapterTarget, FrameworkAdapterTargetRegistration } from "./types.js";

export function defineFrameworkAdapterTarget<const TTarget extends FrameworkAdapterTarget>(
  registration: FrameworkAdapterTargetRegistration<TTarget>,
): FrameworkAdapterTargetRegistration<TTarget> {
  if (registration.adapter.target !== registration.target) {
    throw new Error(
      `Framework Adapter target mismatch: registration "${registration.target}" wraps adapter "${registration.adapter.target}".`,
    );
  }

  const shouldExposePublicCapabilities =
    registration.publicSupport.status === "public-beta" ||
    registration.publicSupport.status === "shipping";
  const inconsistentCapabilities = (
    ["cliRegistry", "demoIntegration", "packageExports", "publicDocsClaim"] as const
  ).filter(
    (capability) => registration.publicSupport[capability] !== shouldExposePublicCapabilities,
  );
  if (inconsistentCapabilities.length > 0) {
    throw new Error(
      `Framework Adapter target "${registration.target}" status "${registration.publicSupport.status}" requires cliRegistry, demoIntegration, packageExports, and publicDocsClaim to be ${shouldExposePublicCapabilities} together; inconsistent: ${inconsistentCapabilities.join(", ")}.`,
    );
  }

  return registration;
}
