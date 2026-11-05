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
};

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
