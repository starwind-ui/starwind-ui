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

const bridges = new Map<FieldControlKind, FieldControlBridge>();

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

export function getFieldControlBridge(kind: FieldControlKind): FieldControlBridge | undefined {
  return bridges.get(kind);
}
