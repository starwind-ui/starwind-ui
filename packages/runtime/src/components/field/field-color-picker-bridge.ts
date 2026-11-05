import { readBooleanAttribute } from "../../internal/dom";
import { createColorPicker } from "../color-picker";

import { getOwnedControlDescendants } from "./field-control-bridge";
import { registerFieldControlBridge } from "./field-control-registry";

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

export function registerColorPickerFieldBridge(): void {
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
