import assert from "node:assert/strict";

import type { DirectionCase, DirectionExpectation } from "../../inventory.js";
import { waitHidden } from "../../waits.js";

export const cases: DirectionCase[] = [
  {
    id: "select-alignment-styled",
    row: "select",
    acceptance: ["SPEC-AC-04", "SPEC-AC-09", "SPEC-AC-11"],
    physicalExceptions: [
      "Viewport clamping and resolved data-side remain physical.",
      "Vertical list scrolling and touch fallback retain their physical motion.",
    ],
    fixtures: {
      astro: {
        source: `---
import { Select, SelectContent, SelectItem, SelectScrollDownButton, SelectScrollUpButton, SelectTrigger, SelectValue } from "@direction/styled-astro/select";
import "@direction/sheet";
---
<html dir="ltr"><body>
  <section id="alignment-owner" data-direction-scope="ordinary-rtl" dir="rtl" style="position:fixed;left:130px;top:100px;width:180px">
    <Select defaultValue="beta" name="alignment" modal={false}>
      <SelectTrigger id="alignment-trigger" style="width:180px;height:44px">
        <SelectValue id="alignment-value" style="display:inline-block;width:80px" />
        <span data-trigger-icon aria-hidden="true">◆</span>
      </SelectTrigger>
      <SelectContent id="alignment-content" alignItemWithTrigger={true} style="width:240px;max-height:200px">
        <SelectScrollUpButton>▲</SelectScrollUpButton>
        <SelectItem value="alpha">Short</SelectItem>
        <SelectItem value="beta"><span data-item-icon aria-hidden="true">★</span>Long selected label</SelectItem>
        <SelectItem value="gamma">Another long option</SelectItem>
        <SelectScrollDownButton>▼</SelectScrollDownButton>
      </SelectContent>
    </Select>
  </section>
  <script>
    const root = document.querySelector("[data-sw-select]");
    window.__selectAlignmentChanges = 0;
    root?.addEventListener("starwind:value-change", () => window.__selectAlignmentChanges++);
  </script>
</body></html>`,
        exports: [
          "Select",
          "SelectContent",
          "SelectItem",
          "SelectScrollDownButton",
          "SelectScrollUpButton",
          "SelectTrigger",
          "SelectValue",
        ],
        assertions: [
          "logical-selected-text-edges",
          "live-owner-and-surface-direction",
          "physical-clamp-and-touch-fallback",
        ],
      },
    },
  },
];

type Alignment = {
  direction: string;
  side: string | null;
  valueEdge: number;
  textEdge: number;
  popupLeft: number;
  popupRight: number;
  selected: string | null;
  changes: number;
};

type BrowserWindow = Window & { __selectAlignmentChanges?: number };

async function capture(page: Parameters<DirectionExpectation["run"]>[0]): Promise<Alignment> {
  return page.evaluate(() => {
    const value = document.querySelector<HTMLElement>("#alignment-value")!;
    const text = document.querySelector<HTMLElement>(
      '[data-sw-select-item][data-value="beta"] [data-sw-select-item-text]',
    )!;
    const popup = document.querySelector<HTMLElement>("#alignment-content")!;
    const root = document.querySelector<HTMLElement>("[data-sw-select]")!;
    const direction = getComputedStyle(popup).direction;
    const valueRect = value.getBoundingClientRect();
    const textRect = text.getBoundingClientRect();
    const popupRect = popup.getBoundingClientRect();
    return {
      direction,
      side: popup.getAttribute("data-side"),
      valueEdge: direction === "rtl" ? valueRect.right : valueRect.left,
      textEdge: direction === "rtl" ? textRect.right : textRect.left,
      popupLeft: popupRect.left,
      popupRight: popupRect.right,
      selected: root.getAttribute("data-value"),
      changes: (window as BrowserWindow).__selectAlignmentChanges ?? -1,
    };
  });
}

function aligned(observation: Alignment): void {
  assert.equal(observation.side, "none");
  assert.ok(
    Math.abs(observation.valueEdge - observation.textEdge) <= 1,
    `Selected text edges differ: ${JSON.stringify(observation)}`,
  );
  assert.equal(observation.selected, "beta");
  assert.equal(observation.changes, 0);
}

export const expectations: DirectionExpectation[] = [
  {
    id: "select-alignment-styled",
    layer: "styled",
    async run(page, _target, ctx) {
      const owner = page.locator("#alignment-owner");
      const trigger = page.locator("#alignment-trigger");
      const content = page.locator("#alignment-content");
      await trigger.click();
      await content.waitFor({ state: "visible" });
      await page.waitForFunction(
        () => document.querySelector("#alignment-content")?.getAttribute("data-side") === "none",
      );
      await ctx.check("logical-selected-text-edges", async () => {
        const rtl = await capture(page);
        ctx.observe("unclampedRtl", rtl);
        assert.equal(rtl.direction, "rtl");
        aligned(rtl);
      });
      await ctx.check("live-owner-and-surface-direction", async () => {
        await owner.evaluate((element) => {
          (element as HTMLElement).dir = "ltr";
          element.dispatchEvent(new Event("starwind:direction-change", { bubbles: true }));
        });
        await page.waitForFunction(
          () => getComputedStyle(document.querySelector("#alignment-content")!).direction === "ltr",
        );
        const ltr = await capture(page);
        ctx.observe("openLtr", ltr);
        aligned(ltr);
        await content.evaluate((element) => {
          (element as HTMLElement).dir = "rtl";
          element.dispatchEvent(new Event("starwind:direction-change", { bubbles: true }));
        });
        await page.waitForFunction(
          () => getComputedStyle(document.querySelector("#alignment-content")!).direction === "rtl",
        );
        const localRtl = await capture(page);
        ctx.observe("localRtl", localRtl);
        aligned(localRtl);
        await content.evaluate((element) => {
          element.removeAttribute("dir");
          element.dispatchEvent(new Event("starwind:direction-change", { bubbles: true }));
        });
        await page.waitForFunction(
          () => getComputedStyle(document.querySelector("#alignment-content")!).direction === "ltr",
        );
        aligned(await capture(page));
      });
      await ctx.check("physical-clamp-and-touch-fallback", async () => {
        await owner.evaluate((element) => {
          (element as HTMLElement).style.left = `${window.innerWidth - 188}px`;
          (element as HTMLElement).dir = "rtl";
          element.dispatchEvent(new Event("starwind:direction-change", { bubbles: true }));
        });
        await page.waitForTimeout(50);
        const clamped = await capture(page);
        ctx.observe("clampedRtl", clamped);
        assert.ok(clamped.popupLeft >= 0, JSON.stringify(clamped));
        assert.ok(clamped.popupRight <= page.viewportSize()!.width, JSON.stringify(clamped));
        assert.equal(clamped.selected, "beta");
        assert.equal(clamped.changes, 0);

        await page.keyboard.press("Escape");
        await waitHidden(content);
        await owner.evaluate((element) => ((element as HTMLElement).style.left = "16px"));
        await trigger.dispatchEvent("pointerdown", { pointerType: "touch", button: 0 });
        await trigger.dispatchEvent("click");
        await content.waitFor({ state: "visible" });
        await page.waitForTimeout(50);
        const fallback = await capture(page);
        ctx.observe("touchFallback", fallback);
        assert.notEqual(fallback.side, "none");
        assert.ok(fallback.popupLeft < page.viewportSize()!.width / 2, JSON.stringify(fallback));
        assert.ok(fallback.popupLeft >= 0 && fallback.popupRight <= page.viewportSize()!.width);
        assert.equal(fallback.selected, "beta");
        assert.equal(fallback.changes, 0);
      });
    },
  },
];
