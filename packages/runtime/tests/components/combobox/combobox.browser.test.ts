import { beforeEach, describe, expect, it, vi } from "vitest";

import { createCombobox } from "../../../src/components/combobox/combobox";

describe("createCombobox", () => {
  beforeEach(() => {
    document.body.innerHTML = "";
    document.body.removeAttribute("style");
    vi.useRealTimers();
  });

  it("does not lock body scroll by default while open", async () => {
    const root = renderCombobox();
    const combobox = createCombobox(root);

    getTrigger().click();
    await waitForFloatingPosition();

    expect(combobox.getOpen()).toBe(true);
    expect(document.body.hasAttribute("data-sw-scroll-locked")).toBe(false);

    document.dispatchEvent(new KeyboardEvent("keydown", { bubbles: true, key: "Escape" }));

    expect(combobox.getOpen()).toBe(false);
    expect(document.body.hasAttribute("data-sw-scroll-locked")).toBe(false);
  });

  it("opens initially from defaultOpen options and raw data-default-open without emitting", async () => {
    const setups = [
      () => ({
        options: { defaultOpen: true },
        root: renderCombobox(),
      }),
      () => ({
        options: {},
        root: renderCombobox({ defaultOpen: true }),
      }),
    ];

    for (const setup of setups) {
      document.body.innerHTML = "";
      const { options, root } = setup();
      const onOpenChange = vi.fn();
      const openChangeListener = vi.fn();
      root.addEventListener("starwind:open-change", openChangeListener);

      const combobox = createCombobox(root, { ...options, onOpenChange });
      await waitForFloatingPosition();

      expect(combobox.getOpen()).toBe(true);
      expect(getPopup().hidden).toBe(false);
      expect(getInput().getAttribute("aria-expanded")).toBe("true");
      expect(getTrigger().getAttribute("aria-expanded")).toBe("true");
      expect(root.getAttribute("data-state")).toBe("open");
      expect(onOpenChange).not.toHaveBeenCalled();
      expect(openChangeListener).not.toHaveBeenCalled();

      combobox.destroy();
    }
  });

  it("requires input and popup anatomy", () => {
    const missingInput = renderCombobox();
    getComboboxInput(missingInput).remove();

    expect(() => createCombobox(missingInput)).toThrow(
      "Combobox requires a [data-sw-combobox-input] element.",
    );

    document.body.innerHTML = "";
    const missingPopup = renderCombobox();
    missingPopup.querySelector<HTMLElement>("[data-sw-combobox-popup]")!.remove();

    expect(() => createCombobox(missingPopup)).toThrow(
      "Combobox requires a [data-sw-combobox-popup] element.",
    );
  });

  it("does not collect popup items during closed no-value initialization", () => {
    const root = renderCombobox();
    const querySelectorAll = vi.spyOn(getPopup(), "querySelectorAll");

    createCombobox(root);

    expect(getInput().getAttribute("aria-expanded")).toBe("false");
    expect(querySelectorAll).not.toHaveBeenCalledWith("[data-sw-combobox-item]");
  });

  it("locks body scroll when modal and releases it on close or destroy", () => {
    const combobox = createCombobox(renderCombobox({ modal: true }));

    combobox.setOpen(true, { emit: false });

    expect(document.body.hasAttribute("data-sw-scroll-locked")).toBe(true);

    combobox.setOpen(false, { emit: false });

    expect(document.body.hasAttribute("data-sw-scroll-locked")).toBe(false);

    combobox.setOpen(true, { emit: false });

    expect(document.body.hasAttribute("data-sw-scroll-locked")).toBe(true);

    combobox.destroy();

    expect(document.body.hasAttribute("data-sw-scroll-locked")).toBe(false);
  });

  it("keeps another modal lock active after an opt-in modal combobox closes", () => {
    const first = createCombobox(renderCombobox({ defaultValue: "banana", modal: true }));
    const second = createCombobox(renderCombobox({ defaultValue: "apple", modal: true }));

    first.setOpen(true, { emit: false });
    second.setOpen(true, { emit: false });

    expect(document.body.hasAttribute("data-sw-scroll-locked")).toBe(true);

    second.setOpen(false, { emit: false });

    expect(document.body.hasAttribute("data-sw-scroll-locked")).toBe(true);

    first.setOpen(false, { emit: false });

    expect(document.body.hasAttribute("data-sw-scroll-locked")).toBe(false);
  });

  it("keeps modal input, filtering, selection, Escape, and outside close behavior working", async () => {
    const root = renderCombobox({ modal: true });
    const combobox = createCombobox(root);

    getInput().focus();
    getInput().value = "ap";
    getInput().dispatchEvent(new InputEvent("input", { bubbles: true }));
    await waitForFloatingPosition();

    expect(combobox.getOpen()).toBe(true);
    expect(document.body.hasAttribute("data-sw-scroll-locked")).toBe(true);
    expect(getItem("apple").hidden).toBe(false);
    expect(getItem("apricot").hidden).toBe(false);
    expect(getItem("banana").hidden).toBe(true);

    document.dispatchEvent(new KeyboardEvent("keydown", { bubbles: true, key: "Escape" }));

    expect(combobox.getOpen()).toBe(false);
    expect(document.body.hasAttribute("data-sw-scroll-locked")).toBe(false);

    getTrigger().click();
    await waitForFloatingPosition();
    getInput().value = "ap";
    getInput().dispatchEvent(new InputEvent("input", { bubbles: true }));
    getItem("apricot").click();

    expect(combobox.getOpen()).toBe(false);
    expect(combobox.getValue()).toBe("apricot");
    expect(getInput().value).toBe("Apricot");
    expect(document.body.hasAttribute("data-sw-scroll-locked")).toBe(false);

    getTrigger().click();
    await waitForFloatingPosition();

    expect(document.body.hasAttribute("data-sw-scroll-locked")).toBe(true);

    document.body.dispatchEvent(new PointerEvent("pointerdown", { bubbles: true }));

    expect(combobox.getOpen()).toBe(false);
    expect(document.body.hasAttribute("data-sw-scroll-locked")).toBe(false);
  });

  it("allows onOpenChange details cancellation before Combobox state changes", () => {
    const root = renderCombobox({ defaultValue: "banana" });
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

    const combobox = createCombobox(root, { onOpenChange });
    const subscriber = vi.fn();
    combobox.subscribe("openChange", subscriber);
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
    expect(combobox.getOpen()).toBe(false);
    expect(getPopup().hidden).toBe(true);
    expect(getInput().getAttribute("aria-expanded")).toBe("false");
    expect(document.body.hasAttribute("data-sw-scroll-locked")).toBe(false);
  });

  it("allows starwind:open-change preventDefault before Combobox state changes", () => {
    const root = renderCombobox({ defaultValue: "banana" });
    root.addEventListener("starwind:open-change", (event) => event.preventDefault());

    const combobox = createCombobox(root);
    const subscriber = vi.fn();
    combobox.subscribe("openChange", subscriber);
    getTrigger().click();

    expect(subscriber).not.toHaveBeenCalled();
    expect(combobox.getOpen()).toBe(false);
    expect(getPopup().hidden).toBe(true);
    expect(getInput().getAttribute("aria-expanded")).toBe("false");
    expect(document.body.hasAttribute("data-sw-scroll-locked")).toBe(false);
  });

  it("preserves the onOpenChange callback receiver", () => {
    const root = renderCombobox({ defaultValue: "banana" });
    const receivers: unknown[] = [];

    const combobox = createCombobox(root, {
      onOpenChange: function onOpenChange(this: unknown) {
        receivers.push(this);
      },
    });
    getTrigger().click();

    expect(receivers).toEqual([combobox]);

    combobox.destroy();
  });

  it("does not retain canceled controlled open requests", () => {
    const root = renderCombobox({ defaultValue: "banana", modal: true });
    const onOpenChange = vi.fn((_open, details) => {
      details.cancel();
    });
    const combobox = createCombobox(root, {
      onOpenChange,
      open: false,
    });
    const subscriber = vi.fn();
    combobox.subscribe("openChange", subscriber);

    getTrigger().click();

    expect(onOpenChange).toHaveBeenCalledWith(
      true,
      expect.objectContaining({ isCanceled: true, reason: "trigger-press" }),
    );
    expect(subscriber).not.toHaveBeenCalled();
    expect(combobox.getOpen()).toBe(false);
    expect(getPopup().hidden).toBe(true);
    expect(document.body.hasAttribute("data-sw-scroll-locked")).toBe(false);
  });

  it("initializes an uncontrolled combobox with default value and hidden form value", () => {
    const root = renderCombobox({ defaultValue: "banana", name: "fruit", required: true });
    const combobox = createCombobox(root);

    expect(combobox.getValue()).toBe("banana");
    expect(combobox.getInputValue()).toBe("Banana");
    expect(getInput().getAttribute("role")).toBe("combobox");
    expect(getInput().getAttribute("aria-autocomplete")).toBe("list");
    expect(getInput().getAttribute("aria-expanded")).toBe("false");
    expect(getInput().getAttribute("aria-controls")).toBe(getPopup().id);
    expect(getInput().getAttribute("aria-labelledby")).toBe(getLabel().id);
    expect(getPopup().getAttribute("role")).toBe("listbox");
    expect(getPopup().hidden).toBe(true);
    expect(getHiddenInput().type).toBe("hidden");
    expect(getHiddenInput().name).toBe("fruit");
    expect(getHiddenInput().required).toBe(true);
    expect(getHiddenInput().value).toBe("banana");
    expect(getItems()[1].getAttribute("aria-selected")).toBe("true");
    expect(getItems()[1].hasAttribute("data-selected")).toBe(true);
    expect(root.hasAttribute("data-placeholder")).toBe(false);

    getTrigger().click();
    expect(getItem("apple").hidden).toBe(false);
    expect(getItem("banana").hidden).toBe(false);
    expect(getItem("apricot").hidden).toBe(false);
  });

  it("keeps an empty string value as clear/no-value semantics", () => {
    const root = renderCombobox({ defaultValue: "banana", name: "fruit" });
    const combobox = createCombobox(root);

    combobox.setValue("", { emit: false });

    expect(combobox.getValue()).toBeNull();
    expect(combobox.getInputValue()).toBe("");
    expect(getInput().value).toBe("");
    expect(getHiddenInput().value).toBe("");
    expect(getValue().textContent).toBe("Pick fruit");
    expect(root.hasAttribute("data-placeholder")).toBe(true);
  });

  it("filters options, selects an item, and clears the selection", async () => {
    const root = renderCombobox({ name: "fruit" });
    const listener = vi.fn();
    root.addEventListener("starwind:value-change", listener);
    root.addEventListener("starwind:input-value-change", listener);
    const combobox = createCombobox(root);
    const inputValueSubscriber = vi.fn();
    const openSubscriber = vi.fn();
    const valueSubscriber = vi.fn();
    combobox.subscribe("inputValueChange", inputValueSubscriber);
    combobox.subscribe("openChange", openSubscriber);
    combobox.subscribe("valueChange", valueSubscriber);

    getInput().focus();
    getInput().value = "ap";
    getInput().dispatchEvent(new InputEvent("input", { bubbles: true }));
    await waitForFloatingPosition();

    expect(combobox.getOpen()).toBe(true);
    expect(getPopup().hidden).toBe(false);
    expect(getInput().getAttribute("aria-expanded")).toBe("true");
    expect(openSubscriber).toHaveBeenCalledWith(expect.objectContaining({ open: true }));
    expect(inputValueSubscriber).toHaveBeenCalledWith(
      expect.objectContaining({ inputValue: "ap", reason: "input" }),
    );
    expect(getItem("apple").hidden).toBe(false);
    expect(getItem("apricot").hidden).toBe(false);
    expect(getItem("banana").hidden).toBe(true);
    expect(getEmpty().hidden).toBe(true);

    getItem("apricot").click();

    expect(combobox.getOpen()).toBe(false);
    expect(combobox.getValue()).toBe("apricot");
    expect(combobox.getInputValue()).toBe("Apricot");
    expect(getInput().value).toBe("Apricot");
    expect(getHiddenInput().value).toBe("apricot");
    expect(getItem("apricot").getAttribute("aria-selected")).toBe("true");
    expect(getItem("apple").hidden).toBe(false);
    expect(getItem("apricot").hidden).toBe(false);
    expect(getItem("banana").hidden).toBe(true);
    expect(valueSubscriber).toHaveBeenCalledWith(
      expect.objectContaining({ reason: "item-press", value: "apricot" }),
    );
    expect(listener).toHaveBeenCalledWith(
      expect.objectContaining({
        detail: expect.objectContaining({ reason: "item-press", value: "apricot" }),
      }),
    );

    combobox.open();
    await waitForFloatingPosition();

    expect(getItem("apple").hidden).toBe(false);
    expect(getItem("apricot").hidden).toBe(false);
    expect(getItem("banana").hidden).toBe(false);

    combobox.close();
    getClear().click();

    expect(combobox.getValue()).toBe(null);
    expect(combobox.getInputValue()).toBe("");
    expect(getInput().value).toBe("");
    expect(getHiddenInput().value).toBe("");
    expect(root.hasAttribute("data-placeholder")).toBe(true);
  });

  it("uses explicit default filter value separately from displayed input value", async () => {
    const root = renderCombobox({ defaultInputValue: "Banana" });
    const combobox = createCombobox(root, { defaultFilterValue: "" });

    expect(getInput().value).toBe("Banana");

    combobox.open();
    await waitForFloatingPosition();

    expect(getItem("apple").hidden).toBe(false);
    expect(getItem("banana").hidden).toBe(false);
    expect(getItem("apricot").hidden).toBe(false);
  });

  it("uses default value text when the selected item mounts lazily", async () => {
    const root = renderCombobox({ defaultValue: "banana" });
    const popup = getPopup();
    popup.innerHTML = "";
    createCombobox(root, {
      defaultFilterValue: "",
      defaultInputValue: "Banana",
      defaultValueText: "Banana",
    });

    expect(root.getAttribute("data-value")).toBe("banana");
    expect(getHiddenInput().value).toBe("banana");
    expect(getInput().value).toBe("Banana");

    popup.innerHTML = `
      <div data-sw-combobox-empty hidden>No fruit found.</div>
      <div data-sw-combobox-list>
        <div data-sw-combobox-item data-value="apple"><span data-sw-combobox-item-text>Apple</span></div>
        <div data-sw-combobox-item data-value="banana"><span data-sw-combobox-item-text>Banana</span></div>
      </div>
    `;
    getTrigger().click();
    await waitForFloatingPosition();

    expect(getItem("banana").getAttribute("aria-selected")).toBe("true");
  });

  it("renders placeholder and selected item text into value elements", async () => {
    const root = renderCombobox();
    const combobox = createCombobox(root);

    expect(getValue().textContent).toBe("Pick fruit");
    expect(root.hasAttribute("data-placeholder")).toBe(true);

    combobox.setOpen(true, { emit: false });
    await waitForFloatingPosition();
    getItem("apricot").click();

    expect(getValue().textContent).toBe("Apricot");
    expect(root.hasAttribute("data-placeholder")).toBe(false);

    getClear().click();

    expect(getValue().textContent).toBe("Pick fruit");
    expect(root.hasAttribute("data-placeholder")).toBe(true);
  });

  it("does not reopen when mouse selection restores focus to the input", async () => {
    const root = renderCombobox();
    const combobox = createCombobox(root);

    getTrigger().click();
    await waitForFloatingPosition();
    document.body.tabIndex = -1;
    document.body.focus();

    expect(combobox.getOpen()).toBe(true);
    expect(document.activeElement).toBe(document.body);

    getItem("apricot").click();
    await waitForMicrotasks();

    expect(combobox.getOpen()).toBe(false);
    expect(getInput().getAttribute("aria-expanded")).toBe("false");
    expect(document.activeElement).toBe(getInput());
  });

  it("opens from the focused input or input group after selecting an item", async () => {
    const root = renderCombobox();
    const combobox = createCombobox(root);

    getInput().focus();
    await waitForFloatingPosition();
    const itemPointerDown = new PointerEvent("pointerdown", {
      bubbles: true,
      cancelable: true,
      pointerType: "mouse",
    });
    expect(getItem("apricot").dispatchEvent(itemPointerDown)).toBe(false);
    expect(itemPointerDown.defaultPrevented).toBe(true);
    expect(document.activeElement).toBe(getInput());
    getItem("apricot").click();
    await waitForMicrotasks();

    expect(combobox.getOpen()).toBe(false);
    expect(document.activeElement).toBe(getInput());

    getInput().dispatchEvent(new PointerEvent("pointerdown", { bubbles: true }));
    await waitForFloatingPosition();

    expect(combobox.getOpen()).toBe(true);

    combobox.close();
    getInputGroup().dispatchEvent(new PointerEvent("pointerdown", { bubbles: true }));
    await waitForFloatingPosition();

    expect(combobox.getOpen()).toBe(true);
    expect(document.activeElement).toBe(getInput());
  });

  it("applies anchor width synchronously before floating position settles", async () => {
    renderCombobox();
    createCombobox(document.querySelector<HTMLElement>("[data-sw-combobox]")!);

    stubRect(getInput(), { width: 120 });
    stubRect(getInputGroup(), { width: 320 });

    getTrigger().click();

    expect(getPopup().style.getPropertyValue("--anchor-width")).toBe("320px");

    await waitForFloatingPosition();

    expect(getPopup().style.getPropertyValue("--anchor-width")).toBe("320px");
  });

  it("portals popup while open and restores it after close animations finish", async () => {
    vi.useFakeTimers();
    const { floatingRoot, root } = renderComboboxInFloatingRoot();
    const combobox = createCombobox(root);
    const popup = getPopup();
    const positioner = getPositioner();
    stubNoAnimations(popup);
    stubRect(getInputGroup(), { width: 320 });
    popup.style.transitionDuration = "200ms";

    combobox.open();

    expect(positioner.parentElement).toBe(floatingRoot);
    expect(root.contains(positioner)).toBe(false);
    expect(popup.style.getPropertyValue("--anchor-width")).toBe("320px");
    expect(positioner.style.getPropertyValue("--anchor-width")).toBe("320px");

    combobox.close();

    expect(combobox.getOpen()).toBe(false);
    expect(positioner.parentElement).toBe(floatingRoot);
    expect(popup.hidden).toBe(false);

    await vi.advanceTimersByTimeAsync(199);

    expect(positioner.parentElement).toBe(floatingRoot);
    expect(popup.hidden).toBe(false);

    await vi.advanceTimersByTimeAsync(1);

    expect(positioner.parentElement).toBe(root);
    expect(popup.hidden).toBe(true);
    expect(popup.style.getPropertyValue("--anchor-width")).toBe("");
    expect(positioner.style.getPropertyValue("--anchor-width")).toBe("");

    combobox.open();

    expect(positioner.parentElement).toBe(floatingRoot);
    expect(popup.style.getPropertyValue("--anchor-width")).toBe("320px");
    expect(positioner.style.getPropertyValue("--anchor-width")).toBe("320px");
  });

  it("unportals and releases lifecycle effects when destroyed while open or closing", async () => {
    vi.useFakeTimers();
    let setup = renderComboboxInFloatingRoot({ modal: true });
    let combobox = createCombobox(setup.root);
    let popup = getPopup();
    let positioner = getPositioner();
    stubRect(getInputGroup(), { width: 320 });

    combobox.setOpen(true, { emit: false });

    expect(document.body.hasAttribute("data-sw-scroll-locked")).toBe(true);
    expect(positioner.parentElement).toBe(setup.floatingRoot);
    expect(popup.style.getPropertyValue("--anchor-width")).toBe("320px");

    combobox.destroy();

    expect(document.body.hasAttribute("data-sw-scroll-locked")).toBe(false);
    expect(positioner.parentElement).toBe(setup.root);
    expect(popup.hidden).toBe(true);
    expect(popup.style.getPropertyValue("--anchor-width")).toBe("");

    document.body.innerHTML = "";
    document.body.removeAttribute("style");
    setup = renderComboboxInFloatingRoot({ modal: true });
    combobox = createCombobox(setup.root);
    popup = getPopup();
    positioner = getPositioner();
    stubNoAnimations(popup);
    stubRect(getInputGroup(), { width: 280 });
    popup.style.transitionDuration = "200ms";

    combobox.setOpen(true, { emit: false });
    combobox.setOpen(false, { emit: false });

    expect(document.body.hasAttribute("data-sw-scroll-locked")).toBe(false);
    expect(positioner.parentElement).toBe(setup.floatingRoot);
    expect(popup.hidden).toBe(false);

    combobox.destroy();

    expect(positioner.parentElement).toBe(setup.root);
    expect(popup.hidden).toBe(true);
    expect(popup.style.getPropertyValue("--anchor-width")).toBe("");

    await vi.advanceTimersByTimeAsync(200);

    expect(positioner.parentElement).toBe(setup.root);
    expect(popup.hidden).toBe(true);
  });

  it("flips from bottom to top when the popup fits above the input group", async () => {
    vi.spyOn(window, "innerHeight", "get").mockReturnValue(260);
    vi.spyOn(window.visualViewport!, "height", "get").mockReturnValue(260);
    renderCombobox({ side: "bottom" });
    createCombobox(document.querySelector<HTMLElement>("[data-sw-combobox]")!);

    mockRect(getInputGroup(), { height: 32, width: 240, x: 100, y: 220 });
    mockRect(getPositioner(), { height: 180, width: 240, x: 100, y: 0 });
    mockRect(getPopup(), { height: 180, width: 240, x: 100, y: 0 });

    getInput().focus();
    await waitForFloatingPosition();

    expect(getPositioner().getAttribute("data-side")).toBe("top");
    expect(getPopup().getAttribute("data-side")).toBe("top");
    expect(readPx(getPopup().style.top)).toBeCloseTo(36, 0);
    expect(readPx(getPopup().style.left)).toBeCloseTo(100, 0);
    expect(readPx(getPopup().style.top)).toBeGreaterThanOrEqual(8);
    expect(readPx(getPopup().style.top) + 180).toBeLessThanOrEqual(260 - 8);
  });

  it("flips styled placement using the fixed popup's real height", async () => {
    renderCombobox({ side: "bottom" });
    createCombobox(document.querySelector<HTMLElement>("[data-sw-combobox]")!);
    const style = setupFixedComboboxLayoutNearViewportBottom();

    try {
      getInput().focus();
      await waitForFloatingPosition();

      expect(getPositioner().getAttribute("data-side")).toBe("top");
      expect(getPopup().getAttribute("data-side")).toBe("top");
      expect(getPopup().style.position).toBe("fixed");
      expect(readPx(getPopup().style.top)).toBeLessThan(
        getInputGroup().getBoundingClientRect().top,
      );
      expect(readPx(getPopup().style.top) + getPopup().getBoundingClientRect().height).toBeLessThan(
        getInputGroup().getBoundingClientRect().top,
      );
    } finally {
      style.remove();
    }
  });

  it("flips from top to bottom when the popup fits below the input group", async () => {
    vi.spyOn(window, "innerHeight", "get").mockReturnValue(260);
    vi.spyOn(window.visualViewport!, "height", "get").mockReturnValue(260);
    renderCombobox({ side: "top" });
    createCombobox(document.querySelector<HTMLElement>("[data-sw-combobox]")!);

    mockRect(getInputGroup(), { height: 32, width: 240, x: 100, y: 8 });
    mockRect(getPositioner(), { height: 180, width: 240, x: 100, y: 0 });
    mockRect(getPopup(), { height: 180, width: 240, x: 100, y: 0 });

    getInput().focus();
    await waitForFloatingPosition();

    expect(getPositioner().getAttribute("data-side")).toBe("bottom");
    expect(getPopup().getAttribute("data-side")).toBe("bottom");
    expect(readPx(getPopup().style.top)).toBeCloseTo(44, 0);
    expect(readPx(getPopup().style.left)).toBeCloseTo(100, 0);
    expect(readPx(getPopup().style.top) + 180).toBeLessThanOrEqual(260 - 8);
  });

  it("preserves the requested combobox side when there is room", async () => {
    vi.spyOn(window, "innerHeight", "get").mockReturnValue(260);
    vi.spyOn(window.visualViewport!, "height", "get").mockReturnValue(260);
    renderCombobox({ side: "bottom" });
    createCombobox(document.querySelector<HTMLElement>("[data-sw-combobox]")!);

    mockRect(getInputGroup(), { height: 32, width: 240, x: 100, y: 40 });
    mockRect(getPositioner(), { height: 120, width: 240, x: 100, y: 0 });
    mockRect(getPopup(), { height: 120, width: 240, x: 100, y: 0 });

    getInput().focus();
    await waitForFloatingPosition();

    expect(getPositioner().getAttribute("data-side")).toBe("bottom");
    expect(getPopup().getAttribute("data-side")).toBe("bottom");
    expect(readPx(getPopup().style.top)).toBeCloseTo(76, 0);
    expect(readPx(getPopup().style.left)).toBeCloseTo(100, 0);
  });

  it("restores authored combobox side after a flipped open", async () => {
    vi.spyOn(window, "innerHeight", "get").mockReturnValue(260);
    vi.spyOn(window.visualViewport!, "height", "get").mockReturnValue(260);
    const root = renderCombobox({ side: "bottom" });
    const combobox = createCombobox(root);

    const inputGroupRect = mockRect(getInputGroup(), { height: 32, width: 240, x: 100, y: 220 });
    mockRect(getPositioner(), { height: 180, width: 240, x: 100, y: 0 });
    mockRect(getPopup(), { height: 180, width: 240, x: 100, y: 0 });

    getInput().focus();
    await waitForFloatingPosition();

    expect(getPositioner().getAttribute("data-side")).toBe("top");
    expect(getPopup().getAttribute("data-side")).toBe("top");

    combobox.close();
    inputGroupRect.mockReturnValue(DOMRect.fromRect({ height: 32, width: 240, x: 100, y: 40 }));

    combobox.open();
    await waitForFloatingPosition();

    expect(getPositioner().getAttribute("data-side")).toBe("bottom");
    expect(getPopup().getAttribute("data-side")).toBe("bottom");
    expect(readPx(getPopup().style.top)).toBeCloseTo(76, 0);
  });

  it("uses the selected item text when generated input value attributes are empty", () => {
    const root = renderCombobox({ defaultValue: "banana" });
    root.setAttribute("data-input-value", "");
    root.setAttribute("data-default-input-value", "");

    const combobox = createCombobox(root, { defaultInputValue: undefined });

    expect(getInput().value).toBe("Banana");
    combobox.destroy();
    createCombobox(root, { defaultInputValue: undefined });
    expect(getInput().value).toBe("Banana");

    getTrigger().click();
    expect(getItem("apple").hidden).toBe(false);
    expect(getItem("banana").hidden).toBe(false);
    expect(getItem("apricot").hidden).toBe(false);
  });

  it("supports keyboard navigation, disabled items, empty state, Escape, and outside close", async () => {
    const root = renderCombobox();
    const combobox = createCombobox(root);

    getTrigger().click();
    await waitForFloatingPosition();
    expect(combobox.getOpen()).toBe(true);

    getInput().dispatchEvent(new KeyboardEvent("keydown", { bubbles: true, key: "ArrowDown" }));
    expect(document.activeElement).toBe(getInput());
    expect(getInput().getAttribute("aria-activedescendant")).toBe(getItem("apple").id);
    expect(getItem("apple").hasAttribute("data-highlighted")).toBe(true);

    getInput().dispatchEvent(new KeyboardEvent("keydown", { bubbles: true, key: "ArrowDown" }));
    expect(document.activeElement).toBe(getInput());
    expect(getInput().getAttribute("aria-activedescendant")).toBe(getItem("banana").id);
    expect(getItem("banana").hasAttribute("data-highlighted")).toBe(true);

    getInput().value = "zzz";
    getInput().dispatchEvent(new InputEvent("input", { bubbles: true }));
    expect(getEmpty().hidden).toBe(false);

    getInput().value = "disabled";
    getInput().dispatchEvent(new InputEvent("input", { bubbles: true }));
    expect(getItem("disabled").hidden).toBe(false);
    const disabledPointerDown = new PointerEvent("pointerdown", {
      bubbles: true,
      cancelable: true,
      pointerType: "mouse",
    });
    expect(getItem("disabled").dispatchEvent(disabledPointerDown)).toBe(false);
    expect(disabledPointerDown.defaultPrevented).toBe(true);
    expect(document.activeElement).toBe(getInput());
    getItem("disabled").click();
    expect(combobox.getValue()).toBe(null);

    document.dispatchEvent(new KeyboardEvent("keydown", { bubbles: true, key: "Escape" }));
    expect(combobox.getOpen()).toBe(false);
    expect(getPopup().hidden).toBe(true);

    getTrigger().click();
    await waitForFloatingPosition();
    document.body.dispatchEvent(new PointerEvent("pointerdown", { bubbles: true }));
    expect(combobox.getOpen()).toBe(false);
  });

  it("registers global dismissal listeners only while combobox instances are open", () => {
    const addListener = vi.spyOn(document, "addEventListener");
    const removeListener = vi.spyOn(document, "removeEventListener");
    try {
      const first = createCombobox(renderCombobox({ defaultValue: "banana" }));
      const second = createCombobox(renderCombobox({ defaultValue: "apple" }));

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

  it("removes global dismissal listeners when an open combobox is destroyed", () => {
    const removeListener = vi.spyOn(document, "removeEventListener");
    try {
      const combobox = createCombobox(renderCombobox({ defaultValue: "banana" }));

      combobox.setOpen(true, { emit: false });
      removeListener.mockClear();

      combobox.destroy();

      expect(getDismissalListenerCalls(removeListener).map(([type]) => type)).toEqual([
        "keydown",
        "pointerdown",
      ]);
    } finally {
      removeListener.mockRestore();
    }
  });

  it("lets the topmost combobox own Escape dismissal without blurring the input", () => {
    const firstRoot = renderCombobox({ defaultValue: "banana" });
    const secondRoot = renderCombobox({ defaultValue: "apple" });
    const firstInput = getComboboxInput(firstRoot);
    const secondInput = getComboboxInput(secondRoot);
    const first = createCombobox(firstRoot);
    const second = createCombobox(secondRoot);

    first.setOpen(true, { emit: false });
    second.setOpen(true, { emit: false });
    secondInput.focus();

    document.dispatchEvent(new KeyboardEvent("keydown", { bubbles: true, key: "Escape" }));

    expect(first.getOpen()).toBe(true);
    expect(second.getOpen()).toBe(false);
    expect(document.activeElement).toBe(secondInput);

    firstInput.focus();
    document.dispatchEvent(new KeyboardEvent("keydown", { bubbles: true, key: "Escape" }));

    expect(first.getOpen()).toBe(false);
    expect(document.activeElement).toBe(firstInput);
  });

  it("lets focused input Escape close only the topmost combobox", () => {
    const firstRoot = renderCombobox({ defaultValue: "banana" });
    const secondRoot = renderCombobox({ defaultValue: "apple" });
    const firstInput = getComboboxInput(firstRoot);
    const secondInput = getComboboxInput(secondRoot);
    const first = createCombobox(firstRoot);
    const second = createCombobox(secondRoot);

    first.setOpen(true, { emit: false });
    second.setOpen(true, { emit: false });
    secondInput.focus();

    const secondEscape = new KeyboardEvent("keydown", {
      bubbles: true,
      cancelable: true,
      key: "Escape",
    });
    expect(secondInput.dispatchEvent(secondEscape)).toBe(false);

    expect(first.getOpen()).toBe(true);
    expect(second.getOpen()).toBe(false);
    expect(document.activeElement).toBe(secondInput);

    firstInput.focus();
    const firstEscape = new KeyboardEvent("keydown", {
      bubbles: true,
      cancelable: true,
      key: "Escape",
    });
    expect(firstInput.dispatchEvent(firstEscape)).toBe(false);

    expect(first.getOpen()).toBe(false);
    expect(document.activeElement).toBe(firstInput);
  });

  it("reuses the open item collection during keyboard navigation", async () => {
    renderCombobox();
    createCombobox(document.querySelector<HTMLElement>("[data-sw-combobox]")!);

    getTrigger().click();
    await waitForFloatingPosition();

    const querySelectorAll = vi.spyOn(getPopup(), "querySelectorAll");
    getInput().dispatchEvent(new KeyboardEvent("keydown", { bubbles: true, key: "ArrowDown" }));

    expect(getInput().getAttribute("aria-activedescendant")).toBe(getItem("apple").id);
    expect(querySelectorAll).not.toHaveBeenCalledWith("[data-sw-combobox-item]");
  });

  it("updates only previous and next items during large pointer highlight sweeps", async () => {
    const root = renderLargeCombobox(50, { disabledIndexes: [25] });
    createCombobox(root);

    getTrigger().click();
    await waitForFloatingPosition();

    const changedItems = new Set<string>();
    let mutationCount = 0;
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (
          mutation.attributeName !== "data-highlighted" &&
          mutation.attributeName !== "tabindex"
        ) {
          return;
        }
        if (!(mutation.target instanceof HTMLElement)) return;

        const value = mutation.target.getAttribute("data-value");
        if (value) {
          changedItems.add(value);
          if (mutation.attributeName === "data-highlighted") {
            mutationCount += 1;
          }
        }
      });
    });
    observer.observe(getPopup(), {
      attributeFilter: ["data-highlighted", "tabindex"],
      attributes: true,
      subtree: true,
    });

    getItem("item-0").dispatchEvent(
      new PointerEvent("pointermove", { bubbles: true, pointerType: "mouse" }),
    );
    await waitForMicrotasks();
    changedItems.clear();
    mutationCount = 0;

    getItem("item-49").dispatchEvent(
      new PointerEvent("pointermove", { bubbles: true, pointerType: "mouse" }),
    );
    await waitForMicrotasks();

    expect([...changedItems].sort()).toEqual(["item-0", "item-49"]);
    expect(mutationCount).toBe(2);
    expect(getItem("item-0").hasAttribute("data-highlighted")).toBe(false);
    expect(getItem("item-49").hasAttribute("data-highlighted")).toBe(true);
    expect(getInput().getAttribute("aria-activedescendant")).toBe(getItem("item-49").id);

    changedItems.clear();
    mutationCount = 0;
    getItem("item-49").dispatchEvent(
      new PointerEvent("pointermove", { bubbles: true, pointerType: "mouse" }),
    );
    await waitForMicrotasks();

    expect([...changedItems]).toEqual([]);
    expect(mutationCount).toBe(0);

    getItem("item-25").dispatchEvent(
      new PointerEvent("pointermove", { bubbles: true, pointerType: "mouse" }),
    );
    await waitForMicrotasks();
    observer.disconnect();

    expect(getItem("item-25").hasAttribute("data-highlighted")).toBe(false);
    expect(getItem("item-49").hasAttribute("data-highlighted")).toBe(true);
  });

  it("refreshes same-task pointer targets added after open", async () => {
    const root = renderCombobox();
    createCombobox(root);

    getTrigger().click();
    await waitForFloatingPosition();

    const item = document.createElement("div");
    item.setAttribute("data-sw-combobox-item", "");
    item.setAttribute("data-value", "custom");
    item.innerHTML = `
      <span data-sw-combobox-item-text>Custom fruit</span>
      <span data-sw-combobox-item-indicator hidden>check</span>
    `;
    getList().append(item);

    item.dispatchEvent(new PointerEvent("pointermove", { bubbles: true, pointerType: "mouse" }));

    expect(item.hasAttribute("data-highlighted")).toBe(true);
    expect(getInput().getAttribute("aria-activedescendant")).toBe(item.id);
  });

  it("clears stale active pointer state before item mutation observers run", async () => {
    const root = renderCombobox();
    createCombobox(root);

    getTrigger().click();
    await waitForFloatingPosition();

    const apple = getItem("apple");
    apple.dispatchEvent(new PointerEvent("pointermove", { bubbles: true, pointerType: "mouse" }));
    expect(apple.hasAttribute("data-highlighted")).toBe(true);

    apple.removeAttribute("data-sw-combobox-item");
    getItem("banana").dispatchEvent(
      new PointerEvent("pointermove", { bubbles: true, pointerType: "mouse" }),
    );

    expect(apple.hasAttribute("data-highlighted")).toBe(false);
    expect(getItem("banana").hasAttribute("data-highlighted")).toBe(true);
    expect(getInput().getAttribute("aria-activedescendant")).toBe(getItem("banana").id);
  });

  it("skips same-task removed items during keyboard navigation with a warm pointer cache", async () => {
    const root = renderCombobox();
    createCombobox(root);

    getTrigger().click();
    await waitForFloatingPosition();

    const apple = getItem("apple");
    const banana = getItem("banana");
    const coffeeShop = getItem("coffee-shop");
    banana.dispatchEvent(new PointerEvent("pointermove", { bubbles: true, pointerType: "mouse" }));
    apple.removeAttribute("data-sw-combobox-item");

    getInput().dispatchEvent(new KeyboardEvent("keydown", { bubbles: true, key: "ArrowUp" }));

    expect(apple.hasAttribute("data-highlighted")).toBe(false);
    expect(banana.hasAttribute("data-highlighted")).toBe(false);
    expect(coffeeShop.hasAttribute("data-highlighted")).toBe(true);
    expect(getInput().getAttribute("aria-activedescendant")).toBe(coffeeShop.id);
  });

  it("uses fresh active item position after same-task removals before keyboard ArrowDown", async () => {
    const root = renderCombobox();
    createCombobox(root);

    getTrigger().click();
    await waitForFloatingPosition();

    const apple = getItem("apple");
    const banana = getItem("banana");
    const apricot = getItem("apricot");
    banana.dispatchEvent(new PointerEvent("pointermove", { bubbles: true, pointerType: "mouse" }));
    apple.removeAttribute("data-sw-combobox-item");

    getInput().dispatchEvent(new KeyboardEvent("keydown", { bubbles: true, key: "ArrowDown" }));

    expect(banana.hasAttribute("data-highlighted")).toBe(false);
    expect(apricot.hasAttribute("data-highlighted")).toBe(true);
    expect(getInput().getAttribute("aria-activedescendant")).toBe(apricot.id);
  });

  it("skips same-task disabled items during keyboard navigation with a warm pointer cache", async () => {
    const root = renderCombobox();
    createCombobox(root);

    getTrigger().click();
    await waitForFloatingPosition();

    const apple = getItem("apple");
    const banana = getItem("banana");
    const coffeeShop = getItem("coffee-shop");
    banana.dispatchEvent(new PointerEvent("pointermove", { bubbles: true, pointerType: "mouse" }));
    apple.setAttribute("data-disabled", "");

    getInput().dispatchEvent(new KeyboardEvent("keydown", { bubbles: true, key: "ArrowUp" }));

    expect(apple.hasAttribute("data-highlighted")).toBe(false);
    expect(banana.hasAttribute("data-highlighted")).toBe(false);
    expect(coffeeShop.hasAttribute("data-highlighted")).toBe(true);
    expect(getInput().getAttribute("aria-activedescendant")).toBe(coffeeShop.id);
  });

  it("uses fresh active item position after same-task disablement before keyboard ArrowDown", async () => {
    const root = renderCombobox();
    createCombobox(root);

    getTrigger().click();
    await waitForFloatingPosition();

    const apple = getItem("apple");
    const banana = getItem("banana");
    const apricot = getItem("apricot");
    banana.dispatchEvent(new PointerEvent("pointermove", { bubbles: true, pointerType: "mouse" }));
    apple.setAttribute("data-disabled", "");

    getInput().dispatchEvent(new KeyboardEvent("keydown", { bubbles: true, key: "ArrowDown" }));

    expect(banana.hasAttribute("data-highlighted")).toBe(false);
    expect(apricot.hasAttribute("data-highlighted")).toBe(true);
    expect(getInput().getAttribute("aria-activedescendant")).toBe(apricot.id);
  });

  it("refreshes filtered open item collections when options are added", async () => {
    renderCombobox();
    createCombobox(document.querySelector<HTMLElement>("[data-sw-combobox]")!);

    getInput().value = "ap";
    getInput().dispatchEvent(new InputEvent("input", { bubbles: true }));
    await waitForFloatingPosition();

    const item = document.createElement("div");
    item.setAttribute("data-sw-combobox-item", "");
    item.setAttribute("data-value", "appaloosa");
    item.innerHTML = `
      <span data-sw-combobox-item-text>Appaloosa</span>
      <span data-sw-combobox-item-indicator hidden>check</span>
    `;
    getList().append(item);
    await waitForMicrotasks();

    getInput().dispatchEvent(new KeyboardEvent("keydown", { bubbles: true, key: "ArrowUp" }));

    expect(getInput().getAttribute("aria-activedescendant")).toBe(item.id);
    expect(item.hidden).toBe(false);
    expect(item.getAttribute("role")).toBe("option");
  });

  it("refreshes lazy popup empty state when popup children mount after initialization", async () => {
    const root = renderCombobox();
    const popup = getPopup();
    popup.innerHTML = "";
    createCombobox(root);

    getInput().value = "zz";
    getInput().dispatchEvent(new InputEvent("input", { bubbles: true }));
    await waitForFloatingPosition();

    popup.innerHTML = `
      <div data-sw-combobox-empty hidden>No fruit found.</div>
      <div data-sw-combobox-list>
        <div data-sw-combobox-item data-value="apple"><span data-sw-combobox-item-text>Apple</span></div>
        <div data-sw-combobox-item data-value="banana"><span data-sw-combobox-item-text>Banana</span></div>
      </div>
    `;
    await waitForMicrotasks();

    expect(getEmpty().hidden).toBe(false);
    expect(getItem("apple").hidden).toBe(true);
    expect(getItem("banana").hidden).toBe(true);
  });

  it("uses same-task option additions for imperative value updates", async () => {
    const root = renderCombobox();
    const combobox = createCombobox(root);

    getTrigger().click();
    await waitForFloatingPosition();

    const item = document.createElement("div");
    item.setAttribute("data-sw-combobox-item", "");
    item.setAttribute("data-value", "custom");
    item.innerHTML = `
      <span data-sw-combobox-item-text>Custom fruit</span>
      <span data-sw-combobox-item-indicator hidden>check</span>
    `;
    getList().append(item);

    combobox.setValue("custom", { emit: false });

    expect(combobox.getValue()).toBe("custom");
    expect(getHiddenInput().value).toBe("custom");
    expect(item.getAttribute("aria-selected")).toBe("true");
  });

  it("syncs value updates to visible input text unless input value is controlled", () => {
    const uncontrolledRoot = renderCombobox({ defaultValue: "banana" });
    const uncontrolledCombobox = createCombobox(uncontrolledRoot);

    uncontrolledCombobox.setInputValue("ap", { emit: false });
    uncontrolledCombobox.setValue("apricot", { emit: false });

    expect(uncontrolledCombobox.getValue()).toBe("apricot");
    expect(uncontrolledCombobox.getInputValue()).toBe("Apricot");
    expect(getComboboxInput(uncontrolledRoot).value).toBe("Apricot");
    expect(getHiddenInput().value).toBe("apricot");
    expect(getItem("apricot").getAttribute("aria-selected")).toBe("true");

    const controlledRoot = renderCombobox({ defaultValue: "banana" });
    const controlledCombobox = createCombobox(controlledRoot, {
      inputValue: "Owned text",
      value: "banana",
    });

    controlledCombobox.setValue("apricot", { emit: false });

    expect(controlledCombobox.getValue()).toBe("apricot");
    expect(controlledCombobox.getInputValue()).toBe("Owned text");
    expect(getComboboxInput(controlledRoot).value).toBe("Owned text");
  });

  it("restores selected item text after Escape dismisses an uncommitted input value", async () => {
    const root = renderCombobox({ defaultValue: "banana", name: "fruit" });
    const combobox = createCombobox(root);

    getInput().focus();
    getInput().value = "ap";
    getInput().dispatchEvent(new InputEvent("input", { bubbles: true }));
    await waitForFloatingPosition();

    expect(combobox.getOpen()).toBe(true);
    expect(getInput().value).toBe("ap");

    getInput().dispatchEvent(
      new KeyboardEvent("keydown", { bubbles: true, cancelable: true, key: "Escape" }),
    );

    expect(combobox.getOpen()).toBe(false);
    expect(getPopup().hidden).toBe(true);
    expect(combobox.getValue()).toBe("banana");
    expect(getHiddenInput().value).toBe("banana");
    expect(combobox.getInputValue()).toBe("Banana");
    expect(getInput().value).toBe("Banana");
  });

  it("restores selected item text when a closed focused input reopens from typing", async () => {
    const root = renderCombobox({ defaultValue: "banana", name: "fruit" });
    const combobox = createCombobox(root);

    getInput().focus();
    getInput().value = "ap";
    getInput().dispatchEvent(new InputEvent("input", { bubbles: true }));
    await waitForFloatingPosition();
    getItem("apple").click();

    expect(combobox.getOpen()).toBe(false);
    expect(getPopup().hidden).toBe(true);
    expect(document.activeElement).toBe(getInput());
    expect(combobox.getInputValue()).toBe("Apple");

    getInput().value = "zz";
    getInput().dispatchEvent(new InputEvent("input", { bubbles: true }));
    await waitForFloatingPosition();

    expect(combobox.getOpen()).toBe(true);
    expect(getInput().value).toBe("zz");

    getInput().dispatchEvent(
      new KeyboardEvent("keydown", { bubbles: true, cancelable: true, key: "Escape" }),
    );

    expect(combobox.getOpen()).toBe(false);
    expect(getPopup().hidden).toBe(true);
    expect(combobox.getValue()).toBe("apple");
    expect(getHiddenInput().value).toBe("apple");
    expect(combobox.getInputValue()).toBe("Apple");
    expect(getInput().value).toBe("Apple");
  });

  it("restores empty input after outside interaction dismisses an uncommitted input value", async () => {
    const root = renderCombobox({ name: "fruit" });
    const combobox = createCombobox(root);

    getInput().focus();
    getInput().value = "ap";
    getInput().dispatchEvent(new InputEvent("input", { bubbles: true }));
    await waitForFloatingPosition();

    expect(combobox.getOpen()).toBe(true);
    expect(getInput().value).toBe("ap");

    document.body.dispatchEvent(new PointerEvent("pointerdown", { bubbles: true }));

    expect(combobox.getOpen()).toBe(false);
    expect(getPopup().hidden).toBe(true);
    expect(combobox.getValue()).toBeNull();
    expect(getHiddenInput().value).toBe("");
    expect(combobox.getInputValue()).toBe("");
    expect(getInput().value).toBe("");
  });

  it("keeps filtered selection and clear actions committed after close completion", async () => {
    let root = renderCombobox({ defaultValue: "banana", name: "fruit" });
    let combobox = createCombobox(root);

    getInput().focus();
    getInput().value = "ap";
    getInput().dispatchEvent(new InputEvent("input", { bubbles: true }));
    await waitForFloatingPosition();
    getItem("apricot").click();

    expect(combobox.getOpen()).toBe(false);
    expect(getPopup().hidden).toBe(true);
    expect(combobox.getValue()).toBe("apricot");
    expect(getHiddenInput().value).toBe("apricot");
    expect(combobox.getInputValue()).toBe("Apricot");
    expect(getInput().value).toBe("Apricot");

    document.body.innerHTML = "";
    root = renderCombobox({ defaultValue: "banana", name: "fruit" });
    combobox = createCombobox(root);

    getInput().focus();
    getInput().value = "ap";
    getInput().dispatchEvent(new InputEvent("input", { bubbles: true }));
    await waitForFloatingPosition();
    getClear().click();

    expect(combobox.getValue()).toBeNull();
    expect(getHiddenInput().value).toBe("");
    expect(combobox.getInputValue()).toBe("");
    expect(getInput().value).toBe("");

    document.body.dispatchEvent(new PointerEvent("pointerdown", { bubbles: true }));

    expect(combobox.getOpen()).toBe(false);
    expect(getPopup().hidden).toBe(true);
    expect(combobox.getValue()).toBeNull();
    expect(getHiddenInput().value).toBe("");
    expect(combobox.getInputValue()).toBe("");
    expect(getInput().value).toBe("");
  });

  it("does not locally roll back controlled input values", async () => {
    const root = renderCombobox({ defaultValue: "banana", name: "fruit" });
    const combobox = createCombobox(root, {
      inputValue: "Owned text",
      value: "banana",
    });

    getInput().focus();
    getInput().value = "ap";
    getInput().dispatchEvent(new InputEvent("input", { bubbles: true }));
    await waitForFloatingPosition();

    expect(combobox.getOpen()).toBe(true);
    expect(combobox.getInputValue()).toBe("Owned text");
    expect(getInput().value).toBe("Owned text");

    document.body.dispatchEvent(new PointerEvent("pointerdown", { bubbles: true }));

    expect(combobox.getOpen()).toBe(false);
    expect(getPopup().hidden).toBe(true);
    expect(combobox.getValue()).toBe("banana");
    expect(getHiddenInput().value).toBe("banana");
    expect(combobox.getInputValue()).toBe("Owned text");
    expect(getInput().value).toBe("Owned text");
  });

  it("selects a value from a root-scoped starwind:set-value command", () => {
    const root = renderCombobox({ defaultValue: "banana", name: "fruit" });
    const combobox = createCombobox(root);

    root.dispatchEvent(
      new CustomEvent("starwind:set-value", {
        detail: { value: "apricot" },
      }),
    );

    expect(combobox.getValue()).toBe("apricot");
    expect(combobox.getInputValue()).toBe("Apricot");
    expect(getInput().value).toBe("Apricot");
    expect(getHiddenInput().value).toBe("apricot");
    expect(getValue().textContent).toBe("Apricot");
    expect(getItem("apricot").getAttribute("aria-selected")).toBe("true");
    expect(getItem("apricot").hasAttribute("data-selected")).toBe(true);
    expect(getItem("banana").getAttribute("aria-selected")).toBe("false");
    expect(getItem("banana").hasAttribute("data-selected")).toBe(false);
    expect(getItem("apricot").querySelector("[data-sw-combobox-item-indicator]")).toHaveProperty(
      "hidden",
      false,
    );
    expect(getItem("banana").querySelector("[data-sw-combobox-item-indicator]")).toHaveProperty(
      "hidden",
      true,
    );
  });

  it("honors emit false for root-scoped starwind:set-value commands", () => {
    const root = renderCombobox({ defaultValue: "banana" });
    const combobox = createCombobox(root);
    const valueSubscriber = vi.fn();
    const domValueListener = vi.fn();
    combobox.subscribe("valueChange", valueSubscriber);
    root.addEventListener("starwind:value-change", domValueListener);

    root.dispatchEvent(
      new CustomEvent("starwind:set-value", {
        detail: { value: "apricot" },
      }),
    );

    expect(combobox.getValue()).toBe("apricot");
    expect(valueSubscriber).toHaveBeenCalledWith(
      expect.objectContaining({
        previousValue: "banana",
        reason: "imperative-action",
        value: "apricot",
      }),
    );
    expect(domValueListener).not.toHaveBeenCalled();

    root.dispatchEvent(
      new CustomEvent("starwind:set-value", {
        detail: { emit: false, value: "apple" },
      }),
    );

    expect(combobox.getValue()).toBe("apple");
    expect(valueSubscriber).toHaveBeenCalledTimes(1);
    expect(domValueListener).not.toHaveBeenCalled();
  });

  it("removes the root-scoped value command listener when destroyed", () => {
    const root = renderCombobox({ defaultValue: "banana" });
    const combobox = createCombobox(root);

    combobox.destroy();
    root.dispatchEvent(
      new CustomEvent("starwind:set-value", {
        detail: { value: "apricot" },
      }),
    );

    expect(combobox.getValue()).toBe("banana");
    expect(combobox.getInputValue()).toBe("Banana");
    expect(getInput().value).toBe("Banana");
    expect(getHiddenInput().value).toBe("banana");
  });

  it("keeps active item identity after same-task insertion and value update", async () => {
    const root = renderCombobox();
    const combobox = createCombobox(root);

    getTrigger().click();
    await waitForFloatingPosition();
    getInput().dispatchEvent(new KeyboardEvent("keydown", { bubbles: true, key: "ArrowDown" }));

    const activeItem = getItem("apple");
    expect(activeItem.hasAttribute("data-highlighted")).toBe(true);

    const item = document.createElement("div");
    item.setAttribute("data-sw-combobox-item", "");
    item.setAttribute("data-value", "custom");
    item.innerHTML = `
      <span data-sw-combobox-item-text>Custom fruit</span>
      <span data-sw-combobox-item-indicator hidden>check</span>
    `;
    getList().insertBefore(item, getList().firstElementChild);
    combobox.setValue("banana", { emit: false });

    getInput().dispatchEvent(new KeyboardEvent("keydown", { bubbles: true, key: "Enter" }));

    expect(combobox.getValue()).toBe("apple");
  });

  it("does not activate an active item that loses membership before observers run", async () => {
    const root = renderCombobox();
    const combobox = createCombobox(root);

    getTrigger().click();
    await waitForFloatingPosition();
    getInput().dispatchEvent(new KeyboardEvent("keydown", { bubbles: true, key: "ArrowDown" }));

    const activeItem = getItem("apple");
    expect(activeItem.hasAttribute("data-highlighted")).toBe(true);

    activeItem.removeAttribute("data-sw-combobox-item");
    getInput().dispatchEvent(new KeyboardEvent("keydown", { bubbles: true, key: "Enter" }));

    expect(combobox.getOpen()).toBe(true);
    expect(combobox.getValue()).toBe(null);
    expect(activeItem.hasAttribute("data-highlighted")).toBe(false);
  });

  it("does not activate an active item that becomes disabled before observers run", async () => {
    const root = renderCombobox();
    const combobox = createCombobox(root);

    getTrigger().click();
    await waitForFloatingPosition();
    getInput().dispatchEvent(new KeyboardEvent("keydown", { bubbles: true, key: "ArrowDown" }));

    const activeItem = getItem("apple");
    expect(activeItem.hasAttribute("data-highlighted")).toBe(true);

    activeItem.setAttribute("data-disabled", "");
    getInput().dispatchEvent(new KeyboardEvent("keydown", { bubbles: true, key: "Enter" }));

    expect(combobox.getOpen()).toBe(true);
    expect(combobox.getValue()).toBe(null);
    expect(activeItem.hasAttribute("data-highlighted")).toBe(false);
  });

  it("clears an active item that loses membership before close observers run", async () => {
    const root = renderCombobox();
    const combobox = createCombobox(root);

    getTrigger().click();
    await waitForFloatingPosition();
    getInput().dispatchEvent(new KeyboardEvent("keydown", { bubbles: true, key: "ArrowDown" }));

    const activeItem = getItem("apple");
    expect(activeItem.hasAttribute("data-highlighted")).toBe(true);

    activeItem.removeAttribute("data-sw-combobox-item");
    combobox.close();

    expect(combobox.getOpen()).toBe(false);
    expect(activeItem.hasAttribute("data-highlighted")).toBe(false);
  });

  it("handles Enter for active selections but leaves inactive Enter available to forms", async () => {
    const form = document.createElement("form");
    document.body.append(form);
    const root = renderCombobox({ defaultValue: "banana", name: "fruit" });
    form.append(root);
    const combobox = createCombobox(root);

    getInput().focus();
    getInput().value = "zzz";
    getInput().dispatchEvent(new InputEvent("input", { bubbles: true }));
    await waitForFloatingPosition();

    expect(combobox.getOpen()).toBe(true);
    expect(getInput().getAttribute("aria-activedescendant")).toBeNull();

    const openInactiveEnter = new KeyboardEvent("keydown", {
      bubbles: true,
      cancelable: true,
      key: "Enter",
    });
    expect(getInput().dispatchEvent(openInactiveEnter)).toBe(true);
    expect(openInactiveEnter.defaultPrevented).toBe(false);
    expect(combobox.getValue()).toBe("banana");

    getInput().value = "";
    getInput().dispatchEvent(new InputEvent("input", { bubbles: true }));

    getInput().focus();
    getInput().dispatchEvent(
      new KeyboardEvent("keydown", { bubbles: true, cancelable: true, key: "ArrowDown" }),
    );
    await waitForFloatingPosition();

    expect(combobox.getOpen()).toBe(true);
    expect(getInput().getAttribute("aria-activedescendant")).toBe(getItem("apple").id);

    const selectionEnter = new KeyboardEvent("keydown", {
      bubbles: true,
      cancelable: true,
      key: "Enter",
    });
    expect(getInput().dispatchEvent(selectionEnter)).toBe(false);
    expect(selectionEnter.defaultPrevented).toBe(true);
    expect(combobox.getValue()).toBe("apple");
    expect(combobox.getOpen()).toBe(false);
    expect(getHiddenInput().value).toBe("apple");
    expect(new FormData(form).get("fruit")).toBe("apple");

    const closedEnter = new KeyboardEvent("keydown", {
      bubbles: true,
      cancelable: true,
      key: "Enter",
    });
    expect(getInput().dispatchEvent(closedEnter)).toBe(true);
    expect(closedEnter.defaultPrevented).toBe(false);
  });

  it("supports controlled value, input value, and open state", async () => {
    const root = renderCombobox({ defaultValue: "banana" });
    const onValueChange = vi.fn();
    const onInputValueChange = vi.fn();
    const onOpenChange = vi.fn();
    const combobox = createCombobox(root, {
      inputValue: "App",
      onInputValueChange,
      onOpenChange,
      onValueChange,
      open: false,
      value: "apple",
    });

    expect(combobox.getValue()).toBe("apple");
    expect(combobox.getInputValue()).toBe("App");
    expect(getInput().value).toBe("App");

    getTrigger().click();
    expect(onOpenChange).toHaveBeenCalledWith(
      true,
      expect.objectContaining({ open: true, reason: "trigger-press" }),
    );
    expect(combobox.getOpen()).toBe(false);

    getInput().value = "ap";
    getInput().dispatchEvent(new InputEvent("input", { bubbles: true }));
    expect(onInputValueChange).toHaveBeenCalledWith(
      "ap",
      expect.objectContaining({ previousInputValue: "App", reason: "input" }),
    );
    expect(combobox.getInputValue()).toBe("App");
    expect(getItem("apricot").hidden).toBe(false);
    expect(getItem("banana").hidden).toBe(true);

    combobox.setInputValue("ap", { emit: false });
    combobox.setOpen(true, { emit: false });
    await waitForFloatingPosition();
    getItem("apricot").click();

    expect(onValueChange).toHaveBeenCalledWith(
      "apricot",
      expect.objectContaining({ previousValue: "apple", reason: "item-press" }),
    );
    expect(combobox.getValue()).toBe("apple");

    combobox.setValue("apricot", { emit: false });
    combobox.setInputValue("Apricot", { emit: false });
    expect(combobox.getValue()).toBe("apricot");
    expect(combobox.getInputValue()).toBe("Apricot");
  });

  it("leaves selection side effects unchanged when value changes are canceled", async () => {
    const root = renderCombobox({ defaultValue: "banana" });
    const combobox = createCombobox(root, {
      onValueChange: (_value, details) => details.cancel(),
    });

    combobox.setInputValue("ap", { emit: false });
    combobox.setOpen(true, { emit: false });
    await waitForFloatingPosition();

    getItem("apricot").click();

    expect(combobox.getValue()).toBe("banana");
    expect(getHiddenInput().value).toBe("banana");
    expect(combobox.getInputValue()).toBe("ap");
    expect(getInput().value).toBe("ap");
    expect(getItem("banana").getAttribute("aria-selected")).toBe("true");
    expect(getItem("apricot").getAttribute("aria-selected")).toBe("false");
    expect(getItem("banana").hidden).toBe(true);
    expect(getItem("apricot").hidden).toBe(false);
    expect(combobox.getOpen()).toBe(true);
    expect(getPopup().hidden).toBe(false);
  });

  it("leaves clear side effects unchanged when value changes are canceled", async () => {
    const root = renderCombobox({ defaultValue: "banana" });
    const combobox = createCombobox(root, {
      onValueChange: (_value, details) => details.cancel(),
    });

    combobox.setInputValue("ap", { emit: false });
    combobox.setOpen(true, { emit: false });
    await waitForFloatingPosition();

    getClear().click();

    expect(combobox.getValue()).toBe("banana");
    expect(getHiddenInput().value).toBe("banana");
    expect(combobox.getInputValue()).toBe("ap");
    expect(getInput().value).toBe("ap");
    expect(getValue().textContent).toBe("Banana");
    expect(getItem("banana").getAttribute("aria-selected")).toBe("true");
    expect(getItem("banana").hidden).toBe(true);
    expect(getItem("apricot").hidden).toBe(false);
    expect(combobox.getOpen()).toBe(true);
    expect(getPopup().hidden).toBe(false);
  });

  it("uses one cancelable details object for callback and DOM value/input events", () => {
    const root = renderCombobox({ defaultValue: "banana" });
    const valueCanceledSnapshots: boolean[] = [];
    const inputCanceledSnapshots: boolean[] = [];
    let callbackValueDetails: unknown;
    let eventValueDetails: unknown;
    let callbackInputDetails: unknown;
    let eventInputDetails: unknown;
    const combobox = createCombobox(root, {
      onInputValueChange: (_inputValue, details) => {
        callbackInputDetails = details;
        inputCanceledSnapshots.push(details.isCanceled);
      },
      onValueChange: (_value, details) => {
        callbackValueDetails = details;
        valueCanceledSnapshots.push(details.isCanceled);
        details.cancel();
        valueCanceledSnapshots.push(details.isCanceled);
      },
    });
    root.addEventListener("starwind:value-change", (event) => {
      eventValueDetails = (event as CustomEvent).detail;
    });
    root.addEventListener("starwind:input-value-change", (event) => {
      eventInputDetails = (event as CustomEvent).detail;
      event.preventDefault();
    });

    combobox.setInputValue("ap", { emit: false });
    combobox.setOpen(true, { emit: false });
    getItem("apricot").click();

    expect(valueCanceledSnapshots).toEqual([false, true]);
    expect(eventValueDetails).toBe(callbackValueDetails);
    expect(inputCanceledSnapshots).toEqual([]);

    getInput().value = "app";
    getInput().dispatchEvent(new InputEvent("input", { bubbles: true }));

    expect(inputCanceledSnapshots).toEqual([false]);
    expect(eventInputDetails).toBe(callbackInputDetails);
    expect((eventInputDetails as { isCanceled: boolean }).isCanceled).toBe(true);
    expect(combobox.getInputValue()).toBe("ap");
  });

  it("requests controlled close from Escape and outside dismissal without mutating state", () => {
    const root = renderCombobox({ defaultValue: "banana" });
    const onOpenChange = vi.fn();
    const combobox = createCombobox(root, {
      onOpenChange,
      open: true,
    });

    document.dispatchEvent(new KeyboardEvent("keydown", { bubbles: true, key: "Escape" }));

    expect(onOpenChange).toHaveBeenCalledWith(
      false,
      expect.objectContaining({ open: false, reason: "escape-key" }),
    );
    expect(combobox.getOpen()).toBe(true);
    expect(getPopup().hidden).toBe(false);

    combobox.setOpen(false, { emit: false });
    combobox.setOpen(true, { emit: false });
    onOpenChange.mockClear();

    document.body.dispatchEvent(new PointerEvent("pointerdown", { bubbles: true }));

    expect(onOpenChange).toHaveBeenCalledWith(
      false,
      expect.objectContaining({ open: false, reason: "outside-press" }),
    );
    expect(combobox.getOpen()).toBe(true);
    expect(getPopup().hidden).toBe(false);
  });

  it("applies form accessibility props and prevents readonly user changes", async () => {
    const root = renderCombobox({
      autoComplete: "country-name",
      defaultValue: "banana",
      form: "settings-form",
      highlightItemOnHover: false,
      name: "fruit",
      readOnly: true,
      required: true,
    });
    const valueListener = vi.fn();
    const inputValueListener = vi.fn();
    root.addEventListener("starwind:value-change", valueListener);
    root.addEventListener("starwind:input-value-change", inputValueListener);
    const combobox = createCombobox(root);

    expect(root.hasAttribute("data-readonly")).toBe(true);
    expect(getInput().readOnly).toBe(true);
    expect(getInput().getAttribute("aria-readonly")).toBe("true");
    expect(getHiddenInput().getAttribute("form")).toBe("settings-form");
    expect(getInput().autocomplete).toBe("country-name");

    getTrigger().click();
    await waitForFloatingPosition();
    expect(combobox.getOpen()).toBe(true);

    getItem("apricot").dispatchEvent(
      new PointerEvent("pointermove", { bubbles: true, pointerType: "mouse" }),
    );
    expect(getItem("apricot").hasAttribute("data-highlighted")).toBe(false);

    getInput().value = "ap";
    getInput().dispatchEvent(new InputEvent("input", { bubbles: true }));

    expect(combobox.getValue()).toBe("banana");
    expect(combobox.getInputValue()).toBe("Banana");
    expect(getInput().value).toBe("Banana");

    getItem("apricot").click();
    getClear().click();

    expect(combobox.getValue()).toBe("banana");
    expect(combobox.getInputValue()).toBe("Banana");
    expect(getHiddenInput().value).toBe("banana");
    expect(valueListener).not.toHaveBeenCalled();
    expect(inputValueListener).not.toHaveBeenCalled();
  });

  it("restores default input text when a form reset clears a selected value", async () => {
    const form = document.createElement("form");
    document.body.append(form);
    const root = renderCombobox({
      defaultInputValue: "Custom fruit",
      name: "fruit",
    });
    form.append(root);
    const combobox = createCombobox(root);

    expect(combobox.getValue()).toBe(null);
    expect(combobox.getInputValue()).toBe("Custom fruit");
    expect(getInput().value).toBe("Custom fruit");
    expect(getHiddenInput().value).toBe("");

    combobox.setValue("apricot");
    combobox.setInputValue("Apricot");

    expect(combobox.getValue()).toBe("apricot");
    expect(getInput().value).toBe("Apricot");
    expect(getHiddenInput().value).toBe("apricot");

    form.reset();
    await waitForMacrotask();

    expect(combobox.getValue()).toBe(null);
    expect(combobox.getInputValue()).toBe("Custom fruit");
    expect(getInput().value).toBe("Custom fruit");
    expect(getHiddenInput().value).toBe("");
  });

  it("moves its reset listener when form ownership changes", async () => {
    document.body.innerHTML = `
      <form id="original-form"></form>
      <form id="next-form"></form>
    `;
    const root = renderCombobox({
      defaultValue: "banana",
      form: "original-form",
      name: "fruit",
    });
    const combobox = createCombobox(root);
    const originalForm = document.querySelector<HTMLFormElement>("#original-form")!;
    const nextForm = document.querySelector<HTMLFormElement>("#next-form")!;

    combobox.setFormOptions({ form: "next-form" });
    combobox.setValue("apricot");
    combobox.setInputValue("Apricot");
    nextForm.reset();
    await waitForMacrotask();

    expect(combobox.getValue()).toBe("banana");
    expect(combobox.getInputValue()).toBe("Banana");
    expect(getHiddenInput().value).toBe("banana");

    combobox.setValue("apricot");
    combobox.setInputValue("Apricot");
    originalForm.reset();
    await waitForMacrotask();

    expect(combobox.getValue()).toBe("apricot");
    expect(combobox.getInputValue()).toBe("Apricot");
    expect(getHiddenInput().value).toBe("apricot");
  });

  it("keeps contains filtering by default and supports locale-aware starts-with filtering", async () => {
    let root = renderCombobox();
    let combobox = createCombobox(root);

    getInput().value = "na";
    getInput().dispatchEvent(new InputEvent("input", { bubbles: true }));
    await waitForFloatingPosition();

    expect(combobox.getOpen()).toBe(true);
    expect(getItem("banana").hidden).toBe(false);
    expect(getItem("apple").hidden).toBe(true);

    combobox.destroy();
    document.body.innerHTML = "";

    root = renderCombobox({ filterMode: "startsWith", locale: "en" });
    combobox = createCombobox(root);

    getInput().value = "na";
    getInput().dispatchEvent(new InputEvent("input", { bubbles: true }));
    await waitForFloatingPosition();

    expect(combobox.getOpen()).toBe(true);
    expect(getItem("banana").hidden).toBe(true);
    expect(getEmpty().hidden).toBe(false);

    getInput().value = "ap";
    getInput().dispatchEvent(new InputEvent("input", { bubbles: true }));

    expect(getItem("apple").hidden).toBe(false);
    expect(getItem("apricot").hidden).toBe(false);
    expect(getItem("banana").hidden).toBe(true);
    expect(getEmpty().hidden).toBe(true);

    getInput().value = "cafe";
    getInput().dispatchEvent(new InputEvent("input", { bubbles: true }));

    expect(getItem("coffee-shop").hidden).toBe(false);
    expect(getItem("apple").hidden).toBe(true);
  });
});

function renderCombobox({
  autoComplete,
  defaultInputValue,
  defaultOpen,
  defaultValue,
  filterMode,
  form,
  highlightItemOnHover,
  locale,
  modal,
  name,
  readOnly,
  required,
  side = "bottom",
}: {
  autoComplete?: string;
  defaultInputValue?: string;
  defaultOpen?: boolean;
  defaultValue?: string;
  filterMode?: string;
  form?: string;
  highlightItemOnHover?: boolean;
  locale?: string;
  modal?: boolean;
  name?: string;
  readOnly?: boolean;
  required?: boolean;
  side?: "bottom" | "top";
} = {}): HTMLElement {
  const wrapper = document.createElement("div");
  wrapper.innerHTML = `
    <div
      data-sw-combobox
      ${autoComplete ? `data-autocomplete="${autoComplete}"` : ""}
      ${defaultInputValue ? `data-default-input-value="${defaultInputValue}"` : ""}
      ${defaultOpen ? `data-default-open="true"` : ""}
      ${defaultValue ? `data-default-value="${defaultValue}"` : ""}
      ${filterMode ? `data-filter-mode="${filterMode}"` : ""}
      ${form ? `data-form="${form}"` : ""}
      ${
        highlightItemOnHover === undefined
          ? ""
          : `data-highlight-item-on-hover="${String(highlightItemOnHover)}"`
      }
      ${locale ? `data-locale="${locale}"` : ""}
      ${modal === undefined ? "" : `data-modal="${String(modal)}"`}
      ${name ? `data-name="${name}"` : ""}
      ${readOnly ? "data-readonly" : ""}
      ${required ? "data-required" : ""}
    >
      <div data-sw-combobox-label>Fruit</div>
      <div data-sw-combobox-input-group>
        <input data-sw-combobox-input placeholder="Pick fruit" />
        <button data-sw-combobox-clear type="button">Clear</button>
        <button data-sw-combobox-trigger type="button">
          <span data-sw-combobox-value data-placeholder="Pick fruit"></span>
        </button>
      </div>
      <input data-sw-combobox-hidden-input type="hidden" />
      <div data-sw-combobox-positioner data-side="${side}" data-align="start" data-side-offset="4">
        <div data-sw-combobox-popup hidden>
          <div data-sw-combobox-empty hidden>No fruit found.</div>
          <div data-sw-combobox-list>
            <div data-sw-combobox-group>
              <div data-sw-combobox-group-label>Common</div>
              <div data-sw-combobox-item data-value="apple">
                <span data-sw-combobox-item-text>Apple</span>
                <span data-sw-combobox-item-indicator hidden>check</span>
              </div>
              <div data-sw-combobox-item data-value="banana">
                <span data-sw-combobox-item-text>Banana</span>
                <span data-sw-combobox-item-indicator hidden>check</span>
              </div>
            </div>
            <div data-sw-combobox-separator></div>
            <div data-sw-combobox-item data-value="apricot">
              <span data-sw-combobox-item-text>Apricot</span>
              <span data-sw-combobox-item-indicator hidden>check</span>
            </div>
            <div data-sw-combobox-item data-value="coffee-shop">
              <span data-sw-combobox-item-text>Café</span>
              <span data-sw-combobox-item-indicator hidden>check</span>
            </div>
            <div data-sw-combobox-item data-value="disabled" data-disabled>
              <span data-sw-combobox-item-text>Disabled fruit</span>
              <span data-sw-combobox-item-indicator hidden>check</span>
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

function renderLargeCombobox(
  count: number,
  options: { disabledIndexes?: number[] } = {},
): HTMLElement {
  const disabledIndexes = new Set(options.disabledIndexes ?? []);
  const wrapper = document.createElement("div");
  const items = Array.from(
    { length: count },
    (_, index) => `
      <div
        data-sw-combobox-item
        data-value="item-${index}"
        ${disabledIndexes.has(index) ? "data-disabled" : ""}
      >
        <span data-sw-combobox-item-text>Item ${index}</span>
        <span data-sw-combobox-item-indicator hidden>check</span>
      </div>
    `,
  ).join("");

  wrapper.innerHTML = `
    <div data-sw-combobox>
      <div data-sw-combobox-label>Items</div>
      <div data-sw-combobox-input-group>
        <input data-sw-combobox-input placeholder="Pick item" />
        <button data-sw-combobox-clear type="button">Clear</button>
        <button data-sw-combobox-trigger type="button">
          <span data-sw-combobox-value data-placeholder="Pick item"></span>
        </button>
      </div>
      <input data-sw-combobox-hidden-input type="hidden" />
      <div data-sw-combobox-positioner data-side="bottom" data-align="start" data-side-offset="4">
        <div data-sw-combobox-popup hidden>
          <div data-sw-combobox-empty hidden>No item found.</div>
          <div data-sw-combobox-list>
            ${items}
          </div>
        </div>
      </div>
    </div>
  `;

  const root = wrapper.firstElementChild as HTMLElement;
  document.body.append(root);
  return root;
}

function renderComboboxInFloatingRoot(options: Parameters<typeof renderCombobox>[0] = {}): {
  floatingRoot: HTMLElement;
  root: HTMLElement;
} {
  const floatingRoot = document.createElement("div");
  floatingRoot.setAttribute("data-floating-root", "");
  document.body.append(floatingRoot);

  const root = renderCombobox(options);
  floatingRoot.append(root);

  return { floatingRoot, root };
}

function getInput(): HTMLInputElement {
  return document.querySelector<HTMLInputElement>("[data-sw-combobox-input]")!;
}

function getComboboxInput(root: HTMLElement): HTMLInputElement {
  return root.querySelector<HTMLInputElement>("[data-sw-combobox-input]")!;
}

function getInputGroup(): HTMLElement {
  return document.querySelector<HTMLElement>("[data-sw-combobox-input-group]")!;
}

function getLabel(): HTMLElement {
  return document.querySelector<HTMLElement>("[data-sw-combobox-label]")!;
}

function getHiddenInput(): HTMLInputElement {
  return document.querySelector<HTMLInputElement>("[data-sw-combobox-hidden-input]")!;
}

function getTrigger(): HTMLButtonElement {
  return document.querySelector<HTMLButtonElement>("[data-sw-combobox-trigger]")!;
}

function getValue(): HTMLElement {
  return document.querySelector<HTMLElement>("[data-sw-combobox-value]")!;
}

function getClear(): HTMLButtonElement {
  return document.querySelector<HTMLButtonElement>("[data-sw-combobox-clear]")!;
}

function getPopup(): HTMLElement {
  return document.querySelector<HTMLElement>("[data-sw-combobox-popup]")!;
}

function getPositioner(): HTMLElement {
  return document.querySelector<HTMLElement>("[data-sw-combobox-positioner]")!;
}

function getEmpty(): HTMLElement {
  return document.querySelector<HTMLElement>("[data-sw-combobox-empty]")!;
}

function getList(): HTMLElement {
  return document.querySelector<HTMLElement>("[data-sw-combobox-list]")!;
}

function getItems(): HTMLElement[] {
  return Array.from(document.querySelectorAll<HTMLElement>("[data-sw-combobox-item]"));
}

function getItem(value: string): HTMLElement {
  return document.querySelector<HTMLElement>(`[data-sw-combobox-item][data-value="${value}"]`)!;
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

async function waitForMacrotask(): Promise<void> {
  await new Promise((resolve) => setTimeout(resolve, 0));
}

async function waitForFloatingPosition(): Promise<void> {
  await waitForMicrotasks();
  await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));
  await waitForMicrotasks();
}

function setupFixedComboboxLayoutNearViewportBottom(): HTMLStyleElement {
  const style = document.createElement("style");
  style.textContent = `
    [data-sw-combobox-input-group] {
      position: fixed;
      left: 100px;
      top: calc(100vh - 52px);
      width: 240px;
      height: 32px;
    }

    [data-sw-combobox-popup] {
      position: fixed;
      width: 240px;
      height: 180px;
    }

    [data-sw-combobox-list] {
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

  element.style.height = `${rect.height}px`;
  element.style.width = `${rect.width}px`;

  return vi.spyOn(element, "getBoundingClientRect").mockReturnValue(value);
}

function readPx(value: string): number {
  return Number.parseFloat(value);
}

function stubRect(element: HTMLElement, rect: Partial<DOMRectReadOnly>): void {
  element.getBoundingClientRect = () =>
    ({
      bottom: 0,
      height: 0,
      left: 0,
      right: rect.width ?? 0,
      toJSON: () => ({}),
      top: 0,
      width: 0,
      x: 0,
      y: 0,
      ...rect,
    }) as DOMRect;
}

function stubNoAnimations(element: HTMLElement): void {
  Object.defineProperty(element, "getAnimations", {
    configurable: true,
    value: () => [],
  });
}
