import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { page, userEvent } from "vitest/browser";

import { createNavigationMenu } from "../../src/components/navigation-menu/navigation-menu";

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

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

  beforeEach(async () => {
    onValueChange.mockReset();
    const root = render();
    await userEvent.hover(page.getByTestId("away"));
    menu = createNavigationMenu(root, { onValueChange });
  });

  afterEach(() => {
    menu.destroy();
    document.body.innerHTML = "";
  });

  it("keeps the panel open when the press comes soon after hover opened it", async () => {
    await userEvent.hover(page.getByTestId("products"));
    await wait(120);
    expect(menu.getValue()).toBe("products");

    await userEvent.click(page.getByTestId("products"));
    await wait(120);

    expect(menu.getValue()).toBe("products");
    expect(reasons()).toEqual([["products", "trigger-hover"]]);
  });

  it("closes on a second press after the first press kept the panel open", async () => {
    await userEvent.hover(page.getByTestId("products"));
    await wait(120);

    await userEvent.click(page.getByTestId("products"));
    await userEvent.click(page.getByTestId("products"));
    await wait(120);

    expect(menu.getValue()).toBe(null);
    expect(reasons()).toEqual([
      ["products", "trigger-hover"],
      [null, "trigger-press"],
    ]);
  });

  it("closes when the press comes later", async () => {
    await userEvent.hover(page.getByTestId("products"));
    await wait(700);
    expect(menu.getValue()).toBe("products");

    await userEvent.click(page.getByTestId("products"));
    await wait(120);

    expect(menu.getValue()).toBe(null);
    expect(reasons()).toEqual([
      ["products", "trigger-hover"],
      [null, "trigger-press"],
    ]);
  });

  it("keeps the next panel open when hover moves to another trigger and presses it", async () => {
    await userEvent.hover(page.getByTestId("products"));
    await wait(700);

    await userEvent.hover(page.getByTestId("company"));
    await wait(40);
    expect(menu.getValue()).toBe("company");

    await userEvent.click(page.getByTestId("company"));
    await wait(120);

    expect(menu.getValue()).toBe("company");
  });
});
