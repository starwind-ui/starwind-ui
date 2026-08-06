import { describe, expect, it } from "vitest";

import type { StyledAdapterContract } from "../../contracts/styled/types.js";
import { projectStyledOutputComponentGroup } from "../../renderers/styled-output-model/index.js";

export const GENERIC_VUE_STYLED_FIXTURE: StyledAdapterContract = {
  component: "generic-binding-fixture",
  publicExports: ["GenericBindingRoot", "GenericConditionalRoot", "GenericComposedRoot"],
  defaultExport: {
    Root: "GenericBindingRoot",
    Conditional: "GenericConditionalRoot",
    Composed: "GenericComposedRoot",
  },
  components: [
    {
      exportName: "GenericBindingRoot",
      forwardRef: { targetType: "HTMLDivElement" },
      props: {
        fields: [
          { name: "enabled", optional: true, type: "boolean" },
          { name: "tone", optional: true, type: '"neutral" | "accent"' },
        ],
      },
      destructure: { props: [{ name: "enabled" }, { name: "tone" }], rest: "rest" },
      variables: [
        { name: "resolvedTone", value: { type: "raw", code: 'tone ?? "neutral"' } },
        {
          name: "active",
          value: {
            type: "raw",
            code: 'resolvedTone === "accent" && Boolean(enabled)',
          },
        },
      ],
      render: [
        {
          type: "element",
          tag: "div",
          attrs: [
            { name: "data-active", value: { type: "variable", name: "active" } },
            { name: "spread", value: { type: "variable", name: "rest" } },
            { name: "data-slot", value: { type: "literal", value: "binding-root" } },
          ],
          children: [{ type: "slot" }],
        },
      ],
    },
    {
      exportName: "GenericConditionalRoot",
      forwardRef: { targetType: "HTMLButtonElement | HTMLAnchorElement" },
      props: { fields: [{ name: "link", optional: true, type: "boolean" }] },
      destructure: { props: [{ name: "link" }], rest: "rest" },
      render: [
        {
          type: "conditional",
          condition: "link",
          then: [
            {
              type: "element",
              tag: "a",
              attrs: [
                { name: "spread", value: { type: "variable", name: "rest" } },
                { name: "data-slot", value: { type: "literal", value: "conditional-link" } },
              ],
              children: [{ type: "slot" }],
            },
          ],
          else: [
            {
              type: "element",
              tag: "button",
              attrs: [
                { name: "spread", value: { type: "variable", name: "rest" } },
                { name: "data-slot", value: { type: "literal", value: "conditional-button" } },
              ],
              children: [{ type: "slot" }],
            },
          ],
        },
      ],
    },
    {
      exportName: "GenericComposedRoot",
      render: [
        {
          type: "component",
          component: "separator",
          exportName: "Separator",
          attrs: [{ name: "data-slot", value: { type: "literal", value: "composed-root" } }],
          selfClosing: true,
        },
      ],
    },
  ],
};

describe("generic Vue Styled correction facts", () => {
  it("keeps expression bindings and ref targets framework-neutral", () => {
    const output = projectStyledOutputComponentGroup(GENERIC_VUE_STYLED_FIXTURE);

    expect(output.components[0]).toMatchObject({
      forwardRef: { targetType: "HTMLDivElement" },
      variables: [
        { name: "resolvedTone", value: { code: 'tone ?? "neutral"', type: "raw" } },
        {
          name: "active",
          value: {
            code: 'resolvedTone === "accent" && Boolean(enabled)',
            type: "raw",
          },
        },
      ],
    });
    expect(output.components[1]?.forwardRef).toEqual({
      targetType: "HTMLButtonElement | HTMLAnchorElement",
    });
    expect(output.components[2]?.forwardRef).toBeUndefined();
  });
});
