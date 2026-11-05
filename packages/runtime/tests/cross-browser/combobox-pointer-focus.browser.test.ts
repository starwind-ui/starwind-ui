import { beforeEach, describe, expect, it, vi } from "vitest";
import { page, userEvent } from "vitest/browser";

import { createCombobox } from "../../src/components/combobox/combobox";

const settle = () => new Promise((resolve) => setTimeout(resolve, 150));

function render(defaultValue?: string): {
  input: HTMLInputElement;
  items: HTMLElement[];
  list: HTMLElement;
  outside: HTMLButtonElement;
  root: HTMLElement;
} {
  document.body.innerHTML = `
    <style>[data-sw-combobox-list]::-webkit-scrollbar { width: 16px; background: #ccc; }</style>
    <div data-sw-combobox ${defaultValue ? `data-default-value="${defaultValue}"` : ""} style="width:240px">
      <div data-sw-combobox-input-group>
        <input data-sw-combobox-input />
        <button data-testid="clear" data-sw-combobox-clear type="button">Clear</button>
        <button data-testid="second-clear" data-sw-combobox-clear type="button">Also clear</button>
        <button data-testid="trigger" data-sw-combobox-trigger type="button">Open</button>
        <button data-testid="second-trigger" data-sw-combobox-trigger type="button">Also</button>
        <span data-testid="addon">Addon</span>
      </div>
      <input data-sw-combobox-hidden-input type="hidden" />
      <div data-sw-combobox-positioner data-side="bottom" data-align="start">
        <div data-sw-combobox-popup hidden style="width:200px">
          <div data-sw-combobox-list style="height:80px;overflow-y:scroll;padding-right:20px">
            ${["Apple", "Banana", "Cherry", "Grape", "Mango", "Orange", "Peach", "Plum"]
              .map(
                (text) => `
                  <div data-sw-combobox-item data-value="${text.toLowerCase()}" style="height:30px">
                    <span data-sw-combobox-item-text>${text}</span>
                  </div>`,
              )
              .join("")}
          </div>
        </div>
      </div>
    </div>
    <button data-testid="outside" style="margin-top:400px" type="button">Outside</button>
  `;

  return {
    input: document.querySelector<HTMLInputElement>("[data-sw-combobox-input]")!,
    items: Array.from(document.querySelectorAll<HTMLElement>("[data-sw-combobox-item]")),
    list: document.querySelector<HTMLElement>("[data-sw-combobox-list]")!,
    outside: document.querySelector<HTMLButtonElement>("[data-testid='outside']")!,
    root: document.querySelector<HTMLElement>("[data-sw-combobox]")!,
  };
}

function reasons(onOpenChange: ReturnType<typeof vi.fn>): unknown[] {
  return onOpenChange.mock.calls.map(([open, details]) => [open, details.reason]);
}

describe("Combobox pointer presses and focus", () => {
  beforeEach(() => {
    document.body.innerHTML = "";
  });

  it("opens and stays open when the trigger is pressed with nothing focused", async () => {
    const { root } = render();
    const onOpenChange = vi.fn();
    const combobox = createCombobox(root, { onOpenChange });

    await userEvent.click(page.getByTestId("trigger"));
    await settle();

    expect(reasons(onOpenChange)).toEqual([[true, "trigger-press"]]);
    expect(combobox.getOpen()).toBe(true);
  });

  it("closes when the trigger is pressed a second time", async () => {
    const { root } = render();
    const onOpenChange = vi.fn();
    const combobox = createCombobox(root, { onOpenChange });

    await userEvent.click(page.getByTestId("trigger"));
    await settle();
    await userEvent.click(page.getByTestId("trigger"));
    await settle();

    expect(reasons(onOpenChange)).toEqual([
      [true, "trigger-press"],
      [false, "trigger-press"],
    ]);
    expect(combobox.getOpen()).toBe(false);
  });

  it("opens and stays open when another control in the group is pressed", async () => {
    const { input, root } = render();
    const onOpenChange = vi.fn();
    const combobox = createCombobox(root, { onOpenChange });

    await userEvent.click(page.getByTestId("addon"));
    await settle();

    expect(reasons(onOpenChange)).toEqual([[true, "trigger-press"]]);
    expect(combobox.getOpen()).toBe(true);
    expect(document.activeElement).toBe(input);
  });

  it("opens and stays open when a second authored trigger is pressed", async () => {
    const { input, root } = render();
    const onOpenChange = vi.fn();
    const combobox = createCombobox(root, { onOpenChange });

    await userEvent.click(page.getByTestId("second-trigger"));
    await settle();

    expect(reasons(onOpenChange)).toEqual([[true, "trigger-press"]]);
    expect(combobox.getOpen()).toBe(true);
    expect(document.activeElement).toBe(input);
  });

  it("closes when a second authored trigger is pressed a second time", async () => {
    const { input, root } = render();
    const onOpenChange = vi.fn();
    const combobox = createCombobox(root, { onOpenChange });

    await userEvent.click(page.getByTestId("second-trigger"));
    await settle();
    await userEvent.click(page.getByTestId("second-trigger"));
    await settle();

    expect(reasons(onOpenChange)).toEqual([
      [true, "trigger-press"],
      [false, "trigger-press"],
    ]);
    expect(combobox.getOpen()).toBe(false);
    expect(document.activeElement).toBe(input);
  });

  it("toggles from an authored trigger outside the input group, and syncs every trigger", async () => {
    const { input, root } = render();
    const group = root.querySelector("[data-sw-combobox-input-group]")!;
    const outer = document.createElement("button");
    outer.setAttribute("data-sw-combobox-trigger", "");
    outer.setAttribute("data-testid", "outer-trigger");
    outer.textContent = "Outer";
    group.after(outer);
    const onOpenChange = vi.fn();
    const combobox = createCombobox(root, { onOpenChange });

    expect(outer.getAttribute("type")).toBe("button");
    await userEvent.click(page.getByTestId("outer-trigger"));
    await settle();
    expect(combobox.getOpen()).toBe(true);
    expect(document.activeElement).toBe(input);
    for (const id of ["trigger", "second-trigger", "outer-trigger"]) {
      expect(document.querySelector(`[data-testid='${id}']`)?.getAttribute("aria-expanded")).toBe(
        "true",
      );
    }

    await userEvent.click(page.getByTestId("outer-trigger"));
    await settle();
    expect(reasons(onOpenChange)).toEqual([
      [true, "trigger-press"],
      [false, "trigger-press"],
    ]);
    expect(combobox.getOpen()).toBe(false);
    expect(outer.getAttribute("aria-expanded")).toBe("false");
  });

  it("disables every authored trigger with the combobox", async () => {
    const { root } = render();
    const combobox = createCombobox(root);

    combobox.setDisabled(true);
    await settle();

    for (const id of ["trigger", "second-trigger"]) {
      expect(document.querySelector<HTMLButtonElement>(`[data-testid='${id}']`)?.disabled).toBe(
        true,
      );
    }
  });

  it("clears from a second authored Clear and keeps the popup closed", async () => {
    const { input, root } = render("apple");
    const onOpenChange = vi.fn();
    const combobox = createCombobox(root, { onOpenChange });
    const hidden = document.querySelector<HTMLInputElement>("[data-sw-combobox-hidden-input]")!;
    expect(input.value).toBe("Apple");

    await userEvent.click(page.getByTestId("second-clear"));
    await settle();

    expect(combobox.getValue()).toBe(null);
    expect(input.value).toBe("");
    expect(hidden.value).toBe("");
    expect(onOpenChange).not.toHaveBeenCalled();
    expect(document.activeElement).toBe(input);
  });

  it("sets up a Clear inside and outside the group, and disables each one", async () => {
    const { input, root } = render("apple");
    const outer = document.createElement("button");
    outer.setAttribute("data-sw-combobox-clear", "");
    outer.setAttribute("data-testid", "outer-clear");
    outer.textContent = "Outer clear";
    root.querySelector("[data-sw-combobox-input-group]")!.after(outer);
    const combobox = createCombobox(root);

    expect(outer.getAttribute("type")).toBe("button");
    await userEvent.click(page.getByTestId("outer-clear"));
    await settle();
    expect(combobox.getValue()).toBe(null);
    expect(input.value).toBe("");
    expect(document.activeElement).toBe(input);

    combobox.setDisabled(true);
    await settle();
    for (const id of ["clear", "second-clear", "outer-clear"]) {
      const clear = document.querySelector<HTMLButtonElement>(`[data-testid='${id}']`)!;
      expect(clear.disabled).toBe(true);
      expect(clear.getAttribute("aria-disabled")).toBe("true");
    }
  });

  it.each([
    ["with no delay", 0],
    ["during the close", 40],
    ["after the close", 350],
  ])("empties the text when Clear is pressed %s after an item press", async (_label, delay) => {
    const { input, root } = render();
    const combobox = createCombobox(root);
    const hidden = document.querySelector<HTMLInputElement>("[data-sw-combobox-hidden-input]")!;

    await userEvent.click(page.getByTestId("trigger"));
    await settle();
    await userEvent.click(page.getByText("Banana"));
    expect(input.value).toBe("Banana");
    await new Promise((resolve) => setTimeout(resolve, delay));

    await userEvent.click(page.getByTestId("clear"));
    await settle();

    expect(input.value).toBe("");
    expect(hidden.value).toBe("");
    expect(combobox.getValue()).toBe(null);
    expect(document.activeElement).toBe(input);
  });

  it("empties the text and returns focus when Clear is pressed with focus on the document", async () => {
    const { input, root } = render();
    const combobox = createCombobox(root);

    await userEvent.click(page.getByTestId("trigger"));
    await settle();
    await userEvent.click(page.getByText("Banana"));
    await settle();
    input.blur();
    expect(document.activeElement).toBe(document.body);

    await userEvent.click(page.getByTestId("clear"));
    await settle();

    expect(input.value).toBe("");
    expect(combobox.getValue()).toBe(null);
    expect(combobox.getOpen()).toBe(false);
    expect(document.activeElement).toBe(input);
  });

  it("keeps focus in the input while the trigger and Clear are pressed", async () => {
    const { input, root } = render("apple");
    const combobox = createCombobox(root);

    input.focus();
    await settle();
    combobox.setOpen(true);
    await settle();

    const blurs = vi.fn();
    input.addEventListener("blur", blurs);
    await userEvent.click(page.getByTestId("clear"));
    await settle();
    await userEvent.click(page.getByTestId("trigger"));
    await settle();

    expect(blurs).not.toHaveBeenCalled();
    expect(document.activeElement).toBe(input);
    expect(combobox.getOpen()).toBe(false);
  });

  it("keeps an open popup open when Clear is pressed from the focused input", async () => {
    const { input, root } = render("apple");
    const onOpenChange = vi.fn();
    const combobox = createCombobox(root, { onOpenChange });

    input.focus();
    await settle();
    combobox.setOpen(true);
    await settle();
    onOpenChange.mockClear();

    await userEvent.click(page.getByTestId("clear"));
    await settle();

    expect(combobox.getValue()).toBe(null);
    expect(reasons(onOpenChange)).toEqual([]);
    expect(combobox.getOpen()).toBe(true);
  });

  it("keeps a closed popup closed when Clear is pressed with nothing focused", async () => {
    const { root } = render("apple");
    const onOpenChange = vi.fn();
    const combobox = createCombobox(root, { onOpenChange });

    await userEvent.click(page.getByTestId("clear"));
    await settle();

    expect(combobox.getValue()).toBe(null);
    expect(reasons(onOpenChange)).toEqual([]);
    expect(combobox.getOpen()).toBe(false);
  });

  it("selects an item pressed in the popup", async () => {
    const { input, items, root } = render();
    const onOpenChange = vi.fn();
    const combobox = createCombobox(root, { onOpenChange });

    await userEvent.click(page.getByTestId("trigger"));
    await settle();
    onOpenChange.mockClear();

    await userEvent.click(items[1]!);
    await settle();

    expect(combobox.getValue()).toBe("banana");
    expect(input.value).toBe("Banana");
    expect(reasons(onOpenChange)).toEqual([[false, "item-press"]]);
  });

  it("stays open when the popup scrollbar is pressed", async () => {
    const { list, root } = render();
    const onOpenChange = vi.fn();
    const combobox = createCombobox(root, { onOpenChange });

    await userEvent.click(page.getByTestId("trigger"));
    await settle();
    onOpenChange.mockClear();

    // Headless Chromium hides scrollbars, so the press lands on the list padding there.
    await userEvent.click(list, { position: { x: list.offsetWidth - 4, y: 70 }, force: true });
    await settle();

    expect(reasons(onOpenChange)).toEqual([]);
    expect(combobox.getOpen()).toBe(true);
  });

  it("closes with focus-out when focus moves to a control outside", async () => {
    const { input, outside, root } = render();
    const onOpenChange = vi.fn();
    const combobox = createCombobox(root, { onOpenChange });

    input.focus();
    await settle();
    combobox.setOpen(true);
    await settle();
    onOpenChange.mockClear();

    outside.focus();
    await settle();

    expect(reasons(onOpenChange)).toEqual([[false, "focus-out"]]);
    expect(combobox.getOpen()).toBe(false);
  });
});
