import { beforeEach, describe, expect, it, vi } from "vitest";

import { createCollapsible } from "../../../src/components/collapsible/collapsible";

describe("createCollapsible", () => {
  beforeEach(() => {
    document.body.innerHTML = "";
    history.replaceState(null, "", `${location.pathname}${location.search}`);
  });

  it("initializes closed by default with ARIA wiring", () => {
    const root = renderCollapsible();

    createCollapsible(root);

    const trigger = getTrigger();
    const panel = getPanel();

    expect(root.getAttribute("data-state")).toBe("closed");
    expect(trigger.getAttribute("aria-expanded")).toBe("false");
    expect(trigger.getAttribute("aria-controls")).toBe(panel.id);
    expect(panel.getAttribute("aria-labelledby")).toBe(trigger.id);
    expect(panel.getAttribute("role")).toBe("region");
    expect(panel.getAttribute("data-state")).toBe("closed");
    expect(panel.hidden).toBe(true);
  });

  it("can initialize a closed panel as hidden until found", () => {
    const root = renderCollapsible({ hiddenUntilFound: true });

    createCollapsible(root);

    const panel = getPanel();
    expect(panel.getAttribute("hidden")).toBe("until-found");
    expect(panel.classList.contains("hidden")).toBe(false);
  });

  it("opens a hidden-until-found panel when beforematch fires", () => {
    const root = renderCollapsible({ hiddenUntilFound: true });
    const listener = vi.fn();
    root.addEventListener("starwind:open-change", listener);
    createCollapsible(root);

    const panel = getPanel();
    const event = new Event("beforematch");
    panel.dispatchEvent(event);

    expect(root.getAttribute("data-state")).toBe("open");
    expect(getTrigger().getAttribute("aria-expanded")).toBe("true");
    expect(panel.hidden).toBe(false);
    expect(panel.getAttribute("data-state")).toBe("open");
    expect(listener).toHaveBeenCalledWith(
      expect.objectContaining({
        detail: expect.objectContaining({
          event,
          open: true,
          previousOpen: false,
          reason: "beforematch",
          trigger: panel,
        }),
      }),
    );
  });

  it("keeps a canceled beforematch panel hidden until found", () => {
    const root = renderCollapsible({ hiddenUntilFound: true });
    root.addEventListener("starwind:open-change", (event) => {
      (event as CustomEvent<{ cancel(): void }>).detail.cancel();
    });
    createCollapsible(root);

    const panel = getPanel();
    panel.dispatchEvent(new Event("beforematch"));

    expect(root.getAttribute("data-state")).toBe("closed");
    expect(getTrigger().getAttribute("aria-expanded")).toBe("false");
    expect(panel.getAttribute("hidden")).toBe("until-found");
    expect(panel.classList.contains("hidden")).toBe(false);
  });

  it("rehides a canceled hidden-until-found panel after browser fragment reveal", async () => {
    const root = renderCollapsible({
      hiddenUntilFound: true,
      matchTargetId: "collapsible-match",
    });
    const listener = vi.fn((event: Event) => {
      (event as CustomEvent<{ cancel(): void }>).detail.cancel();
    });
    root.addEventListener("starwind:open-change", listener);
    createCollapsible(root);

    location.hash = "#collapsible-match";
    await waitForTask();

    expect(listener).toHaveBeenCalledWith(
      expect.objectContaining({
        detail: expect.objectContaining({ open: true, reason: "beforematch" }),
      }),
    );
    expect(root.getAttribute("data-state")).toBe("closed");
    expect(getTrigger().getAttribute("aria-expanded")).toBe("false");
    expect(getPanel().getAttribute("hidden")).toBe("until-found");
    expect(getPanel().classList.contains("hidden")).toBe(false);
  });

  it("rehides a controlled hidden-until-found panel when beforematch is not accepted", async () => {
    const root = renderCollapsible({
      hiddenUntilFound: true,
      matchTargetId: "controlled-collapsible-match",
    });
    const onOpenChange = vi.fn();
    createCollapsible(root, { open: false, onOpenChange });

    location.hash = "#controlled-collapsible-match";
    await waitForTask();

    expect(onOpenChange).toHaveBeenCalledWith(
      true,
      expect.objectContaining({ open: true, reason: "beforematch" }),
    );
    expect(root.getAttribute("data-state")).toBe("closed");
    expect(getTrigger().getAttribute("aria-expanded")).toBe("false");
    expect(getPanel().getAttribute("hidden")).toBe("until-found");
    expect(getPanel().classList.contains("hidden")).toBe(false);
  });

  it("opens and closes on trigger click", () => {
    const root = renderCollapsible();
    createCollapsible(root);

    const trigger = getTrigger();
    const panel = getPanel();

    trigger.click();

    expect(root.getAttribute("data-state")).toBe("open");
    expect(trigger.getAttribute("aria-expanded")).toBe("true");
    expect(panel.getAttribute("data-state")).toBe("open");
    expect(panel.hidden).toBe(false);

    trigger.click();

    expect(root.getAttribute("data-state")).toBe("closed");
    expect(trigger.getAttribute("aria-expanded")).toBe("false");
    expect(panel.getAttribute("data-state")).toBe("closed");
    expect(panel.hidden).toBe(true);
  });

  it("resolves asChild trigger wrappers to the child control", () => {
    const root = renderCollapsibleWithAsChildTrigger();
    const listener = vi.fn();
    root.addEventListener("starwind:open-change", listener);
    const script = document.querySelector<HTMLScriptElement>("#astro-module-script")!;
    const wrapper = document.querySelector<HTMLElement>("#as-child-wrapper")!;
    const trigger = document.querySelector<HTMLButtonElement>("#as-child-trigger")!;

    createCollapsible(root);

    expect(script.hasAttribute("data-sw-collapsible-trigger")).toBe(false);
    expect(trigger.hasAttribute("data-sw-collapsible-trigger")).toBe(true);
    expect(trigger.classList.contains("starwind-collapsible-trigger")).toBe(true);
    expect(trigger.classList.contains("extra-trigger-class")).toBe(true);
    expect(trigger.style.getPropertyValue("--trigger-offset")).toBe("2px");
    expect(trigger.getAttribute("aria-expanded")).toBe("false");
    expect(trigger.getAttribute("aria-controls")).toBe(getPanel().id);
    expect(getPanel().getAttribute("aria-labelledby")).toBe(trigger.id);
    expect(wrapper.hasAttribute("data-sw-collapsible-trigger")).toBe(false);
    expect(wrapper.style.display).toBe("contents");

    trigger.click();

    expect(root.getAttribute("data-state")).toBe("open");
    expect(getPanel().hidden).toBe(false);
    expect(trigger.getAttribute("aria-expanded")).toBe("true");
    expect(listener).toHaveBeenCalledWith(
      expect.objectContaining({
        detail: expect.objectContaining({ open: true, reason: "trigger-press", trigger }),
      }),
    );
  });

  it("resolves nested asChild trigger wrappers to the final child control", () => {
    const root = renderCollapsibleWithNestedAsChildTrigger();
    const outerWrapper = document.querySelector<HTMLElement>("#as-child-wrapper")!;
    const innerWrapper = document.querySelector<HTMLElement>("#nested-as-child-wrapper")!;
    const trigger = document.querySelector<HTMLButtonElement>("#as-child-trigger")!;

    createCollapsible(root);

    expect(trigger.hasAttribute("data-sw-collapsible-trigger")).toBe(true);
    expect(trigger.getAttribute("data-slot")).toBe("collapsible-trigger");
    expect(trigger.getAttribute("aria-expanded")).toBe("false");
    expect(trigger.getAttribute("aria-controls")).toBe(getPanel().id);
    expect(getPanel().getAttribute("aria-labelledby")).toBe(trigger.id);
    expect(outerWrapper.hasAttribute("data-sw-collapsible-trigger")).toBe(false);
    expect(innerWrapper.hasAttribute("data-sw-collapsible-trigger")).toBe(false);
    expect(outerWrapper.style.display).toBe("contents");
    expect(innerWrapper.style.display).toBe("contents");

    trigger.click();

    expect(root.getAttribute("data-state")).toBe("open");
    expect(trigger.getAttribute("aria-expanded")).toBe("true");
    expect(getPanel().hidden).toBe(false);
  });

  it("keeps a closing panel visible until its exit animation finishes", async () => {
    const root = renderCollapsible({ defaultOpen: true });
    const panel = getPanel();
    const closeAnimation = createDeferred();
    Object.defineProperty(panel, "getAnimations", {
      configurable: true,
      value: () => [{ finished: closeAnimation.promise }] as unknown as Animation[],
    });

    createCollapsible(root);
    getTrigger().click();

    expect(panel.getAttribute("data-state")).toBe("closed");
    expect(panel.hidden).toBe(false);

    closeAnimation.resolve();
    await closeAnimation.promise;
    await waitForMicrotask();

    expect(panel.hidden).toBe(true);
  });

  it("uses shared presence transition attributes during open and close", () => {
    const root = renderCollapsible();
    const panel = getPanel();
    const closeAnimation = createDeferred();

    createCollapsible(root);

    getTrigger().click();

    expect(panel.hasAttribute("data-starting-style")).toBe(true);
    expect(panel.hasAttribute("data-ending-style")).toBe(false);

    Object.defineProperty(panel, "getAnimations", {
      configurable: true,
      value: () => [{ finished: closeAnimation.promise }] as unknown as Animation[],
    });

    getTrigger().click();

    expect(panel.hasAttribute("data-ending-style")).toBe(true);
    expect(panel.hasAttribute("data-open")).toBe(false);
    expect(panel.hasAttribute("data-closed")).toBe(false);
  });

  it("sets the panel height variable for styled animations", () => {
    const root = renderCollapsible({ defaultOpen: true });
    const panel = getPanel();
    Object.defineProperty(panel, "scrollHeight", {
      configurable: true,
      value: 96,
    });

    createCollapsible(root);

    expect(panel.style.getPropertyValue("--starwind-collapsible-panel-height")).toBe("96px");
  });

  it("opens default content without applying initial animation suppression", () => {
    const root = renderCollapsible({ defaultOpen: true });
    const panel = getPanel();

    createCollapsible(root);

    expect(panel.hidden).toBe(false);
    expect(panel.getAttribute("data-state")).toBe("open");
    expect(panel.style.animationName).toBe("");

    getTrigger().click();

    expect(panel.getAttribute("data-state")).toBe("closed");
    expect(panel.style.animationName).toBe("");
  });

  it("dispatches open-change events from the root", () => {
    const root = renderCollapsible();
    const listener = vi.fn();
    root.addEventListener("starwind:open-change", listener);

    createCollapsible(root);
    getTrigger().click();

    expect(listener).toHaveBeenCalledTimes(1);
    expect(listener.mock.calls[0][0].detail).toMatchObject({
      open: true,
      previousOpen: false,
      reason: "trigger-press",
    });
  });

  it("does not mutate uncontrolled state when an open change is canceled", () => {
    const root = renderCollapsible();
    const listener = vi.fn((event: Event) => {
      expect(event.cancelable).toBe(true);
      const detail = (event as CustomEvent<{ cancel(): void; isCanceled: boolean }>).detail;
      detail.cancel();
      expect(detail.isCanceled).toBe(true);
    });
    root.addEventListener("starwind:open-change", listener);

    createCollapsible(root);
    getTrigger().click();

    expect(root.getAttribute("data-state")).toBe("closed");
    expect(getTrigger().getAttribute("aria-expanded")).toBe("false");
    expect(getPanel().hidden).toBe(true);
    expect(listener).toHaveBeenCalledTimes(1);
  });

  it("honors preventDefault on open-change events", () => {
    const root = renderCollapsible();
    root.addEventListener("starwind:open-change", (event) => {
      event.preventDefault();
    });

    createCollapsible(root);
    getTrigger().click();

    expect(root.getAttribute("data-state")).toBe("closed");
    expect(getTrigger().getAttribute("aria-expanded")).toBe("false");
    expect(getPanel().hidden).toBe(true);
  });

  it("lets programmatic open changes be canceled before state commits", () => {
    const root = renderCollapsible();
    const onOpenChange = vi.fn();
    const listener = vi.fn((event: Event) => {
      event.preventDefault();
    });
    root.addEventListener("starwind:open-change", listener);
    const collapsible = createCollapsible(root, { onOpenChange });

    collapsible.setOpen(true);

    expect(listener).toHaveBeenCalledWith(
      expect.objectContaining({
        cancelable: true,
        detail: expect.objectContaining({
          isCanceled: true,
          open: true,
          previousOpen: false,
          reason: "imperative-action",
        }),
      }),
    );
    expect(onOpenChange).toHaveBeenCalledWith(
      true,
      expect.objectContaining({
        isCanceled: true,
        open: true,
        previousOpen: false,
        reason: "imperative-action",
      }),
    );
    expect(collapsible.getOpen()).toBe(false);
    expect(root.getAttribute("data-state")).toBe("closed");
    expect(getTrigger().getAttribute("aria-expanded")).toBe("false");
    expect(getPanel().hidden).toBe(true);
  });

  it("supports controlled mode without mutating DOM until setOpen is called", () => {
    const root = renderCollapsible();
    const onOpenChange = vi.fn();
    const collapsible = createCollapsible(root, {
      open: false,
      onOpenChange,
    });

    getTrigger().click();

    expect(onOpenChange).toHaveBeenCalledWith(
      true,
      expect.objectContaining({ open: true, previousOpen: false }),
    );
    expect(getPanel().hidden).toBe(true);

    collapsible.setOpen(true);

    expect(getPanel().hidden).toBe(false);
  });

  it("can sync controlled state without emitting open-change events", () => {
    const root = renderCollapsible();
    const listener = vi.fn();
    root.addEventListener("starwind:open-change", listener);

    const collapsible = createCollapsible(root);
    collapsible.setOpen(true, { emit: false });

    expect(getPanel().hidden).toBe(false);
    expect(listener).not.toHaveBeenCalled();
  });

  it("ignores disabled triggers", () => {
    const root = renderCollapsible({ disabled: true });
    createCollapsible(root);

    const trigger = getTrigger();
    trigger.click();

    expect(trigger.disabled).toBe(true);
    expect(root.hasAttribute("data-disabled")).toBe(true);
    expect(getPanel().hidden).toBe(true);
  });

  it("respects trigger-level disabled state", () => {
    const root = renderCollapsible({ disabledTrigger: true });
    createCollapsible(root);

    const trigger = getTrigger();
    trigger.click();

    expect(trigger.disabled).toBe(true);
    expect(trigger.hasAttribute("data-disabled")).toBe(true);
    expect(root.hasAttribute("data-disabled")).toBe(false);
    expect(getPanel().hidden).toBe(true);
  });

  it("returns the existing instance for duplicate initialization", () => {
    const root = renderCollapsible();

    expect(createCollapsible(root)).toBe(createCollapsible(root));
  });

  it("destroy removes click listeners", () => {
    const root = renderCollapsible();
    const collapsible = createCollapsible(root);
    const trigger = getTrigger();

    collapsible.destroy();
    trigger.click();

    expect(getPanel().hidden).toBe(true);
  });
});

function renderCollapsible(
  options: {
    defaultOpen?: boolean;
    disabled?: boolean;
    disabledTrigger?: boolean;
    hiddenUntilFound?: boolean;
    matchTargetId?: string;
  } = {},
): HTMLElement {
  document.body.innerHTML = `
    <div
      data-sw-collapsible
      ${options.defaultOpen ? "data-default-open" : ""}
      ${options.disabled ? "data-disabled" : ""}
    >
      <button data-sw-collapsible-trigger ${options.disabledTrigger ? "disabled" : ""}>
        Toggle details
      </button>
      <div data-sw-collapsible-panel ${options.hiddenUntilFound ? "data-hidden-until-found" : ""}>
        Hidden <span ${options.matchTargetId ? `id="${options.matchTargetId}"` : ""}>details</span>
      </div>
    </div>
  `;

  return document.querySelector<HTMLElement>("[data-sw-collapsible]")!;
}

function renderCollapsibleWithAsChildTrigger(): HTMLElement {
  document.body.innerHTML = `
    <div data-sw-collapsible>
      <div
        id="as-child-wrapper"
        class="starwind-collapsible-trigger extra-trigger-class"
        style="--trigger-offset: 2px"
        data-as-child
        data-slot="collapsible-trigger"
        data-sw-collapsible-trigger
      >
        <script id="astro-module-script" type="module"></script>
        <button id="as-child-trigger" type="button">Toggle details</button>
      </div>
      <div data-sw-collapsible-panel>Hidden details</div>
    </div>
  `;

  return document.querySelector<HTMLElement>("[data-sw-collapsible]")!;
}

function renderCollapsibleWithNestedAsChildTrigger(): HTMLElement {
  document.body.innerHTML = `
    <div data-sw-collapsible>
      <div
        id="as-child-wrapper"
        class="starwind-collapsible-trigger extra-trigger-class"
        style="--trigger-offset: 2px"
        data-as-child
        data-slot="collapsible-trigger"
        data-sw-collapsible-trigger
      >
        <div id="nested-as-child-wrapper" data-as-child>
          <button id="as-child-trigger" type="button">Toggle details</button>
        </div>
      </div>
      <div data-sw-collapsible-panel>Hidden details</div>
    </div>
  `;

  return document.querySelector<HTMLElement>("[data-sw-collapsible]")!;
}

function getTrigger(): HTMLButtonElement {
  return document.querySelector<HTMLButtonElement>("[data-sw-collapsible-trigger]")!;
}

function getPanel(): HTMLElement {
  return document.querySelector<HTMLElement>("[data-sw-collapsible-panel]")!;
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

async function waitForTask(): Promise<void> {
  await new Promise((resolve) => {
    globalThis.setTimeout(resolve, 0);
  });
}
