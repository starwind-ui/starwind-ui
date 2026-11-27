import { afterEach, describe, expect, it } from "vitest";

import { checkConsumerTypes, removeRoots } from "./type-check.js";

const roots: string[] = [];
afterEach(() => removeRoots(roots));

// The Styled ChartContainer and both Primitive Root exports are typed from the ChartRootProps
// union, so each template rejects the invalid source and visibility combinations. Inline
// visibility listeners on a source chart keep their parameter types.
const SURFACES = [
  ["container", "ChartContainer"],
  ["namespace", "Chart.Root"],
  ["named", "ChartRoot"],
] as const;

function templateCases(tag: string, name: string, strictTemplates: boolean): string {
  const line = (props: string) => `  <${name} ${props} />`;
  const reject = (marker: string, props: string) =>
    `  <!-- @expect-error-line ${tag}-${marker} -->\n${line(props)}`;
  const source = `:chart="visitors" :data="rows" :config="config"`;
  // The Primitive Root reads listener types from its emits, so its definition branch leaves the
  // listener props out. Strict templates reject them as unknown props. The Styled ChartContainer
  // declares no emits, so its definition branch keeps the listener types for inference.
  const listenerProp = `:definition="definition" :config="config" :on-visible-change="onVisibleChange"`;
  return [
    line(source),
    line(`${source} v-model:visible="visible" @visible-change="onVisibleChange"`),
    line(`${source} :on-visible-change="onVisibleChange"`),
    line(`${source} :default-visible="visible"`),
    line(
      `${source} @visible-change="(keys, details) => { const count: number = keys.length; details.cancel(); void count; }" @update:visible="(keys) => keys.join(',')"`,
    ),
    reject("inline-details", `${source} @visible-change="(keys, details) => details.nope(keys)"`),
    reject("inline-model", `${source} @update:visible="(keys) => keys.toFixed()"`),
    line(`:definition="definition" :data="rows" :config="config"`),
    reject("both", `:chart="visitors" :definition="definition" :data="rows" :config="config"`),
    // Without chart and definition, chart parts in the default slot describe the chart.
    line(`:data="rows" :config="config"`),
    reject("no-data", `:chart="visitors" :config="config"`),
    reject("visible", `:definition="definition" :config="config" :visible="visible"`),
    reject(
      "default-visible",
      `:definition="definition" :config="config" :default-visible="visible"`,
    ),
    reject("model", `:definition="definition" :config="config" v-model:visible="visible"`),
    tag !== "container" && strictTemplates
      ? reject("listener-prop", listenerProp)
      : `${LISTENER_NOTE}\n${line(listenerProp)}`,
    LISTENER_NOTE,
    line(`:definition="definition" :config="config" @visible-change="onVisibleChange"`),
  ].join("\n");
}

// vue-tsc 3.3 does not reject a visibility listener on a definition in these cases. The typed
// props cases fail, and the Root throws a setup error for the listener (chart.ssr.test.ts).
const LISTENER_NOTE = "  <!-- vue-tsc 3.3 accepts this listener on a definition. -->";

const checkSource = (strictTemplates: boolean) => `<script setup lang="ts">
import { defineComponent } from "vue";
import Chart, {
  ChartRoot,
  type ChartRootDefinitionProps,
  type ChartRootProps,
  type ChartRootSourceProps,
  useChartRoot,
} from "@starwind-ui/vue/chart";
import { barY, defineChart } from "@tanstack/charts";
import { scaleBand } from "@tanstack/charts/scales/band";
import { scaleLinear } from "@tanstack/charts/scales/linear";
import {
  type ChartConfig,
  ChartContainer,
  defineChartModule,
} from "../../src/components/starwind-runtime/chart";
import {
  type VisitorRow,
  visitorBars,
} from "../../../../packages/runtime/tests/components/chart/fixtures";

const visitors = defineChartModule<VisitorRow>({
  id: "visitors",
  ariaLabel: "Visitors",
  create: visitorBars,
});
const config: ChartConfig = { desktop: { label: "Desktop" } };
const rows: VisitorRow[] = [{ month: "January", desktop: 1, mobile: 2 }];
const scales = { x: { scale: scaleBand }, y: { scale: scaleLinear } };
const definition = defineChart({ marks: [barY(rows, { x: "month", y: "desktop" })], scales });
const visible = ["desktop"];
const onVisibleChange = (_visible: string[]) => {};

const source: ChartRootSourceProps<VisitorRow> = { chart: visitors, data: rows, config };
const staticDefinition: ChartRootDefinitionProps = { definition, config };
const union: ChartRootProps<VisitorRow> = { chart: visitors, data: rows, config, visible };
// @expect-error-line both-props
const bothProps: ChartRootProps = { chart: visitors, definition, data: rows, config };
// Chart parts in the default slot describe this chart.
const partsProps: ChartRootProps = { data: rows, config, "aria-label": "Visitors" };
// @expect-error-line no-data-props
const noDataProps: ChartRootProps = { chart: visitors, config };
// @expect-error-line visible-props
const visibleProps: ChartRootProps = { definition, config, visible };
// @expect-error-line default-visible-props
const defaultVisibleProps: ChartRootProps = { definition, config, defaultVisible: visible };
// @expect-error-line listener-props
const listenerProps: ChartRootProps = { definition, config, onVisibleChange };
// @expect-error-line model-listener-props
const modelListenerProps: ChartRootProps = { definition, config, "onUpdate:visible": onVisibleChange };
void [source, staticDefinition, union, bothProps, partsProps, noDataProps];
void [visibleProps, defaultVisibleProps, listenerProps, modelListenerProps];
// The public root state has no Runtime plumbing.
const root = useChartRoot();
root.toggle(root.keys[0]!);
// @expect-error-line plumbing
root.attachController(null);
// The public state is read-only, so a legend cannot reorder or drop keys behind the controller.
// @expect-error-line keys-sort
root.keys.sort();
// @expect-error-line visible-pop
root.visible.pop();
// @expect-error-line id-write
root.id = "other";
// The Root components keep their component options and instance members.
const Extended = defineComponent({ extends: ChartRoot });
const NamespaceExtended = defineComponent({ extends: Chart.Root });
const options = [ChartRoot.props, ChartRoot.emits, Chart.Root.props, Chart.Root.emits];
type RootInstance = InstanceType<typeof ChartRoot>;
type IsNever<Value> = [Value] extends [never] ? true : false;
const slots: IsNever<RootInstance["$slots"]> = false;
const emits: IsNever<RootInstance["$emit"]> = false;
const emit = null as unknown as RootInstance["$emit"];
emit("visibleChange", ["desktop"], null as unknown as Parameters<NonNullable<ChartRootSourceProps["onVisibleChange"]>>[1]);
// @expect-error-line emit-payload
emit("update:visible", 1);
void [Extended, NamespaceExtended, options, slots, emits];
</script>

<template>
${SURFACES.map(([tag, name]) => templateCases(tag, name, strictTemplates)).join("\n")}
</template>
`;

describe("Vue chart root types", () => {
  for (const strictTemplates of [false, true])
    it(`accept each chart source branch and reject invalid combinations (strictTemplates: ${strictTemplates})`, async () => {
      const { errors, expected, output } = await checkConsumerTypes({
        app: "apps/vue-demo",
        file: "Check.vue",
        source: checkSource(strictTemplates),
        compiler: "vue-tsc",
        roots,
        vueCompilerOptions: { strictTemplates },
      });
      // Each wrong use fails on its own line, and the valid uses pass.
      expect(errors, output).toEqual(new Set(Object.values(expected)));
    }, 180_000);
});
