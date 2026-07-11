import {
  assertHTMLElement,
  ensureId,
  readBooleanAttribute,
  resolveAsChildControl,
  setBooleanAttribute,
  uniqueElements,
} from "../../internal/dom";
import { createCancelableDetails } from "../../internal/cancelable-details";
import { dispatchCustomEvent } from "../../internal/events";
import {
  createFloatingPositioner,
  type FloatingAlign,
  type FloatingPositioner,
  type FloatingSide,
  resolveFloatingPortalTarget,
} from "../../internal/floating";
import {
  createFloatingListLifecycle,
  type FloatingListLifecycle,
} from "../../internal/floating-list-lifecycle";
import { runOverlayOpenChangeShell } from "../../internal/overlay-open-change";
import { showElement } from "../../internal/presence";
import { lockDocumentScroll } from "../../internal/scroll-lock";

export type MenuOpenChangeReason =
  | "escape-key"
  | "imperative-action"
  | "item-press"
  | "outside-press"
  | "trigger-hover"
  | "trigger-press";

export type MenuOpenChangeDetails = {
  event?: Event;
  open: boolean;
  previousOpen: boolean;
  reason: MenuOpenChangeReason;
  trigger?: Element;
  cancel(): void;
  readonly isCanceled: boolean;
};

export type MenuCloseCompleteDetails = {
  event?: Event;
  open: false;
  reason: MenuOpenChangeReason;
  trigger?: Element;
};

export type MenuValueChangeReason = "item-press";

export type MenuCheckedChangeReason = "item-press";

export type MenuCheckedChangeDetails = {
  checked: boolean;
  event?: Event;
  item: HTMLElement;
  previousChecked: boolean;
  reason: MenuCheckedChangeReason;
  cancel(): void;
  readonly isCanceled: boolean;
};

export type MenuValueChangeDetails = {
  event?: Event;
  item: HTMLElement;
  previousValue: string | null;
  reason: MenuValueChangeReason;
  value: string;
  cancel(): void;
  readonly isCanceled: boolean;
};

export type MenuOptions = {
  closeDelay?: number;
  defaultOpen?: boolean;
  disabled?: boolean;
  onCloseComplete?: (details: MenuCloseCompleteDetails) => void;
  onOpenChange?: (open: boolean, details: MenuOpenChangeDetails) => void;
  modal?: boolean;
  open?: boolean;
  openOnHover?: boolean;
  portalReference?: Element;
  reference?: Element;
  triggerEvents?: boolean;
};

export type MenuSetOpenOptions = {
  emit?: boolean;
  event?: Event;
  reason?: MenuOpenChangeReason;
  trigger?: Element;
};

export type MenuOpenOptions = {
  event?: Event;
  focusFirstItem?: boolean;
  focusLastItem?: boolean;
  reason?: MenuOpenChangeReason;
  trigger?: Element;
};

export type MenuInstance = {
  readonly root: HTMLElement;
  close(): void;
  destroy(): void;
  getOpen(): boolean;
  open(options?: MenuOpenOptions): void;
  setOpen(open: boolean, options?: MenuSetOpenOptions): void;
  subscribe(event: "openChange", callback: (details: MenuOpenChangeDetails) => void): () => void;
  subscribe(
    event: "closeComplete",
    callback: (details: MenuCloseCompleteDetails) => void,
  ): () => void;
  toggle(): void;
  updatePosition(): void;
};

type MenuElements = {
  items: HTMLElement[];
  popup: HTMLElement;
  portal: HTMLElement | null;
  positioner: HTMLElement | null;
  triggers: HTMLElement[];
};

type MenuSubmenuElements = {
  items: HTMLElement[];
  popup: HTMLElement;
  portal: HTMLElement | null;
  positioner: HTMLElement | null;
  trigger: HTMLElement;
};

type OpenRequest = {
  event?: Event;
  focusItem?: MenuFocusTarget;
  reason: MenuOpenChangeReason;
  trigger?: Element;
};

type MenuFocusTarget = "first" | "last";

const MENU_ROOT_ATTRIBUTE = "data-sw-menu";
const MENU_TRIGGER_ATTRIBUTE = "data-sw-menu-trigger";
const MENU_PORTAL_ATTRIBUTE = "data-sw-menu-portal";
const MENU_POSITIONER_ATTRIBUTE = "data-sw-menu-positioner";
const MENU_POPUP_ATTRIBUTE = "data-sw-menu-popup";
const MENU_ITEM_ATTRIBUTE = "data-sw-menu-item";
const MENU_LINK_ITEM_ATTRIBUTE = "data-sw-menu-link-item";
const MENU_CHECKBOX_ITEM_ATTRIBUTE = "data-sw-menu-checkbox-item";
const MENU_CHECKBOX_ITEM_INDICATOR_ATTRIBUTE = "data-sw-menu-checkbox-item-indicator";
const MENU_RADIO_GROUP_ATTRIBUTE = "data-sw-menu-radio-group";
const MENU_RADIO_ITEM_ATTRIBUTE = "data-sw-menu-radio-item";
const MENU_RADIO_ITEM_INDICATOR_ATTRIBUTE = "data-sw-menu-radio-item-indicator";
const MENU_SUBMENU_ROOT_ATTRIBUTE = "data-sw-menu-submenu-root";
const MENU_SUBMENU_TRIGGER_ATTRIBUTE = "data-sw-menu-submenu-trigger";
const MENU_DEFAULT_OPEN_ATTRIBUTE = "data-default-open";
const MENU_DEFAULT_CHECKED_ATTRIBUTE = "data-default-checked";
const MENU_DISABLED_ATTRIBUTE = "data-disabled";
const MENU_OPEN_ON_HOVER_ATTRIBUTE = "data-open-on-hover";
const MENU_MODAL_ATTRIBUTE = "data-modal";
const MENU_CLOSE_DELAY_ATTRIBUTE = "data-close-delay";
const MENU_CLOSE_ON_CLICK_ATTRIBUTE = "data-close-on-click";
const MENU_SIDE_ATTRIBUTE = "data-side";
const MENU_ALIGN_ATTRIBUTE = "data-align";
const MENU_SIDE_OFFSET_ATTRIBUTE = "data-side-offset";
const MENU_AVOID_COLLISIONS_ATTRIBUTE = "data-avoid-collisions";
const MENU_HIGHLIGHTED_ATTRIBUTE = "data-highlighted";
const MENU_VALUE_ATTRIBUTE = "data-value";
const MENU_ITEM_SELECTOR = `[${MENU_ITEM_ATTRIBUTE}], [${MENU_LINK_ITEM_ATTRIBUTE}], [${MENU_CHECKBOX_ITEM_ATTRIBUTE}], [${MENU_RADIO_ITEM_ATTRIBUTE}], [${MENU_SUBMENU_TRIGGER_ATTRIBUTE}]`;
const MENU_ITEM_COLLECTION_ATTRIBUTES = [
  MENU_ITEM_ATTRIBUTE,
  MENU_LINK_ITEM_ATTRIBUTE,
  MENU_CHECKBOX_ITEM_ATTRIBUTE,
  MENU_RADIO_ITEM_ATTRIBUTE,
  MENU_SUBMENU_TRIGGER_ATTRIBUTE,
  MENU_RADIO_GROUP_ATTRIBUTE,
  MENU_VALUE_ATTRIBUTE,
];

const instances = new WeakMap<HTMLElement, MenuController>();

export function createMenu(root: HTMLElement, options: MenuOptions = {}): MenuInstance {
  assertHTMLElement(root, "createMenu root");

  const existing = instances.get(root);
  if (existing) return existing;

  const instance = new MenuController(root, options);
  instances.set(root, instance);
  return instance;
}

class MenuController implements MenuInstance {
  readonly root: HTMLElement;

  private readonly abortController = new AbortController();
  private readonly controlled: boolean;
  private readonly elements: MenuElements;
  private readonly closeDelay: number;
  private readonly onCloseComplete?: (details: MenuCloseCompleteDetails) => void;
  private readonly onOpenChange?: (open: boolean, details: MenuOpenChangeDetails) => void;
  private readonly modal: boolean;
  private readonly openOnHover: boolean;
  private readonly portalReference: Element | null;
  private readonly reference: Element | null;
  private readonly submenus: MenuSubmenuController[];
  private readonly lifecycle: FloatingListLifecycle<OpenRequest>;
  private readonly openChangeSubscribers = new Set<(details: MenuOpenChangeDetails) => void>();
  private readonly closeCompleteSubscribers = new Set<
    (details: MenuCloseCompleteDetails) => void
  >();
  private readonly itemCollection: MenuItemCollection;
  private readonly triggerEvents: boolean;
  private activeIndex = -1;
  private destroyed = false;
  private disabled: boolean;
  private floatingPositioner: FloatingPositioner | null = null;
  private hoverCloseTimer: number | null = null;
  private openState: boolean;
  private pendingControlledCloseRequest: OpenRequest | null = null;
  private pendingControlledOpenRequest: OpenRequest | null = null;
  private pendingFocusItem: MenuFocusTarget | null = null;
  private pendingRestoreFocus = false;
  private restoreFocusTrigger: HTMLElement | null = null;
  private typeaheadBuffer = "";
  private typeaheadTimer: number | null = null;

  constructor(root: HTMLElement, options: MenuOptions) {
    this.root = root;
    this.elements = getMenuElements(root);
    this.itemCollection = new MenuItemCollection(this.elements.popup, () => this.activeIndex);
    this.submenus = queryOwnPopupElements(
      this.elements.popup,
      `[${MENU_SUBMENU_ROOT_ATTRIBUTE}]`,
    ).map((submenuRoot) => new MenuSubmenuController(submenuRoot, this, this));
    this.controlled = Object.hasOwn(options, "open");
    this.closeDelay =
      options.closeDelay ?? readNumberAttribute(root, MENU_CLOSE_DELAY_ATTRIBUTE, 200);
    this.disabled = options.disabled ?? readBooleanAttribute(root, MENU_DISABLED_ATTRIBUTE);
    this.onCloseComplete = options.onCloseComplete;
    this.onOpenChange = options.onOpenChange;
    this.modal = options.modal ?? readBooleanAttribute(root, MENU_MODAL_ATTRIBUTE, false);
    this.openOnHover =
      options.openOnHover ?? readBooleanAttribute(root, MENU_OPEN_ON_HOVER_ATTRIBUTE, false);
    this.portalReference = options.portalReference ?? null;
    this.reference = options.reference ?? null;
    this.triggerEvents = options.triggerEvents ?? true;
    this.openState =
      options.open ??
      options.defaultOpen ??
      readBooleanAttribute(root, MENU_DEFAULT_OPEN_ATTRIBUTE, false);
    this.lifecycle = this.createLifecycle();

    this.setupAccessibility();
    this.bindEvents();
    this.applyOpenState(this.openState);
  }

  open(options: MenuOpenOptions = {}): void {
    const focusItem = getOpenFocusTarget(options);

    this.requestOpen(true, {
      event: options.event,
      ...(focusItem ? { focusItem } : {}),
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

  setOpen(open: boolean, options: MenuSetOpenOptions = {}): void {
    const previousOpen = this.openState;
    const request = this.resolveSetOpenRequest(open, options);
    this.openState = open;
    this.applyOpenState(open, request);
    this.pendingControlledOpenRequest = null;
    this.pendingControlledCloseRequest = null;
    if (!open && this.pendingRestoreFocus) {
      this.pendingRestoreFocus = false;
      this.restoreTriggerFocus();
    } else if (open) {
      this.pendingRestoreFocus = false;
    }
    if (open) {
      this.queuePendingFocusItem();
    } else {
      this.pendingFocusItem = null;
    }

    if (options.emit !== false) {
      this.notifyOpenChange(
        createOpenChangeDetails({
          event: request.event,
          open,
          previousOpen,
          reason: request.reason,
          trigger: request.trigger,
        }),
      );
    }
  }

  getOpen(): boolean {
    return this.openState;
  }

  subscribe(event: "openChange", callback: (details: MenuOpenChangeDetails) => void): () => void;
  subscribe(
    event: "closeComplete",
    callback: (details: MenuCloseCompleteDetails) => void,
  ): () => void;
  subscribe(
    event: "openChange" | "closeComplete",
    callback:
      | ((details: MenuOpenChangeDetails) => void)
      | ((details: MenuCloseCompleteDetails) => void),
  ): () => void {
    if (event === "openChange") {
      const openChangeCallback = callback as (details: MenuOpenChangeDetails) => void;
      this.openChangeSubscribers.add(openChangeCallback);
      return () => {
        this.openChangeSubscribers.delete(openChangeCallback);
      };
    }

    if (event === "closeComplete") {
      const closeCompleteCallback = callback as (details: MenuCloseCompleteDetails) => void;
      this.closeCompleteSubscribers.add(closeCompleteCallback);
      return () => {
        this.closeCompleteSubscribers.delete(closeCompleteCallback);
      };
    }

    throw new Error(`Unsupported Menu event: ${event}`);
  }

  destroy(): void {
    if (this.destroyed) return;

    this.abortController.abort();
    this.clearHoverCloseTimer();
    this.clearTypeaheadTimer();
    this.submenus.forEach((submenu) => submenu.destroy());
    this.openChangeSubscribers.clear();
    this.closeCompleteSubscribers.clear();
    this.openState = false;
    this.renderState(false);
    this.itemCollection.destroy();
    this.lifecycle.destroy();
    this.elements.popup.hidden = true;
    instances.delete(this.root);
    this.destroyed = true;
  }

  private setupAccessibility(): void {
    const { popup, triggers } = this.elements;
    const popupId = ensureId(popup, "sw-menu-popup");
    const firstTrigger = triggers[0] ?? null;

    popup.setAttribute("role", popup.getAttribute("role") ?? "menu");
    popup.setAttribute("tabindex", popup.getAttribute("tabindex") ?? "-1");

    if (firstTrigger) {
      popup.setAttribute("aria-labelledby", ensureId(firstTrigger, "sw-menu-trigger"));
    }

    triggers.forEach((trigger) => {
      trigger.setAttribute("aria-haspopup", "menu");
      trigger.setAttribute("aria-controls", popupId);
    });

    this.updateItems();
  }

  private bindEvents(): void {
    const { signal } = this.abortController;

    this.elements.triggers.forEach((trigger) => {
      if (!this.triggerEvents) return;

      trigger.addEventListener(
        "click",
        (event) => {
          if (this.disabled || isDisabledElement(trigger)) return;
          event.preventDefault();
          this.requestOpen(!this.openState, { event, reason: "trigger-press", trigger });
        },
        { signal },
      );

      trigger.addEventListener(
        "keydown",
        (event) => {
          if (this.disabled || isDisabledElement(trigger)) return;

          if (event.key === "Enter" || event.key === " ") {
            event.preventDefault();
            const nextOpen = !this.openState;
            this.requestOpen(nextOpen, {
              event,
              ...(nextOpen ? { focusItem: "first" as const } : {}),
              reason: "trigger-press",
              trigger,
            });
            return;
          }

          if (event.key === "ArrowDown" || event.key === "ArrowUp") {
            event.preventDefault();
            this.requestOpen(true, {
              event,
              focusItem: event.key === "ArrowDown" ? "first" : "last",
              reason: "trigger-press",
              trigger,
            });
          }
        },
        { signal },
      );

      if (this.openOnHover) {
        trigger.addEventListener(
          "pointerenter",
          (event) => {
            if (event.pointerType !== "mouse" || this.disabled || isDisabledElement(trigger)) {
              return;
            }

            this.clearHoverCloseTimer();
            this.requestOpen(true, { event, reason: "trigger-hover", trigger });
          },
          { signal },
        );

        trigger.addEventListener(
          "pointerleave",
          (event) => {
            if (event.pointerType !== "mouse") return;
            this.closeAfterHoverDelay();
          },
          { signal },
        );
      }
    });

    this.elements.popup.addEventListener(
      "click",
      (event) => {
        if (!this.openState || !(event.target instanceof Element)) return;

        const item = event.target.closest<HTMLElement>(MENU_ITEM_SELECTOR);
        if (!item || !this.isOwnItem(item) || isDisabledElement(item)) return;

        if (item.hasAttribute(MENU_SUBMENU_TRIGGER_ATTRIBUTE)) {
          event.preventDefault();
          this.getSubmenuByTrigger(item)?.open({ event });
          return;
        }

        if (item.hasAttribute(MENU_CHECKBOX_ITEM_ATTRIBUTE)) {
          if (!this.toggleCheckboxItem(item, event)) return;
          if (!shouldCloseOnItemActivation(item)) return;
        }

        if (item.hasAttribute(MENU_RADIO_ITEM_ATTRIBUTE)) {
          if (!selectRadioItemState(item, event)) return;
          if (!shouldCloseOnItemActivation(item)) return;
        }

        if (!shouldCloseOnItemActivation(item)) return;

        this.requestOpen(false, { event, reason: "item-press", trigger: item });
      },
      { signal },
    );

    this.elements.popup.addEventListener(
      "pointermove",
      (event) => {
        if (!this.openState || event.pointerType !== "mouse") return;

        const item = event.target instanceof Element ? this.getItemByTarget(event.target) : null;
        if (!item || isDisabledElement(item)) return;

        this.highlightItemByElement(item, { focus: true });
      },
      { signal },
    );

    this.elements.popup.addEventListener(
      "keydown",
      (event) => {
        if (!this.openState) return;

        switch (event.key) {
          case "ArrowDown":
            event.preventDefault();
            this.focusItem(this.activeIndex < 0 ? 0 : this.activeIndex + 1);
            break;
          case "ArrowUp":
            event.preventDefault();
            this.focusItem(
              this.activeIndex < 0 ? this.elements.items.length - 1 : this.activeIndex - 1,
            );
            break;
          case "ArrowRight": {
            const target = event.target instanceof Element ? event.target : null;
            const submenu = this.getSubmenuByTriggerTarget(target);
            if (!submenu) break;
            if (isDisabledElement(submenu.trigger)) break;

            event.preventDefault();
            submenu.open({ event, focusFirstItem: true });
            break;
          }
          case "Home":
            event.preventDefault();
            this.focusItem(0);
            break;
          case "End":
            event.preventDefault();
            this.focusItem(this.elements.items.length - 1);
            break;
          case "Escape":
            event.preventDefault();
            this.requestOpen(false, { event, reason: "escape-key" });
            break;
          case "Enter":
          case " ":
            if (this.activeIndex < 0) return;
            event.preventDefault();
            this.elements.items[this.activeIndex]?.click();
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

    if (this.openOnHover) {
      this.elements.popup.addEventListener(
        "pointerenter",
        (event) => {
          if (event.pointerType !== "mouse") return;
          this.clearHoverCloseTimer();
        },
        { signal },
      );

      this.elements.popup.addEventListener(
        "pointerleave",
        (event) => {
          if (event.pointerType !== "mouse") return;
          this.closeAfterHoverDelay();
        },
        { signal },
      );
    }
  }

  private requestOpen(open: boolean, request: OpenRequest): void {
    if (open === this.openState && !this.controlled) {
      if (open && request.focusItem) {
        this.pendingFocusItem = request.focusItem;
        this.queuePendingFocusItem();
      }
      return;
    }

    const previousOpen = this.openState;
    runOverlayOpenChangeShell({
      root: this.root,
      controlled: this.controlled,
      createDetails: createOpenChangeDetails,
      open,
      previousOpen,
      request,
      onApplyControlledOpenState: () => {
        this.prepareOpenChangeApplication(open, request);

        if (open) {
          this.pendingControlledOpenRequest = request;
          this.pendingControlledCloseRequest = null;
        } else {
          this.pendingControlledOpenRequest = null;
          this.pendingControlledCloseRequest = request;
        }

        this.completeOpenChangeApplication(open, request);
      },
      onApplyUncontrolledOpenState: () => {
        this.prepareOpenChangeApplication(open, request);
        this.openState = open;
        this.applyOpenState(open, request);
        this.completeOpenChangeApplication(open, request);
      },
      onNotifyOpenChangeSubscribers: (details) => this.notifyOpenChange(details),
      onOpenChange: (nextOpen, details) => {
        this.onOpenChange?.(nextOpen, details);
      },
    });
  }

  private prepareOpenChangeApplication(open: boolean, request: OpenRequest): void {
    if (open) {
      this.restoreFocusTrigger =
        resolveMenuTrigger(request.trigger, this.elements.triggers) ??
        this.elements.triggers[0] ??
        this.restoreFocusTrigger;
    }

    if (open && request.focusItem) {
      this.pendingFocusItem = request.focusItem;
    } else if (!open) {
      this.pendingFocusItem = null;
    }
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
      this.queuePendingFocusItem();
    }
  }

  private applyOpenState(open: boolean, request?: OpenRequest): void {
    this.clearHoverCloseTimer();
    if (open) this.pendingControlledCloseRequest = null;
    this.lifecycle.applyOpenState(open, request);
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
          (this.reference ?? this.elements.triggers[0] ?? null) as HTMLElement | null,
      },
      hooks: {
        onBeforeClose: () => {
          this.closeSubmenus();
          this.clearTypeaheadTimer();
        },
        onCloseComplete: ({ request }) => {
          if (request) {
            this.notifyCloseComplete(createCloseCompleteDetails(request));
          }
        },
        onImmediateClose: ({ request }) => {
          if (request) {
            this.notifyCloseComplete(createCloseCompleteDetails(request));
          }
        },
      },
      popup: this.elements.popup,
      portal: {
        clearFloatingStyles: () => this.clearFloatingStyles(),
        containsTarget: (target) => this.containsTarget(target),
        getElement: () => this.getPortalElement(),
        getTarget: () =>
          resolveFloatingPortalTarget(
            this.portalReference ?? this.elements.triggers[0] ?? this.reference,
          ),
      },
      root: this.root,
      scrollLock: {
        lockDocumentScroll,
        shouldLock: (request) => this.modal && request?.reason !== "trigger-hover",
      },
      state: {
        getOpen: () => this.openState,
        isDestroyed: () => this.destroyed,
        render: (open) => this.renderState(open),
      },
    });
  }

  private renderState(open: boolean): void {
    const state = open ? "open" : "closed";

    this.root.setAttribute(MENU_ROOT_ATTRIBUTE, "");
    this.root.setAttribute("data-state", state);
    this.elements.popup.setAttribute("data-state", state);
    this.elements.positioner?.setAttribute("data-state", state);

    if (open) {
      showElement(this.elements.popup);
    }

    this.elements.triggers.forEach((trigger) => {
      trigger.setAttribute("data-state", state);
      trigger.setAttribute("aria-expanded", String(open));
    });

    if (!open) {
      this.clearHighlightedItems();
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
      this.submenus.some((submenu) => submenu.containsTarget(target)) ||
      Boolean(this.elements.portal?.contains(target))
    );
  }

  private clearFloatingStyles(): void {
    const elements = [this.elements.positioner, this.elements.popup].filter(
      (element): element is HTMLElement => element instanceof HTMLElement,
    );

    elements.forEach((element) => {
      element.style.removeProperty("left");
      element.style.removeProperty("position");
      element.style.removeProperty("top");
      element.style.removeProperty("transform-origin");
    });
  }

  private positionPopup(): void {
    if (!this.openState) return;

    this.lifecycle.updatePosition();
  }

  private getFloatingPositioner(): FloatingPositioner | null {
    const reference = this.reference ?? this.elements.triggers[0] ?? null;
    if (!reference) return null;
    if (this.floatingPositioner) return this.floatingPositioner;

    const placementElement = this.elements.positioner ?? this.elements.popup;
    const floating = this.elements.positioner ?? this.elements.popup;
    const placementStateElements = floating === this.elements.popup ? [] : [this.elements.popup];

    this.floatingPositioner = createFloatingPositioner({
      floating,
      getOptions: () => ({
        align: readAlignAttribute(placementElement.getAttribute(MENU_ALIGN_ATTRIBUTE)),
        avoidCollisions: readBooleanAttribute(
          placementElement,
          MENU_AVOID_COLLISIONS_ATTRIBUTE,
          true,
        ),
        preserveAnchor: true,
        side: readSideAttribute(placementElement.getAttribute(MENU_SIDE_ATTRIBUTE)),
        sideOffset: readNumberAttribute(placementElement, MENU_SIDE_OFFSET_ATTRIBUTE, 4),
      }),
      placementStateElements,
      reference,
    });

    return this.floatingPositioner;
  }

  private getFloatingPositionerForLifecycle(): FloatingPositioner {
    const positioner = this.getFloatingPositioner();
    if (!positioner) {
      throw new Error("Menu floating positioner could not be created.");
    }

    return positioner;
  }

  private updateItems(options: { force?: boolean } = {}): void {
    this.elements.items = this.itemCollection.refresh(options);
  }

  private focusItem(index: number): void {
    this.highlightItem(index, { focus: true });
  }

  private queuePendingFocusItem(): void {
    const focusItem = this.pendingFocusItem;
    if (!focusItem) return;

    this.pendingFocusItem = null;
    queueMicrotask(() => {
      if (!this.openState || this.destroyed) return;
      this.focusItem(focusItem === "first" ? 0 : this.elements.items.length - 1);
    });
  }

  private focusTypeaheadMatch(key: string): void {
    this.updateItems({ force: true });
    if (this.elements.items.length === 0) return;

    this.typeaheadBuffer += key.toLocaleLowerCase();
    this.clearTypeaheadTimer();
    this.typeaheadTimer = window.setTimeout(() => {
      this.typeaheadTimer = null;
      this.typeaheadBuffer = "";
    }, 500);

    const search = getTypeaheadSearch(this.typeaheadBuffer);
    const startIndex = Math.max(0, this.activeIndex + 1);
    const orderedItems = [
      ...this.elements.items.slice(startIndex),
      ...this.elements.items.slice(0, startIndex),
    ];
    const match = orderedItems.find((item) => getItemText(item).startsWith(search));
    if (!match) return;

    this.focusItem(this.elements.items.indexOf(match));
  }

  private isOwnItem(item: HTMLElement): boolean {
    return item.closest<HTMLElement>(`[${MENU_POPUP_ATTRIBUTE}]`) === this.elements.popup;
  }

  private getItemByTarget(target: Element): HTMLElement | null {
    const item = target.closest<HTMLElement>(MENU_ITEM_SELECTOR);

    if (!item || !this.isOwnItem(item)) return null;
    return item;
  }

  private highlightItem(index: number, options: { focus: boolean }): void {
    this.updateItems({ force: true });
    if (this.elements.items.length === 0) return;

    const normalizedIndex = (index + this.elements.items.length) % this.elements.items.length;
    this.renderHighlightedItem(normalizedIndex, options);
  }

  private highlightItemByElement(item: HTMLElement, options: { focus: boolean }): void {
    let index = shouldRefreshBeforePointerHighlight(item)
      ? -1
      : this.itemCollection.getCachedIndex(item);
    if (index < 0) {
      this.updateItems({ force: true });
      index = this.elements.items.indexOf(item);
    }
    if (index < 0) return;

    this.renderHighlightedItem(index, options);
  }

  private renderHighlightedItem(index: number, options: { focus: boolean }): void {
    const item = this.elements.items[index];
    if (!item) return;

    if (index === this.activeIndex) {
      if (options.focus && document.activeElement !== item) item.focus();
      return;
    }

    const previousItem = this.elements.items[this.activeIndex];
    if (previousItem) renderItemHighlight(previousItem, false);

    renderItemHighlight(item, true);
    if (options.focus) item.focus();
    this.activeIndex = index;
  }

  private clearHighlightedItems(): void {
    this.activeIndex = -1;
    this.elements.items.forEach((item) => renderItemHighlight(item, false));
  }

  private toggleCheckboxItem(item: HTMLElement, event?: Event): boolean {
    const previousChecked = item.getAttribute("aria-checked") === "true";
    const checked = !previousChecked;

    return requestCheckboxItemStateChange(item, checked, previousChecked, event);
  }

  private notifyOpenChange(details: MenuOpenChangeDetails): void {
    this.openChangeSubscribers.forEach((subscriber) => subscriber(details));
  }

  private notifyCloseComplete(details: MenuCloseCompleteDetails): void {
    this.onCloseComplete?.(details);
    dispatchCustomEvent(this.root, "starwind:close-complete", details);
    this.closeCompleteSubscribers.forEach((subscriber) => subscriber(details));
  }

  private resolveSetOpenRequest(open: boolean, options: MenuSetOpenOptions): OpenRequest {
    if (options.reason || options.event || options.trigger) {
      return {
        event: options.event,
        reason: options.reason ?? "imperative-action",
        trigger: options.trigger,
      };
    }

    if (open && this.pendingControlledOpenRequest) {
      return this.pendingControlledOpenRequest;
    }

    if (!open && this.pendingControlledCloseRequest) {
      return this.pendingControlledCloseRequest;
    }

    return { reason: "imperative-action" };
  }

  private closeAfterHoverDelay(): void {
    this.clearHoverCloseTimer();

    this.hoverCloseTimer = window.setTimeout(() => {
      this.hoverCloseTimer = null;
      if (!this.destroyed && this.openState) {
        this.requestOpen(false, { reason: "trigger-hover" });
      }
    }, this.closeDelay);
  }

  private clearHoverCloseTimer(): void {
    if (this.hoverCloseTimer === null) return;

    window.clearTimeout(this.hoverCloseTimer);
    this.hoverCloseTimer = null;
  }

  private clearTypeaheadTimer(): void {
    if (this.typeaheadTimer === null) return;

    window.clearTimeout(this.typeaheadTimer);
    this.typeaheadTimer = null;
    this.typeaheadBuffer = "";
  }

  closeSiblingSubmenus(activeSubmenu: MenuSubmenuController): void {
    this.submenus.forEach((submenu) => {
      if (submenu !== activeSubmenu) submenu.close();
    });
  }

  closeFromSubmenuItem(item: HTMLElement, event: Event): void {
    this.requestOpen(false, { event, reason: "item-press", trigger: item });
  }

  private closeSubmenus(): void {
    this.submenus.forEach((submenu) => submenu.close());
  }

  private restoreTriggerFocus(): void {
    const trigger = this.restoreFocusTrigger?.isConnected
      ? this.restoreFocusTrigger
      : (this.elements.triggers[0] ?? null);
    if (!trigger) return;

    trigger.focus({ preventScroll: true });
  }

  private getSubmenuByTrigger(trigger: HTMLElement): MenuSubmenuController | null {
    return this.submenus.find((submenu) => submenu.trigger === trigger) ?? null;
  }

  private getSubmenuByTriggerTarget(target: Element | null): MenuSubmenuController | null {
    if (!target) return null;

    const trigger = target.closest<HTMLElement>(`[${MENU_SUBMENU_TRIGGER_ATTRIBUTE}]`);
    if (!trigger || !this.isOwnItem(trigger)) return null;

    return this.getSubmenuByTrigger(trigger);
  }
}

class MenuSubmenuController {
  readonly root: HTMLElement;

  private readonly abortController = new AbortController();
  private readonly elements: MenuSubmenuElements;
  private readonly lifecycle: FloatingListLifecycle<undefined>;
  private readonly itemCollection: MenuItemCollection;
  private readonly owner: MenuController;
  private readonly parent: MenuController | MenuSubmenuController;
  private readonly submenus: MenuSubmenuController[];
  private activeIndex = -1;
  private closeDelay: number;
  private destroyed = false;
  private floatingPositioner: FloatingPositioner | null = null;
  private hoverCloseTimer: number | null = null;
  private openState = false;
  private typeaheadBuffer = "";
  private typeaheadTimer: number | null = null;

  constructor(
    root: HTMLElement,
    owner: MenuController,
    parent: MenuController | MenuSubmenuController,
  ) {
    this.root = root;
    this.owner = owner;
    this.parent = parent;
    this.elements = getSubmenuElements(root);
    this.itemCollection = new MenuItemCollection(this.elements.popup, () => this.activeIndex);
    this.closeDelay = readNumberAttribute(root, MENU_CLOSE_DELAY_ATTRIBUTE, 200);
    this.submenus = queryOwnPopupElements(
      this.elements.popup,
      `[${MENU_SUBMENU_ROOT_ATTRIBUTE}]`,
    ).map((submenuRoot) => new MenuSubmenuController(submenuRoot, owner, this));
    this.lifecycle = this.createLifecycle();

    this.setupAccessibility();
    this.bindEvents();
    this.applyOpenState(false);
  }

  get trigger(): HTMLElement {
    return this.elements.trigger;
  }

  open(options: { event?: Event; focusFirstItem?: boolean } = {}): void {
    if (this.destroyed) return;

    this.clearHoverCloseTimer();
    this.parent.closeSiblingSubmenus(this);
    if (!this.openState) {
      this.openState = true;
      this.applyOpenState(true);
    }

    if (options.focusFirstItem) {
      requestAnimationFrame(() => {
        if (!this.openState || this.destroyed) return;
        this.focusItem(0);
      });
    }
  }

  close(options: { focusTrigger?: boolean } = {}): void {
    if (this.destroyed) return;

    this.closeSubmenus();
    this.clearHoverCloseTimer();
    this.clearTypeaheadTimer();
    if (this.openState) {
      this.openState = false;
      this.applyOpenState(false);
    }

    if (options.focusTrigger) {
      this.elements.trigger.focus();
    }
  }

  destroy(): void {
    if (this.destroyed) return;

    this.abortController.abort();
    this.clearHoverCloseTimer();
    this.clearTypeaheadTimer();
    this.submenus.forEach((submenu) => submenu.destroy());
    this.openState = false;
    this.renderState(false);
    this.itemCollection.destroy();
    this.lifecycle.destroy();
    this.elements.popup.hidden = true;
    this.destroyed = true;
  }

  containsTarget(target: Node): boolean {
    const portalElement = this.getPortalElement();

    return (
      this.root.contains(target) ||
      portalElement.contains(target) ||
      this.submenus.some((submenu) => submenu.containsTarget(target)) ||
      Boolean(this.elements.portal?.contains(target))
    );
  }

  closeSiblingSubmenus(activeSubmenu: MenuSubmenuController): void {
    this.submenus.forEach((submenu) => {
      if (submenu !== activeSubmenu) submenu.close();
    });
  }

  private setupAccessibility(): void {
    const popupId = ensureId(this.elements.popup, "sw-menu-popup");

    this.elements.popup.setAttribute("role", this.elements.popup.getAttribute("role") ?? "menu");
    this.elements.popup.setAttribute(
      "tabindex",
      this.elements.popup.getAttribute("tabindex") ?? "-1",
    );
    this.elements.popup.setAttribute(
      "aria-labelledby",
      ensureId(this.elements.trigger, "sw-menu-submenu-trigger"),
    );
    this.elements.trigger.setAttribute(
      "role",
      this.elements.trigger.getAttribute("role") ?? "menuitem",
    );
    this.elements.trigger.setAttribute("aria-haspopup", "menu");
    this.elements.trigger.setAttribute("aria-controls", popupId);

    this.updateItems();
  }

  private bindEvents(): void {
    const { signal } = this.abortController;

    this.elements.trigger.addEventListener(
      "click",
      (event) => {
        if (isDisabledElement(this.elements.trigger)) return;
        event.preventDefault();
        this.open({ event });
      },
      { signal },
    );

    this.elements.trigger.addEventListener(
      "pointerenter",
      (event) => {
        if (event.pointerType !== "mouse" || isDisabledElement(this.elements.trigger)) return;
        this.open({ event });
      },
      { signal },
    );

    this.elements.trigger.addEventListener(
      "pointerleave",
      (event) => {
        if (event.pointerType !== "mouse") return;
        this.closeAfterHoverDelay();
      },
      { signal },
    );

    this.elements.trigger.addEventListener(
      "keydown",
      (event) => {
        if (isDisabledElement(this.elements.trigger)) return;

        if (event.key === "ArrowRight" || event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          this.open({ event, focusFirstItem: true });
        }
      },
      { signal },
    );

    this.elements.popup.addEventListener(
      "click",
      (event) => {
        if (!this.openState || !(event.target instanceof Element)) return;

        const item = event.target.closest<HTMLElement>(MENU_ITEM_SELECTOR);
        if (!item || !this.isOwnItem(item) || isDisabledElement(item)) return;

        if (item.hasAttribute(MENU_SUBMENU_TRIGGER_ATTRIBUTE)) {
          event.preventDefault();
          this.getSubmenuByTrigger(item)?.open({ event });
          return;
        }

        if (item.hasAttribute(MENU_CHECKBOX_ITEM_ATTRIBUTE)) {
          if (!toggleCheckboxItemState(item, event)) return;
          if (!shouldCloseOnItemActivation(item)) return;
        }

        if (item.hasAttribute(MENU_RADIO_ITEM_ATTRIBUTE)) {
          if (!selectRadioItemState(item, event)) return;
          if (!shouldCloseOnItemActivation(item)) return;
        }

        if (!shouldCloseOnItemActivation(item)) return;

        this.owner.closeFromSubmenuItem(item, event);
      },
      { signal },
    );

    this.elements.popup.addEventListener(
      "pointermove",
      (event) => {
        if (!this.openState || event.pointerType !== "mouse") return;

        const item = event.target instanceof Element ? this.getItemByTarget(event.target) : null;
        if (!item || isDisabledElement(item)) return;

        this.highlightItemByElement(item, { focus: true });
      },
      { signal },
    );

    this.elements.popup.addEventListener(
      "keydown",
      (event) => {
        if (!this.openState) return;

        switch (event.key) {
          case "ArrowDown":
            event.preventDefault();
            this.focusItem(this.activeIndex < 0 ? 0 : this.activeIndex + 1);
            break;
          case "ArrowUp":
            event.preventDefault();
            this.focusItem(
              this.activeIndex < 0 ? this.elements.items.length - 1 : this.activeIndex - 1,
            );
            break;
          case "ArrowLeft":
            event.preventDefault();
            this.close({ focusTrigger: true });
            break;
          case "ArrowRight": {
            const target = event.target instanceof Element ? event.target : null;
            const submenu = this.getSubmenuByTriggerTarget(target);
            if (!submenu) break;
            if (isDisabledElement(submenu.trigger)) break;

            event.preventDefault();
            submenu.open({ event, focusFirstItem: true });
            break;
          }
          case "Home":
            event.preventDefault();
            this.focusItem(0);
            break;
          case "End":
            event.preventDefault();
            this.focusItem(this.elements.items.length - 1);
            break;
          case "Enter":
          case " ":
            if (this.activeIndex < 0) return;
            event.preventDefault();
            this.elements.items[this.activeIndex]?.click();
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

    this.elements.popup.addEventListener(
      "pointerenter",
      (event) => {
        if (event.pointerType !== "mouse") return;
        this.clearHoverCloseTimer();
      },
      { signal },
    );

    this.elements.popup.addEventListener(
      "pointerleave",
      (event) => {
        if (event.pointerType !== "mouse") return;
        this.closeAfterHoverDelay();
      },
      { signal },
    );
  }

  private applyOpenState(open: boolean): void {
    this.lifecycle.applyOpenState(open, undefined);
  }

  private createLifecycle(): FloatingListLifecycle<undefined> {
    return createFloatingListLifecycle<undefined>({
      floating: {
        createPositioner: () => this.getFloatingPositionerForLifecycle(),
        getReference: () => this.elements.trigger,
      },
      popup: this.elements.popup,
      portal: {
        clearFloatingStyles: () => this.clearFloatingStyles(),
        containsTarget: (target) => this.containsTarget(target),
        getElement: () => this.getPortalElement(),
        getTarget: () => resolveFloatingPortalTarget(this.elements.trigger),
      },
      root: this.root,
      state: {
        getOpen: () => this.openState,
        isDestroyed: () => this.destroyed,
        render: (open) => this.renderState(open),
      },
    });
  }

  private renderState(open: boolean): void {
    const state = open ? "open" : "closed";

    this.root.setAttribute(MENU_SUBMENU_ROOT_ATTRIBUTE, "");
    this.root.setAttribute("data-state", state);
    this.elements.popup.setAttribute("data-state", state);
    this.elements.positioner?.setAttribute("data-state", state);
    this.elements.trigger.setAttribute("data-state", state);
    this.elements.trigger.setAttribute("aria-expanded", String(open));

    if (open) {
      showElement(this.elements.popup);
    } else {
      this.clearHighlightedItems();
    }
  }

  private getPortalElement(): HTMLElement {
    return this.elements.positioner ?? this.elements.popup;
  }

  private clearFloatingStyles(): void {
    const elements = [this.elements.positioner, this.elements.popup].filter(
      (element): element is HTMLElement => element instanceof HTMLElement,
    );

    elements.forEach((element) => {
      element.style.removeProperty("left");
      element.style.removeProperty("position");
      element.style.removeProperty("top");
      element.style.removeProperty("transform-origin");
    });
  }

  private positionPopup(): void {
    if (!this.openState) return;

    this.lifecycle.updatePosition();
  }

  private getFloatingPositioner(): FloatingPositioner | null {
    if (this.floatingPositioner) return this.floatingPositioner;

    const placementElement = this.elements.positioner ?? this.elements.popup;
    const floating = this.elements.positioner ?? this.elements.popup;
    const placementStateElements = floating === this.elements.popup ? [] : [this.elements.popup];

    this.floatingPositioner = createFloatingPositioner({
      floating,
      getOptions: () => ({
        align: readAlignAttribute(placementElement.getAttribute(MENU_ALIGN_ATTRIBUTE)),
        avoidCollisions: readBooleanAttribute(
          placementElement,
          MENU_AVOID_COLLISIONS_ATTRIBUTE,
          true,
        ),
        preserveAnchor: true,
        side: readSideAttribute(placementElement.getAttribute(MENU_SIDE_ATTRIBUTE), "right"),
        sideOffset: readNumberAttribute(placementElement, MENU_SIDE_OFFSET_ATTRIBUTE, 4),
      }),
      placementStateElements,
      reference: this.elements.trigger,
    });

    return this.floatingPositioner;
  }

  private getFloatingPositionerForLifecycle(): FloatingPositioner {
    const positioner = this.getFloatingPositioner();
    if (!positioner) {
      throw new Error("Menu submenu floating positioner could not be created.");
    }

    return positioner;
  }

  private updateItems(options: { force?: boolean } = {}): void {
    this.elements.items = this.itemCollection.refresh(options);
  }

  private focusItem(index: number): void {
    this.highlightItem(index, { focus: true });
  }

  private focusTypeaheadMatch(key: string): void {
    this.updateItems({ force: true });
    if (this.elements.items.length === 0) return;

    this.typeaheadBuffer += key.toLocaleLowerCase();
    this.clearTypeaheadTimer();
    this.typeaheadTimer = window.setTimeout(() => {
      this.typeaheadTimer = null;
      this.typeaheadBuffer = "";
    }, 500);

    const search = getTypeaheadSearch(this.typeaheadBuffer);
    const startIndex = Math.max(0, this.activeIndex + 1);
    const orderedItems = [
      ...this.elements.items.slice(startIndex),
      ...this.elements.items.slice(0, startIndex),
    ];
    const match = orderedItems.find((item) => getItemText(item).startsWith(search));
    if (!match) return;

    this.focusItem(this.elements.items.indexOf(match));
  }

  private isOwnItem(item: HTMLElement): boolean {
    return item.closest<HTMLElement>(`[${MENU_POPUP_ATTRIBUTE}]`) === this.elements.popup;
  }

  private getItemByTarget(target: Element): HTMLElement | null {
    const item = target.closest<HTMLElement>(MENU_ITEM_SELECTOR);

    if (!item || !this.isOwnItem(item)) return null;
    return item;
  }

  private highlightItem(index: number, options: { focus: boolean }): void {
    this.updateItems({ force: true });
    if (this.elements.items.length === 0) return;

    const normalizedIndex = (index + this.elements.items.length) % this.elements.items.length;
    this.renderHighlightedItem(normalizedIndex, options);
  }

  private highlightItemByElement(item: HTMLElement, options: { focus: boolean }): void {
    let index = shouldRefreshBeforePointerHighlight(item)
      ? -1
      : this.itemCollection.getCachedIndex(item);
    if (index < 0) {
      this.updateItems({ force: true });
      index = this.elements.items.indexOf(item);
    }
    if (index < 0) return;

    this.renderHighlightedItem(index, options);
  }

  private renderHighlightedItem(index: number, options: { focus: boolean }): void {
    const item = this.elements.items[index];
    if (!item) return;

    if (index === this.activeIndex) {
      if (options.focus && document.activeElement !== item) item.focus();
      return;
    }

    const previousItem = this.elements.items[this.activeIndex];
    if (previousItem) renderItemHighlight(previousItem, false);

    renderItemHighlight(item, true);
    if (options.focus) item.focus();
    this.activeIndex = index;
  }

  private clearHighlightedItems(): void {
    this.activeIndex = -1;
    this.elements.items.forEach((item) => renderItemHighlight(item, false));
  }

  private closeSubmenus(): void {
    this.submenus.forEach((submenu) => submenu.close());
  }

  private getSubmenuByTrigger(trigger: HTMLElement): MenuSubmenuController | null {
    return this.submenus.find((submenu) => submenu.trigger === trigger) ?? null;
  }

  private getSubmenuByTriggerTarget(target: Element | null): MenuSubmenuController | null {
    if (!target) return null;

    const trigger = target.closest<HTMLElement>(`[${MENU_SUBMENU_TRIGGER_ATTRIBUTE}]`);
    if (!trigger || !this.isOwnItem(trigger)) return null;

    return this.getSubmenuByTrigger(trigger);
  }

  private closeAfterHoverDelay(): void {
    this.clearHoverCloseTimer();

    this.hoverCloseTimer = window.setTimeout(() => {
      this.hoverCloseTimer = null;
      this.close();
    }, this.closeDelay);
  }

  private clearHoverCloseTimer(): void {
    if (this.hoverCloseTimer === null) return;

    window.clearTimeout(this.hoverCloseTimer);
    this.hoverCloseTimer = null;
  }

  private clearTypeaheadTimer(): void {
    if (this.typeaheadTimer === null) return;

    window.clearTimeout(this.typeaheadTimer);
    this.typeaheadTimer = null;
    this.typeaheadBuffer = "";
  }
}

class MenuItemCollection {
  private dirty = true;
  private indexByItem = new Map<HTMLElement, number>();
  private items: HTMLElement[] = [];
  private readonly observer: MutationObserver | null;

  constructor(
    private readonly popup: HTMLElement,
    private readonly getActiveIndex: () => number,
  ) {
    this.observer =
      typeof MutationObserver === "undefined"
        ? null
        : new MutationObserver(() => {
            this.dirty = true;
          });

    this.observer?.observe(popup, {
      attributeFilter: MENU_ITEM_COLLECTION_ATTRIBUTES,
      attributes: true,
      childList: true,
      subtree: true,
    });
  }

  refresh(options: { force?: boolean } = {}): HTMLElement[] {
    if (!options.force && !this.dirty) return this.items;

    updateRadioGroups(this.popup);

    this.items = queryOwnPopupElements(this.popup, MENU_ITEM_SELECTOR);
    this.indexByItem = new Map(this.items.map((item, index) => [item, index] as const));
    this.items.forEach((item, index) => {
      setupItemAccessibility(item);
      renderItemHighlight(item, index === this.getActiveIndex());
    });
    this.dirty = false;

    return this.items;
  }

  getCachedIndex(item: HTMLElement): number {
    if (this.dirty) return -1;
    return this.indexByItem.get(item) ?? -1;
  }

  destroy(): void {
    this.observer?.disconnect();
    this.indexByItem.clear();
    this.items = [];
    this.dirty = true;
  }
}

function getMenuElements(root: HTMLElement): MenuElements {
  const popup = queryMenuRootElement(root, `[${MENU_POPUP_ATTRIBUTE}]`);
  if (!popup) {
    throw new Error("Menu requires a [data-sw-menu-popup] element.");
  }

  return {
    items: [],
    popup,
    portal: queryMenuRootElement(root, `[${MENU_PORTAL_ATTRIBUTE}]`),
    positioner: queryMenuRootElement(root, `[${MENU_POSITIONER_ATTRIBUTE}]`),
    triggers: uniqueElements(
      queryMenuRootElements(root, `[${MENU_TRIGGER_ATTRIBUTE}]`).map(resolveAsChildControlTree),
    ),
  };
}

function getSubmenuElements(root: HTMLElement): MenuSubmenuElements {
  const trigger = querySubmenuElement(root, `[${MENU_SUBMENU_TRIGGER_ATTRIBUTE}]`);
  if (!trigger) {
    throw new Error("Menu submenu requires a [data-sw-menu-submenu-trigger] element.");
  }

  const popup = querySubmenuElement(root, `[${MENU_POPUP_ATTRIBUTE}]`);
  if (!popup) {
    throw new Error("Menu submenu requires a [data-sw-menu-popup] element.");
  }

  return {
    items: [],
    popup,
    portal: querySubmenuElement(root, `[${MENU_PORTAL_ATTRIBUTE}]`),
    positioner: querySubmenuElement(root, `[${MENU_POSITIONER_ATTRIBUTE}]`),
    trigger: resolveAsChildControlTree(trigger),
  };
}

function queryMenuRootElement(root: HTMLElement, selector: string): HTMLElement | null {
  return queryMenuRootElements(root, selector)[0] ?? null;
}

function queryMenuRootElements(root: HTMLElement, selector: string): HTMLElement[] {
  return Array.from(root.querySelectorAll<HTMLElement>(selector)).filter((element) => {
    const owner = element.closest<HTMLElement>(`[${MENU_ROOT_ATTRIBUTE}]`);
    const submenuOwner = element.closest<HTMLElement>(`[${MENU_SUBMENU_ROOT_ATTRIBUTE}]`);
    return owner === root && submenuOwner === null;
  });
}

function queryOwnPopupElements(popup: HTMLElement, selector: string): HTMLElement[] {
  return Array.from(popup.querySelectorAll<HTMLElement>(selector)).filter((element) => {
    const owner = element.closest<HTMLElement>(`[${MENU_POPUP_ATTRIBUTE}]`);
    return owner === popup;
  });
}

function setupItemAccessibility(item: HTMLElement): void {
  if (item.hasAttribute(MENU_CHECKBOX_ITEM_ATTRIBUTE)) {
    item.setAttribute("role", item.getAttribute("role") ?? "menuitemcheckbox");
    const checked = item.hasAttribute("aria-checked")
      ? item.getAttribute("aria-checked") === "true"
      : readBooleanAttribute(item, MENU_DEFAULT_CHECKED_ATTRIBUTE, false);
    renderCheckboxItemState(item, checked);
  } else if (item.hasAttribute(MENU_RADIO_ITEM_ATTRIBUTE)) {
    item.setAttribute("role", item.getAttribute("role") ?? "menuitemradio");
  } else {
    item.setAttribute("role", item.getAttribute("role") ?? "menuitem");
  }

  if (item.hasAttribute(MENU_SUBMENU_TRIGGER_ATTRIBUTE)) {
    item.setAttribute("aria-haspopup", "menu");
  }
}

function shouldRefreshBeforePointerHighlight(item: HTMLElement): boolean {
  return item.hasAttribute(MENU_RADIO_ITEM_ATTRIBUTE);
}

function querySubmenuElement(root: HTMLElement, selector: string): HTMLElement | null {
  return querySubmenuElements(root, selector)[0] ?? null;
}

function querySubmenuElements(root: HTMLElement, selector: string): HTMLElement[] {
  return Array.from(root.querySelectorAll<HTMLElement>(selector)).filter((element) => {
    const owner = element.closest<HTMLElement>(`[${MENU_SUBMENU_ROOT_ATTRIBUTE}]`);
    return owner === root;
  });
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

function createOpenChangeDetails(
  details: Omit<MenuOpenChangeDetails, "cancel" | "isCanceled">,
): MenuOpenChangeDetails {
  return createCancelableDetails(details);
}

function createCheckedChangeDetails(
  details: Omit<MenuCheckedChangeDetails, "cancel" | "isCanceled">,
): MenuCheckedChangeDetails {
  let canceled = false;

  return {
    ...details,
    cancel() {
      canceled = true;
    },
    get isCanceled() {
      return canceled;
    },
  };
}

function createValueChangeDetails(
  details: Omit<MenuValueChangeDetails, "cancel" | "isCanceled">,
): MenuValueChangeDetails {
  let canceled = false;

  return {
    ...details,
    cancel() {
      canceled = true;
    },
    get isCanceled() {
      return canceled;
    },
  };
}

function createCloseCompleteDetails(request: OpenRequest): MenuCloseCompleteDetails {
  return {
    event: request.event,
    open: false,
    reason: request.reason,
    trigger: request.trigger,
  };
}

function shouldRestoreFocusOnClose(reason: MenuOpenChangeReason): boolean {
  return reason === "escape-key" || reason === "item-press";
}

function resolveMenuTrigger(
  trigger: Element | undefined,
  triggers: HTMLElement[],
): HTMLElement | null {
  if (!(trigger instanceof HTMLElement)) return null;
  return triggers.includes(trigger) ? trigger : null;
}

function isDisabledElement(element: HTMLElement): boolean {
  return (
    element.hasAttribute("disabled") ||
    element.hasAttribute(MENU_DISABLED_ATTRIBUTE) ||
    element.getAttribute("aria-disabled") === "true"
  );
}

function shouldCloseOnItemActivation(item: HTMLElement): boolean {
  if (item.hasAttribute(MENU_LINK_ITEM_ATTRIBUTE)) {
    return readBooleanAttribute(item, MENU_CLOSE_ON_CLICK_ATTRIBUTE, false);
  }

  if (
    item.hasAttribute(MENU_CHECKBOX_ITEM_ATTRIBUTE) ||
    item.hasAttribute(MENU_RADIO_ITEM_ATTRIBUTE)
  ) {
    return readBooleanAttribute(item, MENU_CLOSE_ON_CLICK_ATTRIBUTE, false);
  }

  return readBooleanAttribute(item, MENU_CLOSE_ON_CLICK_ATTRIBUTE, true);
}

function readAlignAttribute(value: string | null): FloatingAlign {
  if (value === "center" || value === "end" || value === "start") return value;
  return "start";
}

function readSideAttribute(value: string | null, fallback: FloatingSide = "bottom"): FloatingSide {
  if (value === "bottom" || value === "left" || value === "right" || value === "top") {
    return value;
  }
  return fallback;
}

function readNumberAttribute(element: HTMLElement, name: string, fallback: number): number {
  const value = Number.parseFloat(element.getAttribute(name) ?? "");
  return Number.isFinite(value) ? value : fallback;
}

function isTypeaheadKey(event: KeyboardEvent): boolean {
  return event.key.length === 1 && !event.altKey && !event.ctrlKey && !event.metaKey;
}

function getTypeaheadSearch(buffer: string): string {
  const characters = [...buffer];
  return characters.every((character) => character === characters[0]) ? characters[0] : buffer;
}

function getItemText(item: HTMLElement): string {
  return (item.textContent ?? "").trim().toLocaleLowerCase();
}

function renderItemHighlight(item: HTMLElement, highlighted: boolean): void {
  item.setAttribute("tabindex", highlighted ? "0" : "-1");
  setBooleanAttribute(item, MENU_HIGHLIGHTED_ATTRIBUTE, highlighted);
}

function renderCheckboxItemState(item: HTMLElement, checked: boolean): void {
  item.setAttribute("aria-checked", String(checked));
  setBooleanAttribute(item, "data-checked", checked);
  setBooleanAttribute(item, "data-unchecked", !checked);
  renderItemIndicators(item, `[${MENU_CHECKBOX_ITEM_INDICATOR_ATTRIBUTE}]`, checked);
}

function toggleCheckboxItemState(item: HTMLElement, event?: Event): boolean {
  const previousChecked = item.getAttribute("aria-checked") === "true";
  const checked = !previousChecked;

  return requestCheckboxItemStateChange(item, checked, previousChecked, event);
}

function requestCheckboxItemStateChange(
  item: HTMLElement,
  checked: boolean,
  previousChecked: boolean,
  event?: Event,
): boolean {
  const details = createCheckedChangeDetails({
    checked,
    event,
    item,
    previousChecked,
    reason: "item-press",
  });
  const checkedChangeEvent = dispatchCustomEvent(item, "starwind:checked-change", details, {
    cancelable: true,
  });
  if (checkedChangeEvent.defaultPrevented) {
    details.cancel();
  }

  if (details.isCanceled) return false;

  renderCheckboxItemState(item, checked);
  return true;
}

function updateRadioGroups(popup: HTMLElement): void {
  queryOwnPopupElements(popup, `[${MENU_RADIO_GROUP_ATTRIBUTE}]`).forEach((group) => {
    group.setAttribute("role", group.getAttribute("role") ?? "group");

    const items = getRadioGroupItems(group);
    let value = group.getAttribute(MENU_VALUE_ATTRIBUTE);

    if (value === null) {
      const checkedItem = items.find((item) => isInitialRadioItemChecked(item));
      value = checkedItem ? readRadioItemValue(checkedItem, items.indexOf(checkedItem)) : null;
    }

    renderRadioGroupState(group, value);
  });
}

function renderRadioGroupState(group: HTMLElement, value: string | null): void {
  const items = getRadioGroupItems(group);

  if (value === null) {
    group.removeAttribute(MENU_VALUE_ATTRIBUTE);
  } else {
    group.setAttribute(MENU_VALUE_ATTRIBUTE, value);
  }

  items.forEach((item, index) => {
    const checked = value !== null && readRadioItemValue(item, index) === value;

    item.setAttribute("role", item.getAttribute("role") ?? "menuitemradio");
    item.setAttribute("aria-checked", String(checked));
    setBooleanAttribute(item, "data-checked", checked);
    setBooleanAttribute(item, "data-unchecked", !checked);
    renderItemIndicators(item, `[${MENU_RADIO_ITEM_INDICATOR_ATTRIBUTE}]`, checked);
  });
}

function selectRadioItemState(item: HTMLElement, event?: Event): boolean {
  const group = item.closest<HTMLElement>(`[${MENU_RADIO_GROUP_ATTRIBUTE}]`);
  if (!group) return true;

  const items = getRadioGroupItems(group);
  const index = items.indexOf(item);
  if (index < 0) return true;

  const previousValue = group.getAttribute(MENU_VALUE_ATTRIBUTE);
  const value = readRadioItemValue(item, index);
  if (value === previousValue) return true;

  const details = createValueChangeDetails({
    event,
    item,
    previousValue,
    reason: "item-press",
    value,
  });
  const valueChangeEvent = dispatchCustomEvent<MenuValueChangeDetails>(
    group,
    "starwind:value-change",
    details,
    { cancelable: true },
  );
  if (valueChangeEvent.defaultPrevented) {
    details.cancel();
  }

  if (details.isCanceled) return false;

  renderRadioGroupState(group, value);
  return true;
}

function getRadioGroupItems(group: HTMLElement): HTMLElement[] {
  return Array.from(group.querySelectorAll<HTMLElement>(`[${MENU_RADIO_ITEM_ATTRIBUTE}]`)).filter(
    (item) => item.closest(`[${MENU_RADIO_GROUP_ATTRIBUTE}]`) === group,
  );
}

function isInitialRadioItemChecked(item: HTMLElement): boolean {
  return (
    item.getAttribute("aria-checked") === "true" ||
    item.hasAttribute("data-checked") ||
    readBooleanAttribute(item, MENU_DEFAULT_CHECKED_ATTRIBUTE, false)
  );
}

function readRadioItemValue(item: HTMLElement, index: number): string {
  const value = item.getAttribute(MENU_VALUE_ATTRIBUTE);
  if (value !== null && value !== "") return value;

  return item.id || String(index);
}

function renderItemIndicators(item: HTMLElement, selector: string, visible: boolean): void {
  item.querySelectorAll<HTMLElement>(selector).forEach((indicator) => {
    indicator.setAttribute("aria-hidden", "true");
    indicator.setAttribute("data-state", visible ? "checked" : "unchecked");
    setBooleanAttribute(indicator, "data-visible", visible);
    setBooleanAttribute(indicator, "data-hidden", !visible);
  });
}

function getOpenFocusTarget(options: MenuOpenOptions): MenuFocusTarget | undefined {
  if (options.focusLastItem) return "last";
  if (options.focusFirstItem) return "first";
  return undefined;
}
