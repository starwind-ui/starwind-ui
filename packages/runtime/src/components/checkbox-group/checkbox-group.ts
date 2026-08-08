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
import { runCancelableDetailsTransaction } from "../../internal/cancelable-details";
import { attachFormValueRevision } from "../../internal/form-value-revision";
import {
  type CheckboxCheckedChangeDetails,
  type CheckboxInstance,
  createCheckbox,
} from "../checkbox";
import { registerFieldControlBridge } from "../field/field-control-bridge";

export type CheckboxGroupValue = string[];

export type CheckboxGroupValueChangeDetails = {
  readonly checked: boolean;
  readonly checkboxValue: string;
  readonly event?: Event;
  readonly isCanceled: boolean;
  readonly previousValue: CheckboxGroupValue;
  readonly reason: "checkbox-change" | "imperative-action";
  readonly value: CheckboxGroupValue;
  cancel(): void;
};

export type CheckboxGroupOptions = {
  defaultValue?: CheckboxGroupValue;
  disabled?: boolean;
  name?: string;
  onValueChange?: (details: CheckboxGroupValueChangeDetails) => void;
  value?: CheckboxGroupValue;
};

export type CheckboxGroupSetValueOptions = {
  emit?: boolean;
};

export type CheckboxGroupInstance = {
  readonly root: HTMLElement;
  destroy(): void;
  getValue(): CheckboxGroupValue;
  refresh(): void;
  setDisabled(disabled: boolean): void;
  setName(name?: string): void;
  setValue(value: CheckboxGroupValue, options?: CheckboxGroupSetValueOptions): void;
  subscribe(
    event: "valueChange",
    callback: (details: CheckboxGroupValueChangeDetails) => void,
  ): () => void;
};

type CheckboxGroupItem = {
  checkbox: CheckboxInstance;
  input: HTMLInputElement;
  ownName?: string;
  ownDisabled: boolean;
  root: HTMLElement;
  value: string;
};

type CheckboxGroupItemOwnState = Pick<CheckboxGroupItem, "ownDisabled" | "ownName">;

const CHECKBOX_GROUP_ROOT_ATTRIBUTE = "data-sw-checkbox-group";
const CHECKBOX_GROUP_DEFAULT_VALUE_ATTRIBUTE = "data-default-value";
const CHECKBOX_GROUP_DISABLED_ATTRIBUTE = "data-disabled";
const CHECKBOX_GROUP_VALUE_ATTRIBUTE = "data-value";
const CHECKBOX_ROOT_ATTRIBUTE = "data-sw-checkbox";
const CHECKBOX_DISABLED_ATTRIBUTE = "data-disabled";
const CHECKBOX_INPUT_ATTRIBUTE = "data-sw-checkbox-input";
const CHECKBOX_NAME_ATTRIBUTE = "data-name";
const CHECKBOX_VALUE_ATTRIBUTE = "data-value";

const instances = new WeakMap<HTMLElement, CheckboxGroupController>();

registerFieldControlBridge({
  kind: "checkbox-group",
  connect(control, { disabled, name, shouldSyncName }) {
    const checkboxGroup = createCheckboxGroup(control, { disabled, name });
    checkboxGroup.setDisabled(disabled);
    if (shouldSyncName) {
      checkboxGroup.setName(name);
    }
  },
});

export function createCheckboxGroup(
  root: HTMLElement,
  options: CheckboxGroupOptions = {},
): CheckboxGroupInstance {
  assertHTMLElement(root, "createCheckboxGroup root");

  const existing = instances.get(root);
  if (existing) return existing;

  const instance = new CheckboxGroupController(root, options);
  instances.set(root, instance);
  return instance;
}

class CheckboxGroupController implements CheckboxGroupInstance {
  readonly root: HTMLElement;

  private readonly abortController = new AbortController();
  private readonly controlled: boolean;
  private readonly collectionObserver: DynamicCollectionObserver;
  private readonly itemOwnStates = new WeakMap<HTMLElement, CheckboxGroupItemOwnState>();
  private readonly inputAssociationObservers = new Map<HTMLInputElement, MutationObserver>();
  private readonly onValueChange?: (details: CheckboxGroupValueChangeDetails) => void;
  private readonly subscribers = new Set<(details: CheckboxGroupValueChangeDetails) => void>();
  private destroyed = false;
  private disabled: boolean;
  private readonly initialValue: CheckboxGroupValue;
  private items: CheckboxGroupItem[] = [];
  private name?: string;
  private resetForms = new Set<HTMLFormElement>();
  private readonly pendingResetForms = new Set<HTMLFormElement>();
  private resetTimer: number | undefined;
  private value: CheckboxGroupValue;

  constructor(root: HTMLElement, options: CheckboxGroupOptions) {
    this.root = root;
    this.controlled = Object.hasOwn(options, "value");
    this.disabled =
      options.disabled ?? readBooleanAttribute(root, CHECKBOX_GROUP_DISABLED_ATTRIBUTE);
    this.name = options.name;
    this.onValueChange = options.onValueChange;
    this.value = normalizeCheckboxGroupValue(
      this.controlled
        ? options.value
        : (options.defaultValue ??
            readStringOrStringArrayAttribute(root, CHECKBOX_GROUP_DEFAULT_VALUE_ATTRIBUTE)),
    );
    this.initialValue = [...this.value];

    this.bindEvents();
    this.collectionObserver = observeDynamicCollection({
      attributeFilter: [
        CHECKBOX_ROOT_ATTRIBUTE,
        CHECKBOX_DISABLED_ATTRIBUTE,
        CHECKBOX_NAME_ATTRIBUTE,
        CHECKBOX_VALUE_ATTRIBUTE,
        "name",
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
    this.subscribers.clear();
    instances.delete(this.root);
    this.destroyed = true;
  }

  getValue(): CheckboxGroupValue {
    return [...this.value];
  }

  refresh(): void {
    if (this.destroyed) return;

    this.refreshItems();
    this.bindFormReset();
    this.reconcileValue();
    this.render();
  }

  setDisabled(disabled: boolean): void {
    if (this.disabled === disabled) return;

    this.disabled = disabled;
    this.render();
  }

  setName(name?: string): void {
    if (this.name === name) {
      this.render();
      return;
    }

    this.name = name;
    this.render();
  }

  setValue(value: CheckboxGroupValue, options: CheckboxGroupSetValueOptions = {}): void {
    const nextValue = normalizeCheckboxGroupValue(value);
    const previousValue = this.value;

    if (options.emit === false) {
      this.value = nextValue;
      this.render();
      return;
    }

    const details = new CheckboxGroupValueChangeDetailsImpl({
      checked: false,
      checkboxValue: "",
      previousValue,
      reason: "imperative-action",
      value: nextValue,
    });

    const applied = this.runValueChange(details, undefined, () => {
      this.value = nextValue;
      this.render();
    });
    if (!applied) {
      this.render();
    }
  }

  subscribe(
    event: "valueChange",
    callback: (details: CheckboxGroupValueChangeDetails) => void,
  ): () => void {
    if (event !== "valueChange") {
      throw new Error(`Unsupported CheckboxGroup event: ${event}`);
    }

    this.subscribers.add(callback);
    return () => {
      this.subscribers.delete(callback);
    };
  }

  private bindEvents(): void {
    this.root.addEventListener("starwind:checked-change", this.handleCheckboxCheckedChange, {
      signal: this.abortController.signal,
    });
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
        const resetValues = new Set(
          this.items
            .filter(({ input }) => input.form && resetForms.has(input.form))
            .map(({ value }) => value),
        );
        this.value = [
          ...this.value.filter((value) => !resetValues.has(value)),
          ...this.initialValue.filter((value) => resetValues.has(value)),
        ];
        this.reconcileValue();
      }
      this.render();
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

  private refreshItems(): void {
    this.items = Array.from(this.root.querySelectorAll<HTMLElement>(`[${CHECKBOX_ROOT_ATTRIBUTE}]`))
      .filter(
        (checkboxRoot) => checkboxRoot.closest(`[${CHECKBOX_GROUP_ROOT_ATTRIBUTE}]`) === this.root,
      )
      .map((checkboxRoot, index) => {
        const value = readCheckboxValue(checkboxRoot, index);
        const ownState = this.getItemOwnState(checkboxRoot);
        const name = this.name ?? ownState.ownName;
        const checkbox = createCheckbox(checkboxRoot, {
          checked: this.value.includes(value),
          disabled: this.disabled || ownState.ownDisabled,
          name,
          value,
        });
        const input = getCheckboxInput(checkboxRoot);

        return {
          checkbox,
          input,
          ...ownState,
          root: checkboxRoot,
          value,
        };
      });
  }

  private getItemOwnState(checkboxRoot: HTMLElement): CheckboxGroupItemOwnState {
    const existing = this.itemOwnStates.get(checkboxRoot);
    if (existing) return existing;

    const ownState = readCheckboxOwnState(checkboxRoot);
    this.itemOwnStates.set(checkboxRoot, ownState);
    return ownState;
  }

  private applyItemOwnStateMutations(mutations: MutationRecord[]): void {
    for (const mutation of mutations) {
      if (mutation.type !== "attributes") continue;
      if (!(mutation.target instanceof HTMLElement)) continue;
      if (
        mutation.attributeName !== CHECKBOX_DISABLED_ATTRIBUTE &&
        mutation.attributeName !== CHECKBOX_NAME_ATTRIBUTE &&
        mutation.attributeName !== "name"
      ) {
        continue;
      }

      const checkboxRoot = mutation.target.closest<HTMLElement>(`[${CHECKBOX_ROOT_ATTRIBUTE}]`);
      if (
        !checkboxRoot ||
        checkboxRoot.closest(`[${CHECKBOX_GROUP_ROOT_ATTRIBUTE}]`) !== this.root
      ) {
        continue;
      }

      this.itemOwnStates.set(checkboxRoot, readCheckboxOwnState(checkboxRoot));
    }
  }

  private readonly handleCheckboxCheckedChange = (event: Event): void => {
    if (!(event instanceof CustomEvent)) return;
    if (!(event.target instanceof HTMLElement)) return;

    const checkboxRoot = event.target.closest<HTMLElement>(`[${CHECKBOX_ROOT_ATTRIBUTE}]`);
    if (!checkboxRoot) return;
    if (checkboxRoot.closest(`[${CHECKBOX_GROUP_ROOT_ATTRIBUTE}]`) !== this.root) return;

    const item = this.items.find((candidate) => candidate.root === checkboxRoot);
    const checkboxValue = item?.value ?? readCheckboxValue(checkboxRoot, this.items.length);

    const details = event.detail as CheckboxCheckedChangeDetails;
    if (event.defaultPrevented) details.cancel();
    if (details.isCanceled) return;

    this.handleCheckboxChange(checkboxValue, details.checked, details);
  };

  private handleCheckboxChange(
    checkboxValue: string,
    checked: boolean,
    checkedDetails: CheckboxCheckedChangeDetails,
  ): void {
    if (this.disabled) return;

    const previousValue = this.value;
    const nextValue = checked
      ? addValue(previousValue, checkboxValue)
      : previousValue.filter((value) => value !== checkboxValue);

    const details = new CheckboxGroupValueChangeDetailsImpl({
      checked,
      checkboxValue,
      event: checkedDetails.event,
      previousValue,
      reason: "checkbox-change",
      value: nextValue,
    });

    const applied = this.runValueChange(details, checkedDetails, () => {
      if (!this.controlled) this.value = nextValue;
      this.render();
    });

    if (!applied) {
      checkedDetails.cancel();
      this.render();
      return;
    }

    if (this.controlled) {
      checkedDetails.cancel();
      this.render();
    }
  }

  private render(): void {
    this.root.setAttribute(CHECKBOX_GROUP_ROOT_ATTRIBUTE, "");
    this.root.setAttribute("role", "group");
    this.root.setAttribute(CHECKBOX_GROUP_VALUE_ATTRIBUTE, JSON.stringify(this.value));
    setBooleanAttribute(this.root, "data-disabled", this.disabled);
    setBooleanAttribute(this.root, CHECKBOX_GROUP_DISABLED_ATTRIBUTE, this.disabled);

    this.items.forEach((item) => {
      const disabled = this.disabled || item.ownDisabled;
      const name = this.name ?? item.ownName;
      item.checkbox.setDisabled(disabled);
      item.checkbox.setFormOptions({ name, value: item.value });
      item.checkbox.setChecked(this.value.includes(item.value), { emit: false });
    });

    this.collectionObserver.flush();
  }

  private reconcileValue(): void {
    if (this.controlled) return;

    const itemValues = new Set(this.items.map((item) => item.value));
    this.value = this.value.filter((value) => itemValues.has(value));
  }

  private runValueChange(
    details: CheckboxGroupValueChangeDetails,
    source: object | undefined,
    apply: () => void,
  ): boolean {
    attachFormValueRevision(details, source ?? details.event);
    return runCancelableDetailsTransaction({
      apply,
      details,
      eventType: "starwind:value-change",
      notifyAccepted: (acceptedDetails) => {
        this.subscribers.forEach((subscriber) => subscriber(acceptedDetails));
      },
      notifyCallback: (proposalDetails) => this.onValueChange?.(proposalDetails),
      rollbackCanceled: () => {
        if (checkboxGroupValuesEqual(this.value, details.value)) {
          this.setValue(details.previousValue, { emit: false });
        }
      },
      target: this.root,
    });
  }
}

function checkboxGroupValuesEqual(left: CheckboxGroupValue, right: CheckboxGroupValue): boolean {
  return left.length === right.length && left.every((value, index) => value === right[index]);
}

class CheckboxGroupValueChangeDetailsImpl implements CheckboxGroupValueChangeDetails {
  readonly checked: boolean;
  readonly checkboxValue: string;
  readonly event?: Event;
  readonly previousValue: CheckboxGroupValue;
  readonly reason: "checkbox-change" | "imperative-action";
  readonly value: CheckboxGroupValue;

  private canceled = false;

  constructor({
    checked,
    checkboxValue,
    event,
    previousValue,
    reason,
    value,
  }: {
    checked: boolean;
    checkboxValue: string;
    event?: Event;
    previousValue: CheckboxGroupValue;
    reason: "checkbox-change" | "imperative-action";
    value: CheckboxGroupValue;
  }) {
    this.checked = checked;
    this.checkboxValue = checkboxValue;
    this.event = event;
    this.previousValue = [...previousValue];
    this.reason = reason;
    this.value = [...value];
  }

  get isCanceled(): boolean {
    return this.canceled;
  }

  cancel(): void {
    this.canceled = true;
  }
}

function normalizeCheckboxGroupValue(value: string | string[] | undefined): CheckboxGroupValue {
  if (Array.isArray(value)) return [...value];
  if (typeof value === "string" && value.length > 0) return [value];
  return [];
}

function readCheckboxValue(root: HTMLElement, index: number): string {
  return (
    root.getAttribute(CHECKBOX_VALUE_ATTRIBUTE) ??
    root.getAttribute("data-value") ??
    root.getAttribute(CHECKBOX_NAME_ATTRIBUTE) ??
    root.querySelector<HTMLInputElement>("[data-sw-checkbox-input]")?.value ??
    String(index)
  );
}

function readCheckboxName(root: HTMLElement): string | undefined {
  return (
    root.getAttribute(CHECKBOX_NAME_ATTRIBUTE) ??
    root.querySelector<HTMLInputElement>("[data-sw-checkbox-input]")?.name ??
    undefined
  );
}

function readCheckboxOwnState(root: HTMLElement): CheckboxGroupItemOwnState {
  return {
    ownDisabled: readBooleanAttribute(root, CHECKBOX_DISABLED_ATTRIBUTE),
    ownName: readCheckboxName(root),
  };
}

function getCheckboxInput(root: HTMLElement): HTMLInputElement {
  const nested = root.querySelector<HTMLInputElement>(`[${CHECKBOX_INPUT_ATTRIBUTE}]`);
  if (nested?.closest(`[${CHECKBOX_ROOT_ATTRIBUTE}]`) === root) return nested;

  const sibling = root.nextElementSibling;
  if (sibling instanceof HTMLInputElement && sibling.hasAttribute(CHECKBOX_INPUT_ATTRIBUTE)) {
    return sibling;
  }

  throw new Error("Checkbox Group item is missing its owned form input.");
}

function addValue(value: CheckboxGroupValue, itemValue: string): CheckboxGroupValue {
  return value.includes(itemValue) ? value : [...value, itemValue];
}
