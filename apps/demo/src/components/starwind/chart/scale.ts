// Shared axis-domain ("nice number") helpers for the cartesian charts.
//
// Recharts rounds a numeric axis' domain to human-friendly bounds even when the
// axis is hidden, which is why shadcn's bars/areas leave headroom instead of
// touching the plot edge at the raw data max. The three cartesian families each
// need a SLIGHTLY DIFFERENT rounding and so keep their own entry point here —
// they are intentionally NOT unified:
//   - BarChart  → niceDomain    (full recharts-scale port; handles negatives)
//   - LineChart → rechartsAutoMax
//   - AreaChart → niceMax (with y-axis) / tightMax (default, tighter fit)
// Co-locating them removes three divergent private copies without changing any
// one chart's output.

// --- BarChart: recharts-scale getNiceTickValues / calculateStep (tickCount=5),
//     the only variant that must place a nice zero-crossing for negative data.
export function niceStep(roughStep: number, correctionFactor: number): number {
  if (roughStep <= 0) return 0;
  const digitCount = Math.floor(Math.log10(Math.abs(roughStep))) + 1;
  const digitValue = 10 ** digitCount;
  const stepRatio = roughStep / digitValue;
  const stepRatioScale = digitCount !== 1 ? 0.05 : 0.1;
  return (Math.ceil(stepRatio / stepRatioScale) + correctionFactor) * stepRatioScale * digitValue;
}

export function niceDomain(
  min: number,
  max: number,
  tickCount = 5,
  correctionFactor = 0,
): [number, number] {
  if (min === max) return [Math.min(0, min), Math.max(10, max)];
  const step = niceStep((max - min) / (tickCount - 1), correctionFactor);
  const mid = (min + max) / 2;
  const middle = min <= 0 && max >= 0 ? 0 : mid - (mid % step);
  let belowCount = Math.ceil((middle - min) / step);
  let upCount = Math.ceil((max - middle) / step);
  const scaleCount = belowCount + upCount + 1;
  if (scaleCount > tickCount) return niceDomain(min, max, tickCount, correctionFactor + 1);
  if (scaleCount < tickCount) {
    upCount = max > 0 ? upCount + (tickCount - scaleCount) : upCount;
    belowCount = max > 0 ? belowCount : belowCount + (tickCount - scaleCount);
  }
  return [middle - belowCount * step, middle + upCount * step];
}

// --- LineChart: recharts auto-max for a non-negative domain (tickCount=5).
export function rechartsAutoMax(v: number): number {
  if (v <= 0) return 10;
  const tickCount = 5;
  const roughStep = v / (tickCount - 1);
  const digitCount = Math.floor(Math.log10(Math.abs(roughStep))) + 1;
  const digitValue = 10 ** digitCount;
  const stepRatioScale = digitCount !== 1 ? 0.05 : 0.1;
  const stepRatio = roughStep / digitValue;
  const step = Math.ceil(stepRatio / stepRatioScale) * stepRatioScale * digitValue;
  let upCount = Math.ceil(v / step);
  const scaleCount = upCount + 1;
  if (scaleCount < tickCount) upCount += tickCount - scaleCount;
  return upCount * step;
}

// --- AreaChart: rounded max used when a y-axis is shown (5-step nice number).
export function niceMax(v: number): number {
  if (v <= 0) return 10;
  const step0 = v / 5;
  const base = 10 ** Math.floor(Math.log10(step0));
  const error = step0 / base;
  const step = (error >= 7.071 ? 10 : error >= 3.162 ? 5 : error >= 1.414 ? 2 : 1) * base;
  return Math.ceil(v / step) * step;
}

// --- AreaChart: tighter max used by default (no y-axis) so the area fills more.
export function tightMax(v: number): number {
  if (v <= 0) return 10;
  const step = 10 ** Math.max(0, Math.floor(Math.log10(v)) - 1);
  return Math.ceil(v / step) * step;
}

/**
 * X-axis label thinning — approximates Recharts' minTickGap for dense data.
 * Returns the stride between labeled categories (1 = label every category).
 * Identical logic previously lived inline in Bar/Line/Area.
 */
export function xLabelStep(dataLength: number, width: number): number {
  const targetTicks = Math.max(4, Math.floor(width / 72));
  return dataLength <= Math.max(8, targetTicks)
    ? 1
    : Math.max(1, Math.round(dataLength / targetTicks));
}
