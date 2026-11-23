import { areaY, barX, barY, defineChart, group } from "@tanstack/charts";
import {
  focusGroupAngle,
  pie,
  polar,
  radialArc,
  radialArea,
  radialBarAngle,
} from "@tanstack/charts/polar";
import { scaleBand } from "@tanstack/charts/scales/band";
import { scaleLinear } from "@tanstack/charts/scales/linear";
import { scalePoint } from "@tanstack/charts/scales/point";

import type { ChartConfig, ChartContext, ChartInput } from "../../../src/components/chart";

export interface VisitorRow {
  month: string;
  desktop: number;
  mobile: number;
}

export const months = ["January", "February", "March"];

export function visitorData(offset = 0): VisitorRow[] {
  return months.map((month, index) => ({
    month,
    desktop: [186, 305, 237][index]! + offset,
    mobile: [80, 200, 120][index]! + offset,
  }));
}

export const visitorConfig: ChartConfig = {
  desktop: { label: "Desktop", color: "rgb(37, 99, 235)" },
  mobile: { label: "Mobile", theme: { light: "rgb(96, 165, 250)", dark: "rgb(30, 64, 175)" } },
};

export function visitorInput(
  overrides: Partial<ChartInput<VisitorRow>> = {},
): ChartInput<VisitorRow> {
  return { data: visitorData(), config: visitorConfig, ...overrides };
}

/** One row per month and visible series. */
function seriesRows(ctx: ChartContext<VisitorRow>) {
  return ctx.data.flatMap((row) =>
    ctx.visible.map((series) => ({
      id: `${row.month}-${series}`,
      month: row.month,
      series,
      value: row[series as "desktop" | "mobile"],
    })),
  );
}

const interaction = (ctx: ChartContext<VisitorRow>) => ({
  svgAnimation: false as const,
  maxFocusDistance: Number.POSITIVE_INFINITY,
  tooltip: ctx.tooltip({ labelKey: "month" }, { showDelay: 0, hideDelay: 0 }),
});

/** A bar chart factory. Geometry follows the visible keys. */
export function visitorBars(ctx: ChartContext<VisitorRow>) {
  const rows = seriesRows(ctx);
  return defineChart(
    {
      marks: [
        barY(rows, {
          id: "visitors",
          x: "month",
          y: "value",
          color: "series",
          key: "id",
          layout: group({ padding: 0.15 }),
        }),
      ],
      scales: {
        x: { scale: () => scaleBand<string>().domain(months).padding(0.28) },
        y: { scale: scaleLinear, nice: true },
      },
      color: ctx.color,
      theme: ctx.theme,
    },
    {
      svgAnimation: false,
      focus: "group-x",
      maxFocusDistance: Number.POSITIVE_INFINITY,
      tooltip: ctx.tooltip({ labelKey: "month" }, { showDelay: 0, hideDelay: 0 }),
    },
  );
}

/** A stacked area chart on a point scale. */
export function visitorArea(ctx: ChartContext<VisitorRow>) {
  return defineChart(
    {
      marks: [
        areaY(seriesRows(ctx), {
          id: "visitors",
          x: "month",
          y: "value",
          color: "series",
          key: "id",
        }),
      ],
      scales: {
        x: { scale: () => scalePoint<string>().domain(months).padding(0.3) },
        y: { scale: scaleLinear, nice: true },
      },
      color: ctx.color,
      theme: ctx.theme,
    },
    { ...interaction(ctx), focus: "group-x" },
  );
}

/** A donut chart with one slice per visible series. */
export function visitorDonut(ctx: ChartContext<VisitorRow>) {
  const totals = ctx.visible.map((series) => ({
    id: series,
    month: series,
    series,
    value: ctx.data.reduce((sum, row) => sum + row[series as "desktop" | "mobile"], 0),
  }));
  return defineChart(
    {
      marks: [
        polar({
          radiusRatio: 0.9,
          scales: { angle: null, radius: null },
          marks: [
            radialArc(pie(totals, { value: "value" }), {
              id: "visitors",
              color: "series",
              key: "id",
              innerRadius: (context: { radius: number }) => context.radius * 0.6,
            }),
          ],
        }),
      ],
      scales: { x: null, y: null },
      color: ctx.color,
      theme: ctx.theme,
    },
    { ...interaction(ctx), maxFocusDistance: 48 },
  );
}

/** A radar chart: one closed area per visible series, focused by axis. */
export function visitorRadar(ctx: ChartContext<VisitorRow>) {
  return defineChart(
    {
      marks: [
        polar({
          radiusRatio: 0.72,
          scales: {
            angle: { scale: scalePoint<string>().domain(months), wrap: true },
            radius: { scale: scaleLinear().domain([0, 350]) },
          },
          marks: [
            radialArea(seriesRows(ctx), {
              id: "visitors",
              angle: "month",
              radius: "value",
              z: "series",
              color: "series",
              key: "id",
            }),
          ],
        }),
      ],
      scales: { x: null, y: null },
      color: ctx.color,
      theme: ctx.theme,
    },
    { ...interaction(ctx), focus: focusGroupAngle, maxFocusDistance: 48 },
  );
}

/** A horizontal bar chart: the band scale is on y. */
export function visitorBarsX(ctx: ChartContext<VisitorRow>) {
  return defineChart(
    {
      marks: [
        barX(seriesRows(ctx), {
          id: "visitors",
          x: "value",
          y: "month",
          color: "series",
          key: "id",
          layout: group({ padding: 0.15 }),
        }),
      ],
      scales: {
        x: { scale: scaleLinear, nice: true },
        y: { scale: () => scaleBand<string>().domain(months).padding(0.28) },
      },
      color: ctx.color,
      theme: ctx.theme,
    },
    { ...interaction(ctx), focus: "group-y" },
  );
}

/** A radial bar chart: one desktop bar per month on a radius band. */
export function visitorRadialBars(ctx: ChartContext<VisitorRow>) {
  return defineChart(
    {
      marks: [
        polar({
          radiusRatio: 0.9,
          scales: {
            angle: { scale: scaleLinear().domain([0, 350]) },
            radius: { scale: scaleBand<string>().domain(months).padding(0.2) },
          },
          marks: [
            radialBarAngle(ctx.data, {
              id: "visitors",
              angle: "desktop",
              radius: "month",
              color: "month",
              key: "month",
            }),
          ],
        }),
      ],
      scales: { x: null, y: null },
      color: ctx.color,
      theme: ctx.theme,
    },
    { ...interaction(ctx), maxFocusDistance: 48 },
  );
}

/** A nested pie: desktop months on the inner ring and mobile months on the outer ring. */
export function visitorNestedPie(ctx: ChartContext<VisitorRow>) {
  const ring = (series: "desktop" | "mobile") =>
    pie(
      ctx.data.map((row) => ({
        id: `${row.month}-${series}`,
        month: row.month,
        value: row[series],
      })),
      { value: "value" },
    );
  return defineChart(
    {
      marks: [
        polar({
          radiusRatio: 0.9,
          scales: { angle: null, radius: null },
          marks: [
            radialArc(ring("desktop"), {
              id: "inner",
              color: "month",
              key: "id",
              outerRadius: (context: { radius: number }) => context.radius * 0.55,
            }),
            radialArc(ring("mobile"), {
              id: "outer",
              color: "month",
              key: "id",
              innerRadius: (context: { radius: number }) => context.radius * 0.65,
            }),
          ],
        }),
      ],
      scales: { x: null, y: null },
      color: ctx.color,
      theme: ctx.theme,
    },
    { ...interaction(ctx), maxFocusDistance: 48 },
  );
}
