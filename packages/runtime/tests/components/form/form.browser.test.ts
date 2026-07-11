import { beforeEach, describe, expect, it, vi } from "vitest";

import { createDropzone } from "../../../src/components/dropzone";
import { createField } from "../../../src/components/field";
import {
  createForm,
  createFormSchemaValidator,
  type FormFieldRegistration,
  validateFormSchema,
} from "../../../src/components/form/form";

describe("createForm", () => {
  beforeEach(() => {
    vi.useRealTimers();
    document.body.innerHTML = "";
  });

  it("registers owned fields and preserves valid native form submission", () => {
    document.body.innerHTML = `
      <form data-sw-form>
        <div data-sw-field data-name="email">
          <label data-sw-field-label>Email</label>
          <input data-sw-field-control data-sw-input type="email" value="ada@example.com" required />
        </div>
        <div data-sw-field data-name="notes">
          <textarea data-sw-field-control>hello</textarea>
        </div>
      </form>
    `;

    const form = document.querySelector<HTMLFormElement>("[data-sw-form]")!;
    const submit = vi.fn((event: SubmitEvent) => {
      expect(event.defaultPrevented).toBe(false);
    });

    form.addEventListener("submit", submit);

    const instance = createForm(form);
    const fields = instance.getFields();

    expect(fields).toHaveLength(2);
    expect(fields.map((field) => field.name)).toEqual(["email", "notes"]);
    expect(fields.map((field) => field.value)).toEqual(["ada@example.com", "hello"]);
    expect(fields.every((field) => field.valid === true)).toBe(true);
    expect(typeof fields[0]!.focus).toBe("function");

    const submitEvent = new SubmitEvent("submit", { bubbles: true, cancelable: true });
    const submitted = form.dispatchEvent(submitEvent);

    expect(submitted).toBe(true);
    expect(submit).toHaveBeenCalledTimes(1);
    expect(new FormData(form).get("email")).toBe("ada@example.com");
    expect(new FormData(form).get("notes")).toBe("hello");
  });

  it("drops registered field facts when the Form runtime is destroyed", () => {
    document.body.innerHTML = `
      <form data-sw-form>
        <div data-sw-field data-name="email">
          <input data-sw-field-control data-sw-input name="email" value="ada@example.com" />
        </div>
      </form>
    `;

    const form = document.querySelector<HTMLFormElement>("[data-sw-form]")!;
    const fieldRoot = document.querySelector<HTMLElement>("[data-sw-field]")!;
    const instance = createForm(form);
    const fieldInstance = createField(fieldRoot);

    expect(instance.getState()).toEqual({ fieldCount: 1 });

    instance.destroy();

    expect(instance.getState()).toEqual({ fieldCount: 0 });
    expect(instance.getFields()).toEqual([]);

    const nextFormInstance = createForm(form);
    const nextFieldInstance = createField(fieldRoot);
    expect(nextFormInstance).not.toBe(instance);
    expect(nextFieldInstance).not.toBe(fieldInstance);
    nextFormInstance.destroy();
  });

  it("registers submitted values for native and runtime-backed form controls", async () => {
    document.body.innerHTML = `
      <form data-sw-form>
        <div data-sw-field data-name="profile">
          <input data-sw-field-control data-sw-input value="Ada" />
        </div>
        <div data-sw-field data-name="bio">
          <textarea data-sw-field-control>Analytical engine notes</textarea>
        </div>
        <div data-sw-field data-name="accept">
          <span data-sw-checkbox data-default-checked data-value="yes">
            <span data-sw-checkbox-indicator data-keep-mounted></span>
          </span>
        </div>
        <div data-sw-field data-name="alerts">
          <span data-sw-switch data-default-checked data-value="enabled">
            <span data-sw-switch-thumb></span>
          </span>
        </div>
        <div data-sw-field data-name="marketing">
          <span data-sw-checkbox data-value="subscribed"></span>
        </div>
        <div data-sw-field data-name="digest">
          <span data-sw-switch data-value="daily" data-unchecked-value="never">
            <span data-sw-switch-thumb></span>
          </span>
        </div>
        <div data-sw-field data-name="plan">
          <div data-sw-radio-group data-default-value="pro">
            <span data-sw-radio data-value="basic"></span>
            <span data-sw-radio data-value="pro"></span>
          </div>
        </div>
        <div data-sw-field data-name="theme">
          <div data-sw-select data-default-value="dark">
            <button data-sw-select-trigger type="button">
              <span data-sw-select-value data-placeholder="Pick theme"></span>
            </button>
            <input data-sw-select-input type="hidden" />
            <div data-sw-select-positioner data-side="bottom" data-align="start">
              <div data-sw-select-popup hidden>
                <div data-sw-select-list>
                  <div data-sw-select-item data-value="light">
                    <span data-sw-select-item-text>Light</span>
                  </div>
                  <div data-sw-select-item data-value="dark">
                    <span data-sw-select-item-text>Dark</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div data-sw-field data-name="country">
          <div data-sw-combobox data-default-value="ca">
            <div data-sw-combobox-input-group>
              <input data-sw-combobox-input />
              <button data-sw-combobox-trigger type="button">Open</button>
            </div>
            <input data-sw-combobox-hidden-input type="hidden" />
            <div data-sw-combobox-positioner data-side="bottom" data-align="start">
              <div data-sw-combobox-popup hidden>
                <div data-sw-combobox-list>
                  <div data-sw-combobox-item data-value="us">
                    <span data-sw-combobox-item-text>United States</span>
                  </div>
                  <div data-sw-combobox-item data-value="ca">
                    <span data-sw-combobox-item-text>Canada</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div data-sw-field data-name="disabledNote" data-disabled>
          <input data-sw-field-control data-sw-input value="not submitted" />
        </div>
      </form>
    `;

    const form = document.querySelector<HTMLFormElement>("[data-sw-form]")!;
    const instance = createForm(form);
    await waitFor(() => {
      const formData = new FormData(form);
      const fields = new Map(
        instance
          .getFields()
          .filter((field) => field.name)
          .map((field) => [field.name, field] as const),
      );

      expect(fields.get("accept")?.value).toBe("yes");
      expect(fields.get("alerts")?.value).toBe("enabled");
      expect(fields.get("marketing")?.value).toBe(null);
      expect(fields.get("digest")?.value).toBe("never");
      expect(fields.get("plan")?.value).toBe("pro");
      expect(formData.get("accept")).toBe("yes");
      expect(formData.get("alerts")).toBe("enabled");
      expect(formData.get("marketing")).toBe(null);
      expect(formData.get("digest")).toBe("never");
      expect(formData.get("plan")).toBe("pro");
      expect(formData.get("theme")).toBe("dark");
      expect(formData.get("country")).toBe("ca");
    });

    const formData = new FormData(form);
    const fields = new Map(
      instance
        .getFields()
        .filter((field) => field.name)
        .map((field) => [field.name, field] as const),
    );

    [
      "profile",
      "bio",
      "accept",
      "alerts",
      "marketing",
      "digest",
      "plan",
      "theme",
      "country",
    ].forEach((name) => {
      expect(fields.get(name)?.value).toBe(formData.get(name));
    });
    expect(fields.get("disabledNote")?.disabled).toBe(true);
    expect(formData.has("disabledNote")).toBe(false);
  });

  it("validates required runtime select and combobox fields through the managed form", async () => {
    document.body.innerHTML = `
      <form data-sw-form>
        <div data-sw-field data-name="email">
          <input data-sw-field-control data-sw-input type="email" required value="ada@example.com" />
          <div data-sw-field-error data-match="valueMissing">Enter an email address.</div>
        </div>
        ${renderRuntimeSelectField({ name: "theme" })}
        ${renderRuntimeComboboxField({ name: "country" })}
        <button type="submit">Submit</button>
      </form>
    `;

    const form = document.querySelector<HTMLFormElement>("[data-sw-form]")!;
    const themeField = document.querySelector<HTMLElement>('[data-sw-field][data-name="theme"]')!;
    const countryField = document.querySelector<HTMLElement>(
      '[data-sw-field][data-name="country"]',
    )!;
    const themeError = themeField.querySelector<HTMLElement>("[data-sw-field-error]")!;
    const countryError = countryField.querySelector<HTMLElement>("[data-sw-field-error]")!;
    const submit = vi.fn((event: SubmitEvent) => {
      event.preventDefault();
    });
    const instance = createForm(form);
    form.addEventListener("submit", submit);

    expect(form.checkValidity()).toBe(false);
    await waitForMacrotask();

    expect(instance.getErrors().map((error) => error.name)).toEqual(["theme", "country"]);
    expect(themeField).toHaveAttribute("data-invalid");
    expect(countryField).toHaveAttribute("data-invalid");
    expect(themeError.hidden).toBe(false);
    expect(countryError.hidden).toBe(false);

    const blockedSubmit = new SubmitEvent("submit", { bubbles: true, cancelable: true });
    expect(form.dispatchEvent(blockedSubmit)).toBe(false);
    await waitForMacrotask();
    expect(blockedSubmit.defaultPrevented).toBe(true);
    expect(submit).not.toHaveBeenCalled();

    document.querySelector<HTMLButtonElement>("[data-sw-select-trigger]")!.click();
    await waitForMacrotask();
    document.querySelector<HTMLElement>('[data-sw-select-item][data-value="dark"]')!.click();
    document.querySelector<HTMLButtonElement>("[data-sw-combobox-trigger]")!.click();
    await waitForMacrotask();
    document.querySelector<HTMLElement>('[data-sw-combobox-item][data-value="ca"]')!.click();
    await waitForMacrotask();

    expect(instance.getErrors()).toEqual([]);
    expect(themeField).not.toHaveAttribute("data-invalid");
    expect(countryField).not.toHaveAttribute("data-invalid");
    expect(themeError.hidden).toBe(true);
    expect(countryError.hidden).toBe(true);
    expect(form.checkValidity()).toBe(true);

    const data = new FormData(form);
    expect(data.get("theme")).toBe("dark");
    expect(data.get("country")).toBe("ca");
  });

  it("reveals runtime select and combobox errors during a native-invalid submit attempt", async () => {
    document.body.innerHTML = `
      <form data-sw-form>
        <div data-sw-field data-name="email">
          <input data-sw-field-control data-sw-input type="email" required />
          <div data-sw-field-error data-match="valueMissing">Enter an email address.</div>
        </div>
        ${renderRuntimeSelectField({ name: "theme" })}
        ${renderRuntimeComboboxField({ name: "country" })}
        <button type="submit">Submit</button>
      </form>
    `;

    const form = document.querySelector<HTMLFormElement>("[data-sw-form]")!;
    const emailField = document.querySelector<HTMLElement>('[data-sw-field][data-name="email"]')!;
    const themeField = document.querySelector<HTMLElement>('[data-sw-field][data-name="theme"]')!;
    const countryField = document.querySelector<HTMLElement>(
      '[data-sw-field][data-name="country"]',
    )!;
    const submit = vi.fn();
    const instance = createForm(form);
    form.addEventListener("submit", submit);

    document.querySelector<HTMLButtonElement>('button[type="submit"]')!.click();
    await waitForMacrotask();

    expect(submit).not.toHaveBeenCalled();
    expect(instance.getErrors().map((error) => error.name)).toEqual(["email", "theme", "country"]);
    [emailField, themeField, countryField].forEach((field) => {
      expect(field).toHaveAttribute("data-invalid");
      expect(field.querySelector<HTMLElement>("[data-sw-field-error]")).toHaveProperty(
        "hidden",
        false,
      );
    });
  });

  it("omits disabled runtime select and combobox fields from validation and FormData", async () => {
    document.body.innerHTML = `
      <form data-sw-form>
        ${renderRuntimeSelectField({ name: "theme", disabled: true })}
        ${renderRuntimeComboboxField({ name: "country", disabled: true })}
      </form>
    `;

    const form = document.querySelector<HTMLFormElement>("[data-sw-form]")!;
    const themeField = document.querySelector<HTMLElement>('[data-sw-field][data-name="theme"]')!;
    const countryField = document.querySelector<HTMLElement>(
      '[data-sw-field][data-name="country"]',
    )!;
    const select = themeField.querySelector<HTMLElement>("[data-sw-select]")!;
    const selectTrigger = select.querySelector<HTMLButtonElement>("[data-sw-select-trigger]")!;
    const selectInput = select.querySelector<HTMLInputElement>("[data-sw-select-input]")!;
    const combobox = countryField.querySelector<HTMLElement>("[data-sw-combobox]")!;
    const comboboxInput = combobox.querySelector<HTMLInputElement>("[data-sw-combobox-input]")!;
    const comboboxTrigger = combobox.querySelector<HTMLButtonElement>(
      "[data-sw-combobox-trigger]",
    )!;
    const comboboxHiddenInput = combobox.querySelector<HTMLInputElement>(
      "[data-sw-combobox-hidden-input]",
    )!;
    const instance = createForm(form);

    expect(form.checkValidity()).toBe(true);
    await waitForMacrotask();

    expect(instance.getErrors()).toEqual([]);
    expect(select).toHaveAttribute("data-disabled");
    expect(selectTrigger.disabled).toBe(true);
    expect(selectInput.disabled).toBe(true);
    expect(combobox).toHaveAttribute("data-disabled");
    expect(comboboxInput.disabled).toBe(true);
    expect(comboboxTrigger.disabled).toBe(true);
    expect(comboboxHiddenInput.disabled).toBe(true);

    selectTrigger.click();
    comboboxTrigger.click();
    await waitForMacrotask();

    expect(select).toHaveAttribute("data-state", "closed");
    expect(combobox).toHaveAttribute("data-state", "closed");
    expect(new FormData(form).has("theme")).toBe(false);
    expect(new FormData(form).has("country")).toBe(false);
  });

  it("resets runtime select and combobox values and clears managed validation state", async () => {
    document.body.innerHTML = `
      <form data-sw-form>
        ${renderRuntimeSelectField({ name: "theme", defaultValue: "light" })}
        ${renderRuntimeComboboxField({ name: "country", defaultValue: "us" })}
        <button type="reset">Reset</button>
      </form>
    `;

    const form = document.querySelector<HTMLFormElement>("[data-sw-form]")!;
    const themeField = document.querySelector<HTMLElement>('[data-sw-field][data-name="theme"]')!;
    const countryField = document.querySelector<HTMLElement>(
      '[data-sw-field][data-name="country"]',
    )!;
    const select = themeField.querySelector<HTMLElement>("[data-sw-select]")!;
    const selectInput = select.querySelector<HTMLInputElement>("[data-sw-select-input]")!;
    const selectValue = select.querySelector<HTMLElement>("[data-sw-select-value]")!;
    const combobox = countryField.querySelector<HTMLElement>("[data-sw-combobox]")!;
    const comboboxInput = combobox.querySelector<HTMLInputElement>("[data-sw-combobox-input]")!;
    const comboboxHiddenInput = combobox.querySelector<HTMLInputElement>(
      "[data-sw-combobox-hidden-input]",
    )!;
    const instance = createForm(form);

    document.querySelector<HTMLButtonElement>("[data-sw-select-trigger]")!.click();
    await waitForMacrotask();
    document.querySelector<HTMLElement>('[data-sw-select-item][data-value="dark"]')!.click();
    document.querySelector<HTMLButtonElement>("[data-sw-combobox-trigger]")!.click();
    await waitForMacrotask();
    document.querySelector<HTMLElement>('[data-sw-combobox-item][data-value="ca"]')!.click();
    await waitForMacrotask();

    expect(selectInput.value).toBe("dark");
    expect(comboboxHiddenInput.value).toBe("ca");

    form.reset();
    await waitForMacrotask();

    expect(instance.getErrors()).toEqual([]);
    expect(themeField).not.toHaveAttribute("data-invalid");
    expect(countryField).not.toHaveAttribute("data-invalid");
    expect(selectInput.value).toBe("light");
    expect(selectValue.textContent).toBe("Light");
    expect(comboboxHiddenInput.value).toBe("us");
    expect(comboboxInput.value).toBe("United States");
    expect(new FormData(form).get("theme")).toBe("light");
    expect(new FormData(form).get("country")).toBe("us");
  });

  it("resets native field values and clears dirty touched submitted and visible error state", async () => {
    document.body.innerHTML = `
      <form data-sw-form data-validation-timing="input" data-error-visibility="input">
        <div data-sw-field data-name="email">
          <input data-sw-field-control data-sw-input type="email" required value="ada@example.com" />
          <div data-sw-field-error data-match="valueMissing">Enter an email address.</div>
        </div>
        <button type="reset">Reset</button>
      </form>
    `;

    const form = document.querySelector<HTMLFormElement>("[data-sw-form]")!;
    const field = document.querySelector<HTMLElement>("[data-sw-field]")!;
    const input = document.querySelector<HTMLInputElement>("[data-sw-field-control]")!;
    const error = document.querySelector<HTMLElement>("[data-sw-field-error]")!;
    createForm(form);

    input.focus();
    input.blur();
    input.value = "";
    input.dispatchEvent(new InputEvent("input", { bubbles: true }));
    await waitForMacrotask();
    expect(form.checkValidity()).toBe(false);
    await waitForMacrotask();

    expect(field).toHaveAttribute("data-dirty");
    expect(field).toHaveAttribute("data-touched");
    expect(field).toHaveAttribute("data-submitted");
    expect(field).toHaveAttribute("data-error-visible");
    expect(error.hidden).toBe(false);

    form.reset();
    await waitForMacrotask();

    expect(input.value).toBe("ada@example.com");
    expect(field).not.toHaveAttribute("data-dirty");
    expect(field).not.toHaveAttribute("data-touched");
    expect(field).not.toHaveAttribute("data-submitted");
    expect(field).not.toHaveAttribute("data-error-visible");
    expect(error.hidden).toBe(true);
  });

  it("registers fields added after initialization and validates them", async () => {
    document.body.innerHTML = `
      <form data-sw-form>
        <div data-sw-field data-name="email">
          <input data-sw-field-control data-sw-input value="ada@example.com" />
        </div>
      </form>
    `;

    const form = document.querySelector<HTMLFormElement>("[data-sw-form]")!;
    const instance = createForm(form);

    expect(instance.getFields().map((field) => field.name)).toEqual(["email"]);

    form.insertAdjacentHTML(
      "beforeend",
      `
        <div data-sw-field data-name="handle">
          <input data-sw-field-control data-sw-input required />
          <div data-sw-field-error data-match="valueMissing">Choose a handle.</div>
        </div>
      `,
    );
    await waitForMacrotask();

    expect(instance.getFields().map((field) => field.name)).toEqual(["email", "handle"]);
    expect(form.checkValidity()).toBe(false);
    await waitForMacrotask();
    expect(instance.getErrors()).toEqual([
      expect.objectContaining({
        key: "valueMissing",
        name: "handle",
      }),
    ]);
  });

  it("resets dynamically inserted fields while keeping them registered", async () => {
    document.body.innerHTML = `
      <form data-sw-form data-validation-timing="input" data-error-visibility="input">
        <div data-sw-field data-name="title">
          <input data-sw-field-control data-sw-input value="Runtime forms" />
        </div>
      </form>
    `;

    const form = document.querySelector<HTMLFormElement>("[data-sw-form]")!;
    const instance = createForm(form);

    form.insertAdjacentHTML(
      "beforeend",
      `
        <div data-sw-field data-name="notes">
          <input data-sw-field-control data-sw-input required value="Draft notes" />
          <div data-sw-field-error data-match="valueMissing">Enter notes.</div>
        </div>
      `,
    );
    await waitForMacrotask();

    const notesField = document.querySelector<HTMLElement>('[data-sw-field][data-name="notes"]')!;
    const notesInput = notesField.querySelector<HTMLInputElement>("[data-sw-field-control]")!;
    const notesError = notesField.querySelector<HTMLElement>("[data-sw-field-error]")!;

    notesInput.focus();
    notesInput.blur();
    notesInput.value = "";
    notesInput.dispatchEvent(new InputEvent("input", { bubbles: true }));
    await waitForMacrotask();

    expect(notesField).toHaveAttribute("data-dirty");
    expect(notesField).toHaveAttribute("data-touched");
    expect(notesField).toHaveAttribute("data-invalid");
    expect(notesError.hidden).toBe(false);

    form.reset();
    await waitForMacrotask();

    expect(instance.getFields().map((field) => field.name)).toEqual(["title", "notes"]);
    expect(notesInput.value).toBe("Draft notes");
    expect(notesField).not.toHaveAttribute("data-dirty");
    expect(notesField).not.toHaveAttribute("data-touched");
    expect(notesField).not.toHaveAttribute("data-invalid");
    expect(notesField).not.toHaveAttribute("data-error-visible");
    expect(notesError.hidden).toBe(true);
  });

  it("drops removed fields from errors values and focus targets", async () => {
    document.body.innerHTML = `
      <form data-sw-form>
        <div data-sw-field data-name="email">
          <input data-sw-field-control data-sw-input type="email" required />
          <div data-sw-field-error data-match="valueMissing">Enter an email address.</div>
        </div>
        <div data-sw-field data-name="handle">
          <input data-sw-field-control data-sw-input value="ada" />
        </div>
      </form>
    `;

    const form = document.querySelector<HTMLFormElement>("[data-sw-form]")!;
    const emailField = document.querySelector<HTMLElement>('[data-sw-field][data-name="email"]')!;
    const handleInput = document.querySelector<HTMLInputElement>(
      '[data-sw-field][data-name="handle"] [data-sw-field-control]',
    )!;
    const instance = createForm(form);

    expect(form.checkValidity()).toBe(false);
    await waitForMacrotask();
    expect(instance.getErrors().map((error) => error.name)).toEqual(["email"]);

    emailField.remove();
    await waitForMacrotask();

    expect(instance.getFields().map((field) => field.name)).toEqual(["handle"]);
    expect(instance.getErrors()).toEqual([]);
    expect(form.checkValidity()).toBe(true);
    await waitForMacrotask();
    expect(document.activeElement).not.toBe(emailField.querySelector("[data-sw-field-control]"));
    expect(new FormData(form).get("handle")).toBe("ada");
    expect(handleInput).toHaveAttribute("data-valid");
  });

  it("represents duplicate field names as repeated form values", () => {
    document.body.innerHTML = `
      <form data-sw-form>
        <div data-sw-field data-name="tag">
          <input data-sw-field-control data-sw-input value="runtime" />
        </div>
        <div data-sw-field data-name="tag">
          <input data-sw-field-control data-sw-input value="forms" />
        </div>
      </form>
    `;

    const form = document.querySelector<HTMLFormElement>("[data-sw-form]")!;
    const managedSubmit = vi.fn();
    const instance = createForm(form, { onSubmit: managedSubmit });

    expect(instance.getFields().map((field) => field.name)).toEqual(["tag", "tag"]);
    expect(new FormData(form).getAll("tag")).toEqual(["runtime", "forms"]);

    form.dispatchEvent(new SubmitEvent("submit", { bubbles: true, cancelable: true }));

    expect(managedSubmit).toHaveBeenCalledWith(
      expect.objectContaining({
        values: {
          tag: ["runtime", "forms"],
        },
      }),
    );
  });

  it("updates managed submit options when initialized again", () => {
    document.body.innerHTML = `
      <form data-sw-form>
        <div data-sw-field data-name="email">
          <input data-sw-field-control data-sw-input value="ada@example.com" />
        </div>
        <button type="submit">Submit</button>
      </form>
    `;

    const form = document.querySelector<HTMLFormElement>("[data-sw-form]")!;
    const submitter = document.querySelector<HTMLButtonElement>('button[type="submit"]')!;
    const firstSubmit = vi.fn();
    const secondSubmit = vi.fn();

    const firstInstance = createForm(form, { onSubmit: firstSubmit });
    const secondInstance = createForm(form, { onSubmit: secondSubmit });

    expect(secondInstance).toBe(firstInstance);

    const submitEvent = new SubmitEvent("submit", {
      bubbles: true,
      cancelable: true,
      submitter,
    });
    expect(form.dispatchEvent(submitEvent)).toBe(false);

    expect(firstSubmit).not.toHaveBeenCalled();
    expect(secondSubmit).toHaveBeenCalledWith(
      expect.objectContaining({
        event: submitEvent,
        submitter,
        values: { email: "ada@example.com" },
      }),
    );
  });

  it("submits files dropped onto a Dropzone through native FormData and managed values", () => {
    document.body.innerHTML = `
      <form data-sw-form>
        <label data-sw-dropzone>
          <input data-sw-dropzone-input type="file" name="resume" />
        </label>
        <button type="submit">Submit</button>
      </form>
    `;

    const form = document.querySelector<HTMLFormElement>("[data-sw-form]")!;
    const dropzoneRoot = document.querySelector<HTMLElement>("[data-sw-dropzone]")!;
    const submitter = document.querySelector<HTMLButtonElement>('button[type="submit"]')!;
    const file = new File(["resume"], "resume.pdf", { type: "application/pdf" });
    const transfer = new DataTransfer();
    transfer.items.add(file);
    const managedSubmit = vi.fn();

    createDropzone(dropzoneRoot);
    createForm(form, { onSubmit: managedSubmit });

    dropzoneRoot.dispatchEvent(new DragEvent("drop", { bubbles: true, dataTransfer: transfer }));

    expect(new FormData(form).get("resume")).toBe(file);

    const submitEvent = new SubmitEvent("submit", {
      bubbles: true,
      cancelable: true,
      submitter,
    });
    expect(form.dispatchEvent(submitEvent)).toBe(false);

    expect(managedSubmit).toHaveBeenCalledWith(
      expect.objectContaining({
        event: submitEvent,
        values: {
          resume: file,
        },
      }),
    );
  });

  it("excludes fields disabled after initialization from values and validation", async () => {
    document.body.innerHTML = `
      <form data-sw-form data-validation-timing="input" data-error-visibility="input">
        <div data-sw-field data-name="email">
          <input data-sw-field-control data-sw-input required />
          <div data-sw-field-error data-match="valueMissing">Enter an email address.</div>
        </div>
      </form>
    `;

    const form = document.querySelector<HTMLFormElement>("[data-sw-form]")!;
    const field = document.querySelector<HTMLElement>("[data-sw-field]")!;
    const input = document.querySelector<HTMLInputElement>("[data-sw-field-control]")!;
    const error = document.querySelector<HTMLElement>("[data-sw-field-error]")!;
    const instance = createForm(form);

    input.dispatchEvent(new InputEvent("input", { bubbles: true }));
    await waitForMacrotask();
    expect(instance.getErrors().map((fieldError) => fieldError.name)).toEqual(["email"]);
    expect(field).toHaveAttribute("data-invalid");

    field.setAttribute("data-disabled", "");
    await waitForMacrotask();

    expect(input.disabled).toBe(true);
    expect(instance.getFields()[0]?.disabled).toBe(true);
    expect(form.checkValidity()).toBe(true);
    await waitForMacrotask();
    expect(instance.getErrors()).toEqual([]);
    expect(field).not.toHaveAttribute("data-invalid");
    expect(error.hidden).toBe(true);
    expect(new FormData(form).has("email")).toBe(false);

    input.value = "ada@example.com";
    field.removeAttribute("data-disabled");
    await waitForMacrotask();

    expect(input.disabled).toBe(false);
    expect(input).not.toHaveAttribute("data-disabled");
    expect(instance.getFields()[0]?.disabled).toBe(false);
    expect(form.checkValidity()).toBe(true);
    await waitForMacrotask();
    expect(instance.getErrors()).toEqual([]);
    expect(new FormData(form).get("email")).toBe("ada@example.com");
  });

  it("honors owned native control disabled changes after initialization", async () => {
    document.body.innerHTML = `
      <form data-sw-form>
        <div data-sw-field data-name="email">
          <input data-sw-field-control data-sw-input required />
          <div data-sw-field-error data-match="valueMissing">Enter an email address.</div>
        </div>
      </form>
    `;

    const form = document.querySelector<HTMLFormElement>("[data-sw-form]")!;
    const field = document.querySelector<HTMLElement>("[data-sw-field]")!;
    const input = document.querySelector<HTMLInputElement>("[data-sw-field-control]")!;
    const instance = createForm(form);

    input.disabled = true;
    await waitForMacrotask();

    expect(input.disabled).toBe(true);
    expect(input).toHaveAttribute("data-disabled");
    expect(field).not.toHaveAttribute("data-disabled");
    expect(instance.getFields()[0]?.disabled).toBe(true);
    expect(form.checkValidity()).toBe(true);
    await waitForMacrotask();
    expect(instance.getErrors()).toEqual([]);
    expect(new FormData(form).has("email")).toBe(false);

    input.value = "ada@example.com";
    input.disabled = false;
    await waitForMacrotask();

    expect(input.disabled).toBe(false);
    expect(input).not.toHaveAttribute("data-disabled");
    expect(instance.getFields()[0]?.disabled).toBe(false);
    expect(form.checkValidity()).toBe(true);
    await waitForMacrotask();
    expect(instance.getErrors()).toEqual([]);
    expect(new FormData(form).get("email")).toBe("ada@example.com");
  });

  it("honors owned runtime select disabled changes after initialization", async () => {
    document.body.innerHTML = `
      <form data-sw-form>
        ${renderRuntimeSelectField({ name: "theme", defaultValue: "light" })}
      </form>
    `;

    const form = document.querySelector<HTMLFormElement>("[data-sw-form]")!;
    const field = document.querySelector<HTMLElement>("[data-sw-field]")!;
    const select = document.querySelector<HTMLElement>("[data-sw-select]")!;
    const trigger = document.querySelector<HTMLButtonElement>("[data-sw-select-trigger]")!;
    const input = document.querySelector<HTMLInputElement>("[data-sw-select-input]")!;
    const instance = createForm(form);

    select.setAttribute("data-disabled", "");
    await waitForMacrotask();

    expect(select).toHaveAttribute("data-disabled");
    expect(trigger.disabled).toBe(true);
    expect(input.disabled).toBe(true);
    expect(field).not.toHaveAttribute("data-disabled");
    expect(instance.getFields()[0]?.disabled).toBe(true);
    expect(form.checkValidity()).toBe(true);
    await waitForMacrotask();
    expect(instance.getErrors()).toEqual([]);
    expect(new FormData(form).has("theme")).toBe(false);

    select.removeAttribute("data-disabled");
    await waitForMacrotask();

    expect(select).not.toHaveAttribute("data-disabled");
    expect(trigger.disabled).toBe(false);
    expect(input.disabled).toBe(false);
    expect(instance.getFields()[0]?.disabled).toBe(false);
    expect(form.checkValidity()).toBe(true);
    await waitForMacrotask();
    expect(instance.getErrors()).toEqual([]);
    expect(new FormData(form).get("theme")).toBe("light");
  });

  it("applies and clears external field errors through FieldError and ARIA", () => {
    document.body.innerHTML = `
      <form data-sw-form>
        <div data-sw-field data-name="email">
          <input data-sw-field-control data-sw-input type="email" value="ada@example.com" />
          <div data-sw-field-error data-match="customError">Email is already registered.</div>
        </div>
      </form>
    `;

    const form = document.querySelector<HTMLFormElement>("[data-sw-form]")!;
    const field = document.querySelector<HTMLElement>("[data-sw-field]")!;
    const input = document.querySelector<HTMLInputElement>("[data-sw-field-control]")!;
    const error = document.querySelector<HTMLElement>("[data-sw-field-error]")!;
    const instance = createForm(form);

    instance.setExternalErrors({
      email: "Email is already registered.",
    });

    expect(instance.getErrors()).toEqual([
      expect.objectContaining({
        key: "customError",
        message: "Email is already registered.",
        name: "email",
        source: "external",
      }),
    ]);
    expect(field).toHaveAttribute("data-invalid");
    expect(field).toHaveAttribute("data-error-visible");
    expect(error.hidden).toBe(false);
    expect(error).toHaveAttribute("data-validation-source", "external");
    expect(error).toHaveAttribute("data-validation-message", "Email is already registered.");
    expect(input).toHaveAttribute("aria-invalid", "true");
    expect(input.getAttribute("aria-describedby")?.split(/\s+/)).toContain(error.id);

    instance.clearExternalErrors("email");

    expect(instance.getErrors()).toEqual([]);
    expect(field).not.toHaveAttribute("data-invalid");
    expect(field).not.toHaveAttribute("data-error-visible");
    expect(error.hidden).toBe(true);
    expect(input).not.toHaveAttribute("aria-invalid");
  });

  it("blocks submit when a field only has an external error", () => {
    document.body.innerHTML = `
      <form data-sw-form>
        <div data-sw-field data-name="email">
          <input data-sw-field-control data-sw-input type="email" value="ada@example.com" />
          <div data-sw-field-error data-match="customError">Email is already registered.</div>
        </div>
        <button type="submit">Submit</button>
      </form>
    `;

    const form = document.querySelector<HTMLFormElement>("[data-sw-form]")!;
    const field = document.querySelector<HTMLElement>("[data-sw-field]")!;
    const submit = vi.fn();
    const instance = createForm(form);
    form.addEventListener("submit", submit);

    instance.setExternalErrors({
      email: {
        message: "Email is already registered.",
        source: "server",
      },
    });

    const submitEvent = new SubmitEvent("submit", { bubbles: true, cancelable: true });
    expect(form.dispatchEvent(submitEvent)).toBe(false);

    expect(submitEvent.defaultPrevented).toBe(true);
    expect(submit).not.toHaveBeenCalled();
    expect(field).toHaveAttribute("data-invalid");
    expect(instance.getErrors()).toEqual([
      expect.objectContaining({
        key: "customError",
        name: "email",
        source: "server",
      }),
    ]);
  });

  it("replaces external errors and can clear them when the field value changes", async () => {
    document.body.innerHTML = `
      <form data-sw-form>
        <div data-sw-field data-name="email">
          <input data-sw-field-control data-sw-input type="email" value="ada@example.com" />
          <div data-sw-field-error data-match="customError">Email is unavailable.</div>
        </div>
      </form>
    `;

    const form = document.querySelector<HTMLFormElement>("[data-sw-form]")!;
    const input = document.querySelector<HTMLInputElement>("[data-sw-field-control]")!;
    const error = document.querySelector<HTMLElement>("[data-sw-field-error]")!;
    const instance = createForm(form);

    instance.setExternalErrors(
      {
        email: "Email is already registered.",
      },
      { clearOnChange: true },
    );
    instance.setExternalErrors(
      {
        email: {
          message: "Email cannot be used for this workspace.",
          source: "server",
        },
      },
      { clearOnChange: true },
    );

    expect(instance.getErrors()).toEqual([
      expect.objectContaining({
        message: "Email cannot be used for this workspace.",
        name: "email",
        source: "server",
      }),
    ]);
    expect(error).toHaveAttribute(
      "data-validation-message",
      "Email cannot be used for this workspace.",
    );
    expect(error).toHaveAttribute("data-validation-source", "server");

    input.value = "grace@example.com";
    input.dispatchEvent(new InputEvent("input", { bubbles: true }));
    await waitForMacrotask();

    expect(instance.getErrors()).toEqual([]);
    expect(error.hidden).toBe(true);
    expect(input).not.toHaveAttribute("aria-invalid");
  });

  it("can clear external errors when a runtime select value changes", async () => {
    document.body.innerHTML = `
      <form data-sw-form>
        ${renderRuntimeSelectField({ name: "theme", defaultValue: "light" })}
      </form>
    `;

    const form = document.querySelector<HTMLFormElement>("[data-sw-form]")!;
    const field = document.querySelector<HTMLElement>("[data-sw-field]")!;
    const customError = document.createElement("div");
    customError.setAttribute("data-sw-field-error", "");
    customError.setAttribute("data-match", "customError");
    customError.textContent = "Theme is no longer available.";
    field.append(customError);

    const instance = createForm(form);
    instance.setExternalErrors(
      {
        theme: {
          message: "Theme is no longer available.",
          source: "server",
        },
      },
      { clearOnChange: true },
    );

    expect(instance.getErrors()).toEqual([
      expect.objectContaining({
        key: "customError",
        name: "theme",
        source: "server",
      }),
    ]);
    expect(field).toHaveAttribute("data-invalid");
    expect(customError.hidden).toBe(false);

    document.querySelector<HTMLButtonElement>("[data-sw-select-trigger]")!.click();
    await waitForMacrotask();
    document.querySelector<HTMLElement>('[data-sw-select-item][data-value="dark"]')!.click();
    await waitForMacrotask();
    await waitForMacrotask();

    expect(instance.getErrors()).toEqual([]);
    expect(field).not.toHaveAttribute("data-invalid");
    expect(customError.hidden).toBe(true);
    expect(new FormData(form).get("theme")).toBe("dark");
  });

  it("can clear external errors when migrated boolean and group values change", async () => {
    document.body.innerHTML = `
      <form data-sw-form>
        <div data-sw-field data-name="accept">
          <span data-sw-checkbox data-value="yes">
            <input data-sw-checkbox-input type="checkbox" />
          </span>
          <div data-sw-field-error data-match="customError">Acceptance is blocked.</div>
        </div>
        <div data-sw-field data-name="plan">
          <div data-sw-radio-group>
            <span data-sw-radio data-value="basic">
              <input data-sw-radio-input type="radio" />
            </span>
            <span data-sw-radio data-value="pro">
              <input data-sw-radio-input type="radio" />
            </span>
          </div>
          <div data-sw-field-error data-match="customError">Plan is blocked.</div>
        </div>
      </form>
    `;

    const form = document.querySelector<HTMLFormElement>("[data-sw-form]")!;
    const checkbox = document.querySelector<HTMLElement>("[data-sw-checkbox]")!;
    const pro = document.querySelector<HTMLElement>('[data-sw-radio][data-value="pro"]')!;
    const acceptField = document.querySelector<HTMLElement>('[data-sw-field][data-name="accept"]')!;
    const planField = document.querySelector<HTMLElement>('[data-sw-field][data-name="plan"]')!;
    const acceptError = acceptField.querySelector<HTMLElement>("[data-sw-field-error]")!;
    const planError = planField.querySelector<HTMLElement>("[data-sw-field-error]")!;
    const instance = createForm(form);

    await waitFor(() => {
      expect(
        document.querySelector<HTMLInputElement>(
          '[data-sw-field][data-name="accept"] [data-sw-checkbox-input]',
        )!.name,
      ).toBe("accept");
      expect(
        document.querySelector<HTMLInputElement>(
          '[data-sw-radio][data-value="pro"] [data-sw-radio-input]',
        )!.name,
      ).toBe("plan");
    });

    instance.setExternalErrors(
      {
        accept: {
          message: "Acceptance is blocked.",
          source: "server",
        },
        plan: {
          message: "Plan is blocked.",
          source: "server",
        },
      },
      { clearOnChange: true },
    );

    expect(acceptField).toHaveAttribute("data-invalid");
    expect(planField).toHaveAttribute("data-invalid");
    expect(acceptError.hidden).toBe(false);
    expect(planError.hidden).toBe(false);

    checkbox.click();
    await waitFor(() => {
      expect(instance.getErrors()).toEqual([
        expect.objectContaining({
          key: "customError",
          name: "plan",
          source: "server",
        }),
      ]);
      expect(acceptField).not.toHaveAttribute("data-invalid");
      expect(acceptError.hidden).toBe(true);
      expect(new FormData(form).get("accept")).toBe("yes");
    });

    pro.click();
    await waitFor(() => {
      expect(instance.getErrors()).toEqual([]);
      expect(planField).not.toHaveAttribute("data-invalid");
      expect(planError.hidden).toBe(true);
      expect(new FormData(form).get("plan")).toBe("pro");
    });
  });

  it("adopts server-rendered initial errors from FieldError markup", () => {
    document.body.innerHTML = `
      <form data-sw-form>
        <div data-sw-field data-name="email">
          <input data-sw-field-control data-sw-input type="email" value="ada@example.com" />
          <div
            data-sw-field-error
            data-match="customError"
            data-validation-source="server"
            data-validation-message="Email is already registered."
          >
            Email is already registered.
          </div>
        </div>
      </form>
    `;

    const form = document.querySelector<HTMLFormElement>("[data-sw-form]")!;
    const field = document.querySelector<HTMLElement>("[data-sw-field]")!;
    const input = document.querySelector<HTMLInputElement>("[data-sw-field-control]")!;
    const error = document.querySelector<HTMLElement>("[data-sw-field-error]")!;
    const instance = createForm(form);

    expect(instance.getErrors()).toEqual([
      expect.objectContaining({
        key: "customError",
        message: "Email is already registered.",
        name: "email",
        source: "server",
      }),
    ]);
    expect(field).toHaveAttribute("data-invalid");
    expect(field).toHaveAttribute("data-error-visible");
    expect(error.hidden).toBe(false);
    expect(input).toHaveAttribute("aria-invalid", "true");
    expect(input.getAttribute("aria-describedby")?.split(/\s+/)).toContain(error.id);
  });

  it("keeps native validation details ahead of external errors for generic feedback", async () => {
    document.body.innerHTML = `
      <form data-sw-form>
        <div data-sw-field data-name="email">
          <input data-sw-field-control data-sw-input type="email" required />
          <div data-sw-field-error>Fix the email.</div>
          <div data-sw-field-error data-match="valueMissing">Enter an email address.</div>
          <div data-sw-field-error data-match="customError">Email is already registered.</div>
        </div>
      </form>
    `;

    const form = document.querySelector<HTMLFormElement>("[data-sw-form]")!;
    const genericError = document.querySelector<HTMLElement>("[data-sw-field-error]")!;
    const nativeError = document.querySelector<HTMLElement>(
      '[data-sw-field-error][data-match="valueMissing"]',
    )!;
    const externalError = document.querySelector<HTMLElement>(
      '[data-sw-field-error][data-match="customError"]',
    )!;
    const instance = createForm(form);

    instance.setExternalErrors({
      email: "Email is already registered.",
    });

    expect(form.checkValidity()).toBe(false);
    await waitForMacrotask();

    expect(instance.getErrors()).toEqual([
      expect.objectContaining({
        key: "valueMissing",
        name: "email",
        source: "native",
      }),
      expect.objectContaining({
        key: "customError",
        name: "email",
        source: "external",
      }),
    ]);
    expect(genericError).toHaveAttribute("data-validation-source", "native");
    expect(genericError).toHaveAttribute("data-validation-key", "valueMissing");
    expect(nativeError.hidden).toBe(false);
    expect(externalError.hidden).toBe(false);
  });

  it("runs field-level sync validators through FieldError and focuses the first invalid field", async () => {
    document.body.innerHTML = `
      <form data-sw-form>
        <div data-sw-field data-name="handle">
          <input data-sw-field-control data-sw-input value="admin" />
          <div data-sw-field-error data-match="customError">Handle is reserved.</div>
        </div>
      </form>
    `;

    const form = document.querySelector<HTMLFormElement>("[data-sw-form]")!;
    const field = document.querySelector<HTMLElement>("[data-sw-field]")!;
    const input = document.querySelector<HTMLInputElement>("[data-sw-field-control]")!;
    const error = document.querySelector<HTMLElement>("[data-sw-field-error]")!;
    const instance = createForm(form, {
      fieldValidators: {
        handle: (value) => (value === "admin" ? "Handle is reserved." : null),
      },
    });

    expect(form.checkValidity()).toBe(false);
    await waitForMacrotask();

    expect(instance.getErrors()).toEqual([
      expect.objectContaining({
        key: "customError",
        message: "Handle is reserved.",
        name: "handle",
        source: "custom",
      }),
    ]);
    expect(field).toHaveAttribute("data-invalid");
    expect(field).toHaveAttribute("data-error-visible");
    expect(error.hidden).toBe(false);
    expect(error).toHaveAttribute("data-validation-source", "custom");
    expect(document.activeElement).toBe(input);

    input.value = "ada";
    input.dispatchEvent(new InputEvent("input", { bubbles: true }));
    await waitForMacrotask();

    expect(instance.getErrors()).toEqual([]);
    expect(field).not.toHaveAttribute("data-invalid");
    expect(error.hidden).toBe(true);
  });

  it("passes a real File to field-level validators for file inputs", () => {
    document.body.innerHTML = `
      <form data-sw-form>
        <div data-sw-field data-name="attachment">
          <input data-sw-field-control data-sw-input type="file" />
        </div>
      </form>
    `;

    const form = document.querySelector<HTMLFormElement>("[data-sw-form]")!;
    const input = document.querySelector<HTMLInputElement>("[data-sw-field-control]")!;
    const file = new File(["hello"], "hello.txt", { type: "text/plain" });
    const transfer = new DataTransfer();
    transfer.items.add(file);
    input.files = transfer.files;
    const validator = vi.fn(() => null);

    createForm(form, {
      fieldValidators: {
        attachment: validator,
      },
    });
    form.checkValidity();

    expect(validator).toHaveBeenCalledWith(file, expect.objectContaining({ name: "attachment" }));
  });

  it("passes File arrays to field-level validators for multiple file inputs", () => {
    document.body.innerHTML = `
      <form data-sw-form>
        <div data-sw-field data-name="attachments">
          <input data-sw-field-control data-sw-input type="file" multiple />
        </div>
      </form>
    `;

    const form = document.querySelector<HTMLFormElement>("[data-sw-form]")!;
    const input = document.querySelector<HTMLInputElement>("[data-sw-field-control]")!;
    const firstFile = new File(["first"], "first.txt", { type: "text/plain" });
    const secondFile = new File(["second"], "second.txt", { type: "text/plain" });
    const transfer = new DataTransfer();
    transfer.items.add(firstFile);
    transfer.items.add(secondFile);
    input.files = transfer.files;
    const validator = vi.fn(() => null);

    createForm(form, {
      fieldValidators: {
        attachments: validator,
      },
    });
    form.checkValidity();

    expect(validator).toHaveBeenCalledWith(
      [firstFile, secondFile],
      expect.objectContaining({ name: "attachments" }),
    );
  });

  it("preserves File array shape for multiple file validators with one selected file", () => {
    document.body.innerHTML = `
      <form data-sw-form>
        <div data-sw-field data-name="attachments">
          <input data-sw-field-control data-sw-input type="file" multiple />
        </div>
      </form>
    `;

    const form = document.querySelector<HTMLFormElement>("[data-sw-form]")!;
    const input = document.querySelector<HTMLInputElement>("[data-sw-field-control]")!;
    const file = new File(["only"], "only.txt", { type: "text/plain" });
    const transfer = new DataTransfer();
    transfer.items.add(file);
    input.files = transfer.files;
    const validator = vi.fn(() => null);

    createForm(form, {
      fieldValidators: {
        attachments: validator,
      },
    });
    form.checkValidity();

    expect(validator).toHaveBeenCalledWith(
      [file],
      expect.objectContaining({ name: "attachments" }),
    );
  });

  it("runs field-level async validators through FieldError and validating state", async () => {
    document.body.innerHTML = `
      <form data-sw-form data-validation-timing="input" data-error-visibility="input">
        <div data-sw-field data-name="handle">
          <input data-sw-field-control data-sw-input />
          <div data-sw-field-error data-match="customError">Handle is unavailable.</div>
        </div>
      </form>
    `;

    const form = document.querySelector<HTMLFormElement>("[data-sw-form]")!;
    const field = document.querySelector<HTMLElement>("[data-sw-field]")!;
    const input = document.querySelector<HTMLInputElement>("[data-sw-field-control]")!;
    const error = document.querySelector<HTMLElement>("[data-sw-field-error]")!;
    let resolveValidation!: (result: "Handle is unavailable.") => void;
    const validator = vi.fn(
      () =>
        new Promise<"Handle is unavailable.">((resolve) => {
          resolveValidation = resolve;
        }),
    );
    const instance = createForm(form, {
      asyncFieldValidators: {
        handle: validator,
      },
    });

    input.value = "taken";
    input.dispatchEvent(new InputEvent("input", { bubbles: true }));
    await waitForMacrotask();

    expect(validator).toHaveBeenCalledWith(
      "taken",
      expect.objectContaining({
        field: expect.objectContaining({ name: "handle" }),
        form,
        name: "handle",
        signal: expect.any(AbortSignal),
      }),
    );
    expect(form).toHaveAttribute("data-validating");
    expect(field).toHaveAttribute("data-validating");
    expect(error.hidden).toBe(true);

    resolveValidation("Handle is unavailable.");
    await waitForMicrotasks();

    expect(form).not.toHaveAttribute("data-validating");
    expect(field).not.toHaveAttribute("data-validating");
    expect(field).toHaveAttribute("data-invalid");
    expect(field).toHaveAttribute("data-error-visible");
    expect(error.hidden).toBe(false);
    expect(error).toHaveAttribute("data-validation-source", "async");
    expect(instance.getErrors()).toEqual([
      expect.objectContaining({
        key: "customError",
        message: "Handle is unavailable.",
        name: "handle",
        source: "async",
      }),
    ]);
  });

  it("starts independent async field validators before either result resolves", async () => {
    document.body.innerHTML = `
      <form data-sw-form data-validation-timing="input" data-error-visibility="input">
        <div data-sw-field data-name="handle">
          <input data-sw-field-control data-sw-input value="ada" />
          <div data-sw-field-error data-match="customError">Handle error.</div>
        </div>
        <div data-sw-field data-name="workspace">
          <input data-sw-field-control data-sw-input value="engine" />
          <div data-sw-field-error data-match="customError">Workspace error.</div>
        </div>
        <button type="submit">Submit</button>
      </form>
    `;

    const form = document.querySelector<HTMLFormElement>("[data-sw-form]")!;
    const started: string[] = [];
    const resolvers: Record<string, (result: string | null) => void> = {};
    const createValidator = (name: string) =>
      vi.fn(
        () =>
          new Promise<string | null>((resolve) => {
            started.push(name);
            resolvers[name] = resolve;
          }),
      );
    const handleValidator = createValidator("handle");
    const workspaceValidator = createValidator("workspace");
    const managedSubmit = vi.fn();
    const instance = createForm(form, {
      asyncFieldValidators: {
        handle: handleValidator,
        workspace: workspaceValidator,
      },
      onSubmit: managedSubmit,
    });

    const submitEvent = new SubmitEvent("submit", { bubbles: true, cancelable: true });
    expect(form.dispatchEvent(submitEvent)).toBe(false);

    expect(started).toEqual(["handle", "workspace"]);
    expect(handleValidator).toHaveBeenCalledTimes(1);
    expect(workspaceValidator).toHaveBeenCalledTimes(1);
    expect(managedSubmit).not.toHaveBeenCalled();

    resolvers.workspace?.("Workspace is reserved.");
    await waitForMicrotasks();
    expect(instance.getErrors()).toEqual([]);

    resolvers.handle?.("Handle is unavailable.");
    await waitForMicrotasks();

    expect(instance.getErrors()).toEqual([
      expect.objectContaining({ message: "Handle is unavailable.", name: "handle" }),
      expect.objectContaining({ message: "Workspace is reserved.", name: "workspace" }),
    ]);
  });

  it("starts independent async form validators before either result resolves", async () => {
    document.body.innerHTML = `
      <form data-sw-form data-validation-timing="input" data-error-visibility="input">
        <div data-sw-field data-name="handle">
          <input data-sw-field-control data-sw-input value="ada" />
          <div data-sw-field-error data-match="customError">Handle error.</div>
        </div>
        <div data-sw-field data-name="workspace">
          <input data-sw-field-control data-sw-input value="engine" />
          <div data-sw-field-error data-match="customError">Workspace error.</div>
        </div>
      </form>
    `;

    const form = document.querySelector<HTMLFormElement>("[data-sw-form]")!;
    const handleInput = document.querySelector<HTMLInputElement>(
      '[data-sw-field][data-name="handle"] [data-sw-field-control]',
    )!;
    const started: string[] = [];
    const resolvers: Record<string, (result: Record<string, string> | null) => void> = {};
    const createValidator = (name: string) =>
      vi.fn(
        () =>
          new Promise<Record<string, string> | null>((resolve) => {
            started.push(name);
            resolvers[name] = resolve;
          }),
      );
    const firstValidator = createValidator("first");
    const secondValidator = createValidator("second");
    const instance = createForm(form, {
      asyncFormValidators: [firstValidator, secondValidator],
    });

    handleInput.dispatchEvent(new InputEvent("input", { bubbles: true }));
    await waitForMacrotask();

    expect(started).toEqual(["first", "second"]);
    expect(firstValidator).toHaveBeenCalledTimes(1);
    expect(secondValidator).toHaveBeenCalledTimes(1);

    resolvers.second?.({ workspace: "Workspace is reserved." });
    await waitForMicrotasks();
    expect(instance.getErrors()).toEqual([]);

    resolvers.first?.({ handle: "Handle is unavailable." });
    await waitForMicrotasks();

    expect(instance.getErrors()).toEqual([
      expect.objectContaining({ message: "Handle is unavailable.", name: "handle" }),
      expect.objectContaining({ message: "Workspace is reserved.", name: "workspace" }),
    ]);
  });

  it("debounces async validators and ignores stale async results", async () => {
    vi.useFakeTimers();
    document.body.innerHTML = `
      <form data-sw-form data-validation-timing="input" data-error-visibility="input">
        <div data-sw-field data-name="handle">
          <input data-sw-field-control data-sw-input />
          <div data-sw-field-error data-match="customError">Handle is unavailable.</div>
        </div>
      </form>
    `;

    const form = document.querySelector<HTMLFormElement>("[data-sw-form]")!;
    const field = document.querySelector<HTMLElement>("[data-sw-field]")!;
    const input = document.querySelector<HTMLInputElement>("[data-sw-field-control]")!;
    const error = document.querySelector<HTMLElement>("[data-sw-field-error]")!;
    const calls: Array<{
      resolve: (result: string | null) => void;
      signal: AbortSignal;
      value: FormFieldRegistration["value"];
    }> = [];
    const validator = vi.fn(
      (value: FormFieldRegistration["value"], { signal }: { signal: AbortSignal }) =>
        new Promise<string | null>((resolve) => {
          calls.push({ resolve, signal, value });
        }),
    );
    const instance = createForm(form, {
      asyncFieldValidators: {
        handle: validator,
      },
      asyncValidationDebounceMs: 25,
    });

    input.value = "taken";
    input.dispatchEvent(new InputEvent("input", { bubbles: true }));

    expect(field).toHaveAttribute("data-validating");
    expect(validator).not.toHaveBeenCalled();

    await vi.advanceTimersByTimeAsync(24);
    expect(validator).not.toHaveBeenCalled();

    await vi.advanceTimersByTimeAsync(1);
    expect(validator).toHaveBeenCalledTimes(1);
    expect(calls[0]?.value).toBe("taken");
    expect(calls[0]?.signal.aborted).toBe(false);

    input.value = "available";
    input.dispatchEvent(new InputEvent("input", { bubbles: true }));
    await Promise.resolve();

    expect(calls[0]?.signal.aborted).toBe(true);
    expect(field).toHaveAttribute("data-validating");

    await vi.advanceTimersByTimeAsync(25);
    expect(validator).toHaveBeenCalledTimes(2);
    expect(calls[1]?.value).toBe("available");

    calls[0]?.resolve("Handle is unavailable.");
    await waitForMicrotasks();

    expect(field).toHaveAttribute("data-validating");
    expect(field).not.toHaveAttribute("data-invalid");
    expect(error.hidden).toBe(true);

    calls[1]?.resolve(null);
    await waitForMicrotasks();

    expect(form).not.toHaveAttribute("data-validating");
    expect(field).not.toHaveAttribute("data-validating");
    expect(field).not.toHaveAttribute("data-invalid");
    expect(error.hidden).toBe(true);
    expect(instance.getErrors()).toEqual([]);
  });

  it("ignores abort rejections from stale async validators", async () => {
    vi.useFakeTimers();
    document.body.innerHTML = `
      <form data-sw-form data-validation-timing="input" data-error-visibility="input">
        <div data-sw-field data-name="handle">
          <input data-sw-field-control data-sw-input />
          <div data-sw-field-error data-match="customError">Handle is unavailable.</div>
        </div>
      </form>
    `;

    const form = document.querySelector<HTMLFormElement>("[data-sw-form]")!;
    const field = document.querySelector<HTMLElement>("[data-sw-field]")!;
    const input = document.querySelector<HTMLInputElement>("[data-sw-field-control]")!;
    const error = document.querySelector<HTMLElement>("[data-sw-field-error]")!;
    const validator = vi.fn(
      (value: FormFieldRegistration["value"], { signal }: { signal: AbortSignal }) =>
        new Promise<string | null>((resolve, reject) => {
          signal.addEventListener(
            "abort",
            () => reject(new DOMException("The operation was aborted.", "AbortError")),
            { once: true },
          );
          window.setTimeout(() => resolve(value === "taken" ? "Handle is unavailable." : null), 5);
        }),
    );
    const instance = createForm(form, {
      asyncFieldValidators: {
        handle: validator,
      },
    });

    input.value = "taken";
    input.dispatchEvent(new InputEvent("input", { bubbles: true }));
    await waitForMicrotasks();

    input.value = "available";
    input.dispatchEvent(new InputEvent("input", { bubbles: true }));
    await vi.advanceTimersByTimeAsync(5);
    await waitForMicrotasks();

    expect(validator).toHaveBeenCalledTimes(2);
    expect(form).not.toHaveAttribute("data-validating");
    expect(field).not.toHaveAttribute("data-validating");
    expect(field).not.toHaveAttribute("data-invalid");
    expect(error.hidden).toBe(true);
    expect(instance.getErrors()).toEqual([]);
  });

  it("respects async validation timing separately from async error visibility", async () => {
    document.body.innerHTML = `
      <form data-sw-form data-validation-timing="blur" data-error-visibility="submit">
        <div data-sw-field data-name="handle">
          <input data-sw-field-control data-sw-input value="taken" />
          <div data-sw-field-error data-match="customError">Handle is unavailable.</div>
        </div>
      </form>
    `;

    const form = document.querySelector<HTMLFormElement>("[data-sw-form]")!;
    const field = document.querySelector<HTMLElement>("[data-sw-field]")!;
    const input = document.querySelector<HTMLInputElement>("[data-sw-field-control]")!;
    const error = document.querySelector<HTMLElement>("[data-sw-field-error]")!;
    const validator = vi.fn(() => Promise.resolve("Handle is unavailable."));
    createForm(form, {
      asyncFieldValidators: {
        handle: validator,
      },
    });

    input.dispatchEvent(new InputEvent("input", { bubbles: true }));
    await waitForMicrotasks();

    expect(validator).not.toHaveBeenCalled();
    expect(field).not.toHaveAttribute("data-invalid");
    expect(error.hidden).toBe(true);

    input.dispatchEvent(new FocusEvent("focusout", { bubbles: true }));
    await waitForMicrotasks();

    expect(validator).toHaveBeenCalledTimes(1);
    expect(field).toHaveAttribute("data-invalid");
    expect(field).not.toHaveAttribute("data-error-visible");
    expect(error.hidden).toBe(true);

    expect(form.checkValidity()).toBe(false);
    await waitForMacrotask();

    expect(field).toHaveAttribute("data-error-visible");
    expect(error.hidden).toBe(false);
  });

  it("runs form-level sync validators and preserves multiple custom messages", async () => {
    document.body.innerHTML = `
      <form data-sw-form>
        <div data-sw-field data-name="password">
          <input data-sw-field-control data-sw-input type="password" value="secret" />
        </div>
        <div data-sw-field data-name="confirm">
          <input data-sw-field-control data-sw-input type="password" value="different" />
          <div data-sw-field-error data-match="customError">Passwords must match.</div>
        </div>
      </form>
    `;

    const form = document.querySelector<HTMLFormElement>("[data-sw-form]")!;
    const confirmField = document.querySelector<HTMLElement>(
      '[data-sw-field][data-name="confirm"]',
    )!;
    const instance = createForm(form, {
      formValidators: [
        (values) =>
          values.password !== values.confirm
            ? {
                confirm: ["Passwords must match.", "Confirm the same password twice."],
              }
            : null,
      ],
    });

    expect(form.checkValidity()).toBe(false);
    await waitForMacrotask();

    expect(instance.getErrors()).toEqual([
      expect.objectContaining({
        message: "Passwords must match.",
        name: "confirm",
        source: "custom",
      }),
      expect.objectContaining({
        message: "Confirm the same password twice.",
        name: "confirm",
        source: "custom",
      }),
    ]);
    expect(confirmField).toHaveAttribute("data-invalid");
    expect(confirmField.querySelector<HTMLElement>("[data-sw-field-error]")).toHaveProperty(
      "hidden",
      false,
    );
  });

  it("runs form-level async validators through field-specific async errors", async () => {
    document.body.innerHTML = `
      <form data-sw-form data-validation-timing="input" data-error-visibility="input">
        <div data-sw-field data-name="workspace">
          <input data-sw-field-control data-sw-input value="starwind" />
        </div>
        <div data-sw-field data-name="project">
          <input data-sw-field-control data-sw-input value="starwind" />
          <div data-sw-field-error data-match="customError">Project already exists.</div>
        </div>
      </form>
    `;

    const form = document.querySelector<HTMLFormElement>("[data-sw-form]")!;
    const projectField = document.querySelector<HTMLElement>(
      '[data-sw-field][data-name="project"]',
    )!;
    const projectInput = projectField.querySelector<HTMLInputElement>("[data-sw-field-control]")!;
    const error = projectField.querySelector<HTMLElement>("[data-sw-field-error]")!;
    let resolveValidation!: (result: { project: "Project already exists." }) => void;
    const asyncFormValidator = vi.fn(
      () =>
        new Promise<{ project: "Project already exists." }>((resolve) => {
          resolveValidation = resolve;
        }),
    );
    const instance = createForm(form, {
      asyncFormValidators: asyncFormValidator,
    });

    projectInput.dispatchEvent(new InputEvent("input", { bubbles: true }));
    await waitForMacrotask();

    expect(asyncFormValidator).toHaveBeenCalledWith(
      expect.objectContaining({
        project: "starwind",
        workspace: "starwind",
      }),
      expect.objectContaining({
        cause: "input",
        form,
        signal: expect.any(AbortSignal),
      }),
    );
    expect(projectField).toHaveAttribute("data-validating");

    resolveValidation({ project: "Project already exists." });
    await waitForMicrotasks();

    expect(projectField).not.toHaveAttribute("data-validating");
    expect(projectField).toHaveAttribute("data-invalid");
    expect(error.hidden).toBe(false);
    expect(error).toHaveAttribute("data-validation-source", "async");
    expect(instance.getErrors()).toEqual([
      expect.objectContaining({
        message: "Project already exists.",
        name: "project",
        source: "async",
      }),
    ]);
  });

  it("accumulates field-level and form-level async errors for the same field", async () => {
    document.body.innerHTML = `
      <form data-sw-form data-validation-timing="input" data-error-visibility="input">
        <div data-sw-field data-name="handle">
          <input data-sw-field-control data-sw-input value="taken" />
          <div data-sw-field-error data-match="customError">Handle has async errors.</div>
        </div>
      </form>
    `;

    const form = document.querySelector<HTMLFormElement>("[data-sw-form]")!;
    const input = document.querySelector<HTMLInputElement>("[data-sw-field-control]")!;
    const instance = createForm(form, {
      asyncFieldValidators: {
        handle: () => Promise.resolve("Field says unavailable."),
      },
      asyncFormValidators: [
        () => Promise.resolve({ handle: "Form says reserved." }),
        () => Promise.resolve({ handle: "Policy says blocked." }),
      ],
    });

    input.dispatchEvent(new InputEvent("input", { bubbles: true }));
    await waitForMicrotasks();

    expect(instance.getErrors()).toEqual([
      expect.objectContaining({
        message: "Field says unavailable.",
        name: "handle",
        source: "async",
      }),
      expect.objectContaining({
        message: "Form says reserved.",
        name: "handle",
        source: "async",
      }),
      expect.objectContaining({
        message: "Policy says blocked.",
        name: "handle",
        source: "async",
      }),
    ]);
  });

  it("keeps same-batch field async errors before form async errors when form resolves first", async () => {
    document.body.innerHTML = `
      <form data-sw-form data-validation-timing="input" data-error-visibility="input">
        <div data-sw-field data-name="handle">
          <input data-sw-field-control data-sw-input value="taken" />
          <div data-sw-field-error data-match="customError">Handle has async errors.</div>
        </div>
      </form>
    `;

    const form = document.querySelector<HTMLFormElement>("[data-sw-form]")!;
    const input = document.querySelector<HTMLInputElement>("[data-sw-field-control]")!;
    const field = document.querySelector<HTMLElement>("[data-sw-field]")!;
    const started: string[] = [];
    let resolveField!: (result: string | null) => void;
    let resolveForm!: (result: Record<string, string> | null) => void;
    const instance = createForm(form, {
      asyncFieldValidators: {
        handle: () =>
          new Promise<string | null>((resolve) => {
            started.push("field");
            resolveField = resolve;
          }),
      },
      asyncFormValidators: [
        () =>
          new Promise<Record<string, string> | null>((resolve) => {
            started.push("form");
            resolveForm = resolve;
          }),
      ],
    });

    input.dispatchEvent(new InputEvent("input", { bubbles: true }));
    await waitForMacrotask();

    expect(started).toEqual(["field", "form"]);
    expect(field).toHaveAttribute("data-validating");

    resolveForm({ handle: "Form says reserved." });
    await waitForMicrotasks();

    expect(instance.getErrors()).toEqual([]);
    expect(field).toHaveAttribute("data-validating");

    resolveField("Field says unavailable.");
    await waitForMicrotasks();

    expect(field).not.toHaveAttribute("data-validating");
    expect(instance.getErrors()).toEqual([
      expect.objectContaining({
        message: "Field says unavailable.",
        name: "handle",
        source: "async",
      }),
      expect.objectContaining({
        message: "Form says reserved.",
        name: "handle",
        source: "async",
      }),
    ]);
  });

  it("ignores stale parallel async validation batch results", async () => {
    document.body.innerHTML = `
      <form data-sw-form data-validation-timing="input" data-error-visibility="input">
        <div data-sw-field data-name="handle">
          <input data-sw-field-control data-sw-input />
          <div data-sw-field-error data-match="customError">Handle is unavailable.</div>
        </div>
      </form>
    `;

    const form = document.querySelector<HTMLFormElement>("[data-sw-form]")!;
    const field = document.querySelector<HTMLElement>("[data-sw-field]")!;
    const input = document.querySelector<HTMLInputElement>("[data-sw-field-control]")!;
    const error = document.querySelector<HTMLElement>("[data-sw-field-error]")!;
    const fieldCalls: Array<{
      resolve: (result: string | null) => void;
      signal: AbortSignal;
      value: FormFieldRegistration["value"];
    }> = [];
    const formCalls: Array<{
      resolve: (result: Record<string, string> | null) => void;
      signal: AbortSignal;
      values: Record<string, unknown>;
    }> = [];
    const instance = createForm(form, {
      asyncFieldValidators: {
        handle: (value, { signal }) =>
          new Promise<string | null>((resolve) => {
            fieldCalls.push({ resolve, signal, value });
          }),
      },
      asyncFormValidators: [
        (values, { signal }) =>
          new Promise<Record<string, string> | null>((resolve) => {
            formCalls.push({ resolve, signal, values });
          }),
      ],
    });

    input.value = "taken";
    input.dispatchEvent(new InputEvent("input", { bubbles: true }));
    await waitForMacrotask();

    expect(fieldCalls).toHaveLength(1);
    expect(formCalls).toHaveLength(1);
    expect(fieldCalls[0]?.signal.aborted).toBe(false);
    expect(formCalls[0]?.signal.aborted).toBe(false);

    input.value = "available";
    input.dispatchEvent(new InputEvent("input", { bubbles: true }));
    await waitForMacrotask();

    expect(fieldCalls).toHaveLength(2);
    expect(formCalls).toHaveLength(2);
    expect(fieldCalls[0]?.signal.aborted).toBe(true);
    expect(formCalls[0]?.signal.aborted).toBe(true);

    fieldCalls[0]?.resolve("Stale field error.");
    formCalls[0]?.resolve({ handle: "Stale form error." });
    await waitForMicrotasks();

    expect(instance.getErrors()).toEqual([]);
    expect(field).toHaveAttribute("data-validating");
    expect(error.hidden).toBe(true);

    fieldCalls[1]?.resolve(null);
    formCalls[1]?.resolve(null);
    await waitForMicrotasks();

    expect(form).not.toHaveAttribute("data-validating");
    expect(field).not.toHaveAttribute("data-validating");
    expect(field).not.toHaveAttribute("data-invalid");
    expect(error.hidden).toBe(true);
    expect(instance.getErrors()).toEqual([]);
  });

  it("waits for async validation before managed submit and blocks async errors", async () => {
    document.body.innerHTML = `
      <form data-sw-form>
        <div data-sw-field data-name="handle">
          <input data-sw-field-control data-sw-input value="taken" />
          <div data-sw-field-error data-match="customError">Handle is unavailable.</div>
        </div>
        <button type="submit">Submit</button>
      </form>
    `;

    const form = document.querySelector<HTMLFormElement>("[data-sw-form]")!;
    const field = document.querySelector<HTMLElement>("[data-sw-field]")!;
    const input = document.querySelector<HTMLInputElement>("[data-sw-field-control]")!;
    const error = document.querySelector<HTMLElement>("[data-sw-field-error]")!;
    const asyncCalls: Array<{
      resolve: (result: string | null) => void;
      value: FormFieldRegistration["value"];
    }> = [];
    const managedSubmit = vi.fn();
    const validator = vi.fn(
      (value: FormFieldRegistration["value"]) =>
        new Promise<string | null>((resolve) => {
          asyncCalls.push({ resolve, value });
        }),
    );
    createForm(form, {
      asyncFieldValidators: {
        handle: validator,
      },
      onSubmit: managedSubmit,
    });

    const invalidSubmit = new SubmitEvent("submit", { bubbles: true, cancelable: true });
    expect(form.dispatchEvent(invalidSubmit)).toBe(false);

    expect(invalidSubmit.defaultPrevented).toBe(true);
    expect(managedSubmit).not.toHaveBeenCalled();
    expect(field).toHaveAttribute("data-validating");
    expect(asyncCalls[0]?.value).toBe("taken");

    asyncCalls[0]?.resolve("Handle is unavailable.");
    await waitForMicrotasks();

    expect(managedSubmit).not.toHaveBeenCalled();
    expect(field).not.toHaveAttribute("data-validating");
    expect(field).toHaveAttribute("data-invalid");
    expect(field).toHaveAttribute("data-error-visible");
    expect(error.hidden).toBe(false);

    input.value = "available";
    const validSubmit = new SubmitEvent("submit", { bubbles: true, cancelable: true });
    expect(form.dispatchEvent(validSubmit)).toBe(false);

    expect(managedSubmit).not.toHaveBeenCalled();
    expect(field).toHaveAttribute("data-validating");
    expect(asyncCalls[1]?.value).toBe("available");

    asyncCalls[1]?.resolve(null);
    await waitForMicrotasks();

    expect(field).not.toHaveAttribute("data-validating");
    expect(field).not.toHaveAttribute("data-invalid");
    expect(error.hidden).toBe(true);
    expect(managedSubmit).toHaveBeenCalledWith(
      expect.objectContaining({
        form,
        values: {
          handle: "available",
        },
      }),
    );
  });

  it("does not block managed submit when a pending async field is removed", async () => {
    document.body.innerHTML = `
      <form data-sw-form>
        <div data-sw-field data-name="handle">
          <label data-sw-field-label>Handle</label>
          <input data-sw-field-control data-sw-input value="taken" />
          <p data-sw-field-description>Choose a public team handle.</p>
          <div data-sw-field-item>Availability row</div>
          <div data-sw-field-error data-match="customError">Handle is unavailable.</div>
          <div data-sw-field-validity data-match="valid">Handle is available.</div>
        </div>
      </form>
    `;

    const form = document.querySelector<HTMLFormElement>("[data-sw-form]")!;
    const field = document.querySelector<HTMLElement>("[data-sw-field]")!;
    const fieldParts = Array.from(
      field.querySelectorAll<HTMLElement>(
        "[data-sw-field-label], [data-sw-field-control], [data-sw-field-description], [data-sw-field-item], [data-sw-field-error], [data-sw-field-validity]",
      ),
    );
    let resolveValidation!: (result: string) => void;
    const managedSubmit = vi.fn();
    createForm(form, {
      asyncFieldValidators: {
        handle: () =>
          new Promise<string>((resolve) => {
            resolveValidation = resolve;
          }),
      },
      onSubmit: managedSubmit,
    });

    const submitEvent = new SubmitEvent("submit", { bubbles: true, cancelable: true });
    expect(form.dispatchEvent(submitEvent)).toBe(false);
    expect(field).toHaveAttribute("data-validating");
    fieldParts.forEach((part) => expect(part).toHaveAttribute("data-validating"));

    field.remove();
    await waitForMacrotask();

    expect(field).not.toHaveAttribute("data-validating");
    fieldParts.forEach((part) => expect(part).not.toHaveAttribute("data-validating"));

    resolveValidation("Handle is unavailable.");
    await waitForMicrotasks();

    expect(managedSubmit).toHaveBeenCalledWith(
      expect.objectContaining({
        form,
        values: {},
      }),
    );
  });

  it("adapts successful schema-style validation into the form validator path", () => {
    document.body.innerHTML = `
      <form data-sw-form>
        <div data-sw-field data-name="email">
          <input data-sw-field-control data-sw-input type="email" value="ada@example.com" />
          <div data-sw-field-error data-match="customError">Email failed schema validation.</div>
        </div>
      </form>
    `;

    const form = document.querySelector<HTMLFormElement>("[data-sw-form]")!;
    const schema = vi.fn(() => ({ success: true as const }));
    const instance = createForm(form, {
      formValidators: createFormSchemaValidator(schema),
    });

    expect(form.checkValidity()).toBe(true);
    expect(schema).toHaveBeenCalledWith(
      expect.objectContaining({
        email: "ada@example.com",
      }),
    );
    expect(instance.getErrors()).toEqual([]);
  });

  it("maps schema field and form errors through FieldError with schema source", async () => {
    document.body.innerHTML = `
      <form data-sw-form>
        <div data-sw-field data-name="email">
          <input data-sw-field-control data-sw-input value="not-an-email" />
          <div data-sw-field-error data-match="customError">Email failed schema validation.</div>
        </div>
        <div data-sw-field data-name="_form">
          <div data-sw-field-error data-match="customError">Form failed schema validation.</div>
        </div>
      </form>
    `;

    const form = document.querySelector<HTMLFormElement>("[data-sw-form]")!;
    const emailField = document.querySelector<HTMLElement>('[data-sw-field][data-name="email"]')!;
    const formField = document.querySelector<HTMLElement>('[data-sw-field][data-name="_form"]')!;
    const emailError = emailField.querySelector<HTMLElement>("[data-sw-field-error]")!;
    const formError = formField.querySelector<HTMLElement>("[data-sw-field-error]")!;
    const instance = createForm(form, {
      formValidators: createFormSchemaValidator(() => ({
        issues: [
          { message: "Use a company email address.", path: "email" },
          { message: "The schema rejected this submission." },
        ],
        success: false,
      })),
    });

    expect(form.checkValidity()).toBe(false);
    await waitForMacrotask();

    expect(instance.getErrors()).toEqual([
      expect.objectContaining({
        message: "Use a company email address.",
        name: "email",
        source: "schema",
      }),
      expect.objectContaining({
        message: "The schema rejected this submission.",
        name: "_form",
        source: "schema",
      }),
    ]);
    expect(emailField).toHaveAttribute("data-invalid");
    expect(formField).toHaveAttribute("data-invalid");
    expect(emailError.hidden).toBe(false);
    expect(formError.hidden).toBe(false);
    expect(emailError).toHaveAttribute("data-validation-source", "schema");
    expect(formError).toHaveAttribute("data-validation-source", "schema");
  });

  it("supports manual schema validation and clearing stale schema errors", async () => {
    document.body.innerHTML = `
      <form data-sw-form data-validation-timing="manual" data-error-visibility="manual">
        <div data-sw-field data-name="email">
          <input data-sw-field-control data-sw-input value="not-an-email" />
          <div data-sw-field-error data-match="customError">Email failed schema validation.</div>
        </div>
        <div data-sw-field data-name="_form">
          <div data-sw-field-error data-match="customError">Form failed schema validation.</div>
        </div>
      </form>
    `;

    const form = document.querySelector<HTMLFormElement>("[data-sw-form]")!;
    const field = document.querySelector<HTMLElement>("[data-sw-field]")!;
    const formField = document.querySelector<HTMLElement>('[data-sw-field][data-name="_form"]')!;
    const input = document.querySelector<HTMLInputElement>("[data-sw-field-control]")!;
    const error = field.querySelector<HTMLElement>("[data-sw-field-error]")!;
    const formError = formField.querySelector<HTMLElement>("[data-sw-field-error]")!;
    const instance = createForm(form);
    const schema = (values: Record<string, FormDataEntryValue | FormDataEntryValue[]>) =>
      String(values.email ?? "").includes("@")
        ? { success: true as const }
        : {
            issues: [{ message: "The submitted values do not match the schema.", path: [] }],
            fieldErrors: { email: "Enter an email address." },
            success: false as const,
          };

    const invalid = validateFormSchema(readValues(form), schema);
    expect(invalid.valid).toBe(false);
    instance.setExternalErrors(invalid.errors, { clearOnChange: true });

    expect(field).toHaveAttribute("data-invalid");
    expect(error.hidden).toBe(false);
    expect(error).toHaveAttribute("data-validation-source", "schema");
    expect(formField).toHaveAttribute("data-invalid");
    expect(formError.hidden).toBe(false);
    expect(formError).toHaveAttribute("data-validation-source", "schema");
    expect(instance.getErrors()).toEqual([
      expect.objectContaining({ name: "email", source: "schema" }),
      expect.objectContaining({ name: "_form", source: "schema" }),
    ]);

    input.value = "ada@example.com";
    input.dispatchEvent(new InputEvent("input", { bubbles: true }));
    await waitForMacrotask();

    expect(instance.getErrors()).toEqual([]);
    expect(field).not.toHaveAttribute("data-invalid");
    expect(error.hidden).toBe(true);
    expect(formField).not.toHaveAttribute("data-invalid");
    expect(formError.hidden).toBe(true);

    const valid = validateFormSchema(readValues(form), schema);
    expect(valid.valid).toBe(true);
    expect(valid.errors).toEqual({});
  });

  it("runs custom validators once per whole-form validation pass", () => {
    document.body.innerHTML = `
      <form data-sw-form>
        <div data-sw-field data-name="first">
          <input data-sw-field-control data-sw-input value="ada" />
        </div>
        <div data-sw-field data-name="second">
          <input data-sw-field-control data-sw-input value="grace" />
        </div>
      </form>
    `;

    const form = document.querySelector<HTMLFormElement>("[data-sw-form]")!;
    const firstValidator = vi.fn(() => null);
    const secondValidator = vi.fn(() => null);
    const formValidator = vi.fn(() => null);
    createForm(form, {
      fieldValidators: {
        first: firstValidator,
        second: secondValidator,
      },
      formValidators: formValidator,
    });

    expect(form.checkValidity()).toBe(true);

    expect(firstValidator).toHaveBeenCalledTimes(1);
    expect(secondValidator).toHaveBeenCalledTimes(1);
    expect(formValidator).toHaveBeenCalledTimes(1);
  });

  it("runs custom validators once when native validity checks dispatch invalid events", () => {
    document.body.innerHTML = `
      <form data-sw-form>
        <div data-sw-field data-name="first">
          <input data-sw-field-control data-sw-input required />
        </div>
        <div data-sw-field data-name="second">
          <input data-sw-field-control data-sw-input value="grace" />
        </div>
      </form>
    `;

    const form = document.querySelector<HTMLFormElement>("[data-sw-form]")!;
    const firstValidator = vi.fn(() => null);
    const secondValidator = vi.fn(() => null);
    const formValidator = vi.fn(() => null);
    createForm(form, {
      fieldValidators: {
        first: firstValidator,
        second: secondValidator,
      },
      formValidators: formValidator,
    });

    expect(form.checkValidity()).toBe(false);
    expect(firstValidator).toHaveBeenCalledTimes(1);
    expect(secondValidator).toHaveBeenCalledTimes(1);
    expect(formValidator).toHaveBeenCalledTimes(1);

    vi.clearAllMocks();

    expect(form.reportValidity()).toBe(false);
    expect(firstValidator).toHaveBeenCalledTimes(1);
    expect(secondValidator).toHaveBeenCalledTimes(1);
    expect(formValidator).toHaveBeenCalledTimes(1);
  });

  it("runs custom validators once when native invalid controls block a submit attempt", async () => {
    document.body.innerHTML = `
      <form data-sw-form>
        <div data-sw-field data-name="first">
          <input data-sw-field-control data-sw-input required />
        </div>
        <div data-sw-field data-name="second">
          <input data-sw-field-control data-sw-input required />
        </div>
        <button type="submit">Submit</button>
      </form>
    `;

    const form = document.querySelector<HTMLFormElement>("[data-sw-form]")!;
    const firstValidator = vi.fn(() => null);
    const secondValidator = vi.fn(() => null);
    const formValidator = vi.fn(() => null);
    const submit = vi.fn();
    createForm(form, {
      fieldValidators: {
        first: firstValidator,
        second: secondValidator,
      },
      formValidators: formValidator,
    });
    form.addEventListener("submit", submit);

    document.querySelector<HTMLButtonElement>('button[type="submit"]')!.click();
    await waitForMacrotask();

    expect(submit).not.toHaveBeenCalled();
    expect(firstValidator).toHaveBeenCalledTimes(1);
    expect(secondValidator).toHaveBeenCalledTimes(1);
    expect(formValidator).toHaveBeenCalledTimes(1);
  });

  it("revalidates form-level custom errors for other fields when a related field changes", async () => {
    document.body.innerHTML = `
      <form data-sw-form>
        <div data-sw-field data-name="password">
          <input data-sw-field-control data-sw-input type="password" value="secret" />
        </div>
        <div data-sw-field data-name="confirm">
          <input data-sw-field-control data-sw-input type="password" value="different" />
          <div data-sw-field-error data-match="customError">Passwords must match.</div>
        </div>
      </form>
    `;

    const form = document.querySelector<HTMLFormElement>("[data-sw-form]")!;
    const password = document.querySelector<HTMLInputElement>(
      '[data-sw-field][data-name="password"] [data-sw-field-control]',
    )!;
    const confirmField = document.querySelector<HTMLElement>(
      '[data-sw-field][data-name="confirm"]',
    )!;
    const error = confirmField.querySelector<HTMLElement>("[data-sw-field-error]")!;
    const instance = createForm(form, {
      formValidators: (values) =>
        values.password !== values.confirm ? { confirm: "Passwords must match." } : null,
    });

    expect(form.checkValidity()).toBe(false);
    await waitForMacrotask();
    expect(confirmField).toHaveAttribute("data-invalid");
    expect(error.hidden).toBe(false);

    password.value = "different";
    password.dispatchEvent(new InputEvent("input", { bubbles: true }));
    await waitForMacrotask();

    expect(instance.getErrors()).toEqual([]);
    expect(confirmField).not.toHaveAttribute("data-invalid");
    expect(error.hidden).toBe(true);
  });

  it("renders matched field-validator messages in FieldError when validation message source is enabled", async () => {
    document.body.innerHTML = `
      <form data-sw-form>
        <div data-sw-field data-name="project">
          <input data-sw-field-control data-sw-input value="admin" />
          <div data-sw-field-error data-match="customError" data-message-source="validation">
            Project slug must pass custom validation.
          </div>
        </div>
      </form>
    `;

    const form = document.querySelector<HTMLFormElement>("[data-sw-form]")!;
    const error = document.querySelector<HTMLElement>("[data-sw-field-error]")!;
    createForm(form, {
      fieldValidators: {
        project: (value) =>
          value === "admin"
            ? {
                key: "customError",
                message: "The admin project slug is reserved.",
              }
            : null,
      },
    });

    expect(form.checkValidity()).toBe(false);
    await waitForMacrotask();

    expect(error.hidden).toBe(false);
    expect(error).toHaveAttribute("data-validation-key", "customError");
    expect(error).toHaveAttribute("data-validation-message", "The admin project slug is reserved.");
    expect(error).toHaveAttribute("data-validation-source", "custom");
    expect(error.textContent?.trim()).toBe("The admin project slug is reserved.");
  });

  it("renders matched form-validator messages in FieldError when validation message source is enabled", async () => {
    document.body.innerHTML = `
      <form data-sw-form>
        <div data-sw-field data-name="workspace">
          <input data-sw-field-control data-sw-input value="starwind" />
        </div>
        <div data-sw-field data-name="project">
          <input data-sw-field-control data-sw-input value="starwind" />
          <div data-sw-field-error data-match="customError" data-message-source="validation">
            Project slug must pass custom validation.
          </div>
        </div>
      </form>
    `;

    const form = document.querySelector<HTMLFormElement>("[data-sw-form]")!;
    const error = document.querySelector<HTMLElement>(
      '[data-sw-field][data-name="project"] [data-sw-field-error]',
    )!;
    createForm(form, {
      formValidators: (values) =>
        values.workspace === values.project
          ? {
              project: {
                key: "customError",
                message: "Project slug must differ from the workspace slug.",
              },
            }
          : null,
    });

    expect(form.checkValidity()).toBe(false);
    await waitForMacrotask();

    expect(error.hidden).toBe(false);
    expect(error).toHaveAttribute(
      "data-validation-message",
      "Project slug must differ from the workspace slug.",
    );
    expect(error).toHaveAttribute("data-validation-source", "custom");
    expect(error.textContent?.trim()).toBe("Project slug must differ from the workspace slug.");
  });

  it("keeps authored FieldError text unchanged by default", async () => {
    document.body.innerHTML = `
      <form data-sw-form>
        <div data-sw-field data-name="project">
          <input data-sw-field-control data-sw-input value="admin" />
          <div data-sw-field-error data-match="customError">
            Project slug must pass custom validation.
          </div>
        </div>
      </form>
    `;

    const form = document.querySelector<HTMLFormElement>("[data-sw-form]")!;
    const error = document.querySelector<HTMLElement>("[data-sw-field-error]")!;
    createForm(form, {
      fieldValidators: {
        project: (value) => (value === "admin" ? "The admin project slug is reserved." : null),
      },
    });

    expect(form.checkValidity()).toBe(false);
    await waitForMacrotask();

    expect(error.hidden).toBe(false);
    expect(error).toHaveAttribute("data-validation-message", "The admin project slug is reserved.");
    expect(error.textContent?.trim()).toBe("Project slug must pass custom validation.");
  });

  it("updates dynamic FieldError messages and restores fallback text when validation clears", async () => {
    document.body.innerHTML = `
      <form data-sw-form data-validation-timing="input" data-error-visibility="input">
        <div data-sw-field data-name="project">
          <input data-sw-field-control data-sw-input value="admin" />
          <div data-sw-field-error data-match="customError" data-message-source="validation">
            Project slug must pass custom validation.
          </div>
        </div>
      </form>
    `;

    const form = document.querySelector<HTMLFormElement>("[data-sw-form]")!;
    const input = document.querySelector<HTMLInputElement>("[data-sw-field-control]")!;
    const error = document.querySelector<HTMLElement>("[data-sw-field-error]")!;
    createForm(form, {
      fieldValidators: {
        project: (value) => {
          if (value === "admin") return "The admin project slug is reserved.";
          if (value === "root") return "The root project slug is reserved.";
          return null;
        },
      },
    });

    input.dispatchEvent(new InputEvent("input", { bubbles: true }));
    await waitForMacrotask();

    expect(error.hidden).toBe(false);
    expect(error.textContent?.trim()).toBe("The admin project slug is reserved.");

    input.value = "root";
    input.dispatchEvent(new InputEvent("input", { bubbles: true }));
    await waitForMacrotask();

    expect(error.hidden).toBe(false);
    expect(error).toHaveAttribute("data-validation-message", "The root project slug is reserved.");
    expect(error.textContent?.trim()).toBe("The root project slug is reserved.");

    input.value = "launch";
    input.dispatchEvent(new InputEvent("input", { bubbles: true }));
    await waitForMacrotask();

    expect(error.hidden).toBe(true);
    expect(error).not.toHaveAttribute("data-validation-message");
    expect(error.textContent?.trim()).toBe("Project slug must pass custom validation.");
  });

  it("refreshes dynamic FieldError fallback when authored children change before validation", async () => {
    document.body.innerHTML = `
      <form data-sw-form data-validation-timing="input" data-error-visibility="input">
        <div data-sw-field data-name="project">
          <input data-sw-field-control data-sw-input value="launch" />
          <div data-sw-field-error data-match="customError" data-message-source="validation">
            <span>Project slug must pass custom validation.</span>
          </div>
        </div>
      </form>
    `;

    const form = document.querySelector<HTMLFormElement>("[data-sw-form]")!;
    const input = document.querySelector<HTMLInputElement>("[data-sw-field-control]")!;
    const error = document.querySelector<HTMLElement>("[data-sw-field-error]")!;
    createForm(form, {
      fieldValidators: {
        project: (value) => (value === "admin" ? "The admin project slug is reserved." : null),
      },
    });

    error.innerHTML = "<span>Use a different project slug.</span>";
    await waitForMacrotask();

    expect(error.innerHTML).toContain("Use a different project slug.");

    input.value = "admin";
    input.dispatchEvent(new InputEvent("input", { bubbles: true }));
    await waitForMacrotask();

    expect(error.hidden).toBe(false);
    expect(error.textContent?.trim()).toBe("The admin project slug is reserved.");

    input.value = "launch";
    input.dispatchEvent(new InputEvent("input", { bubbles: true }));
    await waitForMacrotask();

    expect(error.hidden).toBe(true);
    expect(error.innerHTML).toContain("Use a different project slug.");
  });

  it("restores fallback text and stops managing it when dynamic FieldError message source is disabled", async () => {
    document.body.innerHTML = `
      <form data-sw-form>
        <div data-sw-field data-name="project">
          <input data-sw-field-control data-sw-input value="admin" />
          <div data-sw-field-error data-match="customError" data-message-source="validation">
            Project slug must pass custom validation.
          </div>
        </div>
      </form>
    `;

    const form = document.querySelector<HTMLFormElement>("[data-sw-form]")!;
    const error = document.querySelector<HTMLElement>("[data-sw-field-error]")!;
    createForm(form, {
      fieldValidators: {
        project: (value) => (value === "admin" ? "The admin project slug is reserved." : null),
      },
    });

    expect(form.checkValidity()).toBe(false);
    await waitForMacrotask();

    expect(error.hidden).toBe(false);
    expect(error.textContent?.trim()).toBe("The admin project slug is reserved.");

    error.setAttribute("data-message-source", "children");
    await waitForMacrotask();

    expect(error.textContent?.trim()).toBe("Project slug must pass custom validation.");

    error.textContent = "Use a different project slug.";
    await waitForMacrotask();

    expect(error.textContent?.trim()).toBe("Use a different project slug.");
  });

  it("revalidates custom validators when a runtime select value changes", async () => {
    document.body.innerHTML = `
      <form data-sw-form>
        ${renderRuntimeSelectField({ name: "theme", defaultValue: "light" })}
      </form>
    `;

    const form = document.querySelector<HTMLFormElement>("[data-sw-form]")!;
    const field = document.querySelector<HTMLElement>("[data-sw-field]")!;
    const customError = document.createElement("div");
    customError.setAttribute("data-sw-field-error", "");
    customError.setAttribute("data-match", "customError");
    customError.textContent = "Dark mode is required.";
    field.append(customError);
    const instance = createForm(form, {
      fieldValidators: {
        theme: (value) => (value === "dark" ? null : "Dark mode is required."),
      },
    });

    expect(form.checkValidity()).toBe(false);
    await waitForMacrotask();
    expect(field).toHaveAttribute("data-invalid");
    expect(customError.hidden).toBe(false);

    document.querySelector<HTMLButtonElement>("[data-sw-select-trigger]")!.click();
    await waitForMacrotask();
    document.querySelector<HTMLElement>('[data-sw-select-item][data-value="dark"]')!.click();
    await waitForMacrotask();
    await waitForMacrotask();

    expect(instance.getErrors()).toEqual([]);
    expect(field).not.toHaveAttribute("data-invalid");
    expect(customError.hidden).toBe(true);
  });

  it("intercepts valid submit with form values only when managed submit is configured", () => {
    document.body.innerHTML = `
      <form data-sw-form>
        <div data-sw-field data-name="email">
          <input data-sw-field-control data-sw-input type="email" value="ada@example.com" />
        </div>
        <div data-sw-field data-name="plan">
          <input data-sw-field-control data-sw-input value="pro" />
        </div>
        <button name="intent" value="save" type="submit">Submit</button>
      </form>
    `;

    const form = document.querySelector<HTMLFormElement>("[data-sw-form]")!;
    const submitter = document.querySelector<HTMLButtonElement>('button[type="submit"]')!;
    const managedSubmit = vi.fn();
    const bubbleSubmit = vi.fn();
    createForm(form, { onSubmit: managedSubmit });
    form.addEventListener("submit", bubbleSubmit);

    const submitEvent = new SubmitEvent("submit", {
      bubbles: true,
      cancelable: true,
      submitter,
    });
    expect(form.dispatchEvent(submitEvent)).toBe(false);

    expect(submitEvent.defaultPrevented).toBe(true);
    expect(bubbleSubmit).not.toHaveBeenCalled();
    expect(managedSubmit).toHaveBeenCalledWith(
      expect.objectContaining({
        event: submitEvent,
        form,
        values: {
          email: "ada@example.com",
          intent: "save",
          plan: "pro",
        },
      }),
    );
  });

  it("captures required native invalid events without novalidate and reveals matching FieldError", async () => {
    document.body.innerHTML = `
      <form data-sw-form>
        <div data-sw-field data-name="email">
          <label data-sw-field-label>Email</label>
          <input data-sw-field-control data-sw-input type="email" required />
          <p data-sw-field-description>Used for account recovery.</p>
          <div data-sw-field-error data-match="valueMissing">Enter an email address.</div>
          <div data-sw-field-error data-match="typeMismatch">Use a valid email address.</div>
        </div>
        <button type="submit">Submit</button>
      </form>
    `;

    const form = document.querySelector<HTMLFormElement>("[data-sw-form]")!;
    const field = document.querySelector<HTMLElement>("[data-sw-field]")!;
    const input = document.querySelector<HTMLInputElement>("[data-sw-field-control]")!;
    const valueMissing = document.querySelector<HTMLElement>(
      '[data-sw-field-error][data-match="valueMissing"]',
    )!;
    const typeMismatch = document.querySelector<HTMLElement>(
      '[data-sw-field-error][data-match="typeMismatch"]',
    )!;
    const submit = vi.fn();

    form.addEventListener("submit", submit);
    const instance = createForm(form);
    let invalidDefaultPrevented: boolean | undefined;
    form.addEventListener(
      "invalid",
      (event) => {
        invalidDefaultPrevented = event.defaultPrevented;
      },
      { capture: true },
    );

    expect(form.noValidate).toBe(false);
    expect(form).not.toHaveAttribute("novalidate");
    expect(field).not.toHaveAttribute("data-invalid");
    expect(field).not.toHaveAttribute("data-submitted");
    expect(valueMissing.hidden).toBe(true);
    expect(typeMismatch.hidden).toBe(true);
    expect(input).not.toHaveAttribute("aria-invalid");

    const valid = form.checkValidity();
    await waitForMacrotask();

    expect(valid).toBe(false);
    expect(submit).not.toHaveBeenCalled();
    expect(invalidDefaultPrevented).toBe(true);
    expect(field).toHaveAttribute("data-invalid");
    expect(field).toHaveAttribute("data-submitted");
    expect(valueMissing.hidden).toBe(false);
    expect(typeMismatch.hidden).toBe(true);
    expect(input).toHaveAttribute("aria-invalid", "true");
    expect(input.getAttribute("aria-describedby")?.split(/\s+/)).toContain(valueMissing.id);
    expect(document.activeElement).toBe(input);
    expect(instance.getErrors()).toEqual([
      expect.objectContaining({
        key: "valueMissing",
        message: expect.any(String),
        name: "email",
        source: "native",
      }),
    ]);
  });

  it("maps type-mismatch invalid details and clears visible errors after a submit attempt", async () => {
    document.body.innerHTML = `
      <form data-sw-form>
        <div data-sw-field data-name="email">
          <input data-sw-field-control data-sw-input type="email" required value="not-an-email" />
          <div data-sw-field-error data-match="valueMissing">Enter an email address.</div>
          <div data-sw-field-error data-match="typeMismatch">Use a valid email address.</div>
        </div>
        <button type="submit">Submit</button>
      </form>
    `;

    const form = document.querySelector<HTMLFormElement>("[data-sw-form]")!;
    const field = document.querySelector<HTMLElement>("[data-sw-field]")!;
    const input = document.querySelector<HTMLInputElement>("[data-sw-field-control]")!;
    const valueMissing = document.querySelector<HTMLElement>(
      '[data-sw-field-error][data-match="valueMissing"]',
    )!;
    const typeMismatch = document.querySelector<HTMLElement>(
      '[data-sw-field-error][data-match="typeMismatch"]',
    )!;
    const instance = createForm(form);

    const valid = form.checkValidity();
    await waitForMacrotask();

    expect(valid).toBe(false);
    expect(instance.getErrors()).toEqual([
      expect.objectContaining({
        key: "typeMismatch",
        name: "email",
        source: "native",
      }),
    ]);
    expect(valueMissing.hidden).toBe(true);
    expect(typeMismatch.hidden).toBe(false);
    expect(input).toHaveAttribute("aria-invalid", "true");

    input.value = "ada@example.com";
    input.dispatchEvent(new InputEvent("input", { bubbles: true }));
    await waitForMacrotask();

    expect(instance.getErrors()).toEqual([]);
    expect(field).not.toHaveAttribute("data-invalid");
    expect(typeMismatch.hidden).toBe(true);
    expect(input).not.toHaveAttribute("aria-invalid");
  });

  it("reveals every invalid field while focusing the first invalid field", async () => {
    document.body.innerHTML = `
      <form data-sw-form>
        <div data-sw-field data-name="email">
          <input data-sw-field-control data-sw-input type="email" required />
          <div data-sw-field-error data-match="valueMissing">Enter an email address.</div>
        </div>
        <div data-sw-field data-name="handle">
          <input data-sw-field-control data-sw-input required minlength="3" />
          <div data-sw-field-error data-match="valueMissing">Choose a handle.</div>
        </div>
        <button type="submit">Submit</button>
      </form>
    `;

    const form = document.querySelector<HTMLFormElement>("[data-sw-form]")!;
    const email = document.querySelector<HTMLInputElement>(
      '[data-sw-field][data-name="email"] [data-sw-field-control]',
    )!;
    const emailError = document.querySelector<HTMLElement>(
      '[data-sw-field][data-name="email"] [data-sw-field-error]',
    )!;
    const handleError = document.querySelector<HTMLElement>(
      '[data-sw-field][data-name="handle"] [data-sw-field-error]',
    )!;
    const instance = createForm(form);

    const valid = form.checkValidity();
    await waitForMacrotask();

    expect(valid).toBe(false);
    expect(instance.getErrors().map((error) => error.name)).toEqual(["email", "handle"]);
    expect(emailError.hidden).toBe(false);
    expect(handleError.hidden).toBe(false);
    expect(document.activeElement).toBe(email);
  });

  it("clears stale native errors on a later valid submit path", async () => {
    document.body.innerHTML = `
      <form data-sw-form>
        <div data-sw-field data-name="email">
          <input data-sw-field-control data-sw-input type="email" required />
          <div data-sw-field-error data-match="valueMissing">Enter an email address.</div>
        </div>
        <button type="submit">Submit</button>
      </form>
    `;

    const form = document.querySelector<HTMLFormElement>("[data-sw-form]")!;
    const field = document.querySelector<HTMLElement>("[data-sw-field]")!;
    const input = document.querySelector<HTMLInputElement>("[data-sw-field-control]")!;
    const error = document.querySelector<HTMLElement>("[data-sw-field-error]")!;
    const instance = createForm(form);
    form.addEventListener("submit", (event) => event.preventDefault());

    expect(form.checkValidity()).toBe(false);
    await waitForMacrotask();
    expect(instance.getErrors()).toHaveLength(1);
    expect(error.hidden).toBe(false);

    input.value = "ada@example.com";
    expect(form.checkValidity()).toBe(true);
    form.dispatchEvent(new SubmitEvent("submit", { bubbles: true, cancelable: true }));
    await waitForMacrotask();

    expect(instance.getErrors()).toEqual([]);
    expect(field).not.toHaveAttribute("data-invalid");
    expect(field).toHaveAttribute("data-submitted");
    expect(error.hidden).toBe(true);
    expect(input).not.toHaveAttribute("aria-invalid");
  });

  it("can validate on input while hiding errors until submit visibility", async () => {
    document.body.innerHTML = `
      <form data-sw-form data-validation-timing="input" data-error-visibility="submit">
        <div data-sw-field data-name="email">
          <input data-sw-field-control data-sw-input type="email" required />
          <div data-sw-field-error data-match="valueMissing">Enter an email address.</div>
        </div>
        <button type="submit">Submit</button>
      </form>
    `;

    const form = document.querySelector<HTMLFormElement>("[data-sw-form]")!;
    const field = document.querySelector<HTMLElement>("[data-sw-field]")!;
    const input = document.querySelector<HTMLInputElement>("[data-sw-field-control]")!;
    const error = document.querySelector<HTMLElement>("[data-sw-field-error]")!;
    createForm(form);

    input.dispatchEvent(new InputEvent("input", { bubbles: true }));
    await waitForMacrotask();

    expect(field).toHaveAttribute("data-invalid");
    expect(field).not.toHaveAttribute("data-error-visible");
    expect(error.hidden).toBe(true);
    expect(input).toHaveAttribute("aria-invalid", "true");
    expect(input.getAttribute("aria-describedby")?.split(/\s+/) ?? []).not.toContain(error.id);

    expect(form.checkValidity()).toBe(false);
    await waitForMacrotask();

    expect(field).toHaveAttribute("data-error-visible");
    expect(error.hidden).toBe(false);
    expect(input.getAttribute("aria-describedby")?.split(/\s+/)).toContain(error.id);
  });

  it("renders visible errors in field order into an optional form error summary", async () => {
    document.body.innerHTML = `
      <form data-sw-form data-validation-timing="input" data-error-visibility="submit">
        <div data-sw-form-error-summary></div>
        <div data-sw-field data-name="email">
          <label data-sw-field-label>Email</label>
          <input data-sw-field-control data-sw-input type="email" required />
          <div data-sw-field-error data-match="valueMissing">Enter an email address.</div>
        </div>
        <div data-sw-field data-name="handle" data-validation-timing="input" data-error-visibility="input">
          <label data-sw-field-label>Handle</label>
          <input data-sw-field-control data-sw-input required minlength="3" />
          <div data-sw-field-error data-match="valueMissing">Choose a handle.</div>
        </div>
      </form>
    `;

    const form = document.querySelector<HTMLFormElement>("[data-sw-form]")!;
    const summary = document.querySelector<HTMLElement>("[data-sw-form-error-summary]")!;
    createForm(form);

    const handle = document.querySelector<HTMLInputElement>(
      '[data-sw-field][data-name="handle"] [data-sw-field-control]',
    )!;
    handle.dispatchEvent(new InputEvent("input", { bubbles: true }));
    await waitForMacrotask();

    expect(summary.hidden).toBe(false);
    expect(summary).toHaveAttribute("role", "status");
    expect(summary).toHaveAttribute("aria-live", "polite");
    expect(summary).toHaveAttribute("aria-atomic", "true");
    expect(readSummaryItemTexts(summary)).toEqual(["Handle: Choose a handle."]);

    expect(form.checkValidity()).toBe(false);
    await waitForMacrotask();

    expect(readSummaryItemTexts(summary)).toEqual([
      "Email: Enter an email address.",
      "Handle: Choose a handle.",
    ]);
  });

  it("preserves authored form error summary live-region attributes", async () => {
    document.body.innerHTML = `
      <form data-sw-form data-validation-timing="input" data-error-visibility="input">
        <div
          data-sw-form-error-summary
          role="alert"
          aria-live="assertive"
          aria-atomic="false"
        ></div>
        <div data-sw-field data-name="email">
          <label data-sw-field-label>Email</label>
          <input data-sw-field-control data-sw-input type="email" required />
          <div data-sw-field-error data-match="valueMissing">Enter an email address.</div>
        </div>
      </form>
    `;

    const form = document.querySelector<HTMLFormElement>("[data-sw-form]")!;
    const summary = document.querySelector<HTMLElement>("[data-sw-form-error-summary]")!;
    createForm(form);

    const input = document.querySelector<HTMLInputElement>("[data-sw-field-control]")!;
    input.dispatchEvent(new InputEvent("input", { bubbles: true }));
    await waitForMacrotask();

    expect(summary.hidden).toBe(false);
    expect(summary).toHaveAttribute("role", "alert");
    expect(summary).toHaveAttribute("aria-live", "assertive");
    expect(summary).toHaveAttribute("aria-atomic", "false");
    expect(readSummaryItemTexts(summary)).toEqual(["Email: Enter an email address."]);
  });

  it("focuses the corresponding field control when a summary item is clicked", async () => {
    document.body.innerHTML = `
      <form data-sw-form>
        <div data-sw-form-error-summary></div>
        <div data-sw-field data-name="email">
          <label data-sw-field-label>Email</label>
          <input data-sw-field-control data-sw-input type="email" required />
          <div data-sw-field-error data-match="valueMissing">Enter an email address.</div>
        </div>
        <div data-sw-field data-name="handle">
          <label data-sw-field-label>Handle</label>
          <input data-sw-field-control data-sw-input required />
          <div data-sw-field-error data-match="valueMissing">Choose a handle.</div>
        </div>
      </form>
    `;

    const form = document.querySelector<HTMLFormElement>("[data-sw-form]")!;
    const summary = document.querySelector<HTMLElement>("[data-sw-form-error-summary]")!;
    const handle = document.querySelector<HTMLInputElement>(
      '[data-sw-field][data-name="handle"] [data-sw-field-control]',
    )!;
    createForm(form);

    expect(form.checkValidity()).toBe(false);
    await waitForMacrotask();

    const items = Array.from(
      summary.querySelectorAll<HTMLButtonElement>("[data-sw-form-error-summary-item]"),
    );
    expect(items).toHaveLength(2);
    items[1]!.click();

    expect(document.activeElement).toBe(handle);
  });

  it("updates summary items when errors clear or change source", async () => {
    document.body.innerHTML = `
      <form data-sw-form>
        <div data-sw-form-error-summary></div>
        <div data-sw-field data-name="inviteCode">
          <label data-sw-field-label>Invite code</label>
          <input data-sw-field-control data-sw-input value="used-code" />
          <div data-sw-field-error data-match="customError">Invite code failed.</div>
        </div>
      </form>
    `;

    const form = document.querySelector<HTMLFormElement>("[data-sw-form]")!;
    const summary = document.querySelector<HTMLElement>("[data-sw-form-error-summary]")!;
    const input = document.querySelector<HTMLInputElement>("[data-sw-field-control]")!;
    const instance = createForm(form);

    instance.setExternalErrors(
      {
        inviteCode: {
          message: "Invite code was already used.",
          source: "server",
        },
      },
      { clearOnChange: true },
    );

    expect(summary.hidden).toBe(false);
    expect(readSummaryItemTexts(summary)).toEqual(["Invite code: Invite code was already used."]);
    expect(summary.querySelector("[data-sw-form-error-summary-item]")).toHaveAttribute(
      "data-validation-source",
      "server",
    );

    instance.setExternalErrors({
      inviteCode: {
        message: "Invite code failed schema validation.",
        source: "schema",
      },
    });

    expect(readSummaryItemTexts(summary)).toEqual([
      "Invite code: Invite code failed schema validation.",
    ]);
    expect(summary.querySelector("[data-sw-form-error-summary-item]")).toHaveAttribute(
      "data-validation-source",
      "schema",
    );

    instance.setExternalErrors(
      {
        inviteCode: {
          message: "Invite code was already used.",
          source: "server",
        },
      },
      { clearOnChange: true },
    );
    input.value = "new-code";
    input.dispatchEvent(new InputEvent("input", { bubbles: true }));
    await waitForMacrotask();

    expect(summary.hidden).toBe(true);
    expect(readSummaryItemTexts(summary)).toEqual([]);
  });

  it("updates summary items when async validation errors resolve and clear", async () => {
    document.body.innerHTML = `
      <form data-sw-form data-validation-timing="input" data-error-visibility="input">
        <div data-sw-form-error-summary></div>
        <div data-sw-field data-name="handle">
          <label data-sw-field-label>Handle</label>
          <input data-sw-field-control data-sw-input />
          <div data-sw-field-error data-match="customError">Handle is unavailable.</div>
        </div>
      </form>
    `;

    const form = document.querySelector<HTMLFormElement>("[data-sw-form]")!;
    const summary = document.querySelector<HTMLElement>("[data-sw-form-error-summary]")!;
    const input = document.querySelector<HTMLInputElement>("[data-sw-field-control]")!;
    const validator = vi.fn((value: FormFieldRegistration["value"]) =>
      Promise.resolve(value === "taken" ? "Handle is unavailable." : null),
    );
    createForm(form, {
      asyncFieldValidators: {
        handle: validator,
      },
    });

    input.value = "taken";
    input.dispatchEvent(new InputEvent("input", { bubbles: true }));
    await waitForMicrotasks();

    expect(readSummaryItemTexts(summary)).toEqual(["Handle: Handle is unavailable."]);
    expect(summary.querySelector("[data-sw-form-error-summary-item]")).toHaveAttribute(
      "data-validation-source",
      "async",
    );

    input.value = "available";
    input.dispatchEvent(new InputEvent("input", { bubbles: true }));
    await waitForMicrotasks();

    expect(summary.hidden).toBe(true);
    expect(readSummaryItemTexts(summary)).toEqual([]);
  });

  it("preserves authored summary content while rendering form-level errors without a control", () => {
    document.body.innerHTML = `
      <form data-sw-form>
        <div data-sw-form-error-summary aria-label="Schema errors">
          <p data-testid="summary-heading">Review these errors</p>
        </div>
        <div data-sw-field data-name="_form">
          <div data-sw-field-error data-match="customError">The schema rejected this submission.</div>
        </div>
      </form>
    `;

    const form = document.querySelector<HTMLFormElement>("[data-sw-form]")!;
    const summary = document.querySelector<HTMLElement>("[data-sw-form-error-summary]")!;
    const instance = createForm(form);

    instance.setExternalErrors({
      _form: {
        message: "The schema rejected this submission.",
        source: "schema",
      },
    });

    expect(summary.hidden).toBe(false);
    expect(summary).toHaveAttribute("role", "status");
    expect(summary.querySelector("[data-testid='summary-heading']")?.textContent).toBe(
      "Review these errors",
    );
    expect(summary.querySelector("[data-sw-form-error-summary-list]")).toBeInstanceOf(
      HTMLUListElement,
    );
    expect(readSummaryItemTexts(summary)).toEqual(["_form: The schema rejected this submission."]);
  });

  it("supports blur-first validation and blur error visibility", async () => {
    document.body.innerHTML = `
      <form data-sw-form data-validation-timing="blur" data-error-visibility="blur">
        <div data-sw-field data-name="handle">
          <input data-sw-field-control data-sw-input required minlength="3" />
          <div data-sw-field-error data-match="valueMissing">Choose a handle.</div>
        </div>
      </form>
    `;

    const form = document.querySelector<HTMLFormElement>("[data-sw-form]")!;
    const field = document.querySelector<HTMLElement>("[data-sw-field]")!;
    const input = document.querySelector<HTMLInputElement>("[data-sw-field-control]")!;
    const error = document.querySelector<HTMLElement>("[data-sw-field-error]")!;
    createForm(form);

    input.dispatchEvent(new InputEvent("input", { bubbles: true }));
    await waitForMacrotask();
    expect(field).not.toHaveAttribute("data-invalid");
    expect(error.hidden).toBe(true);

    input.dispatchEvent(new FocusEvent("focusout", { bubbles: true }));
    await waitForMacrotask();

    expect(field).toHaveAttribute("data-touched");
    expect(field).toHaveAttribute("data-invalid");
    expect(field).toHaveAttribute("data-error-visible");
    expect(error.hidden).toBe(false);
  });

  it("does not blur-validate while focus moves inside the same field", async () => {
    document.body.innerHTML = `
      <form data-sw-form data-validation-timing="blur" data-error-visibility="blur">
        <div data-sw-field data-name="combo">
          <div data-sw-field-control>
            <input required />
            <button type="button">Open</button>
          </div>
          <div data-sw-field-error data-match="valueMissing">Choose a value.</div>
        </div>
      </form>
    `;

    const form = document.querySelector<HTMLFormElement>("[data-sw-form]")!;
    const field = document.querySelector<HTMLElement>("[data-sw-field]")!;
    const input = document.querySelector<HTMLInputElement>("input")!;
    const button = document.querySelector<HTMLButtonElement>("button")!;
    const error = document.querySelector<HTMLElement>("[data-sw-field-error]")!;
    createForm(form);

    input.dispatchEvent(new FocusEvent("focusout", { bubbles: true, relatedTarget: button }));
    await waitForMacrotask();

    expect(field).not.toHaveAttribute("data-invalid");
    expect(error.hidden).toBe(true);

    input.dispatchEvent(new FocusEvent("focusout", { bubbles: true }));
    await waitForMacrotask();

    expect(field).toHaveAttribute("data-invalid");
    expect(error.hidden).toBe(false);
  });

  it("supports change-first validation and change error visibility", async () => {
    document.body.innerHTML = `
      <form data-sw-form data-validation-timing="change" data-error-visibility="change">
        <div data-sw-field data-name="email">
          <input data-sw-field-control data-sw-input type="email" required />
          <div data-sw-field-error data-match="valueMissing">Enter an email address.</div>
        </div>
      </form>
    `;

    const form = document.querySelector<HTMLFormElement>("[data-sw-form]")!;
    const field = document.querySelector<HTMLElement>("[data-sw-field]")!;
    const input = document.querySelector<HTMLInputElement>("[data-sw-field-control]")!;
    const error = document.querySelector<HTMLElement>("[data-sw-field-error]")!;
    createForm(form);

    input.dispatchEvent(new InputEvent("input", { bubbles: true }));
    await waitForMacrotask();
    expect(field).not.toHaveAttribute("data-invalid");
    expect(error.hidden).toBe(true);

    input.dispatchEvent(new Event("change", { bubbles: true }));
    await waitForMacrotask();

    expect(field).toHaveAttribute("data-invalid");
    expect(field).toHaveAttribute("data-error-visible");
    expect(error.hidden).toBe(false);
  });

  it("honors Field-level validation and visibility overrides", async () => {
    document.body.innerHTML = `
      <form data-sw-form data-validation-timing="submit" data-error-visibility="submit">
        <div data-sw-field data-name="email">
          <input data-sw-field-control data-sw-input type="email" required />
          <div data-sw-field-error data-match="valueMissing">Enter an email address.</div>
        </div>
        <div data-sw-field data-name="handle" data-validation-timing="input" data-error-visibility="input">
          <input data-sw-field-control data-sw-input required minlength="3" />
          <div data-sw-field-error data-match="valueMissing">Choose a handle.</div>
        </div>
      </form>
    `;

    const form = document.querySelector<HTMLFormElement>("[data-sw-form]")!;
    const emailField = document.querySelector<HTMLElement>('[data-sw-field][data-name="email"]')!;
    const handleField = document.querySelector<HTMLElement>('[data-sw-field][data-name="handle"]')!;
    const emailInput = emailField.querySelector<HTMLInputElement>("[data-sw-field-control]")!;
    const handleInput = handleField.querySelector<HTMLInputElement>("[data-sw-field-control]")!;
    const emailError = emailField.querySelector<HTMLElement>("[data-sw-field-error]")!;
    const handleError = handleField.querySelector<HTMLElement>("[data-sw-field-error]")!;
    createForm(form);

    emailInput.dispatchEvent(new InputEvent("input", { bubbles: true }));
    handleInput.dispatchEvent(new InputEvent("input", { bubbles: true }));
    await waitForMacrotask();

    expect(emailField).not.toHaveAttribute("data-invalid");
    expect(emailError.hidden).toBe(true);
    expect(handleField).toHaveAttribute("data-invalid");
    expect(handleField).toHaveAttribute("data-error-visible");
    expect(handleError.hidden).toBe(false);
  });

  it("marks valid fields on a first submit attempt", async () => {
    document.body.innerHTML = `
      <form data-sw-form>
        <div data-sw-field data-name="email">
          <input data-sw-field-control data-sw-input type="email" required value="ada@example.com" />
          <div data-sw-field-validity data-match="valid">Email looks good.</div>
        </div>
        <button type="submit">Submit</button>
      </form>
    `;

    const form = document.querySelector<HTMLFormElement>("[data-sw-form]")!;
    const field = document.querySelector<HTMLElement>("[data-sw-field]")!;
    const validity = document.querySelector<HTMLElement>("[data-sw-field-validity]")!;
    createForm(form);
    form.addEventListener("submit", (event) => event.preventDefault());

    expect(form.checkValidity()).toBe(true);
    form.dispatchEvent(new SubmitEvent("submit", { bubbles: true, cancelable: true }));
    await waitForMacrotask();

    expect(field).toHaveAttribute("data-submitted");
    expect(field).toHaveAttribute("data-valid");
    expect(field).not.toHaveAttribute("data-invalid");
    expect(validity.hidden).toBe(false);
  });

  it("clears validation bookkeeping when a field is removed", async () => {
    document.body.innerHTML = `
      <form data-sw-form data-validation-timing="input" data-error-visibility="input">
        <div data-sw-field data-name="email">
          <input data-sw-field-control data-sw-input type="email" required />
          <div data-sw-field-error data-match="valueMissing">Enter an email address.</div>
        </div>
      </form>
    `;

    const form = document.querySelector<HTMLFormElement>("[data-sw-form]")!;
    const field = document.querySelector<HTMLElement>("[data-sw-field]")!;
    const input = document.querySelector<HTMLInputElement>("[data-sw-field-control]")!;
    const instance = createForm(form);

    input.dispatchEvent(new InputEvent("input", { bubbles: true }));
    await waitForMacrotask();
    expect(field).toHaveAttribute("data-invalid");

    field.remove();
    await waitForMacrotask();
    form.append(field);
    instance.refresh();
    await waitForMacrotask();

    expect(field).not.toHaveAttribute("data-valid");
    expect(field).not.toHaveAttribute("data-invalid");
    expect(field).not.toHaveAttribute("data-error-visible");
  });

  it("clears validation bookkeeping on manual refresh after a field is removed", async () => {
    document.body.innerHTML = `
      <form data-sw-form data-validation-timing="input" data-error-visibility="input">
        <div data-sw-field data-name="email">
          <input data-sw-field-control data-sw-input type="email" required />
          <div data-sw-field-error data-match="valueMissing">Enter an email address.</div>
        </div>
      </form>
    `;

    const form = document.querySelector<HTMLFormElement>("[data-sw-form]")!;
    const field = document.querySelector<HTMLElement>("[data-sw-field]")!;
    const input = document.querySelector<HTMLInputElement>("[data-sw-field-control]")!;
    const instance = createForm(form);

    input.dispatchEvent(new InputEvent("input", { bubbles: true }));
    await waitForMacrotask();
    expect(field).toHaveAttribute("data-invalid");

    field.remove();
    instance.refresh();
    form.append(field);
    instance.refresh();
    await waitForMacrotask();

    expect(field).not.toHaveAttribute("data-valid");
    expect(field).not.toHaveAttribute("data-invalid");
    expect(field).not.toHaveAttribute("data-error-visible");
  });

  it("allows native browser validation UI through an explicit escape hatch", async () => {
    document.body.innerHTML = `
      <form data-sw-form data-sw-native-validation>
        <div data-sw-field data-name="email">
          <input data-sw-field-control data-sw-input type="email" required />
          <div data-sw-field-error data-match="valueMissing">Enter an email address.</div>
        </div>
        <button type="submit">Submit</button>
      </form>
    `;

    const form = document.querySelector<HTMLFormElement>("[data-sw-form]")!;
    const field = document.querySelector<HTMLElement>("[data-sw-field]")!;
    const _input = document.querySelector<HTMLInputElement>("[data-sw-field-control]")!;
    const error = document.querySelector<HTMLElement>("[data-sw-field-error]")!;
    const instance = createForm(form);
    let invalidDefaultPrevented: boolean | undefined;
    form.addEventListener(
      "invalid",
      (event) => {
        invalidDefaultPrevented = event.defaultPrevented;
      },
      { capture: true },
    );

    const valid = form.checkValidity();
    await waitForMacrotask();

    expect(valid).toBe(false);
    expect(invalidDefaultPrevented).toBe(false);
    expect(instance.getErrors()).toEqual([]);
    expect(field).not.toHaveAttribute("data-invalid");
    expect(error.hidden).toBe(true);
  });
});

async function waitForMacrotask(): Promise<void> {
  await new Promise((resolve) => setTimeout(resolve, 0));
}

async function waitForMicrotasks(): Promise<void> {
  for (let index = 0; index < 6; index += 1) {
    await Promise.resolve();
  }
}

async function waitFor(assertion: () => void): Promise<void> {
  let lastError: unknown;
  const deadline = Date.now() + 10_000;

  while (Date.now() < deadline) {
    try {
      assertion();
      return;
    } catch (error) {
      lastError = error;
      await new Promise((resolve) => setTimeout(resolve, 10));
    }
  }

  throw lastError;
}

function readValues(form: HTMLFormElement): Record<string, FormDataEntryValue> {
  return Object.fromEntries(new FormData(form).entries());
}

function readSummaryItemTexts(summary: HTMLElement): string[] {
  return Array.from(summary.querySelectorAll("[data-sw-form-error-summary-item]")).map(
    (item) => item.textContent?.trim() ?? "",
  );
}

function renderRuntimeSelectField({
  name,
  defaultValue,
  disabled = false,
}: {
  name: string;
  defaultValue?: string;
  disabled?: boolean;
}) {
  return `
    <div data-sw-field data-name="${name}"${disabled ? " data-disabled" : ""}>
      <div data-sw-select data-required${defaultValue ? ` data-default-value="${defaultValue}"` : ""}>
        <button data-sw-select-trigger type="button">
          <span data-sw-select-value data-placeholder="Pick theme"></span>
        </button>
        <input data-sw-select-input type="hidden" />
        <div data-sw-select-positioner data-side="bottom" data-align="start">
          <div data-sw-select-popup hidden>
            <div data-sw-select-list>
              <div data-sw-select-item data-value="light">
                <span data-sw-select-item-text>Light</span>
              </div>
              <div data-sw-select-item data-value="dark">
                <span data-sw-select-item-text>Dark</span>
              </div>
            </div>
          </div>
        </div>
      </div>
      <div data-sw-field-error data-match="valueMissing">Choose a theme</div>
    </div>
  `;
}

function renderRuntimeComboboxField({
  name,
  defaultValue,
  disabled = false,
}: {
  name: string;
  defaultValue?: string;
  disabled?: boolean;
}) {
  return `
    <div data-sw-field data-name="${name}"${disabled ? " data-disabled" : ""}>
      <div data-sw-combobox data-required${defaultValue ? ` data-default-value="${defaultValue}"` : ""}>
        <div data-sw-combobox-input-group>
          <input data-sw-combobox-input />
          <button data-sw-combobox-trigger type="button">Open</button>
        </div>
        <input data-sw-combobox-hidden-input type="hidden" />
        <div data-sw-combobox-positioner data-side="bottom" data-align="start">
          <div data-sw-combobox-popup hidden>
            <div data-sw-combobox-list>
              <div data-sw-combobox-item data-value="us">
                <span data-sw-combobox-item-text>United States</span>
              </div>
              <div data-sw-combobox-item data-value="ca">
                <span data-sw-combobox-item-text>Canada</span>
              </div>
            </div>
          </div>
        </div>
      </div>
      <div data-sw-field-error data-match="valueMissing">Choose a country</div>
    </div>
  `;
}
