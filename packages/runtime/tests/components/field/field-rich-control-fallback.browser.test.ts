import { beforeEach, describe, expect, it } from "vitest";

import { createField } from "../../../src/components/field/field";

type FieldInstance = ReturnType<typeof createField>;

describe("createField rich-control fallback", () => {
  beforeEach(() => {
    document.body.innerHTML = "";
  });

  it("adopts known select, combobox, and slider markup when only Field was imported", async () => {
    document.body.innerHTML = renderRichControlFields();

    document
      .querySelectorAll<HTMLElement>("[data-sw-field]")
      .forEach((field) => createField(field));

    await expectRichControlFieldsAdopted();
  });

  it("adopts known boolean and group control markup when only Field was imported", async () => {
    document.body.innerHTML = renderBooleanControlFields();

    document
      .querySelectorAll<HTMLElement>("[data-sw-field]")
      .forEach((field) => createField(field));

    await expectBooleanControlFieldsAdopted();
  });

  it("applies disabled state and focus targets for migrated controls after Field-only adoption", async () => {
    document.body.innerHTML = renderBooleanControlStateFields();
    const root = document.querySelector<HTMLElement>("[data-boolean-control-state-fields]")!;

    const instances = Array.from(root.querySelectorAll<HTMLElement>("[data-sw-field]")).map(
      (field) => createField(field),
    );

    await waitFor(() => {
      expect(
        root.querySelector<HTMLInputElement>(
          '[data-sw-field][data-name="disabledChannels"] [data-sw-checkbox-input]',
        )!.disabled,
      ).toBe(true);
      expect(
        root.querySelector<HTMLInputElement>(
          '[data-sw-field][data-name="disabledContact"] [data-sw-radio-input]',
        )!.disabled,
      ).toBe(true);
      expect(
        root.querySelector<HTMLInputElement>(
          '[data-sw-field][data-name="disabledAlerts"] [data-sw-switch-input]',
        )!.disabled,
      ).toBe(true);
      expect(
        root.querySelector<HTMLInputElement>(
          '[data-sw-field][data-name="focusChannels"] [data-sw-checkbox-input]',
        )!.name,
      ).toBe("focusChannels");
      expect(
        root.querySelector<HTMLInputElement>(
          '[data-sw-field][data-name="focusContact"] [data-sw-radio-input]',
        )!.name,
      ).toBe("focusContact");
      expect(
        root.querySelector<HTMLInputElement>(
          '[data-sw-field][data-name="focusAlerts"] [data-sw-switch-input]',
        )!.name,
      ).toBe("focusAlerts");
    });

    instances[3]!.getFormRegistration().focus();
    expect(document.activeElement).toBe(
      root.querySelector<HTMLInputElement>(
        '[data-sw-field][data-name="focusChannels"] [data-sw-checkbox-input]',
      ),
    );

    instances[4]!.getFormRegistration().focus();
    expect(document.activeElement).toBe(
      root.querySelector<HTMLInputElement>(
        '[data-sw-field][data-name="focusContact"] [data-sw-radio-input]',
      ),
    );

    instances[5]!.getFormRegistration().focus();
    expect(document.activeElement).toBe(
      root.querySelector<HTMLInputElement>(
        '[data-sw-field][data-name="focusAlerts"] [data-sw-switch-input]',
      ),
    );
  });

  it("adopts known specialized input markup when only Field was imported", async () => {
    document.body.innerHTML = renderSpecializedControlFields();

    const instances = Array.from(document.querySelectorAll<HTMLElement>("[data-sw-field]")).map(
      (field) => createField(field),
    );

    await expectSpecializedControlFieldsAdopted();
    expectSpecializedControlFormRegistrations(instances);
  });

  it("uses latest Field state when specialized fallback resolves after updates", async () => {
    document.body.innerHTML = renderSpecializedStateUpdateFields();
    const root = document.querySelector<HTMLElement>("[data-specialized-state-update-fields]")!;
    const instances = Array.from(root.querySelectorAll<HTMLElement>("[data-sw-field]")).map(
      (field) => createField(field),
    );

    instances[0]!.setName("updatedCode");
    instances[0]!.setDisabled(true);
    instances[1]!.setName("updatedAttachments");
    instances[1]!.setDisabled(true);

    await waitFor(() => {
      expect(root.querySelector<HTMLInputElement>("[data-sw-input-otp-input]")!.name).toBe(
        "updatedCode",
      );
      expect(root.querySelector<HTMLInputElement>("[data-sw-input-otp-input]")!.disabled).toBe(
        true,
      );
      expect(root.querySelector<HTMLInputElement>("[data-sw-dropzone-input]")!.name).toBe(
        "updatedAttachments",
      );
      expect(root.querySelector<HTMLInputElement>("[data-sw-dropzone-input]")!.disabled).toBe(true);
    });
  });

  it("adopts known rich-control markup from the built Field entry when dist exists", async () => {
    const runtimeModule = await importBuiltFieldEntry();
    if (!runtimeModule) return;

    document.body.innerHTML = renderFieldOnlyFallbackFields();

    document
      .querySelectorAll<HTMLElement>("[data-sw-field]")
      .forEach((field) => runtimeModule.createField(field));

    await expectRichControlFieldsAdopted();
    await expectBooleanControlFieldsAdopted();
    await expectSpecializedControlFieldsAdopted();
  });
});

function renderFieldOnlyFallbackFields(): string {
  return `
    ${renderRichControlFields()}
    ${renderBooleanControlFields()}
    ${renderSpecializedControlFields()}
  `;
}

function renderRichControlFields(): string {
  return `
    <form data-rich-control-fields>
      <div data-sw-field data-name="theme">
        <div data-sw-select data-default-value="dark" data-required>
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
        <div data-sw-combobox data-default-value="ca" data-required>
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
    </form>
  `;
}

function renderBooleanControlFields(): string {
  return `
    <form data-boolean-control-fields>
      <div data-sw-field data-name="accept">
        <span data-sw-checkbox data-default-checked data-required data-value="yes">
          <input data-sw-checkbox-input type="checkbox" />
        </span>
      </div>
      <div data-sw-field data-name="channels">
        <div data-sw-checkbox-group data-default-value='["email"]'>
          <span data-sw-checkbox data-value="email">
            <input data-sw-checkbox-input type="checkbox" />
          </span>
          <span data-sw-checkbox data-value="sms">
            <input data-sw-checkbox-input type="checkbox" />
          </span>
        </div>
      </div>
      <div data-sw-field data-name="contact">
        <span data-sw-radio data-default-checked data-required data-value="phone">
          <input data-sw-radio-input type="radio" />
        </span>
      </div>
      <div data-sw-field data-name="plan">
        <div data-sw-radio-group data-default-value="pro" data-required>
          <span data-sw-radio data-value="basic">
            <input data-sw-radio-input type="radio" />
          </span>
          <span data-sw-radio data-value="pro">
            <input data-sw-radio-input type="radio" />
          </span>
        </div>
      </div>
      <div data-sw-field data-name="alerts">
        <span data-sw-switch data-default-checked data-required data-value="enabled">
          <span data-sw-switch-thumb></span>
          <input data-sw-switch-input type="checkbox" />
        </span>
      </div>
    </form>
  `;
}

function renderBooleanControlStateFields(): string {
  return `
    <form data-boolean-control-state-fields>
      <div data-sw-field data-name="disabledChannels" data-disabled>
        <div data-sw-checkbox-group>
          <span data-sw-checkbox data-value="email">
            <input data-sw-checkbox-input type="checkbox" />
          </span>
        </div>
      </div>
      <div data-sw-field data-name="disabledContact" data-disabled>
        <span data-sw-radio data-value="phone">
          <input data-sw-radio-input type="radio" />
        </span>
      </div>
      <div data-sw-field data-name="disabledAlerts" data-disabled>
        <span data-sw-switch>
          <span data-sw-switch-thumb></span>
          <input data-sw-switch-input type="checkbox" />
        </span>
      </div>
      <div data-sw-field data-name="focusChannels">
        <div data-sw-checkbox-group>
          <span data-sw-checkbox data-value="email">
            <input data-sw-checkbox-input type="checkbox" />
          </span>
        </div>
      </div>
      <div data-sw-field data-name="focusContact">
        <span data-sw-radio data-value="phone">
          <input data-sw-radio-input type="radio" />
        </span>
      </div>
      <div data-sw-field data-name="focusAlerts">
        <span data-sw-switch>
          <span data-sw-switch-thumb></span>
          <input data-sw-switch-input type="checkbox" />
        </span>
      </div>
    </form>
  `;
}

function renderSpecializedControlFields(): string {
  return `
    <form data-specialized-control-fields>
      <div data-sw-field data-name="code">
        <div data-sw-input-otp data-default-value="12" data-max-length="4" data-required>
          <input data-sw-input-otp-input />
          <span data-sw-input-otp-slot></span>
          <span data-sw-input-otp-slot></span>
          <span data-sw-input-otp-slot></span>
          <span data-sw-input-otp-slot></span>
        </div>
      </div>
      <div data-sw-field data-name="attachments">
        <label data-sw-dropzone>
          <input data-sw-dropzone-input type="file" required />
          <div data-sw-dropzone-files-list></div>
        </label>
      </div>
      <div data-sw-field data-name="disabledCode" data-disabled>
        <div data-sw-input-otp data-max-length="2">
          <input data-sw-input-otp-input />
          <span data-sw-input-otp-slot></span>
          <span data-sw-input-otp-slot></span>
        </div>
      </div>
      <div data-sw-field data-name="disabledAttachments" data-disabled>
        <label data-sw-dropzone>
          <input data-sw-dropzone-input type="file" />
          <div data-sw-dropzone-files-list></div>
        </label>
      </div>
    </form>
  `;
}

function renderSpecializedStateUpdateFields(): string {
  return `
    <form data-specialized-state-update-fields>
      <div data-sw-field data-name="initialCode">
        <div data-sw-input-otp data-default-value="9" data-max-length="2">
          <input data-sw-input-otp-input />
          <span data-sw-input-otp-slot></span>
          <span data-sw-input-otp-slot></span>
        </div>
      </div>
      <div data-sw-field data-name="initialAttachments">
        <label data-sw-dropzone>
          <input data-sw-dropzone-input type="file" />
          <div data-sw-dropzone-files-list></div>
        </label>
      </div>
    </form>
  `;
}

async function expectRichControlFieldsAdopted(): Promise<void> {
  const root = document.querySelector<HTMLElement>("[data-rich-control-fields]")!;

  await waitFor(() => {
    expect(root.querySelector<HTMLInputElement>("[data-sw-select-input]")!.name).toBe("theme");
    expect(root.querySelector<HTMLInputElement>("[data-sw-combobox-hidden-input]")!.name).toBe(
      "country",
    );
    expect(root.querySelector<HTMLInputElement>("[data-sw-slider-input]")!.name).toBe("volume");
  });

  const selectInput = root.querySelector<HTMLInputElement>("[data-sw-select-input]")!;
  const comboboxInput = root.querySelector<HTMLInputElement>("[data-sw-combobox-input]")!;
  const comboboxHiddenInput = root.querySelector<HTMLInputElement>(
    "[data-sw-combobox-hidden-input]",
  )!;
  const sliderInput = root.querySelector<HTMLInputElement>("[data-sw-slider-input]")!;

  expect(selectInput.value).toBe("dark");
  expect(selectInput.required).toBe(true);
  expect(comboboxInput.value).toBe("Canada");
  expect(comboboxHiddenInput.value).toBe("ca");
  expect(comboboxHiddenInput.required).toBe(true);
  expect(sliderInput.value).toBe("0");
  expect(Object.fromEntries(new FormData(root.closest("form")!).entries())).toEqual({
    country: "ca",
    theme: "dark",
    volume: "0",
  });
}

async function expectBooleanControlFieldsAdopted(): Promise<void> {
  const root = document.querySelector<HTMLElement>("[data-boolean-control-fields]")!;

  await waitFor(() => {
    expect(root.querySelector<HTMLInputElement>("[data-sw-checkbox-input]")!.name).toBe("accept");
    expect(
      root.querySelector<HTMLInputElement>(
        '[data-sw-checkbox-group] [data-sw-checkbox][data-value="email"] [data-sw-checkbox-input]',
      )!.name,
    ).toBe("channels");
    expect(
      root.querySelector<HTMLInputElement>(
        '[data-sw-field][data-name="contact"] [data-sw-radio-input]',
      )!.name,
    ).toBe("contact");
    expect(
      root.querySelector<HTMLInputElement>(
        '[data-sw-radio-group] [data-sw-radio][data-value="pro"] [data-sw-radio-input]',
      )!.name,
    ).toBe("plan");
    expect(root.querySelector<HTMLInputElement>("[data-sw-switch-input]")!.name).toBe("alerts");
  });

  const checkbox = root.querySelector<HTMLElement>("[data-sw-checkbox]")!;
  const checkboxInput = root.querySelector<HTMLInputElement>("[data-sw-checkbox-input]")!;
  const checkboxGroup = root.querySelector<HTMLElement>("[data-sw-checkbox-group]")!;
  const radio = root.querySelector<HTMLElement>(
    '[data-sw-field][data-name="contact"] [data-sw-radio]',
  )!;
  const radioInput = radio.querySelector<HTMLInputElement>("[data-sw-radio-input]")!;
  const radioGroup = root.querySelector<HTMLElement>("[data-sw-radio-group]")!;
  const switchRoot = root.querySelector<HTMLElement>("[data-sw-switch]")!;
  const switchInput = root.querySelector<HTMLInputElement>("[data-sw-switch-input]")!;

  expect(checkbox).toHaveAttribute("aria-checked", "true");
  expect(checkboxInput.checked).toBe(true);
  expect(checkboxInput.required).toBe(true);
  expect(checkboxGroup).toHaveAttribute("data-value", '["email"]');
  expect(radio).toHaveAttribute("aria-checked", "true");
  expect(radioInput.checked).toBe(true);
  expect(radioInput.required).toBe(true);
  expect(radioGroup).toHaveAttribute("data-value", "pro");
  expect(switchRoot).toHaveAttribute("aria-checked", "true");
  expect(switchInput.checked).toBe(true);
  expect(switchInput.required).toBe(true);

  const form = root.closest("form")!;
  const entries = Array.from(new FormData(form).entries());
  expect(Object.fromEntries(entries)).toEqual({
    accept: "yes",
    alerts: "enabled",
    channels: "email",
    contact: "phone",
    plan: "pro",
  });
}

async function expectSpecializedControlFieldsAdopted(): Promise<void> {
  const root = document.querySelector<HTMLElement>("[data-specialized-control-fields]")!;

  await waitFor(() => {
    expect(
      root.querySelector<HTMLInputElement>(
        '[data-sw-field][data-name="code"] [data-sw-input-otp-input]',
      )!.name,
    ).toBe("code");
    expect(
      root.querySelector<HTMLInputElement>(
        '[data-sw-field][data-name="attachments"] [data-sw-dropzone-input]',
      )!.name,
    ).toBe("attachments");
    expect(
      root.querySelector<HTMLInputElement>(
        '[data-sw-field][data-name="disabledCode"] [data-sw-input-otp-input]',
      )!.disabled,
    ).toBe(true);
    expect(
      root.querySelector<HTMLInputElement>(
        '[data-sw-field][data-name="disabledAttachments"] [data-sw-dropzone-input]',
      )!.disabled,
    ).toBe(true);
  });

  const inputOtp = root.querySelector<HTMLElement>(
    '[data-sw-field][data-name="code"] [data-sw-input-otp]',
  )!;
  const inputOtpInput = inputOtp.querySelector<HTMLInputElement>("[data-sw-input-otp-input]")!;
  const dropzone = root.querySelector<HTMLElement>(
    '[data-sw-field][data-name="attachments"] [data-sw-dropzone]',
  )!;
  const dropzoneInput = dropzone.querySelector<HTMLInputElement>("[data-sw-dropzone-input]")!;
  const file = new File(["hello"], "hello.txt", { type: "text/plain" });
  const transfer = new DataTransfer();
  transfer.items.add(file);

  expect(inputOtp).toHaveAttribute("data-value", "12");
  expect(inputOtp).toHaveAttribute("data-filled");
  expect(inputOtp).toHaveAttribute("data-valid");
  expect(inputOtpInput.value).toBe("12");
  expect(inputOtpInput.required).toBe(true);
  expect(new FormData(root.closest("form")!).get("code")).toBe("12");
  expect(
    root.querySelector<HTMLElement>('[data-sw-field][data-name="attachments"]'),
  ).toHaveAttribute("data-invalid");
  expect(dropzone).toHaveAttribute("data-invalid");
  expect(dropzoneInput.required).toBe(true);

  dropzoneInput.files = transfer.files;
  dropzoneInput.dispatchEvent(new Event("change", { bubbles: true }));

  await waitFor(() => {
    expect(dropzone).toHaveAttribute("data-has-files", "true");
    expect(dropzone).toHaveAttribute("data-filled");
    expect(dropzone).toHaveAttribute("data-valid");
  });

  expect((new FormData(root.closest("form")!).get("attachments") as File).name).toBe("hello.txt");
}

function expectSpecializedControlFormRegistrations(instances: FieldInstance[]): void {
  const root = document.querySelector<HTMLElement>("[data-specialized-control-fields]")!;
  const inputOtpInput = root.querySelector<HTMLInputElement>(
    '[data-sw-field][data-name="code"] [data-sw-input-otp-input]',
  )!;
  const dropzoneInput = root.querySelector<HTMLInputElement>(
    '[data-sw-field][data-name="attachments"] [data-sw-dropzone-input]',
  )!;

  const codeRegistration = instances[0]!.getFormRegistration();
  expect(codeRegistration.name).toBe("code");
  expect(codeRegistration.value).toBe("12");
  expect(codeRegistration.valid).toBe(true);
  codeRegistration.focus();
  expect(document.activeElement).toBe(inputOtpInput);

  const attachmentsRegistration = instances[1]!.getFormRegistration();
  expect(attachmentsRegistration.name).toBe("attachments");
  expect((attachmentsRegistration.value as File).name).toBe("hello.txt");
  expect(attachmentsRegistration.valid).toBe(true);
  attachmentsRegistration.focus();
  expect(document.activeElement).toBe(dropzoneInput);
}

async function importBuiltFieldEntry(): Promise<
  { createField(root: HTMLElement): { destroy(): void } } | undefined
> {
  try {
    const moduleUrl = new URL("../../../dist/field.js", import.meta.url).href;
    return (await import(/* @vite-ignore */ moduleUrl)) as {
      createField(root: HTMLElement): { destroy(): void };
    };
  } catch {
    return undefined;
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
