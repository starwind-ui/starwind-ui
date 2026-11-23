import assert from "node:assert/strict";
import path from "node:path";

import type { DirectionCase, DirectionExpectation } from "../../inventory.js";
import { ROOT } from "../../inventory.js";

const carouselSource = JSON.stringify(
  path.join(ROOT, "packages/runtime/src/components/carousel/carousel.ts"),
);

export const cases: DirectionCase[] = [
  {
    id: "carousel-engine-runtime",
    row: "runtime:carousel",
    acceptance: ["SPEC-AC-04", "SPEC-AC-10"],
    fixtures: {
      astro: {
        source: `---\n---\n<html><body><div dir="rtl"><div data-sw-carousel data-opts='{"align":"start","duration":1}' style="width:300px"><div data-sw-carousel-viewport style="overflow:hidden;width:300px"><div data-sw-carousel-container style="display:flex"><div data-sw-carousel-item style="flex:0 0 300px;height:100px">One</div><div data-sw-carousel-item style="flex:0 0 300px;height:100px">Two</div><div data-sw-carousel-item style="flex:0 0 300px;height:100px">Three</div></div></div><button data-sw-carousel-previous>Previous</button><button data-sw-carousel-next>Next</button></div></div><script>import { createCarousel } from ${carouselSource}; const root = document.querySelector("[data-sw-carousel]"); const plugin = {name:"directionProbe",options:{},init(){window.__probe.inits++},destroy(){window.__probe.destroys++}}; window.__probe = {inits:0,destroys:0}; window.__carousel = createCarousel(root,{plugins:[plugin]});</script></body></html>`,
        exports: [],
        assertions: [
          "rtl-physical-keys-and-controls",
          "rtl-mouse-drag",
          "rtl-touch-drag",
          "inferred-flips-preserve-snap-and-plugin",
        ],
      },
    },
    physicalExceptions: ["Vertical controls keep their top and bottom meanings."],
  },
];

export const expectations: DirectionExpectation[] = [
  {
    id: "carousel-engine-runtime",
    layer: "raw-html",
    async run(page, _target, ctx) {
      await page.waitForFunction(() => Boolean((window as any).__carousel));
      const root = page.locator("[data-sw-carousel]");
      const first = root.locator("[data-sw-carousel-item]").first();
      const readSnap = () => page.evaluate(() => (window as any).__carousel.selectedSnap());
      const scrollTo = (index: number) =>
        page.evaluate((value) => (window as any).__carousel.scrollTo(value, true), index);

      await ctx.check("rtl-physical-keys-and-controls", async () => {
        const slides = await root
          .locator("[data-sw-carousel-item]")
          .evaluateAll((items) => items.map((item) => item.getBoundingClientRect().left));
        assert(slides[0]! > slides[1]!, "first RTL slide occupies the physical right");
        await scrollTo(1);
        const before = (await first.boundingBox())!.x;
        await root.getByRole("button", { name: "Next" }).focus();
        await page.keyboard.press("ArrowRight");
        await page.waitForTimeout(200);
        const afterRightSnap = await readSnap();
        const afterRight = (await first.boundingBox())!.x;
        await scrollTo(1);
        await root.getByRole("button", { name: "Previous" }).focus();
        await page.keyboard.press("ArrowLeft");
        await page.waitForTimeout(200);
        const afterLeftSnap = await readSnap();
        const afterLeft = (await first.boundingBox())!.x;
        ctx.observe("physicalKeys", {
          slides,
          before,
          afterRight,
          afterLeft,
          afterRightSnap,
          afterLeftSnap,
        });
        assert.equal(afterRightSnap, 0);
        assert(afterRight < before, "ArrowRight moves the RTL track to the right-hand snap");
        assert.equal(afterLeftSnap, 2);
        assert(afterLeft > before, "ArrowLeft moves the RTL track to the left-hand snap");

        await scrollTo(0);
        await root.getByRole("button", { name: "Next" }).click();
        assert.equal(await readSnap(), 1);
        await root.getByRole("button", { name: "Previous" }).click();
        assert.equal(await readSnap(), 0);
      });

      await ctx.check("rtl-mouse-drag", async () => {
        await scrollTo(0);
        await page.waitForTimeout(300);
        const before = (await first.boundingBox())!.x;
        const viewport = await root.locator("[data-sw-carousel-viewport]").boundingBox();
        assert(viewport);
        await page.mouse.move(viewport.x + viewport.width * 0.2, viewport.y + viewport.height / 2);
        await page.mouse.down();
        await page.mouse.move(viewport.x + viewport.width * 0.8, viewport.y + viewport.height / 2, {
          steps: 8,
        });
        await page.mouse.up();
        await page.waitForTimeout(500);
        const after = (await first.boundingBox())!.x;
        const snap = await readSnap();
        ctx.observe("rtlMouseDrag", { before, after, snap });
        assert.equal(snap, 1);
        assert(after > before, "dragging right reveals the next RTL slide");
      });

      await ctx.check("rtl-touch-drag", async () => {
        await scrollTo(0);
        await page.waitForTimeout(300);
        const before = (await first.boundingBox())!.x;
        const touch = async (phase: "start" | "move" | "end") =>
          page.evaluate((kind) => {
            const viewport = document.querySelector<HTMLElement>("[data-sw-carousel-viewport]")!;
            const box = viewport.getBoundingClientRect();
            const point = {
              clientX: box.left + box.width * (kind === "start" ? 0.2 : 0.8),
              clientY: box.top + box.height / 2,
            };
            const active = kind === "end" ? [] : [point];
            const event = new Event(`touch${kind}`, { bubbles: true, cancelable: true });
            Object.defineProperty(event, "touches", { value: active });
            viewport.dispatchEvent(event);
          }, phase);
        await touch("start");
        await page.waitForTimeout(30);
        await touch("move");
        await page.waitForTimeout(30);
        await touch("end");
        await page.waitForTimeout(500);
        const after = (await first.boundingBox())!.x;
        const snap = await readSnap();
        ctx.observe("rtlTouchDrag", { before, after, snap });
        assert.equal(snap, 1);
        assert(after > before, "touch dragging right reveals the next RTL slide");
      });

      await ctx.check("inferred-flips-preserve-snap-and-plugin", async () => {
        await scrollTo(1);
        const results: Array<{ direction: string; snap: number }> = [];
        for (const direction of ["ltr", "rtl", "ltr", "rtl"]) {
          await root.evaluate((element, value) => {
            element.parentElement!.setAttribute("dir", value);
            element.dispatchEvent(new Event("starwind:direction-change", { bubbles: true }));
          }, direction);
          await page.waitForTimeout(70);
          results.push(
            await page.evaluate(() => ({
              direction: (window as any).__carousel.api.internalEngine().options.direction,
              snap: (window as any).__carousel.selectedSnap(),
            })),
          );
        }
        const plugin = await page.evaluate(() => (window as any).__probe);
        ctx.observe("liveEngineDirection", { results, plugin });
        assert.deepEqual(
          results,
          ["ltr", "rtl", "ltr", "rtl"].map((direction) => ({ direction, snap: 1 })),
        );
        assert.equal(plugin.inits, 5);
        assert.equal(plugin.destroys, 4);
      });
    },
  },
];
