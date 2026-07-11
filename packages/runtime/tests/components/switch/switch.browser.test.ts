import { beforeEach, describe, expect, it, vi } from "vitest";

import { createSwitch } from "../../../src/components/switch/switch";

describe("createSwitch", () => {
  beforeEach(() => {
    document.body.innerHTML = "";
    vi.useRealTimers();
  });

  it("initializes unchecked state and toggles when pressed", () => {
    const root = renderSwitch({ name: "notifications", value: "on" });
    const listener = vi.fn();
    root.addEventListener("starwind:checked-change", listener);

    createSwitch(root);

    expect(root.getAttribute("role")).toBe("switch");
    expect(root.getAttribute("aria-checked")).toBe("false");
    expect(root.hasAttribute("data-unchecked")).toBe(true);
    expect(root.hasAttribute("data-checked")).toBe(false);
    expect(getInput(root).type).toBe("checkbox");
    expect(getInput(root).name).toBe("notifications");
    expect(getInput(root).value).toBe("on");
    expect(getInput(root).checked).toBe(false);

    root.click();

    expect(root.getAttribute("aria-checked")).toBe("true");
    expect(root.hasAttribute("data-checked")).toBe(true);
    expect(root.hasAttribute("data-unchecked")).toBe(false);
    expect(getInput(root).checked).toBe(true);
    expect(getThumb(root).hasAttribute("data-checked")).toBe(true);
    expect(listener).toHaveBeenCalledWith(
      expect.objectContaining({
        detail: expect.objectContaining({
          isCanceled: false,
          previousChecked: false,
          reason: "none",
          trigger: root,
        }),
      }),
    );
  });

  it("syncs state from the hidden native input change path", () => {
    const root = renderSwitch();
    const input = getInput(root);
    const listener = vi.fn();
    root.addEventListener("starwind:checked-change", listener);

    createSwitch(root);
    input.checked = true;
    input.dispatchEvent(new Event("change", { bubbles: true }));

    expect(root.getAttribute("aria-checked")).toBe("true");
    expect(root.hasAttribute("data-checked")).toBe(true);
    expect(input.checked).toBe(true);
    expect(listener).toHaveBeenCalledWith(
      expect.objectContaining({
        detail: expect.objectContaining({
          checked: true,
          previousChecked: false,
          reason: "none",
          trigger: input,
        }),
      }),
    );
  });

  it("projects initial checked state onto a bare thumb on init", () => {
    const root = renderSwitch({ checked: true });
    const thumb = getThumb(root);

    expect(thumb.hasAttribute("data-checked")).toBe(false);
    expect(thumb.hasAttribute("data-unchecked")).toBe(false);

    createSwitch(root);

    expect(root.getAttribute("aria-checked")).toBe("true");
    expect(thumb.hasAttribute("data-checked")).toBe(true);
    expect(thumb.hasAttribute("data-unchecked")).toBe(false);
  });

  it("projects initial unchecked state onto a bare thumb on init", () => {
    const root = renderSwitch();
    const thumb = getThumb(root);

    expect(thumb.hasAttribute("data-checked")).toBe(false);
    expect(thumb.hasAttribute("data-unchecked")).toBe(false);

    createSwitch(root);

    expect(root.getAttribute("aria-checked")).toBe("false");
    expect(thumb.hasAttribute("data-checked")).toBe(false);
    expect(thumb.hasAttribute("data-unchecked")).toBe(true);
  });

  it("submits an unchecked hidden value only while unchecked", () => {
    const root = renderSwitch({
      name: "notifications",
      uncheckedValue: "off",
      value: "on",
    });

    createSwitch(root);

    const uncheckedInput = getUncheckedInput(root);
    expect(uncheckedInput?.type).toBe("hidden");
    expect(uncheckedInput?.name).toBe("notifications");
    expect(uncheckedInput?.value).toBe("off");

    root.click();

    expect(getUncheckedInput(root)).toBeNull();
    expect(getInput(root).checked).toBe(true);
  });

  it("keeps unchecked hidden values scoped to each sibling switch", () => {
    document.body.innerHTML = `
      <form>
        <span data-sw-switch data-name="first" data-value="on" data-unchecked-value="off">
          <span data-sw-switch-thumb></span>
        </span>
        <input data-sw-switch-input />
        <span data-sw-switch data-name="second" data-value="on" data-unchecked-value="off">
          <span data-sw-switch-thumb></span>
        </span>
        <input data-sw-switch-input />
      </form>
    `;
    const roots = Array.from(document.querySelectorAll<HTMLElement>("[data-sw-switch]"));
    const form = document.querySelector<HTMLFormElement>("form")!;

    roots.forEach((root) => createSwitch(root));

    expect(form.querySelectorAll("[data-sw-switch-unchecked-input]")).toHaveLength(2);
    expect(new FormData(form).get("first")).toBe("off");
    expect(new FormData(form).get("second")).toBe("off");

    roots[0].click();

    expect(getInput(roots[0]).checked).toBe(true);
    expect(getInput(roots[1]).checked).toBe(false);
    expect(new FormData(form).get("first")).toBe("on");
    expect(new FormData(form).get("second")).toBe("off");
    expect(form.querySelectorAll("[data-sw-switch-unchecked-input]")).toHaveLength(1);
  });

  it("does not toggle when disabled or readonly", () => {
    const disabledRoot = renderSwitch({ disabled: true });
    createSwitch(disabledRoot);

    disabledRoot.click();

    expect(disabledRoot.getAttribute("aria-checked")).toBe("false");
    expect(getInput(disabledRoot).checked).toBe(false);
    expect(disabledRoot.hasAttribute("data-disabled")).toBe(true);

    const readOnlyRoot = renderSwitch({ readOnly: true });
    createSwitch(readOnlyRoot);

    readOnlyRoot.click();

    expect(readOnlyRoot.getAttribute("aria-checked")).toBe("false");
    expect(readOnlyRoot.hasAttribute("data-readonly")).toBe(true);
  });

  it("moves the public id to the hidden input for non-native switches and names the visual root from labels", () => {
    document.body.innerHTML = `
      <label for="marketing-switch">Marketing emails</label>
      <span data-sw-switch data-id="marketing-switch" data-name="marketing">
        <span data-sw-switch-thumb></span>
      </span>
      <input data-sw-switch-input />
    `;
    const label = document.querySelector<HTMLLabelElement>("label")!;
    const root = document.querySelector<HTMLElement>("[data-sw-switch]")!;
    const switchInstance = createSwitch(root);
    const input = getInput(root);

    expect(root.id).not.toBe("marketing-switch");
    expect(input.id).toBe("marketing-switch");
    expect(root.getAttribute("aria-labelledby")).toBe(label.id);

    label.click();

    expect(switchInstance.getChecked()).toBe(true);
    expect(input.checked).toBe(true);
  });

  it("preserves explicit root labels and keeps native button ids on the visible root", () => {
    document.body.innerHTML = `
      <label for="native-switch">Native switch label</label>
      <button data-sw-switch data-id="native-switch" aria-label="Explicit switch">
        <span data-sw-switch-thumb></span>
      </button>
      <input data-sw-switch-input />
    `;
    const root = document.querySelector<HTMLButtonElement>("[data-sw-switch]")!;

    createSwitch(root);
    const input = getInput(root);

    expect(root.id).toBe("native-switch");
    expect(input.id).not.toBe("native-switch");
    expect(root.getAttribute("aria-label")).toBe("Explicit switch");
    expect(root.getAttribute("aria-labelledby")).toBeNull();
  });

  it("toggles with Enter and Space", () => {
    const root = renderSwitch();
    createSwitch(root);

    root.dispatchEvent(new KeyboardEvent("keydown", { bubbles: true, key: "Enter" }));

    expect(getInput(root).checked).toBe(true);

    root.dispatchEvent(new KeyboardEvent("keydown", { bubbles: true, key: " " }));

    expect(getInput(root).checked).toBe(false);
  });

  it("tracks focused, touched, dirty, and filled state", () => {
    const root = renderSwitch({ checked: true });
    createSwitch(root);

    expect(root.hasAttribute("data-filled")).toBe(true);
    expect(root.hasAttribute("data-dirty")).toBe(false);

    root.dispatchEvent(new FocusEvent("focus", { bubbles: false }));
    expect(root.hasAttribute("data-focused")).toBe(true);
    expect(getThumb(root).hasAttribute("data-focused")).toBe(true);

    root.dispatchEvent(new FocusEvent("blur", { bubbles: false }));
    expect(root.hasAttribute("data-focused")).toBe(false);
    expect(root.hasAttribute("data-touched")).toBe(true);

    root.click();

    expect(root.hasAttribute("data-filled")).toBe(false);
    expect(root.hasAttribute("data-dirty")).toBe(true);
    expect(getThumb(root).hasAttribute("data-dirty")).toBe(true);
  });

  it("lets controlled callers update checked state imperatively", () => {
    const root = renderSwitch();
    const onCheckedChange = vi.fn();
    const switchInstance = createSwitch(root, { checked: false, onCheckedChange });

    root.click();

    expect(switchInstance.getChecked()).toBe(false);
    expect(getInput(root).checked).toBe(false);
    expect(onCheckedChange).toHaveBeenCalledWith(
      true,
      expect.objectContaining({ checked: true, previousChecked: false }),
    );

    switchInstance.setChecked(true, { emit: false });

    expect(switchInstance.getChecked()).toBe(true);
    expect(getInput(root).checked).toBe(true);
    expect(root.hasAttribute("data-checked")).toBe(true);
  });

  it("supports canceling an uncontrolled checked change", () => {
    const root = renderSwitch();
    createSwitch(root);
    root.addEventListener("starwind:checked-change", (event) => {
      (event as CustomEvent<{ cancel(): void }>).detail.cancel();
    });

    root.click();

    expect(root.getAttribute("aria-checked")).toBe("false");
    expect(getInput(root).checked).toBe(false);
  });

  it("lets DOM checked-change listeners cancel with preventDefault before state commits", () => {
    const root = renderSwitch();
    const onCheckedChange = vi.fn();
    createSwitch(root, { onCheckedChange });
    root.addEventListener("starwind:checked-change", (event) => {
      expect(event.cancelable).toBe(true);
      event.preventDefault();
    });

    root.click();

    expect(root.getAttribute("aria-checked")).toBe("false");
    expect(root.hasAttribute("data-checked")).toBe(false);
    expect(getInput(root).checked).toBe(false);
    expect(onCheckedChange).toHaveBeenCalledWith(
      true,
      expect.objectContaining({ isCanceled: true }),
    );
  });

  it("reverts hidden native input changes when DOM checked-change listeners cancel", () => {
    const root = renderSwitch();
    const input = getInput(root);
    createSwitch(root);
    root.addEventListener("starwind:checked-change", (event) => {
      expect(event.cancelable).toBe(true);
      event.preventDefault();
    });

    input.checked = true;
    input.dispatchEvent(new Event("change", { bubbles: true }));

    expect(root.getAttribute("aria-checked")).toBe("false");
    expect(root.hasAttribute("data-checked")).toBe(false);
    expect(input.checked).toBe(false);
  });

  it("syncs state after native form reset", async () => {
    document.body.innerHTML = `
      <form>
        <span data-sw-switch data-default-checked data-name="notifications">
          <span data-sw-switch-thumb></span>
        </span>
        <input data-sw-switch-input />
      </form>
    `;
    const root = document.querySelector<HTMLElement>("[data-sw-switch]")!;
    const form = document.querySelector<HTMLFormElement>("form")!;
    const switchInstance = createSwitch(root);

    root.click();
    expect(switchInstance.getChecked()).toBe(false);
    expect(root.hasAttribute("data-dirty")).toBe(true);

    form.reset();
    await waitForMacrotask();

    expect(switchInstance.getChecked()).toBe(true);
    expect(root.getAttribute("aria-checked")).toBe("true");
    expect(root.hasAttribute("data-dirty")).toBe(false);
    expect(new FormData(form).get("notifications")).toBe("on");
  });

  it("does not mutate controlled state on native form reset", async () => {
    document.body.innerHTML = `
      <form>
        <span data-sw-switch data-default-checked data-name="notifications">
          <span data-sw-switch-thumb></span>
        </span>
        <input data-sw-switch-input />
      </form>
    `;
    const root = document.querySelector<HTMLElement>("[data-sw-switch]")!;
    const form = document.querySelector<HTMLFormElement>("form")!;
    const switchInstance = createSwitch(root, { checked: false });

    expect(switchInstance.getChecked()).toBe(false);

    form.reset();
    await waitForMacrotask();

    expect(switchInstance.getChecked()).toBe(false);
    expect(root.getAttribute("aria-checked")).toBe("false");
    expect(getInput(root).checked).toBe(false);
  });

  it("rebinds native form reset handling when the form owner changes", async () => {
    document.body.innerHTML = `
      <form id="first-form"></form>
      <form id="second-form"></form>
      <span data-sw-switch data-default-checked data-form="first-form" data-name="notifications">
        <span data-sw-switch-thumb></span>
      </span>
      <input data-sw-switch-input />
    `;
    const firstForm = document.querySelector<HTMLFormElement>("#first-form")!;
    const secondForm = document.querySelector<HTMLFormElement>("#second-form")!;
    const root = document.querySelector<HTMLElement>("[data-sw-switch]")!;
    const switchInstance = createSwitch(root);

    root.click();
    expect(switchInstance.getChecked()).toBe(false);

    switchInstance.setFormOptions({ form: "second-form" });
    firstForm.reset();
    await waitForMacrotask();

    expect(switchInstance.getChecked()).toBe(false);
    expect(getInput(root).getAttribute("form")).toBe("second-form");

    secondForm.reset();
    await waitForMacrotask();

    expect(switchInstance.getChecked()).toBe(true);
    expect(root.getAttribute("aria-checked")).toBe("true");
  });

  it("clears stale custom form values and omits false ARIA states", () => {
    const root = renderSwitch({
      checked: true,
      name: "notifications",
      required: true,
      value: "yes",
    });
    const switchInstance = createSwitch(root);
    const input = getInput(root);

    expect(input.value).toBe("yes");
    expect(root.getAttribute("aria-readonly")).toBeNull();
    expect(root.getAttribute("aria-required")).toBe("true");

    switchInstance.setFormOptions({ required: false, value: undefined });

    expect(input.value).toBe("on");
    expect(input.hasAttribute("value")).toBe(false);
    expect(root.getAttribute("aria-required")).toBeNull();
  });

  it("returns existing instances and destroy removes listeners", () => {
    const root = renderSwitch();
    const switchInstance = createSwitch(root);

    expect(createSwitch(root)).toBe(switchInstance);

    switchInstance.destroy();
    root.click();

    expect(getInput(root).checked).toBe(false);
  });
});

function renderSwitch(
  options: {
    checked?: boolean;
    disabled?: boolean;
    name?: string;
    readOnly?: boolean;
    required?: boolean;
    uncheckedValue?: string;
    value?: string;
  } = {},
): HTMLElement {
  const wrapper = document.createElement("div");
  wrapper.innerHTML = `
    <span
      data-sw-switch
      ${options.checked ? "data-default-checked" : ""}
      ${options.disabled ? "data-disabled" : ""}
      ${options.readOnly ? "data-readonly" : ""}
      ${options.required ? "data-required" : ""}
      ${options.name === undefined ? "" : `data-name="${options.name}"`}
      ${
        options.uncheckedValue === undefined
          ? ""
          : `data-unchecked-value="${options.uncheckedValue}"`
      }
      ${options.value === undefined ? "" : `data-value="${options.value}"`}
    >
      <span data-sw-switch-thumb></span>
    </span>
    <input data-sw-switch-input />
  `;
  const root = wrapper.firstElementChild as HTMLElement;
  document.body.append(...Array.from(wrapper.childNodes));

  return root;
}

function getInput(root: HTMLElement): HTMLInputElement {
  const sibling = root.nextElementSibling;
  if (sibling instanceof HTMLInputElement) return sibling;

  return root.querySelector<HTMLInputElement>("[data-sw-switch-input]")!;
}

function getThumb(root: HTMLElement): HTMLElement {
  return root.querySelector<HTMLElement>("[data-sw-switch-thumb]")!;
}

function getUncheckedInput(root: HTMLElement): HTMLInputElement | null {
  const input = getInput(root);
  const sibling = input.nextElementSibling;

  return sibling instanceof HTMLInputElement &&
    sibling.hasAttribute("data-sw-switch-unchecked-input")
    ? sibling
    : null;
}

async function waitForMacrotask(): Promise<void> {
  await new Promise((resolve) => setTimeout(resolve, 0));
}
