import {
  visitorBars,
  visitorConfig,
  visitorData,
} from "../../../../../packages/runtime/tests/components/chart/fixtures";

/**
 * How parts nest inside their root, by family. A family that is not listed renders all of its parts
 * as flat children of the root. List a family only when a part reads context from a parent part.
 * Each entry maps a part to the parent part it renders under.
 */
const menuParents = {
  checkboxItemIndicator: "checkboxItem",
  radioItem: "radioGroup",
  radioItemIndicator: "radioItem",
  submenuTrigger: "submenuRoot",
};

const collectionParents = {
  popup: "positioner",
  list: "popup",
  item: "list",
  itemIndicator: "item",
  itemText: "item",
};

export const partParents: Record<string, Record<string, string>> = {
  accordion: { header: "item", trigger: "header", panel: "item" },
  "color-picker": {
    areaBackground: "area",
    areaThumb: "area",
    areaInput: "area",
    channelSliderTrack: "channelSlider",
    channelSliderThumb: "channelSlider",
    channelSliderInput: "channelSlider",
  },
  combobox: collectionParents,
  "context-menu": menuParents,
  menu: menuParents,
  "navigation-menu": { item: "list", trigger: "item", content: "item", icon: "trigger" },
  select: collectionParents,
  // Tooltip content parts read their row, and legend parts read their key, from a parent part.
  chart: {
    tooltipLabel: "tooltipContent",
    tooltipItems: "tooltipContent",
    tooltipItem: "tooltipItems",
    tooltipIndicator: "tooltipItem",
    tooltipIcon: "tooltipItem",
    tooltipName: "tooltipItem",
    tooltipValue: "tooltipItem",
    legendItems: "legend",
    legendItem: "legendItems",
    legendSwatch: "legendItem",
    legendIcon: "legendItem",
    legendLabel: "legendItem",
  },
};

/**
 * Root props that a family needs before it renders at all. A chart root renders only with a chart
 * source, its data and a valid config, so a probe of one prop replaces one of these.
 */
export const baseRootProps: Record<string, () => Record<string, unknown>> = {
  // One icon key and one swatch key, so both legend marks render.
  chart: () => ({
    chart: visitorBars,
    data: visitorData(),
    config: {
      ...visitorConfig,
      desktop: { ...visitorConfig.desktop, icon: { paths: ["M0 0L10 10"] } },
    },
  }),
};

/** Part props that a family needs, by part. A legend item names a config key that has an icon. */
export const basePartProps: Record<string, Record<string, Record<string, unknown>>> = {
  chart: { legendItem: { value: "desktop" } },
};

/**
 * Families whose framework parts carry their public `data-slot` and no `data-sw-*` hook. Only the
 * chart surface has a Runtime hook, so the check finds the other chart parts by `data-slot`.
 */
export const slotIdentifiedFamilies: readonly string[] = ["chart"];

/**
 * Root props that only work together. The full probe set can throw, such as on a probe locale, so
 * these render on their own.
 */
export const togetherRootProps: Record<string, Record<string, unknown>[]> = {
  // An empty value is the only one that a required Color Picker can reject.
  "color-picker": [{ allowEmpty: true, required: true }],
};

/** Parts that must not render together with the rest of the family's tree. */
export const skippedParts: Record<string, string[]> = {};

/**
 * One more tree of a family: a subset of its parts under the root, with the root and part props that
 * this tree needs in place of the base props. Each listed part renders only in its own tree, and
 * its props are probed there. The parts that no tree lists render in the base tree with the base
 * props. The root and the `shared` parts render in every tree that names them, and their props are
 * probed in the base tree.
 */
export type FamilyComposition = {
  name: string;
  parts: readonly string[];
  /** Base tree parts that this tree also renders, such as the surface that holds the drawing. */
  shared?: readonly string[];
  rootProps: () => Record<string, unknown>;
  partProps?: Record<string, Record<string, unknown>>;
};

// A parts chart draws into the surface.
const chartShared = ["surface"];

// Pie and radial bar slices take their colors from config by the `nameKey` value.
const sliceData = () => [
  { device: "desktop", visitors: 275 },
  { device: "mobile", visitors: 200 },
];

/**
 * Chart parts describe the chart in place of a chart module, and a polar mark cannot share a chart
 * with another mark kind. Each chart kind is one parts tree.
 */
export const familyCompositions: Record<string, FamilyComposition[]> = {
  chart: [
    {
      name: "cartesian parts",
      parts: ["bar", "line", "area", "xAxis", "yAxis", "grid", "linearGradient"],
      shared: chartShared,
      rootProps: () => ({ data: visitorData(), config: visitorConfig }),
      // The probe sets a value other than the contract default. Base values differ from both, or
      // stay at the default, so each probe changes the drawing.
      partProps: {
        bar: { dataKey: "desktop" },
        line: { dataKey: "mobile", type: "linear" },
        area: { dataKey: "desktop", type: "linear" },
        xAxis: { dataKey: "month" },
        yAxis: { tickCount: 2 },
        grid: {},
        // The chart draws each gradient in its defs, so a probed prop changes the drawing. TanStack
        // clamps a coordinate to 1, so x2 starts below the probe value.
        linearGradient: { id: "fillDesktop", x2: 0, stops: [{ offset: 0, stopColor: "red" }] },
      },
    },
    {
      name: "radar parts",
      parts: ["radar", "polarGrid", "polarAngleAxis"],
      shared: chartShared,
      rootProps: () => ({ data: visitorData(), config: visitorConfig }),
      partProps: {
        radar: { dataKey: "desktop" },
        polarAngleAxis: { dataKey: "month" },
        polarGrid: {},
      },
    },
    {
      name: "pie parts",
      parts: ["pie", "label"],
      shared: chartShared,
      rootProps: () => ({ data: sliceData(), config: visitorConfig }),
      // The center label sits in the hole of a donut. The slices have outside labels, so a probe of
      // labelLine changes the drawing, and an offset other than the default, so a probe of label
      // does too.
      partProps: {
        pie: {
          dataKey: "visitors",
          nameKey: "device",
          innerRadius: 60,
          label: { position: "outside", offset: 10 },
        },
        label: { value: "Visitors" },
      },
    },
    {
      name: "radial bar parts",
      parts: ["radialBar"],
      shared: chartShared,
      rootProps: () => ({ data: sliceData(), config: visitorConfig }),
      partProps: { radialBar: { dataKey: "visitors", nameKey: "device" } },
    },
  ],
};
