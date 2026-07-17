import { afterEach, describe, expect, it, vi } from "vitest";
import { createColorPicker } from "../../../src/components/color-picker";
import { createField } from "../../../src/components/field";

describe("Field Color Picker integration", () => {
  afterEach(() => {
    document.body.innerHTML = "";
  });

  it("registers the hidden native control while labeling and focusing the value input", async () => {
    document.body.innerHTML = renderField();
    const root = fieldRoot();
    const field = createField(root);

    await waitForPicker();
    const picker = colorPicker();
    const hidden = hiddenInput();
    const valueInput = picker.querySelector<HTMLInputElement>(
      "[data-sw-color-picker-value-input]",
    )!;
    const label = root.querySelector<HTMLElement>("[data-sw-field-label]")!;
    const description = root.querySelector<HTMLElement>("[data-sw-field-description]")!;

    expect(field.getFormRegistration().control).toBe(picker);
    expect(field.getFormRegistration().name).toBe("accent");
    expect(field.getFormRegistration().value).toBe("#336699");
    expect(hidden.name).toBe("accent");
    expect(hidden.getAttribute("aria-describedby")).toContain(description.id);
    expect(valueInput.getAttribute("aria-describedby")).toContain(description.id);
    expect(picker.getAttribute("aria-labelledby")).toContain(label.id);
    expect(valueInput.getAttribute("aria-labelledby")).toContain(label.id);
    expect(
      picker
        .querySelector<HTMLElement>("[data-sw-color-picker-trigger]")!
        .getAttribute("aria-labelledby"),
    ).toContain(label.id);

    field.getFormRegistration().focus();
    expect(document.activeElement).toBe(valueInput);
    expect(Object.fromEntries(new FormData(root.closest("form")!).entries())).toEqual({
      accent: "#336699",
    });

    picker.setAttribute("data-name", "consumer-name");
    await nextMutation();
    expect(hidden.name).toBe("accent");
    field.setName(undefined);
    await nextMutation();
    expect(picker).not.toHaveAttribute("data-name");
    expect(hidden.name).toBe("");
    expect(field.getFormRegistration().name).toBeUndefined();
  });

  it("tracks a control-owned name through additions, changes, and removal", async () => {
    document.body.innerHTML = renderField({ fieldName: null });
    const field = createField(fieldRoot());
    await waitForPicker();
    const picker = colorPicker();
    const setName = vi.spyOn(createColorPicker(picker), "setName");
    const form = picker.closest("form")!;

    expect(hiddenInput().name).toBe("");
    expect(field.getFormRegistration().name).toBeUndefined();

    picker.setAttribute("data-name", "accent-one");
    await nextMutation();
    expect(hiddenInput().name).toBe("accent-one");
    expect(field.getFormRegistration().name).toBe("accent-one");
    expect(setName).toHaveBeenCalledTimes(1);
    expect(new FormData(form).get("accent-one")).toBe("#336699");

    picker.setAttribute("data-name", "accent-two");
    await nextMutation();
    expect(hiddenInput().name).toBe("accent-two");
    expect(field.getFormRegistration().name).toBe("accent-two");
    expect(setName).toHaveBeenCalledTimes(2);
    expect(new FormData(form).get("accent-one")).toBeNull();

    picker.removeAttribute("data-name");
    await nextMutation();
    expect(hiddenInput().name).toBe("");
    expect(field.getFormRegistration().name).toBeUndefined();
    expect(setName).toHaveBeenCalledTimes(3);
    expect(Array.from(new FormData(form).entries())).toEqual([]);
  });

  it("falls back from a missing value input to the visible trigger and control", async () => {
    document.body.innerHTML = renderField({ valueInput: false, trigger: true });
    let field = createField(fieldRoot());
    await waitForPicker();

    const trigger = colorPicker().querySelector<HTMLElement>("[data-sw-color-picker-trigger]")!;
    const label = fieldRoot().querySelector<HTMLElement>("[data-sw-field-label]")!;
    expect(trigger.getAttribute("aria-labelledby")).toContain(label.id);
    field.getFormRegistration().focus();
    expect(document.activeElement).toBe(trigger);

    trigger.remove();
    const control = document.createElement("button");
    control.type = "button";
    control.setAttribute("data-sw-color-picker-control", "");
    colorPicker().prepend(control);
    await nextMutation();

    expect(control.getAttribute("aria-labelledby")).toContain(label.id);
    field.getFormRegistration().focus();
    expect(document.activeElement).toBe(control);
    field.destroy();
  });

  it("projects disabled and read-only semantics to native and non-native focus fallbacks", async () => {
    document.body.innerHTML = renderField({ valueInput: false });
    const root = fieldRoot();
    createField(root);
    await waitForPicker();
    const picker = colorPicker();
    const controller = createColorPicker(picker);
    const trigger = picker.querySelector<HTMLButtonElement>("[data-sw-color-picker-trigger]")!;
    const disabledSetter = vi.spyOn(controller, "setDisabled");
    const readOnlySetter = vi.spyOn(controller, "setReadOnly");
    const optionSetter = vi.spyOn(controller, "setOptions");

    root.setAttribute("data-disabled", "");
    await nextMutation();
    expect(trigger.disabled).toBe(true);
    expect(trigger).toHaveAttribute("data-disabled");
    expect(disabledSetter).toHaveBeenCalledTimes(1);

    root.removeAttribute("data-disabled");
    picker.setAttribute("data-readonly", "");
    await nextMutation();
    expect(trigger.disabled).toBe(false);
    expect(trigger).toHaveAttribute("data-readonly");
    expect(trigger).toHaveAttribute("aria-readonly", "true");
    expect(readOnlySetter).toHaveBeenCalledTimes(1);

    trigger.disabled = true;
    picker.setAttribute("data-required", "");
    await nextMutation();
    expect(optionSetter).toHaveBeenCalledTimes(1);
    root.setAttribute("data-disabled", "");
    await nextMutation();
    root.removeAttribute("data-disabled");
    await nextMutation();
    expect(trigger.disabled).toBe(true);

    const replacement = document.createElement("div");
    replacement.tabIndex = 0;
    replacement.setAttribute("data-sw-color-picker-control", "");
    replacement.setAttribute("data-disabled", "");
    replacement.setAttribute("data-readonly", "");
    trigger.replaceWith(replacement);
    await nextMutation();
    expect(replacement).toHaveAttribute("data-readonly");
    expect(replacement).toHaveAttribute("aria-readonly", "true");

    root.setAttribute("data-disabled", "");
    await nextMutation();
    expect(replacement).toHaveAttribute("aria-disabled", "true");
    expect(replacement).toHaveAttribute("data-disabled");
    root.removeAttribute("data-disabled");
    picker.removeAttribute("data-readonly");
    await nextMutation();
    expect(replacement).not.toHaveAttribute("aria-disabled");
    expect(replacement).not.toHaveAttribute("aria-readonly");
    expect(replacement).toHaveAttribute("data-disabled");
    expect(replacement).toHaveAttribute("data-readonly");

    replacement.removeAttribute("data-disabled");
    replacement.removeAttribute("data-readonly");
    picker.toggleAttribute("data-required");
    await nextMutation();
    expect(replacement).not.toHaveAttribute("data-disabled");
    expect(replacement).not.toHaveAttribute("data-readonly");
  });

  it("re-renders validity after silent accepted-value synchronization", async () => {
    document.body.innerHTML = renderField({ allowEmpty: true });
    const root = fieldRoot();
    createField(root);
    await waitForPicker();
    const pickerRoot = colorPicker();
    const picker = createColorPicker(pickerRoot);
    const trigger = pickerRoot.querySelector<HTMLElement>("[data-sw-color-picker-trigger]")!;
    const changed: Event[] = [];
    pickerRoot.addEventListener("starwind:value-change", (event) => changed.push(event));
    pickerRoot.setAttribute("data-required", "");
    await nextMutation();
    const setDisabled = vi.spyOn(picker, "setDisabled");
    const setReadOnly = vi.spyOn(picker, "setReadOnly");
    const setName = vi.spyOn(picker, "setName");
    const setOptions = vi.spyOn(picker, "setOptions");
    let valueMutations = 0;
    const observer = new MutationObserver((mutations) => {
      valueMutations += mutations.filter(
        (mutation) => mutation.attributeName === "data-value",
      ).length;
    });
    observer.observe(pickerRoot, { attributes: true });

    picker.setValue(null, { emit: false });
    await waitFor(() => root.hasAttribute("data-invalid"));
    expect(hiddenInput().validity.valueMissing).toBe(true);
    expect(trigger).toHaveAttribute("data-error-visible");
    expect(changed).toHaveLength(0);
    await settleTasks();
    const settledMutationCount = valueMutations;
    expect(settledMutationCount).toBeGreaterThan(0);
    await settleTasks();
    expect(valueMutations).toBe(settledMutationCount);
    expect(setDisabled).not.toHaveBeenCalled();
    expect(setReadOnly).not.toHaveBeenCalled();
    expect(setName).not.toHaveBeenCalled();
    expect(setOptions).not.toHaveBeenCalled();

    picker.setValue("#ff0000", { emit: false });
    await waitFor(() => root.hasAttribute("data-valid"));
    expect(hiddenInput().validity.valid).toBe(true);
    expect(trigger).not.toHaveAttribute("data-error-visible");
    expect(changed).toHaveLength(0);
    await settleTasks();
    expect(setDisabled).not.toHaveBeenCalled();
    expect(setReadOnly).not.toHaveBeenCalled();
    expect(setName).not.toHaveBeenCalled();
    expect(setOptions).not.toHaveBeenCalled();
    observer.disconnect();
  });

  it("reasserts Field-owned disabled and name outputs after direct controller drift", async () => {
    document.body.innerHTML = renderField();
    const root = fieldRoot();
    root.setAttribute("data-disabled", "");
    const field = createField(root);
    await waitForPicker();
    const pickerRoot = colorPicker();
    const picker = createColorPicker(pickerRoot);
    const disabledSetter = vi.spyOn(picker, "setDisabled");
    const nameSetter = vi.spyOn(picker, "setName");
    const form = root.closest("form")!;

    picker.setDisabled(false);
    picker.setName("other");
    expect(hiddenInput().disabled).toBe(false);
    expect(hiddenInput().name).toBe("other");

    picker.setValue("#ff0000", { emit: false });
    await waitFor(() => hiddenInput().disabled && hiddenInput().name === "accent");
    expect(disabledSetter).toHaveBeenCalledTimes(2);
    expect(nameSetter).toHaveBeenCalledTimes(2);
    expect(new FormData(form).get("accent")).toBeNull();
    expect(new FormData(form).get("other")).toBeNull();
    expect(field.getFormRegistration().name).toBe("accent");
    expect(field.getFormRegistration().disabled).toBe(true);

    await settleTasks();
    const settledDisabledCalls = disabledSetter.mock.calls.length;
    const settledNameCalls = nameSetter.mock.calls.length;
    picker.setValue("#00ff00", { emit: false });
    await settleTasks();
    expect(disabledSetter).toHaveBeenCalledTimes(settledDisabledCalls);
    expect(nameSetter).toHaveBeenCalledTimes(settledNameCalls);
  });

  it("keeps a direct controller name authoritative without a Field-owned name", async () => {
    document.body.innerHTML = renderField({ fieldName: null });
    const field = createField(fieldRoot());
    await waitForPicker();
    const picker = createColorPicker(colorPicker());
    const nameSetter = vi.spyOn(picker, "setName");

    picker.setName("controller-owned");
    picker.setValue("#ff0000", { emit: false });
    await settleTasks();

    expect(nameSetter).toHaveBeenCalledTimes(1);
    expect(hiddenInput().name).toBe("controller-owned");
    expect(field.getFormRegistration().name).toBe("controller-owned");
    expect(new FormData(fieldRoot().closest("form")!).get("controller-owned")).toBe("#ff0000");
  });

  it("preserves component-owned accessible names for existing rich-control kinds", async () => {
    document.body.innerHTML = `
      <span id="authored-checkbox">Checkbox item</span>
      <span id="authored-radio">Radio item</span>
      <span id="authored-slider">Slider thumb</span>
      ${renderExistingNameField("with-label", true)}
      ${renderExistingNameField("without-label", false)}
    `;

    document
      .querySelectorAll<HTMLElement>("[data-existing-name-field]")
      .forEach((root) => createField(root));
    await settleTasks();

    for (const control of document.querySelectorAll("[data-sw-checkbox]")) {
      expect(control).toHaveAttribute("aria-labelledby", "authored-checkbox");
    }
    for (const control of document.querySelectorAll("[data-sw-radio]"))
      expect(control).toHaveAttribute("aria-labelledby", "authored-radio");
    for (const control of document.querySelectorAll("[data-sw-slider-thumb]"))
      expect(control).toHaveAttribute("aria-labelledby", "authored-slider");
  });

  it("synchronizes dynamic state, validity, errors, and replaced parts without duplicates", async () => {
    document.body.innerHTML = renderField({ allowEmpty: true, value: "" });
    const root = fieldRoot();
    const field = createField(root);
    await waitForPicker();

    const picker = colorPicker();
    const valueInput = picker.querySelector<HTMLInputElement>(
      "[data-sw-color-picker-value-input]",
    )!;
    const trigger = picker.querySelector<HTMLElement>("[data-sw-color-picker-trigger]")!;
    const error = root.querySelector<HTMLElement>("[data-sw-field-error]")!;

    picker.querySelector<HTMLButtonElement>("[data-sw-color-picker-clear]")!.click();
    picker.setAttribute("data-required", "");
    picker.setAttribute("data-readonly", "");
    await nextMutation();

    expect(hiddenInput().required).toBe(true);
    expect(hiddenInput().value).toBe("");
    expect(hiddenInput().validity.valueMissing).toBe(true);
    expect(valueInput.readOnly).toBe(true);
    expect(picker).toHaveAttribute("data-invalid");
    expect(valueInput).toHaveAttribute("data-invalid");
    expect(trigger).toHaveAttribute("data-error-visible");
    expect(error.hidden).toBe(false);
    expect(valueInput.getAttribute("aria-describedby")).toContain(error.id);

    root.setAttribute("data-disabled", "");
    await nextMutation();
    expect(hiddenInput().disabled).toBe(true);
    expect(valueInput.disabled).toBe(true);
    expect(trigger).toHaveAttribute("data-disabled");

    const replacement = document.createElement("input");
    replacement.setAttribute("data-sw-color-picker-value-input", "");
    valueInput.replaceWith(replacement);
    await nextMutation();

    expect(replacement.disabled).toBe(true);
    expect(replacement.readOnly).toBe(true);
    expect(replacement.getAttribute("aria-describedby")).toContain(
      root.querySelector<HTMLElement>("[data-sw-field-description]")!.id,
    );
    expect(picker.querySelectorAll("[data-sw-color-picker-hidden-input]")).toHaveLength(1);

    root.removeAttribute("data-disabled");
    await waitFor(() => replacement.getAttribute("aria-describedby")?.includes(error.id) === true);
    expect(replacement).toHaveAttribute("data-invalid");
    picker.removeAttribute("data-readonly");
    picker.removeAttribute("data-required");
    await nextMutation();
    expect(hiddenInput().disabled).toBe(false);
    expect(hiddenInput().required).toBe(false);
    expect(replacement.disabled).toBe(false);
    expect(replacement.readOnly).toBe(false);
    expect(picker.querySelectorAll("[data-sw-color-picker-hidden-input]")).toHaveLength(1);

    field.destroy();
  });

  it("preserves Field-owned invalid state when the required form proxy recovers", async () => {
    document.body.innerHTML = renderField({ allowEmpty: true, value: "" });
    const field = createField(fieldRoot(), { invalid: true });
    await waitForPicker();
    const pickerRoot = colorPicker();
    const picker = createColorPicker(pickerRoot);
    const valueInput = pickerRoot.querySelector<HTMLInputElement>(
      "[data-sw-color-picker-value-input]",
    )!;

    pickerRoot.setAttribute("data-required", "");
    await nextMutation();
    picker.setValue(null, { emit: false });
    expect(hiddenInput().validity.valueMissing).toBe(true);
    expect(fieldRoot()).toHaveAttribute("data-invalid");
    expect(pickerRoot).toHaveAttribute("data-invalid");
    expect(valueInput).toHaveAttribute("aria-invalid", "true");

    pickerRoot.removeAttribute("data-required");
    await nextMutation();
    expect(hiddenInput().validity.valid).toBe(true);
    expect(fieldRoot()).toHaveAttribute("data-invalid");
    expect(pickerRoot).toHaveAttribute("data-invalid");
    expect(valueInput).toHaveAttribute("data-invalid");
    expect(valueInput).toHaveAttribute("aria-invalid", "true");
    field.destroy();
  });
});

function renderField({
  allowEmpty = false,
  trigger = true,
  value = "#336699",
  valueInput = true,
  fieldName = "accent",
}: {
  allowEmpty?: boolean;
  trigger?: boolean;
  value?: string;
  valueInput?: boolean;
  fieldName?: string | null;
} = {}): string {
  return `<form>
    <div data-sw-field ${fieldName === null ? "" : `data-name="${fieldName}"`}>
      <label data-sw-field-label>Accent</label>
      <div data-sw-color-picker data-value="${value}" ${allowEmpty ? "data-allow-empty" : ""}>
        ${valueInput ? "<input data-sw-color-picker-value-input />" : ""}
        ${trigger ? '<button type="button" data-sw-color-picker-trigger>Open</button>' : ""}
        <button type="button" data-sw-color-picker-clear>Clear</button>
        <div data-sw-color-picker-area>
          <span data-sw-color-picker-area-thumb></span>
          <input data-sw-color-picker-area-input data-axis="x" />
          <input data-sw-color-picker-area-input data-axis="y" />
        </div>
        <div data-sw-color-picker-channel-slider data-channel="hue">
          <span data-sw-color-picker-channel-slider-thumb></span>
          <input data-sw-color-picker-channel-input />
        </div>
        <input data-sw-color-picker-hidden-input />
      </div>
      <p data-sw-field-description>Used throughout the theme.</p>
      <p data-sw-field-error data-match="valueMissing">Choose an accent.</p>
    </div>
  </form>`;
}

function fieldRoot() {
  return document.querySelector<HTMLElement>("[data-sw-field]")!;
}

function colorPicker() {
  return document.querySelector<HTMLElement>("[data-sw-color-picker]")!;
}

function hiddenInput() {
  return colorPicker().querySelector<HTMLInputElement>("[data-sw-color-picker-hidden-input]")!;
}

async function waitForPicker() {
  await waitFor(
    () =>
      hiddenInput().type === "text" &&
      hiddenInput().getAttribute("aria-hidden") === "true" &&
      hiddenInput().tabIndex === -1 &&
      hiddenInput().style.position === "absolute",
  );
  await nextMutation();
}

async function nextMutation() {
  await new Promise((resolve) => setTimeout(resolve, 20));
}

async function settleTasks() {
  await nextMutation();
  await nextMutation();
  await nextMutation();
}

function renderExistingNameField(id: string, withLabel: boolean) {
  const label = withLabel ? "<span data-sw-field-label>Field label</span>" : "";
  return `<div data-sw-field data-existing-name-field="${id}-checkbox">
    ${label}
    <div data-sw-checkbox-group>
      <span data-sw-checkbox aria-labelledby="authored-checkbox" data-value="one">
        <input data-sw-checkbox-input type="checkbox" />
      </span>
    </div>
  </div>
  <div data-sw-field data-existing-name-field="${id}-radio">
    ${label}
    <div data-sw-radio-group>
      <span data-sw-radio aria-labelledby="authored-radio" data-value="one"><input data-sw-radio-input type="radio" /></span>
    </div>
  </div>
  <div data-sw-field data-existing-name-field="${id}-slider">
    ${label}
    <div data-sw-slider><div data-sw-slider-control><div data-sw-slider-thumb aria-labelledby="authored-slider">
      <input data-sw-slider-input />
    </div></div></div>
  </div>`;
}

async function waitFor(assertion: () => boolean) {
  const deadline = Date.now() + 10_000;
  while (Date.now() < deadline) {
    if (assertion()) return;
    await nextMutation();
  }
  throw new Error("Timed out waiting for Color Picker Field integration");
}
