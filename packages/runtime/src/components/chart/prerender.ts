import type {
  ChartHostOptions,
  ChartRendererHostOptions,
  ChartRendererRenderContext,
  ChartValue,
} from "@tanstack/charts";
import { type ChartAdapterLayout, resolveChartAdapterLayout } from "@tanstack/charts/adapter";
import { createChartRendererAdapter } from "@tanstack/charts/adapter/renderer";
import { createSvgChartRenderer } from "@tanstack/charts/svg/renderer";

import { type ChartOptionsInstance, createChartOptions } from "./options";
import type { ChartInput, ChartSource } from "./types";

const DEFAULT_ASPECT_RATIO = 720 / 340;

/** Converts SVG host options to the framework-neutral renderer host options. */
export function toRendererOptions<D, X extends ChartValue, Y extends ChartValue>(
  options: ChartHostOptions<D, X, Y>,
  renderer = createSvgChartRenderer<D, X, Y>(options.renderSvg),
): ChartRendererHostOptions<D, X, Y> {
  const { renderSvg: _renderSvg, onRender, ...common } = options;
  return {
    ...common,
    renderer,
    onRender: onRender
      ? (context: ChartRendererRenderContext<D, X, Y>) =>
          onRender({
            ...context,
            svg: (context.surface.defaultElement ?? context.surface.element) as SVGSVGElement,
          })
      : undefined,
  } as ChartRendererHostOptions<D, X, Y>;
}

/** The inline style that reserves the surface size before the browser measures it. */
export function chartSurfaceStyle(options: ChartHostOptions<unknown, ChartValue, ChartValue>) {
  const layout = resolveChartAdapterLayout(options);
  return options.height !== undefined
    ? `height:${layout.initialHeight}px`
    : `aspect-ratio:${layout.aspectRatio ?? DEFAULT_ASPECT_RATIO}`;
}

export interface ChartPrerenderResult<D, X extends ChartValue, Y extends ChartValue> {
  /** Deterministic SVG markup for the chart surface. */
  markup: string;
  /** The complete native host options that produced the markup. */
  options: ChartHostOptions<D, X, Y>;
  layout: ChartAdapterLayout;
  /** Inline style for the surface element. */
  surfaceStyle: string;
}

/**
 * Renders chart markup on the server or before mount. It needs no DOM. In the browser,
 * `createChart` adopts the markup without rendering a second SVG.
 */
export function prerenderChart<
  T,
  D = unknown,
  X extends ChartValue = ChartValue,
  Y extends ChartValue = ChartValue,
>(
  chart: ChartSource<T, D, X, Y> | undefined,
  input: ChartInput<T>,
  instance: ChartOptionsInstance<D, X, Y>,
): ChartPrerenderResult<D, X, Y> {
  const options = createChartOptions(chart, input, instance);
  const adapter = createChartRendererAdapter(toRendererOptions(options));
  let markup: string;
  try {
    markup = adapter.prerender();
  } finally {
    adapter.destroy();
  }
  return {
    markup,
    options,
    layout: resolveChartAdapterLayout(options),
    surfaceStyle: chartSurfaceStyle(options as ChartHostOptions<unknown, ChartValue, ChartValue>),
  };
}
