import {
  assertHTMLElement,
  ensureId,
  readBooleanAttribute,
  setBooleanAttribute,
} from "../../internal/dom";
import { dispatchCustomEvent } from "../../internal/events";
import { registerFieldControlBridge } from "../field/field-control-bridge";

export type SliderValue = number | number[];
export type SliderOrientation = "horizontal" | "vertical";
export type SliderValueChangeReason =
  | "none"
  | "input-change"
  | "track-press"
  | "drag"
  | "keyboard"
  | "imperative-action";

export type SliderValueChangeDetails = {
  readonly activeThumbIndex: number;
  readonly event?: Event;
  readonly isCanceled: boolean;
  readonly isPropagationAllowed: boolean;
  readonly previousValue: SliderValue;
  readonly reason: SliderValueChangeReason;
  readonly trigger?: Element;
  readonly value: SliderValue;
  allowPropagation(): void;
  cancel(): void;
};

export type SliderValueCommitDetails = {
  readonly activeThumbIndex: number;
  readonly event?: Event;
  readonly previousValue: SliderValue;
  readonly reason: SliderValueChangeReason;
  readonly trigger?: Element;
  readonly value: SliderValue;
};

export type SliderOptions = {
  defaultValue?: SliderValue;
  disabled?: boolean;
  form?: string;
  largeStep?: number;
  max?: number;
  minStepsBetweenValues?: number;
  min?: number;
  name?: string;
  onValueChange?: (value: SliderValue, details: SliderValueChangeDetails) => void;
  onValueCommitted?: (value: SliderValue, details: SliderValueCommitDetails) => void;
  orientation?: SliderOrientation;
  step?: number;
  value?: SliderValue;
};

export type SliderSetValueOptions = {
  activeThumbIndex?: number;
  emit?: boolean;
  event?: Event;
  reason?: SliderValueChangeReason;
  trigger?: Element;
};

export type SliderSetOptions = Pick<
  SliderOptions,
  "form" | "largeStep" | "max" | "min" | "minStepsBetweenValues" | "orientation" | "step"
>;

export type SliderInstance = {
  readonly root: HTMLElement;
  destroy(): void;
  getValue(): SliderValue;
  refresh(): void;
  setDisabled(disabled: boolean): void;
  setName(name?: string): void;
  setOptions(options: SliderSetOptions): void;
  setValue(value: SliderValue, options?: SliderSetValueOptions): void;
  subscribe(
    event: "valueChange",
    callback: (details: SliderValueChangeDetails) => void,
  ): () => void;
  subscribe(
    event: "valueCommitted",
    callback: (details: SliderValueCommitDetails) => void,
  ): () => void;
};

type SliderElements = {
  control: HTMLElement;
  indicator?: HTMLElement;
  labels: HTMLElement[];
  track: HTMLElement;
  thumbs: SliderThumb[];
};

type SliderThumb = {
  element: HTMLElement;
  index: number;
  input: HTMLInputElement;
};

type SliderRequest = {
  activeThumbIndex: number;
  commit?: boolean;
  event?: Event;
  reason: SliderValueChangeReason;
  trigger?: Element;
};

const SLIDER_ROOT_ATTRIBUTE = "data-sw-slider";
const SLIDER_CONTROL_ATTRIBUTE = "data-sw-slider-control";
const SLIDER_CONTROL_SELECTOR = `[${SLIDER_CONTROL_ATTRIBUTE}]`;
const SLIDER_DEFAULT_VALUE_ATTRIBUTE = "data-default-value";
const SLIDER_DISABLED_ATTRIBUTE = "data-disabled";
const SLIDER_FORM_ATTRIBUTE = "data-form";
const SLIDER_INDICATOR_ATTRIBUTE = "data-sw-slider-indicator";
const SLIDER_INDICATOR_SELECTOR = `[${SLIDER_INDICATOR_ATTRIBUTE}]`;
const SLIDER_INPUT_ATTRIBUTE = "data-sw-slider-input";
const SLIDER_INPUT_SELECTOR = `[${SLIDER_INPUT_ATTRIBUTE}]`;
const SLIDER_LABEL_ATTRIBUTE = "data-sw-slider-label";
const SLIDER_LABEL_SELECTOR = `[${SLIDER_LABEL_ATTRIBUTE}]`;
const SLIDER_LARGE_STEP_ATTRIBUTE = "data-large-step";
const SLIDER_MAX_ATTRIBUTE = "data-max";
const SLIDER_MIN_ATTRIBUTE = "data-min";
const SLIDER_MIN_STEPS_BETWEEN_VALUES_ATTRIBUTE = "data-min-steps-between-values";
const SLIDER_NAME_ATTRIBUTE = "data-name";
const SLIDER_ORIENTATION_ATTRIBUTE = "data-orientation";
const SLIDER_STEP_ATTRIBUTE = "data-step";
const SLIDER_THUMB_ATTRIBUTE = "data-sw-slider-thumb";
const SLIDER_THUMB_SELECTOR = `[${SLIDER_THUMB_ATTRIBUTE}]`;
const SLIDER_TRACK_ATTRIBUTE = "data-sw-slider-track";
const SLIDER_TRACK_SELECTOR = `[${SLIDER_TRACK_ATTRIBUTE}]`;
const SLIDER_VALUE_ATTRIBUTE = "data-value";

const instances = new WeakMap<HTMLElement, SliderController>();

registerFieldControlBridge({
  kind: "slider",
  connect(control, { disabled, name, shouldSyncName }) {
    const slider = createSlider(control, { disabled, name });
    slider.setDisabled(disabled);
    if (shouldSyncName) {
      slider.setName(name);
    }
  },
});

export function createSlider(root: HTMLElement, options: SliderOptions = {}): SliderInstance {
  assertHTMLElement(root, "createSlider root");

  const existing = instances.get(root);
  if (existing) return existing;

  const instance = new SliderController(root, options);
  instances.set(root, instance);
  return instance;
}

class SliderController implements SliderInstance {
  readonly root: HTMLElement;

  private readonly abortController = new AbortController();
  private readonly boundControls = new WeakSet<HTMLElement>();
  private readonly boundLabels = new WeakSet<HTMLElement>();
  private readonly boundThumbElements = new WeakSet<HTMLElement>();
  private readonly boundThumbInputs = new WeakSet<HTMLInputElement>();
  private readonly controlled: boolean;
  private formBridgeObserver: MutationObserver | undefined;
  private name?: string;
  private readonly onValueChange?: (value: SliderValue, details: SliderValueChangeDetails) => void;
  private readonly onValueCommitted?: (
    value: SliderValue,
    details: SliderValueCommitDetails,
  ) => void;
  private readonly subscribers = {
    valueChange: new Set<(details: SliderValueChangeDetails) => void>(),
    valueCommitted: new Set<(details: SliderValueCommitDetails) => void>(),
  };
  private activeThumbIndex = -1;
  private destroyed = false;
  private disabled: boolean;
  private dragging = false;
  private focusedThumbIndex = -1;
  private interactionChanged = false;
  private interactionPreviousValue: SliderValue | undefined;
  private lastInteractionEvent: Event | undefined;
  private lastInteractionReason: SliderValueChangeReason = "none";
  private lastInteractionTrigger: Element | undefined;
  private form?: string;
  private largeStep: number;
  private max: number;
  private min: number;
  private minStepsBetweenValues: number;
  private orientation: SliderOrientation;
  private step: number;
  private elements: SliderElements;
  private interactionValue: SliderValue | undefined;
  private syncingFormBridge = false;
  private values: number[];

  constructor(root: HTMLElement, options: SliderOptions) {
    this.root = root;
    this.controlled = Object.hasOwn(options, "value");
    this.disabled = options.disabled ?? readBooleanAttribute(root, SLIDER_DISABLED_ATTRIBUTE);
    this.form = options.form ?? readOptionalAttribute(root, SLIDER_FORM_ATTRIBUTE);
    this.largeStep = readNumberOption(options.largeStep, root, SLIDER_LARGE_STEP_ATTRIBUTE, 10);
    this.max = readNumberOption(options.max, root, SLIDER_MAX_ATTRIBUTE, 100);
    this.min = readNumberOption(options.min, root, SLIDER_MIN_ATTRIBUTE, 0);
    this.minStepsBetweenValues = sanitizeMinStepsBetweenValues(
      readNumberOption(
        options.minStepsBetweenValues,
        root,
        SLIDER_MIN_STEPS_BETWEEN_VALUES_ATTRIBUTE,
        0,
      ),
      0,
    );
    this.name = options.name ?? readOptionalAttribute(root, SLIDER_NAME_ATTRIBUTE);
    this.onValueChange = options.onValueChange;
    this.onValueCommitted = options.onValueCommitted;
    this.orientation =
      options.orientation ??
      readOrientation(root.getAttribute(SLIDER_ORIENTATION_ATTRIBUTE)) ??
      "horizontal";
    this.step = readNumberOption(options.step, root, SLIDER_STEP_ATTRIBUTE, 1);
    this.elements = getSliderElements(root);
    this.values = this.readInitialValues(options);

    this.setupInputs();
    this.bindEvents();
    this.render();
    this.observeFormBridgeAttributes();
  }

  destroy(): void {
    if (this.destroyed) return;

    this.stopDocumentDraggingListeners();
    this.abortController.abort();
    this.formBridgeObserver?.disconnect();
    this.subscribers.valueChange.clear();
    this.subscribers.valueCommitted.clear();
    instances.delete(this.root);
    this.destroyed = true;
  }

  getValue(): SliderValue {
    return toSliderValue(this.values);
  }

  refresh(): void {
    const currentValue = this.getValue();
    this.readOptionsFromAttributes();
    this.elements = getSliderElements(this.root);
    this.values = this.normalizeValues(currentValue, this.getExpectedValueLength(currentValue));
    this.setupInputs();
    this.bindPartEvents();
    this.render();
  }

  setDisabled(disabled: boolean): void {
    if (this.disabled === disabled) return;

    this.disabled = disabled;
    if (disabled) {
      this.activeThumbIndex = -1;
      this.dragging = false;
    }
    this.render();
  }

  setName(name?: string): void {
    const nextName = name ?? readOptionalAttribute(this.root, SLIDER_NAME_ATTRIBUTE);
    if (this.name === nextName) return;

    this.name = nextName;
    this.render();
  }

  setOptions(options: SliderSetOptions): void {
    const currentValue = this.getValue();
    let shouldNormalizeValues = false;

    if (Object.hasOwn(options, "form")) {
      this.form = options.form;
    }

    if (Object.hasOwn(options, "largeStep")) {
      this.largeStep = sanitizeNumberOption(options.largeStep, this.largeStep);
    }

    if (Object.hasOwn(options, "max")) {
      this.max = sanitizeNumberOption(options.max, this.max);
      shouldNormalizeValues = true;
    }

    if (Object.hasOwn(options, "min")) {
      this.min = sanitizeNumberOption(options.min, this.min);
      shouldNormalizeValues = true;
    }

    if (Object.hasOwn(options, "minStepsBetweenValues")) {
      this.minStepsBetweenValues = sanitizeMinStepsBetweenValues(
        options.minStepsBetweenValues,
        this.minStepsBetweenValues,
      );
      shouldNormalizeValues = true;
    }

    if (Object.hasOwn(options, "orientation")) {
      this.orientation = options.orientation ?? this.orientation;
    }

    if (Object.hasOwn(options, "step")) {
      this.step = sanitizeNumberOption(options.step, this.step);
      shouldNormalizeValues = true;
    }

    if (shouldNormalizeValues) {
      this.values = this.normalizeValues(currentValue, this.getExpectedValueLength(currentValue));
    }

    this.setupInputs();
    this.render();
  }

  setValue(value: SliderValue, options: SliderSetValueOptions = {}): void {
    const previousValues = this.values;
    const nextValues = this.normalizeValues(value, this.getExpectedValueLength(value));

    this.values = nextValues;
    this.render();

    if (options.emit === false || areValuesEqual(previousValues, nextValues)) return;

    const details = new SliderValueChangeDetailsImpl({
      activeThumbIndex: options.activeThumbIndex ?? -1,
      event: options.event,
      previousValue: toSliderValue(previousValues),
      reason: options.reason ?? "imperative-action",
      trigger: options.trigger,
      value: toSliderValue(nextValues),
    });
    this.notifyChange(details);
  }

  subscribe(
    event: "valueChange" | "valueCommitted",
    callback:
      | ((details: SliderValueChangeDetails) => void)
      | ((details: SliderValueCommitDetails) => void),
  ): () => void {
    if (event === "valueChange") {
      const valueChangeCallback = callback as (details: SliderValueChangeDetails) => void;
      this.subscribers.valueChange.add(valueChangeCallback);
      return () => {
        this.subscribers.valueChange.delete(valueChangeCallback);
      };
    }

    if (event === "valueCommitted") {
      const valueCommittedCallback = callback as (details: SliderValueCommitDetails) => void;
      this.subscribers.valueCommitted.add(valueCommittedCallback);
      return () => {
        this.subscribers.valueCommitted.delete(valueCommittedCallback);
      };
    }

    throw new Error(`Unsupported Slider event: ${event}`);
  }

  private readInitialValues(options: SliderOptions): number[] {
    const rawValue =
      options.value ??
      options.defaultValue ??
      readSliderValueAttribute(this.root, SLIDER_VALUE_ATTRIBUTE) ??
      readSliderValueAttribute(this.root, SLIDER_DEFAULT_VALUE_ATTRIBUTE) ??
      readInputValues(this.elements.thumbs) ??
      this.min;

    return this.normalizeValues(rawValue, this.getExpectedValueLength(rawValue));
  }

  private setupInputs(): void {
    this.elements.thumbs.forEach((thumb, index) => {
      thumb.index = index;
      thumb.element.setAttribute(SLIDER_THUMB_ATTRIBUTE, "");
      thumb.element.setAttribute("data-index", String(index));

      const input = thumb.input;
      input.type = "range";
      input.min = String(this.min);
      input.max = String(this.max);
      input.step = String(this.step);
      input.tabIndex = -1;
      input.setAttribute(SLIDER_INPUT_ATTRIBUTE, "");
      input.setAttribute("aria-hidden", "true");
      input.style.position = "absolute";
      input.style.width = "1px";
      input.style.height = "1px";
      input.style.margin = "-1px";
      input.style.overflow = "hidden";
      input.style.clipPath = "inset(50%)";
      input.style.whiteSpace = "nowrap";
      input.style.border = "0";

      if (this.form !== undefined) {
        input.setAttribute("form", this.form);
      } else {
        input.removeAttribute("form");
      }

      if (this.name !== undefined) {
        input.name = this.values.length > 1 ? `${this.name}[${index}]` : this.name;
      } else {
        input.removeAttribute("name");
      }
    });
  }

  private observeFormBridgeAttributes(): void {
    this.formBridgeObserver = new MutationObserver((records) => {
      if (this.destroyed || this.syncingFormBridge) return;

      let shouldRefreshElements = false;
      let shouldSyncFormBridge = false;

      records.forEach((record) => {
        if (record.type === "childList") {
          shouldRefreshElements = true;
          shouldSyncFormBridge = true;
          return;
        }

        if (record.type !== "attributes") return;

        if (record.target === this.root) {
          if (record.attributeName === SLIDER_NAME_ATTRIBUTE) {
            this.name = readOptionalAttribute(this.root, SLIDER_NAME_ATTRIBUTE);
            shouldSyncFormBridge = true;
          }

          if (record.attributeName === SLIDER_FORM_ATTRIBUTE) {
            this.form = readOptionalAttribute(this.root, SLIDER_FORM_ATTRIBUTE);
            shouldSyncFormBridge = true;
          }

          return;
        }

        if (
          record.target instanceof HTMLInputElement &&
          record.target.hasAttribute(SLIDER_INPUT_ATTRIBUTE) &&
          (record.attributeName === "name" || record.attributeName === "form")
        ) {
          shouldSyncFormBridge = true;
        }
      });

      if (!shouldSyncFormBridge) return;

      if (shouldRefreshElements) {
        this.elements = getSliderElements(this.root);
        this.bindPartEvents();
      }

      this.syncThumbInputFormAttributes();
    });

    this.formBridgeObserver.observe(this.root, {
      attributeFilter: [SLIDER_FORM_ATTRIBUTE, SLIDER_NAME_ATTRIBUTE, "form", "name"],
      attributes: true,
      childList: true,
      subtree: true,
    });
  }

  private syncThumbInputFormAttributes(): void {
    if (this.areThumbInputFormAttributesSynced()) return;

    this.syncingFormBridge = true;
    try {
      this.elements.thumbs.forEach((thumb, index) => {
        if (this.form !== undefined) {
          thumb.input.setAttribute("form", this.form);
        } else {
          thumb.input.removeAttribute("form");
        }

        if (this.name !== undefined) {
          thumb.input.name = this.values.length > 1 ? `${this.name}[${index}]` : this.name;
        } else {
          thumb.input.removeAttribute("name");
        }
      });
    } finally {
      this.syncingFormBridge = false;
    }
  }

  private areThumbInputFormAttributesSynced(): boolean {
    return this.elements.thumbs.every((thumb, index) => {
      const expectedForm = this.form ?? null;
      const expectedName =
        this.name === undefined
          ? ""
          : this.values.length > 1
            ? `${this.name}[${index}]`
            : this.name;

      return thumb.input.getAttribute("form") === expectedForm && thumb.input.name === expectedName;
    });
  }

  private bindEvents(): void {
    const { signal } = this.abortController;

    this.bindPartEvents();
    this.root.addEventListener("focusin", this.handleFocusIn, { signal });
    this.root.addEventListener("focusout", this.handleFocusOut, { signal });
  }

  private bindPartEvents(): void {
    const { signal } = this.abortController;

    if (!this.boundControls.has(this.elements.control)) {
      this.elements.control.addEventListener("pointerdown", this.handlePointerDown, { signal });
      this.boundControls.add(this.elements.control);
    }

    this.elements.thumbs.forEach((thumb) => {
      if (!this.boundThumbElements.has(thumb.element)) {
        thumb.element.addEventListener("keydown", this.handleKeyDown, { signal });
        this.boundThumbElements.add(thumb.element);
      }

      if (!this.boundThumbInputs.has(thumb.input)) {
        thumb.input.addEventListener("change", this.handleInputChange, { signal });
        this.boundThumbInputs.add(thumb.input);
      }
    });

    this.elements.labels.forEach((label) => {
      if (this.boundLabels.has(label)) return;

      label.addEventListener("click", this.handleLabelClick, { signal });
      this.boundLabels.add(label);
    });
  }

  private render(): void {
    const currentValue = toSliderValue(this.values);
    const valueAttribute = serializeSliderValue(currentValue);

    this.root.setAttribute(SLIDER_ROOT_ATTRIBUTE, "");
    this.root.setAttribute("role", "group");
    this.root.setAttribute(SLIDER_MIN_ATTRIBUTE, String(this.min));
    this.root.setAttribute(
      SLIDER_MIN_STEPS_BETWEEN_VALUES_ATTRIBUTE,
      String(this.minStepsBetweenValues),
    );
    this.root.setAttribute(SLIDER_MAX_ATTRIBUTE, String(this.max));
    this.root.setAttribute(SLIDER_STEP_ATTRIBUTE, String(this.step));
    this.root.setAttribute(SLIDER_LARGE_STEP_ATTRIBUTE, String(this.largeStep));
    this.root.setAttribute(SLIDER_ORIENTATION_ATTRIBUTE, this.orientation);
    this.root.setAttribute(SLIDER_VALUE_ATTRIBUTE, valueAttribute);
    if (this.form !== undefined) {
      this.root.setAttribute(SLIDER_FORM_ATTRIBUTE, this.form);
    } else {
      this.root.removeAttribute(SLIDER_FORM_ATTRIBUTE);
    }
    setBooleanAttribute(this.root, "data-disabled", this.disabled);
    setBooleanAttribute(this.root, "data-dragging", this.dragging);
    setBooleanAttribute(this.root, "data-focused", this.focusedThumbIndex >= 0);

    this.elements.control.setAttribute(SLIDER_CONTROL_ATTRIBUTE, "");
    this.elements.control.setAttribute(SLIDER_ORIENTATION_ATTRIBUTE, this.orientation);
    this.elements.track.setAttribute(SLIDER_TRACK_ATTRIBUTE, "");
    this.elements.track.setAttribute(SLIDER_ORIENTATION_ATTRIBUTE, this.orientation);

    this.renderIndicator();
    this.renderLabels();
    this.renderThumbs();
  }

  private renderLabels(): void {
    this.elements.labels.forEach((label) => {
      label.setAttribute(SLIDER_LABEL_ATTRIBUTE, "");
      setBooleanAttribute(label, "data-disabled", this.disabled);
      ensureId(label, "sw-slider-label");
    });
  }

  private renderIndicator(): void {
    const indicator = this.elements.indicator;
    if (!indicator) return;

    const { end, start } = this.getRangePercentages();
    indicator.setAttribute(SLIDER_INDICATOR_ATTRIBUTE, "");
    indicator.setAttribute(SLIDER_ORIENTATION_ATTRIBUTE, this.orientation);
    setBooleanAttribute(indicator, "data-disabled", this.disabled);

    if (this.orientation === "vertical") {
      indicator.style.bottom = `${start}%`;
      indicator.style.height = `${end - start}%`;
      indicator.style.left = "";
      indicator.style.width = "";
      return;
    }

    indicator.style.left = `${start}%`;
    indicator.style.width = `${end - start}%`;
    indicator.style.bottom = "";
    indicator.style.height = "";
  }

  private renderThumbs(): void {
    const rootAriaLabel = this.root.getAttribute("aria-label");
    const rootAriaLabelledBy = this.root.getAttribute("aria-labelledby");
    const fallbackLabelledBy = this.getFallbackLabelledBy();

    this.elements.thumbs.forEach((thumb, index) => {
      const value = this.values[index] ?? this.min;
      const percentage = this.getPercentage(value);

      thumb.element.setAttribute(SLIDER_THUMB_ATTRIBUTE, "");
      thumb.element.setAttribute("role", "slider");
      thumb.element.setAttribute("aria-valuemin", String(this.min));
      thumb.element.setAttribute("aria-valuemax", String(this.max));
      thumb.element.setAttribute("aria-valuenow", String(value));
      thumb.element.setAttribute("aria-orientation", this.orientation);
      thumb.element.setAttribute("aria-disabled", this.disabled ? "true" : "false");
      thumb.element.setAttribute(SLIDER_ORIENTATION_ATTRIBUTE, this.orientation);
      thumb.element.tabIndex = this.disabled ? -1 : 0;

      if (rootAriaLabel && !thumb.element.hasAttribute("aria-label")) {
        thumb.element.setAttribute("aria-label", rootAriaLabel);
      }

      if (rootAriaLabelledBy && !thumb.element.hasAttribute("aria-labelledby")) {
        thumb.element.setAttribute("aria-labelledby", rootAriaLabelledBy);
      }

      if (
        !rootAriaLabel &&
        !rootAriaLabelledBy &&
        fallbackLabelledBy &&
        !thumb.element.hasAttribute("aria-label") &&
        !thumb.element.hasAttribute("aria-labelledby")
      ) {
        thumb.element.setAttribute("aria-labelledby", fallbackLabelledBy);
      }

      setBooleanAttribute(thumb.element, "data-disabled", this.disabled);
      setBooleanAttribute(thumb.element, "data-dragging", this.activeThumbIndex === index);
      setBooleanAttribute(thumb.element, "data-focused", this.focusedThumbIndex === index);

      if (this.orientation === "vertical") {
        thumb.element.style.bottom = `${percentage}%`;
        thumb.element.style.left = "";
      } else {
        thumb.element.style.left = `${percentage}%`;
        thumb.element.style.bottom = "";
      }

      thumb.input.value = String(value);
      thumb.input.disabled = this.disabled;
      thumb.input.min = String(this.min);
      thumb.input.max = String(this.max);
      thumb.input.step = String(this.step);
      if (this.form !== undefined) {
        thumb.input.setAttribute("form", this.form);
      } else {
        thumb.input.removeAttribute("form");
      }
      if (this.name !== undefined) {
        thumb.input.name = this.values.length > 1 ? `${this.name}[${index}]` : this.name;
      } else {
        thumb.input.removeAttribute("name");
      }
    });
  }

  private readonly handleKeyDown = (event: KeyboardEvent): void => {
    const thumb = this.findThumbFromTarget(event.currentTarget);
    if (!thumb) return;

    const nextValue = this.getKeyboardValue(thumb.index, event);
    if (nextValue === undefined) return;

    event.preventDefault();
    this.requestThumbValue(thumb.index, nextValue, {
      activeThumbIndex: thumb.index,
      commit: true,
      event,
      reason: "keyboard",
      trigger: thumb.element,
    });
  };

  private readonly handleInputChange = (event: Event): void => {
    const thumb = this.findThumbFromTarget(event.currentTarget);
    if (!thumb) return;

    this.requestThumbValue(thumb.index, thumb.input.valueAsNumber, {
      activeThumbIndex: thumb.index,
      commit: true,
      event,
      reason: "input-change",
      trigger: thumb.input,
    });
  };

  private readonly handlePointerDown = (event: PointerEvent): void => {
    if (this.disabled || event.defaultPrevented || event.button !== 0) return;

    const target = event.target instanceof Element ? event.target : null;
    const targetThumb = target
      ? this.elements.thumbs.find((thumb) => thumb.element.contains(target))
      : undefined;
    const pointerValue = this.getValueFromPosition(event.clientX, event.clientY);
    const activeThumbIndex = targetThumb?.index ?? this.getClosestThumbIndex(pointerValue);
    const activeThumb = this.elements.thumbs[activeThumbIndex];
    if (!activeThumb) return;

    event.preventDefault();
    this.activeThumbIndex = activeThumbIndex;
    this.dragging = true;
    this.interactionChanged = false;
    this.interactionPreviousValue = this.getValue();
    this.lastInteractionEvent = event;
    this.lastInteractionReason = targetThumb ? "drag" : "track-press";
    this.lastInteractionTrigger = activeThumb.element;
    activeThumb.element.focus();

    setPointerCapture(this.elements.control, event.pointerId);

    this.render();

    if (!targetThumb) {
      this.requestThumbValue(activeThumbIndex, pointerValue, {
        activeThumbIndex,
        event,
        reason: "track-press",
        trigger: this.elements.control,
      });
    }

    document.addEventListener("pointermove", this.handlePointerMove, { passive: true });
    document.addEventListener("pointerup", this.handlePointerUp, { once: true });
    document.addEventListener("pointercancel", this.handlePointerCancel, { once: true });
  };

  private readonly handlePointerMove = (event: PointerEvent): void => {
    if (!this.dragging || this.activeThumbIndex < 0) return;
    if (event.buttons === 0) {
      this.handlePointerUp(event);
      return;
    }

    const nextValue = this.getValueFromPosition(event.clientX, event.clientY);
    this.requestThumbValue(this.activeThumbIndex, nextValue, {
      activeThumbIndex: this.activeThumbIndex,
      event,
      reason: "drag",
      trigger: this.elements.thumbs[this.activeThumbIndex]?.element,
    });
  };

  private readonly handlePointerUp = (event: PointerEvent): void => {
    if (!this.dragging) return;

    const activeThumbIndex = this.activeThumbIndex;
    const previousValue = this.interactionPreviousValue ?? this.getValue();
    const reason = this.lastInteractionReason;
    const trigger = this.lastInteractionTrigger;
    const interactionChanged = this.interactionChanged;
    const committedValue = this.interactionValue ?? this.getValue();
    this.stopDocumentDraggingListeners();

    releasePointerCapture(this.elements.control, event.pointerId);

    if (interactionChanged) {
      this.notifyCommitted({
        activeThumbIndex,
        event,
        previousValue,
        reason,
        trigger,
        value: committedValue,
      });
    }
  };

  private readonly handlePointerCancel = (event: PointerEvent): void => {
    if (!this.dragging) return;

    this.stopDocumentDraggingListeners();
    releasePointerCapture(this.elements.control, event.pointerId);
  };

  private readonly handleFocusIn = (event: FocusEvent): void => {
    const thumb = this.findThumbFromTarget(event.target);
    if (!thumb || this.disabled) return;

    this.focusedThumbIndex = thumb.index;
    this.render();
  };

  private readonly handleFocusOut = (event: FocusEvent): void => {
    const nextTarget = event.relatedTarget;
    if (nextTarget instanceof Node && this.root.contains(nextTarget)) return;

    this.focusedThumbIndex = -1;
    this.render();
  };

  private readonly handleLabelClick = (event: MouseEvent): void => {
    if (this.disabled || event.defaultPrevented || this.elements.thumbs.length !== 1) return;

    this.elements.thumbs[0]?.element.focus();
  };

  private requestThumbValue(thumbIndex: number, value: number, request: SliderRequest): boolean {
    if (this.disabled) return false;
    if (!Number.isFinite(value)) return false;

    const nextValues = this.getValuesWithThumb(thumbIndex, value);
    return this.requestValues(nextValues, request);
  }

  private requestValues(nextValues: number[], request: SliderRequest): boolean {
    const previousValues = this.values;
    if (areValuesEqual(previousValues, nextValues) && !this.controlled) {
      this.render();
      return false;
    }

    const previousValue = toSliderValue(previousValues);
    const nextValue = toSliderValue(nextValues);
    const details = new SliderValueChangeDetailsImpl({
      activeThumbIndex: request.activeThumbIndex,
      event: request.event,
      previousValue,
      reason: request.reason,
      trigger: request.trigger,
      value: nextValue,
    });

    this.notifyChange(details);
    if (details.isCanceled) {
      this.render();
      return false;
    }

    this.interactionChanged = true;
    this.interactionValue = nextValue;
    this.lastInteractionEvent = request.event;
    this.lastInteractionReason = request.reason;
    this.lastInteractionTrigger = request.trigger;

    if (this.controlled) {
      this.render();

      if (request.commit) {
        this.notifyCommitted({
          activeThumbIndex: request.activeThumbIndex,
          event: request.event,
          previousValue,
          reason: request.reason,
          trigger: request.trigger,
          value: nextValue,
        });
      }

      return false;
    }

    this.values = nextValues;
    this.render();

    if (request.commit) {
      this.notifyCommitted({
        activeThumbIndex: request.activeThumbIndex,
        event: request.event,
        previousValue,
        reason: request.reason,
        trigger: request.trigger,
        value: nextValue,
      });
    }

    return true;
  }

  private getKeyboardValue(index: number, event: KeyboardEvent): number | undefined {
    const value = this.values[index] ?? this.min;
    const smallStep = event.shiftKey ? this.largeStep : this.step;

    switch (event.key) {
      case "ArrowUp":
      case "ArrowRight":
        return value + smallStep;
      case "ArrowDown":
      case "ArrowLeft":
        return value - smallStep;
      case "PageUp":
        return value + this.largeStep;
      case "PageDown":
        return value - this.largeStep;
      case "Home":
        return this.min;
      case "End":
        return this.max;
      default:
        return undefined;
    }
  }

  private getValuesWithThumb(index: number, value: number): number[] {
    const nextValues = [...this.values];
    const minimumGap = this.step * this.minStepsBetweenValues;
    const min = index > 0 ? (nextValues[index - 1] ?? this.min) + minimumGap : this.min;
    const max =
      index < nextValues.length - 1 ? (nextValues[index + 1] ?? this.max) - minimumGap : this.max;

    if (min > max) {
      nextValues[index] = this.values[index] ?? this.min;
      return nextValues;
    }

    nextValues[index] = clamp(this.snapToStep(value), min, max);
    return nextValues;
  }

  private getValueFromPosition(clientX: number, clientY: number): number {
    const rect = this.elements.control.getBoundingClientRect();
    const size = this.orientation === "vertical" ? rect.height : rect.width;
    if (size <= 0) return this.min;

    const rawPercentage =
      this.orientation === "vertical"
        ? 1 - (clientY - rect.top) / size
        : (clientX - rect.left) / size;
    const percentage = clamp(rawPercentage, 0, 1);

    return this.snapToStep(this.min + percentage * (this.max - this.min));
  }

  private getClosestThumbIndex(value: number): number {
    let closestIndex = 0;
    let closestDistance = Number.POSITIVE_INFINITY;

    this.values.forEach((currentValue, index) => {
      const distance = Math.abs(currentValue - value);
      if (distance <= closestDistance) {
        closestIndex = index;
        closestDistance = distance;
      }
    });

    return closestIndex;
  }

  private getRangePercentages(): { end: number; start: number } {
    if (this.values.length > 1) {
      return {
        end: this.getPercentage(Math.max(...this.values)),
        start: this.getPercentage(Math.min(...this.values)),
      };
    }

    return {
      end: this.getPercentage(this.values[0] ?? this.min),
      start: 0,
    };
  }

  private getPercentage(value: number): number {
    if (this.max <= this.min) return 0;
    return clamp(((value - this.min) / (this.max - this.min)) * 100, 0, 100);
  }

  private getFallbackLabelledBy(): string | undefined {
    const [label] = this.elements.labels;
    if (!label) return undefined;

    return ensureId(label, "sw-slider-label");
  }

  private readOptionsFromAttributes(): void {
    this.form = readOptionalAttribute(this.root, SLIDER_FORM_ATTRIBUTE);
    this.largeStep = readNumberOption(
      undefined,
      this.root,
      SLIDER_LARGE_STEP_ATTRIBUTE,
      this.largeStep,
    );
    this.max = readNumberOption(undefined, this.root, SLIDER_MAX_ATTRIBUTE, this.max);
    this.min = readNumberOption(undefined, this.root, SLIDER_MIN_ATTRIBUTE, this.min);
    this.minStepsBetweenValues = sanitizeMinStepsBetweenValues(
      readNumberOption(
        undefined,
        this.root,
        SLIDER_MIN_STEPS_BETWEEN_VALUES_ATTRIBUTE,
        this.minStepsBetweenValues,
      ),
      this.minStepsBetweenValues,
    );
    this.orientation =
      readOrientation(this.root.getAttribute(SLIDER_ORIENTATION_ATTRIBUTE)) ?? this.orientation;
    this.step = readNumberOption(undefined, this.root, SLIDER_STEP_ATTRIBUTE, this.step);
  }

  private snapToStep(value: number): number {
    if (this.step <= 0) return clamp(value, this.min, this.max);

    const precision = getDecimalPrecision(this.step);
    const snapped = Math.round((value - this.min) / this.step) * this.step + this.min;
    return clamp(Number(snapped.toFixed(precision)), this.min, this.max);
  }

  private normalizeValues(value: SliderValue, expectedLength: number): number[] {
    const rawValues = Array.isArray(value) ? value : [value];
    const values = rawValues
      .map((item) => (Number.isFinite(item) ? this.snapToStep(item) : this.min))
      .slice(0, Math.max(expectedLength, 1));

    while (values.length < expectedLength) {
      values.push(values.at(-1) ?? this.min);
    }

    return values.length > 1 ? values.sort((left, right) => left - right) : values;
  }

  private getExpectedValueLength(value: SliderValue): number {
    if (Array.isArray(value)) return Math.max(value.length, 1);
    return Math.max(this.elements.thumbs.length, 1);
  }

  private findThumbFromTarget(target: EventTarget | null): SliderThumb | undefined {
    if (!(target instanceof Node)) return undefined;

    return this.elements.thumbs.find(
      (thumb) => thumb.element === target || thumb.element.contains(target),
    );
  }

  private stopDocumentDraggingListeners(): void {
    document.removeEventListener("pointermove", this.handlePointerMove);
    document.removeEventListener("pointerup", this.handlePointerUp);
    document.removeEventListener("pointercancel", this.handlePointerCancel);
    this.activeThumbIndex = -1;
    this.dragging = false;
    this.interactionChanged = false;
    this.interactionPreviousValue = undefined;
    this.interactionValue = undefined;
    this.lastInteractionEvent = undefined;
    this.lastInteractionReason = "none";
    this.lastInteractionTrigger = undefined;
    this.render();
  }

  private notifyChange(details: SliderValueChangeDetails): void {
    const event = dispatchCustomEvent(this.root, "starwind:value-change", details, {
      cancelable: true,
    });
    if (event.defaultPrevented) details.cancel();
    this.onValueChange?.(details.value, details);
    this.subscribers.valueChange.forEach((subscriber) => subscriber(details));
  }

  private notifyCommitted(details: SliderValueCommitDetails): void {
    dispatchCustomEvent(this.root, "starwind:value-committed", details);
    this.onValueCommitted?.(details.value, details);
    this.subscribers.valueCommitted.forEach((subscriber) => subscriber(details));
  }
}

class SliderValueChangeDetailsImpl implements SliderValueChangeDetails {
  readonly activeThumbIndex: number;
  readonly event?: Event;
  readonly previousValue: SliderValue;
  readonly reason: SliderValueChangeReason;
  readonly trigger?: Element;
  readonly value: SliderValue;

  private canceled = false;
  private propagationAllowed = false;

  constructor({
    activeThumbIndex,
    event,
    previousValue,
    reason,
    trigger,
    value,
  }: {
    activeThumbIndex: number;
    event?: Event;
    previousValue: SliderValue;
    reason: SliderValueChangeReason;
    trigger?: Element;
    value: SliderValue;
  }) {
    this.activeThumbIndex = activeThumbIndex;
    this.event = event;
    this.previousValue = cloneSliderValue(previousValue);
    this.reason = reason;
    this.trigger = trigger;
    this.value = cloneSliderValue(value);
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

function getSliderElements(root: HTMLElement): SliderElements {
  const control = root.querySelector<HTMLElement>(SLIDER_CONTROL_SELECTOR) ?? root;
  const track = root.querySelector<HTMLElement>(SLIDER_TRACK_SELECTOR) ?? control;
  const trackFirstChild = root.querySelector<HTMLElement>(SLIDER_TRACK_SELECTOR)?.firstElementChild;
  const indicator =
    root.querySelector<HTMLElement>(SLIDER_INDICATOR_SELECTOR) ??
    (trackFirstChild instanceof HTMLElement ? trackFirstChild : undefined);
  const labels = queryOwnElements(root, SLIDER_LABEL_SELECTOR);

  const thumbs = Array.from(root.querySelectorAll<HTMLElement>(SLIDER_THUMB_SELECTOR))
    .filter((thumb) => isOwnedByRoot(thumb, root))
    .map((element, index) => ({
      element,
      index,
      input: getOrCreateInput(element),
    }));

  return {
    control,
    indicator,
    labels,
    track,
    thumbs,
  };
}

function queryOwnElements(root: HTMLElement, selector: string): HTMLElement[] {
  return Array.from(root.querySelectorAll<HTMLElement>(selector)).filter((element) =>
    isOwnedByRoot(element, root),
  );
}

function getOrCreateInput(thumb: HTMLElement): HTMLInputElement {
  const input = thumb.querySelector<HTMLInputElement>(SLIDER_INPUT_SELECTOR);
  if (input) return input;

  const newInput = document.createElement("input");
  newInput.setAttribute(SLIDER_INPUT_ATTRIBUTE, "");
  thumb.append(newInput);
  return newInput;
}

function isOwnedByRoot(element: Element, root: HTMLElement): boolean {
  return element.closest(`[${SLIDER_ROOT_ATTRIBUTE}]`) === root;
}

function readInputValues(thumbs: SliderThumb[]): SliderValue | undefined {
  const values = thumbs
    .map((thumb) => Number(thumb.input.value))
    .filter((value) => Number.isFinite(value));

  if (values.length === 0) return undefined;
  return toSliderValue(values);
}

function readNumberOption(
  value: number | undefined,
  element: HTMLElement,
  attribute: string,
  fallback: number,
): number {
  if (value !== undefined && Number.isFinite(value)) return value;

  const attributeValue = Number(element.getAttribute(attribute));
  return Number.isFinite(attributeValue) ? attributeValue : fallback;
}

function sanitizeNumberOption(value: number | undefined, fallback: number): number {
  return value !== undefined && Number.isFinite(value) ? value : fallback;
}

function sanitizeMinStepsBetweenValues(value: number | undefined, fallback: number): number {
  if (value === undefined || !Number.isFinite(value)) return fallback;

  return Math.max(value, 0);
}

function readOptionalAttribute(element: HTMLElement, name: string): string | undefined {
  return element.getAttribute(name) ?? undefined;
}

function readOrientation(value: string | null): SliderOrientation | undefined {
  if (value === "horizontal" || value === "vertical") return value;
  return undefined;
}

function readSliderValueAttribute(element: HTMLElement, name: string): SliderValue | undefined {
  const value = element.getAttribute(name);
  if (!value) return undefined;

  const trimmed = value.trim();
  if (trimmed.startsWith("[")) {
    try {
      const parsed = JSON.parse(trimmed);
      if (Array.isArray(parsed) && parsed.every((item) => typeof item === "number")) {
        return parsed;
      }
    } catch {
      return undefined;
    }
  }

  const parsed = Number(trimmed);
  return Number.isFinite(parsed) ? parsed : undefined;
}

function serializeSliderValue(value: SliderValue): string {
  return Array.isArray(value) ? JSON.stringify(value) : String(value);
}

function toSliderValue(values: readonly number[]): SliderValue {
  return values.length === 1 ? (values[0] ?? 0) : [...values];
}

function cloneSliderValue(value: SliderValue): SliderValue {
  return Array.isArray(value) ? [...value] : value;
}

function setPointerCapture(element: HTMLElement, pointerId: number): void {
  if (!pointerId || !element.setPointerCapture) return;

  try {
    element.setPointerCapture(pointerId);
  } catch {
    // Pointer capture can fail for synthetic or already-ended pointers.
  }
}

function releasePointerCapture(element: HTMLElement, pointerId: number): void {
  if (!pointerId || !element.releasePointerCapture) return;

  try {
    if (!element.hasPointerCapture || element.hasPointerCapture(pointerId)) {
      element.releasePointerCapture(pointerId);
    }
  } catch {
    // Releasing an inactive pointer capture is harmless.
  }
}

function areValuesEqual(left: readonly number[], right: readonly number[]): boolean {
  return left.length === right.length && left.every((value, index) => value === right[index]);
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

function getDecimalPrecision(value: number): number {
  const [, decimal = ""] = String(value).split(".");
  return decimal.length;
}
