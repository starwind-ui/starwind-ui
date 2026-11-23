import { LOGICAL_CLASS_TAILWIND_MERGE_REQUIREMENT } from "../package-requirements.js";
import type { StyledAdapterContract } from "../types.js";

export const buttonGroupStyledContract: StyledAdapterContract = {
  component: "button-group",
  dependencies: { packages: [LOGICAL_CLASS_TAILWIND_MERGE_REQUIREMENT] },
  publicExports: ["ButtonGroup", "ButtonGroupSeparator", "ButtonGroupText"],
  defaultExport: {
    Root: "ButtonGroup",
    Separator: "ButtonGroupSeparator",
    Text: "ButtonGroupText",
  },
  variantCollectionName: "ButtonGroupVariants",
  variants: {
    buttonGroup: {
      base: [
        "flex w-fit items-stretch",
        "[&>*]:focus-visible:relative [&>*]:focus-visible:z-10",
        "has-[>[data-slot=button-group]]:gap-2 [&>[data-slot=select-trigger]:not([class*='w-'])]:w-fit [&>input]:flex-1",
      ],
      variants: {
        orientation: {
          horizontal: [
            // Direction changes move the seams immediately. Keep color and focus transitions.
            "[&>.transition-all]:transition",
            "[&>*>[data-as-child]>.transition-all]:transition",
            "[&>*>[data-slot=select-trigger].transition-all]:transition",
            "[&>[data-slot=dropdown]>[data-sw-menu-trigger].transition-all]:transition",
            "[&>[data-slot=dropdown]>*>[data-sw-menu-trigger].transition-all]:transition",
            "[&>*:not(:first-child)]:rounded-s-none",
            "[&>*:not(:first-child)]:border-s-0",
            "[&>*:not(:last-child):not(:has(+_script:last-child))]:rounded-e-none",
            "[&>*:not(:first-child)_>_[data-as-child]_>_*]:rounded-s-none",
            "[&>*:not(:first-child)_>_[data-as-child]_>_*]:border-s-0",
            "[&>*:not(:last-child):not(:has(+_script:last-child))_>_[data-as-child]_>_*]:rounded-e-none",
            "[&>*:not(:first-child)_>_[data-slot=select-trigger]]:rounded-s-none",
            "[&>*:not(:first-child)_>_[data-slot=select-trigger]]:border-s-0",
            "[&>*:not(:last-child):not(:has(+_script:last-child))_>_[data-slot=select-trigger]]:rounded-e-none",
            "[&>*:not(:first-child)[data-slot=dropdown]_>_[data-sw-menu-trigger]]:rounded-s-none",
            "[&>*:not(:first-child)[data-slot=dropdown]_>_[data-sw-menu-trigger]]:border-s-0",
            "[&>*:not(:last-child):not(:has(+_script:last-child))[data-slot=dropdown]_>_[data-sw-menu-trigger]]:rounded-e-none",
            "[&>*:not(:first-child)[data-slot=dropdown]_>_*_>_[data-sw-menu-trigger]]:rounded-s-none",
            "[&>*:not(:first-child)[data-slot=dropdown]_>_*_>_[data-sw-menu-trigger]]:border-s-0",
            "[&>*:not(:last-child):not(:has(+_script:last-child))[data-slot=dropdown]_>_*_>_[data-sw-menu-trigger]]:rounded-e-none",
          ],
          vertical: [
            "flex-col",
            "[&>*:not(:first-child)]:rounded-t-none",
            "[&>*:not(:first-child)]:border-t-0",
            "[&>*:not(:last-child):not(:has(+_script:last-child))]:rounded-b-none",
            "[&>*:not(:first-child)_>_[data-as-child]_>_*]:rounded-t-none",
            "[&>*:not(:first-child)_>_[data-as-child]_>_*]:border-t-0",
            "[&>*:not(:last-child):not(:has(+_script:last-child))_>_[data-as-child]_>_*]:rounded-b-none",
            "[&>*:not(:first-child)_>_[data-slot=select-trigger]]:rounded-t-none",
            "[&>*:not(:first-child)_>_[data-slot=select-trigger]]:border-t-0",
            "[&>*:not(:last-child):not(:has(+_script:last-child))_>_[data-slot=select-trigger]]:rounded-b-none",
            "[&>*:not(:first-child)[data-slot=dropdown]_>_[data-sw-menu-trigger]]:rounded-t-none",
            "[&>*:not(:first-child)[data-slot=dropdown]_>_[data-sw-menu-trigger]]:border-t-0",
            "[&>*:not(:last-child):not(:has(+_script:last-child))[data-slot=dropdown]_>_[data-sw-menu-trigger]]:rounded-b-none",
            "[&>*:not(:first-child)[data-slot=dropdown]_>_*_>_[data-sw-menu-trigger]]:rounded-t-none",
            "[&>*:not(:first-child)[data-slot=dropdown]_>_*_>_[data-sw-menu-trigger]]:border-t-0",
            "[&>*:not(:last-child):not(:has(+_script:last-child))[data-slot=dropdown]_>_*_>_[data-sw-menu-trigger]]:rounded-b-none",
          ],
        },
      },
      defaultVariants: {
        orientation: "horizontal",
      },
    },
    buttonGroupSeparator: {
      base: ["bg-input relative m-0! self-stretch data-[orientation=vertical]:h-auto"],
    },
    buttonGroupText: {
      base: [
        "bg-muted flex items-center gap-2 rounded-md border px-4 text-sm font-medium shadow-xs",
        "[&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4",
      ],
    },
  },
  components: [
    {
      exportName: "ButtonGroup",
      props: {
        extends: [
          { type: "htmlAttributes", element: "div" },
          { type: "variantProps", variant: "buttonGroup" },
        ],
      },
      destructure: {
        props: [
          { name: "orientation", defaultValue: '"horizontal"' },
          { name: "class", alias: "className" },
        ],
        rest: "rest",
      },
      render: [
        {
          type: "element",
          tag: "div",
          attrs: [
            { name: "role", value: { type: "literal", value: "group" } },
            { name: "data-orientation", value: { type: "variable", name: "orientation" } },
            {
              name: "class",
              value: {
                type: "classVariant",
                variant: "buttonGroup",
                args: { orientation: "orientation", class: "className" },
              },
            },
            { name: "spread", value: { type: "variable", name: "rest" } },
            { name: "data-slot", value: { type: "literal", value: "button-group" } },
          ],
          children: [{ type: "slot" }],
        },
      ],
    },
    {
      exportName: "ButtonGroupSeparator",
      props: {
        extends: [{ type: "componentProps", component: "separator", exportName: "Separator" }],
      },
      destructure: {
        props: [
          { name: "orientation", defaultValue: '"vertical"' },
          { name: "class", alias: "className" },
        ],
        rest: "rest",
      },
      render: [
        {
          type: "component",
          component: "separator",
          exportName: "Separator",
          attrs: [
            { name: "orientation", value: { type: "variable", name: "orientation" } },
            {
              name: "class",
              value: {
                type: "classVariant",
                variant: "buttonGroupSeparator",
                args: { class: "className" },
              },
            },
            { name: "spread", value: { type: "variable", name: "rest" } },
            { name: "data-slot", value: { type: "literal", value: "button-group-separator" } },
          ],
          selfClosing: true,
        },
      ],
    },
    {
      exportName: "ButtonGroupText",
      props: {
        extends: [{ type: "htmlAttributes", element: "div" }],
      },
      destructure: {
        props: [{ name: "class", alias: "className" }],
        rest: "rest",
      },
      render: [
        {
          type: "element",
          tag: "div",
          attrs: [
            {
              name: "class",
              value: {
                type: "classVariant",
                variant: "buttonGroupText",
                args: { class: "className" },
              },
            },
            { name: "spread", value: { type: "variable", name: "rest" } },
            { name: "data-slot", value: { type: "literal", value: "button-group-text" } },
          ],
          children: [{ type: "slot" }],
        },
      ],
    },
  ],
};
