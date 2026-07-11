import { beforeEach, describe, expect, it, vi } from "vitest";

import { createAccordion } from "../../../src/components/accordion/accordion";

describe("createAccordion", () => {
  beforeEach(() => {
    document.body.innerHTML = "";
  });

  it("initializes closed by default", () => {
    const root = renderAccordion();
    createAccordion(root);

    const trigger = getTrigger("shipping");
    const content = getContent("shipping");

    expect(trigger.getAttribute("aria-expanded")).toBe("false");
    expect(trigger.getAttribute("aria-controls")).toBe(content.id);
    expect(content.hidden).toBe(true);
    expect(content.getAttribute("role")).toBe("region");
    expect(content.getAttribute("data-state")).toBe("closed");
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

  it("does not emit value-change events when a non-collapsible trigger leaves value unchanged", () => {
    const root = renderAccordion({ defaultValue: "shipping" });
    const listener = vi.fn();
    root.addEventListener("starwind:value-change", listener);
    const accordion = createAccordion(root);

    getTrigger("shipping").click();

    expect(accordion.getValue()).toBe("shipping");
    expect(getContent("shipping").hidden).toBe(false);
    expect(listener).not.toHaveBeenCalled();
  });

  it("does not emit value-change events when programmatic item actions leave value unchanged", () => {
    const root = renderAccordion({ defaultValue: "shipping" });
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

    expect(getContent("shipping").hidden).toBe(true);
    expect(getContent("billing").hidden).toBe(false);
  });

  it("can sync controlled value without emitting value-change events", () => {
    const root = renderAccordion();
    const listener = vi.fn();
    root.addEventListener("starwind:value-change", listener);

    const accordion = createAccordion(root);
    accordion.setValue("billing", { emit: false });

    expect(getContent("shipping").hidden).toBe(true);
    expect(getContent("billing").hidden).toBe(false);
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
  document.body.innerHTML = `
    <div
      data-sw-accordion
      data-type="${options.type ?? "single"}"
      ${options.defaultValue ? `data-default-value='${options.defaultValue}'` : ""}
      ${options.collapsible ? "data-collapsible" : ""}
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
