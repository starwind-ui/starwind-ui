import { readBooleanAttribute } from "../../internal/dom";

export type FieldControlKind =
  | "checkbox"
  | "checkbox-group"
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

const siblingRuntimeComponentLoaders = {
  checkbox: () => import("../checkbox"),
  "checkbox-group": () => import("../checkbox-group"),
  combobox: () => import("../combobox"),
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
