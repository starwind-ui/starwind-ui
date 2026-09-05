export type CliFrameworkTarget = "astro" | "react" | "vue";
export type PublicCliFrameworkTarget = CliFrameworkTarget;
export type RegistryTargetFor<TFramework extends CliFrameworkTarget> = "legacy-astro" | TFramework;

export interface FrameworkTargetPolicy<TFramework extends CliFrameworkTarget> {
  readonly cacheKey: "public" | "private-vue";
  readonly configTargets: readonly TFramework[];
  readonly registryTargets: readonly RegistryTargetFor<TFramework>[];
  readonly setupTargets: readonly TFramework[];
  readonly labels: Readonly<Record<TFramework, string>>;
  readonly primitiveArtifactIntegrity?: Readonly<Partial<Record<TFramework, string>>>;
  readonly requiredAdapterPackages: Readonly<
    Record<RegistryTargetFor<TFramework>, readonly string[]>
  >;
}

function defineFrameworkTargetPolicy<TFramework extends CliFrameworkTarget>(
  policy: FrameworkTargetPolicy<TFramework>,
): FrameworkTargetPolicy<TFramework> {
  const requiredAdapterPackages = Object.fromEntries(
    Object.entries(policy.requiredAdapterPackages).map(([target, packages]) => [
      target,
      Object.freeze([...packages]),
    ]),
  ) as Record<RegistryTargetFor<TFramework>, readonly string[]>;

  return Object.freeze({
    ...policy,
    configTargets: Object.freeze([...policy.configTargets]),
    registryTargets: Object.freeze([...policy.registryTargets]),
    setupTargets: Object.freeze([...policy.setupTargets]),
    labels: Object.freeze({ ...policy.labels }),
    primitiveArtifactIntegrity: policy.primitiveArtifactIntegrity
      ? Object.freeze({ ...policy.primitiveArtifactIntegrity })
      : undefined,
    requiredAdapterPackages: Object.freeze(requiredAdapterPackages),
  });
}

export const PUBLIC_FRAMEWORK_TARGET_POLICY = defineFrameworkTargetPolicy<PublicCliFrameworkTarget>(
  {
    cacheKey: "public",
    configTargets: ["astro", "react", "vue"],
    registryTargets: ["legacy-astro", "astro", "react", "vue"],
    setupTargets: ["astro", "react", "vue"],
    labels: {
      astro: "Astro",
      react: "React",
      vue: "Vue (beta)",
    },
    requiredAdapterPackages: {
      "legacy-astro": [],
      astro: ["@starwind-ui/astro"],
      react: ["@starwind-ui/react"],
      vue: ["@starwind-ui/vue"],
    },
  },
);

export type PrivateVueCliFrameworkTarget = CliFrameworkTarget;

/** @deprecated Vue now uses the production framework target policy. */
export const PRIVATE_VUE_FRAMEWORK_TARGET_POLICY = PUBLIC_FRAMEWORK_TARGET_POLICY;

export function getPrimitiveArtifactIntegrityFingerprint<TFramework extends CliFrameworkTarget>(
  policy: FrameworkTargetPolicy<TFramework>,
  target: TFramework,
): string | undefined {
  const fingerprint = policy.primitiveArtifactIntegrity?.[target];
  if (!fingerprint) return undefined;

  if (
    (policy as unknown as FrameworkTargetPolicy<CliFrameworkTarget>) !==
    PUBLIC_FRAMEWORK_TARGET_POLICY
  ) {
    throw new Error(
      "Primitive artifact fingerprints require the exact registered public framework target policy.",
    );
  }
  if (!/^sha256:[a-f0-9]{64}$/.test(fingerprint)) {
    throw new Error(`Primitive artifact target "${target}" has an invalid trusted fingerprint.`);
  }

  return fingerprint;
}

export function isConfigTarget<TFramework extends CliFrameworkTarget>(
  policy: FrameworkTargetPolicy<TFramework>,
  value: unknown,
): value is TFramework {
  return typeof value === "string" && (policy.configTargets as readonly string[]).includes(value);
}

export function isRegistryTarget<TFramework extends CliFrameworkTarget>(
  policy: FrameworkTargetPolicy<TFramework>,
  value: string,
): value is RegistryTargetFor<TFramework> {
  return (policy.registryTargets as readonly string[]).includes(value);
}

export function isSetupTarget<TFramework extends CliFrameworkTarget>(
  policy: FrameworkTargetPolicy<TFramework>,
  value: string,
): value is TFramework {
  return (policy.setupTargets as readonly string[]).includes(value);
}
