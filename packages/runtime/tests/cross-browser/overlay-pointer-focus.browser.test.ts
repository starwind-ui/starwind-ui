import { beforeEach, describe, expect, it, vi } from "vitest";
import { page, userEvent } from "vitest/browser";

import { createMenu, type MenuOptions } from "../../src/components/menu/menu";
import { createSelect, type SelectOptions } from "../../src/components/select/select";

const settle = () => new Promise((resolve) => setTimeout(resolve, 150));

function reasons(onOpenChange: ReturnType<typeof vi.fn>): unknown[] {
  return onOpenChange.mock.calls.map(([open, details]) => [open, details.reason]);
}

describe("Select pointer presses and focus", () => {
  beforeEach(() => {
    document.body.innerHTML = `
      <div data-sw-select>
        <button data-testid="trigger" data-sw-select-trigger type="button">
          <span data-sw-select-value></span>
        </button>
        <input data-sw-select-input type="hidden" />
        <div data-sw-select-positioner>
          <div data-sw-select-popup data-testid="popup" hidden style="padding:16px;width:200px">
            <div data-sw-select-list>
              <div data-sw-select-item data-value="apple" data-testid="apple">Apple</div>
              <div data-sw-select-item data-value="banana" data-testid="banana">Banana</div>
            </div>
          </div>
        </div>
      </div>
    `;
  });

  function create(onOpenChange: SelectOptions["onOpenChange"]) {
    return createSelect(document.querySelector<HTMLElement>("[data-sw-select]")!, { onOpenChange });
  }

  it("closes when the trigger is pressed a second time", async () => {
    const onOpenChange = vi.fn();
    const select = create(onOpenChange);

    await userEvent.click(page.getByTestId("trigger"));
    await settle();
    await userEvent.click(page.getByTestId("trigger"));
    await settle();

    expect(reasons(onOpenChange)).toEqual([
      [true, "trigger-press"],
      [false, "trigger-press"],
    ]);
    expect(select.getOpen()).toBe(false);
  });

  it("selects an item pressed in the popup", async () => {
    const onOpenChange = vi.fn();
    const select = create(onOpenChange);

    await userEvent.click(page.getByTestId("trigger"));
    await settle();
    await userEvent.click(page.getByTestId("banana"));
    await settle();

    expect(select.getValue()).toBe("banana");
    expect(select.getOpen()).toBe(false);
  });

  it("stays open when the bare popup is pressed", async () => {
    const onOpenChange = vi.fn();
    const select = create(onOpenChange);

    await userEvent.click(page.getByTestId("trigger"));
    await settle();
    onOpenChange.mockClear();
    await userEvent.click(page.getByTestId("popup"), { position: { x: 4, y: 4 } });
    await settle();

    expect(reasons(onOpenChange)).toEqual([]);
    expect(select.getOpen()).toBe(true);
  });
});

describe("Menu pointer presses and focus", () => {
  beforeEach(() => {
    document.body.innerHTML = `
      <div data-sw-menu>
        <button data-testid="trigger" data-sw-menu-trigger type="button">Open menu</button>
        <div data-sw-menu-popup data-testid="popup" data-side="bottom" data-align="start" style="padding:16px;width:200px">
          <div data-sw-menu-item data-testid="account">Account</div>
          <div data-sw-menu-item>Billing</div>
        </div>
      </div>
    `;
  });

  function create(onOpenChange: MenuOptions["onOpenChange"]) {
    return createMenu(document.querySelector<HTMLElement>("[data-sw-menu]")!, { onOpenChange });
  }

  it("closes when the trigger is pressed a second time", async () => {
    const onOpenChange = vi.fn();
    const menu = create(onOpenChange);

    await userEvent.click(page.getByTestId("trigger"));
    await settle();
    await userEvent.click(page.getByTestId("trigger"));
    await settle();

    expect(reasons(onOpenChange)).toEqual([
      [true, "trigger-press"],
      [false, "trigger-press"],
    ]);
    expect(menu.getOpen()).toBe(false);
  });

  it("closes when an item is pressed", async () => {
    const onOpenChange = vi.fn();
    const menu = create(onOpenChange);

    await userEvent.click(page.getByTestId("trigger"));
    await settle();
    onOpenChange.mockClear();
    await userEvent.click(page.getByTestId("account"));
    await settle();

    expect(reasons(onOpenChange)).toEqual([[false, "item-press"]]);
    expect(menu.getOpen()).toBe(false);
  });

  it("stays open when the bare popup is pressed", async () => {
    const onOpenChange = vi.fn();
    const menu = create(onOpenChange);

    await userEvent.click(page.getByTestId("trigger"));
    await settle();
    onOpenChange.mockClear();
    await userEvent.click(page.getByTestId("popup"), { position: { x: 4, y: 4 } });
    await settle();

    expect(reasons(onOpenChange)).toEqual([]);
    expect(menu.getOpen()).toBe(true);
  });
});
