import {
  assertHTMLElement,
  ensureId,
  readBooleanAttribute,
  readNumberAttribute,
  resolveAsChildControl,
  setBooleanAttribute,
} from "../../internal/dom";
import { dispatchCustomEvent } from "../../internal/events";
import {
  createFloatingPositioner,
  type FloatingAlign,
  type FloatingPositioner,
  type FloatingSide,
  readFloatingAlignAttribute,
  readFloatingSideAttribute,
  resolveFloatingPortalTarget,
} from "../../internal/floating";
import {
  type OverlayDismissalHandle,
  registerOverlayDismissal,
} from "../../internal/overlay-dismissal";
import { hideElementAfterAnimations, showElement } from "../../internal/presence";

export type NavigationMenuValue = string | null;

export type NavigationMenuValueChangeReason =
  | "escape-key"
  | "focus-out"
  | "imperative-action"
  | "link-press"
  | "outside-press"
  | "trigger-hover"
  | "trigger-press";

export type NavigationMenuValueChangeDetails = {
  event?: Event;
  previousValue: NavigationMenuValue;
  reason: NavigationMenuValueChangeReason;
  trigger?: Element;
  value: NavigationMenuValue;
  cancel(): void;
  readonly isCanceled: boolean;
};

export type NavigationMenuOptions = {
  closeOnEscape?: boolean;
  closeOnOutsideInteract?: boolean;
  defaultValue?: NavigationMenuValue;
  closeDelay?: number;
  onValueChange?: (value: NavigationMenuValue, details: NavigationMenuValueChangeDetails) => void;
  openDelay?: number;
  value?: NavigationMenuValue;
};

export type NavigationMenuSetValueOptions = {
  emit?: boolean;
  event?: Event;
  reason?: NavigationMenuValueChangeReason;
  trigger?: Element;
};

export type NavigationMenuInstance = {
  readonly root: HTMLElement;
  close(): void;
  destroy(): void;
  getValue(): NavigationMenuValue;
  setValue(value: NavigationMenuValue, options?: NavigationMenuSetValueOptions): void;
  subscribe(
    event: "valueChange",
    callback: (details: NavigationMenuValueChangeDetails) => void,
  ): () => void;
};

type NavigationMenuElements = {
  arrow: HTMLElement | null;
  items: NavigationMenuItem[];
  lists: HTMLElement[];
  popup: HTMLElement;
  portal: HTMLElement | null;
  positioner: HTMLElement | null;
  viewport: HTMLElement;
};

type NavigationMenuItem = {
  content: HTMLElement | null;
  contentPlaceholder: Comment | null;
  element: HTMLElement;
  icon: HTMLElement | null;
  links: HTMLElement[];
  trigger: HTMLElement | null;
  value: string;
};

type ValueRequest = {
  event?: Event;
  reason: NavigationMenuValueChangeReason;
  trigger?: Element;
};

type NavigationMenuOrientation = "horizontal" | "vertical";
type PendingKeyboardOpenFocus = {
  event: Event;
  value: string;
};
type NavigationMenuActivationDirection = "initial" | "next" | "previous" | "current";
type NavigationMenuPopupBoundary = {
  bottom: number;
  left: number;
  right: number;
  top: number;
};
type NavigationMenuFocusTarget = {
  control: HTMLElement;
  item: NavigationMenuItem;
  type: "link" | "trigger";
};

const NAV_MENU_ROOT_ATTRIBUTE = "data-sw-nav-menu";
const NAV_MENU_LIST_ATTRIBUTE = "data-sw-nav-menu-list";
const NAV_MENU_ITEM_ATTRIBUTE = "data-sw-nav-menu-item";
const NAV_MENU_TRIGGER_ATTRIBUTE = "data-sw-nav-menu-trigger";
const NAV_MENU_ICON_ATTRIBUTE = "data-sw-nav-menu-icon";
const NAV_MENU_CONTENT_ATTRIBUTE = "data-sw-nav-menu-content";
const NAV_MENU_LINK_ATTRIBUTE = "data-sw-nav-menu-link";
const NAV_MENU_LINK_CLOSE_ON_CLICK_ATTRIBUTE = "data-close-on-click";
const NAV_MENU_PORTAL_ATTRIBUTE = "data-sw-nav-menu-portal";
const NAV_MENU_POSITIONER_ATTRIBUTE = "data-sw-nav-menu-positioner";
const NAV_MENU_POPUP_ATTRIBUTE = "data-sw-nav-menu-popup";
const NAV_MENU_VIEWPORT_ATTRIBUTE = "data-sw-nav-menu-viewport";
const NAV_MENU_ARROW_ATTRIBUTE = "data-sw-nav-menu-arrow";
const NAV_MENU_VALUE_ATTRIBUTE = "data-value";
const NAV_MENU_CONTROLLED_VALUE_ATTRIBUTE = "data-controlled-value";
const NAV_MENU_DEFAULT_VALUE_ATTRIBUTE = "data-default-value";
const NAV_MENU_OPEN_DELAY_ATTRIBUTE = "data-open-delay";
const NAV_MENU_CLOSE_DELAY_ATTRIBUTE = "data-close-delay";
const NAV_MENU_CLOSE_ON_ESCAPE_ATTRIBUTE = "data-close-on-escape";
const NAV_MENU_CLOSE_ON_OUTSIDE_INTERACT_ATTRIBUTE = "data-close-on-outside-interact";
const NAV_MENU_DISABLED_ATTRIBUTE = "data-disabled";
const NAV_MENU_SIDE_ATTRIBUTE = "data-side";
const NAV_MENU_ALIGN_ATTRIBUTE = "data-align";
const NAV_MENU_SIDE_OFFSET_ATTRIBUTE = "data-side-offset";
const NAV_MENU_ALIGN_OFFSET_ATTRIBUTE = "data-align-offset";
const NAV_MENU_AVOID_COLLISIONS_ATTRIBUTE = "data-avoid-collisions";
const NAV_MENU_VIEWPORT_PADDING_ATTRIBUTE = "data-collision-padding";
const NAV_MENU_VIEWPORT_WIDTH_PROPERTY = "--sw-nav-menu-viewport-width";
const NAV_MENU_VIEWPORT_HEIGHT_PROPERTY = "--sw-nav-menu-viewport-height";
const NAV_MENU_POPUP_WIDTH_PROPERTY = "--sw-nav-menu-popup-width";
const NAV_MENU_POPUP_HEIGHT_PROPERTY = "--sw-nav-menu-popup-height";
const NAV_MENU_POSITIONER_WIDTH_PROPERTY = "--sw-nav-menu-positioner-width";
const NAV_MENU_POSITIONER_HEIGHT_PROPERTY = "--sw-nav-menu-positioner-height";
const BASE_UI_POPUP_WIDTH_PROPERTY = "--popup-width";
const BASE_UI_POPUP_HEIGHT_PROPERTY = "--popup-height";
const BASE_UI_POSITIONER_WIDTH_PROPERTY = "--positioner-width";
const BASE_UI_POSITIONER_HEIGHT_PROPERTY = "--positioner-height";
const BASE_UI_TRANSFORM_ORIGIN_PROPERTY = "--transform-origin";
const instances = new WeakMap<HTMLElement, NavigationMenuInstance>();
const unsupportedNestedRoots = new WeakSet<HTMLElement>();

export function createNavigationMenu(
  root: HTMLElement,
  options: NavigationMenuOptions = {},
): NavigationMenuInstance {
  assertHTMLElement(root, "createNavigationMenu root");

  const existing = instances.get(root);
  if (existing) return existing;

  const instance = isUnsupportedNestedNavigationMenuRoot(root)
    ? new InertNavigationMenuController(root)
    : new NavigationMenuController(root, options);
  instances.set(root, instance);
  return instance;
}

class InertNavigationMenuController implements NavigationMenuInstance {
  readonly root: HTMLElement;

  constructor(root: HTMLElement) {
    this.root = root;
  }

  close(): void {}

  destroy(): void {
    instances.delete(this.root);
  }

  getValue(): NavigationMenuValue {
    return null;
  }

  setValue(): void {}

  subscribe(): () => void {
    return () => {};
  }
}

class NavigationMenuController implements NavigationMenuInstance {
  readonly root: HTMLElement;

  private readonly abortController = new AbortController();
  private readonly closeDelay: number;
  private readonly closeOnEscape: boolean;
  private readonly closeOnOutsideInteract: boolean;
  private readonly controlled: boolean;
  private readonly elements: NavigationMenuElements;
  private readonly requestedFloatingAlign: FloatingAlign;
  private readonly requestedFloatingSide: FloatingSide;
  private readonly onValueChange?: (
    value: NavigationMenuValue,
    details: NavigationMenuValueChangeDetails,
  ) => void;
  private readonly openDelay: number;
  private readonly valueChangeSubscribers = new Set<
    (details: NavigationMenuValueChangeDetails) => void
  >();
  private activeIndex: number | null = null;
  private activeTrigger: HTMLElement | null = null;
  private closeTimer: number | null = null;
  private dismissalHandle: OverlayDismissalHandle | null = null;
  private destroyed = false;
  private floatingPositioner: FloatingPositioner | null = null;
  private floatingReference: HTMLElement | null = null;
  private instantFrame: number | null = null;
  private instantElements: HTMLElement[] = [];
  private openTimer: number | null = null;
  private pendingKeyboardOpenFocus: PendingKeyboardOpenFocus | null = null;
  private pendingKeyboardOpenFocusTimer: number | null = null;
  private placeholder: Comment | null = null;
  private rendered = false;
  private restoreFocusTrigger: HTMLElement | null = null;
  private boundaryTransformFrame: number | null = null;
  private surfaceSizeFrame: number | null = null;
  private viewportRefreshFrame: number | null = null;
  private viewportHeight = 0;
  private viewportWidth = 0;
  private valueState: NavigationMenuValue;

  constructor(root: HTMLElement, options: NavigationMenuOptions) {
    this.root = root;
    this.root.setAttribute(NAV_MENU_ROOT_ATTRIBUTE, "");
    this.elements = getNavigationMenuElements(root);
    const floatingOptionsElement = this.getFloatingOptionsElement();
    this.requestedFloatingAlign = readFloatingAlignAttribute(
      floatingOptionsElement.getAttribute(NAV_MENU_ALIGN_ATTRIBUTE),
      "start",
    );
    this.requestedFloatingSide = readFloatingSideAttribute(
      floatingOptionsElement.getAttribute(NAV_MENU_SIDE_ATTRIBUTE),
      "bottom",
    );
    this.controlled =
      Object.hasOwn(options, "value") ||
      root.hasAttribute(NAV_MENU_VALUE_ATTRIBUTE) ||
      root.hasAttribute(NAV_MENU_CONTROLLED_VALUE_ATTRIBUTE);
    this.closeDelay =
      options.closeDelay ?? readNumberAttribute(root, NAV_MENU_CLOSE_DELAY_ATTRIBUTE, 50);
    this.closeOnEscape =
      options.closeOnEscape ?? readBooleanAttribute(root, NAV_MENU_CLOSE_ON_ESCAPE_ATTRIBUTE, true);
    this.closeOnOutsideInteract =
      options.closeOnOutsideInteract ??
      readBooleanAttribute(root, NAV_MENU_CLOSE_ON_OUTSIDE_INTERACT_ATTRIBUTE, true);
    this.onValueChange = options.onValueChange;
    this.openDelay =
      options.openDelay ?? readNumberAttribute(root, NAV_MENU_OPEN_DELAY_ATTRIBUTE, 50);
    this.valueState = this.resolveKnownValue(getInitialValue(root, options, this.controlled));

    this.setupAccessibility();
    this.bindEvents();
    this.applyValueState(this.valueState);
  }

  close(): void {
    this.requestValue(null, { reason: "imperative-action" });
  }

  destroy(): void {
    if (this.destroyed) return;

    this.abortController.abort();
    this.clearCloseTimer();
    this.clearOpenTimer();
    this.clearPendingKeyboardOpenFocus();
    this.clearBoundaryTransformFrame();
    this.clearInstantFrame();
    this.clearSurfaceSizeFrame();
    this.clearViewportRefreshFrame();
    this.unregisterDismissal();
    this.floatingPositioner?.destroy();
    this.floatingPositioner = null;
    this.valueChangeSubscribers.clear();
    this.valueState = null;
    this.renderState(null);
    this.unportalPopup();
    this.elements.popup.hidden = true;
    this.elements.viewport.hidden = true;
    instances.delete(this.root);
    this.destroyed = true;
  }

  getValue(): NavigationMenuValue {
    return this.valueState;
  }

  setValue(value: NavigationMenuValue, options: NavigationMenuSetValueOptions = {}): void {
    const previousValue = this.valueState;
    const request = {
      event: options.event,
      reason: options.reason ?? "imperative-action",
      trigger: options.trigger,
    };

    this.valueState = this.resolveKnownValue(value);
    this.applyValueState(this.valueState);
    this.focusPendingKeyboardOpenControl(options);

    if (options.emit !== false) {
      this.notifyValueChange(
        createValueChangeDetails({
          event: request.event,
          previousValue,
          reason: request.reason,
          trigger: request.trigger,
          value: this.valueState,
        }),
      );
    }
  }

  subscribe(
    event: "valueChange",
    callback: (details: NavigationMenuValueChangeDetails) => void,
  ): () => void {
    if (event !== "valueChange") {
      throw new Error(`Unsupported NavigationMenu event: ${event}`);
    }

    this.valueChangeSubscribers.add(callback);
    return () => {
      this.valueChangeSubscribers.delete(callback);
    };
  }

  private setupAccessibility(): void {
    const { arrow, items, lists, popup, positioner, viewport } = this.elements;
    const popupId = ensureId(popup, "sw-nav-menu-popup");
    const orientation = this.getOrientation();

    this.root.setAttribute("data-orientation", orientation);
    this.root.setAttribute(
      NAV_MENU_OPEN_DELAY_ATTRIBUTE,
      this.root.getAttribute(NAV_MENU_OPEN_DELAY_ATTRIBUTE) ?? String(this.openDelay),
    );
    this.root.setAttribute(
      NAV_MENU_CLOSE_DELAY_ATTRIBUTE,
      this.root.getAttribute(NAV_MENU_CLOSE_DELAY_ATTRIBUTE) ?? String(this.closeDelay),
    );
    popup.setAttribute("role", popup.getAttribute("role") ?? "presentation");
    viewport.setAttribute("role", viewport.getAttribute("role") ?? "presentation");

    lists.forEach((list) => {
      list.setAttribute("data-orientation", orientation);
      if (!list.hasAttribute("role") && list.tagName !== "UL" && list.tagName !== "OL") {
        list.setAttribute("role", "list");
      }
    });

    items.forEach((item, index) => {
      item.element.setAttribute(NAV_MENU_ITEM_ATTRIBUTE, "");
      if (item.trigger) {
        const triggerId = ensureId(item.trigger, `sw-nav-menu-trigger-${index}`);
        item.trigger.setAttribute("aria-haspopup", "menu");
        item.trigger.setAttribute("aria-controls", popupId);
        if (isDisabledElement(item.trigger)) {
          item.trigger.setAttribute(NAV_MENU_DISABLED_ATTRIBUTE, "");
          item.trigger.setAttribute("aria-disabled", "true");
          if (item.trigger instanceof HTMLButtonElement) {
            item.trigger.disabled = true;
          } else if (!item.trigger.hasAttribute("tabindex")) {
            item.trigger.setAttribute("tabindex", "-1");
          }
        }
        if (item.content) {
          item.content.setAttribute("aria-labelledby", triggerId);
        }
      }
    });

    positioner?.setAttribute("data-side", positioner.getAttribute("data-side") ?? "bottom");
    positioner?.setAttribute("data-align", positioner.getAttribute("data-align") ?? "start");
    arrow?.setAttribute("aria-hidden", "true");
  }

  private bindEvents(): void {
    const { signal } = this.abortController;

    this.elements.popup.addEventListener(
      "keydown",
      (event) => {
        if (this.handlePopupTabKeyDown(event)) return;
        if (this.handlePopupFocusKeyDown(event)) return;

        if (!this.closeOnEscape || event.key !== "Escape" || this.valueState === null) return;

        event.preventDefault();
        this.requestValue(null, {
          event,
          reason: "escape-key",
          trigger: this.activeTrigger ?? undefined,
        });
      },
      { signal },
    );

    this.elements.items.forEach((item) => {
      item.element.addEventListener(
        "pointerenter",
        (event) => {
          if (!isMousePointer(event) || item.trigger || item.content) return;
          this.closeFromLinkOnlyHover(item, event);
        },
        { signal },
      );

      item.trigger?.addEventListener(
        "click",
        (event) => {
          if (!item.trigger) return;
          if (isDisabledElement(item.trigger)) {
            event.preventDefault();
            return;
          }
          event.preventDefault();
          this.requestValue(this.getTriggerPressValue(item), {
            event,
            reason: "trigger-press",
            trigger: item.trigger,
          });
        },
        { signal },
      );

      item.trigger?.addEventListener(
        "keydown",
        (event) => {
          this.handleTriggerKeyDown(item, event);
        },
        { signal },
      );

      item.trigger?.addEventListener(
        "pointerenter",
        (event) => {
          if (!item.trigger || !isMousePointer(event) || isDisabledElement(item.trigger)) return;
          this.openFromHover(item, event);
        },
        { signal },
      );

      item.trigger?.addEventListener(
        "pointerleave",
        (event) => {
          if (!isMousePointer(event)) return;
          if (this.isPointerMovingWithinMenu(event)) {
            this.clearCloseTimer();
            return;
          }

          this.closeAfterDelay(event);
        },
        { signal },
      );

      item.links.forEach((link) => {
        link.addEventListener(
          "click",
          (event) => {
            if (this.valueState === null || !shouldCloseOnLinkActivation(link)) return;

            this.requestValue(null, {
              event,
              reason: "link-press",
              trigger: link,
            });
          },
          { signal },
        );
      });
    });

    this.getHoverElements().forEach((element) => {
      element.addEventListener(
        "pointerenter",
        (event) => {
          if (!isMousePointer(event)) return;
          this.clearCloseTimer();
        },
        { signal },
      );

      element.addEventListener(
        "pointerleave",
        (event) => {
          if (!isMousePointer(event)) return;
          if (this.isPointerMovingWithinMenu(event)) {
            this.clearCloseTimer();
            return;
          }

          this.closeAfterDelay(event);
        },
        { signal },
      );
    });
  }

  private handleTriggerKeyDown(item: NavigationMenuItem, event: KeyboardEvent): void {
    if (!item.trigger) return;

    if (isDisabledElement(item.trigger)) {
      if (isActivationKey(event.key)) {
        event.preventDefault();
      }
      return;
    }

    if (isActivationKey(event.key)) {
      event.preventDefault();
      const nextValue = this.getTriggerPressValue(item);

      if (nextValue !== null) {
        this.setPendingKeyboardOpenFocus(nextValue, event);
      }

      const accepted = this.requestValue(nextValue, {
        event,
        reason: "trigger-press",
        trigger: item.trigger,
      });
      if (nextValue !== null && !accepted) {
        this.clearPendingKeyboardOpenFocus(nextValue);
        return;
      }
      if (nextValue !== null && this.valueState === nextValue) {
        this.focusPendingKeyboardOpenControl({ event });
      }
      return;
    }

    if (event.key === "Escape" && this.valueState !== null) {
      event.preventDefault();
      this.requestValue(null, {
        event,
        reason: "escape-key",
        trigger: item.trigger,
      });
      return;
    }

    const orientation = this.getOrientation();
    const openKey =
      (orientation === "horizontal" && event.key === "ArrowDown") ||
      (orientation === "vertical" && event.key === "ArrowRight");

    if (openKey) {
      event.preventDefault();
      if (this.valueState === item.value) {
        this.focusFirstContentControl(item);
        return;
      }

      this.setPendingKeyboardOpenFocus(item.value, event);
      const accepted = this.requestValue(item.value, {
        event,
        reason: "trigger-press",
        trigger: item.trigger,
      });
      if (!accepted) {
        this.clearPendingKeyboardOpenFocus(item.value);
        return;
      }
      if (this.valueState === item.value) {
        this.focusPendingKeyboardOpenControl({ event });
      }
      return;
    }

    const focusMove = getTriggerFocusMove(orientation, event.key);
    if (!focusMove) return;

    event.preventDefault();
    this.focusEnabledTrigger(item, focusMove);
  }

  private handlePopupTabKeyDown(event: KeyboardEvent): boolean {
    if (event.key !== "Tab" || event.defaultPrevented || this.valueState === null) return false;

    const activeItem = this.getItemByValue(this.valueState);
    if (!activeItem?.content) return false;

    const activeElement = document.activeElement;
    if (!(activeElement instanceof HTMLElement) || !activeItem.content.contains(activeElement)) {
      return false;
    }

    const focusableElements = getFocusableElements(activeItem.content);
    if (focusableElements.length === 0) return false;

    const first = focusableElements[0];
    const last = focusableElements[focusableElements.length - 1];

    if (event.shiftKey) {
      if (activeElement !== first || !activeItem.trigger) return false;

      event.preventDefault();
      activeItem.trigger.focus();
      return true;
    }

    if (activeElement !== last) return false;

    event.preventDefault();

    const nextFocusTarget = this.getNextEnabledItemFocusTarget(activeItem);
    if (nextFocusTarget?.type === "trigger") {
      nextFocusTarget.control.focus();
      return true;
    }
    if (nextFocusTarget?.type === "link") {
      const accepted = this.requestValue(null, {
        event,
        reason: "focus-out",
        trigger: activeItem.trigger ?? undefined,
      });

      if (accepted) {
        nextFocusTarget.control.focus();
      }

      return true;
    }

    const nextFocusableElement = getNextDocumentFocusableElementAfter(this.root, [
      this.getPortalElement(),
      this.elements.portal,
    ]);
    const accepted = this.requestValue(null, {
      event,
      reason: "focus-out",
      trigger: activeItem.trigger ?? undefined,
    });

    if (accepted) {
      nextFocusableElement?.focus();
    }

    return true;
  }

  private handlePopupFocusKeyDown(event: KeyboardEvent): boolean {
    const focusMove = event.defaultPrevented ? null : getPopupFocusMove(event.key);
    if (!focusMove || this.valueState === null) return false;

    const activeItem = this.getItemByValue(this.valueState);
    if (!activeItem?.content) return false;

    const activeElement = document.activeElement;
    if (!(activeElement instanceof HTMLElement) || !activeItem.content.contains(activeElement)) {
      return false;
    }

    const focusableElements = getFocusableElements(activeItem.content);
    if (focusableElements.length === 0) return false;

    event.preventDefault();

    const activeIndex = focusableElements.indexOf(activeElement);
    const fallbackIndex = focusMove === "next" ? 0 : focusableElements.length - 1;
    const currentIndex = activeIndex >= 0 ? activeIndex : fallbackIndex;
    const nextIndex =
      focusMove === "next"
        ? (currentIndex + 1) % focusableElements.length
        : (currentIndex - 1 + focusableElements.length) % focusableElements.length;

    focusableElements[nextIndex]?.focus();
    return true;
  }

  private getNextEnabledItemFocusTarget(
    item: NavigationMenuItem,
  ): NavigationMenuFocusTarget | null {
    const currentIndex = this.elements.items.indexOf(item);
    if (currentIndex < 0) return null;

    for (const candidate of this.elements.items.slice(currentIndex + 1)) {
      if (candidate.trigger && !isDisabledElement(candidate.trigger)) {
        return {
          control: candidate.trigger,
          item: candidate,
          type: "trigger",
        };
      }

      const link = getFirstTopLevelFocusableElement(candidate);
      if (link) {
        return {
          control: link,
          item: candidate,
          type: "link",
        };
      }
    }

    return null;
  }

  private openFromHover(item: NavigationMenuItem, event: PointerEvent): void {
    this.clearCloseTimer();
    this.clearOpenTimer();

    if (this.valueState !== null) {
      this.requestValue(item.value, {
        event,
        reason: "trigger-hover",
        trigger: item.trigger ?? undefined,
      });
      return;
    }

    const delay = this.readTriggerDelay(
      item.trigger,
      NAV_MENU_OPEN_DELAY_ATTRIBUTE,
      this.openDelay,
    );
    if (delay <= 0) {
      this.requestValue(item.value, {
        event,
        reason: "trigger-hover",
        trigger: item.trigger ?? undefined,
      });
      return;
    }

    this.openTimer = window.setTimeout(() => {
      this.openTimer = null;
      if (this.destroyed || !item.trigger || isDisabledElement(item.trigger)) return;

      this.requestValue(item.value, {
        event,
        reason: "trigger-hover",
        trigger: item.trigger,
      });
    }, delay);
  }

  private closeFromLinkOnlyHover(item: NavigationMenuItem, event: PointerEvent): void {
    this.clearCloseTimer();
    this.clearOpenTimer();

    if (this.valueState === null) return;

    this.requestValue(null, {
      event,
      reason: "trigger-hover",
      trigger: item.links[0] ?? item.element,
    });
  }

  private closeAfterDelay(event: PointerEvent): void {
    this.clearOpenTimer();
    this.clearCloseTimer();

    const delay = this.readTriggerDelay(
      this.activeTrigger,
      NAV_MENU_CLOSE_DELAY_ATTRIBUTE,
      this.closeDelay,
    );

    this.closeTimer = window.setTimeout(() => {
      this.closeTimer = null;
      if (!this.destroyed && this.valueState !== null) {
        this.requestValue(null, {
          event,
          reason: "trigger-hover",
          trigger: this.activeTrigger ?? undefined,
        });
      }
    }, delay);
  }

  private requestValue(value: NavigationMenuValue, request: ValueRequest): boolean {
    const nextValue = this.resolveKnownValue(value);
    if (nextValue === this.valueState && !this.controlled) return false;

    const previousValue = this.valueState;
    const details = createValueChangeDetails({
      event: request.event,
      previousValue,
      reason: request.reason,
      trigger: request.trigger,
      value: nextValue,
    });

    this.onValueChange?.(nextValue, details);
    const valueChangeEvent = dispatchCustomEvent(this.root, "starwind:value-change", details, {
      cancelable: true,
    });
    if (valueChangeEvent.defaultPrevented) {
      details.cancel();
    }

    if (details.isCanceled) return false;

    if (!this.controlled) {
      this.valueState = nextValue;
      this.applyValueState(nextValue, request);
    }

    this.notifyValueChange(details);
    return true;
  }

  private applyValueState(value: NavigationMenuValue, request?: ValueRequest): void {
    this.clearCloseTimer();
    this.clearOpenTimer();
    this.clearSurfaceSizeFrame();
    this.clearViewportRefreshFrame();

    if (value !== null) {
      const activeItem = this.getItemByValue(value);
      const activeIndex = activeItem ? this.elements.items.indexOf(activeItem) : -1;
      let instantSize = false;
      this.activeTrigger = activeItem?.trigger ?? null;
      this.restoreFocusTrigger =
        resolveNavigationMenuTrigger(request?.trigger, this.elements.items) ??
        this.activeTrigger ??
        this.restoreFocusTrigger;
      this.renderState(value);
      let positionUpdateDeferred = false;
      if (activeItem) {
        const activationDirection = this.updateActivationState(activeIndex);
        instantSize = activationDirection === "initial";
        if (!instantSize) {
          this.clearInstantFrame();
        }
        positionUpdateDeferred = this.updateViewportSize(activeItem, {
          animateFromPrevious: !instantSize,
          instant: instantSize,
        });
      }
      this.portalPopup();
      this.registerDismissal();
      if (positionUpdateDeferred) {
        this.floatingPositioner?.stopAutoUpdate();
      } else {
        this.positionPopup();
        this.setupAutoUpdate();
      }
      if (activeItem && !positionUpdateDeferred) {
        this.scheduleViewportSizeRefresh(activeItem, { instant: instantSize });
      }
    } else if (!this.rendered) {
      this.unregisterDismissal();
      this.renderState(null);
      this.elements.popup.hidden = true;
      this.elements.viewport.hidden = true;
      this.activeIndex = null;
    } else {
      this.unregisterDismissal();
      this.renderState(null);
      this.activeIndex = null;
      hideElementAfterAnimations(this.elements.popup, {
        onHidden: () => {
          this.floatingPositioner?.stopAutoUpdate();
          this.unportalPopup();
          if (request?.reason === "escape-key") {
            this.restoreTriggerFocus();
          }
        },
      });
      hideElementAfterAnimations(this.elements.viewport);
    }

    this.rendered = true;
  }

  private renderState(value: NavigationMenuValue): void {
    const open = value !== null;
    const state = open ? "open" : "closed";
    const { arrow, items, popup, positioner, viewport } = this.elements;

    this.root.setAttribute("data-state", state);
    popup.setAttribute("data-state", state);
    positioner?.setAttribute("data-state", state);
    viewport.setAttribute("data-state", state);
    arrow?.setAttribute("data-state", state);

    if (open) {
      showElement(popup);
      showElement(viewport);
    }

    items.forEach((item) => {
      const itemOpen = item.value === value;
      const itemState = itemOpen ? "open" : "closed";
      item.element.setAttribute("data-state", itemState);
      item.trigger?.setAttribute("data-state", itemState);
      item.trigger?.setAttribute("aria-expanded", String(itemOpen));
      item.icon?.setAttribute("data-state", itemState);
      this.renderItemContent(item, itemOpen);
    });
  }

  private updateActivationState(activeIndex: number): NavigationMenuActivationDirection {
    const direction =
      this.activeIndex === null
        ? "initial"
        : activeIndex > this.activeIndex
          ? "next"
          : activeIndex < this.activeIndex
            ? "previous"
            : "current";
    const elements = this.getStateElements();

    elements.forEach((element) => {
      element.setAttribute("data-activation-direction", direction);
    });
    this.activeIndex = activeIndex;
    return direction;
  }

  private updateViewportSize(
    item: NavigationMenuItem,
    options: { animateFromPrevious?: boolean; instant?: boolean } = {},
  ): boolean {
    if (!item.content) return false;

    const { height, width } = measureNavigationMenuContent(item.content);
    if (width <= 0 || height <= 0) return false;

    const { height: previousHeight, width: previousWidth } = this.getAppliedBoundarySize();
    const sizeChanged = width !== this.viewportWidth || height !== this.viewportHeight;
    const widthValue = `${width}px`;
    const heightValue = `${height}px`;
    const canAnimateFromPrevious =
      Boolean(options.animateFromPrevious) &&
      sizeChanged &&
      previousWidth > 0 &&
      previousHeight > 0;

    this.viewportWidth = width;
    this.viewportHeight = height;

    if (canAnimateFromPrevious) {
      const previousWidthValue = `${previousWidth}px`;
      const previousHeightValue = `${previousHeight}px`;
      this.applyPositionerSize(previousWidthValue, previousHeightValue);
      this.applySurfaceSize(previousWidthValue, previousHeightValue);
      this.flushBoundaryTransitionBaseline();
      this.scheduleSurfaceSizeUpdate(item.value, widthValue, heightValue);
      return true;
    } else {
      this.applyPositionerSize(widthValue, heightValue);
      this.applySurfaceSize(widthValue, heightValue);
    }

    if (sizeChanged && options.instant) {
      this.setInstantState();
    }

    return false;
  }

  private applyPositionerSize(widthValue: string, heightValue: string): void {
    if (!this.elements.positioner) return;

    this.elements.positioner.style.width = widthValue;
    this.elements.positioner.style.height = heightValue;
    this.elements.positioner.style.setProperty(NAV_MENU_POSITIONER_WIDTH_PROPERTY, widthValue);
    this.elements.positioner.style.setProperty(NAV_MENU_POSITIONER_HEIGHT_PROPERTY, heightValue);
    this.elements.positioner.style.setProperty(BASE_UI_POSITIONER_WIDTH_PROPERTY, widthValue);
    this.elements.positioner.style.setProperty(BASE_UI_POSITIONER_HEIGHT_PROPERTY, heightValue);
  }

  private getAppliedBoundarySize(): { height: number; width: number } {
    const positionerWidth = readPixelStyleValue(this.elements.positioner?.style.width ?? "");
    const positionerHeight = readPixelStyleValue(this.elements.positioner?.style.height ?? "");
    const popupWidth = readPixelStyleValue(this.elements.popup.style.width);
    const popupHeight = readPixelStyleValue(this.elements.popup.style.height);

    return {
      height: positionerHeight ?? popupHeight ?? this.viewportHeight,
      width: positionerWidth ?? popupWidth ?? this.viewportWidth,
    };
  }

  private getRenderedPopupBoundary(): NavigationMenuPopupBoundary | null {
    if (this.elements.popup.hidden || !this.elements.popup.isConnected) return null;

    const rect = this.elements.popup.getBoundingClientRect();
    if (rect.width <= 0 || rect.height <= 0) return null;

    return {
      bottom: rect.bottom,
      left: rect.left,
      right: rect.right,
      top: rect.top,
    };
  }

  private applySurfaceSize(widthValue: string, heightValue: string): void {
    this.elements.viewport.style.width = widthValue;
    this.elements.viewport.style.height = heightValue;
    this.elements.popup.style.width = widthValue;
    this.elements.popup.style.height = heightValue;
    this.elements.popup.style.setProperty(NAV_MENU_POPUP_WIDTH_PROPERTY, widthValue);
    this.elements.popup.style.setProperty(NAV_MENU_POPUP_HEIGHT_PROPERTY, heightValue);
    this.elements.popup.style.setProperty(BASE_UI_POPUP_WIDTH_PROPERTY, widthValue);
    this.elements.popup.style.setProperty(BASE_UI_POPUP_HEIGHT_PROPERTY, heightValue);

    this.getStateElements().forEach((element) => {
      element.style.setProperty(NAV_MENU_VIEWPORT_WIDTH_PROPERTY, widthValue);
      element.style.setProperty(NAV_MENU_VIEWPORT_HEIGHT_PROPERTY, heightValue);
    });
  }

  private flushBoundaryTransitionBaseline(): void {
    this.elements.positioner?.getBoundingClientRect();
    this.elements.popup.getBoundingClientRect();
  }

  private animateBoundaryPositionFrom(
    previousBoundary: NavigationMenuPopupBoundary | null,
    restorePositionerTransition: (() => void) | null,
  ): void {
    const positioner = this.elements.positioner;
    if (!positioner || !previousBoundary) {
      restorePositionerTransition?.();
      return;
    }

    const nextBoundary = this.getRenderedPopupBoundary();
    if (!nextBoundary) {
      restorePositionerTransition?.();
      return;
    }

    const placementSide = positioner.getAttribute(NAV_MENU_SIDE_ATTRIBUTE);
    const deltaX =
      placementSide === "left"
        ? previousBoundary.right - nextBoundary.right
        : previousBoundary.left - nextBoundary.left;
    const deltaY =
      placementSide === "top"
        ? previousBoundary.bottom - nextBoundary.bottom
        : previousBoundary.top - nextBoundary.top;
    if (deltaX === 0 && deltaY === 0) {
      restorePositionerTransition?.();
      return;
    }

    this.clearBoundaryTransformFrame();
    positioner.style.transform = `translate(${deltaX}px, ${deltaY}px)`;
    positioner.getBoundingClientRect();
    restorePositionerTransition?.();
    positioner.getBoundingClientRect();

    this.boundaryTransformFrame = requestAnimationFrame(() => {
      this.boundaryTransformFrame = requestAnimationFrame(() => {
        this.boundaryTransformFrame = null;
        if (this.destroyed || positioner !== this.elements.positioner) return;
        positioner.style.removeProperty("transform");
      });
    });
  }

  private scheduleSurfaceSizeUpdate(value: string, widthValue: string, heightValue: string): void {
    this.clearSurfaceSizeFrame();
    this.surfaceSizeFrame = requestAnimationFrame(() => {
      this.surfaceSizeFrame = requestAnimationFrame(() => {
        this.surfaceSizeFrame = null;
        if (this.destroyed || this.valueState !== value) return;

        void this.applyBoundaryTransitionTarget(value, widthValue, heightValue);
      });
    });
  }

  private async applyBoundaryTransitionTarget(
    value: string,
    widthValue: string,
    heightValue: string,
  ): Promise<void> {
    const previousBoundary = this.getRenderedPopupBoundary();
    const restorePositionerTransition = this.disablePositionerTransition();

    this.applyPositionerSize(widthValue, heightValue);
    this.applySurfaceSize(widthValue, heightValue);
    await this.positionPopup();
    if (this.destroyed || this.valueState !== value) {
      restorePositionerTransition?.();
      return;
    }
    this.animateBoundaryPositionFrom(previousBoundary, restorePositionerTransition);
    this.setupAutoUpdate();
  }

  private disablePositionerTransition(): (() => void) | null {
    const positioner = this.elements.positioner;
    if (!positioner) return null;

    const previousTransition = positioner.style.transition;
    positioner.style.transition = "none";

    return () => {
      if (positioner.style.transition !== "none") return;

      if (previousTransition) {
        positioner.style.transition = previousTransition;
      } else {
        positioner.style.removeProperty("transition");
      }
    };
  }

  private renderItemContent(item: NavigationMenuItem, open: boolean): void {
    if (!item.content) return;

    item.content.setAttribute("data-state", open ? "open" : "closed");

    if (open) {
      if (item.content.parentElement !== this.elements.viewport) {
        this.elements.viewport.append(item.content);
      }
      showElement(item.content);
      return;
    }

    hideElementAfterAnimations(item.content, {
      onHidden: () => {
        if (!item.content || !item.contentPlaceholder?.parentNode) return;
        item.contentPlaceholder.parentNode.insertBefore(
          item.content,
          item.contentPlaceholder.nextSibling,
        );
      },
    });
  }

  private getTriggerPressValue(item: NavigationMenuItem): NavigationMenuValue {
    return this.valueState === item.value ? null : item.value;
  }

  private getOrientation(): NavigationMenuOrientation {
    return this.root.getAttribute("data-orientation") === "vertical" ? "vertical" : "horizontal";
  }

  private getEnabledTriggerItems(): Array<NavigationMenuItem & { trigger: HTMLElement }> {
    return this.elements.items.filter(
      (item): item is NavigationMenuItem & { trigger: HTMLElement } =>
        item.trigger instanceof HTMLElement && !isDisabledElement(item.trigger),
    );
  }

  private focusEnabledTrigger(
    item: NavigationMenuItem,
    move: "first" | "last" | "next" | "previous",
  ): void {
    const items = this.getEnabledTriggerItems();
    if (items.length === 0) return;

    const currentIndex = items.findIndex((candidate) => candidate.value === item.value);
    const fallbackIndex = move === "last" || move === "previous" ? items.length - 1 : 0;
    const index = currentIndex >= 0 ? currentIndex : fallbackIndex;
    const nextIndex =
      move === "first"
        ? 0
        : move === "last"
          ? items.length - 1
          : move === "next"
            ? Math.min(index + 1, items.length - 1)
            : Math.max(index - 1, 0);

    items[nextIndex]?.trigger.focus();
  }

  private focusFirstContentControl(item: NavigationMenuItem): void {
    const control = item.content ? getFirstFocusableElement(item.content) : null;
    control?.focus();
  }

  private focusPendingKeyboardOpenControl(options: { event?: Event } = {}): void {
    const pending = this.pendingKeyboardOpenFocus;
    if (!pending) return;
    if (this.valueState !== pending.value || options.event !== pending.event) {
      this.clearPendingKeyboardOpenFocus(pending.value);
      return;
    }

    this.clearPendingKeyboardOpenFocus(pending.value);
    const item = this.getItemByValue(pending.value);
    if (item) {
      this.focusFirstContentControl(item);
    }
  }

  private clearPendingKeyboardOpenFocus(value?: string): void {
    if (value === undefined || this.pendingKeyboardOpenFocus?.value === value) {
      this.pendingKeyboardOpenFocus = null;
      if (this.pendingKeyboardOpenFocusTimer !== null) {
        window.clearTimeout(this.pendingKeyboardOpenFocusTimer);
        this.pendingKeyboardOpenFocusTimer = null;
      }
    }
  }

  private setPendingKeyboardOpenFocus(value: string, event: Event): void {
    this.clearPendingKeyboardOpenFocus();
    this.pendingKeyboardOpenFocus = { event, value };
    this.pendingKeyboardOpenFocusTimer = window.setTimeout(() => {
      this.pendingKeyboardOpenFocusTimer = null;
      this.clearPendingKeyboardOpenFocus(value);
    }, 0);
  }

  private resolveKnownValue(value: NavigationMenuValue): NavigationMenuValue {
    if (value === null) return null;
    return this.getItemByValue(value)?.value ?? null;
  }

  private getItemByValue(value: string): NavigationMenuItem | null {
    return this.elements.items.find((item) => item.value === value) ?? null;
  }

  private getHoverElements(): HTMLElement[] {
    return getUniqueElements(
      [
        this.root,
        this.elements.portal,
        this.elements.positioner,
        this.elements.popup,
        this.elements.viewport,
        this.elements.arrow,
        ...this.elements.items.map((item) => item.trigger).filter(isHTMLElement),
      ].filter(isHTMLElement),
    );
  }

  private getStateElements(): HTMLElement[] {
    return [
      this.root,
      this.elements.positioner,
      this.elements.popup,
      this.elements.viewport,
      this.valueState !== null ? this.getItemByValue(this.valueState)?.content : null,
    ].filter(isHTMLElement);
  }

  private isPointerMovingWithinMenu(event: PointerEvent): boolean {
    return isPointerEventWithinElements(event, this.getHoverElements());
  }

  private readTriggerDelay(
    trigger: HTMLElement | null,
    attribute: string,
    fallback: number,
  ): number {
    return trigger?.hasAttribute(attribute)
      ? readNumberAttribute(trigger, attribute, fallback)
      : fallback;
  }

  private containsTarget(target: Node): boolean {
    const portalElement = this.getPortalElement();

    return (
      this.root.contains(target) ||
      portalElement.contains(target) ||
      Boolean(this.elements.portal?.contains(target))
    );
  }

  private registerDismissal(): void {
    if (this.dismissalHandle) return;
    if (!this.closeOnEscape && !this.closeOnOutsideInteract) return;

    this.dismissalHandle = registerOverlayDismissal({
      root: this.root,
      floating: this.getPortalElement(),
      contains: (target) => this.containsTarget(target),
      onEscapeKeyDown: this.closeOnEscape
        ? (event) => {
            event.preventDefault();
            this.requestValue(null, { event, reason: "escape-key" });
            return true;
          }
        : undefined,
      onOutsidePointerDown: this.closeOnOutsideInteract
        ? (event) => {
            this.requestValue(null, { event, reason: "outside-press" });
          }
        : undefined,
    });
  }

  private unregisterDismissal(): void {
    this.dismissalHandle?.destroy();
    this.dismissalHandle = null;
  }

  private portalPopup(): void {
    const portalTarget = resolveFloatingPortalTarget(this.activeTrigger);
    const portalElement = this.getPortalElement();

    if (this.placeholder || portalElement.parentElement === portalTarget) return;

    this.placeholder = document.createComment("navigation-menu-popup-placeholder");
    portalElement.parentNode?.insertBefore(this.placeholder, portalElement);
    portalTarget.append(portalElement);
  }

  private unportalPopup(): void {
    if (!this.placeholder) return;

    this.placeholder.parentNode?.insertBefore(this.getPortalElement(), this.placeholder);
    this.placeholder.remove();
    this.placeholder = null;
    this.clearFloatingStyles();
    this.clearSurfaceSizeStyles();
  }

  private getPortalElement(): HTMLElement {
    return this.elements.positioner ?? this.elements.popup;
  }

  private async positionPopup(): Promise<unknown> {
    if (this.valueState === null) return undefined;

    const state = await this.getFloatingPositioner()?.update();
    this.updatePopupPlacementAnchor();
    return state;
  }

  private setupAutoUpdate(): void {
    this.getFloatingPositioner()?.startAutoUpdate({
      onUpdated: () => {
        if (this.valueState !== null) {
          this.updatePopupPlacementAnchor();
        }
      },
      onUpdate: () => {
        if (this.valueState !== null) {
          this.setInstantPositionState();
        }
      },
    });
  }

  private getFloatingPositioner(): FloatingPositioner | null {
    const reference = this.activeTrigger;
    if (!reference) return null;

    if (this.floatingPositioner && this.floatingReference === reference) {
      return this.floatingPositioner;
    }

    this.floatingPositioner?.destroy();
    this.floatingReference = reference;
    this.floatingPositioner = createFloatingPositioner({
      adaptiveOrigin: true,
      reference,
      floating: this.getPortalElement(),
      placementStateElements: [
        this.elements.popup,
        this.elements.viewport,
        this.elements.arrow,
      ].filter(isHTMLElement),
      getOptions: () => this.readFloatingOptions(),
    });
    return this.floatingPositioner;
  }

  private readFloatingOptions(): {
    align: FloatingAlign;
    alignOffset?: number;
    avoidCollisions?: boolean;
    preserveAnchor?: boolean;
    side: FloatingSide;
    sideOffset?: number;
    viewportPadding?: number;
  } {
    const floatingOptionsElement = this.getFloatingOptionsElement();

    return {
      align: this.requestedFloatingAlign,
      alignOffset: readNumberAttribute(floatingOptionsElement, NAV_MENU_ALIGN_OFFSET_ATTRIBUTE, 0),
      avoidCollisions: readBooleanAttribute(
        floatingOptionsElement,
        NAV_MENU_AVOID_COLLISIONS_ATTRIBUTE,
        true,
      ),
      preserveAnchor: true,
      side: this.requestedFloatingSide,
      sideOffset: readNumberAttribute(floatingOptionsElement, NAV_MENU_SIDE_OFFSET_ATTRIBUTE, 4),
      viewportPadding: readNumberAttribute(
        floatingOptionsElement,
        NAV_MENU_VIEWPORT_PADDING_ATTRIBUTE,
        8,
      ),
    };
  }

  private getFloatingOptionsElement(): HTMLElement {
    return this.elements.positioner ?? this.elements.popup;
  }

  private clearFloatingStyles(): void {
    this.clearBoundaryTransformFrame();
    const positionedElements = [this.elements.positioner, this.elements.popup].filter(
      (element): element is HTMLElement => element instanceof HTMLElement,
    );

    positionedElements.forEach((element) => {
      element.style.removeProperty("bottom");
      element.style.removeProperty("left");
      element.style.removeProperty("position");
      element.style.removeProperty("right");
      element.style.removeProperty("top");
      element.style.removeProperty("transform");
      element.style.removeProperty("transform-origin");
      element.style.removeProperty(BASE_UI_TRANSFORM_ORIGIN_PROPERTY);
    });

    const placementStateElements = [this.elements.viewport, this.elements.arrow].filter(
      (element): element is HTMLElement => element instanceof HTMLElement,
    );

    placementStateElements.forEach((element) => {
      element.style.removeProperty(BASE_UI_TRANSFORM_ORIGIN_PROPERTY);
    });
  }

  private updatePopupPlacementAnchor(): void {
    if (!this.elements.positioner) return;

    const side = this.elements.positioner.getAttribute(NAV_MENU_SIDE_ATTRIBUTE);
    const { popup } = this.elements;
    popup.style.position = "absolute";

    if (side === "top") {
      popup.style.bottom = "0px";
      popup.style.left = "0px";
      popup.style.removeProperty("right");
      popup.style.removeProperty("top");
      return;
    }

    if (side === "left") {
      popup.style.right = "0px";
      popup.style.top = "0px";
      popup.style.removeProperty("bottom");
      popup.style.removeProperty("left");
      return;
    }

    popup.style.left = "0px";
    popup.style.top = "0px";
    popup.style.removeProperty("bottom");
    popup.style.removeProperty("right");
  }

  private clearSurfaceSizeStyles(): void {
    this.viewportWidth = 0;
    this.viewportHeight = 0;

    const surfaceElements = [
      this.elements.positioner,
      this.elements.popup,
      this.elements.viewport,
    ].filter(isHTMLElement);

    surfaceElements.forEach((element) => {
      element.style.removeProperty("width");
      element.style.removeProperty("height");
      element.style.removeProperty(NAV_MENU_VIEWPORT_WIDTH_PROPERTY);
      element.style.removeProperty(NAV_MENU_VIEWPORT_HEIGHT_PROPERTY);
      element.style.removeProperty(NAV_MENU_POPUP_WIDTH_PROPERTY);
      element.style.removeProperty(NAV_MENU_POPUP_HEIGHT_PROPERTY);
      element.style.removeProperty(NAV_MENU_POSITIONER_WIDTH_PROPERTY);
      element.style.removeProperty(NAV_MENU_POSITIONER_HEIGHT_PROPERTY);
      element.style.removeProperty(BASE_UI_POPUP_WIDTH_PROPERTY);
      element.style.removeProperty(BASE_UI_POPUP_HEIGHT_PROPERTY);
      element.style.removeProperty(BASE_UI_POSITIONER_WIDTH_PROPERTY);
      element.style.removeProperty(BASE_UI_POSITIONER_HEIGHT_PROPERTY);
    });
  }

  private setInstantState(): void {
    this.setInstantElements(this.getStateElements());
  }

  private setInstantPositionState(): void {
    if (!this.elements.positioner) return;

    this.setInstantElements([this.elements.positioner]);
  }

  private setInstantElements(elements: HTMLElement[]): void {
    this.clearInstantFrame();
    this.instantElements = elements;

    elements.forEach((element) => {
      setBooleanAttribute(element, "data-instant", true);
    });
    this.instantFrame = requestAnimationFrame(() => {
      this.instantFrame = null;
      elements.forEach((element) => {
        setBooleanAttribute(element, "data-instant", false);
      });
      this.instantElements = [];
    });
  }

  private scheduleViewportSizeRefresh(
    item: NavigationMenuItem,
    options: { instant?: boolean } = {},
  ): void {
    this.viewportRefreshFrame = requestAnimationFrame(() => {
      this.viewportRefreshFrame = null;
      if (this.destroyed || this.valueState !== item.value || !item.content?.isConnected) return;

      const positionUpdateDeferred = this.updateViewportSize(item, options);
      if (!positionUpdateDeferred) {
        this.positionPopup();
      }
    });
  }

  private clearInstantFrame(): void {
    if (this.instantFrame === null) return;
    cancelAnimationFrame(this.instantFrame);
    this.instantFrame = null;
    this.instantElements.forEach((element) => {
      setBooleanAttribute(element, "data-instant", false);
    });
    this.instantElements = [];
  }

  private clearViewportRefreshFrame(): void {
    if (this.viewportRefreshFrame === null) return;
    cancelAnimationFrame(this.viewportRefreshFrame);
    this.viewportRefreshFrame = null;
  }

  private clearSurfaceSizeFrame(): void {
    if (this.surfaceSizeFrame === null) return;
    cancelAnimationFrame(this.surfaceSizeFrame);
    this.surfaceSizeFrame = null;
  }

  private clearBoundaryTransformFrame(): void {
    if (this.boundaryTransformFrame !== null) {
      cancelAnimationFrame(this.boundaryTransformFrame);
      this.boundaryTransformFrame = null;
    }
    this.elements.positioner?.style.removeProperty("transform");
  }

  private clearCloseTimer(): void {
    if (this.closeTimer === null) return;
    window.clearTimeout(this.closeTimer);
    this.closeTimer = null;
  }

  private clearOpenTimer(): void {
    if (this.openTimer === null) return;
    window.clearTimeout(this.openTimer);
    this.openTimer = null;
  }

  private restoreTriggerFocus(): void {
    if (!this.restoreFocusTrigger?.isConnected) return;
    this.restoreFocusTrigger.focus();
  }

  private notifyValueChange(details: NavigationMenuValueChangeDetails): void {
    this.valueChangeSubscribers.forEach((callback) => callback(details));
  }
}

function getNavigationMenuElements(root: HTMLElement): NavigationMenuElements {
  const popup = queryOwnElement(root, `[${NAV_MENU_POPUP_ATTRIBUTE}]`);
  if (!popup) {
    throw new Error("Navigation Menu requires a [data-sw-nav-menu-popup] element.");
  }

  const viewport = queryOwnElement(root, `[${NAV_MENU_VIEWPORT_ATTRIBUTE}]`);
  if (!viewport) {
    throw new Error("Navigation Menu requires a [data-sw-nav-menu-viewport] element.");
  }

  const items = queryOwnElements(root, `[${NAV_MENU_ITEM_ATTRIBUTE}]`).map((element, index) =>
    getNavigationMenuItem(root, element, index),
  );

  return {
    arrow: queryOwnElement(root, `[${NAV_MENU_ARROW_ATTRIBUTE}]`),
    items,
    lists: queryOwnElements(root, `[${NAV_MENU_LIST_ATTRIBUTE}]`),
    popup,
    portal: queryOwnElement(root, `[${NAV_MENU_PORTAL_ATTRIBUTE}]`),
    positioner: queryOwnElement(root, `[${NAV_MENU_POSITIONER_ATTRIBUTE}]`),
    viewport,
  };
}

function getInitialValue(
  root: HTMLElement,
  options: NavigationMenuOptions,
  controlled: boolean,
): NavigationMenuValue {
  if (Object.hasOwn(options, "value")) return options.value ?? null;
  if (root.hasAttribute(NAV_MENU_VALUE_ATTRIBUTE)) {
    return root.getAttribute(NAV_MENU_VALUE_ATTRIBUTE);
  }
  if (controlled) return null;

  return options.defaultValue ?? root.getAttribute(NAV_MENU_DEFAULT_VALUE_ATTRIBUTE) ?? null;
}

function getNavigationMenuItem(
  root: HTMLElement,
  element: HTMLElement,
  index: number,
): NavigationMenuItem {
  const content = queryItemElement(root, element, `[${NAV_MENU_CONTENT_ATTRIBUTE}]`);
  const placeholder = content
    ? document.createComment("navigation-menu-content-placeholder")
    : null;
  if (content && placeholder) {
    content.parentNode?.insertBefore(placeholder, content);
    rememberUnsupportedNestedNavigationMenuRoots(content);
  }

  return {
    content,
    contentPlaceholder: placeholder,
    element,
    icon: queryItemElement(root, element, `[${NAV_MENU_ICON_ATTRIBUTE}]`),
    links: queryItemElements(root, element, `[${NAV_MENU_LINK_ATTRIBUTE}]`),
    trigger: resolveOptionalAsChildControl(
      queryItemElement(root, element, `[${NAV_MENU_TRIGGER_ATTRIBUTE}]`),
    ),
    value:
      element.getAttribute(NAV_MENU_VALUE_ATTRIBUTE) ??
      `${ensureId(root, "sw-nav-menu")}-item-${index + 1}`,
  };
}

function rememberUnsupportedNestedNavigationMenuRoots(content: HTMLElement): void {
  content.querySelectorAll<HTMLElement>(`[${NAV_MENU_ROOT_ATTRIBUTE}]`).forEach((nestedRoot) => {
    unsupportedNestedRoots.add(nestedRoot);
  });
}

function queryOwnElement(root: HTMLElement, selector: string): HTMLElement | null {
  return queryOwnElements(root, selector)[0] ?? null;
}

function isUnsupportedNestedNavigationMenuRoot(root: HTMLElement): boolean {
  return (
    unsupportedNestedRoots.has(root) ||
    root.parentElement?.closest<HTMLElement>(`[${NAV_MENU_ROOT_ATTRIBUTE}]`) !== null
  );
}

function queryOwnElements(root: HTMLElement, selector: string): HTMLElement[] {
  return Array.from(root.querySelectorAll<HTMLElement>(selector)).filter((element) => {
    const owner = element.closest<HTMLElement>(`[${NAV_MENU_ROOT_ATTRIBUTE}]`);
    return owner === root;
  });
}

function queryItemElement(
  root: HTMLElement,
  item: HTMLElement,
  selector: string,
): HTMLElement | null {
  return queryItemElements(root, item, selector)[0] ?? null;
}

function queryItemElements(root: HTMLElement, item: HTMLElement, selector: string): HTMLElement[] {
  return Array.from(item.querySelectorAll<HTMLElement>(selector)).filter((element) => {
    const owner = element.closest<HTMLElement>(`[${NAV_MENU_ROOT_ATTRIBUTE}]`);
    const itemOwner = element.closest<HTMLElement>(`[${NAV_MENU_ITEM_ATTRIBUTE}]`);
    return owner === root && itemOwner === item;
  });
}

function resolveOptionalAsChildControl(element: HTMLElement | null): HTMLElement | null {
  return element ? resolveAsChildControl(element) : null;
}

function resolveNavigationMenuTrigger(
  value: Element | undefined,
  items: NavigationMenuItem[],
): HTMLElement | null {
  if (!(value instanceof HTMLElement)) return null;
  return items.find((item) => item.trigger === value)?.trigger ?? null;
}

function isDisabledElement(element: HTMLElement): boolean {
  return (
    element.hasAttribute(NAV_MENU_DISABLED_ATTRIBUTE) ||
    element.getAttribute("aria-disabled") === "true" ||
    (element instanceof HTMLButtonElement && element.disabled)
  );
}

function isActivationKey(key: string): boolean {
  return key === "Enter" || key === " ";
}

function getTriggerFocusMove(
  orientation: NavigationMenuOrientation,
  key: string,
): "first" | "last" | "next" | "previous" | null {
  if (key === "Home") return "first";
  if (key === "End") return "last";

  if (orientation === "horizontal") {
    if (key === "ArrowRight") return "next";
    if (key === "ArrowLeft") return "previous";
    return null;
  }

  if (key === "ArrowDown") return "next";
  if (key === "ArrowUp") return "previous";
  return null;
}

function getPopupFocusMove(key: string): "next" | "previous" | null {
  if (key === "ArrowDown" || key === "ArrowRight") return "next";
  if (key === "ArrowUp" || key === "ArrowLeft") return "previous";
  return null;
}

function getFirstFocusableElement(root: HTMLElement): HTMLElement | null {
  return getFocusableElements(root)[0] ?? null;
}

function getFirstTopLevelFocusableElement(item: NavigationMenuItem): HTMLElement | null {
  return (
    getFocusableElements(item.element).find((element) =>
      item.content ? !item.content.contains(element) : true,
    ) ?? null
  );
}

function getFocusableElements(root: HTMLElement): HTMLElement[] {
  const selectors = [
    "a[href]",
    "button:not([disabled])",
    "input:not([disabled])",
    "select:not([disabled])",
    "textarea:not([disabled])",
    "[tabindex]:not([tabindex='-1'])",
  ].join(",");

  return Array.from(root.querySelectorAll<HTMLElement>(selectors)).filter(
    (element) =>
      element.tabIndex >= 0 &&
      !hasHiddenFocusAncestor(element, root) &&
      !isDisabledElement(element),
  );
}

function getNextDocumentFocusableElementAfter(
  element: HTMLElement,
  excludedElements: Array<HTMLElement | null>,
): HTMLElement | null {
  const ownerDocument = element.ownerDocument;
  const candidates = getFocusableElements(ownerDocument.body);

  return (
    candidates.find((candidate) => {
      if (element.contains(candidate)) return false;
      if (excludedElements.some((excluded) => excluded?.contains(candidate))) return false;

      return Boolean(element.compareDocumentPosition(candidate) & Node.DOCUMENT_POSITION_FOLLOWING);
    }) ?? null
  );
}

function hasHiddenFocusAncestor(element: HTMLElement, root: HTMLElement): boolean {
  let current: HTMLElement | null = element;

  while (current) {
    if (current.hasAttribute("hidden") || current.getAttribute("aria-hidden") === "true") {
      return true;
    }

    if (current === root) return false;
    current = current.parentElement;
  }

  return false;
}

function measureNavigationMenuContent(content: HTMLElement): { height: number; width: number } {
  const childSize = measureNavigationMenuChildContent(content);
  if (childSize) return childSize;

  const rect = content.getBoundingClientRect();

  return {
    height: Math.round(Math.max(rect.height, content.offsetHeight, content.scrollHeight)),
    width: Math.round(Math.max(rect.width, content.offsetWidth)),
  };
}

function measureNavigationMenuChildContent(
  content: HTMLElement,
): { height: number; width: number } | null {
  const children = Array.from(content.children).filter(isHTMLElement);
  if (children.length === 0) return null;

  let left = Number.POSITIVE_INFINITY;
  let right = Number.NEGATIVE_INFINITY;
  let top = Number.POSITIVE_INFINITY;
  let bottom = Number.NEGATIVE_INFINITY;

  children.forEach((child) => {
    const childWidth = child.offsetWidth;
    const childHeight = Math.max(child.offsetHeight, child.scrollHeight);
    if (childWidth <= 0 && childHeight <= 0) return;

    left = Math.min(left, child.offsetLeft);
    right = Math.max(right, child.offsetLeft + childWidth);
    top = Math.min(top, child.offsetTop);
    bottom = Math.max(bottom, child.offsetTop + childHeight);
  });

  if (
    left === Number.POSITIVE_INFINITY ||
    right === Number.NEGATIVE_INFINITY ||
    top === Number.POSITIVE_INFINITY ||
    bottom === Number.NEGATIVE_INFINITY
  ) {
    return null;
  }

  const style = window.getComputedStyle(content);
  const horizontalPadding = readPixelValue(style.paddingLeft) + readPixelValue(style.paddingRight);
  const verticalPadding = readPixelValue(style.paddingTop) + readPixelValue(style.paddingBottom);

  return {
    height: Math.round(bottom - top + verticalPadding),
    width: Math.round(right - left + horizontalPadding),
  };
}

function readPixelValue(value: string): number {
  const parsed = Number.parseFloat(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function readPixelStyleValue(value: string): number | null {
  const trimmed = value.trim();
  if (!trimmed.endsWith("px")) return null;

  const parsed = Number.parseFloat(trimmed);
  return Number.isFinite(parsed) ? parsed : null;
}

function isHTMLElement(element: unknown): element is HTMLElement {
  return element instanceof HTMLElement;
}

function isMousePointer(event: PointerEvent): boolean {
  return event.pointerType === "" || event.pointerType === "mouse";
}

function isPointerEventWithinElements(event: PointerEvent, elements: HTMLElement[]): boolean {
  if (event.relatedTarget instanceof Node) {
    return elements.some((element) => element.contains(event.relatedTarget as Node));
  }

  if (!hasPointerCoordinates(event)) return false;

  return elements.some((element) => isPointerWithinElement(event, element));
}

function hasPointerCoordinates(event: PointerEvent): boolean {
  return event.clientX !== 0 || event.clientY !== 0;
}

function isPointerWithinElement(event: PointerEvent, element: HTMLElement): boolean {
  const rect = element.getBoundingClientRect();
  if (rect.width <= 0 || rect.height <= 0) return false;

  return (
    event.clientX >= rect.left &&
    event.clientX <= rect.right &&
    event.clientY >= rect.top &&
    event.clientY <= rect.bottom
  );
}

function getUniqueElements(elements: HTMLElement[]): HTMLElement[] {
  return Array.from(new Set(elements));
}

function shouldCloseOnLinkActivation(link: HTMLElement): boolean {
  return readBooleanAttribute(link, NAV_MENU_LINK_CLOSE_ON_CLICK_ATTRIBUTE, true);
}

function createValueChangeDetails({
  event,
  previousValue,
  reason,
  trigger,
  value,
}: {
  event?: Event;
  previousValue: NavigationMenuValue;
  reason: NavigationMenuValueChangeReason;
  trigger?: Element;
  value: NavigationMenuValue;
}): NavigationMenuValueChangeDetails {
  let canceled = false;

  return {
    event,
    previousValue,
    reason,
    trigger,
    value,
    cancel() {
      canceled = true;
    },
    get isCanceled() {
      return canceled;
    },
  };
}
