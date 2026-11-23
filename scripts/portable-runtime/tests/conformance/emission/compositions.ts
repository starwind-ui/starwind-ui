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
