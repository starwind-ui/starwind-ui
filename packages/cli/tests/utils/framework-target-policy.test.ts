import { describe, expect, expectTypeOf, it } from "vitest";

import type { StarwindFramework } from "../../src/utils/config.js";
import {
  createPrivateSvelteFrameworkTargetPolicy,
  getPrimitiveArtifactIntegrityFingerprint,
  isConfigTarget,
  isRegistryTarget,
  isSetupTarget,
  PRIVATE_VUE_FRAMEWORK_TARGET_POLICY,
  PUBLIC_FRAMEWORK_TARGET_POLICY,
} from "../../src/utils/framework-target-policy.js";
import type { RegistryImplementationTarget } from "../../src/utils/registry.js";

describe("CLI framework target policy", () => {
  it("keeps the private Svelte policy as an immutable trusted-artifact seam", () => {
    const fingerprint = `sha256:${"a".repeat(64)}`;
    const policy = createPrivateSvelteFrameworkTargetPolicy(fingerprint);
    expect(isConfigTarget(policy, "svelte")).toBe(true);
    expect(isRegistryTarget(policy, "svelte")).toBe(true);
    expect(isSetupTarget(policy, "svelte")).toBe(true);
    expect(isConfigTarget(PUBLIC_FRAMEWORK_TARGET_POLICY, "svelte")).toBe(true);
    expect(isRegistryTarget(PUBLIC_FRAMEWORK_TARGET_POLICY, "svelte")).toBe(true);
    expect(isSetupTarget(PUBLIC_FRAMEWORK_TARGET_POLICY, "svelte")).toBe(true);
    expect(getPrimitiveArtifactIntegrityFingerprint(policy, "svelte")).toBe(fingerprint);
    for (const copy of [{ ...policy }, structuredClone(policy)]) {
      expect(() => getPrimitiveArtifactIntegrityFingerprint(copy, "svelte")).toThrow(
        /exact registered framework target policy/,
      );
    }
    expect(Object.isFrozen(policy)).toBe(true);
    expect(Object.isFrozen(policy.primitiveArtifactIntegrity)).toBe(true);
    expect(Object.isFrozen(policy.requiredAdapterPackages.svelte)).toBe(true);
    expect(() => createPrivateSvelteFrameworkTargetPolicy("sha256:invalid")).toThrow(
      /invalid trusted fingerprint/,
    );
  });

  it("includes both public beta targets in framework types", () => {
    expectTypeOf<StarwindFramework>().toEqualTypeOf<"astro" | "react" | "svelte" | "vue">();
    expectTypeOf<RegistryImplementationTarget>().toEqualTypeOf<
      "legacy-astro" | "astro" | "react" | "svelte" | "vue"
    >();
  });

  it("publishes Vue and Svelte through the production policy with beta labels", () => {
    expect(PUBLIC_FRAMEWORK_TARGET_POLICY).toEqual({
      cacheKey: "public",
      configTargets: ["astro", "react", "vue", "svelte"],
      registryTargets: ["legacy-astro", "astro", "react", "vue", "svelte"],
      setupTargets: ["astro", "react", "vue", "svelte"],
      labels: {
        astro: "Astro",
        react: "React",
        vue: "Vue (beta)",
        svelte: "Svelte 5 (beta)",
      },
      primitiveArtifactIntegrity: undefined,
      requiredAdapterPackages: {
        "legacy-astro": [],
        astro: ["@starwind-ui/astro"],
        react: ["@starwind-ui/react"],
        vue: ["@starwind-ui/vue"],
        svelte: ["@starwind-ui/svelte"],
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
    expect(Object.isFrozen(PUBLIC_FRAMEWORK_TARGET_POLICY.requiredAdapterPackages.svelte)).toBe(
      true,
    );
  });
});
