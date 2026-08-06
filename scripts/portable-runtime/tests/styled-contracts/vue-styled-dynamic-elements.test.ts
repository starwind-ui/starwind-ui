import { describe, expect, it } from "vitest";

import { aspectRatioStyledContract } from "../../contracts/styled/components/aspect-ratio.js";
import type { StyledAdapterContract } from "../../contracts/styled/types.js";
import { validateStyledAdapterContracts } from "../../contracts/styled/validation.js";
import {
  projectStyledOutputComponentGroup,
  toStyledAdapterContract,
} from "../../renderers/styled-output-model/index.js";

export const DYNAMIC_ELEMENT_FIXTURE = {
  component: "dynamic-element-fixture",
  publicExports: ["DynamicElement", "LiteralElement", "StaticElement", "VoidDynamicElement"],
  defaultExport: {
    Dynamic: "DynamicElement",
    Literal: "LiteralElement",
    Static: "StaticElement",
    VoidDynamic: "VoidDynamicElement",
  },
  components: [
    {
      exportName: "DynamicElement",
      props: {
        fields: [{ name: "as", optional: true, type: "string" }],
      },
      destructure: {
        props: [{ name: "as", alias: "Tag", defaultValue: '"div"' }],
      },
      render: [
        {
          type: "element",
          tag: "Tag",
          tagBinding: true,
          attrs: [{ name: "data-slot", value: { type: "literal", value: "dynamic" } }],
          children: [{ type: "slot" }],
        },
      ],
    },
    {
      exportName: "LiteralElement",
      render: [
        {
          type: "element",
          tag: "Tag",
          attrs: [{ name: "data-slot", value: { type: "literal", value: "literal" } }],
          children: [{ type: "slot" }],
        },
      ],
    },
    {
      exportName: "StaticElement",
      render: [
        {
          type: "element",
          tag: "section",
          attrs: [{ name: "data-slot", value: { type: "literal", value: "static" } }],
          children: [{ type: "slot" }],
        },
      ],
    },
    {
      exportName: "VoidDynamicElement",
      props: {
        fields: [{ name: "as", optional: true, type: "string" }],
      },
      destructure: {
        props: [{ name: "as", alias: "Tag", defaultValue: '"img"' }],
      },
      render: [
        {
          type: "element",
          tag: "Tag",
          tagBinding: true,
          selfClosing: true,
          attrs: [{ name: "data-slot", value: { type: "literal", value: "void-dynamic" } }],
        },
      ],
    },
  ],
} satisfies StyledAdapterContract;

describe("generic dynamic Styled element facts", () => {
  it("validates and preserves bound tags through the Styled Output Model", () => {
    expect(validateStyledAdapterContracts([DYNAMIC_ELEMENT_FIXTURE])).toEqual([]);

    const output = projectStyledOutputComponentGroup(DYNAMIC_ELEMENT_FIXTURE);
    expect(output.components[0]?.render[0]).toMatchObject({
      tag: "Tag",
      tagBinding: true,
      type: "element",
    });
    expect(output.components[1]?.render[0]).toMatchObject({
      tag: "Tag",
      tagBinding: undefined,
      type: "element",
    });
    expect(output.components[2]?.render[0]).toMatchObject({
      tag: "section",
      tagBinding: undefined,
      type: "element",
    });

    expect(projectStyledOutputComponentGroup(toStyledAdapterContract(output))).toEqual(output);
  });

  it("marks the Aspect Ratio root with the same bound-tag fact", () => {
    const root = aspectRatioStyledContract.components[0]?.render[0];
    const aspectRatio = root && "children" in root ? root.children?.[0] : undefined;

    expect(aspectRatio).toMatchObject({
      tag: "Tag",
      tagBinding: true,
      type: "element",
    });
  });
});
