import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { describe, expect, it } from "vitest";

import * as chart from "../../../src/components/chart";
import {
  chartStyle,
  defineChartModule,
  getChartModule,
  parseChartPayload,
  prerenderChart,
  serializeChartPayload,
  serializeInput,
  toChartId,
} from "../../../src/components/chart";
import { visitorBars, visitorConfig, visitorInput } from "./fixtures";

const packageRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../..");

describe("chart server surface", () => {
  it("runs without a DOM", () => {
    expect(typeof document).toBe("undefined");
  });

  it("exports the public chart API from the subpath", () => {
    for (const name of [
      "createChart",
      "defineChartModule",
      "registerChartModules",
      "startCharts",
      "getChartController",
      "tooltipView",
      "tooltipLayout",
      "chartStyle",
      "serializeInput",
      "prerenderChart",
      "syncTooltipAccessibility",
      "isChartIcon",
    ])
      expect(chart).toHaveProperty(name, expect.any(Function));
  });

  it("prerenders deterministic SVG markup and a surface size", () => {
    const first = prerenderChart(visitorBars, visitorInput(), { id: "chart-server" });
    const second = prerenderChart(visitorBars, visitorInput(), { id: "chart-server" });

    expect(first.markup).toBe(second.markup);
    expect(first.markup.match(/<svg/g)).toHaveLength(1);
    expect(first.markup).toContain('aria-label="Chart"');
    expect(first.surfaceStyle).toBe("height:340px");
    expect(first.layout.initialWidth).toBe(720);
  });

  it("uses an aspect ratio surface when the host sets aspectRatio without height", () => {
    const result = prerenderChart(visitorBars, visitorInput(), {
      id: "chart-ratio",
      host: { aspectRatio: 2 },
    });

    expect(result.surfaceStyle).toBe("aspect-ratio:2");
    expect(result.options.height).toBeUndefined();
  });

  it("rebuilds geometry from the visible keys", () => {
    const all = prerenderChart(visitorBars, visitorInput(), { id: "chart-all" });
    const desktop = prerenderChart(visitorBars, visitorInput({ visible: ["desktop"] }), {
      id: "chart-all",
    });

    expect(all.markup.match(/<rect data-ts-key="visitors:/g)).toHaveLength(6);
    expect(desktop.markup.match(/<rect data-ts-key="visitors:/g)).toHaveLength(3);
  });

  it("does not register modules outside a browser", () => {
    defineChartModule({ id: "server-only", ariaLabel: "Server", create: visitorBars });
    expect(getChartModule("server-only")).toBeUndefined();
  });

  it("makes framework ids valid chart ids", () => {
    expect(toChartId(":r1:")).toBe("chart-r1");
    expect(toChartId("v-0-1")).toBe("chart-v-0-1");
  });
});

describe("chart serialization", () => {
  it("escapes < and keeps strings exact", () => {
    const label = '</script><!-- "quoted" &   émoji 🎉';
    const text = serializeInput({ data: [{ label }], config: { a: { label } } });

    expect(text).not.toContain("<");
    expect(JSON.parse(text).data[0].label).toBe(label);
    expect(JSON.parse(text).config.a.text).toBe(label);
  });

  it.each([
    ["a function", () => 1],
    ["a class instance", new Date(0)],
    ["a map", new Map()],
    ["NaN", Number.NaN],
    ["Infinity", Number.POSITIVE_INFINITY],
    ["a bigint", BigInt(1)],
    ["a symbol", Symbol("x")],
  ])("rejects %s", (_name, value) => {
    expect(() => serializeInput({ data: [{ value }], config: {} })).toThrow(/JSON data/);
  });

  it("rejects circular data", () => {
    const row: Record<string, unknown> = {};
    row.self = row;
    expect(() => serializeInput({ data: [row], config: {} })).toThrow(/circular/);
  });

  it("accepts plain objects without a prototype and repeated references", () => {
    const shared = { n: 1 };
    const bare = Object.assign(Object.create(null), { n: 2 });
    expect(() => serializeInput({ data: [shared, shared, bare], config: {} })).not.toThrow();
  });

  it("sends only plain config text and portable icons", () => {
    const text = serializeInput({
      data: [],
      config: {
        a: { label: { rich: true }, text: "A", icon: { paths: ["M0 0h1"] }, color: "red" },
        b: { label: "B", icon: () => null },
      },
    });
    expect(JSON.parse(text).config).toEqual({
      a: { label: "A", text: "A", color: "red", icon: { paths: ["M0 0h1"] } },
      b: { label: "B", text: "B" },
    });
  });

  it("drops host callbacks from the wire payload and parses it back", () => {
    const text = serializeChartPayload({
      input: visitorInput(),
      host: { height: 200, ariaLabel: "Visitors", onSelect: () => {} } as never,
      tooltipDisabled: true,
    });
    const payload = parseChartPayload(text);

    expect(payload.host).toEqual({ height: 200, ariaLabel: "Visitors" });
    expect(payload.tooltipDisabled).toBe(true);
    expect(payload.input?.data).toEqual(visitorInput().data);
    expect(parseChartPayload(serializeInput(visitorInput())).input?.config).toBeDefined();
  });
});

describe("chart config styles", () => {
  it("writes light and dark rules under the chart scope", () => {
    expect(chartStyle("chart-a", visitorConfig)).toBe(
      '[data-chart="chart-a"]{--sw-chart-color-desktop:rgb(37, 99, 235);--color-desktop:rgb(37, 99, 235);--sw-chart-color-mobile:rgb(96, 165, 250);--color-mobile:rgb(96, 165, 250)}' +
        '.dark [data-chart="chart-a"]{--sw-chart-color-desktop:rgb(37, 99, 235);--color-desktop:rgb(37, 99, 235);--sw-chart-color-mobile:rgb(30, 64, 175);--color-mobile:rgb(30, 64, 175)}',
    );
  });

  it("writes only the chart variable for keys that match theme tokens", () => {
    const css = chartStyle("chart-a", {
      primary: { color: "red" },
      "chart-1": { color: "blue" },
      primaryish: { color: "green" },
    });
    expect(css).toContain("--sw-chart-color-primary:red");
    expect(css).not.toContain("--color-primary:");
    expect(css).not.toContain("--color-chart-1:");
    expect(css).toContain("--color-primaryish:green");
  });

  it.each(["1st", "a b", "a;b", "a}", "", "-a"])("rejects config key %j", (key) => {
    expect(() => chartStyle("chart-a", { [key]: { color: "red" } })).toThrow(/CSS identifier/);
  });

  const unsafeColors = ["red}", "red;color:blue", "red{", "</style>", "red>", "red/*", "\\7d"];

  it.each(unsafeColors)("rejects color %j", (color) => {
    expect(() => chartStyle("chart-a", { a: { color } })).toThrow(/Invalid chart CSS color/);
  });

  it.each(['a"]', "1a", "a b"])("rejects chart id %j", (id) => {
    expect(() => chartStyle(id, {})).toThrow(/chart id/);
  });
});

describe("chart subpath isolation", () => {
  it("keeps chart code out of the root entry and initStarwind", async () => {
    for (const file of ["src/index.ts", "src/init-starwind.ts"]) {
      const source = await readFile(path.join(packageRoot, file), "utf8");
      expect(source).not.toMatch(/chart/i);
      expect(source).not.toContain("@tanstack");
    }
  });

  it("declares the chart subpath and the TanStack dependency", async () => {
    const packageJson = JSON.parse(await readFile(path.join(packageRoot, "package.json"), "utf8"));
    expect(packageJson.exports["./chart"]).toEqual({
      types: "./dist/chart.d.ts",
      import: "./dist/chart.js",
    });
    expect(packageJson.dependencies["@tanstack/charts"]).toBe("^1.5.0");
  });
});

describe("tooltip indicator colors", () => {
  function view(color: string, key = "desktop", override?: string) {
    const body = {
      content: { rows: [{ label: key, value: "42", color }] },
      points: [{ datum: { series: key, value: 42 } }],
    } as unknown as Parameters<typeof chart.tooltipView>[0];
    return chart.tooltipView(body, { [key]: { label: key, color: "red" } }, { color: override })
      .rows[0]!.color;
  }

  it("uses the series variable for a gradient paint reference", () => {
    expect(view("url(#fill-desktop)")).toBe("var(--sw-chart-color-desktop)");
  });

  it("keeps an explicit color and ordinary colors", () => {
    expect(view("url(#fill-desktop)", "desktop", "blue")).toBe("blue");
    expect(view("red")).toBe("red");
  });

  it("keeps the paint reference for an invalid or missing config key", () => {
    expect(view("url(#fill)", "bad key")).toBe("url(#fill)");
    const body = {
      content: { rows: [{ label: "missing", value: "42", color: "url(#fill)" }] },
      points: [],
    } as unknown as Parameters<typeof chart.tooltipView>[0];
    expect(chart.tooltipView(body, {}).rows[0]!.color).toBe("url(#fill)");
  });
});

describe("tooltip layout", () => {
  const config = {
    desktop: { label: "Desktop" },
    mobile: { label: "Mobile", icon: { paths: ["M0 0"] } },
  };
  type Body = Parameters<typeof chart.tooltipLayout>[0];
  const point = (key: string, series: string) => ({ key, datum: { series, value: 1 } });

  function body(rows: string[], points: ReturnType<typeof point>[], primary?: string): Body {
    return {
      content: { title: "January", rows: rows.map((label) => ({ label, value: "1" })) },
      points,
      primaryPoint: points.find((candidate) => candidate.key === primary),
    } as unknown as Body;
  }

  it("never marks a row without a point as active", () => {
    // The third row has no point, and no primary point exists.
    const layout = chart.tooltipLayout(
      body(["desktop", "mobile", "Total"], [point("a", "desktop"), point("b", "mobile")]),
      config,
    );
    expect(layout.view.rows[2]!.item.point).toBeUndefined();
    expect(layout.rows.map((row) => row.active)).toEqual([false, false, false]);
  });

  it("marks the row of the primary point as active", () => {
    const layout = chart.tooltipLayout(
      body(["desktop", "mobile"], [point("a", "desktop"), point("b", "mobile")], "b"),
      config,
    );
    expect(layout.rows.map((row) => row.active)).toEqual([false, true]);
  });

  it("lets defined props win over the preset and applies the defaults", () => {
    const two = body(["desktop", "mobile"], [point("a", "desktop"), point("b", "mobile")]);
    expect(chart.tooltipLayout(two, config).indicator).toBe("dot");
    expect(chart.tooltipLayout(two, config, { indicator: "line" }).indicator).toBe("line");
    expect(
      chart.tooltipLayout(two, config, { indicator: "line" }, { indicator: undefined }).indicator,
    ).toBe("line");
    expect(
      chart.tooltipLayout(two, config, { indicator: "line" }, { indicator: "dashed" }).indicator,
    ).toBe("dashed");
  });

  it("nests the heading in one line row and hides the marker of an icon row", () => {
    const one = body(["mobile"], [point("b", "mobile")], "b");
    const nested = chart.tooltipLayout(one, config, { indicator: "line" });
    expect(nested.nested).toBe(true);
    expect(nested.showLabel).toBe(true);
    expect(nested.rows[0]).toEqual({ active: true, showIndicator: false, nestHeading: true });

    const hidden = chart.tooltipLayout(one, config, { indicator: "line", hideLabel: true });
    expect(hidden.nested).toBe(true);
    expect(hidden.rows[0]!.nestHeading).toBe(false);

    const desktop = chart.tooltipLayout(body(["desktop"], [point("a", "desktop")]), config, {
      hideIndicator: true,
    });
    expect(desktop.rows[0]!.showIndicator).toBe(false);
  });

  it("reads a heading that names a config key as that key's label", () => {
    const two = body(["desktop", "mobile"], [point("a", "desktop"), point("b", "mobile")]);
    const layout = chart.tooltipLayout(two, config, { label: "desktop" });
    expect(layout.headingKey).toBe("desktop");
    expect(layout.heading).toBe("Desktop");
    const formatted = chart.tooltipLayout(two, config, {
      label: "desktop",
      labelFormatter: () => "Custom",
    });
    expect(formatted.headingKey).toBeUndefined();
    expect(formatted.heading).toBe("Custom");
    expect(chart.tooltipLayout(two, config, { label: "" }).showLabel).toBe(false);
  });
});
