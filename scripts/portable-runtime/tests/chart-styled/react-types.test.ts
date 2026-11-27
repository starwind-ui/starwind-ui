import { afterEach, describe, expect, it } from "vitest";

import { checkConsumerTypes, removeRoots } from "./type-check.js";

const roots: string[] = [];
afterEach(() => removeRoots(roots));

// The type check uses the react-demo compiler options and modules.
const CHECK_SOURCE = `import {
  type ChartRootDefinitionProps,
  type ChartRootSourceProps,
  useChartRoot,
} from "@starwind-ui/react/chart";
import { barY, defineChart } from "@tanstack/charts";
import { scaleBand } from "@tanstack/charts/scales/band";
import { scaleLinear } from "@tanstack/charts/scales/linear";
import {
  ChartBar,
  type ChartConfig,
  ChartContainer,
  type ChartFactory,
  ChartTooltipContent,
  ChartXAxis,
  defineChartModule,
  type NativeHostOptions,
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
const row = { month: "January", desktop: 1, mobile: 2 };

export const inferred = (
  <ChartContainer
    chart={visitors}
    data={[row]}
    config={config}
    tooltip={
      <ChartTooltipContent<VisitorRow>
        formatter={(_value, _name, _item, _index, payload) => payload.month}
      />
    }
  />
);

// @expect-error-line data
export const wrongData = <ChartContainer chart={visitors} data={[{ month: 1 }]} config={config} />;

export const wrongPayload = (
  <ChartTooltipContent<VisitorRow>
    // @expect-error-line payload
    formatter={(_value, _name, _item, _index, payload) => payload.week}
  />
);

type Row = { month: string; desktop: number };
const rows: Row[] = [{ month: "January", desktop: 186 }];
const scales = { x: { scale: scaleBand }, y: { scale: scaleLinear } };
const factory: ChartFactory<Row, Row, string, number> = (ctx) =>
  defineChart({ marks: [barY(ctx.data, { x: "month", y: "desktop" })], scales });

// The native host datum type comes from the chart factory.
export const nativeHost = (
  <ChartContainer
    chart={factory}
    data={rows}
    config={config}
    tooltip="native"
    host={{
      height: 400,
      onSelect: (point) => {
        point?.datum.desktop.toFixed();
        // @expect-error-line datum
        point?.datum.notAField;
      },
    }}
  />
);

const definition = defineChart({ marks: [barY(rows, { x: "month", y: "desktop" })], scales });
const host: NativeHostOptions<Row, string, number> = {
  onSelect: (point) => point?.datum.desktop.toFixed(),
};
export const staticDefinition = (
  <ChartContainer definition={definition} config={config} host={host} />
);
// @expect-error-line visible
export const staticVisible = <ChartContainer definition={definition} config={config} visible={["desktop"]} />;
// @expect-error-line default-visible
export const staticDefault = <ChartContainer definition={definition} config={config} defaultVisible={["desktop"]} />;
// @expect-error-line listener
export const staticListener = <ChartContainer definition={definition} config={config} onVisibleChange={() => {}} />;
// @expect-error-line both
export const both = <ChartContainer chart={factory} definition={definition} data={rows} config={config} />;
// Without chart and definition, chart parts in the children describe the chart.
export const parts = (
  <ChartContainer data={rows} config={config} aria-label="Visitors">
    <ChartXAxis dataKey="month" tickFormatter={(value: string) => value.slice(0, 3)} />
    <ChartBar dataKey="desktop" radius={4} />
  </ChartContainer>
);

// @expect-error-line spec-part
export const missingKey = <ChartBar radius={4} />;
// @expect-error-line no-data
export const noData = <ChartContainer chart={factory} config={config} />;

export const sourceProps: ChartRootSourceProps<Row, Row, string, number> = { chart: factory, data: rows, config };
export const definitionProps: ChartRootDefinitionProps = { definition, config };

// The public root state has no Runtime plumbing.
export function useLegendKeys() {
  const root = useChartRoot();
  // @expect-error-line plumbing
  root.attachController(null);
  // The public state is read-only, so a legend cannot reorder or drop keys behind the controller.
  // @expect-error-line keys-sort
  root.keys.sort();
  // @expect-error-line visible-pop
  root.visible.pop();
  // @expect-error-line id-write
  root.id = "other";
  return root.keys.filter((key) => root.visible.includes(key)).map(root.label);
}
`;

describe("React Styled chart types", () => {
  it("infers chart data and native host types and keeps typed formatter payloads", async () => {
    const { errors, expected, output } = await checkConsumerTypes({
      app: "apps/react-demo",
      file: "check.tsx",
      source: CHECK_SOURCE,
      compiler: "tsc",
      roots,
    });
    // Each wrong use fails on its own line, and the inferred use passes.
    expect(errors, output).toEqual(new Set(Object.values(expected)));
  }, 120_000);
});
