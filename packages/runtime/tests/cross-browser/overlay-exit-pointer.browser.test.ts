import { beforeEach, describe, expect, it, vi } from "vitest";
import { page, userEvent } from "vitest/browser";

import { createCombobox } from "../../src/components/combobox/combobox";
import { createContextMenu } from "../../src/components/context-menu/context-menu";
import { createDialog } from "../../src/components/dialog/dialog";
import { createMenu } from "../../src/components/menu/menu";
import { createNavigationMenu } from "../../src/components/navigation-menu/navigation-menu";
import { createPopover } from "../../src/components/popover/popover";
import { createPreviewCard } from "../../src/components/preview-card/preview-card";
import { createSelect } from "../../src/components/select/select";
import { createTooltip } from "../../src/components/tooltip/tooltip";

const settle = () => new Promise((resolve) => setTimeout(resolve, 150));
const popupStyle =
  "width:300px;height:150px;background:white;transition:opacity 1000ms linear;opacity:1";

describe("Closing popup pointer input", () => {
  beforeEach(() => {
    document.body.innerHTML = `
      <button data-testid="below" type="button" style="position:fixed;left:0;top:60px;width:400px;height:200px">
        Below
      </button>
      <div data-sw-popover style="position:fixed;left:0;top:0">
        <button data-testid="trigger" data-sw-popover-trigger type="button">Open</button>
        <div
          data-sw-popover-popup
          data-side="bottom"
          data-align="start"
          data-avoid-collisions="false"
          style="width:300px;height:150px;z-index:10;background:white;transition:opacity 1000ms linear"
        >
          <button type="button">Inside</button>
        </div>
      </div>
    `;
  });

  it("sends a press during the exit animation to the element below the popup", async () => {
    const popover = createPopover(document.querySelector<HTMLElement>("[data-sw-popover]")!);
    const popup = document.querySelector<HTMLElement>("[data-sw-popover-popup]")!;
    const below = document.querySelector<HTMLElement>('[data-testid="below"]')!;
    const onBelowClick = vi.fn();
    below.addEventListener("click", onBelowClick);

    try {
      await userEvent.click(page.getByTestId("trigger"));
      await settle();
      expect(popover.getOpen()).toBe(true);

      await userEvent.keyboard("{Escape}");
      expect(popup.hasAttribute("data-ending-style")).toBe(true);
      await userEvent.click(page.getByTestId("below"), {
        force: true,
        position: { x: 100, y: 60 },
      });

      expect(popup.hasAttribute("data-ending-style")).toBe(true);
      expect(onBelowClick).toHaveBeenCalledTimes(1);
      await vi.waitFor(() => expect(popup.hidden).toBe(true), { timeout: 2000 });
    } finally {
      popover.destroy();
    }
  });
  it("returns focus to the trigger when Escape closes the popup with focus inside", async () => {
    const popover = createPopover(document.querySelector<HTMLElement>("[data-sw-popover]")!);
    const popup = document.querySelector<HTMLElement>("[data-sw-popover-popup]")!;
    const trigger = document.querySelector<HTMLElement>('[data-testid="trigger"]')!;

    try {
      await userEvent.click(page.getByTestId("trigger"));
      await settle();
      popup.querySelector<HTMLElement>("button")!.focus();
      expect(popup.contains(document.activeElement)).toBe(true);

      await userEvent.keyboard("{Escape}");
      expect(popup.hasAttribute("data-ending-style")).toBe(true);
      expect(document.activeElement).toBe(trigger);
      await vi.waitFor(() => expect(popup.hidden).toBe(true), { timeout: 2000 });
      expect(document.activeElement).toBe(trigger);
    } finally {
      popover.destroy();
    }
  });

  it("moves Tab from the trigger when Tab follows Escape during the exit", async () => {
    // WebKit on macOS skips buttons on Tab, so the Tab stops are text fields.
    document.body.insertAdjacentHTML("afterbegin", '<input aria-label="Before" />');
    document.body.insertAdjacentHTML(
      "beforeend",
      '<input data-testid="after" aria-label="After" />',
    );
    const popover = createPopover(document.querySelector<HTMLElement>("[data-sw-popover]")!);
    const popup = document.querySelector<HTMLElement>("[data-sw-popover-popup]")!;
    const trigger = document.querySelector<HTMLElement>('[data-testid="trigger"]')!;
    const after = document.querySelector<HTMLElement>('[data-testid="after"]')!;

    try {
      await userEvent.click(page.getByTestId("trigger"));
      await settle();
      popup.querySelector<HTMLElement>("button")!.focus();

      await userEvent.keyboard("{Escape}");
      expect(popup.hasAttribute("data-ending-style")).toBe(true);
      expect(document.activeElement).toBe(trigger);

      await userEvent.keyboard("{Tab}");
      expect(popup.hasAttribute("data-ending-style")).toBe(true);
      expect(document.activeElement).toBe(after);
      await vi.waitFor(() => expect(popup.hidden).toBe(true), { timeout: 2000 });
      expect(document.activeElement).toBe(after);
    } finally {
      popover.destroy();
    }
  });

  it("moves Tab from the trigger when Tab follows Escape during the exit in a modal Dialog", async () => {
    // WebKit on macOS skips buttons on Tab, so the Tab stops are text fields.
    document.body.innerHTML = `
      <div data-sw-dialog>
        <button data-sw-dialog-trigger type="button">Open dialog</button>
        <div data-sw-dialog-overlay hidden></div>
        <dialog data-sw-dialog-content>
          <h2 data-sw-dialog-title>Dialog title</h2>
          <input aria-label="First" />
          <div data-sw-popover>
            <button data-testid="trigger" data-sw-popover-trigger type="button">Open</button>
            <div
              data-sw-popover-popup
              data-side="bottom"
              data-align="start"
              data-avoid-collisions="false"
              style="width:300px;height:150px;background:white;transition:opacity 1000ms linear"
            >
              <button type="button">Inside</button>
            </div>
          </div>
          <input data-testid="after" aria-label="After" />
        </dialog>
      </div>
    `;
    const dialog = createDialog(document.querySelector<HTMLElement>("[data-sw-dialog]")!);
    const popover = createPopover(document.querySelector<HTMLElement>("[data-sw-popover]")!);
    const popup = document.querySelector<HTMLElement>("[data-sw-popover-popup]")!;
    const trigger = document.querySelector<HTMLElement>('[data-testid="trigger"]')!;
    const after = document.querySelector<HTMLElement>('[data-testid="after"]')!;

    try {
      dialog.setOpen(true);
      await settle();
      await userEvent.click(page.getByTestId("trigger"));
      await settle();
      expect(popover.getOpen()).toBe(true);
      popup.querySelector<HTMLElement>("button")!.focus();

      await userEvent.keyboard("{Escape}");
      expect(popup.hasAttribute("data-ending-style")).toBe(true);
      expect(dialog.getOpen()).toBe(true);
      expect(document.activeElement).toBe(trigger);

      await userEvent.keyboard("{Tab}");
      expect(popup.hasAttribute("data-ending-style")).toBe(true);
      expect(document.activeElement).toBe(after);
    } finally {
      popover.destroy();
      dialog.destroy();
    }
  });

  it("returns Navigation Menu focus to the trigger when Escape starts the exit", async () => {
    document.body.innerHTML = `
      <nav data-sw-nav-menu aria-label="Main" data-open-delay="0" data-close-delay="0">
        <ul data-sw-nav-menu-list>
          <li data-sw-nav-menu-item data-value="products">
            <button data-testid="nav-trigger" type="button" data-sw-nav-menu-trigger>Products</button>
            <div data-sw-nav-menu-content style="width:300px;height:150px">
              <a data-sw-nav-menu-link href="#one">One</a>
            </div>
          </li>
        </ul>
        <div data-sw-nav-menu-portal>
          <div data-sw-nav-menu-positioner data-side="bottom" data-align="start">
            <div data-sw-nav-menu-popup style="${popupStyle}">
              <div data-sw-nav-menu-viewport style="transition:opacity 1000ms linear"></div>
            </div>
          </div>
        </div>
      </nav>
    `;
    const menu = createNavigationMenu(document.querySelector<HTMLElement>("[data-sw-nav-menu]")!);
    const popup = document.querySelector<HTMLElement>("[data-sw-nav-menu-popup]")!;
    const trigger = document.querySelector<HTMLElement>('[data-testid="nav-trigger"]')!;

    try {
      menu.setValue("products");
      await settle();
      const link = popup.querySelector<HTMLElement>("[data-sw-nav-menu-link]")!;
      link.focus();
      expect(document.activeElement).toBe(link);

      await userEvent.keyboard("{Escape}");
      expect(menu.getValue()).toBe(null);
      expect(popup.hasAttribute("data-ending-style")).toBe(true);
      expect(document.activeElement).toBe(trigger);

      await userEvent.hover(page.getByTestId("nav-trigger"));
      await vi.waitFor(() => expect(menu.getValue()).toBe("products"), { timeout: 2000 });
      await settle();
      expect(document.activeElement).not.toBe(document.body);
      expect(document.activeElement).toBe(trigger);
    } finally {
      menu.destroy();
    }
  });

  it("sends a press to the element below through a descendant with its own pointer-events", async () => {
    document.body.innerHTML = `
      <button data-testid="below" type="button" style="position:fixed;inset:0;width:100vw;height:100vh">
        Below
      </button>
      <div data-sw-popover style="position:fixed;left:0;top:0;z-index:5">
        <button data-testid="trigger" data-sw-popover-trigger type="button">Open</button>
        <div data-sw-popover-positioner data-side="bottom" data-align="start" data-avoid-collisions="false">
          <div data-sw-popover-popup style="${popupStyle}">
            <button data-testid="inside" type="button" style="pointer-events:auto !important;width:100%;height:100%">
              Inside
            </button>
          </div>
        </div>
      </div>
    `;
    const popover = createPopover(document.querySelector<HTMLElement>("[data-sw-popover]")!);
    const popup = document.querySelector<HTMLElement>("[data-sw-popover-popup]")!;
    const inside = document.querySelector<HTMLElement>('[data-testid="inside"]')!;
    const below = document.querySelector<HTMLElement>('[data-testid="below"]')!;
    const onBelowClick = vi.fn();
    const onInsideClick = vi.fn();
    below.addEventListener("click", onBelowClick);
    inside.addEventListener("click", onInsideClick);

    try {
      popover.setOpen(true);
      await settle();
      const rect = inside.getBoundingClientRect();
      const x = Math.round(rect.left + rect.width / 2);
      const y = Math.round(rect.top + rect.height / 2);
      expect(document.elementFromPoint(x, y)).toBe(inside);

      popover.setOpen(false);
      expect(popup.hasAttribute("data-ending-style")).toBe(true);
      await userEvent.click(page.getByTestId("below"), { force: true, position: { x, y } });

      expect(popup.hasAttribute("data-ending-style")).toBe(true);
      expect(onInsideClick).not.toHaveBeenCalled();
      expect(onBelowClick).toHaveBeenCalledTimes(1);
    } finally {
      popover.destroy();
    }
  });
});

describe("Closing popup pointer input with a positioner", () => {
  type Case = {
    name: string;
    markup: string;
    popupSelector: string;
    create: (root: HTMLElement) => { open(): void; close(): void; destroy(): void };
  };

  const cases: Case[] = [
    {
      name: "Select",
      markup: `
        <div data-sw-select>
          <button data-sw-select-trigger type="button"><span data-sw-select-value></span></button>
          <input data-sw-select-input type="hidden" />
          <div data-sw-select-positioner data-avoid-collisions="false">
            <div data-sw-select-popup hidden style="${popupStyle}">
              <div data-sw-select-list>
                <div data-sw-select-item data-value="apple">Apple</div>
              </div>
            </div>
          </div>
        </div>`,
      popupSelector: "[data-sw-select-popup]",
      create: (root) => {
        const select = createSelect(root);
        return {
          open: () => select.setOpen(true),
          close: () => select.setOpen(false),
          destroy: () => select.destroy(),
        };
      },
    },
    {
      name: "Combobox",
      markup: `
        <div data-sw-combobox>
          <input data-sw-combobox-input aria-label="Fruit" />
          <div data-sw-combobox-positioner data-side="bottom" data-align="start" data-avoid-collisions="false" style="position:relative;z-index:10;min-width:300px;min-height:150px">
            <div data-sw-combobox-popup hidden style="${popupStyle}">
              <div data-sw-combobox-list>
                <div data-sw-combobox-item data-value="apple">
                  <span data-sw-combobox-item-text>Apple</span>
                </div>
              </div>
            </div>
          </div>
        </div>`,
      popupSelector: "[data-sw-combobox-popup]",
      create: (root) => {
        const combobox = createCombobox(root);
        return {
          open: () => combobox.setOpen(true),
          close: () => combobox.setOpen(false),
          destroy: () => combobox.destroy(),
        };
      },
    },
    {
      name: "Context Menu",
      markup: `
        <div data-sw-context-menu data-sw-menu data-modal="false">
          <div data-sw-context-menu-trigger data-sw-menu-trigger style="width:40px;height:40px">Area</div>
          <div data-sw-menu-positioner data-side="bottom" data-align="start" data-avoid-collisions="false">
            <div data-sw-menu-popup hidden style="${popupStyle}">
              <div data-sw-menu-item>Account</div>
            </div>
          </div>
        </div>`,
      popupSelector: "[data-sw-menu-popup]",
      create: (root) => {
        const contextMenu = createContextMenu(root);
        return {
          open: () => {
            root.querySelector("[data-sw-context-menu-trigger]")!.dispatchEvent(
              new MouseEvent("contextmenu", {
                bubbles: true,
                cancelable: true,
                clientX: 20,
                clientY: 20,
              }),
            );
          },
          close: () => contextMenu.setOpen(false),
          destroy: () => contextMenu.destroy(),
        };
      },
    },
    {
      name: "Menu",
      markup: `
        <div data-sw-menu>
          <button data-sw-menu-trigger type="button">Open menu</button>
          <div data-sw-menu-positioner data-side="bottom" data-align="start" data-avoid-collisions="false">
            <div data-sw-menu-popup hidden style="${popupStyle}">
              <div data-sw-menu-item>Account</div>
            </div>
          </div>
        </div>`,
      popupSelector: "[data-sw-menu-popup]",
      create: (root) => {
        const menu = createMenu(root);
        return {
          open: () => menu.setOpen(true),
          close: () => menu.setOpen(false),
          destroy: () => menu.destroy(),
        };
      },
    },
    {
      name: "Tooltip",
      markup: `
        <div data-sw-tooltip data-open-delay="0">
          <button data-sw-tooltip-trigger type="button">Show tooltip</button>
          <div data-sw-tooltip-positioner data-side="bottom" data-align="start" data-avoid-collisions="false">
            <div data-sw-tooltip-popup style="${popupStyle}">Tooltip content</div>
          </div>
        </div>`,
      popupSelector: "[data-sw-tooltip-popup]",
      create: (root) => {
        const tooltip = createTooltip(root);
        return {
          open: () => tooltip.setOpen(true),
          close: () => tooltip.setOpen(false),
          destroy: () => tooltip.destroy(),
        };
      },
    },
    {
      name: "Preview Card",
      markup: `
        <div data-sw-preview-card data-open-delay="0">
          <button data-sw-preview-card-trigger type="button">Show preview</button>
          <div data-sw-preview-card-positioner data-side="bottom" data-align="start" data-avoid-collisions="false">
            <div data-sw-preview-card-popup style="${popupStyle}">Preview content</div>
          </div>
        </div>`,
      popupSelector: "[data-sw-preview-card-popup]",
      create: (root) => {
        const previewCard = createPreviewCard(root);
        return {
          open: () => previewCard.setOpen(true),
          close: () => previewCard.setOpen(false),
          destroy: () => previewCard.destroy(),
        };
      },
    },
    {
      name: "Navigation Menu",
      markup: `
        <nav data-sw-nav-menu aria-label="Main">
          <ul data-sw-nav-menu-list>
            <li data-sw-nav-menu-item data-value="products">
              <button type="button" data-sw-nav-menu-trigger>Products</button>
              <div data-sw-nav-menu-content style="width:300px;height:150px">Products content</div>
            </li>
          </ul>
          <div data-sw-nav-menu-portal>
            <div data-sw-nav-menu-positioner data-side="bottom" data-align="start">
              <div data-sw-nav-menu-popup style="${popupStyle}">
                <div data-sw-nav-menu-viewport style="transition:opacity 1000ms linear"></div>
              </div>
            </div>
          </div>
        </nav>`,
      popupSelector: "[data-sw-nav-menu-popup]",
      create: (root) => {
        const menu = createNavigationMenu(root);
        return {
          open: () => menu.setValue("products"),
          close: () => menu.setValue(null),
          destroy: () => menu.destroy(),
        };
      },
    },
  ];

  for (const { name, markup, popupSelector, create } of cases) {
    it(`sends a press during the ${name} exit animation to the element below`, async () => {
      document.body.innerHTML = `
        <button data-testid="below" type="button" style="position:fixed;inset:0;width:100vw;height:100vh">
          Below
        </button>
        <div style="position:fixed;left:0;top:0;z-index:5">${markup}</div>
      `;
      const below = document.querySelector<HTMLElement>('[data-testid="below"]')!;
      const onBelowClick = vi.fn();
      below.addEventListener("click", onBelowClick);
      const controller = create(document.querySelector<HTMLElement>("body > div > *")!);

      try {
        controller.open();
        await settle();
        const popup = document.querySelector<HTMLElement>(popupSelector)!;
        expect(popup.hidden).toBe(false);
        const rect = popup.getBoundingClientRect();
        expect(rect.width).toBeGreaterThan(0);
        const x = Math.round(rect.left + rect.width / 2);
        const y = Math.round(rect.top + rect.height / 2);
        const openHit = document.elementFromPoint(x, y);
        expect(openHit === popup || popup.contains(openHit)).toBe(true);

        controller.close();
        expect(popup.hasAttribute("data-ending-style")).toBe(true);
        await userEvent.click(page.getByTestId("below"), { force: true, position: { x, y } });

        expect(popup.hasAttribute("data-ending-style")).toBe(true);
        expect(onBelowClick).toHaveBeenCalledTimes(1);
      } finally {
        controller.destroy();
      }
    });
  }
});

describe("Closing submenu pointer input", () => {
  it("sends a press during the submenu exit animation to the parent item below", async () => {
    document.body.innerHTML = `
      <div data-sw-menu style="position:fixed;left:0;top:0">
        <button data-sw-menu-trigger type="button">Open menu</button>
        <div data-sw-menu-positioner data-side="bottom" data-align="start" data-avoid-collisions="false">
          <div data-sw-menu-popup hidden style="width:400px;background:white">
            <div data-sw-menu-submenu-root>
              <div data-sw-menu-submenu-trigger style="height:30px">More tools</div>
              <div data-sw-menu-positioner data-side="bottom" data-align="start" data-avoid-collisions="false">
                <div data-sw-menu-popup hidden style="${popupStyle};z-index:10">
                  <div data-sw-menu-item>Invite team</div>
                </div>
              </div>
            </div>
            <div data-sw-menu-item data-testid="parent-item" style="height:300px">Parent item</div>
          </div>
        </div>
      </div>
    `;
    const root = document.querySelector<HTMLElement>("[data-sw-menu]")!;
    const submenuTrigger = root.querySelector<HTMLElement>("[data-sw-menu-submenu-trigger]")!;
    const submenuRoot = root.querySelector<HTMLElement>("[data-sw-menu-submenu-root]")!;
    const submenuPopup = submenuRoot.querySelector<HTMLElement>("[data-sw-menu-popup]")!;
    const parentItem = root.querySelector<HTMLElement>('[data-testid="parent-item"]')!;
    const onParentItemClick = vi.fn();
    parentItem.addEventListener("click", onParentItemClick);
    const menu = createMenu(root);

    try {
      menu.setOpen(true);
      await settle();
      submenuTrigger.click();
      await settle();
      expect(submenuTrigger.getAttribute("aria-expanded")).toBe("true");
      const rect = submenuPopup.getBoundingClientRect();
      const x = Math.round(rect.left + rect.width / 2);
      const y = Math.round(rect.top + rect.height / 2);
      const openHit = document.elementFromPoint(x, y);
      expect(openHit === submenuPopup || submenuPopup.contains(openHit)).toBe(true);
      expect(parentItem.getBoundingClientRect().bottom).toBeGreaterThan(y);

      submenuPopup.querySelector<HTMLElement>("[data-sw-menu-item]")!.focus();
      await userEvent.keyboard("{Escape}");
      expect(submenuTrigger.getAttribute("aria-expanded")).toBe("false");
      expect(menu.getOpen()).toBe(true);
      expect(submenuPopup.hasAttribute("data-ending-style")).toBe(true);

      await userEvent.click(page.getByTestId("parent-item"), {
        force: true,
        position: {
          x: x - Math.round(parentItem.getBoundingClientRect().left),
          y: y - Math.round(parentItem.getBoundingClientRect().top),
        },
      });

      expect(submenuPopup.hasAttribute("data-ending-style")).toBe(true);
      expect(onParentItemClick).toHaveBeenCalledTimes(1);
    } finally {
      menu.destroy();
    }
  });
});
