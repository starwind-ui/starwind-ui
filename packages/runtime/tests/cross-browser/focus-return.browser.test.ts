import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { userEvent } from "vitest/browser";

import { createDialog } from "../../src/components/dialog/dialog";
import { createMenu } from "../../src/components/menu/menu";
import { createNavigationMenu } from "../../src/components/navigation-menu/navigation-menu";
import { createPopover } from "../../src/components/popover/popover";
import { createSelect } from "../../src/components/select/select";

const CLOSE_MS = 200;

const closeAnimation = `
  <style>
    @keyframes test-close { from { opacity: 1; } to { opacity: 0; } }
    [data-state="closed"]:is([data-sw-popover-popup], [data-sw-nav-menu-popup], dialog) {
      animation: test-close ${CLOSE_MS}ms linear;
    }
  </style>
`;

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

async function afterClose(): Promise<void> {
  const surface = getElement(
    "[data-sw-popover-popup], [data-sw-nav-menu-popup], [data-sw-dialog-content]",
  );
  await vi.waitFor(
    () => {
      const closed = surface instanceof HTMLDialogElement ? !surface.open : surface.hidden;
      expect(closed).toBe(true);
    },
    { timeout: 3000 },
  );
  await wait(50);
}

function outsideInput(): HTMLInputElement {
  const input = document.createElement("input");
  input.setAttribute("aria-label", "Outside");
  document.body.append(input);
  return input;
}

function getElement<T extends HTMLElement>(selector: string): T {
  return document.querySelector<T>(selector)!;
}

describe("focus return after a close", () => {
  beforeEach(() => {
    document.body.innerHTML = closeAnimation;
  });

  afterEach(() => {
    document.body.innerHTML = "";
  });

  describe("Popover", () => {
    function setup() {
      document.body.insertAdjacentHTML(
        "beforeend",
        `<div data-sw-popover>
           <button data-sw-popover-trigger>Open</button>
           <div data-sw-popover-positioner>
             <div data-sw-popover-popup hidden><button data-sw-popover-close>Close</button></div>
           </div>
         </div>`,
      );
      const popover = createPopover(getElement("[data-sw-popover]"));
      return { popover, trigger: getElement<HTMLButtonElement>("[data-sw-popover-trigger]") };
    }

    it("returns focus to the trigger when focus is still in the popup", async () => {
      const { trigger } = setup();
      await userEvent.click(trigger);
      await wait(50);
      expect(getElement("[data-sw-popover-popup]").contains(document.activeElement)).toBe(true);

      await userEvent.keyboard("{Escape}");
      await afterClose();

      expect(document.activeElement).toBe(trigger);
    });

    it("returns focus to the trigger when focus fell to the document", async () => {
      const { trigger } = setup();
      await userEvent.click(trigger);
      await wait(50);

      await userEvent.keyboard("{Escape}");
      (document.activeElement as HTMLElement).blur();
      await afterClose();

      expect(document.activeElement).toBe(trigger);
    });

    it("leaves focus on a control the user moved to during the close", async () => {
      const { trigger } = setup();
      const outside = outsideInput();
      await userEvent.click(trigger);
      await wait(50);

      await userEvent.keyboard("{Escape}");
      outside.focus();
      await afterClose();

      expect(document.activeElement).toBe(outside);
    });

    it("leaves focus on an outside control the press moved it to", async () => {
      const { trigger } = setup();
      const outside = outsideInput();
      await userEvent.click(trigger);
      await wait(50);

      await userEvent.click(outside);
      await afterClose();

      expect(document.activeElement).toBe(outside);
    });
  });

  describe("Navigation Menu", () => {
    function setup() {
      document.body.insertAdjacentHTML(
        "beforeend",
        `<nav data-sw-nav-menu aria-label="Main">
           <ul data-sw-nav-menu-list>
             <li data-sw-nav-menu-item data-value="one">
               <button type="button" data-sw-nav-menu-trigger>One</button>
               <div data-sw-nav-menu-content><a href="#one">Link</a></div>
             </li>
           </ul>
           <div data-sw-nav-menu-portal>
             <div data-sw-nav-menu-positioner>
               <div data-sw-nav-menu-popup hidden><div data-sw-nav-menu-viewport></div></div>
             </div>
           </div>
         </nav>`,
      );
      const menu = createNavigationMenu(getElement("[data-sw-nav-menu]"));
      return { menu, trigger: getElement<HTMLButtonElement>("[data-sw-nav-menu-trigger]") };
    }

    it("returns focus to the trigger when focus is still in the menu", async () => {
      const { trigger } = setup();
      await userEvent.click(trigger);
      await wait(50);

      getElement("[data-sw-nav-menu-popup] a, [data-sw-nav-menu-content] a").focus();
      await userEvent.keyboard("{Escape}");
      await afterClose();

      expect(document.activeElement).toBe(trigger);
    });

    it("leaves focus on a control the user moved to during the close", async () => {
      const { trigger } = setup();
      const outside = outsideInput();
      await userEvent.click(trigger);
      await wait(50);

      await userEvent.keyboard("{Escape}");
      outside.focus();
      await afterClose();

      expect(document.activeElement).toBe(outside);
    });
  });

  describe("Dialog", () => {
    function setup(modal: boolean) {
      document.body.insertAdjacentHTML(
        "beforeend",
        `<div data-sw-dialog data-modal="${String(modal)}">
           <button data-sw-dialog-trigger>Open</button>
           <dialog data-sw-dialog-content>
             <h2 data-sw-dialog-title>Title</h2>
             <button data-sw-dialog-close>Close</button>
           </dialog>
         </div>`,
      );
      const dialog = createDialog(getElement("[data-sw-dialog]"));
      return { dialog, trigger: getElement<HTMLButtonElement>("[data-sw-dialog-trigger]") };
    }

    it("returns focus to the trigger after a modal close", async () => {
      const { dialog, trigger } = setup(true);
      trigger.focus();
      dialog.setOpen(true);
      await wait(50);

      dialog.setOpen(false);
      await afterClose();

      expect(document.activeElement).toBe(trigger);
    });

    it("leaves focus on a control the user moved to during a non-modal close", async () => {
      const { dialog, trigger } = setup(false);
      const outside = outsideInput();
      trigger.focus();
      dialog.setOpen(true);
      await wait(50);

      dialog.setOpen(false);
      outside.focus();
      await afterClose();

      expect(document.activeElement).toBe(outside);
    });
  });

  describe("Select and Menu", () => {
    it("Select returns focus to the trigger when focus is still in the popup", async () => {
      document.body.insertAdjacentHTML(
        "beforeend",
        `<div data-sw-select>
           <button data-sw-select-trigger type="button"><span data-sw-select-value></span></button>
           <input data-sw-select-input type="hidden" />
           <div data-sw-select-positioner>
             <div data-sw-select-popup hidden>
               <div data-sw-select-list><div data-sw-select-item data-value="a">A</div></div>
             </div>
           </div>
         </div>`,
      );
      const trigger = getElement<HTMLButtonElement>("[data-sw-select-trigger]");
      createSelect(getElement("[data-sw-select]"));
      await userEvent.click(trigger);
      await wait(50);

      await userEvent.keyboard("{Escape}");
      await wait(50);

      expect(document.activeElement).toBe(trigger);
    });

    it("Menu returns focus to the trigger when focus is still in the popup", async () => {
      document.body.insertAdjacentHTML(
        "beforeend",
        `<div data-sw-menu>
           <button data-sw-menu-trigger type="button">Open</button>
           <div data-sw-menu-popup data-side="bottom" data-align="start">
             <div data-sw-menu-item>A</div>
           </div>
         </div>`,
      );
      const trigger = getElement<HTMLButtonElement>("[data-sw-menu-trigger]");
      createMenu(getElement("[data-sw-menu]"));
      await userEvent.click(trigger);
      await wait(50);

      await userEvent.keyboard("{Escape}");
      await wait(50);

      expect(document.activeElement).toBe(trigger);
    });
  });
});
