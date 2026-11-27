import assert from "node:assert/strict";
import type { Page } from "playwright";

import type { DirectionAssertionContext } from "../../assertion-receipts.js";
import type { DirectionCase, DirectionExpectation, Target } from "../../inventory.js";

/**
 * Chart direction. A chart in an RTL page and a chart in a nested RTL container of an LTR page
 * take the direction of their root for the tooltip body and the legend. The plot, the axes and the
 * bars stay unmirrored, as the shadcn (Recharts) charts do.
 */

const exportsList = [
  "ChartContainer",
  "ChartTooltip",
  "ChartTooltipContent",
  "ChartLegend",
  "ChartLegendContent",
  "ChartBar",
  "ChartLine",
  "ChartArea",
  "ChartPie",
  "ChartRadar",
  "ChartRadialBar",
  "ChartXAxis",
  "ChartYAxis",
  "ChartGrid",
  "ChartPolarGrid",
  "ChartPolarAngleAxis",
  "ChartLabel",
  "ChartLinearGradient",
];

const scopes = [
  { name: "ltr", direction: "ltr", id: "chart-ltr" },
  { name: "nested-rtl", direction: "rtl", id: "chart-nested-rtl" },
  { name: "page-rtl", direction: "rtl", id: "chart-page-rtl" },
] as const;

// One bar chart factory for every target. The series values have unequal widths, so a value
// column that aligns to a physical side shows in RTL.
const factorySource = `import { barY, defineChart, group } from "@tanstack/charts";
import { scaleBand } from "@tanstack/charts/scales/band";
import { scaleLinear } from "@tanstack/charts/scales/linear";
import { defineChartModule } from "@starwind-ui/runtime/chart";
const months = ["Jan", "Feb", "Mar"];
const chartData = months.map((month, index) => ({ month, desktop: [186, 305, 237][index], mobile: [8, 20, 12][index] }));
const chartConfig = { desktop: { label: "Desktop", color: "rgb(37, 99, 235)" }, mobile: { label: "Mobile", color: "rgb(96, 165, 250)" } };
function visitorBars(ctx: any) {
  const rows = ctx.data.flatMap((row: any) => ctx.visible.map((series: string) => ({ id: row.month + "-" + series, month: row.month, series, value: row[series] })));
  return defineChart(
    {
      marks: [barY(rows, { id: "visitors", x: "month", y: "value", color: "series", key: "id", layout: group({ padding: 0.15 }) })],
      scales: { x: { scale: () => scaleBand().domain(months).padding(0.28) }, y: { scale: scaleLinear, nice: true } },
      color: ctx.color,
      theme: ctx.theme,
    },
    { svgAnimation: false, focus: "group-x", maxFocusDistance: Number.POSITIVE_INFINITY, tooltip: ctx.tooltip({ labelKey: "month" }, { showDelay: 0, hideDelay: 0 }) },
  );
}
const visitors = defineChartModule({ id: "direction-visitors", ariaLabel: "Visitors", create: visitorBars });`;

function layout(target: Target | "raw", chart: (id: string) => string): string {
  const cls = target === "react" ? "className" : "class";
  // The LTR chart sits in the `data-direction-primary` host that the physical-token audit reads.
  const cell = (scope: (typeof scopes)[number], primary = false) =>
    `<div ${cls}="w-[380px]" data-direction-scope="${scope.name}" data-direction-expected="${scope.direction}">${primary ? `<section data-direction-primary>${chart(scope.id)}</section>` : chart(scope.id)}</div>`;
  const [ltr, nested, page] = scopes;
  return `<div ${cls}="flex items-start gap-3 p-3"><main dir="ltr" data-direction-root="ltr" ${cls}="flex items-start gap-3">${cell(ltr, true)}<section dir="rtl">${cell(nested)}</section></main><main dir="rtl" data-direction-root="rtl">${cell(page)}</main></div>`;
}

function styledChart(target: Target, id: string): string {
  if (target === "react")
    return `<ChartContainer id="${id}" chart={visitors} data={chartData} config={chartConfig}><ChartTooltip content={<ChartTooltipContent />} /><ChartLegend content={<ChartLegendContent />} /></ChartContainer>`;
  if (target === "vue")
    return `<ChartContainer id="${id}" :chart="visitors" :data="chartData" :config="chartConfig"><ChartTooltip><template #content><ChartTooltipContent /></template></ChartTooltip><ChartLegend><template #content><ChartLegendContent /></template></ChartLegend></ChartContainer>`;
  if (target === "svelte")
    return `<ChartContainer id="${id}" chart={visitors} data={chartData} config={chartConfig}><ChartTooltip content={tooltipBody} /><ChartLegend content={legendBody} /></ChartContainer>`;
  return `<ChartContainer id="${id}" chart={visitors} data={chartData} config={chartConfig}><ChartTooltip><ChartTooltipContent slot="content" /></ChartTooltip><ChartLegend><ChartLegendContent slot="content" /></ChartLegend></ChartContainer>`;
}

/**
 * One chart of each kind drawn from chart parts. Polar marks cannot share a chart, so each kind is
 * its own chart. The charts sit outside the direction scopes and the audit host. The physical-token
 * audit reads their drawings to prove each part.
 */
const partsCharts = [
  {
    kind: "cartesian",
    data: "chartData",
    parts: [
      "<ChartGrid />",
      '<ChartXAxis dataKey="month" />',
      "<ChartYAxis />",
      '<ChartBar dataKey="desktop" />',
      '<ChartLine dataKey="mobile" />',
      '<ChartArea dataKey="desktop" />',
    ],
  },
  {
    kind: "radar",
    data: "chartData",
    parts: [
      "<ChartPolarGrid />",
      '<ChartPolarAngleAxis dataKey="month" />',
      '<ChartRadar dataKey="desktop" />',
    ],
  },
  {
    kind: "pie",
    data: "sliceData",
    parts: ['<ChartPie dataKey="visitors" nameKey="device" innerRadius="50%" />', "<ChartLabel />"],
  },
  {
    kind: "radial-bar",
    data: "sliceData",
    parts: ['<ChartRadialBar dataKey="visitors" nameKey="device" />'],
  },
] as const;

const partsDataSource = `const sliceData = [{ device: "desktop", visitors: 275 }, { device: "mobile", visitors: 200 }];`;

function partsMarkup(target: Target): string {
  const cls = target === "react" ? "className" : "class";
  const bind = (name: string, value: string) =>
    target === "vue" ? `:${name}="${value}"` : `${name}={${value}}`;
  // The cartesian chart fills its bars from a gradient. Its stops are an array, so each target
  // binds them in its own syntax.
  const stops =
    target === "vue"
      ? `:stops="[{ offset: 0, stopColor: 'rgb(37, 99, 235)' }]"`
      : `stops={[{ offset: 0, stopColor: "rgb(37, 99, 235)" }]}`;
  const gradient = `<ChartLinearGradient id="fillDesktop" ${stops} />`;
  const charts = partsCharts.map(
    (chart) =>
      `<div ${cls}="w-[380px]" data-direction-parts="${chart.kind}"><ChartContainer ${bind("data", chart.data)} ${bind("config", "chartConfig")}>${chart.kind === "cartesian" ? gradient : ""}${chart.parts.join("")}</ChartContainer></div>`,
  );
  return `<div ${cls}="flex flex-wrap items-start gap-3 p-3" dir="ltr">${charts.join("")}</div>`;
}

function styledSource(target: Target): string {
  const markup = layout(target, (id) => styledChart(target, id)) + partsMarkup(target);
  const imports = [
    `import { ${exportsList.join(", ")} } from "@direction/styled-${target}/chart";`,
    `import "@direction/sheet";`,
    partsDataSource,
  ];
  if (target === "astro")
    return `---\n${imports.join("\n")}\n${factorySource}\n---\n<html lang="en" dir="ltr"><head><meta charset="utf-8" /><title>Chart direction</title></head><body>${markup}<script>\n${factorySource}\nvoid visitors;\n</script></body></html>`;
  if (target === "react")
    return `${imports.join("\n")}\nimport { createRoot } from "react-dom/client";\n${factorySource}\nfunction App() { return <>${markup}</>; }\ncreateRoot(document.getElementById("app")!).render(<App />);`;
  if (target === "vue")
    return `<script setup lang="ts">\n${imports.join("\n")}\n${factorySource}\n</script>\n<template>${markup}</template>`;
  return `<script lang="ts">\n${imports.join("\n")}\n${factorySource}\n</script>\n{#snippet tooltipBody()}<ChartTooltipContent />{/snippet}\n{#snippet legendBody()}<ChartLegendContent />{/snippet}\n${markup}`;
}

const rawChart = (id: string) =>
  `<div data-slot="chart" data-chart="${id}"><div data-slot="chart-surface" data-sw-chart-surface></div></div>`;

const rawSource = `---
---
<html lang="en" dir="ltr"><head><meta charset="utf-8" /><title>Raw chart direction</title></head><body>${layout("raw", rawChart)}<script>
${factorySource}
import { createChart } from "@starwind-ui/runtime/chart";
for (const root of document.querySelectorAll<HTMLElement>("[data-chart]"))
  createChart(root, { chart: visitors, input: { data: chartData, config: chartConfig } });
document.body.dataset.ready = "true";
</script></body></html>`;

const styledAssertions = [
  "chart-direction-scopes",
  "plot-stays-unmirrored",
  "legend-follows-direction",
  "tooltip-follows-chart-direction",
  "tooltip-value-inline-end",
];
const rawAssertions = [
  "raw-factory-instantiates",
  "raw-plot-stays-unmirrored",
  "raw-native-tooltip-follows-direction",
];
const plotException =
  "The plot, the axes and the bars keep their physical layout in every direction, as the shadcn (Recharts) charts do.";

export const cases: DirectionCase[] = [
  {
    id: "chart-direction-styled",
    row: "chart",
    acceptance: ["SPEC-AC-01", "SPEC-AC-02", "SPEC-AC-03", "SPEC-AC-11", "SPEC-AC-14"],
    fixtures: Object.fromEntries(
      (["astro", "react", "vue", "svelte"] as const).map((target) => [
        target,
        { source: styledSource(target), exports: exportsList, assertions: styledAssertions },
      ]),
    ),
    physicalExceptions: [plotException],
  },
  {
    id: "chart-direction-raw",
    row: "runtime:chart",
    acceptance: ["SPEC-AC-03", "SPEC-AC-04", "SPEC-AC-11"],
    rawEntrypoints: ["factory"],
    fixtures: { astro: { source: rawSource, exports: [], assertions: rawAssertions } },
    physicalExceptions: [plotException],
  },
];

const rootSelector = (scope: string) =>
  `[data-direction-scope="${scope}"] [data-slot="chart"][data-chart]`;

async function waitForCharts(page: Page) {
  // The test transform names inline functions with `__name`. Browser callbacks need the helper.
  await page.evaluate("window.__name = (target) => target");
  for (const scope of scopes)
    await page
      .locator(`${rootSelector(scope.name)}[data-state="active"] rect[data-ts-key^="visitors:"]`)
      .first()
      .waitFor({ state: "attached" });
}

/** Bar and axis text boxes relative to the chart svg, measured before any hover. */
async function plotGeometry(page: Page, scope: string) {
  return page.locator(rootSelector(scope)).evaluate((root) => {
    const svg = root.querySelector<SVGSVGElement>("svg.ts-chart") ?? root.querySelector("svg")!;
    const origin = svg.getBoundingClientRect();
    const relative = (node: Element) => {
      const box = node.getBoundingClientRect();
      return {
        x: Math.round((box.left - origin.left) * 10) / 10,
        y: Math.round((box.top - origin.top) * 10) / 10,
        width: Math.round(box.width * 10) / 10,
      };
    };
    return {
      direction: getComputedStyle(root).direction,
      svgTransform: getComputedStyle(svg).transform,
      bars: [...svg.querySelectorAll('rect[data-ts-key^="visitors:"]')].map((node) => ({
        key: node.getAttribute("data-ts-key"),
        ...relative(node),
      })),
      text: [...svg.querySelectorAll("text")]
        .filter((node) => node.textContent?.trim())
        .map((node) => ({ text: node.textContent!.trim(), ...relative(node) })),
    };
  });
}

function assertSamePlot(
  reference: Awaited<ReturnType<typeof plotGeometry>>,
  other: Awaited<ReturnType<typeof plotGeometry>>,
  label: string,
) {
  assert.equal(other.svgTransform, "none", `${label} svg transform`);
  assert.equal(other.bars.length, 6, `${label} bar count`);
  assert.deepEqual(
    other.bars.map((bar) => bar.key),
    reference.bars.map((bar) => bar.key),
    `${label} bar order`,
  );
  assert.deepEqual(
    other.text.map((item) => item.text),
    reference.text.map((item) => item.text),
    `${label} axis text`,
  );
  for (const [index, item] of [...other.bars, ...other.text].entries()) {
    const base = [...reference.bars, ...reference.text][index]!;
    assert(Math.abs(item.x - base.x) <= 1, `${label} ${JSON.stringify(item)} x moved`);
    assert(Math.abs(item.y - base.y) <= 1, `${label} ${JSON.stringify(item)} y moved`);
  }
  const jan = other.text.find((item) => item.text === "Jan")!;
  const mar = other.text.find((item) => item.text === "Mar")!;
  assert(jan && mar && jan.x < mar.x, `${label} first category stays on the left`);
}

/** Moves the pointer over the first category and waits for a filled tooltip in that chart. */
async function showTooltip(page: Page, scope: string, rowSelector: string) {
  const root = page.locator(rootSelector(scope));
  const svg = root.locator("svg").first();
  await svg.scrollIntoViewIfNeeded();
  const box = (await svg.boundingBox())!;
  await page.mouse.move(box.x + box.width * 0.2, box.y + box.height * 0.5, { steps: 4 });
  await page.waitForFunction(
    ({ selector, rows }) => {
      const tooltip = document
        .querySelector(selector)
        ?.querySelector<HTMLElement>(".ts-chart-tooltip");
      return (
        !!tooltip &&
        !tooltip.hidden &&
        tooltip.getBoundingClientRect().width > 0 &&
        tooltip.querySelectorAll(rows).length >= 2
      );
    },
    { selector: rootSelector(scope), rows: rowSelector },
  );
}

async function hideTooltip(page: Page) {
  await page.mouse.move(2, 2);
}

async function tooltipOwner(page: Page, scope: string) {
  return page.locator(rootSelector(scope)).evaluate((root) => {
    const tooltip = root.querySelector<HTMLElement>(".ts-chart-tooltip")!;
    return {
      rootDirection: getComputedStyle(root).direction,
      tooltipDirection: getComputedStyle(tooltip).direction,
      inRoot: root.contains(tooltip),
      portal: tooltip.dataset.tsChartTooltipPortal ?? null,
      label: (
        tooltip.querySelector("[data-slot=chart-tooltip-label], .ts-chart-tooltip__title")
          ?.textContent ?? ""
      ).trim(),
    };
  });
}

function assertOwner(owner: Awaited<ReturnType<typeof tooltipOwner>>, expected: string) {
  assert.equal(owner.rootDirection, expected, "chart root direction");
  assert.equal(owner.inRoot, true, "tooltip stays inside the chart root");
  assert.equal(owner.portal, "popover", "tooltip uses the in-root popover");
  assert.equal(owner.tooltipDirection, expected, "tooltip direction follows the chart root");
  assert.equal(owner.label, "Jan", "tooltip names the first category");
}

async function styledRows(page: Page, scope: string) {
  return page.locator(rootSelector(scope)).evaluate((root) => {
    const box = (node: Element | null) => {
      const rect = node!.getBoundingClientRect();
      return {
        left: rect.left,
        right: rect.right,
        top: rect.top,
        bottom: rect.bottom,
        width: rect.width,
      };
    };
    const content = root.querySelector(".ts-chart-tooltip [data-slot=chart-tooltip-content]")!;
    return {
      contentDirection: getComputedStyle(content).direction,
      rows: [...content.querySelectorAll("[data-slot=chart-tooltip-item]")].map((row) => {
        const children = [...row.children].filter(
          (child) => child.getBoundingClientRect().width > 0,
        );
        const gap = Number.parseFloat(getComputedStyle(row).columnGap) || 0;
        const used =
          children.reduce((sum, child) => sum + child.getBoundingClientRect().width, 0) +
          gap * Math.max(children.length - 1, 0);
        return {
          row: box(row),
          indicator: box(row.querySelector("[data-slot=chart-tooltip-indicator]")),
          name: box(row.querySelector("[data-slot=chart-tooltip-name]")),
          value: box(row.querySelector("[data-slot=chart-tooltip-value]")),
          valueText: row.querySelector("[data-slot=chart-tooltip-value]")!.textContent?.trim(),
          slack: row.getBoundingClientRect().width - used,
        };
      }),
    };
  });
}

async function legendItems(page: Page, scope: string) {
  return page.locator(rootSelector(scope)).evaluate((root) => {
    const box = (node: Element | null) => {
      const rect = node!.getBoundingClientRect();
      return { left: rect.left, right: rect.right };
    };
    const legend = root.querySelector("[data-slot=chart-legend]")!;
    return {
      direction: getComputedStyle(legend).direction,
      items: [...legend.querySelectorAll("[data-slot=chart-legend-item]")].map((item) => ({
        text: item.textContent?.trim(),
        item: box(item),
        swatch: box(item.querySelector("[data-slot=chart-legend-swatch]")),
        label: box(item.querySelector("[data-slot=chart-legend-label]")),
      })),
    };
  });
}

async function nativeRows(page: Page, scope: string) {
  return page.locator(rootSelector(scope)).evaluate((root) => {
    const tooltip = root.querySelector(".ts-chart-tooltip")!;
    return [...tooltip.querySelectorAll(".ts-chart-tooltip__row")].map((row) => {
      const [swatch, label, value] = [...row.children] as HTMLElement[];
      const range = document.createRange();
      range.selectNodeContents(value!);
      const text = range.getBoundingClientRect();
      const cell = value!.getBoundingClientRect();
      return {
        swatch: { left: swatch!.getBoundingClientRect().left },
        label: { left: label!.getBoundingClientRect().left },
        value: { left: cell.left, right: cell.right },
        valueText: value!.textContent,
        valueTextAlign: getComputedStyle(value!).textAlign,
        // The space between the value text and its cell edges shows the value alignment.
        textInset: { left: text.left - cell.left, right: cell.right - text.right },
      };
    });
  });
}

async function checkPlot(page: Page, ctx: DirectionAssertionContext, name: string): Promise<void> {
  await ctx.check(name, async () => {
    const plots = [];
    for (const scope of scopes) plots.push(await plotGeometry(page, scope.name));
    ctx.observe(name, plots);
    const [reference, ...others] = plots;
    assert.equal(reference!.direction, "ltr");
    assert(reference!.text.length >= 3, "the reference chart draws axis text");
    others.forEach((plot, index) => {
      assert.equal(plot.direction, "rtl");
      assertSamePlot(reference!, plot, scopes[index + 1]!.name);
    });
  });
}

export const expectations: DirectionExpectation[] = [
  {
    id: "chart-direction-styled",
    layer: "styled",
    async run(page, _target, ctx) {
      page.setDefaultTimeout(5000);
      await waitForCharts(page);
      await ctx.check("chart-direction-scopes", async () => {
        const observed = [];
        for (const scope of scopes) {
          const direction = await page
            .locator(rootSelector(scope.name))
            .evaluate((root) => getComputedStyle(root).direction);
          observed.push({ scope: scope.name, expected: scope.direction, direction });
          assert.equal(direction, scope.direction, `${scope.name} chart root direction`);
        }
        ctx.observe("chart-direction-scopes", observed);
      });
      await checkPlot(page, ctx, "plot-stays-unmirrored");
      await ctx.check("legend-follows-direction", async () => {
        const observed = [];
        for (const scope of scopes) {
          const legend = await legendItems(page, scope.name);
          observed.push({ scope: scope.name, ...legend });
          assert.equal(legend.direction, scope.direction, `${scope.name} legend direction`);
          assert.deepEqual(
            legend.items.map((item) => item.text),
            ["Desktop", "Mobile"],
          );
          const [first, second] = legend.items;
          if (scope.direction === "ltr") {
            assert(first!.item.left < second!.item.left, `${scope.name} legend order`);
            for (const item of legend.items)
              assert(item.swatch.right <= item.label.left + 0.5, `${scope.name} swatch side`);
          } else {
            assert(first!.item.left > second!.item.left, `${scope.name} legend order`);
            for (const item of legend.items)
              assert(item.swatch.left >= item.label.right - 0.5, `${scope.name} swatch side`);
          }
        }
        ctx.observe("legend-follows-direction", observed);
      });
      const owners: Array<{ scope: string } & Awaited<ReturnType<typeof tooltipOwner>>> = [];
      const rows: Array<{ scope: string } & Awaited<ReturnType<typeof styledRows>>> = [];
      for (const scope of scopes) {
        await showTooltip(page, scope.name, "[data-slot=chart-tooltip-item]");
        owners.push({ scope: scope.name, ...(await tooltipOwner(page, scope.name)) });
        rows.push({ scope: scope.name, ...(await styledRows(page, scope.name)) });
        await hideTooltip(page);
      }
      await ctx.check("tooltip-follows-chart-direction", async () => {
        ctx.observe("tooltip-follows-chart-direction", owners);
        for (const [index, owner] of owners.entries()) {
          assertOwner(owner, scopes[index]!.direction);
          assert.equal(rows[index]!.contentDirection, scopes[index]!.direction);
        }
      });
      await ctx.check("tooltip-value-inline-end", async () => {
        ctx.observe("tooltip-value-inline-end", rows);
        for (const [index, entry] of rows.entries()) {
          const { name, direction } = scopes[index]!;
          assert.equal(entry.rows.length, 2, `${name} tooltip rows`);
          for (const row of entry.rows) {
            assert(row.slack >= 4, `${name} row has free inline space (${row.slack})`);
            if (direction === "ltr") {
              assert(Math.abs(row.value.right - row.row.right) <= 1, `${name} value at the right`);
              assert(Math.abs(row.indicator.left - row.row.left) <= 1, `${name} indicator start`);
              assert(row.name.right <= row.value.left, `${name} name before value`);
            } else {
              assert(Math.abs(row.value.left - row.row.left) <= 1, `${name} value at the left`);
              assert(Math.abs(row.indicator.right - row.row.right) <= 1, `${name} indicator start`);
              assert(row.name.left >= row.value.right, `${name} name before value`);
            }
          }
        }
      });
    },
  },
  {
    id: "chart-direction-raw",
    layer: "raw-html",
    async run(page, target, ctx) {
      assert.equal(target, "astro");
      page.setDefaultTimeout(5000);
      await page.waitForSelector('body[data-ready="true"]', { state: "attached" });
      await waitForCharts(page);
      await ctx.check("raw-factory-instantiates", async () => {
        const observed = [];
        for (const scope of scopes) {
          const state = await page.locator(rootSelector(scope.name)).evaluate((root) => ({
            state: root.dataset.state,
            svg: root.querySelectorAll("svg").length,
            bars: root.querySelectorAll('rect[data-ts-key^="visitors:"]').length,
            direction: getComputedStyle(root).direction,
          }));
          observed.push({ scope: scope.name, ...state });
          assert.deepEqual(state, {
            state: "active",
            svg: 1,
            bars: 6,
            direction: scope.direction,
          });
        }
        ctx.observe("raw-factory-instantiates", observed);
      });
      await checkPlot(page, ctx, "raw-plot-stays-unmirrored");
      await ctx.check("raw-native-tooltip-follows-direction", async () => {
        const observed = [];
        for (const scope of scopes) {
          await showTooltip(page, scope.name, ".ts-chart-tooltip__row");
          const owner = await tooltipOwner(page, scope.name);
          const native = await nativeRows(page, scope.name);
          await hideTooltip(page);
          observed.push({ scope: scope.name, owner, rows: native });
          assertOwner(owner, scope.direction);
          assert.equal(native.length, 2, `${scope.name} native rows`);
          for (const row of native) {
            if (scope.direction === "ltr") {
              assert(row.swatch.left < row.label.left, `${scope.name} swatch at inline start`);
              assert(row.value.left > row.label.left, `${scope.name} value at inline end`);
            } else {
              assert(row.swatch.left > row.label.left, `${scope.name} swatch at inline start`);
              assert(row.value.right < row.label.left + 1, `${scope.name} value at inline end`);
            }
          }
        }
        ctx.observe("raw-native-tooltip-follows-direction", observed);
      });
    },
  },
];
