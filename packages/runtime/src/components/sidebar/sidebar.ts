import { assertHTMLElement, readBooleanAttribute, resolveAsChildControl } from "../../internal/dom";
import { dispatchCustomEvent } from "../../internal/events";

export type SidebarOpenState = "collapsed" | "expanded";

export type SidebarOpenChangeReason =
  | "imperative-action"
  | "imperative-event"
  | "keyboard-shortcut"
  | "rail-click"
  | "trigger-click";

export type SidebarMobileOpenChangeReason = SidebarOpenChangeReason | "mobile-sheet" | "resize";

export type SidebarOpenChangeDetails = {
  open: boolean;
  previousOpen: boolean;
  reason: SidebarOpenChangeReason;
  state: SidebarOpenState;
  trigger?: Element;
};

export type SidebarMobileOpenChangeDetails = {
  open: boolean;
  previousOpen: boolean;
  reason: SidebarMobileOpenChangeReason;
  trigger?: Element;
};

export type SidebarPersistenceStorage = "cookie" | "localStorage" | Storage | false;

export type SidebarSetOpenOptions = {
  emit?: boolean;
  reason?: SidebarOpenChangeReason;
  trigger?: Element;
};

export type SidebarSetMobileOpenOptions = Omit<SidebarSetOpenOptions, "reason"> & {
  reason?: SidebarMobileOpenChangeReason;
};

export type SidebarControllerOptions = {
  defaultMobileOpen?: boolean;
  defaultOpen?: boolean;
  keyboardShortcut?: string;
  mobileOpen?: boolean;
  mobileQuery?: string;
  onMobileOpenChange?: (open: boolean, details: SidebarMobileOpenChangeDetails) => void;
  onOpenChange?: (open: boolean, details: SidebarOpenChangeDetails) => void;
  open?: boolean;
  persistOpen?: boolean;
  persistenceKey?: string;
  persistenceMaxAge?: number;
  persistenceStorage?: SidebarPersistenceStorage;
};

export type SidebarControllerInstance = {
  readonly provider: HTMLElement;
  destroy(): void;
  getMobileOpen(): boolean;
  getOpen(): boolean;
  getState(): SidebarOpenState;
  isMobile(): boolean;
  isMobileOpen(): boolean;
  isOpen(): boolean;
  setMobileOpen(open: boolean, options?: SidebarSetMobileOpenOptions): void;
  setOpen(open: boolean, options?: SidebarSetOpenOptions): void;
  subscribe(
    event: "mobileOpenChange",
    callback: (details: SidebarMobileOpenChangeDetails) => void,
  ): () => void;
  subscribe(event: "openChange", callback: (details: SidebarOpenChangeDetails) => void): () => void;
  toggle(options?: SidebarSetOpenOptions): void;
  toggleMobile(options?: SidebarSetMobileOpenOptions): void;
};

export type SidebarControllerCleanup = {
  destroy(): void;
};

const SIDEBAR_PROVIDER_ATTRIBUTE = "data-sw-sidebar-provider";
const SIDEBAR_ATTRIBUTE = "data-sw-sidebar";
const SIDEBAR_TRIGGER_ATTRIBUTE = "data-sw-sidebar-trigger";
const SIDEBAR_RAIL_ATTRIBUTE = "data-sw-sidebar-rail";
const SIDEBAR_MENU_BUTTON_ATTRIBUTE = "data-sw-sidebar-menu-button";
const SIDEBAR_DEFAULT_OPEN_ATTRIBUTE = "data-default-open";
const SIDEBAR_DEFAULT_MOBILE_OPEN_ATTRIBUTE = "data-default-mobile-open";
const SIDEBAR_STATE_ATTRIBUTE = "data-state";
const SIDEBAR_MOBILE_OPEN_ATTRIBUTE = "data-mobile-open";
const SIDEBAR_COLLAPSIBLE_ATTRIBUTE = "data-collapsible";
const SIDEBAR_COLLAPSIBLE_MODE_ATTRIBUTE = "data-collapsible-mode";
const SIDEBAR_KEYBOARD_SHORTCUT_ATTRIBUTE = "data-keyboard-shortcut";
const SIDEBAR_MOBILE_QUERY_ATTRIBUTE = "data-mobile-query";
const SIDEBAR_PERSIST_OPEN_ATTRIBUTE = "data-persist-open";
const SIDEBAR_PERSISTENCE_KEY_ATTRIBUTE = "data-persistence-key";
const SIDEBAR_PERSISTENCE_STORAGE_ATTRIBUTE = "data-persistence-storage";
const SIDEBAR_PERSISTENCE_MAX_AGE_ATTRIBUTE = "data-persistence-max-age";
const SIDEBAR_TOOLTIP_ATTRIBUTE = "data-starwind-sidebar-tooltips";
const DEFAULT_KEYBOARD_SHORTCUT = "b";
const DEFAULT_MOBILE_QUERY = "(max-width: 767.98px)";
const DEFAULT_PERSISTENCE_KEY = "starwind-sidebar-open";
const DEFAULT_PERSISTENCE_MAX_AGE = 60 * 60 * 24 * 7;

const instances = new WeakMap<HTMLElement, SidebarController>();

export function createSidebarController(
  provider: HTMLElement,
  options: SidebarControllerOptions = {},
): SidebarControllerInstance {
  assertHTMLElement(provider, "createSidebarController provider");

  const existing = instances.get(provider);
  if (existing) return existing;

  const instance = new SidebarController(provider, options);
  instances.set(provider, instance);
  return instance;
}

export function initSidebarController(root: ParentNode = document): SidebarControllerCleanup {
  const providers = collectSidebarProviders(root);
  const sidebars = providers.map((provider) => createSidebarController(provider));

  return {
    destroy() {
      sidebars.forEach((sidebar) => sidebar.destroy());
    },
  };
}

class SidebarController implements SidebarControllerInstance {
  readonly provider: HTMLElement;

  private readonly abortController = new AbortController();
  private readonly keyboardShortcut: string;
  private readonly mobileOpenControlled: boolean;
  private readonly onMobileOpenChange?: (
    open: boolean,
    details: SidebarMobileOpenChangeDetails,
  ) => void;
  private readonly onOpenChange?: (open: boolean, details: SidebarOpenChangeDetails) => void;
  private readonly openControlled: boolean;
  private readonly openSubscribers = new Set<(details: SidebarOpenChangeDetails) => void>();
  private readonly mobileOpenSubscribers = new Set<
    (details: SidebarMobileOpenChangeDetails) => void
  >();
  private readonly persistOpen: boolean;
  private readonly persistenceKey: string;
  private readonly persistenceMaxAge: number;
  private readonly persistenceStorage: SidebarPersistenceStorage;
  private mediaQueryList: MediaQueryList | null = null;
  private destroyed = false;
  private mobileOpenState: boolean;
  private openState: boolean;
  private wasMobile = false;

  constructor(provider: HTMLElement, options: SidebarControllerOptions) {
    this.provider = provider;
    instances.set(provider, this);

    this.openControlled = Object.hasOwn(options, "open");
    this.mobileOpenControlled = Object.hasOwn(options, "mobileOpen");
    this.onOpenChange = options.onOpenChange;
    this.onMobileOpenChange = options.onMobileOpenChange;
    this.keyboardShortcut =
      options.keyboardShortcut ??
      provider.getAttribute(SIDEBAR_KEYBOARD_SHORTCUT_ATTRIBUTE) ??
      DEFAULT_KEYBOARD_SHORTCUT;
    this.persistOpen =
      options.persistOpen ?? readBooleanAttribute(provider, SIDEBAR_PERSIST_OPEN_ATTRIBUTE);
    this.persistenceKey =
      options.persistenceKey ??
      provider.getAttribute(SIDEBAR_PERSISTENCE_KEY_ATTRIBUTE) ??
      DEFAULT_PERSISTENCE_KEY;
    this.persistenceStorage =
      options.persistenceStorage ?? readPersistenceStorageAttribute(provider);
    this.persistenceMaxAge =
      options.persistenceMaxAge ??
      readNumberAttribute(
        provider,
        SIDEBAR_PERSISTENCE_MAX_AGE_ATTRIBUTE,
        DEFAULT_PERSISTENCE_MAX_AGE,
      );
    this.openState = this.readInitialOpen(options);
    this.mobileOpenState = this.readInitialMobileOpen(options);

    this.writeOptionAttributes(options);
    this.resolveAsChildControls();
    this.setupMediaQuery();
    this.wasMobile = this.isMobile();
    this.bindEvents();
    this.render();

    if (this.persistOpen) {
      this.persistDesktopOpen();
    }
  }

  destroy(): void {
    if (this.destroyed) return;

    this.abortController.abort();
    this.detachMediaQueryListener();
    this.openSubscribers.clear();
    this.mobileOpenSubscribers.clear();
    instances.delete(this.provider);
    updateDocumentTooltipState();
    this.destroyed = true;
  }

  getMobileOpen(): boolean {
    return this.mobileOpenState;
  }

  getOpen(): boolean {
    return this.openState;
  }

  getState(): SidebarOpenState {
    return this.openState ? "expanded" : "collapsed";
  }

  isMobile(): boolean {
    return this.mediaQueryList?.matches ?? false;
  }

  isMobileOpen(): boolean {
    return this.getMobileOpen();
  }

  isOpen(): boolean {
    return this.getOpen();
  }

  setMobileOpen(open: boolean, options: SidebarSetMobileOpenOptions = {}): void {
    if (options.emit === false) {
      this.commitMobileOpen(open, options);
      return;
    }

    this.requestMobileOpen(open, options);
  }

  setOpen(open: boolean, options: SidebarSetOpenOptions = {}): void {
    if (options.emit === false) {
      this.commitOpen(open, options);
      return;
    }

    this.requestOpen(open, options);
  }

  subscribe(
    event: "mobileOpenChange" | "openChange",
    callback:
      | ((details: SidebarMobileOpenChangeDetails) => void)
      | ((details: SidebarOpenChangeDetails) => void),
  ): () => void {
    if (event === "openChange") {
      const subscriber = callback as (details: SidebarOpenChangeDetails) => void;
      this.openSubscribers.add(subscriber);
      return () => this.openSubscribers.delete(subscriber);
    }

    const subscriber = callback as (details: SidebarMobileOpenChangeDetails) => void;
    this.mobileOpenSubscribers.add(subscriber);
    return () => this.mobileOpenSubscribers.delete(subscriber);
  }

  toggle(options: SidebarSetOpenOptions = {}): void {
    if (this.isMobile()) {
      this.toggleMobile(options);
      return;
    }

    this.setOpen(!this.openState, options);
  }

  toggleMobile(options: SidebarSetMobileOpenOptions = {}): void {
    this.setMobileOpen(!this.mobileOpenState, options);
  }

  private bindEvents(): void {
    const { signal } = this.abortController;

    this.provider.addEventListener(
      "click",
      (event) => {
        const target = event.target;
        if (!(target instanceof Element)) return;

        const trigger = target.closest<HTMLElement>(`[${SIDEBAR_TRIGGER_ATTRIBUTE}]`);
        if (trigger && this.ownsElement(trigger)) {
          event.preventDefault();
          this.toggle({ reason: "trigger-click", trigger });
          return;
        }

        const rail = target.closest<HTMLElement>(`[${SIDEBAR_RAIL_ATTRIBUTE}]`);
        if (rail && this.ownsElement(rail)) {
          event.preventDefault();
          this.toggle({ reason: "rail-click", trigger: rail });
        }
      },
      { signal },
    );

    this.provider.addEventListener(
      "sidebar:toggle",
      () => this.toggle({ reason: "imperative-event", trigger: this.provider }),
      { signal },
    );
    this.provider.addEventListener(
      "sidebar:open",
      () => this.setOpen(true, { reason: "imperative-event", trigger: this.provider }),
      { signal },
    );
    this.provider.addEventListener(
      "sidebar:close",
      () => this.setOpen(false, { reason: "imperative-event", trigger: this.provider }),
      { signal },
    );
    this.provider.addEventListener(
      "sidebar:toggle-mobile",
      () => this.toggleMobile({ reason: "imperative-event", trigger: this.provider }),
      { signal },
    );
    this.provider.addEventListener(
      "sidebar:open-mobile",
      () => this.setMobileOpen(true, { reason: "imperative-event", trigger: this.provider }),
      { signal },
    );
    this.provider.addEventListener(
      "sidebar:close-mobile",
      () => this.setMobileOpen(false, { reason: "imperative-event", trigger: this.provider }),
      { signal },
    );
    this.provider.addEventListener("starwind:open-change", this.handleMobileSheetOpenChange, {
      signal,
    });

    document.addEventListener("keydown", this.handleDocumentKeyDown, { signal });
    window.addEventListener("resize", this.handleResize, { signal });
  }

  private setupMediaQuery(): void {
    if (typeof window.matchMedia !== "function") return;

    this.mediaQueryList = window.matchMedia(
      this.provider.getAttribute(SIDEBAR_MOBILE_QUERY_ATTRIBUTE) ?? DEFAULT_MOBILE_QUERY,
    );
    this.mediaQueryList.addEventListener?.("change", this.handleMediaQueryChange);
    this.mediaQueryList.addListener?.(this.handleMediaQueryChange);
  }

  private detachMediaQueryListener(): void {
    this.mediaQueryList?.removeEventListener?.("change", this.handleMediaQueryChange);
    this.mediaQueryList?.removeListener?.(this.handleMediaQueryChange);
  }

  private readonly handleMediaQueryChange = (): void => {
    this.handleResize();
  };

  private readonly handleResize = (): void => {
    const isMobileNow = this.isMobile();
    if (this.wasMobile && !isMobileNow) {
      this.setMobileOpen(false, { reason: "resize" });
    }

    this.wasMobile = isMobileNow;
    this.renderControls();
  };

  private readonly handleDocumentKeyDown = (event: KeyboardEvent): void => {
    if (isEditableTarget(event.target)) return;

    if (event.key.toLowerCase() !== this.keyboardShortcut.toLowerCase()) return;
    if (!event.ctrlKey && !event.metaKey) return;

    event.preventDefault();
    const trigger = event.target instanceof Element ? event.target : undefined;
    this.toggle({
      reason: "keyboard-shortcut",
      ...(trigger ? { trigger } : {}),
    });
  };

  private readonly handleMobileSheetOpenChange = (event: Event): void => {
    if (!(event instanceof CustomEvent)) return;

    const mobileSheet = this.getMobileSheet();
    if (!mobileSheet || event.target !== mobileSheet) return;
    if (!event.detail || typeof event.detail.open !== "boolean") return;
    if (event.detail.open === this.mobileOpenState && !this.mobileOpenControlled) return;

    this.setMobileOpen(event.detail.open, {
      reason: "mobile-sheet",
      trigger: mobileSheet,
    });
  };

  private requestOpen(open: boolean, options: SidebarSetOpenOptions): void {
    const previousOpen = this.openState;
    if (open === previousOpen) return;

    const details = createOpenChangeDetails({
      open,
      previousOpen,
      reason: options.reason ?? "imperative-action",
      trigger: options.trigger,
    });

    if (!this.openControlled) {
      this.commitOpen(open, { ...options, emit: false });
    }

    this.notifyOpenChange(details);
  }

  private requestMobileOpen(open: boolean, options: SidebarSetMobileOpenOptions): void {
    const previousOpen = this.mobileOpenState;
    if (open === previousOpen) return;

    const details = createMobileOpenChangeDetails({
      open,
      previousOpen,
      reason: options.reason ?? "imperative-action",
      trigger: options.trigger,
    });

    if (!this.mobileOpenControlled) {
      this.commitMobileOpen(open, { ...options, emit: false });
    }

    this.notifyMobileOpenChange(details);
  }

  private commitOpen(open: boolean, options: SidebarSetOpenOptions = {}): void {
    const previousOpen = this.openState;
    this.openState = open;
    this.render();

    if (this.persistOpen) {
      this.persistDesktopOpen();
    }

    if (previousOpen === open || options.emit === false) return;

    this.notifyOpenChange(
      createOpenChangeDetails({
        open,
        previousOpen,
        reason: options.reason ?? "imperative-action",
        trigger: options.trigger,
      }),
    );
  }

  private commitMobileOpen(open: boolean, options: SidebarSetMobileOpenOptions = {}): void {
    const previousOpen = this.mobileOpenState;
    this.mobileOpenState = open;
    this.provider.setAttribute(SIDEBAR_MOBILE_OPEN_ATTRIBUTE, String(open));
    this.dispatchMobileSheetEvent(open);
    this.renderControls();

    if (previousOpen === open || options.emit === false) return;

    this.notifyMobileOpenChange(
      createMobileOpenChangeDetails({
        open,
        previousOpen,
        reason: options.reason ?? "imperative-action",
        trigger: options.trigger,
      }),
    );
  }

  private render(): void {
    const state = this.getState();

    this.provider.setAttribute(SIDEBAR_STATE_ATTRIBUTE, state);
    this.provider.setAttribute(SIDEBAR_MOBILE_OPEN_ATTRIBUTE, String(this.mobileOpenState));
    this.provider.setAttribute(SIDEBAR_PROVIDER_ATTRIBUTE, "");

    this.getSidebars().forEach((sidebar) => {
      const collapsibleMode =
        sidebar.getAttribute(SIDEBAR_COLLAPSIBLE_MODE_ATTRIBUTE) ||
        sidebar.getAttribute(SIDEBAR_COLLAPSIBLE_ATTRIBUTE) ||
        "offcanvas";

      sidebar.setAttribute(SIDEBAR_ATTRIBUTE, "");
      sidebar.setAttribute(SIDEBAR_STATE_ATTRIBUTE, state);
      sidebar.setAttribute(
        SIDEBAR_COLLAPSIBLE_ATTRIBUTE,
        state === "collapsed" ? collapsibleMode : "",
      );
      sidebar.setAttribute(SIDEBAR_COLLAPSIBLE_MODE_ATTRIBUTE, collapsibleMode);
    });

    this.renderControls();
    updateDocumentTooltipState();
  }

  private renderControls(): void {
    const open = this.isMobile() ? this.mobileOpenState : this.openState;
    const state = this.getState();

    this.getOwnedElements<HTMLElement>(
      `[${SIDEBAR_TRIGGER_ATTRIBUTE}], [${SIDEBAR_RAIL_ATTRIBUTE}]`,
    ).forEach((control) => {
      control.setAttribute("aria-expanded", String(open));
      control.setAttribute(SIDEBAR_STATE_ATTRIBUTE, state);
    });

    this.getOwnedElements<HTMLElement>(`[${SIDEBAR_MENU_BUTTON_ATTRIBUTE}]`).forEach((button) => {
      button.setAttribute("data-sidebar-state", state);
    });
  }

  private dispatchMobileSheetEvent(open: boolean): void {
    this.getMobileSheet()?.dispatchEvent(new CustomEvent(open ? "dialog:open" : "dialog:close"));
  }

  private getSidebars(): HTMLElement[] {
    return this.getOwnedElements<HTMLElement>(`[${SIDEBAR_ATTRIBUTE}]`);
  }

  private getMobileSheet(): HTMLElement | null {
    return this.provider.querySelector<HTMLElement>(
      '[data-slot="sidebar-mobile"], [data-sidebar="mobile"]',
    );
  }

  private getOwnedElements<T extends HTMLElement>(selector: string): T[] {
    return Array.from(this.provider.querySelectorAll<T>(selector)).filter((element) =>
      this.ownsElement(element),
    );
  }

  private ownsElement(element: Element): boolean {
    return element.closest<HTMLElement>(`[${SIDEBAR_PROVIDER_ATTRIBUTE}]`) === this.provider;
  }

  private resolveAsChildControls(): void {
    this.getOwnedElements<HTMLElement>(
      `[${SIDEBAR_TRIGGER_ATTRIBUTE}], [${SIDEBAR_RAIL_ATTRIBUTE}], [${SIDEBAR_MENU_BUTTON_ATTRIBUTE}]`,
    ).forEach((element) => {
      let control = element;

      for (let depth = 0; depth < 3; depth += 1) {
        const resolved = resolveAsChildControl(control);
        if (resolved === control) return;
        control = resolved;
      }
    });
  }

  private readInitialOpen(options: SidebarControllerOptions): boolean {
    if (options.open !== undefined) return options.open;

    if (this.persistOpen && !this.openControlled) {
      const persistedOpen = this.readPersistedDesktopOpen();
      if (persistedOpen !== null) return persistedOpen;
    }

    if (options.defaultOpen !== undefined) return options.defaultOpen;
    if (this.provider.hasAttribute(SIDEBAR_DEFAULT_OPEN_ATTRIBUTE)) {
      return readBooleanAttribute(this.provider, SIDEBAR_DEFAULT_OPEN_ATTRIBUTE, true);
    }
    if (this.provider.hasAttribute(SIDEBAR_STATE_ATTRIBUTE)) {
      return readSidebarState(this.provider.getAttribute(SIDEBAR_STATE_ATTRIBUTE)) === "expanded";
    }

    return true;
  }

  private readInitialMobileOpen(options: SidebarControllerOptions): boolean {
    if (options.mobileOpen !== undefined) return options.mobileOpen;
    if (options.defaultMobileOpen !== undefined) return options.defaultMobileOpen;
    if (this.provider.hasAttribute(SIDEBAR_DEFAULT_MOBILE_OPEN_ATTRIBUTE)) {
      return readBooleanAttribute(this.provider, SIDEBAR_DEFAULT_MOBILE_OPEN_ATTRIBUTE, false);
    }

    return readBooleanAttribute(this.provider, SIDEBAR_MOBILE_OPEN_ATTRIBUTE, false);
  }

  private writeOptionAttributes(options: SidebarControllerOptions): void {
    this.provider.setAttribute(SIDEBAR_PROVIDER_ATTRIBUTE, "");
    this.provider.setAttribute(SIDEBAR_KEYBOARD_SHORTCUT_ATTRIBUTE, this.keyboardShortcut);
    this.provider.setAttribute(
      SIDEBAR_MOBILE_QUERY_ATTRIBUTE,
      options.mobileQuery ??
        this.provider.getAttribute(SIDEBAR_MOBILE_QUERY_ATTRIBUTE) ??
        DEFAULT_MOBILE_QUERY,
    );

    if (options.defaultOpen !== undefined) {
      this.provider.setAttribute(SIDEBAR_DEFAULT_OPEN_ATTRIBUTE, String(options.defaultOpen));
    }
    if (options.defaultMobileOpen !== undefined) {
      this.provider.setAttribute(
        SIDEBAR_DEFAULT_MOBILE_OPEN_ATTRIBUTE,
        String(options.defaultMobileOpen),
      );
    }
    if (this.persistOpen) {
      this.provider.setAttribute(SIDEBAR_PERSIST_OPEN_ATTRIBUTE, "true");
    }
    if (
      options.persistenceKey !== undefined ||
      this.provider.hasAttribute(SIDEBAR_PERSISTENCE_KEY_ATTRIBUTE)
    ) {
      this.provider.setAttribute(SIDEBAR_PERSISTENCE_KEY_ATTRIBUTE, this.persistenceKey);
    }
    if (
      typeof this.persistenceStorage === "string" ||
      this.persistenceStorage === false ||
      this.provider.hasAttribute(SIDEBAR_PERSISTENCE_STORAGE_ATTRIBUTE)
    ) {
      this.provider.setAttribute(
        SIDEBAR_PERSISTENCE_STORAGE_ATTRIBUTE,
        this.persistenceStorage === false ? "false" : String(this.persistenceStorage),
      );
    }
    if (
      options.persistenceMaxAge !== undefined ||
      this.provider.hasAttribute(SIDEBAR_PERSISTENCE_MAX_AGE_ATTRIBUTE)
    ) {
      this.provider.setAttribute(
        SIDEBAR_PERSISTENCE_MAX_AGE_ATTRIBUTE,
        String(this.persistenceMaxAge),
      );
    }
  }

  private notifyOpenChange(details: SidebarOpenChangeDetails): void {
    this.onOpenChange?.(details.open, details);
    dispatchCustomEvent(this.provider, "starwind:sidebar-change", details);
    dispatchCustomEvent(this.provider, "sidebar:change", details);
    this.openSubscribers.forEach((subscriber) => subscriber(details));
  }

  private notifyMobileOpenChange(details: SidebarMobileOpenChangeDetails): void {
    this.onMobileOpenChange?.(details.open, details);
    dispatchCustomEvent(this.provider, "starwind:sidebar-mobile-change", details);
    dispatchCustomEvent(this.provider, "sidebar:mobile-change", details);
    this.mobileOpenSubscribers.forEach((subscriber) => subscriber(details));
  }

  private readPersistedDesktopOpen(): boolean | null {
    const value = readPersistenceValue(this.persistenceStorage, this.persistenceKey);
    if (value === "true") return true;
    if (value === "false") return false;

    return null;
  }

  private persistDesktopOpen(): void {
    writePersistenceValue(this.persistenceStorage, this.persistenceKey, String(this.openState), {
      maxAge: this.persistenceMaxAge,
    });
  }
}

function collectSidebarProviders(root: ParentNode): HTMLElement[] {
  if (root instanceof HTMLElement && root.hasAttribute(SIDEBAR_PROVIDER_ATTRIBUTE)) {
    return [root];
  }

  return Array.from(root.querySelectorAll<HTMLElement>(`[${SIDEBAR_PROVIDER_ATTRIBUTE}]`));
}

function createOpenChangeDetails(
  details: Omit<SidebarOpenChangeDetails, "state">,
): SidebarOpenChangeDetails {
  const { trigger, ...rest } = details;

  if (!trigger) {
    return {
      ...rest,
      state: details.open ? "expanded" : "collapsed",
    };
  }

  return {
    ...rest,
    trigger,
    state: details.open ? "expanded" : "collapsed",
  };
}

function createMobileOpenChangeDetails(
  details: SidebarMobileOpenChangeDetails,
): SidebarMobileOpenChangeDetails {
  const { trigger, ...rest } = details;

  return trigger ? { ...rest, trigger } : rest;
}

function readSidebarState(value: string | null): SidebarOpenState {
  return value === "collapsed" ? "collapsed" : "expanded";
}

function readNumberAttribute(element: HTMLElement, name: string, fallback: number): number {
  const value = Number.parseFloat(element.getAttribute(name) ?? "");
  return Number.isFinite(value) ? value : fallback;
}

function readPersistenceStorageAttribute(element: HTMLElement): SidebarPersistenceStorage {
  const value = element.getAttribute(SIDEBAR_PERSISTENCE_STORAGE_ATTRIBUTE);
  if (value === "cookie") return "cookie";
  if (value === "false") return false;

  return "localStorage";
}

function readPersistenceValue(storage: SidebarPersistenceStorage, key: string): string | null {
  try {
    if (storage === false) return null;
    if (storage === "cookie") return readCookieValue(key);
    if (storage === "localStorage") return window.localStorage.getItem(key);

    return storage.getItem(key);
  } catch {
    return null;
  }
}

function writePersistenceValue(
  storage: SidebarPersistenceStorage,
  key: string,
  value: string,
  options: { maxAge: number },
): void {
  try {
    if (storage === false) return;
    if (storage === "cookie") {
      document.cookie = `${encodeURIComponent(key)}=${encodeURIComponent(value)}; Max-Age=${options.maxAge}; path=/`;
      return;
    }
    if (storage === "localStorage") {
      window.localStorage.setItem(key, value);
      return;
    }

    storage.setItem(key, value);
  } catch {
    return;
  }
}

function readCookieValue(key: string): string | null {
  const encodedKey = `${encodeURIComponent(key)}=`;
  const cookie = document.cookie
    .split(";")
    .map((entry) => entry.trim())
    .find((entry) => entry.startsWith(encodedKey));

  if (!cookie) return null;

  return decodeURIComponent(cookie.slice(encodedKey.length));
}

function isEditableTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false;

  const tagName = target.tagName.toLowerCase();
  return (
    tagName === "input" ||
    tagName === "textarea" ||
    tagName === "select" ||
    target.isContentEditable ||
    Boolean(target.closest("[contenteditable='true']"))
  );
}

function updateDocumentTooltipState(): void {
  const hasCollapsedIconSidebar = Array.from(
    document.querySelectorAll<HTMLElement>(
      `[${SIDEBAR_ATTRIBUTE}][${SIDEBAR_COLLAPSIBLE_MODE_ATTRIBUTE}="icon"][${SIDEBAR_STATE_ATTRIBUTE}="collapsed"]`,
    ),
  ).some((sidebar) => {
    const provider = sidebar.closest<HTMLElement>(`[${SIDEBAR_PROVIDER_ATTRIBUTE}]`);
    return (
      provider &&
      document.contains(provider) &&
      instances.has(provider) &&
      getComputedStyle(sidebar).display !== "none"
    );
  });

  if (hasCollapsedIconSidebar) {
    document.documentElement.setAttribute(SIDEBAR_TOOLTIP_ATTRIBUTE, "enabled");
  } else {
    document.documentElement.removeAttribute(SIDEBAR_TOOLTIP_ATTRIBUTE);
  }
}
