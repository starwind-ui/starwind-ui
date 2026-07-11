import { beforeEach, describe, expect, it } from "vitest";

import { createCheckbox } from "../../../src/components/checkbox";
import { createCombobox } from "../../../src/components/combobox";
import { createInputOtp } from "../../../src/components/input-otp";
import { createRadioGroup } from "../../../src/components/radio-group";
import { createSelect } from "../../../src/components/select";
import { createSlider } from "../../../src/components/slider";
import { createSwitch } from "../../../src/components/switch";
import { createField } from "../../../src/components/field/field";

describe("createField", () => {
  beforeEach(() => {
    document.body.innerHTML = "";
  });

  it("associates labels, descriptions, and errors with an owned input while mirroring field state", async () => {
    document.body.innerHTML = `
      <div data-sw-field data-name="profile">
        <label data-sw-field-label>Name</label>
        <input data-sw-field-control data-sw-input required value="" />
        <p data-sw-field-description>Visible on your profile</p>
        <div data-sw-field-item>Input row</div>
        <div data-sw-field-error data-match="valueMissing">Enter your name</div>
      </div>
    `;

    const field = document.querySelector<HTMLElement>("[data-sw-field]")!;
    const label = document.querySelector<HTMLLabelElement>("[data-sw-field-label]")!;
    const input = document.querySelector<HTMLInputElement>("[data-sw-field-control]")!;
    const description = document.querySelector<HTMLElement>("[data-sw-field-description]")!;
    const item = document.querySelector<HTMLElement>("[data-sw-field-item]")!;
    const error = document.querySelector<HTMLElement>("[data-sw-field-error]")!;

    createField(field);

    expect(input.name).toBe("profile");
    expect(input.id).toBeTruthy();
    expect(label.htmlFor).toBe(input.id);
    expect(input.getAttribute("aria-describedby")?.split(/\s+/)).toEqual(
      expect.arrayContaining([description.id, error.id]),
    );
    expect(input).toHaveAttribute("aria-invalid", "true");
    expect(error.hidden).toBe(false);
    expect(field.hasAttribute("data-invalid")).toBe(true);
    expect(label.hasAttribute("data-invalid")).toBe(true);
    expect(item.hasAttribute("data-invalid")).toBe(true);

    input.dispatchEvent(new FocusEvent("focusin", { bubbles: true }));
    expect(field.hasAttribute("data-focused")).toBe(true);
    expect(label.hasAttribute("data-focused")).toBe(true);
    expect(item.hasAttribute("data-focused")).toBe(true);

    input.value = "Ada";
    input.dispatchEvent(new InputEvent("input", { bubbles: true }));
    await waitForMacrotask();

    expect(field.hasAttribute("data-filled")).toBe(true);
    expect(field.hasAttribute("data-dirty")).toBe(true);
    expect(field.hasAttribute("data-valid")).toBe(true);
    expect(field.hasAttribute("data-invalid")).toBe(false);
    expect(input.hasAttribute("aria-invalid")).toBe(false);
    expect(error.hidden).toBe(true);

    input.dispatchEvent(new FocusEvent("focusout", { bubbles: true }));
    expect(field.hasAttribute("data-touched")).toBe(true);
    expect(label.hasAttribute("data-touched")).toBe(true);
    expect(item.hasAttribute("data-touched")).toBe(true);
  });

  it("mirrors programmatic input value changes on the next field render", () => {
    document.body.innerHTML = `
      <div data-sw-field>
        <input data-sw-field-control data-sw-input value="Ada" />
      </div>
    `;

    const field = document.querySelector<HTMLElement>("[data-sw-field]")!;
    const input = document.querySelector<HTMLInputElement>("[data-sw-field-control]")!;
    createField(field);

    expect(input.value).toBe("Ada");
    expect(field).toHaveAttribute("data-filled");
    expect(field).not.toHaveAttribute("data-dirty");

    input.value = "";
    input.dispatchEvent(new FocusEvent("focusin", { bubbles: true }));

    expect(input.value).toBe("");
    expect(field).not.toHaveAttribute("data-filled");
    expect(field).toHaveAttribute("data-dirty");
    expect(input).not.toHaveAttribute("data-filled");
    expect(input).toHaveAttribute("data-dirty");
  });

  it("clears an invalid override back to native validity", () => {
    document.body.innerHTML = `
      <div data-sw-field>
        <input data-sw-field-control data-sw-input value="" />
        <div data-sw-field-error>Invalid value</div>
      </div>
    `;

    const field = document.querySelector<HTMLElement>("[data-sw-field]")!;
    const error = document.querySelector<HTMLElement>("[data-sw-field-error]")!;
    const instance = createField(field, { invalid: true });

    expect(field).toHaveAttribute("data-invalid");
    expect(error.hidden).toBe(false);

    instance.setInvalid(undefined);

    expect(field).toHaveAttribute("data-valid");
    expect(field).not.toHaveAttribute("data-invalid");
    expect(error.hidden).toBe(true);
  });

  it("settles after applying disabled state to an owned native input", async () => {
    document.body.innerHTML = `
      <div data-sw-field data-disabled>
        <input data-sw-field-control data-sw-input />
      </div>
    `;

    const field = document.querySelector<HTMLElement>("[data-sw-field]")!;
    const input = document.querySelector<HTMLInputElement>("[data-sw-field-control]")!;

    createField(field);
    await waitForMacrotask();

    expect(input.disabled).toBe(true);
    expect(input).toHaveAttribute("data-disabled");
  });

  it("reveals matched validity messages and includes visible messages in descriptions", async () => {
    document.body.innerHTML = `
      <div data-sw-field>
        <label data-sw-field-label>Email</label>
        <input data-sw-field-control data-sw-input type="email" required value="" />
        <div data-sw-field-error data-match="valueMissing">Email is required</div>
        <div data-sw-field-validity data-match="valid">Email looks good</div>
      </div>
    `;

    const field = document.querySelector<HTMLElement>("[data-sw-field]")!;
    const input = document.querySelector<HTMLInputElement>("[data-sw-field-control]")!;
    const error = document.querySelector<HTMLElement>("[data-sw-field-error]")!;
    const validity = document.querySelector<HTMLElement>("[data-sw-field-validity]")!;
    createField(field);

    expect(error.hidden).toBe(false);
    expect(validity.hidden).toBe(true);
    expect(input.getAttribute("aria-describedby")?.split(/\s+/)).toEqual(
      expect.arrayContaining([error.id]),
    );

    input.value = "ada@example.com";
    input.dispatchEvent(new InputEvent("input", { bubbles: true }));
    await waitForMacrotask();

    expect(error.hidden).toBe(true);
    expect(validity.hidden).toBe(false);
    expect(input.getAttribute("aria-describedby")?.split(/\s+/)).toEqual(
      expect.arrayContaining([validity.id]),
    );
    expect(input.getAttribute("aria-describedby")?.split(/\s+/)).not.toContain(error.id);
  });

  it("treats omitted and false Field errors as default matches while true stays externally controlled", async () => {
    document.body.innerHTML = `
      <div data-sw-field>
        <input data-sw-field-control data-sw-input required value="" />
        <div data-sw-field-error id="default-error">Default error</div>
        <div data-sw-field-error id="false-error" data-match="false">False error</div>
        <div data-sw-field-error id="true-error" data-match="true">Externally controlled error</div>
      </div>
    `;

    const field = document.querySelector<HTMLElement>("[data-sw-field]")!;
    const input = document.querySelector<HTMLInputElement>("[data-sw-field-control]")!;
    const defaultError = document.querySelector<HTMLElement>("#default-error")!;
    const falseError = document.querySelector<HTMLElement>("#false-error")!;
    const trueError = document.querySelector<HTMLElement>("#true-error")!;
    createField(field);

    expect(defaultError.hidden).toBe(false);
    expect(falseError.hidden).toBe(false);
    expect(trueError.hidden).toBe(false);

    input.value = "Ada";
    input.dispatchEvent(new InputEvent("input", { bubbles: true }));
    await waitForMacrotask();

    expect(defaultError.hidden).toBe(true);
    expect(falseError.hidden).toBe(true);
    expect(trueError.hidden).toBe(false);
  });

  it("keeps dynamic FieldError fallback text when no validation message metadata exists", () => {
    document.body.innerHTML = `
      <div data-sw-field>
        <input data-sw-field-control data-sw-input required value="" />
        <div data-sw-field-error data-match="valueMissing" data-message-source="validation">
          Email is required
        </div>
      </div>
    `;

    const field = document.querySelector<HTMLElement>("[data-sw-field]")!;
    const error = document.querySelector<HTMLElement>("[data-sw-field-error]")!;
    createField(field);

    expect(error.hidden).toBe(false);
    expect(error).not.toHaveAttribute("data-validation-message");
    expect(error.textContent?.trim()).toBe("Email is required");
  });

  it("propagates field names and mirrors value state for checkbox, checkbox group, radio group, and switch controls", async () => {
    document.body.innerHTML = `
      <div data-sw-field data-name="accept">
        <span data-sw-checkbox>
          <span data-sw-checkbox-indicator data-keep-mounted></span>
        </span>
      </div>
      <div data-sw-field data-name="toppings">
        <div data-sw-checkbox-group>
          <span data-sw-checkbox data-value="mushroom"></span>
          <span data-sw-checkbox data-value="olive"></span>
        </div>
      </div>
      <div data-sw-field data-name="plan">
        <div data-sw-radio-group>
          <span data-sw-radio data-value="basic"></span>
          <span data-sw-radio data-value="pro"></span>
        </div>
      </div>
      <div data-sw-field data-name="alerts">
        <span data-sw-switch>
          <span data-sw-switch-thumb></span>
        </span>
      </div>
    `;

    const fields = Array.from(document.querySelectorAll<HTMLElement>("[data-sw-field]"));
    fields.forEach((field) => createField(field));

    await waitFor(() => {
      expect(
        fields[1]!.querySelector<HTMLInputElement>(
          '[data-sw-checkbox][data-value="mushroom"] [data-sw-checkbox-input]',
        )!.name,
      ).toBe("toppings");
      expect(
        fields[2]!.querySelector<HTMLInputElement>(
          '[data-sw-radio][data-value="pro"] [data-sw-radio-input]',
        )!.name,
      ).toBe("plan");
      expect(fields[3]!.querySelector<HTMLInputElement>("[data-sw-switch-input]")!.name).toBe(
        "alerts",
      );
    });

    const checkboxField = fields[0]!;
    const checkbox = checkboxField.querySelector<HTMLElement>("[data-sw-checkbox]")!;
    checkbox.click();
    await waitForMacrotask();

    expect(checkbox.querySelector<HTMLInputElement>("[data-sw-checkbox-input]")!.name).toBe(
      "accept",
    );
    expect(checkboxField.hasAttribute("data-filled")).toBe(true);
    expect(checkboxField.hasAttribute("data-dirty")).toBe(true);

    const checkboxGroupField = fields[1]!;
    const checkboxGroup = checkboxGroupField.querySelector<HTMLElement>(
      "[data-sw-checkbox-group]",
    )!;
    const mushroom = checkboxGroup.querySelector<HTMLElement>(
      '[data-sw-checkbox][data-value="mushroom"]',
    )!;
    mushroom.click();
    await waitForMacrotask();

    expect(mushroom.querySelector<HTMLInputElement>("[data-sw-checkbox-input]")!.name).toBe(
      "toppings",
    );
    expect(checkboxGroup.getAttribute("data-value")).toBe('["mushroom"]');
    expect(checkboxGroupField.hasAttribute("data-filled")).toBe(true);
    expect(checkboxGroupField.hasAttribute("data-dirty")).toBe(true);

    const radioGroupField = fields[2]!;
    const radioGroup = radioGroupField.querySelector<HTMLElement>("[data-sw-radio-group]")!;
    const pro = radioGroup.querySelector<HTMLElement>('[data-sw-radio][data-value="pro"]')!;
    pro.click();
    await waitForMacrotask();

    expect(pro.querySelector<HTMLInputElement>("[data-sw-radio-input]")!.name).toBe("plan");
    expect(radioGroup.getAttribute("data-value")).toBe("pro");
    expect(radioGroupField.hasAttribute("data-filled")).toBe(true);
    expect(radioGroupField.hasAttribute("data-dirty")).toBe(true);

    const switchField = fields[3]!;
    const switchRoot = switchField.querySelector<HTMLElement>("[data-sw-switch]")!;
    switchRoot.click();
    await waitForMacrotask();

    expect(
      switchField.querySelector<HTMLInputElement>("[data-sw-switch-input]") ??
        switchField.nextElementSibling,
    ).toBeTruthy();
    expect(document.querySelector<HTMLInputElement>("[data-sw-switch-input]")!.name).toBe("alerts");
    expect(switchField.hasAttribute("data-filled")).toBe(true);
    expect(switchField.hasAttribute("data-dirty")).toBe(true);
  });

  it("keeps dirty and touched uncontrolled unless explicit control values are provided", async () => {
    document.body.innerHTML = `
      <div data-sw-field>
        <input data-sw-field-control data-sw-input value="" />
      </div>
    `;

    const field = document.querySelector<HTMLElement>("[data-sw-field]")!;
    const input = document.querySelector<HTMLInputElement>("[data-sw-field-control]")!;
    const instance = createField(field, { dirty: false, touched: false });

    input.value = "Ada";
    input.dispatchEvent(new InputEvent("input", { bubbles: true }));
    input.dispatchEvent(new FocusEvent("focusout", { bubbles: true }));
    await waitForMacrotask();

    expect(field.hasAttribute("data-dirty")).toBe(false);
    expect(field.hasAttribute("data-touched")).toBe(false);

    instance.setDirty(undefined);
    expect(field.hasAttribute("data-dirty")).toBe(true);

    instance.setTouched(undefined);
    input.dispatchEvent(new FocusEvent("focusout", { bubbles: true }));
    expect(field.hasAttribute("data-touched")).toBe(true);
  });

  it("reapplies the field name when an owned input name is cleared after initialization", async () => {
    document.body.innerHTML = `
      <div data-sw-field data-name="profile">
        <input data-sw-field-control data-sw-input />
      </div>
    `;

    const field = document.querySelector<HTMLElement>("[data-sw-field]")!;
    const input = document.querySelector<HTMLInputElement>("[data-sw-field-control]")!;
    createField(field);

    expect(input.name).toBe("profile");

    input.removeAttribute("name");
    await waitForMacrotask();

    expect(input.name).toBe("profile");
  });

  it("applies field names to custom controls that initialized before the field", async () => {
    document.body.innerHTML = `
      <div data-sw-field data-name="accept">
        <span data-sw-checkbox data-value="accepted"></span>
      </div>
      <div data-sw-field data-name="plan">
        <div data-sw-radio-group>
          <span data-sw-radio data-value="basic"></span>
          <span data-sw-radio data-value="pro"></span>
        </div>
      </div>
      <div data-sw-field data-name="alerts">
        <span data-sw-switch data-value="enabled"></span>
      </div>
      <div data-sw-field data-name="volume">
        <div data-sw-slider data-default-value="25">
          <div data-sw-slider-control>
            <div data-sw-slider-track>
              <div data-sw-slider-indicator></div>
            </div>
            <div data-sw-slider-thumb>
              <input data-sw-slider-input />
            </div>
          </div>
        </div>
      </div>
      <div data-sw-field data-name="code">
        <div data-sw-input-otp data-max-length="2">
          <input data-sw-input-otp-input />
          <span data-sw-input-otp-slot></span>
          <span data-sw-input-otp-slot></span>
        </div>
      </div>
    `;

    const checkbox = document.querySelector<HTMLElement>("[data-sw-checkbox]")!;
    const inputOtp = document.querySelector<HTMLElement>("[data-sw-input-otp]")!;
    const radioGroup = document.querySelector<HTMLElement>("[data-sw-radio-group]")!;
    const slider = document.querySelector<HTMLElement>("[data-sw-slider]")!;
    const switchRoot = document.querySelector<HTMLElement>("[data-sw-switch]")!;
    createCheckbox(checkbox);
    createInputOtp(inputOtp);
    createRadioGroup(radioGroup);
    createSlider(slider);
    createSwitch(switchRoot);

    document.querySelectorAll<HTMLElement>("[data-sw-field]").forEach((field) => {
      createField(field);
    });

    checkbox.click();
    radioGroup.querySelector<HTMLElement>('[data-sw-radio][data-value="pro"]')!.click();
    switchRoot.click();
    await waitForMacrotask();

    expect(checkbox.querySelector<HTMLInputElement>("[data-sw-checkbox-input]")!.name).toBe(
      "accept",
    );
    expect(
      radioGroup.querySelector<HTMLInputElement>(
        '[data-sw-radio][data-value="pro"] [data-sw-radio-input]',
      )!.name,
    ).toBe("plan");
    expect(document.querySelector<HTMLInputElement>("[data-sw-switch-input]")!.name).toBe("alerts");
    expect(slider.querySelector<HTMLInputElement>("[data-sw-slider-input]")!.name).toBe("volume");
    expect(inputOtp.querySelector<HTMLInputElement>("[data-sw-input-otp-input]")!.name).toBe(
      "code",
    );
  });

  it("applies field names and disabled state to preinitialized select and combobox controls", () => {
    document.body.innerHTML = `
      <div data-sw-field data-name="theme">
        <div data-sw-select data-default-value="dark" data-required>
          <button data-sw-select-trigger>
            <span data-sw-select-value data-placeholder="Pick theme"></span>
          </button>
          <input data-sw-select-input />
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
        <div data-sw-combobox data-default-value="ca" data-required>
          <div data-sw-combobox-input-group>
            <input data-sw-combobox-input />
            <button data-sw-combobox-trigger type="button">Open</button>
          </div>
          <input data-sw-combobox-hidden-input />
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
    `;

    const fields = Array.from(document.querySelectorAll<HTMLElement>("[data-sw-field]"));
    const select = document.querySelector<HTMLElement>("[data-sw-select]")!;
    const combobox = document.querySelector<HTMLElement>("[data-sw-combobox]")!;
    createSelect(select);
    createCombobox(combobox);

    const selectField = createField(fields[0]!);
    const comboboxField = createField(fields[1]!);

    const selectInput = select.querySelector<HTMLInputElement>("[data-sw-select-input]")!;
    const selectTrigger = select.querySelector<HTMLButtonElement>("[data-sw-select-trigger]")!;
    const comboboxInput = combobox.querySelector<HTMLInputElement>("[data-sw-combobox-input]")!;
    const comboboxHiddenInput = combobox.querySelector<HTMLInputElement>(
      "[data-sw-combobox-hidden-input]",
    )!;

    expect(selectInput.name).toBe("theme");
    expect(selectInput.value).toBe("dark");
    expect(selectInput.required).toBe(true);
    expect(fields[0]).toHaveAttribute("data-filled");
    expect(comboboxHiddenInput.name).toBe("country");
    expect(comboboxHiddenInput.value).toBe("ca");
    expect(comboboxHiddenInput.required).toBe(true);
    expect(comboboxInput.value).toBe("Canada");
    expect(fields[1]).toHaveAttribute("data-filled");

    selectField.setDisabled(true);
    comboboxField.setDisabled(true);

    expect(select).toHaveAttribute("data-disabled");
    expect(selectTrigger.disabled).toBe(true);
    expect(selectInput.disabled).toBe(true);
    expect(combobox).toHaveAttribute("data-disabled");
    expect(comboboxInput.disabled).toBe(true);
    expect(comboboxHiddenInput.disabled).toBe(true);

    selectField.setDisabled(false);
    comboboxField.setDisabled(false);

    expect(select).not.toHaveAttribute("data-disabled");
    expect(selectTrigger.disabled).toBe(false);
    expect(selectInput.disabled).toBe(false);
    expect(combobox).not.toHaveAttribute("data-disabled");
    expect(comboboxInput.disabled).toBe(false);
    expect(comboboxHiddenInput.disabled).toBe(false);
  });

  it("reports and clears valueMissing validity for required select and combobox controls", async () => {
    document.body.innerHTML = `
      <div data-sw-field data-name="theme">
        <div data-sw-select data-required>
          <button data-sw-select-trigger>
            <span data-sw-select-value data-placeholder="Pick theme"></span>
          </button>
          <input data-sw-select-input />
          <div data-sw-select-positioner data-side="bottom" data-align="start">
            <div data-sw-select-popup hidden>
              <div data-sw-select-list>
                <div data-sw-select-item data-value="light">
                  <span data-sw-select-item-text>Light</span>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div data-sw-field-error data-match="valueMissing">Choose a theme</div>
      </div>
      <div data-sw-field data-name="country">
        <div data-sw-combobox data-required>
          <div data-sw-combobox-input-group>
            <input data-sw-combobox-input />
          </div>
          <input data-sw-combobox-hidden-input />
          <div data-sw-combobox-positioner data-side="bottom" data-align="start">
            <div data-sw-combobox-popup hidden>
              <div data-sw-combobox-list>
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

    const fields = Array.from(document.querySelectorAll<HTMLElement>("[data-sw-field]"));
    fields.forEach((field) => createField(field));
    const select = createSelect(document.querySelector<HTMLElement>("[data-sw-select]")!);
    const combobox = createCombobox(document.querySelector<HTMLElement>("[data-sw-combobox]")!);

    expect(fields[0]).toHaveAttribute("data-invalid");
    expect(fields[0]!.querySelector<HTMLElement>("[data-sw-field-error]")!.hidden).toBe(false);
    expect(fields[1]).toHaveAttribute("data-invalid");
    expect(fields[1]!.querySelector<HTMLElement>("[data-sw-field-error]")!.hidden).toBe(false);

    select.setValue("light");
    combobox.open();
    document.querySelector<HTMLElement>('[data-sw-combobox-item][data-value="ca"]')!.click();
    await waitForMacrotask();

    expect(select.getValue()).toBe("light");
    expect(fields[0]).toHaveAttribute("data-valid");
    expect(fields[0]).not.toHaveAttribute("data-invalid");
    expect(fields[0]!.querySelector<HTMLElement>("[data-sw-field-error]")!.hidden).toBe(true);
    expect(combobox.getValue()).toBe("ca");
    expect(fields[1]).not.toHaveAttribute("data-invalid");
    expect(fields[1]!.querySelector<HTMLElement>("[data-sw-field-error]")!.hidden).toBe(true);
  });

  it("mirrors visible validation state to runtime control surfaces", () => {
    document.body.innerHTML = `
      <div data-sw-field data-name="displayName">
        <input data-sw-input />
        <div data-sw-field-error data-match="valueMissing">Enter a display name</div>
      </div>
      <div data-sw-field data-name="notes">
        <textarea></textarea>
        <div data-sw-field-error data-match="valueMissing">Enter notes</div>
      </div>
      <div data-sw-field data-name="region">
        <select>
          <option value="">Choose a region</option>
          <option value="na">North America</option>
        </select>
        <div data-sw-field-error data-match="valueMissing">Choose a region</div>
      </div>
      <div data-sw-field data-name="theme">
        <div data-sw-select>
          <button data-sw-select-trigger>Pick theme</button>
          <input data-sw-select-input type="hidden" />
          <div data-sw-select-positioner data-side="bottom" data-align="start">
            <div data-sw-select-popup hidden>
              <div data-sw-select-list>
                <div data-sw-select-item data-value="light">
                  <span data-sw-select-item-text>Light</span>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div data-sw-field-error data-match="valueMissing">Choose a theme</div>
      </div>
      <div data-sw-field data-name="country">
        <div data-sw-combobox>
          <div data-sw-combobox-input-group>
            <input data-sw-combobox-input />
          </div>
          <input data-sw-combobox-hidden-input type="hidden" />
          <div data-sw-combobox-positioner data-side="bottom" data-align="start">
            <div data-sw-combobox-popup hidden>
              <div data-sw-combobox-list>
                <div data-sw-combobox-item data-value="ca">
                  <span data-sw-combobox-item-text>Canada</span>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div data-sw-field-error data-match="valueMissing">Choose a country</div>
      </div>
      <div data-sw-field data-name="channels">
        <div data-sw-checkbox-group>
          <span data-sw-checkbox><input data-sw-checkbox-input type="checkbox" hidden /></span>
        </div>
        <div data-sw-field-error data-match="valueMissing">Choose a channel</div>
      </div>
      <div data-sw-field data-name="plan">
        <div data-sw-radio-group>
          <span data-sw-radio><input data-sw-radio-input type="radio" hidden /></span>
        </div>
        <div data-sw-field-error data-match="valueMissing">Choose a plan</div>
      </div>
      <div data-sw-field data-name="alerts">
        <button data-sw-switch type="button"><span data-sw-switch-thumb></span></button>
        <div data-sw-field-error data-match="valueMissing">Enable alerts</div>
      </div>
      <div data-sw-field data-name="code">
        <div data-sw-input-otp>
          <input data-sw-input-otp-input type="text" />
          <div data-sw-input-otp-slot data-index="0"></div>
        </div>
        <div data-sw-field-error data-match="valueMissing">Enter the code</div>
      </div>
      <div data-sw-field data-name="volume">
        <div data-sw-slider>
          <div data-sw-slider-control>
            <div data-sw-slider-track>
              <div data-sw-slider-indicator></div>
            </div>
            <div data-sw-slider-thumb data-index="0"><input data-sw-slider-input /></div>
          </div>
        </div>
        <div data-sw-field-error data-match="valueMissing">Choose a volume</div>
      </div>
    `;

    const fields = Array.from(document.querySelectorAll<HTMLElement>("[data-sw-field]"));
    const instances = fields.map((field) => createField(field));
    const error = { key: "valueMissing" as const, message: "Required", source: "native" as const };

    instances.forEach((instance) =>
      instance.setFormValidationState({
        errors: [error],
        submitted: false,
        validated: true,
        visible: false,
      }),
    );

    const surfaces = [
      document.querySelector<HTMLElement>("[data-sw-input]")!,
      document.querySelector<HTMLElement>("textarea")!,
      document.querySelector<HTMLElement>("select")!,
      document.querySelector<HTMLElement>("[data-sw-select-trigger]")!,
      document.querySelector<HTMLElement>("[data-sw-combobox-input]")!,
      document.querySelector<HTMLElement>("[data-sw-combobox-input-group]")!,
      document.querySelector<HTMLElement>("[data-sw-checkbox]")!,
      document.querySelector<HTMLElement>("[data-sw-radio]")!,
      document.querySelector<HTMLElement>("[data-sw-switch]")!,
      document.querySelector<HTMLElement>("[data-sw-input-otp-slot]")!,
      document.querySelector<HTMLElement>("[data-sw-slider-control]")!,
      document.querySelector<HTMLElement>("[data-sw-slider-track]")!,
      document.querySelector<HTMLElement>("[data-sw-slider-indicator]")!,
      document.querySelector<HTMLElement>("[data-sw-slider-thumb]")!,
    ];

    surfaces.forEach((surface) => {
      expect(surface).toHaveAttribute("data-invalid");
      expect(surface).not.toHaveAttribute("data-error-visible");
    });
    const accessibleSurfaces = [
      document.querySelector<HTMLElement>("[data-sw-input]")!,
      document.querySelector<HTMLElement>("textarea")!,
      document.querySelector<HTMLElement>("select")!,
      document.querySelector<HTMLElement>("[data-sw-select-trigger]")!,
      document.querySelector<HTMLElement>("[data-sw-combobox-input]")!,
      document.querySelector<HTMLElement>("[data-sw-checkbox]")!,
      document.querySelector<HTMLElement>("[data-sw-radio]")!,
      document.querySelector<HTMLElement>("[data-sw-switch]")!,
      document.querySelector<HTMLElement>("[data-sw-slider-thumb]")!,
    ];
    accessibleSurfaces.forEach((surface) =>
      expect(surface).toHaveAttribute("aria-invalid", "true"),
    );

    instances.forEach((instance) =>
      instance.setFormValidationState({
        errors: [error],
        submitted: true,
        validated: true,
        visible: true,
      }),
    );

    surfaces.forEach((surface) => expect(surface).toHaveAttribute("data-error-visible"));

    instances.forEach((instance) =>
      instance.setFormValidationState({
        errors: [],
        submitted: true,
        validated: true,
        visible: false,
      }),
    );

    surfaces.forEach((surface) => {
      expect(surface).not.toHaveAttribute("data-error-visible");
      expect(surface).not.toHaveAttribute("data-invalid");
    });
    accessibleSurfaces.forEach((surface) => expect(surface).not.toHaveAttribute("aria-invalid"));
  });

  it("mirrors field validation state to the visible Dropzone surface", () => {
    document.body.innerHTML = `
      <div data-sw-field data-name="attachments">
        <div data-sw-dropzone>
          <input data-sw-dropzone-input type="file" required />
        </div>
        <div data-sw-field-error data-match="valueMissing">Upload a file</div>
      </div>
    `;

    const field = document.querySelector<HTMLElement>("[data-sw-field]")!;
    const dropzone = document.querySelector<HTMLElement>("[data-sw-dropzone]")!;
    const error = document.querySelector<HTMLElement>("[data-sw-field-error]")!;
    createField(field);

    expect(field).toHaveAttribute("data-invalid");
    expect(error.hidden).toBe(false);
    expect(dropzone).toHaveAttribute("data-invalid");
    expect(dropzone).toHaveAttribute("data-error-visible");
    expect(dropzone).toHaveAttribute("aria-invalid", "true");
    expect(dropzone.getAttribute("aria-describedby")?.split(/\s+/)).toContain(error.id);
  });

  it("updates filled and dirty state from files selected in a Field-owned Dropzone", async () => {
    document.body.innerHTML = `
      <div data-sw-field data-name="attachments">
        <div data-sw-dropzone>
          <input data-sw-dropzone-input type="file" />
        </div>
      </div>
    `;

    const field = document.querySelector<HTMLElement>("[data-sw-field]")!;
    const dropzone = document.querySelector<HTMLElement>("[data-sw-dropzone]")!;
    const input = document.querySelector<HTMLInputElement>("[data-sw-dropzone-input]")!;
    createField(field);

    const file = new File(["hello"], "hello.txt", { type: "text/plain" });
    const transfer = new DataTransfer();
    transfer.items.add(file);
    input.files = transfer.files;
    input.dispatchEvent(new Event("change", { bubbles: true }));
    await waitForMacrotask();

    expect(field).toHaveAttribute("data-filled");
    expect(field).toHaveAttribute("data-dirty");
    expect(dropzone).toHaveAttribute("data-filled");
    expect(dropzone).toHaveAttribute("data-dirty");
  });

  it("reapplies disabled state to a preinitialized checkbox field", () => {
    document.body.innerHTML = `
      <div data-sw-field data-disabled>
        <span data-sw-checkbox>
          <input data-sw-checkbox-input />
        </span>
      </div>
    `;

    const field = document.querySelector<HTMLElement>("[data-sw-field]")!;
    const checkbox = document.querySelector<HTMLElement>("[data-sw-checkbox]")!;
    createCheckbox(checkbox);
    createField(field);

    expect(checkbox).toHaveAttribute("aria-disabled", "true");
    expect(checkbox.querySelector<HTMLInputElement>("[data-sw-checkbox-input]")!.disabled).toBe(
      true,
    );
  });

  it("reapplies disabled state to a preinitialized radio group field", () => {
    document.body.innerHTML = `
      <div data-sw-field data-disabled>
        <div data-sw-radio-group>
          <span data-sw-radio data-value="basic">
            <input data-sw-radio-input />
          </span>
        </div>
      </div>
    `;

    const field = document.querySelector<HTMLElement>("[data-sw-field]")!;
    const radioGroup = document.querySelector<HTMLElement>("[data-sw-radio-group]")!;
    createRadioGroup(radioGroup);
    createField(field);

    expect(radioGroup).toHaveAttribute("data-disabled");
    expect(radioGroup.querySelector<HTMLInputElement>("[data-sw-radio-input]")!.disabled).toBe(
      true,
    );
  });

  it("reapplies disabled state to a preinitialized slider field", () => {
    document.body.innerHTML = `
      <div data-sw-field data-disabled>
        <div data-sw-slider data-default-value="25">
          <div data-sw-slider-control>
            <div data-sw-slider-track></div>
            <div data-sw-slider-thumb>
              <input data-sw-slider-input />
            </div>
          </div>
        </div>
      </div>
    `;

    const field = document.querySelector<HTMLElement>("[data-sw-field]")!;
    const slider = document.querySelector<HTMLElement>("[data-sw-slider]")!;
    createSlider(slider);
    createField(field);

    expect(slider).toHaveAttribute("data-disabled");
    expect(slider.querySelector<HTMLElement>("[data-sw-slider-thumb]")).toHaveAttribute(
      "aria-disabled",
      "true",
    );
    expect(slider.querySelector<HTMLInputElement>("[data-sw-slider-input]")!.disabled).toBe(true);
  });

  it("reapplies disabled state to a preinitialized switch field", () => {
    document.body.innerHTML = `
      <div data-sw-field data-disabled>
        <span data-sw-switch>
          <input data-sw-switch-input />
        </span>
      </div>
    `;

    const field = document.querySelector<HTMLElement>("[data-sw-field]")!;
    const switchRoot = document.querySelector<HTMLElement>("[data-sw-switch]")!;
    createSwitch(switchRoot);
    createField(field);

    expect(switchRoot).toHaveAttribute("aria-disabled", "true");
    expect(document.querySelector<HTMLInputElement>("[data-sw-switch-input]")!.disabled).toBe(true);
  });

  it("reapplies disabled state to a preinitialized input OTP field", () => {
    document.body.innerHTML = `
      <div data-sw-field data-disabled>
        <div data-sw-input-otp data-max-length="2">
          <input data-sw-input-otp-input />
          <span data-sw-input-otp-slot></span>
          <span data-sw-input-otp-slot></span>
        </div>
      </div>
    `;

    const field = document.querySelector<HTMLElement>("[data-sw-field]")!;
    const inputOtp = document.querySelector<HTMLElement>("[data-sw-input-otp]")!;
    createInputOtp(inputOtp);
    createField(field);

    expect(inputOtp).toHaveAttribute("data-disabled");
    expect(inputOtp.querySelector<HTMLInputElement>("[data-sw-input-otp-input]")!.disabled).toBe(
      true,
    );
  });

  it("clears field-owned names without clearing child-owned names", async () => {
    document.body.innerHTML = `
      <div data-sw-field data-name="profile">
        <input data-sw-field-control data-sw-input />
      </div>
      <div data-sw-field data-name="accept">
        <span data-sw-checkbox></span>
      </div>
      <div data-sw-field data-name="toppings">
        <div data-sw-checkbox-group>
          <span data-sw-checkbox data-value="mushroom"></span>
        </div>
      </div>
      <div data-sw-field data-name="plan">
        <div data-sw-radio-group>
          <span data-sw-radio data-value="basic"></span>
        </div>
      </div>
      <div data-sw-field data-name="volume">
        <div data-sw-slider data-default-value="25">
          <div data-sw-slider-control>
            <div data-sw-slider-track></div>
            <div data-sw-slider-thumb>
              <input data-sw-slider-input />
            </div>
          </div>
        </div>
      </div>
      <div data-sw-field data-name="alerts">
        <span data-sw-switch></span>
      </div>
      <div data-sw-field data-name="code">
        <div data-sw-input-otp data-max-length="2">
          <input data-sw-input-otp-input />
          <span data-sw-input-otp-slot></span>
          <span data-sw-input-otp-slot></span>
        </div>
      </div>
      <div data-sw-field>
        <span data-sw-checkbox data-name="child-owned"></span>
      </div>
    `;

    const fields = Array.from(document.querySelectorAll<HTMLElement>("[data-sw-field]"));
    const instances = fields.map((field) => createField(field));

    expect(document.querySelector<HTMLInputElement>("[data-sw-input]")!.name).toBe("profile");
    expect(fields[1]!.querySelector<HTMLInputElement>("[data-sw-checkbox-input]")!.name).toBe(
      "accept",
    );
    expect(fields[2]!.querySelector<HTMLInputElement>("[data-sw-checkbox-input]")!.name).toBe(
      "toppings",
    );
    expect(fields[3]!.querySelector<HTMLInputElement>("[data-sw-radio-input]")!.name).toBe("plan");
    expect(fields[4]!.querySelector<HTMLInputElement>("[data-sw-slider-input]")!.name).toBe(
      "volume",
    );
    expect(document.querySelector<HTMLInputElement>("[data-sw-switch-input]")!.name).toBe("alerts");
    expect(fields[6]!.querySelector<HTMLInputElement>("[data-sw-input-otp-input]")!.name).toBe(
      "code",
    );
    expect(fields[7]!.querySelector<HTMLInputElement>("[data-sw-checkbox-input]")!.name).toBe(
      "child-owned",
    );

    instances.slice(0, 7).forEach((instance) => instance.setName(undefined));
    await waitForMacrotask();

    expect(document.querySelector<HTMLInputElement>("[data-sw-input]")!.name).toBe("");
    expect(fields[1]!.querySelector<HTMLInputElement>("[data-sw-checkbox-input]")!.name).toBe("");
    expect(fields[2]!.querySelector<HTMLInputElement>("[data-sw-checkbox-input]")!.name).toBe("");
    expect(fields[3]!.querySelector<HTMLInputElement>("[data-sw-radio-input]")!.name).toBe("");
    expect(fields[4]!.querySelector<HTMLInputElement>("[data-sw-slider-input]")!.name).toBe("");
    expect(document.querySelector<HTMLInputElement>("[data-sw-switch-input]")!.name).toBe("");
    expect(fields[6]!.querySelector<HTMLInputElement>("[data-sw-input-otp-input]")!.name).toBe("");
    expect(fields[7]!.querySelector<HTMLInputElement>("[data-sw-checkbox-input]")!.name).toBe(
      "child-owned",
    );
  });

  it("uses a switch sibling input for required validity", async () => {
    document.body.innerHTML = `
      <div data-sw-field data-name="alerts">
        <span data-sw-switch data-required>
          <span data-sw-switch-thumb></span>
        </span>
        <div data-sw-field-error data-match="valueMissing">Required</div>
      </div>
    `;

    const field = document.querySelector<HTMLElement>("[data-sw-field]")!;
    const switchRoot = document.querySelector<HTMLElement>("[data-sw-switch]")!;
    const error = document.querySelector<HTMLElement>("[data-sw-field-error]")!;
    createField(field);

    expect(document.querySelector<HTMLInputElement>("[data-sw-switch-input]")).toBeTruthy();
    expect(field).toHaveAttribute("data-invalid");
    expect(error.hidden).toBe(false);

    switchRoot.click();
    await waitForMacrotask();

    expect(field).toHaveAttribute("data-valid");
    expect(field).not.toHaveAttribute("data-invalid");
    expect(error.hidden).toBe(true);
  });
});

async function waitForMacrotask(): Promise<void> {
  await new Promise((resolve) => setTimeout(resolve, 0));
}

async function waitFor(assertion: () => void): Promise<void> {
  let lastError: unknown;

  for (let attempt = 0; attempt < 100; attempt += 1) {
    try {
      assertion();
      return;
    } catch (error) {
      lastError = error;
      await new Promise((resolve) => setTimeout(resolve, 5));
    }
  }

  throw lastError;
}
