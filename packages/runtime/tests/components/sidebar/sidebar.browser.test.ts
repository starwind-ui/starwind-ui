import { beforeEach, describe, expect, it, vi } from "vitest";
import { initStarwind } from "../../../src/init-starwind";
import { createDrawer } from "../../../src/components/drawer";
import {
  createSidebarController,
  initSidebarController,
  type SidebarOpenChangeDetails,
} from "../../../src/components/sidebar/sidebar";

describe("createSidebarController", () => {
  beforeEach(() => {
    document.body.innerHTML = "";
    document.documentElement.removeAttribute("data-starwind-sidebar-tooltips");
    vi.restoreAllMocks();
  });

  it("toggles desktop state from triggers and rails", () => {
    mockMatchMedia(false);
    const provider = renderSidebar();
    const sidebar = getSidebar();
    const trigger = getTrigger();
    const rail = getRail();
    const listener = vi.fn();
    provider.addEventListener("starwind:sidebar-change", listener);

    const controller = createSidebarController(provider);

    expect(controller.getState()).toBe("expanded");
    expect(controller.isOpen()).toBe(true);
    expect(sidebar.getAttribute("data-state")).toBe("expanded");
    expect(sidebar.getAttribute("data-collapsible")).toBe("");
    expect(trigger.getAttribute("aria-expanded")).toBe("true");

    trigger.click();

    expect(controller.getState()).toBe("collapsed");
    expect(provider.getAttribute("data-state")).toBe("collapsed");
    expect(sidebar.getAttribute("data-state")).toBe("collapsed");
    expect(sidebar.getAttribute("data-collapsible")).toBe("icon");
    expect(trigger.getAttribute("aria-expanded")).toBe("false");
    expect(rail.getAttribute("data-state")).toBe("collapsed");
    expect(document.documentElement.getAttribute("data-starwind-sidebar-tooltips")).toBe("enabled");
    expect(listener).toHaveBeenLastCalledWith(
      expect.objectContaining({
        detail: expect.objectContaining({ open: false, reason: "trigger-click" }),
      }),
    );

    rail.click();

    expect(controller.getState()).toBe("expanded");
    expect(sidebar.getAttribute("data-collapsible")).toBe("");
    expect(document.documentElement.hasAttribute("data-starwind-sidebar-tooltips")).toBe(false);
    expect(listener).toHaveBeenLastCalledWith(
      expect.objectContaining({
        detail: expect.objectContaining({ open: true, reason: "rail-click" }),
      }),
    );
  });

  it("handles custom events and subscriptions", () => {
    mockMatchMedia(false);
    const provider = renderSidebar({ defaultOpen: false });
    const controller = createSidebarController(provider);
    const subscriber = vi.fn();
    controller.subscribe("openChange", subscriber);

    expect(controller.isOpen()).toBe(false);

    provider.dispatchEvent(new CustomEvent("sidebar:open"));

    expect(controller.isOpen()).toBe(true);
    expect(subscriber).toHaveBeenLastCalledWith(
      expect.objectContaining({ open: true, reason: "imperative-event" }),
    );

    provider.dispatchEvent(new CustomEvent("sidebar:close"));

    expect(controller.isOpen()).toBe(false);
    expect(subscriber).toHaveBeenLastCalledWith(
      expect.objectContaining({ open: false, reason: "imperative-event" }),
    );
  });

  it("does not emit uncontrolled changes for same-value requests", () => {
    mockMatchMedia(false);
    const provider = renderSidebar();
    const controller = createSidebarController(provider);
    const openSubscriber = vi.fn();
    const mobileOpenSubscriber = vi.fn();
    controller.subscribe("openChange", openSubscriber);
    controller.subscribe("mobileOpenChange", mobileOpenSubscriber);

    controller.setOpen(true);
    provider.dispatchEvent(new CustomEvent("sidebar:open"));
    controller.setMobileOpen(false);
    provider.dispatchEvent(new CustomEvent("sidebar:close-mobile"));

    expect(openSubscriber).not.toHaveBeenCalled();
    expect(mobileOpenSubscriber).not.toHaveBeenCalled();

    controller.setOpen(false);
    controller.setOpen(false);
    provider.dispatchEvent(new CustomEvent("sidebar:close"));
    controller.setMobileOpen(true);
    controller.setMobileOpen(true);
    provider.dispatchEvent(new CustomEvent("sidebar:open-mobile"));

    expect(openSubscriber).toHaveBeenCalledTimes(1);
    expect(mobileOpenSubscriber).toHaveBeenCalledTimes(1);
  });

  it("initializes desktop and mobile defaults from options and raw attributes without emitting", () => {
    const setups = [
      () => ({
        options: { defaultMobileOpen: true, defaultOpen: false },
        provider: renderSidebar(),
      }),
      () => ({
        options: {},
        provider: renderSidebar({
          defaultMobileOpen: true,
          defaultMobileOpenAttribute: true,
          defaultOpen: false,
          defaultOpenAttribute: false,
          mobileOpenAttribute: false,
          stateAttribute: "expanded",
        }),
      }),
    ];

    for (const setup of setups) {
      document.body.innerHTML = "";
      mockMatchMedia(true);
      const { options, provider } = setup();
      const onOpenChange = vi.fn();
      const onMobileOpenChange = vi.fn();
      const openListener = vi.fn();
      const mobileOpenListener = vi.fn();
      provider.addEventListener("starwind:sidebar-change", openListener);
      provider.addEventListener("starwind:sidebar-mobile-change", mobileOpenListener);

      const controller = createSidebarController(provider, {
        ...options,
        onMobileOpenChange,
        onOpenChange,
      });

      expect(controller.isOpen()).toBe(false);
      expect(controller.isMobileOpen()).toBe(true);
      expect(provider.getAttribute("data-state")).toBe("collapsed");
      expect(provider.getAttribute("data-mobile-open")).toBe("true");
      expect(getSidebar().getAttribute("data-state")).toBe("collapsed");
      expect(getTrigger().getAttribute("aria-expanded")).toBe("true");
      expect(getRail().getAttribute("aria-expanded")).toBe("true");
      expect(onOpenChange).not.toHaveBeenCalled();
      expect(onMobileOpenChange).not.toHaveBeenCalled();
      expect(openListener).not.toHaveBeenCalled();
      expect(mobileOpenListener).not.toHaveBeenCalled();

      controller.destroy();
    }
  });

  it("requests desktop state changes without committing controlled open state", () => {
    mockMatchMedia(false);
    const provider = renderSidebar();
    const onOpenChange = vi.fn();
    const controller = createSidebarController(provider, { onOpenChange, open: true });

    getTrigger().click();

    expect(onOpenChange).toHaveBeenLastCalledWith(
      false,
      expect.objectContaining({
        open: false,
        previousOpen: true,
        reason: "trigger-click",
        state: "collapsed",
      }),
    );
    expect(controller.isOpen()).toBe(true);
    expect(provider.getAttribute("data-state")).toBe("expanded");
    expect(getSidebar().getAttribute("data-state")).toBe("expanded");

    controller.setOpen(false, { emit: false });

    expect(onOpenChange).toHaveBeenCalledTimes(1);
    expect(controller.isOpen()).toBe(false);
    expect(provider.getAttribute("data-state")).toBe("collapsed");
    expect(getSidebar().getAttribute("data-state")).toBe("collapsed");
  });

  it("does not emit controlled desktop changes for same-value requests", () => {
    mockMatchMedia(false);
    const provider = renderSidebar();
    const onOpenChange = vi.fn();
    const controller = createSidebarController(provider, { onOpenChange, open: true });

    controller.setOpen(true);
    provider.dispatchEvent(new CustomEvent("sidebar:open"));

    expect(onOpenChange).not.toHaveBeenCalled();

    controller.setOpen(false, { emit: false });
    controller.setOpen(false);
    provider.dispatchEvent(new CustomEvent("sidebar:close"));

    expect(onOpenChange).not.toHaveBeenCalled();
  });

  it("uses the keyboard shortcut but ignores editable targets", () => {
    mockMatchMedia(false);
    const provider = renderSidebar();
    const input = document.createElement("input");
    provider.append(input);
    const listener = vi.fn();
    provider.addEventListener("starwind:sidebar-change", listener);
    const controller = createSidebarController(provider);

    input.dispatchEvent(new KeyboardEvent("keydown", { bubbles: true, ctrlKey: true, key: "b" }));

    expect(controller.isOpen()).toBe(true);

    document.dispatchEvent(
      new KeyboardEvent("keydown", { bubbles: true, ctrlKey: true, key: "b" }),
    );

    expect(controller.isOpen()).toBe(false);
    expect(listener).toHaveBeenLastCalledWith(
      expect.objectContaining({
        detail: expect.objectContaining({ reason: "keyboard-shortcut" }),
      }),
    );
    expect(
      "trigger" in
        (listener.mock.calls.at(-1)?.[0] as CustomEvent<SidebarOpenChangeDetails>).detail,
    ).toBe(false);
  });

  it("opens the mobile drawer and closes mobile state on desktop resize", () => {
    const matchMedia = mockMatchMedia(true);
    const provider = renderSidebar();
    const mobileSheet = getMobileSheet();
    const mobileDrawer = createDrawer(mobileSheet);
    const mobilePopup = getMobilePopup();

    const controller = createSidebarController(provider);

    getTrigger().click();

    expect(controller.isMobileOpen()).toBe(true);
    expect(mobileDrawer.getOpen()).toBe(true);
    expect(provider.getAttribute("data-mobile-open")).toBe("true");
    expect(mobileSheet.getAttribute("data-state")).toBe("open");
    expect(mobilePopup.getAttribute("data-state")).toBe("open");
    expect(controller.isOpen()).toBe(true);

    matchMedia.setMatches(false);
    window.dispatchEvent(new Event("resize"));

    expect(controller.isMobileOpen()).toBe(false);
    expect(mobileDrawer.getOpen()).toBe(false);
    expect(provider.getAttribute("data-mobile-open")).toBe("false");
    expect(mobileSheet.getAttribute("data-state")).toBe("closed");
    expect(mobilePopup.getAttribute("data-state")).toBe("closed");
  });

  it("requests mobile state changes without committing controlled mobile open state", () => {
    mockMatchMedia(true);
    const provider = renderSidebar();
    const mobileSheet = getMobileSheet();
    const mobileDrawer = createDrawer(mobileSheet);
    const onMobileOpenChange = vi.fn();
    const controller = createSidebarController(provider, {
      mobileOpen: false,
      onMobileOpenChange,
    });

    getTrigger().click();

    expect(onMobileOpenChange).toHaveBeenLastCalledWith(
      true,
      expect.objectContaining({
        open: true,
        previousOpen: false,
        reason: "trigger-click",
      }),
    );
    expect(controller.isMobileOpen()).toBe(false);
    expect(provider.getAttribute("data-mobile-open")).toBe("false");
    expect(mobileDrawer.getOpen()).toBe(false);

    controller.setMobileOpen(true, { emit: false });

    expect(controller.isMobileOpen()).toBe(true);
    expect(provider.getAttribute("data-mobile-open")).toBe("true");
    expect(mobileDrawer.getOpen()).toBe(true);

    getMobileCloseButton().click();

    expect(onMobileOpenChange).toHaveBeenLastCalledWith(
      false,
      expect.objectContaining({
        open: false,
        previousOpen: true,
        reason: "mobile-sheet",
      }),
    );
    expect(controller.isMobileOpen()).toBe(true);
    expect(provider.getAttribute("data-mobile-open")).toBe("true");
    expect(mobileDrawer.getOpen()).toBe(false);

    controller.setMobileOpen(false, { emit: false });

    expect(controller.isMobileOpen()).toBe(false);
    expect(provider.getAttribute("data-mobile-open")).toBe("false");
  });

  it("does not emit controlled mobile changes for same-value requests or sheet reflections", () => {
    mockMatchMedia(true);
    const provider = renderSidebar();
    const mobileSheet = getMobileSheet();
    const mobileDrawer = createDrawer(mobileSheet);
    const onMobileOpenChange = vi.fn();
    const controller = createSidebarController(provider, {
      mobileOpen: false,
      onMobileOpenChange,
    });

    controller.setMobileOpen(false);

    expect(onMobileOpenChange).not.toHaveBeenCalled();

    controller.setMobileOpen(true, { emit: false });

    expect(controller.isMobileOpen()).toBe(true);
    expect(mobileDrawer.getOpen()).toBe(true);
    expect(onMobileOpenChange).not.toHaveBeenCalled();

    mobileSheet.dispatchEvent(
      new CustomEvent("starwind:open-change", {
        bubbles: true,
        detail: { open: true },
      }),
    );

    expect(onMobileOpenChange).not.toHaveBeenCalled();

    controller.setMobileOpen(false, { emit: false });

    expect(controller.isMobileOpen()).toBe(false);
    expect(mobileDrawer.getOpen()).toBe(false);
    expect(onMobileOpenChange).not.toHaveBeenCalled();
  });

  it("synchronizes uncontrolled mobile state when the drawer closes itself", () => {
    mockMatchMedia(true);
    const provider = renderSidebar();
    const mobileDrawer = createDrawer(getMobileSheet());
    const controller = createSidebarController(provider);

    getTrigger().click();
    getMobileCloseButton().click();

    expect(mobileDrawer.getOpen()).toBe(false);
    expect(controller.isMobileOpen()).toBe(false);
    expect(provider.getAttribute("data-mobile-open")).toBe("false");

    getTrigger().click();

    expect(mobileDrawer.getOpen()).toBe(true);
    expect(controller.isMobileOpen()).toBe(true);
  });

  it("handles mobile imperative custom events and subscriptions", () => {
    mockMatchMedia(true);
    const provider = renderSidebar();
    const mobileDrawer = createDrawer(getMobileSheet());
    const controller = createSidebarController(provider);
    const subscriber = vi.fn();
    const listener = vi.fn();
    controller.subscribe("mobileOpenChange", subscriber);
    provider.addEventListener("starwind:sidebar-mobile-change", listener);

    provider.dispatchEvent(new CustomEvent("sidebar:open-mobile"));

    expect(controller.isMobileOpen()).toBe(true);
    expect(mobileDrawer.getOpen()).toBe(true);
    expect(provider.getAttribute("data-mobile-open")).toBe("true");
    expect(subscriber).toHaveBeenLastCalledWith(
      expect.objectContaining({ open: true, previousOpen: false, reason: "imperative-event" }),
    );
    expect(listener).toHaveBeenLastCalledWith(
      expect.objectContaining({
        detail: expect.objectContaining({
          open: true,
          previousOpen: false,
          reason: "imperative-event",
        }),
      }),
    );

    provider.dispatchEvent(new CustomEvent("sidebar:close-mobile"));

    expect(controller.isMobileOpen()).toBe(false);
    expect(mobileDrawer.getOpen()).toBe(false);
    expect(subscriber).toHaveBeenLastCalledWith(
      expect.objectContaining({ open: false, previousOpen: true, reason: "imperative-event" }),
    );

    provider.dispatchEvent(new CustomEvent("sidebar:toggle-mobile"));

    expect(controller.isMobileOpen()).toBe(true);
    expect(mobileDrawer.getOpen()).toBe(true);
    expect(subscriber).toHaveBeenLastCalledWith(
      expect.objectContaining({ open: true, previousOpen: false, reason: "imperative-event" }),
    );
  });

  it("keeps desktop persistence disabled by default", () => {
    mockMatchMedia(false);
    window.localStorage.clear();
    const provider = renderSidebar();
    const controller = createSidebarController(provider);

    controller.setOpen(false);

    expect(window.localStorage.getItem("starwind-sidebar-open")).toBeNull();
  });

  it("resolves nested asChild sidebar controls before syncing state attributes", () => {
    mockMatchMedia(false);
    const provider = renderSidebar();
    const wrapper = document.createElement("div");
    wrapper.setAttribute("data-sw-sidebar-menu-button", "");
    wrapper.setAttribute("data-as-child", "");
    wrapper.innerHTML = `
      <div data-as-child>
        <a id="nested-menu-button" href="#">Nested Inbox</a>
      </div>
    `;
    getSidebar().append(wrapper);

    createSidebarController(provider);

    const nestedButton = document.querySelector<HTMLElement>("#nested-menu-button")!;
    expect(nestedButton.hasAttribute("data-sw-sidebar-menu-button")).toBe(true);
    expect(nestedButton.getAttribute("data-sidebar-state")).toBe("expanded");
    expect(wrapper.hasAttribute("data-sw-sidebar-menu-button")).toBe(false);
    expect(wrapper.style.display).toBe("contents");
    expect((wrapper.firstElementChild as HTMLElement).style.display).toBe("contents");
  });

  it("persists desktop state through localStorage when opted in", () => {
    mockMatchMedia(false);
    window.localStorage.clear();
    const storageKey = "starwind-sidebar-test-local";
    const firstProvider = renderSidebar();
    const firstController = createSidebarController(firstProvider, {
      persistOpen: true,
      persistenceKey: storageKey,
      persistenceStorage: "localStorage",
    });

    firstController.setOpen(false);

    expect(window.localStorage.getItem(storageKey)).toBe("false");

    firstController.destroy();
    firstProvider.remove();

    const secondProvider = renderSidebar();
    const secondController = createSidebarController(secondProvider, {
      persistOpen: true,
      persistenceKey: storageKey,
      persistenceStorage: "localStorage",
    });

    expect(secondController.isOpen()).toBe(false);
    expect(secondProvider.getAttribute("data-state")).toBe("collapsed");
  });

  it("persists desktop state through cookies when opted in", () => {
    mockMatchMedia(false);
    const storageKey = "starwind_sidebar_test_cookie";
    document.cookie = `${storageKey}=; Max-Age=0; path=/`;
    const firstProvider = renderSidebar();
    const firstController = createSidebarController(firstProvider, {
      persistOpen: true,
      persistenceKey: storageKey,
      persistenceStorage: "cookie",
    });

    firstController.setOpen(false);

    expect(document.cookie).toContain(`${storageKey}=false`);

    firstController.destroy();
    firstProvider.remove();

    const secondProvider = renderSidebar();
    const secondController = createSidebarController(secondProvider, {
      persistOpen: true,
      persistenceKey: storageKey,
      persistenceStorage: "cookie",
    });

    expect(secondController.isOpen()).toBe(false);

    document.cookie = `${storageKey}=; Max-Age=0; path=/`;
  });

  it("ignores persistence storage failures", () => {
    mockMatchMedia(false);
    const storage = {
      getItem() {
        throw new Error("blocked storage");
      },
      setItem() {
        throw new Error("blocked storage");
      },
    } as unknown as Storage;
    const provider = renderSidebar();
    const controller = createSidebarController(provider, {
      persistOpen: true,
      persistenceStorage: storage,
    });

    expect(() => controller.setOpen(false)).not.toThrow();
    expect(controller.isOpen()).toBe(false);
  });

  it("persists controlled desktop state only after opt-in sync commits", () => {
    mockMatchMedia(false);
    window.localStorage.clear();
    const storageKey = "starwind-sidebar-test-controlled";
    const firstProvider = renderSidebar();
    const firstController = createSidebarController(firstProvider, {
      open: true,
      persistenceKey: storageKey,
      persistenceStorage: "localStorage",
    });

    firstController.setOpen(false);
    firstController.setOpen(false, { emit: false });

    expect(window.localStorage.getItem(storageKey)).toBeNull();

    firstController.destroy();
    firstProvider.remove();

    const secondProvider = renderSidebar();
    const secondController = createSidebarController(secondProvider, {
      open: true,
      persistOpen: true,
      persistenceKey: storageKey,
      persistenceStorage: "localStorage",
    });

    secondController.setOpen(false);

    expect(window.localStorage.getItem(storageKey)).toBe("true");

    secondController.setOpen(false, { emit: false });

    expect(window.localStorage.getItem(storageKey)).toBe("false");
  });

  it("clears global tooltip gating when a collapsed controller is destroyed", () => {
    mockMatchMedia(false);
    const provider = renderSidebar({ defaultOpen: false });
    const controller = createSidebarController(provider);

    expect(document.documentElement.getAttribute("data-starwind-sidebar-tooltips")).toBe("enabled");

    controller.destroy();

    expect(document.documentElement.hasAttribute("data-starwind-sidebar-tooltips")).toBe(false);
  });

  it("initializes sidebars in a root through initSidebarController", () => {
    mockMatchMedia(false);
    const provider = renderSidebar();

    const cleanup = initSidebarController(document);

    getTrigger().click();

    expect(provider.getAttribute("data-state")).toBe("collapsed");

    cleanup.destroy();
    getTrigger().click();

    expect(provider.getAttribute("data-state")).toBe("collapsed");
  });

  it("initializes raw HTML sidebars through initStarwind", () => {
    mockMatchMedia(false);
    const provider = renderSidebar();

    const cleanup = initStarwind(document);

    getTrigger().click();

    expect(provider.getAttribute("data-state")).toBe("collapsed");

    cleanup.destroy();
  });
});

function renderSidebar(
  options: {
    defaultMobileOpen?: boolean;
    defaultMobileOpenAttribute?: boolean;
    defaultOpen?: boolean;
    defaultOpenAttribute?: boolean;
    mobileOpenAttribute?: boolean;
    stateAttribute?: "collapsed" | "expanded";
  } = {},
): HTMLElement {
  const state =
    options.stateAttribute ?? (options.defaultOpen === false ? "collapsed" : "expanded");
  const mobileOpen = options.mobileOpenAttribute ?? options.defaultMobileOpen ?? false;
  const wrapper = document.createElement("div");
  wrapper.innerHTML = `
    <div
      data-sw-sidebar-provider
      ${
        options.defaultOpenAttribute === undefined
          ? ""
          : `data-default-open="${String(options.defaultOpenAttribute)}"`
      }
      ${
        options.defaultMobileOpenAttribute === undefined
          ? ""
          : `data-default-mobile-open="${String(options.defaultMobileOpenAttribute)}"`
      }
      data-state="${state}"
      data-mobile-open="${mobileOpen ? "true" : "false"}"
      data-keyboard-shortcut="b"
    >
      <div
        data-sw-sidebar
        data-state="${state}"
        data-collapsible="${state === "collapsed" ? "icon" : ""}"
        data-collapsible-mode="icon"
        data-side="left"
        data-slot="sidebar"
      >
        <button data-sw-sidebar-trigger type="button">Toggle</button>
        <button data-sw-sidebar-rail type="button">Rail</button>
        <a data-sw-sidebar-menu-button data-tooltip="Inbox">Inbox</a>
      </div>
      <div data-sw-drawer data-slot="sidebar-mobile" data-state="closed">
        <button data-sw-drawer-trigger type="button">Open mobile</button>
        <div data-sw-drawer-backdrop hidden></div>
        <dialog data-sw-drawer-popup>
          <h2 data-sw-drawer-title>Mobile sidebar</h2>
          <p data-sw-drawer-description>Mobile sidebar description</p>
          <button data-sw-drawer-close type="button">Close mobile</button>
        </dialog>
      </div>
    </div>
  `;

  const provider = wrapper.firstElementChild as HTMLElement;
  document.body.append(provider);
  return provider;
}

function getProvider(): HTMLElement {
  return document.querySelector<HTMLElement>("[data-sw-sidebar-provider]")!;
}

function getSidebar(): HTMLElement {
  return getProvider().querySelector<HTMLElement>("[data-sw-sidebar]")!;
}

function getTrigger(): HTMLButtonElement {
  return getProvider().querySelector<HTMLButtonElement>("[data-sw-sidebar-trigger]")!;
}

function getRail(): HTMLButtonElement {
  return getProvider().querySelector<HTMLButtonElement>("[data-sw-sidebar-rail]")!;
}

function getMobileSheet(): HTMLElement {
  return getProvider().querySelector<HTMLElement>('[data-slot="sidebar-mobile"]')!;
}

function getMobilePopup(): HTMLDialogElement {
  return getProvider().querySelector<HTMLDialogElement>("[data-sw-drawer-popup]")!;
}

function getMobileCloseButton(): HTMLButtonElement {
  return getProvider().querySelector<HTMLButtonElement>("[data-sw-drawer-close]")!;
}

function mockMatchMedia(initialMatches: boolean) {
  let matches = initialMatches;
  const listeners = new Set<(event: MediaQueryListEvent) => void>();
  const mediaQueryList = {
    get matches() {
      return matches;
    },
    media: "(max-width: 767.98px)",
    onchange: null,
    addEventListener: (_type: string, listener: (event: MediaQueryListEvent) => void) => {
      listeners.add(listener);
    },
    removeEventListener: (_type: string, listener: (event: MediaQueryListEvent) => void) => {
      listeners.delete(listener);
    },
    addListener: (listener: (event: MediaQueryListEvent) => void) => {
      listeners.add(listener);
    },
    removeListener: (listener: (event: MediaQueryListEvent) => void) => {
      listeners.delete(listener);
    },
    dispatchEvent: () => true,
  } as unknown as MediaQueryList;

  vi.spyOn(window, "matchMedia").mockImplementation(() => mediaQueryList);

  return {
    setMatches(nextMatches: boolean) {
      matches = nextMatches;
      listeners.forEach((listener) =>
        listener({ matches: nextMatches, media: mediaQueryList.media } as MediaQueryListEvent),
      );
    },
  };
}
