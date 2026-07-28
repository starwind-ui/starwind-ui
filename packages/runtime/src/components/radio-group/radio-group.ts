import {
  type DynamicCollectionObserver,
  observeDynamicCollection,
} from "../../internal/collection";
import { assertHTMLElement, readBooleanAttribute, setBooleanAttribute } from "../../internal/dom";
import { dispatchCustomEvent } from "../../internal/events";
import { attachFormValueRevision } from "../../internal/form-value-revision";
import { registerFieldControlBridge } from "../field/field-control-bridge";
import {
  createRadio,
  type RadioCheckedChangeDetails,
  type RadioInstance,
  type RadioSelectionOwnerCompletion,
} from "../radio";

export type RadioGroupValue = string | undefined;

export type RadioGroupValueChangeReason = "imperative-action" | "keyboard-action" | "radio-change";

export type RadioGroupValueChangeDetails = {
  readonly event?: Event;
  readonly isCanceled: boolean;
  readonly previousValue: RadioGroupValue;
  readonly radioValue: string;
  readonly reason: RadioGroupValueChangeReason;
  readonly trigger?: Element;
  readonly value: string;
  cancel(): void;
  onAccepted(callback: () => void): void;
};

export type RadioGroupOrientation = "horizontal" | "vertical";

export type RadioGroupOptions = {
  defaultValue?: RadioGroupValue;
  disabled?: boolean;
  form?: string;
  name?: string;
  onValueChange?: (value: string, details: RadioGroupValueChangeDetails) => void;
  orientation?: RadioGroupOrientation;
  readOnly?: boolean;
  required?: boolean;
  value?: RadioGroupValue;
};

export type RadioGroupSetValueOptions = {
  emit?: boolean;
};

export type RadioGroupInstance = {
  readonly root: HTMLElement;
  destroy(): void;
  getValue(): RadioGroupValue;
  refresh(): void;
  setDisabled(disabled: boolean): void;
  setFormOptions(options: Pick<RadioGroupOptions, "form" | "name" | "required">): void;
  setName(name?: string): void;
  setOrientation(orientation: RadioGroupOrientation): void;
  setReadOnly(readOnly: boolean): void;
  setRequired(required: boolean): void;
  setValue(value: RadioGroupValue, options?: RadioGroupSetValueOptions): void;
  subscribe(event: "stateSync", callback: () => void): () => void;
  subscribe(
    event: "valueChange",
    callback: (details: RadioGroupValueChangeDetails) => void,
  ): () => void;
};

type RadioGroupItem = {
  input: HTMLInputElement;
  ownForm?: string;
  ownName?: string;
  ownDisabled: boolean;
  ownReadOnly: boolean;
  ownRequired: boolean;
  radio: RadioInstance;
  root: HTMLElement;
  value: string;
};

type RadioGroupItemOwnState = Pick<
  RadioGroupItem,
  "ownDisabled" | "ownForm" | "ownName" | "ownReadOnly" | "ownRequired"
>;

const RADIO_GROUP_ROOT_ATTRIBUTE = "data-sw-radio-group";
const RADIO_GROUP_DEFAULT_VALUE_ATTRIBUTE = "data-default-value";
const RADIO_GROUP_DISABLED_ATTRIBUTE = "data-disabled";
const RADIO_GROUP_FORM_ATTRIBUTE = "data-form";
const RADIO_GROUP_NAME_ATTRIBUTE = "data-name";
const RADIO_GROUP_ORIENTATION_ATTRIBUTE = "data-orientation";
const RADIO_GROUP_READONLY_ATTRIBUTE = "data-readonly";
const RADIO_GROUP_REQUIRED_ATTRIBUTE = "data-required";
const RADIO_GROUP_VALUE_ATTRIBUTE = "data-value";
const RADIO_ROOT_ATTRIBUTE = "data-sw-radio";
const RADIO_DISABLED_ATTRIBUTE = "data-disabled";
const RADIO_INPUT_ATTRIBUTE = "data-sw-radio-input";
const RADIO_NAME_ATTRIBUTE = "data-name";
const RADIO_READONLY_ATTRIBUTE = "data-readonly";
const RADIO_REQUIRED_ATTRIBUTE = "data-required";
const RADIO_VALUE_ATTRIBUTE = "data-value";

const instances = new WeakMap<HTMLElement, RadioGroupController>();

registerFieldControlBridge({
  kind: "radio-group",
  connect(control, { disabled, name, shouldSyncName }) {
    const radioGroup = createRadioGroup(control, { disabled, name });
    radioGroup.setDisabled(disabled);
    if (shouldSyncName) {
      radioGroup.setName(name);
    }
  },
});

export function createRadioGroup(
  root: HTMLElement,
  options: RadioGroupOptions = {},
): RadioGroupInstance {
  assertHTMLElement(root, "createRadioGroup root");

  const existing = instances.get(root);
  if (existing) return existing;

  const instance = new RadioGroupController(root, options);
  instances.set(root, instance);
  return instance;
}

class RadioGroupController implements RadioGroupInstance {
  readonly root: HTMLElement;

  private readonly abortController = new AbortController();
  private readonly controlled: boolean;
  private readonly collectionObserver: DynamicCollectionObserver;
  private destroyed = false;
  private disabled: boolean;
  private form?: string;
  private initialValue: RadioGroupValue;
  private initialValueInitialized = false;
  private readonly inputAssociationObservers = new Map<HTMLInputElement, MutationObserver>();
  private items: RadioGroupItem[] = [];
  private itemByRoot = new WeakMap<HTMLElement, RadioGroupItem>();
  private readonly itemOwnStates = new WeakMap<HTMLElement, RadioGroupItemOwnState>();
  private name?: string;
  private readonly onValueChange?: (value: string, details: RadioGroupValueChangeDetails) => void;
  private orientation: RadioGroupOrientation;
  private readOnly: boolean;
  private readonly subscribers = new Set<(details: RadioGroupValueChangeDetails) => void>();
  private readonly syncSubscribers = new Set<() => void>();
  private transitionToken = 0;
  private required: boolean;
  private resetForms = new Set<HTMLFormElement>();
  private readonly pendingResetForms = new Set<HTMLFormElement>();
  private resetTimer: number | undefined;
  private value: RadioGroupValue;
  private valueItems = new Map<string, RadioGroupItem[]>();

  constructor(root: HTMLElement, options: RadioGroupOptions) {
    this.root = root;
    this.controlled = Object.hasOwn(options, "value");
    this.disabled = options.disabled ?? readBooleanAttribute(root, RADIO_GROUP_DISABLED_ATTRIBUTE);
    this.form = options.form ?? readOptionalAttribute(root, RADIO_GROUP_FORM_ATTRIBUTE);
    this.name = options.name ?? readOptionalAttribute(root, RADIO_GROUP_NAME_ATTRIBUTE);
    this.onValueChange = options.onValueChange;
    this.orientation =
      options.orientation ??
      readRadioGroupOrientation(root.getAttribute(RADIO_GROUP_ORIENTATION_ATTRIBUTE));
    this.readOnly = options.readOnly ?? readBooleanAttribute(root, RADIO_GROUP_READONLY_ATTRIBUTE);
    this.required = options.required ?? readBooleanAttribute(root, RADIO_GROUP_REQUIRED_ATTRIBUTE);
    this.value = normalizeRadioGroupValue(
      this.controlled
        ? options.value
        : (options.defaultValue ??
            readOptionalAttribute(root, RADIO_GROUP_DEFAULT_VALUE_ATTRIBUTE) ??
            readOptionalAttribute(root, RADIO_GROUP_VALUE_ATTRIBUTE)),
    );
    this.initialValue = this.value;

    this.bindEvents();
    this.collectionObserver = observeDynamicCollection({
      attributeFilter: [
        RADIO_ROOT_ATTRIBUTE,
        RADIO_DISABLED_ATTRIBUTE,
        RADIO_GROUP_FORM_ATTRIBUTE,
        RADIO_NAME_ATTRIBUTE,
        RADIO_READONLY_ATTRIBUTE,
        RADIO_REQUIRED_ATTRIBUTE,
        RADIO_VALUE_ATTRIBUTE,
        "data-default-checked",
        "checked",
        "disabled",
        "form",
        "name",
        "readonly",
        "required",
        "value",
      ],
      onChange: (mutations) => {
        this.applyItemOwnStateMutations(mutations);
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
    this.unbindFormReset();
    this.disconnectInputAssociationObservers();
    this.items.forEach((item) => {
      item.radio.setSelectionOwnerWithCompletion(undefined);
      this.itemOwnStates.delete(item.root);
    });
    this.items = [];
    this.itemByRoot = new WeakMap();
    this.valueItems.clear();
    this.subscribers.clear();
    this.syncSubscribers.clear();
    instances.delete(this.root);
    this.destroyed = true;
  }

  getValue(): RadioGroupValue {
    return this.value;
  }

  refresh(): void {
    if (this.destroyed) return;

    this.refreshItems();
    if (!this.initialValueInitialized) {
      this.initialValue = this.value;
      this.initialValueInitialized = true;
    }
    this.bindFormReset();
    this.reconcileValue();
    this.render();
  }

  setDisabled(disabled: boolean): void {
    if (this.disabled === disabled) return;

    this.disabled = disabled;
    this.render();
  }

  setFormOptions(options: Pick<RadioGroupOptions, "form" | "name" | "required">): void {
    this.form = options.form;
    this.name = options.name;
    this.required = options.required ?? this.required;
    this.render();
    this.bindFormReset();
  }

  setName(name?: string): void {
    if (this.name === name) {
      this.render();
      return;
    }

    this.name = name;
    this.render();
  }

  setOrientation(orientation: RadioGroupOrientation): void {
    if (this.orientation === orientation) return;

    this.orientation = orientation;
    this.render();
  }

  setReadOnly(readOnly: boolean): void {
    if (this.readOnly === readOnly) return;

    this.readOnly = readOnly;
    this.render();
  }

  setRequired(required: boolean): void {
    if (this.required === required) return;

    this.required = required;
    this.render();
  }

  setValue(value: RadioGroupValue, options: RadioGroupSetValueOptions = {}): void {
    const nextValue = normalizeRadioGroupValue(value);
    const previousValue = this.value;
    if (previousValue === nextValue) return;

    if (options.emit === false || nextValue === undefined) {
      const previousFocusableItem = this.getFocusableItem();
      this.transitionToken += 1;
      this.value = nextValue;
      if (!this.renderValueChange({ previousFocusableItem, previousValue })) {
        this.render();
      }
      return;
    }

    const details = new RadioGroupValueChangeDetailsImpl({
      previousValue,
      radioValue: nextValue,
      reason: "imperative-action",
      value: nextValue,
    });
    const proposalToken = this.transitionToken;
    const proposalErrors = this.notifySafely(details);
    if (details.isCanceled || proposalErrors.length > 0) {
      details.cancel();
      this.render();
      if (proposalErrors.length > 0) throw proposalErrors[0];
      return;
    }
    if (this.wasValueProposalSuperseded(proposalToken, nextValue)) {
      details.cancel();
      this.render();
      return;
    }

    const previousFocusableItem = this.getFocusableItem();
    this.value = nextValue;
    if (!this.renderValueChange({ previousFocusableItem, previousValue })) {
      this.render();
    }
    this.transitionToken += 1;
    const errors = this.completeAcceptance(details);
    if (errors.length > 0) throw errors[0];
  }

  subscribe(
    event: "stateSync" | "valueChange",
    callback: ((details: RadioGroupValueChangeDetails) => void) | (() => void),
  ): () => void {
    if (event === "stateSync") {
      const syncCallback = callback as () => void;
      this.syncSubscribers.add(syncCallback);
      return () => {
        this.syncSubscribers.delete(syncCallback);
      };
    }
    if (event !== "valueChange") {
      throw new Error(`Unsupported RadioGroup event: ${event}`);
    }

    const valueCallback = callback as (details: RadioGroupValueChangeDetails) => void;
    this.subscribers.add(valueCallback);
    return () => {
      this.subscribers.delete(valueCallback);
    };
  }

  private bindEvents(): void {
    const { signal } = this.abortController;

    this.root.addEventListener("keydown", this.handleKeyDown, { signal });
    this.root.addEventListener("focusin", this.handleFocusIn, { signal });
    this.root.addEventListener("focusout", this.handleFocusOut, { signal });
  }

  private refreshItems(): void {
    const radioRoots = Array.from(
      this.root.querySelectorAll<HTMLElement>(`[${RADIO_ROOT_ATTRIBUTE}]`),
    ).filter((radioRoot) => radioRoot.closest(`[${RADIO_GROUP_ROOT_ATTRIBUTE}]`) === this.root);
    const radioRootSet = new Set(radioRoots);

    this.items.forEach((item) => {
      if (radioRootSet.has(item.root)) return;

      item.radio.setSelectionOwnerWithCompletion(undefined);
      item.radio.destroy();
      this.itemByRoot.delete(item.root);
      this.itemOwnStates.delete(item.root);
    });

    if (this.value === undefined) {
      const checkedRoot = radioRoots.find(
        (radioRoot) =>
          readBooleanAttribute(radioRoot, "data-default-checked") ||
          (readRadioInput(radioRoot)?.checked ?? false),
      );
      if (checkedRoot) {
        this.value = readRadioValue(checkedRoot, radioRoots.indexOf(checkedRoot));
      }
    }

    this.items = radioRoots.map((radioRoot, index) => {
      const value = readRadioValue(radioRoot, index);
      const ownState = this.getItemOwnState(radioRoot);
      const radio = createRadio(radioRoot, {
        checked: this.value === value,
        disabled: this.disabled || ownState.ownDisabled,
        form: this.form ?? ownState.ownForm,
        name: this.name ?? ownState.ownName,
        readOnly: this.readOnly || ownState.ownReadOnly,
        required: this.required || ownState.ownRequired,
        value,
      });
      const input = readRadioInput(radioRoot);
      if (!input) {
        throw new Error("RadioGroup item is missing its owned radio input.");
      }
      radio.setSelectionOwnerWithCompletion((details): RadioSelectionOwnerCompletion => {
        if (!details.checked) {
          details.cancel();
          this.render();
          return { accepted: false, committed: false, current: false, errors: [] };
        }

        return this.handleValueChange(value, {
          event: details.event,
          reason: "radio-change",
          revisionSource: details,
          trigger: details.trigger ?? radioRoot,
        });
      });

      return {
        ...ownState,
        input,
        radio,
        root: radioRoot,
        value,
      };
    });
    this.rebuildItemIndexes();
  }

  private rebuildItemIndexes(): void {
    this.itemByRoot = new WeakMap();
    this.valueItems.clear();

    this.items.forEach((item) => {
      this.itemByRoot.set(item.root, item);
      this.valueItems.set(item.value, [...(this.valueItems.get(item.value) ?? []), item]);
    });
  }

  private getItemOwnState(radioRoot: HTMLElement): RadioGroupItemOwnState {
    const existing = this.itemOwnStates.get(radioRoot);
    if (existing) return existing;

    const ownState = readRadioOwnState(radioRoot);
    this.itemOwnStates.set(radioRoot, ownState);
    return ownState;
  }

  private applyItemOwnStateMutations(mutations: MutationRecord[]): void {
    for (const mutation of mutations) {
      if (mutation.type !== "attributes") continue;
      if (!(mutation.target instanceof HTMLElement)) continue;
      if (
        mutation.attributeName !== RADIO_DISABLED_ATTRIBUTE &&
        mutation.attributeName !== RADIO_NAME_ATTRIBUTE &&
        mutation.attributeName !== RADIO_READONLY_ATTRIBUTE &&
        mutation.attributeName !== RADIO_REQUIRED_ATTRIBUTE &&
        mutation.attributeName !== RADIO_GROUP_FORM_ATTRIBUTE &&
        mutation.attributeName !== "checked" &&
        mutation.attributeName !== "disabled" &&
        mutation.attributeName !== "form" &&
        mutation.attributeName !== "name" &&
        mutation.attributeName !== "readonly" &&
        mutation.attributeName !== "required" &&
        mutation.attributeName !== "value"
      ) {
        continue;
      }

      const radioRoot = getRadioRootForMutationTarget(mutation.target, this.root);
      if (!radioRoot || radioRoot.closest(`[${RADIO_GROUP_ROOT_ATTRIBUTE}]`) !== this.root) {
        continue;
      }

      if (mutation.attributeName === "form") {
        const currentState = this.getItemOwnState(radioRoot);
        const nextOwnForm = readRadioOwnForm(radioRoot);
        if (nextOwnForm === (this.form ?? currentState.ownForm)) continue;
      }
      this.itemOwnStates.set(radioRoot, readRadioOwnState(radioRoot));
    }
  }

  private readonly handleKeyDown = (event: KeyboardEvent): void => {
    if (!isRadioNavigationKey(event.key)) return;

    const radioRoot =
      event.target instanceof HTMLElement
        ? event.target.closest<HTMLElement>(`[${RADIO_ROOT_ATTRIBUTE}]`)
        : null;
    if (!radioRoot || radioRoot.closest(`[${RADIO_GROUP_ROOT_ATTRIBUTE}]`) !== this.root) return;

    event.preventDefault();
    if (this.disabled || this.readOnly) return;

    const item = this.getItemForNavigation(radioRoot, event.key);
    if (!item) return;

    const completion = this.handleValueChange(item.value, {
      event,
      reason: "keyboard-action",
      trigger: item.root,
    });
    if (completion.accepted && completion.current) {
      item.root.focus();
    }
    if (completion.errors.length > 0) throw completion.errors[0];
  };

  private readonly handleFocusIn = (): void => {
    setBooleanAttribute(this.root, "data-focused", !this.disabled);
  };

  private readonly handleFocusOut = (event: FocusEvent): void => {
    if (event.relatedTarget instanceof Node && this.root.contains(event.relatedTarget)) return;

    this.root.removeAttribute("data-focused");
  };

  private handleValueChange(
    radioValue: string,
    request: {
      event?: Event;
      reason: RadioGroupValueChangeReason;
      revisionSource?: RadioCheckedChangeDetails;
      trigger?: Element;
    },
  ): RadioSelectionOwnerCompletion {
    if (this.disabled || this.readOnly) {
      this.render();
      return { accepted: false, committed: false, current: false, errors: [] };
    }
    if (radioValue === this.value) {
      return { accepted: false, committed: false, current: false, errors: [] };
    }

    const previousValue = this.value;
    const previousFocusableItem = this.getFocusableItem();
    const nextValue = radioValue;
    const details = new RadioGroupValueChangeDetailsImpl({
      event: request.event,
      previousValue,
      radioValue,
      reason: request.reason,
      trigger: request.trigger,
      value: nextValue,
    });

    const proposalToken = this.transitionToken;
    const proposalErrors = this.notifySafely(details, request.revisionSource);
    if (details.isCanceled || proposalErrors.length > 0) {
      details.cancel();
      request.revisionSource?.cancel();
      this.render();
      return {
        accepted: false,
        committed: false,
        current: false,
        errors: proposalErrors,
      };
    }
    if (this.wasValueProposalSuperseded(proposalToken, nextValue)) {
      details.cancel();
      request.revisionSource?.cancel();
      this.render();
      return {
        accepted: false,
        committed: false,
        current: false,
        errors: [],
      };
    }

    if (!this.controlled) {
      this.value = nextValue;
    }
    if (
      !this.renderValueChange({
        previousFocusableItem,
        previousValue,
        requestedItem: this.getItemByValueAndRoot(nextValue, request.trigger),
      })
    ) {
      this.render();
    }

    const transitionToken = ++this.transitionToken;
    const errors = this.completeAcceptance(details);
    const committed = this.value === nextValue;
    return {
      accepted: true,
      committed,
      current: this.transitionToken === transitionToken || committed,
      errors,
    };
  }

  private completeAcceptance(details: RadioGroupValueChangeDetailsImpl): unknown[] {
    const errors = details.accept();
    for (const subscriber of [...this.syncSubscribers]) {
      try {
        subscriber();
      } catch (error) {
        errors.push(error);
      }
    }
    return errors;
  }

  private wasValueProposalSuperseded(proposalToken: number, proposedValue: string): boolean {
    return this.transitionToken !== proposalToken && this.value !== proposedValue;
  }

  private bindFormReset(): void {
    this.syncInputAssociationObservers();
    const nextForms = new Set(this.items.flatMap(({ input }) => (input.form ? [input.form] : [])));
    for (const form of this.resetForms) {
      if (!nextForms.has(form)) form.removeEventListener("reset", this.handleFormReset);
    }
    for (const form of nextForms) {
      if (!this.resetForms.has(form)) form.addEventListener("reset", this.handleFormReset);
    }
    this.resetForms = nextForms;
  }

  private unbindFormReset(): void {
    if (this.resetTimer !== undefined) {
      window.clearTimeout(this.resetTimer);
      this.resetTimer = undefined;
    }
    this.pendingResetForms.clear();
    for (const form of this.resetForms) {
      form.removeEventListener("reset", this.handleFormReset);
    }
    this.resetForms.clear();
  }

  private readonly handleFormReset = (event: Event): void => {
    if (!(event.currentTarget instanceof HTMLFormElement)) return;
    this.pendingResetForms.add(event.currentTarget);
    if (this.resetTimer !== undefined) window.clearTimeout(this.resetTimer);
    this.resetTimer = window.setTimeout(() => {
      const resetForms = new Set(this.pendingResetForms);
      this.pendingResetForms.clear();
      if (!this.controlled) {
        const currentItem =
          this.value === undefined ? undefined : this.getUniqueItemByValue(this.value);
        const initialItem =
          this.initialValue === undefined
            ? undefined
            : this.getUniqueItemByValue(this.initialValue);
        const currentIsReset = Boolean(
          currentItem?.input.form && resetForms.has(currentItem.input.form),
        );
        const initialIsReset = Boolean(
          initialItem?.input.form && resetForms.has(initialItem.input.form),
        );
        if (currentIsReset) {
          this.value = initialIsReset ? this.initialValue : undefined;
        } else if (this.value === undefined && initialIsReset) {
          this.value = this.initialValue;
        }
        this.reconcileValue();
      }
      this.render();
      for (const subscriber of [...this.syncSubscribers]) subscriber();
      this.resetTimer = undefined;
    }, 0);
  };

  private syncInputAssociationObservers(): void {
    if (typeof MutationObserver === "undefined") return;
    const currentInputs = new Set(this.items.map(({ input }) => input));
    for (const [input, observer] of this.inputAssociationObservers) {
      if (currentInputs.has(input)) continue;
      observer.disconnect();
      this.inputAssociationObservers.delete(input);
    }
    for (const input of currentInputs) {
      if (this.inputAssociationObservers.has(input)) continue;
      const observer = new MutationObserver(() => this.bindFormReset());
      observer.observe(input, { attributeFilter: ["form"], attributes: true });
      this.inputAssociationObservers.set(input, observer);
    }
  }

  private disconnectInputAssociationObservers(): void {
    for (const observer of this.inputAssociationObservers.values()) observer.disconnect();
    this.inputAssociationObservers.clear();
  }

  private render(): void {
    this.renderRootState();

    const focusableItem = this.getFocusableItem();

    const selectedItems = this.items.filter((item) => item.value === this.value);
    const unselectedItems = this.items.filter((item) => item.value !== this.value);
    [...unselectedItems, ...selectedItems].forEach((item) => {
      this.renderItem(item, focusableItem);
    });

    this.collectionObserver.flush();
  }

  private reconcileValue(): void {
    if (this.controlled || this.value === undefined) return;

    if (!this.items.some((item) => item.value === this.value)) {
      this.value = undefined;
    }
  }

  private getFocusableItem(): RadioGroupItem | undefined {
    const enabledItems = this.items.filter((item) => !this.disabled && !item.ownDisabled);
    if (enabledItems.length === 0) return undefined;

    return enabledItems.find((item) => item.value === this.value) ?? enabledItems[0];
  }

  private getItemForNavigation(currentRoot: HTMLElement, key: string): RadioGroupItem | undefined {
    if (key === "Home") {
      return this.items.find((item) => !item.ownDisabled && !item.ownReadOnly);
    }
    if (key === "End") {
      for (let index = this.items.length - 1; index >= 0; index -= 1) {
        const item = this.items[index];
        if (item && !item.ownDisabled && !item.ownReadOnly) return item;
      }
      return undefined;
    }

    const delta = getNavigationDelta(key, this.orientation, this.root);
    if (delta === null || this.items.length === 0) return undefined;

    const currentIndex = this.items.findIndex((item) => item.root === currentRoot);
    if (currentIndex < 0) return undefined;

    for (let offset = 1; offset <= this.items.length; offset += 1) {
      const item =
        this.items[(currentIndex + delta * offset + this.items.length) % this.items.length];
      if (!item?.ownDisabled && !item?.ownReadOnly) return item;
    }

    return undefined;
  }

  private notify(details: RadioGroupValueChangeDetails, source?: object): void {
    attachFormValueRevision(details, source ?? details.event);
    const event = dispatchCustomEvent(this.root, "starwind:value-change", details, {
      cancelable: true,
    });
    if (event.defaultPrevented) details.cancel();
    this.onValueChange?.(details.value, details);
    this.subscribers.forEach((subscriber) => subscriber(details));
  }

  private notifySafely(details: RadioGroupValueChangeDetails, source?: object): unknown[] {
    try {
      this.notify(details, source);
      return [];
    } catch (error) {
      return [error];
    }
  }

  private renderRootState(): void {
    this.root.setAttribute(RADIO_GROUP_ROOT_ATTRIBUTE, "");
    this.root.setAttribute("role", "radiogroup");
    this.root.setAttribute("aria-orientation", this.orientation);
    this.root.setAttribute(RADIO_GROUP_ORIENTATION_ATTRIBUTE, this.orientation);
    setBooleanAriaAttribute(this.root, "aria-disabled", this.disabled);
    setBooleanAriaAttribute(this.root, "aria-readonly", this.readOnly);
    setBooleanAriaAttribute(this.root, "aria-required", this.required);
    if (this.value === undefined) {
      this.root.removeAttribute(RADIO_GROUP_VALUE_ATTRIBUTE);
    } else {
      this.root.setAttribute(RADIO_GROUP_VALUE_ATTRIBUTE, this.value);
    }
    setBooleanAttribute(this.root, "data-disabled", this.disabled);
    setBooleanAttribute(this.root, RADIO_GROUP_DISABLED_ATTRIBUTE, this.disabled);
    setBooleanAttribute(this.root, "data-readonly", this.readOnly);
    setBooleanAttribute(this.root, RADIO_GROUP_READONLY_ATTRIBUTE, this.readOnly);
    setBooleanAttribute(this.root, "data-required", this.required);
    setBooleanAttribute(this.root, RADIO_GROUP_REQUIRED_ATTRIBUTE, this.required);
  }

  private renderItem(item: RadioGroupItem, focusableItem: RadioGroupItem | undefined): void {
    const disabled = this.disabled || item.ownDisabled;
    const readOnly = this.readOnly || item.ownReadOnly;
    const required = this.required || item.ownRequired;
    const name = this.name ?? item.ownName;

    item.radio.setFormOptions({
      form: this.form ?? item.ownForm,
      name,
      required,
      value: item.value,
    });
    item.radio.setReadOnly(readOnly);
    item.radio.setDisabled(disabled);
    item.radio.setChecked(this.value === item.value, { emit: false });
    this.renderItemTabIndex(item, focusableItem);
  }

  private renderItemSelectionState(
    item: RadioGroupItem,
    focusableItem: RadioGroupItem | undefined,
    options: { forceCheckedRender?: boolean } = {},
  ): void {
    const checked = this.value === item.value;
    if (options.forceCheckedRender || item.radio.getChecked() !== checked) {
      item.radio.setChecked(checked, { emit: false });
    }
    this.renderItemTabIndex(item, focusableItem);
  }

  private renderItemTabIndex(
    item: RadioGroupItem,
    focusableItem: RadioGroupItem | undefined,
  ): void {
    const disabled = this.disabled || item.ownDisabled;
    item.root.tabIndex = !disabled && item === focusableItem ? 0 : -1;
  }

  private renderValueChange({
    previousFocusableItem,
    previousValue,
    requestedItem,
  }: {
    previousFocusableItem: RadioGroupItem | undefined;
    previousValue: RadioGroupValue;
    requestedItem?: RadioGroupItem;
  }): boolean {
    if (!this.canRenderValueChange(previousValue, requestedItem)) return false;

    const previousItem = this.getUniqueItemByValue(previousValue);
    const selectedItem = this.getUniqueItemByValue(this.value);
    const nextFocusableItem = this.getFocusableItem();
    const affectedItems = uniqueRadioGroupItems([
      previousItem,
      selectedItem,
      requestedItem,
      previousFocusableItem,
      nextFocusableItem,
    ]);

    this.renderRootState();
    affectedItems.forEach((item) => {
      this.renderItemSelectionState(item, nextFocusableItem, {
        forceCheckedRender: item === requestedItem,
      });
    });
    this.collectionObserver.flush();

    return true;
  }

  private canRenderValueChange(
    previousValue: RadioGroupValue,
    requestedItem?: RadioGroupItem,
  ): boolean {
    if (previousValue !== undefined && !this.hasUniqueItemValue(previousValue)) return false;
    if (this.value !== undefined && !this.hasUniqueItemValue(this.value)) return false;
    if (requestedItem && !this.hasUniqueItemValue(requestedItem.value)) return false;

    return true;
  }

  private getUniqueItemByValue(value: RadioGroupValue): RadioGroupItem | undefined {
    if (value === undefined) return undefined;

    const items = this.valueItems.get(value);
    return items?.length === 1 ? items[0] : undefined;
  }

  private hasUniqueItemValue(value: string): boolean {
    return this.valueItems.get(value)?.length === 1;
  }

  private getItemByValueAndRoot(
    value: string,
    trigger: Element | undefined,
  ): RadioGroupItem | undefined {
    const triggerItem =
      trigger instanceof HTMLElement
        ? this.itemByRoot.get(trigger.closest<HTMLElement>(`[${RADIO_ROOT_ATTRIBUTE}]`) ?? trigger)
        : undefined;

    return triggerItem?.value === value ? triggerItem : this.getUniqueItemByValue(value);
  }
}

class RadioGroupValueChangeDetailsImpl implements RadioGroupValueChangeDetails {
  readonly event?: Event;
  readonly previousValue: RadioGroupValue;
  readonly radioValue: string;
  readonly reason: RadioGroupValueChangeReason;
  readonly trigger?: Element;
  readonly value: string;

  private canceled = false;
  private accepted = false;
  private readonly acceptedCallbacks = new Set<() => void>();

  constructor({
    event,
    previousValue,
    radioValue,
    reason,
    trigger,
    value,
  }: {
    event?: Event;
    previousValue: RadioGroupValue;
    radioValue: string;
    reason: RadioGroupValueChangeReason;
    trigger?: Element;
    value: string;
  }) {
    this.event = event;
    this.previousValue = previousValue;
    this.radioValue = radioValue;
    this.reason = reason;
    this.trigger = trigger;
    this.value = value;
  }

  get isCanceled(): boolean {
    return this.canceled;
  }

  cancel(): void {
    if (this.accepted) return;
    this.canceled = true;
    this.acceptedCallbacks.clear();
  }

  onAccepted(callback: () => void): void {
    if (this.canceled) return;
    if (this.accepted) {
      callback();
      return;
    }
    this.acceptedCallbacks.add(callback);
  }

  accept(): unknown[] {
    if (this.canceled || this.accepted) return [];
    this.accepted = true;
    const callbacks = [...this.acceptedCallbacks];
    this.acceptedCallbacks.clear();
    const errors: unknown[] = [];
    callbacks.forEach((callback) => {
      try {
        callback();
      } catch (error) {
        errors.push(error);
      }
    });
    return errors;
  }
}

function uniqueRadioGroupItems(items: Array<RadioGroupItem | undefined>): RadioGroupItem[] {
  return Array.from(new Set(items.filter((item): item is RadioGroupItem => Boolean(item))));
}

function normalizeRadioGroupValue(value: string | undefined): RadioGroupValue {
  return value;
}

function readOptionalAttribute(element: HTMLElement, name: string): string | undefined {
  return element.getAttribute(name) ?? undefined;
}

function readRadioGroupOrientation(value: string | null): RadioGroupOrientation {
  return value === "horizontal" ? "horizontal" : "vertical";
}

function readRadioName(root: HTMLElement): string | undefined {
  return (
    root.getAttribute(RADIO_NAME_ATTRIBUTE) ??
    readRadioInput(root)?.getAttribute("name") ??
    undefined
  );
}

function readRadioOwnState(root: HTMLElement): RadioGroupItemOwnState {
  const input = readRadioInput(root);

  return {
    ownDisabled: readBooleanAttribute(root, RADIO_DISABLED_ATTRIBUTE) || (input?.disabled ?? false),
    ownForm: readRadioOwnForm(root),
    ownName: readRadioName(root),
    ownReadOnly: readBooleanAttribute(root, RADIO_READONLY_ATTRIBUTE),
    ownRequired: readBooleanAttribute(root, RADIO_REQUIRED_ATTRIBUTE) || (input?.required ?? false),
  };
}

function readRadioOwnForm(root: HTMLElement): string | undefined {
  return (
    root.getAttribute(RADIO_GROUP_FORM_ATTRIBUTE) ??
    readRadioInput(root)?.getAttribute("form") ??
    undefined
  );
}

function readRadioValue(root: HTMLElement, index: number): string {
  return (
    root.getAttribute(RADIO_VALUE_ATTRIBUTE) ??
    readRadioInput(root)?.getAttribute("value") ??
    String(index)
  );
}

function readRadioInput(root: HTMLElement): HTMLInputElement | undefined {
  const nestedInput = Array.from(
    root.querySelectorAll<HTMLInputElement>(`[${RADIO_INPUT_ATTRIBUTE}]`),
  ).find((input) => input.closest(`[${RADIO_ROOT_ATTRIBUTE}]`) === root);
  if (nestedInput) return nestedInput;

  const sibling = root.nextElementSibling;
  if (sibling instanceof HTMLInputElement && sibling.hasAttribute(RADIO_INPUT_ATTRIBUTE)) {
    return sibling;
  }

  return undefined;
}

function getRadioRootForMutationTarget(
  target: HTMLElement,
  groupRoot: HTMLElement,
): HTMLElement | null {
  const nestedRadioRoot = target.closest<HTMLElement>(`[${RADIO_ROOT_ATTRIBUTE}]`);
  if (nestedRadioRoot) return nestedRadioRoot;

  if (
    target instanceof HTMLInputElement &&
    target.hasAttribute(RADIO_INPUT_ATTRIBUTE) &&
    target.previousElementSibling instanceof HTMLElement &&
    target.previousElementSibling.hasAttribute(RADIO_ROOT_ATTRIBUTE) &&
    target.previousElementSibling.closest(`[${RADIO_GROUP_ROOT_ATTRIBUTE}]`) === groupRoot
  ) {
    return target.previousElementSibling;
  }

  return null;
}

function isRadioNavigationKey(key: string): boolean {
  return (
    key === "ArrowDown" ||
    key === "ArrowLeft" ||
    key === "ArrowRight" ||
    key === "ArrowUp" ||
    key === "End" ||
    key === "Home"
  );
}

function getNavigationDelta(
  key: string,
  orientation: RadioGroupOrientation,
  root: HTMLElement,
): -1 | 1 | null {
  if (key === "ArrowUp") return -1;
  if (key === "ArrowDown") return 1;
  if (key !== "ArrowLeft" && key !== "ArrowRight") return null;

  const rtl = orientation === "horizontal" && getTextDirection(root) === "rtl";
  if (key === "ArrowLeft") return rtl ? 1 : -1;
  return rtl ? -1 : 1;
}

function getTextDirection(element: HTMLElement): "ltr" | "rtl" {
  const closestDir = element.closest<HTMLElement>("[dir]")?.getAttribute("dir")?.toLowerCase();
  if (closestDir === "rtl" || closestDir === "ltr") return closestDir;

  const documentDir = element.ownerDocument.documentElement.getAttribute("dir")?.toLowerCase();
  return documentDir === "rtl" ? "rtl" : "ltr";
}

function setBooleanAriaAttribute(element: HTMLElement, name: string, value: boolean): void {
  if (value) {
    element.setAttribute(name, "true");
  } else {
    element.removeAttribute(name);
  }
}
