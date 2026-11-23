import { LOGICAL_CLASS_TAILWIND_MERGE_REQUIREMENT } from "../package-requirements.js";
import type { StyledAdapterContract } from "../types.js";

/** The TanStack scene colors. A user theme wins over them. */
const SCENE_THEME = `{
  foreground: "var(--muted-foreground)",
  muted: "var(--muted-foreground)",
  grid: "var(--border)",
  background: "transparent",
  ...theme,
}`;

/**
 * Starwind chart parts on the chart Primitive. The Primitive owns tooltip registration, tooltip
 * rows, legend items and the Runtime controller. These parts own names, defaults, classes and the
 * default tooltip body.
 */
export const chartStyledContract: StyledAdapterContract = {
  component: "chart",
  // The tooltip value uses `ms-auto`, a logical class.
  dependencies: { packages: [LOGICAL_CLASS_TAILWIND_MERGE_REQUIREMENT] },
  frameworks: ["astro", "react", "vue", "svelte"],
  publicExports: [
    "ChartContainer",
    "ChartTooltip",
    "ChartTooltipContent",
    "ChartLegend",
    "ChartLegendContent",
  ],
  defaultExport: {
    Container: "ChartContainer",
    Tooltip: "ChartTooltip",
    TooltipContent: "ChartTooltipContent",
    Legend: "ChartLegend",
    LegendContent: "ChartLegendContent",
  },
  primitiveFacadeExports: {
    component: "chart",
    types: [
      "ChartConfig",
      "ChartContext",
      "ChartFactory",
      "ChartIcon",
      "ChartModule",
      "ChartSource",
      "NativeHostOptions",
      "TooltipContentOptions",
      "TooltipItem",
    ],
    values: ["defineChartModule", "isChartIcon"],
    // A chart page needs one component import, so Astro also re-exports the page-script helpers.
    frameworkValues: {
      astro: [
        "chartStyle",
        "createChart",
        "getChartController",
        "registerChartModules",
        "serializeInput",
      ],
    },
  },
  variantCollectionName: "ChartVariants",
  variants: {
    chartContainer: {
      base: [
        "flex w-full min-w-0 flex-col text-xs",
        "[&_[data-slot=chart-surface]]:min-w-0",
        "[&_svg.ts-chart]:focus-visible:outline-2 [&_svg.ts-chart]:focus-visible:outline-offset-4 [&_svg.ts-chart]:focus-visible:outline-outline",
        // TanStack tooltip host. The native body reads these variables when `tooltip="native"`.
        "[--ts-chart-tooltip-background:var(--popover)] [--ts-chart-tooltip-color:var(--popover-foreground)]",
        "[--ts-chart-tooltip-border:1px_solid_var(--border)] [--ts-chart-tooltip-border-radius:var(--radius)]",
        "[--ts-chart-tooltip-shadow:var(--shadow-xl)]",
        // TanStack writes `font` inline on the host. The page font wins at the container's text-xs size.
        "[&_.ts-chart-tooltip]:[font:inherit]!",
        // The tooltip fades in. The Runtime owns its position and the ease between items, so no
        // class transitions `left` or `top`.
        "[&_.ts-chart-tooltip]:animate-in [&_.ts-chart-tooltip]:fade-in-0 [&_.ts-chart-tooltip]:duration-100 [&_.ts-chart-tooltip]:transition-none",
        "motion-reduce:[&_.ts-chart-tooltip]:animate-none",
      ],
    },
    chartTooltipContent: {
      base: [
        "group/chart-tooltip grid min-w-32 items-start gap-1.5",
        "bg-popover text-popover-foreground border-border/50 rounded-lg border px-2.5 py-1.5 text-xs shadow-xl",
      ],
    },
    chartTooltipLabel: {
      base: "font-medium",
    },
    chartTooltipItem: {
      base: [
        "flex w-full items-center gap-2",
        "group-data-[indicator=line]/chart-tooltip:items-stretch group-data-[indicator=dashed]/chart-tooltip:items-stretch",
        "[&>svg]:text-muted-foreground [&>svg]:size-2.5",
      ],
    },
    chartTooltipIndicator: {
      base: [
        "shrink-0 rounded-[2px] border-(--sw-chart-indicator-color) bg-(--sw-chart-indicator-color)",
        "group-data-[indicator=dot]/chart-tooltip:size-2.5",
        "group-data-[indicator=line]/chart-tooltip:w-1",
        "group-data-[indicator=dashed]/chart-tooltip:w-0 group-data-[indicator=dashed]/chart-tooltip:border-[1.5px] group-data-[indicator=dashed]/chart-tooltip:border-dashed group-data-[indicator=dashed]/chart-tooltip:bg-transparent",
        "group-data-[nested=true]/chart-tooltip:group-data-[indicator=dashed]/chart-tooltip:my-0.5",
      ],
    },
    chartTooltipIcon: {
      base: "inline-flex size-2.5 shrink-0 items-center justify-center self-center [&>svg]:size-full",
    },
    chartTooltipName: {
      base: [
        "text-muted-foreground leading-none",
        "group-data-[nested=true]/chart-tooltip:grid group-data-[nested=true]/chart-tooltip:gap-1.5",
        "group-data-[nested=true]/chart-tooltip:[&>[data-slot=chart-tooltip-label]]:text-popover-foreground",
      ],
    },
    chartTooltipValue: {
      base: [
        "text-foreground ms-auto self-center font-mono leading-none font-medium tabular-nums",
        "group-data-[nested=true]/chart-tooltip:self-end",
      ],
    },
    chartTooltipCustom: {
      base: "flex w-full items-center gap-2",
    },
    chartLegend: {
      base: "flex flex-wrap items-center justify-center gap-4 pt-3",
    },
    chartLegendItem: {
      base: [
        "text-foreground inline-flex items-center gap-1.5 rounded-sm p-1",
        "data-[state=off]:opacity-40",
        "focus-visible:outline-outline focus-visible:outline-2 focus-visible:outline-offset-2",
      ],
    },
    chartLegendSwatch: {
      base: "size-2 shrink-0 rounded-[2px]",
    },
    chartLegendIcon: {
      base: "inline-flex size-3 shrink-0 items-center justify-center [&>svg]:size-full",
    },
  },
  components: [
    {
      exportName: "ChartContainer",
      primitiveAliases: { chart: "ChartPrimitive" },
      typeParameters: [
        { name: "T", default: "unknown" },
        { name: "D", default: "unknown" },
        { name: "X", constraint: "ChartValue", default: "ChartValue" },
        { name: "Y", constraint: "ChartValue", default: "ChartValue" },
      ],
      imports: [
        {
          type: "named",
          importName: "ChartValue",
          source: "@tanstack/charts",
          frameworks: ["astro", "react", "vue"],
        },
        {
          type: "named",
          importName: "collectChartViews",
          // The Runtime source maps to the chart Primitive import, so a vendored Primitive works.
          source: "@starwind-ui/runtime/chart",
          frameworks: ["astro"],
        },
      ],
      props: {
        extends: [
          {
            type: "raw",
            code: 'import("@starwind-ui/runtime").ChartRootProps<T, D, X, Y>',
            frameworks: ["astro", "react"],
          },
          {
            type: "raw",
            code: 'import("@starwind-ui/vue/chart").ChartRootProps<T, D, X, Y>',
            frameworks: ["vue"],
          },
          {
            type: "raw",
            code: 'import("@starwind-ui/svelte/chart").ChartRootProps<T, D, X, Y>',
            frameworks: ["svelte"],
          },
        ],
        fields: [
          {
            // ReactNode accepts any string, so the rule calls "native" redundant. It stays to name the
            // built-in tooltip in the public type.
            comment:
              'oxlint-disable-next-line typescript/no-redundant-type-constituents -- "native" names the built-in tooltip.',
            name: "tooltip",
            optional: true,
            type: 'React.ReactNode | false | "native"',
            frameworks: ["react"],
          },
          {
            // Tooltip body content goes in the `tooltip` slot.
            name: "tooltip",
            optional: true,
            type: 'boolean | "native"',
            frameworks: ["astro", "vue"],
          },
          {
            // Tooltip body content goes in the `tooltip` snippet.
            name: "tooltip",
            optional: true,
            type: 'import("svelte").Snippet | boolean | "native"',
            frameworks: ["svelte"],
          },
        ],
      },
      // Vue reads the `tooltip` slot in an attribute value, so the slot needs a declaration.
      slots: [{ name: "tooltip", frameworks: ["vue"] }],
      destructure: {
        props: [
          { name: "tooltip", frameworks: ["astro", "react"] },
          // An absent Vue boolean prop must stay undefined, so a bare container keeps its tooltip.
          { name: "tooltip", defaultValue: "undefined", frameworks: ["vue"] },
          { name: "tooltip", frameworks: ["svelte"] },
          // The accepted Svelte model forwards through the parent getter.
          { name: "visible", defaultValue: "$bindable()", frameworks: ["svelte"] },
          { name: "theme" },
          { name: "class", alias: "className" },
        ],
        rest: "rest",
      },
      variables: [
        {
          // React keeps the object stable across renders, so the Root input changes only with
          // `theme`.
          name: "sceneTheme",
          frameworks: ["react"],
          value: { type: "raw", code: `React.useMemo(() => (${SCENE_THEME}), [theme])` },
        },
        {
          name: "sceneTheme",
          frameworks: ["astro", "vue", "svelte"],
          value: { type: "raw", code: SCENE_THEME },
        },
        {
          name: "tooltipContent",
          frameworks: ["react"],
          value: {
            type: "raw",
            code: 'tooltip === false || tooltip === "native" ? undefined : tooltip',
          },
        },
        {
          // Rich label and icon slots, rendered here and handed to the Root by the shared Astro
          // collector: a slot wins over a prop, and a blank slot keeps the prop or config value.
          name: "views",
          frameworks: ["astro"],
          value: {
            type: "raw",
            code: "await collectChartViews(Astro.slots, rest.config, rest.labels, rest.icons)",
          },
        },
        {
          // The `tooltip` slot wins over a ChartTooltip, as the React `tooltip` prop does.
          name: "tooltipContent",
          frameworks: ["astro"],
          value: {
            type: "raw",
            code: 'tooltip === false || tooltip === "native" || !Astro.slots.has("tooltip")\n  ? undefined\n  : await Astro.slots.render("tooltip")',
          },
        },
      ],
      render: [
        {
          type: "primitive",
          component: "chart",
          part: "Root",
          attrs: [
            {
              name: "spread",
              value: { type: "variable", name: "rest" },
              frameworks: ["astro", "react"],
            },
            {
              // Vue attrs carry the Root props, so strict templates need their type.
              name: "spread",
              value: { type: "raw", code: "attrs as ChartPrimitive.ChartRootProps<T, D, X, Y>" },
              frameworks: ["vue"],
            },
            {
              // The public props check the Root union. Its rest is too wide to check again here.
              name: "spread",
              value: { type: "raw", code: "rest as any" },
              frameworks: ["svelte"],
            },
            { name: "theme", value: { type: "variable", name: "sceneTheme" } },
            { name: "disableTooltip", value: { type: "raw", code: "tooltip === false" } },
            { name: "labels", value: { type: "raw", code: "views.labels" }, frameworks: ["astro"] },
            { name: "icons", value: { type: "raw", code: "views.icons" }, frameworks: ["astro"] },
            {
              name: "class",
              value: {
                type: "classVariant",
                variant: "chartContainer",
                args: { class: "className" },
              },
            },
            { name: "data-slot", value: { type: "literal", value: "chart" } },
          ],
          children: [
            { type: "primitive", component: "chart", part: "Style", selfClosing: true },
            {
              type: "primitive",
              component: "chart",
              part: "Surface",
              selfClosing: true,
              attrs: [
                {
                  name: "tooltip",
                  value: { type: "variable", name: "tooltipContent" },
                  frameworks: ["astro", "react"],
                },
                {
                  name: "fallbackTooltip",
                  value: { type: "raw", code: "<ChartTooltipContent />" },
                  frameworks: ["react"],
                },
                {
                  // The container `tooltip` slot wins over a ChartTooltip.
                  name: "tooltip",
                  value: {
                    type: "raw",
                    code: 'tooltip === false || tooltip === "native" ? undefined : $slots.tooltip',
                  },
                  frameworks: ["vue"],
                },
                {
                  name: "fallbackTooltip",
                  value: { type: "raw", code: "ChartTooltipContent" },
                  frameworks: ["astro", "vue"],
                },
                {
                  // The container `tooltip` snippet wins over a ChartTooltip.
                  name: "tooltip",
                  value: {
                    type: "raw",
                    code: 'typeof tooltip === "function" ? tooltip : undefined',
                  },
                  frameworks: ["svelte"],
                },
                {
                  // A snippet that renders ChartTooltipContent.
                  name: "fallbackTooltip",
                  value: { type: "raw", code: "defaultTooltip" },
                  frameworks: ["svelte"],
                },
                { name: "nativeTooltip", value: { type: "raw", code: 'tooltip === "native"' } },
              ],
            },
            { type: "slot" },
          ],
        },
      ],
    },
    {
      exportName: "ChartTooltip",
      primitiveAliases: { chart: "ChartPrimitive" },
      render: [
        {
          type: "primitive",
          component: "chart",
          part: "Tooltip",
          children: [
            {
              type: "slot",
              name: "content",
              fallback: [
                {
                  type: "component",
                  component: "chart",
                  exportName: "ChartTooltipContent",
                  selfClosing: true,
                },
              ],
            },
          ],
        },
      ],
    },
    {
      exportName: "ChartTooltipContent",
      primitiveAliases: { chart: "ChartPrimitive" },
      typeParameters: [{ name: "T", default: "unknown" }],
      props: {
        extends: [
          {
            type: "raw",
            code: 'Omit<import("@starwind-ui/runtime").ChartTooltipContentProps<T>, "children">',
            frameworks: ["astro", "react"],
          },
          {
            type: "raw",
            code: 'import("@starwind-ui/vue/chart").ChartTooltipContentProps<T>',
            frameworks: ["vue"],
          },
          {
            type: "raw",
            code: 'import("@starwind-ui/svelte/chart").ChartTooltipContentProps<T>',
            frameworks: ["svelte"],
          },
        ],
        fields: [
          { name: "labelClassName", optional: true, type: "string", frameworks: ["react"] },
          { name: "labelClass", optional: true, type: "string", frameworks: ["astro"] },
          {
            name: "labelClass",
            optional: true,
            type: 'import("tailwind-variants").ClassValue',
            frameworks: ["vue", "svelte"],
          },
          // Absent Vue boolean props must stay undefined, so the module presentation preset applies.
          { name: "hideLabel", optional: true, type: "boolean", frameworks: ["vue"] },
          { name: "hideIndicator", optional: true, type: "boolean", frameworks: ["vue"] },
        ],
      },
      destructure: {
        props: [
          { name: "class", alias: "className" },
          // Astro passes a `slot` attribute as a prop, and the slot name is not an element attribute.
          { name: "slot", alias: "_slot", frameworks: ["astro"] },
          { name: "labelClassName", frameworks: ["react"] },
          { name: "labelClass", alias: "labelClassName", frameworks: ["astro", "vue", "svelte"] },
          { name: "hideLabel", defaultValue: "undefined", frameworks: ["vue"] },
          { name: "hideIndicator", defaultValue: "undefined", frameworks: ["vue"] },
        ],
        rest: "rest",
      },
      variables: [
        {
          name: "labelClass",
          value: {
            type: "classVariant",
            variant: "chartTooltipLabel",
            args: { class: "labelClassName" },
          },
        },
      ],
      render: [
        {
          type: "primitive",
          component: "chart",
          part: "TooltipContent",
          attrs: [
            { name: "spread", value: { type: "variable", name: "rest" } },
            {
              name: "class",
              value: {
                type: "classVariant",
                variant: "chartTooltipContent",
                args: { class: "className" },
              },
            },
            { name: "data-slot", value: { type: "literal", value: "chart-tooltip-content" } },
            {
              name: "hideLabel",
              value: { type: "variable", name: "hideLabel" },
              frameworks: ["vue"],
            },
            {
              name: "hideIndicator",
              value: { type: "variable", name: "hideIndicator" },
              frameworks: ["vue"],
            },
          ],
          children: [
            {
              type: "primitive",
              component: "chart",
              part: "TooltipLabel",
              selfClosing: true,
              attrs: [{ name: "class", value: { type: "variable", name: "labelClass" } }],
            },
            {
              type: "primitive",
              component: "chart",
              part: "TooltipItems",
              children: [
                {
                  type: "primitive",
                  component: "chart",
                  part: "TooltipItem",
                  attrs: [
                    {
                      name: "class",
                      value: { type: "classVariant", variant: "chartTooltipItem" },
                    },
                    {
                      // A Primitive class hook. React names it `customClassName`.
                      name: "customClass",
                      value: { type: "classVariant", variant: "chartTooltipCustom" },
                    },
                  ],
                  children: [
                    {
                      type: "primitive",
                      component: "chart",
                      part: "TooltipIcon",
                      selfClosing: true,
                      attrs: [
                        {
                          name: "class",
                          value: { type: "classVariant", variant: "chartTooltipIcon" },
                        },
                      ],
                    },
                    {
                      type: "primitive",
                      component: "chart",
                      part: "TooltipIndicator",
                      selfClosing: true,
                      attrs: [
                        {
                          name: "class",
                          value: { type: "classVariant", variant: "chartTooltipIndicator" },
                        },
                      ],
                    },
                    {
                      type: "primitive",
                      component: "chart",
                      part: "TooltipName",
                      selfClosing: true,
                      attrs: [
                        {
                          name: "class",
                          value: { type: "classVariant", variant: "chartTooltipName" },
                        },
                        {
                          // A Primitive class hook. React names it `labelClassName`.
                          name: "labelClass",
                          value: { type: "variable", name: "labelClass" },
                        },
                      ],
                    },
                    {
                      type: "primitive",
                      component: "chart",
                      part: "TooltipValue",
                      selfClosing: true,
                      attrs: [
                        {
                          name: "class",
                          value: { type: "classVariant", variant: "chartTooltipValue" },
                        },
                      ],
                    },
                  ],
                },
              ],
            },
          ],
        },
      ],
    },
    {
      exportName: "ChartLegend",
      props: {
        extends: [{ type: "componentProps", component: "chart", exportName: "ChartLegendContent" }],
      },
      destructure: { props: [], rest: "rest" },
      render: [
        {
          type: "fragment",
          children: [
            {
              type: "slot",
              name: "content",
              fallback: [
                {
                  type: "component",
                  component: "chart",
                  exportName: "ChartLegendContent",
                  selfClosing: true,
                  attrs: [{ name: "spread", value: { type: "variable", name: "rest" } }],
                },
              ],
            },
          ],
        },
      ],
    },
    {
      exportName: "ChartLegendContent",
      primitiveAliases: { chart: "ChartPrimitive" },
      props: {
        extends: [
          {
            type: "raw",
            code: 'Omit<import("@starwind-ui/runtime").ChartLegendProps, "children" | "content">',
            frameworks: ["astro", "react"],
          },
          {
            type: "raw",
            code: 'import("@starwind-ui/vue/chart").ChartLegendProps',
            frameworks: ["vue"],
          },
          {
            type: "raw",
            code: 'Omit<import("@starwind-ui/svelte/chart").ChartLegendProps, "children">',
            frameworks: ["svelte"],
          },
        ],
      },
      destructure: {
        props: [
          { name: "class", alias: "className" },
          // Astro passes a `slot` attribute as a prop, and the slot name is not an element attribute.
          { name: "slot", alias: "_slot", frameworks: ["astro"] },
        ],
        rest: "rest",
      },
      render: [
        {
          type: "primitive",
          component: "chart",
          part: "Legend",
          attrs: [
            { name: "spread", value: { type: "variable", name: "rest" } },
            {
              name: "class",
              value: {
                type: "classVariant",
                variant: "chartLegend",
                args: { class: "className" },
              },
            },
            { name: "data-slot", value: { type: "literal", value: "chart-legend" } },
          ],
          children: [
            {
              type: "primitive",
              component: "chart",
              part: "LegendItems",
              children: [
                {
                  type: "primitive",
                  component: "chart",
                  part: "LegendItem",
                  attrs: [
                    {
                      name: "class",
                      value: { type: "classVariant", variant: "chartLegendItem" },
                    },
                  ],
                  children: [
                    {
                      type: "primitive",
                      component: "chart",
                      part: "LegendIcon",
                      selfClosing: true,
                      attrs: [
                        {
                          name: "class",
                          value: { type: "classVariant", variant: "chartLegendIcon" },
                        },
                      ],
                    },
                    {
                      type: "primitive",
                      component: "chart",
                      part: "LegendSwatch",
                      selfClosing: true,
                      attrs: [
                        {
                          name: "class",
                          value: { type: "classVariant", variant: "chartLegendSwatch" },
                        },
                      ],
                    },
                    {
                      type: "primitive",
                      component: "chart",
                      part: "LegendLabel",
                      selfClosing: true,
                    },
                  ],
                },
              ],
            },
          ],
        },
      ],
    },
  ],
};
