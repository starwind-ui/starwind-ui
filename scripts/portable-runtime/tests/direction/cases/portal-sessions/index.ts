import assert from "node:assert/strict";
import type { DirectionAssertionContext } from "../../assertion-receipts.js";
import type { DirectionCase, DirectionExpectation } from "../../inventory.js";

type PortalCapture = {
  direction: string;
  portalDirection: string | null;
  parentIsTarget: boolean;
  visible: boolean;
  popupLeft: number;
  popupRight: number;
  triggerLeft: number;
  triggerRight: number;
};

type PortalResult = {
  mode: string;
  first: PortalCapture;
  flipped: PortalCapture;
  closed: { visible: boolean; projected: string | null };
  reopened: PortalCapture;
  authored: { attribute: string | null; direction: string };
  afterDestroy: string | null;
};

const source = `---
---
<html lang="en"><head><meta charset="utf-8"/></head><body dir="ltr">
<div id="portal-target" dir="ltr"></div>
${["factory", "initStarwind"]
  .map(
    (mode, index) => `
  <section data-mode="${mode}" dir="rtl">
    <div data-sw-popover>
      <button data-sw-popover-trigger style="position:fixed;left:${220 + index * 240}px;top:100px;width:80px;height:32px">Open</button>
      <div data-sw-popover-portal data-container="#portal-target">
        <div data-sw-popover-positioner data-side="bottom" data-align="start">
          <div data-sw-popover-popup hidden style="width:120px;height:60px;text-align:start">
            <span data-content-text>محتوى</span><button data-sw-popover-close>Close</button>
          </div>
        </div>
      </div>
    </div>
  </section>`,
  )
  .join("\n")}
<script>
import { createPopover } from "@starwind-ui/runtime/popover";
import { initStarwind } from "@starwind-ui/runtime/init-starwind";
const instances = new Map();
for (const section of document.querySelectorAll('section[data-mode]')) {
  const instance = section.dataset.mode === "factory"
    ? createPopover(section.querySelector('[data-sw-popover]'))
    : initStarwind(section);
  instances.set(section.dataset.mode, instance);
}
window.__portalInstances = instances;
document.body.dataset.ready = "true";
</script></body></html>`;

export const cases: DirectionCase[] = [
  {
    id: "portal-sessions-raw-popover",
    row: "runtime:popover",
    acceptance: ["SPEC-AC-03", "SPEC-AC-04", "SPEC-AC-06"],
    rawEntrypoints: ["factory", "initStarwind"],
    fixtures: {
      astro: {
        source,
        exports: [],
        assertions: ["first-visible-owner-placement", "retained-and-authored-lifecycle"],
      },
    },
    physicalExceptions: [
      "The popup remains at physical coordinates; start alignment follows its effective direction.",
    ],
  },
];

export const expectations: DirectionExpectation[] = [
  {
    id: "portal-sessions-raw-popover",
    layer: "raw-html",
    async run(page, target, context: DirectionAssertionContext) {
      assert.equal(target, "astro");
      await page.waitForSelector('body[data-ready="true"]', { state: "attached" });
      await page.evaluate("window.__name = (target) => target");
      const results: PortalResult[] = [];
      for (const mode of ["factory", "initStarwind"]) {
        const result = await page.evaluate(async (mode) => {
          const section = document.querySelector<HTMLElement>(`section[data-mode="${mode}"]`)!;
          const root = section.querySelector<HTMLElement>("[data-sw-popover]")!;
          const trigger = root.querySelector<HTMLButtonElement>("[data-sw-popover-trigger]")!;
          const portal = root.querySelector<HTMLElement>("[data-sw-popover-portal]")!;
          const popup = portal.querySelector<HTMLElement>("[data-sw-popover-popup]")!;
          const text = popup.querySelector<HTMLElement>("[data-content-text]")!;
          const target = document.querySelector<HTMLElement>("#portal-target")!;
          const frame = () =>
            new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));
          const capture = () => {
            const popupRect = popup.getBoundingClientRect();
            const triggerRect = trigger.getBoundingClientRect();
            return {
              direction: getComputedStyle(popup).direction,
              portalDirection: portal.getAttribute("dir"),
              parentIsTarget: portal.parentElement === target,
              visible: !popup.hidden,
              popupLeft: popupRect.left,
              popupRight: popupRect.right,
              triggerLeft: triggerRect.left,
              triggerRight: triggerRect.right,
            };
          };
          trigger.click();
          await frame();
          const first = capture();
          section.dir = "ltr";
          document.dispatchEvent(new Event("starwind:direction-change"));
          await frame();
          const flipped = capture();
          portal.querySelector<HTMLButtonElement>("[data-sw-popover-close]")!.click();
          await frame();
          const closed = { visible: popup.hidden, projected: portal.getAttribute("dir") };
          section.dir = "rtl";
          document.dispatchEvent(new Event("starwind:direction-change"));
          trigger.click();
          await frame();
          const reopened = capture();
          portal.setAttribute("dir", "auto");
          text.textContent = "Content";
          document.dispatchEvent(new Event("starwind:direction-change"));
          await frame();
          const authored = {
            attribute: portal.getAttribute("dir"),
            direction: getComputedStyle(popup).direction,
          };
          (window as any).__portalInstances.get(mode).destroy();
          return {
            mode,
            first,
            flipped,
            closed,
            reopened,
            authored,
            afterDestroy: portal.getAttribute("dir"),
          };
        }, mode);
        results.push(result);
      }
      await context.check("first-visible-owner-placement", () => {
        for (const result of results) {
          assert.equal(result.first.visible, true);
          assert.equal(result.first.parentIsTarget, true);
          assert.equal(result.first.direction, "rtl");
          assert.equal(result.first.portalDirection, "rtl");
          assert(Math.abs(result.first.popupRight - result.first.triggerRight) < 2);
          assert.equal(result.flipped.direction, "ltr");
          assert.equal(result.flipped.portalDirection, "ltr");
          assert(Math.abs(result.flipped.popupLeft - result.flipped.triggerLeft) < 2);
        }
        context.observe("first-visible-owner-placement", results);
      });
      await context.check("retained-and-authored-lifecycle", () => {
        for (const result of results) {
          assert.equal(result.closed.visible, true);
          assert.equal(result.closed.projected, null);
          assert.equal(result.reopened.visible, true);
          assert.equal(result.reopened.direction, "rtl");
          assert.equal(result.authored.attribute, "auto");
          assert.equal(result.authored.direction, "ltr");
          assert.equal(result.afterDestroy, "auto");
        }
        context.observe("retained-and-authored-lifecycle", results);
      });
    },
  },
];
