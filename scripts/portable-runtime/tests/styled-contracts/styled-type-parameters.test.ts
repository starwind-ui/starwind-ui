import { describe, expect, it } from "vitest";

import type { StyledAdapterContract } from "../../contracts/styled/types.js";
import { validateStyledAdapterContracts } from "../../contracts/styled/validation.js";
import {
  projectStyledOutputComponentGroup,
  renderStyledTypeParameterArguments,
  renderStyledTypeParameterDeclarations,
  toStyledAdapterContract,
} from "../../renderers/styled-output-model/index.js";

export const TYPE_PARAMETERS_FIXTURE = {
  component: "type-parameters-fixture",
  publicExports: ["TypedList", "PlainItem"],
  defaultExport: { List: "TypedList", Item: "PlainItem" },
  components: [
    {
      exportName: "TypedList",
      typeParameters: [
        { name: "T", constraint: "Record<string, unknown>" },
        { name: "K", constraint: "keyof T", default: "keyof T" },
      ],
      props: {
        extends: [{ type: "htmlAttributes", element: "div" }],
        fields: [
          { name: "items", type: "T[]" },
          { name: "labelKey", optional: true, type: "K" },
        ],
      },
      destructure: { props: [{ name: "items" }, { name: "labelKey" }], rest: "rest" },
      render: [
        {
          type: "element",
          tag: "div",
          attrs: [
            { name: "spread", value: { type: "variable", name: "rest" } },
            { name: "data-count", value: { type: "raw", code: "items.length" } },
            { name: "data-label-key", value: { type: "raw", code: "String(labelKey)" } },
            { name: "data-slot", value: { type: "literal", value: "typed-list" } },
          ],
          children: [{ type: "slot" }],
        },
      ],
    },
    {
      exportName: "PlainItem",
      props: { extends: [{ type: "htmlAttributes", element: "div" }] },
      destructure: { props: [], rest: "rest" },
      render: [
        {
          type: "element",
          tag: "div",
          attrs: [
            { name: "spread", value: { type: "variable", name: "rest" } },
            { name: "data-slot", value: { type: "literal", value: "plain-item" } },
          ],
          children: [{ type: "slot" }],
        },
      ],
    },
  ],
} satisfies StyledAdapterContract;

describe("Styled contract type parameters", () => {
  it("accepts the fixture and keeps type parameters through a full round trip", () => {
    expect(validateStyledAdapterContracts([TYPE_PARAMETERS_FIXTURE])).toEqual([]);

    const projected = projectStyledOutputComponentGroup(TYPE_PARAMETERS_FIXTURE);
    expect(projected.components.map(({ typeParameters }) => typeParameters)).toEqual([
      [
        { name: "T", constraint: "Record<string, unknown>" },
        { name: "K", constraint: "keyof T", default: "keyof T" },
      ],
      undefined,
    ]);
    expect(projected.components[1]).not.toHaveProperty("typeParameters");

    const contract = toStyledAdapterContract(projected);
    expect(contract.components[0]?.typeParameters).toEqual(
      TYPE_PARAMETERS_FIXTURE.components[0].typeParameters,
    );
    expect(contract.components[1]).not.toHaveProperty("typeParameters");
    expect(projectStyledOutputComponentGroup(contract)).toEqual(projected);
  });

  it("prints declaration and argument lists", () => {
    const parameters = TYPE_PARAMETERS_FIXTURE.components[0].typeParameters!;

    expect(renderStyledTypeParameterDeclarations(parameters)).toBe(
      "T extends Record<string, unknown>, K extends keyof T = keyof T",
    );
    expect(renderStyledTypeParameterArguments(parameters)).toBe("T, K");
  });

  it("rejects invalid, duplicate, misordered, and attribute-unsafe type parameters", () => {
    const invalid = withTypeParameters("invalid-type-parameters", [
      { name: "1T" },
      { name: "T" },
      { name: "T" },
      { name: "D", default: "unknown" },
      { name: "R" },
      { name: "Q", constraint: " " },
      { name: "S", default: '"a" | "b"' },
    ]);
    const empty = withTypeParameters("empty-type-parameters", []);
    const forwardRef = withTypeParameters("forward-ref-type-parameters", [{ name: "T" }]);
    forwardRef.components[0]!.forwardRef = { targetType: "HTMLDivElement" };
    const vueForwardRef = withTypeParameters("vue-forward-ref-type-parameters", [{ name: "T" }]);
    vueForwardRef.components[0]!.forwardRef = {
      frameworks: ["vue"],
      targetType: "HTMLDivElement",
    };

    expect(validateStyledAdapterContracts([invalid, empty, forwardRef, vueForwardRef])).toEqual([
      {
        component: "invalid-type-parameters",
        message: 'Type parameter name "1T" is invalid.',
        path: "components.TypedList.typeParameters.1T",
      },
      {
        component: "invalid-type-parameters",
        message: 'Duplicate type parameter "T".',
        path: "components.TypedList.typeParameters.T",
      },
      {
        component: "invalid-type-parameters",
        message: 'Required type parameter "R" cannot follow a parameter with a default.',
        path: "components.TypedList.typeParameters.R",
      },
      {
        component: "invalid-type-parameters",
        message: "Type parameter constraint must be non-empty.",
        path: "components.TypedList.typeParameters.Q.constraint",
      },
      {
        component: "invalid-type-parameters",
        message: 'Required type parameter "Q" cannot follow a parameter with a default.',
        path: "components.TypedList.typeParameters.Q",
      },
      {
        component: "invalid-type-parameters",
        message:
          "Type parameter default cannot contain double quotes, because Vue and Svelte print it in an attribute.",
        path: "components.TypedList.typeParameters.S.default",
      },
      {
        component: "empty-type-parameters",
        message: "Type parameters must include at least one parameter.",
        path: "components.TypedList.typeParameters",
      },
      {
        component: "forward-ref-type-parameters",
        message: "Type parameters cannot combine with a React forwardRef component.",
        path: "components.TypedList.typeParameters",
      },
    ]);
  });
});

function withTypeParameters(
  component: string,
  typeParameters: NonNullable<StyledAdapterContract["components"][number]["typeParameters"]>,
): StyledAdapterContract {
  const contract = structuredClone(TYPE_PARAMETERS_FIXTURE) as StyledAdapterContract;
  contract.component = component;
  contract.components[0]!.typeParameters = typeParameters;
  return contract;
}
