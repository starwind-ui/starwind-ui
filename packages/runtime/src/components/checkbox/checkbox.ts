import {
  assertHTMLElement,
  ensureId,
  readBooleanAttribute,
  setBooleanAttribute,
} from "../../internal/dom";
import { dispatchCustomEvent } from "../../internal/events";
import { attachFormValueRevision } from "../../internal/form-value-revision";
import { hideElementAfterAnimations, showElement } from "../../internal/presence";
import { registerFieldControlBridge } from "../field/field-control-bridge";

export type CheckboxCheckedChangeReason = "root-press" | "input-change" | "imperative-action";

export type CheckboxCheckedChangeDetails = {
  readonly checked: boolean;
  readonly event?: Event;
  readonly isCanceled: boolean;
  readonly previousChecked: boolean;
  readonly reason: CheckboxCheckedChangeReason;
  readonly trigger?: Element;
  cancel(): void;
};

export type CheckboxOptions = {
  checked?: boolean;
  defaultChecked?: boolean;
  disabled?: boolean;
  form?: string;
  id?: string;
  indeterminate?: boolean;
  name?: string;
  onCheckedChange?: (checked: boolean, details: CheckboxCheckedChangeDetails) => void;
  readOnly?: boolean;
  required?: boolean;
  uncheckedValue?: string;
  value?: string;
};

export type CheckboxSetCheckedOptions = {
  emit?: boolean;
};

export type CheckboxInstance = {
  readonly root: HTMLElement;
  destroy(): void;
  getChecked(): boolean;
  setChecked(checked: boolean, options?: CheckboxSetCheckedOptions): void;
  setDisabled(disabled: boolean): void;
  setFormOptions(
    options: Pick<CheckboxOptions, "form" | "name" | "required" | "uncheckedValue" | "value">,
  ): void;
  setIndeterminate(indeterminate: boolean, options?: CheckboxSetCheckedOptions): void;
  subscribe(
    event: "checkedChange",
    callback: (details: CheckboxCheckedChangeDetails) => void,
  ): () => void;
  toggle(): void;
};

type CheckboxElements = {
  indicators: CheckboxIndicator[];
  input: HTMLInputElement;
  uncheckedInput?: HTMLInputElement;
};

type CheckboxIndicator = {
  element: HTMLElement;
  keepMounted: boolean;
};

type CheckboxRequest = {
  event?: Event;
  reason: CheckboxCheckedChangeReason;
  trigger?: Element;
};

const CHECKBOX_ROOT_ATTRIBUTE = "data-sw-checkbox";
const CHECKBOX_DEFAULT_CHECKED_ATTRIBUTE = "data-default-checked";
const CHECKBOX_DISABLED_ATTRIBUTE = "data-disabled";
const CHECKBOX_FORM_ATTRIBUTE = "data-form";
const CHECKBOX_ID_ATTRIBUTE = "data-id";
const CHECKBOX_INDETERMINATE_ATTRIBUTE = "data-indeterminate";
const CHECKBOX_INPUT_ATTRIBUTE = "data-sw-checkbox-input";
const CHECKBOX_INPUT_SELECTOR = `[${CHECKBOX_INPUT_ATTRIBUTE}]`;
const CHECKBOX_INDICATOR_SELECTOR = "[data-sw-checkbox-indicator]";
const CHECKBOX_INDICATOR_KEEP_MOUNTED_ATTRIBUTE = "data-keep-mounted";
const CHECKBOX_NAME_ATTRIBUTE = "data-name";
const CHECKBOX_READONLY_ATTRIBUTE = "data-readonly";
const CHECKBOX_REQUIRED_ATTRIBUTE = "data-required";
const CHECKBOX_UNCHECKED_INPUT_ATTRIBUTE = "data-sw-checkbox-unchecked-input";
const CHECKBOX_UNCHECKED_VALUE_ATTRIBUTE = "data-unchecked-value";
const CHECKBOX_VALUE_ATTRIBUTE = "data-value";

const instances = new WeakMap<HTMLElement, CheckboxController>();

registerFieldControlBridge({
  kind: "checkbox",
  connect(control, { disabled, name, shouldSyncName }) {
    const checkbox = createCheckbox(control, { disabled, name });
    checkbox.setDisabled(disabled);
    if (shouldSyncName) {
      checkbox.setFormOptions({ name });
    }
  },
});

export function createCheckbox(root: HTMLElement, options: CheckboxOptions = {}): CheckboxInstance {
  assertHTMLElement(root, "createCheckbox root");

  const existing = instances.get(root);
  if (existing) return existing;

  const instance = new CheckboxController(root, options);
  instances.set(root, instance);
  return instance;
}

class CheckboxController implements CheckboxInstance {
  readonly root: HTMLElement;

  private readonly abortController = new AbortController();
  private readonly controlled: boolean;
  private disabled: boolean;
  private readonly elements: CheckboxElements;
  private form?: string;
  private readonly id?: string;
  private readonly initialChecked: boolean;
  private readonly managesTabIndex: boolean;
  private name?: string;
  private readonly onCheckedChange?: (
    checked: boolean,
    details: CheckboxCheckedChangeDetails,
  ) => void;
  private readonly readOnly: boolean;
  private required: boolean;
  private readonly subscribers = new Set<(details: CheckboxCheckedChangeDetails) => void>();
  private uncheckedValue?: string;
  private value?: string;
  private destroyed = false;
  private checkedState: boolean;
  private indicatorRendered = false;
  private indeterminateState: boolean;
  private resetForm: HTMLFormElement | null = null;
  private resetTimer: number | undefined;

  constructor(root: HTMLElement, options: CheckboxOptions) {
    this.root = root;
    this.elements = getCheckboxElements(root);
    this.controlled = Object.hasOwn(options, "checked");
    this.disabled = options.disabled ?? readBooleanAttribute(root, CHECKBOX_DISABLED_ATTRIBUTE);
    this.form = options.form ?? readOptionalAttribute(root, CHECKBOX_FORM_ATTRIBUTE);
    this.id = options.id ?? readOptionalAttribute(root, CHECKBOX_ID_ATTRIBUTE);
    this.indeterminateState =
      options.indeterminate ?? readBooleanAttribute(root, CHECKBOX_INDETERMINATE_ATTRIBUTE);
    this.name = options.name ?? readOptionalAttribute(root, CHECKBOX_NAME_ATTRIBUTE);
    this.managesTabIndex = !root.hasAttribute("tabindex");
    this.onCheckedChange = options.onCheckedChange;
    this.readOnly = options.readOnly ?? readBooleanAttribute(root, CHECKBOX_READONLY_ATTRIBUTE);
    this.required = options.required ?? readBooleanAttribute(root, CHECKBOX_REQUIRED_ATTRIBUTE);
    this.uncheckedValue =
      options.uncheckedValue ?? readOptionalAttribute(root, CHECKBOX_UNCHECKED_VALUE_ATTRIBUTE);
    this.value = options.value ?? readOptionalAttribute(root, CHECKBOX_VALUE_ATTRIBUTE);
    const defaultChecked =
      this.elements.input.defaultChecked ||
      readBooleanAttribute(root, CHECKBOX_DEFAULT_CHECKED_ATTRIBUTE);
    this.initialChecked = options.defaultChecked ?? options.checked ?? defaultChecked;
    this.checkedState =
      options.checked ??
      options.defaultChecked ??
      (this.elements.input.checked || this.initialChecked);

    this.setupFormInput();
    this.bindEvents();
    this.render();
  }

  destroy(): void {
    if (this.destroyed) return;

    this.abortController.abort();
    this.unbindFormReset();
    this.clearResetTimer();
    this.subscribers.clear();
    instances.delete(this.root);
    this.destroyed = true;
  }

  getChecked(): boolean {
    return this.checkedState;
  }

  setChecked(checked: boolean, options: CheckboxSetCheckedOptions = {}): void {
    const previousChecked = this.checkedState;
    this.checkedState = checked;
    this.indeterminateState = false;
    this.render();

    if (options.emit !== false) {
      this.notify(
        new CheckboxCheckedChangeDetailsImpl({
          checked,
          previousChecked,
          reason: "imperative-action",
        }),
      );
    }
  }

  setDisabled(disabled: boolean): void {
    if (this.disabled === disabled) return;

    this.disabled = disabled;
    this.render();
  }

  setFormOptions(
    options: Pick<CheckboxOptions, "form" | "name" | "required" | "uncheckedValue" | "value">,
  ): void {
    if (Object.hasOwn(options, "form")) {
      this.form = options.form;
    }

    if (Object.hasOwn(options, "name")) {
      this.name = options.name;
    }

    if (Object.hasOwn(options, "required") && options.required !== undefined) {
      this.required = options.required;
    }

    if (Object.hasOwn(options, "uncheckedValue")) {
      this.uncheckedValue = options.uncheckedValue;
    }

    if (Object.hasOwn(options, "value")) {
      this.value = options.value;
    }

    this.render();
    this.bindFormReset();
  }

  setIndeterminate(indeterminate: boolean, options: CheckboxSetCheckedOptions = {}): void {
    const previousChecked = this.checkedState;
    this.indeterminateState = indeterminate;
    this.render();

    if (options.emit !== false) {
      this.notify(
        new CheckboxCheckedChangeDetailsImpl({
          checked: this.checkedState,
          previousChecked,
          reason: "imperative-action",
        }),
      );
    }
  }

  subscribe(
    event: "checkedChange",
    callback: (details: CheckboxCheckedChangeDetails) => void,
  ): () => void {
    if (event !== "checkedChange") {
      throw new Error(`Unsupported Checkbox event: ${event}`);
    }

    this.subscribers.add(callback);
    return () => {
      this.subscribers.delete(callback);
    };
  }

  toggle(): void {
    this.requestChecked(!this.checkedState, {
      reason: "imperative-action",
    });
  }

  private setupFormInput(): void {
    const { input } = this.elements;
    const inputId = this.id ?? input.id ?? ensureId(input, "sw-checkbox-input");

    input.type = "checkbox";
    input.id = inputId;
    input.checked = this.checkedState;
    input.defaultChecked = this.initialChecked;
    input.disabled = this.disabled;
    input.required = this.required;
    input.tabIndex = -1;
    input.setAttribute("aria-hidden", "true");
    input.setAttribute(CHECKBOX_INPUT_ATTRIBUTE, "");
    input.style.position = "absolute";
    input.style.width = "1px";
    input.style.height = "1px";
    input.style.margin = "-1px";
    input.style.overflow = "hidden";
    input.style.clip = "rect(0 0 0 0)";
    input.style.whiteSpace = "nowrap";
    input.style.border = "0";

    if (this.name !== undefined) {
      input.name = this.name;
    } else {
      input.removeAttribute("name");
    }

    if (this.value !== undefined) {
      input.value = this.value;
    }

    if (this.form !== undefined) {
      input.setAttribute("form", this.form);
    }
  }

  private bindEvents(): void {
    const { signal } = this.abortController;

    this.root.addEventListener("click", this.handleRootClick, { signal });
    this.root.addEventListener("keydown", this.handleKeyDown, { signal });
    this.root.addEventListener("keyup", this.handleKeyUp, { signal });
    this.root.addEventListener("focus", this.handleFocus, { signal });
    this.root.addEventListener("blur", this.handleBlur, { signal });
    this.elements.input.addEventListener("change", this.handleInputChange, { signal });
    this.bindFormReset();
  }

  private render(): void {
    const checked = this.checkedState;
    const indeterminate = this.indeterminateState;
    const active = checked || indeterminate;

    this.root.setAttribute(CHECKBOX_ROOT_ATTRIBUTE, "");
    this.root.setAttribute("role", "checkbox");
    this.root.setAttribute("aria-checked", indeterminate ? "mixed" : String(checked));
    if (this.disabled) {
      this.root.setAttribute("aria-disabled", "true");
    } else {
      this.root.removeAttribute("aria-disabled");
    }
    this.root.setAttribute("aria-readonly", this.readOnly ? "true" : "false");
    this.root.setAttribute("aria-required", this.required ? "true" : "false");

    if (this.managesTabIndex) {
      this.root.tabIndex = this.disabled ? -1 : 0;
    }

    if (this.root instanceof HTMLButtonElement) {
      if (!this.root.getAttribute("type")) {
        this.root.type = "button";
      }
      this.root.disabled = this.disabled;
    }

    setBooleanAttribute(this.root, "data-checked", checked);
    setBooleanAttribute(this.root, "data-unchecked", !checked);
    setBooleanAttribute(this.root, "data-disabled", this.disabled);
    setBooleanAttribute(this.root, "data-readonly", this.readOnly);
    setBooleanAttribute(this.root, "data-required", this.required);
    setBooleanAttribute(this.root, "data-indeterminate", indeterminate);

    this.elements.input.checked = checked;
    this.elements.input.indeterminate = indeterminate;
    this.elements.input.disabled = this.disabled;
    this.elements.input.required = this.required;
    if (this.name !== undefined) {
      this.elements.input.name = this.name;
    } else {
      this.elements.input.removeAttribute("name");
    }
    if (this.value !== undefined) {
      this.elements.input.value = this.value;
    }
    if (this.form !== undefined) {
      this.elements.input.setAttribute("form", this.form);
    } else {
      this.elements.input.removeAttribute("form");
    }

    this.renderUncheckedInput();

    this.elements.indicators.forEach((indicator) => {
      setCheckboxStateAttributes(indicator.element, {
        checked,
        disabled: this.disabled,
        indeterminate,
        readOnly: this.readOnly,
        required: this.required,
      });

      if (indicator.keepMounted) {
        showElement(indicator.element);
        return;
      }

      if (active) {
        showElement(indicator.element);
      } else if (this.indicatorRendered) {
        hideElementAfterAnimations(indicator.element);
      } else {
        indicator.element.hidden = true;
      }
    });

    this.indicatorRendered = true;
  }

  private renderUncheckedInput(): void {
    let { uncheckedInput } = this.elements;

    if (!this.name || this.uncheckedValue === undefined || this.checkedState) {
      uncheckedInput?.remove();
      this.elements.uncheckedInput = undefined;
      return;
    }

    if (!uncheckedInput) {
      uncheckedInput = document.createElement("input");
      uncheckedInput.type = "hidden";
      uncheckedInput.setAttribute(CHECKBOX_UNCHECKED_INPUT_ATTRIBUTE, "");
      this.elements.input.after(uncheckedInput);
      this.elements.uncheckedInput = uncheckedInput;
    }

    uncheckedInput.name = this.name;
    uncheckedInput.value = this.uncheckedValue;
    uncheckedInput.disabled = this.disabled;

    if (this.form !== undefined) {
      uncheckedInput.setAttribute("form", this.form);
    } else {
      uncheckedInput.removeAttribute("form");
    }
  }

  private requestChecked(checked: boolean, request: CheckboxRequest): void {
    if (this.disabled || this.readOnly) return;
    if (checked === this.checkedState && !this.indeterminateState && !this.controlled) return;

    const previousChecked = this.checkedState;
    const details = new CheckboxCheckedChangeDetailsImpl({
      checked,
      event: request.event,
      previousChecked,
      reason: request.reason,
      trigger: request.trigger,
    });

    this.notify(details);
    if (details.isCanceled || this.controlled) {
      this.render();
      return;
    }

    this.checkedState = checked;
    this.indeterminateState = false;
    this.render();
  }

  private readonly handleRootClick = (event: MouseEvent): void => {
    if (event.target === this.elements.input) return;

    if (this.disabled || this.readOnly) {
      event.preventDefault();
      return;
    }

    event.preventDefault();
    this.requestChecked(!this.checkedState, {
      event,
      reason: "root-press",
      trigger: this.root,
    });
  };

  private readonly handleInputChange = (event: Event): void => {
    if (this.disabled || this.readOnly) {
      event.preventDefault();
      this.elements.input.checked = this.checkedState;
      return;
    }

    this.requestChecked(this.elements.input.checked, {
      event,
      reason: "input-change",
      trigger: this.elements.input,
    });
  };

  private readonly handleKeyDown = (event: KeyboardEvent): void => {
    if (event.target !== this.root) return;

    if (event.key === "Enter") {
      if (event.defaultPrevented) return;

      event.preventDefault();
      this.submitForm();
      return;
    }

    if (event.key === " ") {
      event.preventDefault();
    }
  };

  private readonly handleKeyUp = (event: KeyboardEvent): void => {
    if (event.target !== this.root || event.key !== " ") return;

    event.preventDefault();
    this.requestChecked(!this.checkedState, {
      event,
      reason: "root-press",
      trigger: this.root,
    });
  };

  private readonly handleFocus = (): void => {
    setBooleanAttribute(this.root, "data-focused", !this.disabled);
  };

  private readonly handleBlur = (): void => {
    this.root.removeAttribute("data-focused");
  };

  private readonly handleFormReset = (): void => {
    this.clearResetTimer();
    this.resetTimer = window.setTimeout(() => {
      if (this.controlled) {
        this.render();
        this.resetTimer = undefined;
        return;
      }

      this.checkedState = this.elements.input.checked;
      this.indeterminateState = this.elements.input.indeterminate;
      this.render();
      this.resetTimer = undefined;
    }, 0);
  };

  private bindFormReset(): void {
    const form = this.elements.input.form;
    if (this.resetForm === form) return;

    this.unbindFormReset();
    this.resetForm = form;
    this.resetForm?.addEventListener("reset", this.handleFormReset);
  }

  private unbindFormReset(): void {
    if (!this.resetForm) return;

    this.resetForm.removeEventListener("reset", this.handleFormReset);
    this.resetForm = null;
  }

  private clearResetTimer(): void {
    if (this.resetTimer === undefined) return;

    window.clearTimeout(this.resetTimer);
    this.resetTimer = undefined;
  }

  private submitForm(): void {
    const form = this.elements.input.form;
    if (!form) return;

    if (typeof form.requestSubmit === "function") {
      const submitter = getDefaultSubmitter(form);
      if (submitter) {
        form.requestSubmit(submitter);
        return;
      }

      form.requestSubmit();
      return;
    }

    form.dispatchEvent(new SubmitEvent("submit", { bubbles: true, cancelable: true }));
  }

  private notify(details: CheckboxCheckedChangeDetails): void {
    attachFormValueRevision(details, details.event);
    const event = dispatchCustomEvent(this.root, "starwind:checked-change", details, {
      cancelable: true,
    });
    if (event.defaultPrevented) details.cancel();
    this.onCheckedChange?.(details.checked, details);
    this.subscribers.forEach((subscriber) => subscriber(details));
  }
}

class CheckboxCheckedChangeDetailsImpl implements CheckboxCheckedChangeDetails {
  readonly checked: boolean;
  readonly event?: Event;
  readonly previousChecked: boolean;
  readonly reason: CheckboxCheckedChangeReason;
  readonly trigger?: Element;

  private canceled = false;

  constructor({
    checked,
    event,
    previousChecked,
    reason,
    trigger,
  }: {
    checked: boolean;
    event?: Event;
    previousChecked: boolean;
    reason: CheckboxCheckedChangeReason;
    trigger?: Element;
  }) {
    this.checked = checked;
    this.event = event;
    this.previousChecked = previousChecked;
    this.reason = reason;
    this.trigger = trigger;
  }

  get isCanceled(): boolean {
    return this.canceled;
  }

  cancel(): void {
    this.canceled = true;
  }
}

function getCheckboxElements(root: HTMLElement): CheckboxElements {
  const input = getOrCreateInput(root);
  const uncheckedInput = getUncheckedInput(root, input);

  return {
    indicators: Array.from(root.querySelectorAll<HTMLElement>(CHECKBOX_INDICATOR_SELECTOR))
      .filter((element) => isOwnedByRoot(element, root))
      .map((element) => ({
        element,
        keepMounted: readBooleanAttribute(element, CHECKBOX_INDICATOR_KEEP_MOUNTED_ATTRIBUTE),
      })),
    input,
    uncheckedInput,
  };
}

function getOrCreateInput(root: HTMLElement): HTMLInputElement {
  const existingInput = root.querySelector<HTMLInputElement>(CHECKBOX_INPUT_SELECTOR);
  if (existingInput && isOwnedByRoot(existingInput, root)) {
    if (usesSiblingFormInputs(root)) {
      root.after(existingInput);
    }

    return existingInput;
  }

  const sibling = root.nextElementSibling;
  if (sibling instanceof HTMLInputElement && sibling.hasAttribute(CHECKBOX_INPUT_ATTRIBUTE)) {
    return sibling;
  }

  const input = document.createElement("input");
  input.setAttribute(CHECKBOX_INPUT_ATTRIBUTE, "");
  if (usesSiblingFormInputs(root) && root.parentNode) {
    root.after(input);
  } else {
    root.append(input);
  }

  return input;
}

function getUncheckedInput(
  root: HTMLElement,
  input: HTMLInputElement,
): HTMLInputElement | undefined {
  const sibling = input.nextElementSibling;
  if (
    sibling instanceof HTMLInputElement &&
    sibling.hasAttribute(CHECKBOX_UNCHECKED_INPUT_ATTRIBUTE)
  ) {
    return sibling;
  }

  const existingInput = root.querySelector<HTMLInputElement>(
    `[${CHECKBOX_UNCHECKED_INPUT_ATTRIBUTE}]`,
  );
  if (!existingInput || !isOwnedByRoot(existingInput, root)) return undefined;

  input.after(existingInput);
  return existingInput;
}

function isOwnedByRoot(element: Element, root: HTMLElement): boolean {
  return element.closest(`[${CHECKBOX_ROOT_ATTRIBUTE}]`) === root;
}

function usesSiblingFormInputs(root: HTMLElement): boolean {
  return root instanceof HTMLButtonElement;
}

function getDefaultSubmitter(form: HTMLFormElement): HTMLButtonElement | HTMLInputElement | null {
  const candidates = form.querySelectorAll<HTMLButtonElement | HTMLInputElement>("button,input");

  for (const candidate of candidates) {
    if (candidate.form !== form || candidate.disabled) continue;

    if (candidate instanceof HTMLButtonElement) {
      const type = candidate.getAttribute("type")?.toLowerCase() ?? "submit";
      if (type === "submit") return candidate;
      continue;
    }

    if (candidate.type === "submit" || candidate.type === "image") {
      return candidate;
    }
  }

  return null;
}

function readOptionalAttribute(element: HTMLElement, name: string): string | undefined {
  return element.getAttribute(name) ?? undefined;
}

function setCheckboxStateAttributes(
  element: HTMLElement,
  state: {
    checked: boolean;
    disabled: boolean;
    indeterminate: boolean;
    readOnly: boolean;
    required: boolean;
  },
): void {
  setBooleanAttribute(element, "data-checked", state.checked);
  setBooleanAttribute(element, "data-unchecked", !state.checked);
  setBooleanAttribute(element, "data-disabled", state.disabled);
  setBooleanAttribute(element, "data-readonly", state.readOnly);
  setBooleanAttribute(element, "data-required", state.required);
  setBooleanAttribute(element, "data-indeterminate", state.indeterminate);
}
