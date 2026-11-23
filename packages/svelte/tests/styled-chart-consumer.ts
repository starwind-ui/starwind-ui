/**
 * Chart Root props are one union of a chart source branch and a static definition branch. Each
 * invalid source or visibility combination is a separate negative witness.
 */
const chartScript = (body = "") => `<script lang="ts">
import { ChartContainer, type ChartConfig, type ChartModule } from "./chart/index.js";
import type { ChartDefinition, ChartRootDefinitionProps, ChartRootSourceProps } from "@starwind-ui/svelte/chart";
type Row = { month: string; desktop: number };
const visitors = null as unknown as ChartModule<Row>;
const definition = null as unknown as ChartDefinition;
const config: ChartConfig = { desktop: { label: "Desktop" } };
const rows: Row[] = [{ month: "January", desktop: 1 }];
const keys = ["desktop"];
type Branches = ChartRootSourceProps | ChartRootDefinitionProps;
void (null as unknown as Branches);
${body}
</script>`;

export const chartPositive = `${chartScript(`let visible = $state<string[] | undefined>();
const source: ChartRootSourceProps<Row> = { chart: visitors, data: rows, config };
const staticDefinition: ChartRootDefinitionProps = { definition, config };
void source; void staticDefinition;`)}
<ChartContainer chart={visitors} data={rows} {config} />
<ChartContainer chart={visitors} data={rows} {config} bind:visible onVisibleChange={(next, details) => { const accepted: string[] = next; details.cancel(); void accepted; }} />
<ChartContainer chart={visitors} data={rows} {config} defaultVisible={keys} />
<ChartContainer {definition} data={rows} {config} />`;

export const chartNegatives: Record<string, string> = {
  "StyledChartBothSources.svelte": `${chartScript()}<ChartContainer chart={visitors} {definition} data={rows} {config} />`,
  "StyledChartNoSource.svelte": `${chartScript()}<ChartContainer data={rows} {config} />`,
  "StyledChartNoData.svelte": `${chartScript()}<ChartContainer chart={visitors} {config} />`,
  "StyledChartDefinitionVisible.svelte": `${chartScript()}<ChartContainer {definition} {config} visible={keys} />`,
  "StyledChartDefinitionDefault.svelte": `${chartScript()}<ChartContainer {definition} {config} defaultVisible={keys} />`,
  "StyledChartDefinitionListener.svelte": `${chartScript()}<ChartContainer {definition} {config} onVisibleChange={() => {}} />`,
  // The public root state has no Runtime plumbing.
  "ChartRootPlumbing.svelte": `<script lang="ts">import { useChartRoot } from "@starwind-ui/svelte/chart"; const root = useChartRoot(); root.toggle(root.keys[0]!); root.attachController(null);</script>`,
  // The public state is read-only, so a legend cannot reorder or drop keys behind the controller.
  "ChartRootReadonlyKeys.svelte": `<script lang="ts">import { useChartRoot } from "@starwind-ui/svelte/chart"; const root = useChartRoot(); root.keys.sort();</script>`,
  "ChartRootReadonlyVisible.svelte": `<script lang="ts">import { useChartRoot } from "@starwind-ui/svelte/chart"; const root = useChartRoot(); root.visible.pop();</script>`,
};
