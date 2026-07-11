import { assertHTMLElement, readBooleanAttribute, setBooleanAttribute } from "../../internal/dom";

export type ButtonOptions = {
  disabled?: boolean;
  focusableWhenDisabled?: boolean;
  nativeButton?: boolean;
};

export type ButtonInstance = {
  readonly root: HTMLElement;
  destroy(): void;
};

const BUTTON_ROOT_ATTRIBUTE = "data-sw-button";
const BUTTON_FOCUSABLE_WHEN_DISABLED_ATTRIBUTE = "data-focusable-when-disabled";
const BUTTON_NATIVE_ATTRIBUTE = "data-native";

const instances = new WeakMap<HTMLElement, ButtonController>();

export function createButton(root: HTMLElement, options: ButtonOptions = {}): ButtonInstance {
  assertHTMLElement(root, "createButton root");

  const existing = instances.get(root);
  if (existing) return existing;

  const instance = new ButtonController(root, options);
  instances.set(root, instance);
  return instance;
}

class ButtonController implements ButtonInstance {
  readonly root: HTMLElement;

  private readonly abortController = new AbortController();
  private readonly disabled: boolean;
  private readonly focusableWhenDisabled: boolean;
  private readonly nativeButton: boolean;
  private destroyed = false;

  constructor(root: HTMLElement, options: ButtonOptions) {
    this.root = root;
    this.disabled = options.disabled ?? isDisabled(root);
    this.focusableWhenDisabled =
      options.focusableWhenDisabled ??
      readBooleanAttribute(root, BUTTON_FOCUSABLE_WHEN_DISABLED_ATTRIBUTE, false);
    this.nativeButton =
      options.nativeButton ??
      readBooleanAttribute(root, BUTTON_NATIVE_ATTRIBUTE, root instanceof HTMLButtonElement);

    this.render();
    this.bindEvents();
  }

  destroy(): void {
    if (this.destroyed) return;

    this.abortController.abort();
    instances.delete(this.root);
    this.destroyed = true;
  }

  private render(): void {
    this.root.setAttribute(BUTTON_ROOT_ATTRIBUTE, "");
    setBooleanAttribute(this.root, "data-disabled", this.disabled);

    if (this.root instanceof HTMLButtonElement) {
      if (!this.root.getAttribute("type")) {
        this.root.setAttribute("type", "button");
      }

      this.root.disabled = this.disabled && !this.focusableWhenDisabled;
      setAriaDisabled(this.root, this.disabled && this.focusableWhenDisabled);
      return;
    }

    if (this.isLink()) {
      this.renderLink();
      return;
    }

    if (!this.nativeButton) {
      if (!this.root.getAttribute("role")) {
        this.root.setAttribute("role", "button");
      }

      if (!this.root.hasAttribute("tabindex")) {
        this.root.tabIndex = this.disabled && !this.focusableWhenDisabled ? -1 : 0;
      }
    }

    setAriaDisabled(this.root, this.disabled);
  }

  private renderLink(): void {
    setAriaDisabled(this.root, this.disabled);

    if (this.disabled && !this.focusableWhenDisabled && !this.root.hasAttribute("tabindex")) {
      this.root.tabIndex = -1;
    }
  }

  private bindEvents(): void {
    const { signal } = this.abortController;

    this.root.addEventListener("click", this.handleClick, { capture: true, signal });
    this.root.addEventListener("mousedown", this.handleMouseDown, { capture: true, signal });
    this.root.addEventListener("pointerdown", this.handlePointerDown, { capture: true, signal });
    this.root.addEventListener("keydown", this.handleKeyDown, { capture: true, signal });
    this.root.addEventListener("keyup", this.handleKeyUp, { capture: true, signal });
  }

  private readonly handleClick = (event: MouseEvent): void => {
    this.suppressDisabledEvent(event);
  };

  private readonly handleMouseDown = (event: MouseEvent): void => {
    this.suppressDisabledEvent(event);
  };

  private readonly handlePointerDown = (event: PointerEvent): void => {
    this.suppressDisabledEvent(event);
  };

  private readonly handleKeyDown = (event: KeyboardEvent): void => {
    if (this.suppressDisabledKeyboardEvent(event)) return;
    if (!this.shouldHandleKeyboardEvent(event)) return;

    if (event.key === "Enter") {
      event.preventDefault();
      this.root.click();
      return;
    }

    if (event.key === " ") {
      event.preventDefault();
    }
  };

  private readonly handleKeyUp = (event: KeyboardEvent): void => {
    if (this.suppressDisabledKeyboardEvent(event)) return;
    if (!this.shouldHandleKeyboardEvent(event)) return;

    if (event.key === " ") {
      event.preventDefault();
      this.root.click();
    }
  };

  private shouldHandleKeyboardEvent(event: KeyboardEvent): boolean {
    if (event.target !== this.root) return false;
    if (this.root instanceof HTMLButtonElement) return false;
    if (this.isLink()) return false;

    return !this.nativeButton && (event.key === "Enter" || event.key === " ");
  }

  private suppressDisabledEvent(event: Event): boolean {
    if (!this.disabled) return false;

    event.preventDefault();
    event.stopImmediatePropagation();
    return true;
  }

  private suppressDisabledKeyboardEvent(event: KeyboardEvent): boolean {
    if (!this.disabled) return false;
    if (event.target !== this.root) return false;
    if (!isActivationKey(event)) return false;

    event.preventDefault();
    event.stopImmediatePropagation();
    return true;
  }

  private isLink(): boolean {
    return this.root instanceof HTMLAnchorElement && this.root.hasAttribute("href");
  }
}

function isDisabled(element: HTMLElement): boolean {
  return (
    (element instanceof HTMLButtonElement && element.disabled) ||
    element.hasAttribute("disabled") ||
    element.hasAttribute("data-disabled") ||
    element.getAttribute("aria-disabled") === "true"
  );
}

function setAriaDisabled(element: HTMLElement, disabled: boolean): void {
  if (disabled) {
    element.setAttribute("aria-disabled", "true");
    return;
  }

  element.removeAttribute("aria-disabled");
}

function isActivationKey(event: KeyboardEvent): boolean {
  return event.key === "Enter" || event.key === " ";
}
