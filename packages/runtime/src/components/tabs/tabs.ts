import {
  assertHTMLElement,
  ensureId,
  readBooleanAttribute,
  setBooleanAttribute,
} from "../../internal/dom";
import { dispatchCustomEvent } from "../../internal/events";

export type TabsValue = string | null;
export type TabsOrientation = "horizontal" | "vertical";
export type TabsActivationDirection = "left" | "right" | "up" | "down" | "none";
export type TabsValueChangeReason =
  | "none"
  | "initial"
  | "disabled"
  | "missing"
  | "imperative-action";

export type TabsValueChangeDetails = {
  readonly activationDirection: TabsActivationDirection;
  readonly event?: Event;
  readonly isCanceled: boolean;
  readonly isPropagationAllowed: boolean;
  readonly previousValue: TabsValue;
  readonly reason: TabsValueChangeReason;
  readonly trigger?: Element;
  readonly value: TabsValue;
  allowPropagation(): void;
  cancel(): void;
};

export type TabsOptions = {
  defaultValue?: TabsValue;
  onValueChange?: (value: TabsValue, details: TabsValueChangeDetails) => void;
  orientation?: TabsOrientation;
  syncKey?: string;
  value?: TabsValue;
};

export type TabsSetValueOptions = {
  emit?: boolean;
  sync?: boolean;
};

export type TabsInstance = {
  readonly root: HTMLElement;
  destroy(): void;
  getValue(): TabsValue;
  refresh(): void;
  setValue(value: TabsValue, options?: TabsSetValueOptions): void;
  subscribe(event: "valueChange", callback: (details: TabsValueChangeDetails) => void): () => void;
};

type TabsTab = {
  disabled: boolean;
  element: HTMLButtonElement;
  index: number;
  value: string;
};

type TabsPanel = {
  element: HTMLElement;
  value: string;
};

type TabsElements = {
  indicators: HTMLElement[];
  list: HTMLElement | null;
  panels: TabsPanel[];
  tabs: TabsTab[];
};

type ValueRequest = {
  event?: Event;
  reason: TabsValueChangeReason;
  trigger?: Element;
};

type RectLike = {
  height: number;
  left: number;
  top: number;
  width: number;
};

const TABS_ROOT_ATTRIBUTE = "data-sw-tabs";
const TABS_LIST_ATTRIBUTE = "data-sw-tabs-list";
const TABS_TAB_ATTRIBUTE = "data-sw-tabs-tab";
const TABS_PANEL_ATTRIBUTE = "data-sw-tabs-panel";
const TABS_INDICATOR_ATTRIBUTE = "data-sw-tabs-indicator";
const TABS_DEFAULT_VALUE_ATTRIBUTE = "data-default-value";
const TABS_SYNC_KEY_ATTRIBUTE = "data-sync-key";
const TABS_VALUE_ATTRIBUTE = "data-value";
const TABS_ORIENTATION_ATTRIBUTE = "data-orientation";
const TABS_DISABLED_ATTRIBUTE = "data-disabled";
const TABS_ACTIVATE_ON_FOCUS_ATTRIBUTE = "data-activate-on-focus";
const TABS_LOOP_FOCUS_ATTRIBUTE = "data-loop-focus";
const TABS_STATE_ATTRIBUTE = "data-state";
const TABS_KEEP_MOUNTED_ATTRIBUTE = "data-keep-mounted";
const TABS_ACTIVATION_DIRECTION_ATTRIBUTE = "data-activation-direction";
const TABS_ACTIVE_TAB_LEFT_CSS_VAR = "--active-tab-left";
const TABS_ACTIVE_TAB_RIGHT_CSS_VAR = "--active-tab-right";
const TABS_ACTIVE_TAB_TOP_CSS_VAR = "--active-tab-top";
const TABS_ACTIVE_TAB_BOTTOM_CSS_VAR = "--active-tab-bottom";
const TABS_ACTIVE_TAB_WIDTH_CSS_VAR = "--active-tab-width";
const TABS_ACTIVE_TAB_HEIGHT_CSS_VAR = "--active-tab-height";

const instances = new WeakMap<HTMLElement, TabsController>();

export function createTabs(root: HTMLElement, options: TabsOptions = {}): TabsInstance {
  assertHTMLElement(root, "createTabs root");

  const existing = instances.get(root);
  if (existing) return existing;

  const instance = new TabsController(root, options);
  instances.set(root, instance);
  return instance;
}

class TabsController implements TabsInstance {
  readonly root: HTMLElement;

  private readonly abortController = new AbortController();
  private readonly controlled: boolean;
  private readonly onValueChange?: (value: TabsValue, details: TabsValueChangeDetails) => void;
  private readonly subscribers = new Set<(details: TabsValueChangeDetails) => void>();
  private readonly storageKey: string | null;
  private readonly syncEventName: string | null;
  private readonly syncKey: string | null;
  private destroyed = false;
  private elements: TabsElements = { indicators: [], list: null, panels: [], tabs: [] };
  private activationDirection: TabsActivationDirection = "none";
  private focusValue: TabsValue = null;
  private orientation: TabsOrientation;
  private value: TabsValue;

  constructor(root: HTMLElement, options: TabsOptions) {
    this.root = root;
    this.controlled = Object.hasOwn(options, "value");
    this.onValueChange = options.onValueChange;
    this.syncKey = options.syncKey ?? readSyncKey(root.getAttribute(TABS_SYNC_KEY_ATTRIBUTE));
    this.storageKey = this.syncKey ? `starwind-tabs-${this.syncKey}` : null;
    this.syncEventName = this.syncKey ? `starwind-tabs-sync:${this.syncKey}` : null;
    this.orientation =
      options.orientation ??
      readOrientation(root.getAttribute(TABS_ORIENTATION_ATTRIBUTE)) ??
      "horizontal";
    this.value = normalizeTabsValue(
      this.controlled
        ? options.value
        : (this.readStoredSyncValue() ??
            options.defaultValue ??
            readNullableValue(root, TABS_DEFAULT_VALUE_ATTRIBUTE) ??
            readNullableValue(root, TABS_VALUE_ATTRIBUTE)),
    );

    this.bindEvents();
    this.refresh();
  }

  destroy(): void {
    if (this.destroyed) return;

    this.abortController.abort();
    this.subscribers.clear();
    instances.delete(this.root);
    this.destroyed = true;
  }

  getValue(): TabsValue {
    return this.value;
  }

  refresh(): void {
    this.orientation =
      readOrientation(this.root.getAttribute(TABS_ORIENTATION_ATTRIBUTE)) ?? this.orientation;
    this.elements = getTabsElements(this.root);
    let fallbackDetails: TabsValueChangeDetailsImpl | undefined;

    if (!this.controlled) {
      const previousValue = this.value;
      const resolved = this.getResolvedUncontrolledValue(this.value);
      this.value = resolved.value;

      if (resolved.value !== previousValue && resolved.reason) {
        this.activationDirection = "none";
        fallbackDetails = new TabsValueChangeDetailsImpl({
          activationDirection: "none",
          cancelable: false,
          previousValue,
          reason: resolved.reason,
          value: resolved.value,
        });
      }
    }

    this.focusValue = this.getResolvedFocusValue();
    this.setupAccessibility();
    this.render();

    if (fallbackDetails) {
      this.notify(fallbackDetails, { cancelable: false });
    }
  }

  setValue(value: TabsValue, options: TabsSetValueOptions = {}): void {
    const previousValue = this.value;
    const nextValue = normalizeTabsValue(value);
    const activationDirection = this.getActivationDirection(previousValue, nextValue);

    if (options.emit !== false) {
      const details = new TabsValueChangeDetailsImpl({
        activationDirection,
        previousValue,
        reason: "imperative-action",
        value: nextValue,
      });

      this.notify(details);
      if (details.isCanceled) {
        this.render();
        return;
      }
    }

    this.value = nextValue;
    this.activationDirection = activationDirection;
    this.focusValue = this.getResolvedFocusValue();
    this.render();
    this.persistSyncValue(nextValue);

    if (options.sync ?? options.emit !== false) {
      this.dispatchSyncValue(nextValue);
    }
  }

  subscribe(event: "valueChange", callback: (details: TabsValueChangeDetails) => void): () => void {
    if (event !== "valueChange") {
      throw new Error(`Unsupported Tabs event: ${event}`);
    }

    this.subscribers.add(callback);
    return () => {
      this.subscribers.delete(callback);
    };
  }

  private bindEvents(): void {
    const { signal } = this.abortController;

    this.root.addEventListener("click", this.handleClick, { signal });
    this.root.addEventListener("focusin", this.handleFocusIn, { signal });
    this.root.addEventListener("keydown", this.handleKeyDown, { signal });

    if (this.syncEventName) {
      document.addEventListener(this.syncEventName, this.handleSyncEvent, { signal });
    }
  }

  private setupAccessibility(): void {
    const { list, panels, tabs } = this.elements;
    const panelByValue = new Map(panels.map((panel) => [panel.value, panel]));

    if (list) {
      list.setAttribute("role", "tablist");
      list.setAttribute(TABS_ORIENTATION_ATTRIBUTE, this.orientation);
      if (this.orientation === "vertical") {
        list.setAttribute("aria-orientation", "vertical");
      } else {
        list.removeAttribute("aria-orientation");
      }
    }

    tabs.forEach((tab, index) => {
      const tabId = ensureId(tab.element, `sw-tabs-tab-${index}`);
      const panel = panelByValue.get(tab.value);

      tab.element.setAttribute("role", "tab");
      tab.element.setAttribute("type", "button");
      tab.element.setAttribute(TABS_VALUE_ATTRIBUTE, tab.value);
      tab.element.setAttribute(TABS_ORIENTATION_ATTRIBUTE, this.orientation);
      tab.element.disabled = tab.disabled;
      setBooleanAttribute(tab.element, TABS_DISABLED_ATTRIBUTE, tab.disabled);

      if (panel) {
        tab.element.setAttribute(
          "aria-controls",
          ensureId(panel.element, `sw-tabs-panel-${index}`),
        );
      } else {
        tab.element.removeAttribute("aria-controls");
      }

      if (panel && !panel.element.getAttribute("aria-labelledby")) {
        panel.element.setAttribute("aria-labelledby", tabId);
      }
    });

    panels.forEach((panel, index) => {
      const tab = tabs.find((candidate) => candidate.value === panel.value);

      panel.element.setAttribute("role", "tabpanel");
      panel.element.setAttribute(TABS_VALUE_ATTRIBUTE, panel.value);
      panel.element.setAttribute(TABS_ORIENTATION_ATTRIBUTE, this.orientation);

      if (tab) {
        panel.element.setAttribute(
          "aria-labelledby",
          ensureId(tab.element, `sw-tabs-tab-${index}`),
        );
      }
    });
  }

  private readonly handleClick = (event: MouseEvent): void => {
    const tab = this.getTabFromEventTarget(event.target);
    if (!tab || tab.disabled) return;

    this.requestValue(tab.value, { event, reason: "none", trigger: tab.element });
  };

  private readonly handleFocusIn = (event: FocusEvent): void => {
    const tab = this.getTabFromEventTarget(event.target);
    if (!tab || tab.disabled) return;

    this.focusValue = tab.value;
    this.render();

    if (this.getActivateOnFocus() && this.value !== tab.value) {
      this.requestValue(tab.value, { event, reason: "none", trigger: tab.element });
    }
  };

  private readonly handleKeyDown = (event: KeyboardEvent): void => {
    const currentTab = this.getTabFromEventTarget(event.target);
    if (!currentTab || currentTab.disabled) return;

    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      this.requestValue(currentTab.value, { event, reason: "none", trigger: currentTab.element });
      return;
    }

    const nextTab = this.getNextFocusableTab(currentTab, event.key);
    if (!nextTab) return;

    event.preventDefault();
    this.focusValue = nextTab.value;
    this.render();
    nextTab.element.focus();

    if (this.getActivateOnFocus()) {
      this.requestValue(nextTab.value, { event, reason: "none", trigger: nextTab.element });
    }
  };

  private requestValue(value: TabsValue, request: ValueRequest): void {
    const nextValue = normalizeTabsValue(value);
    const previousValue = this.value;

    if (nextValue === previousValue) return;
    const activationDirection = this.getActivationDirection(previousValue, nextValue);

    const details = new TabsValueChangeDetailsImpl({
      activationDirection,
      event: request.event,
      previousValue,
      reason: request.reason,
      trigger: request.trigger,
      value: nextValue,
    });

    this.notify(details);

    if (details.isCanceled || this.controlled) {
      this.render();
      return;
    }

    this.value = nextValue;
    this.activationDirection = activationDirection;
    this.focusValue = this.getResolvedFocusValue();
    this.render();
    this.persistAndDispatchSyncValue(nextValue);
  }

  private render(): void {
    this.root.setAttribute(TABS_ROOT_ATTRIBUTE, "");
    this.root.setAttribute(TABS_ORIENTATION_ATTRIBUTE, this.orientation);
    this.root.setAttribute(TABS_VALUE_ATTRIBUTE, serializeTabsValue(this.value));
    this.root.setAttribute(TABS_ACTIVATION_DIRECTION_ATTRIBUTE, this.activationDirection);
    if (this.syncKey) {
      this.root.setAttribute(TABS_SYNC_KEY_ATTRIBUTE, this.syncKey);
    } else {
      this.root.removeAttribute(TABS_SYNC_KEY_ATTRIBUTE);
    }

    this.elements.list?.setAttribute(TABS_ACTIVATION_DIRECTION_ATTRIBUTE, this.activationDirection);

    this.elements.tabs.forEach((tab) => {
      const active = tab.value === this.value;
      const focusable = !tab.disabled && tab.value === this.focusValue;
      const state = active ? "active" : "inactive";

      tab.element.setAttribute(TABS_ACTIVATION_DIRECTION_ATTRIBUTE, this.activationDirection);
      tab.element.setAttribute(TABS_STATE_ATTRIBUTE, state);
      tab.element.setAttribute("aria-selected", String(active));
      tab.element.tabIndex = focusable ? 0 : -1;
      setBooleanAttribute(tab.element, "data-active", active);
      setBooleanAttribute(tab.element, TABS_DISABLED_ATTRIBUTE, tab.disabled);
    });

    this.elements.panels.forEach((panel) => {
      const active = panel.value === this.value;
      const state = active ? "active" : "inactive";

      panel.element.setAttribute(TABS_ACTIVATION_DIRECTION_ATTRIBUTE, this.activationDirection);
      panel.element.setAttribute(TABS_STATE_ATTRIBUTE, state);
      panel.element.setAttribute("tabindex", active ? "0" : "-1");
      panel.element.hidden = !active;
      setBooleanAttribute(panel.element, "data-active", active);
      setBooleanAttribute(
        panel.element,
        TABS_KEEP_MOUNTED_ATTRIBUTE,
        readBooleanAttribute(panel.element, TABS_KEEP_MOUNTED_ATTRIBUTE, false),
      );

      if (active) {
        initializeNestedTabs(panel.element);
      }
    });

    this.elements.indicators.forEach((indicator) => this.renderIndicator(indicator));
  }

  private renderIndicator(indicator: HTMLElement): void {
    const activeTab = this.getTabByValue(this.value);
    const list = this.elements.list;

    indicator.setAttribute("role", "presentation");
    indicator.setAttribute(TABS_ACTIVATION_DIRECTION_ATTRIBUTE, this.activationDirection);
    indicator.setAttribute(TABS_ORIENTATION_ATTRIBUTE, this.orientation);

    if (!activeTab || !list) {
      indicator.hidden = true;
      return;
    }

    const listRect = list.getBoundingClientRect();
    const tabRect = activeTab.element.getBoundingClientRect();
    const left = tabRect.left - listRect.left + list.scrollLeft - list.clientLeft;
    const top = tabRect.top - listRect.top + list.scrollTop - list.clientTop;
    const right = getRectWidth(listRect) - left - getRectWidth(tabRect);
    const bottom = getRectHeight(listRect) - top - getRectHeight(tabRect);

    indicator.style.setProperty(TABS_ACTIVE_TAB_LEFT_CSS_VAR, `${left}px`);
    indicator.style.setProperty(TABS_ACTIVE_TAB_RIGHT_CSS_VAR, `${right}px`);
    indicator.style.setProperty(TABS_ACTIVE_TAB_TOP_CSS_VAR, `${top}px`);
    indicator.style.setProperty(TABS_ACTIVE_TAB_BOTTOM_CSS_VAR, `${bottom}px`);
    indicator.style.setProperty(TABS_ACTIVE_TAB_WIDTH_CSS_VAR, `${getRectWidth(tabRect)}px`);
    indicator.style.setProperty(TABS_ACTIVE_TAB_HEIGHT_CSS_VAR, `${getRectHeight(tabRect)}px`);
    indicator.hidden = false;
  }

  private getResolvedUncontrolledValue(value: TabsValue): {
    reason?: Exclude<TabsValueChangeReason, "none" | "imperative-action">;
    value: TabsValue;
  } {
    const selectedTab = this.getTabByValue(value);

    if (selectedTab && !selectedTab.disabled) return { value };

    const fallbackValue = this.elements.tabs.find((tab) => !tab.disabled)?.value ?? null;
    if (selectedTab?.disabled) return { reason: "disabled", value: fallbackValue };

    return { reason: value === null ? "initial" : "missing", value: fallbackValue };
  }

  private getResolvedFocusValue(): TabsValue {
    const focusedTab = this.getTabByValue(this.focusValue);
    if (focusedTab && !focusedTab.disabled) return focusedTab.value;

    const activeTab = this.getTabByValue(this.value);
    if (activeTab && !activeTab.disabled) return activeTab.value;

    return this.elements.tabs.find((tab) => !tab.disabled)?.value ?? null;
  }

  private getActivateOnFocus(): boolean {
    const { list } = this.elements;
    return list ? readBooleanAttribute(list, TABS_ACTIVATE_ON_FOCUS_ATTRIBUTE, false) : false;
  }

  private getLoopFocus(): boolean {
    const { list } = this.elements;
    return list ? readBooleanAttribute(list, TABS_LOOP_FOCUS_ATTRIBUTE, true) : true;
  }

  private getNextFocusableTab(currentTab: TabsTab, key: string): TabsTab | undefined {
    const enabledTabs = this.elements.tabs.filter((tab) => !tab.disabled);
    if (enabledTabs.length === 0) return undefined;

    if (key === "Home") return enabledTabs[0];
    if (key === "End") return enabledTabs.at(-1);

    const direction = getKeyboardDirection(this.orientation, key);
    if (direction === 0) return undefined;

    const currentPosition = enabledTabs.findIndex((tab) => tab.element === currentTab.element);
    if (currentPosition < 0) return enabledTabs[0];

    const nextPosition = currentPosition + direction;
    if (nextPosition >= 0 && nextPosition < enabledTabs.length) {
      return enabledTabs[nextPosition];
    }

    if (!this.getLoopFocus()) return undefined;
    return direction > 0 ? enabledTabs[0] : enabledTabs.at(-1);
  }

  private getTabByValue(value: TabsValue): TabsTab | undefined {
    if (value === null) return undefined;
    return this.elements.tabs.find((tab) => tab.value === value);
  }

  private getTabFromEventTarget(target: EventTarget | null): TabsTab | undefined {
    if (!(target instanceof Element)) return undefined;

    const tabElement = target.closest<HTMLButtonElement>(`[${TABS_TAB_ATTRIBUTE}]`);
    if (!tabElement || tabElement.closest(`[${TABS_ROOT_ATTRIBUTE}]`) !== this.root) {
      return undefined;
    }

    return this.elements.tabs.find((tab) => tab.element === tabElement);
  }

  private readonly handleSyncEvent = (event: Event): void => {
    if (this.controlled) return;

    const nextValue = readTabsSyncEventValue(event);
    if (nextValue === undefined || nextValue === this.value) return;

    const previousValue = this.value;
    const resolvedValue = this.getResolvedUncontrolledValue(nextValue).value;
    if (resolvedValue === previousValue) return;
    const activationDirection = this.getActivationDirection(previousValue, resolvedValue);

    const details = new TabsValueChangeDetailsImpl({
      activationDirection,
      event,
      previousValue,
      reason: "none",
      value: resolvedValue,
    });

    this.notify(details);
    if (details.isCanceled) {
      this.render();
      return;
    }

    this.value = resolvedValue;
    this.activationDirection = activationDirection;
    this.focusValue = this.getResolvedFocusValue();
    this.render();
    this.persistSyncValue(resolvedValue);
  };

  private getActivationDirection(
    previousValue: TabsValue,
    nextValue: TabsValue,
  ): TabsActivationDirection {
    if (previousValue === nextValue) return "none";
    if (previousValue === null || nextValue === null) return "none";

    const previousTab = this.getTabByValue(previousValue);
    const nextTab = this.getTabByValue(nextValue);
    if (!previousTab || !nextTab) return "none";

    const previousRect = previousTab.element.getBoundingClientRect();
    const nextRect = nextTab.element.getBoundingClientRect();

    if (getRectWidth(previousRect) > 0 || getRectWidth(nextRect) > 0) {
      if (this.orientation === "horizontal") {
        if (nextRect.left < previousRect.left) return "left";
        if (nextRect.left > previousRect.left) return "right";
      } else {
        if (nextRect.top < previousRect.top) return "up";
        if (nextRect.top > previousRect.top) return "down";
      }
    }

    if (this.orientation === "horizontal") {
      return nextTab.index > previousTab.index ? "right" : "left";
    }

    return nextTab.index > previousTab.index ? "down" : "up";
  }

  private notify(
    details: TabsValueChangeDetailsImpl,
    options: { cancelable?: boolean } = {},
  ): void {
    const cancelable = options.cancelable ?? true;
    const event = dispatchCustomEvent(this.root, "starwind:value-change", details, {
      cancelable,
    });
    if (cancelable && event.defaultPrevented) {
      details.cancel();
    }

    this.onValueChange?.(details.value, details);
    this.subscribers.forEach((subscriber) => subscriber(details));
  }

  private readStoredSyncValue(): TabsValue | undefined {
    const storage = getTabsStorage();
    if (!this.storageKey || !storage) return undefined;

    try {
      const value = storage.getItem(this.storageKey);
      if (value === null) return undefined;

      return deserializeTabsValue(value);
    } catch {
      return undefined;
    }
  }

  private persistAndDispatchSyncValue(value: TabsValue): void {
    this.persistSyncValue(value);
    this.dispatchSyncValue(value);
  }

  private persistSyncValue(value: TabsValue): void {
    const storage = getTabsStorage();
    if (!this.storageKey || !storage) return;

    try {
      storage.setItem(this.storageKey, serializeTabsValue(value));
    } catch {
      // Ignore storage failures; tab switching should still work.
    }
  }

  private dispatchSyncValue(value: TabsValue): void {
    if (!this.syncEventName) return;

    document.dispatchEvent(new CustomEvent(this.syncEventName, { detail: { value } }));
  }
}

class TabsValueChangeDetailsImpl implements TabsValueChangeDetails {
  readonly activationDirection: TabsActivationDirection;
  readonly event?: Event;
  readonly previousValue: TabsValue;
  readonly reason: TabsValueChangeReason;
  readonly trigger?: Element;
  readonly value: TabsValue;

  private readonly cancelable: boolean;
  private canceled = false;
  private propagationAllowed = false;

  constructor({
    activationDirection,
    cancelable = true,
    event,
    previousValue,
    reason,
    trigger,
    value,
  }: {
    activationDirection: TabsActivationDirection;
    cancelable?: boolean;
    event?: Event;
    previousValue: TabsValue;
    reason: TabsValueChangeReason;
    trigger?: Element;
    value: TabsValue;
  }) {
    this.activationDirection = activationDirection;
    this.event = event;
    this.previousValue = previousValue;
    this.reason = reason;
    this.trigger = trigger;
    this.value = value;
    this.cancelable = cancelable;
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
    if (!this.cancelable) return;

    this.canceled = true;
  }
}

function getTabsElements(root: HTMLElement): TabsElements {
  const tabs = getOwnedElements<HTMLButtonElement>(root, `[${TABS_TAB_ATTRIBUTE}]`).map(
    (element, index) => ({
      disabled: isDisabledTab(element),
      element,
      index,
      value: readPartValue(element, index),
    }),
  );

  return {
    indicators: getOwnedElements<HTMLElement>(root, `[${TABS_INDICATOR_ATTRIBUTE}]`),
    list: getOwnedElements<HTMLElement>(root, `[${TABS_LIST_ATTRIBUTE}]`)[0] ?? null,
    panels: getOwnedElements<HTMLElement>(root, `[${TABS_PANEL_ATTRIBUTE}]`).map(
      (element, index) => ({
        element,
        value: readPartValue(element, index),
      }),
    ),
    tabs,
  };
}

function getOwnedElements<TElement extends HTMLElement>(
  root: HTMLElement,
  selector: string,
): TElement[] {
  return Array.from(root.querySelectorAll<TElement>(selector)).filter(
    (element) => element.closest(`[${TABS_ROOT_ATTRIBUTE}]`) === root,
  );
}

function readPartValue(element: HTMLElement, index: number): string {
  const value = element.getAttribute(TABS_VALUE_ATTRIBUTE);
  if (value !== null && value !== "null") return value;

  return element.id || String(index);
}

function readNullableValue(element: HTMLElement, attribute: string): TabsValue | undefined {
  const value = element.getAttribute(attribute);
  if (value === null || value === undefined) return undefined;
  if (value === "null") return null;
  return value;
}

function readSyncKey(value: string | null): string | null {
  return value && value.trim() !== "" ? value : null;
}

function normalizeTabsValue(value: TabsValue | undefined): TabsValue {
  if (value === undefined) return null;
  if (value === "null") return null;
  return value;
}

function serializeTabsValue(value: TabsValue): string {
  return value === null ? "null" : value;
}

function deserializeTabsValue(value: string): TabsValue {
  return value === "null" ? null : value;
}

function readTabsSyncEventValue(event: Event): TabsValue | undefined {
  if (!(event instanceof CustomEvent)) return undefined;

  const detail = event.detail as { value?: unknown } | undefined;
  if (!detail || (typeof detail.value !== "string" && detail.value !== null)) return undefined;

  return detail.value;
}

function initializeNestedTabs(panel: HTMLElement): void {
  panel.querySelectorAll<HTMLElement>(`[${TABS_ROOT_ATTRIBUTE}]`).forEach((root) => {
    createTabs(root).refresh();
  });
}

function getTabsStorage(): Storage | null {
  try {
    return globalThis.localStorage ?? null;
  } catch {
    return null;
  }
}

function readOrientation(value: string | null): TabsOrientation | undefined {
  if (value === "horizontal" || value === "vertical") return value;
  return undefined;
}

function isDisabledTab(tab: HTMLButtonElement): boolean {
  return (
    tab.disabled ||
    tab.hasAttribute("disabled") ||
    tab.hasAttribute(TABS_DISABLED_ATTRIBUTE) ||
    tab.getAttribute("aria-disabled") === "true"
  );
}

function getKeyboardDirection(orientation: TabsOrientation, key: string): -1 | 0 | 1 {
  if (orientation === "vertical") {
    if (key === "ArrowDown") return 1;
    if (key === "ArrowUp") return -1;
    return 0;
  }

  if (key === "ArrowRight") return 1;
  if (key === "ArrowLeft") return -1;
  return 0;
}

function getRectWidth(rect: RectLike): number {
  return rect.width;
}

function getRectHeight(rect: RectLike): number {
  return rect.height;
}
