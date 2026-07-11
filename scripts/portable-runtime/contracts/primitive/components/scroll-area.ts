import type { RuntimeAdapterContract } from "../types.js";

export const scrollAreaRuntimeAdapterContract = {
  component: "scroll-area",
  category: "viewport-measurement",
  displayName: "ScrollArea",
  runtime: {
    factory: "createScrollArea",
    importSource: "@starwind-ui/runtime/scroll-area",
    rootPart: "root",
    optionProps: ["overflowEdgeThreshold"],
    optionPropLifecycles: {
      overflowEdgeThreshold: "refresh-required",
    },
    destroys: true,
  },
  parts: [
    {
      name: "root",
      defaultElement: "div",
      discoveryAttribute: "data-sw-scroll-area",
      forwardsRef: true,
      ownsRuntime: true,
      role: "presentation",
      initialAttributes: [{ name: "data-overflow-edge-threshold", source: "prop" }],
    },
    {
      name: "viewport",
      defaultElement: "div",
      discoveryAttribute: "data-sw-scroll-area-viewport",
      forwardsRef: true,
      role: "presentation",
      initialAttributes: [
        { name: "tabindex", source: "constant", value: "-1" },
        { name: "tabIndex", source: "constant", value: "-1" },
        { name: "style", source: "constant", value: "overflow: scroll;" },
      ],
    },
    {
      name: "content",
      defaultElement: "div",
      discoveryAttribute: "data-sw-scroll-area-content",
      forwardsRef: true,
      role: "presentation",
    },
    {
      name: "scrollbar",
      defaultElement: "div",
      discoveryAttribute: "data-sw-scroll-area-scrollbar",
      forwardsRef: true,
      initialAttributes: [
        { name: "data-keep-mounted", source: "prop" },
        { name: "data-orientation", source: "prop" },
        { name: "aria-hidden", source: "constant", value: "true" },
      ],
    },
    {
      name: "thumb",
      defaultElement: "div",
      discoveryAttribute: "data-sw-scroll-area-thumb",
      forwardsRef: true,
    },
    {
      name: "corner",
      defaultElement: "div",
      discoveryAttribute: "data-sw-scroll-area-corner",
      forwardsRef: true,
      initialAttributes: [{ name: "aria-hidden", source: "constant", value: "true" }],
    },
  ],
  props: [
    {
      name: "overflowEdgeThreshold",
      kind: "option",
      targets: ["root"],
      type: `number | Partial<{
  xStart: number;
  xEnd: number;
  yStart: number;
  yEnd: number;
}>`,
    },
    {
      defaultValue: "false",
      name: "keepMounted",
      kind: "rendering",
      targets: ["scrollbar"],
      type: "boolean",
    },
    {
      defaultValue: '"vertical"',
      name: "orientation",
      kind: "option",
      targets: ["scrollbar"],
      type: '"horizontal" | "vertical"',
    },
  ],
  presence: {
    keepMountedProp: "keepMounted",
    initialHiddenParts: [],
    unmountPolicy: "runtime-owned-visibility",
  },
  refs: [
    { part: "root", public: true },
    { part: "viewport", public: true },
    { part: "content", public: true },
    { part: "scrollbar", public: true },
    { part: "thumb", public: true },
    { part: "corner", public: true },
  ],
  initialMarkup: [
    {
      part: "root",
      attributes: ["data-sw-scroll-area", "data-overflow-edge-threshold", "role"],
      reason:
        "The root needs a stable discovery marker and optional overflow edge threshold before measurement starts.",
    },
    {
      part: "viewport",
      attributes: ["data-sw-scroll-area-viewport", "role", "tabindex", "style"],
      reason:
        "The viewport must be scrollable and initially unfocusable until runtime detects overflow.",
    },
    {
      part: "content",
      attributes: ["data-sw-scroll-area-content", "role"],
      reason: "The content element is the resize and mutation target for scroll measurement.",
    },
    {
      part: "scrollbar",
      attributes: [
        "data-sw-scroll-area-scrollbar",
        "data-keep-mounted",
        "data-orientation",
        "aria-hidden",
      ],
      reason:
        "Scrollbars need orientation and keep-mounted hints before the runtime measures overflow.",
    },
    {
      part: "thumb",
      attributes: ["data-sw-scroll-area-thumb"],
      reason: "Thumbs are measured and positioned by the runtime for each scrollbar.",
    },
    {
      part: "corner",
      attributes: ["data-sw-scroll-area-corner", "aria-hidden"],
      reason:
        "The corner is presentation-only and sized by the runtime when both scrollbars are present.",
    },
  ],
  frameworkNotes: {
    astro: [
      "Render presentation-only scroll anatomy and self-initialize; runtime owns overflow detection, visibility, and thumb geometry.",
    ],
    react: [
      "Create the controller in an effect; structural changes require runtime refresh but current wrapper preserves the initial static anatomy.",
    ],
  },
} as const satisfies RuntimeAdapterContract;
