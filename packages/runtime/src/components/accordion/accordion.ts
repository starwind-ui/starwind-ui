import {
  type DynamicCollectionObserver,
  observeDynamicCollection,
} from "../../internal/collection";
import {
  assertHTMLElement,
  ensureId,
  readBooleanAttribute,
  readStringOrStringArrayAttribute,
  setBooleanAttribute,
} from "../../internal/dom";
import { dispatchCustomEvent } from "../../internal/events";
import { renderCollapsiblePanel } from "../collapsible/collapsible-panel";
import {
  type AccordionType,
  type AccordionValue,
  closeAccordionItem,
  isAccordionItemOpen,
  normalizeAccordionValue,
  openAccordionItem,
  toggleAccordionItem,
} from "./accordion-state";

export type AccordionValueChangeDetails = {
  value: AccordionValue;
  previousValue: AccordionValue;
  itemValue: string | null;
  reason: "trigger" | "programmatic";
  event?: Event;
};

export type AccordionOptions = {
  type?: AccordionType;
  defaultValue?: AccordionValue;
  value?: AccordionValue;
  collapsible?: boolean;
  onValueChange?: (details: AccordionValueChangeDetails) => void;
};

export type AccordionSetValueOptions = {
  emit?: boolean;
};

export type AccordionInstance = {
  readonly root: HTMLElement;
  openItem(value: string): void;
  closeItem(value: string): void;
  toggleItem(value: string): void;
  setValue(value: AccordionValue, options?: AccordionSetValueOptions): void;
  getValue(): AccordionValue;
  refresh(): void;
  subscribe(
    event: "valueChange",
    callback: (details: AccordionValueChangeDetails) => void,
  ): () => void;
  destroy(): void;
};

type AccordionItem = {
  element: HTMLElement;
  trigger: HTMLButtonElement;
  content: HTMLElement;
  value: string;
  disabled: boolean;
};

const ACCORDION_CONTENT_HEIGHT_PROPERTY = "--starwind-accordion-content-height";

const instances = new WeakMap<HTMLElement, AccordionController>();

export function createAccordion(
  root: HTMLElement,
  options: AccordionOptions = {},
): AccordionInstance {
  assertHTMLElement(root, "createAccordion root");

  const existing = instances.get(root);
  if (existing) return existing;

  const instance = new AccordionController(root, options);
  instances.set(root, instance);
  return instance;
}

class AccordionController implements AccordionInstance {
  readonly root: HTMLElement;

  private readonly abortController = new AbortController();
  private readonly collectionObserver: DynamicCollectionObserver;
  private readonly subscribers = new Set<(details: AccordionValueChangeDetails) => void>();
  private readonly controlled: boolean;
  private readonly type: AccordionType;
  private readonly collapsible: boolean;
  private readonly onValueChange?: (details: AccordionValueChangeDetails) => void;
  private readonly itemOpenStates = new WeakMap<HTMLElement, boolean>();
  private items: AccordionItem[] = [];
  private value: AccordionValue;
  private rendered = false;
  private destroyed = false;

  constructor(root: HTMLElement, options: AccordionOptions) {
    this.root = root;
    this.type = readAccordionType(root, options.type);
    this.collapsible = options.collapsible ?? readBooleanAttribute(root, "data-collapsible", false);
    this.controlled = Object.hasOwn(options, "value");
    this.onValueChange = options.onValueChange;

    const defaultValue =
      options.defaultValue ?? readStringOrStringArrayAttribute(root, "data-default-value");

    this.value = normalizeAccordionValue(this.type, this.controlled ? options.value : defaultValue);

    this.collectionObserver = observeDynamicCollection({
      attributeFilter: [
        "aria-disabled",
        "data-disabled",
        "data-sw-accordion-content",
        "data-sw-accordion-item",
        "data-sw-accordion-trigger",
        "data-value",
        "disabled",
      ],
      onChange: () => {
        this.refresh();
      },
      root,
    });
    this.refresh();
    this.bindEvents();
  }

  openItem(itemValue: string): void {
    this.commitValue(openAccordionItem(this.value, itemValue, this.stateOptions), {
      itemValue,
      reason: "programmatic",
    });
  }

  closeItem(itemValue: string): void {
    this.commitValue(closeAccordionItem(this.value, itemValue, this.stateOptions), {
      itemValue,
      reason: "programmatic",
    });
  }

  toggleItem(itemValue: string): void {
    this.commitValue(toggleAccordionItem(this.value, itemValue, this.stateOptions), {
      itemValue,
      reason: "programmatic",
    });
  }

  setValue(value: AccordionValue, options: AccordionSetValueOptions = {}): void {
    const nextValue = normalizeAccordionValue(this.type, value);
    const previousValue = this.value;

    this.value = nextValue;
    this.render();

    if (options.emit !== false) {
      this.notify({
        value: nextValue,
        previousValue,
        itemValue: null,
        reason: "programmatic",
      });
    }
  }

  getValue(): AccordionValue {
    if (Array.isArray(this.value)) return [...this.value];
    return this.value;
  }

  refresh(): void {
    if (this.destroyed) return;

    this.refreshItems();
    this.reconcileValue();
    this.render();
  }

  subscribe(
    event: "valueChange",
    callback: (details: AccordionValueChangeDetails) => void,
  ): () => void {
    if (event !== "valueChange") {
      throw new Error(`Unsupported Accordion event: ${event}`);
    }

    this.subscribers.add(callback);
    return () => {
      this.subscribers.delete(callback);
    };
  }

  destroy(): void {
    if (this.destroyed) return;

    this.abortController.abort();
    this.collectionObserver.disconnect();
    this.subscribers.clear();
    instances.delete(this.root);
    this.destroyed = true;
  }

  private get stateOptions() {
    return {
      type: this.type,
      collapsible: this.collapsible,
    };
  }

  private refreshItems(): void {
    this.items = Array.from(this.root.querySelectorAll<HTMLElement>("[data-sw-accordion-item]"))
      .map((element, index): AccordionItem | null => {
        const trigger = element.querySelector<HTMLButtonElement>("[data-sw-accordion-trigger]");
        const content = element.querySelector<HTMLElement>("[data-sw-accordion-content]");

        if (!trigger || !content) return null;

        const value = element.getAttribute("data-value") ?? String(index);
        const disabled = isDisabledItem(element, trigger);

        return { element, trigger, content, value, disabled };
      })
      .filter((item): item is AccordionItem => item !== null);
  }

  private bindEvents(): void {
    const { signal } = this.abortController;

    this.root.addEventListener("click", this.handleClick, { signal });
  }

  private readonly handleClick = (event: MouseEvent): void => {
    const trigger = this.getTriggerFromTarget(event.target);
    if (!trigger) return;

    const item = this.getItemForTrigger(trigger);
    if (!item || item.disabled) return;

    const nextValue = toggleAccordionItem(this.value, item.value, this.stateOptions);
    this.commitValue(nextValue, {
      itemValue: item.value,
      reason: "trigger",
      event,
    });
  };

  private commitValue(
    nextValue: AccordionValue,
    metadata: Omit<AccordionValueChangeDetails, "value" | "previousValue">,
  ): void {
    const normalizedValue = normalizeAccordionValue(this.type, nextValue);
    const previousValue = this.value;
    if (accordionValuesEqual(normalizedValue, previousValue)) return;

    if (!this.controlled) {
      this.value = normalizedValue;
      this.render();
    }

    this.notify({
      ...metadata,
      value: normalizedValue,
      previousValue,
    });
  }

  private render(): void {
    const anyOpen = this.items.some((item) => isAccordionItemOpen(this.value, item.value));
    this.root.setAttribute("data-state", anyOpen ? "open" : "closed");
    this.root.setAttribute("data-type", this.type);
    setBooleanAttribute(this.root, "data-collapsible", this.collapsible);

    this.items.forEach((item, index) => {
      const open = isAccordionItemOpen(this.value, item.value);
      const state = open ? "open" : "closed";
      const triggerId = ensureId(item.trigger, `sw-accordion-trigger-${index}`);
      const contentId = ensureId(item.content, `sw-accordion-content-${index}`);
      const previousOpen = this.itemOpenStates.get(item.element);

      if (!this.rendered || previousOpen !== open) {
        renderCollapsiblePanel(item.content, {
          heightProperty: ACCORDION_CONTENT_HEIGHT_PROPERTY,
          open,
          rendered: this.rendered,
          signal: this.abortController.signal,
        });
      }

      item.element.setAttribute("data-state", state);
      item.trigger.setAttribute("data-state", state);

      item.trigger.setAttribute("aria-expanded", String(open));
      item.trigger.setAttribute("aria-controls", contentId);
      item.content.setAttribute("aria-labelledby", triggerId);
      item.content.setAttribute("role", "region");

      setBooleanAttribute(item.element, "data-disabled", item.disabled);
      item.trigger.disabled = item.disabled;
      this.itemOpenStates.set(item.element, open);
    });

    this.rendered = true;
    this.collectionObserver.flush();
  }

  private reconcileValue(): void {
    if (this.controlled) return;

    const itemValues = new Set(this.items.map((item) => item.value));

    if (Array.isArray(this.value)) {
      this.value = this.value.filter((value) => itemValues.has(value));
      return;
    }

    if (this.value !== null && !itemValues.has(this.value)) {
      this.value = null;
    }
  }

  private getTriggerFromTarget(target: EventTarget | null): HTMLButtonElement | null {
    if (!(target instanceof Element)) return null;

    const trigger = target.closest<HTMLButtonElement>("[data-sw-accordion-trigger]");
    if (!trigger || !this.root.contains(trigger)) return null;

    return trigger;
  }

  private getItemForTrigger(trigger: HTMLButtonElement): AccordionItem | undefined {
    let item = this.items.find((candidate) => candidate.trigger === trigger);
    if (item) return item;

    this.refresh();
    item = this.items.find((candidate) => candidate.trigger === trigger);
    return item;
  }

  private notify(details: AccordionValueChangeDetails): void {
    dispatchCustomEvent(this.root, "starwind:value-change", details);
    this.onValueChange?.(details);
    this.subscribers.forEach((subscriber) => subscriber(details));
  }
}

function readAccordionType(
  root: HTMLElement,
  optionType: AccordionType | undefined,
): AccordionType {
  const value = optionType ?? root.getAttribute("data-type");
  return value === "multiple" ? "multiple" : "single";
}

function isDisabledItem(item: HTMLElement, trigger: HTMLButtonElement): boolean {
  return (
    item.hasAttribute("data-disabled") ||
    trigger.disabled ||
    trigger.getAttribute("aria-disabled") === "true"
  );
}

function accordionValuesEqual(left: AccordionValue, right: AccordionValue): boolean {
  if (Array.isArray(left) || Array.isArray(right)) {
    if (!Array.isArray(left) || !Array.isArray(right)) return false;
    return left.length === right.length && left.every((value, index) => value === right[index]);
  }

  return left === right;
}
