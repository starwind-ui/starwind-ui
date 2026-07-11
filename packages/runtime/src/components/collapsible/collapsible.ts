import {
  assertHTMLElement,
  ensureId,
  readBooleanAttribute,
  resolveAsChildControl,
  setBooleanAttribute,
} from "../../internal/dom";
import { dispatchCustomEvent } from "../../internal/events";
import {
  COLLAPSIBLE_PANEL_HIDDEN_UNTIL_FOUND_ATTRIBUTE,
  hideClosedCollapsiblePanel,
  renderCollapsiblePanel,
} from "./collapsible-panel";

export type CollapsibleOpenChangeReason = "trigger-press" | "imperative-action" | "beforematch";

export type CollapsibleOpenChangeDetails = {
  readonly event?: Event;
  readonly isCanceled: boolean;
  readonly open: boolean;
  readonly previousOpen: boolean;
  readonly reason: CollapsibleOpenChangeReason;
  readonly trigger?: Element;
  cancel(): void;
};

export type CollapsibleOptions = {
  defaultOpen?: boolean;
  disabled?: boolean;
  onOpenChange?: (open: boolean, details: CollapsibleOpenChangeDetails) => void;
  open?: boolean;
};

export type CollapsibleSetOpenOptions = {
  emit?: boolean;
};

export type CollapsibleInstance = {
  readonly root: HTMLElement;
  close(): void;
  destroy(): void;
  getOpen(): boolean;
  open(): void;
  setOpen(open: boolean, options?: CollapsibleSetOpenOptions): void;
  subscribe(
    event: "openChange",
    callback: (details: CollapsibleOpenChangeDetails) => void,
  ): () => void;
  toggle(): void;
};

type CollapsibleElements = {
  panel: HTMLElement;
  triggers: CollapsibleTrigger[];
};

type CollapsibleTrigger = {
  disabled: boolean;
  element: HTMLElement;
};

type OpenRequest = {
  event?: Event;
  reason: CollapsibleOpenChangeReason;
  trigger?: Element;
};

const COLLAPSIBLE_ROOT_ATTRIBUTE = "data-sw-collapsible";
const COLLAPSIBLE_DEFAULT_OPEN_ATTRIBUTE = "data-default-open";
const COLLAPSIBLE_DISABLED_ATTRIBUTE = "data-disabled";
const COLLAPSIBLE_TRIGGER_SELECTOR = "[data-sw-collapsible-trigger]";
const COLLAPSIBLE_PANEL_SELECTOR = "[data-sw-collapsible-panel], [data-sw-collapsible-content]";

const instances = new WeakMap<HTMLElement, CollapsibleController>();

export function createCollapsible(
  root: HTMLElement,
  options: CollapsibleOptions = {},
): CollapsibleInstance {
  assertHTMLElement(root, "createCollapsible root");

  const existing = instances.get(root);
  if (existing) return existing;

  const instance = new CollapsibleController(root, options);
  instances.set(root, instance);
  return instance;
}

class CollapsibleController implements CollapsibleInstance {
  readonly root: HTMLElement;

  private readonly abortController = new AbortController();
  private readonly controlled: boolean;
  private readonly disabled: boolean;
  private readonly elements: CollapsibleElements;
  private readonly onOpenChange?: (open: boolean, details: CollapsibleOpenChangeDetails) => void;
  private readonly subscribers = new Set<(details: CollapsibleOpenChangeDetails) => void>();
  private closeAbortController: AbortController | null = null;
  private destroyed = false;
  private openState: boolean;
  private rendered = false;

  constructor(root: HTMLElement, options: CollapsibleOptions) {
    this.root = root;
    this.elements = getCollapsibleElements(root);
    this.controlled = Object.hasOwn(options, "open");
    this.disabled =
      options.disabled ?? readBooleanAttribute(root, COLLAPSIBLE_DISABLED_ATTRIBUTE, false);
    this.onOpenChange = options.onOpenChange;
    this.openState =
      options.open ??
      options.defaultOpen ??
      readBooleanAttribute(root, COLLAPSIBLE_DEFAULT_OPEN_ATTRIBUTE, false);

    this.setupAccessibility();
    this.bindEvents();
    this.render();
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

  setOpen(open: boolean, options: CollapsibleSetOpenOptions = {}): void {
    const previousOpen = this.openState;

    if (options.emit === false) {
      this.openState = open;
      this.render();
      return;
    }

    const details = new CollapsibleOpenChangeDetailsImpl({
      open,
      previousOpen,
      reason: "imperative-action",
    });

    this.notify(details);
    if (details.isCanceled) {
      this.render();
      return;
    }

    this.openState = open;
    this.render();
  }

  getOpen(): boolean {
    return this.openState;
  }

  subscribe(
    event: "openChange",
    callback: (details: CollapsibleOpenChangeDetails) => void,
  ): () => void {
    if (event !== "openChange") {
      throw new Error(`Unsupported Collapsible event: ${event}`);
    }

    this.subscribers.add(callback);
    return () => {
      this.subscribers.delete(callback);
    };
  }

  destroy(): void {
    if (this.destroyed) return;

    this.abortController.abort();
    this.closeAbortController?.abort();
    this.subscribers.clear();
    instances.delete(this.root);
    this.destroyed = true;
  }

  private setupAccessibility(): void {
    const { panel, triggers } = this.elements;
    const firstTrigger = triggers[0]?.element;
    const panelId = ensureId(panel, "sw-collapsible-panel");

    if (firstTrigger) {
      panel.setAttribute("aria-labelledby", ensureId(firstTrigger, "sw-collapsible-trigger"));
    }

    panel.setAttribute("role", "region");

    triggers.forEach(({ element }, index) => {
      const triggerId = ensureId(element, `sw-collapsible-trigger-${index}`);
      element.setAttribute("aria-controls", panelId);
      if (!panel.getAttribute("aria-labelledby")) {
        panel.setAttribute("aria-labelledby", triggerId);
      }
    });
  }

  private bindEvents(): void {
    const { signal } = this.abortController;

    this.elements.triggers.forEach((trigger) => {
      trigger.element.addEventListener(
        "click",
        (event) => {
          if (this.isTriggerDisabled(trigger)) return;
          this.requestOpen(!this.openState, {
            event,
            reason: "trigger-press",
            trigger: trigger.element,
          });
        },
        { signal },
      );
    });

    this.elements.panel.addEventListener(
      "beforematch",
      (event) => {
        if (!this.isPanelHiddenUntilFound()) return;
        const details = this.requestOpen(true, {
          event,
          reason: "beforematch",
          trigger: this.elements.panel,
        });
        if (details?.isCanceled || (details && this.controlled)) {
          this.restorePanelHiddenUntilFoundAfterBrowserReveal();
        }
      },
      { signal },
    );
  }

  private requestOpen(open: boolean, request: OpenRequest): CollapsibleOpenChangeDetails | null {
    if (open === this.openState && !this.controlled) return null;

    const details = new CollapsibleOpenChangeDetailsImpl({
      open,
      previousOpen: this.openState,
      reason: request.reason,
      event: request.event,
      trigger: request.trigger,
    });

    this.notify(details);

    if (details.isCanceled || this.controlled) {
      this.render();
      return details;
    }

    this.openState = open;
    this.render();
    return details;
  }

  private render(): void {
    this.closeAbortController?.abort();
    this.closeAbortController = null;

    const open = this.openState;
    const state = open ? "open" : "closed";
    const closeSignal = open ? undefined : this.createCloseSignal();

    this.root.setAttribute("data-state", state);
    this.root.setAttribute(COLLAPSIBLE_ROOT_ATTRIBUTE, "");
    setBooleanAttribute(this.root, "data-disabled", this.disabled);
    setBooleanAttribute(this.root, COLLAPSIBLE_DISABLED_ATTRIBUTE, this.disabled);

    this.elements.triggers.forEach((trigger) => {
      const disabled = this.isTriggerDisabled(trigger);
      trigger.element.setAttribute("data-state", state);
      trigger.element.setAttribute("aria-expanded", String(open));
      if (trigger.element instanceof HTMLButtonElement) {
        trigger.element.disabled = disabled;
      } else if (disabled) {
        trigger.element.setAttribute("aria-disabled", "true");
      } else if (!trigger.disabled) {
        trigger.element.removeAttribute("aria-disabled");
      }
      setBooleanAttribute(trigger.element, "data-disabled", disabled);
    });

    renderCollapsiblePanel(this.elements.panel, {
      hiddenUntilFound: this.elements.panel.hasAttribute(
        COLLAPSIBLE_PANEL_HIDDEN_UNTIL_FOUND_ATTRIBUTE,
      ),
      initialAnimation: null,
      open,
      rendered: this.rendered,
      signal: closeSignal,
    });

    this.rendered = true;
  }

  private createCloseSignal(): AbortSignal {
    const closeAbortController = new AbortController();
    this.closeAbortController = closeAbortController;

    return closeAbortController.signal;
  }

  private notify(details: CollapsibleOpenChangeDetails): void {
    const event = dispatchCustomEvent(this.root, "starwind:open-change", details, {
      cancelable: true,
    });
    if (event.defaultPrevented) details.cancel();
    this.onOpenChange?.(details.open, details);
    this.subscribers.forEach((subscriber) => subscriber(details));
  }

  private isTriggerDisabled(trigger: CollapsibleTrigger): boolean {
    return this.disabled || trigger.disabled;
  }

  private isPanelHiddenUntilFound(): boolean {
    return this.elements.panel.hasAttribute(COLLAPSIBLE_PANEL_HIDDEN_UNTIL_FOUND_ATTRIBUTE);
  }

  private restorePanelHiddenUntilFoundAfterBrowserReveal(): void {
    const panel = this.elements.panel;

    globalThis.setTimeout(() => {
      if (this.destroyed || this.openState || !this.isPanelHiddenUntilFound()) return;
      hideClosedCollapsiblePanel(panel, true);
    }, 0);
  }
}

class CollapsibleOpenChangeDetailsImpl implements CollapsibleOpenChangeDetails {
  readonly event?: Event;
  readonly open: boolean;
  readonly previousOpen: boolean;
  readonly reason: CollapsibleOpenChangeReason;
  readonly trigger?: Element;

  private canceled = false;

  constructor({
    event,
    open,
    previousOpen,
    reason,
    trigger,
  }: {
    event?: Event;
    open: boolean;
    previousOpen: boolean;
    reason: CollapsibleOpenChangeReason;
    trigger?: Element;
  }) {
    this.event = event;
    this.open = open;
    this.previousOpen = previousOpen;
    this.reason = reason;
    this.trigger = trigger;
  }

  get isCanceled(): boolean {
    return this.canceled;
  }

  cancel(): void {
    this.canceled = true;
  }
}

function getCollapsibleElements(root: HTMLElement): CollapsibleElements {
  const panel = root.querySelector<HTMLElement>(COLLAPSIBLE_PANEL_SELECTOR);
  if (!panel) {
    throw new Error("Collapsible requires a panel element.");
  }

  return {
    panel,
    triggers: Array.from(root.querySelectorAll<HTMLElement>(COLLAPSIBLE_TRIGGER_SELECTOR)).map(
      (element) => {
        const trigger = resolveAsChildControlTree(element);

        return {
          disabled: isDisabledTrigger(trigger),
          element: trigger,
        };
      },
    ),
  };
}

function resolveAsChildControlTree(element: HTMLElement): HTMLElement {
  let control = element;

  for (let depth = 0; depth < 3; depth += 1) {
    const resolved = resolveAsChildControl(control);
    if (resolved === control) return control;
    control = resolved;
  }

  return control;
}

function isDisabledTrigger(trigger: HTMLElement): boolean {
  return (
    (trigger instanceof HTMLButtonElement && trigger.disabled) ||
    trigger.hasAttribute(COLLAPSIBLE_DISABLED_ATTRIBUTE) ||
    trigger.hasAttribute("data-disabled") ||
    trigger.getAttribute("aria-disabled") === "true"
  );
}
