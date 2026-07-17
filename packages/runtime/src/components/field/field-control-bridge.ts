import { readBooleanAttribute } from "../../internal/dom";

export type FieldControlKind =
  | "checkbox"
  | "checkbox-group"
  | "color-picker"
  | "combobox"
  | "dropzone"
  | "input"
  | "input-otp"
  | "native"
  | "radio"
  | "radio-group"
  | "select"
  | "slider"
  | "switch"
  | "unknown";

export type FieldNativeControl = HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement;

export type FieldControlValidityKey =
  | "badInput"
  | "customError"
  | "patternMismatch"
  | "rangeOverflow"
  | "rangeUnderflow"
  | "stepMismatch"
  | "tooLong"
  | "tooShort"
  | "typeMismatch"
  | "valueMissing";

export type FieldControlCustomValidity = {
  valid: boolean | null;
} & Partial<Record<FieldControlValidityKey, boolean>>;

export type FieldControlConnectOptions = {
  disabled: boolean;
  name?: string;
  shouldSyncName: boolean;
};

type FieldControlConnectRequest = FieldControlConnectOptions & {
  onConnected?: () => void;
  signal?: AbortSignal;
};

export type FieldControlNativeControlsOptions = {
  includeHidden?: boolean;
};

export type FieldControlBridge = {
  kind: FieldControlKind;
  connect?(control: HTMLElement, options: FieldControlConnectOptions): void;
  getAccessibleSurfaces?(fieldRoot: HTMLElement, control: HTMLElement): HTMLElement[];
  getFocusTarget?(control: HTMLElement): HTMLElement | undefined;
  getLabelSurfaces?(fieldRoot: HTMLElement, control: HTMLElement): HTMLElement[];
  getNativeControls?(
    control: HTMLElement,
    options?: FieldControlNativeControlsOptions,
  ): FieldNativeControl[];
  getStateSurfaces?(fieldRoot: HTMLElement, control: HTMLElement): HTMLElement[];
  readCustomValidity?(control: HTMLElement, value: string): FieldControlCustomValidity | undefined;
  readValue?(control: HTMLElement): string | undefined;
};

const FORM_CONTROL_SURFACE_SELECTORS = [
  "[data-sw-select-trigger]",
  "[data-sw-combobox-input]",
  "[data-sw-combobox-input-group]",
  "[data-sw-dropzone]",
  "[data-sw-checkbox]",
  "[data-sw-radio]",
  "[data-sw-slider-control]",
  "[data-sw-slider-track]",
  "[data-sw-slider-indicator]",
  "[data-sw-slider-thumb]",
  "[data-sw-input-otp-slot]",
].join(",");
const FORM_CONTROL_ACCESSIBLE_SURFACE_SELECTORS = [
  "[data-sw-select-trigger]",
  "[data-sw-combobox-input]",
  "[data-sw-dropzone]",
  "[data-sw-checkbox]",
  "[data-sw-radio]",
  "[data-sw-slider-thumb]",
].join(",");

const bridges = new Map<FieldControlKind, FieldControlBridge>();
const lazyBridgeLoaders = new Map<FieldControlKind, () => Promise<unknown>>();
const pendingLazyBridgeLoads = new Map<FieldControlKind, Promise<unknown>>();
const colorPickerBridgeParts = new WeakMap<HTMLElement, Element[]>();
const colorPickerAuthoredButtonDisabled = new WeakMap<HTMLButtonElement, boolean>();
const colorPickerRuntimeButtonDisabled = new WeakMap<HTMLButtonElement, boolean>();
const colorPickerAuthoredAriaDisabled = new WeakMap<HTMLElement, string | null>();
const colorPickerRuntimeAriaDisabled = new WeakMap<HTMLElement, string | null>();
const colorPickerAuthoredAriaReadOnly = new WeakMap<HTMLElement, string | null>();
const colorPickerRuntimeAriaReadOnly = new WeakMap<HTMLElement, string | null>();
const colorPickerAuthoredDataDisabled = new WeakMap<HTMLElement, boolean>();
const colorPickerRuntimeDataDisabled = new WeakMap<HTMLElement, boolean>();
const colorPickerAuthoredDataReadOnly = new WeakMap<HTMLElement, boolean>();
const colorPickerRuntimeDataReadOnly = new WeakMap<HTMLElement, boolean>();
const colorPickerBridgeState = new WeakMap<
  HTMLElement,
  {
    disabled: boolean;
    name: string | undefined;
    readOnly: boolean;
    required: boolean;
    shouldSyncName: boolean;
  }
>();

const siblingRuntimeComponentLoaders = {
  checkbox: () => import("../checkbox"),
  "checkbox-group": () => import("../checkbox-group"),
  combobox: () => import("../combobox"),
  "color-picker": loadColorPickerFieldBridge,
  dropzone: () => import("../dropzone"),
  "input-otp": () => import("../input-otp"),
  radio: () => import("../radio"),
  "radio-group": () => import("../radio-group"),
  select: () => import("../select"),
  slider: () => import("../slider"),
  switch: () => import("../switch"),
} satisfies Record<
  Exclude<FieldControlKind, "input" | "native" | "unknown">,
  () => Promise<unknown>
>;

registerFieldControlLazyBridge("checkbox", siblingRuntimeComponentLoaders.checkbox);
registerFieldControlLazyBridge("checkbox-group", siblingRuntimeComponentLoaders["checkbox-group"]);
registerFieldControlLazyBridge("combobox", siblingRuntimeComponentLoaders.combobox);
registerFieldControlLazyBridge("color-picker", siblingRuntimeComponentLoaders["color-picker"]);
registerFieldControlLazyBridge("dropzone", siblingRuntimeComponentLoaders.dropzone);
registerFieldControlLazyBridge("input-otp", siblingRuntimeComponentLoaders["input-otp"]);
registerFieldControlLazyBridge("radio", siblingRuntimeComponentLoaders.radio);
registerFieldControlLazyBridge("radio-group", siblingRuntimeComponentLoaders["radio-group"]);
registerFieldControlLazyBridge("select", siblingRuntimeComponentLoaders.select);
registerFieldControlLazyBridge("slider", siblingRuntimeComponentLoaders.slider);
registerFieldControlLazyBridge("switch", siblingRuntimeComponentLoaders.switch);

export function registerFieldControlBridge(bridge: FieldControlBridge): () => void {
  const previous = bridges.get(bridge.kind);
  bridges.set(bridge.kind, bridge);

  return () => {
    if (bridges.get(bridge.kind) !== bridge) return;

    if (previous) {
      bridges.set(bridge.kind, previous);
      return;
    }

    bridges.delete(bridge.kind);
  };
}

export function getFieldControlKind(control: HTMLElement): FieldControlKind {
  if (control.hasAttribute("data-sw-color-picker")) return "color-picker";
  if (control.hasAttribute("data-sw-input") || control instanceof HTMLInputElement) return "input";
  if (control.hasAttribute("data-sw-checkbox-group")) return "checkbox-group";
  if (control.hasAttribute("data-sw-radio-group")) return "radio-group";
  if (control.hasAttribute("data-sw-combobox")) return "combobox";
  if (control.hasAttribute("data-sw-dropzone")) return "dropzone";
  if (control.hasAttribute("data-sw-checkbox")) return "checkbox";
  if (control.hasAttribute("data-sw-radio")) return "radio";
  if (control.hasAttribute("data-sw-select")) return "select";
  if (control.hasAttribute("data-sw-switch")) return "switch";
  if (control.hasAttribute("data-sw-slider")) return "slider";
  if (control.hasAttribute("data-sw-input-otp")) return "input-otp";
  if (isNativeFormControl(control)) return "native";
  return "unknown";
}

async function loadColorPickerFieldBridge(): Promise<void> {
  const { createColorPicker } = await import("../color-picker");

  registerFieldControlBridge({
    kind: "color-picker",
    connect(control, { disabled, name, shouldSyncName }) {
      const readOnly = readBooleanAttribute(control, "data-readonly");
      const required = readBooleanAttribute(control, "data-required");
      const previousParts = colorPickerBridgeParts.get(control);
      const picker = createColorPicker(control);
      const currentParts = getColorPickerBridgeParts(control);
      if (previousParts && !sameElements(previousParts, currentParts)) picker.refresh();
      colorPickerBridgeParts.set(control, getColorPickerBridgeParts(control));
      const resolvedName = shouldSyncName ? name : (control.getAttribute("data-name") ?? undefined);
      const previousState = colorPickerBridgeState.get(control);
      const hiddenInput = queryOwnedColorPickerPart<HTMLInputElement>(
        control,
        "[data-sw-color-picker-hidden-input]",
      );
      const controllerOwnedNameStable =
        !shouldSyncName && hiddenInput !== null && hiddenInput.name === (resolvedName ?? "");
      const disabledOutputDrift = hiddenInput !== null && hiddenInput.disabled !== disabled;
      if (!previousState || previousState.disabled !== disabled || disabledOutputDrift) {
        picker.setDisabled(disabled);
      }
      if (!previousState || previousState.readOnly !== readOnly) picker.setReadOnly(readOnly);
      if (!previousState || previousState.required !== required) picker.setOptions({ required });
      if (
        !controllerOwnedNameStable &&
        (!previousState ||
          previousState.name !== resolvedName ||
          previousState.shouldSyncName !== shouldSyncName ||
          (shouldSyncName && hiddenInput !== null && hiddenInput.name !== (resolvedName ?? "")))
      ) {
        picker.setName(shouldSyncName ? name : undefined);
      }
      colorPickerBridgeState.set(control, {
        disabled,
        name: resolvedName,
        readOnly,
        required,
        shouldSyncName,
      });
      syncColorPickerFallbackState(control, { disabled, readOnly });
    },
    getFocusTarget(control) {
      return (
        queryVisibleColorPickerSurface(control, [
          "[data-sw-color-picker-value-input]",
          "[data-sw-color-picker-trigger]",
          "[data-sw-color-picker-control]",
        ]) ?? control
      );
    },
    getNativeControls(control) {
      const hidden = queryOwnedColorPickerPart<HTMLInputElement>(
        control,
        "[data-sw-color-picker-hidden-input]",
      );
      return hidden ? [hidden] : [];
    },
    getLabelSurfaces(fieldRoot, control) {
      return getOwnedControlDescendants(
        fieldRoot,
        control,
        [
          "[data-sw-color-picker-value-input]",
          "[data-sw-color-picker-trigger]",
          "[data-sw-color-picker-control]",
        ].join(","),
      ).filter(
        (surface) =>
          surface.closest("[data-sw-color-picker]") === control &&
          !surface.hidden &&
          surface.getAttribute("aria-hidden") !== "true",
      );
    },
    getStateSurfaces(fieldRoot, control) {
      return getOwnedControlDescendants(
        fieldRoot,
        control,
        [
          "[data-sw-color-picker-hidden-input]",
          "[data-sw-color-picker-value-input]",
          "[data-sw-color-picker-trigger]",
          "[data-sw-color-picker-control]",
        ].join(","),
        [control],
      ).filter(
        (surface) => surface === control || surface.closest("[data-sw-color-picker]") === control,
      );
    },
    getAccessibleSurfaces(fieldRoot, control) {
      return getOwnedControlDescendants(
        fieldRoot,
        control,
        [
          "[data-sw-color-picker-hidden-input]",
          "[data-sw-color-picker-value-input]",
          "[data-sw-color-picker-trigger]",
          "[data-sw-color-picker-control]",
        ].join(","),
      ).filter((surface) => surface.closest("[data-sw-color-picker]") === control);
    },
    readValue(control) {
      return (
        queryOwnedColorPickerPart<HTMLInputElement>(control, "[data-sw-color-picker-hidden-input]")
          ?.value ??
        control.getAttribute("data-value") ??
        ""
      );
    },
  });
}

function syncColorPickerFallbackState(
  control: HTMLElement,
  state: { disabled: boolean; readOnly: boolean },
): void {
  queryOwnedColorPickerParts<HTMLElement>(
    control,
    "[data-sw-color-picker-trigger], [data-sw-color-picker-control]",
  ).forEach((surface) => {
    if (surface instanceof HTMLButtonElement) {
      const lastRuntimeDisabled = colorPickerRuntimeButtonDisabled.get(surface);
      if (lastRuntimeDisabled === undefined || surface.disabled !== lastRuntimeDisabled) {
        colorPickerAuthoredButtonDisabled.set(surface, surface.disabled);
      }
      surface.disabled = state.disabled || colorPickerAuthoredButtonDisabled.get(surface) === true;
      colorPickerRuntimeButtonDisabled.set(surface, surface.disabled);
    } else {
      syncOwnedAriaState(
        surface,
        "aria-disabled",
        state.disabled ? "true" : null,
        colorPickerAuthoredAriaDisabled,
        colorPickerRuntimeAriaDisabled,
      );
    }

    syncOwnedAriaState(
      surface,
      "aria-readonly",
      state.readOnly ? "true" : null,
      colorPickerAuthoredAriaReadOnly,
      colorPickerRuntimeAriaReadOnly,
    );
    syncOwnedDataState(
      surface,
      "data-disabled",
      state.disabled,
      colorPickerAuthoredDataDisabled,
      colorPickerRuntimeDataDisabled,
    );
    syncOwnedDataState(
      surface,
      "data-readonly",
      state.readOnly,
      colorPickerAuthoredDataReadOnly,
      colorPickerRuntimeDataReadOnly,
    );
  });
}

function syncOwnedAriaState(
  surface: HTMLElement,
  attribute: "aria-disabled" | "aria-readonly",
  runtimeValue: string | null,
  authoredValues: WeakMap<HTMLElement, string | null>,
  runtimeValues: WeakMap<HTMLElement, string | null>,
): void {
  const currentValue = surface.getAttribute(attribute);
  const previousRuntimeValue = runtimeValues.get(surface);
  if (!runtimeValues.has(surface) || currentValue !== previousRuntimeValue) {
    authoredValues.set(surface, currentValue);
  }

  const nextValue = runtimeValue ?? authoredValues.get(surface) ?? null;
  if (nextValue === null) surface.removeAttribute(attribute);
  else surface.setAttribute(attribute, nextValue);
  runtimeValues.set(surface, nextValue);
}

function syncOwnedDataState(
  surface: HTMLElement,
  attribute: "data-disabled" | "data-readonly",
  runtimeValue: boolean,
  authoredValues: WeakMap<HTMLElement, boolean>,
  runtimeValues: WeakMap<HTMLElement, boolean>,
): void {
  const currentValue = surface.hasAttribute(attribute);
  const previousRuntimeValue = runtimeValues.get(surface);
  if (!runtimeValues.has(surface) || currentValue !== previousRuntimeValue) {
    authoredValues.set(surface, currentValue);
  }

  const nextValue = runtimeValue || authoredValues.get(surface) === true;
  if (nextValue) surface.setAttribute(attribute, "");
  else surface.removeAttribute(attribute);
  runtimeValues.set(surface, nextValue);
}

function getColorPickerBridgeParts(control: HTMLElement): Element[] {
  return queryOwnedColorPickerParts(
    control,
    "[data-sw-color-picker-hidden-input], [data-sw-color-picker-value-input], [data-sw-color-picker-trigger], [data-sw-color-picker-control], [data-sw-color-picker-area], [data-sw-color-picker-area-input], [data-sw-color-picker-channel-slider], [data-sw-color-picker-channel-input], [data-sw-color-picker-channel-field], [data-sw-color-picker-format-select], [data-sw-color-picker-swatch], [data-sw-color-picker-clear], [data-sw-color-picker-eye-dropper]",
  );
}

function queryOwnedColorPickerParts<T extends Element>(
  control: HTMLElement,
  selector: string,
): T[] {
  return [...control.querySelectorAll<T>(selector)].filter(
    (candidate) => candidate.closest("[data-sw-color-picker]") === control,
  );
}

function queryOwnedColorPickerPart<T extends Element>(
  control: HTMLElement,
  selector: string,
): T | null {
  return queryOwnedColorPickerParts<T>(control, selector)[0] ?? null;
}

function sameElements(previous: readonly Element[], current: readonly Element[]): boolean {
  return (
    previous.length === current.length &&
    previous.every((element, index) => element === current[index])
  );
}

function queryVisibleColorPickerSurface(
  control: HTMLElement,
  selectors: readonly string[],
): HTMLElement | undefined {
  for (const selector of selectors) {
    const surface = queryOwnedColorPickerParts<HTMLElement>(control, selector).find(
      (candidate) => !candidate.hidden && candidate.getAttribute("aria-hidden") !== "true",
    );
    if (surface) return surface;
  }

  return undefined;
}

export function connectFieldControl(
  control: HTMLElement,
  options: FieldControlConnectRequest,
): void {
  if (options.signal?.aborted) return;

  const bridge = getRegisteredBridge(control);
  if (bridge) {
    bridge.connect?.(control, options);
    return;
  }

  const kind = getFieldControlKind(control);
  const lazyBridgeLoad = getLazyBridgeLoad(kind);
  if (!lazyBridgeLoad) return;

  void lazyBridgeLoad.then(() => {
    if (options.signal?.aborted) return;

    const loadedBridge = getRegisteredBridge(control);
    if (!loadedBridge || options.signal?.aborted) return;

    loadedBridge.connect?.(control, options);
    if (options.signal?.aborted) return;

    options.onConnected?.();
  });
}

export function readFieldControlValue(control: HTMLElement): string {
  const bridgeValue = getRegisteredBridge(control)?.readValue?.(control);
  if (bridgeValue !== undefined) return bridgeValue;

  return readDefaultFieldControlValue(control);
}

export function readFieldControlCustomValidity(
  control: HTMLElement,
  value: string,
): FieldControlCustomValidity | undefined {
  const bridgeValidity = getRegisteredBridge(control)?.readCustomValidity?.(control, value);
  if (bridgeValidity) return bridgeValidity;

  return readDefaultFieldControlCustomValidity(control, value);
}

export function getFieldControlFocusTarget(control: HTMLElement): HTMLElement | undefined {
  const bridgeTarget = getRegisteredBridge(control)?.getFocusTarget?.(control);
  if (bridgeTarget) return bridgeTarget;

  return getFieldControlNativeControls(control)[0] ?? control;
}

export function getFieldControlNativeControls(
  control: HTMLElement,
  options: FieldControlNativeControlsOptions = {},
): FieldNativeControl[] {
  return (
    getRegisteredBridge(control)?.getNativeControls?.(control, options) ??
    getDefaultFieldControlNativeControls(control, options)
  );
}

export function getFieldControlStateSurfaces(
  fieldRoot: HTMLElement,
  control: HTMLElement,
): HTMLElement[] {
  return (
    getRegisteredBridge(control)?.getStateSurfaces?.(fieldRoot, control) ??
    getOwnedControlDescendants(fieldRoot, control, FORM_CONTROL_SURFACE_SELECTORS, [control])
  );
}

export function getFieldControlAccessibleSurfaces(
  fieldRoot: HTMLElement,
  control: HTMLElement,
): HTMLElement[] {
  return (
    getRegisteredBridge(control)?.getAccessibleSurfaces?.(fieldRoot, control) ??
    getOwnedControlDescendants(fieldRoot, control, FORM_CONTROL_ACCESSIBLE_SURFACE_SELECTORS)
  );
}

export function getFieldControlLabelSurfaces(
  fieldRoot: HTMLElement,
  control: HTMLElement,
): HTMLElement[] {
  return getRegisteredBridge(control)?.getLabelSurfaces?.(fieldRoot, control) ?? [];
}

function getRegisteredBridge(control: HTMLElement): FieldControlBridge | undefined {
  return bridges.get(getFieldControlKind(control));
}

export function registerFieldControlLazyBridge(
  kind: FieldControlKind,
  loader: () => Promise<unknown>,
): () => void {
  const previous = lazyBridgeLoaders.get(kind);
  lazyBridgeLoaders.set(kind, loader);

  return () => {
    if (lazyBridgeLoaders.get(kind) !== loader) return;

    if (previous) {
      lazyBridgeLoaders.set(kind, previous);
      return;
    }

    lazyBridgeLoaders.delete(kind);
  };
}

function getLazyBridgeLoad(kind: FieldControlKind): Promise<unknown> | undefined {
  const existing = pendingLazyBridgeLoads.get(kind);
  if (existing) return existing;

  const loader = lazyBridgeLoaders.get(kind);
  if (!loader) return undefined;

  const load = Promise.resolve()
    .then(loader)
    .catch(() => undefined)
    .finally(() => pendingLazyBridgeLoads.delete(kind));
  pendingLazyBridgeLoads.set(kind, load);
  return load;
}

function readDefaultFieldControlValue(control: HTMLElement): string {
  if (control instanceof HTMLInputElement || control instanceof HTMLTextAreaElement) {
    return control.value;
  }

  if (control instanceof HTMLSelectElement) {
    return Array.from(control.selectedOptions)
      .map((option) => option.value)
      .join(",");
  }

  const kind = getFieldControlKind(control);
  if (kind === "dropzone") {
    return getFieldControlNativeControls(control, { includeHidden: true })
      .filter((nativeControl) => nativeControl instanceof HTMLInputElement)
      .flatMap((nativeControl) => Array.from(nativeControl.files ?? []))
      .map((file) => file.name)
      .join(",");
  }

  if (kind === "checkbox" || kind === "radio" || kind === "switch") {
    const checked = control.getAttribute("aria-checked");
    return checked === "true" || checked === "mixed" ? "checked" : "";
  }

  if (kind === "checkbox-group") {
    const value = control.getAttribute("data-value");
    if (!value) return "";

    try {
      const parsed = JSON.parse(value);
      return Array.isArray(parsed) ? parsed.join(",") : String(parsed);
    } catch {
      return value;
    }
  }

  return control.getAttribute("data-value") ?? "";
}

function readDefaultFieldControlCustomValidity(
  control: HTMLElement,
  value: string,
): FieldControlCustomValidity | undefined {
  const kind = getFieldControlKind(control);
  if (kind !== "combobox" && kind !== "select") return undefined;

  const validity: FieldControlCustomValidity = { valid: true };
  if (readBooleanAttribute(control, "data-required") && value.length === 0) {
    validity.valid = false;
    validity.valueMissing = true;
  }

  return validity;
}

function getDefaultFieldControlNativeControls(
  control: HTMLElement,
  { includeHidden = false }: FieldControlNativeControlsOptions = {},
): FieldNativeControl[] {
  const controls: FieldNativeControl[] = [];
  if (isNativeFormControl(control) && (includeHidden || control.type !== "hidden")) {
    controls.push(control);
  }

  getSwitchNativeControls(control).forEach((switchControl) => {
    if (!includeHidden && switchControl.type === "hidden") return;
    if (!controls.includes(switchControl)) {
      controls.push(switchControl);
    }
  });

  control.querySelectorAll<FieldNativeControl>("input, select, textarea").forEach((element) => {
    if (!includeHidden && element.type === "hidden") return;
    if (!controls.includes(element)) {
      controls.push(element);
    }
  });

  return controls;
}

function getOwnedControlDescendants(
  fieldRoot: HTMLElement,
  control: HTMLElement,
  selector: string,
  initial: HTMLElement[] = [],
): HTMLElement[] {
  const surfaces = [...initial];

  control.querySelectorAll<HTMLElement>(selector).forEach((candidate) => {
    if (candidate.closest("[data-sw-field]") !== fieldRoot) return;
    if (surfaces.includes(candidate)) return;

    surfaces.push(candidate);
  });

  return surfaces;
}

function getSwitchNativeControls(control: HTMLElement): HTMLInputElement[] {
  if (!control.hasAttribute("data-sw-switch")) return [];

  const ownedInput = control.querySelector<HTMLInputElement>("[data-sw-switch-input]");
  const input =
    ownedInput ??
    (control.nextElementSibling instanceof HTMLInputElement &&
    control.nextElementSibling.hasAttribute("data-sw-switch-input")
      ? control.nextElementSibling
      : undefined);

  if (!input) return [];

  const controls = [input];
  const uncheckedInput = input.nextElementSibling;
  if (
    uncheckedInput instanceof HTMLInputElement &&
    uncheckedInput.hasAttribute("data-sw-switch-unchecked-input")
  ) {
    controls.push(uncheckedInput);
  }

  return controls;
}

function isNativeFormControl(element: HTMLElement): element is FieldNativeControl {
  return (
    element instanceof HTMLInputElement ||
    element instanceof HTMLSelectElement ||
    element instanceof HTMLTextAreaElement
  );
}
