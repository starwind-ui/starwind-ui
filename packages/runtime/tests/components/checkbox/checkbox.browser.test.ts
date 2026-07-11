import { beforeEach, describe, expect, it, vi } from "vitest";

import { createCheckbox } from "../../../src/components/checkbox/checkbox";

describe("createCheckbox", () => {
  beforeEach(() => {
    document.body.innerHTML = "";
    vi.useRealTimers();
  });

  it("initializes unchecked state and form input semantics", () => {
    const root = renderCheckbox({ name: "terms", value: "accepted" });

    createCheckbox(root);

    expect(root.getAttribute("role")).toBe("checkbox");
    expect(root.getAttribute("aria-checked")).toBe("false");
    expect(root.hasAttribute("data-unchecked")).toBe(true);
    expect(root.hasAttribute("data-checked")).toBe(false);
    expect(getInput().type).toBe("checkbox");
    expect(getInput().name).toBe("terms");
    expect(getInput().value).toBe("accepted");
    expect(getInput().checked).toBe(false);
    expect(getInput().tabIndex).toBe(-1);
    expect(getIndicator().hidden).toBe(true);
  });

  it("preserves root naming while hiding the native input from accessibility APIs", () => {
    const root = renderCheckbox({ ariaLabel: "Accept runtime terms" });

    createCheckbox(root);

    expect(root.getAttribute("aria-label")).toBe("Accept runtime terms");
    expect(getInput().getAttribute("aria-hidden")).toBe("true");
  });

  it("toggles when pressed and emits checked change details", () => {
    const root = renderCheckbox();
    const listener = vi.fn();
    root.addEventListener("starwind:checked-change", listener);

    createCheckbox(root);
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

  it("lets checked-change listeners cancel before uncontrolled state commits", () => {
    const root = renderCheckbox();
    root.addEventListener("starwind:checked-change", (event) => {
      expect(event.cancelable).toBe(true);
      (event as CustomEvent<{ cancel(): void; isCanceled: boolean }>).detail.cancel();
      expect((event as CustomEvent<{ isCanceled: boolean }>).detail.isCanceled).toBe(true);
    });

    createCheckbox(root);
    root.click();

    expect(root.getAttribute("aria-checked")).toBe("false");
    expect(root.hasAttribute("data-checked")).toBe(false);
    expect(getInput().checked).toBe(false);
    expect(getIndicator().hidden).toBe(true);
  });

  it("lets DOM checked-change listeners cancel with preventDefault before state commits", () => {
    const root = renderCheckbox();
    const onCheckedChange = vi.fn();
    root.addEventListener("starwind:checked-change", (event) => {
      expect(event.cancelable).toBe(true);
      event.preventDefault();
    });

    createCheckbox(root, { onCheckedChange });
    root.click();

    expect(root.getAttribute("aria-checked")).toBe("false");
    expect(root.hasAttribute("data-checked")).toBe(false);
    expect(getInput().checked).toBe(false);
    expect(getIndicator().hidden).toBe(true);
    expect(onCheckedChange).toHaveBeenCalledWith(
      true,
      expect.objectContaining({ isCanceled: true }),
    );
  });

  it("reverts hidden native input changes when DOM checked-change listeners cancel", () => {
    const root = renderCheckbox();
    const input = getInput(root);
    root.addEventListener("starwind:checked-change", (event) => {
      expect(event.cancelable).toBe(true);
      event.preventDefault();
    });

    createCheckbox(root);
    input.checked = true;
    input.dispatchEvent(new Event("change", { bubbles: true }));

    expect(root.getAttribute("aria-checked")).toBe("false");
    expect(root.hasAttribute("data-checked")).toBe(false);
    expect(input.checked).toBe(false);
    expect(getIndicator().hidden).toBe(true);
  });

  it("syncs state from the hidden native input change path", () => {
    const root = renderCheckbox();
    const input = getInput(root);
    const listener = vi.fn();
    root.addEventListener("starwind:checked-change", listener);

    createCheckbox(root);
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
          reason: "input-change",
          trigger: input,
        }),
      }),
    );
  });

  it("submits an unchecked hidden value only while unchecked", () => {
    const root = renderCheckbox({
      name: "newsletter",
      uncheckedValue: "no",
      value: "yes",
    });

    createCheckbox(root);

    const uncheckedInput = getUncheckedInput(root);
    expect(uncheckedInput?.type).toBe("hidden");
    expect(uncheckedInput?.name).toBe("newsletter");
    expect(uncheckedInput?.value).toBe("no");

    root.click();

    expect(getUncheckedInput(root)).toBeNull();
    expect(getInput(root).checked).toBe(true);
  });

  it("keeps form inputs outside native button roots", () => {
    const root = renderCheckbox({
      nativeButton: true,
      name: "newsletter",
      uncheckedValue: "no",
      value: "yes",
    });

    createCheckbox(root);

    const input = getInputForRoot(root);
    const uncheckedInput = getUncheckedInputForRoot(root);
    expect(root).toBeInstanceOf(HTMLButtonElement);
    expect(root.contains(input)).toBe(false);
    expect(root.contains(uncheckedInput)).toBe(false);
    expect(root.nextElementSibling).toBe(input);
    expect(input.nextElementSibling).toBe(uncheckedInput);
    expect(input.name).toBe("newsletter");
    expect(input.value).toBe("yes");
    expect(uncheckedInput?.name).toBe("newsletter");
    expect(uncheckedInput?.value).toBe("no");
  });

  it("supports indeterminate state and clears it on user toggle", () => {
    const root = renderCheckbox({ indeterminate: true });

    createCheckbox(root);

    expect(root.getAttribute("aria-checked")).toBe("mixed");
    expect(root.hasAttribute("data-indeterminate")).toBe(true);
    expect(getInput().indeterminate).toBe(true);
    expect(getIndicator().hidden).toBe(false);

    root.click();

    expect(root.getAttribute("aria-checked")).toBe("true");
    expect(root.hasAttribute("data-indeterminate")).toBe(false);
    expect(getInput().indeterminate).toBe(false);
    expect(getInput().checked).toBe(true);
  });

  it("does not toggle when disabled or readonly", () => {
    const disabledRoot = renderCheckbox({ disabled: true });
    createCheckbox(disabledRoot);

    disabledRoot.click();

    expect(disabledRoot.getAttribute("aria-checked")).toBe("false");
    expect(getInput().checked).toBe(false);
    expect(disabledRoot.hasAttribute("data-disabled")).toBe(true);

    const readOnlyRoot = renderCheckbox({ readOnly: true });
    createCheckbox(readOnlyRoot);

    readOnlyRoot.click();

    expect(readOnlyRoot.getAttribute("aria-checked")).toBe("false");
    expect(readOnlyRoot.hasAttribute("data-readonly")).toBe(true);
  });

  it("keeps Enter from toggling while Space toggles the checkbox", () => {
    const root = renderCheckbox();
    createCheckbox(root);

    root.dispatchEvent(new KeyboardEvent("keydown", { bubbles: true, key: "Enter" }));
    root.dispatchEvent(new KeyboardEvent("keyup", { bubbles: true, key: "Enter" }));

    expect(getInput().checked).toBe(false);

    root.dispatchEvent(new KeyboardEvent("keydown", { bubbles: true, key: " " }));
    root.dispatchEvent(new KeyboardEvent("keyup", { bubbles: true, key: " " }));

    expect(getInput().checked).toBe(true);
  });

  it("submits the owning form on Enter without toggling", () => {
    const form = document.createElement("form");
    const root = renderCheckbox({ name: "terms", value: "accepted" });
    const submitter = document.createElement("button");
    const submitListener = vi.fn((event: SubmitEvent) => event.preventDefault());
    submitter.type = "submit";
    submitter.name = "intent";
    submitter.value = "save";
    form.append(root, submitter);
    document.body.append(form);
    form.addEventListener("submit", submitListener);

    createCheckbox(root);
    root.dispatchEvent(
      new KeyboardEvent("keydown", { bubbles: true, cancelable: true, key: "Enter" }),
    );
    root.dispatchEvent(
      new KeyboardEvent("keyup", { bubbles: true, cancelable: true, key: "Enter" }),
    );

    expect(getInput(root).checked).toBe(false);
    expect(submitListener).toHaveBeenCalledOnce();
    expect(submitListener.mock.calls[0]?.[0].submitter).toBe(submitter);
  });

  it("syncs uncontrolled checked state after form reset", async () => {
    const form = document.createElement("form");
    const root = renderCheckbox({
      checked: true,
      name: "newsletter",
      uncheckedValue: "no",
      value: "yes",
    });
    form.append(root);
    document.body.append(form);

    createCheckbox(root);
    root.click();
    expect(root.getAttribute("aria-checked")).toBe("false");
    expect(getUncheckedInput(root)?.value).toBe("no");

    form.reset();
    await new Promise((resolve) => window.setTimeout(resolve, 0));

    expect(root.getAttribute("aria-checked")).toBe("true");
    expect(getInput(root).checked).toBe(true);
    expect(getUncheckedInput(root)).toBeNull();
  });

  it("preserves controlled checked state after form reset", async () => {
    const form = document.createElement("form");
    const root = renderCheckbox({ checked: true, name: "newsletter", value: "yes" });
    form.append(root);
    document.body.append(form);

    const checkbox = createCheckbox(root, { checked: false });
    checkbox.setChecked(true, { emit: false });

    form.reset();
    await new Promise((resolve) => window.setTimeout(resolve, 0));

    expect(checkbox.getChecked()).toBe(true);
    expect(root.getAttribute("aria-checked")).toBe("true");
    expect(getInput(root).checked).toBe(true);
  });

  it("syncs reset state after form ownership changes", async () => {
    const firstForm = document.createElement("form");
    const secondForm = document.createElement("form");
    firstForm.id = "first-form";
    secondForm.id = "second-form";
    document.body.append(firstForm, secondForm);

    const root = renderCheckbox({
      checked: true,
      form: firstForm.id,
      name: "newsletter",
      value: "yes",
    });
    const checkbox = createCheckbox(root);
    root.click();
    checkbox.setFormOptions({ form: secondForm.id });

    secondForm.reset();
    await new Promise((resolve) => window.setTimeout(resolve, 0));

    expect(checkbox.getChecked()).toBe(true);
    expect(root.getAttribute("aria-checked")).toBe("true");
    expect(getInput(root).checked).toBe(true);
  });

  it("lets controlled callers update checked state imperatively", () => {
    const root = renderCheckbox();
    const checkbox = createCheckbox(root, { checked: false });

    root.click();
    expect(checkbox.getChecked()).toBe(false);
    expect(getInput().checked).toBe(false);

    checkbox.setChecked(true, { emit: false });

    expect(checkbox.getChecked()).toBe(true);
    expect(getInput().checked).toBe(true);
    expect(root.hasAttribute("data-checked")).toBe(true);
  });

  it("keeps indicator mounted when requested", () => {
    const root = renderCheckbox({ keepIndicatorMounted: true });

    createCheckbox(root);

    expect(getIndicator().hidden).toBe(false);
    expect(getIndicator().hasAttribute("data-unchecked")).toBe(true);
  });

  it("returns existing instances and destroy removes listeners", () => {
    const root = renderCheckbox();
    const checkbox = createCheckbox(root);

    expect(createCheckbox(root)).toBe(checkbox);

    checkbox.destroy();
    root.click();

    expect(getInput().checked).toBe(false);
  });
});

function renderCheckbox(
  options: {
    ariaLabel?: string;
    checked?: boolean;
    disabled?: boolean;
    form?: string;
    indeterminate?: boolean;
    keepIndicatorMounted?: boolean;
    name?: string;
    nativeButton?: boolean;
    readOnly?: boolean;
    required?: boolean;
    uncheckedValue?: string;
    value?: string;
  } = {},
): HTMLElement {
  const wrapper = document.createElement("div");
  const tagName = options.nativeButton ? "button" : "span";
  wrapper.innerHTML = `
    <${tagName}
      data-sw-checkbox
      ${options.nativeButton ? 'type="button"' : ""}
      ${options.ariaLabel === undefined ? "" : `aria-label="${options.ariaLabel}"`}
      ${options.checked ? "data-default-checked" : ""}
      ${options.disabled ? "data-disabled" : ""}
      ${options.indeterminate ? "data-indeterminate" : ""}
      ${options.form === undefined ? "" : `data-form="${options.form}"`}
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
      <span
        data-sw-checkbox-indicator
        ${options.keepIndicatorMounted ? "data-keep-mounted" : ""}
      >
        check
      </span>
      <input data-sw-checkbox-input />
    </${tagName}>
  `;
  const root = wrapper.firstElementChild as HTMLElement;
  document.body.append(root);

  return root;
}

function getIndicator(): HTMLElement {
  return document.querySelector<HTMLElement>("[data-sw-checkbox-indicator]")!;
}

function getInput(): HTMLInputElement;
function getInput(root: HTMLElement): HTMLInputElement;
function getInput(root?: HTMLElement): HTMLInputElement {
  return (root ?? document).querySelector<HTMLInputElement>("[data-sw-checkbox-input]")!;
}

function getUncheckedInput(root: HTMLElement): HTMLInputElement | null {
  return root.querySelector<HTMLInputElement>("[data-sw-checkbox-unchecked-input]");
}

function getInputForRoot(root: HTMLElement): HTMLInputElement {
  const sibling = root.nextElementSibling;
  if (sibling instanceof HTMLInputElement && sibling.hasAttribute("data-sw-checkbox-input")) {
    return sibling;
  }

  return getInput(root);
}

function getUncheckedInputForRoot(root: HTMLElement): HTMLInputElement | null {
  const input = getInputForRoot(root);
  const sibling = input.nextElementSibling;
  if (
    sibling instanceof HTMLInputElement &&
    sibling.hasAttribute("data-sw-checkbox-unchecked-input")
  ) {
    return sibling;
  }

  return getUncheckedInput(root);
}
