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

export type RadioCheckedChangeReason = "root-press" | "input-change" | "imperative-action";

export type RadioCheckedChangeDetails = {
  readonly checked: boolean;
  readonly event?: Event;
  readonly isCanceled: boolean;
  readonly previousChecked: boolean;
  readonly reason: RadioCheckedChangeReason;
  readonly trigger?: Element;
  cancel(): void;
  onAccepted(callback: () => void): void;
};

export type RadioOptions = {
  checked?: boolean;
  defaultChecked?: boolean;
  disabled?: boolean;
  form?: string;
  id?: string;
  name?: string;
  onCheckedChange?: (checked: boolean, details: RadioCheckedChangeDetails) => void;
  readOnly?: boolean;
  required?: boolean;
  value?: string;
};

export type RadioSetCheckedOptions = {
  emit?: boolean;
};

export type RadioSelectionOwnerCompletion = {
  /**
   * Whether the owner accepted the transition before external value reconciliation.
   * Legacy owners may omit this, in which case `committed` also represents acceptance.
   */
  readonly accepted?: boolean;
  readonly committed: boolean;
  readonly current: boolean;
  readonly errors: readonly unknown[];
};

export type RadioInstance = {
  readonly root: HTMLElement;
  destroy(): void;
  getChecked(): boolean;
  select(): void;
  setChecked(checked: boolean, options?: RadioSetCheckedOptions): void;
  setDisabled(disabled: boolean): void;
  setFormOptions(options: Pick<RadioOptions, "form" | "name" | "required" | "value">): void;
  setReadOnly(readOnly: boolean): void;
  setRequired(required: boolean): void;
  setSelectionOwner(owner?: (details: RadioCheckedChangeDetails) => void): void;
  setSelectionOwnerWithCompletion(
    owner?: (details: RadioCheckedChangeDetails) => RadioSelectionOwnerCompletion,
  ): void;
  subscribe(event: "stateSync", callback: () => void): () => void;
  subscribe(
    event: "checkedChange",
    callback: (details: RadioCheckedChangeDetails) => void,
  ): () => void;
};

type RadioElements = {
  indicators: RadioIndicator[];
  input: HTMLInputElement;
  inputRuntimeOwned: boolean;
};

type RadioIndicator = {
  element: HTMLElement;
  keepMounted: boolean;
};

type RadioRequest = {
  event?: Event;
  reason: RadioCheckedChangeReason;
  trigger?: Element;
};

const RADIO_ROOT_ATTRIBUTE = "data-sw-radio";
const RADIO_DEFAULT_CHECKED_ATTRIBUTE = "data-default-checked";
const RADIO_DISABLED_ATTRIBUTE = "data-disabled";
const RADIO_FORM_ATTRIBUTE = "data-form";
const RADIO_ID_ATTRIBUTE = "data-id";
const RADIO_INPUT_ATTRIBUTE = "data-sw-radio-input";
const RADIO_INPUT_SELECTOR = `[${RADIO_INPUT_ATTRIBUTE}]`;
const RADIO_INDICATOR_SELECTOR = "[data-sw-radio-indicator]";
const RADIO_INDICATOR_KEEP_MOUNTED_ATTRIBUTE = "data-keep-mounted";
const RADIO_NAME_ATTRIBUTE = "data-name";
const RADIO_READONLY_ATTRIBUTE = "data-readonly";
const RADIO_REQUIRED_ATTRIBUTE = "data-required";
const RADIO_VALUE_ATTRIBUTE = "data-value";

const instances = new WeakMap<HTMLElement, RadioController>();

registerFieldControlBridge({
  kind: "radio",
  connect(control, { disabled, name, shouldSyncName }) {
    const radio = createRadio(control, { disabled, name });
    radio.setDisabled(disabled);
    if (shouldSyncName) {
      radio.setFormOptions({ name });
    }
  },
});

export function createRadio(root: HTMLElement, options: RadioOptions = {}): RadioInstance {
  assertHTMLElement(root, "createRadio root");

  const existing = instances.get(root);
  if (existing) return existing;

  const instance = new RadioController(root, options);
  instances.set(root, instance);
  return instance;
}

class RadioController implements RadioInstance {
  readonly root: HTMLElement;

  private readonly abortController = new AbortController();
  private checkedState: boolean;
  private readonly controlled: boolean;
  private destroyed = false;
  private disabled: boolean;
  private readonly elements: RadioElements;
  private form?: string;
  private id?: string;
  private readonly initialChecked: boolean;
  private inputAssociationObserver?: MutationObserver;
  private indicatorRendered = false;
  private readonly managesTabIndex: boolean;
  private name?: string;
  private readonly onCheckedChange?: (checked: boolean, details: RadioCheckedChangeDetails) => void;
  private readOnly: boolean;
  private required: boolean;
  private resetForm: HTMLFormElement | null = null;
  private resetTimer: number | undefined;
  private selectionOwner?: (details: RadioCheckedChangeDetails) => RadioSelectionOwnerCompletion;
  private readonly subscribers = new Set<(details: RadioCheckedChangeDetails) => void>();
  private readonly syncSubscribers = new Set<() => void>();
  private readonly nativeButton: boolean;
  private value?: string;

  constructor(root: HTMLElement, options: RadioOptions) {
    this.root = root;
    this.elements = getRadioElements(root);
    this.controlled = Object.hasOwn(options, "checked");
    this.disabled =
      options.disabled ??
      (readBooleanAttribute(root, RADIO_DISABLED_ATTRIBUTE) || this.elements.input.disabled);
    this.form = options.form ?? readOptionalAttribute(root, RADIO_FORM_ATTRIBUTE);
    this.nativeButton = root instanceof HTMLButtonElement;
    this.id =
      options.id ??
      readOptionalAttribute(root, RADIO_ID_ATTRIBUTE) ??
      (this.nativeButton ? root.id || undefined : undefined);
    this.name =
      options.name ??
      readOptionalAttribute(root, RADIO_NAME_ATTRIBUTE) ??
      readOptionalAttribute(this.elements.input, "name");
    this.managesTabIndex = !root.hasAttribute("tabindex");
    this.onCheckedChange = options.onCheckedChange;
    this.readOnly = options.readOnly ?? readBooleanAttribute(root, RADIO_READONLY_ATTRIBUTE);
    this.required =
      options.required ??
      (readBooleanAttribute(root, RADIO_REQUIRED_ATTRIBUTE) || this.elements.input.required);
    this.value =
      options.value ??
      readOptionalAttribute(root, RADIO_VALUE_ATTRIBUTE) ??
      readOptionalAttribute(this.elements.input, "value");
    this.checkedState =
      options.checked ??
      options.defaultChecked ??
      (this.elements.input.checked || readBooleanAttribute(root, RADIO_DEFAULT_CHECKED_ATTRIBUTE));
    this.initialChecked = this.checkedState;

    this.setupFormInput();
    this.bindEvents();
    this.render();
    this.bindFormReset();
    this.observeInputAssociation();
  }

  destroy(): void {
    if (this.destroyed) return;

    this.abortController.abort();
    this.unbindFormReset();
    this.clearResetTimer();
    this.inputAssociationObserver?.disconnect();
    if (this.nativeButton && this.elements.inputRuntimeOwned) {
      this.elements.input.remove();
    }
    this.selectionOwner = undefined;
    this.subscribers.clear();
    this.syncSubscribers.clear();
    instances.delete(this.root);
    this.destroyed = true;
  }

  getChecked(): boolean {
    return this.checkedState;
  }

  select(): void {
    this.requestChecked(true, {
      reason: "imperative-action",
    });
  }

  setChecked(checked: boolean, options: RadioSetCheckedOptions = {}): void {
    if (checked === this.checkedState) return;

    const previousChecked = this.checkedState;
    if (options.emit === false) {
      this.checkedState = checked;
      this.render();
      return;
    }

    const details = new RadioCheckedChangeDetailsImpl({
      checked,
      previousChecked,
      reason: "imperative-action",
    });
    this.notify(details);
    if (details.isCanceled) {
      this.render();
      return;
    }

    if (this.selectionOwner) {
      let completion: RadioSelectionOwnerCompletion;
      try {
        completion = this.selectionOwner(details);
      } catch (error) {
        details.cancel();
        this.elements.input.checked = this.checkedState;
        throw error;
      }
      this.completeOwnedSelection(details, completion);
      return;
    }

    this.checkedState = checked;
    this.render();
    this.completeAcceptance(details);
  }

  setSelectionOwner(owner?: (details: RadioCheckedChangeDetails) => void): void {
    if (owner) this.clearResetTimer();
    this.selectionOwner = owner
      ? (details) => {
          owner(details);
          return { committed: true, current: true, errors: [] };
        }
      : undefined;
  }

  setSelectionOwnerWithCompletion(
    owner?: (details: RadioCheckedChangeDetails) => RadioSelectionOwnerCompletion,
  ): void {
    if (owner) this.clearResetTimer();
    this.selectionOwner = owner;
  }

  setDisabled(disabled: boolean): void {
    if (this.disabled === disabled) return;

    this.disabled = disabled;
    this.render();
  }

  setFormOptions(options: Pick<RadioOptions, "form" | "name" | "required" | "value">): void {
    this.form = options.form;
    this.name = options.name;
    this.required = options.required ?? this.required;
    this.value = options.value;
    this.render();
    this.bindFormReset();
  }

  setReadOnly(readOnly: boolean): void {
    if (this.readOnly === readOnly) return;

    this.readOnly = readOnly;
    this.render();
  }

  setRequired(required: boolean): void {
    if (this.required === required) return;

    this.required = required;
    this.render();
  }

  subscribe(
    event: "checkedChange" | "stateSync",
    callback: ((details: RadioCheckedChangeDetails) => void) | (() => void),
  ): () => void {
    if (event === "stateSync") {
      const syncCallback = callback as () => void;
      this.syncSubscribers.add(syncCallback);
      return () => {
        this.syncSubscribers.delete(syncCallback);
      };
    }
    if (event !== "checkedChange") {
      throw new Error(`Unsupported Radio event: ${event}`);
    }

    const checkedCallback = callback as (details: RadioCheckedChangeDetails) => void;
    this.subscribers.add(checkedCallback);
    return () => {
      this.subscribers.delete(checkedCallback);
    };
  }

  private setupFormInput(): void {
    const { input } = this.elements;
    if (this.nativeButton) {
      if (this.id !== undefined) {
        this.root.id = this.id;
      }
      if (this.id !== undefined && input.id === this.id) {
        input.removeAttribute("id");
      }
    } else {
      const inputId = this.id ?? input.id ?? ensureId(input, "sw-radio-input");
      input.id = inputId;
    }

    input.type = "radio";
    input.checked = this.checkedState;
    input.defaultChecked = this.initialChecked;
    input.disabled = this.disabled;
    input.required = this.required;
    input.tabIndex = -1;
    input.setAttribute("aria-hidden", "true");
    input.setAttribute(RADIO_INPUT_ATTRIBUTE, "");
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
  }

  private render(): void {
    const checked = this.checkedState;

    if (this.nativeButton) {
      placeInput(this.root, this.elements.input);
    }

    this.root.setAttribute(RADIO_ROOT_ATTRIBUTE, "");
    this.root.setAttribute("role", "radio");
    this.root.setAttribute("aria-checked", String(checked));
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

    setBooleanAttribute(this.root, "data-checked", checked);
    setBooleanAttribute(this.root, "data-unchecked", !checked);
    setBooleanAttribute(this.root, "data-disabled", this.disabled);
    setBooleanAttribute(this.root, "data-readonly", this.readOnly);
    setBooleanAttribute(this.root, "data-required", this.required);

    this.elements.input.checked = checked;
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

    this.elements.indicators.forEach((indicator) => {
      setRadioStateAttributes(indicator.element, {
        checked,
        disabled: this.disabled,
        readOnly: this.readOnly,
        required: this.required,
      });

      if (indicator.keepMounted) {
        showElement(indicator.element);
        return;
      }

      if (checked) {
        showElement(indicator.element);
      } else if (this.indicatorRendered) {
        hideElementAfterAnimations(indicator.element);
      } else {
        indicator.element.hidden = true;
      }
    });

    this.indicatorRendered = true;
  }

  private requestChecked(checked: boolean, request: RadioRequest): void {
    if (this.disabled || this.readOnly) return;
    if (!checked) return;
    if (checked === this.checkedState) return;

    const previousChecked = this.checkedState;
    const details = new RadioCheckedChangeDetailsImpl({
      checked,
      event: request.event,
      previousChecked,
      reason: request.reason,
      trigger: request.trigger,
    });

    this.notify(details);
    if (details.isCanceled) {
      this.render();
      return;
    }

    if (this.selectionOwner) {
      let completion: RadioSelectionOwnerCompletion;
      try {
        completion = this.selectionOwner(details);
      } catch (error) {
        details.cancel();
        this.elements.input.checked = this.checkedState;
        throw error;
      }
      this.completeOwnedSelection(details, completion);
      return;
    }

    if (this.controlled) {
      this.render();
      this.completeAcceptance(details);
      return;
    }

    this.checkedState = checked;
    this.render();
    this.completeAcceptance(details);
  }

  private readonly handleRootClick = (event: MouseEvent): void => {
    if (event.target === this.elements.input) return;
    if (
      event.target instanceof Element &&
      event.target.closest(`[${RADIO_ROOT_ATTRIBUTE}]`) !== this.root
    ) {
      return;
    }

    if (this.disabled || this.readOnly) {
      event.preventDefault();
      return;
    }

    event.preventDefault();
    this.requestChecked(true, {
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
      event.preventDefault();
      return;
    }

    if (event.key !== " ") return;

    event.preventDefault();
  };

  private readonly handleKeyUp = (event: KeyboardEvent): void => {
    if (event.target !== this.root || event.key !== " ") return;

    event.preventDefault();
    this.requestChecked(true, {
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

  private notify(details: RadioCheckedChangeDetails): void {
    attachFormValueRevision(details, details.event);
    const event = dispatchCustomEvent(this.root, "starwind:checked-change", details, {
      cancelable: true,
    });
    if (event.defaultPrevented) details.cancel();
    this.onCheckedChange?.(details.checked, details);
    this.subscribers.forEach((subscriber) => subscriber(details));
  }

  private completeAcceptance(
    details: RadioCheckedChangeDetailsImpl,
    precedingErrors: unknown[] = [],
  ): void {
    const errors: unknown[] = [...precedingErrors];
    errors.push(...details.accept());
    for (const subscriber of [...this.syncSubscribers]) {
      try {
        subscriber();
      } catch (error) {
        errors.push(error);
      }
    }
    if (errors.length > 0) throw errors[0];
  }

  private completeOwnedSelection(
    details: RadioCheckedChangeDetailsImpl,
    completion: RadioSelectionOwnerCompletion,
  ): void {
    const accepted = completion.accepted ?? completion.committed;
    if (!details.isCanceled && accepted && completion.current) {
      this.completeAcceptance(details, [...completion.errors]);
      return;
    }

    details.cancel();
    if (completion.errors.length > 0) throw completion.errors[0];
  }

  private bindFormReset(): void {
    const nextForm = this.elements.input.form;
    if (this.resetForm === nextForm) return;

    this.unbindFormReset();
    this.resetForm = nextForm;
    this.resetForm?.addEventListener("reset", this.handleFormReset);
  }

  private unbindFormReset(): void {
    this.resetForm?.removeEventListener("reset", this.handleFormReset);
    this.resetForm = null;
  }

  private clearResetTimer(): void {
    if (this.resetTimer === undefined) return;
    window.clearTimeout(this.resetTimer);
    this.resetTimer = undefined;
  }

  private readonly handleFormReset = (): void => {
    if (this.selectionOwner) return;
    this.clearResetTimer();
    this.resetTimer = window.setTimeout(() => {
      if (!this.controlled) {
        this.checkedState = this.initialChecked;
      }
      this.render();
      for (const subscriber of [...this.syncSubscribers]) subscriber();
      this.resetTimer = undefined;
    }, 0);
  };

  private observeInputAssociation(): void {
    if (typeof MutationObserver === "undefined") return;

    this.inputAssociationObserver = new MutationObserver(() => this.bindFormReset());
    this.inputAssociationObserver.observe(this.elements.input, {
      attributeFilter: ["form"],
      attributes: true,
    });
  }
}

class RadioCheckedChangeDetailsImpl implements RadioCheckedChangeDetails {
  readonly checked: boolean;
  readonly event?: Event;
  readonly previousChecked: boolean;
  readonly reason: RadioCheckedChangeReason;
  readonly trigger?: Element;

  private canceled = false;
  private accepted = false;
  private readonly acceptedCallbacks = new Set<() => void>();

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
    reason: RadioCheckedChangeReason;
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
    if (this.accepted) return;
    this.canceled = true;
    this.acceptedCallbacks.clear();
  }

  onAccepted(callback: () => void): void {
    if (this.canceled) return;
    if (this.accepted) {
      callback();
      return;
    }
    this.acceptedCallbacks.add(callback);
  }

  accept(): unknown[] {
    if (this.canceled || this.accepted) return [];
    this.accepted = true;
    const callbacks = [...this.acceptedCallbacks];
    this.acceptedCallbacks.clear();
    const errors: unknown[] = [];
    callbacks.forEach((callback) => {
      try {
        callback();
      } catch (error) {
        errors.push(error);
      }
    });
    return errors;
  }
}

function getRadioElements(root: HTMLElement): RadioElements {
  const { input, runtimeOwned } = getOrCreateInput(root);

  return {
    indicators: Array.from(root.querySelectorAll<HTMLElement>(RADIO_INDICATOR_SELECTOR))
      .filter((element) => isOwnedByRoot(element, root))
      .map((element) => ({
        element,
        keepMounted: readBooleanAttribute(element, RADIO_INDICATOR_KEEP_MOUNTED_ATTRIBUTE),
      })),
    input,
    inputRuntimeOwned: runtimeOwned,
  };
}

function getOrCreateInput(root: HTMLElement): {
  input: HTMLInputElement;
  runtimeOwned: boolean;
} {
  const existingInput = getExistingInput(root);
  if (existingInput) {
    placeInput(root, existingInput);
    return { input: existingInput, runtimeOwned: false };
  }

  const input = document.createElement("input");
  input.setAttribute(RADIO_INPUT_ATTRIBUTE, "");
  placeInput(root, input);
  return { input, runtimeOwned: true };
}

function getExistingInput(root: HTMLElement): HTMLInputElement | null {
  const existingInput = Array.from(
    root.querySelectorAll<HTMLInputElement>(RADIO_INPUT_SELECTOR),
  ).find((input) => isOwnedByRoot(input, root));
  if (existingInput) return existingInput;

  const sibling = root.nextElementSibling;
  if (sibling instanceof HTMLInputElement && sibling.matches(RADIO_INPUT_SELECTOR)) return sibling;

  return null;
}

function placeInput(root: HTMLElement, input: HTMLInputElement): void {
  if (root instanceof HTMLButtonElement && root.parentNode) {
    root.after(input);
    return;
  }

  if (input.parentElement !== root) {
    root.append(input);
  }
}

function isOwnedByRoot(element: Element, root: HTMLElement): boolean {
  return element.closest(`[${RADIO_ROOT_ATTRIBUTE}]`) === root;
}

function readOptionalAttribute(element: HTMLElement, name: string): string | undefined {
  return element.getAttribute(name) ?? undefined;
}

function setRadioStateAttributes(
  element: HTMLElement,
  state: {
    checked: boolean;
    disabled: boolean;
    readOnly: boolean;
    required: boolean;
  },
): void {
  setBooleanAttribute(element, "data-checked", state.checked);
  setBooleanAttribute(element, "data-unchecked", !state.checked);
  setBooleanAttribute(element, "data-disabled", state.disabled);
  setBooleanAttribute(element, "data-readonly", state.readOnly);
  setBooleanAttribute(element, "data-required", state.required);
}
