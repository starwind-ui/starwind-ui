import type { RuntimeAdapterContract } from "../types.js";

export const dropzoneRuntimeAdapterContract = {
  component: "dropzone",
  category: "form-value-control",
  displayName: "Dropzone",
  runtime: {
    factory: "createDropzone",
    importSource: "@starwind-ui/runtime/dropzone",
    rootPart: "root",
    optionProps: ["disabled", "isUploading", "onFilesChange"],
    optionPropLifecycles: {
      disabled: "setter-backed",
      isUploading: "setter-backed",
      onFilesChange: "constructor-only",
    },
    destroys: true,
  },
  parts: [
    {
      name: "root",
      defaultElement: "label",
      discoveryAttribute: "data-sw-dropzone",
      forwardsRef: true,
      ownsRuntime: true,
      role: "button",
      initialAttributes: [
        { name: "data-disabled", source: "prop" },
        { name: "data-drag-active", source: "state" },
        { name: "data-has-files", source: "state" },
        { name: "data-is-uploading", source: "prop" },
        { name: "aria-disabled", source: "prop" },
        { name: "role", source: "constant", value: "button" },
        { name: "tabindex", source: "state" },
      ],
    },
    {
      name: "input",
      defaultElement: "input",
      discoveryAttribute: "data-sw-dropzone-input",
      forwardsRef: true,
      initialAttributes: [
        { name: "type", source: "constant", value: "file" },
        { name: "tabindex", source: "constant", value: "-1" },
        { name: "class", source: "constant", value: "sr-only" },
        { name: "data-disabled", source: "prop" },
        { name: "disabled", source: "prop" },
      ],
    },
    {
      name: "uploadIndicator",
      defaultElement: "div",
      discoveryAttribute: "data-sw-dropzone-upload-indicator",
      forwardsRef: true,
      initialAttributes: [{ name: "data-is-uploading", source: "state" }],
    },
    {
      name: "loadingIndicator",
      defaultElement: "div",
      discoveryAttribute: "data-sw-dropzone-loading-indicator",
      forwardsRef: true,
      initialAttributes: [
        { name: "data-is-uploading", source: "state" },
        { name: "hidden", source: "state" },
      ],
    },
    {
      name: "filesList",
      defaultElement: "div",
      discoveryAttribute: "data-sw-dropzone-files-list",
      forwardsRef: true,
      initialAttributes: [{ name: "data-has-files", source: "state" }],
    },
  ],
  props: [
    { defaultValue: "false", name: "disabled", kind: "option", type: "boolean" },
    {
      defaultValue: "false",
      name: "isUploading",
      kind: "control",
      targets: ["root", "uploadIndicator", "loadingIndicator"],
      type: "boolean",
    },
    { name: "onFilesChange", kind: "callback", type: "DropzoneFilesChangeDetails" },
    { name: "accept", kind: "attribute", targets: ["input"], type: "string" },
    { name: "multiple", kind: "attribute", targets: ["input"], type: "boolean" },
    { name: "name", kind: "attribute", targets: ["input"], type: "string" },
    { name: "required", kind: "attribute", targets: ["input"], type: "boolean" },
  ],
  stateModels: [
    {
      name: "uploading",
      controlledProp: "isUploading",
      initialAttribute: "data-is-uploading",
      runtimeGetter: "getUploading",
      runtimeSetter: "setUploading",
      valueType: "boolean",
      controlledStateSync: "custom-event",
    },
  ],
  events: [
    {
      name: "filesChange",
      callbackProp: "onFilesChange",
      detailsType: "DropzoneFilesChangeDetails",
      domEvent: "starwind:files-change",
      emitsFrom: "root",
      valueProperty: "files",
      valueType: "File[]",
    },
  ],
  setters: [
    { method: "setDisabled", prop: "disabled" },
    { method: "setUploading", prop: "isUploading" },
  ],
  form: {
    hiddenInput: {
      part: "input",
      type: "file",
    },
    props: ["accept", "multiple", "name", "required"],
  },
  refs: [
    { part: "root", public: true },
    { part: "input", public: true },
    { part: "uploadIndicator", public: true },
    { part: "loadingIndicator", public: true },
    { part: "filesList", public: true },
  ],
  initialMarkup: [
    {
      part: "root",
      attributes: [
        "data-sw-dropzone",
        "data-disabled",
        "data-drag-active",
        "data-has-files",
        "data-is-uploading",
        "aria-disabled",
        "role",
        "tabindex",
      ],
      reason:
        "The visible drop target needs button semantics, disabled state, drag state, file presence, and upload state before hydration.",
    },
    {
      part: "input",
      attributes: [
        "data-sw-dropzone-input",
        "type",
        "tabindex",
        "class",
        "data-disabled",
        "disabled",
      ],
      reason:
        "The native file input must be present for form compatibility while remaining visually hidden and out of the tab order.",
    },
    {
      part: "uploadIndicator",
      attributes: ["data-sw-dropzone-upload-indicator", "data-is-uploading"],
      reason:
        "The upload indicator reflects the initial uploading state before the runtime attaches.",
    },
    {
      part: "loadingIndicator",
      attributes: ["data-sw-dropzone-loading-indicator", "data-is-uploading", "hidden"],
      reason: "The loading indicator starts hidden unless the dropzone is already uploading.",
    },
    {
      part: "filesList",
      attributes: ["data-sw-dropzone-files-list", "data-has-files"],
      reason: "The files list starts empty and receives file presence state from the runtime.",
    },
  ],
  frameworkNotes: {
    astro: [
      "Render the file input and indicator/list parts statically; runtime owns drag state, keyboard activation, file list rendering, and upload-state synchronization.",
    ],
    react: [
      "Create the runtime controller once, bridge disabled and uploading changes through setters, and surface file changes through onFilesChange.",
    ],
  },
  escapeHatches: [
    {
      affectedFrameworks: ["astro", "react", "solid", "svelte", "vue"],
      boundary:
        "The component template still owns root/input/indicator/list composition and React callback refs; the runtime owns file input setup, keyboard activation, drag/drop state, dropped-file assignment, selected file tracking, uploading state, and file-list rendering.",
      contractOwnedFacts: [
        "component id",
        "display name",
        "runtime factory/import",
        "root/input/uploadIndicator/loadingIndicator/filesList parts and discovery attributes",
        "isUploading control prop and setter",
        "disabled option prop and setter",
        "files-change event/callback/details value",
        "file input form props",
        "initial root/input/indicator/list attributes",
      ],
      demotionCriteria:
        "Demote when a shared file-input/drop-control template can express native file input refs, external upload state, drag/drop events, and generated file-list rendering across frameworks.",
      reason:
        "Dropzone is Starwind-native rather than a Base UI mirror, so the first slice keeps a bounded component renderer while the generic file-control shape proves itself.",
      tests: [
        "packages/runtime/src/components/dropzone/dropzone.browser.test.ts",
        "scripts/portable-runtime/tests/generator-structure.test.ts",
        "scripts/portable-runtime/tests/generate-astro-wrappers.test.ts",
        "scripts/portable-runtime/tests/generate-react-wrappers.test.ts",
      ],
    },
  ],
} as const satisfies RuntimeAdapterContract;
