import { describe, expect, it } from "vitest";

import type { StyledAdapterContract } from "../../contracts/styled/types.js";
import { validateStyledAdapterContracts } from "../../contracts/styled/validation.js";
import {
  projectStyledOutputComponentGroup,
  toStyledAdapterContract,
} from "../../renderers/styled-output-model/index.js";

export const FORWARD_REF_SCOPE_FIXTURE = {
  component: "forward-ref-scope-fixture",
  publicExports: ["VueOnlyTarget", "ReactOnlyTarget", "UnscopedTarget"],
  defaultExport: {
    VueOnly: "VueOnlyTarget",
    ReactOnly: "ReactOnlyTarget",
    Unscoped: "UnscopedTarget",
  },
  components: [
    createTarget("VueOnlyTarget", { frameworks: ["vue"], targetType: "HTMLDivElement" }),
    createTarget("ReactOnlyTarget", { frameworks: ["react"], targetType: "HTMLDivElement" }),
    createTarget("UnscopedTarget", { targetType: "HTMLDivElement" }),
  ],
} satisfies StyledAdapterContract;

describe("target-scoped Styled forward-ref facts", () => {
  it("preserves scoped and unscoped applicability through a full round trip", () => {
    const projected = projectStyledOutputComponentGroup(FORWARD_REF_SCOPE_FIXTURE);

    expect(projected.components.map(({ forwardRef }) => forwardRef)).toEqual([
      { targetScopes: ["vue"], targetType: "HTMLDivElement" },
      { targetScopes: ["react"], targetType: "HTMLDivElement" },
      { targetType: "HTMLDivElement" },
    ]);

    const contract = toStyledAdapterContract(projected);
    expect(contract.components.map(({ forwardRef }) => forwardRef)).toEqual([
      { frameworks: ["vue"], targetType: "HTMLDivElement" },
      { frameworks: ["react"], targetType: "HTMLDivElement" },
      { targetType: "HTMLDivElement" },
    ]);
    expect(projectStyledOutputComponentGroup(contract)).toEqual(projected);
  });

  it("rejects empty, duplicate, and unsupported forward-ref target scopes", () => {
    const empty = structuredClone(FORWARD_REF_SCOPE_FIXTURE) as StyledAdapterContract;
    empty.component = "empty-forward-ref-scope";
    empty.components[0]!.forwardRef!.frameworks = [];
    const duplicate = structuredClone(FORWARD_REF_SCOPE_FIXTURE) as StyledAdapterContract;
    duplicate.component = "duplicate-forward-ref-scope";
    duplicate.components[0]!.forwardRef!.frameworks = ["vue", "vue"];
    const unsupported = structuredClone(FORWARD_REF_SCOPE_FIXTURE) as StyledAdapterContract;
    unsupported.component = "unsupported-forward-ref-scope";
    unsupported.components[0]!.forwardRef!.frameworks = ["angular"] as never;

    expect(validateStyledAdapterContracts([empty, duplicate, unsupported])).toEqual([
      {
        component: "empty-forward-ref-scope",
        message: "Framework filter must include at least one target.",
        path: "components.VueOnlyTarget.forwardRef.frameworks",
      },
      {
        component: "duplicate-forward-ref-scope",
        message: 'Duplicate framework target "vue".',
        path: "components.VueOnlyTarget.forwardRef.frameworks.vue",
      },
      {
        component: "unsupported-forward-ref-scope",
        message: 'Unsupported framework target "angular".',
        path: "components.VueOnlyTarget.forwardRef.frameworks.angular",
      },
    ]);
  });
});

function createTarget(
  exportName: string,
  forwardRef: NonNullable<StyledAdapterContract["components"][number]["forwardRef"]>,
): StyledAdapterContract["components"][number] {
  return {
    exportName,
    forwardRef,
    props: {
      extends: [{ type: "htmlAttributes", element: "div" }],
      fields: [
        {
          frameworks: ["react"],
          name: "ref",
          optional: true,
          type: "React.Ref<HTMLDivElement>",
        },
      ],
    },
    destructure: {
      props: [{ frameworks: ["react"], name: "ref" }],
      rest: "rest",
    },
    render: [
      {
        type: "element",
        tag: "div",
        attrs: [
          { name: "spread", value: { type: "variable", name: "rest" } },
          {
            frameworks: ["react"],
            name: "ref",
            value: { type: "variable", name: "ref" },
          },
          { name: "data-slot", value: { type: "literal", value: "scope-target" } },
        ],
        children: [{ type: "slot" }],
      },
    ],
  };
}
