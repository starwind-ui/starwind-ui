import { describe, expect, expectTypeOf, it } from "vitest";

import type { StarwindFramework } from "../../src/utils/config.js";
import {
  getPrimitiveArtifactIntegrityFingerprint,
  PRIVATE_VUE_FRAMEWORK_TARGET_POLICY,
  PUBLIC_FRAMEWORK_TARGET_POLICY,
} from "../../src/utils/framework-target-policy.js";
import type { RegistryImplementationTarget } from "../../src/utils/registry.js";

describe("CLI framework target policy", () => {
  it("keeps public framework types narrow", () => {
    expectTypeOf<StarwindFramework>().toEqualTypeOf<"astro" | "react">();
    expectTypeOf<RegistryImplementationTarget>().toEqualTypeOf<
      "legacy-astro" | "astro" | "react"
    >();
  });

  it("keeps the public policy limited to Astro and React", () => {
    expect(PUBLIC_FRAMEWORK_TARGET_POLICY).toMatchObject({
      cacheKey: "public",
      configTargets: ["astro", "react"],
      registryTargets: ["legacy-astro", "astro", "react"],
      setupTargets: ["astro", "react"],
      labels: { astro: "Astro", react: "React" },
      requiredAdapterPackages: {
        "legacy-astro": [],
        astro: ["@starwind-ui/astro"],
        react: ["@starwind-ui/react"],
      },
    });
  });

  it("adds target-level Vue facts to the private policy", () => {
    expect(PRIVATE_VUE_FRAMEWORK_TARGET_POLICY).toEqual({
      cacheKey: "private-vue",
      configTargets: ["astro", "react", "vue"],
      registryTargets: ["legacy-astro", "astro", "react", "vue"],
      setupTargets: ["astro", "react", "vue"],
      labels: { astro: "Astro", react: "React", vue: "Vue" },
      primitiveArtifactIntegrity: {
        vue: "sha256:a08106d14c293396c65c8b67c5b2fae8023d6073d766b6489ad03b39c5aeb21e",
      },
      requiredAdapterPackages: {
        "legacy-astro": [],
        astro: ["@starwind-ui/astro"],
        react: ["@starwind-ui/react"],
        vue: ["@starwind-ui/vue"],
      },
    });
    expect(JSON.stringify(PRIVATE_VUE_FRAMEWORK_TARGET_POLICY)).not.toMatch(
      /components|inventory|behavior/i,
    );
  });

  it("binds private Primitive artifacts to the exact immutable capability policy", () => {
    expect(
      getPrimitiveArtifactIntegrityFingerprint(PRIVATE_VUE_FRAMEWORK_TARGET_POLICY, "vue"),
    ).toBe("sha256:a08106d14c293396c65c8b67c5b2fae8023d6073d766b6489ad03b39c5aeb21e");
    expect(
      getPrimitiveArtifactIntegrityFingerprint(PRIVATE_VUE_FRAMEWORK_TARGET_POLICY, "astro"),
    ).toBeUndefined();
    expect(() =>
      getPrimitiveArtifactIntegrityFingerprint({ ...PRIVATE_VUE_FRAMEWORK_TARGET_POLICY }, "vue"),
    ).toThrow(/exact registered private framework target policy/);
    expect(
      getPrimitiveArtifactIntegrityFingerprint(PUBLIC_FRAMEWORK_TARGET_POLICY, "astro"),
    ).toBeUndefined();
  });

  it("freezes policy records and nested adapter package lists", () => {
    expect(Object.isFrozen(PRIVATE_VUE_FRAMEWORK_TARGET_POLICY)).toBe(true);
    expect(Object.isFrozen(PRIVATE_VUE_FRAMEWORK_TARGET_POLICY.configTargets)).toBe(true);
    expect(Object.isFrozen(PRIVATE_VUE_FRAMEWORK_TARGET_POLICY.labels)).toBe(true);
    expect(Object.isFrozen(PRIVATE_VUE_FRAMEWORK_TARGET_POLICY.primitiveArtifactIntegrity)).toBe(
      true,
    );
    expect(Object.isFrozen(PRIVATE_VUE_FRAMEWORK_TARGET_POLICY.requiredAdapterPackages)).toBe(true);
    expect(Object.isFrozen(PRIVATE_VUE_FRAMEWORK_TARGET_POLICY.requiredAdapterPackages.vue)).toBe(
      true,
    );
  });
});
