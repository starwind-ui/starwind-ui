<script lang="ts">
  import {
    type ChartConfig,
    ChartContainer,
    type ChartContext,
    ChartLegend,
    ChartTooltip,
    ChartTooltipContent,
  } from "../../../../../apps/svelte-demo/src/lib/starwind-runtime/chart";
  import {
    type VisitorRow,
    visitorBars,
    visitorConfig,
    visitorData,
  } from "../../../../../packages/runtime/tests/components/chart/fixtures";
  import { createRawSnippet } from "svelte";

  let { scenario }: { scenario: string } = $props();

  const config = visitorConfig as ChartConfig;
  const data = visitorData();
  const iconConfig: ChartConfig = {
    desktop: { label: "Desktop", color: "red", icon: { paths: ["M0 0L10 10"] } },
    mobile: { label: "Mobile", color: "blue" },
  };
  const themes: ChartContext<VisitorRow>["theme"][] = [];
  const themed = (ctx: ChartContext<VisitorRow>) => {
    themes.push(ctx.theme);
    return visitorBars(ctx);
  };
  const preset = {
    id: "svelte-styled-preset",
    ariaLabel: "Visitors",
    create: visitorBars,
    presentation: { hideLabel: true },
  };
  const rowFormatter = (
    value: unknown,
    name: string,
    _item: unknown,
    _index: number,
    payload: VisitorRow,
  ) =>
    createRawSnippet(() => ({
      render: () => `<span data-testid="row">${name}:${String(value)}:${payload.month}</span>`,
    }));

  let mode = $state<boolean | "native">(true);
  let visible = $state<string[] | undefined>(undefined);

  export function setMode(next: boolean | "native") {
    mode = next;
  }
  export function readVisible() {
    return visible;
  }
  export function readThemes() {
    return themes;
  }
</script>

{#snippet slotBody()}<span data-testid="slot">slot</span>{/snippet}
{#snippet childBody()}<span data-testid="child"></span>{/snippet}
{#snippet secondBody()}<span data-testid="second"></span>{/snippet}
{#snippet lineBody()}<ChartTooltipContent indicator="line" />{/snippet}
{#snippet dashedBody()}<ChartTooltipContent indicator="dashed" labelClass="custom-label" />{/snippet}
{#snippet keyLabelBody()}<ChartTooltipContent label="desktop" />{/snippet}
{#snippet hiddenBody()}<ChartTooltipContent hideLabel />{/snippet}
{#snippet formatterBody()}<ChartTooltipContent formatter={rowFormatter} />{/snippet}
{#snippet customLegend()}<p data-testid="custom-legend">custom</p>{/snippet}

{#if scenario === "parts"}
  <ChartContainer id="parts" class="extra" chart={visitorBars} {data} {config} />
{:else if scenario === "theme"}
  <ChartContainer id="theme" chart={themed} {data} {config} theme={{ grid: "red" }} />
{:else if scenario === "default"}
  <ChartContainer id="default" chart={visitorBars} {data} {config} />
{:else if scenario === "off"}
  <ChartContainer id="off" tooltip={false} chart={visitorBars} {data} {config} />
{:else if scenario === "native"}
  <ChartContainer id="native" tooltip="native" chart={visitorBars} {data} {config}>
    <ChartTooltip />
  </ChartContainer>
{:else if scenario === "replace"}
  <ChartContainer id="replace" chart={visitorBars} {data} {config}>
    <div><ChartTooltip content={lineBody} /></div>
    <ChartTooltip content={secondBody} />
  </ChartContainer>
{:else if scenario === "tooltip-default"}
  <ChartContainer id="tooltip-default" chart={visitorBars} {data} {config}>
    <ChartTooltip />
  </ChartContainer>
{:else if scenario === "precedence"}
  <ChartContainer id="precedence" tooltip={slotBody} chart={visitorBars} {data} {config}>
    <ChartTooltip content={childBody} />
  </ChartContainer>
{:else if scenario === "nested"}
  <ChartContainer
    id="nested"
    tooltip={dashedBody}
    defaultVisible={["mobile"]}
    chart={visitorBars}
    {data}
    {config}
  />
{:else if scenario === "key-label"}
  <ChartContainer id="key-label" tooltip={keyLabelBody} chart={visitorBars} {data} {config} />
{:else if scenario === "hidden"}
  <ChartContainer id="hidden" tooltip={hiddenBody} chart={visitorBars} {data} {config} />
{:else if scenario === "preset"}
  <ChartContainer id="preset" chart={preset} {data} {config} />
{:else if scenario === "custom-row"}
  <ChartContainer id="custom-row" tooltip={formatterBody} chart={visitorBars} {data} {config} />
{:else if scenario === "mode"}
  <ChartContainer id="mode" tooltip={mode} chart={visitorBars} {data} {config} />
{:else if scenario === "legend"}
  <ChartContainer id="legend" bind:visible chart={visitorBars} {data} {config}>
    <section data-testid="wrapper"><ChartLegend class="mine" data-extra="yes" /></section>
    <ChartLegend />
  </ChartContainer>
{:else if scenario === "legend-content"}
  <ChartContainer id="legend-content" chart={visitorBars} {data} {config}>
    <ChartLegend content={customLegend} />
  </ChartContainer>
{:else if scenario === "legend-icon"}
  <ChartContainer id="legend-icon" chart={visitorBars} {data} config={iconConfig}>
    <ChartLegend />
    <ChartLegend hideIcon />
  </ChartContainer>
{/if}
