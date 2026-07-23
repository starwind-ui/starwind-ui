import { assertHTMLElement, setBooleanAttribute } from "../../internal/dom";
import { attachFormValueRevision } from "../../internal/form-value-revision";

export type InputValue = string | number | string[];

export type InputValueChangeReason = "none";

export type InputValueChangeDetails = {
  readonly event?: Event;
  readonly isCanceled: boolean;
  readonly isPropagationAllowed: boolean;
  readonly previousValue: string;
  readonly reason: InputValueChangeReason;
  readonly trigger?: Element;
  readonly value: string;
  allowPropagation(): void;
  cancel(): void;
};

export type InputOptions = {
  defaultValue?: InputValue;
  disabled?: boolean;
  onValueChange?: (value: string, details: InputValueChangeDetails) => void;
  value?: InputValue;
};

export type InputSetValueOptions = {
  emit?: boolean;
  event?: Event;
  trigger?: Element;
};

export type InputInstance = {
  readonly root: HTMLInputElement;
  destroy(): void;
  getValue(): string;
  setDisabled(disabled: boolean): void;
  setValue(value: InputValue, options?: InputSetValueOptions): void;
  subscribe(event: "valueChange", callback: (details: InputValueChangeDetails) => void): () => void;
};

const INPUT_ROOT_ATTRIBUTE = "data-sw-input";

const instances = new WeakMap<HTMLInputElement, InputController>();

export function createInput(root: HTMLElement, options: InputOptions = {}): InputInstance {
  assertHTMLElement(root, "createInput root");

  if (!(root instanceof HTMLInputElement)) {
    throw new TypeError("createInput root must be an HTMLInputElement.");
  }

  const existing = instances.get(root);
  if (existing) return existing;

  const instance = new InputController(root, options);
  instances.set(root, instance);
  return instance;
}

class InputController implements InputInstance {
  readonly root: HTMLInputElement;

  private readonly abortController = new AbortController();
  private readonly controlled: boolean;
  private readonly initialValue: string;
  private readonly onValueChange?: (value: string, details: InputValueChangeDetails) => void;
  private readonly subscribers = new Set<(details: InputValueChangeDetails) => void>();
  private disabled: boolean;
  private destroyed = false;
  private focused = false;
  private resetTimer: number | undefined;
  private touched = false;
  private value: string;

  constructor(root: HTMLInputElement, options: InputOptions) {
    this.root = root;
    this.controlled = "value" in options;
    this.initialValue = normalizeInputValue(
      options.defaultValue ?? options.value ?? root.defaultValue ?? root.value,
    );
    this.value = normalizeInputValue(options.value ?? options.defaultValue ?? root.value);
    this.disabled = options.disabled ?? root.disabled;
    this.onValueChange = options.onValueChange;

    this.writeRootValue(this.value);
    this.render();
    this.bindEvents();
  }

  destroy(): void {
    if (this.destroyed) return;

    this.abortController.abort();
    this.clearResetTimer();
    instances.delete(this.root);
    this.destroyed = true;
  }

  getValue(): string {
    return this.value;
  }

  setDisabled(disabled: boolean): void {
    if (this.disabled === disabled) return;

    this.disabled = disabled;
    this.render();
  }

  setValue(value: InputValue, options: InputSetValueOptions = {}): void {
    const nextValue = normalizeInputValue(value);
    if (this.value === nextValue) {
      this.writeRootValue(nextValue);
      this.render();
      return;
    }

    const previousValue = this.value;
    this.value = nextValue;
    this.writeRootValue(nextValue);
    this.render();

    if (options.emit === false) return;

    this.emitValueChange({
      event: options.event,
      previousValue,
      trigger: options.trigger,
      value: nextValue,
    });
  }

  subscribe(
    event: "valueChange",
    callback: (details: InputValueChangeDetails) => void,
  ): () => void {
    if (event !== "valueChange") {
      throw new Error(`Unsupported Input event: ${event}`);
    }

    this.subscribers.add(callback);
    return () => this.subscribers.delete(callback);
  }

  private bindEvents(): void {
    const { signal } = this.abortController;

    this.root.addEventListener("input", this.handleInput, { signal });
    this.root.addEventListener("focus", this.handleFocus, { signal });
    this.root.addEventListener("blur", this.handleBlur, { signal });
    this.root.form?.addEventListener("reset", this.handleFormReset, { signal });
  }

  private readonly handleInput = (event: Event): void => {
    const nextValue = this.root.value;
    const previousValue = this.value;

    if (!this.controlled) {
      this.value = nextValue;
      this.render();
    } else {
      this.render(nextValue);
    }

    if (nextValue === previousValue) return;

    this.emitValueChange({
      event,
      previousValue,
      trigger: event.target instanceof Element ? event.target : undefined,
      value: nextValue,
    });
  };

  private readonly handleFocus = (): void => {
    this.focused = true;
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
      this.value = this.root.value;
      this.render();
      this.resetTimer = undefined;
    }, 0);
  };

  private render(valueOverride?: string): void {
    const renderedValue = valueOverride ?? this.value;

    this.root.setAttribute(INPUT_ROOT_ATTRIBUTE, "");
    if (this.root.disabled !== this.disabled) {
      this.root.disabled = this.disabled;
    }

    setBooleanAttribute(this.root, "data-disabled", this.disabled);
    setBooleanAttribute(this.root, "data-dirty", renderedValue !== this.initialValue);
    setBooleanAttribute(this.root, "data-filled", renderedValue.length > 0);
    setBooleanAttribute(this.root, "data-focused", this.focused);
    setBooleanAttribute(this.root, "data-touched", this.touched);
  }

  private clearResetTimer(): void {
    if (this.resetTimer === undefined) return;

    window.clearTimeout(this.resetTimer);
    this.resetTimer = undefined;
  }

  private writeRootValue(value: string): void {
    if (this.root.type === "file" && value !== "") return;

    this.root.value = value;
  }

  private emitValueChange({
    event,
    previousValue,
    trigger,
    value,
  }: {
    event?: Event;
    previousValue: string;
    trigger?: Element;
    value: string;
  }): void {
    const details = new InputValueChangeDetailsImpl({
      event,
      previousValue,
      trigger,
      value,
    });

    attachFormValueRevision(details, event);

    this.root.dispatchEvent(
      new CustomEvent("starwind:value-change", {
        bubbles: true,
        detail: details,
      }),
    );
    this.onValueChange?.(value, details);
    this.subscribers.forEach((callback) => callback(details));
  }
}

class InputValueChangeDetailsImpl implements InputValueChangeDetails {
  readonly event?: Event;
  readonly previousValue: string;
  readonly reason = "none" satisfies InputValueChangeReason;
  readonly trigger?: Element;
  readonly value: string;

  private canceled = false;
  private propagationAllowed = false;

  constructor({
    event,
    previousValue,
    trigger,
    value,
  }: {
    event?: Event;
    previousValue: string;
    trigger?: Element;
    value: string;
  }) {
    this.event = event;
    this.previousValue = previousValue;
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

function normalizeInputValue(value: InputValue | undefined): string {
  if (Array.isArray(value)) return value.join(",");
  if (value === undefined) return "";
  return String(value);
}
