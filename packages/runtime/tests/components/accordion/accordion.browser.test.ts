import { beforeEach, describe, expect, it, vi } from "vitest";

import { createAccordion } from "../../../src/components/accordion/accordion";

describe("createAccordion", () => {
  beforeEach(() => {
    document.body.innerHTML = "";
  });

  it("initializes closed and can return to closed by default", () => {
    const root = renderAccordion();
    const accordion = createAccordion(root);

    const trigger = getTrigger("shipping");
    const content = getContent("shipping");

    expect(trigger.getAttribute("aria-expanded")).toBe("false");
    expect(trigger.getAttribute("aria-controls")).toBe(content.id);
    expect(content.hidden).toBe(true);
    expect(content.getAttribute("role")).toBe("region");
    expect(content.getAttribute("data-state")).toBe("closed");
    expect(root.getAttribute("data-collapsible")).toBe("true");

    trigger.click();

    expect(accordion.getValue()).toBe("shipping");
    expect(trigger.getAttribute("aria-expanded")).toBe("true");
    expect(content.hidden).toBe(false);

    trigger.click();

    expect(accordion.getValue()).toBeNull();
    expect(trigger.getAttribute("aria-expanded")).toBe("false");
    expect(content.hidden).toBe(true);
  });

  it("opens and closes an item on click when collapsible", () => {
    const root = renderAccordion({ collapsible: true });
    createAccordion(root);

    const trigger = getTrigger("shipping");
    const content = getContent("shipping");

    trigger.click();

    expect(trigger.getAttribute("aria-expanded")).toBe("true");
    expect(content.hidden).toBe(false);
    expect(content.getAttribute("data-state")).toBe("open");

    trigger.click();

    expect(trigger.getAttribute("aria-expanded")).toBe("false");
    expect(content.hidden).toBe(true);
    expect(content.getAttribute("data-state")).toBe("closed");
  });

  it("keeps a closing item visible until its exit animation finishes", async () => {
    const root = renderAccordion({ defaultValue: "shipping", collapsible: true });
    const content = getContent("shipping");
    const closeAnimation = createDeferred();
    Object.defineProperty(content, "getAnimations", {
      configurable: true,
      value: () => [{ finished: closeAnimation.promise }] as unknown as Animation[],
    });

    createAccordion(root);
    getTrigger("shipping").click();

    expect(content.getAttribute("data-state")).toBe("closed");
    expect(content.hidden).toBe(false);

    closeAnimation.resolve();
    await closeAnimation.promise;
    await waitForMicrotask();

    expect(content.hidden).toBe(true);
  });

  it("sets the accordion content height variable for styled animations", () => {
    const root = renderAccordion({ defaultValue: "shipping" });
    const content = getContent("shipping");
    Object.defineProperty(content, "scrollHeight", {
      configurable: true,
      value: 72,
    });

    createAccordion(root);

    expect(content.style.getPropertyValue("--starwind-accordion-content-height")).toBe("72px");
  });

  it("opens default items with animation suppressed only until the first state change", () => {
    const root = renderAccordion({ defaultValue: "shipping", collapsible: true });
    const content = getContent("shipping");
    const trigger = getTrigger("shipping");

    createAccordion(root);

    expect(content.hidden).toBe(false);
    expect(content.getAttribute("data-state")).toBe("open");
    expect(content.style.animationName).toBe("none");

    trigger.click();

    expect(content.getAttribute("data-state")).toBe("closed");
    expect(content.style.animationName).toBe("");
  });

  it("dispatches value-change events from the root", () => {
    const root = renderAccordion();
    const listener = vi.fn();
    root.addEventListener("starwind:value-change", listener);

    createAccordion(root);
    getTrigger("shipping").click();

    expect(listener).toHaveBeenCalledTimes(1);
    expect(listener.mock.calls[0][0].detail).toMatchObject({
      value: "shipping",
      previousValue: null,
      itemValue: "shipping",
      reason: "trigger",
    });
  });

  it("notifies cancelable value proposals before committing accepted state exactly once", () => {
    const root = renderAccordion();
    const observations: string[] = [];
    const onValueChange = vi.fn((details) => {
      observations.push(
        `callback:${String(details.isCanceled)}:${String(getContent("shipping").hidden)}`,
      );
    });
    root.addEventListener("starwind:value-change", (event) => {
      const details = (event as CustomEvent).detail;
      observations.push(
        `dom:${String(event.cancelable)}:${String(details.isCanceled)}:${String(
          getContent("shipping").hidden,
        )}`,
      );
    });
    const accordion = createAccordion(root, { onValueChange });
    const subscriber = vi.fn((details) => {
      observations.push(
        `subscriber:${String(details.isCanceled)}:${String(getContent("shipping").hidden)}`,
      );
    });
    accordion.subscribe("valueChange", subscriber);

    getTrigger("shipping").click();

    expect(observations).toEqual([
      "dom:true:false:true",
      "callback:false:true",
      "subscriber:false:true",
    ]);
    expect(onValueChange).toHaveBeenCalledTimes(1);
    expect(subscriber).toHaveBeenCalledTimes(1);
    expect(accordion.getValue()).toBe("shipping");
    expect(getContent("shipping").hidden).toBe(false);
    const details = onValueChange.mock.calls[0][0];
    expect(details.cancel).toEqual(expect.any(Function));
    expect(details.isCanceled).toBe(false);
  });

  it("lets the callback cancel single-value opening without changing DOM or presence state", () => {
    const root = renderAccordion();
    const content = getContent("shipping");
    const getAnimations = vi.fn(() => [] as Animation[]);
    Object.defineProperty(content, "getAnimations", {
      configurable: true,
      value: getAnimations,
    });
    const accordion = createAccordion(root, {
      onValueChange(details) {
        details.cancel();
      },
    });
    getAnimations.mockClear();

    getTrigger("shipping").click();

    expect(accordion.getValue()).toBeNull();
    expect(getTrigger("shipping").getAttribute("aria-expanded")).toBe("false");
    expect(content.getAttribute("data-state")).toBe("closed");
    expect(content.hidden).toBe(true);
    expect(content.hasAttribute("data-starting-style")).toBe(false);
    expect(content.hasAttribute("data-ending-style")).toBe(false);
    expect(getAnimations).not.toHaveBeenCalled();
  });

  it("lets subscribers cancel multiple-value opening and closing", () => {
    const root = renderAccordion({
      type: "multiple",
      defaultValue: JSON.stringify(["shipping"]),
    });
    const accordion = createAccordion(root);
    accordion.subscribe("valueChange", (details) => details.cancel());

    getTrigger("billing").click();

    expect(accordion.getValue()).toEqual(["shipping"]);
    expect(getContent("shipping").hidden).toBe(false);
    expect(getContent("billing").hidden).toBe(true);

    getTrigger("shipping").click();

    expect(accordion.getValue()).toEqual(["shipping"]);
    expect(getContent("shipping").getAttribute("data-state")).toBe("open");
    expect(getContent("shipping").hidden).toBe(false);
  });

  it("maps DOM preventDefault to detail cancellation", () => {
    const root = renderAccordion();
    const onValueChange = vi.fn();
    root.addEventListener("starwind:value-change", (event) => event.preventDefault());
    const accordion = createAccordion(root, { onValueChange });

    getTrigger("shipping").click();

    expect(accordion.getValue()).toBeNull();
    expect(getContent("shipping").hidden).toBe(true);
    expect(onValueChange).toHaveBeenCalledWith(
      expect.objectContaining({ isCanceled: true, value: "shipping" }),
    );
  });

  it("does not emit value-change events when a non-collapsible trigger leaves value unchanged", () => {
    const root = renderAccordion({ defaultValue: "shipping", collapsible: false });
    const listener = vi.fn();
    root.addEventListener("starwind:value-change", listener);
    const accordion = createAccordion(root);

    getTrigger("shipping").click();

    expect(accordion.getValue()).toBe("shipping");
    expect(getContent("shipping").hidden).toBe(false);
    expect(listener).not.toHaveBeenCalled();
  });

  it("does not emit value-change events when programmatic item actions leave value unchanged", () => {
    const root = renderAccordion({ defaultValue: "shipping", collapsible: false });
    const listener = vi.fn();
    root.addEventListener("starwind:value-change", listener);
    const accordion = createAccordion(root);

    accordion.openItem("shipping");
    accordion.closeItem("shipping");
    accordion.toggleItem("shipping");

    expect(accordion.getValue()).toBe("shipping");
    expect(getContent("shipping").hidden).toBe(false);
    expect(listener).not.toHaveBeenCalled();
  });

  it("preserves an explicit false data attribute across controller recreation", () => {
    const root = renderAccordion({ defaultValue: "shipping", collapsible: false });
    const firstAccordion = createAccordion(root);

    expect(root.getAttribute("data-collapsible")).toBe("false");

    firstAccordion.destroy();

    const secondAccordion = createAccordion(root);
    getTrigger("shipping").click();

    expect(secondAccordion.getValue()).toBe("shipping");
    expect(root.getAttribute("data-collapsible")).toBe("false");
    expect(getContent("shipping").hidden).toBe(false);
  });

  it("supports controlled mode without mutating DOM until setValue is called", () => {
    const root = renderAccordion();
    const onValueChange = vi.fn();
    const accordion = createAccordion(root, {
      value: "shipping",
      onValueChange,
    });

    getTrigger("billing").click();

    expect(onValueChange).toHaveBeenCalledWith(
      expect.objectContaining({ value: "billing", previousValue: "shipping" }),
    );
    expect(getContent("shipping").hidden).toBe(false);
    expect(getContent("billing").hidden).toBe(true);

    accordion.setValue("billing");

    expect(onValueChange).toHaveBeenCalledTimes(2);
    expect(getContent("shipping").hidden).toBe(false);
    expect(getContent("billing").hidden).toBe(true);

    accordion.setValue("billing", { emit: false });

    expect(getContent("shipping").hidden).toBe(true);
    expect(getContent("billing").hidden).toBe(false);
  });

  it("keeps controlled interactions proposal-only even when canceled", () => {
    const root = renderAccordion();
    const onValueChange = vi.fn((details) => details.cancel());
    const accordion = createAccordion(root, {
      value: "shipping",
      onValueChange,
    });

    getTrigger("billing").click();

    expect(onValueChange).toHaveBeenCalledWith(
      expect.objectContaining({
        isCanceled: true,
        previousValue: "shipping",
        value: "billing",
      }),
    );
    expect(accordion.getValue()).toBe("shipping");
    expect(getContent("shipping").hidden).toBe(false);
    expect(getContent("billing").hidden).toBe(true);
  });

  it("treats emitting imperative methods as cancelable proposals", () => {
    const root = renderAccordion({ defaultValue: "shipping" });
    const onValueChange = vi.fn((details) => details.cancel());
    const accordion = createAccordion(root, { onValueChange });

    accordion.openItem("billing");
    accordion.closeItem("shipping");
    accordion.toggleItem("shipping");
    accordion.setValue("billing");

    expect(onValueChange).toHaveBeenCalledTimes(4);
    expect(onValueChange.mock.calls.map(([details]) => details.reason)).toEqual([
      "programmatic",
      "programmatic",
      "programmatic",
      "programmatic",
    ]);
    expect(accordion.getValue()).toBe("shipping");
    expect(getContent("shipping").hidden).toBe(false);
    expect(getContent("billing").hidden).toBe(true);
  });

  it("keeps non-emitting setValue authoritative, unconditional, and silent", () => {
    const root = renderAccordion({ defaultValue: "billing" });
    const listener = vi.fn();
    root.addEventListener("starwind:value-change", (event) => {
      listener(event);
      event.preventDefault();
    });

    const accordion = createAccordion(root);
    const billingItem = getTrigger("billing").closest<HTMLElement>("[data-sw-accordion-item]")!;
    getTrigger("billing").setAttribute("aria-expanded", "false");
    getTrigger("billing").setAttribute("data-state", "closed");
    billingItem.setAttribute("data-state", "closed");
    getContent("billing").setAttribute("data-state", "closed");
    getContent("billing").hidden = true;

    accordion.setValue("billing", { emit: false });

    expect(getContent("shipping").hidden).toBe(true);
    expect(getContent("billing").hidden).toBe(false);
    expect(getContent("billing").getAttribute("data-state")).toBe("open");
    expect(getTrigger("billing").getAttribute("aria-expanded")).toBe("true");
    expect(getTrigger("billing").getAttribute("data-state")).toBe("open");
    expect(billingItem.getAttribute("data-state")).toBe("open");
    expect(listener).not.toHaveBeenCalled();
  });

  it("does not emit no-op setValue proposals", () => {
    const root = renderAccordion({ defaultValue: "shipping" });
    const listener = vi.fn();
    root.addEventListener("starwind:value-change", listener);
    const accordion = createAccordion(root);

    accordion.setValue("shipping");

    expect(accordion.getValue()).toBe("shipping");
    expect(listener).not.toHaveBeenCalled();
  });

  it("supports multiple values from JSON data attributes", () => {
    const root = renderAccordion({
      type: "multiple",
      defaultValue: JSON.stringify(["shipping", "billing"]),
    });

    createAccordion(root);

    expect(getContent("shipping").hidden).toBe(false);
    expect(getContent("billing").hidden).toBe(false);
  });

  it("does not re-close unchanged default-open panels when another multiple item closes", async () => {
    const root = renderAccordion({
      type: "multiple",
      defaultValue: JSON.stringify(["shipping", "billing"]),
    });
    const shippingContent = getContent("shipping");
    const billingContent = getContent("billing");
    const closeAnimation = createDeferred();
    Object.defineProperty(shippingContent, "getAnimations", {
      configurable: true,
      value: () => [{ finished: closeAnimation.promise }] as unknown as Animation[],
    });

    createAccordion(root);
    getTrigger("shipping").click();

    expect(shippingContent.getAttribute("data-state")).toBe("closed");
    expect(shippingContent.hidden).toBe(false);
    expect(shippingContent.hasAttribute("data-ending-style")).toBe(true);
    expect(billingContent.getAttribute("data-state")).toBe("open");
    expect(billingContent.hidden).toBe(false);
    expect(billingContent.hasAttribute("data-ending-style")).toBe(false);
    expect(billingContent.style.animationName).toBe("none");

    closeAnimation.resolve();
    await closeAnimation.promise;
    await waitForMicrotask();

    expect(shippingContent.hidden).toBe(true);
    expect(billingContent.getAttribute("data-state")).toBe("open");
    expect(billingContent.hidden).toBe(false);
    expect(billingContent.hasAttribute("data-ending-style")).toBe(false);
    expect(billingContent.style.animationName).toBe("none");
  });

  it("supports raw HTML items without explicit values by using item indexes", () => {
    document.body.innerHTML = `
      <div data-sw-accordion data-collapsible>
        <div data-sw-accordion-item>
          <button data-sw-accordion-trigger>First item</button>
          <div data-sw-accordion-content>First content</div>
        </div>
        <div data-sw-accordion-item>
          <button data-sw-accordion-trigger>Second item</button>
          <div data-sw-accordion-content>Second content</div>
        </div>
      </div>
    `;
    const root = document.querySelector<HTMLElement>("[data-sw-accordion]")!;
    const triggers = Array.from(
      document.querySelectorAll<HTMLButtonElement>("[data-sw-accordion-trigger]"),
    );
    const contents = Array.from(
      document.querySelectorAll<HTMLElement>("[data-sw-accordion-content]"),
    );

    const accordion = createAccordion(root);
    triggers[1]!.click();

    expect(accordion.getValue()).toBe("1");
    expect(contents[0]!.hidden).toBe(true);
    expect(contents[1]!.hidden).toBe(false);
  });

  it("ignores disabled items and leaves arrow key focus behavior to the browser", () => {
    const root = renderAccordion({ disabledBilling: true });
    createAccordion(root);

    const shippingTrigger = getTrigger("shipping");
    const billingTrigger = getTrigger("billing");

    billingTrigger.click();

    expect(getContent("billing").hidden).toBe(true);

    shippingTrigger.focus();
    const event = new KeyboardEvent("keydown", {
      bubbles: true,
      cancelable: true,
      key: "ArrowDown",
    });
    shippingTrigger.dispatchEvent(event);

    expect(event.defaultPrevented).toBe(false);
    expect(document.activeElement).toBe(shippingTrigger);
  });

  it("does not implement deprecated APG roving focus keys", () => {
    const root = renderAccordion();
    createAccordion(root);

    const shippingTrigger = getTrigger("shipping");
    const keys = ["ArrowDown", "ArrowRight", "ArrowUp", "ArrowLeft", "Home", "End"];

    shippingTrigger.focus();

    keys.forEach((key) => {
      const event = new KeyboardEvent("keydown", {
        bubbles: true,
        cancelable: true,
        key,
      });
      shippingTrigger.dispatchEvent(event);

      expect(event.defaultPrevented).toBe(false);
      expect(document.activeElement).toBe(shippingTrigger);
    });
  });

  it("refreshes dynamic items for insertion, removal, disablement, and reorder", async () => {
    const root = renderAccordion({ collapsible: true });
    const accordion = createAccordion(root);
    const tracking = createAccordionItem("tracking", "Tracking");

    root.append(tracking);
    await waitForMutationObserver();

    getTrigger("tracking").click();

    expect(accordion.getValue()).toBe("tracking");
    expect(getContent("tracking").hidden).toBe(false);

    tracking.remove();
    await waitForMutationObserver();

    expect(accordion.getValue()).toBeNull();

    getAccordionItem("billing").setAttribute("data-disabled", "");
    await waitForMutationObserver();

    getTrigger("billing").click();

    expect(getContent("billing").hidden).toBe(true);

    root.insertBefore(getAccordionItem("returns"), getAccordionItem("shipping"));
    await waitForMutationObserver();

    getTrigger("shipping").click();

    expect(accordion.getValue()).toBe("shipping");
    expect(getContent("shipping").hidden).toBe(false);
  });

  it("returns the existing instance for duplicate initialization", () => {
    const root = renderAccordion();

    expect(createAccordion(root)).toBe(createAccordion(root));
  });

  it("destroy removes click listeners", () => {
    const root = renderAccordion();
    const accordion = createAccordion(root);
    const trigger = getTrigger("shipping");

    accordion.destroy();
    trigger.click();

    expect(getContent("shipping").hidden).toBe(true);
  });
});

function renderAccordion(
  options: {
    type?: "single" | "multiple";
    defaultValue?: string;
    collapsible?: boolean;
    disabledBilling?: boolean;
  } = {},
): HTMLElement {
  const collapsibleAttribute =
    options.collapsible === undefined ? "" : `data-collapsible="${String(options.collapsible)}"`;

  document.body.innerHTML = `
    <div
      data-sw-accordion
      data-type="${options.type ?? "single"}"
      ${options.defaultValue ? `data-default-value='${options.defaultValue}'` : ""}
      ${collapsibleAttribute}
    >
      ${renderItem("shipping", "Shipping")}
      ${renderItem("billing", "Billing", options.disabledBilling)}
      ${renderItem("returns", "Returns")}
    </div>
  `;

  return document.querySelector<HTMLElement>("[data-sw-accordion]")!;
}

function renderItem(value: string, label: string, disabled = false): string {
  return `
    <div
      data-sw-accordion-item
      data-value="${value}"
      ${disabled ? "data-disabled" : ""}
    >
      <button data-sw-accordion-trigger>${label}</button>
      <div data-sw-accordion-content>${label} content</div>
    </div>
  `;
}

function getTrigger(value: string): HTMLButtonElement {
  return document.querySelector<HTMLButtonElement>(
    `[data-sw-accordion-item][data-value="${value}"] [data-sw-accordion-trigger]`,
  )!;
}

function getContent(value: string): HTMLElement {
  return document.querySelector<HTMLElement>(
    `[data-sw-accordion-item][data-value="${value}"] [data-sw-accordion-content]`,
  )!;
}

function getAccordionItem(value: string): HTMLElement {
  return document.querySelector<HTMLElement>(`[data-sw-accordion-item][data-value="${value}"]`)!;
}

function createAccordionItem(value: string, label: string): HTMLElement {
  const wrapper = document.createElement("div");
  wrapper.innerHTML = renderItem(value, label);
  return wrapper.firstElementChild as HTMLElement;
}

function createDeferred(): { promise: Promise<void>; resolve: () => void } {
  let resolve!: () => void;
  const promise = new Promise<void>((promiseResolve) => {
    resolve = promiseResolve;
  });

  return { promise, resolve };
}

async function waitForMicrotask(): Promise<void> {
  await Promise.resolve();
}

async function waitForMutationObserver(): Promise<void> {
  await Promise.resolve();
  await Promise.resolve();
}
