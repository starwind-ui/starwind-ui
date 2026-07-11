import { beforeEach, describe, expect, it, vi } from "vitest";

import { createRadio } from "../../../src/components/radio/radio";

describe("createRadio", () => {
  beforeEach(() => {
    document.body.innerHTML = "";
    vi.useRealTimers();
  });

  it("initializes unchecked state and hidden radio input semantics", () => {
    const root = renderRadio({ name: "storage", value: "ssd" });

    createRadio(root);

    expect(root.getAttribute("role")).toBe("radio");
    expect(root.getAttribute("aria-checked")).toBe("false");
    expect(root.hasAttribute("data-unchecked")).toBe(true);
    expect(root.hasAttribute("data-checked")).toBe(false);
    expect(getInput().type).toBe("radio");
    expect(getInput().name).toBe("storage");
    expect(getInput().value).toBe("ssd");
    expect(getInput().checked).toBe(false);
    expect(getInput().tabIndex).toBe(-1);
    expect(getIndicator().hidden).toBe(true);
  });

  it("does not emit a checked-change event when selecting an already checked radio", () => {
    document.body.innerHTML = `
      <span data-sw-radio data-value="ssd">
        <span data-sw-radio-indicator data-keep-mounted></span>
        <input data-sw-radio-input />
      </span>
    `;
    const root = document.querySelector<HTMLElement>("[data-sw-radio]")!;
    const listener = vi.fn();
    root.addEventListener("starwind:checked-change", listener);

    createRadio(root, { checked: true });

    root.click();

    expect(listener).not.toHaveBeenCalled();
  });

  it("preserves root naming while hiding the native input from accessibility APIs", () => {
    const root = renderRadio({ ariaLabel: "Solid state drive" });

    createRadio(root);

    expect(root.getAttribute("aria-label")).toBe("Solid state drive");
    expect(getInput().getAttribute("aria-hidden")).toBe("true");
  });

  it("selects when pressed and emits checked change details", () => {
    const root = renderRadio();
    const listener = vi.fn();
    root.addEventListener("starwind:checked-change", listener);

    createRadio(root);
    root.click();

    expect(root.getAttribute("aria-checked")).toBe("true");
    expect(root.hasAttribute("data-checked")).toBe(true);
    expect(root.hasAttribute("data-unchecked")).toBe(false);
    expect(getInput().checked).toBe(true);
    expect(getIndicator().hidden).toBe(false);
    expect(listener).toHaveBeenCalledWith(
      expect.objectContaining({
        detail: expect.objectContaining({
          checked: true,
          previousChecked: false,
          reason: "root-press",
          trigger: root,
        }),
      }),
    );
  });

  it("selects with Space and ignores Enter", () => {
    const root = renderRadio();
    const listener = vi.fn();
    root.addEventListener("starwind:checked-change", listener);

    createRadio(root);

    const enterEvent = new KeyboardEvent("keydown", {
      bubbles: true,
      cancelable: true,
      key: "Enter",
    });
    root.dispatchEvent(enterEvent);
    root.dispatchEvent(
      new KeyboardEvent("keyup", { bubbles: true, cancelable: true, key: "Enter" }),
    );

    expect(enterEvent.defaultPrevented).toBe(true);
    expect(root.getAttribute("aria-checked")).toBe("false");
    expect(getInput(root).checked).toBe(false);
    expect(listener).not.toHaveBeenCalled();

    root.dispatchEvent(new KeyboardEvent("keydown", { bubbles: true, key: " " }));
    root.dispatchEvent(new KeyboardEvent("keyup", { bubbles: true, key: " " }));

    expect(root.getAttribute("aria-checked")).toBe("true");
    expect(getInput(root).checked).toBe(true);
    expect(listener).toHaveBeenCalledWith(
      expect.objectContaining({
        detail: expect.objectContaining({
          checked: true,
          previousChecked: false,
          reason: "root-press",
          trigger: root,
        }),
      }),
    );
  });

  it("prevents Enter activation on native button radio roots", () => {
    const root = renderNativeButtonRadio({ value: "ssd" });
    const listener = vi.fn();
    root.addEventListener("starwind:checked-change", listener);

    createRadio(root);

    const enterEvent = new KeyboardEvent("keydown", {
      bubbles: true,
      cancelable: true,
      key: "Enter",
    });
    root.dispatchEvent(enterEvent);
    root.dispatchEvent(
      new KeyboardEvent("keyup", { bubbles: true, cancelable: true, key: "Enter" }),
    );

    expect(enterEvent.defaultPrevented).toBe(true);
    expect(root.getAttribute("aria-checked")).toBe("false");
    expect(getInput().checked).toBe(false);
    expect(listener).not.toHaveBeenCalled();
  });

  it("does not change when disabled or readonly", () => {
    const disabledRoot = renderRadio({ disabled: true });
    createRadio(disabledRoot);

    disabledRoot.click();

    expect(disabledRoot.getAttribute("aria-checked")).toBe("false");
    expect(getInput(disabledRoot).checked).toBe(false);
    expect(disabledRoot.hasAttribute("data-disabled")).toBe(true);

    const readOnlyRoot = renderRadio({ readOnly: true });
    createRadio(readOnlyRoot);

    readOnlyRoot.click();

    expect(readOnlyRoot.getAttribute("aria-checked")).toBe("false");
    expect(readOnlyRoot.hasAttribute("data-readonly")).toBe(true);
  });

  it("places runtime-created native button inputs as siblings without duplicating the root id", () => {
    const root = renderNativeButtonRadio({ id: "plan-ssd", required: true, value: "ssd" });

    createRadio(root);

    const input = getInput();
    expect(root).toBeInstanceOf(HTMLButtonElement);
    expect(root.id).toBe("plan-ssd");
    expect(root.contains(input)).toBe(false);
    expect(input.previousElementSibling).toBe(root);
    expect(input.id).not.toBe("plan-ssd");
    expect(input.required).toBe(true);
    expect(input.value).toBe("ssd");
    expect(root.hasAttribute("aria-required")).toBe(false);
    expect(root.hasAttribute("data-required")).toBe(true);
  });

  it("removes runtime-owned native button inputs on destroy", () => {
    const form = document.createElement("form");
    const root = renderNativeButtonRadio({ name: "storage", value: "ssd" });
    form.append(root);
    document.body.append(form);
    const radio = createRadio(root);
    root.click();
    const input = getInput();

    expect(new FormData(form).get("storage")).toBe("ssd");

    radio.destroy();

    expect(input.isConnected).toBe(false);
    expect(new FormData(form).get("storage")).toBeNull();
  });

  it("keeps readonly and required state off unsupported radio ARIA props", () => {
    const root = renderRadio({ readOnly: true, required: true });

    createRadio(root);

    expect(root.hasAttribute("aria-readonly")).toBe(false);
    expect(root.hasAttribute("aria-required")).toBe(false);
    expect(root.hasAttribute("data-readonly")).toBe(true);
    expect(root.hasAttribute("data-required")).toBe(true);
    expect(getInput().required).toBe(true);
  });

  it("supports controlled callers updating checked state imperatively", () => {
    const root = renderRadio();
    const radio = createRadio(root, { checked: false });

    root.click();
    expect(radio.getChecked()).toBe(false);
    expect(getInput().checked).toBe(false);

    radio.setChecked(true, { emit: false });

    expect(radio.getChecked()).toBe(true);
    expect(getInput().checked).toBe(true);
    expect(root.hasAttribute("data-checked")).toBe(true);
  });

  it("returns existing instances and destroy removes listeners", () => {
    const root = renderRadio();
    const radio = createRadio(root);

    expect(createRadio(root)).toBe(radio);

    radio.destroy();
    root.click();

    expect(getInput().checked).toBe(false);
  });
});

function renderRadio(
  options: {
    ariaLabel?: string;
    checked?: boolean;
    disabled?: boolean;
    keepIndicatorMounted?: boolean;
    name?: string;
    readOnly?: boolean;
    required?: boolean;
    value?: string;
  } = {},
): HTMLElement {
  const wrapper = document.createElement("div");
  wrapper.innerHTML = `
    <span
      data-sw-radio
      ${options.ariaLabel === undefined ? "" : `aria-label="${options.ariaLabel}"`}
      ${options.checked ? "data-default-checked" : ""}
      ${options.disabled ? "data-disabled" : ""}
      ${options.readOnly ? "data-readonly" : ""}
      ${options.required ? "data-required" : ""}
      ${options.name === undefined ? "" : `data-name="${options.name}"`}
      ${options.value === undefined ? "" : `data-value="${options.value}"`}
    >
      <span
        data-sw-radio-indicator
        ${options.keepIndicatorMounted ? "data-keep-mounted" : ""}
      >
        dot
      </span>
      <input data-sw-radio-input />
    </span>
  `;
  const root = wrapper.firstElementChild as HTMLElement;
  document.body.append(root);

  return root;
}

function renderNativeButtonRadio(
  options: { id?: string; name?: string; required?: boolean; value?: string } = {},
): HTMLButtonElement {
  const wrapper = document.createElement("div");
  wrapper.innerHTML = `
    <button
      data-sw-radio
      ${options.id === undefined ? "" : `id="${options.id}" data-id="${options.id}"`}
      ${options.name === undefined ? "" : `data-name="${options.name}"`}
      ${options.required ? "data-required" : ""}
      ${options.value === undefined ? "" : `data-value="${options.value}"`}
    >
      <span data-sw-radio-indicator data-keep-mounted>dot</span>
    </button>
  `;
  const root = wrapper.firstElementChild as HTMLButtonElement;
  document.body.append(root);

  return root;
}

function getIndicator(): HTMLElement {
  return document.querySelector<HTMLElement>("[data-sw-radio-indicator]")!;
}

function getInput(): HTMLInputElement;
function getInput(root: HTMLElement): HTMLInputElement;
function getInput(root?: HTMLElement): HTMLInputElement {
  return (root ?? document).querySelector<HTMLInputElement>("[data-sw-radio-input]")!;
}
