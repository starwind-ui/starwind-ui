import {
  assertHTMLElement,
  ensureId,
  readBooleanAttribute,
  setBooleanAttribute,
} from "../../internal/dom";
import { createInput } from "../input";
import {
  connectFieldControl,
  getFieldControlAccessibleSurfaces,
  getFieldControlFocusTarget,
  getFieldControlKind,
  getFieldControlLabelSurfaces,
  getFieldControlNativeControls,
  getFieldControlStateSurfaces,
  readFieldControlCustomValidity,
  readFieldControlValue,
  registerFieldControlBridge,
  type FieldNativeControl,
} from "./field-control-bridge";

export type FieldState = {
  dirty: boolean;
  disabled: boolean;
  errorVisible: boolean;
  filled: boolean;
  focused: boolean;
  submitted: boolean;
  touched: boolean;
  valid: boolean | null;
  validating: boolean;
};

export type FieldValidityKey =
  | "badInput"
  | "customError"
  | "patternMismatch"
  | "rangeOverflow"
  | "rangeUnderflow"
  | "stepMismatch"
  | "tooLong"
  | "tooShort"
  | "typeMismatch"
  | "valueMissing";

export type FieldValidationError = {
  readonly key: FieldValidityKey;
  readonly message: string;
  readonly source: "async" | "custom" | "external" | "native" | "schema" | "server";
};

export type FieldFormValidationState = {
  readonly errors: FieldValidationError[];
  readonly submitted: boolean;
  readonly validated: boolean;
  readonly validating?: boolean;
  readonly visible: boolean;
};

export type FieldFormRegistration = {
  readonly control?: HTMLElement;
  readonly disabled: boolean;
  focus(): void;
  readonly name?: string;
  readonly root: HTMLElement;
  readonly valid: boolean | null;
  readonly value: FormDataEntryValue | FormDataEntryValue[] | null;
};

export type FieldOptions = {
  dirty?: boolean;
  disabled?: boolean;
  invalid?: boolean;
  name?: string;
  touched?: boolean;
};

export type FieldInstance = {
  readonly root: HTMLElement;
  destroy(): void;
  getFormRegistration(): FieldFormRegistration;
  getState(): FieldState;
  refresh(): void;
  setDirty(dirty?: boolean): void;
  setDisabled(disabled: boolean): void;
  setFormValidationState(state?: FieldFormValidationState): void;
  setInvalid(invalid?: boolean): void;
  setName(name?: string): void;
  setTouched(touched?: boolean): void;
};

type FieldElements = {
  control?: HTMLElement;
  descriptions: HTMLElement[];
  errors: HTMLElement[];
  items: HTMLElement[];
  labels: HTMLElement[];
  validities: HTMLElement[];
};

type FieldValidity = {
  badInput: boolean;
  customError: boolean;
  patternMismatch: boolean;
  rangeOverflow: boolean;
  rangeUnderflow: boolean;
  stepMismatch: boolean;
  tooLong: boolean;
  tooShort: boolean;
  typeMismatch: boolean;
  valid: boolean | null;
  valueMissing: boolean;
};

const FIELD_ROOT_ATTRIBUTE = "data-sw-field";
const FIELD_LABEL_ATTRIBUTE = "data-sw-field-label";
const FIELD_CONTROL_ATTRIBUTE = "data-sw-field-control";
const FIELD_DESCRIPTION_ATTRIBUTE = "data-sw-field-description";
const FIELD_ITEM_ATTRIBUTE = "data-sw-field-item";
const FIELD_ERROR_ATTRIBUTE = "data-sw-field-error";
const FIELD_VALIDITY_ATTRIBUTE = "data-sw-field-validity";
const FIELD_MATCH_ATTRIBUTE = "data-match";
const FIELD_MESSAGE_SOURCE_ATTRIBUTE = "data-message-source";
const FIELD_NAME_ATTRIBUTE = "data-name";

const FORM_CONTROL_SELECTORS = [
  `[${FIELD_CONTROL_ATTRIBUTE}]`,
  "[data-sw-input]",
  "[data-sw-checkbox-group]",
  "[data-sw-radio-group]",
  "[data-sw-combobox]",
  "[data-sw-color-picker]",
  "[data-sw-dropzone]",
  "[data-sw-checkbox]",
  "[data-sw-radio]",
  "[data-sw-select]",
  "[data-sw-switch]",
  "[data-sw-slider]",
  "[data-sw-input-otp]",
  "input",
  "select",
  "textarea",
].join(",");
const VALIDITY_KEYS: readonly FieldValidityKey[] = [
  "badInput",
  "customError",
  "patternMismatch",
  "rangeOverflow",
  "rangeUnderflow",
  "stepMismatch",
  "tooLong",
  "tooShort",
  "typeMismatch",
  "valueMissing",
];

const instances = new WeakMap<HTMLElement, FieldController>();
const fieldErrorFallbackHtml = new WeakMap<HTMLElement, string>();
const fieldErrorRenderedMessages = new WeakMap<HTMLElement, string>();

registerFieldControlBridge({
  kind: "input",
  connect(control, { disabled }) {
    if (control instanceof HTMLInputElement) {
      createInput(control, { disabled }).setDisabled(disabled);
    }
  },
});

export function createField(root: HTMLElement, options: FieldOptions = {}): FieldInstance {
  assertHTMLElement(root, "createField root");

  const existing = instances.get(root);
  if (existing) return existing;

  const instance = new FieldController(root, options);
  instances.set(root, instance);
  return instance;
}

class FieldController implements FieldInstance {
  readonly root: HTMLElement;

  private readonly abortController = new AbortController();
  private readonly appliedControlDisabled = new WeakMap<HTMLElement, boolean>();
  private readonly appliedControlNames = new WeakMap<HTMLElement, string>();
  private readonly ownDisabled = new WeakMap<HTMLElement, boolean>();
  private readonly runtimeControlAriaDisabledPreviousValues = new WeakMap<
    HTMLElement,
    string | null
  >();
  private readonly mutationObserver: MutationObserver;
  private destroyed = false;
  private dirty: boolean;
  private dirtyControlled: boolean;
  private disabled: boolean;
  private elements: FieldElements;
  private focused = false;
  private formValidationState: FieldFormValidationState | undefined;
  private initialValue = "";
  private invalid: boolean | undefined;
  private name: string | undefined;
  private renderTimer: number | undefined;
  private touched: boolean;
  private touchedControlled: boolean;

  constructor(root: HTMLElement, options: FieldOptions) {
    this.root = root;
    this.dirtyControlled = options.dirty !== undefined;
    this.touchedControlled = options.touched !== undefined;
    this.dirty = options.dirty ?? readBooleanAttribute(root, "data-dirty");
    this.disabled = options.disabled ?? readBooleanAttribute(root, "data-disabled");
    this.invalid =
      options.invalid ??
      (root.hasAttribute("data-invalid") || root.getAttribute("aria-invalid") === "true"
        ? true
        : undefined);
    this.name = options.name ?? readOptionalAttribute(root, FIELD_NAME_ATTRIBUTE);
    this.touched = options.touched ?? readBooleanAttribute(root, "data-touched");
    this.elements = getFieldElements(root);
    this.mutationObserver = new MutationObserver(this.handleMutations);

    this.setupOwnedControl();
    this.initialValue = this.readControlValue();
    this.bindEvents();
    this.mutationObserver.observe(root, {
      attributes: true,
      childList: true,
      subtree: true,
    });
    this.render();
  }

  destroy(): void {
    if (this.destroyed) return;

    this.abortController.abort();
    this.mutationObserver.disconnect();
    this.clearRenderTimer();
    instances.delete(this.root);
    this.destroyed = true;
  }

  getState(): FieldState {
    const state = this.computeState();
    return {
      dirty: state.dirty,
      disabled: state.disabled,
      errorVisible: state.errorVisible,
      filled: state.filled,
      focused: state.focused,
      submitted: state.submitted,
      touched: state.touched,
      valid: state.valid,
      validating: state.validating,
    };
  }

  getFormRegistration(): FieldFormRegistration {
    const state = this.computeState();
    const control = this.elements.control;

    return {
      control,
      disabled: state.disabled || (control ? this.getEffectiveControlDisabled(control) : false),
      focus: () => {
        const target = control ? getFieldControlFocusTarget(control) : undefined;
        target?.focus();
      },
      name: this.readFormName(),
      root: this.root,
      valid: this.invalid === true ? false : this.readControlValidity().valid,
      value: this.readSubmittedControlValue(),
    };
  }

  refresh(): void {
    this.elements = getFieldElements(this.root);
    this.setupOwnedControl();
    this.render();
  }

  setDirty(dirty?: boolean): void {
    if (dirty === undefined) {
      if (!this.dirtyControlled) return;

      this.dirtyControlled = false;
      this.render();
      return;
    }

    if (this.dirtyControlled && this.dirty === dirty) return;

    this.dirtyControlled = true;
    this.dirty = dirty;
    this.render();
  }

  setDisabled(disabled: boolean): void {
    if (this.disabled === disabled) return;

    this.disabled = disabled;
    this.render();
  }

  setFormValidationState(state?: FieldFormValidationState): void {
    const nextState = state
      ? {
          errors: state.errors.map((error) => ({ ...error })),
          submitted: state.submitted,
          validated: state.validated,
          validating: state.validating ?? false,
          visible: state.visible,
        }
      : undefined;

    if (areFormValidationStatesEqual(this.formValidationState, nextState)) return;

    this.formValidationState = nextState;
    this.render();
  }

  setInvalid(invalid?: boolean): void {
    if (this.invalid === invalid) return;

    this.invalid = invalid;
    this.render();
  }

  setName(name?: string): void {
    if (this.name === name) {
      this.syncRootNameAttribute();
      return;
    }

    this.name = name;
    this.syncRootNameAttribute();
    this.setupOwnedControl();
    this.render();
  }

  setTouched(touched?: boolean): void {
    if (touched === undefined) {
      if (!this.touchedControlled) return;

      this.touchedControlled = false;
      this.render();
      return;
    }

    if (this.touchedControlled && this.touched === touched) return;

    this.touchedControlled = true;
    this.touched = touched;
    this.render();
  }

  private bindEvents(): void {
    const { signal } = this.abortController;

    this.root.addEventListener("focusin", this.handleFocusIn, { signal });
    this.root.addEventListener("focusout", this.handleFocusOut, { signal });
    this.root.addEventListener("input", this.handleControlMutationEvent, { signal });
    this.root.addEventListener("change", this.handleControlMutationEvent, { signal });
    this.root.addEventListener("starwind:value-change", this.handleControlMutationEvent, {
      signal,
    });
    this.root.addEventListener("starwind:checked-change", this.handleControlMutationEvent, {
      signal,
    });
    this.root.addEventListener("starwind:value-committed", this.handleControlMutationEvent, {
      signal,
    });

    const form = this.getPrimaryNativeControl()?.form;
    form?.addEventListener("reset", this.handleFormReset, { signal });
  }

  private setupOwnedControl(): void {
    const control = this.elements.control;
    if (!control) return;

    const shouldSyncName = this.name !== undefined || this.appliedControlNames.has(control);

    control.setAttribute(FIELD_CONTROL_ATTRIBUTE, "");
    this.applyControlName(control);
    this.applyControlDisabled(control);
    getFieldControlStateSurfaces(this.root, control).forEach((surface) =>
      this.captureRuntimeControlAriaDisabled(surface, this.getEffectiveControlDisabled(control)),
    );
    this.createOwnedControl(control, { shouldSyncName });
  }

  private createOwnedControl(
    control: HTMLElement,
    { shouldSyncName }: { shouldSyncName: boolean },
  ): void {
    const disabled = this.getEffectiveControlDisabled(control);
    connectFieldControl(control, {
      disabled,
      name: this.name,
      onConnected: () => {
        if (!this.destroyed) {
          this.render();
        }
      },
      shouldSyncName,
      signal: this.abortController.signal,
    });
  }

  private applyControlName(control: HTMLElement): void {
    if (this.name !== undefined) {
      if (isNativeFormControl(control)) {
        if (control.name !== this.name) {
          control.name = this.name;
        }
      } else if (control.getAttribute(FIELD_NAME_ATTRIBUTE) !== this.name) {
        control.setAttribute(FIELD_NAME_ATTRIBUTE, this.name);
      }

      this.appliedControlNames.set(control, this.name);
      return;
    }

    const previousName = this.appliedControlNames.get(control);
    if (previousName === undefined) return;

    if (isNativeFormControl(control)) {
      if (control.name === previousName) {
        control.removeAttribute("name");
      }
    } else if (control.getAttribute(FIELD_NAME_ATTRIBUTE) === previousName) {
      control.removeAttribute(FIELD_NAME_ATTRIBUTE);
    }

    this.appliedControlNames.delete(control);
  }

  private applyControlDisabled(control: HTMLElement): void {
    const disabled = this.getEffectiveControlDisabled(control);

    if (isDisableableNativeControl(control) && control.disabled !== disabled) {
      control.disabled = disabled;
    }

    setBooleanAttribute(control, "data-disabled", disabled);
    this.appliedControlDisabled.set(control, disabled);
  }

  private getEffectiveControlDisabled(control: HTMLElement): boolean {
    const ownDisabled = this.getOwnControlDisabled(control);
    return this.disabled || ownDisabled;
  }

  private getOwnControlDisabled(control: HTMLElement): boolean {
    const cached = this.ownDisabled.get(control);
    if (cached !== undefined) return cached;

    const disabled = readControlDisabledState(control);
    this.ownDisabled.set(control, disabled);
    return disabled;
  }

  private syncRootNameAttribute(): void {
    if (this.name === undefined) {
      this.root.removeAttribute(FIELD_NAME_ATTRIBUTE);
      return;
    }

    if (this.root.getAttribute(FIELD_NAME_ATTRIBUTE) !== this.name) {
      this.root.setAttribute(FIELD_NAME_ATTRIBUTE, this.name);
    }
  }

  private readonly handleFocusIn = (event: FocusEvent): void => {
    if (!this.isFieldControlEvent(event)) return;

    this.focused = !this.disabled;
    this.render();
  };

  private readonly handleFocusOut = (event: FocusEvent): void => {
    if (!this.isFieldControlEvent(event)) return;
    if (event.relatedTarget instanceof Node && this.root.contains(event.relatedTarget)) return;

    this.focused = false;
    if (!this.touchedControlled) {
      this.touched = true;
    }
    this.render();
  };

  private readonly handleControlMutationEvent = (event: Event): void => {
    if (!this.isFieldControlEvent(event)) return;

    this.scheduleRender();
  };

  private readonly handleFormReset = (): void => {
    if (!this.touchedControlled) {
      this.touched = false;
    }
    this.scheduleRender();
  };

  private readonly handleMutations = (mutations: MutationRecord[]): void => {
    if (this.destroyed) return;

    const rootNameMutated = mutations.some(
      (mutation) =>
        mutation.target === this.root && mutation.attributeName === FIELD_NAME_ATTRIBUTE,
    );
    const rootDisabledMutated = mutations.some(
      (mutation) => mutation.target === this.root && mutation.attributeName === "data-disabled",
    );

    if (rootNameMutated) {
      this.name = readOptionalAttribute(this.root, FIELD_NAME_ATTRIBUTE);
    }

    if (rootDisabledMutated) {
      this.disabled = readBooleanAttribute(this.root, "data-disabled");
    }

    if (mutations.some((mutation) => mutation.type === "childList")) {
      this.refresh();
      return;
    }

    if (mutations.some((mutation) => this.isFeedbackAttributeMutation(mutation))) {
      this.render();
      return;
    }

    if (
      mutations.some(
        (mutation) =>
          mutation.type === "attributes" &&
          mutation.target === this.elements.control &&
          this.elements.control?.hasAttribute("data-sw-color-picker") === true &&
          mutation.attributeName === "data-value",
      )
    ) {
      this.scheduleRender();
    }

    const ownershipMutations = mutations.filter((mutation) =>
      this.isOwnershipAttributeMutation(mutation),
    );

    ownershipMutations.forEach((mutation) => this.updateOwnDisabledFromMutation(mutation));

    if (ownershipMutations.length > 0) {
      this.setupOwnedControl();
      this.render();
    }
  };

  private updateOwnDisabledFromMutation(mutation: MutationRecord): void {
    if (!(mutation.target instanceof HTMLElement)) return;
    if (mutation.target === this.root) return;
    if (mutation.attributeName !== "disabled" && mutation.attributeName !== "data-disabled") {
      return;
    }

    const currentDisabled = readControlDisabledMutationState(
      mutation.target,
      mutation.attributeName,
    );
    if (currentDisabled === undefined) return;
    if (this.appliedControlDisabled.get(mutation.target) === currentDisabled) return;

    this.ownDisabled.set(mutation.target, currentDisabled);
  }

  private isOwnershipAttributeMutation(mutation: MutationRecord): boolean {
    if (mutation.type !== "attributes") return false;

    const attributeName = mutation.attributeName;
    if (!attributeName) return false;

    if (mutation.target === this.root) {
      return attributeName === FIELD_NAME_ATTRIBUTE || attributeName === "data-disabled";
    }

    if (mutation.target !== this.elements.control) return false;

    return (
      attributeName === "name" ||
      attributeName === FIELD_NAME_ATTRIBUTE ||
      attributeName === "disabled" ||
      attributeName === "data-disabled" ||
      attributeName === "data-readonly" ||
      attributeName === "data-required"
    );
  }

  private isFeedbackAttributeMutation(mutation: MutationRecord): boolean {
    if (mutation.type !== "attributes") return false;

    const attributeName = mutation.attributeName;
    if (
      attributeName !== FIELD_MATCH_ATTRIBUTE &&
      attributeName !== FIELD_MESSAGE_SOURCE_ATTRIBUTE
    ) {
      return false;
    }

    if (!(mutation.target instanceof HTMLElement)) return false;

    return (
      this.elements.errors.includes(mutation.target) ||
      this.elements.validities.includes(mutation.target)
    );
  }

  private isFieldControlEvent(event: Event): boolean {
    const target = event.target;
    const control = this.elements.control;

    if (!control || !(target instanceof Node)) return false;

    return target === control || control.contains(target);
  }

  private scheduleRender(): void {
    this.clearRenderTimer();
    this.renderTimer = window.setTimeout(() => {
      this.renderTimer = undefined;
      this.render();
    }, 0);
  }

  private clearRenderTimer(): void {
    if (this.renderTimer === undefined) return;

    window.clearTimeout(this.renderTimer);
    this.renderTimer = undefined;
  }

  private render(): void {
    const state = this.computeState();
    const fieldParts = [
      this.root,
      ...this.elements.labels,
      ...this.elements.descriptions,
      ...this.elements.items,
      ...this.elements.errors,
      ...this.elements.validities,
    ];
    let controlState: FieldState | undefined;

    if (this.elements.control) {
      this.applyControlName(this.elements.control);
      this.applyControlDisabled(this.elements.control);
      controlState = {
        ...state,
        disabled: this.getEffectiveControlDisabled(this.elements.control),
      };
    }

    if (!this.root.hasAttribute(FIELD_ROOT_ATTRIBUTE)) {
      this.root.setAttribute(FIELD_ROOT_ATTRIBUTE, "");
    }

    if (this.elements.control && controlState) {
      getFieldControlStateSurfaces(this.root, this.elements.control).forEach((surface) =>
        this.captureRuntimeControlAriaDisabled(surface, controlState.disabled),
      );
    }

    this.setupOwnedControl();
    fieldParts.forEach((element) => setFieldStateAttributes(element, state));
    if (this.elements.control && controlState) {
      getFieldControlStateSurfaces(this.root, this.elements.control).forEach((surface) => {
        const colorPickerOwnsDisabled =
          getFieldControlKind(this.elements.control!) === "color-picker" &&
          (surface.hasAttribute("data-sw-color-picker-trigger") ||
            surface.hasAttribute("data-sw-color-picker-control"));
        setFieldStateAttributes(surface, controlState, {
          includeDisabled: !colorPickerOwnsDisabled,
        });
        this.applyRuntimeControlAriaDisabled(surface, controlState);
      });
      if (getFieldControlKind(this.elements.control) === "color-picker") {
        this.createOwnedControl(this.elements.control, {
          shouldSyncName:
            this.name !== undefined || this.appliedControlNames.has(this.elements.control),
        });
      }
    }
    this.renderAccessibleAssociations(state);
    this.renderMatchedFeedback(state);
  }

  private captureRuntimeControlAriaDisabled(surface: HTMLElement, disabled: boolean): void {
    if (!disabled) return;
    if (!isRuntimeControlAriaDisabledSurface(surface)) return;
    if (this.runtimeControlAriaDisabledPreviousValues.has(surface)) return;

    this.runtimeControlAriaDisabledPreviousValues.set(
      surface,
      surface.getAttribute("aria-disabled"),
    );
  }

  private applyRuntimeControlAriaDisabled(surface: HTMLElement, state: FieldState): void {
    if (!isRuntimeControlAriaDisabledSurface(surface)) return;

    if (state.disabled) {
      surface.setAttribute("aria-disabled", "true");
      return;
    }

    if (!this.runtimeControlAriaDisabledPreviousValues.has(surface)) return;

    const previousValue = this.runtimeControlAriaDisabledPreviousValues.get(surface) ?? null;
    const currentValue = surface.getAttribute("aria-disabled");

    if (previousValue === null) {
      if (currentValue === "true") {
        surface.removeAttribute("aria-disabled");
      }
    } else if (currentValue !== previousValue) {
      surface.setAttribute("aria-disabled", previousValue);
    }

    this.runtimeControlAriaDisabledPreviousValues.delete(surface);
  }

  private computeState(): FieldState {
    const validity = this.readDisplayedValidity();
    const value = this.readControlValue();
    const invalid = this.invalid ?? validity.valid === false;
    const dirty = this.dirtyControlled ? this.dirty : value !== this.initialValue;
    const errorVisible = this.formValidationState
      ? this.formValidationState.visible && this.formValidationState.errors.length > 0
      : invalid;

    return {
      dirty,
      disabled: this.disabled,
      errorVisible,
      filled: isFilledValue(value),
      focused: this.focused,
      submitted: this.formValidationState?.submitted ?? false,
      touched: this.touched,
      valid: invalid ? false : validity.valid,
      validating: this.formValidationState?.validating ?? false,
    };
  }

  private renderAccessibleAssociations(state: FieldState): void {
    const control = this.elements.control;
    if (!control) return;

    const labelIds = this.elements.labels.map((label) => ensureId(label, "sw-field-label"));
    const descriptionIds = this.elements.descriptions.map((description) =>
      ensureId(description, "sw-field-description"),
    );
    const visibleErrorIds = this.elements.errors
      .filter((error) => !error.hidden)
      .map((error) => ensureId(error, "sw-field-error"));
    const visibleValidityIds = this.elements.validities
      .filter((validity) => !validity.hidden)
      .map((validity) => ensureId(validity, "sw-field-validity"));

    if (labelIds.length > 0) {
      if (
        control instanceof HTMLInputElement &&
        this.elements.labels[0] instanceof HTMLLabelElement
      ) {
        this.elements.labels[0].htmlFor = ensureId(control, "sw-field-control");
      } else {
        setIdReferenceAttribute(control, "aria-labelledby", labelIds);
      }
    }

    setIdReferenceAttribute(control, "aria-describedby", [
      ...descriptionIds,
      ...visibleErrorIds,
      ...visibleValidityIds,
    ]);

    setAriaInvalid(control, state);
    if (labelIds.length > 0) {
      getFieldControlLabelSurfaces(this.root, control).forEach((surface) => {
        setIdReferenceAttribute(surface, "aria-labelledby", labelIds);
      });
    }
    getFieldControlAccessibleSurfaces(this.root, control).forEach((surface) => {
      setIdReferenceAttribute(surface, "aria-describedby", [
        ...descriptionIds,
        ...visibleErrorIds,
        ...visibleValidityIds,
      ]);
      setAriaInvalid(surface, state);
    });
  }

  private renderMatchedFeedback(state: FieldState): void {
    const validity = this.readDisplayedValidity();

    this.elements.errors.forEach((error) => {
      const visible =
        shouldShowMatchedFeedback(error, validity, state) &&
        (!this.formValidationState || state.errorVisible);
      error.hidden = !visible;
      this.renderValidationErrorAttributes(error, visible);
      setFieldStateAttributes(error, state);
    });

    this.elements.validities.forEach((validityPart) => {
      const visible = shouldShowMatchedFeedback(validityPart, validity, state);
      validityPart.hidden = !visible;
      setFieldStateAttributes(validityPart, state);
    });

    this.renderAccessibleAssociations(state);
  }

  private renderValidationErrorAttributes(element: HTMLElement, visible: boolean): void {
    const error = visible ? this.findMatchingFormValidationError(element) : undefined;
    renderValidationErrorMessage(element, error);

    if (!error) {
      element.removeAttribute("data-validation-key");
      element.removeAttribute("data-validation-message");
      element.removeAttribute("data-validation-source");
      return;
    }

    element.setAttribute("data-validation-key", error.key);
    element.setAttribute("data-validation-message", error.message);
    element.setAttribute("data-validation-source", error.source);
  }

  private readControlValue(): string {
    const control = this.elements.control;
    if (!control) return "";

    return readFieldControlValue(control);
  }

  private readSubmittedControlValue(): FormDataEntryValue | FormDataEntryValue[] | null {
    const name = this.readFormName();
    const controls = this.getNativeControls({ includeHidden: true }).filter(
      (control) => control.name.length > 0 && (name === undefined || control.name === name),
    );

    if (controls.length === 0) return this.readControlValue();

    const values = controls.flatMap((control) => readSubmittedNativeControlValues(control));
    if (values.length === 0) return null;

    if (
      controls.some(
        (control) =>
          control instanceof HTMLInputElement && control.type === "file" && control.multiple,
      )
    ) {
      return values;
    }

    if (values.length === 1) return values[0]!;

    return values.some((value) => value instanceof File) ? values : values.join(",");
  }

  private readFormName(): string | undefined {
    if (this.name !== undefined) return this.name;

    const control = this.elements.control;
    if (!control) return undefined;

    if (isNativeFormControl(control) && control.name.length > 0) {
      return control.name;
    }

    return (
      readOptionalAttribute(control, FIELD_NAME_ATTRIBUTE) ??
      this.getNativeControls({ includeHidden: true }).find((nativeControl) => nativeControl.name)
        ?.name
    );
  }

  private readDisplayedValidity(): FieldValidity {
    const formValidity = this.readFormValidationValidity();
    if (formValidity) return formValidity;

    return this.readControlValidity();
  }

  private readFormValidationValidity(): FieldValidity | undefined {
    if (!this.formValidationState) return undefined;
    if (!this.formValidationState.validated) return createValidity(null);

    const validity = createValidity(this.formValidationState.errors.length === 0);
    this.formValidationState.errors.forEach((error) => {
      validity[error.key] = true;
    });

    return validity;
  }

  private readControlValidity(): FieldValidity {
    const customValidity = this.readCustomControlValidity();
    if (customValidity) return customValidity;

    const validity = createValidity(null);
    const controls = this.getNativeControls();
    if (controls.length === 0) return validity;

    validity.valid = true;

    controls.forEach((control) => {
      const controlValidity = control.validity;
      if (controlValidity.valid) return;

      validity.valid = false;
      VALIDITY_KEYS.forEach((key) => {
        validity[key] = validity[key] || controlValidity[key];
      });
    });

    return validity;
  }

  private findMatchingFormValidationError(element: HTMLElement): FieldValidationError | undefined {
    if (!this.formValidationState?.visible) return undefined;
    if (this.formValidationState.errors.length === 0) return undefined;

    const match = element.getAttribute(FIELD_MATCH_ATTRIBUTE) ?? "false";
    if (match === "" || match === "false") return this.formValidationState.errors[0];
    if (match === "true") return undefined;
    if (VALIDITY_KEYS.includes(match as FieldValidityKey)) {
      return this.formValidationState.errors.find((error) => error.key === match);
    }

    return undefined;
  }

  private readCustomControlValidity(): FieldValidity | undefined {
    const control = this.elements.control;
    if (!control) return undefined;

    const customValidity = readFieldControlCustomValidity(control, this.readControlValue());
    if (!customValidity) return undefined;

    const validity = createValidity(customValidity.valid);
    VALIDITY_KEYS.forEach((key) => {
      validity[key] = customValidity[key] ?? false;
    });
    return validity;
  }

  private getPrimaryNativeControl():
    | HTMLInputElement
    | HTMLSelectElement
    | HTMLTextAreaElement
    | undefined {
    return this.elements.control
      ? getFieldControlNativeControls(this.elements.control)[0]
      : undefined;
  }

  private getNativeControls({
    includeHidden = false,
  }: {
    includeHidden?: boolean;
  } = {}): FieldNativeControl[] {
    const control = this.elements.control;
    if (!control) return [];

    return getFieldControlNativeControls(control, { includeHidden });
  }
}

function getFieldElements(root: HTMLElement): FieldElements {
  return {
    control: findOwnControl(root),
    descriptions: queryOwnElements(root, `[${FIELD_DESCRIPTION_ATTRIBUTE}]`),
    errors: queryOwnElements(root, `[${FIELD_ERROR_ATTRIBUTE}]`),
    items: queryOwnElements(root, `[${FIELD_ITEM_ATTRIBUTE}]`),
    labels: queryOwnElements(root, `[${FIELD_LABEL_ATTRIBUTE}]`),
    validities: queryOwnElements(root, `[${FIELD_VALIDITY_ATTRIBUTE}]`),
  };
}

function findOwnControl(root: HTMLElement): HTMLElement | undefined {
  return Array.from(root.querySelectorAll<HTMLElement>(FORM_CONTROL_SELECTORS)).find(
    (element) => element.closest(`[${FIELD_ROOT_ATTRIBUTE}]`) === root,
  );
}

function queryOwnElements(
  root: HTMLElement,
  selector: string,
  ownerSelector = `[${FIELD_ROOT_ATTRIBUTE}]`,
): HTMLElement[] {
  return Array.from(root.querySelectorAll<HTMLElement>(selector)).filter(
    (element) => element.closest(ownerSelector) === root,
  );
}

function setAriaInvalid(element: HTMLElement, state: FieldState): void {
  if (state.valid === false) {
    element.setAttribute("aria-invalid", "true");
  } else if (element.getAttribute("aria-invalid") === "true") {
    element.removeAttribute("aria-invalid");
  }
}

function isRuntimeControlAriaDisabledSurface(element: HTMLElement): boolean {
  return (
    element.hasAttribute("data-sw-checkbox") ||
    element.hasAttribute("data-sw-radio") ||
    element.hasAttribute("data-sw-slider-thumb") ||
    element.hasAttribute("data-sw-switch")
  );
}

function readSubmittedNativeControlValues(
  control: HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement,
): FormDataEntryValue[] {
  if (control.disabled || control.name.length === 0) return [];

  if (control instanceof HTMLSelectElement) {
    return Array.from(control.selectedOptions).map((option) => option.value);
  }

  if (control instanceof HTMLTextAreaElement) {
    return [control.value];
  }

  if (isNonSubmittingInput(control)) return [];

  if (control.type === "checkbox" || control.type === "radio") {
    return control.checked ? [control.value] : [];
  }

  if (control.type === "file") {
    return Array.from(control.files ?? []);
  }

  return [control.value];
}

function areFormValidationStatesEqual(
  previous: FieldFormValidationState | undefined,
  next: FieldFormValidationState | undefined,
): boolean {
  if (previous === next) return true;
  if (!previous || !next) return false;
  if (previous.submitted !== next.submitted) return false;
  if (previous.validated !== next.validated) return false;
  if ((previous.validating ?? false) !== (next.validating ?? false)) return false;
  if (previous.visible !== next.visible) return false;
  if (previous.errors.length !== next.errors.length) return false;

  return previous.errors.every((error, index) => {
    const nextError = next.errors[index];
    return (
      nextError !== undefined &&
      error.key === nextError.key &&
      error.message === nextError.message &&
      error.source === nextError.source
    );
  });
}

function isNonSubmittingInput(control: HTMLInputElement): boolean {
  return (
    control.type === "button" ||
    control.type === "image" ||
    control.type === "reset" ||
    control.type === "submit"
  );
}

function setFieldStateAttributes(
  element: HTMLElement,
  state: FieldState,
  { includeDisabled = true }: { includeDisabled?: boolean } = {},
): void {
  if (includeDisabled) setBooleanAttribute(element, "data-disabled", state.disabled);
  setBooleanAttribute(element, "data-error-visible", state.errorVisible);
  setBooleanAttribute(element, "data-valid", state.valid === true);
  setBooleanAttribute(element, "data-invalid", state.valid === false);
  setBooleanAttribute(element, "data-dirty", state.dirty);
  setBooleanAttribute(element, "data-submitted", state.submitted);
  setBooleanAttribute(element, "data-touched", state.touched);
  setBooleanAttribute(element, "data-filled", state.filled);
  setBooleanAttribute(element, "data-focused", state.focused);
  setBooleanAttribute(element, "data-validating", state.validating);
}

function renderValidationErrorMessage(
  element: HTMLElement,
  error: FieldValidationError | undefined,
): void {
  const shouldUseValidationMessage =
    element.getAttribute(FIELD_MESSAGE_SOURCE_ATTRIBUTE) === "validation";
  const renderedMessage = fieldErrorRenderedMessages.get(element);

  if (!shouldUseValidationMessage) {
    if (renderedMessage !== undefined) {
      restoreValidationErrorFallback(element);
    }
    fieldErrorFallbackHtml.delete(element);
    fieldErrorRenderedMessages.delete(element);
    return;
  }

  const nextMessage = error?.message;
  if (nextMessage && nextMessage.length > 0) {
    if (
      renderedMessage === undefined ||
      element.textContent !== renderedMessage ||
      element.children.length > 0
    ) {
      fieldErrorFallbackHtml.set(element, element.innerHTML);
    }

    if (element.textContent !== nextMessage || element.children.length > 0) {
      element.textContent = nextMessage;
    }
    fieldErrorRenderedMessages.set(element, nextMessage);
    return;
  }

  if (renderedMessage !== undefined) {
    restoreValidationErrorFallback(element);
    fieldErrorRenderedMessages.delete(element);
    return;
  }

  fieldErrorFallbackHtml.set(element, element.innerHTML);
}

function restoreValidationErrorFallback(element: HTMLElement): void {
  const fallbackHtml = fieldErrorFallbackHtml.get(element) ?? "";
  if (element.innerHTML !== fallbackHtml) {
    element.innerHTML = fallbackHtml;
  }
}

function setIdReferenceAttribute(element: HTMLElement, name: string, ids: string[]): void {
  const nextValue = Array.from(new Set(ids.filter(Boolean))).join(" ");

  if (nextValue.length === 0) {
    element.removeAttribute(name);
    return;
  }

  element.setAttribute(name, nextValue);
}

function shouldShowMatchedFeedback(
  element: HTMLElement,
  validity: FieldValidity,
  state: FieldState,
): boolean {
  const match = element.getAttribute(FIELD_MATCH_ATTRIBUTE);

  if (element.hasAttribute(FIELD_ERROR_ATTRIBUTE)) {
    if (match === null || match === "" || match === "false") return state.valid === false;
    if (match === "true") return true;
  }

  const normalizedMatch = match ?? "true";

  if (normalizedMatch === "" || normalizedMatch === "true") return state.valid === false;
  if (normalizedMatch === "false") return false;
  if (normalizedMatch === "valid") return state.valid === true;
  if (VALIDITY_KEYS.includes(normalizedMatch as (typeof VALIDITY_KEYS)[number])) {
    return validity[normalizedMatch as (typeof VALIDITY_KEYS)[number]];
  }

  return state.valid === false;
}

function createValidity(valid: boolean | null): FieldValidity {
  return {
    badInput: false,
    customError: false,
    patternMismatch: false,
    rangeOverflow: false,
    rangeUnderflow: false,
    stepMismatch: false,
    tooLong: false,
    tooShort: false,
    typeMismatch: false,
    valid,
    valueMissing: false,
  };
}

function isFilledValue(value: string): boolean {
  return value.length > 0;
}

function readOptionalAttribute(element: HTMLElement, name: string): string | undefined {
  return element.getAttribute(name) ?? undefined;
}

function readControlDisabledState(control: HTMLElement): boolean {
  return (
    readBooleanAttribute(control, "data-disabled") ||
    (isDisableableNativeControl(control) && control.disabled)
  );
}

function readControlDisabledMutationState(
  control: HTMLElement,
  attributeName: string,
): boolean | undefined {
  if (attributeName === "data-disabled") {
    return readBooleanAttribute(control, "data-disabled");
  }

  if (attributeName === "disabled" && isDisableableNativeControl(control)) {
    return control.disabled;
  }

  return undefined;
}

function isNativeFormControl(
  element: HTMLElement,
): element is HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement {
  return (
    element instanceof HTMLInputElement ||
    element instanceof HTMLSelectElement ||
    element instanceof HTMLTextAreaElement
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
