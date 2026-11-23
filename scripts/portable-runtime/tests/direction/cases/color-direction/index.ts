import assert from "node:assert/strict";

import type { DirectionCase, DirectionExpectation } from "../../inventory.js";

const root = (
  id: string,
) => `<div data-sw-color-picker data-case-root="${id}" data-value="hsb(0, 0%, 100%)" data-name="accent">
  <span data-sw-color-picker-label>Color</span>
  <div data-sw-color-picker-area style="width:100px;height:100px">
    <span data-sw-color-picker-area-thumb></span>
    <input data-sw-color-picker-area-input data-axis="x" />
    <input data-sw-color-picker-area-input data-axis="y" />
  </div>
  <input type="hidden" data-sw-color-picker-hidden-input />
</div>`;

export const cases: DirectionCase[] = [
  {
    id: "color-direction-runtime",
    row: "runtime:color-picker",
    acceptance: ["SPEC-AC-03", "SPEC-AC-04", "SPEC-AC-09"],
    physicalExceptions: ["Exposed color CSS variables retain their physical values."],
    rawEntrypoints: ["factory", "initStarwind"],
    fixtures: {
      astro: {
        source: `---\n---\n<html dir="ltr"><body>
  <div data-direction-scope="ordinary-rtl" data-color-scope dir="ltr">
    <form id="color-form">${root("factory")}</form>
    <section data-auto-scope>${root("auto")}</section>
  </div>
  <script>
    import { createColorPicker } from "@starwind-ui/runtime/color-picker";
    import { initStarwind } from "@starwind-ui/runtime/init-starwind";
    const factory = createColorPicker(document.querySelector('[data-case-root="factory"]'));
    const autoReady = Boolean(initStarwind(document.querySelector('[data-auto-scope]')));
    const factoryRoot = document.querySelector('[data-case-root="factory"]');
    const counts = { changes: 0, commits: 0 };
    factoryRoot.addEventListener("starwind:value-change", () => counts.changes++);
    factoryRoot.addEventListener("starwind:value-committed", () => counts.commits++);
    window.__colorDirection = { factory, autoReady, counts };
  </script>
</body></html>`,
        exports: [],
        assertions: [
          "raw-entrypoints-follow-live-scope",
          "same-value-authored-and-option-clear",
          "drag-flip-rolls-back-form-without-commit",
        ],
      },
    },
  },
];

type Picker = {
  getValueAsString(): string;
  setOptions(options: { dir: "ltr" | "rtl" | null }): void;
  destroy(): void;
};
type BrowserWindow = Window & {
  __colorDirection?: {
    factory: Picker;
    autoReady: boolean;
    counts: { changes: number; commits: number };
  };
};

export const expectations: DirectionExpectation[] = [
  {
    id: "color-direction-runtime",
    layer: "raw-html",
    async run(page, _target, ctx) {
      await page.waitForFunction(() => Boolean((window as BrowserWindow).__colorDirection));
      const scope = page.locator("[data-color-scope]");
      const factory = page.locator('[data-case-root="factory"]');
      const auto = page.locator('[data-case-root="auto"]');
      await ctx.check("raw-entrypoints-follow-live-scope", async () => {
        const ready = await page.evaluate(
          () => (window as BrowserWindow).__colorDirection?.autoReady,
        );
        assert.equal(ready, true);
        await scope.evaluate((element) => {
          (element as HTMLElement).dir = "rtl";
          element.dispatchEvent(new Event("starwind:direction-change", { bubbles: true }));
        });
        await page.waitForFunction(() =>
          [...document.querySelectorAll<HTMLElement>("[data-case-root]")].every(
            (element) => element.getAttribute("dir") === "rtl",
          ),
        );
        const directions = await Promise.all(
          [factory, auto].map((locator) =>
            locator.evaluate((element) => ({
              attribute: element.getAttribute("dir"),
              computed: getComputedStyle(element).direction,
            })),
          ),
        );
        ctx.observe("rawDirections", directions);
        assert.deepEqual(directions, [
          { attribute: "rtl", computed: "rtl" },
          { attribute: "rtl", computed: "rtl" },
        ]);
      });
      await ctx.check("same-value-authored-and-option-clear", async () => {
        // With no observer, a same-value root write reads as the Runtime projection.
        await page.evaluate(() => {
          const root = document.querySelector<HTMLElement>('[data-case-root="factory"]')!;
          root.setAttribute("dir", "rtl");
          document.querySelector<HTMLElement>("[data-color-scope]")!.dir = "ltr";
          document.dispatchEvent(new Event("starwind:direction-change"));
        });
        await page.waitForFunction(
          () => document.querySelector('[data-case-root="auto"]')?.getAttribute("dir") === "ltr",
        );
        assert.equal(await factory.getAttribute("dir"), "ltr");
        await factory.evaluate((element) => {
          element.setAttribute("dir", "rtl");
          document.dispatchEvent(new Event("starwind:direction-change"));
        });
        assert.equal(await factory.getAttribute("dir"), "rtl");
        await factory.evaluate((element) => {
          element.removeAttribute("dir");
          document.dispatchEvent(new Event("starwind:direction-change"));
        });
        await page.waitForFunction(
          () => document.querySelector('[data-case-root="factory"]')?.getAttribute("dir") === "ltr",
        );
        await page.evaluate(() => {
          const { factory } = (window as BrowserWindow).__colorDirection!;
          factory.setOptions({ dir: "rtl" });
        });
        assert.equal(await factory.getAttribute("dir"), "rtl");
        await page.evaluate(() => {
          const { factory } = (window as BrowserWindow).__colorDirection!;
          factory.setOptions({ dir: null });
        });
        assert.equal(await factory.getAttribute("dir"), "ltr");
        ctx.observe("authoredAndCleared", { authored: "rtl", inherited: "ltr" });
      });
      await ctx.check("drag-flip-rolls-back-form-without-commit", async () => {
        const baseline = await page.evaluate(() => {
          const session = (window as BrowserWindow).__colorDirection!;
          const area = document.querySelector<HTMLElement>(
            '[data-case-root="factory"] [data-sw-color-picker-area]',
          )!;
          const bounds = area.getBoundingClientRect();
          const before = session.factory.getValueAsString();
          area.dispatchEvent(
            new PointerEvent("pointerdown", {
              bubbles: true,
              button: 0,
              buttons: 1,
              pointerId: 16,
              clientX: bounds.left + bounds.width * 0.8,
              clientY: bounds.top + bounds.height * 0.5,
            }),
          );
          const result = {
            before,
            proposal: session.factory.getValueAsString(),
          };
          document.querySelector<HTMLElement>("[data-color-scope]")!.dir = "rtl";
          document.dispatchEvent(new Event("starwind:direction-change"));
          return result;
        });
        await page.waitForFunction(
          () => document.querySelector('[data-case-root="factory"]')?.getAttribute("dir") === "rtl",
        );
        const result = await page.evaluate(() => {
          const session = (window as BrowserWindow).__colorDirection!;
          document.dispatchEvent(new PointerEvent("pointerup", { pointerId: 16 }));
          const root = document.querySelector<HTMLElement>('[data-case-root="factory"]')!;
          return {
            value: session.factory.getValueAsString(),
            formValue: new FormData(document.querySelector<HTMLFormElement>("#color-form")!).get(
              "accent",
            ),
            dragging: root.hasAttribute("data-dragging"),
            counts: session.counts,
          };
        });
        ctx.observe("dragFlip", { baseline, result });
        assert.notEqual(baseline.proposal, baseline.before);
        assert.equal(result.value, baseline.before);
        assert.equal(result.formValue, baseline.before);
        assert.equal(result.dragging, false);
        assert.deepEqual(result.counts, { changes: 1, commits: 0 });
      });
      await page.evaluate(() => (window as BrowserWindow).__colorDirection?.factory.destroy());
    },
  },
];
