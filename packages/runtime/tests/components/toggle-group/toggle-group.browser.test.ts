import { describe, expect, it, vi } from "vitest";

import { createToggle, type TogglePressedChangeDetails } from "../../../src/components/toggle";
import {
  createToggleGroup,
  type ToggleGroupValueChangeDetails,
} from "../../../src/components/toggle-group/toggle-group";

describe("createToggleGroup", () => {
  it("initializes a single-value group and moves selection between toggles", () => {
    document.body.innerHTML = `
      <div data-sw-toggle-group data-default-value='["bold"]'>
        <button data-sw-toggle data-value="bold">Bold</button>
        <button data-sw-toggle data-value="italic">Italic</button>
      </div>
    `;
    const root = document.querySelector<HTMLElement>("[data-sw-toggle-group]")!;
    const [bold, italic] = Array.from(root.querySelectorAll<HTMLButtonElement>("[data-sw-toggle]"));
    const onValueChange = vi.fn();

    const group = createToggleGroup(root, { onValueChange });

    expect(group.getValue()).toEqual(["bold"]);
    expect(root.getAttribute("role")).toBe("group");
    expect(root.getAttribute("data-value")).toBe('["bold"]');
    expect(root.getAttribute("data-orientation")).toBe("horizontal");
    expect(root.hasAttribute("data-multiple")).toBe(false);
    expect(bold.getAttribute("aria-pressed")).toBe("true");
    expect(bold.hasAttribute("data-pressed")).toBe(true);
    expect(italic.getAttribute("aria-pressed")).toBe("false");

    italic.click();

    expect(group.getValue()).toEqual(["italic"]);
    expect(root.getAttribute("data-value")).toBe('["italic"]');
    expect(bold.getAttribute("aria-pressed")).toBe("false");
    expect(italic.getAttribute("aria-pressed")).toBe("true");
    expect(onValueChange).toHaveBeenCalledWith(
      ["italic"],
      expect.objectContaining({
        previousValue: ["bold"],
        reason: "none",
        toggleValue: "italic",
        value: ["italic"],
      }),
    );
  });

  it("does not change value when value change details are canceled", () => {
    document.body.innerHTML = `
      <div data-sw-toggle-group data-default-value='["bold"]'>
        <button data-sw-toggle data-value="bold">Bold</button>
        <button data-sw-toggle data-value="italic">Italic</button>
      </div>
    `;
    const root = document.querySelector<HTMLElement>("[data-sw-toggle-group]")!;
    const italic = root.querySelector<HTMLButtonElement>('[data-value="italic"]')!;
    root.addEventListener("starwind:value-change", (event) => {
      const { detail } = event as CustomEvent<ToggleGroupValueChangeDetails>;
      detail.cancel();
    });

    const group = createToggleGroup(root);

    italic.click();

    expect(group.getValue()).toEqual(["bold"]);
    expect(italic.getAttribute("aria-pressed")).toBe("false");
  });

  it("lets DOM value-change listeners cancel with preventDefault before group value commits", () => {
    document.body.innerHTML = `
      <div data-sw-toggle-group data-default-value='["bold"]'>
        <button data-sw-toggle data-value="bold">Bold</button>
        <button data-sw-toggle data-value="italic">Italic</button>
      </div>
    `;
    const root = document.querySelector<HTMLElement>("[data-sw-toggle-group]")!;
    const italic = root.querySelector<HTMLButtonElement>('[data-value="italic"]')!;
    const onValueChange = vi.fn();
    root.addEventListener("starwind:value-change", (event) => {
      expect(event.cancelable).toBe(true);
      event.preventDefault();
    });

    const group = createToggleGroup(root, { onValueChange });

    italic.click();

    expect(group.getValue()).toEqual(["bold"]);
    expect(italic.getAttribute("aria-pressed")).toBe("false");
    expect(onValueChange).toHaveBeenCalledWith(
      ["italic"],
      expect.objectContaining({ isCanceled: true }),
    );
  });

  it("does not commit programmatic value when value change details are canceled", () => {
    document.body.innerHTML = `
      <div data-sw-toggle-group data-default-value='["bold"]'>
        <button data-sw-toggle data-value="bold">Bold</button>
        <button data-sw-toggle data-value="italic">Italic</button>
      </div>
    `;
    const root = document.querySelector<HTMLElement>("[data-sw-toggle-group]")!;
    const italic = root.querySelector<HTMLButtonElement>('[data-value="italic"]')!;
    root.addEventListener("starwind:value-change", (event) => {
      const { detail } = event as CustomEvent<ToggleGroupValueChangeDetails>;
      expect(detail.reason).toBe("imperative-action");
      detail.cancel();
    });

    const group = createToggleGroup(root);

    group.setValue(["italic"]);

    expect(group.getValue()).toEqual(["bold"]);
    expect(root.getAttribute("data-value")).toBe('["bold"]');
    expect(italic.getAttribute("aria-pressed")).toBe("false");
  });

  it("does not commit programmatic value when value change events are prevented", () => {
    document.body.innerHTML = `
      <div data-sw-toggle-group data-default-value='["bold"]'>
        <button data-sw-toggle data-value="bold">Bold</button>
        <button data-sw-toggle data-value="italic">Italic</button>
      </div>
    `;
    const root = document.querySelector<HTMLElement>("[data-sw-toggle-group]")!;
    const italic = root.querySelector<HTMLButtonElement>('[data-value="italic"]')!;
    const onValueChange = vi.fn();
    root.addEventListener("starwind:value-change", (event) => {
      expect(event.cancelable).toBe(true);
      event.preventDefault();
    });

    const group = createToggleGroup(root, { onValueChange });

    group.setValue(["italic"]);

    expect(group.getValue()).toEqual(["bold"]);
    expect(root.getAttribute("data-value")).toBe('["bold"]');
    expect(italic.getAttribute("aria-pressed")).toBe("false");
    expect(onValueChange).toHaveBeenCalledWith(
      ["italic"],
      expect.objectContaining({ isCanceled: true }),
    );
  });

  it("lets child toggle cancellation prevent group value commit", () => {
    document.body.innerHTML = `
      <div data-sw-toggle-group data-default-value='["bold"]'>
        <button data-sw-toggle data-value="bold">Bold</button>
        <button data-sw-toggle data-value="italic">Italic</button>
      </div>
    `;
    const root = document.querySelector<HTMLElement>("[data-sw-toggle-group]")!;
    const italic = root.querySelector<HTMLButtonElement>('[data-value="italic"]')!;
    const italicToggle = createToggle(italic, {
      onPressedChange: (_pressed, details) => {
        details.cancel();
      },
    });

    const group = createToggleGroup(root);

    italic.click();

    expect(group.getValue()).toEqual(["bold"]);
    expect(italicToggle.getPressed()).toBe(false);
    expect(italic.getAttribute("aria-pressed")).toBe("false");
  });

  it("lets canceled pressed-change DOM events prevent group value commit", () => {
    document.body.innerHTML = `
      <div data-sw-toggle-group data-default-value='["bold"]'>
        <button data-sw-toggle data-value="bold">Bold</button>
        <button data-sw-toggle data-value="italic">Italic</button>
      </div>
    `;
    const root = document.querySelector<HTMLElement>("[data-sw-toggle-group]")!;
    const italic = root.querySelector<HTMLButtonElement>('[data-value="italic"]')!;
    italic.addEventListener("starwind:pressed-change", (event) => {
      const { detail } = event as CustomEvent<TogglePressedChangeDetails>;
      detail.cancel();
    });

    const group = createToggleGroup(root);

    italic.click();

    expect(group.getValue()).toEqual(["bold"]);
    expect(italic.getAttribute("aria-pressed")).toBe("false");
  });

  it("supports multiple pressed toggles", () => {
    document.body.innerHTML = `
      <div data-sw-toggle-group data-multiple data-default-value='["bold"]'>
        <button data-sw-toggle data-value="bold">Bold</button>
        <button data-sw-toggle data-value="italic">Italic</button>
      </div>
    `;
    const root = document.querySelector<HTMLElement>("[data-sw-toggle-group]")!;
    const bold = root.querySelector<HTMLButtonElement>('[data-value="bold"]')!;
    const italic = root.querySelector<HTMLButtonElement>('[data-value="italic"]')!;

    const group = createToggleGroup(root);

    expect(root.hasAttribute("data-multiple")).toBe(true);
    expect(group.getValue()).toEqual(["bold"]);

    italic.click();

    expect(group.getValue()).toEqual(["bold", "italic"]);
    expect(bold.getAttribute("aria-pressed")).toBe("true");
    expect(italic.getAttribute("aria-pressed")).toBe("true");

    bold.click();

    expect(group.getValue()).toEqual(["italic"]);
    expect(bold.getAttribute("aria-pressed")).toBe("false");
    expect(italic.getAttribute("aria-pressed")).toBe("true");
  });

  it("updates selected values when multiple mode changes", () => {
    document.body.innerHTML = `
      <div data-sw-toggle-group data-default-value='["bold"]'>
        <button data-sw-toggle data-value="bold">Bold</button>
        <button data-sw-toggle data-value="italic">Italic</button>
      </div>
    `;
    const root = document.querySelector<HTMLElement>("[data-sw-toggle-group]")!;
    const bold = root.querySelector<HTMLButtonElement>('[data-value="bold"]')!;
    const italic = root.querySelector<HTMLButtonElement>('[data-value="italic"]')!;

    const group = createToggleGroup(root);

    group.setMultiple(true);
    italic.click();

    expect(root.hasAttribute("data-multiple")).toBe(true);
    expect(group.getValue()).toEqual(["bold", "italic"]);
    expect(bold.getAttribute("aria-pressed")).toBe("true");
    expect(italic.getAttribute("aria-pressed")).toBe("true");

    group.setMultiple(false);

    expect(root.hasAttribute("data-multiple")).toBe(false);
    expect(group.getValue()).toEqual(["bold"]);
    expect(bold.getAttribute("aria-pressed")).toBe("true");
    expect(italic.getAttribute("aria-pressed")).toBe("false");
  });

  it("normalizes single-value groups to one pressed toggle", () => {
    document.body.innerHTML = `
      <div data-sw-toggle-group data-default-value='["bold","italic"]'>
        <button data-sw-toggle data-value="bold">Bold</button>
        <button data-sw-toggle data-value="italic">Italic</button>
      </div>
    `;
    const root = document.querySelector<HTMLElement>("[data-sw-toggle-group]")!;
    const bold = root.querySelector<HTMLButtonElement>('[data-value="bold"]')!;
    const italic = root.querySelector<HTMLButtonElement>('[data-value="italic"]')!;

    const group = createToggleGroup(root);

    expect(group.getValue()).toEqual(["bold"]);
    expect(root.getAttribute("data-value")).toBe('["bold"]');
    expect(bold.getAttribute("aria-pressed")).toBe("true");
    expect(italic.getAttribute("aria-pressed")).toBe("false");

    group.setValue(["italic", "bold"], { emit: false });

    expect(group.getValue()).toEqual(["italic"]);
    expect(root.getAttribute("data-value")).toBe('["italic"]');
    expect(bold.getAttribute("aria-pressed")).toBe("false");
    expect(italic.getAttribute("aria-pressed")).toBe("true");
  });

  it("deduplicates multiple-value groups", () => {
    document.body.innerHTML = `
      <div data-sw-toggle-group data-multiple data-default-value='["bold","bold","italic"]'>
        <button data-sw-toggle data-value="bold">Bold</button>
        <button data-sw-toggle data-value="italic">Italic</button>
      </div>
    `;
    const root = document.querySelector<HTMLElement>("[data-sw-toggle-group]")!;

    const group = createToggleGroup(root);

    expect(group.getValue()).toEqual(["bold", "italic"]);
    expect(root.getAttribute("data-value")).toBe('["bold","italic"]');
  });

  it("supports controlled value and programmatic value updates", () => {
    document.body.innerHTML = `
      <div data-sw-toggle-group>
        <button data-sw-toggle data-value="bold">Bold</button>
        <button data-sw-toggle data-value="italic">Italic</button>
      </div>
    `;
    const root = document.querySelector<HTMLElement>("[data-sw-toggle-group]")!;
    const bold = root.querySelector<HTMLButtonElement>('[data-value="bold"]')!;
    const italic = root.querySelector<HTMLButtonElement>('[data-value="italic"]')!;
    const onValueChange = vi.fn();

    const group = createToggleGroup(root, { onValueChange, value: ["bold"] });

    italic.click();

    expect(onValueChange).toHaveBeenCalledWith(
      ["italic"],
      expect.objectContaining({ previousValue: ["bold"], value: ["italic"] }),
    );
    expect(group.getValue()).toEqual(["bold"]);
    expect(bold.getAttribute("aria-pressed")).toBe("true");
    expect(italic.getAttribute("aria-pressed")).toBe("false");

    group.setValue(["italic"], { emit: false });

    expect(group.getValue()).toEqual(["italic"]);
    expect(bold.getAttribute("aria-pressed")).toBe("false");
    expect(italic.getAttribute("aria-pressed")).toBe("true");
  });

  it("moves focus with orientation-aware arrow keys and Home/End", () => {
    document.body.innerHTML = `
      <div data-sw-toggle-group data-orientation="vertical">
        <button data-sw-toggle data-value="bold">Bold</button>
        <button data-sw-toggle data-value="italic">Italic</button>
        <button data-sw-toggle data-value="underline">Underline</button>
      </div>
    `;
    const root = document.querySelector<HTMLElement>("[data-sw-toggle-group]")!;
    const [bold, italic, underline] = Array.from(
      root.querySelectorAll<HTMLButtonElement>("[data-sw-toggle]"),
    );

    createToggleGroup(root);

    expect(root.getAttribute("data-orientation")).toBe("vertical");
    expect(bold.tabIndex).toBe(0);
    expect(italic.tabIndex).toBe(-1);

    bold.focus();
    bold.dispatchEvent(new KeyboardEvent("keydown", { bubbles: true, key: "ArrowDown" }));
    expect(document.activeElement).toBe(italic);
    expect(italic.tabIndex).toBe(0);

    italic.dispatchEvent(new KeyboardEvent("keydown", { bubbles: true, key: "End" }));
    expect(document.activeElement).toBe(underline);

    underline.dispatchEvent(new KeyboardEvent("keydown", { bubbles: true, key: "ArrowDown" }));
    expect(document.activeElement).toBe(bold);

    bold.dispatchEvent(new KeyboardEvent("keydown", { bubbles: true, key: "ArrowRight" }));
    expect(document.activeElement).toBe(bold);
  });

  it("updates keyboard behavior when orientation changes", () => {
    document.body.innerHTML = `
      <div data-sw-toggle-group>
        <button data-sw-toggle data-value="bold">Bold</button>
        <button data-sw-toggle data-value="italic">Italic</button>
      </div>
    `;
    const root = document.querySelector<HTMLElement>("[data-sw-toggle-group]")!;
    const [bold, italic] = Array.from(root.querySelectorAll<HTMLButtonElement>("[data-sw-toggle]"));

    const group = createToggleGroup(root);

    bold.focus();
    bold.dispatchEvent(new KeyboardEvent("keydown", { bubbles: true, key: "ArrowDown" }));
    expect(document.activeElement).toBe(bold);

    group.setOrientation("vertical");

    expect(root.getAttribute("data-orientation")).toBe("vertical");
    bold.dispatchEvent(new KeyboardEvent("keydown", { bubbles: true, key: "ArrowDown" }));
    expect(document.activeElement).toBe(italic);
  });

  it("updates arrow key wrapping when loop focus changes", () => {
    document.body.innerHTML = `
      <div data-sw-toggle-group>
        <button data-sw-toggle data-value="bold">Bold</button>
        <button data-sw-toggle data-value="italic">Italic</button>
      </div>
    `;
    const root = document.querySelector<HTMLElement>("[data-sw-toggle-group]")!;
    const [bold, italic] = Array.from(root.querySelectorAll<HTMLButtonElement>("[data-sw-toggle]"));

    const group = createToggleGroup(root);

    italic.focus();
    italic.dispatchEvent(new KeyboardEvent("keydown", { bubbles: true, key: "ArrowRight" }));
    expect(document.activeElement).toBe(bold);

    group.setLoopFocus(false);

    expect(root.getAttribute("data-loop-focus")).toBe("false");
    italic.focus();
    italic.dispatchEvent(new KeyboardEvent("keydown", { bubbles: true, key: "ArrowRight" }));
    expect(document.activeElement).toBe(italic);
  });

  it("keeps keyboard activation single-select after roving focus", () => {
    document.body.innerHTML = `
      <div data-sw-toggle-group data-default-value='["bold"]'>
        <button data-sw-toggle data-value="bold">Bold</button>
        <button data-sw-toggle data-value="italic">Italic</button>
        <button data-sw-toggle data-value="underline">Underline</button>
      </div>
    `;
    const root = document.querySelector<HTMLElement>("[data-sw-toggle-group]")!;
    const [bold, italic, underline] = Array.from(
      root.querySelectorAll<HTMLButtonElement>("[data-sw-toggle]"),
    );

    const group = createToggleGroup(root);

    bold.focus();
    bold.dispatchEvent(new KeyboardEvent("keydown", { bubbles: true, key: "ArrowRight" }));
    expect(document.activeElement).toBe(italic);
    italic.click();

    italic.dispatchEvent(new KeyboardEvent("keydown", { bubbles: true, key: "ArrowRight" }));
    expect(document.activeElement).toBe(underline);
    underline.click();

    expect(group.getValue()).toEqual(["underline"]);
    expect(bold.getAttribute("aria-pressed")).toBe("false");
    expect(italic.getAttribute("aria-pressed")).toBe("false");
    expect(underline.getAttribute("aria-pressed")).toBe("true");
  });

  it("disables the whole group and ignores interaction", () => {
    document.body.innerHTML = `
      <div data-sw-toggle-group data-disabled data-default-value='["bold"]'>
        <button data-sw-toggle data-value="bold">Bold</button>
        <button data-sw-toggle data-value="italic">Italic</button>
      </div>
    `;
    const root = document.querySelector<HTMLElement>("[data-sw-toggle-group]")!;
    const [bold, italic] = Array.from(root.querySelectorAll<HTMLButtonElement>("[data-sw-toggle]"));

    const group = createToggleGroup(root);

    expect(root.hasAttribute("data-disabled")).toBe(true);
    expect(bold.disabled).toBe(true);
    expect(italic.disabled).toBe(true);

    italic.dispatchEvent(new MouseEvent("click", { bubbles: true, cancelable: true }));

    expect(group.getValue()).toEqual(["bold"]);
    expect(bold.getAttribute("aria-pressed")).toBe("true");
    expect(italic.getAttribute("aria-pressed")).toBe("false");
  });

  it("refreshes dynamic toggles for insertion, disablement, removal, and reorder", async () => {
    document.body.innerHTML = `
      <div data-sw-toggle-group>
        <button data-sw-toggle data-value="bold">Bold</button>
        <button data-sw-toggle data-value="italic">Italic</button>
        <button data-sw-toggle data-value="underline">Underline</button>
      </div>
    `;
    const root = document.querySelector<HTMLElement>("[data-sw-toggle-group]")!;
    const [bold, italic, underline] = Array.from(
      root.querySelectorAll<HTMLButtonElement>("[data-sw-toggle]"),
    );
    const strike = createToggleItem("strike");
    const group = createToggleGroup(root);

    root.append(strike);
    await waitForMutationObserver();

    underline.focus();
    underline.dispatchEvent(new KeyboardEvent("keydown", { bubbles: true, key: "ArrowRight" }));

    expect(document.activeElement).toBe(strike);
    expect(strike.tabIndex).toBe(0);

    strike.click();
    expect(group.getValue()).toEqual(["strike"]);

    strike.setAttribute("data-disabled", "");
    await waitForMutationObserver();

    underline.focus();
    underline.dispatchEvent(new KeyboardEvent("keydown", { bubbles: true, key: "ArrowRight" }));

    expect(document.activeElement).toBe(bold);
    expect(strike.disabled).toBe(true);

    strike.remove();
    await waitForMutationObserver();

    expect(group.getValue()).toEqual([]);

    root.insertBefore(underline, bold);
    await waitForMutationObserver();

    underline.focus();
    underline.dispatchEvent(new KeyboardEvent("keydown", { bubbles: true, key: "ArrowRight" }));

    expect(document.activeElement).toBe(bold);
    expect(italic.tabIndex).toBe(-1);
  });
});

function createToggleItem(value: string): HTMLButtonElement {
  const button = document.createElement("button");
  button.setAttribute("data-sw-toggle", "");
  button.setAttribute("data-value", value);
  button.textContent = value;
  return button;
}

async function waitForMutationObserver(): Promise<void> {
  await Promise.resolve();
  await Promise.resolve();
}
