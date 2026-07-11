import type { RuntimeAdapterContract } from "../types.js";

export const carouselRuntimeAdapterContract = {
  component: "carousel",
  category: "viewport-measurement",
  displayName: "Carousel",
  runtime: {
    factory: "createCarousel",
    importSource: "@starwind-ui/runtime/carousel",
    rootPart: "root",
    optionProps: ["orientation", "opts", "plugins", "setApi"],
    optionPropLifecycles: {
      orientation: "refresh-required",
      opts: "refresh-required",
      plugins: "refresh-required",
      setApi: "constructor-only",
    },
    destroys: true,
  },
  parts: [
    {
      name: "root",
      defaultElement: "div",
      discoveryAttribute: "data-sw-carousel",
      forwardsRef: true,
      ownsRuntime: true,
      role: "region",
      initialAttributes: [
        { name: "role", source: "constant", value: "region" },
        { name: "aria-roledescription", source: "constant", value: "carousel" },
        { name: "data-axis", source: "prop" },
        { name: "data-opts", source: "prop" },
        { name: "data-auto-init", source: "prop" },
      ],
    },
    {
      name: "viewport",
      defaultElement: "div",
      discoveryAttribute: "data-sw-carousel-viewport",
      forwardsRef: true,
    },
    {
      name: "container",
      defaultElement: "div",
      discoveryAttribute: "data-sw-carousel-container",
      forwardsRef: true,
    },
    {
      name: "item",
      defaultElement: "div",
      discoveryAttribute: "data-sw-carousel-item",
      forwardsRef: true,
      role: "group",
      initialAttributes: [
        { name: "role", source: "constant", value: "group" },
        { name: "aria-roledescription", source: "constant", value: "slide" },
      ],
    },
    {
      name: "previous",
      defaultElement: "button",
      discoveryAttribute: "data-sw-carousel-previous",
      forwardsRef: true,
      initialAttributes: [
        { name: "type", source: "constant", value: "button" },
        { name: "aria-disabled", source: "state" },
        { name: "data-disabled", source: "state" },
      ],
    },
    {
      name: "next",
      defaultElement: "button",
      discoveryAttribute: "data-sw-carousel-next",
      forwardsRef: true,
      initialAttributes: [
        { name: "type", source: "constant", value: "button" },
        { name: "aria-disabled", source: "state" },
        { name: "data-disabled", source: "state" },
      ],
    },
  ],
  props: [
    {
      defaultValue: '"horizontal"',
      name: "orientation",
      kind: "option",
      targets: ["root"],
      type: '"horizontal" | "vertical"',
    },
    {
      defaultValue: "{}",
      name: "opts",
      kind: "option",
      targets: ["root"],
      type: 'CarouselOptions["opts"]',
    },
    {
      name: "plugins",
      kind: "option",
      targets: ["root"],
      type: 'CarouselOptions["plugins"]',
      unsupportedTargets: ["astro"],
    },
    {
      name: "setApi",
      kind: "callback",
      targets: ["root"],
      type: '(api: CarouselInstance["api"]) => void',
      unsupportedTargets: ["astro"],
    },
    {
      defaultValue: "true",
      name: "autoInit",
      kind: "option",
      targets: ["root"],
      type: "boolean",
      unsupportedTargets: ["react"],
    },
  ],
  refs: [
    { part: "root", public: true },
    { part: "viewport", public: true },
    { part: "container", public: true },
    { part: "item", public: true },
    { part: "previous", public: true },
    { part: "next", public: true },
  ],
  initialMarkup: [
    {
      part: "root",
      attributes: [
        "data-sw-carousel",
        "role",
        "aria-roledescription",
        "data-axis",
        "data-opts",
        "data-auto-init",
      ],
      reason:
        "The carousel root needs region semantics, orientation, options, and optional auto-init control before the Embla runtime attaches.",
    },
    {
      part: "viewport",
      attributes: ["data-sw-carousel-viewport"],
      reason: "Embla needs a viewport element to measure visible slides.",
    },
    {
      part: "container",
      attributes: ["data-sw-carousel-container"],
      reason: "Embla uses the container as the translated slide rail.",
    },
    {
      part: "item",
      attributes: ["data-sw-carousel-item", "role", "aria-roledescription"],
      reason: "Carousel items need a stable marker and slide semantics for generated anatomy.",
    },
    {
      part: "previous",
      attributes: ["data-sw-carousel-previous", "type", "aria-disabled", "data-disabled"],
      reason:
        "The previous control needs a discovery marker and safe button type before hydration.",
    },
    {
      part: "next",
      attributes: ["data-sw-carousel-next", "type", "aria-disabled", "data-disabled"],
      reason: "The next control needs a discovery marker and safe button type before hydration.",
    },
  ],
  frameworkNotes: {
    astro: [
      "Render static carousel anatomy and self-initialize unless autoInit is false; plugin use remains an imperative createCarousel escape hatch.",
    ],
    react: [
      "Create the runtime controller once, pass opts/plugins/setApi at construction, and reInit when orientation, opts, or plugins change.",
    ],
  },
  escapeHatches: [
    {
      affectedFrameworks: ["astro", "react", "solid", "svelte", "vue"],
      boundary:
        "The component template owns static Embla anatomy, initial orientation/options attributes, React setApi refs, and Astro auto-init skipping; the runtime owns Embla creation, controls, keyboard navigation, option forwarding, plugins, disabled control state, and cleanup.",
      contractOwnedFacts: [
        "component id",
        "display name",
        "runtime factory/import",
        "root/viewport/container/item/previous/next parts and discovery attributes",
        "orientation, opts, plugins, setApi, and autoInit option props",
        "initial root/control accessibility attributes",
      ],
      demotionCriteria:
        "Demote when a generic viewport-measurement template can express third-party imperative engine setup, plugin forwarding, and framework-specific API callbacks across adapters.",
      reason:
        "Carousel is backed by Embla core and needs a bounded component renderer for plugin and API escape hatches.",
      tests: [
        "packages/runtime/src/components/carousel/carousel.browser.test.ts",
        "scripts/portable-runtime/tests/generator-structure.test.ts",
        "scripts/portable-runtime/tests/generate-astro-wrappers.test.ts",
        "scripts/portable-runtime/tests/generate-react-wrappers.test.ts",
      ],
    },
  ],
} as const satisfies RuntimeAdapterContract;
