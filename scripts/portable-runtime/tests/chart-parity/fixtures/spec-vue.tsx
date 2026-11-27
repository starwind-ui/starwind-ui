// Vue form of the chart spec part cases, written with render functions.
import { type PropType, defineComponent, h, reactive, ref } from "vue";

import {
  ChartArea,
  ChartBar,
  ChartContainer,
  ChartGrid,
  ChartLabel,
  ChartLegend,
  ChartLine,
  ChartLinearGradient,
  ChartPie,
  ChartPolarAngleAxis,
  ChartPolarGrid,
  ChartRadar,
  ChartRadialBar,
  ChartTooltip,
  ChartTooltipContent,
  ChartXAxis,
  ChartYAxis,
} from "../../../../../apps/vue-demo/src/components/starwind-runtime/chart";
import type { SpecCase } from "./cases";
import type { ParityControls } from "./controls";
import {
  legendFirstConfig,
  nestedLabel,
  nestedStops,
  shadcnGradient,
  shadcnPie,
  shadcnTopLabel,
  specChart,
  specKind,
  tooltipKeysConfig,
} from "./spec-charts";

const cartesianGuides = () => [
  h(ChartGrid, { vertical: false }),
  h(ChartXAxis, { dataKey: "month", tickFormatter: { maxLength: 3 } }),
];

const WrappedBar = defineComponent({
  props: { dataKey: { type: String, required: true } },
  setup: (props) => () => h(ChartBar, { dataKey: props.dataKey }),
});

export default defineComponent({
  name: "SpecVue",
  props: {
    mode: { type: String as PropType<SpecCase>, required: true },
    controls: { type: Object as PropType<ParityControls>, default: () => ({}) },
  },
  setup(props) {
    const radius = ref(4);
    const showMobile = ref(true);
    const renders = ref(0);
    const currency = ref<"usd" | "eur">("usd");
    const cursor = ref(false);
    const cursors = ref<[boolean | undefined, boolean | undefined]>([undefined, false]);
    const showFirst = ref(true);
    const label = reactive(nestedLabel());
    const stops = reactive(nestedStops());
    Object.assign(props.controls, {
      editNested: () => {
        label.formatter.prefix = "€";
        stops[0]!.stopColor = "blue";
      },
      setCursors: (first: boolean | undefined, second: boolean | undefined) =>
        (cursors.value = [first, second]),
      removeFirst: () => (showFirst.value = false),
      toggleCursor: () => (cursor.value = !cursor.value),
      setRadius: (next: number) => (radius.value = next),
      toggleMobile: () => (showMobile.value = !showMobile.value),
      toggleCurrency: () => (currency.value = currency.value === "usd" ? "eur" : "usd"),
      rerender: () => renders.value++,
    });
    return () => {
      const kind = specKind(props.mode);
      const { module, data, config } = specChart(kind);
      // The render reads the currency, so a new formatter reaches the y axis.
      const symbol = currency.value === "usd" ? "$" : "€";
      if (props.mode === "spec-live")
        return h(
          ChartContainer,
          { id: "spec-live", data, config, "data-renders": renders.value },
          () => [
            h(ChartGrid, { vertical: false }),
            h(ChartXAxis, {
              dataKey: "month",
              tickFormatter: (value: string) => value.slice(0, 3),
            }),
            h(ChartYAxis, { tickFormatter: (value: number) => `${symbol}${value}` }),
            h(ChartBar, { dataKey: "desktop", radius: radius.value }),
            showMobile.value ? h(ChartBar, { dataKey: "mobile", radius: radius.value }) : null,
            h(ChartLegend),
            h(ChartTooltip, null, {
              content: () => h(ChartTooltipContent, { formatter: { suffix: " visits" } }),
            }),
          ],
        );
      if (props.mode === "spec-nested")
        return h(ChartContainer, { id: "spec-nested", data, config }, () => [
          h(ChartXAxis, { dataKey: "month", tickFormatter: { maxLength: 3 } }),
          h(ChartLinearGradient, { id: "fill-nested", stops }),
          h(ChartBar, { dataKey: "desktop", fill: "url(#fill-nested)", label }),
        ]);
      if (props.mode === "spec-legend-first")
        return h(
          ChartContainer,
          { id: "spec-legend-first", data, config: legendFirstConfig },
          () => [
            h(ChartLegend),
            h(ChartXAxis, { dataKey: "month", tickFormatter: { maxLength: 3 } }),
            h(ChartBar, { dataKey: "desktop" }),
            showMobile.value ? h(ChartBar, { dataKey: "mobile" }) : null,
            h(ChartLegend),
          ],
        );
      if (props.mode === "spec-legend-wrapped")
        return h(ChartContainer, { id: "spec-legend-wrapped", data, config }, () => [
          h(ChartXAxis, { dataKey: "month", tickFormatter: { maxLength: 3 } }),
          h(ChartBar, { dataKey: "desktop" }),
          h(WrappedBar, { dataKey: "mobile" }),
          h(ChartLegend),
        ]);
      if (props.mode === "spec-options")
        return h(
          ChartContainer,
          { id: "spec-options", data, config, stackOffset: "expand" },
          () => [
            h(ChartXAxis, { dataKey: "month", tickFormatter: { maxLength: 3 } }),
            h(ChartYAxis),
            h(ChartBar, { dataKey: "desktop", stackId: "a" }),
            h(ChartBar, { dataKey: "mobile", stackId: "a" }),
            h(ChartTooltip, { cursor: cursor.value }),
          ],
        );
      if (props.mode === "spec-cursor-order")
        return h(ChartContainer, { id: "spec-cursor-order", data, config }, () => [
          h(ChartXAxis, { dataKey: "month", tickFormatter: { maxLength: 3 } }),
          h(ChartBar, { dataKey: "desktop" }),
          showFirst.value ? h(ChartTooltip, { cursor: cursors.value[0] }) : null,
          h(ChartTooltip, { cursor: cursors.value[1] }),
        ]);
      if (props.mode === "spec-labels")
        return h("div", [
          h(
            ChartContainer,
            { id: "spec-labels-bar", data, config, "data-renders": renders.value },
            () => [
              h(ChartGrid, { vertical: false }),
              h(ChartXAxis, { dataKey: "month", tickMargin: 10, tickFormatter: { maxLength: 3 } }),
              h(ChartBar, {
                dataKey: "desktop",
                radius: 8,
                label: { ...shadcnTopLabel, formatter: (value: number) => `${symbol}${value}` },
              }),
            ],
          ),
          h(
            ChartContainer,
            { id: "spec-labels-line", data: shadcnPie.data, config: shadcnPie.config },
            () => [
              h(ChartGrid, { vertical: false }),
              h(ChartLine, {
                dataKey: "visitors",
                label: { ...shadcnTopLabel, dataKey: "browser", formatter: { configLabel: true } },
              }),
            ],
          ),
          h(
            ChartContainer,
            { id: "spec-labels-pie", data: shadcnPie.data, config: shadcnPie.config },
            () => [h(ChartPie, { dataKey: "visitors", nameKey: "browser", label: true })],
          ),
        ]);
      if (props.mode === "spec-gradient") {
        const area = specChart("area");
        return h(
          "div",
          (["desktop", "mobile"] as const).map((key) =>
            h(
              ChartContainer,
              { key, id: `spec-gradient-${key}`, data: area.data, config: area.config },
              () => [
                h(ChartXAxis, { dataKey: "month", tickFormatter: { maxLength: 3 } }),
                h(ChartLinearGradient, shadcnGradient(`var(--color-${key})`)),
                h(ChartArea, { dataKey: key, fill: "url(#fillArea)" }),
              ],
            ),
          ),
        );
      }
      if (props.mode === "spec-pie-text")
        return h(
          ChartContainer,
          { id: "spec-pie-text", data: shadcnPie.data, config: shadcnPie.config },
          () => [
            h(ChartLegend),
            h(ChartPie, {
              dataKey: "visitors",
              nameKey: "browser",
              innerRadius: 60,
              stroke: "none",
            }),
            h(ChartLabel, { position: "center", fontWeight: 700 }),
            h(ChartLabel, {
              position: "center",
              value: "Visitors",
              dy: 24,
              fontSize: 12,
              fill: "var(--muted-foreground)",
            }),
          ],
        );
      if (props.mode === "spec-tooltip-keys")
        return h(
          ChartContainer,
          { id: "spec-tooltip-keys", data: specChart("bar").data, config: tooltipKeysConfig },
          () => [
            h(ChartXAxis, { dataKey: "month" }),
            h(ChartBar, { dataKey: "desktop" }),
            h(ChartBar, { dataKey: "mobile" }),
            h(ChartTooltip, null, {
              content: () => h(ChartTooltipContent, { nameKey: "views", labelKey: "activities" }),
            }),
          ],
        );
      // A bare template attribute reaches the part as "", so `dot: ""` checks boolean casting.
      if (props.mode === "spec-radar-grid") {
        const radar = specChart("radar");
        return h(
          ChartContainer,
          { id: "spec-radar-grid", data: radar.data, config: radar.config },
          () => [
            h(ChartPolarGrid, {
              radialLines: false,
              polarRadius: [90],
              strokeWidth: 2,
              fill: "var(--color-desktop)",
              fillOpacity: 0.2,
            }),
            h(ChartPolarAngleAxis, { dataKey: "month" }),
            h(ChartRadar, {
              dataKey: "desktop",
              dot: "" as unknown as boolean,
              activeDot: { r: 6 },
            }),
          ],
        );
      }
      if (props.mode === "spec-combined")
        return h(ChartContainer, { id: "spec-combined", chart: module, data, config }, () => [
          h(ChartBar, { dataKey: "desktop" }),
        ]);
      if (props.mode === "spec-no-axis")
        return h(ChartContainer, { id: "spec-no-axis", data, config }, () => [
          h(ChartGrid, { vertical: false }),
          h(ChartBar, { dataKey: "desktop", radius: 4 }),
          h(ChartBar, { dataKey: "mobile", radius: 4 }),
        ]);
      if (props.mode === "spec-empty")
        return h(ChartContainer, { id: "spec-empty-vue", data, config });
      const id = `spec-${kind}`;
      if (props.mode.startsWith("spec-module-"))
        return h(ChartContainer, { id, chart: module, data, config }, () =>
          kind === "bar" ? [h(ChartLegend)] : [],
        );
      const parts = {
        bar: () => [
          ...cartesianGuides(),
          h(ChartYAxis),
          h(ChartBar, { dataKey: "desktop", radius: 4 }),
          h(ChartBar, { dataKey: "mobile", radius: 4 }),
          h(ChartLegend),
        ],
        area: () => [
          ...cartesianGuides(),
          h(ChartYAxis),
          h(ChartArea, { dataKey: "desktop", type: "monotone", stackId: "a" }),
          h(ChartArea, { dataKey: "mobile", type: "monotone", stackId: "a" }),
        ],
        line: () => [
          ...cartesianGuides(),
          h(ChartLine, { dataKey: "desktop", type: "natural" }),
          h(ChartTooltip, null, { content: () => h(ChartTooltipContent, { hideLabel: true }) }),
        ],
        donut: () => [
          h(ChartPie, { dataKey: "desktop", nameKey: "month", innerRadius: "58.5%" }),
          h(ChartLabel, { position: "center" }),
        ],
        radar: () => [
          h(ChartPolarGrid),
          h(ChartPolarAngleAxis, { dataKey: "month", tickFormatter: { maxLength: 3 } }),
          h(ChartRadar, { dataKey: "desktop" }),
          h(ChartRadar, { dataKey: "mobile" }),
        ],
        radial: () => [
          h(ChartRadialBar, { dataKey: "visitors", nameKey: "browser", background: true }),
        ],
      };
      return h(ChartContainer, { id, data, config, "aria-label": module.ariaLabel }, parts[kind]);
    };
  },
});
