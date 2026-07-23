import {
  assertHTMLElement,
  ensureId,
  readBooleanAttribute,
  setBooleanAttribute,
} from "../../internal/dom";
import { dispatchCustomEvent } from "../../internal/events";
import { attachFormValueRevision } from "../../internal/form-value-revision";
import { registerFieldControlBridge } from "../field/field-control-bridge";

export type SwitchCheckedChangeReason = "none";

export type SwitchCheckedChangeDetails = {
  readonly checked: boolean;
  readonly event?: Event;
  readonly isCanceled: boolean;
  readonly isPropagationAllowed: boolean;
  readonly previousChecked: boolean;
  readonly reason: SwitchCheckedChangeReason;
  readonly trigger?: Element;
  allowPropagation(): void;
  cancel(): void;
};

export type SwitchOptions = {
  checked?: boolean;
  defaultChecked?: boolean;
  disabled?: boolean;
  form?: string;
  id?: string;
  name?: string;
  onCheckedChange?: (checked: boolean, details: SwitchCheckedChangeDetails) => void;
  readOnly?: boolean;
  required?: boolean;
  uncheckedValue?: string;
  value?: string;
};

export type SwitchSetCheckedOptions = {
  emit?: boolean;
  event?: Event;
  trigger?: Element;
};

export type SwitchInstance = {
  readonly root: HTMLElement;
  destroy(): void;
  getChecked(): boolean;
  setChecked(checked: boolean, options?: SwitchSetCheckedOptions): void;
  setDisabled(disabled: boolean): void;
  setFormOptions(
    options: Pick<SwitchOptions, "form" | "name" | "required" | "uncheckedValue" | "value">,
  ): void;
  subscribe(
    event: "checkedChange",
    callback: (details: SwitchCheckedChangeDetails) => void,
  ): () => void;
  toggle(): void;
};

type SwitchElements = {
  input: HTMLInputElement;
  thumbs: HTMLElement[];
  uncheckedInput?: HTMLInputElement;
};

const SWITCH_ROOT_ATTRIBUTE = "data-sw-switch";
const SWITCH_DEFAULT_CHECKED_ATTRIBUTE = "data-default-checked";
const SWITCH_DISABLED_ATTRIBUTE = "data-disabled";
const SWITCH_FORM_ATTRIBUTE = "data-form";
const SWITCH_ID_ATTRIBUTE = "data-id";
const SWITCH_INPUT_ATTRIBUTE = "data-sw-switch-input";
const SWITCH_INPUT_SELECTOR = `[${SWITCH_INPUT_ATTRIBUTE}]`;
const SWITCH_NAME_ATTRIBUTE = "data-name";
const SWITCH_READONLY_ATTRIBUTE = "data-readonly";
const SWITCH_REQUIRED_ATTRIBUTE = "data-required";
const SWITCH_THUMB_ATTRIBUTE = "data-sw-switch-thumb";
const SWITCH_THUMB_SELECTOR = `[${SWITCH_THUMB_ATTRIBUTE}]`;
const SWITCH_UNCHECKED_INPUT_ATTRIBUTE = "data-sw-switch-unchecked-input";
const SWITCH_UNCHECKED_VALUE_ATTRIBUTE = "data-unchecked-value";
const SWITCH_VALUE_ATTRIBUTE = "data-value";

const instances = new WeakMap<HTMLElement, SwitchController>();

registerFieldControlBridge({
  kind: "switch",
  connect(control, { disabled, name, shouldSyncName }) {
    const switchInstance = createSwitch(control, { disabled, name });
    switchInstance.setDisabled(disabled);
    if (shouldSyncName) {
      switchInstance.setFormOptions({ name });
    }
  },
});

export function createSwitch(root: HTMLElement, options: SwitchOptions = {}): SwitchInstance {
  assertHTMLElement(root, "createSwitch root");

  const existing = instances.get(root);
  if (existing) return existing;

  const instance = new SwitchController(root, options);
  instances.set(root, instance);
  return instance;
}

class SwitchController implements SwitchInstance {
  readonly root: HTMLElement;

  private readonly abortController = new AbortController();
  private readonly controlled: boolean;
  private readonly elements: SwitchElements;
  private form?: string;
  private readonly id?: string;
  private readonly initialChecked: boolean;
  private readonly managesTabIndex: boolean;
  private name?: string;
  private readonly onCheckedChange?: (
    checked: boolean,
    details: SwitchCheckedChangeDetails,
  ) => void;
  private readonly readOnly: boolean;
  private required: boolean;
  private readonly subscribers = new Set<(details: SwitchCheckedChangeDetails) => void>();
  private uncheckedValue?: string;
  private value?: string;
  private checkedState: boolean;
  private destroyed = false;
  private disabled: boolean;
  private focused = false;
  private formResetElement: HTMLFormElement | null = null;
  private resetTimer: number | undefined;
  private touched = false;

  constructor(root: HTMLElement, options: SwitchOptions) {
    this.root = root;
    this.elements = getSwitchElements(root);
    this.controlled = Object.hasOwn(options, "checked");
    this.disabled = options.disabled ?? readBooleanAttribute(root, SWITCH_DISABLED_ATTRIBUTE);
    this.form = options.form ?? readOptionalAttribute(root, SWITCH_FORM_ATTRIBUTE);
    this.id = options.id ?? readOptionalAttribute(root, SWITCH_ID_ATTRIBUTE) ?? root.id;
    this.managesTabIndex = !root.hasAttribute("tabindex");
    this.name = options.name ?? readOptionalAttribute(root, SWITCH_NAME_ATTRIBUTE);
    this.onCheckedChange = options.onCheckedChange;
    this.readOnly = options.readOnly ?? readBooleanAttribute(root, SWITCH_READONLY_ATTRIBUTE);
    this.required = options.required ?? readBooleanAttribute(root, SWITCH_REQUIRED_ATTRIBUTE);
    this.uncheckedValue =
      options.uncheckedValue ?? readOptionalAttribute(root, SWITCH_UNCHECKED_VALUE_ATTRIBUTE);
    this.value = options.value ?? readOptionalAttribute(root, SWITCH_VALUE_ATTRIBUTE);
    const defaultChecked =
      this.elements.input.defaultChecked ||
      readBooleanAttribute(root, SWITCH_DEFAULT_CHECKED_ATTRIBUTE);
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
    this.clearResetTimer();
    this.formResetElement?.removeEventListener("reset", this.handleFormReset);
    this.formResetElement = null;
    this.subscribers.clear();
    instances.delete(this.root);
    this.destroyed = true;
  }

  getChecked(): boolean {
    return this.checkedState;
  }

  setChecked(checked: boolean, options: SwitchSetCheckedOptions = {}): void {
    if (this.checkedState === checked) {
      this.render();
      return;
    }

    const previousChecked = this.checkedState;
    this.checkedState = checked;
    this.render();

    if (options.emit === false) return;

    this.notify(
      new SwitchCheckedChangeDetailsImpl({
        checked,
        event: options.event,
        previousChecked,
        trigger: options.trigger,
      }),
    );
  }

  setDisabled(disabled: boolean): void {
    if (this.disabled === disabled) return;

    this.disabled = disabled;
    this.render();
  }

  setFormOptions(
    options: Pick<SwitchOptions, "form" | "name" | "required" | "uncheckedValue" | "value">,
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
  }

  subscribe(
    event: "checkedChange",
    callback: (details: SwitchCheckedChangeDetails) => void,
  ): () => void {
    if (event !== "checkedChange") {
      throw new Error(`Unsupported Switch event: ${event}`);
    }

    this.subscribers.add(callback);
    return () => {
      this.subscribers.delete(callback);
    };
  }

  toggle(): void {
    this.requestChecked(!this.checkedState);
  }

  private setupFormInput(): void {
    const { input } = this.elements;

    input.type = "checkbox";
    input.checked = this.checkedState;
    input.defaultChecked = this.initialChecked;
    input.disabled = this.disabled;
    input.hidden = false;
    input.required = this.required;
    input.tabIndex = -1;
    input.setAttribute("aria-hidden", "true");
    input.setAttribute(SWITCH_INPUT_ATTRIBUTE, "");
    input.style.position = "absolute";
    input.style.width = "1px";
    input.style.height = "1px";
    input.style.margin = "-1px";
    input.style.overflow = "hidden";
    input.style.clipPath = "inset(50%)";
    input.style.whiteSpace = "nowrap";
    input.style.border = "0";

    if (this.id !== undefined) {
      if (this.root instanceof HTMLButtonElement) {
        this.root.id = this.id;
        input.id = input.id && input.id !== this.id ? input.id : `${this.id}-input`;
      } else {
        if (this.root.id === this.id) {
          this.root.removeAttribute("id");
        }
        input.id = this.id;
      }
    } else {
      input.id = ensureId(input, "sw-switch-input");
    }

    if (this.name !== undefined) {
      input.name = this.name;
    } else {
      input.removeAttribute("name");
    }

    setCheckboxValue(input, this.value);

    if (this.form !== undefined) {
      input.setAttribute("form", this.form);
    }
  }

  private bindEvents(): void {
    const { signal } = this.abortController;

    this.root.addEventListener("click", this.handleRootClick, { signal });
    this.root.addEventListener("keydown", this.handleKeyDown, { signal });
    this.root.addEventListener("focus", this.handleFocus, { signal });
    this.root.addEventListener("blur", this.handleBlur, { signal });
    this.elements.input.addEventListener("change", this.handleInputChange, { signal });
    this.bindFormResetListener();
  }

  private render(): void {
    const checked = this.checkedState;

    this.root.setAttribute(SWITCH_ROOT_ATTRIBUTE, "");
    this.root.setAttribute("role", "switch");
    this.root.setAttribute("aria-checked", String(checked));
    setBooleanAriaAttribute(this.root, "aria-readonly", this.readOnly);
    setBooleanAriaAttribute(this.root, "aria-required", this.required);

    if (this.disabled) {
      this.root.setAttribute("aria-disabled", "true");
    } else {
      this.root.removeAttribute("aria-disabled");
    }

    if (this.managesTabIndex) {
      this.root.tabIndex = this.disabled ? -1 : 0;
    }

    if (this.root instanceof HTMLButtonElement) {
      if (!this.root.getAttribute("type")) {
        this.root.type = "button";
      }
      this.root.disabled = this.disabled;
    }

    setSwitchStateAttributes(this.root, {
      checked,
      dirty: checked !== this.initialChecked,
      disabled: this.disabled,
      focused: this.focused,
      readOnly: this.readOnly,
      required: this.required,
      touched: this.touched,
    });

    this.elements.thumbs.forEach((thumb) => {
      setSwitchStateAttributes(thumb, {
        checked,
        dirty: checked !== this.initialChecked,
        disabled: this.disabled,
        focused: this.focused,
        readOnly: this.readOnly,
        required: this.required,
        touched: this.touched,
      });
    });

    this.elements.input.checked = checked;
    this.elements.input.disabled = this.disabled;
    this.elements.input.required = this.required;
    if (this.name !== undefined) {
      this.elements.input.name = this.name;
    } else {
      this.elements.input.removeAttribute("name");
    }
    setCheckboxValue(this.elements.input, this.value);
    if (this.form !== undefined) {
      this.elements.input.setAttribute("form", this.form);
    } else {
      this.elements.input.removeAttribute("form");
    }
    this.bindFormResetListener();
    this.syncRootLabeling();

    this.renderUncheckedInput();
  }

  private bindFormResetListener(): void {
    const form = this.elements.input.form;
    if (this.formResetElement === form) return;

    this.formResetElement?.removeEventListener("reset", this.handleFormReset);
    this.formResetElement = form;
    this.formResetElement?.addEventListener("reset", this.handleFormReset, {
      signal: this.abortController.signal,
    });
  }

  private syncRootLabeling(): void {
    if (this.root.hasAttribute("aria-label") || this.root.hasAttribute("aria-labelledby")) return;

    const labels = Array.from(this.elements.input.labels ?? []);
    if (labels.length === 0) return;

    const labelIds = labels.map((label) => ensureId(label, "sw-switch-label"));
    this.root.setAttribute("aria-labelledby", labelIds.join(" "));
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
      uncheckedInput.setAttribute(SWITCH_UNCHECKED_INPUT_ATTRIBUTE, "");
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

  private requestChecked(checked: boolean, event?: Event, trigger?: Element): void {
    if (this.disabled || this.readOnly) return;
    if (checked === this.checkedState && !this.controlled) return;

    const previousChecked = this.checkedState;
    const details = new SwitchCheckedChangeDetailsImpl({
      checked,
      event,
      previousChecked,
      trigger,
    });

    this.notify(details);
    if (details.isCanceled || this.controlled) {
      this.elements.input.checked = this.checkedState;
      return;
    }

    this.checkedState = checked;
    this.render();
  }

  private readonly handleRootClick = (event: MouseEvent): void => {
    if (event.target === this.elements.input) return;

    if (this.disabled || this.readOnly) {
      event.preventDefault();
      return;
    }

    event.preventDefault();
    this.requestChecked(!this.checkedState, event, this.root);
  };

  private readonly handleInputChange = (event: Event): void => {
    if (this.disabled || this.readOnly) {
      event.preventDefault();
      this.elements.input.checked = this.checkedState;
      return;
    }

    this.requestChecked(this.elements.input.checked, event, this.elements.input);
  };

  private readonly handleKeyDown = (event: KeyboardEvent): void => {
    if (event.target !== this.root) return;
    if (event.key !== " " && event.key !== "Enter") return;

    event.preventDefault();
    this.requestChecked(!this.checkedState, event, this.root);
  };

  private readonly handleFocus = (): void => {
    this.focused = !this.disabled;
    this.render();
  };

  private readonly handleBlur = (): void => {
    this.focused = false;
    this.touched = true;
    this.render();
  };

  private readonly handleFormReset = (): void => {
    this.clearResetTimer();
    this.resetTimer = window.setTimeout(() => {
      if (!this.controlled) {
        this.checkedState = this.elements.input.checked;
      }
      this.render();
      this.resetTimer = undefined;
    }, 0);
  };

  private clearResetTimer(): void {
    if (this.resetTimer === undefined) return;

    window.clearTimeout(this.resetTimer);
    this.resetTimer = undefined;
  }

  private notify(details: SwitchCheckedChangeDetails): void {
    attachFormValueRevision(details, details.event);
    const event = dispatchCustomEvent(this.root, "starwind:checked-change", details, {
      cancelable: true,
    });
    if (event.defaultPrevented) details.cancel();
    this.onCheckedChange?.(details.checked, details);
    this.subscribers.forEach((subscriber) => subscriber(details));
  }
}

class SwitchCheckedChangeDetailsImpl implements SwitchCheckedChangeDetails {
  readonly checked: boolean;
  readonly event?: Event;
  readonly previousChecked: boolean;
  readonly reason = "none" satisfies SwitchCheckedChangeReason;
  readonly trigger?: Element;

  private canceled = false;
  private propagationAllowed = false;

  constructor({
    checked,
    event,
    previousChecked,
    trigger,
  }: {
    checked: boolean;
    event?: Event;
    previousChecked: boolean;
    trigger?: Element;
  }) {
    this.checked = checked;
    this.event = event;
    this.previousChecked = previousChecked;
    this.trigger = trigger;
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

function getSwitchElements(root: HTMLElement): SwitchElements {
  const input = getOrCreateInput(root);
  const uncheckedInputSibling = input.nextElementSibling;

  return {
    input,
    thumbs: Array.from(root.querySelectorAll<HTMLElement>(SWITCH_THUMB_SELECTOR)).filter((thumb) =>
      isOwnedByRoot(thumb, root),
    ),
    uncheckedInput:
      uncheckedInputSibling instanceof HTMLInputElement &&
      uncheckedInputSibling.hasAttribute(SWITCH_UNCHECKED_INPUT_ATTRIBUTE)
        ? uncheckedInputSibling
        : undefined,
  };
}

function getOrCreateInput(root: HTMLElement): HTMLInputElement {
  const ownedInput = root.querySelector<HTMLInputElement>(SWITCH_INPUT_SELECTOR);
  if (ownedInput && isOwnedByRoot(ownedInput, root)) return ownedInput;

  const sibling = root.nextElementSibling;
  if (sibling instanceof HTMLInputElement && sibling.hasAttribute(SWITCH_INPUT_ATTRIBUTE)) {
    return sibling;
  }

  const input = document.createElement("input");
  input.setAttribute(SWITCH_INPUT_ATTRIBUTE, "");

  if (root.parentNode) {
    root.after(input);
  } else {
    root.append(input);
  }

  return input;
}

function isOwnedByRoot(element: Element, root: HTMLElement): boolean {
  return element.closest(`[${SWITCH_ROOT_ATTRIBUTE}]`) === root;
}

function readOptionalAttribute(element: HTMLElement, name: string): string | undefined {
  return element.getAttribute(name) ?? undefined;
}

function setBooleanAriaAttribute(element: HTMLElement, name: string, value: boolean): void {
  if (value) {
    element.setAttribute(name, "true");
  } else {
    element.removeAttribute(name);
  }
}

function setCheckboxValue(input: HTMLInputElement, value: string | undefined): void {
  if (value !== undefined) {
    input.value = value;
    return;
  }

  input.value = "on";
  input.defaultValue = "on";
  input.removeAttribute("value");
}

function setSwitchStateAttributes(
  element: HTMLElement,
  state: {
    checked: boolean;
    dirty: boolean;
    disabled: boolean;
    focused: boolean;
    readOnly: boolean;
    required: boolean;
    touched: boolean;
  },
): void {
  setBooleanAttribute(element, "data-checked", state.checked);
  setBooleanAttribute(element, "data-unchecked", !state.checked);
  setBooleanAttribute(element, "data-disabled", state.disabled);
  setBooleanAttribute(element, "data-readonly", state.readOnly);
  setBooleanAttribute(element, "data-required", state.required);
  setBooleanAttribute(element, "data-dirty", state.dirty);
  setBooleanAttribute(element, "data-filled", state.checked);
  setBooleanAttribute(element, "data-focused", state.focused);
  setBooleanAttribute(element, "data-touched", state.touched);
}
