// Framework-neutral chart modules, data and config for the chart parity fixtures. Every fixture in
// every framework reads these, so the four frameworks render the same chart. Each module has its
// own id, because the browser registry keeps the latest definition for an id.
import { type ChartIcon, type ChartContext, defineChartModule } from "@starwind-ui/runtime/chart";

import {
  type VisitorRow,
  visitorArea,
  visitorBars,
  visitorBarsX,
  visitorData,
  visitorDonut,
  visitorNestedPie,
  visitorRadar,
  visitorRadialBars,
} from "../../../../../packages/runtime/tests/components/chart/fixtures";

export type { VisitorRow };

/** Every fixture uses this id, so the parity snapshots compare the same markup. */
export const PARITY_ID = "parity";

export const parityData = visitorData();

export const desktopIcon: ChartIcon = { viewBox: "0 0 24 24", paths: ["M3 4h18v12H3z"] };
export const mobileIcon: ChartIcon = { viewBox: "0 0 24 24", paths: ["M7 2h10v20H7z"] };

/** Colors and portable icons. Each framework adds its own rich desktop label. */
export function baseConfig(mode: string) {
  const icons = mode !== "indicator" && mode !== "preset";
  return {
    desktop: { color: "rgb(37, 99, 235)", ...(icons ? { icon: desktopIcon } : {}) },
    mobile: {
      label: "Mobile",
      color: "rgb(96, 165, 250)",
      ...(icons ? { icon: mobileIcon } : {}),
    },
  };
}

export const parityVisitors = defineChartModule<VisitorRow>({
  id: "parity-visitors",
  ariaLabel: "Visitors",
  create: visitorBars,
});

/** A module whose native TanStack tooltip formats the group. */
export const parityNativeFormat = defineChartModule<VisitorRow>({
  id: "parity-native-format",
  ariaLabel: "Visitors",
  create: (ctx: ChartContext<VisitorRow>) => ({
    ...visitorBars(ctx),
    tooltip: ctx.tooltip(
      { labelKey: "month" },
      {
        showDelay: 0,
        hideDelay: 0,
        formatGroup: (points: readonly { datum: unknown }[]) =>
          `Native ${String((points[0]?.datum as { value?: number } | undefined)?.value)}`,
      },
    ),
  }),
});

/** A module with a portable presentation preset. */
export const parityPreset = defineChartModule<VisitorRow>({
  id: "parity-preset",
  ariaLabel: "Visitors",
  create: visitorBars,
  presentation: { hideLabel: true, hideIndicator: true },
});

type FormatterItem = { payload?: unknown; point?: { datum?: unknown } };

/** Builds the formatter row as a DOM node, for Astro and Raw HTML. */
function domFormatter(
  value: unknown,
  name: string,
  item: FormatterItem,
  index: number,
  payload: unknown,
) {
  const span = document.createElement("span");
  span.dataset.formatter = "";
  span.dataset.number = typeof value;
  span.dataset.index = String(index);
  span.dataset.same = String(item.payload === payload && item.point?.datum === payload);
  span.textContent = `${name}: ${String(value)} visits`;
  return span;
}

function domLabelFormatter(label: unknown, items: readonly unknown[]) {
  const em = document.createElement("em");
  em.dataset.labelFormatter = "";
  em.textContent = `${String(label)} · ${items.length} series`;
  return em;
}

/** Astro takes formatters from the module's domPresentation (SPEC-AC-12). */
export const parityFormatter = defineChartModule<VisitorRow>({
  id: "parity-formatter",
  ariaLabel: "Visitors",
  create: visitorBars,
  domPresentation: {
    indicator: "dashed",
    formatter: domFormatter as never,
    labelFormatter: domLabelFormatter,
  },
});

/**
 * A static native TanStack definition. It owns its visibility, so its legend is passive. It has no
 * tooltip of its own, so the Runtime gives it the Starwind tooltip.
 */
const { tooltip: _definitionTooltip, ...nativeDefinition } = visitorBars({
  data: parityData,
  config: {},
  keys: ["desktop", "mobile"],
  visible: ["desktop", "mobile"],
  params: {},
  isVisible: () => true,
  label: (key: string) => key,
  color: { domain: ["desktop", "mobile"], range: ["rgb(37, 99, 235)", "rgb(96, 165, 250)"] },
  theme: { foreground: "black", muted: "gray", grid: "gray", background: "white" },
  tooltip: (() => undefined) as never,
});
export const parityDefinition = nativeDefinition;

/** Modules for the tooltip placement cases, one per chart type. */
const snapModules = {
  area: defineChartModule<VisitorRow>({
    id: "parity-area",
    ariaLabel: "Visitors",
    create: visitorArea,
  }),
  donut: defineChartModule<VisitorRow>({
    id: "parity-donut",
    ariaLabel: "Visitors",
    create: visitorDonut,
  }),
  radar: defineChartModule<VisitorRow>({
    id: "parity-radar",
    ariaLabel: "Visitors",
    create: visitorRadar,
  }),
  "bars-x": defineChartModule<VisitorRow>({
    id: "parity-bars-x",
    ariaLabel: "Visitors",
    create: visitorBarsX,
  }),
  radial: defineChartModule<VisitorRow>({
    id: "parity-radial",
    ariaLabel: "Visitors",
    create: visitorRadialBars,
  }),
  nested: defineChartModule<VisitorRow>({
    id: "parity-nested",
    ariaLabel: "Visitors",
    create: visitorNestedPie,
  }),
};

/**
 * The shared log of the callback-order case. The fixture callbacks and the test's DOM listener
 * write to it, so the test reads one order across frameworks.
 */
export function orderLog(): string[] {
  const scope = globalThis as { __chartOrderLog?: string[] };
  return (scope.__chartOrderLog ??= []);
}

/** Picks the chart module for a mode. */
export function moduleFor(mode: string) {
  if (mode === "native-format") return parityNativeFormat;
  if (mode === "preset") return parityPreset;
  return snapModules[mode as keyof typeof snapModules] ?? parityVisitors;
}

export { EXTRA_CASES, PARITY_MODES, type ParityCase } from "./cases";
