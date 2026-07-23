import { beforeEach, describe, expect, it, vi } from "vitest";

import { createDialog } from "../../../src/components/dialog/dialog";
import { createMenu } from "../../../src/components/menu/menu";

describe("createMenu", () => {
  beforeEach(() => {
    document.body.innerHTML = "";
    vi.useRealTimers();
  });

  it("initializes closed by default and opens from trigger interactions", async () => {
    const root = renderMenu();
    const menu = createMenu(root);

    expect(menu.getOpen()).toBe(false);
    expect(document.body.hasAttribute("data-sw-scroll-locked")).toBe(false);
    expect(getPopup().hidden).toBe(true);
    expect(getPopup().getAttribute("role")).toBe("menu");
    expect(getTrigger().getAttribute("aria-haspopup")).toBe("menu");
    expect(getTrigger().getAttribute("aria-controls")).toBe(getPopup().id);
    expect(getTrigger().getAttribute("aria-expanded")).toBe("false");
    expect(getPopup().getAttribute("data-state")).toBe("closed");

    getTrigger().click();
    await waitForFloatingPosition();

    expect(menu.getOpen()).toBe(true);
    expect(document.body.hasAttribute("data-sw-scroll-locked")).toBe(false);
    expect(getPopup().hidden).toBe(false);
    expect(getTrigger().getAttribute("aria-expanded")).toBe("true");
    expect(getTrigger().getAttribute("data-state")).toBe("open");
    expect(getPopup().getAttribute("data-state")).toBe("open");
    expect(getPopup().style.position).toBe("fixed");
    expect(getPopup().style.left).not.toBe("");
    expect(getPopup().style.top).not.toBe("");

    getTrigger().dispatchEvent(new KeyboardEvent("keydown", { bubbles: true, key: "ArrowDown" }));
    await waitForFloatingPosition();

    expect(document.activeElement).toBe(getItems()[0]);
    expect(getItems()[0].getAttribute("tabindex")).toBe("0");
  });

  it("opens initially from defaultOpen options and raw data-default-open without emitting", async () => {
    const optionRoot = renderMenu();
    const optionPopup = getMenuPopup(optionRoot);
    const optionTrigger = getMenuTrigger(optionRoot);
    const onOpenChange = vi.fn();
    const optionDomListener = vi.fn();
    optionRoot.addEventListener("starwind:open-change", optionDomListener);

    const optionMenu = createMenu(optionRoot, { defaultOpen: true, onOpenChange });

    await waitForFloatingPosition();

    expect(optionMenu.getOpen()).toBe(true);
    expect(optionPopup.hidden).toBe(false);
    expect(optionRoot.getAttribute("data-state")).toBe("open");
    expect(optionPopup.getAttribute("data-state")).toBe("open");
    expect(optionTrigger.getAttribute("aria-expanded")).toBe("true");
    expect(onOpenChange).not.toHaveBeenCalled();
    expect(optionDomListener).not.toHaveBeenCalled();

    document.body.innerHTML = "";

    const rawRoot = renderMenu();
    rawRoot.setAttribute("data-default-open", "true");
    const rawPopup = getMenuPopup(rawRoot);
    const rawTrigger = getMenuTrigger(rawRoot);
    const rawDomListener = vi.fn();
    rawRoot.addEventListener("starwind:open-change", rawDomListener);

    const rawMenu = createMenu(rawRoot);

    await waitForFloatingPosition();

    expect(rawMenu.getOpen()).toBe(true);
    expect(rawPopup.hidden).toBe(false);
    expect(rawRoot.getAttribute("data-state")).toBe("open");
    expect(rawPopup.getAttribute("data-state")).toBe("open");
    expect(rawTrigger.getAttribute("aria-expanded")).toBe("true");
    expect(rawDomListener).not.toHaveBeenCalled();
  });

  it("locks body scroll only when modal is enabled", async () => {
    const root = renderMenu({ modal: true });
    const menu = createMenu(root);

    expect(document.body.hasAttribute("data-sw-scroll-locked")).toBe(false);

    getTrigger().click();
    await waitForFloatingPosition();

    expect(menu.getOpen()).toBe(true);
    expect(document.body.hasAttribute("data-sw-scroll-locked")).toBe(true);

    getItems()[0].click();

    expect(menu.getOpen()).toBe(false);
    expect(document.body.hasAttribute("data-sw-scroll-locked")).toBe(false);
  });

  it("does not lock body scroll when modal markup is explicitly false", async () => {
    const root = renderMenu();
    root.setAttribute("data-modal", "false");
    const menu = createMenu(root);

    getTrigger().click();
    await waitForFloatingPosition();

    expect(menu.getOpen()).toBe(true);
    expect(document.body.hasAttribute("data-sw-scroll-locked")).toBe(false);
  });

  it("releases an opt-in modal lock when an open menu is destroyed", () => {
    const menu = createMenu(renderMenu({ modal: true }));

    menu.setOpen(true, { emit: false });

    expect(document.body.hasAttribute("data-sw-scroll-locked")).toBe(true);

    menu.destroy();

    expect(document.body.hasAttribute("data-sw-scroll-locked")).toBe(false);
  });

  it("keeps an existing document lock active after an opt-in modal menu closes", () => {
    const externalRoot = renderMenu({ modal: true });
    const menuRoot = renderMenu({ modal: true });
    const externalMenu = createMenu(externalRoot);
    const menu = createMenu(menuRoot);

    externalMenu.setOpen(true, { emit: false });
    menu.setOpen(true, { emit: false });

    expect(document.body.hasAttribute("data-sw-scroll-locked")).toBe(true);

    menu.setOpen(false, { emit: false });

    expect(document.body.hasAttribute("data-sw-scroll-locked")).toBe(true);

    externalMenu.setOpen(false, { emit: false });

    expect(document.body.hasAttribute("data-sw-scroll-locked")).toBe(false);
  });

  it("locks body scroll when a controlled modal menu syncs a non-hover open request", async () => {
    const root = renderMenu({ modal: true });
    const menu = createMenu(root, { modal: true, open: false });

    getTrigger().click();
    menu.setOpen(true, { emit: false });
    await waitForFloatingPosition();

    expect(menu.getOpen()).toBe(true);
    expect(document.body.hasAttribute("data-sw-scroll-locked")).toBe(true);

    menu.setOpen(false, { emit: false });

    expect(document.body.hasAttribute("data-sw-scroll-locked")).toBe(false);
  });

  it("does not lock body scroll for hover-opened menus even when modal is enabled", async () => {
    const root = renderMenu({ modal: true, openOnHover: true });

    createMenu(root);
    getTrigger().dispatchEvent(
      new PointerEvent("pointerenter", { bubbles: true, pointerType: "mouse" }),
    );
    await waitForFloatingPosition();

    expect(getPopup().hidden).toBe(false);
    expect(document.body.hasAttribute("data-sw-scroll-locked")).toBe(false);
  });

  it("does not release another menu lock after hover-opening a modal menu", async () => {
    const externalRoot = renderMenu({ modal: true });
    const hoverRoot = renderMenu({ modal: true, openOnHover: true });
    const externalMenu = createMenu(externalRoot);
    const hoverMenu = createMenu(hoverRoot);
    const hoverTrigger = hoverRoot.querySelector<HTMLElement>("[data-sw-menu-trigger]")!;
    const hoverPopup = hoverRoot.querySelector<HTMLElement>("[data-sw-menu-popup]")!;

    externalMenu.setOpen(true, { emit: false });
    hoverTrigger.dispatchEvent(
      new PointerEvent("pointerenter", { bubbles: true, pointerType: "mouse" }),
    );
    await waitForFloatingPosition();

    expect(hoverPopup.hidden).toBe(false);
    expect(document.body.hasAttribute("data-sw-scroll-locked")).toBe(true);

    hoverMenu.setOpen(false, { emit: false });

    expect(document.body.hasAttribute("data-sw-scroll-locked")).toBe(true);

    externalMenu.setOpen(false, { emit: false });

    expect(document.body.hasAttribute("data-sw-scroll-locked")).toBe(false);
  });

  it("preserves hover-open no-lock behavior when controlled open state is applied", async () => {
    const root = renderMenu({ modal: true, openOnHover: true });
    const menu = createMenu(root, { modal: true, open: false, openOnHover: true });

    getTrigger().dispatchEvent(
      new PointerEvent("pointerenter", { bubbles: true, pointerType: "mouse" }),
    );
    menu.setOpen(true, { emit: false });
    await waitForFloatingPosition();

    expect(getPopup().hidden).toBe(false);
    expect(document.body.hasAttribute("data-sw-scroll-locked")).toBe(false);
  });

  it("uses closeDelay for hover exits and cancels pending close on re-enter", async () => {
    vi.useFakeTimers();
    const root = renderMenu({ closeDelay: 50, openOnHover: true });
    const trigger = getMenuTrigger(root);
    const popup = getMenuPopup(root);
    const menu = createMenu(root);

    dispatchMousePointer(trigger, "pointerenter");

    expect(menu.getOpen()).toBe(true);
    expect(popup.hidden).toBe(false);

    dispatchMousePointer(trigger, "pointerleave");
    await vi.advanceTimersByTimeAsync(49);

    expect(menu.getOpen()).toBe(true);
    expect(popup.hidden).toBe(false);

    dispatchMousePointer(popup, "pointerenter");
    await vi.advanceTimersByTimeAsync(50);

    expect(menu.getOpen()).toBe(true);
    expect(popup.hidden).toBe(false);

    dispatchMousePointer(popup, "pointerleave");
    await vi.advanceTimersByTimeAsync(50);

    expect(menu.getOpen()).toBe(false);
    expect(popup.hidden).toBe(true);
  });

  it("keeps disabled menus closed across click, keyboard, and hover trigger paths", () => {
    for (const source of ["options", "markup"] as const) {
      document.body.innerHTML = "";
      const root = renderMenu({ openOnHover: true });
      const trigger = getMenuTrigger(root);
      const listener = vi.fn();
      root.addEventListener("starwind:open-change", listener);
      if (source === "markup") {
        root.setAttribute("data-disabled", "");
      }

      const menu = createMenu(root, {
        ...(source === "options" ? { disabled: true } : {}),
        openOnHover: true,
      });

      trigger.click();
      trigger.dispatchEvent(new KeyboardEvent("keydown", { bubbles: true, key: "Enter" }));
      dispatchMousePointer(trigger, "pointerenter");

      expect(menu.getOpen()).toBe(false);
      expect(getMenuPopup(root).hidden).toBe(true);
      expect(trigger.getAttribute("aria-expanded")).toBe("false");
      expect(listener).not.toHaveBeenCalled();
    }
  });

  it("keeps the popup attached to the trigger while scroll changes its rect", async () => {
    const root = renderMenu();
    const trigger = getTrigger();
    const popup = getPopup();
    let triggerLeft = window.innerWidth - 24;

    mockRect(trigger, () => ({
      height: 30,
      width: 20,
      x: triggerLeft,
      y: 100,
    }));
    popup.style.width = "160px";
    popup.style.height = "80px";

    createMenu(root);
    trigger.click();
    await waitForFloatingPosition();

    expect(popup.style.left).toBe(`${triggerLeft + 20 - 160}px`);
    expect(popup.getAttribute("data-side")).toBe("bottom");
    expect(popup.getAttribute("data-align")).toBe("end");

    triggerLeft = 80;
    dispatchScrollUpdate();
    await waitForFloatingPosition();

    expect(popup.style.left).toBe("80px");
    expect(popup.getAttribute("data-side")).toBe("bottom");
    expect(popup.getAttribute("data-align")).toBe("start");
  });

  it("resolves asChild trigger wrappers to the child control", async () => {
    const root = renderMenuWithAsChildTrigger();
    const listener = vi.fn();
    root.addEventListener("starwind:open-change", listener);
    const wrapper = document.querySelector<HTMLElement>("#as-child-wrapper")!;
    const trigger = document.querySelector<HTMLButtonElement>("#as-child-trigger")!;

    const menu = createMenu(root);

    expect(trigger.hasAttribute("data-sw-menu-trigger")).toBe(true);
    expect(trigger.classList.contains("starwind-dropdown-trigger")).toBe(true);
    expect(trigger.getAttribute("aria-haspopup")).toBe("menu");
    expect(trigger.getAttribute("aria-controls")).toBe(getPopup().id);
    expect(getPopup().getAttribute("aria-labelledby")).toBe(trigger.id);
    expect(wrapper.hasAttribute("data-sw-menu-trigger")).toBe(false);
    expect(wrapper.style.display).toBe("contents");

    trigger.click();
    await waitForFloatingPosition();

    expect(menu.getOpen()).toBe(true);
    expect(getPopup().hidden).toBe(false);
    expect(trigger.getAttribute("aria-expanded")).toBe("true");
    expect(listener).toHaveBeenCalledWith(
      expect.objectContaining({
        detail: expect.objectContaining({ open: true, reason: "trigger-press", trigger }),
      }),
    );
  });

  it("resolves nested asChild trigger wrappers to the final child control", async () => {
    const root = renderMenuWithNestedAsChildTrigger();
    const outerWrapper = document.querySelector<HTMLElement>("#as-child-wrapper")!;
    const innerWrapper = document.querySelector<HTMLElement>("#nested-as-child-wrapper")!;
    const trigger = document.querySelector<HTMLButtonElement>("#as-child-trigger")!;

    const menu = createMenu(root);

    expect(trigger.hasAttribute("data-sw-menu-trigger")).toBe(true);
    expect(trigger.getAttribute("data-slot")).toBe("dropdown-trigger");
    expect(trigger.getAttribute("aria-haspopup")).toBe("menu");
    expect(trigger.getAttribute("aria-controls")).toBe(getPopup().id);
    expect(getPopup().getAttribute("aria-labelledby")).toBe(trigger.id);
    expect(outerWrapper.hasAttribute("data-sw-menu-trigger")).toBe(false);
    expect(innerWrapper.hasAttribute("data-sw-menu-trigger")).toBe(false);
    expect(outerWrapper.style.display).toBe("contents");
    expect(innerWrapper.style.display).toBe("contents");

    trigger.click();
    await waitForFloatingPosition();

    expect(menu.getOpen()).toBe(true);
    expect(trigger.getAttribute("aria-expanded")).toBe("true");
    expect(trigger.getAttribute("data-state")).toBe("open");
  });

  it("allows onOpenChange details cancellation before Menu state changes", () => {
    const root = renderMenu();
    const canceledSnapshots: boolean[] = [];
    let callbackDetails: unknown;
    let eventDetails: unknown;
    const onOpenChange = vi.fn((_open, details) => {
      callbackDetails = details;
      canceledSnapshots.push(details.isCanceled);
      details.cancel();
      canceledSnapshots.push(details.isCanceled);
    });
    const openChangeListener = vi.fn((event: Event) => {
      eventDetails = (event as CustomEvent).detail;
    });
    root.addEventListener("starwind:open-change", openChangeListener);

    const menu = createMenu(root, { onOpenChange });
    const subscriber = vi.fn();
    menu.subscribe("openChange", subscriber);
    getTrigger().click();

    expect(onOpenChange).toHaveBeenCalledWith(
      true,
      expect.objectContaining({
        isCanceled: true,
        open: true,
        reason: "trigger-press",
      }),
    );
    expect(canceledSnapshots).toEqual([false, true]);
    expect(openChangeListener).toHaveBeenCalledTimes(1);
    expect(eventDetails).toBe(callbackDetails);
    expect(subscriber).not.toHaveBeenCalled();
    expect(menu.getOpen()).toBe(false);
    expect(getPopup().hidden).toBe(true);
    expect(getTrigger().getAttribute("aria-expanded")).toBe("false");
  });

  it("allows starwind:open-change preventDefault before Menu state changes", () => {
    const root = renderMenu();
    root.addEventListener("starwind:open-change", (event) => event.preventDefault());

    const menu = createMenu(root);
    const subscriber = vi.fn();
    menu.subscribe("openChange", subscriber);
    getTrigger().click();

    expect(subscriber).not.toHaveBeenCalled();
    expect(menu.getOpen()).toBe(false);
    expect(getPopup().hidden).toBe(true);
    expect(getTrigger().getAttribute("aria-expanded")).toBe("false");
  });

  it("requires root and submenu popup anatomy", () => {
    const missingRootPopup = document.createElement("div");
    missingRootPopup.setAttribute("data-sw-menu", "");
    missingRootPopup.innerHTML = `<button data-sw-menu-trigger>Open menu</button>`;
    document.body.append(missingRootPopup);

    expect(() => createMenu(missingRootPopup)).toThrow(
      "Menu requires a [data-sw-menu-popup] element.",
    );

    document.body.innerHTML = "";

    const missingSubmenuTrigger = renderMenuWithIncompleteSubmenu(`
      <div data-sw-menu-submenu-root>
        <div data-sw-menu-popup>
          <div data-sw-menu-item>Invite team</div>
        </div>
      </div>
    `);

    expect(() => createMenu(missingSubmenuTrigger)).toThrow(
      "Menu submenu requires a [data-sw-menu-submenu-trigger] element.",
    );

    document.body.innerHTML = "";

    const missingSubmenuPopup = renderMenuWithIncompleteSubmenu(`
      <div data-sw-menu-submenu-root>
        <div data-sw-menu-submenu-trigger>More tools</div>
      </div>
    `);

    expect(() => createMenu(missingSubmenuPopup)).toThrow(
      "Menu submenu requires a [data-sw-menu-popup] element.",
    );
  });

  it("skips Astro-injected scripts when resolving asChild trigger wrappers", async () => {
    const root = renderMenuWithAsChildTriggerAndAstroScript();
    const script = document.querySelector<HTMLScriptElement>("#astro-module-script")!;
    const wrapper = document.querySelector<HTMLElement>("#as-child-wrapper")!;
    const trigger = document.querySelector<HTMLButtonElement>("#as-child-trigger")!;

    const menu = createMenu(root);

    expect(script.hasAttribute("data-sw-menu-trigger")).toBe(false);
    expect(trigger.hasAttribute("data-sw-menu-trigger")).toBe(true);
    expect(trigger.getAttribute("aria-haspopup")).toBe("menu");
    expect(wrapper.hasAttribute("data-sw-menu-trigger")).toBe(false);

    trigger.click();
    await waitForFloatingPosition();

    expect(menu.getOpen()).toBe(true);
    expect(getPopup().hidden).toBe(false);
    expect(trigger.getAttribute("aria-expanded")).toBe("true");
  });

  it("closes from item selection, outside interactions, and Escape", async () => {
    const root = renderMenu();
    const listener = vi.fn();
    root.addEventListener("starwind:open-change", listener);

    createMenu(root);
    getTrigger().click();
    await waitForFloatingPosition();
    getItems()[0].focus();
    getItems()[0].click();

    expect(getPopup().hidden).toBe(true);
    expect(document.activeElement).toBe(getTrigger());
    expect(getTrigger().getAttribute("aria-expanded")).toBe("false");
    expect(listener).toHaveBeenCalledWith(
      expect.objectContaining({
        detail: expect.objectContaining({ open: false, reason: "item-press" }),
      }),
    );

    getTrigger().click();
    await waitForFloatingPosition();
    getItems()[0].focus();
    document.body.dispatchEvent(new PointerEvent("pointerdown", { bubbles: true }));

    expect(getPopup().hidden).toBe(true);
    expect(document.activeElement).not.toBe(getTrigger());
    expect(listener).toHaveBeenCalledWith(
      expect.objectContaining({
        detail: expect.objectContaining({ open: false, reason: "outside-press" }),
      }),
    );

    getTrigger().click();
    await waitForFloatingPosition();
    document.dispatchEvent(
      new KeyboardEvent("keydown", { bubbles: true, cancelable: true, key: "Escape" }),
    );

    expect(getPopup().hidden).toBe(true);
    expect(listener).toHaveBeenCalledWith(
      expect.objectContaining({
        detail: expect.objectContaining({ open: false, reason: "escape-key" }),
      }),
    );
  });

  it("owns the first Dialog Escape and keeps the owner open through item selection", () => {
    const dialogRoot = renderDialogOwner();
    const dialogContent = dialogRoot.querySelector<HTMLDialogElement>("[data-sw-dialog-content]")!;
    const menuRoot = renderMenu();
    const menuPopup = menuRoot.querySelector<HTMLElement>("[data-sw-menu-popup]")!;
    const menuItem = menuRoot.querySelector<HTMLElement>("[data-sw-menu-item]")!;
    dialogContent.append(menuRoot);
    const dialog = createDialog(dialogRoot);
    const menu = createMenu(menuRoot);
    dialog.open();
    menu.open();

    expect(dialogContent.open).toBe(true);
    expect(menu.getOpen()).toBe(true);
    expect(menuPopup.closest("[data-sw-floating-portal]:popover-open")).not.toBeNull();

    document.dispatchEvent(
      new KeyboardEvent("keydown", { bubbles: true, cancelable: true, key: "Escape" }),
    );

    expect(menu.getOpen()).toBe(false);
    expect(dialogContent.open).toBe(true);

    document.dispatchEvent(
      new KeyboardEvent("keydown", { bubbles: true, cancelable: true, key: "Escape" }),
    );

    expect(dialogContent.open).toBe(false);

    dialog.open();
    menu.open();
    menuItem.click();

    expect(menu.getOpen()).toBe(false);
    expect(dialogContent.open).toBe(true);

    menu.destroy();
    dialog.destroy();
  });

  it("orders Dialog, root Menu, and submenu Escape ownership without duplicate callbacks", () => {
    const dialogRoot = renderDialogOwner();
    const dialogTrigger = dialogRoot.querySelector<HTMLElement>("[data-sw-dialog-trigger]")!;
    const dialogContent = dialogRoot.querySelector<HTMLDialogElement>("[data-sw-dialog-content]")!;
    const menuRoot = renderMenuWithSubmenu();
    const menuTrigger = menuRoot.querySelector<HTMLElement>("[data-sw-menu-trigger]")!;
    const submenuTrigger = menuRoot.querySelector<HTMLElement>("[data-sw-menu-submenu-trigger]")!;
    const submenuRoot = menuRoot.querySelector<HTMLElement>("[data-sw-menu-submenu-root]")!;
    const rootOpenChanges = vi.fn();
    dialogContent.append(menuRoot);
    const dialog = createDialog(dialogRoot);
    const menu = createMenu(menuRoot, { onOpenChange: rootOpenChanges });
    dialogTrigger.focus();
    dialogTrigger.click();
    menu.open();
    submenuTrigger.click();
    rootOpenChanges.mockClear();

    expect(dialogContent.querySelectorAll("[data-sw-floating-portal]")).toHaveLength(2);
    expect(submenuTrigger.getAttribute("aria-expanded")).toBe("true");

    document.dispatchEvent(
      new KeyboardEvent("keydown", { bubbles: true, cancelable: true, key: "Escape" }),
    );

    expect(submenuRoot.getAttribute("data-state")).toBe("closed");
    expect(submenuTrigger.getAttribute("aria-expanded")).toBe("false");
    expect(menu.getOpen()).toBe(true);
    expect(dialogContent.open).toBe(true);
    expect(document.activeElement).toBe(submenuTrigger);
    expect(rootOpenChanges).not.toHaveBeenCalled();
    expect(dialogContent.querySelectorAll("[data-sw-floating-portal]")).toHaveLength(1);

    document.dispatchEvent(
      new KeyboardEvent("keydown", { bubbles: true, cancelable: true, key: "Escape" }),
    );

    expect(menu.getOpen()).toBe(false);
    expect(dialogContent.open).toBe(true);
    expect(document.activeElement).toBe(menuTrigger);
    expect(rootOpenChanges).toHaveBeenCalledTimes(1);
    expect(rootOpenChanges).toHaveBeenLastCalledWith(
      false,
      expect.objectContaining({ reason: "escape-key" }),
    );
    expect(dialogContent.querySelector("[data-sw-floating-portal]")).toBeNull();

    document.dispatchEvent(
      new KeyboardEvent("keydown", { bubbles: true, cancelable: true, key: "Escape" }),
    );

    expect(dialogContent.open).toBe(false);
    expect(document.activeElement).toBe(dialogTrigger);

    dialogTrigger.focus();
    dialogTrigger.click();
    menu.open();
    submenuTrigger.click();
    rootOpenChanges.mockClear();

    dialog.close();

    expect(menu.getOpen()).toBe(false);
    expect(submenuRoot.getAttribute("data-state")).toBe("closed");
    expect(submenuTrigger.getAttribute("aria-expanded")).toBe("false");
    expect(rootOpenChanges).toHaveBeenCalledTimes(1);
    expect(rootOpenChanges).toHaveBeenLastCalledWith(
      false,
      expect.objectContaining({ reason: "imperative-action" }),
    );
    expect(dialogContent.querySelector("[data-sw-floating-portal]")).toBeNull();
    expect(document.activeElement).toBe(dialogTrigger);

    menu.destroy();
    dialog.destroy();
  });

  it("force-resets an uncontrolled Menu when its Dialog owner close intent is canceled", () => {
    const dialogRoot = renderDialogOwner();
    const dialogContent = dialogRoot.querySelector<HTMLDialogElement>("[data-sw-dialog-content]")!;
    const menuRoot = renderMenu();
    const menuPopup = menuRoot.querySelector<HTMLElement>("[data-sw-menu-popup]")!;
    dialogContent.append(menuRoot);
    menuRoot.addEventListener("starwind:open-change", (event) => {
      if (!(event instanceof CustomEvent) || event.detail.open !== false) return;
      event.preventDefault();
    });
    const dialog = createDialog(dialogRoot);
    const menu = createMenu(menuRoot);
    dialog.open();
    menu.open();

    dialog.close();

    expect(menu.getOpen()).toBe(false);
    expect(menuPopup.getAttribute("data-state")).toBe("closed");
    expect(dialogContent.querySelector("[data-sw-floating-portal]")).toBeNull();

    dialog.open();
    expect(dialogContent.querySelector("[data-sw-floating-portal]")).toBeNull();

    menu.destroy();
    dialog.destroy();
  });

  it("treats non-trigger siblings inside the Menu root as outside interactions", () => {
    const root = renderMenu();
    const rootRemainder = document.createElement("button");
    rootRemainder.type = "button";
    rootRemainder.textContent = "Root remainder";
    root.append(rootRemainder);

    const menu = createMenu(root);
    menu.setOpen(true, { emit: false });

    rootRemainder.dispatchEvent(new PointerEvent("pointerdown", { bubbles: true }));

    expect(menu.getOpen()).toBe(false);
    expect(getPopup().hidden).toBe(true);
  });

  it("keeps the menu open when a regular item disables close on click", async () => {
    const root = renderMenuWithItemCloseOnClickFalse();
    const listener = vi.fn();
    root.addEventListener("starwind:open-change", listener);

    const menu = createMenu(root);
    getTrigger().click();
    await waitForFloatingPosition();

    getItems()[0].click();

    expect(menu.getOpen()).toBe(true);
    expect(getPopup().hidden).toBe(false);
    expect(listener).not.toHaveBeenCalledWith(
      expect.objectContaining({
        detail: expect.objectContaining({ open: false, reason: "item-press" }),
      }),
    );

    getItems()[0].focus();
    getPopup().dispatchEvent(new KeyboardEvent("keydown", { bubbles: true, key: "Enter" }));

    expect(menu.getOpen()).toBe(true);
    expect(getPopup().hidden).toBe(false);
    expect(listener).not.toHaveBeenCalledWith(
      expect.objectContaining({
        detail: expect.objectContaining({ open: false, reason: "item-press" }),
      }),
    );
  });

  it("keeps link items open by default and closes them when requested", async () => {
    const root = renderMenuWithLinkItems();
    getLinkItem("docs").addEventListener("click", (event) => event.preventDefault());
    getLinkItem("settings").addEventListener("click", (event) => event.preventDefault());

    const menu = createMenu(root);
    getTrigger().click();
    await waitForFloatingPosition();

    getLinkItem("docs").click();

    expect(menu.getOpen()).toBe(true);
    expect(getPopup().hidden).toBe(false);

    getLinkItem("settings").click();

    expect(menu.getOpen()).toBe(false);
    expect(getPopup().hidden).toBe(true);
  });

  it("registers global dismissal listeners only while menu instances are open", () => {
    const addListener = vi.spyOn(document, "addEventListener");
    const removeListener = vi.spyOn(document, "removeEventListener");
    try {
      const first = createMenu(renderMenu());
      const second = createMenu(renderMenu());

      expect(getDismissalListenerCalls(addListener)).toHaveLength(0);

      first.setOpen(true, { emit: false });

      expect(getDismissalListenerCalls(addListener).map(([type]) => type)).toEqual([
        "keydown",
        "pointerdown",
      ]);

      second.setOpen(true, { emit: false });

      expect(getDismissalListenerCalls(addListener)).toHaveLength(2);

      removeListener.mockClear();

      first.setOpen(false, { emit: false });

      expect(getDismissalListenerCalls(removeListener)).toHaveLength(0);

      second.setOpen(false, { emit: false });

      expect(getDismissalListenerCalls(removeListener).map(([type]) => type)).toEqual([
        "keydown",
        "pointerdown",
      ]);
    } finally {
      addListener.mockRestore();
      removeListener.mockRestore();
    }
  });

  it("removes global dismissal listeners when an open menu is destroyed", () => {
    const removeListener = vi.spyOn(document, "removeEventListener");
    try {
      const menu = createMenu(renderMenu());

      menu.setOpen(true, { emit: false });
      removeListener.mockClear();

      menu.destroy();

      expect(getDismissalListenerCalls(removeListener).map(([type]) => type)).toEqual([
        "keydown",
        "pointerdown",
      ]);
    } finally {
      removeListener.mockRestore();
    }
  });

  it("lets the topmost menu own Escape focus restoration", () => {
    const firstRoot = renderMenu();
    const secondRoot = renderMenu();
    const firstTrigger = getMenuTrigger(firstRoot);
    const secondTrigger = getMenuTrigger(secondRoot);
    const first = createMenu(firstRoot);
    const second = createMenu(secondRoot);

    first.setOpen(true, { emit: false });
    second.setOpen(true, { emit: false });

    document.dispatchEvent(new KeyboardEvent("keydown", { bubbles: true, key: "Escape" }));

    expect(first.getOpen()).toBe(true);
    expect(second.getOpen()).toBe(false);
    expect(document.activeElement).toBe(secondTrigger);

    document.dispatchEvent(new KeyboardEvent("keydown", { bubbles: true, key: "Escape" }));

    expect(first.getOpen()).toBe(false);
    expect(document.activeElement).toBe(firstTrigger);
  });

  it("lets focused popup Escape close only the topmost menu", () => {
    const firstRoot = renderMenu();
    const secondRoot = renderMenu();
    const firstTrigger = getMenuTrigger(firstRoot);
    const secondTrigger = getMenuTrigger(secondRoot);
    const firstPopup = getMenuPopup(firstRoot);
    const secondPopup = getMenuPopup(secondRoot);
    const first = createMenu(firstRoot);
    const second = createMenu(secondRoot);

    first.setOpen(true, { emit: false });
    second.setOpen(true, { emit: false });
    secondPopup.focus();

    const secondEscape = new KeyboardEvent("keydown", {
      bubbles: true,
      cancelable: true,
      key: "Escape",
    });
    expect(secondPopup.dispatchEvent(secondEscape)).toBe(false);

    expect(first.getOpen()).toBe(true);
    expect(second.getOpen()).toBe(false);
    expect(document.activeElement).toBe(secondTrigger);

    firstPopup.focus();
    const firstEscape = new KeyboardEvent("keydown", {
      bubbles: true,
      cancelable: true,
      key: "Escape",
    });
    expect(firstPopup.dispatchEvent(firstEscape)).toBe(false);

    expect(first.getOpen()).toBe(false);
    expect(document.activeElement).toBe(firstTrigger);
  });

  it("keeps the popup mounted while close animations finish", async () => {
    vi.useFakeTimers();
    const root = renderMenuWithAnimatedPopup();
    const onCloseComplete = vi.fn();
    const closeCompleteListener = vi.fn();
    root.addEventListener("starwind:close-complete", closeCompleteListener);
    const menu = createMenu(root, { onCloseComplete });
    const closeCompleteSubscriber = vi.fn();
    menu.subscribe("closeComplete", closeCompleteSubscriber);

    menu.setOpen(true, { emit: false });

    expect(getPopup().hidden).toBe(false);
    expect(getPopup().parentElement).toBe(document.body);

    getItems()[0].click();

    expect(menu.getOpen()).toBe(false);
    expect(getPopup().getAttribute("data-state")).toBe("closed");
    expect(getPopup().hidden).toBe(false);
    expect(getPopup().parentElement).toBe(document.body);
    expect(closeCompleteListener).not.toHaveBeenCalled();

    await vi.advanceTimersByTimeAsync(199);

    expect(getPopup().hidden).toBe(false);

    await vi.advanceTimersByTimeAsync(1);

    expect(getPopup().hidden).toBe(true);
    expect(getPopup().parentElement).toBe(root);
    const expectedDetails = expect.objectContaining({
      open: false,
      reason: "item-press",
    });
    expect(onCloseComplete).toHaveBeenCalledWith(expectedDetails);
    expect(closeCompleteListener).toHaveBeenCalledWith(
      expect.objectContaining({ detail: expectedDetails }),
    );
    expect(closeCompleteSubscriber).toHaveBeenCalledWith(expectedDetails);
  });

  it("emits close-complete for immediate root closes before the popup has opened", () => {
    const root = renderMenu();
    const onCloseComplete = vi.fn();
    const closeCompleteListener = vi.fn();
    root.addEventListener("starwind:close-complete", closeCompleteListener);
    const menu = createMenu(root, { onCloseComplete });
    const closeCompleteSubscriber = vi.fn();
    menu.subscribe("closeComplete", closeCompleteSubscriber);

    menu.setOpen(false, { emit: false, reason: "imperative-action" });

    const expectedDetails = expect.objectContaining({
      open: false,
      reason: "imperative-action",
    });
    expect(getPopup().hidden).toBe(true);
    expect(getPopup().parentElement).toBe(root);
    expect(onCloseComplete).toHaveBeenCalledWith(expectedDetails);
    expect(closeCompleteListener).toHaveBeenCalledWith(
      expect.objectContaining({ detail: expectedDetails }),
    );
    expect(closeCompleteSubscriber).toHaveBeenCalledWith(expectedDetails);
  });

  it("cancels root close-complete when the menu reopens during close animation", async () => {
    vi.useFakeTimers();
    const root = renderMenuWithAnimatedPopup();
    const closeCompleteListener = vi.fn();
    root.addEventListener("starwind:close-complete", closeCompleteListener);
    const menu = createMenu(root);
    const closeCompleteSubscriber = vi.fn();
    menu.subscribe("closeComplete", closeCompleteSubscriber);

    menu.setOpen(true, { emit: false });
    menu.setOpen(false, { emit: false, reason: "imperative-action" });

    expect(menu.getOpen()).toBe(false);
    expect(getPopup().getAttribute("data-state")).toBe("closed");
    expect(getPopup().hidden).toBe(false);
    expect(getPopup().parentElement).toBe(document.body);

    menu.setOpen(true, { emit: false });

    expect(menu.getOpen()).toBe(true);
    expect(getPopup().getAttribute("data-state")).toBe("open");
    expect(getPopup().hidden).toBe(false);
    expect(getPopup().parentElement).toBe(document.body);

    await vi.advanceTimersByTimeAsync(200);

    expect(getPopup().hidden).toBe(false);
    expect(getPopup().parentElement).toBe(document.body);
    expect(closeCompleteListener).not.toHaveBeenCalled();
    expect(closeCompleteSubscriber).not.toHaveBeenCalled();
  });

  it("cleans up root lifecycle without close-complete when destroyed during close animation", async () => {
    vi.useFakeTimers();
    const root = renderMenuWithAnimatedPopup({ modal: true });
    const onCloseComplete = vi.fn();
    const closeCompleteListener = vi.fn();
    root.addEventListener("starwind:close-complete", closeCompleteListener);
    const menu = createMenu(root, { onCloseComplete });
    const closeCompleteSubscriber = vi.fn();
    menu.subscribe("closeComplete", closeCompleteSubscriber);

    menu.setOpen(true, { emit: false });

    expect(document.body.hasAttribute("data-sw-scroll-locked")).toBe(true);
    expect(getPopup().hidden).toBe(false);
    expect(getPopup().parentElement).toBe(document.body);

    menu.setOpen(false, { emit: false, reason: "imperative-action" });

    expect(getPopup().hidden).toBe(false);
    expect(getPopup().parentElement).toBe(document.body);

    menu.destroy();

    expect(document.body.hasAttribute("data-sw-scroll-locked")).toBe(false);
    expect(getPopup().hidden).toBe(true);
    expect(getPopup().parentElement).toBe(root);
    expect(onCloseComplete).not.toHaveBeenCalled();
    expect(closeCompleteListener).not.toHaveBeenCalled();
    expect(closeCompleteSubscriber).not.toHaveBeenCalled();

    await vi.advanceTimersByTimeAsync(200);

    expect(document.body.hasAttribute("data-sw-scroll-locked")).toBe(false);
    expect(getPopup().hidden).toBe(true);
    expect(getPopup().parentElement).toBe(root);
    expect(onCloseComplete).not.toHaveBeenCalled();
    expect(closeCompleteListener).not.toHaveBeenCalled();
    expect(closeCompleteSubscriber).not.toHaveBeenCalled();
  });

  it("opens and closes from imperative methods while preserving portal cleanup", async () => {
    vi.useFakeTimers();
    const root = renderMenuWithAnimatedPopup();
    const popup = getPopup();
    const menu = createMenu(root);

    menu.open();

    expect(menu.getOpen()).toBe(true);
    expect(popup.hidden).toBe(false);
    expect(popup.parentElement).toBe(document.body);

    menu.close();

    expect(menu.getOpen()).toBe(false);
    expect(popup.hidden).toBe(false);
    expect(popup.parentElement).toBe(document.body);

    await vi.advanceTimersByTimeAsync(200);

    expect(popup.hidden).toBe(true);
    expect(popup.parentElement).toBe(root);

    menu.open();

    expect(menu.getOpen()).toBe(true);
    expect(popup.hidden).toBe(false);
    expect(popup.parentElement).toBe(document.body);

    menu.destroy();

    expect(menu.getOpen()).toBe(false);
    expect(popup.hidden).toBe(true);
    expect(popup.parentElement).toBe(root);
  });

  it("tracks highlighted items for keyboard and pointer movement", async () => {
    const root = renderMenu();

    createMenu(root);
    getTrigger().click();
    await waitForFloatingPosition();

    getPopup().dispatchEvent(new KeyboardEvent("keydown", { bubbles: true, key: "ArrowDown" }));

    expect(getItems()[0].hasAttribute("data-highlighted")).toBe(true);
    expect(getItems()[0].getAttribute("tabindex")).toBe("0");
    expect(document.activeElement).toBe(getItems()[0]);
    expect(getItems()[1].hasAttribute("data-highlighted")).toBe(false);

    getItems()[1].dispatchEvent(
      new PointerEvent("pointermove", { bubbles: true, pointerType: "mouse" }),
    );

    expect(getItems()[0].hasAttribute("data-highlighted")).toBe(false);
    expect(getItems()[0].getAttribute("tabindex")).toBe("-1");
    expect(getItems()[1].hasAttribute("data-highlighted")).toBe(true);
    expect(getItems()[1].getAttribute("tabindex")).toBe("0");
    expect(document.activeElement).toBe(getItems()[1]);
  });

  it("limits large-list pointer highlight mutations to the previous and next items", async () => {
    const root = renderLargeMenu(160, { disabledIndex: 90 });
    const popup = getMenuPopup(root);
    const items = getItems();

    createMenu(root);
    getMenuTrigger(root).click();
    await waitForFloatingPosition();

    items[20]!.dispatchEvent(
      new PointerEvent("pointermove", { bubbles: true, pointerType: "mouse" }),
    );

    expect(items[20]!.hasAttribute("data-highlighted")).toBe(true);
    expect(items[20]!.getAttribute("tabindex")).toBe("0");

    const changedTargets = await collectHighlightAttributeTargets(popup, () => {
      items[80]!.dispatchEvent(
        new PointerEvent("pointermove", { bubbles: true, pointerType: "mouse" }),
      );
    });

    expect(items[20]!.hasAttribute("data-highlighted")).toBe(false);
    expect(items[20]!.getAttribute("tabindex")).toBe("-1");
    expect(items[80]!.hasAttribute("data-highlighted")).toBe(true);
    expect(items[80]!.getAttribute("tabindex")).toBe("0");
    expect(changedTargets).toEqual(new Set([items[20], items[80]]));

    const noOpTargets = await collectHighlightAttributeTargets(popup, () => {
      items[80]!.dispatchEvent(
        new PointerEvent("pointermove", { bubbles: true, pointerType: "mouse" }),
      );
    });

    expect(noOpTargets.size).toBe(0);
    expect(items[80]!.hasAttribute("data-highlighted")).toBe(true);

    const disabledTargets = await collectHighlightAttributeTargets(popup, () => {
      items[90]!.dispatchEvent(
        new PointerEvent("pointermove", { bubbles: true, pointerType: "mouse" }),
      );
    });

    expect(disabledTargets.size).toBe(0);
    expect(items[90]!.hasAttribute("data-highlighted")).toBe(false);
    expect(items[80]!.hasAttribute("data-highlighted")).toBe(true);
  });

  it("uses cached indices for large-list pointer highlighting", async () => {
    const root = renderLargeMenu(160);
    const items = getItems();

    createMenu(root);
    getMenuTrigger(root).click();
    await waitForFloatingPosition();

    const originalIndexOf = Array.prototype.indexOf;
    let collectionScanCount = 0;
    const indexOfSpy = vi.spyOn(Array.prototype, "indexOf").mockImplementation(function (
      this: unknown[],
      searchElement: unknown,
      fromIndex?: number,
    ) {
      if (
        searchElement === items[80] &&
        this.length === items.length &&
        this[0] === items[0] &&
        this[items.length - 1] === items[items.length - 1]
      ) {
        collectionScanCount += 1;
      }

      return originalIndexOf.call(this, searchElement, fromIndex);
    });

    try {
      items[80]!.dispatchEvent(
        new PointerEvent("pointermove", { bubbles: true, pointerType: "mouse" }),
      );
    } finally {
      indexOfSpy.mockRestore();
    }

    expect(collectionScanCount).toBe(0);
    expect(items[80]!.hasAttribute("data-highlighted")).toBe(true);
  });

  it("refreshes dynamically added items before pointer hover and keyboard navigation", async () => {
    const root = renderMenu();
    const popup = getMenuPopup(root);

    createMenu(root);
    getMenuTrigger(root).click();
    await waitForFloatingPosition();

    const dynamicItem = document.createElement("div");
    dynamicItem.setAttribute("data-sw-menu-item", "");
    dynamicItem.textContent = "Catalog";
    popup.append(dynamicItem);

    dynamicItem.dispatchEvent(
      new PointerEvent("pointermove", { bubbles: true, pointerType: "mouse" }),
    );

    expect(dynamicItem.getAttribute("role")).toBe("menuitem");
    expect(dynamicItem.hasAttribute("data-highlighted")).toBe(true);
    expect(dynamicItem.getAttribute("tabindex")).toBe("0");
    expect(document.activeElement).toBe(dynamicItem);

    popup.dispatchEvent(new KeyboardEvent("keydown", { bubbles: true, key: "ArrowDown" }));

    expect(getItems()[0]!.hasAttribute("data-highlighted")).toBe(true);
    expect(getItems()[0]!.getAttribute("tabindex")).toBe("0");
    expect(dynamicItem.hasAttribute("data-highlighted")).toBe(false);
  });

  it("tracks highlighted items for Home, End, and typeahead keys", async () => {
    const root = renderMenu();
    const items = getItems();

    createMenu(root);
    getTrigger().click();
    await waitForFloatingPosition();

    getPopup().dispatchEvent(new KeyboardEvent("keydown", { bubbles: true, key: "End" }));

    expect(items[0].hasAttribute("data-highlighted")).toBe(false);
    expect(items[0].getAttribute("tabindex")).toBe("-1");
    expect(items[1].hasAttribute("data-highlighted")).toBe(true);
    expect(items[1].getAttribute("tabindex")).toBe("0");
    expect(document.activeElement).toBe(items[1]);

    getPopup().dispatchEvent(new KeyboardEvent("keydown", { bubbles: true, key: "Home" }));

    expect(items[0].hasAttribute("data-highlighted")).toBe(true);
    expect(items[0].getAttribute("tabindex")).toBe("0");
    expect(items[1].hasAttribute("data-highlighted")).toBe(false);
    expect(items[1].getAttribute("tabindex")).toBe("-1");
    expect(document.activeElement).toBe(items[0]);

    getPopup().dispatchEvent(new KeyboardEvent("keydown", { bubbles: true, key: "b" }));

    expect(items[0].hasAttribute("data-highlighted")).toBe(false);
    expect(items[0].getAttribute("tabindex")).toBe("-1");
    expect(items[1].hasAttribute("data-highlighted")).toBe(true);
    expect(items[1].getAttribute("tabindex")).toBe("0");
    expect(document.activeElement).toBe(items[1]);
  });

  it.each(["Enter", " "])(
    "moves focus to the first item when the trigger opens the menu from %s",
    async (key) => {
      const root = renderMenu();

      createMenu(root);
      getTrigger().focus();
      getTrigger().dispatchEvent(new KeyboardEvent("keydown", { bubbles: true, key }));
      await waitForFloatingPosition();

      expect(getPopup().hidden).toBe(false);
      expect(document.activeElement).toBe(getItems()[0]);
      expect(getItems()[0].getAttribute("tabindex")).toBe("0");
    },
  );

  it("returns focus to the trigger after keyboard item selection and Escape close", async () => {
    const root = renderMenu();

    createMenu(root);
    getTrigger().focus();
    getTrigger().dispatchEvent(new KeyboardEvent("keydown", { bubbles: true, key: "Enter" }));
    await waitForFloatingPosition();

    expect(document.activeElement).toBe(getItems()[0]);

    getPopup().dispatchEvent(new KeyboardEvent("keydown", { bubbles: true, key: "Enter" }));

    expect(getPopup().hidden).toBe(true);
    expect(document.activeElement).toBe(getTrigger());

    getTrigger().dispatchEvent(new KeyboardEvent("keydown", { bubbles: true, key: "Enter" }));
    await waitForFloatingPosition();
    getPopup().dispatchEvent(new KeyboardEvent("keydown", { bubbles: true, key: "Escape" }));

    expect(getPopup().hidden).toBe(true);
    expect(document.activeElement).toBe(getTrigger());
  });

  it("supports controlled mode and cancelable open changes", async () => {
    const root = renderMenu();
    const onOpenChange = vi.fn();
    const menu = createMenu(root, {
      onOpenChange,
      open: false,
    });

    getTrigger().click();

    expect(onOpenChange).toHaveBeenCalledWith(
      true,
      expect.objectContaining({ open: true, reason: "trigger-press" }),
    );
    expect(menu.getOpen()).toBe(false);
    expect(getPopup().hidden).toBe(true);

    menu.setOpen(true, { emit: false });
    await waitForFloatingPosition();

    expect(menu.getOpen()).toBe(true);
    expect(getPopup().hidden).toBe(false);

    root.addEventListener("starwind:open-change", (event) => {
      event.preventDefault();
    });
    getItems()[0].click();

    expect(menu.getOpen()).toBe(true);
    expect(getPopup().hidden).toBe(false);
  });

  it("does not retain canceled controlled open requests", () => {
    const root = renderMenu();
    const onOpenChange = vi.fn((_open, details) => {
      details.cancel();
    });
    const menu = createMenu(root, {
      onOpenChange,
      open: false,
    });

    getTrigger().click();

    expect(onOpenChange).toHaveBeenCalledWith(
      true,
      expect.objectContaining({ isCanceled: true, reason: "trigger-press" }),
    );
    expect(menu.getOpen()).toBe(false);
    expect(getPopup().hidden).toBe(true);

    menu.setOpen(true, { emit: false });

    expect(menu.getOpen()).toBe(true);
    expect(getPopup().hidden).toBe(false);
  });

  it("requests controlled close from Escape and outside dismissal without mutating state", () => {
    const root = renderMenu();
    const onOpenChange = vi.fn();
    const menu = createMenu(root, {
      onOpenChange,
      open: true,
    });

    document.dispatchEvent(new KeyboardEvent("keydown", { bubbles: true, key: "Escape" }));

    expect(onOpenChange).toHaveBeenCalledWith(
      false,
      expect.objectContaining({ open: false, reason: "escape-key" }),
    );
    expect(menu.getOpen()).toBe(true);
    expect(getPopup().hidden).toBe(false);

    menu.setOpen(false, { emit: false });
    menu.setOpen(true, { emit: false });
    onOpenChange.mockClear();

    document.body.dispatchEvent(new PointerEvent("pointerdown", { bubbles: true }));

    expect(onOpenChange).toHaveBeenCalledWith(
      false,
      expect.objectContaining({ open: false, reason: "outside-press" }),
    );
    expect(menu.getOpen()).toBe(true);
    expect(getPopup().hidden).toBe(false);
  });

  it("restores focus when a controlled close is synced after item selection", async () => {
    const root = renderMenu();
    const menu = createMenu(root, { open: true });

    menu.setOpen(true, { emit: false });
    await waitForFloatingPosition();
    getItems()[0].focus();
    getItems()[0].click();

    expect(menu.getOpen()).toBe(true);
    expect(document.activeElement).toBe(getItems()[0]);

    menu.setOpen(false, { emit: false });

    expect(document.activeElement).toBe(getTrigger());
  });

  it("preserves the requested close reason for controlled close completion", async () => {
    vi.useFakeTimers();
    const root = renderMenuWithAnimatedPopup();
    const onOpenChange = vi.fn();
    const closeCompleteListener = vi.fn();
    root.addEventListener("starwind:close-complete", closeCompleteListener);

    const menu = createMenu(root, {
      onOpenChange,
      open: true,
    });

    getItems()[0].focus();
    getItems()[0].click();

    expect(onOpenChange).toHaveBeenCalledWith(
      false,
      expect.objectContaining({ open: false, reason: "item-press" }),
    );
    expect(menu.getOpen()).toBe(true);
    expect(getPopup().hidden).toBe(false);

    menu.setOpen(false, { emit: false });

    expect(getPopup().getAttribute("data-state")).toBe("closed");
    expect(getPopup().hidden).toBe(false);
    expect(closeCompleteListener).not.toHaveBeenCalled();

    await vi.advanceTimersByTimeAsync(200);

    expect(getPopup().hidden).toBe(true);
    expect(closeCompleteListener).toHaveBeenCalledWith(
      expect.objectContaining({
        detail: expect.objectContaining({
          open: false,
          reason: "item-press",
        }),
      }),
    );
  });

  it("toggles checkbox items without closing the menu by default", async () => {
    const root = renderMenuWithCheckboxItem();
    const listener = vi.fn();
    const checkboxItem = getCheckboxItem();
    const indicator = getCheckboxItemIndicator();
    checkboxItem.addEventListener("starwind:checked-change", listener);

    createMenu(root);
    getTrigger().click();
    await waitForFloatingPosition();

    expect(indicator.getAttribute("aria-hidden")).toBe("true");
    expect(indicator.getAttribute("data-state")).toBe("unchecked");
    expect(indicator.hasAttribute("data-hidden")).toBe(true);

    checkboxItem.click();

    expect(checkboxItem.getAttribute("aria-checked")).toBe("true");
    expect(checkboxItem.hasAttribute("data-checked")).toBe(true);
    expect(checkboxItem.hasAttribute("data-unchecked")).toBe(false);
    expect(indicator.getAttribute("data-state")).toBe("checked");
    expect(indicator.hasAttribute("data-visible")).toBe(true);
    expect(indicator.hasAttribute("data-hidden")).toBe(false);
    expect(getPopup().hidden).toBe(false);
    expect(listener).toHaveBeenCalledWith(
      expect.objectContaining({
        detail: expect.objectContaining({ checked: true, previousChecked: false }),
      }),
    );
  });

  it("lets checkbox item change cancellation prevent state commits", async () => {
    const root = renderMenuWithCheckboxItem();
    const checkboxItem = getCheckboxItem();
    const indicator = getCheckboxItemIndicator();
    const listener = vi.fn((event: Event) => {
      (event as CustomEvent<{ cancel?: () => void }>).detail.cancel?.();
    });
    checkboxItem.addEventListener("starwind:checked-change", listener);

    createMenu(root);
    getTrigger().click();
    await waitForFloatingPosition();

    checkboxItem.click();

    expect(checkboxItem.getAttribute("aria-checked")).toBe("false");
    expect(checkboxItem.hasAttribute("data-checked")).toBe(false);
    expect(checkboxItem.hasAttribute("data-unchecked")).toBe(true);
    expect(indicator.getAttribute("data-state")).toBe("unchecked");
    expect(indicator.hasAttribute("data-visible")).toBe(false);
    expect(indicator.hasAttribute("data-hidden")).toBe(true);
    expect(getPopup().hidden).toBe(false);
    expect(listener).toHaveBeenCalledWith(
      expect.objectContaining({
        detail: expect.objectContaining({ checked: true, previousChecked: false }),
      }),
    );
  });

  it("selects radio items within a group without closing the menu by default", async () => {
    const root = renderMenuWithRadioGroup();
    const group = getRadioGroup();
    const compact = getRadioItem("compact");
    const spacious = getRadioItem("spacious");
    const compactIndicator = getRadioItemIndicator("compact");
    const spaciousIndicator = getRadioItemIndicator("spacious");
    const listener = vi.fn();
    group.addEventListener("starwind:value-change", listener);

    createMenu(root);
    getTrigger().click();
    await waitForFloatingPosition();

    expect(group.getAttribute("role")).toBe("group");
    expect(group.getAttribute("data-value")).toBe("compact");
    expect(compact.getAttribute("role")).toBe("menuitemradio");
    expect(compact.getAttribute("aria-checked")).toBe("true");
    expect(spacious.getAttribute("aria-checked")).toBe("false");
    expect(compactIndicator.getAttribute("aria-hidden")).toBe("true");
    expect(compactIndicator.getAttribute("data-state")).toBe("checked");
    expect(compactIndicator.hasAttribute("data-visible")).toBe(true);
    expect(spaciousIndicator.getAttribute("data-state")).toBe("unchecked");
    expect(spaciousIndicator.hasAttribute("data-hidden")).toBe(true);

    spacious.click();

    expect(group.getAttribute("data-value")).toBe("spacious");
    expect(compact.getAttribute("aria-checked")).toBe("false");
    expect(compact.hasAttribute("data-unchecked")).toBe(true);
    expect(spacious.getAttribute("aria-checked")).toBe("true");
    expect(spacious.hasAttribute("data-checked")).toBe(true);
    expect(compactIndicator.getAttribute("data-state")).toBe("unchecked");
    expect(compactIndicator.hasAttribute("data-hidden")).toBe(true);
    expect(spaciousIndicator.getAttribute("data-state")).toBe("checked");
    expect(spaciousIndicator.hasAttribute("data-visible")).toBe(true);
    expect(getPopup().hidden).toBe(false);
    expect(listener).toHaveBeenCalledWith(
      expect.objectContaining({
        detail: expect.objectContaining({
          item: spacious,
          previousValue: "compact",
          reason: "item-press",
          value: "spacious",
        }),
      }),
    );
  });

  it("refreshes external radio value changes on the next keyboard interaction", async () => {
    const root = renderMenuWithRadioGroup();
    const group = getRadioGroup();
    const compact = getRadioItem("compact");
    const spacious = getRadioItem("spacious");

    createMenu(root);
    getTrigger().click();
    await waitForFloatingPosition();

    group.setAttribute("data-value", "spacious");

    getPopup().dispatchEvent(new KeyboardEvent("keydown", { bubbles: true, key: "ArrowDown" }));

    expect(compact.getAttribute("aria-checked")).toBe("false");
    expect(compact.hasAttribute("data-unchecked")).toBe(true);
    expect(spacious.getAttribute("aria-checked")).toBe("true");
    expect(spacious.hasAttribute("data-checked")).toBe(true);
    expect(getRadioItemIndicator("compact").getAttribute("data-state")).toBe("unchecked");
    expect(getRadioItemIndicator("spacious").getAttribute("data-state")).toBe("checked");
  });

  it("refreshes external radio value changes on same-task radio pointer hover", async () => {
    const root = renderMenuWithRadioGroup();
    const group = getRadioGroup();
    const compact = getRadioItem("compact");
    const spacious = getRadioItem("spacious");

    createMenu(root);
    getTrigger().click();
    await waitForFloatingPosition();

    group.setAttribute("data-value", "spacious");
    spacious.dispatchEvent(
      new PointerEvent("pointermove", { bubbles: true, pointerType: "mouse" }),
    );

    expect(compact.getAttribute("aria-checked")).toBe("false");
    expect(spacious.getAttribute("aria-checked")).toBe("true");
    expect(getRadioItemIndicator("compact").getAttribute("data-state")).toBe("unchecked");
    expect(getRadioItemIndicator("spacious").getAttribute("data-state")).toBe("checked");
    expect(spacious.hasAttribute("data-highlighted")).toBe(true);
  });

  it("keeps empty menu radio item values on fallback identity semantics", async () => {
    const root = renderMenuWithRadioGroup();
    const group = getRadioGroup();
    group.removeAttribute("data-value");
    const compact = getRadioItem("compact");
    compact.setAttribute("data-value", "");
    compact.setAttribute("data-default-checked", "");

    createMenu(root);
    getTrigger().click();
    await waitForFloatingPosition();

    expect(compact.getAttribute("data-value")).toBe("");
    expect(group.getAttribute("data-value")).toBe("0");
    expect(compact.getAttribute("aria-checked")).toBe("true");
    expect(getRadioItem("spacious").getAttribute("aria-checked")).toBe("false");
  });

  it("lets radio value change cancellation prevent state commits", async () => {
    const root = renderMenuWithRadioGroup();
    const group = getRadioGroup();
    const compact = getRadioItem("compact");
    const spacious = getRadioItem("spacious");
    const compactIndicator = getRadioItemIndicator("compact");
    const spaciousIndicator = getRadioItemIndicator("spacious");
    const listener = vi.fn((event: Event) => {
      (event as CustomEvent<{ cancel?: () => void }>).detail.cancel?.();
    });
    group.addEventListener("starwind:value-change", listener);

    createMenu(root);
    getTrigger().click();
    await waitForFloatingPosition();

    spacious.click();

    expect(group.getAttribute("data-value")).toBe("compact");
    expect(compact.getAttribute("aria-checked")).toBe("true");
    expect(compact.hasAttribute("data-checked")).toBe(true);
    expect(spacious.getAttribute("aria-checked")).toBe("false");
    expect(spacious.hasAttribute("data-unchecked")).toBe(true);
    expect(compactIndicator.getAttribute("data-state")).toBe("checked");
    expect(compactIndicator.hasAttribute("data-visible")).toBe(true);
    expect(spaciousIndicator.getAttribute("data-state")).toBe("unchecked");
    expect(spaciousIndicator.hasAttribute("data-hidden")).toBe(true);
    expect(getPopup().hidden).toBe(false);
    expect(listener).toHaveBeenCalledWith(
      expect.objectContaining({
        detail: expect.objectContaining({
          item: spacious,
          previousValue: "compact",
          reason: "item-press",
          value: "spacious",
        }),
      }),
    );
  });

  it("keeps disabled items focusable without allowing activation", async () => {
    const root = renderMenuWithDisabledItems();
    const listener = vi.fn();
    const checkboxListener = vi.fn();
    root.addEventListener("starwind:open-change", listener);
    getDisabledCheckboxItem().addEventListener("starwind:checked-change", checkboxListener);

    createMenu(root);
    getTrigger().click();
    await waitForFloatingPosition();

    getPopup().dispatchEvent(new KeyboardEvent("keydown", { bubbles: true, key: "l" }));

    expect(document.activeElement).toBe(getDisabledItem());
    expect(getDisabledItem().getAttribute("tabindex")).toBe("0");

    getPopup().dispatchEvent(new KeyboardEvent("keydown", { bubbles: true, key: "Enter" }));

    expect(getPopup().hidden).toBe(false);
    expect(listener).not.toHaveBeenCalledWith(
      expect.objectContaining({
        detail: expect.objectContaining({ open: false, reason: "item-press" }),
      }),
    );

    getPopup().dispatchEvent(new KeyboardEvent("keydown", { bubbles: true, key: "ArrowDown" }));

    expect(document.activeElement).toBe(getDisabledCheckboxItem());
    expect(getDisabledCheckboxItem().getAttribute("aria-checked")).toBe("true");

    getPopup().dispatchEvent(new KeyboardEvent("keydown", { bubbles: true, key: " " }));

    expect(getDisabledCheckboxItem().getAttribute("aria-checked")).toBe("true");
    expect(checkboxListener).not.toHaveBeenCalled();
    expect(getPopup().hidden).toBe(false);

    getPopup().dispatchEvent(new KeyboardEvent("keydown", { bubbles: true, key: "ArrowDown" }));
    getDisabledSubmenuTrigger().dispatchEvent(
      new KeyboardEvent("keydown", { bubbles: true, key: "ArrowRight" }),
    );
    await waitForFloatingPosition();

    expect(document.activeElement).toBe(getDisabledSubmenuTrigger());
    expect(getDisabledSubmenuTrigger().getAttribute("aria-expanded")).toBe("false");
    expect(getSubmenuPopup().hidden).toBe(true);
    expect(getPopup().hidden).toBe(false);
  });

  it("opens and closes submenus with keyboard navigation", async () => {
    const root = renderMenuWithSubmenu();

    createMenu(root);
    getTrigger().click();
    await waitForFloatingPosition();

    getSubmenuTrigger().dispatchEvent(
      new KeyboardEvent("keydown", { bubbles: true, key: "ArrowRight" }),
    );
    await waitForFloatingPosition();

    expect(getSubmenuPopup().hidden).toBe(false);
    expect(getSubmenuTrigger().getAttribute("aria-expanded")).toBe("true");
    expect(getSubmenuPopup().style.position).toBe("fixed");

    getSubmenuPopup().dispatchEvent(
      new KeyboardEvent("keydown", { bubbles: true, key: "ArrowLeft" }),
    );

    expect(getSubmenuPopup().hidden).toBe(true);
    expect(getSubmenuTrigger().getAttribute("aria-expanded")).toBe("false");
    expect(document.activeElement).toBe(getSubmenuTrigger());
  });

  it("keeps submenu popups mounted while close animations finish and cleans them up on destroy", async () => {
    vi.useFakeTimers();
    const root = renderMenuWithSubmenu();
    const submenuRoot = root.querySelector<HTMLElement>("[data-sw-menu-submenu-root]")!;
    const submenuTrigger = submenuRoot.querySelector<HTMLElement>(
      "[data-sw-menu-submenu-trigger]",
    )!;
    const submenuPopup = submenuRoot.querySelector<HTMLElement>("[data-sw-menu-popup]")!;
    setAnimatedClose(submenuPopup);
    const menu = createMenu(root);

    getTrigger().click();
    submenuTrigger.click();

    expect(submenuPopup.hidden).toBe(false);
    expect(submenuPopup.parentElement).toBe(document.body);
    expect(submenuRoot.getAttribute("data-state")).toBe("open");
    expect(submenuTrigger.getAttribute("aria-expanded")).toBe("true");

    submenuPopup.dispatchEvent(new KeyboardEvent("keydown", { bubbles: true, key: "ArrowLeft" }));

    expect(submenuPopup.hidden).toBe(false);
    expect(submenuPopup.parentElement).toBe(document.body);
    expect(submenuRoot.getAttribute("data-state")).toBe("closed");
    expect(submenuTrigger.getAttribute("aria-expanded")).toBe("false");

    await vi.advanceTimersByTimeAsync(199);

    expect(submenuPopup.hidden).toBe(false);
    expect(submenuPopup.parentElement).toBe(document.body);

    await vi.advanceTimersByTimeAsync(1);

    expect(submenuPopup.hidden).toBe(true);
    expect(submenuPopup.parentElement).toBe(submenuRoot);

    submenuTrigger.click();

    expect(submenuPopup.hidden).toBe(false);
    expect(submenuPopup.parentElement).toBe(document.body);

    menu.destroy();

    expect(submenuPopup.hidden).toBe(true);
    expect(submenuPopup.parentElement).toBe(submenuRoot);
    expect(submenuRoot.getAttribute("data-state")).toBe("closed");
    expect(submenuTrigger.getAttribute("aria-expanded")).toBe("false");
    expect(getPopup().hidden).toBe(true);
  });

  it("does not emit root open or close-complete events for submenu open and close", async () => {
    vi.useFakeTimers();
    const root = renderMenuWithSubmenu();
    const submenuRoot = root.querySelector<HTMLElement>("[data-sw-menu-submenu-root]")!;
    const submenuTrigger = submenuRoot.querySelector<HTMLElement>(
      "[data-sw-menu-submenu-trigger]",
    )!;
    const submenuPopup = submenuRoot.querySelector<HTMLElement>("[data-sw-menu-popup]")!;
    setAnimatedClose(submenuPopup);
    const onOpenChange = vi.fn();
    const onCloseComplete = vi.fn();
    const openChangeListener = vi.fn();
    const closeCompleteListener = vi.fn();
    root.addEventListener("starwind:open-change", openChangeListener);
    root.addEventListener("starwind:close-complete", closeCompleteListener);
    const menu = createMenu(root, { onCloseComplete, onOpenChange });
    const openChangeSubscriber = vi.fn();
    const closeCompleteSubscriber = vi.fn();
    menu.subscribe("openChange", openChangeSubscriber);
    menu.subscribe("closeComplete", closeCompleteSubscriber);

    menu.setOpen(true, { emit: false });
    submenuTrigger.click();

    expect(submenuPopup.hidden).toBe(false);
    expect(onOpenChange).not.toHaveBeenCalled();
    expect(openChangeListener).not.toHaveBeenCalled();
    expect(openChangeSubscriber).not.toHaveBeenCalled();

    submenuPopup.dispatchEvent(new KeyboardEvent("keydown", { bubbles: true, key: "ArrowLeft" }));
    await vi.advanceTimersByTimeAsync(200);

    expect(submenuPopup.hidden).toBe(true);
    expect(onCloseComplete).not.toHaveBeenCalled();
    expect(closeCompleteListener).not.toHaveBeenCalled();
    expect(closeCompleteSubscriber).not.toHaveBeenCalled();
  });

  it("keeps outside root dismissal working while a submenu is closing in its portal", async () => {
    vi.useFakeTimers();
    const root = renderMenuWithSubmenu();
    const submenuRoot = root.querySelector<HTMLElement>("[data-sw-menu-submenu-root]")!;
    const submenuTrigger = submenuRoot.querySelector<HTMLElement>(
      "[data-sw-menu-submenu-trigger]",
    )!;
    const submenuPopup = submenuRoot.querySelector<HTMLElement>("[data-sw-menu-popup]")!;
    setAnimatedClose(submenuPopup);
    const menu = createMenu(root);

    menu.setOpen(true, { emit: false });
    submenuTrigger.click();
    submenuPopup.dispatchEvent(new KeyboardEvent("keydown", { bubbles: true, key: "ArrowLeft" }));

    expect(menu.getOpen()).toBe(true);
    expect(getPopup().hidden).toBe(false);
    expect(submenuPopup.hidden).toBe(false);
    expect(submenuPopup.parentElement).toBe(document.body);

    document.body.dispatchEvent(new PointerEvent("pointerdown", { bubbles: true }));

    expect(menu.getOpen()).toBe(false);
    expect(getPopup().getAttribute("data-state")).toBe("closed");
    expect(getPopup().hidden).toBe(true);
    expect(submenuPopup.hidden).toBe(false);
    expect(submenuPopup.parentElement).toBe(document.body);

    await vi.advanceTimersByTimeAsync(200);

    expect(submenuPopup.hidden).toBe(true);
    expect(submenuPopup.parentElement).toBe(submenuRoot);
  });

  it("opens sibling submenus from click while closing the previous sibling", () => {
    const root = renderMenuWithSiblingSubmenus();
    const submenuRoots = Array.from(
      root.querySelectorAll<HTMLElement>("[data-sw-menu-submenu-root]"),
    );
    const submenuTriggers = submenuRoots.map(
      (submenuRoot) => submenuRoot.querySelector<HTMLElement>("[data-sw-menu-submenu-trigger]")!,
    );
    const submenuPopups = submenuRoots.map(
      (submenuRoot) => submenuRoot.querySelector<HTMLElement>("[data-sw-menu-popup]")!,
    );

    createMenu(root);
    getTrigger().click();

    submenuTriggers[0]!.click();

    expect(submenuPopups[0]!.hidden).toBe(false);
    expect(submenuTriggers[0]!.getAttribute("aria-expanded")).toBe("true");

    submenuTriggers[1]!.click();

    expect(submenuPopups[0]!.hidden).toBe(true);
    expect(submenuTriggers[0]!.getAttribute("aria-expanded")).toBe("false");
    expect(submenuPopups[1]!.hidden).toBe(false);
    expect(submenuTriggers[1]!.getAttribute("aria-expanded")).toBe("true");
  });

  it("keeps closing sibling submenus mounted until close animations finish", async () => {
    vi.useFakeTimers();
    const root = renderMenuWithSiblingSubmenus();
    const submenuRoots = Array.from(
      root.querySelectorAll<HTMLElement>("[data-sw-menu-submenu-root]"),
    );
    const submenuTriggers = submenuRoots.map(
      (submenuRoot) => submenuRoot.querySelector<HTMLElement>("[data-sw-menu-submenu-trigger]")!,
    );
    const submenuPopups = submenuRoots.map(
      (submenuRoot) => submenuRoot.querySelector<HTMLElement>("[data-sw-menu-popup]")!,
    );
    setAnimatedClose(submenuPopups[0]!);

    createMenu(root);
    getTrigger().click();
    submenuTriggers[0]!.click();

    expect(submenuPopups[0]!.hidden).toBe(false);
    expect(submenuPopups[0]!.parentElement).toBe(document.body);

    submenuTriggers[1]!.click();

    expect(submenuPopups[0]!.hidden).toBe(false);
    expect(submenuPopups[0]!.parentElement).toBe(document.body);
    expect(submenuRoots[0]!.getAttribute("data-state")).toBe("closed");
    expect(submenuTriggers[0]!.getAttribute("aria-expanded")).toBe("false");
    expect(submenuPopups[1]!.hidden).toBe(false);
    expect(submenuPopups[1]!.parentElement).toBe(document.body);

    await vi.advanceTimersByTimeAsync(199);

    expect(submenuPopups[0]!.hidden).toBe(false);
    expect(submenuPopups[0]!.parentElement).toBe(document.body);

    await vi.advanceTimersByTimeAsync(1);

    expect(submenuPopups[0]!.hidden).toBe(true);
    expect(submenuPopups[0]!.parentElement).toBe(submenuRoots[0]);
  });

  it("keeps the root menu open for pointer events inside nested submenu portals", () => {
    const root = renderMenuWithNestedSubmenus();
    const submenuRoots = Array.from(
      root.querySelectorAll<HTMLElement>("[data-sw-menu-submenu-root]"),
    );
    const submenuTriggers = submenuRoots.map(
      (submenuRoot) => submenuRoot.querySelector<HTMLElement>("[data-sw-menu-submenu-trigger]")!,
    );
    const submenuPopups = submenuRoots.map(
      (submenuRoot) => submenuRoot.querySelector<HTMLElement>("[data-sw-menu-popup]")!,
    );
    const nestedItem = submenuPopups[1]!.querySelector<HTMLElement>("[data-sw-menu-item]")!;
    const menu = createMenu(root);

    getTrigger().click();
    submenuTriggers[0]!.click();
    submenuTriggers[1]!.click();

    expect(menu.getOpen()).toBe(true);
    expect(submenuPopups[0]!.hidden).toBe(false);
    expect(submenuPopups[1]!.hidden).toBe(false);
    expect(submenuPopups[0]!.parentElement).toBe(document.body);
    expect(submenuPopups[1]!.parentElement).toBe(document.body);

    nestedItem.dispatchEvent(new PointerEvent("pointerdown", { bubbles: true }));

    expect(menu.getOpen()).toBe(true);
    expect(submenuPopups[0]!.hidden).toBe(false);
    expect(submenuPopups[1]!.hidden).toBe(false);
  });

  it("keeps ancestor submenus open when the pointer enters a nested submenu portal", async () => {
    vi.useFakeTimers();
    const root = renderMenuWithNestedSubmenus();
    const submenuRoots = Array.from(
      root.querySelectorAll<HTMLElement>("[data-sw-menu-submenu-root]"),
    );
    submenuRoots.forEach((submenuRoot) => submenuRoot.setAttribute("data-close-delay", "50"));
    const submenuTriggers = submenuRoots.map(
      (submenuRoot) => submenuRoot.querySelector<HTMLElement>("[data-sw-menu-submenu-trigger]")!,
    );
    const submenuPopups = submenuRoots.map(
      (submenuRoot) => submenuRoot.querySelector<HTMLElement>("[data-sw-menu-popup]")!,
    );

    createMenu(root);
    getTrigger().click();
    dispatchMousePointer(submenuTriggers[0]!, "pointerenter");
    dispatchMousePointer(submenuTriggers[1]!, "pointerenter");

    dispatchMousePointer(submenuPopups[0]!, "pointerleave");
    dispatchMousePointer(submenuTriggers[1]!, "pointerleave");
    dispatchMousePointer(submenuPopups[1]!, "pointerenter");
    await vi.advanceTimersByTimeAsync(50);

    expect(getPopup().getAttribute("data-state")).toBe("open");
    expect(submenuRoots[0]!.getAttribute("data-state")).toBe("open");
    expect(submenuTriggers[0]!.getAttribute("aria-expanded")).toBe("true");
    expect(submenuPopups[0]!.hidden).toBe(false);
    expect(submenuRoots[1]!.getAttribute("data-state")).toBe("open");
    expect(submenuTriggers[1]!.getAttribute("aria-expanded")).toBe("true");
    expect(submenuPopups[1]!.hidden).toBe(false);
  });

  it("cleans up nested submenu portals when the root menu is destroyed", () => {
    const root = renderMenuWithNestedSubmenus();
    const rootPopup = getMenuPopup(root);
    const submenuRoots = Array.from(
      root.querySelectorAll<HTMLElement>("[data-sw-menu-submenu-root]"),
    );
    const submenuTriggers = submenuRoots.map(
      (submenuRoot) => submenuRoot.querySelector<HTMLElement>("[data-sw-menu-submenu-trigger]")!,
    );
    const submenuPopups = submenuRoots.map(
      (submenuRoot) => submenuRoot.querySelector<HTMLElement>("[data-sw-menu-popup]")!,
    );
    const menu = createMenu(root);

    getTrigger().click();
    submenuTriggers[0]!.click();
    submenuTriggers[1]!.click();

    expect(rootPopup.hidden).toBe(false);
    expect(rootPopup.parentElement).toBe(document.body);
    expect(submenuPopups[0]!.hidden).toBe(false);
    expect(submenuPopups[0]!.parentElement).toBe(document.body);
    expect(submenuPopups[1]!.hidden).toBe(false);
    expect(submenuPopups[1]!.parentElement).toBe(document.body);

    menu.destroy();

    expect(rootPopup.hidden).toBe(true);
    expect(rootPopup.parentElement).toBe(root);
    expect(submenuPopups[0]!.hidden).toBe(true);
    expect(submenuPopups[0]!.parentElement).toBe(submenuRoots[0]);
    expect(submenuPopups[1]!.hidden).toBe(true);
    expect(submenuPopups[1]!.parentElement).toBe(submenuRoots[1]);
  });

  it("uses closeDelay for submenu hover exits and cancels pending close on re-enter", async () => {
    vi.useFakeTimers();
    const root = renderMenuWithSubmenu();
    const submenuRoot = root.querySelector<HTMLElement>("[data-sw-menu-submenu-root]")!;
    submenuRoot.setAttribute("data-close-delay", "50");
    const submenuTrigger = getSubmenuTrigger();
    const submenuPopup = getSubmenuPopup();

    createMenu(root);
    getTrigger().click();

    dispatchMousePointer(submenuTrigger, "pointerenter");

    expect(submenuPopup.hidden).toBe(false);
    expect(submenuRoot.getAttribute("data-state")).toBe("open");
    expect(submenuTrigger.getAttribute("aria-expanded")).toBe("true");

    dispatchMousePointer(submenuTrigger, "pointerleave");
    await vi.advanceTimersByTimeAsync(49);

    expect(submenuPopup.hidden).toBe(false);
    expect(submenuTrigger.getAttribute("aria-expanded")).toBe("true");

    dispatchMousePointer(submenuPopup, "pointerenter");
    await vi.advanceTimersByTimeAsync(50);

    expect(submenuPopup.hidden).toBe(false);
    expect(submenuTrigger.getAttribute("aria-expanded")).toBe("true");

    dispatchMousePointer(submenuPopup, "pointerleave");
    await vi.advanceTimersByTimeAsync(50);

    expect(submenuPopup.hidden).toBe(true);
    expect(submenuRoot.getAttribute("data-state")).toBe("closed");
    expect(submenuTrigger.getAttribute("aria-expanded")).toBe("false");
    expect(getPopup().hidden).toBe(false);
  });

  it("keeps submenu open and close under the root menu modal lock", async () => {
    const root = renderMenuWithSubmenu({ modal: true });
    const menu = createMenu(root);

    getTrigger().click();
    await waitForFloatingPosition();

    expect(document.body.hasAttribute("data-sw-scroll-locked")).toBe(true);

    getSubmenuTrigger().dispatchEvent(
      new KeyboardEvent("keydown", { bubbles: true, key: "ArrowRight" }),
    );
    await waitForFloatingPosition();

    expect(getSubmenuPopup().hidden).toBe(false);
    expect(document.body.hasAttribute("data-sw-scroll-locked")).toBe(true);

    getSubmenuPopup().dispatchEvent(
      new KeyboardEvent("keydown", { bubbles: true, key: "ArrowLeft" }),
    );

    expect(getSubmenuPopup().hidden).toBe(true);
    expect(menu.getOpen()).toBe(true);
    expect(document.body.hasAttribute("data-sw-scroll-locked")).toBe(true);

    getItems()[0].click();

    expect(menu.getOpen()).toBe(false);
    expect(document.body.hasAttribute("data-sw-scroll-locked")).toBe(false);
  });

  it("honors explicit bottom placement on submenus", async () => {
    const root = renderMenuWithBottomSubmenu();

    createMenu(root);
    getTrigger().click();
    await waitForFloatingPosition();

    getSubmenuTrigger().dispatchEvent(
      new KeyboardEvent("keydown", { bubbles: true, key: "ArrowRight" }),
    );
    await waitForFloatingPosition();

    expect(getSubmenuPopup().hidden).toBe(false);
    expect(getSubmenuPopup().getAttribute("data-side")).toBe("bottom");
  });

  it("keeps submenus attached to their trigger while scroll changes its rect", async () => {
    const root = renderMenuWithBottomSubmenu();
    const submenuTrigger = getSubmenuTrigger();
    const submenuPopup = getSubmenuPopup();
    let triggerLeft = window.innerWidth - 24;

    mockRect(submenuTrigger, () => ({
      height: 30,
      width: 20,
      x: triggerLeft,
      y: 160,
    }));
    submenuPopup.style.width = "160px";
    submenuPopup.style.height = "80px";

    createMenu(root);
    getTrigger().click();
    await waitForFloatingPosition();

    submenuTrigger.dispatchEvent(
      new KeyboardEvent("keydown", { bubbles: true, key: "ArrowRight" }),
    );
    await waitForFloatingPosition();

    expect(submenuPopup.hidden).toBe(false);
    expect(submenuPopup.style.left).toBe(`${triggerLeft}px`);
    expect(submenuPopup.getAttribute("data-side")).toBe("bottom");
    expect(submenuPopup.getAttribute("data-align")).toBe("start");

    triggerLeft = 80;
    dispatchScrollUpdate();
    await waitForFloatingPosition();

    expect(submenuPopup.style.left).toBe("80px");
    expect(submenuPopup.getAttribute("data-side")).toBe("bottom");
    expect(submenuPopup.getAttribute("data-align")).toBe("start");
  });
});

type RenderMenuOptions = {
  closeDelay?: number;
  modal?: boolean;
  openOnHover?: boolean;
};

function renderDialogOwner(): HTMLElement {
  const wrapper = document.createElement("div");
  wrapper.innerHTML = `
    <div data-sw-dialog>
      <button data-sw-dialog-trigger>Open dialog</button>
      <div data-sw-dialog-overlay hidden></div>
      <dialog data-sw-dialog-content data-slot="dialog-content">
        <h2 data-sw-dialog-title>Dialog title</h2>
        <button data-sw-dialog-close>Close dialog</button>
      </dialog>
    </div>
  `;
  const root = wrapper.firstElementChild as HTMLElement;
  document.body.append(root);
  return root;
}

function renderMenu(options: RenderMenuOptions = {}): HTMLElement {
  const wrapper = document.createElement("div");
  wrapper.innerHTML = `
    <div data-sw-menu${options.modal ? ' data-modal="true"' : ""}${options.openOnHover ? " data-open-on-hover" : ""}${options.closeDelay === undefined ? "" : ` data-close-delay="${options.closeDelay}"`}>
      <button data-sw-menu-trigger>Open menu</button>
      <div data-sw-menu-popup data-side="bottom" data-align="start">
        <div data-sw-menu-item>Account</div>
        <div data-sw-menu-item>Billing</div>
      </div>
    </div>
  `;

  const root = wrapper.firstElementChild as HTMLElement;
  document.body.append(root);
  return root;
}

function renderLargeMenu(count: number, options: { disabledIndex?: number } = {}): HTMLElement {
  const wrapper = document.createElement("div");
  const items = Array.from({ length: count }, (_, index) => {
    const disabled = index === options.disabledIndex ? " data-disabled" : "";
    return `<div data-sw-menu-item${disabled}>Item ${index}</div>`;
  }).join("");

  wrapper.innerHTML = `
    <div data-sw-menu>
      <button data-sw-menu-trigger>Open menu</button>
      <div data-sw-menu-popup data-side="bottom" data-align="start">
        ${items}
      </div>
    </div>
  `;

  const root = wrapper.firstElementChild as HTMLElement;
  document.body.append(root);
  return root;
}

function renderMenuWithIncompleteSubmenu(submenuMarkup: string): HTMLElement {
  const wrapper = document.createElement("div");
  wrapper.innerHTML = `
    <div data-sw-menu>
      <button data-sw-menu-trigger>Open menu</button>
      <div data-sw-menu-popup data-side="bottom" data-align="start">
        ${submenuMarkup}
      </div>
    </div>
  `;

  const root = wrapper.firstElementChild as HTMLElement;
  document.body.append(root);
  return root;
}

function renderMenuWithItemCloseOnClickFalse(): HTMLElement {
  const wrapper = document.createElement("div");
  wrapper.innerHTML = `
    <div data-sw-menu>
      <button data-sw-menu-trigger>Open menu</button>
      <div data-sw-menu-popup data-side="bottom" data-align="start">
        <div data-sw-menu-item data-close-on-click="false">Persistent action</div>
      </div>
    </div>
  `;

  const root = wrapper.firstElementChild as HTMLElement;
  document.body.append(root);
  return root;
}

function renderMenuWithLinkItems(): HTMLElement {
  const wrapper = document.createElement("div");
  wrapper.innerHTML = `
    <div data-sw-menu>
      <button data-sw-menu-trigger>Open menu</button>
      <div data-sw-menu-popup data-side="bottom" data-align="start">
        <a data-sw-menu-link-item href="/docs" data-testid="docs">Docs</a>
        <a data-sw-menu-link-item href="/settings" data-testid="settings" data-close-on-click="true">
          Settings
        </a>
      </div>
    </div>
  `;

  const root = wrapper.firstElementChild as HTMLElement;
  document.body.append(root);
  return root;
}

function renderMenuWithAsChildTrigger(): HTMLElement {
  const wrapper = document.createElement("div");
  wrapper.innerHTML = `
    <div data-sw-menu>
      <div
        id="as-child-wrapper"
        class="starwind-dropdown-trigger extra-trigger-class"
        data-as-child
        data-slot="dropdown-trigger"
        data-sw-menu-trigger
      >
        <button id="as-child-trigger" type="button">Open menu</button>
      </div>
      <div data-sw-menu-popup data-side="bottom" data-align="start">
        <div data-sw-menu-item>Account</div>
        <div data-sw-menu-item>Billing</div>
      </div>
    </div>
  `;

  const root = wrapper.firstElementChild as HTMLElement;
  document.body.append(root);
  return root;
}

function renderMenuWithNestedAsChildTrigger(): HTMLElement {
  const wrapper = document.createElement("div");
  wrapper.innerHTML = `
    <div data-sw-menu>
      <div
        id="as-child-wrapper"
        class="starwind-dropdown-trigger extra-trigger-class"
        data-as-child
        data-slot="dropdown-trigger"
        data-sw-menu-trigger
      >
        <div id="nested-as-child-wrapper" data-as-child>
          <button id="as-child-trigger" type="button">Open menu</button>
        </div>
      </div>
      <div data-sw-menu-popup data-side="bottom" data-align="start">
        <div data-sw-menu-item>Account</div>
        <div data-sw-menu-item>Billing</div>
      </div>
    </div>
  `;

  const root = wrapper.firstElementChild as HTMLElement;
  document.body.append(root);
  return root;
}

function renderMenuWithAsChildTriggerAndAstroScript(): HTMLElement {
  const wrapper = document.createElement("div");
  wrapper.innerHTML = `
    <div data-sw-menu>
      <div
        id="as-child-wrapper"
        class="starwind-dropdown-trigger extra-trigger-class"
        data-as-child
        data-slot="dropdown-trigger"
        data-sw-menu-trigger
      >
        <script id="astro-module-script" type="module"></script>
        <button id="as-child-trigger" type="button">Open menu</button>
      </div>
      <div data-sw-menu-popup data-side="bottom" data-align="start">
        <div data-sw-menu-item>Account</div>
        <div data-sw-menu-item>Billing</div>
      </div>
    </div>
  `;

  const root = wrapper.firstElementChild as HTMLElement;
  document.body.append(root);
  return root;
}

function renderMenuWithAnimatedPopup(options: RenderMenuOptions = {}): HTMLElement {
  const root = renderMenu(options);
  const popup = getPopup();
  setAnimatedClose(popup);
  return root;
}

function setAnimatedClose(element: HTMLElement): void {
  element.style.animationDuration = "200ms";
  Object.defineProperty(element, "getAnimations", {
    configurable: true,
    value: () => [],
  });
}

function renderMenuWithCheckboxItem(): HTMLElement {
  const wrapper = document.createElement("div");
  wrapper.innerHTML = `
    <div data-sw-menu>
      <button data-sw-menu-trigger>Open menu</button>
      <div data-sw-menu-popup data-side="bottom" data-align="start">
        <div data-sw-menu-checkbox-item>
          <span data-sw-menu-checkbox-item-indicator>x</span>
          Email updates
        </div>
      </div>
    </div>
  `;

  const root = wrapper.firstElementChild as HTMLElement;
  document.body.append(root);
  return root;
}

function renderMenuWithRadioGroup(): HTMLElement {
  const wrapper = document.createElement("div");
  wrapper.innerHTML = `
    <div data-sw-menu>
      <button data-sw-menu-trigger>Open menu</button>
      <div data-sw-menu-popup data-side="bottom" data-align="start">
        <div data-sw-menu-radio-group data-value="compact" aria-label="Density">
          <div data-sw-menu-radio-item data-value="compact">
            <span data-sw-menu-radio-item-indicator>*</span>
            Compact
          </div>
          <div data-sw-menu-radio-item data-value="spacious">
            <span data-sw-menu-radio-item-indicator>*</span>
            Spacious
          </div>
        </div>
      </div>
    </div>
  `;

  const root = wrapper.firstElementChild as HTMLElement;
  document.body.append(root);
  return root;
}

function renderMenuWithSubmenu(options: RenderMenuOptions = {}): HTMLElement {
  const wrapper = document.createElement("div");
  wrapper.innerHTML = `
    <div data-sw-menu${options.modal ? ' data-modal="true"' : ""}${options.openOnHover ? " data-open-on-hover" : ""}>
      <button data-sw-menu-trigger>Open menu</button>
      <div data-sw-menu-popup data-side="bottom" data-align="start">
        <div data-sw-menu-item>Account</div>
        <div data-sw-menu-submenu-root>
          <div data-sw-menu-submenu-trigger>More tools</div>
          <div data-sw-menu-popup data-side="right" data-align="start">
            <div data-sw-menu-item>Invite team</div>
          </div>
        </div>
      </div>
    </div>
  `;

  const root = wrapper.firstElementChild as HTMLElement;
  document.body.append(root);
  return root;
}

function renderMenuWithSiblingSubmenus(): HTMLElement {
  const wrapper = document.createElement("div");
  wrapper.innerHTML = `
    <div data-sw-menu>
      <button data-sw-menu-trigger>Open menu</button>
      <div data-sw-menu-popup data-side="bottom" data-align="start">
        <div data-sw-menu-submenu-root>
          <div data-sw-menu-submenu-trigger>More tools</div>
          <div data-sw-menu-popup data-side="right" data-align="start">
            <div data-sw-menu-item>Invite team</div>
          </div>
        </div>
        <div data-sw-menu-submenu-root>
          <div data-sw-menu-submenu-trigger>More settings</div>
          <div data-sw-menu-popup data-side="right" data-align="start">
            <div data-sw-menu-item>Billing settings</div>
          </div>
        </div>
      </div>
    </div>
  `;

  const root = wrapper.firstElementChild as HTMLElement;
  document.body.append(root);
  return root;
}

function renderMenuWithNestedSubmenus(): HTMLElement {
  const wrapper = document.createElement("div");
  wrapper.innerHTML = `
    <div data-sw-menu>
      <button data-sw-menu-trigger>Open menu</button>
      <div data-sw-menu-popup data-side="bottom" data-align="start">
        <div data-sw-menu-submenu-root>
          <div data-sw-menu-submenu-trigger>More tools</div>
          <div data-sw-menu-popup data-side="right" data-align="start">
            <div data-sw-menu-submenu-root>
              <div data-sw-menu-submenu-trigger>Invite options</div>
              <div data-sw-menu-popup data-side="right" data-align="start">
                <div data-sw-menu-item>Invite by email</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `;

  const root = wrapper.firstElementChild as HTMLElement;
  document.body.append(root);
  return root;
}

function renderMenuWithBottomSubmenu(): HTMLElement {
  const wrapper = document.createElement("div");
  wrapper.innerHTML = `
    <div data-sw-menu>
      <button data-sw-menu-trigger>Open menu</button>
      <div data-sw-menu-popup data-side="bottom" data-align="start">
        <div data-sw-menu-submenu-root>
          <div data-sw-menu-submenu-trigger>More tools</div>
          <div
            data-sw-menu-popup
            data-side="bottom"
            data-align="start"
            data-avoid-collisions="false"
          >
            <div data-sw-menu-item>Invite team</div>
          </div>
        </div>
      </div>
    </div>
  `;

  const root = wrapper.firstElementChild as HTMLElement;
  document.body.append(root);
  return root;
}

function renderMenuWithDisabledItems(): HTMLElement {
  const wrapper = document.createElement("div");
  wrapper.innerHTML = `
    <div data-sw-menu>
      <button data-sw-menu-trigger>Open menu</button>
      <div data-sw-menu-popup data-side="bottom" data-align="start">
        <div id="disabled-action" data-sw-menu-item data-disabled>Locked action</div>
        <div id="disabled-checkbox" data-sw-menu-checkbox-item data-default-checked data-disabled>
          Locked checkbox
        </div>
        <div data-sw-menu-submenu-root>
          <div id="disabled-submenu-trigger" data-sw-menu-submenu-trigger data-disabled>
            Locked submenu
          </div>
          <div data-sw-menu-popup data-side="right" data-align="start">
            <div data-sw-menu-item>Hidden action</div>
          </div>
        </div>
        <div data-sw-menu-item>Enabled action</div>
      </div>
    </div>
  `;

  const root = wrapper.firstElementChild as HTMLElement;
  document.body.append(root);
  return root;
}

function getTrigger(): HTMLButtonElement {
  return document.querySelector<HTMLButtonElement>("[data-sw-menu-trigger]")!;
}

function getMenuTrigger(root: HTMLElement): HTMLButtonElement {
  return root.querySelector<HTMLButtonElement>("[data-sw-menu-trigger]")!;
}

function getMenuPopup(root: HTMLElement): HTMLElement {
  return root.querySelector<HTMLElement>("[data-sw-menu-popup]")!;
}

function getPopup(): HTMLElement {
  return document.querySelector<HTMLElement>("[data-sw-menu-popup]")!;
}

function getItems(): HTMLElement[] {
  return Array.from(document.querySelectorAll<HTMLElement>("[data-sw-menu-item]"));
}

function getLinkItem(testId: string): HTMLAnchorElement {
  return document.querySelector<HTMLAnchorElement>(
    `[data-sw-menu-link-item][data-testid="${testId}"]`,
  )!;
}

function getCheckboxItem(): HTMLElement {
  return document.querySelector<HTMLElement>("[data-sw-menu-checkbox-item]")!;
}

function getCheckboxItemIndicator(): HTMLElement {
  return document.querySelector<HTMLElement>("[data-sw-menu-checkbox-item-indicator]")!;
}

function getRadioGroup(): HTMLElement {
  return document.querySelector<HTMLElement>("[data-sw-menu-radio-group]")!;
}

function getRadioItem(value: string): HTMLElement {
  return document.querySelector<HTMLElement>(`[data-sw-menu-radio-item][data-value="${value}"]`)!;
}

function getRadioItemIndicator(value: string): HTMLElement {
  return getRadioItem(value).querySelector<HTMLElement>("[data-sw-menu-radio-item-indicator]")!;
}

function getDisabledItem(): HTMLElement {
  return document.querySelector<HTMLElement>("#disabled-action")!;
}

function getDisabledCheckboxItem(): HTMLElement {
  return document.querySelector<HTMLElement>("#disabled-checkbox")!;
}

function getSubmenuTrigger(): HTMLElement {
  return document.querySelector<HTMLElement>("[data-sw-menu-submenu-trigger]")!;
}

function getDisabledSubmenuTrigger(): HTMLElement {
  return document.querySelector<HTMLElement>("#disabled-submenu-trigger")!;
}

function getSubmenuPopup(): HTMLElement {
  return Array.from(document.querySelectorAll<HTMLElement>("[data-sw-menu-popup]"))[1]!;
}

function getDismissalListenerCalls(spy: { mock: { calls: unknown[][] } }) {
  return spy.mock.calls.filter(
    (call): call is [string, ...unknown[]] => call[0] === "keydown" || call[0] === "pointerdown",
  );
}

function dispatchScrollUpdate(): void {
  window.dispatchEvent(new Event("scroll"));
  window.visualViewport?.dispatchEvent(new Event("scroll"));
}

function dispatchMousePointer(element: HTMLElement, type: "pointerenter" | "pointerleave"): void {
  element.dispatchEvent(new PointerEvent(type, { bubbles: true, pointerType: "mouse" }));
}

function mockRect(
  element: HTMLElement,
  getRect: () => Pick<DOMRectInit, "height" | "width" | "x" | "y">,
) {
  return vi.spyOn(element, "getBoundingClientRect").mockImplementation(() => {
    const rect = getRect();
    return DOMRect.fromRect({
      height: rect.height,
      width: rect.width,
      x: rect.x,
      y: rect.y,
    });
  });
}

async function waitForMicrotasks(): Promise<void> {
  await Promise.resolve();
  await Promise.resolve();
}

async function collectHighlightAttributeTargets(
  root: HTMLElement,
  callback: () => void,
): Promise<Set<HTMLElement>> {
  const targets = new Set<HTMLElement>();
  const observer = new MutationObserver((records) => {
    records.forEach((record) => {
      if (record.target instanceof HTMLElement) {
        targets.add(record.target);
      }
    });
  });

  observer.observe(root, {
    attributeFilter: ["data-highlighted", "tabindex"],
    attributes: true,
    subtree: true,
  });

  callback();
  await waitForMicrotasks();
  observer.disconnect();

  return targets;
}

async function waitForFloatingPosition(): Promise<void> {
  await waitForMicrotasks();
  await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));
  await waitForMicrotasks();
}
