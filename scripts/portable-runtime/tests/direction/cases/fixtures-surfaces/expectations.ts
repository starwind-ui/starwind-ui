import assert from "node:assert/strict";

import type { DirectionAssertionContext } from "../../assertion-receipts.js";
import type { DirectionExpectation } from "../../inventory.js";
import { settleAnimations, waitHidden } from "../../waits.js";
import { definitions, verifyCommon } from "./surfaces.js";

type Page = Parameters<DirectionExpectation["run"]>[0];
type SurfaceCheck = (page: Page, ctx: DirectionAssertionContext) => Promise<void>;

async function openSelect(page: Page) {
  const scope = page.locator('[data-direction-scope="rtl-in-ltr"]');
  await scope.getByRole("combobox").click();
  const content = page.locator('[data-slot="select-content"]:visible').last();
  await content.waitFor({ state: "visible" });
  return { scope, content };
}

async function closeSelect(page: Page) {
  await page.keyboard.press("Escape");
  await waitHidden(page.locator('[data-slot="select-content"]:visible'), 3000);
}

async function openSheet(page: Page, side: string) {
  const scope = page.locator('[data-direction-scope="rtl-in-ltr"]');
  const trigger = scope.getByRole("button", { name: `Open ${side} sheet` });
  await trigger.focus();
  await page.keyboard.press("Enter");
  const content = page.locator(`[data-slot="sheet-content"][data-side="${side}"]:visible`).last();
  await content.waitFor({ state: "visible" });
  return { trigger, content };
}

async function closeSheet(content: import("playwright").Locator) {
  await settleAnimations(content);
  await content.locator('[data-slot="sheet-close"]').first().click();
  await waitHidden(content, 3000);
}

const behavior: Record<string, SurfaceCheck> = {
  "radio-group": async (page, ctx) => {
    await ctx.check("radio-spatial-right", async () => {
      const results = [];
      for (const scopeName of ["ordinary-ltr", "ordinary-rtl", "rtl-in-ltr"] as const) {
        const scope = page.locator(`[data-direction-scope="${scopeName}"]`);
        const radios = scope.getByRole("radio");
        const group = scope.locator('[data-slot="radio-group"]');
        const entries = await Promise.all(
          [0, 1, 2].map(async (index) => ({
            radio: radios.nth(index),
            disabled: await radios.nth(index).isDisabled(),
            box: await radios.nth(index).boundingBox(),
          })),
        );
        const enabled = entries
          .filter((entry) => !entry.disabled)
          .sort((left, right) => left.box!.x - right.box!.x);
        const start = enabled[0]!;
        const next = enabled[1]!;
        const startValue = await start.radio.getAttribute("data-value");
        await scope.locator(`[role="radio"][data-value="${startValue}"]`).click();
        const groupState = await group.evaluate((element) => ({
          computedDirection: getComputedStyle(element).direction,
          nearestDir: element.closest<HTMLElement>("[dir]")?.getAttribute("dir") ?? null,
          orientation: element.getAttribute("data-orientation"),
          selectedValue: element.getAttribute("data-value"),
        }));
        await group.evaluate((element) => {
          const target = element as HTMLElement & {
            __directionChangeEvents?: Array<{
              cancelable: boolean;
              defaultPrevented: boolean;
              value?: string;
            }>;
            __directionChangeListener?: (event: Event) => void;
            __directionKeyEvents?: Array<{
              key: string;
              targetValue: string | null;
              defaultPrevented: boolean;
            }>;
            __directionKeyListener?: (event: Event) => void;
          };
          target.__directionChangeEvents = [];
          target.__directionKeyEvents = [];
          target.__directionChangeListener = (event: Event) => {
            const detail = (event as CustomEvent<{ value?: string }>).detail;
            target.__directionChangeEvents?.push({
              cancelable: event.cancelable,
              defaultPrevented: event.defaultPrevented,
              value: detail?.value,
            });
          };
          target.__directionKeyListener = (event: Event) => {
            const source = event.target;
            target.__directionKeyEvents?.push({
              key: event instanceof KeyboardEvent ? event.key : "",
              targetValue: source instanceof HTMLElement ? source.getAttribute("data-value") : null,
              defaultPrevented: event.defaultPrevented,
            });
          };
          target.addEventListener("starwind:value-change", target.__directionChangeListener);
          target.addEventListener("keydown", target.__directionKeyListener);
        });
        try {
          const expectedValue = await next.radio.getAttribute("data-value");
          await start.radio.focus();
          await page.keyboard.press("ArrowRight");
          const active = page.locator(":focus");
          const actualX = (await active.boundingBox())?.x ?? null;
          const actualValue = await active.getAttribute("data-value");
          const groupValue = await group.getAttribute("data-value");
          const changeEvents = await group.evaluate((element) => {
            const target = element as HTMLElement & {
              __directionChangeEvents?: Array<{
                cancelable: boolean;
                defaultPrevented: boolean;
                value?: string;
              }>;
            };
            return target.__directionChangeEvents ?? [];
          });
          const keyEvents = await group.evaluate((element) => {
            const target = element as HTMLElement & {
              __directionKeyEvents?: Array<{
                key: string;
                targetValue: string | null;
                defaultPrevented: boolean;
              }>;
            };
            return target.__directionKeyEvents ?? [];
          });
          const activeBelongsToGroup = await active.evaluate((element) =>
            Boolean(element.closest('[data-slot="radio-group"]')),
          );
          const expectedX = (await next.radio.boundingBox())?.x ?? null;
          results.push({
            scopeName,
            groupState,
            startValue,
            expectedValue,
            actualValue,
            groupValue,
            changeEvents,
            keyEvents,
            activeBelongsToGroup,
            startX: start.box?.x ?? null,
            actualX,
            expectedX,
            movedRight: actualX !== null && start.box !== null && actualX > start.box.x,
          });
        } finally {
          await group.evaluate((element) => {
            const target = element as HTMLElement & {
              __directionChangeListener?: (event: Event) => void;
              __directionKeyListener?: (event: Event) => void;
            };
            if (target.__directionChangeListener) {
              target.removeEventListener("starwind:value-change", target.__directionChangeListener);
              delete target.__directionChangeListener;
            }
            if (target.__directionKeyListener) {
              target.removeEventListener("keydown", target.__directionKeyListener);
              delete target.__directionKeyListener;
            }
          });
          await scope.locator('[role="radio"][data-value="beta"]').click();
        }
      }
      ctx.observe("radioArrowRightByScope", results);
      assert(
        results.every((result) => result.movedRight),
        `ArrowRight must focus the next enabled item at larger x (SPEC-AC-05; ticket 12): ${JSON.stringify(results)}`,
      );
    });
    await ctx.check("radio-form-value", async () => {
      const scopes = page.locator("[data-direction-scope]");
      const values = [];
      for (let index = 0; index < (await scopes.count()); index++) {
        const scope = scopes.nth(index);
        const value = await scope
          .locator("form")
          .evaluate((form: HTMLFormElement) => new FormData(form).get("surface-choice"));
        values.push(value);
      }
      ctx.observe("radioFormValues", values);
      assert(values.every((value) => value === "beta"));
    });
    await ctx.check("radio-disabled-skip", async () => {
      const scope = page.locator('[data-direction-scope="ordinary-ltr"]');
      const radios = scope.getByRole("radio");
      await scope.locator('[role="radio"][data-value="beta"]').click();
      await radios.nth(1).focus();
      await page.keyboard.press("ArrowRight");
      const active = page.locator(":focus");
      const value = await active.getAttribute("data-value");
      const disabled = await active.isDisabled();
      ctx.observe("radioDisabledSkip", { value, disabled });
      assert.equal(disabled, false);
      assert.equal(value, "alpha", "ArrowRight skips disabled Gamma and wraps to Alpha");
      await scope.locator('[role="radio"][data-value="beta"]').click();
    });
    await ctx.check("radio-home-end", async () => {
      const scope = page.locator('[data-direction-scope="ordinary-ltr"]');
      const radios = scope.getByRole("radio");
      await scope.locator('[role="radio"][data-value="beta"]').click();
      try {
        await radios.nth(1).focus();
        await page.keyboard.press("Home");
        const home = await page.locator(":focus").getAttribute("data-value");
        await page.keyboard.press("End");
        const end = await page.locator(":focus").getAttribute("data-value");
        ctx.observe("radioHomeEnd", { home, end });
        assert.equal(home, "alpha");
        assert.equal(end, "beta");
      } finally {
        await scope.locator('[role="radio"][data-value="beta"]').click();
      }
    });
  },
  "scroll-area": async (page, ctx) => {
    const scope = page.locator('[data-direction-scope="ordinary-rtl"]');
    const viewport = scope.locator("[data-sw-scroll-area-viewport]");
    await ctx.check("scroll-native-rtl", async () => {
      const result = await viewport.evaluate((element: HTMLElement) => {
        element.scrollLeft = -96;
        element.dispatchEvent(new Event("scroll"));
        return {
          clientWidth: element.clientWidth,
          scrollWidth: element.scrollWidth,
          scrollLeft: element.scrollLeft,
        };
      });
      ctx.observe("scrollNativeRtl", result);
      assert(result.scrollWidth > result.clientWidth);
      assert(result.scrollLeft <= 0, "RTL native scrollLeft keeps physical negative coordinates");
    });
    await ctx.check("scrollbar-geometry", async () => {
      await viewport.hover();
      const vertical = scope
        .locator('[data-slot="scroll-area-scrollbar"][data-orientation="vertical"]')
        .filter({ visible: true })
        .last();
      const horizontal = scope
        .locator('[data-slot="scroll-area-scrollbar"][data-orientation="horizontal"]')
        .filter({ visible: true })
        .last();
      const thumb = horizontal.locator('[data-slot="scroll-area-thumb"]').last();
      const rail = await vertical.boundingBox();
      const track = await horizontal.boundingBox();
      const thumbBox = await thumb.boundingBox();
      const view = await viewport.boundingBox();
      const observation = {
        railX: rail?.x ?? null,
        viewX: view?.x ?? null,
        viewWidth: view?.width ?? null,
        trackX: track?.x ?? null,
        trackWidth: track?.width ?? null,
        thumbX: thumbBox?.x ?? null,
        thumbWidth: thumbBox?.width ?? null,
      };
      ctx.observe("scrollbarGeometry", observation);
      assert(
        rail && view && rail.x <= view.x + view.width / 2,
        `RTL vertical scrollbar should sit at inline end (SPEC-AC-02; ticket 25): ${JSON.stringify(observation)}`,
      );
      assert(
        track &&
          thumbBox &&
          thumbBox.width > 0 &&
          thumbBox.x >= track.x - 1 &&
          thumbBox.x + thumbBox.width <= track.x + track.width + 1,
      );
    });
    await ctx.check("scroll-direction-scopes", async () => {
      const rtl = await page
        .locator('[data-direction-scope="ordinary-rtl"] [data-sw-scroll-area-viewport]')
        .evaluate((element) => getComputedStyle(element).direction);
      const ltr = await page
        .locator('[data-direction-scope="deep-ltr"] [data-sw-scroll-area-viewport]')
        .evaluate((element) => getComputedStyle(element).direction);
      ctx.observe("scrollViewportDirections", { rtl, ltr });
      assert.equal(rtl, "rtl");
      assert.equal(ltr, "ltr");
    });
  },
  select: async (page, ctx) => {
    await ctx.check("select-portal-direction", async () => {
      const { content } = await openSelect(page);
      const actual = await content.evaluate((element) => getComputedStyle(element).direction);
      ctx.observe("selectPortalDirection", actual);
      try {
        assert.equal(
          actual,
          "rtl",
          "Select portal inherits its nested owner direction (SPEC-AC-11; ticket 09)",
        );
      } finally {
        await closeSelect(page);
      }
    });
    await ctx.check("select-item-alignment", async () => {
      const { content } = await openSelect(page);
      const edges = await Promise.all(
        ["alpha", "beta", "gamma"].map(async (value) => {
          const option = content.locator('[data-sw-select-item][data-value="' + value + '"]');
          assert.equal(await option.count(), 1);
          return option
            .locator('[data-slot="select-item-text"]')
            .first()
            .evaluate((text) => {
              const box = text.getBoundingClientRect();
              const dir = getComputedStyle(text).direction;
              return { dir, start: dir === "rtl" ? box.right : box.left };
            });
        }),
      );
      const [alpha, beta, gamma] = edges;
      assert(alpha && beta && gamma);
      const rightEdges = edges.map((e) => e.start);
      const diff = Math.abs(alpha.start - gamma.start);
      const inset = alpha.dir === "rtl" ? alpha.start - beta.start : beta.start - alpha.start;
      ctx.observe("selectItemRightEdges", { rightEdges, diff, inset });
      try {
        assert.equal(alpha.dir, "rtl");
        assert.equal(beta.dir, alpha.dir);
        assert.equal(gamma.dir, alpha.dir);
        assert(diff <= 1, "Matching unindented item text edges: " + rightEdges.join(","));
        assert(Math.abs(inset - 24) <= 1, "Inset option's extra reading-edge padding: " + inset);
      } finally {
        await closeSelect(page);
      }
    });
    await ctx.check("select-keyboard-selection", async () => {
      const { content } = await openSelect(page);
      try {
        const contentHandle = await content.elementHandle();
        assert(contentHandle, "Select content remains mounted for typeahead");
        await content.evaluate(
          () =>
            new Promise<void>((resolve) => {
              requestAnimationFrame(() => requestAnimationFrame(() => resolve()));
            }),
        );
        await page.waitForFunction(
          (element) =>
            element.getAttribute("data-state") === "open" &&
            element.closest("[data-sw-select-portal]")?.getAttribute("data-placement") === "ready",
          contentHandle,
          { timeout: 1000 },
        );
        await content.focus();
        await page.waitForFunction((element) => document.activeElement === element, contentHandle, {
          timeout: 1000,
        });
        ctx.observe("selectTypeaheadFocusedContent", true);
        await page.keyboard.press("g");
        const gamma = content.locator(
          '[data-sw-select-item][data-value="gamma"][data-highlighted]',
        );
        const initiallyHighlighted = await content
          .locator("[data-sw-select-item][data-highlighted]")
          .last()
          .getAttribute("data-value");
        ctx.observe("selectTypeaheadInitialHighlight", initiallyHighlighted);
        await gamma.waitFor({ state: "visible", timeout: 1000 });
        const activeItem = content.locator("[data-sw-select-item][data-highlighted]").last();
        const active = await activeItem.getAttribute("data-value");
        await page.keyboard.press("Enter");
        await page.waitForFunction(
          () =>
            document
              .querySelector('[data-direction-scope="rtl-in-ltr"] [data-slot="select"]')
              ?.getAttribute("data-value") === "gamma",
          null,
          { timeout: 1000 },
        );
        const selected = await page
          .locator('[data-direction-scope="rtl-in-ltr"] [data-slot="select"]')
          .getAttribute("data-value");
        ctx.observe("selectTypeaheadValue", { active, selected });
        assert.equal(active, "gamma");
        assert.equal(
          selected,
          "gamma",
          "Typeahead selection commits the highlighted option (SPEC-AC-09; ticket 19)",
        );
      } finally {
        await closeSelect(page);
      }
    });
    await ctx.check("select-form-reset", async () => {
      const { scope, content } = await openSelect(page);
      await content.locator('[data-slot="select-item"][data-value="alpha"]').click();
      const selected = await scope
        .locator("form")
        .evaluate((form: HTMLFormElement) => new FormData(form).get("surface-project"));
      await scope.getByRole("button", { name: "Reset project" }).click();
      await page.waitForTimeout(50);
      const resetValue = await scope
        .locator("form")
        .evaluate((form: HTMLFormElement) => new FormData(form).get("surface-project"));
      ctx.observe("selectFormReset", { selected, resetValue });
      assert.equal(selected, "alpha");
      assert.equal(resetValue, "beta");
    });
  },
  separator: async (page, ctx) => {
    await ctx.check("separator-axis", async () => {
      const scope = page.locator('[data-direction-scope="ordinary-ltr"]');
      const separators = scope.locator('[data-slot="separator"]');
      const horizontal = await separators.nth(0).boundingBox();
      const vertical = await separators.nth(1).boundingBox();
      const result = {
        horizontal: horizontal ? { width: horizontal.width, height: horizontal.height } : null,
        vertical: vertical ? { width: vertical.width, height: vertical.height } : null,
      };
      ctx.observe("separatorAxisBounds", result);
      assert(
        horizontal &&
          vertical &&
          horizontal.width > horizontal.height &&
          vertical.height > vertical.width,
      );
    });
    await ctx.check("separator-aria", async () => {
      const named = page
        .locator('[data-direction-scope="ordinary-ltr"]')
        .getByRole("separator", { name: "Named divider", exact: true });
      const orientation = await named.getAttribute("aria-orientation");
      ctx.observe("separatorAriaOrientation", orientation);
      assert.equal(orientation, "horizontal");
    });
  },
  sheet: async (page, ctx) => {
    await ctx.check("sheet-physical-sides", async () => {
      const results = [];
      for (const side of ["left", "right", "top", "bottom"]) {
        const { content } = await openSheet(page, side);
        results.push({ side, dataSide: await content.getAttribute("data-side") });
        await closeSheet(content);
      }
      ctx.observe("sheetPhysicalSides", results);
      assert(results.every((result) => result.side === result.dataSide));
    });
    await ctx.check("sheet-portal-direction", async () => {
      const { content } = await openSheet(page, "left");
      const direction = await content.evaluate((element) => getComputedStyle(element).direction);
      ctx.observe("sheetPortalDirection", direction);
      try {
        assert.equal(
          direction,
          "rtl",
          "Sheet portal inherits its nested owner direction (SPEC-AC-11; ticket 09)",
        );
      } finally {
        await closeSheet(content);
      }
    });
    await ctx.check("sheet-focus-return", async () => {
      const { trigger, content } = await openSheet(page, "right");
      await closeSheet(content);
      const triggerHandle = await trigger.elementHandle();
      assert(triggerHandle, "the opening control remains mounted");
      await page.waitForFunction((element) => document.activeElement === element, triggerHandle, {
        timeout: 3000,
      });
      const returned = await trigger.evaluate((element) => element === document.activeElement);
      ctx.observe("sheetFocusReturn", returned);
      assert(returned);
    });
  },
  sidebar: async (page, ctx) => {
    const scope = page.locator('[data-direction-scope="ordinary-rtl"]');
    const sidebar = scope.locator('[data-slot="sidebar"]');
    await ctx.check("sidebar-physical-side", async () => {
      const side = await sidebar.getAttribute("data-side");
      ctx.observe("sidebarPhysicalSide", side);
      assert.equal(side, "right");
    });
    await ctx.check("sidebar-collapse", async () => {
      await scope.locator('[data-slot="sidebar-trigger"]').click();
      const state = await sidebar.getAttribute("data-state");
      ctx.observe("sidebarCollapseState", state);
      assert.equal(state, "collapsed");
    });
    await ctx.check("sidebar-menu-parts", async () => {
      const items = await scope.locator('[data-slot="sidebar-menu-sub-button"]').count();
      ctx.observe("sidebarSubItems", items);
      assert(items > 0);
    });
    // Keep this check last. It changes the viewport to the mobile width.
    await ctx.check("sidebar-mobile-owner-direction", async () => {
      await page.setViewportSize({ width: 390, height: 844 });
      await scope.locator('[data-slot="sidebar-trigger"]').click();
      const content = page
        .locator('[data-sidebar="mobile"] [data-slot="sheet-content"]:visible')
        .last();
      await content.waitFor({ state: "visible" });
      const mobile = await content.evaluate((element) => {
        const sheet = element.closest<HTMLElement>('[data-sidebar="mobile"]');
        return {
          direction: getComputedStyle(element).direction,
          ownerDirection: getComputedStyle(
            document.querySelector('[data-direction-scope="ordinary-rtl"]')!,
          ).direction,
          side: element.getAttribute("data-side"),
          open: sheet?.getAttribute("data-state") ?? null,
        };
      });
      ctx.observe("sidebarMobile", mobile);
      assert.equal(mobile.direction, "rtl");
      assert.equal(mobile.ownerDirection, "rtl");
      assert.equal(mobile.side, "right");
      assert.equal(mobile.open, "open");
    });
  },
  skeleton: async (page, ctx) => {
    await ctx.check("skeleton-bounds", async () => {
      const skeletons = page.locator(
        '[data-direction-scope="ordinary-ltr"] [data-slot="skeleton"]',
      );
      const boxes = await Promise.all([0, 1, 2].map((index) => skeletons.nth(index).boundingBox()));
      const bounds = boxes.map((box) => (box ? { width: box.width, height: box.height } : null));
      ctx.observe("skeletonPlaceholderBounds", bounds);
      assert(bounds.every((box) => box && box.width > 0 && box.height > 0));
    });
  },
  slider: async (page, ctx) => {
    await ctx.check("slider-value-range", async () => {
      const scope = page.locator('[data-direction-scope="ordinary-rtl"]');
      const range = scope.getByRole("slider", { name: "Price range" });
      const values = await range.evaluateAll((elements) =>
        elements.map((element) => Number(element.getAttribute("aria-valuenow"))),
      );
      ctx.observe("sliderRangeValues", values);
      assert.deepEqual(values, [20, 80]);
    });
    await ctx.check("slider-rtl-key", async () => {
      const slider = page
        .locator('[data-direction-scope="ordinary-rtl"]')
        .getByRole("slider", { name: "Volume" });
      await slider.focus();
      const before = Number(await slider.getAttribute("aria-valuenow"));
      await page.keyboard.press("ArrowRight");
      const after = Number(await slider.getAttribute("aria-valuenow"));
      ctx.observe("sliderArrowRight", { before, after });
      assert(
        after < before,
        `ArrowRight decreases horizontal RTL Slider value (SPEC-AC-07; ticket 15): ${before} -> ${after}`,
      );
    });
    await ctx.check("slider-vertical-value", async () => {
      const slider = page
        .locator('[data-direction-scope="ordinary-rtl"]')
        .getByRole("slider", { name: "Vertical scale" });
      await slider.focus();
      const before = Number(await slider.getAttribute("aria-valuenow"));
      await page.keyboard.press("ArrowUp");
      const after = Number(await slider.getAttribute("aria-valuenow"));
      ctx.observe("sliderVerticalArrowUp", { before, after });
      assert(after > before);
    });
  },
  spinner: async (page, ctx) => {
    await ctx.check("spinner-label-motion", async () => {
      const scope = page.locator('[data-direction-scope="ordinary-ltr"]');
      const status = scope.locator('[role="status"][aria-label="Loading project"]');
      const spinner = scope.locator('[data-slot="spinner"]');
      const before = await spinner.evaluate((element) => getComputedStyle(element).animationName);
      await scope.evaluate((element) => element.setAttribute("dir", "rtl"));
      const after = await spinner.evaluate((element) => getComputedStyle(element).animationName);
      await scope.evaluate((element) => element.removeAttribute("dir"));
      ctx.observe("spinnerAnimation", {
        before,
        after,
        statusLabel: await status.getAttribute("aria-label"),
      });
      assert.equal(await status.getAttribute("aria-label"), "Loading project");
      assert.equal(after, before);
    });
  },
  switch: async (page, ctx) => {
    await ctx.check("switch-toggle-form", async () => {
      const scope = page.locator('[data-direction-scope="ordinary-rtl"]');
      const toggle = scope.getByRole("switch", { name: "Enable updates" });
      const form = scope.locator("form");
      const before = await toggle.getAttribute("aria-checked");
      await toggle.click();
      const unchecked = await toggle.getAttribute("aria-checked");
      const uncheckedFormValue = await form.evaluate((element: HTMLFormElement) =>
        new FormData(element).get("surface-updates"),
      );
      await toggle.click();
      const checked = await toggle.getAttribute("aria-checked");
      const checkedFormValue = await form.evaluate((element: HTMLFormElement) =>
        new FormData(element).get("surface-updates"),
      );
      ctx.observe("switchToggleAndForm", {
        before,
        unchecked,
        uncheckedFormValue,
        checked,
        checkedFormValue,
      });
      assert.notEqual(unchecked, before);
      assert.equal(checked, before);
      assert.equal(uncheckedFormValue, null);
      assert.equal(checkedFormValue, "on");
    });
    await ctx.check("switch-track-thumb", async () => {
      const results = [];
      for (const scopeName of [
        "ordinary-ltr",
        "ordinary-rtl",
        "rtl-in-ltr",
        "ltr-in-rtl",
        "deep-rtl",
        "deep-ltr",
      ]) {
        const scope = page.locator(`[data-direction-scope="${scopeName}"]`);
        const toggle = scope.getByRole("switch", { name: "Enable updates" });
        const read = async () => {
          const track = await toggle.boundingBox();
          const thumb = await toggle.locator('[data-slot="switch-toggle"]').boundingBox();
          const checked = await toggle.getAttribute("aria-checked");
          const direction = await toggle.evaluate((element) => getComputedStyle(element).direction);
          return {
            direction,
            checked,
            track: track
              ? { x: track.x, y: track.y, width: track.width, height: track.height }
              : null,
            thumb: thumb
              ? { x: thumb.x, y: thumb.y, width: thumb.width, height: thumb.height }
              : null,
            contained: Boolean(
              track &&
              thumb &&
              thumb.x >= track.x &&
              thumb.x + thumb.width <= track.x + track.width &&
              thumb.y >= track.y &&
              thumb.y + thumb.height <= track.y + track.height,
            ),
          };
        };
        const checked = await read();
        await toggle.click();
        await page.waitForTimeout(200);
        const unchecked = await read();
        await toggle.click();
        results.push({ scopeName, checked, unchecked });
      }
      ctx.observe("switchTrackThumbBounds", results);
      assert(
        results.every(
          ({ checked, unchecked }) =>
            checked.contained &&
            unchecked.contained &&
            (checked.direction === "rtl"
              ? checked.thumb!.x + checked.thumb!.width / 2 <
                unchecked.thumb!.x + unchecked.thumb!.width / 2
              : checked.thumb!.x + checked.thumb!.width / 2 >
                unchecked.thumb!.x + unchecked.thumb!.width / 2),
        ),
        `Switch thumb stays contained and moves toward inline-end when checked (SPEC-AC-08; ticket 22): ${JSON.stringify(results)}`,
      );
    });
  },
  table: async (page, ctx) => {
    const scope = page.locator('[data-direction-scope="ordinary-rtl"]');
    const table = scope.getByRole("table", { name: "Project members" });
    await ctx.check("table-logical-row", async () => {
      const cells = await table.locator("tbody tr").first().locator("td").allTextContents();
      ctx.observe("tableRowCellOrder", cells);
      assert.equal(cells.join("|"), "|ليلى Smith|עברית · West|42");
    });
    await ctx.check("table-checkbox-edge", async () => {
      const checkbox = table.getByRole("checkbox", { name: "Select Leila" });
      const name = table.getByRole("cell", { name: "ليلى Smith" });
      const checkboxBox = await checkbox.boundingBox();
      const nameBox = await name.boundingBox();
      const result = { checkboxX: checkboxBox?.x ?? null, nameX: nameBox?.x ?? null };
      ctx.observe("tableCheckboxColumn", result);
      assert(
        checkboxBox && nameBox && checkboxBox.x > nameBox.x,
        `RTL first data column stays at inline start: ${JSON.stringify(result)}`,
      );
    });
    await ctx.check("table-mixed-number", async () => {
      const cell = table.getByRole("cell", { name: "42", exact: true });
      const direction = await cell.evaluate((element) => getComputedStyle(element).direction);
      const text = await cell.textContent();
      ctx.observe("tableNumberCell", { direction, text });
      assert.equal(direction, "rtl");
      assert.equal(text, "42");
    });
  },
  tabs: async (page, ctx) => {
    await ctx.check("tabs-ltr-key", async () => {
      const tabs = page.locator('[data-direction-scope="ordinary-ltr"]').getByRole("tab");
      const start = tabs.nth(1);
      await start.focus();
      const startX = (await start.boundingBox())!.x;
      await page.keyboard.press("ArrowRight");
      const active = page.locator(":focus");
      const nextX = (await active.boundingBox())!.x;
      const value = await active.getAttribute("data-value");
      ctx.observe("tabsLtrArrowRight", { startX, nextX, value });
      assert(nextX > startX);
      assert.equal(value, "settings");
    });
    await ctx.check("tabs-rtl-key", async () => {
      const tabs = page.locator('[data-direction-scope="ordinary-rtl"]').getByRole("tab");
      const start = tabs.nth(1);
      await start.focus();
      const startX = (await start.boundingBox())!.x;
      await page.keyboard.press("ArrowRight");
      const active = page.locator(":focus");
      const nextX = (await active.boundingBox())!.x;
      const value = await active.getAttribute("data-value");
      ctx.observe("tabsRtlArrowRight", { startX, nextX, value });
      assert(nextX > startX, `ArrowRight moves physically right in RTL (SPEC-AC-05; ticket 12)`);
      assert.equal(value, "overview");
    });
    await ctx.check("tabs-disabled-skip", async () => {
      const tabs = page.locator('[data-direction-scope="ordinary-ltr"]').getByRole("tab");
      await tabs.nth(2).focus();
      await page.keyboard.press("ArrowRight");
      const active = page.locator(":focus");
      const value = await active.getAttribute("data-value");
      const disabled = await active.isDisabled();
      ctx.observe("tabsDisabledSkip", { value, disabled });
      assert.equal(disabled, false);
      assert.notEqual(value, "disabled");
    });
    await ctx.check("tabs-panel", async () => {
      const scope = page.locator('[data-direction-scope="ordinary-ltr"]');
      await scope.getByRole("tab", { name: "Activity" }).click();
      const panel = scope.locator('[data-slot="tabs-content"][data-state="active"]').last();
      await panel.waitFor({ state: "visible" });
      const text = await panel.textContent();
      ctx.observe("tabsActivePanel", text);
      assert(text?.includes("Latest activity"));
    });
  },
  textarea: async (page, ctx) => {
    await ctx.check("textarea-editing", async () => {
      const scope = page.locator('[data-direction-scope="ordinary-rtl"]');
      const textarea = scope.getByRole("textbox", { name: "Notes" });
      const value = "مرحبا · Ticket R42 · עברית";
      await textarea.fill(value);
      await textarea.evaluate((element: HTMLTextAreaElement) => element.setSelectionRange(0, 4));
      const result = await textarea.evaluate((element: HTMLTextAreaElement) => ({
        value: element.value,
        direction: getComputedStyle(element).direction,
        selectionStart: element.selectionStart,
        selectionEnd: element.selectionEnd,
        resize: getComputedStyle(element).resize,
      }));
      ctx.observe("textareaEditing", result);
      assert.equal(result.value, value);
      assert.equal(result.direction, "rtl");
      assert.equal(result.selectionStart, 0);
      assert.equal(result.selectionEnd, 4);
    });
    await ctx.check("textarea-form-reset", async () => {
      const scope = page.locator('[data-direction-scope="ordinary-rtl"]');
      const textarea = scope.getByRole("textbox", { name: "Notes" });
      await textarea.fill("Changed R42");
      await scope.getByRole("button", { name: "Reset notes" }).click();
      await page.waitForTimeout(0);
      const value = await textarea.inputValue();
      const formValue = await scope
        .locator("form")
        .evaluate((form: HTMLFormElement) => new FormData(form).get("surface-notes"));
      ctx.observe("textareaReset", { value, formValue });
      assert.equal(value, "مرحبا · Ticket R42 · עברית");
      assert.equal(formValue, "مرحبا · Ticket R42 · עברית");
    });
  },
  "theme-toggle": async (page, ctx) => {
    await ctx.check("theme-toggle-keyboard", async () => {
      const scope = page.locator('[data-direction-scope="ordinary-rtl"]');
      const toggle = scope.getByRole("button", { name: "Toggle fixture theme" });
      const before = await toggle.getAttribute("aria-pressed");
      await toggle.focus();
      await page.keyboard.press("Space");
      const after = await toggle.getAttribute("aria-pressed");
      ctx.observe("themeToggleKeyboard", { before, after });
      assert.notEqual(after, before);
    });
    await ctx.check("theme-toggle-disabled", async () => {
      const disabled = page.getByRole("button", { name: "Disabled fixture theme" }).first();
      const before = await disabled.getAttribute("aria-pressed");
      assert.equal(await disabled.isDisabled(), true);
      await disabled.click({ force: true });
      const after = await disabled.getAttribute("aria-pressed");
      ctx.observe("themeToggleDisabled", { before, after });
      assert.equal(after, before);
    });
    await ctx.check("theme-toggle-icons", async () => {
      const toggle = page
        .locator('[data-direction-scope="ordinary-rtl"]')
        .getByRole("button", { name: "Toggle fixture theme" });
      const icons = toggle.locator("[data-theme-icon]");
      const count = await icons.count();
      const displays = await icons.evaluateAll((elements) =>
        elements.map((element) => getComputedStyle(element).display),
      );
      ctx.observe("themeToggleIcons", { count, displays });
      assert.equal(count, 2);
      assert(displays.includes("block"));
    });
  },
  toast: async (page, ctx) => {
    const scope = page.locator('[data-direction-scope="rtl-in-ltr"]');
    await ctx.check("toast-viewport-direction", async () => {
      await scope.getByRole("button", { name: "Show toast" }).click();
      const toast = page.locator('[data-slot="toast"]:visible').last();
      await toast.waitFor({ state: "visible" });
      const direction = await toast.evaluate((element) => getComputedStyle(element).direction);
      ctx.observe("toastContentDirection", direction);
      assert.equal(
        direction,
        "ltr",
        "The detached Toast uses its viewport/document direction unless the fixture sets dir",
      );
    });
    await ctx.check("toast-physical-position", async () => {
      const viewport = page.locator("[data-sw-toast-viewport]").last();
      const position = await viewport.getAttribute("data-position");
      const toast = page.locator('[data-slot="toast"]:visible').last();
      const box = await toast.boundingBox();
      const viewportBox = await viewport.boundingBox();
      const rightClearance =
        box && viewportBox ? viewportBox.x + viewportBox.width - (box.x + box.width) : null;
      ctx.observe("toastPhysicalPosition", { position, rightClearance });
      assert.equal(position, "bottom-right");
      assert(rightClearance !== null && rightClearance >= 0);
    });
    await ctx.check("toast-action-close", async () => {
      const toast = page.locator('[data-slot="toast"]:visible').last();
      const action = toast.locator('[data-slot="toast-action"]');
      await action.waitFor({ state: "visible" });
      const actionVisible = await action.isVisible();
      await action.click();
      const state = await toast.getAttribute("data-state");
      const callback = await page.locator("html").getAttribute("data-toast-action-invoked");
      ctx.observe("toastActionClose", { actionVisible, state, callback });
      assert(actionVisible);
      assert.equal(callback, "true");
      assert.equal(state, "closed");
    });
  },
  toggle: async (page, ctx) => {
    await ctx.check("toggle-keyboard", async () => {
      const toggle = page
        .locator('[data-direction-scope="ordinary-rtl"]')
        .getByRole("button", { name: "Pin project" });
      const before = await toggle.getAttribute("aria-pressed");
      await toggle.focus();
      await page.keyboard.press("Space");
      const after = await toggle.getAttribute("aria-pressed");
      ctx.observe("toggleKeyboard", { before, after });
      assert.notEqual(after, before);
    });
    await ctx.check("toggle-disabled", async () => {
      const disabled = page
        .locator('[data-direction-scope="ordinary-rtl"]')
        .getByRole("button", { name: "Disabled pin" });
      assert.equal(await disabled.isDisabled(), true);
      await disabled.click({ force: true });
      const pressed = await disabled.getAttribute("aria-pressed");
      ctx.observe("toggleDisabled", pressed);
      assert.equal(pressed, "false");
    });
    await ctx.check("toggle-variant-state", async () => {
      const toggle = page
        .locator('[data-direction-scope="ordinary-rtl"]')
        .getByRole("button", { name: "Pin project" });
      const result = {
        slot: await toggle.getAttribute("data-slot"),
        state: await toggle.getAttribute("data-state"),
        classes: await toggle.getAttribute("class"),
      };
      ctx.observe("toggleVariantState", result);
      assert.equal(result.slot, "toggle");
      assert(result.classes?.length);
    });
  },
  "toggle-group": async (page, ctx) => {
    await ctx.check("toggle-group-seams", async () => {
      const items = page.locator(
        '[data-direction-scope="ordinary-rtl"] [data-slot="toggle-group-item"]',
      );
      const boxes = await Promise.all([0, 1, 2].map((index) => items.nth(index).boundingBox()));
      const bounds = boxes.map((box) =>
        box ? { x: box.x, width: box.width, y: box.y, height: box.height } : null,
      );
      ctx.observe("toggleGroupItemBounds", bounds);
      assert(bounds.every((box) => box && box.width > 0 && box.height > 0));
    });
    await ctx.check("toggle-group-keyboard", async () => {
      const items = page.locator(
        '[data-direction-scope="ordinary-rtl"] [data-slot="toggle-group-item"]',
      );
      await items.nth(1).focus();
      const startX = (await items.nth(1).boundingBox())!.x;
      await page.keyboard.press("ArrowRight");
      const active = page.locator(":focus");
      const nextX = (await active.boundingBox())!.x;
      ctx.observe("toggleGroupArrowRight", {
        startX,
        nextX,
        value: await active.getAttribute("data-value"),
      });
      assert(
        nextX > startX,
        "ArrowRight moves to the physical right item in RTL (SPEC-AC-05; ticket 12)",
      );
    });
    await ctx.check("toggle-group-selection", async () => {
      const scope = page.locator('[data-direction-scope="ordinary-rtl"]');
      const group = scope.locator('[data-slot="toggle-group"]');
      await scope.getByRole("button", { name: "Start" }).click();
      const value = await group.getAttribute("data-value");
      ctx.observe("toggleGroupSelection", value);
      assert(value?.includes("start"));
    });
  },
  tooltip: async (page, ctx) => {
    const scope = page.locator('[data-direction-scope="rtl-in-ltr"]');
    const trigger = scope.getByRole("button", { name: "Details for Alpha" }).first();
    await ctx.check("tooltip-trigger", async () => {
      await trigger.hover();
      const content = page.locator('[data-slot="tooltip-content"]:visible').last();
      await content.waitFor({ state: "visible" });
      const text = await content.textContent();
      ctx.observe("tooltipContentText", text);
      assert(text?.includes("Project Alpha 42"));
    });
    await ctx.check("tooltip-portal-direction", async () => {
      try {
        await trigger.hover();
        const contentId = await trigger.getAttribute("aria-describedby");
        assert(contentId, "the trigger references its tooltip content");
        const content = page.locator(`[id="${contentId}"]`);
        await content.waitFor({ state: "visible" });
        const direction = await content.evaluate((element) => getComputedStyle(element).direction);
        ctx.observe("tooltipPortalDirection", direction);
        assert.equal(
          direction,
          "rtl",
          "Tooltip portal inherits its nested owner direction (SPEC-AC-11; ticket 09)",
        );
      } finally {
        await page.keyboard.press("Escape");
      }
    });
    await ctx.check("tooltip-side", async () => {
      const ltrTrigger = page
        .locator('[data-direction-scope="ordinary-ltr"]')
        .getByRole("button", { name: "Details for Alpha" })
        .first();
      await ltrTrigger.hover();
      const contentId = await ltrTrigger.getAttribute("aria-describedby");
      assert(contentId, "the LTR trigger references its tooltip content");
      const content = page.locator(`[id="${contentId}"]`);
      await content.waitFor({ state: "visible" });
      const side = await content.getAttribute("data-side");
      const bounds = await Promise.all([ltrTrigger.boundingBox(), content.boundingBox()]);
      ctx.observe("tooltipPhysicalSide", {
        side,
        triggerX: bounds[0]?.x ?? null,
        popupX: bounds[1]?.x ?? null,
        direction: await content.evaluate((element) => getComputedStyle(element).direction),
      });
      assert.equal(side, "right");
      await page.keyboard.press("Escape");
    });
  },
  video: async (page, ctx) => {
    const video = page.locator('[data-direction-scope="ordinary-rtl"] video');
    await ctx.check("video-native-controls-track", async () => {
      await video.waitFor({ state: "visible" });
      const controls = await video.getAttribute("controls");
      const track = await video.locator("track").getAttribute("kind");
      ctx.observe("videoNativeMedia", { controls, track });
      assert.equal(controls, "");
      assert.equal(track, "captions");
    });
    await ctx.check("video-aspect-ratio", async () => {
      const box = await video.boundingBox();
      const ratio = box ? box.width / box.height : null;
      ctx.observe("videoAspectRatio", {
        width: box?.width ?? null,
        height: box?.height ?? null,
        ratio,
      });
      assert(ratio !== null && Math.abs(ratio - 16 / 9) < 0.08);
    });
    await ctx.check("video-fallback", async () => {
      const fallback = page.locator('[data-direction-scope="ordinary-rtl"] [data-video-fallback]');
      await fallback.waitFor({ state: "visible" });
      const text = await fallback.textContent();
      ctx.observe("videoFallbackText", text);
      assert(text?.includes("Project R42"));
    });
  },
};

export const expectations: DirectionExpectation[] = definitions.map((definition) => ({
  id: `surface-${definition.row}`,
  layer: definition.row === "theme-toggle" ? "theme" : "styled",
  async run(page, _target, ctx) {
    page.setDefaultTimeout(3000);
    if (definition.row === "radio-group") await behavior[definition.row](page, ctx);
    await verifyCommon(page, definition, ctx);
    if (definition.row !== "radio-group") await behavior[definition.row](page, ctx);
  },
}));
