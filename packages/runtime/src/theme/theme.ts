import { ensureId, setBooleanAttribute } from "../internal/dom";

type SelectRuntimeModule = typeof import("../components/select");
type SwitchRuntimeModule = typeof import("../components/switch");

export type StarwindTheme = "dark" | "light" | "system";
export type StarwindResolvedTheme = "dark" | "light";
export type StarwindThemeChangeReason =
  | "control-change"
  | "imperative-action"
  | "initial"
  | "storage-change"
  | "system-change";

export type StarwindThemeChangeDetails = {
  previousResolvedTheme: StarwindResolvedTheme;
  previousTheme: StarwindTheme;
  reason: StarwindThemeChangeReason;
  resolvedTheme: StarwindResolvedTheme;
  theme: StarwindTheme;
};

export type ThemeControllerOptions = {
  className?: string;
  defaultTheme?: StarwindTheme;
  documentElement?: HTMLElement;
  onThemeChange?: (theme: StarwindTheme, details: StarwindThemeChangeDetails) => void;
  root?: ParentNode;
  storage?: Storage | false;
  storageKey?: string;
};

export type ThemeInitScriptOptions = {
  className?: string;
  defaultTheme?: StarwindTheme;
  storageKey?: string;
};

export type ThemeControllerSetThemeOptions = {
  emit?: boolean;
  persist?: boolean;
  reason?: StarwindThemeChangeReason;
};

export type ThemeControllerInstance = {
  destroy(): void;
  getResolvedTheme(): StarwindResolvedTheme;
  getTheme(): StarwindTheme;
  setTheme(theme: StarwindTheme, options?: ThemeControllerSetThemeOptions): void;
  subscribe(
    event: "themeChange",
    callback: (details: StarwindThemeChangeDetails) => void,
  ): () => void;
  syncControls(): void;
};

const sharedThemeControllers = new WeakMap<ParentNode, ThemeController>();

const THEME_CONTROL_SELECTOR = "[data-sw-theme-control], [data-sw-theme-toggle]";
const THEME_TOGGLE_ATTRIBUTE = "data-sw-theme-toggle";
const THEME_VALUE_ATTRIBUTE = "data-theme-value";
const THEME_ON_ATTRIBUTE = "data-theme-on";
const THEME_OFF_ATTRIBUTE = "data-theme-off";
const THEME_READY_ATTRIBUTE = "data-ready";
const DEFAULT_STORAGE_KEY = "colorTheme";
const DEFAULT_CLASS_NAME = "dark";
const DEFAULT_THEME = "system" satisfies StarwindTheme;
let selectRuntimePromise: Promise<SelectRuntimeModule> | undefined;
let switchRuntimePromise: Promise<SwitchRuntimeModule> | undefined;

export function createThemeController(
  options: ThemeControllerOptions = {},
): ThemeControllerInstance {
  return new ThemeController(options);
}

export function initThemeController(
  root: ParentNode = document,
  options: Omit<ThemeControllerOptions, "root"> = {},
): ThemeControllerInstance {
  const existing = sharedThemeControllers.get(root);
  if (existing && !existing.isDestroyed()) {
    existing.syncControls();
    return existing;
  }

  const controller = new ThemeController({ ...options, root });
  sharedThemeControllers.set(root, controller);
  return controller;
}

export function getThemeInitScript(options: ThemeInitScriptOptions = {}): string {
  const className = options.className ?? DEFAULT_CLASS_NAME;
  const defaultTheme = normalizeTheme(options.defaultTheme) ?? DEFAULT_THEME;
  const storageKey = options.storageKey ?? DEFAULT_STORAGE_KEY;

  return `(() => {
  const storageKey = ${serializeInlineScriptValue(storageKey)};
  const className = ${serializeInlineScriptValue(className)};
  const defaultTheme = ${serializeInlineScriptValue(defaultTheme)};
  const themeQuery = "(prefers-color-scheme: dark)";
  const applyTheme = () => {
    let theme = defaultTheme;

    try {
      const storedTheme = window.localStorage.getItem(storageKey);
      if (storedTheme === "dark" || storedTheme === "light" || storedTheme === "system") {
        theme = storedTheme;
      } else {
        window.localStorage.setItem(storageKey, theme);
      }
    } catch {
    }

    const resolvedTheme =
      theme === "system"
        ? typeof window.matchMedia === "function" && window.matchMedia(themeQuery).matches
          ? "dark"
          : "light"
        : theme;

    document.documentElement.classList.toggle(className, resolvedTheme === "dark");
  };

  applyTheme();
  window.__starwindApplyInitialTheme = applyTheme;

  if (!window.__starwindHasThemeInitSwapListener) {
    window.__starwindHasThemeInitSwapListener = true;
    document.addEventListener("astro:after-swap", () => {
      window.__starwindApplyInitialTheme?.();
    });
  }
})();`;
}

function serializeInlineScriptValue(value: string): string {
  return JSON.stringify(value)
    .replaceAll("<", "\\u003c")
    .replaceAll(">", "\\u003e")
    .replaceAll("&", "\\u0026")
    .replaceAll("\u2028", "\\u2028")
    .replaceAll("\u2029", "\\u2029");
}

class ThemeController implements ThemeControllerInstance {
  private readonly abortController = new AbortController();
  private readonly className: string;
  private readonly defaultTheme: StarwindTheme;
  private readonly documentElement: HTMLElement;
  private readonly onThemeChange?: (
    theme: StarwindTheme,
    details: StarwindThemeChangeDetails,
  ) => void;
  private readonly root: ParentNode;
  private readonly storage: Storage | false;
  private readonly storageKey: string;
  private readonly subscribers = new Set<(details: StarwindThemeChangeDetails) => void>();
  private destroyed = false;
  private readonly mediaQueryList: MediaQueryList | null;
  private resolvedTheme: StarwindResolvedTheme;
  private theme: StarwindTheme;
  private readonly boundControls = new WeakSet<HTMLElement>();

  constructor(options: ThemeControllerOptions) {
    this.className = options.className ?? DEFAULT_CLASS_NAME;
    this.defaultTheme = options.defaultTheme ?? DEFAULT_THEME;
    this.documentElement = options.documentElement ?? document.documentElement;
    this.onThemeChange = options.onThemeChange;
    this.root = options.root ?? document;
    this.storage = options.storage === undefined ? safeLocalStorage() : options.storage;
    this.storageKey = options.storageKey ?? DEFAULT_STORAGE_KEY;
    this.mediaQueryList = safeMatchMedia("(prefers-color-scheme: dark)");
    this.theme = this.readStoredTheme() ?? this.defaultTheme;
    this.resolvedTheme = this.resolveTheme(this.theme);

    this.bindGlobalEvents();
    this.applyTheme("initial", { emit: false, persist: this.readStoredTheme() === null });
  }

  destroy(): void {
    if (this.destroyed) return;

    this.abortController.abort();
    this.subscribers.clear();
    sharedThemeControllers.delete(this.root);
    this.destroyed = true;
  }

  isDestroyed(): boolean {
    return this.destroyed;
  }

  getResolvedTheme(): StarwindResolvedTheme {
    return this.resolvedTheme;
  }

  getTheme(): StarwindTheme {
    return this.theme;
  }

  setTheme(theme: StarwindTheme, options: ThemeControllerSetThemeOptions = {}): void {
    const normalizedTheme = normalizeTheme(theme);
    if (!normalizedTheme) return;

    const previousTheme = this.theme;
    const previousResolvedTheme = this.resolvedTheme;
    this.theme = normalizedTheme;
    this.applyTheme(
      options.reason ?? "imperative-action",
      {
        emit: options.emit ?? true,
        persist: options.persist ?? true,
      },
      previousTheme,
      previousResolvedTheme,
    );
  }

  subscribe(
    event: "themeChange",
    callback: (details: StarwindThemeChangeDetails) => void,
  ): () => void {
    if (event !== "themeChange") {
      throw new Error(`Unsupported theme controller event: ${event}`);
    }

    this.subscribers.add(callback);
    return () => {
      this.subscribers.delete(callback);
    };
  }

  syncControls(): void {
    this.bindControls();
    this.getControls().forEach((control) => {
      this.syncControl(control);
      control.querySelectorAll<HTMLElement>("[data-theme-icon]").forEach((icon) => {
        icon.setAttribute(THEME_READY_ATTRIBUTE, "");
      });
    });
  }

  private applyTheme(
    reason: StarwindThemeChangeReason,
    options: { emit: boolean; persist: boolean },
    previousTheme = this.theme,
    previousResolvedTheme = this.resolvedTheme,
  ): void {
    this.resolvedTheme = this.resolveTheme(this.theme);
    this.documentElement.classList.toggle(this.className, this.resolvedTheme === "dark");

    if (options.persist) {
      this.writeStoredTheme(this.theme);
    }

    this.syncControls();

    if (
      !options.emit ||
      (previousTheme === this.theme && previousResolvedTheme === this.resolvedTheme)
    ) {
      return;
    }

    const details: StarwindThemeChangeDetails = {
      previousResolvedTheme,
      previousTheme,
      reason,
      resolvedTheme: this.resolvedTheme,
      theme: this.theme,
    };

    this.onThemeChange?.(this.theme, details);
    this.subscribers.forEach((subscriber) => subscriber(details));
    document.dispatchEvent(new CustomEvent("starwind:theme-change", { detail: details }));
    document.dispatchEvent(new CustomEvent("theme:change", { detail: details }));
  }

  private bindGlobalEvents(): void {
    const { signal } = this.abortController;

    this.mediaQueryList?.addEventListener("change", this.handleSystemThemeChange, { signal });
    window.addEventListener("storage", this.handleStorageChange, { signal });
    document.addEventListener("starwind:theme-change", this.handleDocumentThemeChange, {
      signal,
    });
  }

  private bindControls(): void {
    const { signal } = this.abortController;

    this.getControls().forEach((control) => {
      if (this.boundControls.has(control)) return;
      this.boundControls.add(control);

      if (isThemeToggle(control)) {
        prepareThemeToggleControl(control);
        control.addEventListener("click", this.handleThemeToggleClick, { signal });
        control.addEventListener("keydown", this.handleThemeToggleKeyDown, { signal });
        control.addEventListener("keyup", this.handleThemeToggleKeyUp, { signal });
        return;
      }

      if (control.hasAttribute("data-sw-switch")) {
        this.initializeSwitchControl(control);
        control.addEventListener("starwind:checked-change", this.handleSwitchChange, { signal });
        return;
      }

      if (control.hasAttribute("data-sw-select")) {
        this.initializeSelectControl(control);
        control.addEventListener("starwind:value-change", this.handleSelectValueChange, {
          signal,
        });
        return;
      }

      control.addEventListener("change", this.handleNativeControlChange, { signal });
      control.addEventListener("click", this.handleValueControlClick, { signal });
    });
  }

  private getControls(): HTMLElement[] {
    return Array.from(this.root.querySelectorAll<HTMLElement>(THEME_CONTROL_SELECTOR));
  }

  private readonly handleStorageChange = (event: StorageEvent): void => {
    if (event.storageArea !== this.storage || event.key !== this.storageKey) return;

    const nextTheme = normalizeTheme(event.newValue);
    if (!nextTheme || nextTheme === this.theme) return;

    this.setTheme(nextTheme, { persist: false, reason: "storage-change" });
  };

  private readonly handleSystemThemeChange = (): void => {
    if (this.theme !== "system") return;

    this.applyTheme("system-change", { emit: true, persist: false });
  };

  private readonly handleDocumentThemeChange = (event: Event): void => {
    const detail = (event as CustomEvent<StarwindThemeChangeDetails>).detail;
    const theme = normalizeTheme(detail?.theme);
    if (!theme || (theme === this.theme && detail.resolvedTheme === this.resolvedTheme)) return;

    const previousTheme = this.theme;
    const previousResolvedTheme = this.resolvedTheme;
    this.theme = theme;
    this.applyTheme(
      "imperative-action",
      { emit: false, persist: false },
      previousTheme,
      previousResolvedTheme,
    );
  };

  private readonly handleThemeToggleClick = (event: Event): void => {
    const target = event.currentTarget;
    if (!(target instanceof HTMLElement)) return;

    this.requestThemeToggle(target, event);
  };

  private readonly handleThemeToggleKeyDown = (event: KeyboardEvent): void => {
    if (!shouldHandleThemeToggleKeyboardEvent(event)) return;

    if (isDisabledThemeControl(event.currentTarget)) {
      event.preventDefault();
      return;
    }

    if (event.key === "Enter") {
      event.preventDefault();
      this.requestThemeToggle(event.currentTarget, event);
      return;
    }

    if (event.key === " ") {
      event.preventDefault();
    }
  };

  private readonly handleThemeToggleKeyUp = (event: KeyboardEvent): void => {
    if (!shouldHandleThemeToggleKeyboardEvent(event) || event.key !== " ") return;

    event.preventDefault();
    this.requestThemeToggle(event.currentTarget, event);
  };

  private readonly handleSwitchChange = (event: Event): void => {
    const target = event.currentTarget;
    if (!(target instanceof HTMLElement)) return;

    const detail = (event as CustomEvent<{ checked?: boolean }>).detail;
    const theme = detail.checked
      ? readControlTheme(target, THEME_ON_ATTRIBUTE, "dark")
      : readControlTheme(target, THEME_OFF_ATTRIBUTE, "light");

    this.setTheme(theme, { reason: "control-change" });
  };

  private readonly handleSelectValueChange = (event: Event): void => {
    const detail = (event as CustomEvent<{ value?: string | null }>).detail;
    const theme = normalizeTheme(detail.value);
    if (theme) {
      this.setTheme(theme, { reason: "control-change" });
    }
  };

  private readonly handleNativeControlChange = (event: Event): void => {
    const target = event.currentTarget;
    if (!(target instanceof HTMLElement)) return;

    if (target instanceof HTMLSelectElement) {
      const theme = normalizeTheme(target.value);
      if (theme) this.setTheme(theme, { reason: "control-change" });
      return;
    }

    if (target instanceof HTMLInputElement && target.type === "checkbox") {
      const theme = target.checked
        ? readControlTheme(target, THEME_ON_ATTRIBUTE, "dark")
        : readControlTheme(target, THEME_OFF_ATTRIBUTE, "light");
      this.setTheme(theme, { reason: "control-change" });
    }
  };

  private readonly handleValueControlClick = (event: Event): void => {
    const target = event.currentTarget;
    if (!(target instanceof HTMLElement) || isFormControl(target)) return;

    const theme = normalizeTheme(target.getAttribute(THEME_VALUE_ATTRIBUTE));
    if (theme) {
      this.setTheme(theme, { reason: "control-change" });
    }
  };

  private readStoredTheme(): StarwindTheme | null {
    if (!this.storage) return null;

    try {
      return normalizeTheme(this.storage.getItem(this.storageKey));
    } catch {
      return null;
    }
  }

  private writeStoredTheme(theme: StarwindTheme): void {
    if (!this.storage) return;

    try {
      this.storage.setItem(this.storageKey, theme);
    } catch {
      // Ignore blocked storage; theme state still applies to the document.
    }
  }

  private resolveTheme(theme: StarwindTheme): StarwindResolvedTheme {
    if (theme !== "system") return theme;
    return this.mediaQueryList?.matches ? "dark" : "light";
  }

  private syncControl(control: HTMLElement): void {
    const checked = this.resolvedTheme === "dark";

    if (isThemeToggle(control)) {
      prepareThemeToggleControl(control);
      syncPressedAttributes(control, checked);
      return;
    }

    if (control.hasAttribute("data-sw-switch")) {
      syncPressedAttributes(control, checked);
      this.syncSwitchControl(control, checked);
      return;
    }

    if (control.hasAttribute("data-sw-select")) {
      control.setAttribute("data-value", this.theme);
      this.syncSelectControl(control, this.theme);
      return;
    }

    if (control instanceof HTMLSelectElement) {
      control.value = this.theme;
      return;
    }

    if (control instanceof HTMLInputElement && control.type === "checkbox") {
      control.checked = checked;
      return;
    }

    if (control.hasAttribute(THEME_VALUE_ATTRIBUTE)) {
      syncPressedAttributes(
        control,
        normalizeTheme(control.getAttribute(THEME_VALUE_ATTRIBUTE)) === this.theme,
      );
      return;
    }

    syncPressedAttributes(control, checked);
  }

  private initializeSelectControl(control: HTMLElement): void {
    void loadSelectRuntime()
      .then(({ createSelect }) => {
        if (this.destroyed) return;
        createSelect(control);
      })
      .catch(() => {
        // Hand-authored generic controls do not always have a full Select DOM contract.
      });
  }

  private initializeSwitchControl(control: HTMLElement): void {
    void loadSwitchRuntime()
      .then(({ createSwitch }) => {
        if (this.destroyed) return;
        createSwitch(control);
      })
      .catch(() => {
        // Hand-authored generic controls do not always have a full Switch DOM contract.
      });
  }

  private syncSelectControl(control: HTMLElement, theme: StarwindTheme): void {
    void loadSelectRuntime()
      .then(({ createSelect }) => {
        if (this.destroyed) return;
        createSelect(control).setValue(theme, { emit: false });
      })
      .catch(() => {
        control.setAttribute("data-value", theme);
      });
  }

  private syncSwitchControl(control: HTMLElement, checked: boolean): void {
    void loadSwitchRuntime()
      .then(({ createSwitch }) => {
        if (this.destroyed) return;
        createSwitch(control).setChecked(checked, { emit: false });
      })
      .catch(() => {
        syncPressedAttributes(control, checked);
      });
  }

  private requestThemeToggle(control: HTMLElement, event?: Event): void {
    if (isDisabledThemeControl(control)) {
      event?.preventDefault();
      return;
    }

    const pressed = control.getAttribute("aria-pressed") === "true";
    const nextPressed = !pressed;
    const theme = nextPressed
      ? readControlTheme(control, THEME_ON_ATTRIBUTE, "dark")
      : readControlTheme(control, THEME_OFF_ATTRIBUTE, "light");

    this.setTheme(theme, { reason: "control-change" });
    dispatchLegacyThemeToggleChange(control, nextPressed);
  }
}

function normalizeTheme(value: unknown): StarwindTheme | null {
  return value === "dark" || value === "light" || value === "system" ? value : null;
}

function isThemeToggle(element: HTMLElement): boolean {
  return element.hasAttribute(THEME_TOGGLE_ATTRIBUTE);
}

function prepareThemeToggleControl(element: HTMLElement): void {
  element.setAttribute("data-sw-toggle", "");

  if (element instanceof HTMLButtonElement) {
    if (!element.getAttribute("type")) {
      element.type = "button";
    }

    return;
  }

  if (!element.getAttribute("role")) {
    element.setAttribute("role", "button");
  }

  if (!element.hasAttribute("tabindex")) {
    element.tabIndex = isDisabledThemeControl(element) ? -1 : 0;
  }
}

function isDisabledThemeControl(element: unknown): boolean {
  if (!(element instanceof HTMLElement)) return false;

  return (
    (element instanceof HTMLButtonElement && element.disabled) ||
    element.hasAttribute("disabled") ||
    element.hasAttribute("data-disabled") ||
    element.getAttribute("aria-disabled") === "true"
  );
}

function shouldHandleThemeToggleKeyboardEvent(event: KeyboardEvent): event is KeyboardEvent & {
  currentTarget: HTMLElement;
} {
  if (!(event.currentTarget instanceof HTMLElement)) return false;
  if (event.target !== event.currentTarget) return false;
  if (event.currentTarget instanceof HTMLButtonElement) return false;

  return event.key === "Enter" || event.key === " ";
}

function dispatchLegacyThemeToggleChange(element: HTMLElement, pressed: boolean): void {
  element.dispatchEvent(
    new CustomEvent("starwind-toggle:change", {
      bubbles: true,
      cancelable: true,
      detail: {
        pressed,
        syncGroup: element.getAttribute("data-sync-group") ?? undefined,
        toggleId: ensureId(element, "starwind-toggle"),
      },
    }),
  );
}

function readControlTheme(
  element: HTMLElement,
  attribute: string,
  fallback: StarwindTheme,
): StarwindTheme {
  return normalizeTheme(element.getAttribute(attribute)) ?? fallback;
}

function syncPressedAttributes(element: HTMLElement, pressed: boolean): void {
  element.setAttribute("aria-pressed", String(pressed));
  element.setAttribute("data-state", pressed ? "on" : "off");
  setBooleanAttribute(element, "data-pressed", pressed);
  setBooleanAttribute(element, "data-unpressed", !pressed);
}

function safeLocalStorage(): Storage | false {
  try {
    return window.localStorage;
  } catch {
    return false;
  }
}

function safeMatchMedia(query: string): MediaQueryList | null {
  if (!window.matchMedia) return null;
  return window.matchMedia(query);
}

function isFormControl(element: HTMLElement): boolean {
  return element instanceof HTMLInputElement || element instanceof HTMLSelectElement;
}

function loadSelectRuntime(): Promise<SelectRuntimeModule> {
  selectRuntimePromise ??= import("../components/select").catch((error: unknown) => {
    selectRuntimePromise = undefined;
    throw error;
  });

  return selectRuntimePromise;
}

function loadSwitchRuntime(): Promise<SwitchRuntimeModule> {
  switchRuntimePromise ??= import("../components/switch").catch((error: unknown) => {
    switchRuntimePromise = undefined;
    throw error;
  });

  return switchRuntimePromise;
}
