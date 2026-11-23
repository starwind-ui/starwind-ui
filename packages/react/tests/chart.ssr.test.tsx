import { readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import type * as React from "react";
import { renderToStaticMarkup, renderToString } from "react-dom/server";
import { describe, expect, it } from "vitest";

import {
  type VisitorRow,
  visitorBars,
  visitorConfig,
  visitorData,
} from "../../runtime/tests/components/chart/fixtures";
import ChartPrimitive, { type ChartConfig } from "../src/chart/index";

const config = visitorConfig as ChartConfig;

function Chart(props: { id?: string; children?: React.ReactNode }) {
  return (
    <ChartPrimitive.Root<VisitorRow>
      chart={visitorBars}
      data={visitorData()}
      config={config}
      {...props}
    >
      <ChartPrimitive.Style />
      <ChartPrimitive.Surface />
      {props.children}
    </ChartPrimitive.Root>
  );
}

describe("React chart Primitive server render", () => {
  it("renders the chart SVG, the config styles and the reserved surface size", () => {
    const html = renderToStaticMarkup(<Chart id="visitors" />);

    expect(html).toContain('data-slot="chart" data-chart="visitors"');
    expect(html).toContain('data-slot="chart-style"');
    expect(html).toContain('[data-chart="visitors"]{--sw-chart-color-desktop:rgb(37, 99, 235)');
    expect(html).toMatch(
      /<div style="height:340px" data-sw-chart-surface="" data-slot="chart-surface"><svg/,
    );
    expect(html.match(/<svg/g)?.length).toBeGreaterThanOrEqual(1);
    expect(html).toContain("<rect");
  });

  it("generates a valid chart id from useId when id is omitted", () => {
    const html = renderToString(
      <>
        <Chart />
        <Chart />
      </>,
    );
    const ids = [...html.matchAll(/data-slot="chart" data-chart="([^"]+)"/g)].map((m) => m[1]);

    expect(ids).toHaveLength(2);
    expect(new Set(ids).size).toBe(2);
    for (const id of ids) expect(id).toMatch(/^chart-[a-zA-Z0-9_-]+$/);
  });

  it("renders legend items per config key with visibility state", () => {
    const html = renderToStaticMarkup(
      <ChartPrimitive.Root<VisitorRow>
        id="legend"
        chart={visitorBars}
        data={visitorData()}
        config={config}
        defaultVisible={["mobile"]}
      >
        <ChartPrimitive.Legend>
          <ChartPrimitive.LegendItems>
            <ChartPrimitive.LegendItem>
              <ChartPrimitive.LegendSwatch />
              <ChartPrimitive.LegendLabel />
            </ChartPrimitive.LegendItem>
          </ChartPrimitive.LegendItems>
        </ChartPrimitive.Legend>
      </ChartPrimitive.Root>,
    );

    expect(html).toContain('role="group" aria-label="Chart series" data-slot="chart-legend"');
    expect(html).toContain(
      '<button type="button" aria-pressed="false" data-state="off" data-key="desktop" data-slot="chart-legend-item">',
    );
    expect(html).toContain('aria-pressed="true" data-state="on" data-key="mobile"');
    expect(html).toContain(
      '<span style="background:var(--sw-chart-color-desktop)" data-slot="chart-legend-swatch" aria-hidden="true"></span>',
    );
    expect(html).toContain('<span data-slot="chart-legend-label">Mobile</span>');
    expect(html).not.toContain("data-sw-chart-legend-item");
  });

  it("renders a passive legend and rejects visibility props for a native definition", () => {
    const definition = visitorBars({
      data: visitorData(),
      config: visitorConfig,
      keys: ["desktop", "mobile"],
      visible: ["desktop", "mobile"],
      params: {},
      isVisible: () => true,
      label: (key) => key,
      color: { domain: ["desktop", "mobile"], range: ["red", "blue"] },
      theme: { foreground: "black", muted: "gray", grid: "gray", background: "white" },
      tooltip: () => ({}) as never,
    });
    const html = renderToStaticMarkup(
      <ChartPrimitive.Root id="native" definition={definition} config={config}>
        <ChartPrimitive.LegendItem value="desktop">Desktop</ChartPrimitive.LegendItem>
      </ChartPrimitive.Root>,
    );
    expect(html).toContain('<span data-key="desktop" data-slot="chart-legend-item">Desktop</span>');

    expect(() =>
      renderToStaticMarkup(
        // @ts-expect-error a native definition rejects visibility props
        <ChartPrimitive.Root id="native" definition={definition} config={config} visible={[]} />,
      ),
    ).toThrow(/own their visibility/);
  });

  it("renders a Tooltip outside a tooltip body as nothing", () => {
    const html = renderToStaticMarkup(
      <>
        <ChartPrimitive.Tooltip>outside</ChartPrimitive.Tooltip>
        <Chart id="tip">
          <ChartPrimitive.Tooltip>inside</ChartPrimitive.Tooltip>
        </Chart>
      </>,
    );
    expect(html).not.toContain("outside");
    expect(html).not.toContain("inside");
  });

  it("imports only the Runtime chart subpath and no TanStack framework adapter", () => {
    const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../src/chart");
    const sources = readdirSync(root).map((file) => readFileSync(path.join(root, file), "utf8"));
    const imports = sources.flatMap((source) =>
      [...source.matchAll(/from "([^"]+)"/g)].map((match) => match[1]!),
    );
    const external = new Set(imports.filter((source) => !source.startsWith(".")));

    expect([...external].sort()).toEqual(["@starwind-ui/runtime/chart", "react", "react-dom"]);
  });
});
