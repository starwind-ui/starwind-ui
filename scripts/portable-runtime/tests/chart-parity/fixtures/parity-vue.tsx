// Vue form of every chart parity case, written with render functions.
import ChartPrimitive, { useChartRoot, useChartTooltipBody } from "@starwind-ui/vue/chart";
import { type PropType, type VNodeChild, defineComponent, h, isRef, ref } from "vue";

import {
  type ChartConfig,
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
} from "../../../../../apps/vue-demo/src/components/starwind-runtime/chart";
import type { ParityControls } from "./controls";
import {
  PARITY_ID,
  type ParityCase,
  baseConfig,
  moduleFor,
  orderLog,
  parityData,
  parityDefinition,
} from "./modules";

const MobileIcon = () =>
  h("svg", { "data-component-icon": "", viewBox: "0 0 24 24", "aria-hidden": "true" }, [
    h("path", { d: "M7 2h10v20H7z" }),
  ]);

function parityConfig(mode: string): ChartConfig {
  const base = baseConfig(mode);
  return {
    ...base,
    desktop: {
      ...base.desktop,
      label: () => h("strong", { "data-rich-label": "" }, ["Desktop ", h("small", "web")]),
      text: "Desktop",
    },
    mobile: { ...base.mobile, ...(mode === "default" ? { icon: MobileIcon } : {}) },
  } as ChartConfig;
}

type Item = { payload?: unknown; point?: { datum?: unknown } };

const formatted = () =>
  h(ChartTooltipContent, {
    indicator: "dashed",
    labelFormatter: (label: unknown, items: readonly unknown[]) =>
      h("em", { "data-label-formatter": "" }, `${String(label)} · ${items.length} series`),
    formatter: (value: unknown, name: string, item: Item, index: number, payload: unknown) =>
      h(
        "span",
        {
          "data-formatter": "",
          "data-number": typeof value,
          "data-index": index,
          "data-same": String(item.payload === payload && item.point?.datum === payload),
        },
        `${name}: ${String(value)} visits`,
      ),
  });

/**
 * Reports the useChartTooltipBody shape (a ComputedRef inside an open body, null elsewhere) and
 * the field names of the public useChartRoot state.
 */
const HookProbe = defineComponent({
  props: { place: { type: String, required: true } },
  setup(props) {
    const body = useChartTooltipBody();
    const fields = Object.keys(useChartRoot()).sort().join(",");
    return () =>
      h("span", {
        "data-hook": props.place,
        "data-root-fields": fields,
        "data-shape":
          body === null
            ? "null"
            : isRef(body) && Array.isArray(body.value?.points)
              ? "computed"
              : "other",
      });
  },
});

const dashed = () => h(ChartTooltipContent, { indicator: "dashed" });

export default defineComponent({
  name: "ParityVue",
  props: {
    mode: { type: String as PropType<ParityCase>, required: true },
    controls: { type: Object as PropType<ParityControls>, default: undefined },
  },
  setup(props) {
    const selected = ref<string[]>(["desktop", "mobile"]);
    const changes = ref(0);
    const showLegend = ref(true);
    const showFirst = ref(true);
    const showSecond = ref(true);
    const tick = ref(0);
    const count = ref(0);
    const controls = props.controls ?? {};
    controls.command = () => (selected.value = ["desktop", "mobile"]);
    controls.toggleLegend = () => (showLegend.value = !showLegend.value);
    controls.removeFirst = () => (showFirst.value = false);
    controls.removeSecond = () => (showSecond.value = false);
    controls.rerender = () => tick.value++;
    controls.bump = () => count.value++;

    return (): VNodeChild => {
      const mode = props.mode;
      const config = parityConfig(mode);
      const common = { id: PARITY_ID, chart: moduleFor(mode), data: parityData, config };
      const container = (
        extra: Record<string, unknown>,
        slots: Record<string, () => VNodeChild> = {},
      ) => h(ChartContainer, { ...common, ...extra }, slots);
      const legend = () => h(ChartLegend);

      switch (mode) {
        case "definition":
          return h(
            ChartContainer,
            { id: PARITY_ID, definition: parityDefinition, config },
            { default: legend },
          );
        case "primitive":
        case "cancel":
          return h(ChartPrimitive.Root, common, {
            default: () => [
              h(ChartPrimitive.Style),
              h(ChartPrimitive.Surface),
              h(ChartPrimitive.Legend, null, {
                default: () => [
                  h(
                    ChartPrimitive.LegendItem,
                    {
                      value: "desktop",
                      onClick:
                        mode === "cancel" ? (event: Event) => event.preventDefault() : undefined,
                    },
                    { default: () => "Desktop" },
                  ),
                  h(ChartPrimitive.LegendItem, { value: "mobile" }, { default: () => "Mobile" }),
                ],
              }),
            ],
          });
        case "off":
          return container({ tooltip: false });
        case "native":
        case "native-format":
          return container({ tooltip: "native" }, { default: legend });
        case "custom":
          return container(
            {},
            {
              default: () => [
                h(ChartTooltip, null, { content: dashed }),
                h(ChartLegend, null, {
                  content: () => h(ChartLegendContent, { "data-replacement": "" }),
                }),
              ],
            },
          );
        case "formatter":
          return container(
            {},
            { default: () => [h(ChartTooltip, null, { content: formatted }), legend()] },
          );
        case "model":
          return [
            container(
              {
                visible: selected.value,
                "onUpdate:visible": (next: string[]) => {
                  changes.value++;
                  // The parent accepts only "mobile" alone and refuses every other change.
                  if (next.length === 1) selected.value = ["mobile"];
                },
              },
              { default: legend },
            ),
            h("output", { "data-accepted": "" }, selected.value.join(",")),
            h("output", { "data-changes": "" }, String(changes.value)),
          ];
        case "parts":
          return container(
            {},
            {
              default: () => [
                h(ChartTooltip, null, { content: dashed }),
                h(ChartLegend, { hideIcon: true }),
              ],
            },
          );
        case "parts-nested":
          return container(
            {},
            {
              default: () => [
                h("div", { "data-wrapper": "" }, [h(ChartTooltip, null, { content: dashed })]),
                showLegend.value
                  ? h("div", { "data-wrapper": "" }, [h(ChartLegend, { hideIcon: true })])
                  : null,
              ],
            },
          );
        case "plain-body":
          return container({}, { tooltip: () => h("span", { class: "plain-body" }, "plain") });
        case "mixed-body":
          return container(
            {},
            {
              default: () =>
                h(ChartTooltip, null, {
                  content: () => [
                    h("p", { class: "mixed-heading" }, "Heading"),
                    h(ChartTooltipContent, { class: "mixed-content" }),
                  ],
                }),
            },
          );
        case "nested-tooltip":
          return container(
            {},
            {
              tooltip: () =>
                h("div", { class: "outer" }, [
                  h(ChartTooltip, null, {
                    content: () => h("span", { class: "inner" }, "inner"),
                  }),
                ]),
            },
          );
        case "order":
          return container(
            {},
            {
              default: () => [
                h("span", { "data-tick": "" }, String(tick.value)),
                showFirst.value
                  ? h(ChartTooltip, null, {
                      content: () => h(ChartTooltipContent, { class: "first" }),
                    })
                  : null,
                showSecond.value
                  ? h(ChartTooltip, null, {
                      content: () => h(ChartTooltipContent, { class: "second" }),
                    })
                  : null,
              ],
            },
          );
        case "ids":
          return [
            h(
              ChartContainer,
              { chart: moduleFor(mode), data: parityData, config },
              { default: legend },
            ),
            h(
              ChartContainer,
              { chart: moduleFor(mode), data: parityData, config },
              { default: legend },
            ),
          ];
        case "one-way":
          return container({ visible: ["desktop", "mobile"] }, { default: legend });
        case "live-body":
          return container(
            {},
            { tooltip: () => h("span", { class: "live-body" }, `count ${count.value}`) },
          );
        case "precedence":
          return container(
            {},
            {
              tooltip: () => h("span", { class: "container-body" }, "container"),
              default: () =>
                h(ChartTooltip, null, {
                  content: () => h("span", { class: "child-body" }, "child"),
                }),
            },
          );
        case "off-child":
          return container(
            { tooltip: false },
            {
              default: () =>
                h(ChartTooltip, null, {
                  content: () => h("span", { class: "child-body" }, "child"),
                }),
            },
          );
        case "options":
          return container(
            {},
            {
              default: () =>
                h(ChartTooltip, null, {
                  content: () =>
                    h(ChartTooltipContent, { label: "desktop", color: "rgb(255, 0, 0)" }),
                }),
            },
          );
        case "keys":
          return container(
            {},
            {
              default: () =>
                h(ChartTooltip, null, {
                  content: () =>
                    h(ChartTooltipContent, {
                      labelKey: "id",
                      nameKey: "series",
                      valueKey: "value",
                    }),
                }),
            },
          );
        case "callback-order":
          return container(
            {
              onVisibleChange: (next: string[], details: { isCanceled: boolean }) =>
                orderLog().push(
                  `callback ${next.join(",")} ${details.isCanceled ? "canceled" : "open"}`,
                ),
              "onUpdate:visible": (next: string[]) => orderLog().push(`model ${next.join(",")}`),
            },
            { default: legend },
          );
        case "hook":
          return container(
            {},
            {
              tooltip: () => h(HookProbe, { place: "body" }),
              default: () => h(HookProbe, { place: "outside" }),
            },
          );
        case "legends":
          return container(
            {},
            {
              default: () => [
                h("section", { "data-wrapper": "" }, [h(ChartLegend)]),
                h(ChartLegend, { hideIcon: true }),
              ],
            },
          );
        default:
          // default, indicator and preset differ only in config and module.
          return container({}, { default: legend });
      }
    };
  },
});
