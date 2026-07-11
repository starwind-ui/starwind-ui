import {
  assertHTMLElement,
  ensureId,
  readBooleanAttribute,
  setBooleanAttribute,
} from "../../internal/dom";

export type FieldsetState = {
  disabled: boolean;
};

export type FieldsetOptions = {
  disabled?: boolean;
};

export type FieldsetInstance = {
  readonly root: HTMLElement;
  destroy(): void;
  getState(): FieldsetState;
  refresh(): void;
  setDisabled(disabled: boolean): void;
};

type FieldsetElements = {
  fields: HTMLElement[];
  fieldsets: HTMLElement[];
  legends: HTMLElement[];
};

const FIELDSET_ROOT_ATTRIBUTE = "data-sw-fieldset";
const FIELDSET_LEGEND_ATTRIBUTE = "data-sw-fieldset-legend";
const FIELD_ROOT_ATTRIBUTE = "data-sw-field";
const DISABLED_ATTRIBUTE = "data-disabled";

const instances = new WeakMap<HTMLElement, FieldsetController>();

export function createFieldset(root: HTMLElement, options: FieldsetOptions = {}): FieldsetInstance {
  assertHTMLElement(root, "createFieldset root");

  const existing = instances.get(root);
  if (existing) return existing;

  const instance = new FieldsetController(root, options);
  instances.set(root, instance);
  return instance;
}

class FieldsetController implements FieldsetInstance {
  readonly root: HTMLElement;

  private readonly appliedFieldDisabled = new WeakSet<HTMLElement>();
  private readonly appliedFieldsetDisabled = new WeakSet<HTMLElement>();
  private readonly fieldOwnDisabled = new WeakMap<HTMLElement, boolean>();
  private readonly fieldsetOwnDisabled = new WeakMap<HTMLElement, boolean>();
  private readonly initialAriaLabelledby: string | null;
  private readonly mutationObserver: MutationObserver;
  private readonly pendingAppliedDisabledAttributes = new WeakMap<
    HTMLElement,
    Map<string, number>
  >();
  private applyingDisabled = false;
  private destroyed = false;
  private disabled: boolean;
  private elements: FieldsetElements;
  private managedAriaLabelledby: string | undefined;

  constructor(root: HTMLElement, options: FieldsetOptions) {
    this.root = root;
    this.initialAriaLabelledby = root.getAttribute("aria-labelledby");
    this.disabled = options.disabled ?? readFieldsetDisabled(root);
    this.elements = getFieldsetElements(root);
    this.mutationObserver = new MutationObserver(this.handleMutations);

    this.cacheFieldOwnDisabled();
    this.root.addEventListener(
      "starwind-fieldset:own-disabled-change",
      this.handleNestedFieldsetOwnDisabledChange,
    );
    this.mutationObserver.observe(root, {
      attributes: true,
      childList: true,
      subtree: true,
    });
    this.render();
  }

  destroy(): void {
    if (this.destroyed) return;

    this.mutationObserver.disconnect();
    this.root.removeEventListener(
      "starwind-fieldset:own-disabled-change",
      this.handleNestedFieldsetOwnDisabledChange,
    );
    this.restoreLegendAssociation();
    this.restoreAppliedFieldDisabled();
    instances.delete(this.root);
    this.destroyed = true;
  }

  getState(): FieldsetState {
    return { disabled: this.disabled };
  }

  refresh(): void {
    this.elements = getFieldsetElements(this.root);
    this.cacheFieldOwnDisabled();
    this.render();
  }

  setDisabled(disabled: boolean): void {
    const isNestedFieldset = this.root.parentElement?.closest(`[${FIELDSET_ROOT_ATTRIBUTE}]`);
    if (isNestedFieldset) {
      this.root.dispatchEvent(
        new CustomEvent("starwind-fieldset:own-disabled-change", {
          bubbles: true,
          detail: { disabled },
        }),
      );
    }

    if (this.disabled === disabled) return;

    this.disabled = disabled;
    this.render();
  }

  private cacheFieldOwnDisabled(): void {
    this.elements.fields.forEach((field) => {
      if (!this.fieldOwnDisabled.has(field)) {
        this.fieldOwnDisabled.set(field, readBooleanAttribute(field, DISABLED_ATTRIBUTE));
      }
    });

    this.elements.fieldsets.forEach((fieldset) => {
      if (!this.fieldsetOwnDisabled.has(fieldset)) {
        this.fieldsetOwnDisabled.set(fieldset, readFieldsetDisabled(fieldset));
      }
    });
  }

  private restoreAppliedFieldDisabled(): void {
    this.elements.fields.forEach((field) => {
      if (!this.appliedFieldDisabled.has(field)) return;

      setBooleanAttribute(
        field,
        DISABLED_ATTRIBUTE,
        this.fieldOwnDisabled.get(field) ?? readBooleanAttribute(field, DISABLED_ATTRIBUTE),
      );
      this.appliedFieldDisabled.delete(field);
    });

    this.elements.fieldsets.forEach((fieldset) => {
      if (!this.appliedFieldsetDisabled.has(fieldset)) return;

      const disabled = this.fieldsetOwnDisabled.get(fieldset) ?? readFieldsetDisabled(fieldset);
      setFieldsetDisabled(fieldset, disabled);
      setBooleanAttribute(fieldset, DISABLED_ATTRIBUTE, disabled);
      this.appliedFieldsetDisabled.delete(fieldset);
    });
  }

  private render(): void {
    if (!this.root.hasAttribute(FIELDSET_ROOT_ATTRIBUTE)) {
      this.root.setAttribute(FIELDSET_ROOT_ATTRIBUTE, "");
    }

    setFieldsetDisabled(this.root, this.disabled);
    setBooleanAttribute(this.root, DISABLED_ATTRIBUTE, this.disabled);

    this.elements.legends.forEach((legend) => {
      setBooleanAttribute(legend, DISABLED_ATTRIBUTE, this.disabled);
    });

    this.renderLegendAssociation();
    this.renderNestedFieldsets();
    this.renderFields();
  }

  private renderLegendAssociation(): void {
    const legendIds = this.elements.legends.map((legend) => ensureId(legend, "sw-fieldset-legend"));

    if (legendIds.length === 0) {
      this.restoreLegendAssociation();
      return;
    }

    const labelledby = Array.from(new Set(legendIds)).join(" ");
    this.root.setAttribute("aria-labelledby", labelledby);
    this.managedAriaLabelledby = labelledby;
  }

  private restoreLegendAssociation(): void {
    if (this.managedAriaLabelledby === undefined) return;
    if (this.root.getAttribute("aria-labelledby") !== this.managedAriaLabelledby) {
      this.managedAriaLabelledby = undefined;
      return;
    }

    if (this.initialAriaLabelledby === null) {
      this.root.removeAttribute("aria-labelledby");
    } else {
      this.root.setAttribute("aria-labelledby", this.initialAriaLabelledby);
    }

    this.managedAriaLabelledby = undefined;
  }

  private renderFields(): void {
    this.applyingDisabled = true;

    try {
      this.elements.fields.forEach((field) => {
        const ownDisabled =
          this.fieldOwnDisabled.get(field) ?? readBooleanAttribute(field, DISABLED_ATTRIBUTE);
        const disabled = this.disabled || ownDisabled;

        this.setAppliedBooleanAttribute(field, DISABLED_ATTRIBUTE, disabled);

        if (this.disabled && !ownDisabled) {
          this.appliedFieldDisabled.add(field);
        } else {
          this.appliedFieldDisabled.delete(field);
        }
      });
    } finally {
      this.applyingDisabled = false;
    }
  }

  private renderNestedFieldsets(): void {
    this.applyingDisabled = true;

    try {
      this.elements.fieldsets.forEach((fieldset) => {
        const ownDisabled =
          this.fieldsetOwnDisabled.get(fieldset) ?? readFieldsetDisabled(fieldset);
        const disabled = this.disabled || ownDisabled;

        this.setAppliedFieldsetDisabled(fieldset, disabled);

        if (this.disabled && !ownDisabled) {
          this.appliedFieldsetDisabled.add(fieldset);
        } else {
          this.appliedFieldsetDisabled.delete(fieldset);
        }
      });
    } finally {
      this.applyingDisabled = false;
    }
  }

  private readonly handleMutations = (mutations: MutationRecord[]): void => {
    if (this.destroyed) return;

    const rootDisabledMutated = mutations.some(
      (mutation) =>
        mutation.target === this.root &&
        (mutation.attributeName === DISABLED_ATTRIBUTE || mutation.attributeName === "disabled"),
    );

    let rootDisabledChanged = false;

    if (!this.applyingDisabled && rootDisabledMutated) {
      const disabled = readFieldsetDisabled(this.root);
      rootDisabledChanged = disabled !== this.disabled;
      this.disabled = disabled;
    }

    if (mutations.some((mutation) => mutation.type === "childList")) {
      this.refresh();
      return;
    }

    let childDisabledChanged = false;

    if (!this.applyingDisabled) {
      mutations.forEach((mutation) => {
        if (this.consumeAppliedDisabledMutation(mutation)) return;

        if (this.isOwnFieldDisabledMutation(mutation)) {
          const field = mutation.target as HTMLElement;
          this.fieldOwnDisabled.set(field, readBooleanAttribute(field, DISABLED_ATTRIBUTE));
          childDisabledChanged = true;
          return;
        }

        if (this.isOwnFieldsetDisabledMutation(mutation)) {
          const fieldset = mutation.target as HTMLElement;
          this.fieldsetOwnDisabled.set(fieldset, readFieldsetDisabled(fieldset));
          childDisabledChanged = true;
        }
      });
    }

    if (
      rootDisabledChanged ||
      mutations.some((mutation) => mutation.attributeName === FIELDSET_LEGEND_ATTRIBUTE)
    ) {
      this.refresh();
      return;
    }

    if (childDisabledChanged) {
      this.renderNestedFieldsets();
      this.renderFields();
    }
  };

  private readonly handleNestedFieldsetOwnDisabledChange = (event: Event): void => {
    if (event.target === this.root || !(event.target instanceof HTMLElement)) return;
    if (!this.elements.fieldsets.includes(event.target)) return;

    const details = (event as CustomEvent<{ disabled?: boolean }>).detail;
    this.fieldsetOwnDisabled.set(
      event.target,
      details?.disabled ?? readFieldsetDisabled(event.target),
    );

    if (this.destroyed) return;
    this.renderNestedFieldsets();
    this.renderFields();
  };

  private setAppliedBooleanAttribute(
    element: HTMLElement,
    attributeName: string,
    value: boolean,
  ): void {
    if (readBooleanAttribute(element, attributeName) !== value) {
      this.markPendingAppliedDisabledMutation(element, attributeName);
    }

    setBooleanAttribute(element, attributeName, value);
  }

  private setAppliedFieldsetDisabled(fieldset: HTMLElement, disabled: boolean): void {
    if (fieldset instanceof HTMLFieldSetElement && fieldset.disabled !== disabled) {
      this.markPendingAppliedDisabledMutation(fieldset, "disabled");
    }

    setFieldsetDisabled(fieldset, disabled);
    this.setAppliedBooleanAttribute(fieldset, DISABLED_ATTRIBUTE, disabled);
  }

  private markPendingAppliedDisabledMutation(element: HTMLElement, attributeName: string): void {
    const pending = this.pendingAppliedDisabledAttributes.get(element) ?? new Map<string, number>();
    pending.set(attributeName, (pending.get(attributeName) ?? 0) + 1);
    this.pendingAppliedDisabledAttributes.set(element, pending);
  }

  private consumeAppliedDisabledMutation(mutation: MutationRecord): boolean {
    if (mutation.type !== "attributes" || !(mutation.target instanceof HTMLElement)) return false;
    const attributeName = mutation.attributeName;
    if (attributeName !== DISABLED_ATTRIBUTE && attributeName !== "disabled") return false;

    const pending = this.pendingAppliedDisabledAttributes.get(mutation.target);
    if (!pending) return false;

    const count = pending.get(attributeName) ?? 0;
    if (count === 0) return false;

    if (count === 1) {
      pending.delete(attributeName);
    } else {
      pending.set(attributeName, count - 1);
    }
    if (pending.size === 0) {
      this.pendingAppliedDisabledAttributes.delete(mutation.target);
    }

    return true;
  }

  private isOwnFieldDisabledMutation(mutation: MutationRecord): boolean {
    return (
      mutation.type === "attributes" &&
      mutation.attributeName === DISABLED_ATTRIBUTE &&
      mutation.target instanceof HTMLElement &&
      mutation.target.hasAttribute(FIELD_ROOT_ATTRIBUTE) &&
      mutation.target.closest(`[${FIELDSET_ROOT_ATTRIBUTE}]`) === this.root
    );
  }

  private isOwnFieldsetDisabledMutation(mutation: MutationRecord): boolean {
    return (
      mutation.type === "attributes" &&
      (mutation.attributeName === DISABLED_ATTRIBUTE || mutation.attributeName === "disabled") &&
      mutation.target instanceof HTMLElement &&
      mutation.target !== this.root &&
      mutation.target.hasAttribute(FIELDSET_ROOT_ATTRIBUTE) &&
      this.elements.fieldsets.includes(mutation.target)
    );
  }
}

function getFieldsetElements(root: HTMLElement): FieldsetElements {
  return {
    fields: queryOwnElements(root, `[${FIELD_ROOT_ATTRIBUTE}]`),
    fieldsets: queryNestedFieldsets(root),
    legends: queryOwnElements(root, `[${FIELDSET_LEGEND_ATTRIBUTE}]`),
  };
}

function queryOwnElements(root: HTMLElement, selector: string): HTMLElement[] {
  return Array.from(root.querySelectorAll<HTMLElement>(selector)).filter(
    (element) => element.closest(`[${FIELDSET_ROOT_ATTRIBUTE}]`) === root,
  );
}

function queryNestedFieldsets(root: HTMLElement): HTMLElement[] {
  return Array.from(root.querySelectorAll<HTMLElement>(`[${FIELDSET_ROOT_ATTRIBUTE}]`)).filter(
    (element) => element.parentElement?.closest(`[${FIELDSET_ROOT_ATTRIBUTE}]`) === root,
  );
}

function readFieldsetDisabled(root: HTMLElement): boolean {
  if (root instanceof HTMLFieldSetElement && root.disabled) return true;

  return readBooleanAttribute(root, DISABLED_ATTRIBUTE);
}

function setFieldsetDisabled(root: HTMLElement, disabled: boolean): void {
  if (root instanceof HTMLFieldSetElement && root.disabled !== disabled) {
    root.disabled = disabled;
  }
}
