import { describe, expect, it, vi } from "vitest";

import {
  createToggle,
  type TogglePressedChangeDetails,
} from "../../../src/components/toggle/toggle";

describe("createToggle", () => {
  it("initializes unpressed state and toggles when pressed", () => {
    document.body.innerHTML = `<button data-sw-toggle>Bold</button>`;
    const root = document.querySelector<HTMLButtonElement>("[data-sw-toggle]")!;
    const onPressedChange = vi.fn();

    const toggle = createToggle(root, { onPressedChange });

    expect(toggle.getPressed()).toBe(false);
    expect(root.type).toBe("button");
    expect(root.getAttribute("aria-pressed")).toBe("false");
    expect(root.getAttribute("data-state")).toBe("off");
    expect(root.hasAttribute("data-pressed")).toBe(false);

    root.click();

    expect(toggle.getPressed()).toBe(true);
    expect(root.getAttribute("aria-pressed")).toBe("true");
    expect(root.getAttribute("data-state")).toBe("on");
    expect(root.hasAttribute("data-pressed")).toBe(true);
    expect(onPressedChange).toHaveBeenCalledWith(
      true,
      expect.objectContaining({ pressed: true, previousPressed: false, reason: "none" }),
    );
  });

  it("initializes from default pressed state", () => {
    document.body.innerHTML = `<button data-sw-toggle data-default-pressed>Bold</button>`;
    const root = document.querySelector<HTMLButtonElement>("[data-sw-toggle]")!;

    const toggle = createToggle(root);

    expect(toggle.getPressed()).toBe(true);
    expect(root.getAttribute("aria-pressed")).toBe("true");
    expect(root.getAttribute("data-state")).toBe("on");
    expect(root.hasAttribute("data-pressed")).toBe(true);
  });

  it("lets explicit aria-pressed state win over default pressed markup", () => {
    document.body.innerHTML = `
      <button
        data-sw-toggle
        data-default-pressed="true"
        aria-pressed="false"
        data-state="off"
        data-unpressed
      >
        Bold
      </button>
    `;
    const root = document.querySelector<HTMLButtonElement>("[data-sw-toggle]")!;

    const toggle = createToggle(root);

    expect(toggle.getPressed()).toBe(false);
    expect(root.getAttribute("aria-pressed")).toBe("false");
    expect(root.getAttribute("data-state")).toBe("off");
    expect(root.hasAttribute("data-pressed")).toBe(false);
    expect(root.hasAttribute("data-unpressed")).toBe(true);
  });

  it("supports controlled pressed state", () => {
    document.body.innerHTML = `<button data-sw-toggle>Bold</button>`;
    const root = document.querySelector<HTMLButtonElement>("[data-sw-toggle]")!;
    const onPressedChange = vi.fn();

    const toggle = createToggle(root, { onPressedChange, pressed: false });

    root.click();

    expect(onPressedChange).toHaveBeenCalledWith(
      true,
      expect.objectContaining({ pressed: true, previousPressed: false }),
    );
    expect(toggle.getPressed()).toBe(false);
    expect(root.getAttribute("aria-pressed")).toBe("false");

    toggle.setPressed(true, { emit: false });

    expect(toggle.getPressed()).toBe(true);
    expect(root.getAttribute("aria-pressed")).toBe("true");
  });

  it("syncs matching syncGroup toggles and emits old change event details", () => {
    document.body.innerHTML = `
      <button id="theme-a" data-sw-toggle data-sync-group="theme">Theme A</button>
      <button id="theme-b" data-sw-toggle data-sync-group="theme">Theme B</button>
      <button id="layout" data-sw-toggle data-sync-group="layout">Layout</button>
    `;
    const firstRoot = document.querySelector<HTMLButtonElement>("#theme-a")!;
    const secondRoot = document.querySelector<HTMLButtonElement>("#theme-b")!;
    const otherRoot = document.querySelector<HTMLButtonElement>("#layout")!;
    const firstLegacyChange = vi.fn();
    const secondLegacyChange = vi.fn();
    firstRoot.addEventListener("starwind-toggle:change", firstLegacyChange);
    secondRoot.addEventListener("starwind-toggle:change", secondLegacyChange);

    const firstToggle = createToggle(firstRoot);
    const secondToggle = createToggle(secondRoot);
    const otherToggle = createToggle(otherRoot);
    const secondPressedChange = vi.fn();
    const unsubscribe = secondToggle.subscribe("pressedChange", secondPressedChange);

    firstRoot.click();

    expect(firstToggle.getPressed()).toBe(true);
    expect(secondToggle.getPressed()).toBe(true);
    expect(otherToggle.getPressed()).toBe(false);
    expect(firstRoot.getAttribute("aria-pressed")).toBe("true");
    expect(secondRoot.getAttribute("aria-pressed")).toBe("true");
    expect(otherRoot.getAttribute("aria-pressed")).toBe("false");
    expect(firstLegacyChange).toHaveBeenCalledOnce();
    expect(secondLegacyChange).toHaveBeenCalledOnce();
    expect((firstLegacyChange.mock.calls[0]![0] as CustomEvent).detail).toEqual({
      pressed: true,
      syncGroup: "theme",
      toggleId: "theme-a",
    });
    expect((secondLegacyChange.mock.calls[0]![0] as CustomEvent).detail).toEqual({
      pressed: true,
      syncGroup: "theme",
      toggleId: "theme-b",
    });
    expect(secondPressedChange).toHaveBeenCalledWith(
      expect.objectContaining({ pressed: true, previousPressed: false }),
    );

    unsubscribe();
  });

  it("can broadcast controlled syncGroup updates without re-emitting source changes", () => {
    document.body.innerHTML = `
      <button id="source" data-sw-toggle>Source</button>
      <button id="target" data-sw-toggle data-sync-group="theme">Target</button>
    `;
    const sourceRoot = document.querySelector<HTMLButtonElement>("#source")!;
    const targetRoot = document.querySelector<HTMLButtonElement>("#target")!;
    const onPressedChange = vi.fn();
    const sourceLegacyChange = vi.fn();
    const targetLegacyChange = vi.fn();
    sourceRoot.addEventListener("starwind-toggle:change", sourceLegacyChange);
    targetRoot.addEventListener("starwind-toggle:change", targetLegacyChange);

    const sourceToggle = createToggle(sourceRoot, {
      onPressedChange,
      pressed: false,
      syncGroup: "theme",
    });
    const targetToggle = createToggle(targetRoot);

    sourceToggle.setPressed(true, { emit: false, sync: true });

    expect(onPressedChange).not.toHaveBeenCalled();
    expect(sourceLegacyChange).not.toHaveBeenCalled();
    expect(sourceToggle.getPressed()).toBe(true);
    expect(targetToggle.getPressed()).toBe(true);
    expect(sourceRoot.getAttribute("data-sync-group")).toBe("theme");
    expect(targetRoot.getAttribute("aria-pressed")).toBe("true");
    expect(targetLegacyChange).toHaveBeenCalledOnce();
    expect((targetLegacyChange.mock.calls[0]![0] as CustomEvent).detail).toEqual({
      pressed: true,
      syncGroup: "theme",
      toggleId: "target",
    });
  });

  it("removes syncGroup document listeners when destroyed", () => {
    document.body.innerHTML = `<button id="target" data-sw-toggle data-sync-group="theme">Target</button>`;
    const root = document.querySelector<HTMLButtonElement>("#target")!;
    const legacyChange = vi.fn();
    root.addEventListener("starwind-toggle:change", legacyChange);

    const toggle = createToggle(root);

    toggle.destroy();
    document.dispatchEvent(
      new CustomEvent("starwind-toggle-sync:theme", {
        detail: {
          pressed: true,
          sourceId: "source",
        },
      }),
    );

    expect(toggle.getPressed()).toBe(false);
    expect(root.getAttribute("aria-pressed")).toBe("false");
    expect(legacyChange).not.toHaveBeenCalled();
  });

  it("does not change state when pressed change details are canceled", () => {
    document.body.innerHTML = `<button data-sw-toggle>Bold</button>`;
    const root = document.querySelector<HTMLButtonElement>("[data-sw-toggle]")!;
    const onDomEvent = vi.fn((event: Event) => {
      const { detail } = event as CustomEvent<TogglePressedChangeDetails>;
      detail.cancel();
    });
    root.addEventListener("starwind:pressed-change", onDomEvent);

    const toggle = createToggle(root);

    root.click();

    expect(onDomEvent).toHaveBeenCalledOnce();
    expect(toggle.getPressed()).toBe(false);
    expect(root.getAttribute("aria-pressed")).toBe("false");
  });

  it("lets DOM pressed-change listeners cancel with preventDefault before state commits", () => {
    document.body.innerHTML = `<button data-sw-toggle>Bold</button>`;
    const root = document.querySelector<HTMLButtonElement>("[data-sw-toggle]")!;
    const onDomEvent = vi.fn((event: Event) => {
      expect(event.cancelable).toBe(true);
      event.preventDefault();
    });
    root.addEventListener("starwind:pressed-change", onDomEvent);

    const toggle = createToggle(root);

    root.click();

    const event = onDomEvent.mock.calls[0]?.[0] as CustomEvent<TogglePressedChangeDetails>;
    expect(event.defaultPrevented).toBe(true);
    expect(event.detail.isCanceled).toBe(true);
    expect(toggle.getPressed()).toBe(false);
    expect(root.getAttribute("aria-pressed")).toBe("false");
  });

  it("does not toggle when disabled", () => {
    document.body.innerHTML = `<button data-sw-toggle disabled>Bold</button>`;
    const root = document.querySelector<HTMLButtonElement>("[data-sw-toggle]")!;
    const onPressedChange = vi.fn();

    const toggle = createToggle(root, { onPressedChange });

    root.dispatchEvent(new MouseEvent("click", { bubbles: true, cancelable: true }));

    expect(toggle.getPressed()).toBe(false);
    expect(root.disabled).toBe(true);
    expect(root.hasAttribute("data-disabled")).toBe(true);
    expect(onPressedChange).not.toHaveBeenCalled();

    toggle.setDisabled(false);
    root.click();

    expect(toggle.getPressed()).toBe(true);
  });

  it("supports non-native button keyboard interaction", () => {
    document.body.innerHTML = `<span data-sw-toggle data-native="false">Bold</span>`;
    const root = document.querySelector<HTMLElement>("[data-sw-toggle]")!;

    const toggle = createToggle(root);

    expect(root.getAttribute("role")).toBe("button");
    expect(root.tabIndex).toBe(0);

    root.dispatchEvent(new KeyboardEvent("keydown", { bubbles: true, key: "Enter" }));
    expect(toggle.getPressed()).toBe(true);

    root.dispatchEvent(new KeyboardEvent("keydown", { bubbles: true, key: " " }));
    root.dispatchEvent(new KeyboardEvent("keyup", { bubbles: true, key: " " }));
    expect(toggle.getPressed()).toBe(false);
  });

  it("supports subscribers and destroy cleanup", () => {
    document.body.innerHTML = `<button data-sw-toggle>Bold</button>`;
    const root = document.querySelector<HTMLButtonElement>("[data-sw-toggle]")!;
    const toggle = createToggle(root);
    const subscriber = vi.fn();
    const unsubscribe = toggle.subscribe("pressedChange", subscriber);

    root.click();
    expect(subscriber).toHaveBeenCalledWith(expect.objectContaining({ pressed: true }));

    unsubscribe();
    root.click();
    expect(subscriber).toHaveBeenCalledTimes(1);

    toggle.destroy();
    root.click();
    expect(toggle.getPressed()).toBe(false);
  });
});
