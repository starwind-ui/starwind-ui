import { beforeEach, describe, expect, it, vi } from "vitest";

import { initStarwind } from "../../../src/init-starwind";
import { createDialog } from "../../../src/components/dialog/dialog";
import {
  createNavigationMenu,
  type NavigationMenuValueChangeDetails,
} from "../../../src/components/navigation-menu/navigation-menu";

describe("createNavigationMenu", () => {
  beforeEach(() => {
    document.body.innerHTML = "";
    vi.useRealTimers();
  });

  it("initializes closed by default and opens item content from a trigger click", () => {
    const root = renderNavigationMenu();
    const menu = createNavigationMenu(root);

    expect(menu.getValue()).toBe(null);
    expect(getPopup().hidden).toBe(true);
    expect(getViewport().hidden).toBe(true);
    expect(getTrigger("products").getAttribute("aria-expanded")).toBe("false");
    expect(getTrigger("company").getAttribute("aria-expanded")).toBe("false");

    getTrigger("products").click();

    expect(menu.getValue()).toBe("products");
    expect(getPopup().hidden).toBe(false);
    expect(getViewport().hidden).toBe(false);
    expect(getPopup().getAttribute("data-state")).toBe("open");
    expect(getTrigger("products").getAttribute("aria-expanded")).toBe("true");
    expect(getTrigger("products").getAttribute("data-state")).toBe("open");
    expect(getTrigger("company").getAttribute("aria-expanded")).toBe("false");
    expect(getContent("products").hidden).toBe(false);
    expect(getContent("company").hidden).toBe(true);
    expect(getViewport()).toContainElement(getContent("products"));
  });

  it("promotes dialog-owned content and closes it through the owner lifecycle", () => {
    const fixture = renderNavigationMenuInDialog();
    const floatingAction = document.createElement("button");
    floatingAction.textContent = "Floating navigation action";
    getContent("products").append(floatingAction);
    const dialog = createDialog(fixture.dialogRoot);
    const menu = createNavigationMenu(fixture.menuRoot);
    const valueChanges: Array<{ reason: string; value: string | null }> = [];
    menu.subscribe("valueChange", (details) => {
      valueChanges.push({ reason: details.reason, value: details.value });
    });

    fixture.dialogTrigger.focus();
    dialog.open();
    getTrigger("products").click();
    floatingAction.focus();

    expect(menu.getValue()).toBe("products");
    expect(
      fixture.dialogContent
        .querySelector<HTMLElement>("[data-sw-floating-portal]")
        ?.matches(":popover-open"),
    ).toBe(true);
    expect(document.activeElement).toBe(floatingAction);

    dialog.close();

    expect(menu.getValue()).toBe(null);
    expect(getPopup().hidden).toBe(true);
    expect(fixture.dialogContent.open).toBe(false);
    expect(fixture.dialogContent.querySelector("[data-sw-floating-portal]")).toBeNull();
    expect(document.activeElement).toBe(fixture.dialogTrigger);
    expect(valueChanges).toEqual([
      { reason: "trigger-press", value: "products" },
      { reason: "imperative-action", value: null },
    ]);

    menu.destroy();
    dialog.destroy();
  });

  it("does not repromote an uncontrolled owner-closed menu during its exit animation", async () => {
    const fixture = renderNavigationMenuInDialog();
    const dialog = createDialog(fixture.dialogRoot);
    const menu = createNavigationMenu(fixture.menuRoot);
    const closeAnimation = createDeferred();
    Object.defineProperty(getPopup(), "getAnimations", {
      configurable: true,
      value: () => [{ finished: closeAnimation.promise }] as unknown as Animation[],
    });
    dialog.open();
    getTrigger("products").click();

    dialog.close();
    dialog.open();

    expect(menu.getValue()).toBe(null);
    expect(fixture.dialogContent.open).toBe(true);
    expect(fixture.dialogContent.querySelector("[data-sw-floating-portal]")).toBeNull();

    closeAnimation.resolve();
    await closeAnimation.promise;
    await waitForMicrotasks();

    expect(getPopup().hidden).toBe(true);
    expect(
      fixture.menuRoot.querySelector("[data-sw-nav-menu-portal]")?.contains(getPositioner()),
    ).toBe(true);
    expect(fixture.dialogContent.querySelector("[data-sw-floating-portal]")).toBeNull();

    menu.destroy();
    dialog.destroy();
  });

  it("suppresses controlled dialog content and restores only a still-open value", () => {
    const fixture = renderNavigationMenuInDialog();
    const dialog = createDialog(fixture.dialogRoot);
    dialog.open();
    const menu = createNavigationMenu(fixture.menuRoot, { value: "products" });
    const valueChanges: Array<string | null> = [];
    menu.subscribe("valueChange", (details) => valueChanges.push(details.value));

    expect(
      fixture.dialogContent
        .querySelector<HTMLElement>("[data-sw-floating-portal]")
        ?.matches(":popover-open"),
    ).toBe(true);

    dialog.close();

    expect(menu.getValue()).toBe("products");
    expect(valueChanges).toEqual([null]);
    expect(fixture.dialogContent.querySelector("[data-sw-floating-portal]")).toBeNull();

    dialog.open();
    expect(
      fixture.dialogContent
        .querySelector<HTMLElement>("[data-sw-floating-portal]")
        ?.matches(":popover-open"),
    ).toBe(true);

    dialog.close();
    menu.setValue(null, { emit: false });
    dialog.open();

    expect(menu.getValue()).toBe(null);
    expect(fixture.dialogContent.querySelector("[data-sw-floating-portal]")).toBeNull();

    menu.destroy();
    dialog.destroy();
  });

  it("does not promote a controlled value closed during a deferred exit", async () => {
    const fixture = renderNavigationMenuInDialog();
    const dialog = createDialog(fixture.dialogRoot);
    dialog.open();
    const menu = createNavigationMenu(fixture.menuRoot, { value: "products" });
    const closeAnimation = createDeferred();
    Object.defineProperty(getPopup(), "getAnimations", {
      configurable: true,
      value: () => [{ finished: closeAnimation.promise }] as unknown as Animation[],
    });

    dialog.close();
    menu.setValue(null, { emit: false });
    dialog.open();

    expect(menu.getValue()).toBe(null);
    expect(getPopup().getAttribute("data-state")).toBe("closed");
    expect(getPopup().hidden).toBe(false);
    expect(fixture.dialogContent.querySelector("[data-sw-floating-portal]")).toBeNull();

    closeAnimation.resolve();
    await closeAnimation.promise;
    await waitForMicrotasks();

    expect(getPopup().hidden).toBe(true);
    expect(
      fixture.menuRoot.querySelector("[data-sw-nav-menu-portal]")?.contains(getPositioner()),
    ).toBe(true);
    expect(fixture.dialogContent.querySelector("[data-sw-floating-portal]")).toBeNull();

    menu.destroy();
    dialog.destroy();
  });

  it("force-resets an uncontrolled menu when its owner-close intent is canceled", () => {
    const fixture = renderNavigationMenuInDialog();
    const dialog = createDialog(fixture.dialogRoot);
    const canceledDetails: NavigationMenuValueChangeDetails[] = [];
    fixture.menuRoot.addEventListener("starwind:value-change", (event) => {
      const details = (event as CustomEvent<NavigationMenuValueChangeDetails>).detail;
      if (details.value !== null) return;

      event.preventDefault();
      canceledDetails.push(details);
    });
    dialog.open();
    const menu = createNavigationMenu(fixture.menuRoot);
    getTrigger("products").click();

    dialog.close();

    expect(canceledDetails).toHaveLength(1);
    expect(canceledDetails[0]?.isCanceled).toBe(true);
    expect(menu.getValue()).toBe(null);
    expect(fixture.dialogContent.querySelector("[data-sw-floating-portal]")).toBeNull();

    dialog.open();

    expect(menu.getValue()).toBe(null);
    expect(getPopup().hidden).toBe(true);
    expect(fixture.dialogContent.querySelector("[data-sw-floating-portal]")).toBeNull();

    menu.destroy();
    dialog.destroy();
  });

  it("closes the dialog-owned menu before its dialog on successive Escape keys", () => {
    const fixture = renderNavigationMenuInDialog();
    const dialog = createDialog(fixture.dialogRoot);
    fixture.dialogTrigger.focus();
    dialog.open();
    const menu = createNavigationMenu(fixture.menuRoot);
    getTrigger("products").click();
    getContent("products").querySelector<HTMLAnchorElement>("a")!.focus();

    document.dispatchEvent(
      new KeyboardEvent("keydown", { bubbles: true, cancelable: true, key: "Escape" }),
    );

    expect(menu.getValue()).toBe(null);
    expect(fixture.dialogContent.open).toBe(true);
    expect(document.activeElement).toBe(getTrigger("products"));
    expect(fixture.dialogContent.querySelector("[data-sw-floating-portal]")).toBeNull();

    document.dispatchEvent(
      new KeyboardEvent("keydown", { bubbles: true, cancelable: true, key: "Escape" }),
    );

    expect(fixture.dialogContent.open).toBe(false);
    expect(document.activeElement).toBe(fixture.dialogTrigger);

    menu.destroy();
    dialog.destroy();
  });

  it("moves the shared session when the active trigger crosses dialog owners", () => {
    const fixture = renderNavigationMenuAcrossDialogOwners();
    const menu = createNavigationMenu(fixture.menuRoot);

    getTrigger("products").click();

    expect(
      fixture.productsOwner
        .querySelector<HTMLElement>("[data-sw-floating-portal]")
        ?.matches(":popover-open"),
    ).toBe(true);
    expect(fixture.companyOwner.querySelector("[data-sw-floating-portal]")).toBeNull();

    getTrigger("company").click();

    expect(menu.getValue()).toBe("company");
    expect(fixture.productsOwner.querySelector("[data-sw-floating-portal]")).toBeNull();
    expect(
      fixture.companyOwner
        .querySelector<HTMLElement>("[data-sw-floating-portal]")
        ?.matches(":popover-open"),
    ).toBe(true);
    expect(getTrigger("products").getAttribute("aria-expanded")).toBe("false");
    expect(getTrigger("company").getAttribute("aria-expanded")).toBe("true");

    menu.close();

    expect(fixture.productsOwner.querySelector("[data-sw-floating-portal]")).toBeNull();
    expect(fixture.companyOwner.querySelector("[data-sw-floating-portal]")).toBeNull();
    expect(fixture.authoredPortal.contains(getPositioner())).toBe(true);

    menu.destroy();
    fixture.productsOwner.close();
    fixture.companyOwner.close();
    fixture.menuRoot.remove();
  });

  it("destroys a promoted menu without stale owner registration or portal state", () => {
    const fixture = renderNavigationMenuInDialog();
    const dialog = createDialog(fixture.dialogRoot);
    dialog.open();
    const menu = createNavigationMenu(fixture.menuRoot);
    getTrigger("products").click();

    expect(
      fixture.dialogContent
        .querySelector<HTMLElement>("[data-sw-floating-portal]")
        ?.matches(":popover-open"),
    ).toBe(true);

    menu.destroy();

    expect(fixture.dialogContent.querySelector("[data-sw-floating-portal]")).toBeNull();
    expect(getPopup().hidden).toBe(true);
    expect(getViewport().hidden).toBe(true);
    expect(
      fixture.menuRoot.querySelector("[data-sw-nav-menu-portal]")?.contains(getPositioner()),
    ).toBe(true);

    dialog.close();
    dialog.open();

    expect(fixture.dialogContent.querySelector("[data-sw-floating-portal]")).toBeNull();

    dialog.destroy();
  });

  it("requires popup and viewport anatomy", () => {
    const missingPopupRoot = renderNavigationMenu();
    getPopup().remove();

    expect(() => createNavigationMenu(missingPopupRoot)).toThrow(
      "Navigation Menu requires a [data-sw-nav-menu-popup] element.",
    );

    const missingViewportRoot = renderNavigationMenu();
    getViewport().remove();

    expect(() => createNavigationMenu(missingViewportRoot)).toThrow(
      "Navigation Menu requires a [data-sw-nav-menu-viewport] element.",
    );
  });

  it("uses authored item values first and generated fallback values otherwise", () => {
    const root = renderNavigationMenuWithFallbackValues();
    const menu = createNavigationMenu(root);
    const [explicitTrigger, fallbackTrigger] = getTriggers();

    explicitTrigger.click();
    expect(menu.getValue()).toBe("explicit");

    fallbackTrigger.click();
    expect(menu.getValue()).toBe(`${root.id}-item-2`);
    expect(fallbackTrigger.getAttribute("aria-expanded")).toBe("true");
  });

  it("initializes uncontrolled state from a default value", () => {
    const root = renderNavigationMenu();
    root.setAttribute("data-default-value", "company");
    const menu = createNavigationMenu(root);

    expect(menu.getValue()).toBe("company");
    expect(getTrigger("company").getAttribute("aria-expanded")).toBe("true");
    expect(getContent("company").hidden).toBe(false);
    expect(getViewport()).toContainElement(getContent("company"));
  });

  it("supports explicit empty string item values", () => {
    const root = renderNavigationMenuWithEmptyValue();
    const menu = createNavigationMenu(root, { defaultValue: "" });
    const emptyTrigger = getTrigger("empty");
    const emptyContent = getContent("empty");
    const emptyLink = getLink("empty-primary");

    expect(menu.getValue()).toBe("");
    expect(root.getAttribute("data-state")).toBe("open");
    expect(emptyTrigger.getAttribute("aria-expanded")).toBe("true");
    expect(emptyContent.hidden).toBe(false);
    expect(getViewport()).toContainElement(emptyContent);

    menu.setValue(null, { emit: false });

    expect(menu.getValue()).toBe(null);
    expect(getPopup().hidden).toBe(true);
    expect(emptyTrigger.getAttribute("aria-expanded")).toBe("false");

    menu.setValue("", { emit: false });

    expect(menu.getValue()).toBe("");
    expect(getPopup().hidden).toBe(false);
    expect(emptyTrigger.getAttribute("aria-expanded")).toBe("true");
    expect(emptyContent.hidden).toBe(false);

    getTrigger("products").click();
    expect(menu.getValue()).toBe("products");

    emptyTrigger.click();
    expect(menu.getValue()).toBe("");
    expect(emptyTrigger.getAttribute("aria-expanded")).toBe("true");

    menu.setValue(null, { emit: false });
    emptyTrigger.focus();
    emptyTrigger.dispatchEvent(new KeyboardEvent("keydown", { bubbles: true, key: "Enter" }));

    expect(menu.getValue()).toBe("");
    expect(document.activeElement).toBe(emptyLink);
  });

  it("lets controlled value own the visible state while emitting value changes", () => {
    const root = renderNavigationMenu();
    const changes: Array<{ previousValue: string | null; reason: string; value: string | null }> =
      [];
    const menu = createNavigationMenu(root, {
      value: "products",
      onValueChange(value, details) {
        changes.push({
          previousValue: details.previousValue,
          reason: details.reason,
          value,
        });
      },
    });

    expect(menu.getValue()).toBe("products");
    expect(getTrigger("products").getAttribute("aria-expanded")).toBe("true");

    getTrigger("company").click();

    expect(changes).toEqual([
      { previousValue: "products", reason: "trigger-press", value: "company" },
    ]);
    expect(menu.getValue()).toBe("products");
    expect(getTrigger("products").getAttribute("aria-expanded")).toBe("true");

    menu.setValue("company", { emit: false });

    expect(menu.getValue()).toBe("company");
    expect(getTrigger("company").getAttribute("aria-expanded")).toBe("true");

    menu.setValue(null, { emit: false });

    expect(menu.getValue()).toBe(null);
    expect(getPopup().hidden).toBe(true);
  });

  it("lets controlled null override a default value", () => {
    const root = renderNavigationMenu();
    const changes: string[] = [];
    const menu = createNavigationMenu(root, {
      defaultValue: "products",
      value: null,
      onValueChange(value) {
        changes.push(String(value));
      },
    });

    expect(menu.getValue()).toBe(null);
    expect(getPopup().hidden).toBe(true);
    expect(getTrigger("products").getAttribute("aria-expanded")).toBe("false");

    getTrigger("products").click();

    expect(changes).toEqual(["products"]);
    expect(menu.getValue()).toBe(null);
    expect(getPopup().hidden).toBe(true);
    expect(getTrigger("products").getAttribute("aria-expanded")).toBe("false");
  });

  it("treats root data-value as controlled state for static adapters", () => {
    const root = renderNavigationMenu();
    root.setAttribute("data-value", "products");
    const menu = createNavigationMenu(root);
    const changes: string[] = [];

    root.addEventListener("starwind:value-change", (event) => {
      changes.push((event as CustomEvent).detail.value);
    });

    expect(menu.getValue()).toBe("products");
    expect(getTrigger("products").getAttribute("aria-expanded")).toBe("true");

    getTrigger("company").click();

    expect(changes).toEqual(["company"]);
    expect(menu.getValue()).toBe("products");
    expect(getTrigger("products").getAttribute("aria-expanded")).toBe("true");
    expect(getTrigger("company").getAttribute("aria-expanded")).toBe("false");
  });

  it("treats a controlled value marker without data-value as closed controlled state", () => {
    const root = renderNavigationMenu();
    root.setAttribute("data-controlled-value", "");
    root.setAttribute("data-default-value", "products");
    const menu = createNavigationMenu(root);
    const changes: string[] = [];

    root.addEventListener("starwind:value-change", (event) => {
      changes.push((event as CustomEvent).detail.value);
    });

    expect(menu.getValue()).toBe(null);
    expect(getPopup().hidden).toBe(true);
    expect(getTrigger("products").getAttribute("aria-expanded")).toBe("false");

    getTrigger("products").click();

    expect(changes).toEqual(["products"]);
    expect(menu.getValue()).toBe(null);
    expect(getPopup().hidden).toBe(true);
    expect(getTrigger("products").getAttribute("aria-expanded")).toBe("false");
  });

  it("marks active links and closes clicked links unless close-on-click is false", () => {
    const root = renderNavigationMenuWithLinks();
    const activeLink = getLink("docs");
    const persistentLink = getLink("preview");
    const reasons: string[] = [];

    activeLink.addEventListener("click", (event) => event.preventDefault());
    persistentLink.addEventListener("click", (event) => event.preventDefault());

    const menu = createNavigationMenu(root);

    root.addEventListener("starwind:value-change", (event) => {
      reasons.push((event as CustomEvent).detail.reason);
    });

    expect(menu.getValue()).toBe("products");
    expect(activeLink.hasAttribute("data-active")).toBe(true);
    expect(activeLink.getAttribute("aria-current")).toBe("page");

    persistentLink.dispatchEvent(new MouseEvent("click", { bubbles: true, cancelable: true }));

    expect(menu.getValue()).toBe("products");
    expect(getPopup().hidden).toBe(false);

    activeLink.dispatchEvent(new MouseEvent("click", { bubbles: true, cancelable: true }));

    expect(menu.getValue()).toBe(null);
    expect(getPopup().hidden).toBe(true);
    expect(reasons).toEqual(["link-press"]);
  });

  it("toggles from Enter and Space, closes from Escape, and restores trigger focus", () => {
    const root = renderNavigationMenu();
    createNavigationMenu(root);
    const trigger = getTrigger("products");

    trigger.focus();
    trigger.dispatchEvent(new KeyboardEvent("keydown", { bubbles: true, key: "Enter" }));

    expect(getPopup().hidden).toBe(false);
    expect(trigger.getAttribute("aria-expanded")).toBe("true");

    trigger.dispatchEvent(new KeyboardEvent("keydown", { bubbles: true, key: " " }));

    expect(getPopup().hidden).toBe(true);
    expect(trigger.getAttribute("aria-expanded")).toBe("false");

    trigger.dispatchEvent(new KeyboardEvent("keydown", { bubbles: true, key: "Enter" }));
    document.dispatchEvent(new KeyboardEvent("keydown", { bubbles: true, key: "Escape" }));

    expect(getPopup().hidden).toBe(true);
    expect(document.activeElement).toBe(trigger);
  });

  it("opens from Enter and Space with focus inside the popup content", () => {
    const root = renderNavigationMenuWithKeyboard();
    const menu = createNavigationMenu(root);
    const firstTrigger = getTrigger("first");
    const firstLink = getLink("first-link");
    const lastTrigger = getTrigger("last");
    const lastLink = getLink("last-link");

    firstTrigger.focus();
    firstTrigger.dispatchEvent(new KeyboardEvent("keydown", { bubbles: true, key: "Enter" }));

    expect(menu.getValue()).toBe("first");
    expect(getPopup().hidden).toBe(false);
    expect(document.activeElement).toBe(firstLink);

    firstLink.dispatchEvent(new KeyboardEvent("keydown", { bubbles: true, key: "Escape" }));
    expect(menu.getValue()).toBe(null);
    expect(document.activeElement).toBe(firstTrigger);

    lastTrigger.focus();
    lastTrigger.dispatchEvent(new KeyboardEvent("keydown", { bubbles: true, key: " " }));

    expect(menu.getValue()).toBe("last");
    expect(getPopup().hidden).toBe(false);
    expect(document.activeElement).toBe(lastLink);
  });

  it("focuses content after controlled Enter and Space openings apply the requested value", () => {
    const root = renderNavigationMenuWithKeyboard();
    let menu!: ReturnType<typeof createNavigationMenu>;
    menu = createNavigationMenu(root, {
      value: null,
      onValueChange(value, details) {
        menu.setValue(value, { emit: false, event: details.event, reason: details.reason });
      },
    });
    const firstTrigger = getTrigger("first");
    const firstLink = getLink("first-link");
    const lastTrigger = getTrigger("last");
    const lastLink = getLink("last-link");

    firstTrigger.focus();
    firstTrigger.dispatchEvent(new KeyboardEvent("keydown", { bubbles: true, key: "Enter" }));

    expect(menu.getValue()).toBe("first");
    expect(document.activeElement).toBe(firstLink);

    menu.setValue(null, { emit: false });

    lastTrigger.focus();
    lastTrigger.dispatchEvent(new KeyboardEvent("keydown", { bubbles: true, key: " " }));

    expect(menu.getValue()).toBe("last");
    expect(document.activeElement).toBe(lastLink);
  });

  it("does not move focus into popup content for pointer trigger presses", () => {
    const root = renderNavigationMenuWithKeyboard();
    const menu = createNavigationMenu(root);
    const trigger = getTrigger("first");
    const link = getLink("first-link");

    trigger.focus();
    trigger.click();

    expect(menu.getValue()).toBe("first");
    expect(getPopup().hidden).toBe(false);
    expect(document.activeElement).toBe(trigger);
    expect(document.activeElement).not.toBe(link);
  });

  it("clears pending keyboard focus when Enter opening is canceled", () => {
    const root = renderNavigationMenuWithKeyboard();
    const menu = createNavigationMenu(root);
    const trigger = getTrigger("first");
    const link = getLink("first-link");
    const event = new KeyboardEvent("keydown", { bubbles: true, key: "Enter" });

    root.addEventListener("starwind:value-change", (valueChangeEvent) => {
      valueChangeEvent.preventDefault();
    });

    trigger.focus();
    trigger.dispatchEvent(event);

    expect(menu.getValue()).toBe(null);
    expect(getPopup().hidden).toBe(true);
    expect(document.activeElement).toBe(trigger);

    menu.setValue("first", { emit: false, event, reason: "trigger-press", trigger });

    expect(menu.getValue()).toBe("first");
    expect(getPopup().hidden).toBe(false);
    expect(document.activeElement).toBe(trigger);
    expect(document.activeElement).not.toBe(link);
  });

  it("moves focus between enabled top-level triggers with horizontal arrow keys", () => {
    const root = renderNavigationMenuWithKeyboard();
    createNavigationMenu(root);
    const first = getTrigger("first");
    const disabled = getTrigger("disabled");
    const last = getTrigger("last");

    first.focus();
    first.dispatchEvent(new KeyboardEvent("keydown", { bubbles: true, key: "ArrowRight" }));

    expect(document.activeElement).toBe(last);

    last.dispatchEvent(new KeyboardEvent("keydown", { bubbles: true, key: "ArrowLeft" }));

    expect(document.activeElement).toBe(first);

    first.dispatchEvent(new KeyboardEvent("keydown", { bubbles: true, key: "End" }));

    expect(document.activeElement).toBe(last);

    last.dispatchEvent(new KeyboardEvent("keydown", { bubbles: true, key: "Home" }));

    expect(document.activeElement).toBe(first);
    expect(disabled.getAttribute("aria-expanded")).toBe("false");
  });

  it("opens horizontal menus from ArrowDown, focuses content, and restores focus from Escape", () => {
    const root = renderNavigationMenuWithKeyboard();
    const menu = createNavigationMenu(root);
    const trigger = getTrigger("first");
    const link = getLink("first-link");

    trigger.focus();
    trigger.dispatchEvent(new KeyboardEvent("keydown", { bubbles: true, key: "ArrowDown" }));

    expect(menu.getValue()).toBe("first");
    expect(getPopup().hidden).toBe(false);
    expect(document.activeElement).toBe(link);

    link.dispatchEvent(new KeyboardEvent("keydown", { bubbles: true, key: "Escape" }));

    expect(menu.getValue()).toBe(null);
    expect(document.activeElement).toBe(trigger);
  });

  it("cycles focusable controls inside popup content with arrow keys", () => {
    const root = renderNavigationMenuWithPopupFocusControls();
    createNavigationMenu(root);
    const trigger = getTrigger("first");
    const first = getLink("first-primary");
    const second = document.querySelector<HTMLButtonElement>(
      "[data-testid='button-first-secondary']",
    )!;
    const third = getLink("first-tertiary");
    const skippedTabStop = document.querySelector<HTMLButtonElement>(
      "[data-testid='button-first-skipped-tabindex']",
    )!;

    trigger.focus();
    trigger.dispatchEvent(new KeyboardEvent("keydown", { bubbles: true, key: "ArrowDown" }));

    expect(document.activeElement).toBe(first);

    first.dispatchEvent(
      new KeyboardEvent("keydown", { bubbles: true, cancelable: true, key: "ArrowDown" }),
    );
    expect(document.activeElement).toBe(second);
    expect(document.activeElement).not.toBe(skippedTabStop);

    second.dispatchEvent(
      new KeyboardEvent("keydown", { bubbles: true, cancelable: true, key: "ArrowRight" }),
    );
    expect(document.activeElement).toBe(third);

    third.dispatchEvent(
      new KeyboardEvent("keydown", { bubbles: true, cancelable: true, key: "ArrowDown" }),
    );
    expect(document.activeElement).toBe(first);

    first.dispatchEvent(
      new KeyboardEvent("keydown", { bubbles: true, cancelable: true, key: "ArrowUp" }),
    );
    expect(document.activeElement).toBe(third);

    third.dispatchEvent(
      new KeyboardEvent("keydown", { bubbles: true, cancelable: true, key: "ArrowLeft" }),
    );
    expect(document.activeElement).toBe(second);
  });

  it("moves Shift+Tab from the first popup control back to the current trigger", () => {
    const root = renderNavigationMenuWithPopupFocusControls();
    const menu = createNavigationMenu(root);
    const trigger = getTrigger("first");
    const first = getLink("first-primary");

    trigger.focus();
    trigger.dispatchEvent(new KeyboardEvent("keydown", { bubbles: true, key: "ArrowDown" }));

    expect(menu.getValue()).toBe("first");
    expect(document.activeElement).toBe(first);

    first.dispatchEvent(
      new KeyboardEvent("keydown", {
        bubbles: true,
        cancelable: true,
        key: "Tab",
        shiftKey: true,
      }),
    );

    expect(menu.getValue()).toBe("first");
    expect(document.activeElement).toBe(trigger);
  });

  it("moves Tab from the last popup control to the next enabled trigger", () => {
    const root = renderNavigationMenuWithPopupFocusControls();
    const menu = createNavigationMenu(root);
    const trigger = getTrigger("first");
    const disabledTrigger = getTrigger("disabled");
    const nextTrigger = getTrigger("last");
    const lastPopupControl = getLink("first-tertiary");

    trigger.focus();
    trigger.dispatchEvent(new KeyboardEvent("keydown", { bubbles: true, key: "ArrowDown" }));
    lastPopupControl.focus();

    lastPopupControl.dispatchEvent(
      new KeyboardEvent("keydown", { bubbles: true, cancelable: true, key: "Tab" }),
    );

    expect(menu.getValue()).toBe("first");
    expect(document.activeElement).toBe(nextTrigger);
    expect(document.activeElement).not.toBe(disabledTrigger);
  });

  it("moves Tab from the last popup control to a following link-only item", () => {
    const root = renderNavigationMenuWithTopLevelLink();
    const reasons: string[] = [];
    const menu = createNavigationMenu(root);
    const trigger = getTrigger("products");
    const popupLink =
      getContent("products").querySelector<HTMLAnchorElement>("[data-sw-nav-menu-link]")!;
    const topLevelLink = getLink("top-docs");

    root.addEventListener("starwind:value-change", (event) => {
      reasons.push((event as CustomEvent).detail.reason);
    });

    trigger.focus();
    trigger.dispatchEvent(new KeyboardEvent("keydown", { bubbles: true, key: "ArrowDown" }));
    popupLink.focus();

    popupLink.dispatchEvent(
      new KeyboardEvent("keydown", { bubbles: true, cancelable: true, key: "Tab" }),
    );

    expect(menu.getValue()).toBe(null);
    expect(document.activeElement).toBe(topLevelLink);
    expect(reasons).toEqual(["trigger-press", "focus-out"]);
  });

  it("moves Tab from the final popup to the next document control and closes", () => {
    const root = renderNavigationMenuWithPopupFocusControls();
    const reasons: string[] = [];
    const menu = createNavigationMenu(root);
    const trigger = getTrigger("last");
    const popupControl = getLink("last-primary");
    const afterNavigation = document.querySelector<HTMLButtonElement>(
      "[data-testid='button-after-navigation']",
    )!;

    root.addEventListener("starwind:value-change", (event) => {
      reasons.push((event as CustomEvent).detail.reason);
    });

    trigger.focus();
    trigger.dispatchEvent(new KeyboardEvent("keydown", { bubbles: true, key: "ArrowDown" }));

    expect(menu.getValue()).toBe("last");
    expect(document.activeElement).toBe(popupControl);

    popupControl.dispatchEvent(
      new KeyboardEvent("keydown", { bubbles: true, cancelable: true, key: "Tab" }),
    );

    expect(menu.getValue()).toBe(null);
    expect(getPopup().hidden).toBe(true);
    expect(document.activeElement).toBe(afterNavigation);
    expect(reasons).toEqual(["trigger-press", "focus-out"]);
  });

  it("respects closeOnEscape false when Escape is pressed from focused content", () => {
    const root = renderNavigationMenuWithKeyboard();
    const menu = createNavigationMenu(root, { closeOnEscape: false, defaultValue: "first" });
    const link = getLink("first-link");

    link.focus();
    const event = new KeyboardEvent("keydown", {
      bubbles: true,
      cancelable: true,
      key: "Escape",
    });
    link.dispatchEvent(event);

    expect(event.defaultPrevented).toBe(false);
    expect(menu.getValue()).toBe("first");
    expect(getPopup().hidden).toBe(false);
    expect(document.activeElement).toBe(link);
  });

  it("focuses content after controlled keyboard opening applies the requested value", () => {
    const root = renderNavigationMenuWithKeyboard();
    let menu!: ReturnType<typeof createNavigationMenu>;
    menu = createNavigationMenu(root, {
      value: null,
      onValueChange(value, details) {
        menu.setValue(value, { emit: false, event: details.event, reason: details.reason });
      },
    });
    const trigger = getTrigger("first");
    const link = getLink("first-link");

    trigger.focus();
    trigger.dispatchEvent(new KeyboardEvent("keydown", { bubbles: true, key: "ArrowDown" }));

    expect(menu.getValue()).toBe("first");
    expect(getPopup().hidden).toBe(false);
    expect(document.activeElement).toBe(link);
  });

  it("focuses content when controlled keyboard opening is applied after the request", () => {
    const root = renderNavigationMenuWithKeyboard();
    const requestedValues: Array<string | null> = [];
    let requestedDetails: NavigationMenuValueChangeDetails | undefined;
    const menu = createNavigationMenu(root, {
      value: null,
      onValueChange(value, details) {
        requestedValues.push(value);
        requestedDetails = details;
      },
    });
    const trigger = getTrigger("first");
    const link = getLink("first-link");

    trigger.focus();
    trigger.dispatchEvent(new KeyboardEvent("keydown", { bubbles: true, key: "ArrowDown" }));

    expect(requestedValues).toEqual(["first"]);
    expect(menu.getValue()).toBe(null);
    expect(document.activeElement).toBe(trigger);

    menu.setValue("first", {
      emit: false,
      event: requestedDetails?.event,
      reason: requestedDetails?.reason,
      trigger: requestedDetails?.trigger,
    });

    expect(menu.getValue()).toBe("first");
    expect(getPopup().hidden).toBe(false);
    expect(document.activeElement).toBe(link);
  });

  it("does not reuse stale controlled keyboard focus intent for unrelated value writes", () => {
    const root = renderNavigationMenuWithKeyboard();
    const menu = createNavigationMenu(root, {
      value: null,
      onValueChange() {},
    });
    const trigger = getTrigger("first");
    const link = getLink("first-link");

    trigger.focus();
    trigger.dispatchEvent(new KeyboardEvent("keydown", { bubbles: true, key: "ArrowDown" }));

    expect(menu.getValue()).toBe(null);
    expect(document.activeElement).toBe(trigger);

    menu.setValue("first", { emit: false });

    expect(menu.getValue()).toBe("first");
    expect(getPopup().hidden).toBe(false);
    expect(document.activeElement).toBe(trigger);
    expect(document.activeElement).not.toBe(link);
  });

  it("uses vertical orientation keys for roving focus and opening", () => {
    const root = renderNavigationMenuWithKeyboard({ orientation: "vertical" });
    const menu = createNavigationMenu(root);
    const first = getTrigger("first");
    const last = getTrigger("last");
    const link = getLink("last-link");

    first.focus();
    first.dispatchEvent(new KeyboardEvent("keydown", { bubbles: true, key: "ArrowDown" }));

    expect(document.activeElement).toBe(last);

    last.dispatchEvent(new KeyboardEvent("keydown", { bubbles: true, key: "ArrowUp" }));

    expect(document.activeElement).toBe(first);

    last.focus();
    last.dispatchEvent(new KeyboardEvent("keydown", { bubbles: true, key: "ArrowRight" }));

    expect(menu.getValue()).toBe("last");
    expect(document.activeElement).toBe(link);
  });

  it("resolves asChild triggers and keeps disabled child triggers inert", () => {
    const root = renderNavigationMenuWithAsChildTrigger();
    const menu = createNavigationMenu(root);
    const trigger = getTrigger("custom");
    const disabled = getTrigger("disabled-child");

    expect(trigger.getAttribute("aria-haspopup")).toBe("menu");
    expect(trigger.getAttribute("aria-expanded")).toBe("false");
    expect(trigger.hasAttribute("data-sw-nav-menu-trigger")).toBe(true);

    trigger.click();

    expect(menu.getValue()).toBe("custom");
    expect(trigger.getAttribute("aria-expanded")).toBe("true");

    trigger.dispatchEvent(new KeyboardEvent("keydown", { bubbles: true, key: "ArrowRight" }));
    expect(document.activeElement).toBe(trigger);

    const clickEvent = new MouseEvent("click", { bubbles: true, cancelable: true });
    disabled.dispatchEvent(clickEvent);
    const keyEvent = new KeyboardEvent("keydown", {
      bubbles: true,
      cancelable: true,
      key: "Enter",
    });
    disabled.dispatchEvent(keyEvent);

    expect(menu.getValue()).toBe("custom");
    expect(disabled.getAttribute("aria-disabled")).toBe("true");
    expect(clickEvent.defaultPrevented).toBe(true);
    expect(keyEvent.defaultPrevented).toBe(true);
  });

  it("closes from outside pointer interactions", () => {
    const root = renderNavigationMenu();
    const menu = createNavigationMenu(root);

    getTrigger("products").click();
    document.body.dispatchEvent(new PointerEvent("pointerdown", { bubbles: true }));

    expect(menu.getValue()).toBe(null);
    expect(getPopup().hidden).toBe(true);
    expect(getTrigger("products").getAttribute("aria-expanded")).toBe("false");
  });

  it("treats plain root wrappers as outside while preserving the Navigation Menu list", () => {
    const root = renderNavigationMenu();
    const rootRemainder = document.createElement("button");
    rootRemainder.type = "button";
    rootRemainder.textContent = "Root remainder";
    root.append(rootRemainder);

    const menu = createNavigationMenu(root);
    getTrigger("products").click();

    root
      .querySelector<HTMLElement>("[data-sw-nav-menu-list]")!
      .dispatchEvent(new PointerEvent("pointerdown", { bubbles: true }));
    expect(menu.getValue()).toBe("products");

    rootRemainder.dispatchEvent(new PointerEvent("pointerdown", { bubbles: true }));

    expect(menu.getValue()).toBe(null);
    expect(getPopup().hidden).toBe(true);
  });

  it("lets value changes be canceled before state updates", () => {
    const root = renderNavigationMenu();
    const menu = createNavigationMenu(root);
    const canceledValues: unknown[] = [];

    root.addEventListener("starwind:value-change", (event) => {
      canceledValues.push((event as CustomEvent).detail.value);
      event.preventDefault();
    });

    getTrigger("products").click();

    expect(canceledValues).toEqual(["products"]);
    expect(menu.getValue()).toBe(null);
    expect(getPopup().hidden).toBe(true);
    expect(getTrigger("products").getAttribute("aria-expanded")).toBe("false");
  });

  it("leaves navigation menu roots nested inside content inert during auto initialization", () => {
    const { innerRoot, outerRoot } = renderNestedNavigationMenus();
    outerRoot.setAttribute("data-default-value", "outer-products");
    const innerTrigger = document.querySelector<HTMLButtonElement>(
      "[data-testid='inner-trigger']",
    )!;

    const cleanup = initStarwind(document);

    expect(outerRoot.getAttribute("data-state")).toBe("open");
    expect(innerRoot.getAttribute("data-state")).toBeNull();
    expect(innerTrigger.hasAttribute("aria-controls")).toBe(false);

    innerTrigger.click();

    expect(innerRoot.getAttribute("data-state")).toBeNull();

    cleanup.destroy();
  });

  it("keeps nested navigation menu roots inert across repeated initialization after portaling", () => {
    const { innerRoot, outerRoot } = renderNestedNavigationMenus();
    outerRoot.setAttribute("data-default-value", "outer-products");
    const innerTrigger = document.querySelector<HTMLButtonElement>(
      "[data-testid='inner-trigger']",
    )!;

    const firstCleanup = initStarwind(document);
    const secondCleanup = initStarwind(document);
    const innerMenu = createNavigationMenu(innerRoot);

    expect(outerRoot.getAttribute("data-state")).toBe("open");
    expect(innerRoot.getAttribute("data-state")).toBeNull();
    expect(innerTrigger.hasAttribute("aria-controls")).toBe(false);

    innerMenu.setValue("inner-guides");
    innerTrigger.click();

    expect(innerMenu.getValue()).toBe(null);
    expect(innerRoot.getAttribute("data-state")).toBeNull();
    expect(innerTrigger.hasAttribute("aria-controls")).toBe(false);

    secondCleanup.destroy();
    firstCleanup.destroy();
  });

  it("switches active content without stale hide callbacks pulling it out of the viewport", async () => {
    const root = renderNavigationMenu();
    createNavigationMenu(root);
    const productsContent = getContent("products");
    const companyContent = getContent("company");

    productsContent.style.transitionDuration = "30ms";
    companyContent.style.transitionDuration = "30ms";

    getTrigger("products").click();
    getTrigger("company").click();
    getTrigger("products").click();

    await wait(60);

    expect(getTrigger("products").getAttribute("aria-expanded")).toBe("true");
    expect(getTrigger("company").getAttribute("aria-expanded")).toBe("false");
    expect(productsContent.hidden).toBe(false);
    expect(companyContent.hidden).toBe(true);
    expect(getViewport()).toContainElement(productsContent);
    expect(getViewport()).not.toContainElement(companyContent);
  });

  it("opens from mouse hover after root delay, ignores touch hover, and closes after close delay", () => {
    vi.useFakeTimers();
    const root = renderNavigationMenuWithTiming();
    const menu = createNavigationMenu(root);
    const trigger = getTrigger("products");

    trigger.dispatchEvent(
      new PointerEvent("pointerenter", { bubbles: true, pointerType: "touch" }),
    );
    vi.advanceTimersByTime(60);

    expect(menu.getValue()).toBe(null);

    trigger.dispatchEvent(
      new PointerEvent("pointerenter", { bubbles: true, pointerType: "mouse" }),
    );
    vi.advanceTimersByTime(49);

    expect(menu.getValue()).toBe(null);

    vi.advanceTimersByTime(1);

    expect(menu.getValue()).toBe("products");
    expect(getPopup().hidden).toBe(false);

    root.dispatchEvent(new PointerEvent("pointerleave", { bubbles: true, pointerType: "mouse" }));
    vi.advanceTimersByTime(79);

    expect(menu.getValue()).toBe("products");

    vi.advanceTimersByTime(1);

    expect(menu.getValue()).toBe(null);
    expect(getPopup().hidden).toBe(true);
  });

  it("closes an open popup when hovering a top-level link-only item", () => {
    const root = renderNavigationMenuWithTopLevelLink();
    const menu = createNavigationMenu(root);
    const linkItem = document.querySelector<HTMLElement>("[data-testid='item-docs-link']")!;

    getTrigger("products").click();

    expect(menu.getValue()).toBe("products");
    expect(getPopup().hidden).toBe(false);

    linkItem.dispatchEvent(
      new PointerEvent("pointerenter", { bubbles: false, pointerType: "mouse" }),
    );

    expect(menu.getValue()).toBe(null);
    expect(getPopup().hidden).toBe(true);
    expect(getTrigger("products").getAttribute("aria-expanded")).toBe("false");
  });

  it("cancels a pending hover open when hovering a top-level link-only item", () => {
    vi.useFakeTimers();
    const root = renderNavigationMenuWithTopLevelLink();
    root.setAttribute("data-open-delay", "100");
    const menu = createNavigationMenu(root);
    const linkItem = document.querySelector<HTMLElement>("[data-testid='item-docs-link']")!;

    getTrigger("products").dispatchEvent(
      new PointerEvent("pointerenter", { bubbles: true, pointerType: "mouse" }),
    );

    linkItem.dispatchEvent(
      new PointerEvent("pointerenter", { bubbles: false, pointerType: "mouse" }),
    );
    vi.advanceTimersByTime(100);

    expect(menu.getValue()).toBe(null);
    expect(getPopup().hidden).toBe(true);
  });

  it("lets trigger timing override root timing and switches open triggers without delay", () => {
    vi.useFakeTimers();
    const root = renderNavigationMenuWithTiming({
      companyTriggerAttributes: 'data-open-delay="100"',
      productsTriggerAttributes: 'data-open-delay="5" data-close-delay="5"',
      rootAttributes: 'data-open-delay="100" data-close-delay="100"',
    });
    const menu = createNavigationMenu(root);

    getTrigger("products").dispatchEvent(
      new PointerEvent("pointerenter", { bubbles: true, pointerType: "mouse" }),
    );
    vi.advanceTimersByTime(5);

    expect(menu.getValue()).toBe("products");

    getTrigger("company").dispatchEvent(
      new PointerEvent("pointerenter", { bubbles: true, pointerType: "mouse" }),
    );

    expect(menu.getValue()).toBe("company");
    expect(getContent("company").hidden).toBe(false);

    root.dispatchEvent(new PointerEvent("pointerleave", { bubbles: true, pointerType: "mouse" }));
    vi.advanceTimersByTime(99);

    expect(menu.getValue()).toBe("company");

    vi.advanceTimersByTime(1);

    expect(menu.getValue()).toBe(null);
  });

  it("keeps a hover-open menu active when the pointer moves into the floating surface", () => {
    vi.useFakeTimers();
    const root = renderNavigationMenuWithTiming({
      rootAttributes: 'data-open-delay="0" data-close-delay="80"',
    });
    const menu = createNavigationMenu(root);
    const trigger = getTrigger("products");

    trigger.dispatchEvent(
      new PointerEvent("pointerenter", { bubbles: true, pointerType: "mouse" }),
    );

    expect(menu.getValue()).toBe("products");

    trigger.dispatchEvent(
      new PointerEvent("pointerleave", {
        bubbles: true,
        pointerType: "mouse",
        relatedTarget: getArrow(),
      }),
    );
    root.dispatchEvent(
      new PointerEvent("pointerleave", {
        bubbles: true,
        pointerType: "mouse",
        relatedTarget: getViewport(),
      }),
    );
    vi.advanceTimersByTime(80);

    expect(menu.getValue()).toBe("products");

    getArrow().dispatchEvent(
      new PointerEvent("pointerleave", { bubbles: true, pointerType: "mouse" }),
    );
    vi.advanceTimersByTime(80);

    expect(menu.getValue()).toBe(null);
  });

  it("sizes the shared viewport, marks activation direction, initial instant state, and placement state", async () => {
    const root = renderNavigationMenuWithSizedContent();
    createNavigationMenu(root);

    getTrigger("products").click();
    expect(getPopup().hasAttribute("data-instant")).toBe(true);
    expect(getViewport().hasAttribute("data-instant")).toBe(true);
    expect(getContent("products").hasAttribute("data-instant")).toBe(true);
    await wait(0);

    expect(getViewport().style.width).toBe("240px");
    expect(getViewport().style.height).toBe("120px");
    expect(getPopup().style.width).toBe("240px");
    expect(getPopup().style.height).toBe("120px");
    expect(getPositioner().style.width).toBe("240px");
    expect(getPositioner().style.height).toBe("120px");
    expect(getPopup().style.getPropertyValue("--sw-nav-menu-viewport-width")).toBe("240px");
    expect(getPositioner().style.getPropertyValue("--sw-nav-menu-viewport-height")).toBe("120px");
    expect(getPositioner().style.getPropertyValue("--positioner-width")).toBe("240px");
    expect(getPositioner().style.getPropertyValue("--positioner-height")).toBe("120px");
    expect(getPopup().style.getPropertyValue("--popup-width")).toBe("240px");
    expect(getPopup().style.getPropertyValue("--popup-height")).toBe("120px");
    expect(getViewport().getAttribute("data-activation-direction")).toBe("initial");
    expect(getContent("products").getAttribute("data-activation-direction")).toBe("initial");
    expect(getPositioner().getAttribute("data-side")).toBe("right");
    expect(getPopup().getAttribute("data-side")).toBe("right");
    expect(getViewport().getAttribute("data-align")).toBe("end");
    expect(getArrow().getAttribute("data-side")).toBe("right");
    expect(getPopup().style.getPropertyValue("--transform-origin")).toBe("left bottom");

    getTrigger("company").click();
    expect(getPopup().hasAttribute("data-instant")).toBe(false);
    expect(getViewport().hasAttribute("data-instant")).toBe(false);
    expect(getContent("company").hasAttribute("data-instant")).toBe(false);
    expect(getContent("company").getAttribute("data-activation-direction")).toBe("next");
    await waitForBoundaryTransitionTarget();

    expect(getViewport().style.width).toBe("320px");
    expect(getViewport().style.height).toBe("90px");
    expect(getPopup().style.width).toBe("320px");
    expect(getPopup().style.height).toBe("90px");
    expect(getPositioner().style.width).toBe("320px");
    expect(getPositioner().style.height).toBe("90px");
    expect(getViewport().getAttribute("data-activation-direction")).toBe("next");

    getTrigger("enterprise").click();
    expect(getPopup().hasAttribute("data-instant")).toBe(false);
    expect(getViewport().hasAttribute("data-instant")).toBe(false);
    expect(getContent("enterprise").hasAttribute("data-instant")).toBe(false);
    expect(getContent("enterprise").getAttribute("data-activation-direction")).toBe("next");
    await waitForBoundaryTransitionTarget();

    expect(getViewport().style.width).toBe("704px");
    expect(getViewport().style.height).toBe("260px");
    expect(getPopup().style.width).toBe("704px");
    expect(getPopup().style.height).toBe("260px");
    expect(getPositioner().style.width).toBe("704px");
    expect(getPositioner().style.height).toBe("260px");
    expect(getPopup().style.getPropertyValue("--sw-nav-menu-viewport-width")).toBe("704px");
    expect(getPositioner().style.getPropertyValue("--sw-nav-menu-viewport-height")).toBe("260px");
    expect(getPositioner().style.getPropertyValue("--positioner-width")).toBe("704px");
    expect(getPositioner().style.getPropertyValue("--positioner-height")).toBe("260px");
    expect(getPopup().style.getPropertyValue("--popup-width")).toBe("704px");
    expect(getPopup().style.getPropertyValue("--popup-height")).toBe("260px");

    getTrigger("products").click();
    expect(getContent("products").getAttribute("data-activation-direction")).toBe("previous");
    await waitForBoundaryTransitionTarget();

    expect(getViewport().getAttribute("data-activation-direction")).toBe("previous");
  });

  it("repositions the open popup when visual viewport scroll changes the trigger rect", async () => {
    const root = renderNavigationMenu();
    const trigger = getTrigger("products");
    let triggerTop = 100;

    mockRect(trigger, () => ({
      height: 32,
      width: 96,
      x: 40,
      y: triggerTop,
    }));

    createNavigationMenu(root);
    trigger.click();
    await waitForFloatingPosition();

    expect(getPositioner().style.position).toBe("fixed");
    expect(getPositioner().style.top).toBe("136px");

    triggerTop = 40;
    window.visualViewport?.dispatchEvent(new Event("scroll"));
    await waitForFloatingPosition();

    expect(getPositioner().style.top).toBe("76px");
    expect(getPositioner().hasAttribute("data-instant")).toBe(true);
    expect(getPopup().hasAttribute("data-instant")).toBe(false);
    expect(getViewport().hasAttribute("data-instant")).toBe(false);
    expect(getContent("products").hasAttribute("data-instant")).toBe(false);

    trigger.click();
    await waitForFloatingPosition();
    expect(getPositioner().style.top).toBe("");

    triggerTop = 20;
    window.visualViewport?.dispatchEvent(new Event("scroll"));
    await waitForFloatingPosition();

    expect(getPositioner().style.top).toBe("");
  });

  it("keeps open content attached to the active trigger while scroll changes its rect", async () => {
    const root = renderNavigationMenuWithSizedContent();
    const trigger = getTrigger("products");
    let triggerLeft = window.innerWidth - 24;

    getPositioner().setAttribute("data-side", "bottom");
    getPositioner().setAttribute("data-align", "start");
    getPositioner().setAttribute("data-avoid-collisions", "true");
    mockRect(trigger, () => ({
      height: 40,
      width: 20,
      x: triggerLeft,
      y: 100,
    }));

    createNavigationMenu(root);
    trigger.click();
    await waitForBoundaryTransitionTarget();

    expect(getPositioner().style.width).toBe("240px");
    expect(getPositioner().style.left).toBe(`${triggerLeft + 20 - 240}px`);
    expect(getPositioner().getAttribute("data-side")).toBe("bottom");
    expect(getPositioner().getAttribute("data-align")).toBe("end");

    triggerLeft = 80;
    dispatchScrollUpdate();
    await waitForFloatingPosition();

    expect(getPositioner().style.left).toBe("80px");
    expect(getPositioner().getAttribute("data-side")).toBe("bottom");
    expect(getPositioner().getAttribute("data-align")).toBe("start");
  });

  it("refreshes popup side anchoring when auto-update flips the placement", async () => {
    const root = renderNavigationMenuWithSizedContent();
    const trigger = getTrigger("products");
    let triggerTop = 100;

    getPositioner().setAttribute("data-side", "bottom");
    getPositioner().setAttribute("data-align", "start");
    getPositioner().setAttribute("data-avoid-collisions", "true");
    mockRect(trigger, () => ({
      height: 40,
      width: 120,
      x: 40,
      y: triggerTop,
    }));

    createNavigationMenu(root);
    trigger.click();
    await waitForFloatingPosition();

    expect(getPositioner().getAttribute("data-side")).toBe("bottom");
    expect(getPopup().style.top).toBe("0px");
    expect(getPopup().style.bottom).toBe("");

    triggerTop = window.innerHeight - 60;
    window.visualViewport?.dispatchEvent(new Event("scroll"));
    await waitForFloatingPosition();

    expect(getPositioner().getAttribute("data-side")).toBe("top");
    expect(getPopup().style.bottom).toBe("0px");
    expect(getPopup().style.top).toBe("");
  });

  it("returns to the requested bottom placement when auto-update makes it fit again", async () => {
    const root = renderNavigationMenuWithSizedContent();
    const trigger = getTrigger("products");
    const viewportHeight = window.visualViewport?.height ?? window.innerHeight;
    let triggerTop = viewportHeight - 60;

    getPositioner().setAttribute("data-side", "bottom");
    getPositioner().setAttribute("data-align", "start");
    getPositioner().setAttribute("data-avoid-collisions", "true");
    mockRect(trigger, () => ({
      height: 40,
      width: 120,
      x: 40,
      y: triggerTop,
    }));

    createNavigationMenu(root);
    trigger.click();
    await waitForFloatingPosition();

    expect(getPositioner().getAttribute("data-side")).toBe("top");
    expect(getPopup().style.bottom).toBe("0px");

    triggerTop = viewportHeight - 220;
    window.visualViewport?.dispatchEvent(new Event("scroll"));
    await waitForFloatingPosition();

    expect(getPositioner().getAttribute("data-side")).toBe("bottom");
    expect(getPopup().style.top).toBe("0px");
    expect(getPopup().style.bottom).toBe("");
  });

  it("uses the requested bottom placement after a flipped popup switches references", async () => {
    const root = renderNavigationMenuWithSizedContent();
    const productsTrigger = getTrigger("products");
    const companyTrigger = getTrigger("company");
    const viewportHeight = window.visualViewport?.height ?? window.innerHeight;

    getPositioner().setAttribute("data-side", "bottom");
    getPositioner().setAttribute("data-align", "start");
    getPositioner().setAttribute("data-avoid-collisions", "true");
    mockRect(productsTrigger, () => ({
      height: 40,
      width: 120,
      x: 40,
      y: viewportHeight - 60,
    }));
    mockRect(companyTrigger, () => ({
      height: 40,
      width: 120,
      x: 200,
      y: 160,
    }));

    createNavigationMenu(root);
    productsTrigger.click();
    await waitForFloatingPosition();

    expect(getPositioner().getAttribute("data-side")).toBe("top");

    companyTrigger.click();
    await waitForBoundaryTransitionTarget();

    expect(getPositioner().getAttribute("data-side")).toBe("bottom");
    expect(getPopup().style.top).toBe("0px");
    expect(getPopup().style.bottom).toBe("");
  });

  it("uses the requested bottom placement when the popup stores resolved placement state", async () => {
    const root = renderNavigationMenuWithSizedPopup();
    const productsTrigger = getTrigger("products");
    const companyTrigger = getTrigger("company");
    const popup = getPopup();
    const viewportHeight = window.visualViewport?.height ?? window.innerHeight;

    popup.setAttribute("data-side", "bottom");
    popup.setAttribute("data-align", "start");
    popup.setAttribute("data-avoid-collisions", "true");
    mockRect(productsTrigger, () => ({
      height: 40,
      width: 120,
      x: 40,
      y: viewportHeight - 60,
    }));
    mockRect(companyTrigger, () => ({
      height: 40,
      width: 120,
      x: 200,
      y: 160,
    }));

    createNavigationMenu(root);
    productsTrigger.click();
    await waitForFloatingPosition();

    expect(popup.getAttribute("data-side")).toBe("top");
    expect(popup.style.bottom).not.toBe("");

    companyTrigger.click();
    await waitForBoundaryTransitionTarget();

    expect(popup.getAttribute("data-side")).toBe("bottom");
    expect(popup.style.top).not.toBe("");
    expect(popup.style.bottom).toBe("");
  });

  it("returns to the requested start alignment when auto-update makes it fit again", async () => {
    const root = renderNavigationMenuWithSizedContent();
    const trigger = getTrigger("products");
    const viewportWidth = window.visualViewport?.width ?? window.innerWidth;
    let triggerLeft = viewportWidth - 140;

    getPositioner().setAttribute("data-side", "bottom");
    getPositioner().setAttribute("data-align", "start");
    getPositioner().setAttribute("data-avoid-collisions", "true");
    mockRect(trigger, () => ({
      height: 40,
      width: 120,
      x: triggerLeft,
      y: 100,
    }));

    createNavigationMenu(root);
    trigger.click();
    await waitForFloatingPosition();

    expect(getPositioner().getAttribute("data-align")).toBe("end");

    triggerLeft = 40;
    window.visualViewport?.dispatchEvent(new Event("scroll"));
    await waitForFloatingPosition();

    expect(getPositioner().getAttribute("data-side")).toBe("bottom");
    expect(getPositioner().getAttribute("data-align")).toBe("start");
  });

  it("uses scroll dimensions as a floor when styled content overflows its measured box", async () => {
    const root = renderNavigationMenuWithSizedContent();
    const enterpriseContent = getContent("enterprise");

    vi.spyOn(enterpriseContent, "getBoundingClientRect").mockReturnValue({
      bottom: 180,
      height: 180,
      left: 0,
      right: 704,
      top: 0,
      width: 704,
      x: 0,
      y: 0,
      toJSON: () => ({}),
    } as DOMRect);
    Object.defineProperties(enterpriseContent, {
      offsetHeight: { configurable: true, value: 180 },
      offsetWidth: { configurable: true, value: 704 },
      scrollHeight: { configurable: true, value: 260 },
      scrollWidth: { configurable: true, value: 704 },
    });

    createNavigationMenu(root);
    getTrigger("enterprise").click();
    await wait(0);

    expect(getViewport().style.width).toBe("704px");
    expect(getViewport().style.height).toBe("260px");
    expect(getPopup().style.getPropertyValue("--sw-nav-menu-viewport-height")).toBe("260px");
  });

  it("does not expand viewport width to horizontally overflowing content", async () => {
    const root = renderNavigationMenuWithSizedContent();
    const productsContent = getContent("products");

    vi.spyOn(productsContent, "getBoundingClientRect").mockReturnValue({
      bottom: 120,
      height: 120,
      left: 0,
      right: 240,
      top: 0,
      width: 240,
      x: 0,
      y: 0,
      toJSON: () => ({}),
    } as DOMRect);
    Object.defineProperties(productsContent, {
      offsetHeight: { configurable: true, value: 120 },
      offsetWidth: { configurable: true, value: 240 },
      scrollHeight: { configurable: true, value: 120 },
      scrollWidth: { configurable: true, value: 960 },
    });

    createNavigationMenu(root);
    getTrigger("products").click();
    await wait(0);

    expect(getViewport().style.width).toBe("240px");
    expect(getPopup().style.getPropertyValue("--sw-nav-menu-viewport-width")).toBe("240px");
  });

  it("measures intrinsic child content instead of reusing the previous viewport width", async () => {
    const root = renderNavigationMenuWithIntrinsicChildContent();
    createNavigationMenu(root);

    getTrigger("wide").click();
    await wait(0);

    expect(Number.parseFloat(getViewport().style.width)).toBeGreaterThan(400);
    expect(Number.parseFloat(getViewport().style.height)).toBeGreaterThan(100);

    getTrigger("compact").click();
    await waitForBoundaryTransitionTarget();

    expect(getViewport().style.width).toBe("208px");
    expect(getViewport().style.height).toBe("68px");
    expect(getPopup().style.width).toBe("208px");
    expect(getPositioner().style.width).toBe("208px");
  });

  it("measures intrinsic child content without applying active surface transforms", async () => {
    const root = renderNavigationMenuWithIntrinsicChildContent({
      popupStyle: "transform: scale(0.95); transform-origin: top left;",
    });
    createNavigationMenu(root);

    getTrigger("compact").click();
    await wait(0);

    expect(getViewport().style.width).toBe("208px");
    expect(getViewport().style.height).toBe("68px");
    expect(getPopup().style.width).toBe("208px");
  });

  it("seeds popup bounds from the previous panel before animating to the next size", async () => {
    const root = renderNavigationMenuWithSizedContent();
    createNavigationMenu(root);

    getTrigger("products").click();
    await wait(0);

    expect(getPopup().style.width).toBe("240px");
    expect(getPopup().style.height).toBe("120px");
    expect(getViewport().style.width).toBe("240px");
    expect(getViewport().style.height).toBe("120px");

    getTrigger("company").click();

    expect(getPositioner().style.width).toBe("240px");
    expect(getPositioner().style.height).toBe("120px");
    expect(getPopup().style.width).toBe("240px");
    expect(getPopup().style.height).toBe("120px");
    expect(getViewport().style.width).toBe("240px");
    expect(getViewport().style.height).toBe("120px");

    await waitForBoundaryTransitionTarget();

    expect(getPositioner().style.width).toBe("320px");
    expect(getPositioner().style.height).toBe("90px");
    expect(getPopup().style.width).toBe("320px");
    expect(getPopup().style.height).toBe("90px");
    expect(getViewport().style.width).toBe("320px");
    expect(getViewport().style.height).toBe("90px");
  });

  it("clears measured surface dimensions after closing to avoid reserving popup layout space", async () => {
    const root = renderNavigationMenuWithSizedContent();
    createNavigationMenu(root);

    getTrigger("enterprise").click();
    await wait(0);

    expect(getPositioner().parentElement).toBe(document.body);
    expect(getPositioner().style.width).toBe("704px");
    expect(getPositioner().style.height).toBe("260px");

    getTrigger("enterprise").click();
    await wait(0);

    expect(getPositioner().parentElement).not.toBe(document.body);
    expect(getPositioner().style.width).toBe("");
    expect(getPositioner().style.height).toBe("");
    expect(getPositioner().style.getPropertyValue("--sw-nav-menu-positioner-width")).toBe("");
    expect(getPositioner().style.getPropertyValue("--sw-nav-menu-positioner-height")).toBe("");
    expect(getPositioner().style.getPropertyValue("--positioner-width")).toBe("");
    expect(getPositioner().style.getPropertyValue("--positioner-height")).toBe("");
    expect(getPositioner().style.getPropertyValue("--transform-origin")).toBe("");
    expect(getPopup().style.width).toBe("");
    expect(getPopup().style.height).toBe("");
    expect(getPopup().style.getPropertyValue("--sw-nav-menu-popup-width")).toBe("");
    expect(getPopup().style.getPropertyValue("--sw-nav-menu-popup-height")).toBe("");
    expect(getPopup().style.getPropertyValue("--popup-width")).toBe("");
    expect(getPopup().style.getPropertyValue("--popup-height")).toBe("");
    expect(getPopup().style.getPropertyValue("--transform-origin")).toBe("");
    expect(getViewport().style.width).toBe("");
    expect(getViewport().style.height).toBe("");
    expect(getViewport().style.getPropertyValue("--sw-nav-menu-viewport-width")).toBe("");
    expect(getViewport().style.getPropertyValue("--sw-nav-menu-viewport-height")).toBe("");

    getTrigger("enterprise").click();

    expect(getPositioner().parentElement).toBe(document.body);
    expect(getViewport().hasAttribute("data-instant")).toBe(true);

    await wait(0);

    expect(getViewport().style.width).toBe("704px");
    expect(getViewport().style.height).toBe("260px");
  });

  it("refreshes first-open viewport size after floating layout settles", async () => {
    const root = renderNavigationMenuWithSizedContent();
    const productsContent = getContent("products");
    let measureCount = 0;

    vi.spyOn(productsContent, "getBoundingClientRect").mockImplementation(() => {
      measureCount += 1;
      const width = measureCount === 1 ? 240 : 320;
      const height = measureCount === 1 ? 120 : 260;

      return {
        bottom: height,
        height,
        left: 0,
        right: width,
        top: 0,
        width,
        x: 0,
        y: 0,
        toJSON: () => ({}),
      } as DOMRect;
    });
    Object.defineProperties(productsContent, {
      offsetHeight: {
        configurable: true,
        get: () => (measureCount === 1 ? 120 : 260),
      },
      offsetWidth: {
        configurable: true,
        get: () => (measureCount === 1 ? 240 : 320),
      },
      scrollHeight: {
        configurable: true,
        get: () => (measureCount === 1 ? 120 : 260),
      },
      scrollWidth: {
        configurable: true,
        get: () => (measureCount === 1 ? 240 : 320),
      },
    });

    createNavigationMenu(root);
    getTrigger("products").click();

    expect(getViewport().style.width).toBe("240px");
    expect(getViewport().style.height).toBe("120px");

    await wait(50);

    expect(getViewport().style.width).toBe("320px");
    expect(getViewport().style.height).toBe("260px");
    expect(getPopup().style.getPropertyValue("--sw-nav-menu-viewport-height")).toBe("260px");
  });

  it("keeps between-panel size changes animated while old content fades out", async () => {
    const root = renderNavigationMenuWithSizedContent();
    const productsContent = getContent("products");
    const companyContent = getContent("company");

    productsContent.style.animationDuration = "100ms";
    createNavigationMenu(root);

    getTrigger("products").click();
    await wait(50);

    expect(getViewport().hasAttribute("data-instant")).toBe(false);
    expect(getPopup().hasAttribute("data-instant")).toBe(false);

    getTrigger("company").click();

    expect(getPositioner().style.width).toBe("240px");
    expect(getPositioner().style.height).toBe("120px");
    expect(getViewport().style.width).toBe("240px");
    expect(getViewport().style.height).toBe("120px");
    expect(getViewport().hasAttribute("data-instant")).toBe(false);
    expect(getPopup().hasAttribute("data-instant")).toBe(false);
    expect(companyContent.hasAttribute("data-instant")).toBe(false);
    expect(companyContent.getAttribute("data-state")).toBe("open");
    expect(productsContent.getAttribute("data-state")).toBe("closed");
    expect(productsContent.hidden).toBe(false);
    expect(getViewport()).toContainElement(productsContent);
    expect(getViewport()).toContainElement(companyContent);

    await waitForBoundaryTransitionTarget();

    expect(getPositioner().style.width).toBe("320px");
    expect(getPositioner().style.height).toBe("90px");
    expect(getViewport().style.width).toBe("320px");
    expect(getViewport().style.height).toBe("90px");
    expect(getViewport().hasAttribute("data-instant")).toBe(false);
    expect(getPopup().hasAttribute("data-instant")).toBe(false);
    expect(companyContent.hasAttribute("data-instant")).toBe(false);

    await wait(120);

    expect(productsContent.hidden).toBe(true);
    expect(getViewport()).not.toContainElement(productsContent);
  });

  it("keeps previous positioner bounds until the next frame when switching panels", async () => {
    const root = renderNavigationMenuWithSizedContent();
    mockRect(getTrigger("products"), () => ({
      height: 40,
      width: 120,
      x: 40,
      y: 100,
    }));
    mockRect(getTrigger("company"), () => ({
      height: 40,
      width: 96,
      x: 260,
      y: 100,
    }));

    createNavigationMenu(root);
    getTrigger("products").click();
    await waitForFloatingPosition();

    expect(getPositioner().style.left).toBe("164px");
    expect(getPositioner().style.width).toBe("240px");

    getTrigger("company").click();
    await waitForMicrotasks();

    expect(getPositioner().style.left).toBe("164px");
    expect(getPositioner().style.width).toBe("240px");
    expect(getPopup().style.width).toBe("240px");

    await waitForBoundaryTransitionTarget();

    expect(getPositioner().style.left).toBe("360px");
    expect(getPositioner().style.width).toBe("320px");
    expect(getPopup().style.width).toBe("320px");
  });

  it("animates the rendered popup rectangle from the previous bounds when switching panels", async () => {
    const root = renderNavigationMenuWithSizedContent();
    appendNavigationMenuTransitionStyles();
    mockRect(getTrigger("products"), () => ({
      height: 40,
      width: 120,
      x: 40,
      y: 100,
    }));
    mockRect(getTrigger("company"), () => ({
      height: 40,
      width: 96,
      x: 260,
      y: 100,
    }));

    createNavigationMenu(root);
    getTrigger("products").click();
    await waitForFloatingPosition();

    const initialRect = getPopup().getBoundingClientRect();
    expect(Math.round(initialRect.left)).toBe(164);
    expect(Math.round(initialRect.width)).toBe(240);

    getTrigger("company").click();
    await waitForBoundaryTransitionTarget();

    expect(getPositioner().style.left).toBe("360px");
    expect(getPositioner().style.width).toBe("320px");
    expect(getPositioner().hasAttribute("data-instant")).toBe(false);
    expect(getComputedStyle(getPositioner()).transitionProperty).toContain("left");
    expect(getComputedStyle(getPositioner()).transitionProperty).toContain("transform");
    expect(getComputedStyle(getPositioner()).transitionDuration).toContain("0.35s");

    const transitionStartRect = getPopup().getBoundingClientRect();
    expect(Math.round(transitionStartRect.left)).toBe(Math.round(initialRect.left));
    expect(Math.round(transitionStartRect.top)).toBe(Math.round(initialRect.top));
    expect(Math.round(transitionStartRect.width)).toBe(Math.round(initialRect.width));
    expect(Math.round(transitionStartRect.height)).toBe(Math.round(initialRect.height));

    await wait(80);

    const midTransitionRect = getPopup().getBoundingClientRect();
    expect(midTransitionRect.left).toBeGreaterThan(initialRect.left);
    expect(midTransitionRect.left).toBeLessThan(360);
    expect(midTransitionRect.width).toBeGreaterThan(initialRect.width);
    expect(midTransitionRect.width).toBeLessThan(320);

    await wait(400);

    const finalRect = getPopup().getBoundingClientRect();
    expect(Math.round(finalRect.left)).toBe(360);
    expect(Math.round(finalRect.width)).toBe(320);
  });

  it("keeps the previous rendered popup bounds when a bottom placement flips above the triggers", async () => {
    const root = renderNavigationMenuWithSizedContent();
    appendNavigationMenuTransitionStyles();
    const triggerY = window.innerHeight - 60;
    getPositioner().setAttribute("data-side", "bottom");
    getPositioner().setAttribute("data-align", "start");
    getPositioner().setAttribute("data-avoid-collisions", "true");
    mockRect(getTrigger("products"), () => ({
      height: 40,
      width: 120,
      x: 40,
      y: triggerY,
    }));
    mockRect(getTrigger("company"), () => ({
      height: 40,
      width: 96,
      x: 260,
      y: triggerY,
    }));

    createNavigationMenu(root);
    getTrigger("products").click();
    await waitForFloatingPosition();

    const initialRect = getPopup().getBoundingClientRect();
    expect(getPositioner().getAttribute("data-side")).toBe("top");
    expect(Math.round(initialRect.left)).toBe(40);
    expect(Math.round(initialRect.bottom)).toBe(triggerY - 4);
    expect(Math.round(initialRect.width)).toBe(240);
    expect(Math.round(initialRect.height)).toBe(120);

    getTrigger("company").click();
    await waitForBoundaryTransitionTarget();

    const transitionStartRect = getPopup().getBoundingClientRect();
    expect(getPositioner().getAttribute("data-side")).toBe("top");
    expect(Math.round(transitionStartRect.left)).toBe(Math.round(initialRect.left));
    expect(Math.round(transitionStartRect.top)).toBe(Math.round(initialRect.top));
    expect(Math.round(transitionStartRect.right)).toBe(Math.round(initialRect.right));
    expect(Math.round(transitionStartRect.bottom)).toBe(Math.round(initialRect.bottom));

    await wait(80);

    const midTransitionRect = getPopup().getBoundingClientRect();
    expect(midTransitionRect.bottom).toBeCloseTo(initialRect.bottom, 0);
    expect(midTransitionRect.top).toBeGreaterThan(initialRect.top);
    expect(midTransitionRect.top).toBeLessThan(triggerY - 4 - 90);
    expect(midTransitionRect.height).toBeGreaterThan(90);
    expect(midTransitionRect.height).toBeLessThan(initialRect.height);
  });

  it("clears boundary transform styles when destroyed before the morph completes", async () => {
    const root = renderNavigationMenuWithSizedContentInFloatingRoot();
    appendNavigationMenuTransitionStyles();
    mockRect(getTrigger("products"), () => ({
      height: 40,
      width: 120,
      x: 40,
      y: 100,
    }));
    mockRect(getTrigger("company"), () => ({
      height: 40,
      width: 96,
      x: 260,
      y: 100,
    }));

    const menu = createNavigationMenu(root);
    const positioner = getPositioner();
    getTrigger("products").click();
    await waitForFloatingPosition();

    getTrigger("company").click();
    await waitForBoundaryTransitionTarget();

    expect(positioner.style.transform).toContain("translate");

    menu.destroy();

    expect(positioner.style.transform).toBe("");
    expect(positioner.style.transition).toBe("");
  });

  it("keeps rendered bounds when switching again before the deferred boundary frame", async () => {
    const root = renderNavigationMenuWithSizedContent();
    mockRect(getTrigger("products"), () => ({
      height: 40,
      width: 120,
      x: 40,
      y: 100,
    }));
    mockRect(getTrigger("company"), () => ({
      height: 40,
      width: 96,
      x: 260,
      y: 100,
    }));
    mockRect(getTrigger("enterprise"), () => ({
      height: 40,
      width: 128,
      x: 420,
      y: 100,
    }));

    createNavigationMenu(root);
    getTrigger("products").click();
    await waitForFloatingPosition();

    getTrigger("company").click();
    getTrigger("enterprise").click();
    await waitForMicrotasks();

    expect(getPositioner().style.left).toBe("164px");
    expect(getPositioner().style.width).toBe("240px");
    expect(getPopup().style.width).toBe("240px");

    await waitForBoundaryTransitionTarget();

    expect(getPositioner().style.left).toBe("552px");
    expect(getPositioner().style.width).toBe("704px");
    expect(getPopup().style.width).toBe("704px");
  });

  it("clears first-open instant state before a same-frame item change", async () => {
    const root = renderNavigationMenuWithSizedContent();
    createNavigationMenu(root);

    getTrigger("products").click();
    expect(getViewport().hasAttribute("data-instant")).toBe(true);

    getTrigger("company").click();

    expect(getPositioner().style.width).toBe("240px");
    expect(getPositioner().style.height).toBe("120px");
    expect(getViewport().style.width).toBe("240px");
    expect(getViewport().style.height).toBe("120px");
    expect(getViewport().hasAttribute("data-instant")).toBe(false);
    expect(getPopup().hasAttribute("data-instant")).toBe(false);
    expect(getContent("company").hasAttribute("data-instant")).toBe(false);

    await waitForBoundaryTransitionTarget();

    expect(getPositioner().style.width).toBe("320px");
    expect(getPositioner().style.height).toBe("90px");
    expect(getViewport().style.width).toBe("320px");
    expect(getViewport().style.height).toBe("90px");
  });

  it("initializes raw HTML through initStarwind", () => {
    renderNavigationMenu();

    const cleanup = initStarwind(document);
    getTrigger("products").click();

    expect(getPopup().hidden).toBe(false);

    cleanup.destroy();

    expect(getPopup().hidden).toBe(true);
  });
});

function renderNavigationMenuAcrossDialogOwners(): {
  authoredPortal: HTMLElement;
  companyOwner: HTMLDialogElement;
  menuRoot: HTMLElement;
  productsOwner: HTMLDialogElement;
} {
  const wrapper = document.createElement("div");
  wrapper.innerHTML = `
    <nav data-sw-nav-menu aria-label="Cross-owner navigation">
      <dialog data-slot="dialog-content" data-testid="owner-products">
        <ul data-sw-nav-menu-list>
          <li data-sw-nav-menu-item data-value="products">
            <button type="button" data-sw-nav-menu-trigger data-testid="trigger-products">
              Products
            </button>
            <div data-sw-nav-menu-content data-testid="content-products">Products content</div>
          </li>
        </ul>
      </dialog>
      <dialog data-slot="dialog-content" data-testid="owner-company">
        <ul data-sw-nav-menu-list>
          <li data-sw-nav-menu-item data-value="company">
            <button type="button" data-sw-nav-menu-trigger data-testid="trigger-company">
              Company
            </button>
            <div data-sw-nav-menu-content data-testid="content-company">Company content</div>
          </li>
        </ul>
      </dialog>
      <div data-sw-nav-menu-portal>
        <div data-sw-nav-menu-positioner data-side="bottom" data-align="start">
          <div data-sw-nav-menu-popup>
            <div data-sw-nav-menu-viewport></div>
            <div data-sw-nav-menu-arrow></div>
          </div>
        </div>
      </div>
    </nav>
  `;
  const menuRoot = wrapper.firstElementChild as HTMLElement;
  const productsOwner = menuRoot.querySelector<HTMLDialogElement>(
    '[data-testid="owner-products"]',
  )!;
  const companyOwner = menuRoot.querySelector<HTMLDialogElement>('[data-testid="owner-company"]')!;
  const authoredPortal = menuRoot.querySelector<HTMLElement>("[data-sw-nav-menu-portal]")!;
  document.body.append(menuRoot);
  productsOwner.show();
  companyOwner.show();

  return { authoredPortal, companyOwner, menuRoot, productsOwner };
}

function renderNavigationMenuInDialog(): {
  dialogContent: HTMLDialogElement;
  dialogRoot: HTMLElement;
  dialogTrigger: HTMLButtonElement;
  menuRoot: HTMLElement;
} {
  const menuRoot = renderNavigationMenu();
  const wrapper = document.createElement("div");
  wrapper.innerHTML = `
    <div data-sw-dialog>
      <button data-sw-dialog-trigger>Open dialog</button>
      <dialog data-sw-dialog-content data-slot="dialog-content"></dialog>
    </div>
  `;
  const dialogRoot = wrapper.firstElementChild as HTMLElement;
  const dialogContent = dialogRoot.querySelector<HTMLDialogElement>("dialog")!;
  const dialogTrigger = dialogRoot.querySelector<HTMLButtonElement>("button")!;
  dialogContent.append(menuRoot);
  document.body.append(dialogRoot);

  return { dialogContent, dialogRoot, dialogTrigger, menuRoot };
}

function renderNavigationMenu(): HTMLElement {
  const wrapper = document.createElement("div");
  wrapper.innerHTML = `
    <nav data-sw-nav-menu aria-label="Main">
      <ul data-sw-nav-menu-list>
        <li data-sw-nav-menu-item data-value="products">
          <button type="button" data-sw-nav-menu-trigger data-testid="trigger-products">
            Products
            <span data-sw-nav-menu-icon>v</span>
          </button>
          <div data-sw-nav-menu-content data-testid="content-products">
            <a data-sw-nav-menu-link href="/docs">Docs</a>
          </div>
        </li>
        <li data-sw-nav-menu-item data-value="company">
          <button type="button" data-sw-nav-menu-trigger data-testid="trigger-company">
            Company
            <span data-sw-nav-menu-icon>v</span>
          </button>
          <div data-sw-nav-menu-content data-testid="content-company">
            <a data-sw-nav-menu-link href="/about">About</a>
          </div>
        </li>
      </ul>
      <div data-sw-nav-menu-portal>
        <div data-sw-nav-menu-positioner data-side="bottom" data-align="start">
          <div data-sw-nav-menu-popup>
            <div data-sw-nav-menu-viewport></div>
            <div data-sw-nav-menu-arrow></div>
          </div>
        </div>
      </div>
    </nav>
  `;

  const root = wrapper.firstElementChild as HTMLElement;
  document.body.append(root);
  return root;
}

function renderNavigationMenuWithTiming({
  companyTriggerAttributes = "",
  productsTriggerAttributes = "",
  rootAttributes = 'data-open-delay="50" data-close-delay="80"',
}: {
  companyTriggerAttributes?: string;
  productsTriggerAttributes?: string;
  rootAttributes?: string;
} = {}): HTMLElement {
  const wrapper = document.createElement("div");
  wrapper.innerHTML = `
    <nav data-sw-nav-menu ${rootAttributes} aria-label="Main">
      <ul data-sw-nav-menu-list>
        <li data-sw-nav-menu-item data-value="products">
          <button type="button" data-sw-nav-menu-trigger ${productsTriggerAttributes} data-testid="trigger-products">
            Products
          </button>
          <div data-sw-nav-menu-content data-testid="content-products">Products content</div>
        </li>
        <li data-sw-nav-menu-item data-value="company">
          <button type="button" data-sw-nav-menu-trigger ${companyTriggerAttributes} data-testid="trigger-company">
            Company
          </button>
          <div data-sw-nav-menu-content data-testid="content-company">Company content</div>
        </li>
      </ul>
      <div data-sw-nav-menu-portal>
        <div data-sw-nav-menu-positioner data-side="bottom" data-align="start">
          <div data-sw-nav-menu-popup>
            <div data-sw-nav-menu-viewport></div>
            <div data-sw-nav-menu-arrow></div>
          </div>
        </div>
      </div>
    </nav>
  `;

  const root = wrapper.firstElementChild as HTMLElement;
  document.body.append(root);
  return root;
}

function renderNavigationMenuWithEmptyValue(): HTMLElement {
  const wrapper = document.createElement("div");
  wrapper.innerHTML = `
    <nav data-sw-nav-menu aria-label="Main">
      <ul data-sw-nav-menu-list>
        <li data-sw-nav-menu-item data-value="">
          <button type="button" data-sw-nav-menu-trigger data-testid="trigger-empty">
            Empty
          </button>
          <div data-sw-nav-menu-content data-testid="content-empty">
            <a data-sw-nav-menu-link data-testid="link-empty-primary" href="#empty">
              Empty primary
            </a>
          </div>
        </li>
        <li data-sw-nav-menu-item data-value="products">
          <button type="button" data-sw-nav-menu-trigger data-testid="trigger-products">
            Products
          </button>
          <div data-sw-nav-menu-content data-testid="content-products">
            Products content
          </div>
        </li>
      </ul>
      <div data-sw-nav-menu-portal>
        <div data-sw-nav-menu-positioner data-side="bottom" data-align="start">
          <div data-sw-nav-menu-popup>
            <div data-sw-nav-menu-viewport></div>
            <div data-sw-nav-menu-arrow></div>
          </div>
        </div>
      </div>
    </nav>
  `;

  const root = wrapper.firstElementChild as HTMLElement;
  document.body.append(root);
  return root;
}

function renderNavigationMenuWithSizedContent(): HTMLElement {
  const wrapper = document.createElement("div");
  wrapper.innerHTML = `
    <nav data-sw-nav-menu aria-label="Main">
      <ul data-sw-nav-menu-list>
        <li data-sw-nav-menu-item data-value="products">
          <button type="button" data-sw-nav-menu-trigger data-testid="trigger-products">
            Products
          </button>
          <div data-sw-nav-menu-content data-testid="content-products" style="box-sizing: border-box; height: 120px; width: 240px;">
            Products content
          </div>
        </li>
        <li data-sw-nav-menu-item data-value="company">
          <button type="button" data-sw-nav-menu-trigger data-testid="trigger-company">
            Company
          </button>
          <div data-sw-nav-menu-content data-testid="content-company" style="box-sizing: border-box; height: 90px; width: 320px;">
            Company content
          </div>
        </li>
        <li data-sw-nav-menu-item data-value="enterprise">
          <button type="button" data-sw-nav-menu-trigger data-testid="trigger-enterprise">
            Enterprise
          </button>
          <div data-sw-nav-menu-content data-testid="content-enterprise" style="box-sizing: border-box; height: 260px; width: 704px;">
            Enterprise content
          </div>
        </li>
      </ul>
      <div data-sw-nav-menu-portal>
        <div data-sw-nav-menu-positioner data-side="right" data-align="end" data-avoid-collisions="false">
          <div data-sw-nav-menu-popup>
            <div data-sw-nav-menu-viewport></div>
            <div data-sw-nav-menu-arrow></div>
          </div>
        </div>
      </div>
    </nav>
  `;

  const root = wrapper.firstElementChild as HTMLElement;
  document.body.append(root);
  return root;
}

function renderNavigationMenuWithSizedPopup(): HTMLElement {
  const wrapper = document.createElement("div");
  wrapper.innerHTML = `
    <nav data-sw-nav-menu aria-label="Main">
      <ul data-sw-nav-menu-list>
        <li data-sw-nav-menu-item data-value="products">
          <button type="button" data-sw-nav-menu-trigger data-testid="trigger-products">
            Products
          </button>
          <div data-sw-nav-menu-content data-testid="content-products" style="box-sizing: border-box; height: 120px; width: 240px;">
            Products content
          </div>
        </li>
        <li data-sw-nav-menu-item data-value="company">
          <button type="button" data-sw-nav-menu-trigger data-testid="trigger-company">
            Company
          </button>
          <div data-sw-nav-menu-content data-testid="content-company" style="box-sizing: border-box; height: 90px; width: 320px;">
            Company content
          </div>
        </li>
      </ul>
      <div data-sw-nav-menu-portal>
        <div data-sw-nav-menu-popup data-side="bottom" data-align="start">
          <div data-sw-nav-menu-viewport></div>
          <div data-sw-nav-menu-arrow></div>
        </div>
      </div>
    </nav>
  `;

  const root = wrapper.firstElementChild as HTMLElement;
  document.body.append(root);
  return root;
}

function renderNavigationMenuWithSizedContentInFloatingRoot(): HTMLElement {
  const wrapper = document.createElement("div");
  wrapper.innerHTML = `
    <nav data-sw-nav-menu data-floating-root aria-label="Main">
      <ul data-sw-nav-menu-list>
        <li data-sw-nav-menu-item data-value="products">
          <button type="button" data-sw-nav-menu-trigger data-testid="trigger-products">
            Products
          </button>
          <div data-sw-nav-menu-content data-testid="content-products" style="box-sizing: border-box; height: 120px; width: 240px;">
            Products content
          </div>
        </li>
        <li data-sw-nav-menu-item data-value="company">
          <button type="button" data-sw-nav-menu-trigger data-testid="trigger-company">
            Company
          </button>
          <div data-sw-nav-menu-content data-testid="content-company" style="box-sizing: border-box; height: 90px; width: 320px;">
            Company content
          </div>
        </li>
      </ul>
      <div data-sw-nav-menu-positioner data-side="right" data-align="end" data-avoid-collisions="false">
        <div data-sw-nav-menu-popup>
          <div data-sw-nav-menu-viewport></div>
          <div data-sw-nav-menu-arrow></div>
        </div>
      </div>
    </nav>
  `;

  const root = wrapper.firstElementChild as HTMLElement;
  document.body.append(root);
  return root;
}

function renderNavigationMenuWithIntrinsicChildContent({
  popupStyle = "",
}: {
  popupStyle?: string;
} = {}): HTMLElement {
  const wrapper = document.createElement("div");
  wrapper.innerHTML = `
    <nav data-sw-nav-menu aria-label="Intrinsic">
      <ul data-sw-nav-menu-list>
        <li data-sw-nav-menu-item data-value="wide">
          <button type="button" data-sw-nav-menu-trigger data-testid="trigger-wide">
            Wide
          </button>
          <div data-sw-nav-menu-content data-testid="content-wide" style="box-sizing: border-box; height: 100%; width: auto; padding: 4px;">
            <div style="height: 100px; width: 400px;">Wide content</div>
          </div>
        </li>
        <li data-sw-nav-menu-item data-value="compact">
          <button type="button" data-sw-nav-menu-trigger data-testid="trigger-compact">
            Compact
          </button>
          <div data-sw-nav-menu-content data-testid="content-compact" style="box-sizing: border-box; height: 100%; width: auto; padding: 4px;">
            <div style="height: 60px; width: 200px;">Compact content</div>
          </div>
        </li>
      </ul>
      <div data-sw-nav-menu-portal>
        <div data-sw-nav-menu-positioner data-side="bottom" data-align="start">
          <div data-sw-nav-menu-popup style="${popupStyle}">
            <div data-sw-nav-menu-viewport></div>
            <div data-sw-nav-menu-arrow></div>
          </div>
        </div>
      </div>
    </nav>
  `;

  const root = wrapper.firstElementChild as HTMLElement;
  document.body.append(root);
  return root;
}

function renderNavigationMenuWithLinks(): HTMLElement {
  const wrapper = document.createElement("div");
  wrapper.innerHTML = `
    <nav data-sw-nav-menu data-default-value="products" aria-label="Main">
      <ul data-sw-nav-menu-list>
        <li data-sw-nav-menu-item data-value="products">
          <button type="button" data-sw-nav-menu-trigger data-testid="trigger-products">
            Products
          </button>
          <div data-sw-nav-menu-content data-testid="content-products">
            <a data-sw-nav-menu-link data-testid="link-docs" data-active aria-current="page" href="/docs">
              Docs
            </a>
            <a data-sw-nav-menu-link data-testid="link-preview" data-close-on-click="false" href="/preview">
              Preview
            </a>
          </div>
        </li>
        <li data-sw-nav-menu-item data-value="company">
          <button type="button" data-sw-nav-menu-trigger data-testid="trigger-company">
            Company
          </button>
          <div data-sw-nav-menu-content data-testid="content-company">Company content</div>
        </li>
      </ul>
      <div data-sw-nav-menu-portal>
        <div data-sw-nav-menu-positioner data-side="bottom" data-align="start">
          <div data-sw-nav-menu-popup>
            <div data-sw-nav-menu-viewport></div>
            <div data-sw-nav-menu-arrow></div>
          </div>
        </div>
      </div>
    </nav>
  `;

  const root = wrapper.firstElementChild as HTMLElement;
  document.body.append(root);
  return root;
}

function renderNavigationMenuWithTopLevelLink(): HTMLElement {
  const wrapper = document.createElement("div");
  wrapper.innerHTML = `
    <nav data-sw-nav-menu aria-label="Main">
      <ul data-sw-nav-menu-list>
        <li data-sw-nav-menu-item data-value="products">
          <button type="button" data-sw-nav-menu-trigger data-testid="trigger-products">
            Products
          </button>
          <div data-sw-nav-menu-content data-testid="content-products">
            <a data-sw-nav-menu-link href="/docs">Docs</a>
          </div>
        </li>
        <li data-sw-nav-menu-item data-testid="item-docs-link">
          <a data-sw-nav-menu-link data-testid="link-top-docs" href="/docs">Docs</a>
        </li>
        <li data-sw-nav-menu-item data-value="company">
          <button type="button" data-sw-nav-menu-trigger data-testid="trigger-company">
            Company
          </button>
          <div data-sw-nav-menu-content data-testid="content-company">Company content</div>
        </li>
      </ul>
      <div data-sw-nav-menu-portal>
        <div data-sw-nav-menu-positioner data-side="bottom" data-align="start">
          <div data-sw-nav-menu-popup>
            <div data-sw-nav-menu-viewport></div>
            <div data-sw-nav-menu-arrow></div>
          </div>
        </div>
      </div>
    </nav>
  `;

  const root = wrapper.firstElementChild as HTMLElement;
  document.body.append(root);
  return root;
}

function renderNavigationMenuWithKeyboard({
  orientation = "horizontal",
}: {
  orientation?: "horizontal" | "vertical";
} = {}): HTMLElement {
  const wrapper = document.createElement("div");
  wrapper.innerHTML = `
    <nav data-sw-nav-menu data-orientation="${orientation}" aria-label="Main">
      <ul data-sw-nav-menu-list>
        <li data-sw-nav-menu-item data-value="first">
          <button type="button" data-sw-nav-menu-trigger data-testid="trigger-first">
            First
          </button>
          <div data-sw-nav-menu-content data-testid="content-first">
            <a data-sw-nav-menu-link data-testid="link-first-link" href="#first">First link</a>
          </div>
        </li>
        <li data-sw-nav-menu-item data-value="disabled">
          <button type="button" data-sw-nav-menu-trigger data-disabled disabled data-testid="trigger-disabled">
            Disabled
          </button>
          <div data-sw-nav-menu-content data-testid="content-disabled">
            <a data-sw-nav-menu-link href="#disabled">Disabled link</a>
          </div>
        </li>
        <li data-sw-nav-menu-item data-value="disabled">
          <button type="button" data-sw-nav-menu-trigger data-disabled disabled data-testid="trigger-disabled">
            Disabled
          </button>
          <div data-sw-nav-menu-content data-testid="content-disabled">
            <a data-sw-nav-menu-link data-testid="link-disabled-primary" href="#disabled-primary">
              Disabled primary
            </a>
          </div>
        </li>
        <li data-sw-nav-menu-item data-value="last">
          <button type="button" data-sw-nav-menu-trigger data-testid="trigger-last">
            Last
          </button>
          <div data-sw-nav-menu-content data-testid="content-last">
            <a data-sw-nav-menu-link data-testid="link-last-link" href="#last">Last link</a>
          </div>
        </li>
      </ul>
      <div data-sw-nav-menu-portal>
        <div data-sw-nav-menu-positioner data-side="bottom" data-align="start">
          <div data-sw-nav-menu-popup>
            <div data-sw-nav-menu-viewport></div>
            <div data-sw-nav-menu-arrow></div>
          </div>
        </div>
      </div>
    </nav>
  `;

  const root = wrapper.firstElementChild as HTMLElement;
  document.body.append(root);
  return root;
}

function renderNavigationMenuWithPopupFocusControls(): HTMLElement {
  const wrapper = document.createElement("div");
  wrapper.innerHTML = `
    <nav data-sw-nav-menu aria-label="Main">
      <ul data-sw-nav-menu-list>
        <li data-sw-nav-menu-item data-value="first">
          <button type="button" data-sw-nav-menu-trigger data-testid="trigger-first">
            First
          </button>
          <div data-sw-nav-menu-content data-testid="content-first">
            <a data-sw-nav-menu-link data-testid="link-first-primary" href="#first-primary">
              First primary
            </a>
            <span hidden>
              <a data-sw-nav-menu-link data-testid="link-first-hidden" href="#first-hidden">
                First hidden
              </a>
            </span>
            <span aria-hidden="true">
              <a data-sw-nav-menu-link data-testid="link-first-aria-hidden" href="#first-aria-hidden">
                First aria hidden
              </a>
            </span>
            <button type="button" tabindex="-1" data-testid="button-first-skipped-tabindex">
              First skipped tab stop
            </button>
            <button type="button" data-testid="button-first-secondary">
              First secondary
            </button>
            <a data-sw-nav-menu-link data-testid="link-first-tertiary" href="#first-tertiary">
              First tertiary
            </a>
          </div>
        </li>
        <li data-sw-nav-menu-item data-value="last">
          <button type="button" data-sw-nav-menu-trigger data-testid="trigger-last">
            Last
          </button>
          <div data-sw-nav-menu-content data-testid="content-last">
            <a data-sw-nav-menu-link data-testid="link-last-primary" href="#last-primary">
              Last primary
            </a>
          </div>
        </li>
      </ul>
      <div data-sw-nav-menu-portal>
        <div data-sw-nav-menu-positioner data-side="bottom" data-align="start">
          <div data-sw-nav-menu-popup>
            <div data-sw-nav-menu-viewport></div>
            <div data-sw-nav-menu-arrow></div>
          </div>
        </div>
      </div>
    </nav>
  `;

  const root = wrapper.firstElementChild as HTMLElement;
  const afterNavigation = document.createElement("button");
  afterNavigation.type = "button";
  afterNavigation.dataset.testid = "button-after-navigation";
  afterNavigation.textContent = "After navigation";
  document.body.append(root, afterNavigation);
  return root;
}

function renderNavigationMenuWithAsChildTrigger(): HTMLElement {
  const wrapper = document.createElement("div");
  wrapper.innerHTML = `
    <nav data-sw-nav-menu aria-label="Main">
      <ul data-sw-nav-menu-list>
        <li data-sw-nav-menu-item data-value="custom">
          <div data-sw-nav-menu-trigger data-as-child>
            <a data-testid="trigger-custom" href="#custom">Custom trigger</a>
          </div>
          <div data-sw-nav-menu-content data-testid="content-custom">
            <a data-sw-nav-menu-link href="#custom-link">Custom link</a>
          </div>
        </li>
        <li data-sw-nav-menu-item data-value="disabled-child">
          <div data-sw-nav-menu-trigger data-as-child data-disabled aria-disabled="true">
            <a data-testid="trigger-disabled-child" href="#disabled-child">Disabled child</a>
          </div>
          <div data-sw-nav-menu-content data-testid="content-disabled-child">
            Disabled content
          </div>
        </li>
      </ul>
      <div data-sw-nav-menu-portal>
        <div data-sw-nav-menu-positioner data-side="bottom" data-align="start">
          <div data-sw-nav-menu-popup>
            <div data-sw-nav-menu-viewport></div>
            <div data-sw-nav-menu-arrow></div>
          </div>
        </div>
      </div>
    </nav>
  `;

  const root = wrapper.firstElementChild as HTMLElement;
  document.body.append(root);
  return root;
}

function renderNestedNavigationMenus(): { innerRoot: HTMLElement; outerRoot: HTMLElement } {
  const wrapper = document.createElement("div");
  wrapper.innerHTML = `
    <nav data-sw-nav-menu aria-label="Outer">
      <ul data-sw-nav-menu-list>
        <li data-sw-nav-menu-item data-value="outer-products">
          <button type="button" data-sw-nav-menu-trigger data-testid="outer-trigger">
            Outer
          </button>
          <div data-sw-nav-menu-content data-testid="outer-content">
            <nav data-sw-nav-menu data-default-value="inner-guides" aria-label="Inner">
              <ul data-sw-nav-menu-list>
                <li data-sw-nav-menu-item data-value="inner-guides">
                  <button type="button" data-sw-nav-menu-trigger data-testid="inner-trigger">
                    Guides
                  </button>
                  <div data-sw-nav-menu-content data-testid="inner-content">
                    <a data-sw-nav-menu-link data-testid="inner-link-guides" href="#guides">
                      Guides
                    </a>
                    <a
                      data-sw-nav-menu-link
                      data-close-on-click="false"
                      data-testid="inner-link-preview"
                      href="#preview"
                    >
                      Preview
                    </a>
                  </div>
                </li>
                <li data-sw-nav-menu-item data-value="inner-reference">
                  <button type="button" data-sw-nav-menu-trigger data-testid="inner-reference-trigger">
                    Reference
                  </button>
                  <div data-sw-nav-menu-content data-testid="inner-reference-content">
                    Reference content
                  </div>
                </li>
              </ul>
              <div data-sw-nav-menu-portal>
                <div data-sw-nav-menu-positioner data-side="right" data-align="start">
                  <div data-sw-nav-menu-popup>
                    <div data-sw-nav-menu-viewport></div>
                  </div>
                </div>
              </div>
            </nav>
          </div>
        </li>
      </ul>
      <div data-sw-nav-menu-portal>
        <div data-sw-nav-menu-positioner data-side="bottom" data-align="start">
          <div data-sw-nav-menu-popup>
            <div data-sw-nav-menu-viewport></div>
          </div>
        </div>
      </div>
    </nav>
  `;

  const outerRoot = wrapper.firstElementChild as HTMLElement;
  document.body.append(outerRoot);

  return {
    innerRoot: outerRoot.querySelector<HTMLElement>("[data-sw-nav-menu]")!,
    outerRoot,
  };
}

function renderNavigationMenuWithFallbackValues(): HTMLElement {
  const wrapper = document.createElement("div");
  wrapper.innerHTML = `
    <nav data-sw-nav-menu aria-label="Main">
      <ul data-sw-nav-menu-list>
        <li data-sw-nav-menu-item data-value="explicit">
          <button type="button" data-sw-nav-menu-trigger>Explicit</button>
          <div data-sw-nav-menu-content>Explicit content</div>
        </li>
        <li data-sw-nav-menu-item>
          <button type="button" data-sw-nav-menu-trigger>Fallback</button>
          <div data-sw-nav-menu-content>Fallback content</div>
        </li>
      </ul>
      <div data-sw-nav-menu-portal>
        <div data-sw-nav-menu-positioner data-side="bottom" data-align="start">
          <div data-sw-nav-menu-popup>
            <div data-sw-nav-menu-viewport></div>
            <div data-sw-nav-menu-arrow></div>
          </div>
        </div>
      </div>
    </nav>
  `;

  const root = wrapper.firstElementChild as HTMLElement;
  document.body.append(root);
  return root;
}

function getTrigger(name: string): HTMLButtonElement {
  return document.querySelector<HTMLButtonElement>(`[data-testid="trigger-${name}"]`)!;
}

function getTriggers(): HTMLButtonElement[] {
  return Array.from(document.querySelectorAll<HTMLButtonElement>("[data-sw-nav-menu-trigger]"));
}

function getContent(name: string): HTMLElement {
  return document.querySelector<HTMLElement>(`[data-testid="content-${name}"]`)!;
}

function getPopup(): HTMLElement {
  return document.querySelector<HTMLElement>("[data-sw-nav-menu-popup]")!;
}

function getPositioner(): HTMLElement {
  return document.querySelector<HTMLElement>("[data-sw-nav-menu-positioner]")!;
}

function getViewport(): HTMLElement {
  return document.querySelector<HTMLElement>("[data-sw-nav-menu-viewport]")!;
}

function getArrow(): HTMLElement {
  return document.querySelector<HTMLElement>("[data-sw-nav-menu-arrow]")!;
}

function appendNavigationMenuTransitionStyles(): void {
  const style = document.createElement("style");
  style.textContent = `
    [data-sw-nav-menu-positioner] {
      transition-property: top, left, right, bottom, transform;
      transition-duration: 350ms;
      transition-timing-function: linear;
    }

    [data-sw-nav-menu-positioner][data-instant],
    [data-sw-nav-menu-popup][data-instant] {
      transition: none !important;
    }

    [data-sw-nav-menu-popup] {
      transition-property: width, height, opacity, transform;
      transition-duration: 350ms;
      transition-timing-function: linear;
    }
  `;
  document.head.append(style);
}

function getLink(name: string): HTMLAnchorElement {
  return document.querySelector<HTMLAnchorElement>(`[data-testid="link-${name}"]`)!;
}

function createDeferred(): { promise: Promise<void>; resolve: () => void } {
  let resolve!: () => void;
  const promise = new Promise<void>((promiseResolve) => {
    resolve = promiseResolve;
  });

  return { promise, resolve };
}

function wait(milliseconds: number): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, milliseconds);
  });
}

async function waitForMicrotasks(): Promise<void> {
  await Promise.resolve();
  await Promise.resolve();
}

async function waitForFloatingPosition(): Promise<void> {
  await waitForMicrotasks();
  await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));
  await waitForMicrotasks();
}

async function waitForBoundaryTransitionTarget(): Promise<void> {
  await waitForFloatingPosition();
  await waitForFloatingPosition();
}

function dispatchScrollUpdate(): void {
  window.dispatchEvent(new Event("scroll"));
  window.visualViewport?.dispatchEvent(new Event("scroll"));
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
