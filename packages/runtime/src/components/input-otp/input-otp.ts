import {
  assertHTMLElement,
  ensureId,
  readBooleanAttribute,
  setBooleanAttribute,
} from "../../internal/dom";
import { dispatchCustomEvent } from "../../internal/events";
import { attachFormValueRevision } from "../../internal/form-value-revision";
import { registerFieldControlBridge } from "../field/field-control-bridge";

export type InputOtpValueChangeReason =
  | "none"
  | "input-change"
  | "keyboard"
  | "paste"
  | "delete"
  | "imperative-action";

export type InputOtpValueChangeDetails = {
  readonly event?: Event;
  readonly inputOtpId: string;
  readonly isCanceled: boolean;
  readonly isPropagationAllowed: boolean;
  readonly previousValue: string;
  readonly reason: InputOtpValueChangeReason;
  readonly trigger?: Element;
  readonly value: string;
  allowPropagation(): void;
  cancel(): void;
};

export type InputOtpOptions = {
  defaultValue?: string;
  disabled?: boolean;
  form?: string;
  id?: string;
  maxLength?: number;
  name?: string;
  onValueChange?: (value: string, details: InputOtpValueChangeDetails) => void;
  pattern?: RegExp | string;
  readOnly?: boolean;
  required?: boolean;
  value?: string;
};

export type InputOtpSetValueOptions = {
  emit?: boolean;
  event?: Event;
  reason?: InputOtpValueChangeReason;
  trigger?: Element;
};

export type InputOtpInstance = {
  readonly root: HTMLElement;
  destroy(): void;
  getValue(): string;
  refresh(): void;
  setDisabled(disabled: boolean): void;
  setFormOptions(options: Pick<InputOtpOptions, "form" | "id" | "name" | "required">): void;
  setValue(value: string, options?: InputOtpSetValueOptions): void;
  subscribe(
    event: "valueChange",
    callback: (details: InputOtpValueChangeDetails) => void,
  ): () => void;
};

type InputOtpElements = {
  input: HTMLInputElement;
  slots: HTMLElement[];
};

const INPUT_OTP_ROOT_ATTRIBUTE = "data-sw-input-otp";
const INPUT_OTP_ROOT_SELECTOR = `[${INPUT_OTP_ROOT_ATTRIBUTE}]`;
const INPUT_OTP_DEFAULT_VALUE_ATTRIBUTE = "data-default-value";
const INPUT_OTP_DISABLED_ATTRIBUTE = "data-disabled";
const INPUT_OTP_FORM_ATTRIBUTE = "data-form";
const INPUT_OTP_ID_ATTRIBUTE = "data-id";
const INPUT_OTP_INPUT_ATTRIBUTE = "data-sw-input-otp-input";
const INPUT_OTP_INPUT_SELECTOR = `[${INPUT_OTP_INPUT_ATTRIBUTE}]`;
const INPUT_OTP_MAX_LENGTH_ATTRIBUTE = "data-max-length";
const INPUT_OTP_NAME_ATTRIBUTE = "data-name";
const INPUT_OTP_PATTERN_ATTRIBUTE = "data-pattern";
const INPUT_OTP_READONLY_ATTRIBUTE = "data-readonly";
const INPUT_OTP_REQUIRED_ATTRIBUTE = "data-required";
const INPUT_OTP_SLOT_ATTRIBUTE = "data-sw-input-otp-slot";
const INPUT_OTP_SLOT_SELECTOR = `[${INPUT_OTP_SLOT_ATTRIBUTE}]`;
const INPUT_OTP_CHAR_SELECTOR = "[data-sw-input-otp-char]";
const INPUT_OTP_CARET_SELECTOR = "[data-sw-input-otp-caret]";
const INPUT_OTP_VALUE_ATTRIBUTE = "data-value";
const INPUT_OTP_FORWARDED_INPUT_ARIA_ATTRIBUTES = [
  "aria-describedby",
  "aria-errormessage",
  "aria-invalid",
  "aria-label",
  "aria-labelledby",
] as const;
const INPUT_OTP_OBSERVED_ROOT_ATTRIBUTES = [
  INPUT_OTP_VALUE_ATTRIBUTE,
  ...INPUT_OTP_FORWARDED_INPUT_ARIA_ATTRIBUTES,
];

const DEFAULT_PATTERN = "\\d";
const NUMERIC_PATTERNS = new Set(["\\d", "[0-9]", "\\d+", "[0-9]+"]);

const instances = new WeakMap<HTMLElement, InputOtpController>();

registerFieldControlBridge({
  kind: "input-otp",
  connect(control, { disabled, name, shouldSyncName }) {
    const inputOtp = createInputOtp(control, { disabled, name });
    inputOtp.setDisabled(disabled);
    if (shouldSyncName) {
      inputOtp.setFormOptions({ name });
    }
  },
});

export function createInputOtp(root: HTMLElement, options: InputOtpOptions = {}): InputOtpInstance {
  assertHTMLElement(root, "createInputOtp root");

  const existing = instances.get(root);
  if (existing) return existing;

  const instance = new InputOtpController(root, options);
  instances.set(root, instance);
  return instance;
}

class InputOtpController implements InputOtpInstance {
  readonly root: HTMLElement;

  private readonly abortController = new AbortController();
  private form?: string;
  private id?: string;
  private readonly managesTabIndex: boolean;
  private name?: string;
  private readonly onValueChange?: (value: string, details: InputOtpValueChangeDetails) => void;
  private readonly patternText: string;
  private readonly readOnly: boolean;
  private required: boolean;
  private readonly subscribers = new Set<(details: InputOtpValueChangeDetails) => void>();
  private currentIndex = 0;
  private destroyed = false;
  private disabled: boolean;
  private elements: InputOtpElements;
  private readonly forwardedInputAriaAttributes = new Map<string, string | null>();
  private maxLength: number;
  private observer: MutationObserver | undefined;
  private pattern: RegExp;
  private resetForm: HTMLFormElement | null = null;
  private resetTimer: number | undefined;
  private values: string[];

  constructor(root: HTMLElement, options: InputOtpOptions) {
    this.root = root;
    this.elements = getInputOtpElements(root);
    this.disabled = options.disabled ?? readBooleanAttribute(root, INPUT_OTP_DISABLED_ATTRIBUTE);
    this.form =
      options.form ??
      readOptionalAttribute(root, INPUT_OTP_FORM_ATTRIBUTE) ??
      readOptionalAttribute(this.elements.input, "form");
    this.id =
      options.id ?? readOptionalAttribute(root, INPUT_OTP_ID_ATTRIBUTE) ?? this.elements.input.id;
    this.managesTabIndex = !root.hasAttribute("tabindex");
    this.name =
      options.name ??
      readOptionalAttribute(root, INPUT_OTP_NAME_ATTRIBUTE) ??
      this.elements.input.name;
    this.onValueChange = options.onValueChange;
    this.patternText = normalizePattern(
      options.pattern ?? readOptionalAttribute(root, INPUT_OTP_PATTERN_ATTRIBUTE),
    );
    this.pattern = createCharacterPattern(this.patternText);
    this.readOnly = options.readOnly ?? readBooleanAttribute(root, INPUT_OTP_READONLY_ATTRIBUTE);
    this.required = options.required ?? readBooleanAttribute(root, INPUT_OTP_REQUIRED_ATTRIBUTE);
    this.maxLength = readMaxLength(options.maxLength, root, this.elements.slots.length);
    this.values = this.normalizeValueToChars(readInitialValue(root, this.elements.input, options));

    ensureId(this.root, "starwind-input-otp");
    this.currentIndex = this.getNextEditableIndex(this.getValue().length);

    this.setupInput();
    this.bindEvents();
    this.observeValueAttribute();
    this.render();
  }

  destroy(): void {
    if (this.destroyed) return;

    this.abortController.abort();
    this.resetForm?.removeEventListener("reset", this.handleFormReset);
    this.resetForm = null;
    this.observer?.disconnect();
    this.clearResetTimer();
    this.subscribers.clear();
    instances.delete(this.root);
    this.destroyed = true;
  }

  getValue(): string {
    return this.values.join("");
  }

  refresh(): void {
    this.elements = getInputOtpElements(this.root);
    this.maxLength = readMaxLength(undefined, this.root, this.elements.slots.length);
    this.values = this.normalizeValueToChars(this.getValue());
    this.currentIndex = this.getNextEditableIndex(this.currentIndex);
    this.setupInput();
    this.render();
  }

  setDisabled(disabled: boolean): void {
    if (this.disabled === disabled) return;

    this.disabled = disabled;
    this.render();
  }

  setFormOptions(options: Pick<InputOtpOptions, "form" | "id" | "name" | "required">): void {
    if (Object.hasOwn(options, "form")) {
      this.form = options.form;
    }

    if (Object.hasOwn(options, "id")) {
      this.id = options.id;
    }

    if (Object.hasOwn(options, "name")) {
      this.name = options.name;
    }

    if (Object.hasOwn(options, "required") && options.required !== undefined) {
      this.required = options.required;
    }

    this.render();
  }

  setValue(value: string, options: InputOtpSetValueOptions = {}): void {
    const nextValues = this.normalizeValueToChars(value);
    const nextValue = this.charsToValue(nextValues);
    const previousValue = this.getValue();
    if (nextValue === previousValue) {
      this.render();
      return;
    }

    if (
      options.emit !== false &&
      !this.requestValueChange({
        event: options.event,
        previousValue,
        reason: options.reason ?? "imperative-action",
        trigger: options.trigger,
        value: nextValue,
      })
    ) {
      this.render();
      return;
    }

    this.values = nextValues;
    this.currentIndex = this.getNextEditableIndex(nextValue.length);
    this.render();
  }

  subscribe(
    event: "valueChange",
    callback: (details: InputOtpValueChangeDetails) => void,
  ): () => void {
    if (event !== "valueChange") {
      throw new Error(`Unsupported InputOtp event: ${event}`);
    }

    this.subscribers.add(callback);
    return () => {
      this.subscribers.delete(callback);
    };
  }

  private bindEvents(): void {
    const { signal } = this.abortController;

    this.root.addEventListener("click", this.handleRootClick, { signal });
    this.root.addEventListener("focus", this.handleRootFocus, { signal });
    this.root.addEventListener("blur", this.handleBlur, { signal });
    this.root.addEventListener("keydown", this.handleKeyDown, { signal });
    this.root.addEventListener("paste", this.handlePaste, { signal });
    this.elements.input.addEventListener("blur", this.handleBlur, { signal });
    this.elements.input.addEventListener("focus", this.handleInputFocus, { signal });
    this.elements.input.addEventListener("input", this.handleInput, { signal });
  }

  private observeValueAttribute(): void {
    this.observer = new MutationObserver((records) => {
      let syncInputAria = false;

      records.forEach((record) => {
        if (record.attributeName === INPUT_OTP_VALUE_ATTRIBUTE) {
          const nextValue = this.root.getAttribute(INPUT_OTP_VALUE_ATTRIBUTE) ?? "";
          if (nextValue !== this.getValue()) {
            this.setValue(nextValue, { emit: false });
          }
          return;
        }

        if (
          INPUT_OTP_FORWARDED_INPUT_ARIA_ATTRIBUTES.includes(
            record.attributeName as (typeof INPUT_OTP_FORWARDED_INPUT_ARIA_ATTRIBUTES)[number],
          )
        ) {
          syncInputAria = true;
        }
      });

      if (syncInputAria) {
        this.syncInputAriaAttributes();
      }
    });

    this.observer.observe(this.root, {
      attributeFilter: INPUT_OTP_OBSERVED_ROOT_ATTRIBUTES,
      attributes: true,
    });
  }

  private readonly handleRootClick = (): void => {
    if (this.disabled) return;

    this.currentIndex = this.getNextEmptyIndex();
    this.focusInput();
    this.render();
  };

  private readonly handleRootFocus = (): void => {
    if (this.disabled) return;

    this.currentIndex = this.getNextEmptyIndex();
    this.focusInput();
    this.render();
  };

  private readonly handleInputFocus = (): void => {
    this.currentIndex = this.getNextEmptyIndex();
    this.render();
  };

  private readonly handleBlur = (): void => {
    this.render();
  };

  private readonly handleKeyDown = (event: KeyboardEvent): void => {
    if (this.disabled) return;

    if (event.key === "ArrowLeft") {
      event.preventDefault();
      this.currentIndex = Math.max(0, this.currentIndex - 1);
      this.render();
      return;
    }

    if (event.key === "ArrowRight") {
      event.preventDefault();
      this.currentIndex = Math.min(this.getSlotLimit() - 1, this.currentIndex + 1);
      this.render();
      return;
    }

    if (event.key === "Home") {
      event.preventDefault();
      this.currentIndex = 0;
      this.render();
      return;
    }

    if (event.key === "End") {
      event.preventDefault();
      this.currentIndex = this.getSlotLimit() - 1;
      this.render();
      return;
    }

    if (this.readOnly) return;

    if (event.key === "Backspace") {
      event.preventDefault();
      this.deleteFromCurrentIndex(event);
      return;
    }

    if (event.key === "Delete") {
      event.preventDefault();
      this.replaceAtCurrentIndex("", {
        event,
        reason: "delete",
        trigger: event.target instanceof Element ? event.target : this.root,
      });
      return;
    }

    if (event.key.length !== 1 || event.ctrlKey || event.metaKey || event.altKey) return;

    event.preventDefault();
    if (!this.pattern.test(event.key)) return;

    if (
      this.replaceAtCurrentIndex(event.key, {
        event,
        reason: "keyboard",
        trigger: event.target instanceof Element ? event.target : this.root,
      })
    ) {
      this.currentIndex = Math.min(this.getSlotLimit() - 1, this.currentIndex + 1);
      this.render();
    }
  };

  private readonly handlePaste = (event: ClipboardEvent): void => {
    if (this.disabled || this.readOnly) return;

    const pastedValue = event.clipboardData?.getData("text") ?? "";
    const filteredValue = this.normalizeValue(pastedValue);
    if (!filteredValue) return;

    event.preventDefault();

    const previousValue = this.getValue();
    const chars = this.values.slice();
    const limit = this.getSlotLimit();

    for (
      let index = 0;
      index + this.currentIndex < limit && index < filteredValue.length;
      index += 1
    ) {
      chars[this.currentIndex + index] = filteredValue[index] ?? "";
    }

    const nextValue = this.charsToValue(chars);
    if (nextValue === previousValue) return;

    if (
      !this.requestValueChange({
        event,
        previousValue,
        reason: "paste",
        trigger: event.target instanceof Element ? event.target : this.root,
        value: nextValue,
      })
    ) {
      this.render();
      return;
    }

    this.values = chars;
    this.currentIndex = this.getNextEditableIndex(this.currentIndex + filteredValue.length);
    this.render();
  };

  private readonly handleInput = (event: Event): void => {
    if (this.disabled || this.readOnly) return;

    const nextValues = this.normalizeValueToChars(this.elements.input.value);
    const nextValue = this.charsToValue(nextValues);
    const previousValue = this.getValue();

    if (nextValue === previousValue) {
      this.render();
      return;
    }

    if (
      !this.requestValueChange({
        event,
        previousValue,
        reason: "input-change",
        trigger: event.target instanceof Element ? event.target : this.elements.input,
        value: nextValue,
      })
    ) {
      this.render();
      return;
    }

    this.values = nextValues;
    this.currentIndex = this.getNextEditableIndex(nextValue.length);
    this.render();
  };

  private readonly handleFormReset = (): void => {
    this.clearResetTimer();
    this.resetTimer = window.setTimeout(() => {
      this.resetTimer = undefined;
      this.values = this.normalizeValueToChars(this.elements.input.value);
      this.currentIndex = this.getNextEditableIndex(this.getValue().length);
      this.render();
    }, 0);
  };

  private deleteFromCurrentIndex(event: KeyboardEvent): void {
    const previousIndex = this.currentIndex;
    const hasCurrentValue =
      this.values[this.currentIndex] !== undefined && this.values[this.currentIndex] !== "";

    if (!hasCurrentValue && this.currentIndex > 0) {
      this.currentIndex -= 1;
    }

    if (
      !this.replaceAtCurrentIndex("", {
        event,
        reason: "delete",
        trigger: event.target instanceof Element ? event.target : this.root,
      })
    ) {
      this.currentIndex = previousIndex;
      this.render();
    }
  }

  private replaceAtCurrentIndex(
    nextChar: string,
    request: {
      event?: Event;
      reason: InputOtpValueChangeReason;
      trigger?: Element;
    },
  ): boolean {
    const previousValue = this.getValue();
    const chars = this.values.slice();
    chars[this.currentIndex] = nextChar;

    const nextValue = this.charsToValue(chars);
    if (nextValue === previousValue) {
      this.render();
      return true;
    }

    if (
      !this.requestValueChange({
        ...request,
        previousValue,
        value: nextValue,
      })
    ) {
      this.render();
      return false;
    }

    this.values = chars;
    this.render();
    return true;
  }

  private render(): void {
    const value = this.getValue();
    const isFocused =
      document.activeElement === this.root || document.activeElement === this.elements.input;

    this.root.setAttribute(INPUT_OTP_ROOT_ATTRIBUTE, "");
    this.root.setAttribute(INPUT_OTP_MAX_LENGTH_ATTRIBUTE, String(this.maxLength));
    this.root.setAttribute(INPUT_OTP_PATTERN_ATTRIBUTE, this.patternText);
    this.root.setAttribute(INPUT_OTP_VALUE_ATTRIBUTE, value);
    this.root.setAttribute("aria-disabled", String(this.disabled));
    setBooleanAttribute(this.root, INPUT_OTP_DISABLED_ATTRIBUTE, this.disabled);
    setBooleanAttribute(this.root, INPUT_OTP_READONLY_ATTRIBUTE, this.readOnly);
    setBooleanAttribute(this.root, INPUT_OTP_REQUIRED_ATTRIBUTE, this.required);

    if (this.managesTabIndex) {
      this.root.tabIndex = this.disabled ? -1 : 0;
    }

    this.setupInput();

    this.elements.slots.forEach((slot, index) => {
      const char = this.values[index] ?? "";
      const charElement = slot.querySelector<HTMLElement>(INPUT_OTP_CHAR_SELECTOR);
      const caretElement = slot.querySelector<HTMLElement>(INPUT_OTP_CARET_SELECTOR);
      const active = isFocused && index === this.currentIndex && !this.disabled;

      slot.setAttribute(INPUT_OTP_SLOT_ATTRIBUTE, "");
      slot.setAttribute("data-active", active ? "true" : "false");

      if (charElement) {
        charElement.textContent = char;
      }

      if (caretElement) {
        caretElement.hidden = !(active && !char);
        caretElement.classList.toggle("hidden", caretElement.hidden);
        caretElement.classList.toggle("flex", !caretElement.hidden);
      }
    });
  }

  private setupInput(): void {
    const input = this.elements.input;

    input.setAttribute(INPUT_OTP_INPUT_ATTRIBUTE, "");
    input.autocomplete = "one-time-code";
    input.disabled = this.disabled;
    input.inputMode = NUMERIC_PATTERNS.has(this.patternText) ? "numeric" : "text";
    input.maxLength = this.maxLength;
    input.readOnly = this.readOnly;
    input.required = this.required;
    input.tabIndex = -1;
    input.value = this.getValue();

    if (this.form) {
      input.setAttribute("form", this.form);
    } else {
      input.removeAttribute("form");
    }

    if (this.id) {
      input.id = this.id;
    } else {
      input.removeAttribute("id");
    }

    if (this.name) {
      input.name = this.name;
    } else {
      input.removeAttribute("name");
    }

    if (!input.classList.contains("sr-only")) {
      input.classList.add("sr-only");
    }

    this.syncInputAriaAttributes(input);
    this.syncFormResetListener();
  }

  private syncInputAriaAttributes(input = this.elements.input): void {
    INPUT_OTP_FORWARDED_INPUT_ARIA_ATTRIBUTES.forEach((attribute) => {
      const rootValue = this.root.getAttribute(attribute);
      if (rootValue !== null) {
        if (!this.forwardedInputAriaAttributes.has(attribute)) {
          this.forwardedInputAriaAttributes.set(attribute, input.getAttribute(attribute));
        }
        input.setAttribute(attribute, rootValue);
        return;
      }

      if (this.forwardedInputAriaAttributes.has(attribute)) {
        const originalValue = this.forwardedInputAriaAttributes.get(attribute);
        if (originalValue === null || originalValue === undefined) {
          input.removeAttribute(attribute);
        } else {
          input.setAttribute(attribute, originalValue);
        }
        this.forwardedInputAriaAttributes.delete(attribute);
      }
    });
  }

  private syncFormResetListener(): void {
    const nextForm = this.elements.input.form;
    if (this.resetForm === nextForm) return;

    this.resetForm?.removeEventListener("reset", this.handleFormReset);
    this.resetForm = nextForm;
    this.resetForm?.addEventListener("reset", this.handleFormReset, {
      signal: this.abortController.signal,
    });
  }

  private focusInput(): void {
    this.elements.input.focus();
  }

  private normalizeValue(value: string): string {
    return value
      .split("")
      .filter((char) => this.pattern.test(char))
      .slice(0, this.getSlotLimit())
      .join("");
  }

  private normalizeValueToChars(value: string): string[] {
    const normalizedValue = this.normalizeValue(value);
    const chars = new Array<string>(this.getSlotLimit()).fill("");
    for (let index = 0; index < chars.length; index += 1) {
      chars[index] = normalizedValue[index] ?? "";
    }
    return chars;
  }

  private charsToValue(chars: string[]): string {
    return chars.join("").slice(0, this.getSlotLimit());
  }

  private getSlotLimit(): number {
    return Math.max(1, Math.min(this.maxLength, this.elements.slots.length || this.maxLength));
  }

  private getNextEmptyIndex(): number {
    const emptyIndex = this.values.findIndex((char) => !char);
    return emptyIndex === -1 ? this.getSlotLimit() - 1 : emptyIndex;
  }

  private getNextEditableIndex(index: number): number {
    return Math.min(Math.max(index, 0), this.getSlotLimit() - 1);
  }

  private clearResetTimer(): void {
    if (this.resetTimer === undefined) return;

    window.clearTimeout(this.resetTimer);
    this.resetTimer = undefined;
  }

  private requestValueChange({
    event,
    previousValue,
    reason,
    trigger,
    value,
  }: {
    event?: Event;
    previousValue: string;
    reason: InputOtpValueChangeReason;
    trigger?: Element;
    value: string;
  }): boolean {
    const details = new InputOtpValueChangeDetailsImpl({
      event,
      inputOtpId: this.root.id,
      previousValue,
      reason,
      trigger,
      value,
    });

    attachFormValueRevision(details, event);

    const valueChangeEvent = dispatchCustomEvent(this.root, "starwind:value-change", details, {
      cancelable: true,
    });
    if (valueChangeEvent.defaultPrevented) {
      details.cancel();
    }
    this.subscribers.forEach((callback) => callback(details));
    this.onValueChange?.(value, details);

    if (details.isCanceled) return false;

    const legacyDetails = {
      inputOtpId: this.root.id,
      value,
    };
    attachFormValueRevision(legacyDetails, details);
    dispatchCustomEvent(this.root, "starwind-input-otp:change", legacyDetails);

    return true;
  }
}

class InputOtpValueChangeDetailsImpl implements InputOtpValueChangeDetails {
  readonly event?: Event;
  readonly inputOtpId: string;
  readonly previousValue: string;
  readonly reason: InputOtpValueChangeReason;
  readonly trigger?: Element;
  readonly value: string;

  private canceled = false;
  private propagationAllowed = false;

  constructor({
    event,
    inputOtpId,
    previousValue,
    reason,
    trigger,
    value,
  }: {
    event?: Event;
    inputOtpId: string;
    previousValue: string;
    reason: InputOtpValueChangeReason;
    trigger?: Element;
    value: string;
  }) {
    this.event = event;
    this.inputOtpId = inputOtpId;
    this.previousValue = previousValue;
    this.reason = reason;
    this.trigger = trigger;
    this.value = value;
  }

  get isCanceled(): boolean {
    return this.canceled;
  }

  get isPropagationAllowed(): boolean {
    return this.propagationAllowed;
  }

  allowPropagation(): void {
    this.propagationAllowed = true;
  }

  cancel(): void {
    this.canceled = true;
  }
}

function getInputOtpElements(root: HTMLElement): InputOtpElements {
  const input =
    root.querySelector<HTMLInputElement>(INPUT_OTP_INPUT_SELECTOR) ?? createHiddenInput(root);
  const slots = Array.from(root.querySelectorAll<HTMLElement>(INPUT_OTP_SLOT_SELECTOR)).filter(
    (slot) => slot.closest(INPUT_OTP_ROOT_SELECTOR) === root,
  );

  return { input, slots };
}

function createHiddenInput(root: HTMLElement): HTMLInputElement {
  const input = document.createElement("input");
  input.type = "text";
  input.setAttribute(INPUT_OTP_INPUT_ATTRIBUTE, "");
  input.className = "sr-only";
  root.prepend(input);
  return input;
}

function readInitialValue(
  root: HTMLElement,
  input: HTMLInputElement,
  options: InputOtpOptions,
): string {
  return (
    options.value ??
    options.defaultValue ??
    root.getAttribute(INPUT_OTP_VALUE_ATTRIBUTE) ??
    root.getAttribute(INPUT_OTP_DEFAULT_VALUE_ATTRIBUTE) ??
    input.value ??
    input.defaultValue ??
    ""
  );
}

function readMaxLength(option: number | undefined, root: HTMLElement, slotCount: number): number {
  const value =
    option ?? Number.parseInt(root.getAttribute(INPUT_OTP_MAX_LENGTH_ATTRIBUTE) ?? "", 10);
  if (Number.isFinite(value) && value > 0) return value;
  return slotCount || 6;
}

function readOptionalAttribute(element: HTMLElement, name: string): string | undefined {
  const value = element.getAttribute(name);
  return value === null || value === "" ? undefined : value;
}

function normalizePattern(pattern: RegExp | string | undefined): string {
  const source = pattern instanceof RegExp ? pattern.source : pattern;
  return (source ?? DEFAULT_PATTERN).replace(/^\^|\$$/g, "");
}

function createCharacterPattern(pattern: string): RegExp {
  try {
    return new RegExp(`^(?:${pattern})$`);
  } catch {
    return new RegExp(`^(?:${DEFAULT_PATTERN})$`);
  }
}
