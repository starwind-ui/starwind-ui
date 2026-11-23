import assert from "node:assert/strict";
import type { Page } from "playwright";
import {
  type DirectionCase,
  type DirectionExpectation,
  TARGETS,
  type Target,
} from "../../inventory.js";
import { FIRST_PAINT_PARITY, withFirstPaintParity } from "../../paint-parity.js";

const examples = [
  { id: "ordinary", direction: "ltr", input: 0, percentages: [0] },
  { id: "explicit", direction: "rtl", input: 100, percentages: [100] },
  { id: "auto", direction: "rtl", input: 35, percentages: [35] },
  { id: "inherited", direction: "rtl", input: [15, 85], percentages: [15, 85] },
  { id: "nested-ltr", direction: "ltr", input: [75, 25], percentages: [25, 75] },
  { id: "nested-rtl", direction: "rtl", input: [40, 40], percentages: [40, 40] },
  { id: "vertical", direction: "rtl", input: [10, 90], percentages: [10, 90] },
  { id: "controlled", direction: "rtl", input: 65, percentages: [65] },
  { id: "offset", direction: "rtl", input: [25, 125], percentages: [25, 75] },
  { id: "snap", direction: "ltr", input: [-8, 53], percentages: [0, 55] },
];
function source(target: Target) {
  const imports = `import { Slider } from "@direction/styled-${target}/slider"; import "@direction/sheet";`;
  const sliders = examples
    .map(({ id, input }) => {
      const prop =
        target === "vue"
          ? `:default-value='${JSON.stringify(input)}' :step="5"`
          : `defaultValue={${JSON.stringify(input)}} step={5}`;
      const current =
        id === "controlled"
          ? target === "vue"
            ? ':model-value="65" :default-value="5"'
            : "value={65} defaultValue={5}"
          : prop;
      const bounds =
        id === "offset" ? (target === "vue" ? ':min="-25" :max="175"' : "min={-25} max={175}") : "";
      const dir = ["explicit", "offset", "controlled"].includes(id) ? 'dir="rtl"' : "";
      const vertical = id === "vertical" ? 'orientation="vertical"' : "";
      const container = id === "controlled" ? "section" : "form";
      const slider = `<${container} data-example="${id}" class="w-64 h-24"><Slider name="${id}" aria-label="${id}" ${dir} ${vertical} ${bounds} ${current} /></${container}>`;
      switch (id) {
        case "auto":
          return `<div dir="rtl"><section dir="auto">العربية${slider}</section></div>`;
        case "nested-ltr":
          return `<div dir="rtl"><div dir="ltr">${slider}</div></div>`;
        case "nested-rtl":
          return `<div dir="ltr"><div dir="rtl">${slider}</div></div>`;
        case "inherited":
        case "vertical":
          return `<div dir="rtl">${slider}</div>`;
        default:
          return slider;
      }
    })
    .join("");
  const body = `<main data-direction-scope="slider" class="p-8">${sliders}</main>`;
  if (target === "astro")
    return `---\n${imports}\n---\n<html><head><meta charset="utf-8" /><link rel="icon" href="data:," /><title>Slider paint</title></head><body>${body}</body></html>`;
  if (target === "react")
    return `${imports}\nexport default function Page() { return (${body.replaceAll("class=", "className=")}); }`;
  if (target === "vue")
    return `<script setup lang="ts">\n${imports}\n</script><template>${body}</template>`;
  return `<script lang="ts">\n${imports}\n</script>${body}`;
}
const assertions = [
  "server-html-no-js",
  "delayed-first-paint",
  "hydrated-paint",
  "reset-paint",
  FIRST_PAINT_PARITY,
];
export const cases: DirectionCase[] = [
  {
    id: "slider-paint-styled",
    row: "slider",
    acceptance: ["SPEC-AC-02", "SPEC-AC-03", "SPEC-AC-07", "SPEC-AC-14"],
    fixtures: Object.fromEntries(
      TARGETS.map((target) => [
        target,
        { source: source(target), ssr: target !== "astro", exports: ["Slider"], assertions },
      ]),
    ),
    physicalExceptions: ["Vertical Slider increases from the physical bottom."],
  },
];

async function measure(page: Page) {
  const rows = await page.locator("[data-example]").evaluateAll((rows) =>
    rows.map((row) => {
      const control = row.querySelector("[data-slot=slider-control]")!.getBoundingClientRect();
      const range = row.querySelector<HTMLElement>("[data-slot=slider-range]")!;
      const bounds = range.getBoundingClientRect();
      const vertical = row.getAttribute("data-example") === "vertical";
      const dir = getComputedStyle(range).direction;
      const thumbs = Array.from(
        row.querySelectorAll<HTMLElement>("[data-slot=slider-thumb]"),
        (thumb) => {
          const box = thumb.getBoundingClientRect();
          return {
            center: vertical ? box.y + box.height / 2 : box.x + box.width / 2,
            index: thumb.dataset.index,
            input: thumb.querySelectorAll("input[data-sw-slider-input]").length,
            inset: vertical ? thumb.style.bottom : thumb.style.insetInlineStart,
          };
        },
      );
      return {
        id: row.getAttribute("data-example"),
        dir,
        size: vertical ? control.height : control.width,
        origin: vertical ? control.bottom : dir === "rtl" ? control.right : control.left,
        fill: vertical
          ? [bounds.bottom, bounds.top]
          : dir === "rtl"
            ? [bounds.right, bounds.left]
            : [bounds.left, bounds.right],
        inset: vertical ? range.style.bottom : range.style.insetInlineStart,
        thumbs,
      };
    }),
  );
  assert.equal(rows.length, examples.length, "Incomplete server-rendered tree");
  for (const [i, row] of rows.entries()) {
    const { id, percentages: values, direction } = examples[i]!;
    assert.equal(row.id, id);
    assert.equal(row.dir, direction, id);
    assert(row.size >= 90, id);
    const position = (v: number) =>
      row.origin + ((id === "vertical" || direction === "rtl" ? -1 : 1) * row.size * v) / 100;
    const close = (actual: number, v: number) =>
      assert(Math.abs(actual - position(v)) <= 1, `${id}: ${actual} vs ${position(v)} at ${v}%`);
    assert.equal(row.thumbs.length, values.length, id);
    row.thumbs.forEach((thumb, j) => {
      assert.equal(thumb.input, 1);
      assert.equal(thumb.index, String(j));
      assert.equal(thumb.inset, `${values[j]}%`);
      close(thumb.center, values[j]!);
    });
    const start = values.length > 1 ? values[0]! : 0;
    assert.equal(row.inset, `${start}%`);
    close(row.fill[0]!, start);
    close(row.fill[1]!, values.at(-1)!);
  }
  return rows;
}
const paintExpectations: DirectionExpectation[] = [
  {
    id: "slider-paint-styled",
    layer: "styled",
    async run(page, _target, ctx) {
      const browser = page.context().browser()!;
      const disabled = await browser.newContext({ javaScriptEnabled: false });
      try {
        await ctx.check(assertions[0]!, async () => {
          const staticPage = await disabled.newPage();
          const response = await staticPage.goto(page.url());
          assert((await response!.text()).includes('data-slot="slider-thumb"'));
          ctx.observe("javascriptDisabled", await measure(staticPage));
          // A client-only shell or a physically misplaced server thumb must fail this check.
          await staticPage
            .locator("[data-example=auto] [data-slot=slider-thumb]")
            .evaluate((thumb: HTMLElement) => (thumb.style.transform = "translateX(10px)"));
          await assert.rejects(measure(staticPage), /auto:/);
          await staticPage.locator("main").evaluate((main) => main.replaceChildren());
          await assert.rejects(measure(staticPage), /Incomplete server-rendered tree/);
        });
      } finally {
        await disabled.close();
      }
      // Hold module execution through CSS layout and first paint. Astro can inline its initializer.
      await page.route(page.url(), async (route) => {
        const response = await route.fetch();
        const html = await response.text();
        await route.fulfill({
          response,
          body: html.replaceAll(/<script\b[^>]*>/gi, (tag) =>
            tag.replace(/type="module"/, 'type="application/x-held-module"'),
          ),
        });
      });
      await page.reload();
      await page.evaluate(
        () => new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve))),
      );
      const identities = await page.locator("[data-slot=slider-thumb]").elementHandles();
      await ctx.check(assertions[1]!, async () => {
        assert.equal(await page.locator("[data-sw-slider-thumb][aria-valuenow]").count(), 0);
        assert(await page.locator('script[type="application/x-held-module"]').count());
        ctx.observe("firstPaint", await measure(page));
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
      await ctx.check(assertions[2]!, async () => {
        await page
          .locator("[data-sw-slider-thumb][aria-valuenow]")
          .first()
          .waitFor({ timeout: 5000 });
        for (const handle of identities)
          assert(
            await handle.evaluate((node) => node.isConnected),
            "Hydration replaced an SSR thumb",
          );
        ctx.observe("hydrated", await measure(page));
      });
      await ctx.check(assertions[3]!, async () => {
        const active = page.locator("[data-example=auto] [data-sw-slider-thumb]");
        await active.press("ArrowUp");
        assert.equal(await active.getAttribute("aria-valuenow"), "40");
        const range = page.locator("[data-example=inherited] [data-sw-slider-thumb]");
        await range.first().press("ArrowUp");
        await range.last().press("ArrowDown");
        assert.deepEqual(
          await range.evaluateAll((nodes) =>
            nodes.map((node) => node.getAttribute("aria-valuenow")),
          ),
          ["20", "80"],
        );
        await page
          .locator("form")
          .evaluateAll((forms) => forms.forEach((form) => (form as HTMLFormElement).reset()));
        await page.waitForFunction(
          () =>
            document
              .querySelector("[data-example=auto] [data-sw-slider-thumb]")
              ?.getAttribute("aria-valuenow") === "35",
        );
        ctx.observe("reset", await measure(page));
      });
    },
  },
];

export const expectations = paintExpectations.map((expectation) =>
  withFirstPaintParity(expectation, "slider", ["javascriptDisabled", "firstPaint", "hydrated"]),
);
