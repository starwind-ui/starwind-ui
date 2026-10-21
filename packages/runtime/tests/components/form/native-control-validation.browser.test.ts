import { beforeEach, describe, expect, it, vi } from "vitest";
import { page, userEvent } from "vitest/browser";

import { createCheckbox } from "../../../src/components/checkbox";
import { createCombobox } from "../../../src/components/combobox";
import { createField } from "../../../src/components/field";
import { createForm } from "../../../src/components/form/form";
import { createRadio } from "../../../src/components/radio";
import { createRadioGroup } from "../../../src/components/radio-group";
import { createSelect } from "../../../src/components/select";
import { createSwitch } from "../../../src/components/switch";

function selectMarkup({
  attributes = "",
  inputType = "hidden",
}: { attributes?: string; inputType?: string } = {}): string {
  return `
    <div data-sw-select ${attributes}>
      <button data-sw-select-trigger type="button">
        <span data-sw-select-value data-placeholder="Pick a fruit"></span>
      </button>
      <input data-sw-select-input type="${inputType}" />
      <div data-sw-select-positioner data-side="bottom" data-align="start">
        <div data-sw-select-popup hidden>
          <div data-sw-select-list>
            <div data-sw-select-item data-value="apple">
              <span data-sw-select-item-text>Apple</span>
            </div>
            <div data-sw-select-item data-value="banana">
              <span data-sw-select-item-text>Banana</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  `;
}

// Astro renders the native inputs with the `hidden` attribute before Runtime starts.
function radioGroupMarkup(attributes = ""): string {
  return `
    <div data-sw-radio-group ${attributes}>
      <span data-sw-radio data-value="email"><input data-sw-radio-input hidden /></span>
      <span data-sw-radio data-value="phone"><input data-sw-radio-input hidden /></span>
    </div>
  `;
}

function submitSpy(form: HTMLFormElement) {
  const submit = vi.fn((event: SubmitEvent) => event.preventDefault());
  form.addEventListener("submit", submit);
  return submit;
}

function trigger(): HTMLButtonElement {
  return document.querySelector<HTMLButtonElement>("[data-sw-select-trigger]")!;
}

function selectInput(): HTMLInputElement {
  return document.querySelector<HTMLInputElement>("[data-sw-select-input]")!;
}

function isInViewport(element: Element): boolean {
  const rect = element.getBoundingClientRect();
  return rect.top >= 0 && rect.bottom <= window.innerHeight;
}

async function nextMacrotask(): Promise<void> {
  await new Promise((resolve) => window.setTimeout(resolve, 0));
}

async function waitFor(assertion: () => void): Promise<void> {
  const started = performance.now();
  for (;;) {
    try {
      assertion();
      return;
    } catch (error) {
      if (performance.now() - started > 1000) throw error;
      await nextMacrotask();
    }
  }
}

describe("native form validation for Runtime controls", () => {
  beforeEach(() => {
    document.body.innerHTML = "";
    window.scrollTo(0, 0);
  });

  it("blocks a plain form with an empty required Select and focuses its trigger", () => {
    document.body.innerHTML = `<form>${selectMarkup({ attributes: 'data-name="fruit" data-required' })}<button>Send</button></form>`;
    const form = document.querySelector("form")!;
    const submit = submitSpy(form);
    createSelect(document.querySelector<HTMLElement>("[data-sw-select]")!);

    expect(form.checkValidity()).toBe(false);
    form.requestSubmit();

    expect(submit).not.toHaveBeenCalled();
    expect(document.activeElement).toBe(trigger());
    expect(trigger().getAttribute("aria-required")).toBe("true");
    expect(selectInput().type).toBe("text");
    expect(selectInput().getAttribute("aria-hidden")).toBe("true");
    expect(selectInput().tabIndex).toBe(-1);
  });

  it("submits a filled Select value under its name and restores it on reset", async () => {
    document.body.innerHTML = `<form>${selectMarkup({ attributes: 'data-name="fruit" data-required data-default-value="apple"' })}<button>Send</button></form>`;
    const form = document.querySelector("form")!;
    const submit = submitSpy(form);
    const select = createSelect(document.querySelector<HTMLElement>("[data-sw-select]")!);

    select.setValue("banana");
    form.requestSubmit();

    expect(submit).toHaveBeenCalledTimes(1);
    expect(new FormData(form).getAll("fruit")).toEqual(["banana"]);

    form.reset();
    await waitFor(() => expect(select.getValue()).toBe("apple"));
    expect(selectInput().value).toBe("apple");
    expect(new FormData(form).getAll("fruit")).toEqual(["apple"]);
  });

  it("does not block submit for a disabled required Select or a Select without required", () => {
    document.body.innerHTML = `
      <form>
        ${selectMarkup({ attributes: 'data-name="fruit" data-required data-disabled' })}
        ${selectMarkup()}
        <button>Send</button>
      </form>
    `;
    const form = document.querySelector("form")!;
    const submit = submitSpy(form);
    document
      .querySelectorAll<HTMLElement>("[data-sw-select]")
      .forEach((root) => createSelect(root));

    form.requestSubmit();

    expect(submit).toHaveBeenCalledTimes(1);
    expect(new FormData(form).has("fruit")).toBe(false);
  });

  it("restores the Select value when autofill writes text into its input", () => {
    document.body.innerHTML = `<form>${selectMarkup({ attributes: 'data-name="fruit" data-required data-default-value="apple"' })}</form>`;
    const onValueChange = vi.fn();
    const select = createSelect(document.querySelector<HTMLElement>("[data-sw-select]")!, {
      onValueChange,
    });
    const input = selectInput();

    input.value = "Banana";
    input.dispatchEvent(new Event("input", { bubbles: true }));

    expect(select.getValue()).toBe("apple");
    expect(input.value).toBe("apple");
    expect(onValueChange).not.toHaveBeenCalled();
  });

  it("keeps Enter submission for a form with an optional Select and no submit button", async () => {
    document.body.innerHTML = `
      <form>
        <input name="q" />
        ${selectMarkup({ attributes: 'data-name="sort"' })}
      </form>
    `;
    const form = document.querySelector("form")!;
    const submit = submitSpy(form);
    createSelect(document.querySelector<HTMLElement>("[data-sw-select]")!);

    expect(selectInput().type).toBe("hidden");
    document.querySelector<HTMLInputElement>('input[name="q"]')!.focus();
    await userEvent.keyboard("{Enter}");

    expect(submit).toHaveBeenCalledTimes(1);
  });

  it("uses a validating text input only while the Select is required", () => {
    document.body.innerHTML = `<form>${selectMarkup({ attributes: 'data-name="sort"' })}</form>`;
    const form = document.querySelector("form")!;
    const select = createSelect(document.querySelector<HTMLElement>("[data-sw-select]")!);

    expect(selectInput().type).toBe("hidden");
    expect(form.checkValidity()).toBe(true);

    select.setFormOptions({ required: true });

    expect(selectInput().type).toBe("text");
    expect(selectInput().validity.valueMissing).toBe(true);
    expect(form.checkValidity()).toBe(false);
  });

  it("blocks a plain form with a required Checkbox and focuses the visible checkbox", () => {
    document.body.innerHTML = `
      <form>
        <span data-sw-checkbox data-name="terms" data-required><input data-sw-checkbox-input hidden /></span>
        <button>Send</button>
      </form>
    `;
    const form = document.querySelector("form")!;
    const submit = submitSpy(form);
    const root = document.querySelector<HTMLElement>("[data-sw-checkbox]")!;
    const checkbox = createCheckbox(root);

    expect(root.querySelector<HTMLInputElement>("input")!.hidden).toBe(false);
    form.requestSubmit();

    expect(submit).not.toHaveBeenCalled();
    expect(document.activeElement).toBe(root);

    checkbox.setChecked(true);
    form.requestSubmit();
    expect(submit).toHaveBeenCalledTimes(1);
  });

  it("blocks a plain form with a required RadioGroup and focuses the first radio", () => {
    document.body.innerHTML = `<form>${radioGroupMarkup('data-name="contact" data-required')}<button>Send</button></form>`;
    const form = document.querySelector("form")!;
    const submit = submitSpy(form);
    createRadioGroup(document.querySelector<HTMLElement>("[data-sw-radio-group]")!);
    const radios = document.querySelectorAll<HTMLElement>("[data-sw-radio]");

    form.requestSubmit();

    expect(submit).not.toHaveBeenCalled();
    expect(document.activeElement).toBe(radios[0]);
  });

  it("blocks a plain form with a required Switch and focuses the visible switch", () => {
    document.body.innerHTML = `
      <form>
        <span data-sw-switch data-name="alerts" data-required></span>
        <button>Send</button>
      </form>
    `;
    const form = document.querySelector("form")!;
    const submit = submitSpy(form);
    const root = document.querySelector<HTMLElement>("[data-sw-switch]")!;
    createSwitch(root);

    form.requestSubmit();

    expect(submit).not.toHaveBeenCalled();
    expect(document.activeElement).toBe(root);
  });

  it("moves Starwind Form submit and validate focus to the Select trigger and scrolls to it", async () => {
    document.body.innerHTML = `
      <form data-sw-form>
        <div style="height: 2000px"></div>
        <div data-sw-field data-name="fruit">
          ${selectMarkup({ attributes: 'data-name="fruit" data-required' })}
          <div data-sw-field-error data-message-source="validation"></div>
        </div>
        <button>Send</button>
      </form>
    `;
    const form = document.querySelector<HTMLFormElement>("[data-sw-form]")!;
    const submit = submitSpy(form);
    createSelect(document.querySelector<HTMLElement>("[data-sw-select]")!);
    createField(document.querySelector<HTMLElement>("[data-sw-field]")!);
    const instance = createForm(form);
    const error = document.querySelector<HTMLElement>("[data-sw-field-error]")!;
    await nextMacrotask();

    expect(isInViewport(trigger())).toBe(false);
    form.requestSubmit();

    expect(submit).not.toHaveBeenCalled();
    // Starwind Form moves focus after its own validation pass.
    await waitFor(() => expect(document.activeElement).toBe(trigger()));
    expect(isInViewport(trigger())).toBe(true);
    await waitFor(() => expect(error.hidden).toBe(false));
    // One message: the browser's own valueMissing text from the Select value input.
    expect(error.textContent).toBe(selectInput().validationMessage);
    expect(error.textContent).not.toBe("");

    trigger().blur();
    window.scrollTo(0, 0);
    await instance.validate({ focus: true });

    expect(document.activeElement).toBe(trigger());
    expect(isInViewport(trigger())).toBe(true);
  });

  it("moves Starwind Form focus to the first radio, or the checked radio when one is set", async () => {
    document.body.innerHTML = `
      <form data-sw-form>
        <div data-sw-field data-name="contact">
          ${radioGroupMarkup('data-name="contact" data-required')}
        </div>
        <button>Send</button>
      </form>
    `;
    const form = document.querySelector<HTMLFormElement>("[data-sw-form]")!;
    const submit = submitSpy(form);
    const group = createRadioGroup(document.querySelector<HTMLElement>("[data-sw-radio-group]")!);
    createField(document.querySelector<HTMLElement>("[data-sw-field]")!);
    const instance = createForm(form, {
      fieldValidators: { contact: (value) => (value === "phone" ? "Phone is unavailable." : null) },
    });
    const radios = document.querySelectorAll<HTMLElement>("[data-sw-radio]");
    await nextMacrotask();

    form.requestSubmit();

    expect(submit).not.toHaveBeenCalled();
    await waitFor(() => expect(document.activeElement).toBe(radios[0]));

    group.setValue("phone");
    radios[0]!.blur();
    await instance.validate({ focus: true });

    expect(document.activeElement).toBe(radios[1]);
  });
});

function comboboxMarkup(attributes = ""): string {
  return `
    <div data-sw-combobox ${attributes}>
      <div data-sw-combobox-input-group>
        <input data-sw-combobox-input placeholder="Pick a fruit" />
      </div>
      <input data-sw-combobox-hidden-input type="hidden" />
      <div data-sw-combobox-positioner data-side="bottom" data-align="start">
        <div data-sw-combobox-popup hidden>
          <div data-sw-combobox-list>
            <div data-sw-combobox-item data-value="apple">
              <span data-sw-combobox-item-text>Apple</span>
            </div>
            <div data-sw-combobox-item data-value="banana">
              <span data-sw-combobox-item-text>Banana</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  `;
}

function comboboxInput(): HTMLInputElement {
  return document.querySelector<HTMLInputElement>("[data-sw-combobox-input]")!;
}

function comboboxValueInput(): HTMLInputElement {
  return document.querySelector<HTMLInputElement>("[data-sw-combobox-hidden-input]")!;
}

describe("native form validation for Combobox", () => {
  beforeEach(() => {
    document.body.innerHTML = "";
    window.scrollTo(0, 0);
  });

  it("blocks a plain form with an empty required Combobox and focuses its input", () => {
    document.body.innerHTML = `<form>${comboboxMarkup('data-name="fruit" data-required')}<button>Send</button></form>`;
    const form = document.querySelector("form")!;
    const submit = submitSpy(form);
    createCombobox(document.querySelector<HTMLElement>("[data-sw-combobox]")!);

    expect(form.checkValidity()).toBe(false);
    form.requestSubmit();

    expect(submit).not.toHaveBeenCalled();
    expect(document.activeElement).toBe(comboboxInput());
    // The popup stays closed so it does not cover the browser message.
    expect(document.querySelector<HTMLElement>("[data-sw-combobox-popup]")!.hidden).toBe(true);
    expect(comboboxValueInput().type).toBe("text");
    expect(comboboxValueInput().getAttribute("aria-hidden")).toBe("true");
    expect(comboboxValueInput().tabIndex).toBe(-1);
  });

  it("submits a filled required Combobox value under its name", () => {
    document.body.innerHTML = `<form>${comboboxMarkup('data-name="fruit" data-required')}<button>Send</button></form>`;
    const form = document.querySelector("form")!;
    const submit = submitSpy(form);
    const combobox = createCombobox(document.querySelector<HTMLElement>("[data-sw-combobox]")!);

    combobox.setValue("banana");
    form.requestSubmit();

    expect(submit).toHaveBeenCalledTimes(1);
    expect(new FormData(form).getAll("fruit")).toEqual(["banana"]);
  });

  it("restores the Combobox value when autofill writes text into its value input", () => {
    document.body.innerHTML = `<form>${comboboxMarkup('data-name="fruit" data-required data-default-value="apple"')}</form>`;
    const onValueChange = vi.fn();
    const combobox = createCombobox(document.querySelector<HTMLElement>("[data-sw-combobox]")!, {
      onValueChange,
    });
    const input = comboboxValueInput();

    input.value = "Banana";
    input.dispatchEvent(new Event("input", { bubbles: true }));

    expect(combobox.getValue()).toBe("apple");
    expect(input.value).toBe("apple");
    expect(onValueChange).not.toHaveBeenCalled();
  });

  it("keeps Enter submission for a form with an optional Combobox and no submit button", async () => {
    document.body.innerHTML = `<form>${comboboxMarkup('data-name="fruit"')}</form>`;
    const form = document.querySelector("form")!;
    const submit = submitSpy(form);
    createCombobox(document.querySelector<HTMLElement>("[data-sw-combobox]")!);

    expect(comboboxValueInput().type).toBe("hidden");
    comboboxInput().focus();
    await userEvent.keyboard("{Enter}");

    expect(submit).toHaveBeenCalledTimes(1);
  });

  it("uses a validating text input only while the Combobox is required", () => {
    document.body.innerHTML = `<form>${comboboxMarkup('data-name="fruit"')}</form>`;
    const form = document.querySelector("form")!;
    const combobox = createCombobox(document.querySelector<HTMLElement>("[data-sw-combobox]")!);

    expect(form.checkValidity()).toBe(true);

    combobox.setFormOptions({ required: true });

    expect(comboboxValueInput().type).toBe("text");
    expect(comboboxValueInput().validity.valueMissing).toBe(true);
    expect(form.checkValidity()).toBe(false);
  });

  it("moves Starwind Form submit and validate focus to the Combobox input", async () => {
    document.body.innerHTML = `
      <form data-sw-form>
        <div style="height: 2000px"></div>
        <div data-sw-field data-name="fruit">
          ${comboboxMarkup('data-name="fruit" data-required')}
          <div data-sw-field-error data-message-source="validation"></div>
        </div>
        <button>Send</button>
      </form>
    `;
    const form = document.querySelector<HTMLFormElement>("[data-sw-form]")!;
    const submit = submitSpy(form);
    createCombobox(document.querySelector<HTMLElement>("[data-sw-combobox]")!);
    createField(document.querySelector<HTMLElement>("[data-sw-field]")!);
    const instance = createForm(form);
    const error = document.querySelector<HTMLElement>("[data-sw-field-error]")!;
    await nextMacrotask();

    form.requestSubmit();

    expect(submit).not.toHaveBeenCalled();
    await waitFor(() => expect(document.activeElement).toBe(comboboxInput()));
    expect(isInViewport(comboboxInput())).toBe(true);
    await waitFor(() => expect(error.hidden).toBe(false));
    expect(error.textContent).not.toBe("");

    comboboxInput().blur();
    window.scrollTo(0, 0);
    await instance.validate({ focus: true });

    expect(document.activeElement).toBe(comboboxInput());
    expect(isInViewport(comboboxInput())).toBe(true);
  });
});

describe("Checkbox and Radio names from native input labels", () => {
  beforeEach(() => {
    document.body.innerHTML = "";
  });

  it("names a Checkbox from an external label that targets its input", async () => {
    document.body.innerHTML = `
      <span data-sw-checkbox data-id="terms"></span>
      <label for="terms">Accept the terms</label>
    `;
    createCheckbox(document.querySelector<HTMLElement>("[data-sw-checkbox]")!);

    await expect
      .element(page.getByRole("checkbox", { name: "Accept the terms" }))
      .toBeInTheDocument();
  });

  it("keeps an authored aria-label on a Checkbox", async () => {
    document.body.innerHTML = `
      <span data-sw-checkbox data-id="news" aria-label="Newsletter"></span>
      <label for="news">Ignored label</label>
    `;
    createCheckbox(document.querySelector<HTMLElement>("[data-sw-checkbox]")!);

    await expect.element(page.getByRole("checkbox", { name: "Newsletter" })).toBeInTheDocument();
  });

  it("names a Checkbox inside a Field from the Field label", async () => {
    document.body.innerHTML = `
      <div data-sw-field data-name="terms">
        <label data-sw-field-label>Accept inside Field</label>
        <span data-sw-checkbox data-sw-field-control></span>
      </div>
    `;
    createCheckbox(document.querySelector<HTMLElement>("[data-sw-checkbox]")!);
    createField(document.querySelector<HTMLElement>("[data-sw-field]")!);

    await expect
      .element(page.getByRole("checkbox", { name: "Accept inside Field" }))
      .toBeInTheDocument();
  });

  it("names a Radio from an external label that targets its input", async () => {
    document.body.innerHTML = `
      <span data-sw-radio data-id="email-option" data-value="email"></span>
      <label for="email-option">Email me</label>
    `;
    createRadio(document.querySelector<HTMLElement>("[data-sw-radio]")!);

    await expect.element(page.getByRole("radio", { name: "Email me" })).toBeInTheDocument();
  });
});
