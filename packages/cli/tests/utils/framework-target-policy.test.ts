import { describe, expect, expectTypeOf, it } from "vitest";

import type { StarwindFramework } from "../../src/utils/config.js";
import {
  getPrimitiveArtifactIntegrityFingerprint,
  PRIVATE_VUE_FRAMEWORK_TARGET_POLICY,
  PUBLIC_FRAMEWORK_TARGET_POLICY,
} from "../../src/utils/framework-target-policy.js";
import type { RegistryImplementationTarget } from "../../src/utils/registry.js";

describe("CLI framework target policy", () => {
  it("includes the public Vue beta in framework types", () => {
    expectTypeOf<StarwindFramework>().toEqualTypeOf<"astro" | "react" | "vue">();
    expectTypeOf<RegistryImplementationTarget>().toEqualTypeOf<
      "legacy-astro" | "astro" | "react" | "vue"
    >();
  });

  it("publishes Vue through the production policy with a beta label", () => {
    expect(PUBLIC_FRAMEWORK_TARGET_POLICY).toEqual({
      cacheKey: "public",
      configTargets: ["astro", "react", "vue"],
      registryTargets: ["legacy-astro", "astro", "react", "vue"],
      setupTargets: ["astro", "react", "vue"],
      labels: { astro: "Astro", react: "React", vue: "Vue (beta)" },
      primitiveArtifactIntegrity: undefined,
      requiredAdapterPackages: {
        "legacy-astro": [],
        astro: ["@starwind-ui/astro"],
        react: ["@starwind-ui/react"],
        vue: ["@starwind-ui/vue"],
      },
    });
  });

  it("uses the production policy for existing Vue acceptance seams", () => {
    expect(PRIVATE_VUE_FRAMEWORK_TARGET_POLICY).toBe(PUBLIC_FRAMEWORK_TARGET_POLICY);
    expect(JSON.stringify(PRIVATE_VUE_FRAMEWORK_TARGET_POLICY)).not.toMatch(
      /components|inventory|behavior/i,
    );
  });

  it("uses generated public Primitive artifacts without a private fingerprint", () => {
    expect(
      getPrimitiveArtifactIntegrityFingerprint(PUBLIC_FRAMEWORK_TARGET_POLICY, "vue"),
    ).toBeUndefined();
    expect(
      getPrimitiveArtifactIntegrityFingerprint(PRIVATE_VUE_FRAMEWORK_TARGET_POLICY, "astro"),
    ).toBeUndefined();
    expect(
      getPrimitiveArtifactIntegrityFingerprint(PUBLIC_FRAMEWORK_TARGET_POLICY, "astro"),
    ).toBeUndefined();
  });

  it("freezes policy records and nested adapter package lists", () => {
    expect(Object.isFrozen(PUBLIC_FRAMEWORK_TARGET_POLICY)).toBe(true);
    expect(Object.isFrozen(PUBLIC_FRAMEWORK_TARGET_POLICY.configTargets)).toBe(true);
    expect(Object.isFrozen(PUBLIC_FRAMEWORK_TARGET_POLICY.labels)).toBe(true);
    expect(Object.isFrozen(PUBLIC_FRAMEWORK_TARGET_POLICY.requiredAdapterPackages)).toBe(true);
    expect(Object.isFrozen(PUBLIC_FRAMEWORK_TARGET_POLICY.requiredAdapterPackages.vue)).toBe(true);
  });
});
