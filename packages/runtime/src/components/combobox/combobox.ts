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

export type ComboboxOpenChangeReason =
  | "escape-key"
  | "focus"
  | "imperative-action"
  | "input"
  | "item-press"
  | "outside-press"
  | "trigger-press";

export type ComboboxValueChangeReason = "clear" | "imperative-action" | "item-press";

export type ComboboxInputValueChangeReason = "clear" | "imperative-action" | "input" | "item-press";

export type ComboboxFilterMode = "contains" | "startsWith";

export type ComboboxOpenChangeDetails = {
  event?: Event;
  open: boolean;
  previousOpen: boolean;
  reason: ComboboxOpenChangeReason;
  trigger?: Element;
  cancel(): void;
  readonly isCanceled: boolean;
};

export type ComboboxValueChangeDetails = {
  event?: Event;
  item?: HTMLElement;
  previousValue: string | null;
  reason: ComboboxValueChangeReason;
  value: string | null;
  cancel(): void;
  readonly isCanceled: boolean;
};

export type ComboboxInputValueChangeDetails = {
  event?: Event;
  inputValue: string;
  previousInputValue: string;
  reason: ComboboxInputValueChangeReason;
  cancel(): void;
  readonly isCanceled: boolean;
};

export type ComboboxOptions = {
  autoComplete?: string;
  defaultFilterValue?: string;
  defaultInputValue?: string;
  defaultOpen?: boolean;
  defaultValue?: string | null;
  defaultValueText?: string;
  disabled?: boolean;
  filterMode?: ComboboxFilterMode;
  form?: string;
  highlightItemOnHover?: boolean;
  inputValue?: string;
  locale?: string;
  modal?: boolean;
  name?: string;
  onInputValueChange?: (inputValue: string, details: ComboboxInputValueChangeDetails) => void;
  onOpenChange?: (open: boolean, details: ComboboxOpenChangeDetails) => void;
  onValueChange?: (value: string | null, details: ComboboxValueChangeDetails) => void;
  open?: boolean;
  portalReference?: Element;
  readOnly?: boolean;
  reference?: Element;
  required?: boolean;
  value?: string | null;
};

export type ComboboxSetOpenOptions = {
  emit?: boolean;
};

export type ComboboxSetValueOptions = {
  emit?: boolean;
};

export type ComboboxSetInputValueOptions = {
  emit?: boolean;
  filter?: boolean;
};

export type ComboboxInstance = {
  readonly root: HTMLElement;
  close(): void;
  destroy(): void;
  getInputValue(): string;
  getOpen(): boolean;
  getValue(): string | null;
  open(): void;
  setDisabled(disabled: boolean): void;
  setFormOptions(
    options: Pick<ComboboxOptions, "autoComplete" | "form" | "name" | "required">,
  ): void;
  setInputValue(inputValue: string, options?: ComboboxSetInputValueOptions): void;
  setOpen(open: boolean, options?: ComboboxSetOpenOptions): void;
  setValue(value: string | null, options?: ComboboxSetValueOptions): void;
  subscribe(
    event: "inputValueChange",
    callback: (details: ComboboxInputValueChangeDetails) => void,
  ): () => void;
  subscribe(
    event: "openChange",
    callback: (details: ComboboxOpenChangeDetails) => void,
  ): () => void;
  subscribe(
    event: "valueChange",
    callback: (details: ComboboxValueChangeDetails) => void,
  ): () => void;
  toggle(): void;
  updatePosition(): void;
};

type ComboboxElements = {
  clear: HTMLElement | null;
  empty: HTMLElement | null;
  hiddenInput: HTMLInputElement | null;
  input: HTMLInputElement;
  inputGroup: HTMLElement | null;
  label: HTMLElement | null;
  list: HTMLElement | null;
  popup: HTMLElement;
  portal: HTMLElement | null;
  positioner: HTMLElement | null;
  trigger: HTMLElement | null;
  valueElements: HTMLElement[];
};

type OpenRequest = {
  event?: Event;
  reason: ComboboxOpenChangeReason;
  trigger?: Element;
};

type ValueRequest = {
  event?: Event;
  item?: HTMLElement;
  reason: ComboboxValueChangeReason;
  value: string | null;
};

type SetValueCommandDetail = {
  emit?: boolean;
  value: string | null;
};

type InputValueRequest = {
  event?: Event;
  inputValue: string;
  reason: ComboboxInputValueChangeReason;
};

const COMBOBOX_ROOT_ATTRIBUTE = "data-sw-combobox";
const COMBOBOX_LABEL_ATTRIBUTE = "data-sw-combobox-label";
const COMBOBOX_INPUT_GROUP_ATTRIBUTE = "data-sw-combobox-input-group";
const COMBOBOX_INPUT_ATTRIBUTE = "data-sw-combobox-input";
const COMBOBOX_TRIGGER_ATTRIBUTE = "data-sw-combobox-trigger";
const COMBOBOX_VALUE_ATTRIBUTE = "data-sw-combobox-value";
const COMBOBOX_CLEAR_ATTRIBUTE = "data-sw-combobox-clear";
const COMBOBOX_HIDDEN_INPUT_ATTRIBUTE = "data-sw-combobox-hidden-input";
const COMBOBOX_PORTAL_ATTRIBUTE = "data-sw-combobox-portal";
const COMBOBOX_POSITIONER_ATTRIBUTE = "data-sw-combobox-positioner";
const COMBOBOX_POPUP_ATTRIBUTE = "data-sw-combobox-popup";
const COMBOBOX_LIST_ATTRIBUTE = "data-sw-combobox-list";
const COMBOBOX_EMPTY_ATTRIBUTE = "data-sw-combobox-empty";
const COMBOBOX_ITEM_ATTRIBUTE = "data-sw-combobox-item";
const COMBOBOX_ITEM_TEXT_ATTRIBUTE = "data-sw-combobox-item-text";
const COMBOBOX_ITEM_INDICATOR_ATTRIBUTE = "data-sw-combobox-item-indicator";
const COMBOBOX_AUTOCOMPLETE_ATTRIBUTE = "data-autocomplete";
const COMBOBOX_DEFAULT_OPEN_ATTRIBUTE = "data-default-open";
const COMBOBOX_DEFAULT_VALUE_ATTRIBUTE = "data-default-value";
const COMBOBOX_DEFAULT_INPUT_VALUE_ATTRIBUTE = "data-default-input-value";
const COMBOBOX_DISABLED_ATTRIBUTE = "data-disabled";
const COMBOBOX_FILTER_MODE_ATTRIBUTE = "data-filter-mode";
const COMBOBOX_FORM_ATTRIBUTE = "data-form";
const COMBOBOX_HIGHLIGHT_ITEM_ON_HOVER_ATTRIBUTE = "data-highlight-item-on-hover";
const COMBOBOX_LOCALE_ATTRIBUTE = "data-locale";
const COMBOBOX_MODAL_ATTRIBUTE = "data-modal";
const COMBOBOX_REQUIRED_ATTRIBUTE = "data-required";
const COMBOBOX_NAME_ATTRIBUTE = "data-name";
const COMBOBOX_READONLY_ATTRIBUTE = "data-readonly";
const COMBOBOX_VALUE_DATA_ATTRIBUTE = "data-value";
const COMBOBOX_INPUT_VALUE_ATTRIBUTE = "data-input-value";
const COMBOBOX_SIDE_ATTRIBUTE = "data-side";
const COMBOBOX_ALIGN_ATTRIBUTE = "data-align";
const COMBOBOX_SIDE_OFFSET_ATTRIBUTE = "data-side-offset";
const COMBOBOX_ALIGN_OFFSET_ATTRIBUTE = "data-align-offset";
const COMBOBOX_AVOID_COLLISIONS_ATTRIBUTE = "data-avoid-collisions";
const COMBOBOX_HIGHLIGHTED_ATTRIBUTE = "data-highlighted";
const COMBOBOX_SELECTED_ATTRIBUTE = "data-selected";
const COMBOBOX_FILTERED_ATTRIBUTE = "data-filtered";
const COMBOBOX_PLACEHOLDER_ATTRIBUTE = "data-placeholder";
const COMBOBOX_EMPTY_STATE_ATTRIBUTE = "data-empty";

const instances = new WeakMap<HTMLElement, ComboboxController>();

registerFieldControlBridge({
  kind: "combobox",
  connect(control, { disabled, name, shouldSyncName }) {
    const combobox = createCombobox(control, { disabled, name });
    combobox.setDisabled(disabled);
    if (shouldSyncName) {
      combobox.setFormOptions({ name });
    }
  },
});

export function createCombobox(root: HTMLElement, options: ComboboxOptions = {}): ComboboxInstance {
  assertHTMLElement(root, "createCombobox root");

  const existing = instances.get(root);
  if (existing) return existing;

  const instance = new ComboboxController(root, options);
  instances.set(root, instance);
  return instance;
}

class ComboboxController implements ComboboxInstance {
  readonly root: HTMLElement;

  private readonly abortController = new AbortController();
  private readonly controlledInputValue: boolean;
  private readonly controlledOpen: boolean;
  private readonly controlledValue: boolean;
  private readonly elements: ComboboxElements;
  private readonly inputValueSubscribers = new Set<
    (details: ComboboxInputValueChangeDetails) => void
  >();
  private readonly onInputValueChange?: (
    inputValue: string,
    details: ComboboxInputValueChangeDetails,
  ) => void;
  private readonly onOpenChange?: (open: boolean, details: ComboboxOpenChangeDetails) => void;
  private readonly onValueChange?: (
    value: string | null,
    details: ComboboxValueChangeDetails,
  ) => void;
  private readonly openSubscribers = new Set<(details: ComboboxOpenChangeDetails) => void>();
  private readonly portalReference: Element | null;
  private readonly readOnly: boolean;
  private readonly reference: Element | null;
  private readonly initialValue: string | null;
  private readonly initialFilterValue: string;
  private readonly initialInputValue: string;
  private readonly lifecycle: FloatingListLifecycle<OpenRequest>;
  private readonly modal: boolean;
  private readonly defaultValueText: string | null;
  private readonly valueSubscribers = new Set<(details: ComboboxValueChangeDetails) => void>();
  private activeIndex = -1;
  private activeItem: HTMLElement | null = null;
  private autoComplete?: string;
  private destroyed = false;
  private disabled: boolean;
  private readonly filterCollator: Intl.Collator;
  private readonly filterMode: ComboboxFilterMode;
  private filterValueState = "";
  private floatingPositioner: FloatingPositioner | null = null;
  private form?: string;
  private readonly highlightItemOnHover: boolean;
  private inputValueState: string;
  private itemCache: HTMLElement[] | null = null;
  private visibleItemCache: HTMLElement[] | null = null;
  private visibleItemIndexCache = new WeakMap<HTMLElement, number>();
  private itemObserver: MutationObserver | null = null;
  private name?: string;
  private openCycleCommitted = false;
  private openCycleFilterValue: string | null = null;
  private openCycleInputValue: string | null = null;
  private openState: boolean;
  private required: boolean;
  private resetForm: HTMLFormElement | null = null;
  private resetTimer: number | undefined;
  private formInputDefaultInitialized = false;
  private suppressNextFocusOpen = false;
  private valueState: string | null;

  constructor(root: HTMLElement, options: ComboboxOptions) {
    this.root = root;
    this.elements = getComboboxElements(root);
    this.controlledInputValue = Object.hasOwn(options, "inputValue");
    this.controlledOpen = Object.hasOwn(options, "open");
    this.controlledValue = Object.hasOwn(options, "value");
    this.autoComplete =
      options.autoComplete ?? readOptionalAttribute(root, COMBOBOX_AUTOCOMPLETE_ATTRIBUTE);
    this.disabled = options.disabled ?? readBooleanAttribute(root, COMBOBOX_DISABLED_ATTRIBUTE);
    this.filterMode = readComboboxFilterMode(
      options.filterMode ?? readOptionalAttribute(root, COMBOBOX_FILTER_MODE_ATTRIBUTE),
    );
    this.filterCollator = new Intl.Collator(
      options.locale ?? readOptionalAttribute(root, COMBOBOX_LOCALE_ATTRIBUTE),
      {
        ignorePunctuation: true,
        sensitivity: "base",
        usage: "search",
      },
    );
    this.form = options.form ?? readOptionalAttribute(root, COMBOBOX_FORM_ATTRIBUTE);
    this.highlightItemOnHover =
      options.highlightItemOnHover ??
      readBooleanAttribute(root, COMBOBOX_HIGHLIGHT_ITEM_ON_HOVER_ATTRIBUTE, true);
    this.name = options.name ?? readOptionalAttribute(root, COMBOBOX_NAME_ATTRIBUTE);
    this.onInputValueChange = options.onInputValueChange;
    this.onOpenChange = options.onOpenChange;
    this.onValueChange = options.onValueChange;
    this.modal = options.modal ?? readBooleanAttribute(root, COMBOBOX_MODAL_ATTRIBUTE, false);
    this.portalReference = options.portalReference ?? null;
    this.readOnly = options.readOnly ?? readBooleanAttribute(root, COMBOBOX_READONLY_ATTRIBUTE);
    this.reference = options.reference ?? null;
    this.required = options.required ?? readBooleanAttribute(root, COMBOBOX_REQUIRED_ATTRIBUTE);
    this.defaultValueText = options.defaultValueText ?? null;
    this.openState =
      options.open ??
      options.defaultOpen ??
      readBooleanAttribute(root, COMBOBOX_DEFAULT_OPEN_ATTRIBUTE, false);
    this.initialValue = readInitialResetValue(options, root, this.elements.hiddenInput);
    this.valueState = readInitialValue(options, root);
    const selectedItem = this.valueState === null ? null : this.getSelectedItem();
    this.inputValueState = readInitialInputValue(options, root, selectedItem);
    this.filterValueState = readInitialFilterValue(
      options,
      root,
      this.inputValueState,
      selectedItem,
    );
    this.initialInputValue = this.inputValueState;
    this.initialFilterValue = this.filterValueState;
    this.lifecycle = this.createLifecycle();

    this.setupAccessibility();
    this.bindEvents();
    this.applyValueState(this.valueState);
    this.applyInputValueState(this.inputValueState);
    this.applyOpenState(this.openState, { reason: "imperative-action" });
  }

  open(): void {
    this.requestOpen(true, { reason: "imperative-action" });
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

  setOpen(open: boolean, options: ComboboxSetOpenOptions = {}): void {
    const previousOpen = this.openState;
    this.openState = open;
    this.applyOpenState(open, { reason: "imperative-action" });

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

  setValue(value: string | null, options: ComboboxSetValueOptions = {}): void {
    const normalizedValue = normalizeValue(value) ?? null;
    const previousValue = this.valueState;

    this.valueState = normalizedValue;
    this.applyValueState(normalizedValue);
    this.syncInputValueFromValue(normalizedValue);
    this.markOpenCycleCommitted();

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

  setInputValue(inputValue: string, options: ComboboxSetInputValueOptions = {}): void {
    const previousInputValue = this.inputValueState;

    this.inputValueState = inputValue;
    this.applyInputValueState(inputValue);
    if (options.filter !== false) {
      this.setFilterValue(inputValue);
    }

    if (options.emit !== false) {
      this.notifyInputValue(
        createInputValueChangeDetails({
          inputValue,
          previousInputValue,
          reason: "imperative-action",
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

  getInputValue(): string {
    return this.inputValueState;
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

  setFormOptions(
    options: Pick<ComboboxOptions, "autoComplete" | "form" | "name" | "required">,
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

  subscribe(
    event: "inputValueChange",
    callback: (details: ComboboxInputValueChangeDetails) => void,
  ): () => void;
  subscribe(
    event: "openChange",
    callback: (details: ComboboxOpenChangeDetails) => void,
  ): () => void;
  subscribe(
    event: "valueChange",
    callback: (details: ComboboxValueChangeDetails) => void,
  ): () => void;
  subscribe(
    event: "inputValueChange" | "openChange" | "valueChange",
    callback:
      | ((details: ComboboxInputValueChangeDetails) => void)
      | ((details: ComboboxOpenChangeDetails) => void)
      | ((details: ComboboxValueChangeDetails) => void),
  ): () => void {
    if (event === "inputValueChange") {
      this.inputValueSubscribers.add(
        callback as (details: ComboboxInputValueChangeDetails) => void,
      );
      return () => {
        this.inputValueSubscribers.delete(
          callback as (details: ComboboxInputValueChangeDetails) => void,
        );
      };
    }

    if (event === "openChange") {
      this.openSubscribers.add(callback as (details: ComboboxOpenChangeDetails) => void);
      return () => {
        this.openSubscribers.delete(callback as (details: ComboboxOpenChangeDetails) => void);
      };
    }

    if (event === "valueChange") {
      this.valueSubscribers.add(callback as (details: ComboboxValueChangeDetails) => void);
      return () => {
        this.valueSubscribers.delete(callback as (details: ComboboxValueChangeDetails) => void);
      };
    }

    throw new Error(`Unsupported Combobox event: ${event}`);
  }

  destroy(): void {
    if (this.destroyed) return;

    this.abortController.abort();
    this.detachFormResetListener();
    this.clearResetTimer();
    this.inputValueSubscribers.clear();
    this.openSubscribers.clear();
    this.valueSubscribers.clear();
    this.openState = false;
    this.stopItemObserver();
    this.renderOpenState(false);
    this.lifecycle.destroy();
    this.elements.popup.hidden = true;
    instances.delete(this.root);
    this.destroyed = true;
  }

  private setupAccessibility(): void {
    const { clear, hiddenInput, input, label, popup, trigger } = this.elements;
    const popupId = ensureId(popup, "sw-combobox-popup");
    const inputId = ensureId(input, "sw-combobox-input");

    input.setAttribute("role", input.getAttribute("role") ?? "combobox");
    input.setAttribute("aria-autocomplete", "list");
    input.setAttribute("aria-controls", popupId);
    input.setAttribute("aria-expanded", String(this.openState));
    input.setAttribute("aria-readonly", this.readOnly ? "true" : "false");
    input.readOnly = this.readOnly;

    popup.setAttribute("role", popup.getAttribute("role") ?? "listbox");
    popup.setAttribute("tabindex", popup.getAttribute("tabindex") ?? "-1");
    popup.setAttribute("aria-labelledby", inputId);

    if (label) {
      const labelId = ensureId(label, "sw-combobox-label");
      const labelledBy = new Set(
        (input.getAttribute("aria-labelledby") ?? "").split(/\s+/).filter(Boolean),
      );
      labelledBy.add(labelId);
      input.setAttribute("aria-labelledby", Array.from(labelledBy).join(" "));
      label.addEventListener(
        "click",
        () => {
          input.focus();
        },
        { signal: this.abortController.signal },
      );
    }

    if (trigger) {
      trigger.setAttribute("type", trigger.getAttribute("type") ?? "button");
      trigger.setAttribute("aria-controls", popupId);
      trigger.setAttribute("aria-expanded", String(this.openState));
      trigger.setAttribute("aria-haspopup", "listbox");
      setBooleanAttribute(trigger, COMBOBOX_READONLY_ATTRIBUTE, this.readOnly);
    }

    if (clear) {
      clear.setAttribute("type", clear.getAttribute("type") ?? "button");
      setBooleanAttribute(clear, COMBOBOX_READONLY_ATTRIBUTE, this.readOnly);
    }

    if (hiddenInput) {
      hiddenInput.type = "hidden";
      hiddenInput.tabIndex = -1;
      hiddenInput.setAttribute("aria-hidden", "true");
    }

    this.syncFormInput();
    this.renderDisabledState();
  }

  private bindEvents(): void {
    const { clear, input, inputGroup, popup, trigger } = this.elements;
    const { signal } = this.abortController;

    this.root.addEventListener(
      "starwind:set-value",
      (event) => {
        const detail = readSetValueCommandDetail(event);
        if (!detail) return;

        this.setValue(detail.value, { emit: detail.emit });
      },
      { signal },
    );

    input.addEventListener(
      "pointerdown",
      (event) => {
        if (this.disabled || isDisabledElement(input)) return;
        this.requestOpen(true, { event, reason: "trigger-press", trigger: input });
      },
      { signal },
    );

    input.addEventListener(
      "focus",
      (event) => {
        if (this.suppressNextFocusOpen) {
          this.suppressNextFocusOpen = false;
          return;
        }
        if (this.disabled || isDisabledElement(input)) return;
        this.requestOpen(true, { event, reason: "focus", trigger: input });
      },
      { signal },
    );

    input.addEventListener(
      "input",
      (event) => {
        if (this.disabled || isDisabledElement(input)) return;
        if (this.readOnly) {
          input.value = this.inputValueState;
          return;
        }

        const nextInputValue = input.value;
        this.requestOpen(true, { event, reason: "input", trigger: input });
        this.requestInputValue({
          event,
          inputValue: nextInputValue,
          reason: "input",
        });
        this.setFilterValue(nextInputValue);
      },
      { signal },
    );

    input.addEventListener(
      "keydown",
      (event) => {
        if (this.disabled || isDisabledElement(input)) return;

        switch (event.key) {
          case "ArrowDown":
            event.preventDefault();
            this.requestOpen(true, { event, reason: "trigger-press", trigger: input });
            this.highlightRelativeItem(1);
            break;
          case "ArrowUp":
            event.preventDefault();
            this.requestOpen(true, { event, reason: "trigger-press", trigger: input });
            this.highlightRelativeItem(-1);
            break;
          case "Enter":
            if (!this.openState || this.activeIndex < 0) return;
            event.preventDefault();
            this.selectActiveItem(event);
            break;
          case "Escape":
            if (!this.openState) return;
            event.preventDefault();
            this.requestOpen(false, { event, reason: "escape-key" });
            break;
        }
      },
      { signal },
    );

    inputGroup?.addEventListener(
      "pointerdown",
      (event) => {
        if (this.disabled || !(event.target instanceof Node)) return;
        if (event.target === input || input.contains(event.target)) return;
        if (clear?.contains(event.target) || trigger?.contains(event.target)) return;
        if (trigger && event.target === trigger) return;
        if (clear && event.target === clear) return;

        this.requestOpen(true, { event, reason: "trigger-press", trigger: inputGroup });
        input.focus();
      },
      { signal },
    );

    trigger?.addEventListener(
      "click",
      (event) => {
        if (this.disabled || isDisabledElement(trigger)) return;
        event.preventDefault();
        this.requestOpen(!this.openState, {
          event,
          reason: "trigger-press",
          trigger,
        });
        this.focusInputWithoutOpening();
      },
      { signal },
    );

    clear?.addEventListener(
      "click",
      (event) => {
        if (this.disabled || this.readOnly || isDisabledElement(clear)) {
          event.preventDefault();
          return;
        }
        event.preventDefault();
        const accepted = this.requestValue({ event, reason: "clear", value: null });
        if (!accepted) return;

        this.requestInputValue({ event, inputValue: "", reason: "clear" });
        this.setFilterValue("");
        this.focusInputWithoutOpening();
      },
      { signal },
    );

    popup.addEventListener(
      "pointerdown",
      (event) => {
        if (!this.openState || !(event.target instanceof Element)) return;

        const item = this.getItemByTarget(event.target);
        if (!item || item.hidden) return;

        event.preventDefault();
      },
      { signal },
    );

    popup.addEventListener(
      "click",
      (event) => {
        if (!this.openState || !(event.target instanceof Element)) return;

        const item = this.getItemByTarget(event.target);
        if (!item || isDisabledElement(item) || item.hidden) return;

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
        if (!item || isDisabledElement(item) || item.hidden) return;

        this.highlightItemByElement(item);
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
            this.highlightRelativeItem(1);
            break;
          case "ArrowUp":
            event.preventDefault();
            this.highlightRelativeItem(-1);
            break;
          case "Home":
            event.preventDefault();
            this.highlightItem(0);
            break;
          case "End":
            event.preventDefault();
            this.highlightItem(this.getFreshVisibleItems().length - 1);
            break;
          case "Escape":
            event.preventDefault();
            this.requestOpen(false, { event, reason: "escape-key" });
            this.focusInputWithoutOpening();
            break;
          case "Enter":
          case " ":
            if (this.activeIndex < 0) return;
            event.preventDefault();
            this.selectActiveItem(event);
            break;
        }
      },
      { signal },
    );
  }

  private requestOpen(open: boolean, request: OpenRequest): boolean {
    if (open === this.openState && !this.controlledOpen) return false;

    const previousOpen = this.openState;
    const result = runOverlayOpenChangeShell({
      root: this.root,
      controlled: this.controlledOpen,
      createDetails: createOpenChangeDetails,
      open,
      previousOpen,
      request,
      onApplyUncontrolledOpenState: () => {
        this.openState = open;
        this.applyOpenState(open, request);
      },
      onNotifyOpenChangeSubscribers: (details) => this.notifyOpen(details),
      onOpenChange: (nextOpen, details) => {
        this.onOpenChange?.(nextOpen, details);
      },
    });
    return result.status === "applied";
  }

  private requestValue(request: ValueRequest): boolean {
    if (this.readOnly) return false;

    if (request.value === this.valueState && !this.controlledValue) {
      this.markOpenCycleCommitted();
      return true;
    }

    const details = createValueChangeDetails({
      event: request.event,
      item: request.item,
      previousValue: this.valueState,
      reason: request.reason,
      value: request.value,
    });

    this.onValueChange?.(request.value, details);
    const event = dispatchCustomEvent(this.root, "starwind:value-change", details, {
      cancelable: true,
    });
    if (event.defaultPrevented) details.cancel();
    if (details.isCanceled) return false;

    if (!this.controlledValue) {
      this.valueState = request.value;
      this.applyValueState(request.value);
    }

    this.notifyValue(details);
    this.markOpenCycleCommitted();
    return true;
  }

  private requestInputValue(request: InputValueRequest): void {
    if (this.readOnly) {
      this.elements.input.value = this.inputValueState;
      return;
    }

    if (request.inputValue === this.inputValueState && !this.controlledInputValue) return;

    const details = createInputValueChangeDetails({
      event: request.event,
      inputValue: request.inputValue,
      previousInputValue: this.inputValueState,
      reason: request.reason,
    });

    this.onInputValueChange?.(request.inputValue, details);
    const event = dispatchCustomEvent(this.root, "starwind:input-value-change", details, {
      cancelable: true,
    });
    if (event.defaultPrevented) details.cancel();
    if (details.isCanceled) return;

    if (!this.controlledInputValue) {
      this.inputValueState = request.inputValue;
      this.applyInputValueState(request.inputValue);
    } else {
      this.elements.input.value = this.inputValueState;
    }

    this.notifyInputValue(details);
  }

  private applyOpenState(open: boolean, request?: OpenRequest): void {
    this.lifecycle.applyOpenState(open, request);
  }

  private renderOpenState(open: boolean): void {
    const state = open ? "open" : "closed";

    this.root.setAttribute(COMBOBOX_ROOT_ATTRIBUTE, "");
    this.root.setAttribute("data-state", state);
    setBooleanAttribute(this.root, COMBOBOX_READONLY_ATTRIBUTE, this.readOnly);
    this.elements.input.readOnly = this.readOnly;
    this.elements.input.setAttribute("aria-readonly", this.readOnly ? "true" : "false");
    this.elements.input.setAttribute("aria-expanded", String(open));
    this.elements.input.setAttribute("data-state", state);
    setBooleanAttribute(this.elements.input, COMBOBOX_READONLY_ATTRIBUTE, this.readOnly);
    this.elements.popup.setAttribute("data-state", state);
    this.elements.positioner?.setAttribute("data-state", state);
    this.elements.trigger?.setAttribute("data-state", state);
    this.elements.trigger?.setAttribute("aria-expanded", String(open));
    if (this.elements.trigger) {
      setBooleanAttribute(this.elements.trigger, COMBOBOX_READONLY_ATTRIBUTE, this.readOnly);
    }
    if (this.elements.clear) {
      setBooleanAttribute(this.elements.clear, COMBOBOX_READONLY_ATTRIBUTE, this.readOnly);
    }
    this.renderDisabledState();

    if (open) {
      showElement(this.elements.popup);
      this.updateFilteredItems();
    } else if (this.activeIndex >= 0 || this.activeItem) {
      this.clearHighlightedItems();
    }
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
        getReference: () => {
          const reference = this.getReference();
          return reference instanceof HTMLElement ? reference : this.elements.input;
        },
      },
      hooks: {
        onAfterOpen: () => {
          this.positionPopup();
        },
        onBeforeClose: () => {
          this.stopItemObserver();
        },
        onBeforeOpen: () => {
          this.beginOpenCycle();
          this.invalidateItems();
          this.startItemObserver();
          const items = this.getItems();
          this.updateItems(items);
          this.renderItemSelectionState(items, this.getSelectedItem(items));
        },
        onCloseComplete: () => {
          this.completeOpenCycle();
        },
        onOpenFrame: () => {
          this.positionPopup();
        },
      },
      popup: this.elements.popup,
      portal: {
        clearFloatingStyles: () => this.clearFloatingStyles(),
        containsTarget: (target) => this.containsTarget(target),
        getElement: () => this.getPortalElement(),
        getTarget: () => resolveFloatingPortalTarget(this.portalReference ?? this.getReference()),
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

  private applyValueState(value: string | null): void {
    const shouldUpdateItems = this.openState || value !== null;
    if (shouldUpdateItems) {
      this.invalidateItems();
    }
    const items = shouldUpdateItems ? this.getItems() : [];
    if (shouldUpdateItems) {
      this.reconcileActiveItem(items);
      this.updateItems(items);
    }

    const selectedItem = value === null ? null : this.getSelectedItem(items);
    const label = selectedItem
      ? getItemText(selectedItem)
      : value === null
        ? null
        : this.defaultValueText;
    const placeholder = this.getPlaceholder();
    const hasValue = value !== null && label !== null;

    if (hasValue) {
      this.root.setAttribute(COMBOBOX_VALUE_DATA_ATTRIBUTE, value);
    } else {
      this.root.removeAttribute(COMBOBOX_VALUE_DATA_ATTRIBUTE);
    }

    if (this.elements.hiddenInput) {
      this.elements.hiddenInput.value = hasValue ? value : "";
    }

    setBooleanAttribute(this.root, COMBOBOX_PLACEHOLDER_ATTRIBUTE, !hasValue);
    this.elements.valueElements.forEach((element) => {
      element.textContent = hasValue ? label : placeholder;
    });

    this.renderItemSelectionState(items, selectedItem);
  }

  private applyInputValueState(inputValue: string): void {
    this.elements.input.value = inputValue;
    if (inputValue) {
      this.root.setAttribute(COMBOBOX_INPUT_VALUE_ATTRIBUTE, inputValue);
    } else {
      this.root.removeAttribute(COMBOBOX_INPUT_VALUE_ATTRIBUTE);
    }
  }

  private syncInputValueFromValue(value: string | null): void {
    if (this.controlledInputValue) return;

    const selectedItem = value === null ? null : this.getSelectedItem();
    const inputValue = selectedItem ? getItemText(selectedItem) : "";
    this.inputValueState = inputValue;
    this.applyInputValueState(inputValue);
    this.filterValueState = "";
    if (this.openState) {
      this.updateFilteredItems({ clearHighlight: false });
    }
  }

  private beginOpenCycle(): void {
    this.openCycleCommitted = false;
    this.openCycleInputValue = this.inputValueState;
    this.openCycleFilterValue = this.filterValueState;
  }

  private markOpenCycleCommitted(): void {
    if (this.openCycleInputValue === null) return;

    this.openCycleCommitted = true;
  }

  private completeOpenCycle(): void {
    if (this.openCycleInputValue === null) return;

    if (!this.openCycleCommitted) {
      this.restoreOpenCycleInput();
    }

    this.openCycleCommitted = false;
    this.openCycleInputValue = null;
    this.openCycleFilterValue = null;
  }

  private restoreOpenCycleInput(): void {
    if (this.controlledInputValue) return;

    this.inputValueState = this.openCycleInputValue ?? "";
    this.filterValueState = this.openCycleFilterValue ?? "";
    this.applyInputValueState(this.inputValueState);
  }

  private selectItem(item: HTMLElement, event?: Event): void {
    if (!this.isOwnedItem(item) || item.hidden) {
      this.refreshItemsAfterMutation();
      return;
    }
    if (this.readOnly || isDisabledElement(item)) return;

    const value = readItemValue(item);
    const text = getItemText(item);
    const accepted = this.requestValue({ event, item, reason: "item-press", value });
    if (!accepted) return;

    this.requestInputValue({ event, inputValue: text, reason: "item-press" });
    const closeApplied = this.requestOpen(false, { event, reason: "item-press", trigger: item });
    this.filterValueState = "";
    if (!closeApplied || this.openState) {
      this.updateFilteredItems({ clearHighlight: false });
    }
    this.focusInputWithoutOpening();
  }

  private selectActiveItem(event?: Event): void {
    const item = this.getActiveItem();
    if (!item) return;

    this.selectItem(item, event);
  }

  private focusInputWithoutOpening(): void {
    if (document.activeElement === this.elements.input) return;

    this.suppressNextFocusOpen = true;
    this.elements.input.focus();

    if (document.activeElement !== this.elements.input) {
      this.suppressNextFocusOpen = false;
    }
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

      this.inputValueState = this.initialInputValue;
      this.filterValueState = this.initialFilterValue;
      this.applyInputValueState(this.inputValueState);
      if (this.openState) {
        this.updateFilteredItems();
      }
      this.resetTimer = undefined;
    }, 0);
  };

  private clearFloatingStyles(): void {
    const elements = [this.elements.positioner, this.elements.popup].filter(
      (element): element is HTMLElement => element instanceof HTMLElement,
    );

    elements.forEach((element) => {
      element.style.removeProperty("left");
      element.style.removeProperty("position");
      element.style.removeProperty("top");
      element.style.removeProperty("transform-origin");
      element.style.removeProperty("--anchor-width");
    });
  }

  private positionPopup(): void {
    if (!this.openState) return;

    const reference = this.getReference();
    const anchorWidth = `${Math.round(reference.getBoundingClientRect().width)}px`;
    this.elements.popup.style.setProperty("--anchor-width", anchorWidth);
    this.elements.positioner?.style.setProperty("--anchor-width", anchorWidth);

    void this.getFloatingPositioner()?.update();
  }

  private getFloatingPositioner(): FloatingPositioner | null {
    if (this.floatingPositioner) return this.floatingPositioner;

    const placementElement = this.elements.positioner ?? this.elements.popup;
    const floating = this.elements.popup;
    const placementStateElements = this.elements.positioner ? [this.elements.positioner] : [];

    this.floatingPositioner = createFloatingPositioner({
      floating,
      getOptions: () => ({
        align: readFloatingAlignAttribute(placementElement.getAttribute(COMBOBOX_ALIGN_ATTRIBUTE)),
        alignOffset: readNumberAttribute(placementElement, COMBOBOX_ALIGN_OFFSET_ATTRIBUTE, 0),
        avoidCollisions: readBooleanAttribute(
          placementElement,
          COMBOBOX_AVOID_COLLISIONS_ATTRIBUTE,
          true,
        ),
        preserveAnchor: true,
        side: readFloatingSideAttribute(placementElement.getAttribute(COMBOBOX_SIDE_ATTRIBUTE)),
        sideOffset: readNumberAttribute(placementElement, COMBOBOX_SIDE_OFFSET_ATTRIBUTE, 6),
      }),
      placementStateElements,
      reference: this.getReference(),
    });

    return this.floatingPositioner;
  }

  private getFloatingPositionerForLifecycle(): FloatingPositioner {
    const positioner = this.getFloatingPositioner();
    if (!positioner) {
      throw new Error("Combobox floating positioner could not be created.");
    }

    return positioner;
  }

  private getReference(): Element {
    return this.reference ?? this.elements.inputGroup ?? this.elements.input;
  }

  private updateItems(items = this.getItems()): void {
    items.forEach((item) => {
      item.setAttribute("role", item.getAttribute("role") ?? "option");
      item.setAttribute("tabindex", "-1");
      item.setAttribute("aria-disabled", isDisabledElement(item) ? "true" : "false");
      ensureId(item, "sw-combobox-item");
    });
  }

  private updateFilteredItems({
    clearHighlight = true,
    items = this.getItems(),
  }: {
    clearHighlight?: boolean;
    items?: HTMLElement[];
  } = {}): void {
    const query = this.filterValueState.trim();
    let visibleCount = 0;

    items.forEach((item) => {
      const matches =
        query === "" ||
        this.matchesFilter(getItemText(item), query) ||
        this.matchesFilter(readItemValue(item), query);

      item.hidden = !matches;
      setBooleanAttribute(item, COMBOBOX_FILTERED_ATTRIBUTE, !matches);
      if (matches) visibleCount += 1;
    });
    this.rebuildVisibleItemCache(items);

    const empty = visibleCount === 0;
    if (this.elements.empty) {
      this.elements.empty.hidden = !empty;
    }
    setBooleanAttribute(this.root, COMBOBOX_EMPTY_STATE_ATTRIBUTE, empty);
    setBooleanAttribute(this.elements.popup, COMBOBOX_EMPTY_STATE_ATTRIBUTE, empty);

    if (clearHighlight && (this.activeIndex >= 0 || this.activeItem)) {
      this.clearHighlightedItems();
    } else {
      this.reconcileActiveItem(items);
    }
  }

  private renderItemSelectionState(items: HTMLElement[], selectedItem: HTMLElement | null): void {
    items.forEach((item) => {
      const selected = selectedItem === item;
      item.setAttribute("aria-selected", String(selected));
      setBooleanAttribute(item, COMBOBOX_SELECTED_ATTRIBUTE, selected);
      renderItemIndicators(item, selected);
    });
  }

  private matchesFilter(candidate: string, query: string): boolean {
    if (this.filterMode === "startsWith") {
      return collatorStartsWith(this.filterCollator, candidate, query);
    }

    return collatorContains(this.filterCollator, candidate, query);
  }

  private getItems(): HTMLElement[] {
    if (!this.openState) {
      return queryPopupElements(this.elements.popup, `[${COMBOBOX_ITEM_ATTRIBUTE}]`);
    }

    this.itemCache ??= queryPopupElements(this.elements.popup, `[${COMBOBOX_ITEM_ATTRIBUTE}]`);
    return this.itemCache;
  }

  private invalidateItems(): void {
    this.itemCache = null;
    this.invalidateVisibleItems();
  }

  private invalidateVisibleItems(): void {
    this.visibleItemCache = null;
    this.visibleItemIndexCache = new WeakMap();
  }

  private rebuildVisibleItemCache(items = this.getItems()): HTMLElement[] {
    const visibleItems = items.filter(
      (item) => this.isOwnedItem(item) && !item.hidden && !isDisabledElement(item),
    );
    const visibleItemIndexCache = new WeakMap<HTMLElement, number>();
    visibleItems.forEach((item, index) => {
      visibleItemIndexCache.set(item, index);
    });

    this.visibleItemCache = visibleItems;
    this.visibleItemIndexCache = visibleItemIndexCache;

    return visibleItems;
  }

  private startItemObserver(): void {
    if (this.itemObserver) return;

    this.itemObserver = new MutationObserver(() => {
      this.refreshItemsAfterMutation();
    });
    this.itemObserver.observe(this.elements.popup, {
      attributeFilter: [COMBOBOX_DISABLED_ATTRIBUTE, COMBOBOX_ITEM_ATTRIBUTE],
      attributes: true,
      childList: true,
      subtree: true,
    });
  }

  private refreshItemsAfterMutation(): void {
    this.invalidateItems();
    this.refreshDynamicElements();
    const items = this.getItems();
    this.updateItems(items);
    this.renderItemSelectionState(items, this.getSelectedItem(items));
    this.updateFilteredItems({ clearHighlight: false, items });
  }

  private refreshDynamicElements(): void {
    this.elements.empty = queryPopupElement(this.elements.popup, `[${COMBOBOX_EMPTY_ATTRIBUTE}]`);
    this.elements.list = queryPopupElement(this.elements.popup, `[${COMBOBOX_LIST_ATTRIBUTE}]`);
    this.elements.valueElements = queryRootElements(this.root, `[${COMBOBOX_VALUE_ATTRIBUTE}]`);
  }

  private stopItemObserver(): void {
    this.itemObserver?.disconnect();
    this.itemObserver = null;
    this.invalidateItems();
  }

  private getVisibleItems(items = this.getItems()): HTMLElement[] {
    if (this.openState && items === this.itemCache && this.visibleItemCache) {
      return this.visibleItemCache;
    }

    return this.rebuildVisibleItemCache(items);
  }

  private getFreshVisibleItems(items = this.getItems()): HTMLElement[] {
    return this.rebuildVisibleItemCache(items);
  }

  private getVisibleItemIndex(item: HTMLElement): number {
    if (!this.visibleItemCache) {
      this.getVisibleItems();
    }

    return this.visibleItemIndexCache.get(item) ?? -1;
  }

  private getSelectedItem(items = this.getItems()): HTMLElement | null {
    return this.valueState === null
      ? null
      : (items.find((item) => readItemValue(item) === this.valueState) ?? null);
  }

  private getPlaceholder(): string {
    return (
      this.elements.valueElements
        .find((element) => element.hasAttribute(COMBOBOX_PLACEHOLDER_ATTRIBUTE))
        ?.getAttribute(COMBOBOX_PLACEHOLDER_ATTRIBUTE) ??
      this.elements.input.getAttribute("placeholder") ??
      ""
    );
  }

  private highlightItem(index: number): void {
    const items = this.getFreshVisibleItems();
    if (items.length === 0) return;

    const normalizedIndex = (index + items.length) % items.length;
    const item = items[normalizedIndex]!;
    this.highlightItemByElement(item);
  }

  private highlightRelativeItem(delta: 1 | -1): void {
    const items = this.getFreshVisibleItems();
    if (items.length === 0) return;

    const currentIndex = this.activeItem ? items.indexOf(this.activeItem) : -1;
    const nextIndex = currentIndex < 0 ? (delta > 0 ? 0 : items.length - 1) : currentIndex + delta;
    const normalizedIndex = (nextIndex + items.length) % items.length;
    const item = items[normalizedIndex]!;
    this.highlightItemByElement(item);
  }

  private highlightItemByElement(item: HTMLElement): void {
    let index = this.getVisibleItemIndex(item);
    if (index < 0 && this.isOwnedItem(item) && !item.hidden && !isDisabledElement(item)) {
      this.refreshItemsAfterMutation();
      index = this.getVisibleItemIndex(item);
    }
    if (index < 0) return;

    if (this.activeItem === item) {
      this.activeIndex = index;
      return;
    }

    if (this.activeItem) {
      renderItemHighlight(this.activeItem, false);
    }
    renderItemHighlight(item, true);

    this.activeIndex = index;
    this.activeItem = item;
    this.elements.input.setAttribute("aria-activedescendant", item.id);
  }

  private clearHighlightedItems(): void {
    const activeItem = this.activeItem;
    const items = this.getItems();

    this.activeIndex = -1;
    this.activeItem = null;
    this.elements.input.removeAttribute("aria-activedescendant");
    items.forEach((item) => renderItemHighlight(item, false));
    if (activeItem && !items.includes(activeItem)) {
      renderItemHighlight(activeItem, false);
    }
  }

  private setFilterValue(filterValue: string): void {
    this.filterValueState = filterValue;
    this.updateFilteredItems();
  }

  private getActiveItem(): HTMLElement | null {
    if (this.activeItem) {
      if (
        this.isOwnedItem(this.activeItem) &&
        !this.activeItem.hidden &&
        !isDisabledElement(this.activeItem)
      ) {
        return this.activeItem;
      }

      this.refreshItemsAfterMutation();
      return null;
    }

    const visibleItems = this.getVisibleItems();
    const item = this.activeIndex >= 0 ? (visibleItems[this.activeIndex] ?? null) : null;
    if (item) {
      this.activeItem = item;
      return item;
    }

    this.reconcileActiveItem(this.getItems());
    return null;
  }

  private reconcileActiveItem(items: HTMLElement[]): void {
    const visibleItems = this.getVisibleItems(items);
    const activeItem =
      this.activeItem ??
      visibleItems.find((item) => item.hasAttribute(COMBOBOX_HIGHLIGHTED_ATTRIBUTE)) ??
      null;
    const nextActiveIndex = activeItem ? visibleItems.indexOf(activeItem) : -1;

    if (activeItem && nextActiveIndex < 0) {
      renderItemHighlight(activeItem, false);
    }

    this.activeIndex = nextActiveIndex;
    this.activeItem = nextActiveIndex >= 0 ? activeItem : null;

    if (this.activeItem) {
      this.elements.input.setAttribute("aria-activedescendant", this.activeItem.id);
    } else {
      this.elements.input.removeAttribute("aria-activedescendant");
    }
  }

  private getItemByTarget(target: Element): HTMLElement | null {
    const item = target.closest<HTMLElement>(`[${COMBOBOX_ITEM_ATTRIBUTE}]`);
    if (
      !item ||
      item.closest<HTMLElement>(`[${COMBOBOX_POPUP_ATTRIBUTE}]`) !== this.elements.popup
    ) {
      return null;
    }

    return item;
  }

  private isOwnedItem(item: HTMLElement): boolean {
    return (
      item.hasAttribute(COMBOBOX_ITEM_ATTRIBUTE) &&
      item.closest<HTMLElement>(`[${COMBOBOX_POPUP_ATTRIBUTE}]`) === this.elements.popup
    );
  }

  private notifyOpen(details: ComboboxOpenChangeDetails): void {
    this.openSubscribers.forEach((callback) => callback(details));
  }

  private notifyValue(details: ComboboxValueChangeDetails): void {
    this.valueSubscribers.forEach((callback) => callback(details));
  }

  private notifyInputValue(details: ComboboxInputValueChangeDetails): void {
    this.inputValueSubscribers.forEach((callback) => callback(details));
  }

  private clearResetTimer(): void {
    if (this.resetTimer === undefined) return;

    window.clearTimeout(this.resetTimer);
    this.resetTimer = undefined;
  }

  private syncFormResetListener(): void {
    const nextForm = this.elements.hiddenInput?.form ?? null;
    if (this.resetForm === nextForm) return;

    this.detachFormResetListener();
    nextForm?.addEventListener("reset", this.handleFormReset);
    this.resetForm = nextForm;
  }

  private detachFormResetListener(): void {
    this.resetForm?.removeEventListener("reset", this.handleFormReset);
    this.resetForm = null;
  }

  private syncFormInput(): void {
    this.root.setAttribute(COMBOBOX_ROOT_ATTRIBUTE, "");
    setOptionalAttribute(this.root, COMBOBOX_AUTOCOMPLETE_ATTRIBUTE, this.autoComplete ?? null);
    setOptionalAttribute(this.root, COMBOBOX_FORM_ATTRIBUTE, this.form ?? null);
    setOptionalAttribute(this.root, COMBOBOX_NAME_ATTRIBUTE, this.name ?? null);
    setBooleanAttribute(this.root, COMBOBOX_REQUIRED_ATTRIBUTE, this.required);

    this.elements.input.setAttribute("aria-required", this.required ? "true" : "false");
    if (this.autoComplete !== undefined) {
      this.elements.input.setAttribute("autocomplete", this.autoComplete);
    } else {
      this.elements.input.removeAttribute("autocomplete");
    }

    if (!this.elements.hiddenInput) {
      this.syncFormResetListener();
      return;
    }

    if (!this.formInputDefaultInitialized) {
      this.elements.hiddenInput.defaultValue = this.initialValue ?? "";
      this.formInputDefaultInitialized = true;
    }

    if (this.name !== undefined) {
      this.elements.hiddenInput.name = this.name;
    } else {
      this.elements.hiddenInput.removeAttribute("name");
    }

    this.elements.hiddenInput.required = this.required;
    if (this.form !== undefined) {
      this.elements.hiddenInput.setAttribute("form", this.form);
    } else {
      this.elements.hiddenInput.removeAttribute("form");
    }

    this.syncFormResetListener();
  }

  private renderDisabledState(): void {
    setBooleanAttribute(this.root, COMBOBOX_DISABLED_ATTRIBUTE, this.disabled);
    setBooleanAttribute(this.elements.input, COMBOBOX_DISABLED_ATTRIBUTE, this.disabled);
    this.elements.input.disabled = this.disabled;
    this.elements.input.setAttribute("aria-disabled", this.disabled ? "true" : "false");

    if (this.elements.inputGroup) {
      setBooleanAttribute(this.elements.inputGroup, COMBOBOX_DISABLED_ATTRIBUTE, this.disabled);
    }

    if (this.elements.hiddenInput) {
      this.elements.hiddenInput.disabled = this.disabled;
    }

    if (this.elements.trigger) {
      setBooleanAttribute(this.elements.trigger, COMBOBOX_DISABLED_ATTRIBUTE, this.disabled);
      this.elements.trigger.setAttribute("aria-disabled", this.disabled ? "true" : "false");
      if (isDisableableNativeControl(this.elements.trigger)) {
        this.elements.trigger.disabled = this.disabled;
      }
    }

    if (this.elements.clear) {
      setBooleanAttribute(this.elements.clear, COMBOBOX_DISABLED_ATTRIBUTE, this.disabled);
      this.elements.clear.setAttribute("aria-disabled", this.disabled ? "true" : "false");
      if (isDisableableNativeControl(this.elements.clear)) {
        this.elements.clear.disabled = this.disabled;
      }
    }
  }
}

function getComboboxElements(root: HTMLElement): ComboboxElements {
  const input = queryRootElement(root, `[${COMBOBOX_INPUT_ATTRIBUTE}]`) as HTMLInputElement | null;
  if (!input) {
    throw new Error("Combobox requires a [data-sw-combobox-input] element.");
  }

  const popup = queryRootElement(root, `[${COMBOBOX_POPUP_ATTRIBUTE}]`);
  if (!popup) {
    throw new Error("Combobox requires a [data-sw-combobox-popup] element.");
  }

  const trigger = queryRootElement(root, `[${COMBOBOX_TRIGGER_ATTRIBUTE}]`);
  const clear = queryRootElement(root, `[${COMBOBOX_CLEAR_ATTRIBUTE}]`);

  return {
    clear: clear ? resolveAsChildControl(clear) : null,
    empty: queryPopupElement(popup, `[${COMBOBOX_EMPTY_ATTRIBUTE}]`),
    hiddenInput: queryRootElement(
      root,
      `[${COMBOBOX_HIDDEN_INPUT_ATTRIBUTE}]`,
    ) as HTMLInputElement | null,
    input,
    inputGroup: queryRootElement(root, `[${COMBOBOX_INPUT_GROUP_ATTRIBUTE}]`),
    label: queryRootElement(root, `[${COMBOBOX_LABEL_ATTRIBUTE}]`),
    list: queryPopupElement(popup, `[${COMBOBOX_LIST_ATTRIBUTE}]`),
    popup,
    portal: queryRootElement(root, `[${COMBOBOX_PORTAL_ATTRIBUTE}]`),
    positioner: queryRootElement(root, `[${COMBOBOX_POSITIONER_ATTRIBUTE}]`),
    trigger: trigger ? resolveAsChildControl(trigger) : null,
    valueElements: queryRootElements(root, `[${COMBOBOX_VALUE_ATTRIBUTE}]`),
  };
}

function queryRootElement(root: HTMLElement, selector: string): HTMLElement | null {
  return queryRootElements(root, selector)[0] ?? null;
}

function queryRootElements(root: HTMLElement, selector: string): HTMLElement[] {
  return Array.from(root.querySelectorAll<HTMLElement>(selector)).filter((element) => {
    const owner = element.closest<HTMLElement>(`[${COMBOBOX_ROOT_ATTRIBUTE}]`);
    return owner === root;
  });
}

function queryPopupElement(popup: HTMLElement, selector: string): HTMLElement | null {
  return queryPopupElements(popup, selector)[0] ?? null;
}

function queryPopupElements(popup: HTMLElement, selector: string): HTMLElement[] {
  return Array.from(popup.querySelectorAll<HTMLElement>(selector)).filter((element) => {
    const owner = element.closest<HTMLElement>(`[${COMBOBOX_POPUP_ATTRIBUTE}]`);
    return owner === popup;
  });
}

function createOpenChangeDetails(
  details: Omit<ComboboxOpenChangeDetails, "cancel" | "isCanceled">,
): ComboboxOpenChangeDetails {
  return createCancelableDetails(details);
}

function createValueChangeDetails(
  details: Omit<ComboboxValueChangeDetails, "cancel" | "isCanceled">,
): ComboboxValueChangeDetails {
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

function createInputValueChangeDetails(
  details: Omit<ComboboxInputValueChangeDetails, "cancel" | "isCanceled">,
): ComboboxInputValueChangeDetails {
  return createCancelableDetails(details);
}

function isDisabledElement(element: HTMLElement): boolean {
  return (
    element.hasAttribute("disabled") ||
    element.hasAttribute(COMBOBOX_DISABLED_ATTRIBUTE) ||
    element.getAttribute("aria-disabled") === "true"
  );
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

function readComboboxFilterMode(value: string | undefined): ComboboxFilterMode {
  return value === "startsWith" ? "startsWith" : "contains";
}

function collatorContains(collator: Intl.Collator, candidate: string, query: string): boolean {
  const normalizedCandidate = candidate.trim();
  const normalizedQuery = query.trim();
  if (normalizedQuery === "") return true;
  if (normalizedCandidate.length < normalizedQuery.length) return false;

  for (let index = 0; index <= normalizedCandidate.length - normalizedQuery.length; index += 1) {
    if (
      collator.compare(
        normalizedCandidate.slice(index, index + normalizedQuery.length),
        normalizedQuery,
      ) === 0
    ) {
      return true;
    }
  }

  return false;
}

function collatorStartsWith(collator: Intl.Collator, candidate: string, query: string): boolean {
  const normalizedCandidate = candidate.trim();
  const normalizedQuery = query.trim();
  if (normalizedQuery === "") return true;
  if (normalizedCandidate.length < normalizedQuery.length) return false;

  return (
    collator.compare(normalizedCandidate.slice(0, normalizedQuery.length), normalizedQuery) === 0
  );
}

function readInitialValue(options: ComboboxOptions, root: HTMLElement): string | null {
  if (Object.hasOwn(options, "value")) {
    return normalizeValue(options.value) ?? null;
  }

  if (Object.hasOwn(options, "defaultValue") && options.defaultValue !== undefined) {
    return normalizeValue(options.defaultValue) ?? null;
  }

  const valueAttribute = root.getAttribute(COMBOBOX_VALUE_DATA_ATTRIBUTE);
  if (valueAttribute !== null) {
    return normalizeValue(valueAttribute) ?? null;
  }

  const defaultValueAttribute = root.getAttribute(COMBOBOX_DEFAULT_VALUE_ATTRIBUTE);
  if (defaultValueAttribute !== null) {
    return normalizeValue(defaultValueAttribute) ?? null;
  }

  return null;
}

function readInitialResetValue(
  options: ComboboxOptions,
  root: HTMLElement,
  hiddenInput: HTMLInputElement | null,
): string | null {
  if (Object.hasOwn(options, "defaultValue") && options.defaultValue !== undefined) {
    return normalizeValue(options.defaultValue) ?? null;
  }

  const defaultValueAttribute = root.getAttribute(COMBOBOX_DEFAULT_VALUE_ATTRIBUTE);
  if (defaultValueAttribute !== null) {
    return normalizeValue(defaultValueAttribute) ?? null;
  }

  if (hiddenInput && hiddenInput.defaultValue.length > 0) {
    return normalizeValue(hiddenInput.defaultValue) ?? null;
  }

  return readInitialValue(options, root);
}

function readInitialInputValue(
  options: ComboboxOptions,
  root: HTMLElement,
  selectedItem: HTMLElement | null,
): string {
  if (Object.hasOwn(options, "inputValue") && options.inputValue !== undefined) {
    return options.inputValue;
  }
  if (Object.hasOwn(options, "defaultInputValue") && options.defaultInputValue !== undefined) {
    return options.defaultInputValue;
  }

  const inputValueAttribute = root.getAttribute(COMBOBOX_INPUT_VALUE_ATTRIBUTE);
  if (inputValueAttribute) return inputValueAttribute;

  const defaultInputValueAttribute = root.getAttribute(COMBOBOX_DEFAULT_INPUT_VALUE_ATTRIBUTE);
  if (defaultInputValueAttribute) return defaultInputValueAttribute;

  return selectedItem ? getItemText(selectedItem) : "";
}

function readInitialFilterValue(
  options: ComboboxOptions,
  root: HTMLElement,
  inputValue: string,
  selectedItem: HTMLElement | null,
): string {
  if (Object.hasOwn(options, "defaultFilterValue") && options.defaultFilterValue !== undefined) {
    return options.defaultFilterValue;
  }

  if (selectedItem && inputValue === getItemText(selectedItem)) {
    return "";
  }

  if (
    (Object.hasOwn(options, "inputValue") && options.inputValue !== undefined) ||
    (Object.hasOwn(options, "defaultInputValue") && options.defaultInputValue !== undefined)
  ) {
    return inputValue;
  }

  if (
    root.getAttribute(COMBOBOX_INPUT_VALUE_ATTRIBUTE) ||
    root.getAttribute(COMBOBOX_DEFAULT_INPUT_VALUE_ATTRIBUTE)
  ) {
    return inputValue;
  }

  return "";
}

function normalizeValue(value: string | null | undefined): string | null | undefined {
  if (value === undefined) return undefined;
  if (value === null || value === "") return null;
  return value;
}

function readItemValue(item: HTMLElement): string {
  return item.getAttribute(COMBOBOX_VALUE_DATA_ATTRIBUTE) ?? getItemText(item);
}

function getItemText(item: HTMLElement): string {
  const textElement = item.querySelector<HTMLElement>(`[${COMBOBOX_ITEM_TEXT_ATTRIBUTE}]`);
  return (textElement?.textContent ?? item.textContent ?? "").trim();
}

function renderItemHighlight(item: HTMLElement, highlighted: boolean): void {
  item.setAttribute("tabindex", "-1");
  setBooleanAttribute(item, COMBOBOX_HIGHLIGHTED_ATTRIBUTE, highlighted);
}

function renderItemIndicators(item: HTMLElement, visible: boolean): void {
  item
    .querySelectorAll<HTMLElement>(`[${COMBOBOX_ITEM_INDICATOR_ATTRIBUTE}]`)
    .forEach((indicator) => {
      indicator.hidden = !visible;
      indicator.setAttribute("aria-hidden", "true");
      indicator.setAttribute("data-state", visible ? "checked" : "unchecked");
      setBooleanAttribute(indicator, "data-visible", visible);
      setBooleanAttribute(indicator, "data-hidden", !visible);
    });
}
