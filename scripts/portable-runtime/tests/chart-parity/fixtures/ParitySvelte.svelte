<!-- Svelte form of every chart parity case. -->
<script lang="ts">
  import ChartPrimitive from "@starwind-ui/svelte/chart";
  import { createRawSnippet } from "svelte";

  import {
    type ChartConfig,
    ChartContainer,
    ChartLegend,
    ChartLegendContent,
    ChartTooltip,
    ChartTooltipContent,
  } from "../../../../../apps/svelte-demo/src/lib/starwind-runtime/chart";
  import type { ParityControls } from "./controls";
  import HookProbe from "./HookProbe.svelte";
  import MobileIcon from "./MobileIcon.svelte";
  import {
    PARITY_ID,
    type ParityCase,
    baseConfig,
    moduleFor,
    orderLog,
    parityData,
    parityDefinition,
  } from "./modules";

  let { mode, controls = {} }: { mode: ParityCase; controls?: ParityControls } = $props();

  let selected = $state<string[]>(["desktop", "mobile"]);
  let changes = $state(0);
  let showLegend = $state(true);
  let showFirst = $state(true);
  let showSecond = $state(true);
  let bound = $state<string[] | undefined>(undefined);
  let callbacks = $state(0);
  let tick = $state(0);
  let count = $state(0);
  // svelte-ignore state_referenced_locally
  Object.assign(controls, {
    command: () => (selected = ["desktop", "mobile"]),
    toggleLegend: () => (showLegend = !showLegend),
    removeFirst: () => (showFirst = false),
    removeSecond: () => (showSecond = false),
    rerender: () => tick++,
    bump: () => count++,
  });

  const config = $derived.by(() => {
    const base = baseConfig(mode);
    return {
      ...base,
      desktop: { ...base.desktop, label: desktopLabel, text: "Desktop" },
      mobile: { ...base.mobile, ...(mode === "default" ? { icon: MobileIcon } : {}) },
    } as ChartConfig;
  });
  const chart = $derived(moduleFor(mode));

  type Item = { payload?: unknown; point?: { datum?: unknown } };
  const text = (value: string) =>
    value.replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll('"', "&quot;");
  const labelFormatter = (label: unknown, items: readonly unknown[]) =>
    createRawSnippet(() => ({
      render: () => `<em data-label-formatter="">${text(`${String(label)} · ${items.length} series`)}</em>`,
    }));
  const formatter = (value: unknown, name: string, item: Item, index: number, payload: unknown) =>
    createRawSnippet(() => ({
      render: () =>
        `<span data-formatter="" data-number="${typeof value}" data-index="${index}" data-same="${String(
          item.payload === payload && item.point?.datum === payload,
        )}">${text(`${name}: ${String(value)} visits`)}</span>`,
    }));
</script>

{#snippet desktopLabel()}<strong data-rich-label="">Desktop <small>web</small></strong>{/snippet}
{#snippet dashed()}<ChartTooltipContent indicator="dashed" />{/snippet}
{#snippet formatted()}<ChartTooltipContent
    indicator="dashed"
    {labelFormatter}
    formatter={formatter as never}
  />{/snippet}
{#snippet replacementLegend()}<ChartLegendContent data-replacement="" />{/snippet}
{#snippet plainBody()}<span class="plain-body">plain</span>{/snippet}
{#snippet mixedBody()}<p class="mixed-heading">Heading</p><ChartTooltipContent class="mixed-content" />{/snippet}
{#snippet innerBody()}<span class="inner">inner</span>{/snippet}
{#snippet nestedBody()}<div class="outer"><ChartTooltip content={innerBody} /></div>{/snippet}
{#snippet firstBody()}<ChartTooltipContent class="first" />{/snippet}
{#snippet secondBody()}<ChartTooltipContent class="second" />{/snippet}
{#snippet containerBody()}<span class="container-body">container</span>{/snippet}
{#snippet childBody()}<span class="child-body">child</span>{/snippet}
{#snippet optionsBody()}<ChartTooltipContent label="desktop" color="rgb(255, 0, 0)" />{/snippet}
{#snippet keysBody()}<ChartTooltipContent labelKey="id" nameKey="series" valueKey="value" />{/snippet}
{#snippet hookBody()}<HookProbe place="body" />{/snippet}
{#snippet liveBody()}<span class="live-body">count {count}</span>{/snippet}

{#if mode === "definition"}
  <ChartContainer id={PARITY_ID} definition={parityDefinition} {config}><ChartLegend /></ChartContainer>
{:else if mode === "primitive" || mode === "cancel"}
  <ChartPrimitive.Root id={PARITY_ID} {chart} data={parityData} {config}>
    <ChartPrimitive.Style />
    <ChartPrimitive.Surface />
    <ChartPrimitive.Legend>
      <ChartPrimitive.LegendItem
        value="desktop"
        onclick={mode === "cancel" ? (event: Event) => event.preventDefault() : undefined}
        >Desktop</ChartPrimitive.LegendItem
      >
      <ChartPrimitive.LegendItem value="mobile">Mobile</ChartPrimitive.LegendItem>
    </ChartPrimitive.Legend>
  </ChartPrimitive.Root>
{:else if mode === "off"}
  <ChartContainer id={PARITY_ID} {chart} data={parityData} {config} tooltip={false} />
{:else if mode === "native" || mode === "native-format"}
  <ChartContainer id={PARITY_ID} {chart} data={parityData} {config} tooltip="native"
    ><ChartLegend /></ChartContainer
  >
{:else if mode === "custom"}
  <ChartContainer id={PARITY_ID} {chart} data={parityData} {config}>
    <ChartTooltip content={dashed} />
    <ChartLegend content={replacementLegend} />
  </ChartContainer>
{:else if mode === "formatter"}
  <ChartContainer id={PARITY_ID} {chart} data={parityData} {config}>
    <ChartTooltip content={formatted} />
    <ChartLegend />
  </ChartContainer>
{:else if mode === "model"}
  <ChartContainer
    id={PARITY_ID}
    {chart}
    data={parityData}
    {config}
    bind:visible={
      () => selected,
      (next) => {
        changes++;
        // The parent accepts only "mobile" alone and refuses every other change.
        if (next?.length === 1) selected = ["mobile"];
      }
    }><ChartLegend /></ChartContainer
  >
  <output data-accepted="">{selected.join(",")}</output>
  <output data-changes="">{changes}</output>
{:else if mode === "parts"}
  <ChartContainer id={PARITY_ID} {chart} data={parityData} {config}>
    <ChartTooltip content={dashed} />
    <ChartLegend hideIcon />
  </ChartContainer>
{:else if mode === "parts-nested"}
  <ChartContainer id={PARITY_ID} {chart} data={parityData} {config}>
    <div data-wrapper=""><ChartTooltip content={dashed} /></div>
    {#if showLegend}<div data-wrapper=""><ChartLegend hideIcon /></div>{/if}
  </ChartContainer>
{:else if mode === "plain-body"}
  <ChartContainer id={PARITY_ID} {chart} data={parityData} {config} tooltip={plainBody} />
{:else if mode === "mixed-body"}
  <ChartContainer id={PARITY_ID} {chart} data={parityData} {config}>
    <ChartTooltip content={mixedBody} />
  </ChartContainer>
{:else if mode === "nested-tooltip"}
  <ChartContainer id={PARITY_ID} {chart} data={parityData} {config} tooltip={nestedBody} />
{:else if mode === "order"}
  <ChartContainer id={PARITY_ID} {chart} data={parityData} {config}>
    <span data-tick="">{tick}</span>
    {#if showFirst}<ChartTooltip content={firstBody} />{/if}
    {#if showSecond}<ChartTooltip content={secondBody} />{/if}
  </ChartContainer>
{:else if mode === "ids"}
  <ChartContainer {chart} data={parityData} {config}><ChartLegend /></ChartContainer>
  <ChartContainer {chart} data={parityData} {config}><ChartLegend /></ChartContainer>
{:else if mode === "one-way"}
  <ChartContainer id={PARITY_ID} {chart} data={parityData} {config} visible={["desktop", "mobile"]}
    ><ChartLegend /></ChartContainer
  >
{:else if mode === "live-body"}
  <ChartContainer id={PARITY_ID} {chart} data={parityData} {config} tooltip={liveBody} />
{:else if mode === "precedence"}
  <ChartContainer id={PARITY_ID} {chart} data={parityData} {config} tooltip={containerBody}>
    <ChartTooltip content={childBody} />
  </ChartContainer>
{:else if mode === "off-child"}
  <ChartContainer id={PARITY_ID} {chart} data={parityData} {config} tooltip={false}>
    <ChartTooltip content={childBody} />
  </ChartContainer>
{:else if mode === "options"}
  <ChartContainer id={PARITY_ID} {chart} data={parityData} {config}>
    <ChartTooltip content={optionsBody} />
  </ChartContainer>
{:else if mode === "keys"}
  <ChartContainer id={PARITY_ID} {chart} data={parityData} {config}>
    <ChartTooltip content={keysBody} />
  </ChartContainer>
{:else if mode === "hook"}
  <ChartContainer id={PARITY_ID} {chart} data={parityData} {config} tooltip={hookBody}>
    <HookProbe place="outside" />
  </ChartContainer>
{:else if mode === "callback-order"}
  <ChartContainer
    id={PARITY_ID}
    {chart}
    data={parityData}
    {config}
    bind:visible={() => undefined, (next) => orderLog().push(`model ${next?.join(",")}`)}
    onVisibleChange={(next, details) =>
      orderLog().push(`callback ${next.join(",")} ${details.isCanceled ? "canceled" : "open"}`)}
    ><ChartLegend /></ChartContainer
  >
{:else if mode === "normalize"}
  <!-- A local model: the binding starts undefined, so defaultVisible seeds the keys. -->
  <ChartContainer
    id={PARITY_ID}
    {chart}
    data={parityData}
    {config}
    bind:visible={bound}
    defaultVisible={["mobile", "unknown", "desktop", "mobile"]}
    onVisibleChange={() => callbacks++}><ChartLegend /></ChartContainer
  >
  <output data-bound="">{JSON.stringify(bound ?? null)}</output>
  <output data-callbacks="">{callbacks}</output>
{:else if mode === "legends"}
  <ChartContainer id={PARITY_ID} {chart} data={parityData} {config}>
    <section data-wrapper=""><ChartLegend /></section>
    <ChartLegend hideIcon />
  </ChartContainer>
{:else}
  <!-- default, indicator and preset differ only in config and module. -->
  <ChartContainer id={PARITY_ID} {chart} data={parityData} {config}><ChartLegend /></ChartContainer>
{/if}
