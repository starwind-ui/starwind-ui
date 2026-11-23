import assert from "node:assert/strict";

import type { Locator, Page } from "playwright";
import type { DirectionAssertionContext } from "../../assertion-receipts.js";
import type { DirectionExpectation } from "../../inventory.js";
import { cases } from "./raw.js";

type Instance = "factory" | "automatic";

function root(page: Page, instance: Instance, selector: string): Locator {
  return page.locator(`[data-raw-instance="${instance}"] ${selector}`);
}

async function exerciseFamily(
  page: Page,
  family: string,
  instance: Instance,
  ctx: DirectionAssertionContext,
): Promise<unknown> {
  switch (family) {
    case "radio": {
      const radio = root(page, instance, "[data-sw-radio]");
      const before = await radio.getAttribute("aria-checked");
      await radio.click();
      const after = await radio.getAttribute("aria-checked");
      assert.equal(before, "false");
      assert.equal(after, "true");
      return { before, after };
    }
    case "radio-group": {
      const group = root(page, instance, "[data-sw-radio-group]");
      const radios = root(page, instance, "[data-sw-radio-group] [data-sw-radio]");
      const entries = await Promise.all(
        [0, 1, 2].map(async (index) => ({
          radio: radios.nth(index),
          value: await radios.nth(index).getAttribute("data-value"),
          disabled: await radios.nth(index).isDisabled(),
          dataDisabled: await radios.nth(index).getAttribute("data-disabled"),
          box: await radios.nth(index).boundingBox(),
        })),
      );
      const enabled = entries
        .filter((entry) => !entry.disabled)
        .sort((left, right) => left.box!.x - right.box!.x);
      const start = enabled[0]!;
      const destination = enabled[1]!;
      const disabled = entries.find((entry) => entry.value === "gamma")!;
      const startValue = await start.radio.getAttribute("data-value");
      const expectedValue = await destination.radio.getAttribute("data-value");
      await start.radio.click();
      const selectedBefore = await group.getAttribute("data-value");
      await start.radio.focus();
      await page.keyboard.press("ArrowRight");
      const active = page.locator(":focus");
      const actualValue = await active.getAttribute("data-value");
      const actualX = (await active.boundingBox())?.x ?? null;
      const startX = start.box?.x ?? null;
      const expectedX = destination.box?.x ?? null;
      const result = {
        direction: await group.evaluate((element) => getComputedStyle(element).direction),
        orientation: await group.getAttribute("data-orientation"),
        startValue,
        expectedValue,
        selectedBefore,
        disabledItem: {
          value: disabled.value,
          disabled: disabled.disabled,
          dataDisabled: disabled.dataDisabled,
          x: disabled.box?.x ?? null,
        },
        actualValue,
        groupValue: await group.getAttribute("data-value"),
        startX,
        expectedX,
        actualX,
      };
      ctx.observe(`${instance}RadioGroupArrowRight`, result);
      assert.equal(result.direction, "rtl");
      assert.equal(result.orientation, "horizontal");
      assert.equal(
        selectedBefore,
        startValue,
        "click selects the chosen Radio before keyboard movement",
      );
      assert.equal(
        disabled.disabled,
        true,
        "the data-disabled radio also disables its native input",
      );
      assert.equal(disabled.dataDisabled !== null, true);
      assert(
        disabled.box &&
          start.box &&
          destination.box &&
          disabled.box.x > start.box.x &&
          disabled.box.x < destination.box.x,
        "disabled Gamma sits between the spatial start and destination",
      );
      assert.equal(actualValue, expectedValue);
      assert(actualX !== null && startX !== null && actualX > startX);
      assert.equal(result.groupValue, expectedValue);
      return result;
    }
    case "scroll-area": {
      const viewport = root(page, instance, "[data-sw-scroll-area-viewport]");
      const result = await viewport.evaluate((element: HTMLElement) => {
        element.scrollLeft = -48;
        element.dispatchEvent(new Event("scroll"));
        const scrollbar = element
          .closest("[data-sw-scroll-area]")
          ?.querySelector<HTMLElement>(
            '[data-sw-scroll-area-scrollbar][data-orientation="vertical"]',
          );
        const viewportBounds = element.getBoundingClientRect();
        const scrollbarBounds = scrollbar?.getBoundingClientRect();
        return {
          direction: getComputedStyle(element).direction,
          scrollLeft: element.scrollLeft,
          scrollWidth: element.scrollWidth,
          clientWidth: element.clientWidth,
          viewportX: viewportBounds.x,
          viewportWidth: viewportBounds.width,
          scrollbarX: scrollbarBounds?.x ?? null,
        };
      });
      assert.equal(result.direction, "rtl");
      assert(result.scrollWidth > result.clientWidth);
      assert(result.scrollLeft < 0);
      assert(
        result.scrollbarX !== null &&
          result.scrollbarX <= result.viewportX + result.viewportWidth / 2,
      );
      return result;
    }
    case "select": {
      await root(page, instance, "[data-sw-select-trigger]").click();
      const popup = page.locator("[data-sw-select-popup]:visible").last();
      await popup.waitFor({ state: "visible" });
      const direction = await popup.evaluate((element) => getComputedStyle(element).direction);
      const visible = await popup.isVisible();
      let value: string | null = null;
      try {
        await popup.locator('[data-sw-select-item][data-value="beta"]').click();
        value = await root(page, instance, "[data-sw-select]").getAttribute("data-value");
      } finally {
        await page.keyboard.press("Escape");
      }
      const result = { visible, direction, value };
      ctx.observe(`${instance}PortalDirection`, result);
      assert(visible);
      assert.equal(
        direction,
        "rtl",
        "Select portal direction follows its owner (SPEC-AC-11; ticket 09)",
      );
      assert.equal(value, "beta");
      return result;
    }
    case "drawer": {
      const trigger = root(page, instance, "[data-sw-drawer-trigger]");
      await trigger.click();
      const popupId = await trigger.getAttribute("aria-controls");
      assert(popupId, `${instance} drawer trigger names its popup`);
      const popup = page.locator(`[id="${popupId}"]`);
      await popup.waitFor({ state: "visible" });
      const state = await popup.evaluate((element: HTMLDialogElement) => ({
        open: element.open,
        direction: getComputedStyle(element).direction,
        side: element.getAttribute("data-side"),
      }));
      let openAfterClose: boolean | null = null;
      try {
        await popup.locator("[data-sw-drawer-close]").click();
        const popupHandle = await popup.elementHandle();
        assert(popupHandle, `${instance} drawer popup remains mounted while it closes`);
        await page.waitForFunction((element) => !(element as HTMLDialogElement).open, popupHandle, {
          timeout: 3000,
        });
        openAfterClose = await popup.evaluate((element: HTMLDialogElement) => element.open);
      } finally {
        if (await popup.evaluate((element: HTMLDialogElement) => element.open))
          await page.keyboard.press("Escape");
      }
      const result = { ...state, openAfterClose };
      ctx.observe(`${instance}PortalDirection`, result);
      assert(state.open);
      assert.equal(
        state.direction,
        "rtl",
        "Drawer portal direction follows its owner (SPEC-AC-02; ticket 09)",
      );
      assert.equal(state.side, "left");
      assert.equal(openAfterClose, false);
      return result;
    }
    case "sidebar": {
      const provider = root(page, instance, "[data-sw-sidebar-provider]");
      const sidebar = root(page, instance, "[data-sw-sidebar]");
      await root(page, instance, "[data-sw-sidebar-trigger]").click();
      const state = await sidebar.getAttribute("data-state");
      const side = await sidebar.getAttribute("data-side");
      assert.equal(state, "collapsed");
      assert.equal(side, "right");
      return { providerState: await provider.getAttribute("data-state"), state, side };
    }
    case "slider": {
      const slider = root(page, instance, "[data-sw-slider]");
      const thumb = root(page, instance, "[data-sw-slider-thumb]");
      const direction = await slider.evaluate((element) => getComputedStyle(element).direction);
      await thumb.focus();
      const before = await thumb.getAttribute("aria-valuenow");
      await page.keyboard.press("ArrowRight");
      const after = await thumb.getAttribute("aria-valuenow");
      const value = await slider.getAttribute("data-value");
      const result = { direction, before, after, value };
      ctx.observe(`${instance}SliderArrowRight`, result);
      assert.equal(direction, "rtl");
      assert(
        Number(after) < Number(before),
        "ArrowRight decreases the horizontal RTL slider (SPEC-AC-07; ticket 15)",
      );
      assert.notEqual(after, before);
      assert.notEqual(value, "50");
      return result;
    }
    case "switch": {
      const control = root(page, instance, "[data-sw-switch]");
      const before = await control.getAttribute("aria-checked");
      await control.click();
      const after = await control.getAttribute("aria-checked");
      const value = await root(page, instance, "form").evaluate((form: HTMLFormElement) =>
        new FormData(form).get("raw-updates"),
      );
      assert.equal(before, "false");
      assert.equal(after, "true");
      assert.equal(value, "on");
      return { before, after, value };
    }
    case "tabs": {
      const tabs = root(page, instance, "[data-sw-tabs]");
      const tabItems = root(page, instance, "[data-sw-tabs-tab]");
      const ordered = await Promise.all(
        [0, 1, 2].map(async (index) => ({
          tab: tabItems.nth(index),
          box: await tabItems.nth(index).boundingBox(),
        })),
      );
      const byX = ordered.sort((left, right) => left.box!.x - right.box!.x);
      const start = byX[1]!;
      const destination = byX[2]!;
      const startValue = await start.tab.getAttribute("data-value");
      const expectedValue = await destination.tab.getAttribute("data-value");
      await start.tab.click();
      const selectedBefore = await tabs.getAttribute("data-value");
      await start.tab.focus();
      await page.keyboard.press("ArrowRight");
      const active = page.locator(":focus");
      const activeValue = await active.getAttribute("data-value");
      const activeX = (await active.boundingBox())?.x ?? null;
      const selectedAfterArrow = await tabs.getAttribute("data-value");
      await page.keyboard.press("Enter");
      const selectedAfterEnter = await tabs.getAttribute("data-value");
      const result = {
        direction: await tabs.evaluate((element) => getComputedStyle(element).direction),
        orientation: await tabs.getAttribute("data-orientation"),
        startValue,
        expectedValue,
        activeValue,
        startX: start.box?.x ?? null,
        expectedX: destination.box?.x ?? null,
        activeX,
        selectedBefore,
        selectedAfterArrow,
        selectedAfterEnter,
      };
      ctx.observe(`${instance}TabsArrowRight`, result);
      assert.equal(result.direction, "rtl");
      assert.equal(result.orientation, "horizontal");
      assert.equal(
        selectedBefore,
        startValue,
        "click activates the chosen tab before keyboard movement",
      );
      assert.equal(
        activeValue,
        expectedValue,
        "ArrowRight focuses the physically right tab (SPEC-AC-05; ticket 12)",
      );
      assert(activeX !== null && result.startX !== null && activeX > result.startX);
      assert.equal(selectedAfterArrow, selectedBefore, "manual tabs keep selection until Enter");
      assert.equal(selectedAfterEnter, activeValue);
      return result;
    }
    case "toast": {
      const title = instance === "factory" ? "Factory toast" : "Automatic toast";
      const toast = root(page, instance, "[data-sw-toast-viewport]").getByText(title, {
        exact: true,
      });
      await toast.waitFor({ state: "visible" });
      const visible = await toast.isVisible();
      assert(visible, `${instance} toast manager renders its message`);
      return { title: await toast.textContent(), visible };
    }
    case "toggle": {
      const toggle = root(page, instance, "[data-sw-toggle]");
      const before = await toggle.getAttribute("aria-pressed");
      await toggle.click();
      const after = await toggle.getAttribute("aria-pressed");
      assert.equal(before, "false");
      assert.equal(after, "true");
      return { before, after };
    }
    case "toggle-group": {
      const group = root(page, instance, "[data-sw-toggle-group]");
      const items = root(page, instance, "[data-sw-toggle-group] [data-sw-toggle]");
      const ordered = await Promise.all(
        [0, 1, 2].map(async (index) => ({
          item: items.nth(index),
          box: await items.nth(index).boundingBox(),
        })),
      );
      const byX = ordered.sort((left, right) => left.box!.x - right.box!.x);
      const start = byX[1]!;
      const destination = byX[2]!;
      const startValue = await start.item.getAttribute("data-value");
      const expectedValue = await destination.item.getAttribute("data-value");
      await root(page, instance, '[data-sw-toggle][data-value="start"]').click();
      const selectedByClick = await group.getAttribute("data-value");
      await start.item.click();
      const selectedBefore = await group.getAttribute("data-value");
      await start.item.focus();
      await page.keyboard.press("ArrowRight");
      const active = page.locator(":focus");
      const activeValue = await active.getAttribute("data-value");
      const activeX = (await active.boundingBox())?.x ?? null;
      const selectedAfterArrow = await group.getAttribute("data-value");
      await page.keyboard.press("Space");
      const selectedAfterSpace = await group.getAttribute("data-value");
      const result = {
        direction: await group.evaluate((element) => getComputedStyle(element).direction),
        orientation: await group.getAttribute("data-orientation"),
        startValue,
        expectedValue,
        activeValue,
        selectedByClick,
        startX: start.box?.x ?? null,
        expectedX: destination.box?.x ?? null,
        activeX,
        selectedBefore,
        selectedAfterArrow,
        selectedAfterSpace,
      };
      ctx.observe(`${instance}ToggleGroupArrowRight`, result);
      assert.equal(result.direction, "rtl");
      assert.equal(result.orientation, "horizontal");
      assert.equal(selectedByClick, JSON.stringify(["start"]));
      assert.equal(selectedBefore, JSON.stringify([startValue]));
      assert.equal(
        activeValue,
        expectedValue,
        "ArrowRight focuses the physically right toggle (SPEC-AC-05; ticket 12)",
      );
      assert(activeX !== null && result.startX !== null && activeX > result.startX);
      assert.equal(
        selectedAfterArrow,
        selectedBefore,
        "roving focus alone keeps the selected value",
      );
      assert.equal(selectedAfterSpace, JSON.stringify([activeValue]));
      return result;
    }
    case "tooltip": {
      try {
        await root(page, instance, "[data-sw-tooltip-trigger]").hover();
        const popup = page.locator("[data-sw-tooltip-popup]:visible").last();
        await popup.waitFor({ state: "visible" });
        const result = await popup.evaluate((element) => ({
          direction: getComputedStyle(element).direction,
          side: element.getAttribute("data-side"),
          visible: !element.hasAttribute("hidden"),
        }));
        ctx.observe(`${instance}PortalDirection`, result);
        assert(result.visible);
        assert.equal(
          result.direction,
          "rtl",
          "Tooltip portal direction follows its owner (SPEC-AC-11, also SPEC-AC-03; ticket 09)",
        );
        assert.equal(result.side, "right", "the fixed raw trigger leaves room for right placement");
        return result;
      } finally {
        await page.keyboard.press("Escape");
      }
    }
    case "theme": {
      const control = root(page, instance, "[data-sw-theme-toggle]");
      const before = await control.getAttribute("aria-pressed");
      await control.click();
      const after = await control.getAttribute("aria-pressed");
      const dark = await page
        .locator("html")
        .evaluate((element) => element.classList.contains("dark"));
      ctx.observe(`${instance}ThemeToggle`, { before, after, dark });
      assert.notEqual(after, before);
      assert.equal(
        dark,
        after === "true",
        "theme toggle applies the theme that matches its pressed state",
      );
      return { before, after, dark };
    }
    default:
      throw new Error(`No raw Runtime behavior check for ${family}`);
  }
}

export const expectations: DirectionExpectation[] = cases.map((item) => {
  const family = item.row === "theme" ? "theme" : item.row.replace(/^runtime:/, "");
  return {
    id: item.id,
    layer: family === "theme" ? "theme" : "raw-html",
    async run(page, _target, ctx) {
      page.setDefaultTimeout(3000);
      await ctx.check("factory-behavior", async () => {
        const result = await exerciseFamily(page, family, "factory", ctx);
        ctx.observe("factoryBehavior", result);
      });
      await ctx.check("initStarwind-behavior", async () => {
        const result = await exerciseFamily(page, family, "automatic", ctx);
        ctx.observe("initStarwindBehavior", result);
      });
      await ctx.check("inherited-rtl", async () => {
        const rootSelector =
          family === "theme"
            ? "[data-sw-theme-toggle]"
            : family === "toast"
              ? "[data-sw-toast-viewport]"
              : family === "sidebar"
                ? "[data-sw-sidebar-provider]"
                : `[data-sw-${family}]`;
        const directions = await Promise.all(
          (["factory", "automatic"] as const).map((instance) =>
            root(page, instance, rootSelector).evaluate(
              (element) => getComputedStyle(element).direction,
            ),
          ),
        );
        const sectionDirections = await Promise.all(
          (["factory", "automatic"] as const).map((instance) =>
            page
              .locator(`[data-raw-instance="${instance}"]`)
              .evaluate((element) => getComputedStyle(element).direction),
          ),
        );
        const result = { sectionDirections, controlDirections: directions };
        ctx.observe("inheritedDirections", result);
        assert.deepEqual(sectionDirections, ["rtl", "rtl"]);
        assert(directions.every((direction) => direction === "rtl"));
      });
    },
  };
});
