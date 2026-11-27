import { describe, expect, it, vi } from "vitest";

import {
  type ChartConfig,
  type ChartInput,
  type ChartSpec,
  chartLegendKeys,
  createChartOptions,
  formatChartValue,
  prerenderChart,
  serializeInput,
} from "../../../src/components/chart";
import { ID, ROW, SERIES, VALUE, X } from "../../../src/components/chart/datum";
import { tooltipLayout, tooltipView } from "../../../src/components/chart/presentation";
import { browserConfig, browserData, visitorConfig, visitorData } from "./reference-charts";

// Each case renders a shadcn/ui chart example as a Starwind spec. The shadcn source lives in
// `.local/shadcn-ui/apps/v4/registry/new-york-v4/charts/<name>.tsx`.

const render = (input: ChartInput, host: Record<string, number> = {}) =>
  prerenderChart(undefined, input, { id: "chart-shadcn", host }).markup;

const definitionOf = (input: ChartInput) =>
  createChartOptions(undefined, input, { id: "chart-def" }).definition as any;

/** The opening tags whose `data-ts-key` starts with `prefix`. */
const tags = (markup: string, prefix: string) =>
  markup.match(new RegExp(`<[a-z]+ data-ts-key="${prefix}[^>]*>`, "g")) ?? [];

/** The arc radii of a rect path, clockwise from the top right corner. */
const arcRadii = (tag: string) =>
  [...(/ d="([^"]*)"/.exec(tag)?.[1] ?? "").matchAll(/A([\d.]+),/g)].map((match) =>
    Number(match[1]),
  );

const monthAxis = {
  kind: "xAxis",
  dataKey: "month",
  tickFormatter: { maxLength: 3 },
} as const;

/** A shadcn pie config: a colorless `visitors` key, then one key per browser. */
const pieConfig: ChartConfig = browserConfig;
const pieData = browserData.map((row) => ({ ...row, fill: `var(--color-${row.browser})` }));

describe("shadcn bar examples", () => {
  // bar-stacked: the bottom series rounds its bottom corners, the top series its top corners.
  const barStacked = (visible?: string[]): ChartInput => ({
    data: visitorData,
    config: visitorConfig,
    visible,
    spec: {
      parts: [
        { kind: "grid", vertical: false },
        { ...monthAxis, tickMargin: 10 },
        { kind: "bar", dataKey: "desktop", stackId: "a", radius: [0, 0, 4, 4] },
        { kind: "bar", dataKey: "mobile", stackId: "a", radius: [4, 4, 0, 0] },
      ],
    },
  });

  it("rounds each corner from a radius tuple, as shadcn bar-stacked", () => {
    const markup = render(barStacked());
    const desktop = tags(markup, 'bars:[^"]*January-desktop')[0]!;
    const mobile = tags(markup, 'bars:[^"]*January-mobile')[0]!;
    expect(arcRadii(desktop)).toEqual([0, 4, 4, 0]);
    expect(arcRadii(mobile)).toEqual([4, 0, 0, 4]);
    // The bottom bar keeps its own corners when the top series hides, as Recharts.
    const alone = tags(render(barStacked(["desktop"])), 'bars:[^"]*January-desktop')[0]!;
    expect(arcRadii(alone)).toEqual([0, 4, 4, 0]);
  });

  it("rounds the top corners for a number beside a tuple", () => {
    const markup = render({
      data: visitorData,
      config: visitorConfig,
      spec: {
        parts: [
          monthAxis,
          { kind: "bar", dataKey: "desktop", radius: 6 },
          { kind: "bar", dataKey: "mobile", radius: [0, 0, 2, 2] },
        ],
      },
    });
    expect(arcRadii(tags(markup, 'bars:[^"]*January-desktop')[0]!)).toEqual([6, 0, 0, 6]);
    expect(arcRadii(tags(markup, 'bars:[^"]*January-mobile')[0]!)).toEqual([0, 2, 2, 0]);
  });

  // A tuple on one series leaves the bars of another series as they were.
  describe("keeps a number radius when another series has a tuple", () => {
    const signed = visitorData.map((row, index) => ({
      ...row,
      desktop: index % 2 ? -(row.desktop ?? 0) : row.desktop,
    }));
    const desktopBars = (
      stackId: string | undefined,
      mobile: number | [number, number, number, number],
    ) =>
      tags(
        render({
          data: signed,
          config: visitorConfig,
          spec: {
            parts: [
              monthAxis,
              { kind: "bar", dataKey: "desktop", radius: 4, ...(stackId ? { stackId } : {}) },
              { kind: "bar", dataKey: "mobile", radius: mobile, ...(stackId ? { stackId } : {}) },
            ],
          },
        }),
        'bars:[^"]*-desktop',
      );

    it("rounds the free end of a negative grouped bar", () => {
      const plain = desktopBars(undefined, 4);
      expect(plain).toHaveLength(6);
      expect(desktopBars(undefined, [4, 4, 0, 0])).toEqual(plain);
    });

    it("rounds only the outer end of a stack", () => {
      const plain = desktopBars("a", 4);
      expect(plain).toHaveLength(6);
      expect(desktopBars("a", [4, 4, 0, 0])).toEqual(plain);
    });

    it("rounds each bar of a stack beside a plain bar on its free end", () => {
      // desktop and mobile stack, and a third bar takes its own slot.
      const mixed = (mobile: number | [number, number, number, number]) =>
        tags(
          render({
            data: signed.map((row) => ({ ...row, tablet: 50 })),
            config: { ...visitorConfig, tablet: { label: "Tablet", color: "var(--chart-3)" } },
            spec: {
              parts: [
                monthAxis,
                { kind: "bar", dataKey: "desktop", radius: 4, stackId: "a" },
                { kind: "bar", dataKey: "mobile", radius: mobile, stackId: "a" },
                { kind: "bar", dataKey: "tablet", radius: 4 },
              ],
            },
          }),
          'bars:[^"]*-(desktop|tablet)',
        );
      const plain = mixed(4);
      expect(plain).toHaveLength(12);
      expect(mixed([4, 4, 0, 0])).toEqual(plain);
    });
  });

  // bar-interactive: `nameKey="views"` names every row "Page Views", because the rows have no
  // `views` field. The heading is a date.
  it("names tooltip rows from config by a missing nameKey, as shadcn bar-interactive", () => {
    const config: ChartConfig = {
      views: { label: "Page Views" },
      desktop: { label: "Desktop", color: "var(--chart-2)" },
      mobile: { label: "Mobile", color: "var(--chart-1)" },
    };
    const data = [{ date: "2024-04-01", desktop: 222, mobile: 150 }];
    const definition = definitionOf({
      data,
      config,
      spec: {
        parts: [
          { kind: "xAxis", dataKey: "date" },
          { kind: "bar", dataKey: "desktop" },
        ],
      },
    });
    const datum = {
      [ROW]: data[0],
      [X]: "2024-04-01",
      [SERIES]: "desktop",
      [VALUE]: 222,
      [ID]: "2024-04-01-desktop",
    };
    const point = { datum, color: "var(--sw-chart-color-desktop)", group: "desktop" };
    const content = definition.tooltip.content([point]);
    const view = tooltipView({ content, points: [point] } as any, config, {
      nameKey: "views",
      labelFormatter: { date: { month: "short", day: "numeric", year: "numeric" } },
    });
    expect(view.label).toBe("Apr 1, 2024");
    expect(view.rows[0]!.name).toBe("Page Views");
    expect(view.rows[0]!.configKey).toBe("views");
    // The row keeps its series key and color.
    expect(view.rows[0]!.item.dataKey).toBe("desktop");
    expect(view.rows[0]!.color).toBe("var(--sw-chart-color-desktop)");
    // Without a config entry for the key, the row keeps the series label.
    const plain = tooltipView({ content, points: [point] } as any, visitorConfig, {
      nameKey: "views",
    });
    expect(plain.rows[0]!.name).toBe("Desktop");
  });

  // tooltip-label-custom: `labelKey="activities"` shows "Activities" over the rows.
  it("takes a missing labelKey heading from config, as shadcn tooltip-label-custom", () => {
    const config: ChartConfig = {
      activities: { label: "Activities" },
      running: { label: "Running", color: "var(--chart-1)" },
      swimming: { label: "Swimming", color: "var(--chart-2)" },
    };
    const data = [{ date: "2024-07-15", running: 450, swimming: 300 }];
    const datum = { [ROW]: data[0], [X]: data[0]!.date, [SERIES]: "running", [VALUE]: 450 };
    const body = { content: "", points: [{ datum, color: "red", group: "running" }] } as any;
    const layout = tooltipLayout(body, config, undefined, { labelKey: "activities" });
    expect(layout.headingKey).toBe("activities");
    expect(layout.heading).toBe("Activities");
    // A labelFormatter function receives the config label, as shadcn passes it.
    const labelFormatter = vi.fn((label: unknown) => label);
    tooltipView(body, config, { labelKey: "activities", labelFormatter });
    expect(labelFormatter.mock.calls[0]![0]).toBe("Activities");
    // A ChartFormat formats the plain config label, as Astro passes it.
    expect(
      tooltipView(body, config, { labelKey: "activities", labelFormatter: { suffix: ":" } }).label,
    ).toBe("Activities:");
    // A row field keeps its value.
    expect(tooltipView(body, config, { labelKey: "date" }).label).toBe("2024-07-15");
  });

  // A row value that is a config key names the heading by that key's label, as shadcn passes
  // `itemConfig.label` to `labelFormatter`.
  it("sends the config label of a labelKey row value to labelFormatter", () => {
    const row = { browser: "chrome", visitors: 275 };
    const datum = { [ROW]: row, [SERIES]: "chrome", [VALUE]: 275 };
    const body = { content: "", points: [{ datum, color: "red", group: "chrome" }] } as any;
    const labelFormatter = vi.fn((label: unknown) => label);
    tooltipView(body, browserConfig, { labelKey: "browser", labelFormatter });
    expect(labelFormatter.mock.calls[0]![0]).toBe("Chrome");
    expect(
      tooltipView(body, browserConfig, { labelKey: "browser", labelFormatter: { suffix: ":" } })
        .label,
    ).toBe("Chrome:");
    // Without a formatter, the layout shows the same label.
    expect(tooltipLayout(body, browserConfig, undefined, { labelKey: "browser" }).heading).toBe(
      "Chrome",
    );
  });
});

describe("shadcn gradient examples", () => {
  const gradient = (key: string) =>
    ({
      kind: "linearGradient",
      id: `fill${key[0]!.toUpperCase()}${key.slice(1)}`,
      x1: "0",
      y1: "0",
      x2: "0",
      y2: "1",
      stops: [
        { offset: "5%", stopColor: `var(--color-${key})`, stopOpacity: 0.8 },
        { offset: "95%", stopColor: `var(--color-${key})`, stopOpacity: 0.1 },
      ],
    }) as const;
  const area = (key: string, extra: object = {}) => ({
    kind: "area" as const,
    dataKey: key,
    type: "natural" as const,
    fill: `url(#fill${key[0]!.toUpperCase()}${key.slice(1)})`,
    stroke: `var(--color-${key})`,
    stackId: "a",
    ...extra,
  });
  const gradientDefs = (markup: string) =>
    markup.match(/<linearGradient [^>]*>.*?<\/linearGradient>/g) ?? [];

  // area-gradient: two stacked areas fill from gradients that fade from top to bottom.
  it("fills areas from linear gradients, as shadcn area-gradient", () => {
    const markup = render({
      data: visitorData,
      config: visitorConfig,
      spec: {
        parts: [
          { kind: "grid", vertical: false },
          { ...monthAxis, tickMargin: 8 },
          gradient("desktop"),
          gradient("mobile"),
          area("mobile", { fillOpacity: 0.4 }),
          area("desktop", { fillOpacity: 0.4 }),
        ],
      },
    });
    const defs = gradientDefs(markup);
    expect(defs).toHaveLength(2);
    expect(defs[0]).toMatch(/id="chart-shadcn-fillDesktop" x1="0%" y1="0%" x2="0%" y2="100%"/);
    expect(defs[0]).toMatch(
      /offset="5%" stop-color="var\(--color-desktop\)" stop-opacity="0.8".*offset="95%"[^>]*stop-opacity="0.1"/,
    );
    const mobile = tags(markup, 'areas[^"]*segment').find((tag) => /fillMobile/.test(tag))!;
    expect(mobile).toMatch(/fill="url\(#chart-shadcn-fillMobile\)" fill-opacity="0.4"/);
    // The stroke keeps the config color.
    expect(mobile).toMatch(/stroke="var\(--color-mobile\)"/);
  });

  // area-interactive: the areas set no fillOpacity, so the gradient takes the Recharts 0.6.
  it("gives a gradient area the Recharts fill opacity, as shadcn area-interactive", () => {
    const data = [
      { date: "2024-04-01", desktop: 222, mobile: 150 },
      { date: "2024-04-02", desktop: 97, mobile: 180 },
    ];
    const markup = render({
      data,
      config: visitorConfig,
      spec: {
        parts: [
          { kind: "xAxis", dataKey: "date" },
          gradient("desktop"),
          gradient("mobile"),
          area("mobile"),
          area("desktop"),
        ],
      },
    });
    for (const tag of tags(markup, 'areas[^"]*segment')) expect(tag).toMatch(/fill-opacity="0.6"/);
    // An area with a color fill keeps the 0.22 default.
    const plain = render({
      data,
      config: visitorConfig,
      spec: {
        parts: [
          { kind: "xAxis", dataKey: "date" },
          { kind: "area", dataKey: "desktop" },
        ],
      },
    });
    expect(tags(plain, 'areas[^"]*segment')[0]).toMatch(/fill-opacity="0.22"/);
    expect(plain).not.toMatch(/<linearGradient/);
  });

  it("scopes gradient ids per chart and uses the SVG default direction", () => {
    const input: ChartInput = {
      data: visitorData,
      config: visitorConfig,
      spec: {
        parts: [
          monthAxis,
          { kind: "linearGradient", id: "shared", stops: [{ offset: 0, stopColor: "red" }] },
          { kind: "bar", dataKey: "desktop", fill: "url(#shared)" },
        ],
      },
    };
    const first = prerenderChart(undefined, input, { id: "chart-a" }).markup;
    const second = prerenderChart(undefined, input, { id: "chart-b" }).markup;
    expect(gradientDefs(first)[0]).toMatch(/id="chart-a-shared" x1="0%" y1="0%" x2="100%" y2="0%"/);
    expect(gradientDefs(second)[0]).toMatch(/id="chart-b-shared"/);
    expect(tags(first, "bars:")[0]).toMatch(/fill="url\(#chart-a-shared\)"/);
    expect(tags(second, "bars:")[0]).toMatch(/fill="url\(#chart-b-shared\)"/);
  });

  it("keeps the config color on the tooltip indicator of a gradient area", () => {
    const definition = definitionOf({
      data: visitorData,
      config: visitorConfig,
      spec: { parts: [monthAxis, gradient("desktop"), area("desktop")] },
    });
    const datum = {
      [ROW]: visitorData[0],
      [X]: "January",
      [SERIES]: "desktop",
      [VALUE]: 186,
      [ID]: "January-desktop",
    };
    const point = { datum, color: "url(#chart-def-fillDesktop)", group: "desktop" };
    const content = definition.tooltip.content([point]);
    const view = tooltipView({ content, points: [point] } as any, visitorConfig);
    expect(view.rows[0]!.color).toBe("var(--sw-chart-color-desktop)");
  });
});

describe("shadcn pie examples", () => {
  // pie-donut-text: the total, then a muted "Visitors" line 24px lower.
  it("draws one center line per label, as shadcn pie-donut-text", () => {
    const markup = render({
      data: pieData,
      config: pieConfig,
      spec: {
        parts: [
          { kind: "pie", dataKey: "visitors", nameKey: "browser", innerRadius: 60, strokeWidth: 5 },
          { kind: "label", position: "center", fontSize: 30, fontWeight: 700 },
          {
            kind: "label",
            position: "center",
            value: "Visitors",
            dy: 24,
            fontSize: 12,
            fill: "var(--muted-foreground)",
          },
        ],
      },
    });
    const [total, caption] = tags(markup, 'visible-total[^"]*:');
    // shadcn draws the total with `font-bold`. The caption keeps the inherited weight.
    expect(total).toMatch(/font-weight="700"/);
    expect(caption).not.toMatch(/font-weight/);
    expect(total).toMatch(/fill="var\(--foreground\)"/);
    expect(total).toMatch(/ y="0"/);
    expect(total).toMatch(/font-size="30"/);
    expect(caption).toMatch(/fill="var\(--muted-foreground\)"/);
    expect(caption).toMatch(/ y="24"/);
    expect(caption).toMatch(/font-size="12"/);
    expect(markup).toMatch(/>Visitors<\/text>/);
    expect(tags(markup, "slices:")[0]).toMatch(/stroke-width="5"/);
  });

  // pie-separator-none: `stroke="0"` removes the line between slices. Recharts draws no gap, so
  // the Starwind version sets `paddingAngle={0}` too.
  it("sets the slice separator from stroke, as shadcn pie-separator-none", () => {
    const pie = (stroke?: string, paddingAngle?: number) =>
      render({
        data: pieData,
        config: pieConfig,
        spec: {
          parts: [{ kind: "pie", dataKey: "visitors", nameKey: "browser", stroke, paddingAngle }],
        },
      });
    expect(tags(pie("0", 0), "slices:")[0]).toMatch(/stroke="0"/);
    // Each slice starts where the one before it ends, so no gap shows.
    const ends = (markup: string) =>
      tags(markup, "slices:").map((tag) => {
        const d = / d="M([^A]+)A[^,]+,[^,]+,[^,]+,[^,]+,[^,]+,([^L]+)L/.exec(tag)!;
        return { start: d[1], end: d[2] };
      });
    const slices = ends(pie("0", 0));
    expect(slices).toHaveLength(5);
    slices.forEach((slice, index) =>
      expect(slices[(index + 1) % slices.length]!.start).toBe(slice.end),
    );
    // The defaults keep the card-color line and the small gap.
    const plain = pie();
    expect(tags(plain, "slices:")[0]).toMatch(/stroke="var\(--card\)" stroke-width="2"/);
    const gaps = ends(plain);
    expect(gaps[1]!.start).not.toBe(gaps[0]!.end);
  });

  // pie-legend: the legend lists the browsers. The colorless `visitors` key gets no item.
  it("lists only drawn keys in the legend, as shadcn pie-legend", () => {
    const pie: ChartSpec = { parts: [{ kind: "pie", dataKey: "visitors", nameKey: "browser" }] };
    expect(chartLegendKeys(pie, pieData, pieConfig)).toEqual([
      "chrome",
      "safari",
      "firefox",
      "edge",
      "other",
    ]);
    // A cartesian chart lists its mark data keys, in config order.
    const config = { ...visitorConfig, tablet: { label: "Tablet", color: "var(--chart-3)" } };
    const bars: ChartSpec = {
      parts: [monthAxis, { kind: "bar", dataKey: "mobile" }, { kind: "bar", dataKey: "desktop" }],
    };
    expect(chartLegendKeys(bars, visitorData, config)).toEqual(["desktop", "mobile"]);
    // Without a spec, or before the spec has a mark, the legend lists every config key.
    expect(chartLegendKeys(undefined, pieData, pieConfig)).toEqual(Object.keys(pieConfig));
    expect(chartLegendKeys({ parts: [monthAxis] }, visitorData, config)).toEqual(
      Object.keys(config),
    );
  });
});

describe("shadcn radar grid examples", () => {
  const radar = (grid: object, radars: object[] = [{ kind: "radar", dataKey: "desktop" }]) =>
    ({
      data: visitorData.map(({ month, desktop, mobile }) => ({ month, desktop, mobile })),
      config: visitorConfig,
      spec: {
        parts: [
          { kind: "polarGrid", ...grid },
          { kind: "polarAngleAxis", dataKey: "month" },
          ...radars,
        ],
      },
    }) as ChartInput;
  const rings = (markup: string) => tags(markup, "ring:");
  const spokes = (markup: string) => tags(markup, "spoke:");

  it("fills the rings, as shadcn radar-grid-fill and radar-grid-circle-fill", () => {
    for (const gridType of ["polygon", "circle"]) {
      const markup = render(
        radar({ gridType, fill: "var(--color-desktop)", fillOpacity: 0.2 }, [
          { kind: "radar", dataKey: "desktop", fillOpacity: 0.5 },
        ]),
      );
      expect(rings(markup).length).toBeGreaterThan(1);
      for (const ring of rings(markup)) {
        expect(ring).toMatch(/fill="var\(--color-desktop\)" fill-opacity="0.2"/);
        expect(ring).toMatch(/stroke="var\(--border\)"/);
      }
    }
    // Without fill, the rings stay empty.
    expect(rings(render(radar({})))[0]).toMatch(/fill="none"/);
  });

  it("drops the spokes with radialLines false, as shadcn radar-grid-circle-no-lines", () => {
    const markup = render(
      radar({ gridType: "circle", radialLines: false }, [
        { kind: "radar", dataKey: "desktop", fillOpacity: 0.6, dot: { r: 4, fillOpacity: 1 } },
      ]),
    );
    expect(spokes(markup).length).toBe(6);
    for (const spoke of spokes(markup)) expect(spoke).toMatch(/stroke="none"/);
    expect(rings(markup).length).toBeGreaterThan(1);
    const dots = tags(markup, "radar-dots:");
    expect(dots.length).toBe(6);
    for (const dot of dots) expect(dot).toMatch(/fill-opacity="1"[^>]* r="4"/);
    // With the default, the spokes draw in the grid color.
    expect(spokes(render(radar({ gridType: "circle" })))[0]).toMatch(/stroke="var\(--border\)"/);
  });

  it("draws rings at polarRadius pixels at any size, as shadcn radar-grid-custom", () => {
    for (const size of [300, 600]) {
      const markup = render(radar({ radialLines: false, polarRadius: [90] }), {
        initialWidth: size,
        height: size,
      });
      const ring = rings(markup);
      expect(ring.length).toBe(1);
      // The polygon has its top vertex 90px above the center.
      expect(ring[0]).toMatch(/ d="M0,-90L/);
    }
  });

  it("sets the width of the rings and spokes from strokeWidth", () => {
    const markup = render(radar({ strokeWidth: 2 }));
    expect(rings(markup).length).toBeGreaterThan(1);
    for (const tag of [...rings(markup), ...spokes(markup)])
      expect(tag).toMatch(/stroke-width="2"/);
    // The default keeps today's 1px lines.
    for (const tag of [...rings(render(radar({}))), ...spokes(render(radar({})))])
      expect(tag).toMatch(/stroke-width="1"/);
  });

  it("draws two outline radars on rings without spokes, as shadcn radar-lines-only", () => {
    const markup = render(
      radar({ radialLines: false }, [
        { kind: "radar", dataKey: "desktop", fillOpacity: 0, strokeWidth: 2 },
        { kind: "radar", dataKey: "mobile", fillOpacity: 0, strokeWidth: 2 },
      ]),
    );
    for (const spoke of spokes(markup)) expect(spoke).toMatch(/stroke="none"/);
    expect(rings(markup)[0]).toMatch(/stroke="var\(--border\)"/);
    expect(tags(markup, "radar:").filter((tag) => /fill-opacity="0"/.test(tag)).length).toBe(2);
  });
});

describe("shadcn label examples", () => {
  /** The label texts with their x, y and anchor. */
  const labels = (markup: string, prefix: string) =>
    [...markup.matchAll(new RegExp(`<text data-ts-key="${prefix}[^"]*"([^>]*)>([^<]*)`, "g"))].map(
      ([, attributes, content]) => ({
        text: content,
        x: Number(/ x="([^"]+)"/.exec(attributes!)?.[1]),
        y: Number(/ y="([^"]+)"/.exec(attributes!)?.[1]),
        anchor: / text-anchor="([^"]+)"/.exec(attributes!)?.[1],
        fill: / fill="([^"]+)"/.exec(attributes!)?.[1],
      }),
    );
  const rects = (markup: string) =>
    tags(markup, "bars:").map((tag) => ({
      key: /data-ts-key="([^"]+)"/.exec(tag)![1]!,
      x: Number(/ x="([^"]+)"/.exec(tag)![1]),
      y: Number(/ y="([^"]+)"/.exec(tag)![1]),
      width: Number(/ width="([^"]+)"/.exec(tag)![1]),
    }));
  const top = { position: "top", offset: 12, fontSize: 12 } as const;
  const size = { initialWidth: 500, height: 250 };

  // bar-label: the value sits 12px above each bar.
  it("draws values above the bars, as shadcn bar-label", () => {
    const bars = (radius: number) =>
      render(
        {
          data: visitorData,
          config: visitorConfig,
          spec: {
            parts: [
              { kind: "grid", vertical: false },
              { ...monthAxis, tickMargin: 10 },
              { kind: "bar", dataKey: "desktop", radius, label: top },
            ],
          },
        },
        size,
      );
    const drawn = labels(bars(8), "bar-labels");
    expect(drawn.map((label) => label.text)).toEqual(["186", "305", "237", "73", "209", "214"]);
    // The radius leaves the layout alone, so the plain bars show where each label sits.
    const plain = bars(0);
    expect(labels(plain, "bar-labels")).toEqual(drawn);
    rects(plain).forEach((rect, index) => {
      const label = drawn[index]!;
      expect(label.x).toBeCloseTo(rect.x + rect.width / 2, 1);
      expect(label.y).toBeCloseTo(rect.y - 12 - 12 * 0.35, 1);
      expect(label.fill).toBe("var(--foreground)");
    });
    // The plot leaves room for the label of the tallest bar.
    for (const label of drawn) expect(label.y - 6).toBeGreaterThanOrEqual(0);
  });

  // line-label: the values sit 12px above the points, and the end labels stay in the chart.
  it("draws values above the points, as shadcn line-label", () => {
    const markup = render(
      {
        data: visitorData,
        config: visitorConfig,
        spec: {
          parts: [
            { kind: "grid", vertical: false },
            { ...monthAxis, tickMargin: 8 },
            {
              kind: "line",
              dataKey: "desktop",
              dot: { fill: "var(--color-desktop)" },
              activeDot: { r: 6 },
              label: top,
            },
          ],
        },
      },
      size,
    );
    const drawn = labels(markup, "line-labels");
    expect(drawn.map((label) => label.text)).toEqual(["186", "305", "237", "73", "209", "214"]);
    const dots = tags(markup, "line-dots:").map((tag) => Number(/ cx="([^"]+)"/.exec(tag)![1]));
    drawn.forEach((label, index) => expect(label.x).toBeCloseTo(dots[index]!, 1));
    // Half of a three-digit label fits on each side.
    expect(drawn[0]!.x - 12).toBeGreaterThanOrEqual(0);
    expect(drawn.at(-1)!.x + 12).toBeLessThanOrEqual(500);
  });

  it("keeps room for the end tick labels when line labels set the side margins", () => {
    const points = (label?: object) =>
      tags(
        render(
          {
            data: visitorData,
            config: visitorConfig,
            spec: {
              parts: [
                { kind: "xAxis", dataKey: "month" },
                { kind: "line", dataKey: "desktop", dot: true, ...(label ? { label } : {}) },
              ],
            },
          },
          size,
        ),
        "line-dots:",
      ).map((tag) => Number(/ cx="([^"]+)"/.exec(tag)![1]));
    const plain = points();
    const labelled = points(top);
    // "January" and "June" keep at least the room that the automatic margin gives them.
    expect(labelled[0]).toBeGreaterThanOrEqual(plain[0]!);
    expect(labelled.at(-1)).toBeLessThanOrEqual(plain.at(-1)!);
  });

  // line-label-custom: each point shows the config label of its browser.
  it("draws config labels from another field, as shadcn line-label-custom", () => {
    const markup = render(
      {
        data: browserData,
        config: browserConfig,
        spec: {
          parts: [
            { kind: "grid", vertical: false },
            {
              kind: "line",
              dataKey: "visitors",
              label: { ...top, dataKey: "browser", formatter: { configLabel: true } },
            },
          ],
        },
      },
      size,
    );
    expect(labels(markup, "line-labels").map((label) => label.text)).toEqual([
      "Chrome",
      "Safari",
      "Firefox",
      "Edge",
      "Other",
    ]);
  });

  const pie = (label: object | boolean, labelLine?: boolean) =>
    render(
      {
        data: pieData,
        config: pieConfig,
        spec: {
          parts: [
            {
              kind: "pie",
              dataKey: "visitors",
              nameKey: "browser",
              label: label as never,
              ...(labelLine === undefined ? {} : { labelLine }),
            },
          ],
        },
      },
      { initialWidth: 250, height: 250 },
    );
  const outerRadius = (markup: string) =>
    Number(/A([\d.]+),/.exec(tags(markup, "slices:")[0]!)![1]);

  // pie-label: each value sits outside its slice, with a line from the slice.
  it("draws values outside the slices with lines, as shadcn pie-label", () => {
    const markup = pie(true);
    const drawn = labels(markup, "slice-labels");
    expect(drawn.map((label) => label.text)).toEqual(["275", "200", "187", "173", "90"]);
    const outer = outerRadius(markup);
    // The pie shrinks below the default 90% to make room for the labels.
    expect(outer).toBeLessThan(0.9 * 125);
    for (const label of drawn) {
      expect(Math.hypot(label.x, label.y)).toBeCloseTo(outer + 20, 1);
      // The text runs away from the pie.
      expect(label.anchor).toBe(label.x > 0 ? "start" : "end");
    }
    const lines = tags(markup, "slice-label-lines:");
    expect(lines).toHaveLength(5);
    expect(lines[0]).toMatch(/stroke="var\(--sw-chart-color-chrome\)"/);
  });

  // pie-label-custom: outside values without lines.
  it("drops the label lines with labelLine false, as shadcn pie-label-custom", () => {
    const markup = pie(true, false);
    expect(labels(markup, "slice-labels")).toHaveLength(5);
    expect(tags(markup, "slice-label-lines")).toHaveLength(0);
  });

  // pie-label-list: the config label of each browser sits inside its slice.
  it("draws config labels inside the slices, as shadcn pie-label-list", () => {
    const markup = pie({
      position: "inside",
      dataKey: "browser",
      fill: "var(--background)",
      fontSize: 12,
      formatter: { configLabel: true },
    });
    const drawn = labels(markup, "slice-labels");
    expect(drawn.map((label) => label.text)).toEqual([
      "Chrome",
      "Safari",
      "Firefox",
      "Edge",
      "Other",
    ]);
    for (const label of drawn) {
      expect(label.fill).toBe("var(--background)");
      expect(label.anchor).toBe("middle");
      expect(Math.hypot(label.x, label.y)).toBeCloseTo(0.9 * 125 * 0.5, 1);
    }
    // Inside labels need no room and no lines.
    expect(outerRadius(markup)).toBeCloseTo(0.9 * 125, 1);
    expect(tags(markup, "slice-label-lines")).toHaveLength(0);
  });

  it("draws the same SVG without labels as with label false", () => {
    const cartesian = (extra: object) =>
      render({
        data: visitorData,
        config: visitorConfig,
        spec: {
          parts: [
            monthAxis,
            { kind: "bar", dataKey: "desktop", ...extra },
            { kind: "line", dataKey: "mobile", ...extra },
          ],
        },
      });
    expect(cartesian({ label: false })).toBe(cartesian({}));
    expect(pie(false)).toBe(
      render(
        {
          data: pieData,
          config: pieConfig,
          spec: { parts: [{ kind: "pie", dataKey: "visitors", nameKey: "browser" }] },
        },
        { initialWidth: 250, height: 250 },
      ),
    );
  });

  // Grouped bar labels follow their own bar, at any width and with a series hidden.
  it("centers the labels of grouped bars on their bars", () => {
    for (const width of [400, 800])
      for (const visible of [undefined, ["mobile"]]) {
        const markup = render(
          {
            data: visitorData,
            config: visitorConfig,
            visible,
            spec: {
              parts: [
                monthAxis,
                { kind: "bar", dataKey: "desktop", label: { position: "inside" } },
                { kind: "bar", dataKey: "mobile", label: { position: "inside" } },
              ],
            },
          },
          { initialWidth: width, height: 250 },
        );
        const bars = rects(markup);
        const drawn = labels(markup, "bar-labels");
        expect(drawn).toHaveLength(bars.length);
        expect(bars.length).toBe(visible ? 6 : 12);
        for (const bar of bars) {
          const label = drawn.find((entry) => Math.abs(entry.x - (bar.x + bar.width / 2)) < 0.1);
          expect(label, `${width} ${bar.key}`).toBeDefined();
        }
      }
  });

  it("puts a stacked area label at the top of its area", () => {
    const area = (label?: object) =>
      render({
        data: visitorData,
        config: visitorConfig,
        spec: {
          parts: [
            monthAxis,
            { kind: "area", dataKey: "desktop", stackId: "a" },
            { kind: "area", dataKey: "mobile", stackId: "a", ...(label ? { label } : {}) },
          ],
        },
      });
    const drawn = labels(area({ position: "inside" }), "area-labels");
    expect(drawn.map((label) => label.text)).toEqual(["80", "200", "120", "190", "130", "140"]);
    // Each top-series label sits above the bottom-series label: at the stack top, not its value.
    const both = render({
      data: visitorData,
      config: visitorConfig,
      spec: {
        parts: [
          monthAxis,
          { kind: "area", dataKey: "desktop", stackId: "a", label: true },
          { kind: "area", dataKey: "mobile", stackId: "a", label: true },
        ],
      },
    });
    const bottom = labels(both, "area-labels").slice(0, 6);
    const stacked = labels(both, "area-labels").slice(6);
    expect(bottom.map((label) => label.text)).toEqual(["186", "305", "237", "73", "209", "214"]);
    stacked.forEach((label, index) => expect(label.y).toBeLessThan(bottom[index]!.y));
  });

  it("puts a stacked bar label in the middle of its segment", () => {
    const markup = render({
      data: visitorData,
      config: visitorConfig,
      spec: {
        parts: [
          monthAxis,
          { kind: "bar", dataKey: "desktop", stackId: "a", label: true },
          { kind: "bar", dataKey: "mobile", stackId: "a", label: true },
        ],
      },
    });
    const bars = rects(markup);
    const drawn = labels(markup, "bar-labels");
    expect(drawn).toHaveLength(12);
    for (const bar of bars) {
      const height = Number(
        / height="([^"]+)"/.exec(tags(markup, "bars:").find((tag) => tag.includes(bar.key))!)![1],
      );
      expect(
        drawn.some(
          (label) =>
            Math.abs(label.x - (bar.x + bar.width / 2)) < 0.1 &&
            Math.abs(label.y - (bar.y + height / 2)) < 0.1,
        ),
      ).toBe(true);
    }
  });

  it("formats labels with a function in framework code and rejects it on the wire", () => {
    const spec: ChartSpec = {
      parts: [
        monthAxis,
        { kind: "bar", dataKey: "desktop", label: { formatter: (value) => `${value} visits` } },
      ],
    };
    const markup = render({ data: visitorData, config: visitorConfig, spec });
    expect(labels(markup, "bar-labels")[0]!.text).toBe("186 visits");
    expect(() => serializeInput({ data: visitorData, config: visitorConfig, spec })).toThrow(
      /ChartBar label formatter is a function/,
    );
  });
});

describe("shadcn line dots", () => {
  // line-dots and line-label: `dot={{ fill: "var(--color-desktop)" }}` and `activeDot={{ r: 6 }}`.
  const line = (dot: unknown, data: object[] = visitorData): ChartInput => ({
    data,
    config: visitorConfig,
    spec: {
      parts: [monthAxis, { kind: "line", dataKey: "desktop", dot, activeDot: { r: 6 } } as any],
    },
  });

  it("draws dots with the look of a dot object", () => {
    const dots = tags(render(line({ fill: "var(--color-desktop)", r: 5 })), "line-dots:");
    expect(dots.length).toBe(6);
    for (const dot of dots) expect(dot).toMatch(/fill="var\(--color-desktop\)"[^>]* r="5"/);
    // `true` keeps the default dots, and `false` draws none.
    expect(tags(render(line(true)), "line-dots:")[0]).toMatch(/ r="3"/);
    expect(tags(render(line(false)), "line-dots:")).toEqual([]);
  });

  it("gives each dot look its own mark and keeps the first mark id", () => {
    const markup = render({
      data: visitorData,
      config: visitorConfig,
      spec: {
        parts: [
          monthAxis,
          { kind: "line", dataKey: "desktop", dot: true },
          { kind: "line", dataKey: "mobile", dot: { r: 5 } },
        ],
      },
    });
    expect(tags(markup, "line-dots:").length).toBe(6);
    expect(tags(markup, "line-dots-2:").length).toBe(6);
    for (const dot of tags(markup, "line-dots-2:")) expect(dot).toMatch(/ r="5"/);
  });
});

describe("ChartFormat configLabel", () => {
  const config: ChartConfig = {
    chrome: { label: "Chrome", color: "var(--chart-1)" },
    safari: { label: "Safari", color: "var(--chart-2)" },
    rich: { label: { rich: true } as any, color: "var(--chart-3)" },
    plain: { label: { rich: true } as any, text: "Plain", color: "var(--chart-4)" },
  };

  it("shows the config label of a value, as chartConfig[value]?.label", () => {
    expect(formatChartValue("chrome", { configLabel: true }, config)).toBe("Chrome");
    // Other values keep their text, and the later steps still run.
    expect(formatChartValue("opera", { configLabel: true }, config)).toBe("opera");
    expect(formatChartValue("safari", { configLabel: true, maxLength: 3 }, config)).toBe("Saf");
    // A rich label shows its text, or its key without text.
    expect(formatChartValue("plain", { configLabel: true }, config)).toBe("Plain");
    expect(formatChartValue("rich", { configLabel: true }, config)).toBe("rich");
  });

  it("labels axis ticks and tooltip headings from config", () => {
    const data = browserData.map(({ browser, visitors }) => ({ browser, visitors }));
    const markup = render({
      data,
      config: browserConfig,
      spec: {
        parts: [
          { kind: "xAxis", dataKey: "browser", tickFormatter: { configLabel: true } },
          { kind: "bar", dataKey: "visitors" },
        ],
      },
    });
    const ticks = [...markup.matchAll(/data-ts-key="x-tick-label:[^"]*"[^>]*>([^<]*)</g)].map(
      (match) => match[1],
    );
    expect(ticks).toEqual(["Chrome", "Safari", "Firefox", "Edge", "Other"]);
    const datum = { [ROW]: data[0], [X]: "chrome", [SERIES]: "visitors", [VALUE]: 275 };
    const body = { content: "", points: [{ datum, color: "red", group: "visitors" }] } as any;
    const view = tooltipView(body, browserConfig, {
      labelKey: "browser",
      labelFormatter: { configLabel: true, suffix: " visits" },
    });
    expect(view.label).toBe("Chrome visits");
  });
});

describe("chart label, gradient and radius edge cases", () => {
  const texts = (markup: string, prefix: string) =>
    [
      ...markup.matchAll(new RegExp(`<text data-ts-key="${prefix}([^"]*)"([^>]*)>([^<]*)`, "g")),
    ].map(([, key, attributes, content]) => ({
      key: key!,
      text: content!,
      x: Number(/ x="([^"]+)"/.exec(attributes!)?.[1]),
      y: Number(/ y="([^"]+)"/.exec(attributes!)?.[1]),
      dy: Number(/ dy="([^"]+)"/.exec(attributes!)?.[1] ?? 0),
    }));
  const barRects = (markup: string) =>
    tags(markup, "bars:").map((tag) => ({
      key: /data-ts-key="bars:([^"]+)"/.exec(tag)![1]!,
      x: Number(/ x="([^"]+)"/.exec(tag)![1]),
      y: Number(/ y="([^"]+)"/.exec(tag)![1]),
      width: Number(/ width="([^"]+)"/.exec(tag)![1]),
      height: Number(/ height="([^"]+)"/.exec(tag)![1]),
    }));

  it("centers a grouped bar label on its own bar when a category misses that bar", () => {
    for (const missing of ["January", "March"]) {
      const data = visitorData.map((row) =>
        row.month === missing ? { ...row, desktop: null } : row,
      );
      const markup = render(
        {
          data,
          config: visitorConfig,
          spec: {
            parts: [
              monthAxis,
              { kind: "bar", dataKey: "desktop", label: { position: "inside" } },
              { kind: "bar", dataKey: "mobile", label: { position: "inside" } },
            ],
          },
        },
        { initialWidth: 600, height: 250 },
      );
      const bars = barRects(markup).filter((bar) => bar.height > 0);
      const drawn = texts(markup, "bar-labels");
      expect(drawn).toHaveLength(11);
      for (const label of drawn) {
        // The label key ends with the mark row id, `<month>-<series>`.
        const id = label.key.slice(label.key.lastIndexOf(":") + 1);
        const bar = bars.find((entry) => entry.key.endsWith(id));
        expect(bar, `${missing} ${id}`).toBeDefined();
        expect(label.x, `${missing} ${id}`).toBeCloseTo(bar!.x + bar!.width / 2, 1);
      }
    }
  });

  it("gives each chart and gradient id pair its own SVG id", () => {
    const input = (gradient: string): ChartInput => ({
      data: visitorData,
      config: visitorConfig,
      spec: {
        parts: [
          monthAxis,
          { kind: "linearGradient", id: gradient, stops: [{ offset: 0, stopColor: "red" }] },
          { kind: "bar", dataKey: "desktop", fill: `url(#${gradient})` },
        ],
      },
    });
    const ids = (markup: string) =>
      [...markup.matchAll(/<linearGradient [^>]*id="([^"]+)"/g)].map((m) => m[1]);
    const first = prerenderChart(undefined, input("b-c"), { id: "chart-a" }).markup;
    const second = prerenderChart(undefined, input("c"), { id: "chart-a-b" }).markup;
    expect(ids(first)).toHaveLength(1);
    expect(ids(second)).toHaveLength(1);
    expect(ids(first)[0]).not.toBe(ids(second)[0]);
    // Each fill names the gradient of its own chart.
    expect(tags(first, "bars:")[0]).toContain(`fill="url(#${ids(first)[0]})"`);
    expect(tags(second, "bars:")[0]).toContain(`fill="url(#${ids(second)[0]})"`);
    // An underscore in the gradient id keeps its own SVG id too.
    const third = prerenderChart(undefined, input("b_hc"), { id: "chart-a" }).markup;
    expect(ids(third)[0]).not.toBe(ids(first)[0]);
  });

  it("keeps the 0.22 fill opacity for an area that fills from an outside SVG url", () => {
    const markup = render({
      data: visitorData,
      config: visitorConfig,
      spec: { parts: [monthAxis, { kind: "area", dataKey: "desktop", fill: "url(#pattern)" }] },
    });
    const area = tags(markup, 'areas[^"]*segment')[0]!;
    expect(area).toMatch(/fill="url\(#pattern\)"/);
    expect(area).toMatch(/fill-opacity="0.22"/);
  });

  it("draws no line label where the line skips a null value", () => {
    const data = visitorData.map((row, index) => ({
      ...row,
      note: `n${index}`,
      desktop: index === 2 ? null : row.desktop,
    }));
    const markup = render({
      data,
      config: visitorConfig,
      spec: {
        parts: [monthAxis, { kind: "line", dataKey: "desktop", label: { dataKey: "note" } }],
      },
    });
    expect(texts(markup, "line-labels").map((label) => label.text)).toEqual([
      "n0",
      "n1",
      "n3",
      "n4",
      "n5",
    ]);
  });

  describe("rounds the free end of a bar that grows down", () => {
    const signed = visitorData.map((row, index) => ({
      ...row,
      desktop: index % 2 ? -(row.desktop ?? 0) : row.desktop,
    }));
    const tuple = [4, 4, 0, 0] as [number, number, number, number];
    const desktop = (radius: number | [number, number, number, number], stackId?: string) =>
      tags(
        render({
          data: signed,
          config: visitorConfig,
          spec: {
            parts: [
              monthAxis,
              { kind: "bar", dataKey: "desktop", radius, ...(stackId ? { stackId } : {}) },
              { kind: "bar", dataKey: "mobile", radius: 4, ...(stackId ? { stackId } : {}) },
            ],
          },
        }),
        'bars:[^"]*-desktop',
      );

    it("flips a radius tuple on a negative grouped bar, as Recharts", () => {
      const bars = desktop(tuple);
      // Clockwise from the top right: a positive bar rounds its top, a negative bar its bottom.
      expect(arcRadii(bars[0]!)).toEqual([4, 0, 0, 4]);
      expect(arcRadii(bars[1]!)).toEqual([0, 4, 4, 0]);
      expect(bars).toEqual(desktop(4));
    });

    it("flips a radius tuple on a negative bar in a stack", () => {
      const bars = desktop(tuple, "a");
      expect(arcRadii(bars[0]!)).toEqual([4, 0, 0, 4]);
      expect(arcRadii(bars[1]!)).toEqual([0, 4, 4, 0]);
    });
  });

  describe("reads the direction of an expanded stack from its bounds", () => {
    // Every value is negative, so the stack to 100% draws each segment above zero.
    const negative = visitorData.map((row) => ({
      ...row,
      desktop: -4,
      mobile: -6,
      tablet: 5,
    }));
    const config = { ...visitorConfig, tablet: { label: "Tablet", color: "var(--chart-3)" } };
    const chart = (
      desktop: number | [number, number, number, number],
      mobile: number | [number, number, number, number],
      extra: object[] = [],
    ) =>
      render(
        {
          data: negative,
          config,
          spec: {
            stackOffset: "expand",
            parts: [
              monthAxis,
              { kind: "bar", dataKey: "desktop", stackId: "a", radius: desktop },
              {
                kind: "bar",
                dataKey: "mobile",
                stackId: "a",
                radius: mobile,
                label: { position: "outside" },
              },
              ...(extra as never[]),
            ],
          },
        },
        { initialWidth: 500, height: 250 },
      );
    const january = (markup: string, key: string) => tags(markup, `bars:[^"]*January-${key}`)[0]!;

    for (const [name, extra] of [
      ["alone", []],
      ["beside a plain bar", [{ kind: "bar", dataKey: "tablet", radius: 4 }]],
    ] as const)
      it(`rounds and labels the top of the stack ${name}`, () => {
        // A lone stack rounds only its outer segment. Beside a plain bar, each segment of a stack
        // rounds its own free end. The bottom tuple rounds the baseline, as shadcn bar-stacked.
        const inner = name === "alone" ? [0, 0, 0, 0] : [4, 0, 0, 4];
        for (const [markup, desktopRadii] of [
          [chart(4, 4, extra as never), inner],
          [chart([0, 0, 4, 4], [4, 4, 0, 0], extra as never), [0, 4, 4, 0]],
          [chart(4, [4, 4, 0, 0], extra as never), inner],
        ] as const) {
          const desktop = january(markup, "desktop");
          const mobile = january(markup, "mobile");
          // mobile is the top segment and rounds its top.
          expect(arcRadii(mobile)).toEqual([4, 0, 0, 4]);
          expect(arcRadii(desktop)).toEqual(desktopRadii);
          // The outside label sits above the top segment.
          const d = / d="([^"]*)"/.exec(mobile)![1]!;
          const top = Math.min(
            ...[...d.matchAll(/(?:M| )([\d.]+),([\d.]+)/g)].map((m) => Number(m[2])),
          );
          const label = texts(markup, "bar-labels").find((entry) =>
            entry.key.endsWith("January-mobile"),
          )!;
          expect(label.y + label.dy).toBeLessThan(top);
        }
      });
  });

  it("keeps the x-axis below the outside label of a negative bar", () => {
    const data = visitorData.map((row, index) => ({
      ...row,
      desktop: index === 1 ? -400 : row.desktop,
    }));
    for (const axisLine of [false, true]) {
      const markup = render(
        {
          data,
          config: visitorConfig,
          spec: {
            parts: [
              { kind: "xAxis", dataKey: "month", axisLine },
              { kind: "bar", dataKey: "desktop", label: { position: "outside" } },
            ],
          },
        },
        { initialWidth: 500, height: 250 },
      );
      const label = texts(markup, "bar-labels").find((entry) => entry.text === "-400")!;
      // The label text is 12px high around its middle line.
      const bottom = label.y + label.dy + 6;
      const tick = texts(markup, "x-tick-label").find((entry) => entry.text === "February")!;
      // An 11px tick label reaches about 9px above its baseline.
      expect(bottom, `axisLine ${axisLine}`).toBeLessThanOrEqual(tick.y - 9);
      expect(tick.y).toBeLessThanOrEqual(250);
      const bar = barRects(markup).find((entry) => entry.key.endsWith("February-desktop"))!;
      expect(label.y + label.dy).toBeGreaterThan(bar.y + bar.height);
      if (axisLine) {
        const line = /<line data-ts-key="x-axis[^"]*"[^>]* y1="([^"]+)"/.exec(markup);
        expect(line, "axis line").not.toBeNull();
        expect(Number(line![1])).toBeGreaterThanOrEqual(bottom);
      }
    }
  });

  it("shows the config label of a string heading without labelKey, as shadcn", () => {
    const data = browserData.map(({ browser, visitors }) => ({ browser, visitors }));
    const datum = { [ROW]: data[0], [X]: "chrome", [SERIES]: "visitors", [VALUE]: 275 };
    const body = {
      content: { title: "chrome", rows: [{ label: "Visitors", value: "275" }] },
      points: [{ datum, color: "red", group: "visitors" }],
    } as any;
    // The plain heading shows the config label.
    expect(tooltipLayout(body, browserConfig).heading).toBe("Chrome");
    // A ChartFormat formats the config label.
    expect(tooltipView(body, browserConfig, { labelFormatter: { suffix: " visits" } }).label).toBe(
      "Chrome visits",
    );
    // A function receives the config label.
    const labelFormatter = vi.fn((label: unknown) => `${label}!`);
    expect(tooltipView(body, browserConfig, { labelFormatter }).label).toBe("Chrome!");
    expect(labelFormatter).toHaveBeenCalledWith("Chrome", expect.anything());
    // A heading that is no config key stays as it is.
    const other = { ...body, content: { ...body.content, title: "opera" } };
    expect(tooltipView(other, browserConfig, { labelFormatter: { suffix: "!" } }).label).toBe(
      "opera!",
    );
  });
});
