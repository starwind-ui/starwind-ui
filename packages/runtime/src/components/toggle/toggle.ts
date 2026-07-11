import {
  assertHTMLElement,
  ensureId,
  readBooleanAttribute,
  setBooleanAttribute,
} from "../../internal/dom";
import { dispatchCustomEvent } from "../../internal/events";

export type TogglePressedChangeReason = "none";

export type ToggleChangeDetails = {
  pressed: boolean;
  syncGroup?: string;
  toggleId: string;
};

export type TogglePressedChangeDetails = {
  readonly event?: Event;
  readonly isCanceled: boolean;
  readonly isPropagationAllowed: boolean;
  readonly pressed: boolean;
  readonly previousPressed: boolean;
  readonly reason: TogglePressedChangeReason;
  readonly trigger?: Element;
  allowPropagation(): void;
  cancel(): void;
};

export type ToggleOptions = {
  defaultPressed?: boolean;
  disabled?: boolean;
  nativeButton?: boolean;
  onPressedChange?: (pressed: boolean, details: TogglePressedChangeDetails) => void;
  pressed?: boolean;
  syncGroup?: string;
  value?: string;
};

export type ToggleSetPressedOptions = {
  emit?: boolean;
  event?: Event;
  sync?: boolean;
  trigger?: Element;
};

export type ToggleInstance = {
  readonly root: HTMLElement;
  destroy(): void;
  getPressed(): boolean;
  setDisabled(disabled: boolean): void;
  setPressed(pressed: boolean, options?: ToggleSetPressedOptions): void;
  subscribe(
    event: "pressedChange",
    callback: (details: TogglePressedChangeDetails) => void,
  ): () => void;
  toggle(): void;
};

const TOGGLE_ROOT_ATTRIBUTE = "data-sw-toggle";
const TOGGLE_DEFAULT_PRESSED_ATTRIBUTE = "data-default-pressed";
const TOGGLE_DISABLED_ATTRIBUTE = "data-disabled";
const TOGGLE_NATIVE_ATTRIBUTE = "data-native";
const TOGGLE_SYNC_GROUP_ATTRIBUTE = "data-sync-group";
const TOGGLE_VALUE_ATTRIBUTE = "data-value";

const instances = new WeakMap<HTMLElement, ToggleController>();

export function createToggle(root: HTMLElement, options: ToggleOptions = {}): ToggleInstance {
  assertHTMLElement(root, "createToggle root");

  const existing = instances.get(root);
  if (existing) return existing;

  const instance = new ToggleController(root, options);
  instances.set(root, instance);
  return instance;
}

class ToggleController implements ToggleInstance {
  readonly root: HTMLElement;

  private readonly abortController = new AbortController();
  private readonly controlled: boolean;
  private readonly managesTabIndex: boolean;
  private readonly nativeButton: boolean;
  private readonly onPressedChange?: (
    pressed: boolean,
    details: TogglePressedChangeDetails,
  ) => void;
  private readonly subscribers = new Set<(details: TogglePressedChangeDetails) => void>();
  private readonly syncEventName: string | null;
  private readonly syncGroup: string | null;
  private readonly value?: string;
  private destroyed = false;
  private disabled: boolean;
  private pressedState: boolean;

  constructor(root: HTMLElement, options: ToggleOptions) {
    this.root = root;
    this.controlled = Object.hasOwn(options, "pressed");
    this.disabled = options.disabled ?? isDisabled(root);
    this.managesTabIndex = !root.hasAttribute("tabindex");
    this.nativeButton =
      options.nativeButton ??
      readBooleanAttribute(root, TOGGLE_NATIVE_ATTRIBUTE, root instanceof HTMLButtonElement);
    this.onPressedChange = options.onPressedChange;
    this.syncGroup =
      options.syncGroup ?? readSyncGroup(root.getAttribute(TOGGLE_SYNC_GROUP_ATTRIBUTE));
    this.syncEventName = this.syncGroup ? `starwind-toggle-sync:${this.syncGroup}` : null;
    if (this.syncGroup) {
      ensureId(this.root, "starwind-toggle");
    }
    this.value = options.value ?? readOptionalAttribute(root, TOGGLE_VALUE_ATTRIBUTE);
    this.pressedState = options.pressed ?? options.defaultPressed ?? readInitialPressedState(root);

    this.render();
    this.bindEvents();
  }

  destroy(): void {
    if (this.destroyed) return;

    this.abortController.abort();
    this.subscribers.clear();
    instances.delete(this.root);
    this.destroyed = true;
  }

  getPressed(): boolean {
    return this.pressedState;
  }

  setDisabled(disabled: boolean): void {
    if (this.disabled === disabled) return;

    this.disabled = disabled;
    this.render();
  }

  setPressed(pressed: boolean, options: ToggleSetPressedOptions = {}): void {
    if (this.pressedState === pressed) {
      this.render();
      return;
    }

    const previousPressed = this.pressedState;
    this.pressedState = pressed;
    this.render();

    if (options.emit !== false) {
      this.notify(
        new TogglePressedChangeDetailsImpl({
          event: options.event,
          pressed,
          previousPressed,
          trigger: options.trigger,
        }),
      );

      this.dispatchLegacyChange(pressed);
    }

    if (options.sync ?? options.emit !== false) {
      this.dispatchSyncPressed(pressed);
    }
  }

  subscribe(
    event: "pressedChange",
    callback: (details: TogglePressedChangeDetails) => void,
  ): () => void {
    if (event !== "pressedChange") {
      throw new Error(`Unsupported Toggle event: ${event}`);
    }

    this.subscribers.add(callback);
    return () => {
      this.subscribers.delete(callback);
    };
  }

  toggle(): void {
    this.requestPressed(!this.pressedState);
  }

  private bindEvents(): void {
    const { signal } = this.abortController;

    this.root.addEventListener("click", this.handleClick, { signal });
    this.root.addEventListener("keydown", this.handleKeyDown, { signal });
    this.root.addEventListener("keyup", this.handleKeyUp, { signal });

    if (this.syncEventName) {
      document.addEventListener(this.syncEventName, this.handleSyncEvent, { signal });
    }
  }

  private render(): void {
    this.root.setAttribute(TOGGLE_ROOT_ATTRIBUTE, "");
    this.root.setAttribute("aria-pressed", String(this.pressedState));
    this.root.setAttribute("data-state", this.pressedState ? "on" : "off");

    if (this.value !== undefined) {
      this.root.setAttribute(TOGGLE_VALUE_ATTRIBUTE, this.value);
    }

    if (this.syncGroup) {
      this.root.setAttribute(TOGGLE_SYNC_GROUP_ATTRIBUTE, this.syncGroup);
    } else {
      this.root.removeAttribute(TOGGLE_SYNC_GROUP_ATTRIBUTE);
    }

    setBooleanAttribute(this.root, "data-pressed", this.pressedState);
    setBooleanAttribute(this.root, "data-unpressed", !this.pressedState);
    setBooleanAttribute(this.root, "data-disabled", this.disabled);

    if (this.root instanceof HTMLButtonElement) {
      if (!this.root.getAttribute("type")) {
        this.root.type = "button";
      }

      this.root.disabled = this.disabled;
      return;
    }

    if (!this.nativeButton && !this.root.getAttribute("role")) {
      this.root.setAttribute("role", "button");
    }

    if (this.managesTabIndex) {
      this.root.tabIndex = this.disabled ? -1 : 0;
    }

    if (this.disabled) {
      this.root.setAttribute("aria-disabled", "true");
    } else {
      this.root.removeAttribute("aria-disabled");
    }
  }

  private requestPressed(pressed: boolean, event?: Event, trigger?: Element): void {
    if (this.disabled) return;
    if (pressed === this.pressedState && !this.controlled) return;

    const previousPressed = this.pressedState;
    const details = new TogglePressedChangeDetailsImpl({
      event,
      pressed,
      previousPressed,
      trigger,
    });

    this.notify(details);
    if (details.isCanceled || this.controlled) return;

    this.pressedState = pressed;
    this.render();
    this.dispatchLegacyChange(pressed);
    this.dispatchSyncPressed(pressed);
  }

  private readonly handleSyncEvent = (event: Event): void => {
    if (this.controlled) return;

    const detail = readToggleSyncEventDetail(event);
    if (!detail || detail.sourceId === this.root.id || detail.pressed === this.pressedState) return;

    const previousPressed = this.pressedState;
    const details = new TogglePressedChangeDetailsImpl({
      event,
      pressed: detail.pressed,
      previousPressed,
    });

    this.notify(details);
    if (details.isCanceled) {
      this.render();
      return;
    }

    this.pressedState = detail.pressed;
    this.render();
    this.dispatchLegacyChange(detail.pressed);
  };

  private readonly handleClick = (event: MouseEvent): void => {
    if (this.disabled) {
      event.preventDefault();
      return;
    }

    this.requestPressed(!this.pressedState, event, this.root);
  };

  private readonly handleKeyDown = (event: KeyboardEvent): void => {
    if (!this.shouldHandleKeyboardEvent(event)) return;

    if (this.disabled) {
      event.preventDefault();
      return;
    }

    if (event.key === "Enter") {
      event.preventDefault();
      this.requestPressed(!this.pressedState, event, this.root);
      return;
    }

    if (event.key === " ") {
      event.preventDefault();
    }
  };

  private readonly handleKeyUp = (event: KeyboardEvent): void => {
    if (!this.shouldHandleKeyboardEvent(event) || event.key !== " ") return;

    event.preventDefault();
    this.requestPressed(!this.pressedState, event, this.root);
  };

  private shouldHandleKeyboardEvent(event: KeyboardEvent): boolean {
    if (event.target !== this.root) return false;
    if (this.root instanceof HTMLButtonElement) return false;

    return !this.nativeButton && (event.key === "Enter" || event.key === " ");
  }

  private notify(details: TogglePressedChangeDetails): void {
    this.onPressedChange?.(details.pressed, details);
    this.subscribers.forEach((subscriber) => subscriber(details));
    const event = dispatchCustomEvent(this.root, "starwind:pressed-change", details, {
      cancelable: true,
    });
    if (event.defaultPrevented) details.cancel();
  }

  private dispatchLegacyChange(pressed: boolean): void {
    const detail: ToggleChangeDetails = {
      pressed,
      syncGroup: this.syncGroup ?? undefined,
      toggleId: ensureId(this.root, "starwind-toggle"),
    };

    dispatchCustomEvent(this.root, "starwind-toggle:change", detail, { cancelable: true });
  }

  private dispatchSyncPressed(pressed: boolean): void {
    if (!this.syncEventName) return;

    document.dispatchEvent(
      new CustomEvent(this.syncEventName, {
        detail: {
          pressed,
          sourceId: ensureId(this.root, "starwind-toggle"),
        },
      }),
    );
  }
}

class TogglePressedChangeDetailsImpl implements TogglePressedChangeDetails {
  readonly event?: Event;
  readonly pressed: boolean;
  readonly previousPressed: boolean;
  readonly reason = "none" satisfies TogglePressedChangeReason;
  readonly trigger?: Element;

  private canceled = false;
  private propagationAllowed = false;

  constructor({
    event,
    pressed,
    previousPressed,
    trigger,
  }: {
    event?: Event;
    pressed: boolean;
    previousPressed: boolean;
    trigger?: Element;
  }) {
    this.event = event;
    this.pressed = pressed;
    this.previousPressed = previousPressed;
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

function isDisabled(element: HTMLElement): boolean {
  return (
    (element instanceof HTMLButtonElement && element.disabled) ||
    element.hasAttribute("disabled") ||
    element.hasAttribute(TOGGLE_DISABLED_ATTRIBUTE) ||
    element.getAttribute("aria-disabled") === "true"
  );
}

function readOptionalAttribute(element: HTMLElement, name: string): string | undefined {
  return element.getAttribute(name) ?? undefined;
}

function readSyncGroup(value: string | null): string | null {
  return value && value.trim() !== "" ? value : null;
}

function readToggleSyncEventDetail(
  event: Event,
): { pressed: boolean; sourceId: string } | undefined {
  if (!(event instanceof CustomEvent)) return undefined;

  const detail = event.detail as { pressed?: unknown; sourceId?: unknown } | undefined;
  if (!detail || typeof detail.pressed !== "boolean" || typeof detail.sourceId !== "string") {
    return undefined;
  }

  return { pressed: detail.pressed, sourceId: detail.sourceId };
}

function readInitialPressedState(element: HTMLElement): boolean {
  const ariaPressed = element.getAttribute("aria-pressed");
  if (ariaPressed === "true") return true;
  if (ariaPressed === "false") return false;

  const dataState = element.getAttribute("data-state");
  if (dataState === "on") return true;
  if (dataState === "off") return false;

  if (element.hasAttribute("data-pressed")) return true;
  if (element.hasAttribute("data-unpressed")) return false;

  return readBooleanAttribute(element, TOGGLE_DEFAULT_PRESSED_ATTRIBUTE);
}
