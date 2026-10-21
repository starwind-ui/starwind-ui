import { ensureId } from "./dom";

/**
 * Keeps a native form input in constraint validation while the visible control owns focus.
 * Native validation can focus the input, so focus moves on to the visible control.
 */
export function proxyNativeInput(
  input: HTMLInputElement,
  getControl: () => HTMLElement,
  signal: AbortSignal,
): void {
  hideNativeInput(input);
  input.addEventListener("focus", () => focusVisible(getControl()), { signal });
}

/** Hides a native input visually and from assistive technology without removing it from validation. */
export function hideNativeInput(input: HTMLInputElement): void {
  input.hidden = false;
  input.tabIndex = -1;
  input.setAttribute("aria-hidden", "true");
  input.style.cssText +=
    "position:absolute;width:1px;height:1px;margin:-1px;padding:0;overflow:hidden;clip-path:inset(50%);white-space:nowrap;border:0";
}

export function focusVisible(control: HTMLElement): void {
  // focusVisible is a newer FocusOptions member; browsers without it ignore the key.
  control.focus({ focusVisible: true } as FocusOptions);
}

/** Names the visible control from labels that target its native input. */
export function labelFromNativeInput(control: HTMLElement, input: HTMLInputElement): void {
  if (control.hasAttribute("aria-label") || control.hasAttribute("aria-labelledby")) return;

  const ids = Array.from(input.labels ?? [], (label) => ensureId(label, "sw-label")).join(" ");
  if (ids) control.setAttribute("aria-labelledby", ids);
}
