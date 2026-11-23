import assert from "node:assert/strict";
import { createRequire } from "node:module";
import path from "node:path";
import type { Page } from "playwright";
import { parseColor } from "../../../../../../packages/runtime/src/components/color-picker/color-picker.js";
import {
  type DirectionCase,
  type DirectionExpectation,
  ROOT,
  TARGETS,
  type Target,
} from "../../inventory.js";
import { FIRST_PAINT_PARITY, withFirstPaintParity } from "../../paint-parity.js";
import { waitHidden } from "../../waits.js";

const sharp = createRequire(path.join(ROOT, "apps/demo/package.json"))("sharp");
const channels = [
  "hue",
  "saturation",
  "brightness",
  "lightness",
  "red",
  "green",
  "blue",
  "alpha",
] as const;
const interior = "#4080c0";
const examples = [
  { id: "ltr", value: interior, dir: "ltr" },
  { id: "rtl", value: interior, dir: "rtl" },
  { id: "auto", value: "#00000000", dir: "rtl" },
  { id: "nested", value: "#ffffffff", dir: "ltr" },
  { id: "inner", value: "hsba(359, 100%, 100%, 1)", dir: "rtl" },
  { id: "explicit", value: "#4080c080", dir: "rtl" },
] as const;
const exportsUsed = [
  "ColorPicker",
  "ColorPickerArea",
  "ColorPickerChannelSlider",
  "ColorPickerContent",
  "ColorPickerTrigger",
];
const checks = [
  "disabled-server-paint",
  "delayed-first-paint",
  "hydrated-paint",
  "live-and-cleared-direction",
  "channel-and-area-interaction",
  "portalled-direction",
  FIRST_PAINT_PARITY,
];

function fixture(target: Target) {
  const imports = `import { ${exportsUsed.join(",")} } from "@direction/styled-${target}/color-picker"; import "@direction/sheet";`;
  const sections = examples.map(({ id, value }) => {
    const initial = target === "astro" ? "initial={initial}" : "";
    const sliders = (orientation: string) =>
      channels
        .map(
          (channel) =>
            `<ColorPickerChannelSlider ${initial} orientation="${orientation}" channel="${channel}" />`,
        )
        .join("");
    const parts = `<div><ColorPickerArea ${target === "astro" ? "initial={initial.area()}" : ""} />${sliders("horizontal")}<div class="flex justify-between">${sliders("vertical")}</div></div>`;
    const direction =
      id === "explicit"
        ? target === "astro"
          ? 'dir="rtl"'
          : target === "vue"
            ? ':dir="direction"'
            : "dir={direction}"
        : "";
    const picker = `<ColorPicker inline defaultValue="${value}" ${direction} data-paint="${id}" class="w-48">${target === "astro" ? `{(initial) => (${parts})}` : parts}</ColorPicker>`;
    if (id === "nested") return `<div dir="rtl"><div dir="ltr">${picker}</div></div>`;
    if (id === "inner") return `<div dir="ltr"><div dir="rtl">${picker}</div></div>`;
    if (id === "auto") return `<div dir="rtl"><div dir="auto">العربية${picker}</div></div>`;
    return `<div data-owner="${id}" dir="${id === "rtl" ? "rtl" : "ltr"}">${picker}</div>`;
  });
  const button =
    target === "astro"
      ? ""
      : target === "vue"
        ? '@click="direction=undefined"'
        : target === "react"
          ? "onClick={() => setDirection(undefined)}"
          : "onclick={() => direction=undefined}";
  const popupDir =
    target === "astro" ? 'dir="rtl"' : target === "vue" ? ':dir="direction"' : "dir={direction}";
  const popup = `<section data-popup-scope="" dir="ltr"><ColorPicker ${popupDir} data-popup-picker="" defaultValue="#4080c0"><ColorPickerTrigger aria-label="Open spectrum">Open spectrum</ColorPickerTrigger><ColorPickerContent aria-label="Spectrum"><ColorPickerArea/><ColorPickerChannelSlider channel="red"/></ColorPickerContent></ColorPicker></section>`;
  const stamp = `function author(root) { if (root && !root.hasAttribute("data-wrote")) { root.setAttribute("data-wrote",root.hasAttribute("data-sw-color-picker-initial-owned") ? "before-connect" : "after-connect"); root.setAttribute("dir","rtl"); } }`;
  const authored =
    target === "vue"
      ? `<ColorPicker inline ${popupDir} data-authored=""><span @vue:mounted="vnode => author(vnode.el.closest('[data-authored]'))">Seed</span></ColorPicker>`
      : `<ColorPicker inline ${popupDir} data-authored="" ${target === "astro" ? "" : "ref={author}"}><span>Seed</span></ColorPicker>`;
  const body = `<main data-direction-scope="paint" class="p-4"><div data-pair="" class="flex w-fit gap-6">${sections.slice(0, 2).join("")}</div><button id="clear" ${button}>Clear direction</button>${sections.slice(2).join("")}${popup}<section dir="ltr">${authored}</section></main>`;
  if (target === "astro")
    return `---\n${imports}\n---\n<html><head><meta charset="utf-8"/><title>Color paint</title></head><body>${body}<script>document.querySelector("#clear").addEventListener("click", () => { document.querySelectorAll('[data-paint="explicit"], [data-popup-picker]').forEach(root=>root.removeAttribute("dir")); document.dispatchEvent(new Event("starwind:direction-change")); });</script></body></html>`;
  if (target === "react")
    return `${imports} ${stamp} import {useState} from "react"; export default function Page() {const [direction,setDirection]=useState<"rtl"|undefined>("rtl"); return (${body.replaceAll("class=", "className=")});}`;
  if (target === "vue")
    return `<script setup lang="ts">${imports} ${stamp} import {ref} from "vue"; const direction=ref<"rtl"|undefined>("rtl");</script><template>${body}</template>`;
  return `<script lang="ts">${imports} ${stamp} let direction=$state<"rtl"|undefined>("rtl");</script>${body}`;
}

export const cases: DirectionCase[] = [
  {
    id: "color-paint-styled",
    row: "color-picker",
    acceptance: ["SPEC-AC-02", "SPEC-AC-03", "SPEC-AC-09", "SPEC-AC-14"],
    fixtures: Object.fromEntries(
      TARGETS.map((t) => [
        t,
        { source: fixture(t), ssr: t !== "astro", exports: exportsUsed, assertions: checks },
      ]),
    ),
    physicalExceptions: [
      "Vertical channel values increase from bottom to top. Area brightness increases toward the top.",
    ],
  },
];

async function geometry(page: Page) {
  return page.locator("[data-paint]").evaluateAll((roots) =>
    roots.map((root) => {
      const area = root.querySelector<HTMLElement>("[data-slot=color-picker-area]")!;
      const areaBox = area.getBoundingClientRect();
      const thumb = area.querySelector<HTMLElement>("[data-slot=color-picker-area-thumb]")!;
      const areaThumb = thumb.getBoundingClientRect();
      const gradient = getComputedStyle(
        area.querySelector("[data-slot=color-picker-area-background]")!,
      );
      return {
        id: root.getAttribute("data-paint"),
        dir: getComputedStyle(root).direction,
        authored: root.getAttribute("dir"),
        color: root.getAttribute("data-value"),
        area: {
          x: areaThumb.x + areaThumb.width / 2 - areaBox.left,
          y: areaThumb.y + areaThumb.height / 2 - areaBox.top,
          w: areaBox.width,
          h: areaBox.height,
          xSeed: thumb.style.getPropertyValue("--sw-color-picker-area-x"),
          ySeed: thumb.style.getPropertyValue("--sw-color-picker-area-y"),
          gradient: gradient.backgroundImage,
          hue: gradient.backgroundColor,
        },
        sliders: Array.from(
          root.querySelectorAll<HTMLElement>("[data-slot=color-picker-channel-slider]"),
          (slider) => {
            const box = slider.getBoundingClientRect();
            const thumb = slider
              .querySelector("[data-slot=color-picker-channel-slider-thumb]")!
              .getBoundingClientRect();
            const input = slider.querySelector<HTMLInputElement>("input")!;
            const style = getComputedStyle(
              slider.querySelector("[data-slot=color-picker-channel-slider-track]")!,
            );
            return {
              channel: slider.dataset.channel,
              orientation: slider.dataset.orientation,
              seed: slider.style.getPropertyValue("--sw-color-picker-channel-position"),
              value: Number(input.getAttribute("aria-valuenow")),
              max: Number(input.max),
              x: thumb.x + thumb.width / 2 - box.x,
              y: thumb.y + thumb.height / 2 - box.y,
              w: box.width,
              h: box.height,
              stops: style.backgroundImage,
              gradientDirection: style
                .getPropertyValue("--sw-color-picker-channel-gradient-direction")
                .trim(),
            };
          },
        ),
      };
    }),
  );
}
async function checkPaint(page: Page, overrides: Record<string, string> = {}, server = false) {
  const rows = await geometry(page);
  assert.equal(rows.length, examples.length);
  for (const [i, row] of rows.entries()) {
    const example = examples[i]!;
    assert.equal(row.id, example.id);
    const dir = overrides[example.id] ?? example.dir;
    assert.equal(row.dir, dir, example.id);
    if (server) assert.equal(row.authored, example.id === "explicit" ? "rtl" : null);
    const color = parseColor(example.value)!;
    const expected = {
      ...color.rgb,
      ...color.hsb,
      lightness: color.hsl.lightness,
      alpha: color.alpha * 100,
    };
    const close = (a: number, b: number, why: string) =>
      assert(Math.abs(a - b) <= 1.001, `${example.id} ${why}: ${a} versus ${b}`);
    const area = row.area;
    const x = Math.round(color.hsb.saturation) / 100,
      y = 1 - Math.round(color.hsb.brightness) / 100;
    assert(area.w > 50 && area.h > 50);
    close(area.x, area.w * (dir === "rtl" ? 1 - x : x), "area horizontal");
    close(area.y, area.h * y, "area vertical");
    assert.equal(Number.parseFloat(area.xSeed), x * 100);
    assert(Math.abs(Number.parseFloat(area.ySeed) - y * 100) < 0.001);
    assert.match(area.gradient, /linear-gradient/);
    assert.equal(row.sliders.length, channels.length * 2);
    for (const s of row.sliders) {
      const channel = s.channel as (typeof channels)[number];
      const value = Math.min(s.max, Math.round(expected[channel]));
      assert.equal(s.value, value, `${example.id} ${channel} initial value`);
      const ratio = value / s.max;
      assert(
        Math.abs(Number.parseFloat(s.seed) - ratio * 100) < 0.001,
        `${example.id} ${channel} missing numeric seed`,
      );
      assert.match(s.stops, /linear-gradient/);
      const vertical = s.orientation === "vertical";
      assert.equal(
        s.gradientDirection,
        vertical ? "to top" : dir === "rtl" ? "to left" : "to right",
        channel,
      );
      close(s.x, s.w * (vertical ? 0.5 : dir === "rtl" ? 1 - ratio : ratio), `${channel} x`);
      close(s.y, s.h * (vertical ? 1 - ratio : 0.5), `${channel} y`);
    }
  }
  return rows;
}

async function sampleGradients(page: Page) {
  const pair = page.locator("[data-pair]");
  const controls = await pair.evaluate((el) => {
    const pairBox = el.getBoundingClientRect();
    return Array.from(el.querySelectorAll("[data-paint]"), (root) =>
      Array.from(
        root.querySelectorAll(
          "[data-slot=color-picker-area-background], [data-slot=color-picker-channel-slider-track]",
        ),
        (track) => {
          const b = track.getBoundingClientRect(),
            host = track.parentElement!;
          return {
            channel: host.dataset.channel ?? "area",
            orientation: host.dataset.orientation ?? "horizontal",
            left: b.left - pairBox.left,
            top: b.top - pairBox.top,
            width: b.width,
            height: b.height,
          };
        },
      ),
    );
  });
  // Sample the gradient plane independently of the draggable thumb and alpha checkerboard.
  const png = await pair.screenshot({
    style:
      "[data-slot=color-picker-area-thumb],[data-slot=color-picker-channel-slider-thumb],[data-slot=color-picker-transparency-grid]{visibility:hidden!important}",
  });
  const { data, info } = await sharp(png).removeAlpha().raw().toBuffer({ resolveWithObject: true });
  const pixels = controls.map((group, i) =>
    group.map((c) => {
      const vertical = c.orientation === "vertical";
      const samples = [0.06, 0.25, 0.5, 0.75, 0.94].map((ratio) => {
        const x = Math.floor(c.left + c.width * (vertical ? 0.5 : i === 1 ? 1 - ratio : ratio));
        const y = Math.floor(
          c.top + c.height * (vertical ? 1 - ratio : c.channel === "area" ? 0.23 : 0.5),
        );
        const start = (y * info.width + x) * info.channels;
        return Array.from(data.subarray(start, start + 3)) as number[];
      });
      return { channel: c.channel, orientation: c.orientation, samples };
    }),
  );
  for (const [j, ltr] of pixels[0]!.entries()) {
    const rtl = pixels[1]![j]!;
    for (const [k, sample] of ltr.samples.entries()) {
      const mirrored = rtl.samples[k]!;
      assert(
        sample.every((v, i) => Math.abs(mirrored[i]! - v) <= 12),
        `${ltr.channel}/${ltr.orientation} gradient pixel ${k}: ${sample} vs ${mirrored}`,
      );
    }
    assert(
      ltr.samples.some((s) => s.some((v, i) => Math.abs(v - ltr.samples[0]![i]!) > 35)),
      `${ltr.channel} gradient lacks color change`,
    );
    if (["red", "green", "blue"].includes(ltr.channel)) {
      const i = ["red", "green", "blue"].indexOf(ltr.channel);
      assert(
        ltr.samples[0]![i]! < 75 && ltr.samples.at(-1)![i]! > 210,
        `${ltr.channel} stop order: ${ltr.samples[0]} to ${ltr.samples.at(-1)}`,
      );
    }
    if (ltr.channel === "brightness" || ltr.channel === "lightness")
      assert(
        ltr.samples[0]!.every((v) => v < 55),
        `${ltr.channel} starts at black`,
      );
  }
  return pixels;
}

const paintExpectations: DirectionExpectation[] = [
  {
    id: "color-paint-styled",
    layer: "styled",
    async run(page, target, ctx) {
      const off = await page.context().browser()!.newContext({ javaScriptEnabled: false });
      try {
        await ctx.check(checks[0]!, async () => {
          const p = await off.newPage();
          const res = await p.goto(page.url());
          assert((await res!.text()).includes("--sw-color-picker-area-x"));
          ctx.observe("disabledPaint", await checkPaint(p, {}, true));
          ctx.observe("disabledGradientPixels", await sampleGradients(p));
        });
      } finally {
        await off.close();
      }
      await page.route(page.url(), async (route) => {
        const response = await route.fetch();
        await route.fulfill({
          response,
          body: (await response.text()).replaceAll(/<script\b[^>]*>/gi, (tag) =>
            tag.replace(/type="module"/, 'type="application/x-held-module"'),
          ),
        });
      });
      await page.reload();
      await page.evaluate(
        () => new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve))),
      );
      if (target === "astro")
        await page.locator("[data-authored]").evaluate((root) => {
          root.setAttribute("data-wrote", "before-connect");
          root.setAttribute("dir", "rtl");
        });
      const thumbs = await page
        .locator("[data-paint] [data-slot=color-picker-area-thumb]")
        .elementHandles();
      await ctx.check(checks[1]!, async () => {
        assert(await page.locator('script[type="application/x-held-module"]').count());
        ctx.observe("firstPaint", await checkPaint(page, {}, true));
      });
      await page.evaluate(() => {
        for (const node of document.querySelectorAll<HTMLScriptElement>(
          'script[type="application/x-held-module"]',
        )) {
          const script = document.createElement("script");
          for (const attr of node.attributes) script.setAttribute(attr.name, attr.value);
          script.type = "module";
          script.textContent = node.textContent;
          node.replaceWith(script);
        }
      });
      await ctx.check(checks[2]!, async () => {
        await page.waitForFunction(
          () => document.querySelector("[data-paint=rtl]")?.getAttribute("dir") === "rtl",
          {},
          { timeout: 5000 },
        );
        for (const thumb of thumbs)
          assert(await thumb.evaluate((el) => el.isConnected), "Hydration replaced a server thumb");
        ctx.observe("hydratedPaint", await checkPaint(page));
        ctx.observe("hydratedGradientPixels", await sampleGradients(page));
      });
      await ctx.check("portalled-direction", async () => {
        const picker = page.locator("[data-popup-picker]");
        const content = picker.locator("[data-slot=color-picker-content]");
        const trigger = picker.getByRole("button", { name: "Open spectrum" });
        await trigger.click();
        await content.waitFor({ state: "visible" });
        const read = () =>
          content.evaluate((el) => ({
            dir: getComputedStyle(el).direction,
            owner: getComputedStyle(el.closest("[data-popup-picker]")!).direction,
            gradient: getComputedStyle(
              el.querySelector("[data-slot=color-picker-channel-slider-track]")!,
            )
              .getPropertyValue("--sw-color-picker-channel-gradient-direction")
              .trim(),
          }));
        const assertDirection = async (dir: string, owner = dir) => {
          await page.evaluate(
            () =>
              new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve))),
          );
          assert.deepEqual(await read(), {
            dir,
            owner,
            gradient: dir === "rtl" ? "to left" : "to right",
          });
        };
        async function interact(dir: string) {
          const records = [];
          for (const selector of [
            "[data-slot=color-picker-area]",
            "[data-slot=color-picker-channel-slider]",
          ]) {
            const surface = content.locator(selector),
              input = surface.locator("input").first();
            const box = await surface.boundingBox();
            assert(box);
            const x = Math.round(box.x + box.width / 4);
            await page.mouse.click(x, Math.round(box.y + box.height / 2));
            const max = Number(await input.getAttribute("max"));
            const fraction = (x - box.x) / box.width;
            const value = Math.round(max * (dir === "rtl" ? 1 - fraction : fraction));
            assert.equal(
              Number(await input.getAttribute("aria-valuenow")),
              value,
              `${dir} ${selector}`,
            );
            const thumb = surface.locator(
              "[data-slot=color-picker-area-thumb],[data-slot=color-picker-channel-slider-thumb]",
            );
            const before = await thumb.boundingBox();
            assert(before);
            assert(
              Math.abs(
                before.x +
                  before.width / 2 -
                  (box.x + box.width * (dir === "rtl" ? 1 - value / max : value / max)),
              ) <= 1.001,
            );
            await input.press("ArrowRight");
            assert.equal(
              Number(await input.getAttribute("aria-valuenow")),
              value + (dir === "rtl" ? -1 : 1),
            );
            const after = await thumb.boundingBox();
            assert(after && after.x > before.x);
            records.push({
              selector,
              x,
              value,
              max,
              center: before.x + before.width / 2,
              afterArrowRight: after.x + after.width / 2,
            });
          }
          return records;
        }
        await assertDirection("rtl");
        await page.locator("#clear").evaluate((el: HTMLElement) => el.click());
        await assertDirection("ltr");
        await page.locator("[data-popup-scope]").evaluate((el) => {
          el.setAttribute("dir", "rtl");
          el.dispatchEvent(new Event("starwind:direction-change", { bubbles: true }));
        });
        await assertDirection("rtl");
        const portal = picker.locator("[data-sw-popover-portal]").first();
        await portal.evaluate((el) => {
          el.setAttribute("dir", "ltr");
          el.dispatchEvent(new Event("starwind:direction-change", { bubbles: true }));
        });
        await assertDirection("ltr", "rtl");
        await content.evaluate(async (el) => {
          await Promise.allSettled(el.getAnimations({ subtree: true }).map((a) => a.finished));
        });
        ctx.observe("localLTRSurface", await interact("ltr"));
        await portal.evaluate((el) => {
          const label = document.createElement("span");
          // Arabic text keeps dir="auto" in step with the nearest dir="rtl" attribute. The
          // `rtl` and `ltr` variants follow that attribute and do not read the text direction.
          label.textContent = "الطيف";
          el.prepend(label);
          el.setAttribute("dir", "auto");
          el.dispatchEvent(new Event("starwind:direction-change", { bubbles: true }));
        });
        await assertDirection("rtl");
        ctx.observe("localAutoSurface", await interact("rtl"));
        const start = await picker.getAttribute("data-value");
        const track = content.locator("[data-slot=color-picker-channel-slider]");
        const b = await track.boundingBox();
        assert(b);
        await page.mouse.move(b.x + b.width * 0.8, b.y + b.height / 2);
        await page.mouse.down();
        assert.notEqual(await picker.getAttribute("data-value"), start);
        // A direction flip during the drag rolls the color back.
        await portal.evaluate((el) => {
          el.setAttribute("dir", "ltr");
          el.dispatchEvent(new Event("starwind:direction-change", { bubbles: true }));
        });
        await page.mouse.up();
        assert.equal(await picker.getAttribute("data-value"), start);
        await portal.evaluate((el) => {
          el.removeAttribute("dir");
          el.dispatchEvent(new Event("starwind:direction-change", { bubbles: true }));
        });
        await assertDirection("rtl");
        // An LTR owner in the RTL wrapper is one level of mixed direction.
        await picker.evaluate((el) => {
          el.setAttribute("dir", "ltr");
          el.dispatchEvent(new Event("starwind:direction-change", { bubbles: true }));
        });
        await assertDirection("ltr");
        // Return the wrapper to LTR before the local RTL portal, so that step is also one level.
        await page.locator("[data-popup-scope]").evaluate((el) => {
          el.setAttribute("dir", "ltr");
          el.dispatchEvent(new Event("starwind:direction-change", { bubbles: true }));
        });
        await assertDirection("ltr");
        await portal.evaluate((el) => {
          el.setAttribute("dir", "rtl");
          el.dispatchEvent(new Event("starwind:direction-change", { bubbles: true }));
        });
        await assertDirection("rtl", "ltr");
        ctx.observe("localRTLSurface", await interact("rtl"));
        await page.keyboard.press("Escape");
        // Focus returns to the trigger when the exit animation ends, and that can scroll the page.
        // Wait for the close to finish so later geometry reads stay valid for pointer clicks.
        await waitHidden(content);
        ctx.observe("popupDirections", [
          "explicit RTL",
          "cleared LTR",
          "inherited RTL",
          "authored wrapper LTR",
          "authored auto RTL",
          "released RTL",
          "native root LTR",
        ]);
      });
      await ctx.check(checks[3]!, async () => {
        await page.locator("#clear").click();
        await page.evaluate(
          () =>
            new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve))),
        );
        const authored = page.locator("[data-authored]");
        assert.equal(await authored.getAttribute("data-wrote"), "before-connect");
        assert.equal(
          await authored.evaluate((el) => getComputedStyle(el).direction),
          "rtl",
          "Preserve the same-value author write across option clear",
        );
        ctx.observe("authoredBeforeConnection", await authored.getAttribute("dir"));
        ctx.observe("clearedPaint", await checkPaint(page, { explicit: "ltr" }));
        await page.locator("[data-owner=explicit]").evaluate((el) => {
          el.setAttribute("dir", "rtl");
          el.dispatchEvent(new Event("starwind:direction-change", { bubbles: true }));
        });
        await page.evaluate(
          () =>
            new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve))),
        );
        ctx.observe("changedOwner", await checkPaint(page, { explicit: "rtl" }));
      });
      await ctx.check(checks[4]!, async () => {
        const root = page.locator("[data-paint=rtl]");
        const observations = [];
        for (const selector of [
          "[data-slot=color-picker-area]",
          ...channels.map(
            (c) =>
              `[data-slot=color-picker-channel-slider][data-orientation=horizontal][data-channel=${c}]`,
          ),
        ]) {
          const host = root.locator(selector);
          await host.scrollIntoViewIfNeeded();
          const box = await host.boundingBox();
          assert(box);
          const input = host.locator("input").first();
          const thumb = host.locator(
            "[data-slot=color-picker-area-thumb],[data-slot=color-picker-channel-slider-thumb]",
          );
          for (const r of [0.1, 0.5, 0.9]) {
            const x = Math.round(box.x + box.width * r);
            await page.mouse.click(x, box.y + box.height / 2);
            const rect = await thumb.boundingBox();
            assert(rect);
            const now = Number(await input.getAttribute("aria-valuenow"));
            const max = Number(await input.getAttribute("max"));
            assert.equal(now, Math.round((1 - (x - box.x) / box.width) * max), selector);
            const expected = box.x + box.width * (1 - now / max);
            assert(Math.abs(rect.x + rect.width / 2 - expected) <= 1.001, selector);
            observations.push({
              selector,
              pointer: x,
              value: now,
              max,
              center: rect.x + rect.width / 2,
              color: await root.getAttribute("data-value"),
            });
          }
          await page.mouse.move(box.x + box.width * 0.1, box.y + box.height / 2);
          await page.mouse.down();
          await page.mouse.move(box.x + box.width * 0.75, box.y + box.height / 2, { steps: 5 });
          await page.mouse.up();
          const max = Number(await input.getAttribute("max"));
          const before = Number(await input.getAttribute("aria-valuenow"));
          assert(Math.abs(before - max * 0.25) <= 1.1, `drag ${selector}`);
          const a = await thumb.boundingBox();
          await input.press("ArrowRight");
          const b = await thumb.boundingBox();
          assert(a && b);
          assert(Number(await input.getAttribute("aria-valuenow")) < before && b.x > a.x, selector);
          await input.press("ArrowLeft");
          assert.equal(Number(await input.getAttribute("aria-valuenow")), before);
        }
        for (const channel of channels) {
          const host = root.locator(
            `[data-slot=color-picker-channel-slider][data-orientation=vertical][data-channel=${channel}]`,
          );
          await host.scrollIntoViewIfNeeded();
          const box = await host.boundingBox();
          assert(box);
          await page.mouse.click(box.x + box.width / 2, box.y + box.height * 0.25);
          const input = host.locator("input"),
            max = Number(await input.getAttribute("max"));
          const value = Number(await input.getAttribute("aria-valuenow"));
          assert(Math.abs(value / max - 0.75) < 0.015, `vertical ${channel}`);
          await input.press("ArrowUp");
          assert(Number(await input.getAttribute("aria-valuenow")) > value);
        }
        ctx.observe("rtlInteraction", observations);
      });
    },
  },
];

export const expectations = paintExpectations.map((expectation) =>
  withFirstPaintParity(expectation, "color", ["disabledPaint", "firstPaint", "hydratedPaint"]),
);
