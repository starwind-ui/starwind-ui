import type { RuntimeAdapterContract } from "../types.js";

export const avatarRuntimeAdapterContract = {
  component: "avatar",
  category: "static-semantic",
  displayName: "Avatar",
  runtime: {
    factory: "createAvatar",
    importSource: "@starwind-ui/runtime/avatar",
    rootPart: "root",
    destroys: true,
  },
  parts: [
    {
      name: "root",
      defaultElement: "span",
      discoveryAttribute: "data-sw-avatar",
      forwardsRef: true,
      ownsRuntime: true,
      initialAttributes: [{ name: "data-image-loading-status", source: "state" }],
    },
    {
      name: "image",
      defaultElement: "img",
      discoveryAttribute: "data-sw-avatar-image",
      forwardsRef: true,
      initialAttributes: [{ name: "data-image-loading-status", source: "state" }],
    },
    {
      name: "fallback",
      defaultElement: "span",
      discoveryAttribute: "data-sw-avatar-fallback",
      forwardsRef: true,
      initialAttributes: [
        { name: "data-delay", source: "prop" },
        { name: "data-image-loading-status", source: "state" },
        { name: "hidden", source: "state" },
      ],
    },
  ],
  props: [
    { name: "alt", kind: "attribute", required: true, targets: ["image"], type: "string" },
    { name: "image", kind: "rendering", targets: ["image"], type: "ImageMetadata" },
    { name: "src", kind: "attribute", targets: ["image"], type: "string" },
    { name: "delay", kind: "option", targets: ["fallback"], type: "number" },
    {
      name: "onLoadingStatusChange",
      kind: "callback",
      targets: ["image"],
      type: "AvatarLoadingStatusChangeDetails",
    },
  ],
  stateModels: [
    {
      name: "imageLoadingStatus",
      initialAttribute: "data-image-loading-status",
      runtimeGetter: "getImageLoadingStatus",
      runtimeSetter: "setImageLoadingStatus",
      valueType: "AvatarImageLoadingStatus",
      controlledStateSync: "unsupported",
    },
  ],
  events: [
    {
      name: "loadingStatusChange",
      callbackTiming: "after-state-commit",
      cancelable: false,
      callbackProp: "onLoadingStatusChange",
      detailsType: "AvatarLoadingStatusChangeDetails",
      domEvent: "starwind:loading-status-change",
      emitsFrom: "root",
      valueProperty: "status",
      valueType: "AvatarImageLoadingStatus",
    },
  ],
  presence: {
    initialHiddenParts: ["image"],
    initialVisibility: [
      {
        delivery: "markup",
        hidden: true,
        mechanism: "css-visibility",
        part: "image",
        targets: ["astro", "react", "vue"],
      },
      {
        condition: "delay !== undefined",
        delivery: "markup",
        hidden: true,
        part: "fallback",
        targets: ["astro"],
      },
      {
        condition: "delay !== undefined",
        delivery: "ref-initializer",
        hidden: true,
        part: "fallback",
        targets: ["react"],
      },
    ],
    unmountPolicy: "runtime-owned-visibility",
  },
  refs: [
    { part: "root", public: true },
    { part: "image", public: true },
    { part: "fallback", public: true },
  ],
  initialMarkup: [
    {
      part: "root",
      attributes: ["data-sw-avatar", "data-image-loading-status"],
      reason:
        "The root needs an initial loading-status marker so image and fallback state can style before the controller attaches.",
    },
    {
      part: "image",
      attributes: ["data-sw-avatar-image", "data-image-loading-status"],
      reason:
        "Images start visibility-hidden so they retain a layout box and remain eligible for native lazy loading until the Runtime confirms they loaded.",
    },
    {
      part: "fallback",
      attributes: ["data-sw-avatar-fallback", "data-delay", "data-image-loading-status"],
      reason: "Fallbacks carry optional delay metadata and may start hidden while the timer runs.",
    },
  ],
  frameworkNotes: {
    astro: [
      "Render static image/fallback markup and let the runtime own loading-status and visibility after hydration.",
    ],
    react: [
      "Create the controller in an effect, subscribe image callbacks from the nearest root event, and let the Runtime own CSS visibility after initial markup.",
    ],
  },
} as const satisfies RuntimeAdapterContract;
