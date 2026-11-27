import { describe, expect, it, vi } from "vitest";

import {
  buildChartSpec,
  type ChartConfig,
  type ChartInput,
  type ChartModule,
  type ChartSpec,
  type ChartTickFormatter,
  chartSpecAriaLabel,
  createChartOptions,
  createChartSpecFactory,
  datesToStrings,
  formatChartValue,
  isChartSpecComplete,
  prerenderChart,
  resolveTickFormatter,
  serializeChartPayload,
} from "../../../src/components/chart";
import { ID, ROW, SERIES, VALUE, X } from "../../../src/components/chart/datum";
import { tooltipView } from "../../../src/components/chart/presentation";
import {
  areaChart,
  barChart,
  browserConfig,
  browserData,
  donutChart,
  lineChart,
  monthConfig,
  months,
  radarChart,
  radialChart,
  visitorConfig,
  visitorData,
} from "./reference-charts";

const monthAxis = {
  kind: "xAxis",
  dataKey: "month",
  tickFormatter: { maxLength: 3 },
} as const;

interface Case {
  name: string;
  module: ChartModule<any, any, any, any>;
  data: readonly object[];
  config: ChartConfig;
  spec: ChartSpec;
  /** Visible key sets to compare besides every key. */
  visible: (readonly string[])[];
}

// Each spec picks props the way the docs examples will.
const cases: Case[] = [
  {
    name: "bar",
    module: barChart,
    data: visitorData,
    config: visitorConfig,
    spec: {
      parts: [
        { kind: "grid", vertical: false },
        monthAxis,
        { kind: "yAxis" },
        { kind: "bar", dataKey: "desktop", radius: 4 },
        { kind: "bar", dataKey: "mobile", radius: 4 },
      ],
    },
    visible: [["desktop"], ["mobile"], []],
  },
  {
    name: "area",
    module: areaChart,
    data: visitorData,
    config: visitorConfig,
    spec: {
      parts: [
        { kind: "grid", vertical: false },
        monthAxis,
        { kind: "yAxis" },
        { kind: "area", dataKey: "desktop", type: "monotone", stackId: "a" },
        { kind: "area", dataKey: "mobile", type: "monotone", stackId: "a" },
      ],
    },
    visible: [["desktop"], ["mobile"], []],
  },
  {
    name: "line",
    module: lineChart,
    data: visitorData,
    config: visitorConfig,
    spec: {
      parts: [
        { kind: "grid", vertical: false },
        monthAxis,
        { kind: "line", dataKey: "desktop", type: "natural" },
      ],
    },
    visible: [["mobile"], []],
  },
  {
    name: "donut",
    module: donutChart,
    data: visitorData,
    config: monthConfig,
    spec: {
      parts: [
        { kind: "pie", dataKey: "desktop", nameKey: "month", innerRadius: "58.5%" },
        { kind: "label", position: "center" },
      ],
    },
    visible: [months.slice(1), ["March"], []],
  },
  {
    name: "radar",
    module: radarChart,
    data: visitorData,
    config: visitorConfig,
    spec: {
      parts: [
        { kind: "polarGrid" },
        { kind: "polarAngleAxis", dataKey: "month", tickFormatter: { maxLength: 3 } },
        { kind: "radar", dataKey: "desktop" },
        { kind: "radar", dataKey: "mobile" },
      ],
    },
    visible: [["desktop"], ["mobile"], []],
  },
  {
    name: "radial",
    module: radialChart as ChartModule<any, any, any, any>,
    data: browserData,
    config: browserConfig,
    spec: {
      parts: [
        {
          kind: "radialBar",
          dataKey: "visitors",
          nameKey: "browser",
          background: true,
        },
      ],
    },
    visible: [
      ["visitors", "safari", "firefox", "edge", "other"],
      ["visitors", "edge"],
    ],
  },
];

function renderBoth(item: Case, visible?: readonly string[]) {
  const input: ChartInput = { data: item.data, config: item.config, visible };
  const reference = prerenderChart(item.module, input, { id: "chart-reference" });
  // A factory cannot carry the module's host options or accessible name, so the host passes them.
  const spec = prerenderChart(
    undefined,
    { ...input, spec: item.spec },
    { id: "chart-reference", host: { ariaLabel: item.module.ariaLabel, ...item.module.host } },
  );
  return { reference: reference.markup, spec: spec.markup };
}

describe("chart spec matches the docs chart modules", () => {
  for (const item of cases) {
    it(`renders the same ${item.name} chart SVG`, () => {
      const { reference, spec } = renderBoth(item);
      expect(reference.length).toBeGreaterThan(1000);
      expect(spec).toBe(reference);
    });

    it(`renders the same ${item.name} chart SVG when series hide`, () => {
      for (const visible of item.visible) {
        const { reference, spec } = renderBoth(item, visible);
        expect(spec, `visible: ${visible.join(",")}`).toBe(reference);
      }
    });
  }
});

describe("chart spec defaults", () => {
  it("draws the same bars with the default radius written out", () => {
    const render = (radius?: number) =>
      prerenderChart(
        undefined,
        {
          data: visitorData,
          config: visitorConfig,
          spec: {
            parts: [
              monthAxis,
              { kind: "bar", dataKey: "desktop", ...(radius === undefined ? {} : { radius }) },
            ],
          },
        },
        { id: "chart-default-radius" },
      ).markup;

    expect(render(0)).toBe(render());
  });
});

describe("chart spec visibility", () => {
  const bars: ChartSpec = {
    parts: [monthAxis, { kind: "bar", dataKey: "desktop" }, { kind: "bar", dataKey: "mobile" }],
  };

  it("removes hidden series and keeps every category", () => {
    const all = prerenderChart(
      undefined,
      { data: visitorData, config: visitorConfig, spec: bars },
      { id: "chart-visible" },
    ).markup;
    const desktop = prerenderChart(
      undefined,
      { data: visitorData, config: visitorConfig, spec: bars, visible: ["desktop"] },
      { id: "chart-visible" },
    ).markup;
    const none = prerenderChart(
      undefined,
      { data: visitorData, config: visitorConfig, spec: bars, visible: [] },
      { id: "chart-visible" },
    ).markup;

    expect(all.match(/data-ts-key="bars:[^"]*-mobile"/g)).toHaveLength(6);
    expect(desktop.match(/data-ts-key="bars:[^"]*-desktop"/g)).toHaveLength(6);
    expect(desktop).not.toMatch(/-mobile"/);
    expect(none).not.toMatch(/data-ts-key="bars:/);
    for (const markup of [all, desktop, none])
      expect(markup.match(/data-ts-key="x-tick-label:/g)).toHaveLength(6);
  });

  it("removes hidden pie slices by nameKey value", () => {
    const markup = prerenderChart(
      undefined,
      {
        data: visitorData,
        config: monthConfig,
        visible: ["January", "June"],
        spec: { parts: [{ kind: "pie", dataKey: "desktop", nameKey: "month" }] },
      },
      { id: "chart-pie" },
    ).markup;
    expect(markup.match(/data-ts-key="slices:[^"]+"/g)).toHaveLength(2);
  });
});

describe("chart spec rules", () => {
  it("lets cartesian marks mix", () => {
    const markup = prerenderChart(
      undefined,
      {
        data: visitorData,
        config: visitorConfig,
        spec: {
          parts: [
            monthAxis,
            { kind: "bar", dataKey: "desktop" },
            { kind: "line", dataKey: "mobile" },
            { kind: "area", dataKey: "mobile" },
          ],
        },
      },
      { id: "chart-mixed" },
    ).markup;
    expect(markup).toContain('data-ts-key="bars"');
    expect(markup).toContain('data-ts-key="lines:');
    expect(markup).toContain('data-ts-key="areas"');
  });

  const render = (spec: ChartSpec) =>
    prerenderChart(
      undefined,
      { data: visitorData, config: visitorConfig, spec },
      { id: "chart-rule" },
    ).markup;
  const attribute = (markup: string, key: string, name: string) =>
    new RegExp(`data-ts-key="${key}"[^>]*? ${name}="([^"]+)"`).exec(markup)?.[1];

  it("stacks bars with a shared stackId and groups the others", () => {
    const stacked = render({
      parts: [
        monthAxis,
        { kind: "bar", dataKey: "desktop", stackId: "a" },
        { kind: "bar", dataKey: "mobile", stackId: "a" },
      ],
    });
    const grouped = render({
      parts: [
        monthAxis,
        { kind: "bar", dataKey: "desktop", stackId: "a" },
        { kind: "bar", dataKey: "mobile", stackId: "b" },
      ],
    });
    const x = (markup: string, series: string) =>
      attribute(markup, `bars:string:\\d+:${series}:string:\\d+:January-${series}`, "x");
    expect(x(stacked, "desktop")).toBeDefined();
    expect(x(stacked, "mobile")).toBe(x(stacked, "desktop"));
    expect(x(grouped, "mobile")).not.toBe(x(grouped, "desktop"));
  });

  it("stacks areas with a shared stackId and overlaps the others", () => {
    const parts = (stackId?: string): ChartSpec => ({
      parts: [
        monthAxis,
        { kind: "area", dataKey: "desktop", stackId },
        { kind: "area", dataKey: "mobile", stackId },
      ],
    });
    const stacked = render(parts("a"));
    const overlapped = render(parts());
    const cy = (markup: string) =>
      Number(attribute(markup, "active-values:string:6:mobile:string:14:January-mobile", "cy"));
    expect(stacked).not.toContain('data-ts-key="areas-2"');
    expect(overlapped).toContain('data-ts-key="areas-2"');
    // The overlapped mobile value starts at zero, so its dot sits lower than the stacked one.
    expect(cy(overlapped)).toBeGreaterThan(cy(stacked));
  });

  it("rejects a polar mark beside another kind", () => {
    expect(() =>
      createChartSpecFactory({
        parts: [
          { kind: "pie", dataKey: "desktop", nameKey: "month" },
          { kind: "bar", dataKey: "mobile" },
        ],
      }),
    ).toThrow(
      "ChartPie cannot share a chart with ChartBar. A pie, radar or radial bar chart takes one mark kind. Only ChartBar, ChartLine and ChartArea can mix.",
    );
    expect(() =>
      createChartSpecFactory({
        parts: [
          { kind: "radar", dataKey: "desktop" },
          { kind: "radialBar", dataKey: "visitors", nameKey: "browser" },
        ],
      }),
    ).toThrow("ChartRadar cannot share a chart with ChartRadialBar.");
  });

  it("rejects a spec without marks and a second pie", () => {
    expect(() => createChartSpecFactory({ parts: [monthAxis] })).toThrow(
      "A chart spec needs a mark part",
    );
    expect(() =>
      createChartSpecFactory({
        parts: [
          { kind: "pie", dataKey: "desktop", nameKey: "month" },
          { kind: "pie", dataKey: "mobile", nameKey: "month" },
        ],
      }),
    ).toThrow("A chart takes one ChartPie.");
  });

  it("asks for a category key when no field can be one", () => {
    const input = {
      data: visitorData.map(({ desktop, mobile }) => ({ desktop, mobile })),
      config: visitorConfig,
      spec: { parts: [{ kind: "bar", dataKey: "desktop" }] },
    } as ChartInput;
    expect(() => prerenderChart(undefined, input, { id: "chart-axis" })).toThrow(
      "A ChartBar, ChartLine or ChartArea chart needs a ChartXAxis with the category dataKey, or data rows with a string or Date category field.",
    );
    const radar = {
      data: visitorData,
      config: visitorConfig,
      spec: { parts: [{ kind: "radar", dataKey: "desktop" }] },
    } as ChartInput;
    expect(() => prerenderChart(undefined, radar, { id: "chart-axis" })).toThrow(
      "A ChartRadar chart needs a ChartPolarAngleAxis with the category dataKey.",
    );
  });

  it("rejects a spec together with chart or definition", () => {
    const input: ChartInput = {
      data: visitorData,
      config: visitorConfig,
      spec: cases[0]!.spec,
    };
    const message =
      "A chart spec cannot be combined with chart or definition. Use chart parts, a chart module or a native definition, not more than one.";
    expect(() => createChartOptions(barChart, input, { id: "chart-both" })).toThrow(message);
    const definition = barChart.create as never;
    expect(() =>
      createChartOptions(undefined, input, { id: "chart-both", definition: definition }),
    ).toThrow(message);
  });

  it("builds a default accessible name from the mark kind and config labels", () => {
    expect(chartSpecAriaLabel(cases[0]!.spec, visitorConfig)).toBe(
      "Bar chart of Desktop and Mobile",
    );
    expect(
      chartSpecAriaLabel(
        {
          parts: [
            monthAxis,
            { kind: "bar", dataKey: "desktop" },
            { kind: "line", dataKey: "mobile" },
          ],
        },
        visitorConfig,
      ),
    ).toBe("Bar and line chart of Desktop and Mobile");
    expect(chartSpecAriaLabel(cases[5]!.spec, browserConfig)).toBe("Radial bar chart of Visitors");
    const markup = prerenderChart(
      undefined,
      { data: visitorData, config: visitorConfig, spec: cases[0]!.spec },
      { id: "chart-name" },
    ).markup;
    expect(markup).toContain('aria-label="Bar chart of Desktop and Mobile"');
    const named = prerenderChart(
      undefined,
      { data: visitorData, config: visitorConfig, spec: cases[0]!.spec },
      { id: "chart-name", host: { ariaLabel: "Visitors" } },
    ).markup;
    expect(named).toContain('aria-label="Visitors"');
  });
});

describe("chart spec wire payload", () => {
  it("carries the spec as data", () => {
    const text = serializeChartPayload({
      input: { data: visitorData, config: visitorConfig, spec: cases[0]!.spec },
    });
    expect(JSON.parse(text).input.spec).toEqual(cases[0]!.spec);
  });

  it("names ChartFormat when a tickFormatter is a function", () => {
    const spec: ChartSpec = {
      parts: [
        { kind: "xAxis", dataKey: "month", tickFormatter: (value: string) => value.slice(0, 3) },
        { kind: "bar", dataKey: "desktop" },
      ],
    };
    expect(() =>
      serializeChartPayload({ input: { data: visitorData, config: visitorConfig, spec } }),
    ).toThrow(
      "ChartXAxis tickFormatter is a function, and a function cannot reach the browser. Use a ChartFormat object such as { maxLength: 3 }, or move the formatter into a chart module.",
    );
  });

  it("accepts a function tickFormatter in process", () => {
    const format = (value: string) => value.slice(0, 3);
    const render = (tickFormatter: ChartTickFormatter) =>
      prerenderChart(
        undefined,
        {
          data: visitorData,
          config: visitorConfig,
          spec: {
            parts: [
              { kind: "xAxis", dataKey: "month", tickFormatter },
              { kind: "bar", dataKey: "desktop" },
            ],
          },
        },
        { id: "chart-format" },
      ).markup;
    expect(render(format)).toBe(render({ maxLength: 3 }));
  });
});

describe("chart spec without ChartXAxis", () => {
  const draw = (data: readonly object[], config: ChartConfig, parts: ChartSpec["parts"]) =>
    prerenderChart(undefined, { data, config, spec: { parts } }, { id: "chart-no-axis" }).markup;

  it("draws bars, lines and areas from the first string field, with no x-axis labels", () => {
    const bars = draw(visitorData, visitorConfig, [
      { kind: "grid", vertical: false },
      { kind: "bar", dataKey: "desktop" },
      { kind: "bar", dataKey: "mobile" },
    ]);
    expect(bars.match(/data-ts-key="bars:[^"]*-desktop"/g)).toHaveLength(6);
    expect(bars).toContain("January-desktop");
    expect(bars).not.toMatch(/>Jan(uary)?<\/text>/);
    // The same chart with a hidden ChartXAxis draws the same marks.
    expect(bars).toBe(
      draw(visitorData, visitorConfig, [
        { kind: "grid", vertical: false },
        { kind: "xAxis", dataKey: "month", hide: true },
        { kind: "bar", dataKey: "desktop" },
        { kind: "bar", dataKey: "mobile" },
      ]),
    );
    expect(draw(visitorData, visitorConfig, [{ kind: "line", dataKey: "desktop" }])).toContain(
      'data-ts-key="lines:',
    );
    expect(draw(visitorData, visitorConfig, [{ kind: "area", dataKey: "desktop" }])).toContain(
      'data-ts-key="areas"',
    );
  });

  it("skips config keys, mark dataKeys and fields that are not text or Date", () => {
    const data = visitorData.map((row, index) => ({
      id: index,
      desktop: row.desktop,
      label: "desktop",
      day: new Date(Date.UTC(2024, 0, index + 1)),
      month: row.month,
    }));
    const config = { ...visitorConfig, label: { label: "Label" } };
    const markup = draw(data, config, [{ kind: "bar", dataKey: "desktop" }]);
    expect(markup).toContain("2024-01-01T00:00:00.000Z-desktop");
    expect(markup).not.toContain("January-desktop");
  });
});

describe("chart spec completeness", () => {
  it("needs a mark part and the category axis of a cartesian or radar chart", () => {
    expect(isChartSpecComplete(undefined)).toBe(false);
    expect(isChartSpecComplete({ parts: [{ kind: "xAxis", dataKey: "month" }] })).toBe(false);
    expect(isChartSpecComplete({ parts: [{ kind: "bar", dataKey: "desktop" }] })).toBe(false);
    // Without a ChartXAxis, the data gives the category key.
    expect(isChartSpecComplete({ parts: [{ kind: "bar", dataKey: "desktop" }] }, visitorData)).toBe(
      true,
    );
    expect(isChartSpecComplete({ parts: [{ kind: "bar", dataKey: "desktop" }] }, [])).toBe(false);
    expect(isChartSpecComplete({ parts: [{ kind: "bar", dataKey: "month" }] }, visitorData)).toBe(
      false,
    );
    expect(
      isChartSpecComplete({ parts: [{ kind: "bar", dataKey: "desktop" }] }, visitorData, {
        month: { label: "Month" },
      }),
    ).toBe(false);
    expect(
      isChartSpecComplete({
        parts: [
          { kind: "xAxis", dataKey: "month" },
          { kind: "bar", dataKey: "desktop" },
        ],
      }),
    ).toBe(true);
    expect(isChartSpecComplete({ parts: [{ kind: "radar", dataKey: "desktop" }] })).toBe(false);
    expect(
      isChartSpecComplete({ parts: [{ kind: "pie", dataKey: "desktop", nameKey: "month" }] }),
    ).toBe(true);
    // A spec with every part but a mix that cannot draw is complete, so the draw still throws.
    expect(
      isChartSpecComplete({
        parts: [
          { kind: "pie", dataKey: "desktop", nameKey: "month" },
          { kind: "bar", dataKey: "desktop" },
        ],
      }),
    ).toBe(true);
  });
});

describe("chart spec dates", () => {
  const dateSpec: ChartSpec = {
    parts: [
      {
        kind: "xAxis",
        dataKey: "day",
        tickFormatter: { date: { month: "short", day: "numeric" } },
      },
      { kind: "line", dataKey: "desktop" },
    ],
  };
  const days = ["2024-04-01T00:00:00.000Z", "2024-04-02T00:00:00.000Z"];

  it("sends Date fields as ISO strings on the wire only", () => {
    const withDates = days.map((day, i) => ({ day: new Date(day), desktop: 10 + i }));
    const withStrings = days.map((day, i) => ({ day, desktop: 10 + i }));
    const text = serializeChartPayload({
      input: { data: withDates, config: visitorConfig, spec: dateSpec },
    });
    expect(JSON.parse(text).input.data.map((row: { day: string }) => row.day)).toEqual(days);
    const render = (data: unknown[]) =>
      prerenderChart(undefined, { data, config: visitorConfig, spec: dateSpec }, { id: "dates" })
        .markup;
    // The wire data draws the same chart as string data, so a server render from it matches the
    // browser restart.
    expect(render(datesToStrings(withDates))).toBe(render(withStrings));
    // Date data draws the same tick text and mark ids, with no host time zone text.
    const ticks = (markup: string) => [...markup.matchAll(/>([^<>]+)<\/text>/g)].map((m) => m[1]);
    expect(ticks(render(withDates))).toEqual(ticks(render(withStrings)));
    expect(render(withDates)).toContain(`${days[0]}-desktop`);
  });

  it("labels Date radar angles with ISO text and draws Date-keyed radial bars", () => {
    const withDates = days.map((day, i) => ({ day: new Date(day), desktop: 10 + i }));
    const withStrings = days.map((day, i) => ({ day, desktop: 10 + i }));
    const radar = (data: unknown[]) =>
      prerenderChart(
        undefined,
        {
          data,
          config: visitorConfig,
          spec: {
            parts: [
              { kind: "polarAngleAxis", dataKey: "day" },
              { kind: "radar", dataKey: "desktop" },
            ],
          },
        },
        { id: "radar-dates" },
      ).markup;
    expect(radar(withDates)).toContain(`>${days[0]}</text>`);
    const text = (markup: string) => [...markup.matchAll(/>([^<>]+)<\/text>/g)].map((m) => m[1]);
    expect(text(radar(withDates))).toEqual(text(radar(withStrings)));
    const radialInput = (data: unknown[]): ChartInput => ({
      data,
      config: visitorConfig,
      spec: { parts: [{ kind: "radialBar", dataKey: "desktop", nameKey: "day" }] },
    });
    const radial = (data: unknown[]) =>
      prerenderChart(undefined, radialInput(data), { id: "radial-dates" }).markup;
    // Date names have no config entry, so the chart warns once and uses fallback colors.
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    try {
      expect(radial(withDates).match(/data-ts-key="bars:[^"]*"/g)).toHaveLength(2);
      expect(radial(withDates)).toBe(radial(withStrings));
    } finally {
      warn.mockRestore();
    }
  });

  it("hands Date values to a function tick formatter in framework code", () => {
    const withDates = days.map((day, i) => ({ day: new Date(day), desktop: 10 + i }));
    const months = ["Jan", "Feb", "Mar", "Apr", "May"];
    const spec: ChartSpec = {
      parts: [
        {
          kind: "xAxis",
          dataKey: "day",
          tickFormatter: (value: Date) => `${months[value.getUTCMonth()]} ${value.getUTCDate()}`,
        },
        { kind: "line", dataKey: "desktop" },
      ],
    };
    const markup = prerenderChart(
      undefined,
      { data: withDates, config: visitorConfig, spec },
      { id: "dates-function" },
    ).markup;
    expect(markup).toContain(">Apr 1</text>");
    expect(markup).toContain(">Apr 2</text>");
  });
});

describe("chart format", () => {
  it("keeps the first characters with maxLength", () => {
    for (const month of months)
      expect(formatChartValue(month, { maxLength: 3 })).toBe(month.slice(0, 3));
    expect(resolveTickFormatter({ maxLength: 3 })!("February")).toBe("Feb");
  });

  it("formats numbers and dates in en-US by default", () => {
    expect(formatChartValue(1234.5, { number: {} })).toBe("1,234.5");
    expect(formatChartValue(0.25, { number: { style: "percent" } })).toBe("25%");
    expect(formatChartValue(1234.5, { number: {}, locale: "de-DE" })).toBe("1.234,5");
    expect(
      formatChartValue("2024-04-01T12:00:00Z", {
        date: { month: "short", day: "numeric", timeZone: "UTC" },
      }),
    ).toBe("Apr 1");
    expect(
      formatChartValue(new Date(Date.UTC(2024, 0, 5)), {
        date: { month: "long", timeZone: "UTC" },
      }),
    ).toBe("January");
  });

  it("runs number or date, then maxLength, then prefix and suffix", () => {
    expect(formatChartValue(1234567, { number: {}, maxLength: 5, prefix: "$", suffix: "+" })).toBe(
      "$1,234+",
    );
    expect(
      formatChartValue("2024-04-01T12:00:00Z", {
        date: { month: "long", timeZone: "UTC" },
        maxLength: 3,
        suffix: ".",
      }),
    ).toBe("Apr.");
  });

  it("keeps values that the format cannot read", () => {
    expect(formatChartValue("n/a", { number: {} })).toBe("n/a");
    expect(formatChartValue("soon", { date: { month: "short" } })).toBe("soon");
    expect(formatChartValue(null, { prefix: "$" })).toBe("$");
    expect(formatChartValue(42, {})).toBe("42");
  });
});

const definitionOf = (input: ChartInput) =>
  createChartOptions(undefined, input, { id: "chart-def" }).definition as any;

const tickLabels = (markup: string) =>
  [...markup.matchAll(/data-ts-key="x-tick-label:[^"]*"[^>]*>([^<]*)</g)].map((match) => match[1]);

describe("chart spec mark rows", () => {
  const rows = [
    { id: "a", series: "s", value: 99, desktop: 10, mobile: 4 },
    { id: "b", series: "s", value: 99, desktop: 20, mobile: 8 },
  ];

  it("keeps a category field that shares a channel name", () => {
    const markup = prerenderChart(
      undefined,
      {
        data: rows,
        config: visitorConfig,
        spec: {
          parts: [
            { kind: "xAxis", dataKey: "id" },
            { kind: "bar", dataKey: "desktop" },
            { kind: "bar", dataKey: "mobile" },
          ],
        },
      },
      { id: "chart-rows" },
    ).markup;
    expect(tickLabels(markup)).toEqual(["a", "b"]);
  });

  it("reads a pie nameKey that shares a channel name", () => {
    const markup = prerenderChart(
      undefined,
      {
        data: browserData.map(({ browser, visitors }) => ({ value: browser, visitors })),
        config: browserConfig,
        spec: { parts: [{ kind: "pie", dataKey: "visitors", nameKey: "value" }] },
      },
      { id: "chart-rows" },
    ).markup;
    const slices = [...markup.matchAll(/data-ts-key="slices:[^"]*:(\w+)"/g)].map((m) => m[1]);
    expect(slices).toEqual(["chrome", "safari", "firefox", "edge", "other"]);
    expect(markup).toContain('fill="var(--sw-chart-color-chrome)"');
  });

  it("gives tooltips and formatters the user's row", () => {
    const definition = definitionOf({
      data: rows,
      config: visitorConfig,
      spec: {
        parts: [
          { kind: "xAxis", dataKey: "id" },
          { kind: "bar", dataKey: "desktop" },
        ],
      },
    });
    const datum = { [ROW]: rows[0], [X]: "a", [SERIES]: "desktop", [VALUE]: 10, [ID]: "a-desktop" };
    const point = { datum, color: "red", group: "desktop" };
    const content = definition.tooltip.content([point]);
    expect(content.title).toBe("a");
    expect(content.rows).toEqual([{ label: "Desktop", value: "10", color: "red" }]);
    const view = tooltipView({ content, points: [point] } as any, visitorConfig);
    expect(view.rows[0]!.item.payload).toBe(rows[0]);
    expect(view.rows[0]!.item.value).toBe(10);
    // A user `nameKey`, `valueKey` and `labelKey` read the user's row.
    const formatter = vi.fn((..._args: unknown[]) => "x");
    const custom = tooltipView({ content: "", points: [point] } as any, visitorConfig, {
      labelKey: "id",
      valueKey: "value",
      nameKey: "series",
      formatter,
    });
    expect(custom.label).toBe("a");
    expect(custom.rows[0]!.item.value).toBe(99);
    expect(custom.rows[0]!.item.name).toBe("s");
    expect(formatter.mock.calls[0]![4]).toBe(rows[0]);
  });
});

describe("chart spec stacks", () => {
  const data = visitorData.map((row) => ({ ...row, tablet: 50 }));
  const config = { ...visitorConfig, tablet: { label: "Tablet", color: "var(--chart-3)" } };
  const render = (spec: ChartSpec) =>
    prerenderChart(undefined, { data, config, spec }, { id: "chart-stack" }).markup;
  const attribute = (markup: string, key: string, name: string) =>
    new RegExp(`data-ts-key="${key}"[^>]*? ${name}="([^"]+)"`).exec(markup)?.[1];

  it("puts a stack and a plain bar in two grouped slots", () => {
    const markup = render({
      parts: [
        monthAxis,
        { kind: "yAxis" },
        { kind: "bar", dataKey: "desktop", stackId: "actual" },
        { kind: "bar", dataKey: "mobile", stackId: "actual" },
        { kind: "bar", dataKey: "tablet" },
      ],
    });
    const bar = (series: string, name: string) =>
      Number(attribute(markup, `bars:[^"]*:January-${series}`, name));
    expect(bar("mobile", "x")).toBe(bar("desktop", "x"));
    expect(bar("tablet", "x")).toBeGreaterThan(bar("desktop", "x"));
    expect(bar("tablet", "width")).toBeCloseTo(bar("desktop", "width"), 6);
    // Mobile sits on top of desktop: its bottom is the desktop top.
    expect(bar("mobile", "y") + bar("mobile", "height")).toBeCloseTo(bar("desktop", "y"), 1);
    // The y domain covers the stack total, 186 + 80, and the tallest month, 305 + 200.
    expect(tickLabels(markup)).toHaveLength(6);
    expect(markup).toMatch(/data-ts-key="y-tick-label:[^"]*"[^>]*>(5|6)00</);
  });

  it("keeps each stacked area's own style over one set of stack bounds", () => {
    const shared = render({
      parts: [
        monthAxis,
        { kind: "area", dataKey: "desktop", stackId: "a" },
        { kind: "area", dataKey: "mobile", stackId: "a" },
      ],
    });
    const split = render({
      parts: [
        monthAxis,
        { kind: "area", dataKey: "desktop", stackId: "a", fillOpacity: 0.4, strokeWidth: 1 },
        { kind: "area", dataKey: "mobile", stackId: "a", fillOpacity: 0.1 },
      ],
    });
    const path = (markup: string, series: string) =>
      new RegExp(`data-ts-key="areas(?:-2)?:[^"]*:${series}:[^"]*"[^>]*? d="([^"]+)"`).exec(
        markup,
      )?.[1];
    expect(split).toMatch(/data-ts-key="areas:[^"]*:desktop:[^>]*fill-opacity="0.4"/);
    expect(split).toMatch(/data-ts-key="areas-2:[^"]*:mobile:[^>]*fill-opacity="0.1"/);
    expect(path(split, "mobile")).toBeDefined();
    expect(path(split, "mobile")).toBe(path(shared, "mobile"));
    expect(path(split, "desktop")).toBe(path(shared, "desktop"));
  });
});

describe("chart spec radii and radial focus", () => {
  const pie = (innerRadius: number | `${number}%`, size: number) =>
    prerenderChart(
      undefined,
      {
        data: visitorData,
        config: monthConfig,
        spec: { parts: [{ kind: "pie", dataKey: "desktop", nameKey: "month", innerRadius }] },
      },
      { id: "chart-radius", host: { initialWidth: size, height: size } },
    ).markup;

  it("reads a number radius as plain pixels at any size", () => {
    for (const size of [300, 600]) expect(pie(60, size)).toMatch(/A60,60,0/);
    const radial = (size: number) =>
      prerenderChart(
        undefined,
        {
          data: browserData,
          config: browserConfig,
          spec: {
            parts: [
              {
                kind: "radialBar",
                dataKey: "visitors",
                nameKey: "browser",
                innerRadius: 40,
                outerRadius: 140,
                background: true,
              },
            ],
          },
        },
        { id: "chart-radius", host: { initialWidth: size, height: size } },
      ).markup;
    for (const size of [400, 800]) {
      const track = /data-ts-key="track:[^"]*visitors-chrome"[^>]*? d="M[^A]+A[^M]+M([\d.]+),/.exec(
        radial(size),
      );
      // The innermost band starts one outer padding step past 40px.
      expect(Number(track?.[1])).toBeCloseTo(40 + (100 / (5 + 0.2 * 4 + 0.2)) * 0.1 * (1 + 0), 0);
    }
  });

  it("reads a percent radius as a share of the available radius", () => {
    const small = /A([\d.]+),[\d.]+,0,\d,\d,[-\d.]+,[-\d.]+L/.exec(pie("50%", 300));
    const large = /A([\d.]+),[\d.]+,0,\d,\d,[-\d.]+,[-\d.]+L/.exec(pie("50%", 600));
    expect(Number(large?.[1])).toBeGreaterThan(Number(small?.[1]) * 1.8);
  });

  it("focuses a single radial bar under the pointer", () => {
    const input: ChartInput = {
      data: browserData.slice(0, 1),
      config: browserConfig,
      spec: { parts: [{ kind: "radialBar", dataKey: "visitors", nameKey: "browser" }] },
    };
    const { options } = prerenderChart(undefined, input, { id: "chart-one" });
    const focus = (options.definition as any).focus;
    const point = { markId: "bars", x: 0, y: 0, xValue: 0, x2Value: 275, yValue: "chrome" };
    // The chart is 720px square, so the center is at 360,360 and the ring spans about 24% to
    // 88% of the radius.
    expect(focus.resolve([point], { x: 360, y: 180 })).toEqual([point]);
    expect(focus.resolve([point], { x: 360, y: 355 })).toEqual([]);
    expect(focus.resolve([point], { x: 360, y: 2 })).toEqual([]);
    // Before a render, the focus has no layout and focuses nothing.
    const fresh = (createChartOptions(undefined, input, { id: "chart-one" }).definition as any)
      .focus;
    expect(fresh.resolve([point], { x: 360, y: 180 })).toEqual([]);
  });
});

describe("chart spec config fallbacks", () => {
  it("draws a series without a config entry in a fallback color and warns once", () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    try {
      const input: ChartInput = {
        data: visitorData,
        config: { desktop: visitorConfig.desktop },
        spec: {
          parts: [
            monthAxis,
            { kind: "bar", dataKey: "desktop" },
            { kind: "bar", dataKey: "fallbackMobile" as string },
          ],
        },
      };
      input.data = visitorData.map((row) => ({ ...row, fallbackMobile: row.mobile }));
      const markup = prerenderChart(undefined, input, { id: "chart-missing" }).markup;
      prerenderChart(undefined, input, { id: "chart-missing" });
      expect(markup.match(/data-ts-key="bars:[^"]*-fallbackMobile"/g)).toHaveLength(6);
      expect(markup).toContain('fill="var(--chart-2)"');
      // Hiding config keys keeps a series that has no config entry.
      const hidden = prerenderChart(
        undefined,
        { ...input, visible: [] },
        { id: "chart-missing" },
      ).markup;
      expect(hidden.match(/data-ts-key="bars:[^"]*-fallbackMobile"/g)).toHaveLength(6);
      expect(hidden).not.toMatch(/-desktop"/);
      const calls = warn.mock.calls.filter(([message]) =>
        String(message).includes('"fallbackMobile"'),
      );
      expect(calls).toHaveLength(1);
      expect(String(calls[0]![0])).toContain("ChartBar series");
      // A mixed chart names the part that owns the key.
      prerenderChart(
        undefined,
        {
          ...input,
          data: input.data.map((row) => ({ ...(row as object), fallbackLine: 1 })),
          spec: {
            parts: [
              monthAxis,
              { kind: "bar", dataKey: "desktop" },
              { kind: "line", dataKey: "fallbackLine" as string },
            ],
          },
        },
        { id: "chart-missing" },
      );
      const line = warn.mock.calls.find(([message]) => String(message).includes('"fallbackLine"'));
      expect(String(line?.[0])).toContain("ChartLine series");
      expect(String(line?.[0])).not.toContain("ChartBar");
    } finally {
      warn.mockRestore();
    }
  });

  it("gives a pie slice without a config entry a fallback color", () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    try {
      const { chrome, safari } = browserConfig;
      const markup = prerenderChart(
        undefined,
        {
          data: browserData,
          config: { chrome, safari },
          spec: { parts: [{ kind: "pie", dataKey: "visitors", nameKey: "browser" }] },
        },
        { id: "chart-missing-pie" },
      ).markup;
      expect(markup.match(/data-ts-key="slices:[^"]+"/g)).toHaveLength(5);
      // Firefox is the third series, edge the fourth and other the fifth.
      for (const color of ["--chart-3", "--chart-4", "--chart-5"])
        expect(markup).toContain(`fill="var(${color})"`);
      expect(
        warn.mock.calls.some(
          ([message]) => String(message).includes("ChartPie") && String(message).includes("edge"),
        ),
      ).toBe(true);
    } finally {
      warn.mockRestore();
    }
  });
});

describe("chart spec tooltips, names and host defaults", () => {
  it("gives pie and radial tooltips no title", () => {
    const pie = definitionOf({
      data: visitorData,
      config: monthConfig,
      spec: { parts: [{ kind: "pie", dataKey: "desktop", nameKey: "month" }] },
    });
    const datum = { [ROW]: visitorData[0], [SERIES]: "January", [VALUE]: 186, [ID]: "January" };
    const content = pie.tooltip.content([{ datum, color: "red" }]);
    expect(content.title).toBe("");
    expect(content.rows).toEqual([{ label: "Jan", value: "186", color: "red" }]);
    const radial = definitionOf({
      data: browserData,
      config: browserConfig,
      spec: { parts: [{ kind: "radialBar", dataKey: "visitors", nameKey: "browser" }] },
    });
    const bar = {
      [ROW]: browserData[0],
      [SERIES]: "chrome",
      [VALUE]: 275,
      [ID]: "visitors-chrome",
    };
    expect(radial.tooltip.content([{ datum: bar, color: "red" }]).title).toBe("");
  });

  it("calls a pie with a hole a donut chart", () => {
    const pie = (innerRadius?: number | `${number}%`): ChartSpec => ({
      parts: [{ kind: "pie", dataKey: "desktop", nameKey: "month", innerRadius }],
    });
    expect(chartSpecAriaLabel(pie("58.5%"), monthConfig)).toBe("Donut chart of desktop");
    expect(chartSpecAriaLabel(pie(60), visitorConfig)).toBe("Donut chart of Desktop");
    expect(chartSpecAriaLabel(pie(0), visitorConfig)).toBe("Pie chart of Desktop");
    expect(chartSpecAriaLabel(pie("0%"), visitorConfig)).toBe("Pie chart of Desktop");
    expect(chartSpecAriaLabel(pie(), visitorConfig)).toBe("Pie chart of Desktop");
  });

  it("makes a radial bar chart square unless the host sets a size", () => {
    const input: ChartInput = {
      data: browserData,
      config: browserConfig,
      spec: { parts: [{ kind: "radialBar", dataKey: "visitors", nameKey: "browser" }] },
    };
    expect(prerenderChart(undefined, input, { id: "chart-square" }).surfaceStyle).toBe(
      "aspect-ratio:1",
    );
    expect(
      prerenderChart(undefined, input, { id: "chart-square", host: { height: 300 } }).surfaceStyle,
    ).toBe("height:300px");
    expect(
      prerenderChart(undefined, input, { id: "chart-square", host: { aspectRatio: 2 } })
        .surfaceStyle,
    ).toBe("aspect-ratio:2");
    const bars = prerenderChart(
      undefined,
      { data: visitorData, config: visitorConfig, spec: cases[0]!.spec },
      { id: "chart-square" },
    );
    expect(bars.surfaceStyle).not.toBe("aspect-ratio:1");
  });
});

describe("chart format formatters", () => {
  it("builds each Intl formatter once per resolved formatter", () => {
    const counts = { NumberFormat: 0, DateTimeFormat: 0 };
    const originals = { NumberFormat: Intl.NumberFormat, DateTimeFormat: Intl.DateTimeFormat };
    for (const name of ["NumberFormat", "DateTimeFormat"] as const)
      (Intl as any)[name] = new Proxy(originals[name], {
        construct(target, args) {
          counts[name] += 1;
          return Reflect.construct(target, args);
        },
      });
    try {
      const formatNumber = resolveTickFormatter({ number: {} })!;
      const formatDate = resolveTickFormatter({ date: { month: "short" } })!;
      for (let index = 0; index < 10; index += 1) {
        formatNumber(index * 1000);
        formatDate(Date.UTC(2024, index, 1));
      }
      expect(counts).toEqual({ NumberFormat: 1, DateTimeFormat: 1 });
    } finally {
      Object.assign(Intl, originals);
    }
  });

  it("names the part and prop when a format cannot build", () => {
    const render = (parts: ChartSpec["parts"]) => () =>
      prerenderChart(
        undefined,
        { data: visitorData, config: visitorConfig, spec: { parts } },
        { id: "chart-format-error" },
      );
    expect(
      render([
        { kind: "xAxis", dataKey: "month", tickFormatter: { number: { style: "currency" } } },
        { kind: "bar", dataKey: "desktop" },
      ]),
    ).toThrow(/^ChartXAxis tickFormatter: /);
    expect(
      render([
        monthAxis,
        { kind: "yAxis", tickFormatter: { date: { timeZone: "Not/AZone" } } },
        { kind: "bar", dataKey: "desktop" },
      ]),
    ).toThrow(/^ChartYAxis tickFormatter: /);
  });

  it("formats dates in UTC by default", () => {
    expect(formatChartValue("2024-04-01", { date: { month: "short", day: "numeric" } })).toBe(
      "Apr 1",
    );
  });
});

describe("chart spec chart-level options", () => {
  const markCount = (input: ChartInput) => (definitionOf(input).marks as unknown[]).length;
  const yTickLabels = (markup: string) =>
    [...markup.matchAll(/data-ts-key="y-tick-label:[^"]*"[^>]*>([^<]*)</g)].map(
      (match) => match[1],
    );

  // shadcn bar-default: one bar with `radius={8}` and a tooltip with `cursor={false}`.
  const barDefault = (cursor?: boolean): ChartInput => ({
    data: visitorData.map(({ month, desktop }) => ({ month, desktop })),
    config: { desktop: visitorConfig.desktop },
    spec: {
      parts: [
        { kind: "grid", vertical: false },
        monthAxis,
        { kind: "bar", dataKey: "desktop", radius: 8 },
      ],
      ...(cursor === undefined ? {} : { cursor }),
    },
  });

  // The band draws only on focus, so the browser test checks it on screen.
  it("drops the bar hover band mark with cursor false, as shadcn bar-default", () => {
    expect(markCount(barDefault(true))).toBe(markCount(barDefault()));
    expect(markCount(barDefault(false))).toBe(markCount(barDefault()) - 1);
  });

  // shadcn area-stacked-expand: three natural areas in one stack, with their own fill opacity.
  const expandData = visitorData.map((row, index) => ({
    ...row,
    other: [45, 100, 150, 50, 100, 160][index]!,
  }));
  const expandConfig = { ...visitorConfig, other: { label: "Other", color: "var(--chart-3)" } };
  const areaStackedExpand = (stackOffset?: "none" | "expand", fillOpacity = [0.1, 0.4, 0.4]) =>
    ({
      data: expandData,
      config: expandConfig,
      spec: {
        parts: [
          { kind: "grid", vertical: false },
          { ...monthAxis, tickMargin: 8 },
          { kind: "yAxis" },
          ...(["other", "mobile", "desktop"] as const).map((dataKey, index) => ({
            kind: "area" as const,
            dataKey,
            type: "natural" as const,
            fillOpacity: fillOpacity[index],
            stackId: "a",
          })),
        ],
        ...(stackOffset === undefined ? {} : { stackOffset }),
      },
    }) satisfies ChartInput;
  const render = (input: ChartInput) =>
    prerenderChart(undefined, input, { id: "chart-expand" }).markup;

  it("stacks areas to 100% with stackOffset expand, as shadcn area-stacked-expand", () => {
    for (const opacity of [
      [0.1, 0.4, 0.4],
      [0.4, 0.4, 0.4],
    ]) {
      const expanded = render(areaStackedExpand("expand", opacity));
      expect(Number(yTickLabels(expanded).at(-1))).toBe(1);
      expect(Number(yTickLabels(expanded)[0])).toBe(0);
      expect(expanded).not.toBe(render(areaStackedExpand(undefined, opacity)));
    }
    // The tooltip rows show the raw values.
    const definition = definitionOf(areaStackedExpand("expand"));
    const datum = {
      [ROW]: expandData[0],
      [X]: "January",
      [SERIES]: "desktop",
      [VALUE]: 186,
      [ID]: "January-desktop",
    };
    const content = definition.tooltip.content([{ datum, color: "red", group: "desktop" }]);
    expect(content.rows).toEqual([{ label: "Desktop", value: "186", color: "red" }]);
  });

  it("stacks bars to 100% with stackOffset expand", () => {
    const bars = (stackOffset?: "expand"): ChartInput => ({
      data: expandData,
      config: expandConfig,
      spec: {
        parts: [
          monthAxis,
          { kind: "yAxis" },
          { kind: "bar", dataKey: "desktop", stackId: "a" },
          { kind: "bar", dataKey: "mobile", stackId: "a" },
          { kind: "bar", dataKey: "other", stackId: "a" },
        ],
        ...(stackOffset ? { stackOffset } : {}),
      },
    });
    const expanded = render(bars("expand"));
    expect(Number(yTickLabels(expanded).at(-1))).toBe(1);
    expect(Number(yTickLabels(render(bars())).at(-1))).toBeGreaterThan(400);
  });

  // A small stack such as 6, 23 and 1 normalizes to slightly above 1 in floating point.
  const markParts = (kind: "bar" | "area", stacks: readonly (string | undefined)[]) =>
    stacks.map((stackId, index) => ({
      kind,
      dataKey: ["p", "q", "r"][index]!,
      ...(stackId === undefined ? {} : { stackId }),
    }));
  const pqrConfig = {
    p: { label: "P", color: "var(--chart-1)" },
    q: { label: "Q", color: "var(--chart-2)" },
    r: { label: "R", color: "var(--chart-3)" },
  };
  const pqr = (
    kind: "bar" | "area",
    stacks: readonly (string | undefined)[],
    options: { stackOffset?: "expand"; visible?: string[]; data?: object[]; yAxis?: false } = {},
  ): ChartInput => ({
    data: options.data ?? [
      { m: "a", p: 12, q: 3, r: 1 },
      { m: "b", p: 24, q: 5, r: 2 },
    ],
    config: pqrConfig,
    ...(options.visible ? { visible: options.visible } : {}),
    spec: {
      parts: [
        { kind: "xAxis", dataKey: "m" },
        ...(options.yAxis === false ? [] : [{ kind: "yAxis" } as const]),
        ...markParts(kind, stacks),
      ],
      ...(options.stackOffset ? { stackOffset: options.stackOffset } : {}),
    },
  });
  const barRects = (markup: string) =>
    [...markup.matchAll(/<rect data-ts-key="bars:[^>]*>/g)].map((match) => ({
      x: / x="([^"]*)"/.exec(match[0])![1],
      y: Number(/ y="([^"]*)"/.exec(match[0])![1]),
      width: / width="([^"]*)"/.exec(match[0])![1],
      height: Number(/ height="([^"]*)"/.exec(match[0])![1]),
    }));

  it("keeps a 100% axis at 1 when a stack normalizes to slightly above 1", () => {
    const data = [{ m: "a", p: 6, q: 23, r: 1 }];
    for (const kind of ["bar", "area"] as const) {
      const labels = yTickLabels(
        render(pqr(kind, ["s", "s", "s"], { stackOffset: "expand", data })),
      );
      expect(Number(labels[0])).toBe(0);
      expect(Number(labels.at(-1))).toBe(1);
    }
  });

  it("stacks a named stack with one visible series to 100%, as Recharts", () => {
    for (const kind of ["bar", "area"] as const) {
      // One part in the stack, and two parts in the stack with one hidden.
      for (const input of [
        pqr(kind, ["s"], { stackOffset: "expand" }),
        pqr(kind, ["s", "s"], { stackOffset: "expand", visible: ["p"] }),
      ]) {
        const markup = render(input);
        expect(Number(yTickLabels(markup).at(-1))).toBe(1);
        if (kind === "bar") {
          const [a, b] = barRects(markup);
          expect(a!.height).toBe(b!.height);
          expect(a!.y).toBe(b!.y);
        }
      }
    }
    // The lone named bar keeps its slot and width. Without a y-axis, the tick labels do not move it.
    const place = ({ x, width }: { x: string; width: string }) => ({ x, width });
    expect(
      barRects(render(pqr("bar", ["s"], { stackOffset: "expand", yAxis: false }))).map(place),
    ).toEqual(barRects(render(pqr("bar", ["s"], { yAxis: false }))).map(place));
  });

  it("keeps raw values for a series without a stackId with stackOffset expand", () => {
    for (const kind of ["bar", "area"] as const) {
      // A lone series and a series beside a named stack.
      for (const stacks of [[undefined], [undefined, "s", "s"]]) {
        const markup = render(pqr(kind, stacks, { stackOffset: "expand" }));
        expect(Number(yTickLabels(markup).at(-1))).toBeGreaterThanOrEqual(24);
      }
      // Without expand, a named stack keeps its raw values.
      expect(Number(yTickLabels(render(pqr(kind, ["s"]))).at(-1))).toBeGreaterThanOrEqual(24);
    }
  });

  it("leaves the SVG and the wire payload unchanged with the default options", () => {
    expect(render(barDefault(true))).toBe(render(barDefault()));
    expect(render(areaStackedExpand("none"))).toBe(render(areaStackedExpand()));
    const payload = (input: ChartInput) => serializeChartPayload({ input, host: {} });
    expect(payload(areaStackedExpand())).not.toContain("stackOffset");
    expect(payload(areaStackedExpand("expand"))).toContain('"stackOffset":"expand"');
  });

  it("builds a spec from parts and options, the first set that names an option deciding it", () => {
    const parts = [{ kind: "bar", dataKey: "desktop" }] as const;
    expect(buildChartSpec([])).toBeUndefined();
    expect(buildChartSpec(parts, { stackOffset: undefined }, undefined)).toEqual({ parts });
    expect(
      buildChartSpec(parts, { stackOffset: "expand" }, { cursor: false }, { cursor: true }),
    ).toEqual({ parts, stackOffset: "expand", cursor: false });
    // The first Tooltip supplies the body, so its unset cursor keeps the default.
    expect(
      buildChartSpec(parts, { stackOffset: undefined }, { cursor: undefined }, { cursor: false }),
    ).toEqual({
      parts,
    });
    // A set that does not name an option leaves it to a later set.
    expect(buildChartSpec(parts, {}, { cursor: false })).toEqual({ parts, cursor: false });
  });
});
