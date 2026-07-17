import { assertHTMLElement, setBooleanAttribute } from "../../internal/dom";

export type ButtonOptions = {
  disabled?: boolean;
};

export type ButtonInstance = {
  readonly root: HTMLButtonElement;
  destroy(): void;
  setDisabled(disabled: boolean): void;
};

const BUTTON_ROOT_ATTRIBUTE = "data-sw-button";

const instances = new WeakMap<HTMLButtonElement, ButtonController>();

export function createButton(root: HTMLButtonElement, options: ButtonOptions = {}): ButtonInstance {
  assertHTMLElement(root, "createButton root");

  if (!(root instanceof HTMLButtonElement)) {
    throw new TypeError("createButton root must be an HTMLButtonElement.");
  }

  const existing = instances.get(root);
  if (existing) return existing;

  const instance = new ButtonController(root, options);
  instances.set(root, instance);
  return instance;
}

class ButtonController implements ButtonInstance {
  readonly root: HTMLButtonElement;

  private readonly abortController = new AbortController();
  private destroyed = false;
  private disabled: boolean;

  constructor(root: HTMLButtonElement, options: ButtonOptions) {
    this.root = root;
    this.disabled = options.disabled ?? isDisabled(root);

    this.render();
    this.bindEvents();
  }

  destroy(): void {
    if (this.destroyed) return;

    this.abortController.abort();
    instances.delete(this.root);
    this.destroyed = true;
  }

  setDisabled(disabled: boolean): void {
    if (this.disabled === disabled) return;

    this.disabled = disabled;
    this.render();
  }

  private render(): void {
    this.root.setAttribute(BUTTON_ROOT_ATTRIBUTE, "");
    this.root.disabled = false;
    setBooleanAttribute(this.root, "data-disabled", this.disabled);
    setAriaDisabled(this.root, this.disabled);
  }

  private bindEvents(): void {
    const { signal } = this.abortController;

    this.root.addEventListener("click", this.handleActivationEvent, { capture: true, signal });
    this.root.addEventListener("mousedown", this.handleActivationEvent, { capture: true, signal });
    this.root.addEventListener("pointerdown", this.handleActivationEvent, {
      capture: true,
      signal,
    });
    this.root.addEventListener("keydown", this.handleKeyboardEvent, { capture: true, signal });
    this.root.addEventListener("keyup", this.handleKeyboardEvent, { capture: true, signal });
  }

  private readonly handleActivationEvent = (event: Event): void => {
    this.suppressDisabledEvent(event);
  };

  private readonly handleKeyboardEvent = (event: KeyboardEvent): void => {
    if (event.target !== this.root || !isActivationKey(event)) return;

    this.suppressDisabledEvent(event);
  };

  private suppressDisabledEvent(event: Event): void {
    if (!this.disabled) return;

    event.preventDefault();
    event.stopImmediatePropagation();
  }
}

function isDisabled(button: HTMLButtonElement): boolean {
  return (
    button.disabled ||
    button.hasAttribute("data-disabled") ||
    button.getAttribute("aria-disabled") === "true"
  );
}

function setAriaDisabled(button: HTMLButtonElement, disabled: boolean): void {
  if (disabled) {
    button.setAttribute("aria-disabled", "true");
    return;
  }

  button.removeAttribute("aria-disabled");
}

function isActivationKey(event: KeyboardEvent): boolean {
  return event.key === "Enter" || event.key === " ";
}
