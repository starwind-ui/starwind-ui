import { describe, expect, it, vi } from "vitest";

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
      ["zebra", "astro"],
    ]);
  });
});
