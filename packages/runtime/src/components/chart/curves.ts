import type { ChartCurve } from "@tanstack/charts";
import type { RadialAreaOptions } from "@tanstack/charts/polar";

type Point = readonly [number, number];
type PathBuilder = (points: readonly Point[], move: boolean) => string;

function curve(path: PathBuilder): ChartCurve {
  return {
    line: (points) => path(points, true),
    area: (top, bottom) =>
      top.length ? `${path(top, true)}${path([...bottom].reverse(), false)}Z` : "",
  };
}

const start = (points: readonly Point[], move: boolean) =>
  `${move ? "M" : "L"}${points[0]![0]},${points[0]![1]}`;

function linearPath(points: readonly Point[], move: boolean): string {
  return points.map((point, i) => `${i === 0 && move ? "M" : "L"}${point[0]},${point[1]}`).join("");
}

/** Monotone cubic interpolation along x, the same shape as d3 curveMonotoneX. */
function monotonePath(points: readonly Point[], move: boolean): string {
  const n = points.length;
  if (n === 0) return "";
  const first = start(points, move);
  if (n === 1) return first;
  if (n === 2) return `${first}L${points[1]![0]},${points[1]![1]}`;
  const step = (i: number) => points[i + 1]![0] - points[i]![0];
  const secant = (i: number) => (points[i + 1]![1] - points[i]![1]) / (step(i) || 1);
  const sign = (value: number) => (value < 0 ? -1 : 1);
  const tangents = points.map((_, i) => {
    if (i === 0 || i === n - 1) return 0;
    const [s0, s1, h0, h1] = [secant(i - 1), secant(i), step(i - 1), step(i)];
    const p = (s0 * h1 + s1 * h0) / (h0 + h1);
    return (sign(s0) + sign(s1)) * Math.min(Math.abs(s0), Math.abs(s1), 0.5 * Math.abs(p)) || 0;
  });
  tangents[0] = (3 * secant(0) - tangents[1]!) / 2;
  tangents[n - 1] = (3 * secant(n - 2) - tangents[n - 2]!) / 2;
  let path = first;
  for (let i = 0; i < n - 1; i++) {
    const [x0, y0] = points[i]!;
    const [x1, y1] = points[i + 1]!;
    const third = (x1 - x0) / 3;
    path += `C${x0 + third},${y0 + third * tangents[i]!},${x1 - third},${y1 - third * tangents[i + 1]!},${x1},${y1}`;
  }
  return path;
}

/** Natural cubic spline, the same shape as d3 curveNatural (Recharts `type="natural"`). */
function naturalPath(points: readonly Point[], move: boolean): string {
  const n = points.length;
  if (n === 0) return "";
  if (n < 3) return linearPath(points, move);
  const controls = (values: number[]) => {
    const m = values.length - 1;
    const a = Array.from<number>({ length: m });
    const b = Array.from<number>({ length: m });
    const r = Array.from<number>({ length: m });
    a[0] = 0;
    b[0] = 2;
    r[0] = values[0]! + 2 * values[1]!;
    for (let i = 1; i < m - 1; i++) {
      a[i] = 1;
      b[i] = 4;
      r[i] = 4 * values[i]! + 2 * values[i + 1]!;
    }
    a[m - 1] = 2;
    b[m - 1] = 7;
    r[m - 1] = 8 * values[m - 1]! + values[m]!;
    for (let i = 1; i < m; i++) {
      const ratio = a[i]! / b[i - 1]!;
      b[i] = b[i]! - ratio;
      r[i] = r[i]! - ratio * r[i - 1]!;
    }
    a[m - 1] = r[m - 1]! / b[m - 1]!;
    for (let i = m - 2; i >= 0; i--) a[i] = (r[i]! - a[i + 1]!) / b[i]!;
    b[m - 1] = (values[m]! + a[m - 1]!) / 2;
    for (let i = 0; i < m - 1; i++) b[i] = 2 * values[i + 1]! - a[i + 1]!;
    return [a, b] as const;
  };
  const [x1, x2] = controls(points.map((point) => point[0]));
  const [y1, y2] = controls(points.map((point) => point[1]));
  let path = start(points, move);
  for (let i = 0; i < n - 1; i++) {
    path += `C${x1[i]},${y1[i]},${x2[i]},${y2[i]},${points[i + 1]![0]},${points[i + 1]![1]}`;
  }
  return path;
}

/** Steps at the middle between points, the same shape as d3 curveStep (Recharts `type="step"`). */
function stepPath(points: readonly Point[], move: boolean): string {
  const n = points.length;
  if (n === 0) return "";
  let path = start(points, move);
  for (let i = 1; i < n; i++) {
    const [x0, y0] = points[i - 1]!;
    const [x1, y1] = points[i]!;
    const middle = (x0 + x1) / 2;
    path += `L${middle},${y0}L${middle},${y1}L${x1},${y1}`;
  }
  return path;
}

export const monotoneCurve: ChartCurve = curve(monotonePath);
export const naturalCurve: ChartCurve = curve(naturalPath);
export const stepCurve: ChartCurve = curve(stepPath);

type CurveFactory = NonNullable<RadialAreaOptions<unknown>["curve"]>;

/**
 * Straight segments that close back to the first point, as d3 curveLinearClosed does. A ring whose
 * points all sit on one spot (the radar's inner edge at the center) draws nothing, so no renderer
 * can paint a dot there.
 */
export const linearClosedCurve = ((context: CanvasPath) => {
  let points: [number, number][] = [];
  return {
    areaStart() {},
    areaEnd() {},
    lineStart() {
      points = [];
    },
    lineEnd() {
      const [first, ...rest] = points;
      if (!first || rest.every(([x, y]) => x === first[0] && y === first[1])) return;
      context.moveTo(first[0], first[1]);
      for (const [x, y] of rest) context.lineTo(x, y);
      context.closePath();
    },
    point(x: number, y: number) {
      points.push([x, y]);
    },
  };
}) as unknown as CurveFactory;
