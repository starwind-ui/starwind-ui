import assert from "node:assert/strict";
import path from "node:path";

import type { DirectionCase, DirectionExpectation } from "../../inventory.js";
import { ROOT } from "../../inventory.js";

const source = JSON.stringify(path.join(ROOT, "packages/runtime/src/components/slider/slider.ts"));

export const cases: DirectionCase[] = [
  {
    id: "slider-mapping-runtime",
    row: "runtime:slider",
    acceptance: ["SPEC-AC-04", "SPEC-AC-07", "SPEC-AC-13"],
    fixtures: {
      astro: {
        source: `---\n---\n<html><body><main id="fixture"></main><script>import { createSlider } from ${source}; window.__createSlider = createSlider;</script></body></html>`,
        exports: [],
        assertions: ["pointer-and-range", "live-direction-cancel", "vertical-key-and-step"],
      },
    },
    physicalExceptions: ["Vertical values rise from the bottom edge."],
  },
];

export const expectations: DirectionExpectation[] = [
  {
    id: "slider-mapping-runtime",
    layer: "raw-html",
    async run(page, _target, ctx) {
      await page.waitForFunction(() => Boolean((window as any).__createSlider));
      await ctx.check("pointer-and-range", async () => {
        const result = await page.evaluate(() => {
          const mount = document.querySelector("#fixture")!;
          const values: number[] = [];
          for (const dir of ["ltr", "rtl"]) {
            const root = document.createElement("div");
            root.dir = dir;
            root.setAttribute("data-sw-slider", "");
            root.setAttribute("data-min", "0");
            root.setAttribute("data-max", "100");
            root.setAttribute("data-step", "1");
            root.innerHTML = `<div data-sw-slider-control style="width:100px;height:10px"><div data-sw-slider-track><div data-sw-slider-indicator></div></div><div data-sw-slider-thumb><input data-sw-slider-input></div></div>`;
            mount.append(root);
            const slider = (window as any).__createSlider(root, { defaultValue: 50 });
            const control = root.querySelector<HTMLElement>("[data-sw-slider-control]")!;
            const bounds = control.getBoundingClientRect();
            control.dispatchEvent(
              new PointerEvent("pointerdown", {
                bubbles: true,
                button: 0,
                buttons: 1,
                clientX: bounds.left + bounds.width * 0.1,
                pointerId: 1,
              }),
            );
            document.dispatchEvent(new PointerEvent("pointerup", { pointerId: 1 }));
            values.push(slider.getValue());
            slider.destroy();
            root.remove();
          }
          return values;
        });
        ctx.observe("tenPercentPointerValues", result);
        assert.deepEqual(result, [10, 90]);
      });
      await ctx.check("live-direction-cancel", async () => {
        await page.evaluate(() => {
          const mount = document.querySelector("#fixture")!;
          const root = document.createElement("div");
          root.dir = "ltr";
          root.setAttribute("data-sw-slider", "");
          root.setAttribute("data-min", "0");
          root.setAttribute("data-max", "100");
          root.innerHTML = `<div data-sw-slider-control style="width:100px;height:10px"><div data-sw-slider-track><div data-sw-slider-indicator></div></div><div data-sw-slider-thumb><input data-sw-slider-input></div></div>`;
          mount.append(root);
          const slider = (window as any).__createSlider(root, {
            defaultValue: 25,
          });
          (window as any).__sliderSession = { slider, root, commits: 0 };
          slider.subscribe("valueCommitted", () => (window as any).__sliderSession.commits++);
          const control = root.querySelector<HTMLElement>("[data-sw-slider-control]")!;
          const x = control.getBoundingClientRect().left + 40;
          control.dispatchEvent(
            new PointerEvent("pointerdown", {
              bubbles: true,
              button: 0,
              buttons: 1,
              clientX: x,
              pointerId: 2,
            }),
          );
          root.dir = "rtl";
        });
        await page.waitForTimeout(80);
        const result = await page.evaluate(() => {
          const { slider, root, commits } = (window as any).__sliderSession;
          document.dispatchEvent(new PointerEvent("pointerup", { pointerId: 2 }));
          const result = {
            value: slider.getValue(),
            dragging: root.hasAttribute("data-dragging"),
            commits,
          };
          slider.destroy();
          root.remove();
          return result;
        });
        ctx.observe("directionDragCancel", result);
        assert.deepEqual(result, { value: 40, dragging: false, commits: 0 });
      });
      await ctx.check("vertical-key-and-step", async () => {
        const result = await page.evaluate(() => {
          const root = document.createElement("div");
          root.dir = "rtl";
          root.setAttribute("data-sw-slider", "");
          root.setAttribute("data-min", "0");
          root.setAttribute("data-max", "100");
          root.innerHTML = `<div data-sw-slider-control style="width:100px;height:100px"><div data-sw-slider-track><div data-sw-slider-indicator></div></div><div data-sw-slider-thumb><input data-sw-slider-input></div></div>`;
          document.querySelector("#fixture")!.append(root);
          const slider = (window as any).__createSlider(root, {
            defaultValue: 50,
            orientation: "vertical",
            step: 5,
          });
          const thumb = root.querySelector<HTMLElement>("[data-sw-slider-thumb]")!;
          thumb.dispatchEvent(new KeyboardEvent("keydown", { bubbles: true, key: "ArrowUp" }));
          const up = slider.getValue();
          thumb.dispatchEvent(new KeyboardEvent("keydown", { bubbles: true, key: "Home" }));
          const home = slider.getValue();
          slider.destroy();
          root.remove();
          return { up, home };
        });
        ctx.observe("verticalKeys", result);
        assert.deepEqual(result, { up: 55, home: 0 });
      });
    },
  },
];
