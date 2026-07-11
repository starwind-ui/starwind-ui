import {
  type DynamicCollectionObserver,
  observeDynamicCollection,
} from "../../internal/collection";
import {
  assertHTMLElement,
  readBooleanAttribute,
  readStringOrStringArrayAttribute,
  setBooleanAttribute,
} from "../../internal/dom";
import { dispatchCustomEvent } from "../../internal/events";
import { createToggle, type ToggleInstance, type TogglePressedChangeDetails } from "../toggle";

export type ToggleGroupValue = string[];
export type ToggleGroupOrientation = "horizontal" | "vertical";
export type ToggleGroupValueChangeReason = "none" | "imperative-action";

export type ToggleGroupValueChangeDetails = {
  readonly event?: Event;
  readonly isCanceled: boolean;
  readonly isPropagationAllowed: boolean;
  readonly previousValue: ToggleGroupValue;
  readonly pressed: boolean;
  readonly reason: ToggleGroupValueChangeReason;
  readonly toggleValue: string;
  readonly trigger?: Element;
  readonly value: ToggleGroupValue;
  allowPropagation(): void;
  cancel(): void;
};

export type ToggleGroupOptions = {
  defaultValue?: ToggleGroupValue;
  disabled?: boolean;
  loopFocus?: boolean;
  multiple?: boolean;
  onValueChange?: (value: ToggleGroupValue, details: ToggleGroupValueChangeDetails) => void;
  orientation?: ToggleGroupOrientation;
  value?: ToggleGroupValue;
};

export type ToggleGroupSetValueOptions = {
  emit?: boolean;
};

export type ToggleGroupInstance = {
  readonly root: HTMLElement;
  destroy(): void;
  getValue(): ToggleGroupValue;
  refresh(): void;
  setDisabled(disabled: boolean): void;
  setLoopFocus(loopFocus: boolean): void;
  setMultiple(multiple: boolean): void;
  setOrientation(orientation: ToggleGroupOrientation): void;
  setValue(value: ToggleGroupValue, options?: ToggleGroupSetValueOptions): void;
  subscribe(
    event: "valueChange",
    callback: (details: ToggleGroupValueChangeDetails) => void,
  ): () => void;
};

type ToggleGroupItem = {
  ownDisabled: boolean;
  root: HTMLElement;
  toggle: ToggleInstance;
  value: string;
};

const TOGGLE_GROUP_ROOT_ATTRIBUTE = "data-sw-toggle-group";
const TOGGLE_GROUP_DEFAULT_VALUE_ATTRIBUTE = "data-default-value";
const TOGGLE_GROUP_DISABLED_ATTRIBUTE = "data-disabled";
const TOGGLE_GROUP_LOOP_FOCUS_ATTRIBUTE = "data-loop-focus";
const TOGGLE_GROUP_MULTIPLE_ATTRIBUTE = "data-multiple";
const TOGGLE_GROUP_ORIENTATION_ATTRIBUTE = "data-orientation";
const TOGGLE_GROUP_VALUE_ATTRIBUTE = "data-value";
const TOGGLE_ROOT_ATTRIBUTE = "data-sw-toggle";
const TOGGLE_VALUE_ATTRIBUTE = "data-value";

const instances = new WeakMap<HTMLElement, ToggleGroupController>();

export function createToggleGroup(
  root: HTMLElement,
  options: ToggleGroupOptions = {},
): ToggleGroupInstance {
  assertHTMLElement(root, "createToggleGroup root");

  const existing = instances.get(root);
  if (existing) return existing;

  const instance = new ToggleGroupController(root, options);
  instances.set(root, instance);
  return instance;
}

class ToggleGroupController implements ToggleGroupInstance {
  readonly root: HTMLElement;

  private readonly abortController = new AbortController();
  private readonly collectionObserver: DynamicCollectionObserver;
  private readonly controlled: boolean;
  private readonly itemOwnDisabled = new WeakMap<HTMLElement, boolean>();
  private readonly onValueChange?: (
    value: ToggleGroupValue,
    details: ToggleGroupValueChangeDetails,
  ) => void;
  private readonly subscribers = new Set<(details: ToggleGroupValueChangeDetails) => void>();
  private destroyed = false;
  private disabled: boolean;
  private items: ToggleGroupItem[] = [];
  private loopFocus: boolean;
  private multiple: boolean;
  private orientation: ToggleGroupOrientation;
  private value: ToggleGroupValue;

  constructor(root: HTMLElement, options: ToggleGroupOptions) {
    this.root = root;
    this.controlled = Object.hasOwn(options, "value");
    this.disabled = options.disabled ?? readBooleanAttribute(root, TOGGLE_GROUP_DISABLED_ATTRIBUTE);
    this.loopFocus =
      options.loopFocus ?? readBooleanAttribute(root, TOGGLE_GROUP_LOOP_FOCUS_ATTRIBUTE, true);
    this.multiple = options.multiple ?? readBooleanAttribute(root, TOGGLE_GROUP_MULTIPLE_ATTRIBUTE);
    this.onValueChange = options.onValueChange;
    this.orientation =
      options.orientation ??
      readOrientation(root.getAttribute(TOGGLE_GROUP_ORIENTATION_ATTRIBUTE)) ??
      "horizontal";
    this.value = normalizeToggleGroupValue(
      this.controlled
        ? options.value
        : (options.defaultValue ??
            readStringOrStringArrayAttribute(root, TOGGLE_GROUP_DEFAULT_VALUE_ATTRIBUTE) ??
            readStringOrStringArrayAttribute(root, TOGGLE_GROUP_VALUE_ATTRIBUTE)),
      this.multiple,
    );

    this.bindEvents();
    this.collectionObserver = observeDynamicCollection({
      attributeFilter: [
        TOGGLE_ROOT_ATTRIBUTE,
        TOGGLE_VALUE_ATTRIBUTE,
        "aria-disabled",
        "data-disabled",
        "disabled",
      ],
      onChange: (mutations) => {
        this.applyItemOwnDisabledMutations(mutations);
        this.refresh();
      },
      root,
    });
    this.refresh();
  }

  destroy(): void {
    if (this.destroyed) return;

    this.abortController.abort();
    this.collectionObserver.disconnect();
    this.subscribers.clear();
    instances.delete(this.root);
    this.destroyed = true;
  }

  getValue(): ToggleGroupValue {
    return [...this.value];
  }

  refresh(): void {
    if (this.destroyed) return;

    this.refreshItems();
    this.reconcileValue();
    this.render();
  }

  setDisabled(disabled: boolean): void {
    if (this.disabled === disabled) return;

    this.disabled = disabled;
    this.render();
  }

  setLoopFocus(loopFocus: boolean): void {
    if (this.loopFocus === loopFocus) return;

    this.loopFocus = loopFocus;
    this.render();
  }

  setMultiple(multiple: boolean): void {
    if (this.multiple === multiple) return;

    this.multiple = multiple;
    this.value = normalizeToggleGroupValue(this.value, this.multiple);
    this.render();
  }

  setOrientation(orientation: ToggleGroupOrientation): void {
    if (this.orientation === orientation) return;

    this.orientation = orientation;
    this.render();
  }

  setValue(value: ToggleGroupValue, options: ToggleGroupSetValueOptions = {}): void {
    const nextValue = normalizeToggleGroupValue(value, this.multiple);
    const previousValue = this.value;

    if (options.emit === false) {
      this.value = nextValue;
      this.render();
      return;
    }

    const details = new ToggleGroupValueChangeDetailsImpl({
      pressed: false,
      previousValue,
      reason: "imperative-action",
      toggleValue: "",
      value: nextValue,
    });

    this.notify(details);
    if (details.isCanceled) {
      this.render();
      return;
    }

    this.value = nextValue;
    this.render();
  }

  subscribe(
    event: "valueChange",
    callback: (details: ToggleGroupValueChangeDetails) => void,
  ): () => void {
    if (event !== "valueChange") {
      throw new Error(`Unsupported ToggleGroup event: ${event}`);
    }

    this.subscribers.add(callback);
    return () => {
      this.subscribers.delete(callback);
    };
  }

  private bindEvents(): void {
    const { signal } = this.abortController;

    this.root.addEventListener("starwind:pressed-change", this.handleTogglePressedChange, {
      signal,
    });
    this.root.addEventListener("keydown", this.handleKeyDown, { signal });
    this.root.addEventListener("focusin", this.handleFocusIn, { signal });
  }

  private refreshItems(): void {
    this.items = Array.from(this.root.querySelectorAll<HTMLElement>(`[${TOGGLE_ROOT_ATTRIBUTE}]`))
      .filter((toggleRoot) => toggleRoot.closest(`[${TOGGLE_GROUP_ROOT_ATTRIBUTE}]`) === this.root)
      .map((toggleRoot, index) => {
        const value = readToggleValue(toggleRoot, index);
        const ownDisabled = this.getItemOwnDisabled(toggleRoot);
        const toggle = createToggle(toggleRoot, {
          disabled: this.disabled || ownDisabled,
          pressed: this.value.includes(value),
          value,
        });

        if (!toggleRoot.hasAttribute(TOGGLE_VALUE_ATTRIBUTE)) {
          toggleRoot.setAttribute(TOGGLE_VALUE_ATTRIBUTE, value);
        }

        return {
          ownDisabled,
          root: toggleRoot,
          toggle,
          value,
        };
      });
  }

  private getItemOwnDisabled(toggleRoot: HTMLElement): boolean {
    const existing = this.itemOwnDisabled.get(toggleRoot);
    if (existing !== undefined) return existing;

    const ownDisabled = isToggleDisabled(toggleRoot);
    this.itemOwnDisabled.set(toggleRoot, ownDisabled);
    return ownDisabled;
  }

  private applyItemOwnDisabledMutations(mutations: MutationRecord[]): void {
    for (const mutation of mutations) {
      if (mutation.type !== "attributes") continue;
      if (!(mutation.target instanceof HTMLElement)) continue;
      if (
        mutation.attributeName !== "aria-disabled" &&
        mutation.attributeName !== "data-disabled" &&
        mutation.attributeName !== "disabled"
      ) {
        continue;
      }

      const toggleRoot = mutation.target.closest<HTMLElement>(`[${TOGGLE_ROOT_ATTRIBUTE}]`);
      if (!toggleRoot || toggleRoot.closest(`[${TOGGLE_GROUP_ROOT_ATTRIBUTE}]`) !== this.root) {
        continue;
      }

      this.itemOwnDisabled.set(toggleRoot, isToggleDisabled(toggleRoot));
    }
  }

  private readonly handleTogglePressedChange = (event: Event): void => {
    if (!(event instanceof CustomEvent)) return;
    if (!(event.target instanceof HTMLElement)) return;

    const toggleRoot = event.target.closest<HTMLElement>(`[${TOGGLE_ROOT_ATTRIBUTE}]`);
    if (!toggleRoot) return;
    if (toggleRoot.closest(`[${TOGGLE_GROUP_ROOT_ATTRIBUTE}]`) !== this.root) return;

    const item = this.items.find((candidate) => candidate.root === toggleRoot);
    if (!item) return;

    const pressedDetails = event.detail as TogglePressedChangeDetails;
    if (pressedDetails.isCanceled || event.defaultPrevented) return;

    if (this.disabled || item.ownDisabled) {
      pressedDetails.cancel();
      return;
    }

    const previousValue = this.value;
    const nextValue = this.getNextValue(item.value, pressedDetails.pressed);
    const details = new ToggleGroupValueChangeDetailsImpl({
      event: pressedDetails.event,
      pressed: pressedDetails.pressed,
      previousValue,
      reason: "none",
      toggleValue: item.value,
      trigger: pressedDetails.trigger ?? item.root,
      value: nextValue,
    });

    this.notify(details);

    if (details.isCanceled || this.controlled) {
      pressedDetails.cancel();
      this.render();
      return;
    }

    this.value = nextValue;
    this.render();
  };

  private readonly handleKeyDown = (event: KeyboardEvent): void => {
    if (!(event.target instanceof HTMLElement)) return;

    const currentIndex = this.items.findIndex((item) => item.root === event.target);
    if (currentIndex < 0) return;

    const nextIndex = this.getNextFocusableIndex(currentIndex, event.key);
    if (nextIndex < 0) return;

    event.preventDefault();
    this.setFocusableItem(nextIndex);
    this.items[nextIndex]?.root.focus();
  };

  private readonly handleFocusIn = (event: FocusEvent): void => {
    if (!(event.target instanceof HTMLElement)) return;

    const focusedIndex = this.items.findIndex((item) => item.root === event.target);
    if (focusedIndex >= 0) {
      this.setFocusableItem(focusedIndex);
    }
  };

  private getNextValue(toggleValue: string, pressed: boolean): ToggleGroupValue {
    if (this.multiple) {
      if (pressed) {
        return this.value.includes(toggleValue) ? [...this.value] : [...this.value, toggleValue];
      }

      return this.value.filter((value) => value !== toggleValue);
    }

    return pressed ? [toggleValue] : [];
  }

  private getNextFocusableIndex(currentIndex: number, key: string): number {
    const enabledIndexes = this.items
      .map((item, index) => ({ disabled: this.disabled || item.ownDisabled, index }))
      .filter((item) => !item.disabled)
      .map((item) => item.index);

    if (enabledIndexes.length === 0) return -1;

    if (key === "Home") return enabledIndexes[0] ?? -1;
    if (key === "End") return enabledIndexes.at(-1) ?? -1;

    const direction = getKeyboardDirection(this.orientation, key);
    if (direction === 0) return -1;

    const enabledPosition = enabledIndexes.indexOf(currentIndex);
    if (enabledPosition < 0) return enabledIndexes[0] ?? -1;

    const nextPosition = enabledPosition + direction;
    if (nextPosition >= 0 && nextPosition < enabledIndexes.length) {
      return enabledIndexes[nextPosition] ?? -1;
    }

    if (!this.loopFocus) return -1;
    return direction > 0 ? (enabledIndexes[0] ?? -1) : (enabledIndexes.at(-1) ?? -1);
  }

  private render(): void {
    this.root.setAttribute(TOGGLE_GROUP_ROOT_ATTRIBUTE, "");
    this.root.setAttribute("role", "group");
    this.root.setAttribute(TOGGLE_GROUP_ORIENTATION_ATTRIBUTE, this.orientation);
    this.root.setAttribute(TOGGLE_GROUP_VALUE_ATTRIBUTE, JSON.stringify(this.value));

    setBooleanAttribute(this.root, "data-disabled", this.disabled);
    setBooleanAttribute(this.root, TOGGLE_GROUP_DISABLED_ATTRIBUTE, this.disabled);
    setBooleanAttribute(this.root, TOGGLE_GROUP_MULTIPLE_ATTRIBUTE, this.multiple);
    if (this.loopFocus) {
      this.root.removeAttribute(TOGGLE_GROUP_LOOP_FOCUS_ATTRIBUTE);
    } else {
      this.root.setAttribute(TOGGLE_GROUP_LOOP_FOCUS_ATTRIBUTE, "false");
    }

    this.items.forEach((item) => {
      const disabled = this.disabled || item.ownDisabled;
      item.toggle.setDisabled(disabled);
      item.toggle.setPressed(this.value.includes(item.value), { emit: false });
    });

    const focusableIndex = this.getInitialFocusableIndex();
    if (focusableIndex >= 0) {
      this.setFocusableItem(focusableIndex);
    }

    this.collectionObserver.flush();
  }

  private reconcileValue(): void {
    if (this.controlled) return;

    const itemValues = new Set(this.items.map((item) => item.value));
    this.value = this.value.filter((value) => itemValues.has(value));
  }

  private getInitialFocusableIndex(): number {
    const focusedIndex = this.items.findIndex((item) => item.root === document.activeElement);
    if (focusedIndex >= 0 && !this.items[focusedIndex]?.ownDisabled && !this.disabled) {
      return focusedIndex;
    }

    const pressedIndex = this.items.findIndex(
      (item) => !this.disabled && !item.ownDisabled && this.value.includes(item.value),
    );
    if (pressedIndex >= 0) return pressedIndex;

    return this.items.findIndex((item) => !this.disabled && !item.ownDisabled);
  }

  private setFocusableItem(focusableIndex: number): void {
    this.items.forEach((item, index) => {
      item.root.tabIndex = index === focusableIndex && !this.disabled && !item.ownDisabled ? 0 : -1;
    });
  }

  private notify(details: ToggleGroupValueChangeDetails): void {
    const event = dispatchCustomEvent(this.root, "starwind:value-change", details, {
      cancelable: true,
    });
    if (event.defaultPrevented) details.cancel();
    this.onValueChange?.(details.value, details);
    this.subscribers.forEach((subscriber) => subscriber(details));
  }
}

class ToggleGroupValueChangeDetailsImpl implements ToggleGroupValueChangeDetails {
  readonly event?: Event;
  readonly pressed: boolean;
  readonly previousValue: ToggleGroupValue;
  readonly reason: ToggleGroupValueChangeReason;
  readonly toggleValue: string;
  readonly trigger?: Element;
  readonly value: ToggleGroupValue;

  private canceled = false;
  private propagationAllowed = false;

  constructor({
    event,
    pressed,
    previousValue,
    reason,
    toggleValue,
    trigger,
    value,
  }: {
    event?: Event;
    pressed: boolean;
    previousValue: ToggleGroupValue;
    reason: ToggleGroupValueChangeReason;
    toggleValue: string;
    trigger?: Element;
    value: ToggleGroupValue;
  }) {
    this.event = event;
    this.pressed = pressed;
    this.previousValue = [...previousValue];
    this.reason = reason;
    this.toggleValue = toggleValue;
    this.trigger = trigger;
    this.value = [...value];
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

function normalizeToggleGroupValue(
  value: string | readonly string[] | undefined,
  multiple: boolean,
): ToggleGroupValue {
  const values = Array.isArray(value)
    ? unique(value.filter((item) => item.length > 0))
    : typeof value === "string" && value.length > 0
      ? [value]
      : [];

  if (multiple) return values;
  return values.slice(0, 1);
}

function unique(values: readonly string[]): string[] {
  return Array.from(new Set(values));
}

function readOrientation(value: string | null): ToggleGroupOrientation | undefined {
  if (value === "horizontal" || value === "vertical") return value;
  return undefined;
}

function readToggleValue(root: HTMLElement, index: number): string {
  const value = root.getAttribute(TOGGLE_VALUE_ATTRIBUTE);
  if (value) return value;

  return root.id || String(index);
}

function isToggleDisabled(root: HTMLElement): boolean {
  return (
    (root instanceof HTMLButtonElement && root.disabled) ||
    root.hasAttribute("disabled") ||
    root.hasAttribute("data-disabled") ||
    root.getAttribute("aria-disabled") === "true"
  );
}

function getKeyboardDirection(orientation: ToggleGroupOrientation, key: string): -1 | 0 | 1 {
  if (orientation === "vertical") {
    if (key === "ArrowDown") return 1;
    if (key === "ArrowUp") return -1;
    return 0;
  }

  if (key === "ArrowRight") return 1;
  if (key === "ArrowLeft") return -1;
  return 0;
}
