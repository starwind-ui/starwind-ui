import { autoUpdate } from "@floating-ui/dom";

import {
  assertHTMLElement,
  ensureId,
  readBooleanAttribute,
  readNumberAttribute,
  resolveAsChildControl,
  setBooleanAttribute,
} from "../../internal/dom";
import { createCancelableDetails } from "../../internal/cancelable-details";
import { dispatchCustomEvent } from "../../internal/events";
import {
  createFloatingPositioner,
  type FloatingPositioner,
  type FloatingSide,
  readFloatingAlignAttribute,
  readFloatingSideAttribute,
  resolveFloatingPortalTarget,
} from "../../internal/floating";
import {
  createFloatingListLifecycle,
  type FloatingListLifecycle,
} from "../../internal/floating-list-lifecycle";
import { runOverlayOpenChangeShell } from "../../internal/overlay-open-change";
import { showElement } from "../../internal/presence";
import { lockDocumentScroll } from "../../internal/scroll-lock";
import { registerFieldControlBridge } from "../field/field-control-bridge";

export type SelectOpenChangeReason =
  | "escape-key"
  | "imperative-action"
  | "item-press"
  | "outside-press"
  | "trigger-press";

export type SelectOpenChangeDetails = {
  event?: Event;
  open: boolean;
  previousOpen: boolean;
  reason: SelectOpenChangeReason;
  trigger?: Element;
  cancel(): void;
  readonly isCanceled: boolean;
};

export type SelectValueChangeReason = "imperative-action" | "item-press";

export type SelectValueChangeDetails = {
  event?: Event;
  item?: HTMLElement;
  previousValue: string | null;
  reason: SelectValueChangeReason;
  value: string | null;
  cancel(): void;
  readonly isCanceled: boolean;
};

export type SelectOptions = {
  autoComplete?: string;
  defaultOpen?: boolean;
  defaultValue?: string | null;
  disabled?: boolean;
  form?: string;
  highlightItemOnHover?: boolean;
  modal?: boolean;
  name?: string;
  onOpenChange?: (open: boolean, details: SelectOpenChangeDetails) => void;
  onValueChange?: (value: string | null, details: SelectValueChangeDetails) => void;
  open?: boolean;
  portalReference?: Element;
  readOnly?: boolean;
  reference?: Element;
  required?: boolean;
  value?: string | null;
};

export type SelectSetOpenOptions = {
  emit?: boolean;
};

export type SelectSetValueOptions = {
  emit?: boolean;
};

export type SelectOpenOptions = {
  event?: Event;
  focus?: SelectFocusTarget;
  reason?: SelectOpenChangeReason;
  trigger?: Element;
};

export type SelectInstance = {
  readonly root: HTMLElement;
  close(): void;
  destroy(): void;
  getOpen(): boolean;
  getValue(): string | null;
  open(options?: SelectOpenOptions): void;
  setDisabled(disabled: boolean): void;
  setFormOptions(options: Pick<SelectOptions, "autoComplete" | "form" | "name" | "required">): void;
  setHighlightItemOnHover(highlightItemOnHover: boolean): void;
  setModal(modal: boolean): void;
  setOpen(open: boolean, options?: SelectSetOpenOptions): void;
  setReadOnly(readOnly: boolean): void;
  setValue(value: string | null, options?: SelectSetValueOptions): void;
  subscribe(event: "openChange", callback: (details: SelectOpenChangeDetails) => void): () => void;
  subscribe(
    event: "valueChange",
    callback: (details: SelectValueChangeDetails) => void,
  ): () => void;
  toggle(): void;
  updatePosition(): void;
};

type SelectElements = {
  input: HTMLInputElement | null;
  label: HTMLElement | null;
  list: HTMLElement | null;
  popup: HTMLElement;
  portal: HTMLElement | null;
  positioner: HTMLElement | null;
  scrollDownArrow: HTMLElement | null;
  scrollUpArrow: HTMLElement | null;
  trigger: HTMLElement;
  valueElements: HTMLElement[];
};

type SelectFocusTarget = "first" | "last" | "selected";

type OpenRequest = {
  event?: Event;
  focus?: SelectFocusTarget;
  reason: SelectOpenChangeReason;
  trigger?: Element;
};

type ValueRequest = {
  event?: Event;
  item?: HTMLElement;
  reason: SelectValueChangeReason;
  value: string | null;
};

type SetValueCommandDetail = {
  emit?: boolean;
  value: string | null;
};

type SelectPlacementAttributes = {
  align: string | null;
  side: string | null;
};

const SELECT_ROOT_ATTRIBUTE = "data-sw-select";
const SELECT_TRIGGER_ATTRIBUTE = "data-sw-select-trigger";
const SELECT_VALUE_ATTRIBUTE = "data-sw-select-value";
const SELECT_INPUT_ATTRIBUTE = "data-sw-select-input";
const SELECT_PORTAL_ATTRIBUTE = "data-sw-select-portal";
const SELECT_POSITIONER_ATTRIBUTE = "data-sw-select-positioner";
const SELECT_POPUP_ATTRIBUTE = "data-sw-select-popup";
const SELECT_LIST_ATTRIBUTE = "data-sw-select-list";
const SELECT_LABEL_ATTRIBUTE = "data-sw-select-label";
const SELECT_ITEM_ATTRIBUTE = "data-sw-select-item";
const SELECT_ITEM_TEXT_ATTRIBUTE = "data-sw-select-item-text";
const SELECT_ITEM_INDICATOR_ATTRIBUTE = "data-sw-select-item-indicator";
const SELECT_SCROLL_UP_ARROW_ATTRIBUTE = "data-sw-select-scroll-up-arrow";
const SELECT_SCROLL_DOWN_ARROW_ATTRIBUTE = "data-sw-select-scroll-down-arrow";
const SELECT_AUTOCOMPLETE_ATTRIBUTE = "data-autocomplete";
const SELECT_DEFAULT_OPEN_ATTRIBUTE = "data-default-open";
const SELECT_DEFAULT_VALUE_ATTRIBUTE = "data-default-value";
const SELECT_DISABLED_ATTRIBUTE = "data-disabled";
const SELECT_FORM_ATTRIBUTE = "data-form";
const SELECT_HIGHLIGHT_ITEM_ON_HOVER_ATTRIBUTE = "data-highlight-item-on-hover";
const SELECT_MODAL_ATTRIBUTE = "data-modal";
const SELECT_REQUIRED_ATTRIBUTE = "data-required";
const SELECT_NAME_ATTRIBUTE = "data-name";
const SELECT_READONLY_ATTRIBUTE = "data-readonly";
const SELECT_VALUE_DATA_ATTRIBUTE = "data-value";
const SELECT_SIDE_ATTRIBUTE = "data-side";
const SELECT_ALIGN_ATTRIBUTE = "data-align";
const SELECT_SIDE_OFFSET_ATTRIBUTE = "data-side-offset";
const SELECT_ALIGN_OFFSET_ATTRIBUTE = "data-align-offset";
const SELECT_AVOID_COLLISIONS_ATTRIBUTE = "data-avoid-collisions";
const SELECT_ALIGN_ITEM_WITH_TRIGGER_ATTRIBUTE = "data-align-item-with-trigger";
const SELECT_ALIGN_TRIGGER_ATTRIBUTE = "data-align-trigger";
const SELECT_HIGHLIGHTED_ATTRIBUTE = "data-highlighted";
const SELECT_SELECTED_ATTRIBUTE = "data-selected";
const SELECT_SELECTED_LABEL_ATTRIBUTE = "data-selected-label";
const SELECT_SELECTED_VALUE_ATTRIBUTE = "data-selected-value";
const SELECT_PLACEHOLDER_ATTRIBUTE = "data-placeholder";
const SELECT_ALIGNED_SIDE = "none";
const SELECT_ALIGNED_VIEWPORT_PADDING = 8;
const SELECT_ALIGNED_TRIGGER_EDGE_GUARD = 20;
const SELECT_FLOATING_VIEWPORT_PADDING = 8;
const SELECT_SCROLL_ARROW_STEP = 24;
const SELECT_SCROLL_ARROW_INTERVAL = 32;

const instances = new WeakMap<HTMLElement, SelectController>();

registerFieldControlBridge({
  kind: "select",
  connect(control, { disabled, name, shouldSyncName }) {
    const select = createSelect(control, { disabled, name });
    select.setDisabled(disabled);
    if (shouldSyncName) {
      select.setFormOptions({ name });
    }
  },
});

export function createSelect(root: HTMLElement, options: SelectOptions = {}): SelectInstance {
  assertHTMLElement(root, "createSelect root");

  const existing = instances.get(root);
  if (existing) return existing;

  const instance = new SelectController(root, options);
  instances.set(root, instance);
  return instance;
}

class SelectController implements SelectInstance {
  readonly root: HTMLElement;

  private readonly abortController = new AbortController();
  private readonly controlledOpen: boolean;
  private readonly controlledValue: boolean;
  private readonly elements: SelectElements;
  private readonly onOpenChange?: (open: boolean, details: SelectOpenChangeDetails) => void;
  private readonly onValueChange?: (
    value: string | null,
    details: SelectValueChangeDetails,
  ) => void;
  private readonly openSubscribers = new Set<(details: SelectOpenChangeDetails) => void>();
  private readonly portalReference: Element | null;
  private readOnly: boolean;
  private readonly reference: Element | null;
  private readonly initialValue: string | null;
  private readonly authoredPlacementAttributes: SelectPlacementAttributes;
  private readonly lifecycle: FloatingListLifecycle<OpenRequest>;
  private modal: boolean;
  private readonly valueSubscribers = new Set<(details: SelectValueChangeDetails) => void>();
  private activeIndex = -1;
  private activeItem: HTMLElement | null = null;
  private alignedAutoUpdateCleanup: (() => void) | null = null;
  private alignItemWithTriggerActive = false;
  private autoComplete?: string;
  private destroyed = false;
  private disabled: boolean;
  private floatingPositioner: FloatingPositioner | null = null;
  private form?: string;
  private highlightItemOnHover: boolean;
  private itemCache: HTMLElement[] | null = null;
  private itemIndexCache: Map<HTMLElement, number> | null = null;
  private itemObserver: MutationObserver | null = null;
  private alignedPositionRetryFrame: number | null = null;
  private readonly boundScrollArrows = new WeakSet<HTMLElement>();
  private readonly boundScrollContainers = new WeakSet<HTMLElement>();
  private name?: string;
  private openState: boolean;
  private pendingRestoreFocus = false;
  private pendingFocus: SelectFocusTarget | null = null;
  private pointerTypeForOpen: string | null = null;
  private required: boolean;
  private resetForm: HTMLFormElement | null = null;
  private resetTimer: number | undefined;
  private scrollArrowDirection: 1 | -1 | null = null;
  private scrollArrowTimer: number | undefined;
  private formInputDefaultInitialized = false;
  private typeaheadBuffer = "";
  private typeaheadTimer: number | null = null;
  private valueState: string | null;

  constructor(root: HTMLElement, options: SelectOptions) {
    this.root = root;
    this.elements = getSelectElements(root);
    this.controlledOpen = Object.hasOwn(options, "open");
    this.controlledValue = Object.hasOwn(options, "value");
    this.autoComplete =
      options.autoComplete ?? readOptionalAttribute(root, SELECT_AUTOCOMPLETE_ATTRIBUTE);
    this.disabled = options.disabled ?? readBooleanAttribute(root, SELECT_DISABLED_ATTRIBUTE);
    this.form = options.form ?? readOptionalAttribute(root, SELECT_FORM_ATTRIBUTE);
    this.highlightItemOnHover =
      options.highlightItemOnHover ??
      readBooleanAttribute(root, SELECT_HIGHLIGHT_ITEM_ON_HOVER_ATTRIBUTE, true);
    this.name = options.name ?? readOptionalAttribute(root, SELECT_NAME_ATTRIBUTE);
    this.onOpenChange = options.onOpenChange;
    this.onValueChange = options.onValueChange;
    this.modal = options.modal ?? readBooleanAttribute(root, SELECT_MODAL_ATTRIBUTE, true);
    this.portalReference = options.portalReference ?? null;
    this.readOnly = options.readOnly ?? readBooleanAttribute(root, SELECT_READONLY_ATTRIBUTE);
    this.reference = options.reference ?? null;
    this.required = options.required ?? readBooleanAttribute(root, SELECT_REQUIRED_ATTRIBUTE);
    this.authoredPlacementAttributes = readPlacementAttributes(
      this.elements.positioner ?? this.elements.popup,
    );
    this.openState =
      options.open ??
      options.defaultOpen ??
      readBooleanAttribute(root, SELECT_DEFAULT_OPEN_ATTRIBUTE, false);
    this.initialValue = readInitialResetValue(options, root, this.elements.input);
    this.valueState = readInitialValue(options, root);
    this.lifecycle = this.createLifecycle();

    this.setupAccessibility();
    this.bindEvents();
    this.applyValueState(this.valueState);
    this.applyOpenState(this.openState, { reason: "imperative-action" });
  }

  open(options: SelectOpenOptions = {}): void {
    this.requestOpen(true, {
      event: options.event,
      focus: options.focus ?? "selected",
      reason: options.reason ?? "imperative-action",
      trigger: options.trigger,
    });
  }

  close(): void {
    this.requestOpen(false, { reason: "imperative-action" });
  }

  toggle(): void {
    this.requestOpen(!this.openState, { reason: "imperative-action" });
  }

  updatePosition(): void {
    this.positionPopup();
  }

  setOpen(open: boolean, options: SelectSetOpenOptions = {}): void {
    const previousOpen = this.openState;
    this.openState = open;
    this.applyOpenState(open, { reason: "imperative-action" });
    if (!open && this.pendingRestoreFocus) {
      this.pendingRestoreFocus = false;
      this.restoreTriggerFocus();
    } else if (open) {
      this.pendingRestoreFocus = false;
    }

    if (options.emit !== false) {
      this.notifyOpen(
        createOpenChangeDetails({
          open,
          previousOpen,
          reason: "imperative-action",
        }),
      );
    }
  }

  setValue(value: string | null, options: SelectSetValueOptions = {}): void {
    const normalizedValue = normalizeValue(value) ?? null;
    const previousValue = this.valueState;

    this.valueState = normalizedValue;
    this.applyValueState(normalizedValue);

    if (options.emit !== false) {
      this.notifyValue(
        createValueChangeDetails({
          previousValue,
          reason: "imperative-action",
          value: normalizedValue,
        }),
      );
    }
  }

  getOpen(): boolean {
    return this.openState;
  }

  getValue(): string | null {
    return this.valueState;
  }

  setDisabled(disabled: boolean): void {
    if (this.disabled === disabled) return;

    this.disabled = disabled;
    if (disabled && this.openState) {
      this.setOpen(false, { emit: false });
      return;
    }

    this.renderDisabledState();
  }

  setReadOnly(readOnly: boolean): void {
    if (this.readOnly === readOnly) return;

    this.readOnly = readOnly;
    this.renderOpenState(this.openState);
  }

  setModal(modal: boolean): void {
    if (this.modal === modal) return;

    this.modal = modal;
    this.lifecycle.syncScrollLock(undefined);
  }

  setHighlightItemOnHover(highlightItemOnHover: boolean): void {
    this.highlightItemOnHover = highlightItemOnHover;
  }

  setFormOptions(
    options: Pick<SelectOptions, "autoComplete" | "form" | "name" | "required">,
  ): void {
    if (Object.hasOwn(options, "autoComplete")) {
      this.autoComplete = options.autoComplete;
    }

    if (Object.hasOwn(options, "form")) {
      this.form = options.form;
    }

    if (Object.hasOwn(options, "name")) {
      this.name = options.name;
    }

    if (Object.hasOwn(options, "required") && options.required !== undefined) {
      this.required = options.required;
    }

    this.syncFormInput();
  }

  subscribe(event: "openChange", callback: (details: SelectOpenChangeDetails) => void): () => void;
  subscribe(
    event: "valueChange",
    callback: (details: SelectValueChangeDetails) => void,
  ): () => void;
  subscribe(
    event: "openChange" | "valueChange",
    callback:
      | ((details: SelectOpenChangeDetails) => void)
      | ((details: SelectValueChangeDetails) => void),
  ): () => void {
    if (event === "openChange") {
      this.openSubscribers.add(callback as (details: SelectOpenChangeDetails) => void);
      return () => {
        this.openSubscribers.delete(callback as (details: SelectOpenChangeDetails) => void);
      };
    }

    if (event === "valueChange") {
      this.valueSubscribers.add(callback as (details: SelectValueChangeDetails) => void);
      return () => {
        this.valueSubscribers.delete(callback as (details: SelectValueChangeDetails) => void);
      };
    }

    throw new Error(`Unsupported Select event: ${event}`);
  }

  destroy(): void {
    if (this.destroyed) return;

    this.abortController.abort();
    this.detachFormResetListener();
    this.clearResetTimer();
    this.stopScrollArrow();
    this.clearTypeaheadTimer();
    this.clearAlignedPositionRetry();
    this.stopAlignedAutoUpdate();
    this.floatingPositioner?.destroy();
    this.floatingPositioner = null;
    this.openSubscribers.clear();
    this.valueSubscribers.clear();
    this.openState = false;
    this.stopItemObserver();
    this.renderOpenState(false);
    this.activeItem = null;
    this.lifecycle.destroy();
    this.elements.popup.hidden = true;
    instances.delete(this.root);
    this.destroyed = true;
  }

  private setupAccessibility(): void {
    const { input, label, popup, trigger } = this.elements;
    const popupId = ensureId(popup, "sw-select-popup");
    const triggerId = ensureId(trigger, "sw-select-trigger");

    trigger.setAttribute("role", trigger.getAttribute("role") ?? "combobox");
    trigger.setAttribute("aria-haspopup", "listbox");
    trigger.setAttribute("aria-controls", popupId);
    trigger.setAttribute("aria-expanded", String(this.openState));
    trigger.setAttribute("aria-readonly", this.readOnly ? "true" : "false");

    popup.setAttribute("role", popup.getAttribute("role") ?? "listbox");
    popup.setAttribute("tabindex", popup.getAttribute("tabindex") ?? "-1");
    popup.setAttribute("aria-labelledby", triggerId);

    if (label) {
      const labelId = ensureId(label, "sw-select-label");
      trigger.setAttribute("aria-labelledby", `${labelId} ${triggerId}`);
      label.addEventListener(
        "click",
        () => {
          trigger.focus();
        },
        { signal: this.abortController.signal },
      );
    }

    if (input) {
      input.type = "hidden";
      input.tabIndex = -1;
      input.setAttribute("aria-hidden", "true");
    }

    this.syncFormInput();
    this.renderDisabledState();
  }

  private bindEvents(): void {
    const { signal } = this.abortController;
    const { popup, trigger } = this.elements;

    this.root.addEventListener(
      "starwind:set-value",
      (event) => {
        const detail = readSetValueCommandDetail(event);
        if (!detail) return;

        this.setValue(detail.value, { emit: detail.emit });
      },
      { signal },
    );

    trigger.addEventListener(
      "pointerdown",
      (event) => {
        this.pointerTypeForOpen = event.pointerType;
      },
      { signal },
    );

    trigger.addEventListener(
      "click",
      (event) => {
        if (this.disabled || isDisabledElement(trigger)) return;
        event.preventDefault();
        this.requestOpen(!this.openState, {
          event,
          focus: "selected",
          reason: "trigger-press",
          trigger,
        });
      },
      { signal },
    );

    trigger.addEventListener(
      "keydown",
      (event) => {
        if (this.disabled || isDisabledElement(trigger)) return;

        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          this.pointerTypeForOpen = null;
          this.requestOpen(!this.openState, {
            event,
            focus: "selected",
            reason: "trigger-press",
            trigger,
          });
          return;
        }

        if (event.key === "ArrowDown" || event.key === "ArrowUp") {
          event.preventDefault();
          this.pointerTypeForOpen = null;
          this.requestOpen(true, {
            event,
            focus: event.key === "ArrowDown" ? "selected" : "last",
            reason: "trigger-press",
            trigger,
          });
        }
      },
      { signal },
    );

    popup.addEventListener(
      "click",
      (event) => {
        if (!this.openState || !(event.target instanceof Element)) return;

        const item = this.getItemByTarget(event.target);
        if (!item || isDisabledElement(item)) return;

        event.preventDefault();
        this.selectItem(item, event);
      },
      { signal },
    );

    popup.addEventListener(
      "pointermove",
      (event) => {
        if (!this.openState || !this.highlightItemOnHover || event.pointerType !== "mouse") return;

        const item = event.target instanceof Element ? this.getItemByTarget(event.target) : null;
        if (!item || isDisabledElement(item)) return;

        this.highlightItemByElement(item, { focus: true });
      },
      { signal },
    );

    popup.addEventListener(
      "keydown",
      (event) => {
        if (!this.openState) return;

        switch (event.key) {
          case "ArrowDown":
            event.preventDefault();
            this.focusItem(this.activeIndex < 0 ? 0 : this.activeIndex + 1, 1);
            break;
          case "ArrowUp":
            event.preventDefault();
            this.focusItem(
              this.activeIndex < 0 ? this.getItems().length - 1 : this.activeIndex - 1,
              -1,
            );
            break;
          case "Home":
            event.preventDefault();
            this.focusItem(0, 1);
            break;
          case "End":
            event.preventDefault();
            this.focusItem(this.getItems().length - 1, -1);
            break;
          case "Escape":
            event.preventDefault();
            this.requestOpen(false, { event, reason: "escape-key" });
            break;
          case "Enter":
          case " ":
            if (this.activeIndex < 0) return;
            event.preventDefault();
            this.selectItem(this.getItems()[this.activeIndex]!, event);
            break;
          case "Tab":
            event.preventDefault();
            break;
          default:
            if (isTypeaheadKey(event)) {
              event.preventDefault();
              this.focusTypeaheadMatch(event.key);
            }
            break;
        }
      },
      { signal },
    );

    this.bindScrollContainer(this.getScrollContainer());
    this.bindScrollArrow(this.elements.scrollUpArrow, -1);
    this.bindScrollArrow(this.elements.scrollDownArrow, 1);
  }

  private bindScrollContainer(container: HTMLElement): void {
    if (this.boundScrollContainers.has(container)) return;

    this.boundScrollContainers.add(container);
    container.addEventListener("scroll", () => this.updateScrollArrows(), {
      signal: this.abortController.signal,
    });
  }

  private bindScrollArrow(arrow: HTMLElement | null, direction: 1 | -1): void {
    if (!arrow) return;
    if (this.boundScrollArrows.has(arrow)) return;

    this.boundScrollArrows.add(arrow);

    arrow.setAttribute("aria-hidden", "true");
    arrow.hidden = true;

    const start = (event: PointerEvent) => {
      if (!this.openState) return;
      event.preventDefault();
      this.startScrollArrow(direction);
    };
    const stop = () => this.stopScrollArrow(direction);
    const { signal } = this.abortController;

    arrow.addEventListener("pointerenter", start, { signal });
    arrow.addEventListener("pointerdown", start, { signal });
    arrow.addEventListener("pointerleave", stop, { signal });
    arrow.addEventListener("pointerup", stop, { signal });
    arrow.addEventListener("pointercancel", stop, { signal });
  }

  private requestOpen(open: boolean, request: OpenRequest): void {
    if (open === this.openState && !this.controlledOpen) {
      if (open && request.focus) {
        this.pendingFocus = request.focus;
        this.queuePendingFocus();
      }
      return;
    }

    const previousOpen = this.openState;
    runOverlayOpenChangeShell({
      root: this.root,
      controlled: this.controlledOpen,
      createDetails: createOpenChangeDetails,
      open,
      previousOpen,
      request,
      onApplyControlledOpenState: () => {
        this.prepareOpenChangeApplication(open, request);
        this.completeOpenChangeApplication(open, request);
      },
      onApplyUncontrolledOpenState: () => {
        this.prepareOpenChangeApplication(open, request);
        this.openState = open;
        this.applyOpenState(open, request);
        this.completeOpenChangeApplication(open, request);
      },
      onNotifyOpenChangeSubscribers: (details) => this.notifyOpen(details),
      onOpenChange: (nextOpen, details) => {
        this.onOpenChange?.(nextOpen, details);
      },
    });
  }

  private prepareOpenChangeApplication(open: boolean, request: OpenRequest): void {
    this.pendingFocus = open ? (request.focus ?? "selected") : null;
  }

  private completeOpenChangeApplication(open: boolean, request: OpenRequest): void {
    if (!open && shouldRestoreFocusOnClose(request.reason)) {
      if (!this.openState) {
        this.restoreTriggerFocus();
      } else {
        this.pendingRestoreFocus = true;
      }
    }

    if (open && this.openState) {
      this.queuePendingFocus();
    }
  }

  private requestValue(request: ValueRequest): void {
    if (this.readOnly) return;

    if (request.value === this.valueState && !this.controlledValue) {
      this.requestOpen(false, {
        event: request.event,
        reason: "item-press",
        trigger: request.item,
      });
      return;
    }

    const details = createValueChangeDetails({
      event: request.event,
      item: request.item,
      previousValue: this.valueState,
      reason: request.reason,
      value: request.value,
    });

    this.onValueChange?.(request.value, details);

    const valueChangeEvent = dispatchCustomEvent(this.root, "starwind:value-change", details, {
      cancelable: true,
    });
    if (valueChangeEvent.defaultPrevented) {
      details.cancel();
    }

    if (details.isCanceled) return;

    if (!this.controlledValue) {
      this.valueState = request.value;
      this.applyValueState(request.value);
    }

    this.notifyValue(details);
    this.requestOpen(false, {
      event: request.event,
      reason: "item-press",
      trigger: request.item,
    });
  }

  private applyOpenState(open: boolean, request?: OpenRequest): void {
    this.lifecycle.applyOpenState(open, request);
  }

  private renderOpenState(open: boolean): void {
    const state = open ? "open" : "closed";

    this.root.setAttribute(SELECT_ROOT_ATTRIBUTE, "");
    this.root.setAttribute("data-state", state);
    setBooleanAttribute(this.root, SELECT_READONLY_ATTRIBUTE, this.readOnly);
    this.elements.popup.setAttribute("data-state", state);
    this.elements.positioner?.setAttribute("data-state", state);
    this.elements.trigger.setAttribute("data-state", state);
    this.elements.trigger.setAttribute("aria-expanded", String(open));
    this.elements.trigger.setAttribute("aria-readonly", this.readOnly ? "true" : "false");
    setBooleanAttribute(this.elements.trigger, SELECT_READONLY_ATTRIBUTE, this.readOnly);
    this.renderDisabledState();

    if (open) {
      showElement(this.elements.popup);
    } else {
      this.clearHighlightedItems();
    }

    this.updateScrollArrows();
  }

  private getScrollContainer(): HTMLElement {
    return this.elements.list ?? this.elements.popup;
  }

  private startScrollArrow(direction: 1 | -1): void {
    if (!this.canScrollInDirection(direction)) return;

    this.stopScrollArrow();
    this.scrollArrowDirection = direction;
    this.scrollByArrow(direction);
    this.scrollArrowTimer = window.setInterval(() => {
      this.scrollByArrow(direction);
    }, SELECT_SCROLL_ARROW_INTERVAL);
  }

  private stopScrollArrow(direction?: 1 | -1): void {
    if (direction !== undefined && this.scrollArrowDirection !== direction) return;

    if (this.scrollArrowTimer !== undefined) {
      window.clearInterval(this.scrollArrowTimer);
      this.scrollArrowTimer = undefined;
    }
    this.scrollArrowDirection = null;
  }

  private scrollByArrow(direction: 1 | -1): void {
    const container = this.getScrollContainer();
    const maxScrollTop = this.getMaxScrollTop();
    container.scrollTop = clamp(
      container.scrollTop + direction * SELECT_SCROLL_ARROW_STEP,
      0,
      maxScrollTop,
    );
    this.updateScrollArrows();

    if (!this.canScrollInDirection(direction)) {
      this.stopScrollArrow(direction);
    }
  }

  private canScrollInDirection(direction: 1 | -1): boolean {
    if (!this.openState) return false;

    const container = this.getScrollContainer();
    const maxScrollTop = this.getMaxScrollTop();
    if (maxScrollTop <= 0) return false;

    return direction < 0 ? container.scrollTop > 0 : container.scrollTop < maxScrollTop;
  }

  private getMaxScrollTop(): number {
    const container = this.getScrollContainer();
    return Math.max(0, container.scrollHeight - container.clientHeight);
  }

  private updateScrollArrows(): void {
    const maxScrollTop = this.getMaxScrollTop();
    const scrollTop = this.getScrollContainer().scrollTop;
    const canScrollUp = this.openState && maxScrollTop > 0 && scrollTop > 0;
    const canScrollDown = this.openState && maxScrollTop > 0 && scrollTop < maxScrollTop;

    renderScrollArrow(this.elements.scrollUpArrow, canScrollUp);
    renderScrollArrow(this.elements.scrollDownArrow, canScrollDown);

    if (this.scrollArrowDirection && !this.canScrollInDirection(this.scrollArrowDirection)) {
      this.stopScrollArrow(this.scrollArrowDirection);
    }
  }

  private applyValueState(value: string | null): void {
    if (this.openState) {
      const items = this.prepareOpenItems();
      const selectedItem = this.findSelectedItem(value, items);
      this.renderValueState(value, selectedItem);
      this.applyItemSelectionState(items, selectedItem);
      return;
    }

    const selectedItem = this.findSelectedItem(value);
    this.renderValueState(value, selectedItem);
  }

  private renderValueState(value: string | null, selectedItem: HTMLElement | null): void {
    const label = selectedItem ? getItemText(selectedItem) : this.getAdapterSelectedLabel(value);
    const placeholder = this.getPlaceholder();
    const hasValue = value !== null && label !== null;

    if (hasValue) {
      this.root.setAttribute(SELECT_VALUE_DATA_ATTRIBUTE, value);
    } else {
      this.root.removeAttribute(SELECT_VALUE_DATA_ATTRIBUTE);
    }

    if (this.elements.input) {
      this.elements.input.value = hasValue ? value : "";
    }
    setBooleanAttribute(this.root, SELECT_PLACEHOLDER_ATTRIBUTE, !hasValue);
    setBooleanAttribute(this.elements.trigger, SELECT_PLACEHOLDER_ATTRIBUTE, !hasValue);

    this.elements.valueElements.forEach((element) => {
      element.textContent = hasValue ? label : placeholder;
    });
  }

  private getAdapterSelectedLabel(value: string | null): string | null {
    if (value === null) return null;
    if (this.root.getAttribute(SELECT_SELECTED_VALUE_ATTRIBUTE) !== value) return null;

    return this.root.getAttribute(SELECT_SELECTED_LABEL_ATTRIBUTE);
  }

  private restoreTriggerFocus(): void {
    if (this.destroyed || !this.elements.trigger.isConnected) return;

    this.elements.trigger.focus({ preventScroll: true });
  }

  private createLifecycle(): FloatingListLifecycle<OpenRequest> {
    return createFloatingListLifecycle<OpenRequest>({
      dismissal: {
        closeOnEscape: () => true,
        closeOnOutsideInteract: () => true,
        onEscapeKeyDown: (event) => {
          if (event.defaultPrevented) return;

          event.preventDefault();
          this.requestOpen(false, { event, reason: "escape-key" });
        },
        onOutsidePointerDown: (event) => {
          this.requestOpen(false, { event, reason: "outside-press" });
        },
      },
      floating: {
        createPositioner: () => this.getFloatingPositionerForLifecycle(),
        getReference: () =>
          this.reference instanceof HTMLElement ? this.reference : this.elements.trigger,
        shouldUse: () => !this.shouldAlignItemWithTrigger() && !this.alignItemWithTriggerActive,
      },
      hooks: {
        onAfterOpen: () => {
          this.positionPopup();
          if (this.alignItemWithTriggerActive) {
            this.startAlignedAutoUpdate();
          }
          this.queuePendingFocus();
        },
        onBeforeClose: () => {
          this.clearTypeaheadTimer();
          this.clearAlignedPositionRetry();
          this.stopAlignedAutoUpdate();
          this.floatingPositioner?.stopAutoUpdate();
          this.stopItemObserver();
          this.pointerTypeForOpen = null;
        },
        onBeforeOpen: () => {
          this.startItemObserver();
          this.prepareOpenItems();
        },
        onOpenFrame: () => {
          this.prepareOpenItems();
          this.positionPopup();
          this.queueAlignedPositionRetry();
        },
      },
      popup: this.elements.popup,
      portal: {
        clearFloatingStyles: () => this.clearFloatingStyles(),
        containsTarget: (target) => this.containsTarget(target),
        getElement: () => this.getPortalElement(),
        getTarget: () =>
          resolveFloatingPortalTarget(
            this.portalReference ?? this.elements.trigger ?? this.reference,
          ),
      },
      root: this.root,
      scrollLock: {
        lockDocumentScroll,
        shouldLock: () => this.modal,
      },
      state: {
        getOpen: () => this.openState,
        isDestroyed: () => this.destroyed,
        render: (open) => {
          this.renderOpenState(open);
          if (!open) {
            this.invalidateItems();
          }
        },
      },
    });
  }

  private getPortalElement(): HTMLElement {
    return this.elements.positioner ?? this.elements.popup;
  }

  private containsTarget(target: Node): boolean {
    const portalElement = this.getPortalElement();

    return (
      this.root.contains(target) ||
      portalElement.contains(target) ||
      Boolean(this.elements.portal?.contains(target))
    );
  }

  private readonly handleFormReset = (): void => {
    this.clearResetTimer();
    this.resetTimer = window.setTimeout(() => {
      this.valueState = this.initialValue;
      this.applyValueState(this.valueState);
      this.resetTimer = undefined;
    }, 0);
  };

  private clearFloatingStyles(): void {
    this.alignItemWithTriggerActive = false;

    const elements = [this.elements.positioner, this.elements.popup].filter(
      (element): element is HTMLElement => element instanceof HTMLElement,
    );

    elements.forEach((element) => {
      element.style.removeProperty("left");
      element.style.removeProperty("max-height");
      element.style.removeProperty("position");
      element.style.removeProperty("top");
      element.style.removeProperty("transform-origin");
      element.style.removeProperty("--anchor-width");
    });
    this.elements.list?.style.removeProperty("max-height");
  }

  private positionPopup(): void {
    if (!this.openState) return;

    this.clearAvailableSpaceStyles();
    const triggerWidth = `${Math.round(this.elements.trigger.getBoundingClientRect().width)}px`;
    this.elements.popup.style.setProperty("--anchor-width", triggerWidth);
    this.elements.positioner?.style.setProperty("--anchor-width", triggerWidth);

    this.setAlignItemWithTriggerAttributes(this.shouldAlignItemWithTrigger());
    if (this.positionPopupWithSelectedItem()) {
      return;
    }

    this.stopAlignedAutoUpdate();
    if (this.shouldAlignItemWithTrigger()) {
      this.getFloatingPositioner()?.startAutoUpdate();
    }
    this.applyAvailableSpaceSize();
    void this.getFloatingPositioner()
      ?.update()
      .then((state) => {
        if (!this.openState || this.destroyed || this.alignItemWithTriggerActive) return;

        this.applyAvailableSpaceSize(state.side);
        return this.getFloatingPositioner()?.update();
      })
      .then(() => {
        if (!this.openState || this.destroyed || this.alignItemWithTriggerActive) return;

        this.updateScrollArrows();
      });
  }

  private getFloatingPositioner(): FloatingPositioner | null {
    if (this.floatingPositioner) return this.floatingPositioner;

    const placementElement = this.elements.positioner ?? this.elements.popup;
    const floating = this.elements.popup;
    const placementStateElements = this.elements.positioner ? [this.elements.positioner] : [];

    this.floatingPositioner = createFloatingPositioner({
      floating,
      getOptions: () => ({
        align: readFloatingAlignAttribute(placementElement.getAttribute(SELECT_ALIGN_ATTRIBUTE)),
        alignOffset: readNumberAttribute(placementElement, SELECT_ALIGN_OFFSET_ATTRIBUTE, 0),
        avoidCollisions: readBooleanAttribute(
          placementElement,
          SELECT_AVOID_COLLISIONS_ATTRIBUTE,
          true,
        ),
        preserveAnchor: true,
        side: readFloatingSideAttribute(placementElement.getAttribute(SELECT_SIDE_ATTRIBUTE)),
        sideOffset: readNumberAttribute(placementElement, SELECT_SIDE_OFFSET_ATTRIBUTE, 4),
      }),
      placementStateElements,
      reference: this.reference ?? this.elements.trigger,
    });

    return this.floatingPositioner;
  }

  private getFloatingPositionerForLifecycle(): FloatingPositioner {
    const positioner = this.getFloatingPositioner();
    if (!positioner) {
      throw new Error("Select floating positioner could not be created.");
    }

    return positioner;
  }

  private startAlignedAutoUpdate(): void {
    if (this.alignedAutoUpdateCleanup || this.destroyed) return;

    this.alignedAutoUpdateCleanup = autoUpdate(
      this.reference ?? this.elements.trigger,
      this.getPortalElement(),
      () => {
        this.positionPopup();
      },
    );
  }

  private stopAlignedAutoUpdate(): void {
    if (!this.alignedAutoUpdateCleanup) return;

    this.alignedAutoUpdateCleanup();
    this.alignedAutoUpdateCleanup = null;
  }

  private queueAlignedPositionRetry(): void {
    if (
      this.alignedPositionRetryFrame !== null ||
      !this.openState ||
      this.alignItemWithTriggerActive ||
      !this.shouldAlignItemWithTrigger() ||
      this.pointerTypeForOpen === "touch"
    ) {
      return;
    }

    this.alignedPositionRetryFrame = window.requestAnimationFrame(() => {
      this.alignedPositionRetryFrame = null;
      if (!this.openState || this.destroyed) return;

      this.prepareOpenItems();
      this.positionPopup();
      if (this.alignItemWithTriggerActive) {
        this.startAlignedAutoUpdate();
      }
      this.queuePendingFocus();
    });
  }

  private clearAlignedPositionRetry(): void {
    if (this.alignedPositionRetryFrame === null) return;

    window.cancelAnimationFrame(this.alignedPositionRetryFrame);
    this.alignedPositionRetryFrame = null;
  }

  private applyAvailableSpaceSize(side?: FloatingSide): void {
    const availableHeight = this.getAvailablePopupHeight(side);
    const popupMaxHeight = `${Math.round(availableHeight)}px`;
    const listMaxHeight = `${Math.max(0, Math.round(availableHeight - this.getScrollArrowReservedHeight()))}px`;
    const scrollContainer = this.getScrollContainer();

    this.elements.positioner?.style.setProperty("max-height", popupMaxHeight);
    this.elements.popup.style.setProperty("max-height", popupMaxHeight);
    scrollContainer.style.setProperty("max-height", listMaxHeight);
  }

  private clearAvailableSpaceStyles(): void {
    this.elements.positioner?.style.removeProperty("max-height");
    this.elements.popup.style.removeProperty("max-height");
    this.elements.list?.style.removeProperty("max-height");
  }

  private getAvailablePopupHeight(side?: FloatingSide): number {
    const ownerDocument = this.root.ownerDocument;
    const view = ownerDocument.defaultView;
    const viewportHeight =
      view?.visualViewport?.height ??
      view?.innerHeight ??
      ownerDocument.documentElement.clientHeight;
    const referenceRect = (this.reference ?? this.elements.trigger).getBoundingClientRect();
    const placementElement = this.elements.positioner ?? this.elements.popup;
    const sideOffset = readNumberAttribute(placementElement, SELECT_SIDE_OFFSET_ATTRIBUTE, 4);
    const availableAbove = Math.max(
      0,
      referenceRect.top - sideOffset - SELECT_FLOATING_VIEWPORT_PADDING,
    );
    const availableBelow = Math.max(
      0,
      viewportHeight - referenceRect.bottom - sideOffset - SELECT_FLOATING_VIEWPORT_PADDING,
    );

    if (side === "top") return availableAbove;
    if (side === "bottom") return availableBelow;
    if (side === "left" || side === "right") {
      return Math.max(0, viewportHeight - SELECT_FLOATING_VIEWPORT_PADDING * 2);
    }

    return Math.max(availableAbove, availableBelow);
  }

  private getScrollArrowReservedHeight(): number {
    return (
      getElementHeight(this.elements.scrollUpArrow) +
      getElementHeight(this.elements.scrollDownArrow)
    );
  }

  private shouldAlignItemWithTrigger(): boolean {
    const element = this.elements.positioner ?? this.elements.popup;

    return readBooleanAttribute(element, SELECT_ALIGN_ITEM_WITH_TRIGGER_ATTRIBUTE, true);
  }

  private setAlignItemWithTriggerAttributes(value: boolean): void {
    [this.elements.positioner, this.elements.popup].forEach((element) => {
      if (!element) return;

      element.setAttribute(SELECT_ALIGN_ITEM_WITH_TRIGGER_ATTRIBUTE, value ? "true" : "false");
      element.setAttribute(SELECT_ALIGN_TRIGGER_ATTRIBUTE, value ? "true" : "false");
    });
  }

  private positionPopupWithSelectedItem(): boolean {
    this.alignItemWithTriggerActive = false;

    if (!this.shouldAlignItemWithTrigger() || this.pointerTypeForOpen === "touch") {
      this.restoreAuthoredPlacementAttributes();
      return false;
    }

    const selectedItem = this.getSelectedItem();
    const itemText = selectedItem?.querySelector<HTMLElement>(`[${SELECT_ITEM_TEXT_ATTRIBUTE}]`);
    const valueElement = this.elements.valueElements[0];
    if (!selectedItem || !itemText || !valueElement) {
      return false;
    }

    const floating = this.elements.popup;
    const triggerRect = this.elements.trigger.getBoundingClientRect();
    const valueRect = valueElement.getBoundingClientRect();
    const itemTextRect = itemText.getBoundingClientRect();
    const floatingRect = floating.getBoundingClientRect();
    const popupRect = this.elements.popup.getBoundingClientRect();
    const viewportHeight = window.innerHeight || document.documentElement.clientHeight;
    const viewportWidth = window.innerWidth || document.documentElement.clientWidth;

    if (
      viewportHeight <= 0 ||
      viewportWidth <= 0 ||
      triggerRect.top < SELECT_ALIGNED_TRIGGER_EDGE_GUARD ||
      viewportHeight - triggerRect.bottom < SELECT_ALIGNED_TRIGGER_EDGE_GUARD ||
      popupRect.height > viewportHeight - SELECT_ALIGNED_VIEWPORT_PADDING * 2
    ) {
      return false;
    }

    const itemTextOffsetX = itemTextRect.left - floatingRect.left;
    const itemTextOffsetY = itemTextRect.top - floatingRect.top;
    const left = valueRect.left - itemTextOffsetX;
    const top = valueRect.top + (valueRect.height - itemTextRect.height) / 2 - itemTextOffsetY;
    const maxLeft =
      viewportWidth -
      Math.max(popupRect.width, triggerRect.width) -
      SELECT_ALIGNED_VIEWPORT_PADDING;
    const maxTop = viewportHeight - popupRect.height - SELECT_ALIGNED_VIEWPORT_PADDING;

    const alignedLeft = `${Math.round(clamp(left, SELECT_ALIGNED_VIEWPORT_PADDING, maxLeft))}px`;
    const alignedTop = `${Math.round(clamp(top, SELECT_ALIGNED_VIEWPORT_PADDING, maxTop))}px`;

    [this.elements.positioner, this.elements.popup].forEach((element) => {
      if (!element) return;

      element.style.position = "fixed";
      element.style.left = alignedLeft;
      element.style.top = alignedTop;
      element.style.transformOrigin = "center center";
      element.setAttribute(SELECT_SIDE_ATTRIBUTE, SELECT_ALIGNED_SIDE);
      element.setAttribute(SELECT_ALIGN_ATTRIBUTE, "center");
    });

    this.floatingPositioner?.stopAutoUpdate();
    this.lifecycle.stopAutoUpdate();
    this.alignItemWithTriggerActive = true;
    return true;
  }

  private restoreAuthoredPlacementAttributes(): void {
    [this.elements.positioner, this.elements.popup].forEach((element) => {
      if (!element) return;

      setOptionalAttribute(element, SELECT_SIDE_ATTRIBUTE, this.authoredPlacementAttributes.side);
      setOptionalAttribute(element, SELECT_ALIGN_ATTRIBUTE, this.authoredPlacementAttributes.align);
    });
  }

  private getSelectedItem(): HTMLElement | null {
    const items = this.getItems();

    if (this.valueState !== null) {
      const selectedItem = items.find((item) => readItemValue(item) === this.valueState);
      if (selectedItem) return selectedItem;
    }

    return items.find((item) => !isDisabledElement(item)) ?? null;
  }

  private refreshOpenPopupElements(): void {
    this.elements.list = queryPopupElement(this.elements.popup, `[${SELECT_LIST_ATTRIBUTE}]`);
    this.elements.scrollUpArrow = queryPopupElement(
      this.elements.popup,
      `[${SELECT_SCROLL_UP_ARROW_ATTRIBUTE}]`,
    );
    this.elements.scrollDownArrow = queryPopupElement(
      this.elements.popup,
      `[${SELECT_SCROLL_DOWN_ARROW_ATTRIBUTE}]`,
    );

    this.bindScrollContainer(this.getScrollContainer());
    this.bindScrollArrow(this.elements.scrollUpArrow, -1);
    this.bindScrollArrow(this.elements.scrollDownArrow, 1);
  }

  private prepareOpenItems(): HTMLElement[] {
    this.refreshOpenPopupElements();
    this.invalidateItems();
    const items = this.getItems();
    this.reconcileActiveItem(items);
    this.updateItems(items);
    this.applyItemSelectionState(items);
    return items;
  }

  private updateItems(items = this.getItems()): void {
    items.forEach((item, index) => {
      item.setAttribute("role", item.getAttribute("role") ?? "option");
      item.setAttribute("tabindex", index === this.activeIndex ? "0" : "-1");
      item.setAttribute("aria-disabled", isDisabledElement(item) ? "true" : "false");
      ensureId(item, "sw-select-item");
    });
  }

  private getItems(): HTMLElement[] {
    if (!this.openState) {
      return queryPopupElements(this.elements.popup, `[${SELECT_ITEM_ATTRIBUTE}]`);
    }

    if (this.itemCache === null) {
      this.itemCache = queryPopupElements(this.elements.popup, `[${SELECT_ITEM_ATTRIBUTE}]`);
      this.itemIndexCache = new Map(this.itemCache.map((item, index) => [item, index] as const));
    }

    return this.itemCache;
  }

  private invalidateItems(): void {
    this.itemCache = null;
    this.itemIndexCache = null;
  }

  private startItemObserver(): void {
    if (this.itemObserver) return;

    this.itemObserver = new MutationObserver(() => {
      this.refreshItemsAfterMutation();
    });
    this.itemObserver.observe(this.elements.popup, {
      attributeFilter: [SELECT_ITEM_ATTRIBUTE],
      attributes: true,
      childList: true,
      subtree: true,
    });
  }

  private refreshItemsAfterMutation(): void {
    this.invalidateItems();
    const items = this.getItems();
    this.reconcileActiveItem(items);
    if (!this.openState || this.destroyed) return;
    this.updateItems(items);
    this.applyItemSelectionState(items);
    this.updateScrollArrows();
  }

  private reconcileActiveItem(items: HTMLElement[]): void {
    const activeItem =
      this.activeItem ??
      items.find((item) => item.hasAttribute(SELECT_HIGHLIGHTED_ATTRIBUTE)) ??
      null;
    const nextActiveIndex = activeItem ? items.indexOf(activeItem) : -1;

    if (activeItem && nextActiveIndex < 0) {
      renderItemHighlight(activeItem, false);
    }

    this.activeIndex = nextActiveIndex;
    this.activeItem = nextActiveIndex >= 0 ? activeItem : null;
  }

  private stopItemObserver(): void {
    this.itemObserver?.disconnect();
    this.itemObserver = null;
    this.invalidateItems();
  }

  private selectItem(item: HTMLElement, event?: Event): void {
    if (!this.isOwnedItem(item)) {
      this.refreshItemsAfterMutation();
      return;
    }
    if (isDisabledElement(item)) return;

    this.requestValue({
      event,
      item,
      reason: "item-press",
      value: readItemValue(item),
    });
  }

  private isOwnedItem(item: HTMLElement): boolean {
    return (
      item.hasAttribute(SELECT_ITEM_ATTRIBUTE) &&
      item.closest<HTMLElement>(`[${SELECT_POPUP_ATTRIBUTE}]`) === this.elements.popup
    );
  }

  private focusItem(index: number, direction: 1 | -1 = 1): void {
    this.highlightItem(index, { direction, focus: true });
  }

  private highlightItemByElement(item: HTMLElement, options: { focus: boolean }): void {
    const index = this.getCachedItemIndex(item);
    if (index < 0 || isDisabledElement(item)) return;

    this.highlightItemElement(item, index, options);
  }

  private highlightItem(index: number, options: { direction?: 1 | -1; focus: boolean }): void {
    const result = this.getSelectableItemFromIndex(index, options.direction ?? 1);
    if (!result) return;

    this.highlightItemElement(result.item, result.index, options);
  }

  private highlightItemElement(
    item: HTMLElement,
    index: number,
    options: { focus: boolean },
  ): void {
    if (item === this.activeItem) {
      if (options.focus && document.activeElement !== item) item.focus();
      return;
    }

    if (this.activeItem) renderItemHighlight(this.activeItem, false);
    renderItemHighlight(item, true);

    this.activeIndex = index;
    this.activeItem = item;
    if (options.focus) item.focus();
  }

  private getCachedItemIndex(item: HTMLElement): number {
    this.getItems();

    const cachedIndex = this.itemIndexCache?.get(item);
    if (cachedIndex !== undefined) return cachedIndex;

    this.refreshItemsAfterMutation();
    return this.itemIndexCache?.get(item) ?? -1;
  }

  private getSelectableItemFromIndex(
    index: number,
    direction: 1 | -1,
  ): { index: number; item: HTMLElement } | null {
    const items = this.getItems();
    if (items.length === 0 || items.every((item) => isDisabledElement(item))) return null;

    let nextIndex = normalizeIndex(index, items.length);
    for (let offset = 0; offset < items.length; offset += 1) {
      const item = items[nextIndex]!;
      if (!isDisabledElement(item)) return { index: nextIndex, item };
      nextIndex = normalizeIndex(nextIndex + direction, items.length);
    }

    return null;
  }

  private queuePendingFocus(): void {
    const focus = this.pendingFocus;
    if (!focus || !this.openState) return;

    this.pendingFocus = null;
    requestAnimationFrame(() => {
      if (!this.openState || this.destroyed) return;

      const items = this.prepareOpenItems();
      if (items.length === 0) return;

      if (focus === "first") {
        this.focusItem(0, 1);
        return;
      }

      if (focus === "last") {
        this.focusItem(items.length - 1, -1);
        return;
      }

      const selectedIndex = items.findIndex((item) => readItemValue(item) === this.valueState);
      this.focusItem(selectedIndex >= 0 ? selectedIndex : 0, 1);
    });
  }

  private clearHighlightedItems(): void {
    const activeItem = this.activeItem;
    const items = this.itemCache ?? (this.openState ? this.getItems() : []);

    this.activeIndex = -1;
    this.activeItem = null;
    items.forEach((item) => renderItemHighlight(item, false));
    if (activeItem && !items.includes(activeItem)) {
      renderItemHighlight(activeItem, false);
    }
  }

  private focusTypeaheadMatch(key: string): void {
    const allItems = this.getItems();
    const items = allItems.filter((item) => !isDisabledElement(item));
    if (items.length === 0) return;

    this.typeaheadBuffer += key.toLocaleLowerCase();
    this.clearTypeaheadTimer();
    this.typeaheadTimer = window.setTimeout(() => {
      this.typeaheadTimer = null;
      this.typeaheadBuffer = "";
    }, 500);

    const search = getTypeaheadSearch(this.typeaheadBuffer);
    const activeItem = this.activeIndex >= 0 ? allItems[this.activeIndex] : null;
    const currentIndex = activeItem ? items.indexOf(activeItem) : -1;
    const startIndex = Math.max(0, currentIndex + 1);
    const orderedItems = [...items.slice(startIndex), ...items.slice(0, startIndex)];
    const match = orderedItems.find((item) =>
      getItemText(item).toLocaleLowerCase().startsWith(search),
    );
    if (!match) return;

    this.highlightItemByElement(match, { focus: true });
  }

  private findSelectedItem(value: string | null, items?: HTMLElement[]): HTMLElement | null {
    if (value === null) return null;

    if (items) {
      return items.find((item) => readItemValue(item) === value) ?? null;
    }

    const selectedByValue = queryPopupElement(
      this.elements.popup,
      `[${SELECT_ITEM_ATTRIBUTE}][${SELECT_VALUE_DATA_ATTRIBUTE}="${escapeCssString(value)}"]`,
    );
    if (selectedByValue && readItemValue(selectedByValue) === value) {
      return selectedByValue;
    }

    return (
      queryPopupElements(this.elements.popup, `[${SELECT_ITEM_ATTRIBUTE}]`).find(
        (item) => readItemValue(item) === value,
      ) ?? null
    );
  }

  private applyItemSelectionState(
    items: HTMLElement[],
    selectedItem = this.findSelectedItem(this.valueState, items),
  ): void {
    items.forEach((item) => {
      renderItemSelection(item, item === selectedItem);
    });
  }

  private clearTypeaheadTimer(): void {
    if (this.typeaheadTimer === null) return;

    window.clearTimeout(this.typeaheadTimer);
    this.typeaheadTimer = null;
    this.typeaheadBuffer = "";
  }

  private clearResetTimer(): void {
    if (this.resetTimer === undefined) return;

    window.clearTimeout(this.resetTimer);
    this.resetTimer = undefined;
  }

  private syncFormResetListener(): void {
    const nextForm = this.elements.input?.form ?? null;
    if (this.resetForm === nextForm) return;

    this.detachFormResetListener();
    nextForm?.addEventListener("reset", this.handleFormReset);
    this.resetForm = nextForm;
  }

  private detachFormResetListener(): void {
    this.resetForm?.removeEventListener("reset", this.handleFormReset);
    this.resetForm = null;
  }

  private getItemByTarget(target: Element): HTMLElement | null {
    const item = target.closest<HTMLElement>(`[${SELECT_ITEM_ATTRIBUTE}]`);
    if (!item || item.closest<HTMLElement>(`[${SELECT_POPUP_ATTRIBUTE}]`) !== this.elements.popup) {
      return null;
    }

    return item;
  }

  private getPlaceholder(): string {
    return (
      this.elements.valueElements
        .find((element) => element.hasAttribute(SELECT_PLACEHOLDER_ATTRIBUTE))
        ?.getAttribute(SELECT_PLACEHOLDER_ATTRIBUTE) ??
      this.elements.trigger.getAttribute(SELECT_PLACEHOLDER_ATTRIBUTE) ??
      ""
    );
  }

  private notifyOpen(details: SelectOpenChangeDetails): void {
    this.openSubscribers.forEach((callback) => callback(details));
  }

  private notifyValue(details: SelectValueChangeDetails): void {
    this.valueSubscribers.forEach((callback) => callback(details));
  }

  private syncFormInput(): void {
    this.root.setAttribute(SELECT_ROOT_ATTRIBUTE, "");
    setOptionalAttribute(this.root, SELECT_AUTOCOMPLETE_ATTRIBUTE, this.autoComplete ?? null);
    setOptionalAttribute(this.root, SELECT_FORM_ATTRIBUTE, this.form ?? null);
    setOptionalAttribute(this.root, SELECT_NAME_ATTRIBUTE, this.name ?? null);
    setBooleanAttribute(this.root, SELECT_REQUIRED_ATTRIBUTE, this.required);
    this.elements.trigger.setAttribute("aria-required", this.required ? "true" : "false");

    if (!this.elements.input) {
      this.syncFormResetListener();
      return;
    }

    if (!this.formInputDefaultInitialized) {
      this.elements.input.defaultValue = this.initialValue ?? "";
      this.formInputDefaultInitialized = true;
    }

    if (this.name !== undefined) {
      this.elements.input.name = this.name;
    } else {
      this.elements.input.removeAttribute("name");
    }

    this.elements.input.required = this.required;
    if (this.form !== undefined) {
      this.elements.input.setAttribute("form", this.form);
    } else {
      this.elements.input.removeAttribute("form");
    }

    if (this.autoComplete !== undefined) {
      this.elements.input.setAttribute("autocomplete", this.autoComplete);
    } else {
      this.elements.input.removeAttribute("autocomplete");
    }

    this.syncFormResetListener();
  }

  private renderDisabledState(): void {
    setBooleanAttribute(this.root, SELECT_DISABLED_ATTRIBUTE, this.disabled);
    setBooleanAttribute(this.elements.trigger, SELECT_DISABLED_ATTRIBUTE, this.disabled);
    this.elements.trigger.setAttribute("aria-disabled", this.disabled ? "true" : "false");

    if (isDisableableNativeControl(this.elements.trigger)) {
      this.elements.trigger.disabled = this.disabled;
    }

    if (this.elements.input) {
      this.elements.input.disabled = this.disabled;
    }
  }
}

function getSelectElements(root: HTMLElement): SelectElements {
  const triggerWrapper = queryRootElement(root, `[${SELECT_TRIGGER_ATTRIBUTE}]`);
  if (!triggerWrapper) {
    throw new Error("Select requires a [data-sw-select-trigger] element.");
  }

  const popup = queryRootElement(root, `[${SELECT_POPUP_ATTRIBUTE}]`);
  if (!popup) {
    throw new Error("Select requires a [data-sw-select-popup] element.");
  }

  return {
    input: queryRootElement(root, `[${SELECT_INPUT_ATTRIBUTE}]`) as HTMLInputElement | null,
    label: queryRootElement(root, `[${SELECT_LABEL_ATTRIBUTE}]`),
    list: queryRootElement(root, `[${SELECT_LIST_ATTRIBUTE}]`),
    popup,
    portal: queryRootElement(root, `[${SELECT_PORTAL_ATTRIBUTE}]`),
    positioner: queryRootElement(root, `[${SELECT_POSITIONER_ATTRIBUTE}]`),
    scrollDownArrow: queryRootElement(root, `[${SELECT_SCROLL_DOWN_ARROW_ATTRIBUTE}]`),
    scrollUpArrow: queryRootElement(root, `[${SELECT_SCROLL_UP_ARROW_ATTRIBUTE}]`),
    trigger: resolveAsChildControl(triggerWrapper),
    valueElements: queryRootElements(root, `[${SELECT_VALUE_ATTRIBUTE}]`),
  };
}

function queryRootElement(root: HTMLElement, selector: string): HTMLElement | null {
  return queryRootElements(root, selector)[0] ?? null;
}

function queryRootElements(root: HTMLElement, selector: string): HTMLElement[] {
  return Array.from(root.querySelectorAll<HTMLElement>(selector)).filter((element) => {
    const owner = element.closest<HTMLElement>(`[${SELECT_ROOT_ATTRIBUTE}]`);
    return owner === root;
  });
}

function queryPopupElements(popup: HTMLElement, selector: string): HTMLElement[] {
  return Array.from(popup.querySelectorAll<HTMLElement>(selector)).filter((element) => {
    const owner = element.closest<HTMLElement>(`[${SELECT_POPUP_ATTRIBUTE}]`);
    return owner === popup;
  });
}

function queryPopupElement(popup: HTMLElement, selector: string): HTMLElement | null {
  return (
    Array.from(popup.querySelectorAll<HTMLElement>(selector)).find((element) => {
      const owner = element.closest<HTMLElement>(`[${SELECT_POPUP_ATTRIBUTE}]`);
      return owner === popup;
    }) ?? null
  );
}

function readPlacementAttributes(element: HTMLElement): SelectPlacementAttributes {
  return {
    align: element.getAttribute(SELECT_ALIGN_ATTRIBUTE),
    side: element.getAttribute(SELECT_SIDE_ATTRIBUTE),
  };
}

function setOptionalAttribute(element: HTMLElement, name: string, value: string | null): void {
  if (value === null) {
    if (element.hasAttribute(name)) {
      element.removeAttribute(name);
    }
    return;
  }

  if (element.getAttribute(name) !== value) {
    element.setAttribute(name, value);
  }
}

function createOpenChangeDetails(
  details: Omit<SelectOpenChangeDetails, "cancel" | "isCanceled">,
): SelectOpenChangeDetails {
  return createCancelableDetails(details);
}

function shouldRestoreFocusOnClose(reason: SelectOpenChangeReason): boolean {
  return reason === "escape-key" || reason === "item-press";
}

function createValueChangeDetails(
  details: Omit<SelectValueChangeDetails, "cancel" | "isCanceled">,
): SelectValueChangeDetails {
  return createCancelableDetails(details);
}

function readSetValueCommandDetail(event: Event): SetValueCommandDetail | null {
  if (!(event instanceof CustomEvent) || !event.detail || typeof event.detail !== "object") {
    return null;
  }

  const detail = event.detail as Partial<SetValueCommandDetail>;
  if (!Object.hasOwn(detail, "value")) return null;
  if (detail.value !== null && typeof detail.value !== "string") return null;

  return {
    emit: typeof detail.emit === "boolean" ? detail.emit : undefined,
    value: detail.value,
  };
}

function isDisabledElement(element: HTMLElement): boolean {
  return (
    element.hasAttribute("disabled") ||
    element.hasAttribute(SELECT_DISABLED_ATTRIBUTE) ||
    element.getAttribute("aria-disabled") === "true"
  );
}

function isDisableableNativeControl(
  element: HTMLElement,
): element is HTMLButtonElement | HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement {
  return (
    element instanceof HTMLButtonElement ||
    element instanceof HTMLInputElement ||
    element instanceof HTMLSelectElement ||
    element instanceof HTMLTextAreaElement
  );
}

function readOptionalAttribute(element: HTMLElement, name: string): string | undefined {
  return element.getAttribute(name) ?? undefined;
}

function readInitialValue(options: SelectOptions, root: HTMLElement): string | null {
  if (Object.hasOwn(options, "value")) {
    return normalizeValue(options.value) ?? null;
  }

  if (Object.hasOwn(options, "defaultValue")) {
    return normalizeValue(options.defaultValue) ?? null;
  }

  const valueAttribute = root.getAttribute(SELECT_VALUE_DATA_ATTRIBUTE);
  if (valueAttribute !== null) {
    return normalizeValue(valueAttribute) ?? null;
  }

  const defaultValueAttribute = root.getAttribute(SELECT_DEFAULT_VALUE_ATTRIBUTE);
  if (defaultValueAttribute !== null) {
    return normalizeValue(defaultValueAttribute) ?? null;
  }

  return null;
}

function readInitialResetValue(
  options: SelectOptions,
  root: HTMLElement,
  input: HTMLInputElement | null,
): string | null {
  if (Object.hasOwn(options, "defaultValue")) {
    return normalizeValue(options.defaultValue) ?? null;
  }

  const defaultValueAttribute = root.getAttribute(SELECT_DEFAULT_VALUE_ATTRIBUTE);
  if (defaultValueAttribute !== null) {
    return normalizeValue(defaultValueAttribute) ?? null;
  }

  if (input && input.defaultValue.length > 0) {
    return normalizeValue(input.defaultValue) ?? null;
  }

  return readInitialValue(options, root);
}

function normalizeValue(value: string | null | undefined): string | null | undefined {
  if (value === undefined) return undefined;
  if (value === null || value === "") return null;
  return value;
}

function normalizeIndex(index: number, length: number): number {
  return ((index % length) + length) % length;
}

function clamp(value: number, min: number, max: number): number {
  if (max < min) return min;
  return Math.min(Math.max(value, min), max);
}

function readItemValue(item: HTMLElement): string {
  return item.getAttribute(SELECT_VALUE_DATA_ATTRIBUTE) ?? getItemText(item);
}

function getItemText(item: HTMLElement): string {
  const textElement = item.querySelector<HTMLElement>(`[${SELECT_ITEM_TEXT_ATTRIBUTE}]`);
  return (textElement?.textContent ?? item.textContent ?? "").trim();
}

function renderItemHighlight(item: HTMLElement, highlighted: boolean): void {
  item.setAttribute("tabindex", highlighted ? "0" : "-1");
  setBooleanAttribute(item, SELECT_HIGHLIGHTED_ATTRIBUTE, highlighted);
}

function renderItemSelection(item: HTMLElement, selected: boolean): void {
  item.setAttribute("aria-selected", String(selected));
  setBooleanAttribute(item, SELECT_SELECTED_ATTRIBUTE, selected);
  renderItemIndicators(item, selected);
}

function renderItemIndicators(item: HTMLElement, visible: boolean): void {
  item
    .querySelectorAll<HTMLElement>(`[${SELECT_ITEM_INDICATOR_ATTRIBUTE}]`)
    .forEach((indicator) => {
      indicator.hidden = !visible;
      indicator.setAttribute("aria-hidden", "true");
      indicator.setAttribute("data-state", visible ? "checked" : "unchecked");
      setBooleanAttribute(indicator, "data-visible", visible);
      setBooleanAttribute(indicator, "data-hidden", !visible);
    });
}

function renderScrollArrow(arrow: HTMLElement | null, visible: boolean): void {
  if (!arrow) return;

  arrow.hidden = !visible;
  arrow.setAttribute("aria-hidden", "true");
  setBooleanAttribute(arrow, "data-visible", visible);
  setBooleanAttribute(arrow, "data-hidden", !visible);
}

function getElementHeight(element: HTMLElement | null): number {
  if (!element) return 0;

  const visibleHeight = readElementHeight(element);
  if (visibleHeight > 0 || !element.hidden) return visibleHeight;

  const previousVisibility = element.style.visibility;
  const previousPointerEvents = element.style.pointerEvents;

  element.hidden = false;
  element.style.visibility = "hidden";
  element.style.pointerEvents = "none";

  try {
    return readElementHeight(element);
  } finally {
    element.hidden = true;
    element.style.visibility = previousVisibility;
    element.style.pointerEvents = previousPointerEvents;
  }
}

function readElementHeight(element: HTMLElement): number {
  const rectHeight = element.getBoundingClientRect().height;
  if (rectHeight > 0) return rectHeight;

  const styleHeight = Number.parseFloat(element.style.height);
  return Number.isFinite(styleHeight) ? styleHeight : 0;
}

function isTypeaheadKey(event: KeyboardEvent): boolean {
  return event.key.length === 1 && !event.altKey && !event.ctrlKey && !event.metaKey;
}

function getTypeaheadSearch(buffer: string): string {
  const characters = [...buffer];
  return characters.every((character) => character === characters[0]) ? characters[0] : buffer;
}

function escapeCssString(value: string): string {
  return value
    .replace(/\\/g, "\\\\")
    .replace(/"/g, '\\"')
    .replace(/\n/g, "\\A ")
    .replace(/\r/g, "\\D ")
    .replace(/\f/g, "\\C ");
}
