import assert from "node:assert/strict";

import type { DirectionCase, DirectionExpectation } from "../../inventory.js";

type CollectionKeysResult = {
  baseline: { value: string | string[]; x: number };
  rtlRight: { value: string | null; x: number };
  rtlLeft: { value: string | null; x: number };
  afterRtl: string | string[];
  ltrBase: number;
  ltrRight: { value: string | null; x: number };
  repeatRight: { value: string | null; x: number };
  changes: number;
  indicatorLeft: number | null;
  expectedLeft: number | null;
  order: Array<string | null>;
};

const definitions = [
  {
    family: "tabs",
    factory: "createTabs",
    markup: `<div data-sw-tabs data-default-value="middle"><div data-sw-tabs-list style="display:flex;gap:8px;position:relative"><button data-sw-tabs-tab data-value="first">First</button><button data-sw-tabs-tab data-value="middle">Middle</button><button data-sw-tabs-tab data-value="last">Last</button><span data-sw-tabs-indicator></span></div><div data-sw-tabs-panel data-value="first">First</div><div data-sw-tabs-panel data-value="middle">Middle</div><div data-sw-tabs-panel data-value="last">Last</div></div>`,
    item: "[data-sw-tabs-tab]",
  },
  {
    family: "toggle-group",
    factory: "createToggleGroup",
    markup: `<div data-sw-toggle-group data-default-value='["middle"]' style="display:flex;gap:8px"><button data-sw-toggle data-value="first">First</button><button data-sw-toggle data-value="middle">Middle</button><button data-sw-toggle data-value="last">Last</button></div>`,
    item: "[data-sw-toggle]",
  },
  {
    family: "radio-group",
    factory: "createRadioGroup",
    markup: `<div data-sw-radio-group data-orientation="horizontal" data-default-value="middle" data-name="collection" style="display:flex;gap:8px"><button type="button" data-sw-radio data-value="first">First<input data-sw-radio-input /></button><button type="button" data-sw-radio data-value="middle">Middle<input data-sw-radio-input /></button><button type="button" data-sw-radio data-value="last">Last<input data-sw-radio-input /></button></div>`,
    item: "[data-sw-radio]",
  },
] as const;

export const cases: DirectionCase[] = definitions.map(({ family, factory, markup }) => ({
  id: `collection-keys-${family}`,
  row: `runtime:${family}`,
  acceptance: ["SPEC-AC-04", "SPEC-AC-05", "SPEC-AC-09"],
  fixtures: {
    astro: {
      source: `---\n---\n<html dir="ltr"><body><main dir="rtl">${markup}</main><script>import { ${factory} } from "@starwind-ui/runtime/${family}"; const root = document.querySelector('[data-sw-${family}]'); window.__collection = { root, instance: ${factory}(root) };</script></body></html>`,
      exports: [],
      assertions: ["spatial-keys-and-live-flips"],
    },
  },
}));

export const expectations: DirectionExpectation[] = definitions.map(({ family, item }) => ({
  id: `collection-keys-${family}`,
  layer: "raw-html",
  async run(page, _target, ctx) {
    await page.waitForFunction(() => Boolean((window as any).__collection));
    await ctx.check("spatial-keys-and-live-flips", async () => {
      const result = await page.evaluate<CollectionKeysResult>(`(async () => {
        const { root, instance } = window.__collection;
        const scope = root.parentElement;
        const items = Array.from(root.querySelectorAll(${JSON.stringify(item)}));
        const middle = items[1];
        const x = (element) => element.getBoundingClientRect().left;
        const changes = [];
        root.addEventListener("starwind:value-change", () => changes.push("change"));
        const press = (element, key) => {
          if (${JSON.stringify(family)} === "radio-group") instance.setValue("middle", { emit: false });
          element.focus();
          element.dispatchEvent(new KeyboardEvent("keydown", { bubbles: true, cancelable: true, key }));
          return { value: document.activeElement.getAttribute("data-value"), x: x(document.activeElement) };
        };
        const baseline = { value: instance.getValue(), x: x(middle) };
        const rtlRight = press(middle, "ArrowRight");
        const rtlLeft = press(middle, "ArrowLeft");
        const afterRtl = instance.getValue();
        scope.dir = "ltr";
        document.dispatchEvent(new Event("starwind:direction-change"));
        await new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(() => resolve())));
        const ltrBase = x(middle);
        const ltrRight = press(middle, "ArrowRight");
        scope.dir = "rtl";
        document.dispatchEvent(new Event("starwind:direction-change"));
        await new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(() => resolve())));
        const repeatRight = press(middle, "ArrowRight");
        const indicator = root.querySelector("[data-sw-tabs-indicator]");
        const list = root.querySelector("[data-sw-tabs-list]");
        const indicatorLeft = indicator ? Number.parseFloat(indicator.style.getPropertyValue("--active-tab-left")) : null;
        const expectedLeft = indicator && list ? middle.getBoundingClientRect().left - list.getBoundingClientRect().left - list.clientLeft : null;
        return { baseline, rtlRight, rtlLeft, afterRtl, ltrBase, ltrRight, repeatRight, changes: changes.length, indicatorLeft, expectedLeft, order: items.map((element) => element.getAttribute("data-value")) };
      })()`);
      ctx.observe("collectionKeys", result);
      assert(result.rtlRight.x > result.baseline.x, "ArrowRight moves to larger physical x in RTL");
      assert(result.rtlLeft.x < result.baseline.x, "ArrowLeft moves to smaller physical x in RTL");
      assert(result.ltrRight.x > result.ltrBase, "ArrowRight moves to larger physical x in LTR");
      assert(result.repeatRight.x > result.baseline.x, "repeated flip restores RTL keys");
      assert.deepEqual(result.order, ["first", "middle", "last"]);
      if (family === "radio-group") {
        assert.equal(result.changes, 4);
      } else {
        assert.equal(result.changes, 0);
        assert.deepEqual(result.afterRtl, family === "tabs" ? "middle" : ["middle"]);
      }
      if (family === "tabs") {
        assert(result.indicatorLeft !== null && result.expectedLeft !== null);
        assert(
          Math.abs(result.indicatorLeft - result.expectedLeft) < 1,
          "indicator retains physical left geometry",
        );
      }
    });
  },
}));
