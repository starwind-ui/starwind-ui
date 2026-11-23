import assert from "node:assert/strict";
import type { Page } from "playwright";
import type { DirectionAssertionContext } from "../../assertion-receipts.js";
import type { DirectionCase, DirectionExpectation } from "../../inventory.js";
import {
  cases as styledCases,
  expectations as styledExpectations,
} from "../fixtures-composites/index.js";

const styledInput = styledCases.find((item) => item.id === "input-otp")!;
const styledMenu = styledCases.find((item) => item.id === "navigation-menu")!;
const styledInputExpectation = styledExpectations.find((item) => item.id === "input-otp")!;
const styledMenuExpectation = styledExpectations.find((item) => item.id === "navigation-menu")!;
const styledMenuFixtures = Object.fromEntries(
  Object.entries(styledMenu.fixtures).map(([target, fixture]) => [
    target,
    {
      ...fixture,
      assertions: [
        "horizontal-trigger-physical",
        "vertical-inline-end",
        "popup-sequential-aliases",
      ],
    },
  ]),
) as DirectionCase["fixtures"];

const otpMarkup = (mode: string, direction: string) => `
  <form data-mode="${mode}" data-direction="${direction}" dir="${direction === "ltr-in-rtl" ? "rtl" : direction}">
    <div data-sw-input-otp ${direction === "ltr-in-rtl" ? 'dir="ltr"' : ""} data-default-value="12" data-max-length="4" data-pattern="[0-9]" data-name="code" tabindex="0">
      <input data-sw-input-otp-input name="code" value="12" />
      <div class="otp-slots" data-sw-input-otp-group>
        ${[0, 1, 2, 3].map((index) => `<div data-sw-input-otp-slot data-index="${index}"><span data-sw-input-otp-char></span><span data-sw-input-otp-caret hidden></span></div>`).join("")}
      </div>
    </div>
  </form>`;

const otpSource = `---
---
<html lang="en"><head><meta charset="utf-8"/><style>
.otp-slots { display: flex; gap: 8px; }
[data-sw-input-otp-slot] { display: block; width: 32px; height: 32px; border: 1px solid; }
[data-sw-input-otp-input] { position: absolute; opacity: 0; }
</style></head><body>
${["factory", "automatic"].flatMap((mode) => ["ltr", "rtl", "ltr-in-rtl"].map((direction) => otpMarkup(mode, direction))).join("\n")}
<script>
import { createInputOtp } from "@starwind-ui/runtime/input-otp";
import { initStarwind } from "@starwind-ui/runtime/init-starwind";
for (const form of document.querySelectorAll('form[data-mode="factory"]')) createInputOtp(form.querySelector('[data-sw-input-otp]')!);
for (const form of document.querySelectorAll('form[data-mode="automatic"]')) initStarwind(form);
document.body.dataset.ready = "true";
</script></body></html>`;

const menuMarkup = (mode: string, direction: string, kind: string) => `
  <section data-mode="${mode}" data-direction="${direction}" data-kind="${kind}" dir="${direction}">
    <nav data-sw-nav-menu data-orientation="${kind === "horizontal" ? "horizontal" : "vertical"}" data-open-delay="0" data-close-delay="0" ${kind === "controlled" ? 'data-controlled-value=""' : ""} ${kind === "escape-off" ? 'data-close-on-escape="false"' : ""}>
      <ul data-sw-nav-menu-list class="${kind === "horizontal" ? "horizontal-list" : ""}">
        ${["first", "second"].map((value) => `<li data-sw-nav-menu-item data-value="${value}"><button type="button" data-sw-nav-menu-trigger>${value}</button><div data-sw-nav-menu-content><a href="#${value}" data-sw-nav-menu-link>${value} link</a><button type="button">${value} button</button><input aria-label="${value} input" /></div></li>`).join("")}
      </ul>
      <div data-sw-nav-menu-portal><div data-sw-nav-menu-positioner data-side="bottom" data-align="start"><div data-sw-nav-menu-popup><div data-sw-nav-menu-viewport></div><div data-sw-nav-menu-arrow></div></div></div></div>
    </nav>
  </section>`;

const menuSource = `---
---
<html lang="en"><head><meta charset="utf-8"/><style>
.horizontal-list { display: flex; gap: 16px; }
[data-sw-nav-menu-trigger] { min-width: 70px; }
</style></head><body>
${["factory", "automatic"].flatMap((mode) => ["ltr", "rtl"].flatMap((direction) => ["horizontal", "vertical", "controlled", "escape-off"].map((kind) => menuMarkup(mode, direction, kind)))).join("\n")}
<script>
import { createNavigationMenu } from "@starwind-ui/runtime/navigation-menu";
import { initStarwind } from "@starwind-ui/runtime/init-starwind";
for (const section of document.querySelectorAll('section[data-mode="factory"]')) createNavigationMenu(section.querySelector('[data-sw-nav-menu]')!);
for (const section of document.querySelectorAll('section[data-mode="automatic"]')) initStarwind(section);
document.body.dataset.ready = "true";
</script></body></html>`;

export const cases: DirectionCase[] = [
  { ...styledInput, id: "navigation-otp-styled-input-otp" },
  { ...styledMenu, id: "navigation-otp-styled-navigation-menu", fixtures: styledMenuFixtures },
  {
    id: "navigation-otp-raw-input-otp",
    row: "runtime:input-otp",
    acceptance: ["SPEC-AC-04", "SPEC-AC-13"],
    rawEntrypoints: ["factory", "initStarwind"],
    fixtures: {
      astro: { source: otpSource, exports: [], assertions: ["raw-otp-spatial-and-data"] },
    },
    physicalExceptions: [
      "Code value, character indices, paste order, and form data remain logical.",
    ],
  },
  {
    id: "navigation-otp-raw-navigation-menu",
    row: "runtime:navigation-menu",
    acceptance: ["SPEC-AC-04", "SPEC-AC-05"],
    rawEntrypoints: ["factory", "initStarwind"],
    fixtures: {
      astro: { source: menuSource, exports: [], assertions: ["raw-navigation-spatial-and-focus"] },
    },
    physicalExceptions: [
      "Popup content keeps sequential Right/Down and Left/Up aliases. Trigger movement follows physical horizontal positions.",
    ],
  },
];

async function verifyOtp(page: Page) {
  // tsx names nested callbacks; Playwright serializes them without its helper.
  await page.evaluate("window.__name = (target) => target");
  return page.evaluate(async () => {
    const results = [];
    for (const form of document.querySelectorAll<HTMLFormElement>("form[data-mode]")) {
      const root = form.querySelector<HTMLElement>("[data-sw-input-otp]")!;
      const input = root.querySelector<HTMLInputElement>("[data-sw-input-otp-input]")!;
      const slots = Array.from(root.querySelectorAll<HTMLElement>("[data-sw-input-otp-slot]"));
      const centers = slots.map((slot) => {
        const rect = slot.getBoundingClientRect();
        return rect.left + rect.width / 2;
      });
      const activeIndex = () =>
        slots.findIndex((slot) => slot.getAttribute("data-active") === "true");
      const key = (name: string) =>
        root.dispatchEvent(
          new KeyboardEvent("keydown", { key: name, bubbles: true, cancelable: true }),
        );
      const focus = () => {
        input.blur();
        root.focus();
      };
      focus();
      const start = activeIndex();
      const startX = centers[start];
      key("ArrowLeft");
      const left = activeIndex();
      const leftX = centers[left];
      focus();
      key("ArrowRight");
      const right = activeIndex();
      const rightX = centers[right];
      const afterArrows = {
        value: input.value,
        formData: Array.from(new FormData(form).entries()),
      };
      focus();
      const paste = new Event("paste", { bubbles: true, cancelable: true });
      Object.defineProperty(paste, "clipboardData", { value: { getData: () => "34" } });
      root.dispatchEvent(paste);
      const afterPaste = { value: input.value, formData: Array.from(new FormData(form).entries()) };
      key("Backspace");
      const afterDelete = {
        value: input.value,
        formData: Array.from(new FormData(form).entries()),
      };
      form.reset();
      await new Promise((resolve) => setTimeout(resolve, 0));
      const afterReset = { value: input.value, formData: Array.from(new FormData(form).entries()) };
      results.push({
        mode: form.dataset.mode,
        direction: form.dataset.direction,
        effectiveDirection: getComputedStyle(root).direction,
        centers,
        start,
        startX,
        left,
        leftX,
        right,
        rightX,
        afterArrows,
        afterPaste,
        afterDelete,
        afterReset,
      });
    }
    return results;
  });
}

async function verifyMenu(page: Page) {
  await page.evaluate("window.__name = (target) => target");
  return page.evaluate(() => {
    const results = [];
    const key = (target: HTMLElement, name: string, shiftKey = false) =>
      target.dispatchEvent(
        new KeyboardEvent("keydown", { key: name, shiftKey, bubbles: true, cancelable: true }),
      );
    for (const section of document.querySelectorAll<HTMLElement>("section[data-mode]")) {
      const root = section.querySelector<HTMLElement>("[data-sw-nav-menu]")!;
      const triggers = Array.from(
        root.querySelectorAll<HTMLButtonElement>("[data-sw-nav-menu-trigger]"),
      );
      const [first, second] = triggers;
      const direction = section.dataset.direction!;
      const kind = section.dataset.kind!;
      const mode = section.dataset.mode!;
      const towardSecond = direction === "rtl" ? "ArrowLeft" : "ArrowRight";
      const towardFirst = direction === "rtl" ? "ArrowRight" : "ArrowLeft";
      const result: Record<string, unknown> = { mode, direction, kind };
      if (kind === "horizontal") {
        result.centers = triggers.map((trigger) => {
          const rect = trigger.getBoundingClientRect();
          return rect.left + rect.width / 2;
        });
        first!.focus();
        key(first!, towardSecond);
        result.afterTowardSecond = document.activeElement === second;
        const secondBounds = document.activeElement?.getBoundingClientRect();
        result.afterTowardSecondX = secondBounds
          ? secondBounds.left + secondBounds.width / 2
          : null;
        key(second!, towardFirst);
        result.afterTowardFirst = document.activeElement === first;
        const firstBounds = document.activeElement?.getBoundingClientRect();
        result.afterTowardFirstX = firstBounds ? firstBounds.left + firstBounds.width / 2 : null;
      } else {
        const requests: unknown[] = [];
        if (kind === "controlled")
          root.addEventListener("starwind:value-change", (event) =>
            requests.push((event as CustomEvent).detail.value),
          );
        first!.focus();
        key(first!, towardSecond);
        result.expanded = first!.getAttribute("aria-expanded");
        result.focusAfterOpen = document.activeElement?.textContent?.trim();
        result.requests = requests;
        if (kind === "vertical") {
          const content = document.activeElement!.closest<HTMLElement>(
            "[data-sw-nav-menu-content]",
          )!;
          const link = content.querySelector<HTMLAnchorElement>("a")!;
          const button = content.querySelector<HTMLButtonElement>("button")!;
          result.focusedFirst = document.activeElement === link;
          key(link, "ArrowRight");
          result.rightNext = document.activeElement === button;
          key(button, "ArrowLeft");
          result.leftPrevious = document.activeElement === link;
          key(link, "ArrowDown");
          result.downNext = document.activeElement === button;
          key(button, "ArrowUp");
          result.upPrevious = document.activeElement === link;
          key(link, "Tab", true);
          result.shiftTabTrigger = document.activeElement === first;
          link.focus();
          key(link, "Escape");
          result.escapeClosed = first!.getAttribute("aria-expanded") === "false";
          result.escapeFocus = document.activeElement === first;
        } else if (kind === "escape-off") {
          const link = document.activeElement as HTMLElement;
          key(link, "Escape");
          result.escapeKeptOpen = first!.getAttribute("aria-expanded") === "true";
        } else {
          result.focusStayedOnTrigger = document.activeElement === first;
        }
      }
      results.push(result);
    }
    return results;
  });
}

export const expectations: DirectionExpectation[] = [
  { ...styledInputExpectation, id: "navigation-otp-styled-input-otp" },
  {
    ...styledMenuExpectation,
    id: "navigation-otp-styled-navigation-menu",
    async run(page, _target, context: DirectionAssertionContext) {
      await context.check("horizontal-trigger-physical", async () => {
        const triggerList = page.locator(
          '[data-direction-scope="explicit-root-rtl"] [data-direction-horizontal-menu="true"] [data-direction-part="NavigationMenuTrigger"]',
        );
        const first = triggerList.nth(0);
        const second = triggerList.nth(1);
        const firstX = (await first.boundingBox())!.x;
        const secondX = (await second.boundingBox())!.x;
        assert(secondX < firstX, "RTL trigger bounds must descend in x");
        await first.focus();
        await first.press("ArrowLeft");
        const afterLeft = await page.evaluate(() => document.activeElement?.textContent?.trim());
        assert.equal(afterLeft, "משאבים");
        await second.press("ArrowRight");
        const afterRight = await page.evaluate(() => document.activeElement?.textContent?.trim());
        assert.equal(afterRight, "المنتجات");
        context.observe("horizontal-trigger-physical", { firstX, secondX, afterLeft, afterRight });
      });
      await context.check("vertical-inline-end", async () => {
        const evidence = [];
        for (const direction of ["ltr", "rtl"] as const) {
          const scope = `explicit-root-${direction}`;
          const trigger = page
            .locator(
              `[data-direction-scope="${scope}"] [data-direction-vertical-menu="true"] [data-direction-part="NavigationMenuTrigger"]`,
            )
            .first();
          await trigger.press(direction === "rtl" ? "ArrowLeft" : "ArrowRight");
          const expanded = await trigger.getAttribute("aria-expanded");
          const activeText = await page.evaluate(() => document.activeElement?.textContent?.trim());
          assert.equal(expanded, "true");
          assert.equal(activeText, "المكونات العمودية");
          evidence.push({ direction, expanded, activeText });
          await page.keyboard.press("Escape");
        }
        context.observe("vertical-inline-end", evidence);
      });
      await context.check("popup-sequential-aliases", async () => {
        const trigger = page
          .locator(
            '[data-direction-scope="explicit-root-rtl"] [data-direction-horizontal-menu="true"] [data-direction-part="NavigationMenuTrigger"]',
          )
          .first();
        await trigger.press("ArrowDown");
        const links = page.locator(
          '[data-direction-copy="explicit-root-rtl"][data-direction-part="NavigationMenuContent"]:visible [data-direction-part="NavigationMenuLink"]',
        );
        await links.first().focus();
        await links.first().press("ArrowRight");
        const next = await page.evaluate(() => document.activeElement?.textContent?.trim());
        await links.nth(1).press("ArrowLeft");
        const previous = await page.evaluate(() => document.activeElement?.textContent?.trim());
        assert.equal(next, "Documentation");
        assert.equal(previous, "مكونات Starwind");
        context.observe("popup-sequential-aliases", { next, previous });
      });
    },
  },
  {
    id: "navigation-otp-raw-input-otp",
    layer: "raw-html",
    async run(page, target, context: DirectionAssertionContext) {
      assert.equal(target, "astro");
      await page.waitForSelector('body[data-ready="true"]');
      await context.check("raw-otp-spatial-and-data", async () => {
        const results = await verifyOtp(page);
        context.observe("raw-otp-spatial-and-data", results);
        assert.equal(results.length, 6);
        for (const result of results) {
          const rtl = result.direction === "rtl";
          assert.equal(result.effectiveDirection, rtl ? "rtl" : "ltr");
          assert.equal(Math.sign(result.centers[1]! - result.centers[0]!), rtl ? -1 : 1);
          assert.equal(result.start, 2);
          assert.equal(result.left, rtl ? 3 : 1);
          assert.equal(result.right, rtl ? 1 : 3);
          assert(result.leftX! < result.startX!);
          assert(result.rightX! > result.startX!);
          assert.deepEqual(result.afterArrows, { value: "12", formData: [["code", "12"]] });
          assert.deepEqual(result.afterPaste, { value: "1234", formData: [["code", "1234"]] });
          assert.deepEqual(result.afterDelete, { value: "123", formData: [["code", "123"]] });
          assert.deepEqual(result.afterReset, { value: "12", formData: [["code", "12"]] });
        }
      });
    },
  },
  {
    id: "navigation-otp-raw-navigation-menu",
    layer: "raw-html",
    async run(page, target, context: DirectionAssertionContext) {
      assert.equal(target, "astro");
      await page.waitForSelector('body[data-ready="true"]');
      await context.check("raw-navigation-spatial-and-focus", async () => {
        const results = await verifyMenu(page);
        context.observe("raw-navigation-spatial-and-focus", results);
        assert.equal(results.length, 16);
        for (const result of results) {
          if (result.kind === "horizontal") {
            const centers = result.centers as number[];
            assert.equal(Math.sign(centers[1]! - centers[0]!), result.direction === "rtl" ? -1 : 1);
            assert.equal(result.afterTowardSecond, true);
            assert.equal(result.afterTowardFirst, true);
            assert.equal(result.afterTowardSecondX, centers[1]);
            assert.equal(result.afterTowardFirstX, centers[0]);
          } else if (result.kind === "vertical") {
            assert.equal(result.expanded, "true");
            for (const name of [
              "focusedFirst",
              "rightNext",
              "leftPrevious",
              "downNext",
              "upPrevious",
              "shiftTabTrigger",
              "escapeClosed",
              "escapeFocus",
            ])
              assert.equal(result[name], true, `${name}: ${JSON.stringify(result)}`);
          } else if (result.kind === "controlled") {
            assert.equal(result.expanded, "false");
            assert.deepEqual(result.requests, ["first"]);
            assert.equal(result.focusStayedOnTrigger, true);
          } else {
            assert.equal(result.expanded, "true");
            assert.equal(result.escapeKeptOpen, true);
          }
        }
      });
    },
  },
];
