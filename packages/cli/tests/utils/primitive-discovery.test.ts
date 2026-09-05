import { describe, expect, it, vi } from "vitest";

import { PRIVATE_VUE_FRAMEWORK_TARGET_POLICY } from "../../src/utils/framework-target-policy.js";
import { getPrimitiveDiscoveryResults } from "../../src/utils/primitive-discovery.js";
import * as primitives from "../../src/utils/primitive-component.js";

vi.mock("../../src/utils/primitive-component.js");

describe("primitive discovery", () => {
  it("sorts mixed-case primitive names with framework ties", () => {
    vi.mocked(primitives.getPrimitiveComponents).mockImplementation(({ framework } = {}) => {
      if (framework === "react") {
        return [
          {
            component: "button",
            framework: "react",
            version: "1.0.0",
            files: [],
            packageRequirements: [],
          },
          {
            component: "Alpha",
            framework: "react",
            version: "1.0.0",
            files: [],
            packageRequirements: [],
          },
        ];
      }
      if (framework === "vue") {
        return [
          {
            component: "button",
            framework: "vue",
            version: "1.0.0",
            files: [],
            packageRequirements: [],
          },
          {
            component: "zebra",
            framework: "vue",
            version: "1.0.0",
            files: [],
            packageRequirements: [],
          },
        ];
      }

      return [
        {
          component: "zebra",
          framework: "astro",
          version: "1.0.0",
          files: [],
          packageRequirements: [],
        },
        {
          component: "button",
          framework: "astro",
          version: "1.0.0",
          files: [],
          packageRequirements: [],
        },
      ];
    });

    expect(
      getPrimitiveDiscoveryResults({ framework: "all" }).map((primitive) => [
        primitive.component,
        primitive.framework,
      ]),
    ).toEqual([
      ["Alpha", "react"],
      ["button", "astro"],
      ["button", "react"],
      ["button", "vue"],
      ["zebra", "astro"],
      ["zebra", "vue"],
    ]);
  });

  it("scopes all discovery to the private policy and preserves Vue provenance", () => {
    vi.mocked(primitives.getPrimitiveComponents).mockImplementation(({ framework } = {}) => [
      {
        component: framework === "vue" ? "toast" : "button",
        framework: framework ?? "astro",
        version: "0.1.0",
        files: [
          {
            content: "source",
            path: `src/components/starwind-primitives/${framework}/index.ts`,
            sourceHash: `sha256:${framework}`,
            sourcePath: `packages/${framework}/src/index.ts`,
          },
        ],
        packageRequirements: [],
      },
    ]);

    const results = getPrimitiveDiscoveryResults({
      artifacts: { primitives: [] },
      framework: "all",
      targetPolicy: PRIVATE_VUE_FRAMEWORK_TARGET_POLICY,
    });

    expect(results.map(({ framework }) => framework)).toEqual(["astro", "react", "vue"]);
    expect(primitives.getPrimitiveComponents).toHaveBeenCalledWith(
      expect.objectContaining({
        framework: "vue",
        targetPolicy: PRIVATE_VUE_FRAMEWORK_TARGET_POLICY,
      }),
    );
  });
});
