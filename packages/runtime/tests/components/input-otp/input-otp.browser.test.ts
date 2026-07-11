import { beforeEach, describe, expect, it, vi } from "vitest";

import {
  createInputOtp,
  type InputOtpValueChangeDetails,
} from "../../../src/components/input-otp/input-otp";

describe("createInputOtp", () => {
  beforeEach(() => {
    document.body.innerHTML = "";
  });

  it("initializes slot text and form input from the default value", () => {
    const root = renderInputOtp({ defaultValue: "12", maxLength: 4 });

    createInputOtp(root);

    expect(root.getAttribute("data-sw-input-otp")).toBe("");
    expect(root.getAttribute("data-value")).toBe("12");
    expect(getInput().value).toBe("12");
    expect(getSlotText()).toEqual(["1", "2", "", ""]);
  });

  it("focuses the hidden input and marks the next empty slot active on click", () => {
    const root = renderInputOtp({ defaultValue: "12", maxLength: 4 });

    createInputOtp(root);
    root.click();

    expect(document.activeElement).toBe(getInput());
    expect(getSlots().map((slot) => slot.getAttribute("data-active"))).toEqual([
      "false",
      "false",
      "true",
      "false",
    ]);
    expect(getCaret(2).hidden).toBe(false);
  });

  it("forwards form-control ARIA metadata to the focused hidden input", async () => {
    document.body.innerHTML = `
      <p id="otp-hint">Enter the verification code.</p>
      <p id="otp-error">The code is invalid.</p>
      ${createInputOtpMarkup({ maxLength: 4 })}
    `;
    const root = document.querySelector<HTMLElement>("[data-sw-input-otp]")!;
    root.setAttribute("aria-describedby", "otp-hint");
    root.setAttribute("aria-errormessage", "otp-error");
    root.setAttribute("aria-invalid", "true");
    const instance = createInputOtp(root);

    root.click();

    const input = getInput();
    expect(document.activeElement).toBe(input);
    expect(input).toHaveAttribute("aria-describedby", "otp-hint");
    expect(input).toHaveAttribute("aria-errormessage", "otp-error");
    expect(input).toHaveAttribute("aria-invalid", "true");

    root.removeAttribute("aria-describedby");
    root.setAttribute("aria-invalid", "false");
    await waitForMacrotask();

    expect(input).not.toHaveAttribute("aria-describedby");
    expect(input).toHaveAttribute("aria-errormessage", "otp-error");
    expect(input).toHaveAttribute("aria-invalid", "false");

    instance.destroy();
  });

  it("restores authored hidden-input ARIA when forwarded root metadata is removed", async () => {
    const root = renderInputOtp({ maxLength: 4 });
    const input = getInput();
    input.setAttribute("aria-label", "Direct code input");
    root.setAttribute("aria-label", "Verification code");
    const instance = createInputOtp(root);

    expect(input).toHaveAttribute("aria-label", "Verification code");

    root.removeAttribute("aria-label");
    await waitForMacrotask();

    expect(input).toHaveAttribute("aria-label", "Direct code input");

    instance.destroy();
  });

  it("filters keyboard input, updates value state, and notifies listeners", () => {
    const root = renderInputOtp({ maxLength: 4 });
    const onValueChange = vi.fn();
    const genericListener = vi.fn();
    const legacyListener = vi.fn();
    const instance = createInputOtp(root, { onValueChange });
    root.addEventListener("starwind:value-change", genericListener);
    root.addEventListener("starwind-input-otp:change", legacyListener);

    pressKey(root, "1");
    pressKey(root, "a");
    pressKey(root, "2");

    expect(instance.getValue()).toBe("12");
    expect(getInput().value).toBe("12");
    expect(getSlotText()).toEqual(["1", "2", "", ""]);
    expect(onValueChange).toHaveBeenCalledTimes(2);
    expect(genericListener).toHaveBeenCalledTimes(2);
    expect(genericListener.mock.calls[1][0].detail).toMatchObject({
      previousValue: "1",
      reason: "keyboard",
      value: "12",
    });
    expect(legacyListener.mock.calls[1][0].detail).toMatchObject({
      inputOtpId: root.id,
      value: "12",
    });
  });

  it("lets value-change cancellation prevent keyboard commits", () => {
    const root = renderInputOtp({ maxLength: 4 });
    const onValueChange = vi.fn((_value, details) => details.cancel());
    const instance = createInputOtp(root, { onValueChange });

    pressKey(root, "1");

    expect(onValueChange).toHaveBeenCalledWith(
      "1",
      expect.objectContaining({
        isCanceled: true,
        previousValue: "",
        reason: "keyboard",
        value: "1",
      }),
    );
    expect(instance.getValue()).toBe("");
    expect(root.getAttribute("data-value")).toBe("");
    expect(getInput().value).toBe("");
    expect(getSlotText()).toEqual(["", "", "", ""]);
  });

  it("lets value-change cancellation prevent paste commits", () => {
    const root = renderInputOtp({ defaultValue: "1", maxLength: 4 });
    const onValueChange = vi.fn((_value, details) => details.cancel());
    const legacyListener = vi.fn();
    const instance = createInputOtp(root, { onValueChange });
    root.addEventListener("starwind-input-otp:change", legacyListener);

    root.click();
    dispatchPaste(root, "234");

    expect(onValueChange).toHaveBeenCalledWith(
      "1234",
      expect.objectContaining({
        isCanceled: true,
        previousValue: "1",
        reason: "paste",
        value: "1234",
      }),
    );
    expect(legacyListener).not.toHaveBeenCalled();
    expect(instance.getValue()).toBe("1");
    expect(root.getAttribute("data-value")).toBe("1");
    expect(getInput().value).toBe("1");
    expect(getSlotText()).toEqual(["1", "", "", ""]);
  });

  it("lets generic value-change listener cancellation prevent completion paste commits", () => {
    const root = renderInputOtp({ defaultValue: "1", maxLength: 4 });
    const onValueChange = vi.fn();
    const legacyListener = vi.fn();
    const instance = createInputOtp(root, { onValueChange });
    root.addEventListener("starwind:value-change", (event) => {
      (event as CustomEvent<{ cancel(): void }>).detail.cancel();
    });
    root.addEventListener("starwind-input-otp:change", legacyListener);

    root.click();
    dispatchPaste(root, "234");

    expect(onValueChange).toHaveBeenCalledWith(
      "1234",
      expect.objectContaining({
        isCanceled: true,
        previousValue: "1",
        reason: "paste",
        value: "1234",
      }),
    );
    expect(legacyListener).not.toHaveBeenCalled();
    expect(instance.getValue()).toBe("1");
    expect(root.getAttribute("data-value")).toBe("1");
    expect(getInput().value).toBe("1");
    expect(getSlotText()).toEqual(["1", "", "", ""]);
  });

  it("lets generic value-change preventDefault prevent completion paste commits", () => {
    const root = renderInputOtp({ defaultValue: "1", maxLength: 4 });
    const onValueChange = vi.fn();
    const legacyListener = vi.fn();
    let genericEvent: CustomEvent<InputOtpValueChangeDetails> | undefined;
    const instance = createInputOtp(root, { onValueChange });
    root.addEventListener("starwind:value-change", (event) => {
      genericEvent = event as CustomEvent<InputOtpValueChangeDetails>;
      event.preventDefault();
    });
    root.addEventListener("starwind-input-otp:change", legacyListener);

    root.click();
    dispatchPaste(root, "234");

    expect(genericEvent?.cancelable).toBe(true);
    expect(genericEvent?.defaultPrevented).toBe(true);
    expect(genericEvent?.detail).toMatchObject({
      isCanceled: true,
      previousValue: "1",
      reason: "paste",
      value: "1234",
    });
    expect(onValueChange).toHaveBeenCalledWith(
      "1234",
      expect.objectContaining({
        isCanceled: true,
        previousValue: "1",
        reason: "paste",
        value: "1234",
      }),
    );
    expect(legacyListener).not.toHaveBeenCalled();
    expect(instance.getValue()).toBe("1");
    expect(root.getAttribute("data-value")).toBe("1");
    expect(getInput().value).toBe("1");
    expect(getSlotText()).toEqual(["1", "", "", ""]);
  });

  it("lets subscriber cancellation prevent completion paste before onValueChange observes details", () => {
    const root = renderInputOtp({ defaultValue: "1", maxLength: 4 });
    const onValueChangeCanceledSnapshots: boolean[] = [];
    const onValueChange = vi.fn((_value, details) => {
      onValueChangeCanceledSnapshots.push(details.isCanceled);
    });
    const legacyListener = vi.fn();
    const instance = createInputOtp(root, { onValueChange });
    instance.subscribe("valueChange", (details) => details.cancel());
    root.addEventListener("starwind-input-otp:change", legacyListener);

    root.click();
    dispatchPaste(root, "234");

    expect(onValueChange).toHaveBeenCalledWith(
      "1234",
      expect.objectContaining({
        isCanceled: true,
        previousValue: "1",
        reason: "paste",
        value: "1234",
      }),
    );
    expect(onValueChangeCanceledSnapshots).toEqual([true]);
    expect(legacyListener).not.toHaveBeenCalled();
    expect(instance.getValue()).toBe("1");
    expect(root.getAttribute("data-value")).toBe("1");
    expect(getInput().value).toBe("1");
    expect(getSlotText()).toEqual(["1", "", "", ""]);
  });

  it("lets value-change cancellation prevent deletion commits", () => {
    const root = renderInputOtp({ defaultValue: "1234", maxLength: 4 });
    const onValueChange = vi.fn((_value, details) => details.cancel());
    const instance = createInputOtp(root, { onValueChange });

    root.click();
    pressKey(root, "Backspace");
    pressKey(root, "Delete");

    expect(onValueChange).toHaveBeenCalledTimes(2);
    expect(onValueChange.mock.calls[0]?.[1]).toMatchObject({
      isCanceled: true,
      previousValue: "1234",
      reason: "delete",
      value: "123",
    });
    expect(onValueChange.mock.calls[1]?.[1]).toMatchObject({
      isCanceled: true,
      previousValue: "1234",
      reason: "delete",
      value: "123",
    });
    expect(instance.getValue()).toBe("1234");
    expect(root.getAttribute("data-value")).toBe("1234");
    expect(getInput().value).toBe("1234");
    expect(getSlotText()).toEqual(["1", "2", "3", "4"]);
  });

  it("lets value-change cancellation prevent direct hidden-input commits", () => {
    const root = renderInputOtp({ maxLength: 4 });
    const onValueChange = vi.fn((_value, details) => details.cancel());
    const instance = createInputOtp(root, { onValueChange });
    const input = getInput();

    input.value = "1234";
    input.dispatchEvent(new InputEvent("input", { bubbles: true }));

    expect(onValueChange).toHaveBeenCalledWith(
      "1234",
      expect.objectContaining({
        isCanceled: true,
        previousValue: "",
        reason: "input-change",
        value: "1234",
      }),
    );
    expect(instance.getValue()).toBe("");
    expect(root.getAttribute("data-value")).toBe("");
    expect(input.value).toBe("");
    expect(getSlotText()).toEqual(["", "", "", ""]);
  });

  it("supports deletion and arrow navigation from the active slot", () => {
    const root = renderInputOtp({ defaultValue: "1234", maxLength: 4 });
    const instance = createInputOtp(root);

    root.click();
    pressKey(root, "ArrowLeft");
    pressKey(root, "Backspace");

    expect(instance.getValue()).toBe("124");
    expect(getSlotText()).toEqual(["1", "2", "", "4"]);
    expect(getSlots()[2]!.getAttribute("data-active")).toBe("true");
  });

  it("pastes filtered characters from the current slot", () => {
    const root = renderInputOtp({ defaultValue: "1", maxLength: 4 });
    const instance = createInputOtp(root);

    root.click();
    dispatchPaste(root, "a23b");

    expect(instance.getValue()).toBe("123");
    expect(getSlotText()).toEqual(["1", "2", "3", ""]);
  });

  it("syncs direct hidden-input changes through the configured pattern", () => {
    const root = renderInputOtp({
      maxLength: 4,
      pattern: "[A-Za-z0-9]",
    });
    const instance = createInputOtp(root);
    const input = getInput();

    input.value = "a!2";
    input.dispatchEvent(new InputEvent("input", { bubbles: true }));

    expect(instance.getValue()).toBe("a2");
    expect(getSlotText()).toEqual(["a", "2", "", ""]);
    expect(input.inputMode).toBe("text");
  });

  it("ignores editing while disabled and cleans up listeners on destroy", () => {
    const root = renderInputOtp({ disabled: true, maxLength: 4 });
    const instance = createInputOtp(root);

    pressKey(root, "1");
    expect(instance.getValue()).toBe("");
    expect(root.tabIndex).toBe(-1);

    instance.setDisabled(false);
    pressKey(root, "1");
    expect(instance.getValue()).toBe("1");

    instance.destroy();
    pressKey(root, "2");
    expect(instance.getValue()).toBe("1");
  });

  it("stops native reset handling on destroy", async () => {
    document.body.innerHTML = `
      <form>
        ${createInputOtpMarkup({ defaultValue: "12", maxLength: 4, name: "code" })}
      </form>
    `;
    const form = document.querySelector<HTMLFormElement>("form")!;
    const root = document.querySelector<HTMLElement>("[data-sw-input-otp]")!;
    const instance = createInputOtp(root);

    instance.setValue("34");
    instance.destroy();

    form.reset();
    await waitForMacrotask();

    expect(instance.getValue()).toBe("34");
    expect(getSlotText()).toEqual(["3", "4", "", ""]);
  });

  it("syncs after native form reset", async () => {
    document.body.innerHTML = `
      <form>
        ${createInputOtpMarkup({ defaultValue: "12", maxLength: 4, name: "code" })}
      </form>
    `;
    const form = document.querySelector<HTMLFormElement>("form")!;
    const root = document.querySelector<HTMLElement>("[data-sw-input-otp]")!;
    const instance = createInputOtp(root);

    instance.setValue("34");
    expect(new FormData(form).get("code")).toBe("34");

    form.reset();
    await waitForMacrotask();

    expect(instance.getValue()).toBe("12");
    expect(new FormData(form).get("code")).toBe("12");
  });

  it("rebinds native reset handling when form ownership changes", async () => {
    document.body.innerHTML = `
      <form id="original-form"></form>
      <form id="verification-form"></form>
      ${createInputOtpMarkup({ defaultValue: "12", maxLength: 4 })}
    `;
    const originalForm = document.querySelector<HTMLFormElement>("#original-form")!;
    const verificationForm = document.querySelector<HTMLFormElement>("#verification-form")!;
    const root = document.querySelector<HTMLElement>("[data-sw-input-otp]")!;
    const instance = createInputOtp(root, { form: "original-form", name: "code" });

    instance.setValue("34");
    expect(new FormData(originalForm).get("code")).toBe("34");

    instance.setFormOptions({ form: "verification-form" });
    instance.setValue("56");

    originalForm.reset();
    await waitForMacrotask();

    expect(instance.getValue()).toBe("56");
    expect(new FormData(originalForm).get("code")).toBeNull();
    expect(new FormData(verificationForm).get("code")).toBe("56");

    verificationForm.reset();
    await waitForMacrotask();

    expect(instance.getValue()).toBe("12");
    expect(new FormData(verificationForm).get("code")).toBe("12");
  });

  it("projects and clears form options on the hidden native input", () => {
    document.body.innerHTML = `
      <form id="verification-form"></form>
      ${createInputOtpMarkup({ defaultValue: "12", maxLength: 4 })}
    `;
    const form = document.querySelector<HTMLFormElement>("#verification-form")!;
    const root = document.querySelector<HTMLElement>("[data-sw-input-otp]")!;
    const instance = createInputOtp(root);
    const input = getInput();

    instance.setFormOptions({
      form: "verification-form",
      id: "verification-code",
      name: "code",
      required: true,
    });

    expect(input).toHaveAttribute("form", "verification-form");
    expect(input.id).toBe("verification-code");
    expect(input.name).toBe("code");
    expect(input.required).toBe(true);
    expect(new FormData(form).get("code")).toBe("12");

    instance.setFormOptions({
      form: undefined,
      id: undefined,
      name: undefined,
      required: false,
    });

    expect(input).not.toHaveAttribute("form");
    expect(input).not.toHaveAttribute("id");
    expect(input).not.toHaveAttribute("name");
    expect(input.required).toBe(false);
    expect(new FormData(form).get("code")).toBeNull();
  });
});

function renderInputOtp(options: RenderInputOtpOptions = {}): HTMLElement {
  document.body.innerHTML = createInputOtpMarkup(options);
  return document.querySelector<HTMLElement>("[data-sw-input-otp]")!;
}

type RenderInputOtpOptions = {
  defaultValue?: string;
  disabled?: boolean;
  maxLength?: number;
  name?: string;
  pattern?: string;
};

function createInputOtpMarkup({
  defaultValue = "",
  disabled = false,
  maxLength = 6,
  name,
  pattern = "\\d",
}: RenderInputOtpOptions = {}): string {
  const slots = Array.from(
    { length: maxLength },
    (_, index) => `
      <div data-sw-input-otp-slot data-index="${index}">
        <span data-sw-input-otp-char></span>
        <div data-sw-input-otp-caret hidden></div>
      </div>
    `,
  ).join("");

  return `
    <div
      data-sw-input-otp
      data-default-value="${defaultValue}"
      data-disabled="${String(disabled)}"
      data-max-length="${maxLength}"
      data-pattern="${pattern}"
    >
      <input data-sw-input-otp-input name="${name ?? ""}" value="${defaultValue}" />
      <div data-sw-input-otp-group>${slots}</div>
    </div>
  `;
}

function getInput(): HTMLInputElement {
  return document.querySelector<HTMLInputElement>("[data-sw-input-otp-input]")!;
}

function getSlots(): HTMLElement[] {
  return Array.from(document.querySelectorAll<HTMLElement>("[data-sw-input-otp-slot]"));
}

function getSlotText(): string[] {
  return getSlots().map(
    (slot) => slot.querySelector("[data-sw-input-otp-char]")?.textContent ?? "",
  );
}

function getCaret(index: number): HTMLElement {
  return getSlots()[index]!.querySelector<HTMLElement>("[data-sw-input-otp-caret]")!;
}

function pressKey(target: HTMLElement, key: string): void {
  target.dispatchEvent(
    new KeyboardEvent("keydown", {
      bubbles: true,
      cancelable: true,
      key,
    }),
  );
}

function dispatchPaste(target: HTMLElement, value: string): void {
  const event = new Event("paste", { bubbles: true, cancelable: true }) as ClipboardEvent;
  Object.defineProperty(event, "clipboardData", {
    value: {
      getData: () => value,
    },
  });
  target.dispatchEvent(event);
}

async function waitForMacrotask(): Promise<void> {
  await new Promise((resolve) => setTimeout(resolve, 0));
}
