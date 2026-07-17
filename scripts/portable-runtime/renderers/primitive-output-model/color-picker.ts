import type {
  PrimitiveAttributeContract,
  PrimitiveCssVariableContract,
  PrimitiveEscapeHatchContract,
  PrimitiveInitialMarkupContract,
  PrimitiveInitialStateProjectionContract,
  PrimitivePropContract,
  PrimitiveRuntimeOptionLifecycle,
} from "../../contracts/primitive/types.js";
export const COLOR_PICKER_PART_NAMES = [
  "root",
  "label",
  "control",
  "valueInput",
  "valueSwatch",
  "valueText",
  "area",
  "areaBackground",
  "areaThumb",
  "areaInput",
  "channelSlider",
  "channelSliderTrack",
  "channelSliderThumb",
  "channelSliderInput",
  "channelInput",
  "formatSelect",
  "formatControl",
  "transparencyGrid",
  "swatchGroup",
  "swatch",
  "eyeDropperTrigger",
  "clear",
  "hiddenInput",
] as const;

export type AdapterColorPickerPartName = (typeof COLOR_PICKER_PART_NAMES)[number];

export type AdapterColorPickerPart = {
  defaultElement: string;
  discoveryAttribute: string;
  initialAttributes: readonly PrimitiveAttributeContract[];
  namespaceKey: string;
  publicRef: boolean;
  role?: string;
};

export type AdapterColorPickerState = {
  controlledProp?: string;
  controlledStateSync?: "custom-event" | "imperative" | "unsupported";
  defaultProp?: string;
  initialAttribute?: string;
  name: "format" | "value";
  runtimeGetter?: string;
  runtimeSetter?: string;
  valueType: string;
};

export type AdapterColorPickerEvent = {
  callbackProp: string;
  callbackTiming?: "after-state-commit" | "before-state-commit";
  cancelable: boolean;
  detailsType: string;
  domEvent: string;
  emitsFrom: string;
  name: "formatChange" | "valueChange" | "valueCommitted";
  valueProperty: string;
  valueType: string;
};

export type AdapterColorPickerSetter = {
  method: string;
  options?: Readonly<Record<string, boolean | number | string>>;
  prop?: string;
  props?: readonly string[];
  stateModel?: string;
  suppressesEmit: boolean;
};

/**
 * Target-neutral Color Picker family consumed by target-local projections.
 * It intentionally contains adapter facts only: no parsing, color math, state
 * transitions, pointer calculations, or framework source syntax.
 */
export type AdapterColorPickerFacts = {
  component: "color-picker";
  controlledness: {
    fixedAtCreation: true;
    refreshBeforeSync: true;
    states: Record<"format" | "value", AdapterColorPickerState>;
  };
  cssVariables: readonly PrimitiveCssVariableContract[];
  displayName: string;
  escapeHatch: PrimitiveEscapeHatchContract;
  events: Record<"formatChange" | "valueChange" | "valueCommitted", AdapterColorPickerEvent>;
  exports: {
    namespace: "ColorPicker";
    parts: Record<AdapterColorPickerPartName, string>;
    runtimeFacades: {
      importSource: "@starwind-ui/runtime/color-picker";
      types: readonly string[];
      values: readonly string[];
    };
  };
  form: {
    fieldIntegration: true;
    hiddenInput: { part: "hiddenInput"; type: "text" };
    props: readonly string[];
    soleSubmissionPart: "hiddenInput";
  };
  initialMarkup: readonly PrimitiveInitialMarkupContract[];
  initialStateProjection: PrimitiveInitialStateProjectionContract;
  optionLifecycles: Readonly<Record<string, PrimitiveRuntimeOptionLifecycle>>;
  parts: Record<AdapterColorPickerPartName, AdapterColorPickerPart>;
  props: Readonly<
    Record<
      string,
      {
        defaultValue?: string;
        kind: PrimitivePropContract["kind"];
        name: string;
        required?: boolean;
        targets: readonly string[];
        type: string;
      }
    >
  >;
  runtime: {
    destroys: true;
    factory: "createColorPicker";
    importSource: "@starwind-ui/runtime/color-picker";
    optionProps: readonly string[];
    rootPart: "root";
  };
  runtimeBoundary: readonly string[];
  setters: readonly AdapterColorPickerSetter[];
};

export type AdapterColorPickerComponentProjection = {
  facts: AdapterColorPickerFacts;
  kind: "color-picker";
  part: AdapterColorPickerPartName;
};

export type AdapterColorPickerIndexProjection = {
  facts: AdapterColorPickerFacts;
  kind: "color-picker";
};

export function assertColorPickerFamilyProjected(
  model: { files: readonly unknown[] },
  target: string,
): void {
  const unprojected = model.files.some(
    (file) =>
      getFamilyKind(file) === "color-picker" || getComponentFamilyKind(file) === "color-picker",
  );
  if (unprojected) {
    throw new Error(
      `${target} must explicitly project the Color Picker output family before printing.`,
    );
  }
}

function getFamilyKind(value: unknown): unknown {
  return isRecord(value) && isRecord(value.family) ? value.family.kind : undefined;
}

function getComponentFamilyKind(value: unknown): unknown {
  if (!isRecord(value) || !isRecord(value.component)) return undefined;
  return getFamilyKind(value.component);
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}
