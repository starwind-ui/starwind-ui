import { beforeEach, describe, expect, it, vi } from "vitest";

import { createSelect } from "../../../src/components/select/select";

describe("createSelect", () => {
  beforeEach(() => {
    document.body.innerHTML = "";
    document.body.removeAttribute("style");
    vi.useRealTimers();
  });

  it("locks body scroll by default while open", async () => {
    const root = renderSelect({ defaultValue: "system" });
    const select = createSelect(root);

    expect(document.body.hasAttribute("data-sw-scroll-locked")).toBe(false);

    getTrigger().click();
    await waitForFloatingPosition();

    expect(select.getOpen()).toBe(true);
    expect(document.body.hasAttribute("data-sw-scroll-locked")).toBe(true);

    getItems()[2].click();

    expect(select.getOpen()).toBe(false);
    expect(document.body.hasAttribute("data-sw-scroll-locked")).toBe(false);
  });

  it("leaves body scroll unlocked when modal is disabled", async () => {
    const root = renderSelect({ defaultValue: "system", modal: false });
    const select = createSelect(root);

    getTrigger().click();
    await waitForFloatingPosition();

    expect(select.getOpen()).toBe(true);
    expect(document.body.hasAttribute("data-sw-scroll-locked")).toBe(false);
  });

  it("syncs body scroll lock when modal changes while open", () => {
    const select = createSelect(renderSelect({ defaultValue: "system", modal: false }));

    select.setOpen(true, { emit: false });

    expect(document.body.hasAttribute("data-sw-scroll-locked")).toBe(false);

    select.setModal(true);

    expect(document.body.hasAttribute("data-sw-scroll-locked")).toBe(true);

    select.setModal(false);

    expect(document.body.hasAttribute("data-sw-scroll-locked")).toBe(false);
  });

  it("releases a default modal lock when destroyed while open", () => {
    const select = createSelect(renderSelect({ defaultValue: "system" }));

    select.setOpen(true, { emit: false });

    expect(document.body.hasAttribute("data-sw-scroll-locked")).toBe(true);

    select.destroy();

    expect(document.body.hasAttribute("data-sw-scroll-locked")).toBe(false);
  });

  it("keeps an existing document lock active after a default modal select closes", () => {
    const external = createSelect(renderSelect({ defaultValue: "system" }));
    const select = createSelect(renderSelect({ defaultValue: "light" }));

    external.setOpen(true, { emit: false });
    select.setOpen(true, { emit: false });

    expect(document.body.hasAttribute("data-sw-scroll-locked")).toBe(true);

    select.setOpen(false, { emit: false });

    expect(document.body.hasAttribute("data-sw-scroll-locked")).toBe(true);

    external.setOpen(false, { emit: false });

    expect(document.body.hasAttribute("data-sw-scroll-locked")).toBe(false);
  });

  it("initializes an uncontrolled select with default value and hidden form value", () => {
    const root = renderSelect({ defaultValue: "system", name: "theme", required: true });
    const select = createSelect(root);

    expect(select.getValue()).toBe("system");
    expect(getTrigger().getAttribute("role")).toBe("combobox");
    expect(getTrigger().getAttribute("aria-haspopup")).toBe("listbox");
    expect(getTrigger().getAttribute("aria-expanded")).toBe("false");
    expect(getTrigger().getAttribute("aria-controls")).toBe(getPopup().id);
    expect(getPopup().getAttribute("role")).toBe("listbox");
    expect(getPopup().hidden).toBe(true);
    expect(getValue().textContent).toBe("System");
    expect(getInput().type).toBe("hidden");
    expect(getInput().name).toBe("theme");
    expect(getInput().value).toBe("system");
    expect(root.hasAttribute("data-placeholder")).toBe(false);
  });

  it("renders closed value state without collecting every popup item", () => {
    const root = renderSelect({ defaultValue: "system", name: "theme" });
    const querySelectorAll = vi.spyOn(getPopup(), "querySelectorAll");

    createSelect(root);

    expect(getValue().textContent).toBe("System");
    expect(getInput().value).toBe("system");
    expect(querySelectorAll).not.toHaveBeenCalledWith("[data-sw-select-item]");
  });

  it("uses an adapter-provided selected label when closed item DOM is lazy", () => {
    document.body.innerHTML = `
      <div data-sw-select data-default-value="system" data-selected-value="system" data-selected-label="System">
        <button data-sw-select-trigger type="button">
          <span data-sw-select-value data-placeholder="Pick theme"></span>
        </button>
        <input data-sw-select-input type="hidden" name="theme" />
        <div data-sw-select-portal>
          <div data-sw-select-positioner>
            <div data-sw-select-popup role="listbox" hidden></div>
          </div>
        </div>
      </div>
    `;

    const root = document.querySelector<HTMLElement>("[data-sw-select]")!;
    const select = createSelect(root);

    expect(select.getValue()).toBe("system");
    expect(root.querySelector("[data-sw-select-value]")?.textContent).toBe("System");
    expect(root.querySelector<HTMLInputElement>("[data-sw-select-input]")?.value).toBe("system");
    expect(root.hasAttribute("data-placeholder")).toBe(false);
    expect(root.getAttribute("data-value")).toBe("system");
  });

  it("keeps an empty string value as clear/no-value semantics", () => {
    const root = renderSelect({ defaultValue: "system", name: "theme" });
    const select = createSelect(root);

    select.setValue("", { emit: false });

    expect(select.getValue()).toBeNull();
    expect(getInput().value).toBe("");
    expect(getValue().textContent).toBe("Pick theme");
    expect(root.hasAttribute("data-placeholder")).toBe(true);
    expect(getItem("system").getAttribute("aria-selected")).not.toBe("true");
    expect(getItem("system").hasAttribute("data-selected")).toBe(false);
  });

  it("requires trigger and popup anatomy", () => {
    const missingTriggerRoot = renderSelect();
    missingTriggerRoot.querySelector("[data-sw-select-trigger]")?.remove();

    expect(() => createSelect(missingTriggerRoot)).toThrow(
      "Select requires a [data-sw-select-trigger] element.",
    );

    const missingPopupRoot = renderSelect();
    missingPopupRoot.querySelector("[data-sw-select-popup]")?.remove();

    expect(() => createSelect(missingPopupRoot)).toThrow(
      "Select requires a [data-sw-select-popup] element.",
    );
  });

  it("opens from trigger interactions and selects an item", async () => {
    const root = renderSelect({ defaultValue: "system", name: "theme" });
    const listener = vi.fn();
    root.addEventListener("starwind:value-change", listener);
    root.addEventListener("starwind:open-change", listener);
    const select = createSelect(root);

    getTrigger().click();
    await waitForFloatingPosition();

    expect(select.getOpen()).toBe(true);
    expect(getPopup().hidden).toBe(false);
    expect(getTrigger().getAttribute("aria-expanded")).toBe("true");
    expect(getItems()[1].hasAttribute("data-highlighted")).toBe(true);
    expect(getItems()[1].getAttribute("aria-selected")).toBe("true");
    expect(getItems()[0].getAttribute("aria-selected")).toBe("false");
    expect(getItems()[1].querySelector("[data-sw-select-item-indicator]")).toHaveProperty(
      "hidden",
      false,
    );
    expect(document.activeElement).toBe(getItems()[1]);

    getItems()[2].click();

    expect(select.getOpen()).toBe(false);
    expect(select.getValue()).toBe("dark");
    expect(getInput().value).toBe("dark");
    expect(getValue().textContent).toBe("Dark");
    expect(getItems()[2].getAttribute("aria-selected")).toBe("true");
    expect(getItems()[1].getAttribute("aria-selected")).toBe("false");
    expect(document.activeElement).toBe(getTrigger());
    expect(listener).toHaveBeenCalledWith(
      expect.objectContaining({
        detail: expect.objectContaining({ reason: "item-press", value: "dark" }),
      }),
    );
  });

  it("allows onOpenChange details cancellation before Select state changes", () => {
    const root = renderSelect({ defaultValue: "system" });
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

    const select = createSelect(root, { onOpenChange });
    const subscriber = vi.fn();
    select.subscribe("openChange", subscriber);
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
    expect(select.getOpen()).toBe(false);
    expect(getPopup().hidden).toBe(true);
    expect(getTrigger().getAttribute("aria-expanded")).toBe("false");
    expect(document.body.hasAttribute("data-sw-scroll-locked")).toBe(false);
  });

  it("allows starwind:open-change preventDefault before Select state changes", () => {
    const root = renderSelect({ defaultValue: "system" });
    root.addEventListener("starwind:open-change", (event) => event.preventDefault());

    const select = createSelect(root);
    const subscriber = vi.fn();
    select.subscribe("openChange", subscriber);
    getTrigger().click();

    expect(subscriber).not.toHaveBeenCalled();
    expect(select.getOpen()).toBe(false);
    expect(getPopup().hidden).toBe(true);
    expect(getTrigger().getAttribute("aria-expanded")).toBe("false");
    expect(document.body.hasAttribute("data-sw-scroll-locked")).toBe(false);
  });

  it("allows onValueChange details cancellation before Select value changes", async () => {
    const root = renderSelect({ defaultValue: "system", name: "theme" });
    const canceledSnapshots: boolean[] = [];
    let callbackDetails: unknown;
    let eventDetails: unknown;
    const onValueChange = vi.fn((_value, details) => {
      callbackDetails = details;
      canceledSnapshots.push(details.isCanceled);
      details.cancel();
      canceledSnapshots.push(details.isCanceled);
    });
    const valueChangeListener = vi.fn((event: Event) => {
      eventDetails = (event as CustomEvent).detail;
    });
    root.addEventListener("starwind:value-change", valueChangeListener);

    const select = createSelect(root, { onValueChange });
    const subscriber = vi.fn();
    select.subscribe("valueChange", subscriber);
    getTrigger().click();
    await waitForFloatingPosition();

    getItem("dark").click();

    expect(onValueChange).toHaveBeenCalledWith(
      "dark",
      expect.objectContaining({
        isCanceled: true,
        previousValue: "system",
        reason: "item-press",
        value: "dark",
      }),
    );
    expect(canceledSnapshots).toEqual([false, true]);
    expect(valueChangeListener).toHaveBeenCalledTimes(1);
    expect(eventDetails).toBe(callbackDetails);
    expect(subscriber).not.toHaveBeenCalled();
    expect(select.getValue()).toBe("system");
    expect(getInput().value).toBe("system");
    expect(getItem("system").getAttribute("aria-selected")).toBe("true");
    expect(getItem("dark").getAttribute("aria-selected")).toBe("false");
    expect(select.getOpen()).toBe(true);
    expect(getPopup().hidden).toBe(false);
  });

  it("allows starwind:value-change preventDefault before Select value changes", async () => {
    const root = renderSelect({ defaultValue: "system", name: "theme" });
    root.addEventListener("starwind:value-change", (event) => event.preventDefault());

    const select = createSelect(root);
    const subscriber = vi.fn();
    select.subscribe("valueChange", subscriber);
    getTrigger().click();
    await waitForFloatingPosition();

    getItem("dark").click();

    expect(subscriber).not.toHaveBeenCalled();
    expect(select.getValue()).toBe("system");
    expect(getInput().value).toBe("system");
    expect(getItem("system").getAttribute("aria-selected")).toBe("true");
    expect(getItem("dark").getAttribute("aria-selected")).toBe("false");
    expect(select.getOpen()).toBe(true);
    expect(getPopup().hidden).toBe(false);
  });

  it("preserves the onOpenChange callback receiver", () => {
    const root = renderSelect({ defaultValue: "system" });
    const receivers: unknown[] = [];

    const select = createSelect(root, {
      onOpenChange: function onOpenChange(this: unknown) {
        receivers.push(this);
      },
    });
    getTrigger().click();

    expect(receivers).toEqual([select]);

    select.destroy();
  });

  it("clears highlighted item state when destroyed while open", async () => {
    const root = renderSelect({ defaultValue: "system" });
    const select = createSelect(root);

    getTrigger().click();
    await waitForFloatingPosition();

    expect(getItem("system")).toHaveAttribute("data-highlighted");

    select.destroy();

    expect(getItem("system").hasAttribute("data-highlighted")).toBe(false);
    expect(getItem("system").getAttribute("tabindex")).toBe("-1");
  });

  it("supports keyboard navigation, typeahead, Escape, and outside close", async () => {
    const root = renderSelect({ defaultValue: "system" });
    const select = createSelect(root);

    getTrigger().dispatchEvent(new KeyboardEvent("keydown", { bubbles: true, key: "ArrowDown" }));
    await waitForFloatingPosition();

    expect(select.getOpen()).toBe(true);
    expect(document.activeElement).toBe(getItems()[1]);

    getPopup().dispatchEvent(new KeyboardEvent("keydown", { bubbles: true, key: "ArrowDown" }));
    expect(document.activeElement).toBe(getItems()[2]);

    getPopup().dispatchEvent(new KeyboardEvent("keydown", { bubbles: true, key: "l" }));
    expect(document.activeElement).toBe(getItems()[0]);

    getPopup().dispatchEvent(new KeyboardEvent("keydown", { bubbles: true, key: "Enter" }));
    expect(select.getValue()).toBe("light");
    expect(getPopup().hidden).toBe(true);
    expect(document.activeElement).toBe(getTrigger());

    getTrigger().click();
    await waitForFloatingPosition();
    document.dispatchEvent(new KeyboardEvent("keydown", { bubbles: true, key: "Escape" }));
    expect(getPopup().hidden).toBe(true);
    expect(document.activeElement).toBe(getTrigger());

    getTrigger().click();
    await waitForFloatingPosition();
    getItems()[1].focus();
    document.body.dispatchEvent(new PointerEvent("pointerdown", { bubbles: true }));
    expect(getPopup().hidden).toBe(true);
    expect(document.activeElement).not.toBe(getTrigger());
  });

  it("supports Home and End keyboard focus while open", async () => {
    const root = renderSelect({ defaultValue: "system" });
    createSelect(root);

    getTrigger().click();
    await waitForFloatingPosition();

    getPopup().dispatchEvent(new KeyboardEvent("keydown", { bubbles: true, key: "End" }));

    expect(document.activeElement).toBe(getItem("auto"));
    expect(getItem("auto")).toHaveAttribute("data-highlighted");

    getPopup().dispatchEvent(new KeyboardEvent("keydown", { bubbles: true, key: "Home" }));

    expect(document.activeElement).toBe(getItem("light"));
    expect(getItem("light")).toHaveAttribute("data-highlighted");
  });

  it("registers global dismissal listeners only while select instances are open", () => {
    const addListener = vi.spyOn(document, "addEventListener");
    const removeListener = vi.spyOn(document, "removeEventListener");
    try {
      const first = createSelect(renderSelect({ defaultValue: "system" }));
      const second = createSelect(renderSelect({ defaultValue: "light" }));

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

  it("removes global dismissal listeners when an open select is destroyed", () => {
    const removeListener = vi.spyOn(document, "removeEventListener");
    try {
      const select = createSelect(renderSelect({ defaultValue: "system" }));

      select.setOpen(true, { emit: false });
      removeListener.mockClear();

      select.destroy();

      expect(getDismissalListenerCalls(removeListener).map(([type]) => type)).toEqual([
        "keydown",
        "pointerdown",
      ]);
    } finally {
      removeListener.mockRestore();
    }
  });

  it("keeps a portaled positioner mounted until close animations finish", async () => {
    const root = renderSelect({ alignItemWithTrigger: false, defaultValue: "system" });
    const select = createSelect(root);
    mockRect(getTrigger(), { height: 32, width: 240, x: 100, y: 100 });

    getTrigger().click();
    await waitForFloatingPosition();

    const animationFinished = createDeferred<void>();
    vi.spyOn(getPopup(), "getAnimations").mockReturnValue([
      { finished: animationFinished.promise } as unknown as Animation,
    ]);

    expect(getPositioner().parentElement).toBe(document.body);
    expect(getPopup().style.getPropertyValue("--anchor-width")).toBe("240px");
    expect(getPositioner().style.getPropertyValue("--anchor-width")).toBe("240px");

    select.close();
    await waitForMicrotasks();

    expect(getPopup()).toHaveAttribute("data-state", "closed");
    expect(getPopup()).toHaveAttribute("data-ending-style");
    expect(getPopup().hidden).toBe(false);
    expect(getPositioner().parentElement).toBe(document.body);

    animationFinished.resolve();
    await animationFinished.promise;
    await waitForMicrotasks();

    expect(getPopup().hidden).toBe(true);
    expect(getPositioner().parentElement).toBe(root);
    expect(getPopup().style.getPropertyValue("--anchor-width")).toBe("");
    expect(getPositioner().style.getPropertyValue("--anchor-width")).toBe("");
    expect(getPopup().style.position).toBe("");
    expect(getPopup().style.left).toBe("");
    expect(getPopup().style.top).toBe("");
  });

  it("restores portaled content when destroyed during close animation", async () => {
    const root = renderSelect({
      alignItemWithTrigger: false,
      defaultValue: "system",
      modal: false,
    });
    const select = createSelect(root);

    getTrigger().click();
    await waitForFloatingPosition();

    const animationFinished = createDeferred<void>();
    vi.spyOn(getPopup(), "getAnimations").mockReturnValue([
      { finished: animationFinished.promise } as unknown as Animation,
    ]);

    expect(getPositioner().parentElement).toBe(document.body);

    select.close();
    await waitForMicrotasks();

    expect(getPopup().hidden).toBe(false);
    expect(getPositioner().parentElement).toBe(document.body);

    select.destroy();

    expect(getPopup().hidden).toBe(true);
    expect(getPositioner().parentElement).toBe(root);

    animationFinished.resolve();
    await animationFinished.promise;
    await waitForMicrotasks();

    expect(getPopup().hidden).toBe(true);
    expect(getPositioner().parentElement).toBe(root);
  });

  it("lets the topmost select own Escape focus restoration", () => {
    const firstRoot = renderSelect({ defaultValue: "system" });
    const secondRoot = renderSelect({ defaultValue: "light" });
    const firstTrigger = getSelectTrigger(firstRoot);
    const secondTrigger = getSelectTrigger(secondRoot);
    const first = createSelect(firstRoot);
    const second = createSelect(secondRoot);

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

  it("reuses the open item collection during keyboard navigation", async () => {
    const root = renderSelect({ defaultValue: "system" });
    createSelect(root);

    getTrigger().click();
    await waitForFloatingPosition();

    const querySelectorAll = vi.spyOn(getPopup(), "querySelectorAll");
    getPopup().dispatchEvent(new KeyboardEvent("keydown", { bubbles: true, key: "ArrowDown" }));

    expect(document.activeElement).toBe(getItem("dark"));
    expect(querySelectorAll).not.toHaveBeenCalledWith("[data-sw-select-item]");
  });

  it("does not treat nested highlighted descendants as select items", () => {
    renderSelect({ defaultValue: "system" });
    const nested = getItem("dark").querySelector<HTMLElement>("[data-sw-select-item-text]")!;
    nested.setAttribute("data-highlighted", "");

    createSelect(document.querySelector<HTMLElement>("[data-sw-select]")!);

    expect(nested.hasAttribute("data-highlighted")).toBe(true);
  });

  it("refreshes the open item collection when options change", async () => {
    renderSelect({ defaultValue: "system" });
    createSelect(document.querySelector<HTMLElement>("[data-sw-select]")!);

    getTrigger().click();
    await waitForFloatingPosition();

    const item = document.createElement("div");
    item.setAttribute("data-sw-select-item", "");
    item.setAttribute("data-value", "custom");
    item.innerHTML = `
      <span data-sw-select-item-text>Custom</span>
      <span data-sw-select-item-indicator hidden>check</span>
    `;
    getList().append(item);
    await waitForMicrotasks();

    getPopup().dispatchEvent(new KeyboardEvent("keydown", { bubbles: true, key: "End" }));

    expect(document.activeElement).toBe(item);
    expect(item.getAttribute("role")).toBe("option");
    expect(item.id).toMatch(/^sw-select-item-/);
  });

  it("refreshes the open item collection when options are removed", async () => {
    renderSelect({ defaultValue: "system" });
    createSelect(document.querySelector<HTMLElement>("[data-sw-select]")!);

    getTrigger().click();
    await waitForFloatingPosition();

    getItem("auto").remove();
    await waitForMicrotasks();

    getPopup().dispatchEvent(new KeyboardEvent("keydown", { bubbles: true, key: "End" }));

    expect(document.activeElement).toBe(getItem("dark"));
  });

  it("refreshes the open item collection when option membership changes", async () => {
    renderSelect({ defaultValue: "system" });
    createSelect(document.querySelector<HTMLElement>("[data-sw-select]")!);

    getTrigger().click();
    await waitForFloatingPosition();

    const item = document.createElement("div");
    item.setAttribute("data-value", "custom");
    item.innerHTML = `
      <span data-sw-select-item-text>Custom</span>
      <span data-sw-select-item-indicator hidden>check</span>
    `;
    getList().append(item);
    await waitForMicrotasks();

    item.setAttribute("data-sw-select-item", "");
    await waitForMicrotasks();

    getPopup().dispatchEvent(new KeyboardEvent("keydown", { bubbles: true, key: "End" }));

    expect(document.activeElement).toBe(item);
    expect(item.getAttribute("role")).toBe("option");
  });

  it("refreshes a closed item collection on the next open", async () => {
    renderSelect({ defaultValue: "system" });
    createSelect(document.querySelector<HTMLElement>("[data-sw-select]")!);

    const item = document.createElement("div");
    item.setAttribute("data-sw-select-item", "");
    item.setAttribute("data-value", "custom");
    item.innerHTML = `
      <span data-sw-select-item-text>Custom</span>
      <span data-sw-select-item-indicator hidden>check</span>
    `;
    getList().append(item);

    getTrigger().click();
    await waitForFloatingPosition();
    getPopup().dispatchEvent(new KeyboardEvent("keydown", { bubbles: true, key: "End" }));

    expect(document.activeElement).toBe(item);
    expect(item.getAttribute("role")).toBe("option");
  });

  it("keeps the active item identity when options are inserted before it", async () => {
    const root = renderSelect({ defaultValue: "system" });
    const select = createSelect(root);

    getTrigger().click();
    await waitForFloatingPosition();

    expect(document.activeElement).toBe(getItem("system"));

    const item = document.createElement("div");
    item.setAttribute("data-sw-select-item", "");
    item.setAttribute("data-value", "custom");
    item.innerHTML = `
      <span data-sw-select-item-text>Custom</span>
      <span data-sw-select-item-indicator hidden>check</span>
    `;
    getList().insertBefore(item, getItem("light"));
    await waitForMicrotasks();

    getPopup().dispatchEvent(new KeyboardEvent("keydown", { bubbles: true, key: "Enter" }));

    expect(select.getValue()).toBe("system");
  });

  it("selects a value from a root-scoped starwind:set-value command", () => {
    const root = renderSelect({ defaultValue: "system", name: "theme" });
    const select = createSelect(root);

    root.dispatchEvent(
      new CustomEvent("starwind:set-value", {
        detail: { value: "dark" },
      }),
    );

    expect(select.getValue()).toBe("dark");
    expect(getValue().textContent).toBe("Dark");
    expect(getInput().value).toBe("dark");
  });

  it("reconciles a closed programmatic value update when opened", async () => {
    const root = renderSelect({ defaultValue: "system", name: "theme" });
    const select = createSelect(root);

    select.setValue("dark", { emit: false });

    expect(getValue().textContent).toBe("Dark");
    expect(getInput().value).toBe("dark");

    getTrigger().click();
    await waitForFloatingPosition();

    expect(document.activeElement).toBe(getItem("dark"));
    expect(getItem("dark")).toHaveAttribute("data-highlighted");
    expect(getItem("dark").getAttribute("aria-selected")).toBe("true");
    expect(getItem("dark")).toHaveAttribute("data-selected");
    expect(getItem("system").getAttribute("aria-selected")).toBe("false");
    expect(getItem("system").hasAttribute("data-selected")).toBe(false);
    expect(getItem("dark").querySelector("[data-sw-select-item-indicator]")).toHaveProperty(
      "hidden",
      false,
    );
    expect(getItem("system").querySelector("[data-sw-select-item-indicator]")).toHaveProperty(
      "hidden",
      true,
    );
  });

  it("honors emit false for root-scoped starwind:set-value commands", () => {
    const root = renderSelect({ defaultValue: "system" });
    const select = createSelect(root);
    const valueSubscriber = vi.fn();
    const domValueListener = vi.fn();
    select.subscribe("valueChange", valueSubscriber);
    root.addEventListener("starwind:value-change", domValueListener);

    root.dispatchEvent(
      new CustomEvent("starwind:set-value", {
        detail: { value: "dark" },
      }),
    );

    expect(select.getValue()).toBe("dark");
    expect(valueSubscriber).toHaveBeenCalledWith(
      expect.objectContaining({
        previousValue: "system",
        reason: "imperative-action",
        value: "dark",
      }),
    );
    expect(domValueListener).not.toHaveBeenCalled();

    root.dispatchEvent(
      new CustomEvent("starwind:set-value", {
        detail: { emit: false, value: "light" },
      }),
    );

    expect(select.getValue()).toBe("light");
    expect(valueSubscriber).toHaveBeenCalledTimes(1);
    expect(domValueListener).not.toHaveBeenCalled();
  });

  it("does not handle document-global value command events", () => {
    const root = renderSelect({ defaultValue: "system" });
    const select = createSelect(root);

    document.dispatchEvent(
      new CustomEvent("starwind:set-value", {
        detail: { value: "dark" },
      }),
    );
    document.dispatchEvent(
      new CustomEvent("starwind-select:select", {
        detail: { value: "dark" },
      }),
    );

    expect(select.getValue()).toBe("system");
    expect(getInput().value).toBe("system");
    expect(getValue().textContent).toBe("System");
  });

  it("removes the root-scoped value command listener when destroyed", () => {
    const root = renderSelect({ defaultValue: "system" });
    const select = createSelect(root);

    select.destroy();
    root.dispatchEvent(
      new CustomEvent("starwind:set-value", {
        detail: { value: "dark" },
      }),
    );

    expect(select.getValue()).toBe("system");
    expect(getInput().value).toBe("system");
    expect(getValue().textContent).toBe("System");
  });

  it("updates disabled and read-only state from validated root-scoped commands", () => {
    const root = renderSelect({ defaultValue: "system" });
    createSelect(root);

    root.dispatchEvent(new CustomEvent("starwind:set-disabled", { detail: { disabled: true } }));
    root.dispatchEvent(new CustomEvent("starwind:set-readonly", { detail: { readOnly: true } }));

    expect(root).toHaveAttribute("data-disabled");
    expect(root).toHaveAttribute("data-readonly");
    expect(getTrigger()).toBeDisabled();
    expect(getTrigger()).toHaveAttribute("aria-readonly", "true");

    for (const [type, detail] of [
      ["starwind:set-disabled", { disabled: "false" }],
      ["starwind:set-disabled", { readOnly: false }],
      ["starwind:set-readonly", { readOnly: 0 }],
      ["starwind:set-readonly", { disabled: false }],
    ] as const) {
      root.dispatchEvent(new CustomEvent(type, { detail }));
    }
    document.dispatchEvent(
      new CustomEvent("starwind:set-disabled", { detail: { disabled: false } }),
    );
    document.dispatchEvent(
      new CustomEvent("starwind:set-readonly", { detail: { readOnly: false } }),
    );

    expect(root).toHaveAttribute("data-disabled");
    expect(root).toHaveAttribute("data-readonly");
  });

  it("removes disabled and read-only command listeners when destroyed", () => {
    const root = renderSelect({ defaultValue: "system" });
    const select = createSelect(root);
    select.destroy();

    root.dispatchEvent(new CustomEvent("starwind:set-disabled", { detail: { disabled: true } }));
    root.dispatchEvent(new CustomEvent("starwind:set-readonly", { detail: { readOnly: true } }));

    expect(root).not.toHaveAttribute("data-disabled");
    expect(root).not.toHaveAttribute("data-readonly");
    expect(getTrigger()).not.toBeDisabled();
    expect(getTrigger()).toHaveAttribute("aria-readonly", "false");
  });

  it("uses same-task option additions for imperative value updates", async () => {
    const root = renderSelect({ defaultValue: "system" });
    const select = createSelect(root);

    getTrigger().click();
    await waitForFloatingPosition();

    const item = document.createElement("div");
    item.setAttribute("data-sw-select-item", "");
    item.setAttribute("data-value", "custom");
    item.innerHTML = `
      <span data-sw-select-item-text>Custom</span>
      <span data-sw-select-item-indicator hidden>check</span>
    `;
    getList().append(item);

    select.setValue("custom", { emit: false });

    expect(select.getValue()).toBe("custom");
    expect(getValue().textContent).toBe("Custom");
    expect(getInput().value).toBe("custom");
    expect(item.getAttribute("aria-selected")).toBe("true");
  });

  it("keeps active item identity after same-task insertion and value update", async () => {
    const root = renderSelect({ defaultValue: "system" });
    const select = createSelect(root);

    getTrigger().click();
    await waitForFloatingPosition();

    const activeItem = getItem("system");
    expect(document.activeElement).toBe(activeItem);

    const item = document.createElement("div");
    item.setAttribute("data-sw-select-item", "");
    item.setAttribute("data-value", "custom");
    item.innerHTML = `
      <span data-sw-select-item-text>Custom</span>
      <span data-sw-select-item-indicator hidden>check</span>
    `;
    getList().insertBefore(item, getItem("light"));
    select.setValue("dark", { emit: false });
    await waitForMicrotasks();

    expect(activeItem.hasAttribute("data-highlighted")).toBe(true);

    getPopup().dispatchEvent(new KeyboardEvent("keydown", { bubbles: true, key: "Enter" }));

    expect(select.getValue()).toBe("system");
  });

  it("keeps active item identity before mutation observers run after same-task value updates", async () => {
    const root = renderSelect({ defaultValue: "system" });
    const select = createSelect(root);

    getTrigger().click();
    await waitForFloatingPosition();

    const activeItem = getItem("system");
    expect(document.activeElement).toBe(activeItem);

    const item = document.createElement("div");
    item.setAttribute("data-sw-select-item", "");
    item.setAttribute("data-value", "custom");
    item.innerHTML = `
      <span data-sw-select-item-text>Custom</span>
      <span data-sw-select-item-indicator hidden>check</span>
    `;
    getList().insertBefore(item, getItem("light"));
    select.setValue("dark", { emit: false });

    getPopup().dispatchEvent(new KeyboardEvent("keydown", { bubbles: true, key: "Enter" }));

    expect(select.getValue()).toBe("system");
  });

  it("clears the active item when it loses option membership", async () => {
    const root = renderSelect({ defaultValue: "system" });
    const select = createSelect(root);

    getTrigger().click();
    await waitForFloatingPosition();

    const activeItem = getItem("system");
    expect(document.activeElement).toBe(activeItem);

    activeItem.removeAttribute("data-sw-select-item");
    await waitForMicrotasks();

    getPopup().dispatchEvent(new KeyboardEvent("keydown", { bubbles: true, key: "Enter" }));

    expect(select.getOpen()).toBe(true);
    expect(select.getValue()).toBe("system");
    expect(activeItem.hasAttribute("data-highlighted")).toBe(false);
  });

  it("clears an active item that loses membership before close observers run", async () => {
    const root = renderSelect({ defaultValue: "system" });
    const select = createSelect(root);

    getTrigger().click();
    await waitForFloatingPosition();

    const activeItem = getItem("system");
    expect(activeItem.hasAttribute("data-highlighted")).toBe(true);

    activeItem.removeAttribute("data-sw-select-item");
    select.close();

    expect(select.getOpen()).toBe(false);
    expect(activeItem.hasAttribute("data-highlighted")).toBe(false);
  });

  it("does not activate an active item that loses membership before observers run", async () => {
    const root = renderSelect({ defaultValue: "system" });
    const select = createSelect(root);

    getTrigger().click();
    await waitForFloatingPosition();

    const activeItem = getItem("system");
    expect(activeItem.hasAttribute("data-highlighted")).toBe(true);

    activeItem.removeAttribute("data-sw-select-item");
    getPopup().dispatchEvent(new KeyboardEvent("keydown", { bubbles: true, key: "Enter" }));

    expect(select.getOpen()).toBe(true);
    expect(select.getValue()).toBe("system");
    expect(activeItem.hasAttribute("data-highlighted")).toBe(false);
  });

  it("supports controlled value and open state", async () => {
    const root = renderSelect({ defaultValue: "system" });
    const onValueChange = vi.fn();
    const onOpenChange = vi.fn();
    const select = createSelect(root, {
      onOpenChange,
      onValueChange,
      open: false,
      value: "light",
    });

    expect(select.getValue()).toBe("light");
    expect(getValue().textContent).toBe("Light");

    getTrigger().click();
    expect(onOpenChange).toHaveBeenCalledWith(
      true,
      expect.objectContaining({ open: true, reason: "trigger-press" }),
    );
    expect(select.getOpen()).toBe(false);
    expect(getPopup().hidden).toBe(true);

    select.setOpen(true, { emit: false });
    await waitForFloatingPosition();
    getItems()[2].focus();
    getItems()[2].click();

    expect(onValueChange).toHaveBeenCalledWith(
      "dark",
      expect.objectContaining({ previousValue: "light", reason: "item-press" }),
    );
    expect(select.getValue()).toBe("light");
    expect(getValue().textContent).toBe("Light");

    select.setValue("dark", { emit: false });
    expect(select.getValue()).toBe("dark");
    expect(getValue().textContent).toBe("Dark");

    select.setOpen(false, { emit: false });
    expect(document.activeElement).toBe(getTrigger());
  });

  it("does not retain canceled controlled open focus requests", async () => {
    const root = renderSelect({ defaultValue: "system" });
    const onOpenChange = vi.fn((_open, details) => {
      details.cancel();
    });
    const select = createSelect(root, {
      onOpenChange,
      open: false,
    });

    select.open({ focus: "first" });

    expect(onOpenChange).toHaveBeenCalledWith(
      true,
      expect.objectContaining({ isCanceled: true, reason: "imperative-action" }),
    );
    expect(select.getOpen()).toBe(false);
    expect(getPopup().hidden).toBe(true);

    select.setOpen(true, { emit: false });
    await waitForFloatingPosition();

    expect(select.getOpen()).toBe(true);
    expect(getItems()[0].hasAttribute("data-highlighted")).toBe(false);
    expect(document.activeElement).not.toBe(getItems()[0]);
  });

  it("does not retain canceled controlled close focus restoration", () => {
    const root = renderSelect({ defaultValue: "system" });
    const onOpenChange = vi.fn((_open, details) => {
      details.cancel();
    });
    const select = createSelect(root, {
      onOpenChange,
      open: true,
    });
    const outside = document.createElement("button");
    document.body.append(outside);
    getItems()[1].focus();

    getItems()[2].click();

    expect(onOpenChange).toHaveBeenCalledWith(
      false,
      expect.objectContaining({ isCanceled: true, reason: "item-press" }),
    );
    expect(select.getOpen()).toBe(true);
    expect(getPopup().hidden).toBe(false);
    expect(document.activeElement).not.toBe(getTrigger());

    outside.focus();
    select.setOpen(false, { emit: false });

    expect(select.getOpen()).toBe(false);
    expect(getPopup().hidden).toBe(true);
    expect(document.activeElement).toBe(outside);
  });

  it("navigates and hovers selectable items after disabled items", async () => {
    const root = renderSelect({ defaultValue: "system" });
    const select = createSelect(root);
    const autoItem = getItem("auto");

    getTrigger().click();
    await waitForFloatingPosition();
    getPopup().dispatchEvent(new KeyboardEvent("keydown", { bubbles: true, key: "ArrowDown" }));
    getPopup().dispatchEvent(new KeyboardEvent("keydown", { bubbles: true, key: "ArrowDown" }));

    expect(document.activeElement).toBe(autoItem);
    expect(autoItem.hasAttribute("data-highlighted")).toBe(true);

    getPopup().dispatchEvent(new KeyboardEvent("keydown", { bubbles: true, key: "ArrowUp" }));

    expect(document.activeElement).toBe(getItem("dark"));
    expect(getItem("dark").hasAttribute("data-highlighted")).toBe(true);

    autoItem.dispatchEvent(
      new PointerEvent("pointermove", { bubbles: true, pointerType: "mouse" }),
    );

    expect(autoItem.hasAttribute("data-highlighted")).toBe(true);
    expect(getItem("light").hasAttribute("data-highlighted")).toBe(false);

    getPopup().dispatchEvent(new KeyboardEvent("keydown", { bubbles: true, key: "ArrowDown" }));

    expect(document.activeElement).toBe(getItem("light"));

    getPopup().dispatchEvent(new KeyboardEvent("keydown", { bubbles: true, key: "Enter" }));
    expect(select.getValue()).toBe("light");
  });

  it("limits large-list pointer highlight mutations to the previous and next items", async () => {
    const root = renderLargeSelect(160, { disabledIndex: 90 });
    const popup = getPopup();
    const items = getItems();

    createSelect(root);
    getTrigger().click();
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

    const disabledTargets = await collectHighlightAttributeTargets(popup, () => {
      items[90]!.dispatchEvent(
        new PointerEvent("pointermove", { bubbles: true, pointerType: "mouse" }),
      );
    });

    expect(disabledTargets.size).toBe(0);
    expect(items[80]!.hasAttribute("data-highlighted")).toBe(true);
  });

  it("highlights dynamically added items before and after observer delivery", async () => {
    const root = renderLargeSelect(160);
    const popup = getPopup();
    const list = popup.querySelector<HTMLElement>("[data-sw-select-list]")!;

    createSelect(root);
    getTrigger().click();
    await waitForFloatingPosition();

    const immediateItem = createLargeSelectItem(160);
    list.append(immediateItem);
    immediateItem.dispatchEvent(
      new PointerEvent("pointermove", { bubbles: true, pointerType: "mouse" }),
    );

    expect(immediateItem.getAttribute("role")).toBe("option");
    expect(immediateItem.getAttribute("tabindex")).toBe("0");
    expect(immediateItem.hasAttribute("data-highlighted")).toBe(true);

    await waitForMicrotasks();

    expect(immediateItem.getAttribute("tabindex")).toBe("0");
    expect(immediateItem.hasAttribute("data-highlighted")).toBe(true);

    const observedItem = createLargeSelectItem(161);
    list.append(observedItem);
    await waitForMicrotasks();

    const changedTargets = await collectHighlightAttributeTargets(popup, () => {
      observedItem.dispatchEvent(
        new PointerEvent("pointermove", { bubbles: true, pointerType: "mouse" }),
      );
    });

    expect(immediateItem.getAttribute("tabindex")).toBe("-1");
    expect(immediateItem.hasAttribute("data-highlighted")).toBe(false);
    expect(observedItem.getAttribute("tabindex")).toBe("0");
    expect(observedItem.hasAttribute("data-highlighted")).toBe(true);
    expect(changedTargets).toEqual(new Set([immediateItem, observedItem]));
  });

  it("aligns the selected item text with the trigger when requested", async () => {
    const root = renderSelect({ alignItemWithTrigger: true, defaultValue: "dark" });
    createSelect(root);

    const { valueRect } = mockAlignmentRects();

    openWithMouse();
    await waitForFloatingPosition();

    expect(getPositioner().getAttribute("data-align-item-with-trigger")).toBe("true");
    expect(getPopup().getAttribute("data-align-item-with-trigger")).toBe("true");
    expect(getPopup().getAttribute("data-align-trigger")).toBe("true");
    expect(getPositioner().getAttribute("data-side")).toBe("none");
    expect(getPopup().getAttribute("data-side")).toBe("none");
    expect(getPositioner().style.left).toBe("116px");
    expect(getPositioner().style.top).toBe("56px");

    valueRect.mockReturnValue(
      DOMRect.fromRect({
        height: 20,
        width: 80,
        x: 132,
        y: 132,
      }),
    );
    window.dispatchEvent(new Event("resize"));
    await waitForFloatingPosition();

    expect(getPositioner().style.top).toBe("76px");
  });

  it("retries selected-item alignment after lazy popup items mount", async () => {
    const root = renderSelect({ alignItemWithTrigger: true, defaultValue: "dark" });
    const popup = getPopup();
    popup.innerHTML = "";
    createSelect(root);

    mockRect(getTrigger(), { height: 44, width: 240, x: 100, y: 100 });
    mockRect(getValue(), { height: 20, width: 80, x: 132, y: 112 });
    mockRect(getPositioner(), { height: 160, width: 240, x: 40, y: 200 });
    mockRect(getPopup(), { height: 160, width: 240, x: 40, y: 200 });

    openWithMouse();
    await waitForFloatingPosition();

    expect(getPositioner().getAttribute("data-side")).not.toBe("none");

    renderLazySelectItems(popup);
    mockRect(getItem("dark"), { height: 36, width: 224, x: 48, y: 248 });
    mockRect(getItem("dark").querySelector<HTMLElement>("[data-sw-select-item-text]")!, {
      height: 20,
      width: 40,
      x: 56,
      y: 256,
    });

    await waitForFloatingPosition();

    expect(getPositioner().getAttribute("data-align-item-with-trigger")).toBe("true");
    expect(getPopup().getAttribute("data-align-item-with-trigger")).toBe("true");
    expect(getPositioner().getAttribute("data-side")).toBe("none");
    expect(getPopup().getAttribute("data-side")).toBe("none");
    expect(getPositioner().style.left).toBe("116px");
    expect(getPositioner().style.top).toBe("56px");
  });

  it("uses normal floating placement when item alignment is disabled", async () => {
    const root = renderSelect({ alignItemWithTrigger: false, defaultValue: "dark" });
    createSelect(root);

    mockAlignmentRects();
    openWithMouse();
    await waitForFloatingPosition();

    expect(getPositioner().getAttribute("data-align-item-with-trigger")).toBe("false");
    expect(getPopup().getAttribute("data-align-item-with-trigger")).toBe("false");
    expect(getPopup().getAttribute("data-align-trigger")).toBe("false");
    expect(getPositioner().getAttribute("data-side")).not.toBe("none");
    expect(getPopup().getAttribute("data-side")).not.toBe("none");
  });

  it("constrains non-item-aligned list height to available viewport space", async () => {
    vi.spyOn(window, "innerHeight", "get").mockReturnValue(260);
    vi.spyOn(window.visualViewport!, "height", "get").mockReturnValue(260);
    const style = document.createElement("style");
    style.textContent = `
      [data-sw-select-scroll-up-arrow],
      [data-sw-select-scroll-down-arrow] {
        height: 24px;
      }
    `;
    document.head.append(style);
    try {
      const root = renderSelect({
        alignItemWithTrigger: false,
        defaultValue: "dark",
        scrollArrows: true,
      });
      createSelect(root);
      expect(getScrollUpArrow().hidden).toBe(true);
      expect(getScrollDownArrow().hidden).toBe(true);
      mockRect(getTrigger(), { height: 32, width: 240, x: 100, y: 220 });
      mockRect(getPositioner(), { height: 320, width: 240, x: 100, y: 0 });
      mockRect(getPopup(), { height: 320, width: 240, x: 100, y: 0 });

      getTrigger().click();
      await waitForFloatingPosition();

      const availableHeight = 220 - 4 - 8;
      const reservedScrollArrowHeight = 48;

      expect(Number.parseFloat(getPopup().style.maxHeight)).toBeLessThanOrEqual(availableHeight);
      expect(Number.parseFloat(getList().style.maxHeight)).toBeLessThanOrEqual(
        availableHeight - reservedScrollArrowHeight,
      );
      expect(getPopup().style.maxHeight).not.toBe("");
      expect(getList().style.maxHeight).not.toBe("");
    } finally {
      style.remove();
    }
  });

  it("flips non-item-aligned placement to the side with usable viewport space", async () => {
    vi.spyOn(window, "innerHeight", "get").mockReturnValue(260);
    vi.spyOn(window.visualViewport!, "height", "get").mockReturnValue(260);
    const root = renderSelect({ alignItemWithTrigger: false, defaultValue: "dark" });
    createSelect(root);

    mockRect(getTrigger(), { height: 32, width: 240, x: 100, y: 220 });
    mockRect(getPositioner(), { height: 320, width: 240, x: 100, y: 0 });
    mockRect(getPopup(), { height: 320, width: 240, x: 100, y: 0 });

    getTrigger().click();
    await waitForFloatingPosition();

    expect(getPositioner().getAttribute("data-side")).toBe("top");
    expect(getPopup().getAttribute("data-side")).toBe("top");
    expect(Number.parseFloat(getPopup().style.top)).toBeLessThan(220);
    expect(Number.parseFloat(getPopup().style.maxHeight)).toBeGreaterThan(100);
  });

  it("flips styled non-item-aligned placement using the fixed popup's real height", async () => {
    const root = renderSelect({ alignItemWithTrigger: false, defaultValue: "dark" });
    createSelect(root);
    const style = setupFixedSelectLayoutNearViewportBottom();

    try {
      getTrigger().click();
      await waitForFloatingPosition();

      expect(getPositioner().getAttribute("data-side")).toBe("top");
      expect(getPopup().getAttribute("data-side")).toBe("top");
      expect(getPopup().style.position).toBe("fixed");
      expect(readPx(getPopup().style.top)).toBeLessThan(getTrigger().getBoundingClientRect().top);
      expect(readPx(getPopup().style.top) + getPopup().getBoundingClientRect().height).toBeLessThan(
        getTrigger().getBoundingClientRect().top,
      );
    } finally {
      style.remove();
    }
  });

  it("flips non-item-aligned keyboard opens to the side with usable viewport space", async () => {
    vi.spyOn(window, "innerHeight", "get").mockReturnValue(260);
    vi.spyOn(window.visualViewport!, "height", "get").mockReturnValue(260);
    const root = renderSelect({ alignItemWithTrigger: false, defaultValue: "dark" });
    createSelect(root);

    mockRect(getTrigger(), { height: 32, width: 240, x: 100, y: 220 });
    mockRect(getPositioner(), { height: 320, width: 240, x: 100, y: 0 });
    mockRect(getPopup(), { height: 320, width: 240, x: 100, y: 0 });

    getTrigger().dispatchEvent(new KeyboardEvent("keydown", { bubbles: true, key: "Enter" }));
    await waitForFloatingPosition();

    expect(getPositioner().getAttribute("data-side")).toBe("top");
    expect(getPopup().getAttribute("data-side")).toBe("top");
    expect(Number.parseFloat(getPopup().style.top)).toBeLessThan(220);
    expect(Number.parseFloat(getPopup().style.maxHeight)).toBeGreaterThan(100);
  });

  it("falls back to normal floating placement for touch opens", async () => {
    const root = renderSelect({ alignItemWithTrigger: true, defaultValue: "dark" });
    createSelect(root);

    mockAlignmentRects();
    getTrigger().dispatchEvent(
      new PointerEvent("pointerdown", {
        bubbles: true,
        pointerType: "touch",
      }),
    );
    getTrigger().click();
    await waitForFloatingPosition();

    expect(getPositioner().getAttribute("data-align-item-with-trigger")).toBe("true");
    expect(getPopup().getAttribute("data-align-item-with-trigger")).toBe("true");
    expect(getPopup().getAttribute("data-align-trigger")).toBe("true");
    expect(getPositioner().getAttribute("data-side")).not.toBe("none");
    expect(getPopup().getAttribute("data-side")).not.toBe("none");
  });

  it("restores authored placement when a touch open follows an aligned open", async () => {
    const root = renderSelect({ alignItemWithTrigger: true, defaultValue: "dark" });
    createSelect(root);

    mockAlignmentRects();
    openWithMouse();
    await waitForFloatingPosition();

    expect(getPositioner().getAttribute("data-side")).toBe("none");
    expect(getPositioner().getAttribute("data-align")).toBe("center");

    document.dispatchEvent(new KeyboardEvent("keydown", { bubbles: true, key: "Escape" }));

    getTrigger().dispatchEvent(
      new PointerEvent("pointerdown", {
        bubbles: true,
        pointerType: "touch",
      }),
    );
    getTrigger().click();
    await waitForFloatingPosition();

    expect(getPositioner().getAttribute("data-side")).toBe("bottom");
    expect(getPositioner().getAttribute("data-align")).toBe("start");
    expect(getPopup().getAttribute("data-side")).toBe("bottom");
    expect(getPopup().getAttribute("data-align")).toBe("start");
  });

  it("clears normal floating before reopening with selected-item alignment", async () => {
    const root = renderSelect({ alignItemWithTrigger: false, defaultValue: "dark" });
    createSelect(root);

    mockRect(getTrigger(), { height: 32, width: 240, x: 100, y: 220 });
    mockRect(getPositioner(), { height: 320, width: 240, x: 100, y: 0 });
    mockRect(getPopup(), { height: 320, width: 240, x: 100, y: 0 });

    getTrigger().click();
    await waitForFloatingPosition();

    expect(getPopup().style.position).toBe("fixed");
    expect(getPopup().style.left).not.toBe("");
    expect(getPopup().style.top).not.toBe("");

    document.dispatchEvent(new KeyboardEvent("keydown", { bubbles: true, key: "Escape" }));
    await waitForMicrotasks();

    expect(getPopup().hidden).toBe(true);
    expect(getPopup().style.position).toBe("");
    expect(getPopup().style.left).toBe("");
    expect(getPopup().style.top).toBe("");

    getPositioner().setAttribute("data-align-item-with-trigger", "true");
    getPopup().setAttribute("data-align-item-with-trigger", "true");
    const { valueRect } = mockAlignmentRects();

    openWithMouse();
    await waitForFloatingPosition();

    expect(getPositioner().getAttribute("data-side")).toBe("none");
    expect(getPopup().getAttribute("data-side")).toBe("none");
    expect(getPositioner().style.left).toBe("116px");
    expect(getPositioner().style.top).toBe("56px");

    valueRect.mockReturnValue(
      DOMRect.fromRect({
        height: 20,
        width: 80,
        x: 132,
        y: 132,
      }),
    );
    window.dispatchEvent(new Event("resize"));
    await waitForFloatingPosition();

    expect(getPositioner().style.top).toBe("76px");
  });

  it("aligns the selected item text with the trigger for keyboard opens", async () => {
    const root = renderSelect({ alignItemWithTrigger: true, defaultValue: "dark" });
    createSelect(root);

    mockAlignmentRects();
    getTrigger().dispatchEvent(new KeyboardEvent("keydown", { bubbles: true, key: "Enter" }));
    await waitForFloatingPosition();

    expect(getPositioner().getAttribute("data-align-item-with-trigger")).toBe("true");
    expect(getPopup().getAttribute("data-align-item-with-trigger")).toBe("true");
    expect(getPopup().getAttribute("data-align-trigger")).toBe("true");
    expect(getPositioner().getAttribute("data-side")).toBe("none");
    expect(getPopup().getAttribute("data-side")).toBe("none");
    expect(getPositioner().style.left).toBe("116px");
    expect(getPositioner().style.top).toBe("56px");
  });

  it("applies form accessibility props and prevents readonly value changes", async () => {
    const root = renderSelect({
      autoComplete: "country-name",
      defaultValue: "system",
      form: "settings-form",
      highlightItemOnHover: false,
      name: "theme",
      readOnly: true,
      required: true,
    });
    const listener = vi.fn();
    root.addEventListener("starwind:value-change", listener);
    const select = createSelect(root);

    expect(getTrigger().getAttribute("aria-readonly")).toBe("true");
    expect(root.hasAttribute("data-readonly")).toBe(true);
    expect(getTrigger().hasAttribute("data-readonly")).toBe(true);
    expect(getInput().getAttribute("form")).toBe("settings-form");
    expect(getInput().autocomplete).toBe("country-name");

    getTrigger().click();
    await waitForFloatingPosition();
    expect(select.getOpen()).toBe(true);

    getItems()[2].dispatchEvent(
      new PointerEvent("pointermove", { bubbles: true, pointerType: "mouse" }),
    );
    expect(getItems()[2].hasAttribute("data-highlighted")).toBe(false);

    getItems()[2].click();

    expect(select.getValue()).toBe("system");
    expect(getInput().value).toBe("system");
    expect(getItems()[1].getAttribute("aria-selected")).toBe("true");
    expect(listener).not.toHaveBeenCalled();
  });

  it("moves its reset listener when form ownership changes", async () => {
    document.body.innerHTML = `
      <form id="original-form"></form>
      <form id="next-form"></form>
    `;
    const root = renderSelect({
      defaultValue: "system",
      form: "original-form",
      name: "theme",
    });
    const select = createSelect(root);
    const originalForm = document.querySelector<HTMLFormElement>("#original-form")!;
    const nextForm = document.querySelector<HTMLFormElement>("#next-form")!;

    select.setFormOptions({ form: "next-form" });
    select.setValue("dark");
    nextForm.reset();
    await waitForMacrotask();

    expect(select.getValue()).toBe("system");
    expect(getInput().value).toBe("system");

    select.setValue("dark");
    originalForm.reset();
    await waitForMacrotask();

    expect(select.getValue()).toBe("dark");
    expect(getInput().value).toBe("dark");
  });

  it("updates scroll arrow visibility and scrolls the list from arrow interaction", async () => {
    const root = renderSelect({ defaultValue: "system", scrollArrows: true });
    const select = createSelect(root);
    const scrollMetrics = mockScrollMetrics(getList(), {
      clientHeight: 80,
      scrollHeight: 240,
      scrollTop: 0,
    });

    select.setOpen(true, { emit: false });
    await waitForFloatingPosition();

    expect(getScrollUpArrow().hidden).toBe(true);
    expect(getScrollDownArrow().hidden).toBe(false);
    expect(getScrollDownArrow().hasAttribute("data-visible")).toBe(true);

    getScrollDownArrow().dispatchEvent(new PointerEvent("pointerdown", { bubbles: true }));

    expect(getList().scrollTop).toBeGreaterThan(0);
    expect(getScrollUpArrow().hidden).toBe(false);

    scrollMetrics.setScrollTop(160);
    getList().dispatchEvent(new Event("scroll"));

    expect(getScrollDownArrow().hidden).toBe(true);
    expect(getScrollDownArrow().hasAttribute("data-hidden")).toBe(true);

    getScrollUpArrow().dispatchEvent(new PointerEvent("pointerdown", { bubbles: true }));

    expect(getList().scrollTop).toBeLessThan(160);
  });

  it("stops scroll arrow repeat on pointer leave and destroy", async () => {
    const root = renderSelect({ defaultValue: "system", scrollArrows: true });
    const select = createSelect(root);
    mockScrollMetrics(getList(), {
      clientHeight: 80,
      scrollHeight: 240,
      scrollTop: 0,
    });

    select.setOpen(true, { emit: false });
    await waitForFloatingPosition();

    getScrollDownArrow().dispatchEvent(new PointerEvent("pointerdown", { bubbles: true }));
    getScrollDownArrow().dispatchEvent(new PointerEvent("pointerleave", { bubbles: true }));
    const afterPointerLeave = getList().scrollTop;
    await waitForTimeout(80);

    expect(getList().scrollTop).toBe(afterPointerLeave);

    getScrollDownArrow().dispatchEvent(new PointerEvent("pointerdown", { bubbles: true }));
    const afterRestart = getList().scrollTop;
    select.destroy();
    await waitForTimeout(80);

    expect(getList().scrollTop).toBe(afterRestart);
  });
});

function renderLargeSelect(count: number, options: { disabledIndex?: number } = {}): HTMLElement {
  const wrapper = document.createElement("div");
  const items = Array.from({ length: count }, (_, index) => {
    const disabled = index === options.disabledIndex ? " data-disabled" : "";
    return `<div data-sw-select-item data-value="item-${index}"${disabled}>Item ${index}</div>`;
  }).join("");

  wrapper.innerHTML = `
    <div data-sw-select>
      <button data-sw-select-trigger><span data-sw-select-value></span></button>
      <input data-sw-select-input type="hidden" />
      <div data-sw-select-positioner>
        <div data-sw-select-popup hidden>
          <div data-sw-select-list>${items}</div>
        </div>
      </div>
    </div>
  `;

  const root = wrapper.firstElementChild as HTMLElement;
  document.body.append(root);
  return root;
}

function renderSelect({
  alignItemWithTrigger,
  autoComplete,
  defaultValue,
  form,
  highlightItemOnHover,
  modal,
  name,
  readOnly,
  required,
  scrollArrows,
}: {
  alignItemWithTrigger?: boolean;
  autoComplete?: string;
  defaultValue?: string;
  form?: string;
  highlightItemOnHover?: boolean;
  modal?: boolean;
  name?: string;
  readOnly?: boolean;
  required?: boolean;
  scrollArrows?: boolean;
} = {}): HTMLElement {
  const wrapper = document.createElement("div");
  wrapper.innerHTML = `
    <div
      data-sw-select
      ${autoComplete ? `data-autocomplete="${autoComplete}"` : ""}
      ${defaultValue ? `data-default-value="${defaultValue}"` : ""}
      ${form ? `data-form="${form}"` : ""}
      ${
        highlightItemOnHover === undefined
          ? ""
          : `data-highlight-item-on-hover="${String(highlightItemOnHover)}"`
      }
      ${modal === undefined ? "" : `data-modal="${String(modal)}"`}
      ${name ? `data-name="${name}"` : ""}
      ${readOnly ? "data-readonly" : ""}
      ${required ? "data-required" : ""}
    >
      <button data-sw-select-trigger>
        <span data-sw-select-value data-placeholder="Pick theme"></span>
      </button>
      <input data-sw-select-input type="hidden" />
      <div
        data-sw-select-positioner
        data-side="bottom"
        data-align="start"
        data-side-offset="4"
        ${
          alignItemWithTrigger === undefined
            ? ""
            : `data-align-item-with-trigger="${String(alignItemWithTrigger)}"`
        }
      >
        <div
          data-sw-select-popup
          ${
            alignItemWithTrigger === undefined
              ? ""
              : `data-align-item-with-trigger="${String(alignItemWithTrigger)}"`
          }
          hidden
        >
          ${scrollArrows ? `<div data-sw-select-scroll-up-arrow aria-hidden="true"></div>` : ""}
          <div data-sw-select-list>
            <div data-sw-select-item data-value="light">
              <span data-sw-select-item-text>Light</span>
              <span data-sw-select-item-indicator hidden>check</span>
            </div>
            <div data-sw-select-item data-value="system">
              <span data-sw-select-item-text>System</span>
              <span data-sw-select-item-indicator hidden>check</span>
            </div>
            <div data-sw-select-item data-value="dark">
              <span data-sw-select-item-text>Dark</span>
              <span data-sw-select-item-indicator hidden>check</span>
            </div>
            <div data-sw-select-item data-value="disabled" data-disabled>
              <span data-sw-select-item-text>Disabled</span>
              <span data-sw-select-item-indicator hidden>check</span>
            </div>
            <div data-sw-select-item data-value="auto">
              <span data-sw-select-item-text>Auto detect</span>
              <span data-sw-select-item-indicator hidden>check</span>
            </div>
          </div>
          ${scrollArrows ? `<div data-sw-select-scroll-down-arrow aria-hidden="true"></div>` : ""}
        </div>
      </div>
    </div>
  `;

  const root = wrapper.firstElementChild as HTMLElement;
  document.body.append(root);
  return root;
}

function renderLazySelectItems(popup: HTMLElement): void {
  popup.innerHTML = `
    <div data-sw-select-list>
      <div data-sw-select-item data-value="light">
        <span data-sw-select-item-text>Light</span>
        <span data-sw-select-item-indicator hidden>check</span>
      </div>
      <div data-sw-select-item data-value="system">
        <span data-sw-select-item-text>System</span>
        <span data-sw-select-item-indicator hidden>check</span>
      </div>
      <div data-sw-select-item data-value="dark">
        <span data-sw-select-item-text>Dark</span>
        <span data-sw-select-item-indicator hidden>check</span>
      </div>
      <div data-sw-select-item data-value="disabled" data-disabled>
        <span data-sw-select-item-text>Disabled</span>
        <span data-sw-select-item-indicator hidden>check</span>
      </div>
      <div data-sw-select-item data-value="auto">
        <span data-sw-select-item-text>Auto detect</span>
        <span data-sw-select-item-indicator hidden>check</span>
      </div>
    </div>
  `;
}

function getTrigger(): HTMLButtonElement {
  return document.querySelector<HTMLButtonElement>("[data-sw-select-trigger]")!;
}

function getSelectTrigger(root: HTMLElement): HTMLButtonElement {
  return root.querySelector<HTMLButtonElement>("[data-sw-select-trigger]")!;
}

function getPopup(): HTMLElement {
  return document.querySelector<HTMLElement>("[data-sw-select-popup]")!;
}

function getPositioner(): HTMLElement {
  return document.querySelector<HTMLElement>("[data-sw-select-positioner]")!;
}

function getList(): HTMLElement {
  return document.querySelector<HTMLElement>("[data-sw-select-list]")!;
}

function getScrollUpArrow(): HTMLElement {
  return document.querySelector<HTMLElement>("[data-sw-select-scroll-up-arrow]")!;
}

function getScrollDownArrow(): HTMLElement {
  return document.querySelector<HTMLElement>("[data-sw-select-scroll-down-arrow]")!;
}

function getValue(): HTMLElement {
  return document.querySelector<HTMLElement>("[data-sw-select-value]")!;
}

function getInput(): HTMLInputElement {
  return document.querySelector<HTMLInputElement>("[data-sw-select-input]")!;
}

function getItems(): HTMLElement[] {
  return Array.from(document.querySelectorAll<HTMLElement>("[data-sw-select-item]"));
}

function createLargeSelectItem(index: number): HTMLElement {
  const item = document.createElement("div");
  item.setAttribute("data-sw-select-item", "");
  item.setAttribute("data-value", `item-${index}`);
  item.textContent = `Item ${index}`;
  return item;
}

function getItem(value: string): HTMLElement {
  return document.querySelector<HTMLElement>(`[data-sw-select-item][data-value="${value}"]`)!;
}

function getDismissalListenerCalls(spy: { mock: { calls: unknown[][] } }) {
  return spy.mock.calls.filter(
    (call): call is [string, ...unknown[]] => call[0] === "keydown" || call[0] === "pointerdown",
  );
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

async function waitForMacrotask(): Promise<void> {
  await new Promise((resolve) => setTimeout(resolve, 0));
}

async function waitForTimeout(ms: number): Promise<void> {
  await new Promise((resolve) => setTimeout(resolve, ms));
}

async function waitForFloatingPosition(): Promise<void> {
  await waitForMicrotasks();
  await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));
  await waitForMicrotasks();
}

function setupFixedSelectLayoutNearViewportBottom(): HTMLStyleElement {
  const style = document.createElement("style");
  style.textContent = `
    [data-sw-select-trigger] {
      position: fixed;
      left: 100px;
      top: calc(100vh - 52px);
      width: 240px;
      height: 32px;
    }

    [data-sw-select-popup] {
      position: fixed;
      width: 240px;
      height: 180px;
    }

    [data-sw-select-list] {
      height: 180px;
    }
  `;
  document.head.append(style);
  return style;
}

function mockRect(element: HTMLElement, rect: Pick<DOMRectInit, "height" | "width" | "x" | "y">) {
  const value = DOMRect.fromRect({
    height: rect.height,
    width: rect.width,
    x: rect.x,
    y: rect.y,
  });

  return vi.spyOn(element, "getBoundingClientRect").mockReturnValue(value);
}

function readPx(value: string): number {
  return Number.parseFloat(value);
}

function mockScrollMetrics(
  element: HTMLElement,
  metrics: { clientHeight: number; scrollHeight: number; scrollTop: number },
) {
  let scrollTop = metrics.scrollTop;

  Object.defineProperty(element, "clientHeight", {
    configurable: true,
    get: () => metrics.clientHeight,
  });
  Object.defineProperty(element, "scrollHeight", {
    configurable: true,
    get: () => metrics.scrollHeight,
  });
  Object.defineProperty(element, "scrollTop", {
    configurable: true,
    get: () => scrollTop,
    set: (value: number) => {
      scrollTop = value;
    },
  });

  return {
    setScrollTop(value: number) {
      scrollTop = value;
    },
  };
}

function mockAlignmentRects() {
  mockRect(getTrigger(), { height: 44, width: 240, x: 100, y: 100 });
  const valueRect = mockRect(getValue(), { height: 20, width: 80, x: 132, y: 112 });
  mockRect(getPositioner(), { height: 160, width: 240, x: 40, y: 200 });
  mockRect(getPopup(), { height: 160, width: 240, x: 40, y: 200 });
  mockRect(getItem("dark"), { height: 36, width: 224, x: 48, y: 248 });
  mockRect(getItem("dark").querySelector<HTMLElement>("[data-sw-select-item-text]")!, {
    height: 20,
    width: 40,
    x: 56,
    y: 256,
  });

  return { valueRect };
}

function openWithMouse(): void {
  getTrigger().dispatchEvent(
    new PointerEvent("pointerdown", {
      bubbles: true,
      pointerType: "mouse",
    }),
  );
  getTrigger().click();
}

function createDeferred<T>() {
  let resolve!: (value: T | PromiseLike<T>) => void;
  let reject!: (reason?: unknown) => void;
  const promise = new Promise<T>((promiseResolve, promiseReject) => {
    resolve = promiseResolve;
    reject = promiseReject;
  });

  return { promise, reject, resolve };
}
