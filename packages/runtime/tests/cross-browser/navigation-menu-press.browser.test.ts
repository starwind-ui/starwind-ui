import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { createNavigationMenu } from "../../src/components/navigation-menu/navigation-menu";

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

// The press window is 500 ms. Driven input can lag by that much on a busy machine, so these tests
// send the mouse events directly. Every step then runs in timer order.
const trigger = (id: string) => document.querySelector<HTMLElement>(`[data-testid='${id}']`)!;

function hover(id: string, from?: string): void {
  const to = trigger(id);
  if (from) {
    trigger(from).dispatchEvent(
      new PointerEvent("pointerleave", { pointerType: "mouse", relatedTarget: to }),
    );
  }
  to.dispatchEvent(new PointerEvent("pointerenter", { pointerType: "mouse" }));
}

function press(id: string): void {
  const element = trigger(id);
  const init = { bubbles: true, cancelable: true, pointerType: "mouse", button: 0 };
  element.dispatchEvent(new PointerEvent("pointerdown", init));
  element.dispatchEvent(new PointerEvent("pointerup", init));
  element.click();
}

function render(): HTMLElement {
  document.body.innerHTML = `
    <nav data-sw-nav-menu data-testid="root">
      <ul data-sw-nav-menu-list style="display:flex;gap:16px;list-style:none">
        <li data-sw-nav-menu-item data-value="products">
          <button data-sw-nav-menu-trigger data-testid="products" type="button">Products</button>
          <div data-sw-nav-menu-content>Products panel</div>
        </li>
        <li data-sw-nav-menu-item data-value="company">
          <button data-sw-nav-menu-trigger data-testid="company" type="button">Company</button>
          <div data-sw-nav-menu-content>Company panel</div>
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
    <button data-testid="away" style="margin-top:400px" type="button">Away</button>
  `;
  return document.querySelector<HTMLElement>("[data-testid='root']")!;
}

describe("Navigation Menu mouse press after hover", () => {
  let menu: ReturnType<typeof createNavigationMenu>;
  const onValueChange = vi.fn();
  const reasons = () => onValueChange.mock.calls.map(([value, details]) => [value, details.reason]);

  beforeEach(() => {
    onValueChange.mockReset();
    const root = render();
    menu = createNavigationMenu(root, { onValueChange });
  });

  afterEach(() => {
    menu.destroy();
    document.body.innerHTML = "";
  });

  it("keeps the panel open when the press comes soon after hover opened it", async () => {
    hover("products");
    await wait(120);
    expect(menu.getValue()).toBe("products");

    press("products");
    await wait(120);

    expect(menu.getValue()).toBe("products");
    expect(reasons()).toEqual([["products", "trigger-hover"]]);
  });

  it("closes on a second press after the first press kept the panel open", async () => {
    hover("products");
    await wait(120);

    press("products");
    press("products");
    await wait(120);

    expect(menu.getValue()).toBe(null);
    expect(reasons()).toEqual([
      ["products", "trigger-hover"],
      [null, "trigger-press"],
    ]);
  });

  it("closes when the press comes later", async () => {
    hover("products");
    await wait(700);
    expect(menu.getValue()).toBe("products");

    press("products");
    await wait(120);

    expect(menu.getValue()).toBe(null);
    expect(reasons()).toEqual([
      ["products", "trigger-hover"],
      [null, "trigger-press"],
    ]);
  });

  it("keeps the next panel open when hover moves to another trigger and presses it", async () => {
    hover("products");
    await wait(700);

    hover("company", "products");
    await wait(40);
    expect(menu.getValue()).toBe("company");

    press("company");
    await wait(120);

    expect(menu.getValue()).toBe("company");
  });
});
