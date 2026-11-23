<script lang="ts">
  import { createRawSnippet, untrack } from "svelte";
  import {
    ChartContainer,
    ChartLegend,
    ChartTooltip,
    ChartTooltipContent,
  } from "$lib/starwind-runtime/chart";
  import {
    type ChartGalleryEntry,
    type ChartGalleryTooltipRow,
    chartGalleryRows,
    chartGalleryTooltipClasses,
    trendingUpIcon,
  } from "./chart-catalog";

  let { entry }: { entry: ChartGalleryEntry } = $props();

  const control = $derived(entry.control);
  // The control state starts from the catalog entry once. The gallery keys cards by entry id.
  const initial = untrack(() => entry.control);
  let range = $state(
    initial?.kind === "range" || initial?.kind === "active" ? initial.initial : undefined,
  );
  let series = $state(initial?.kind === "series" ? initial.initial : undefined);
  const data = $derived(chartGalleryRows(entry, range));
  const visible = $derived(series ? [series] : undefined);

  const escape = (value: string) =>
    value.replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll('"', "&quot;");

  /** A formatted tooltip row from the catalog, as markup for a Svelte snippet. */
  function rowMarkup(row: ChartGalleryTooltipRow): string {
    const classes = chartGalleryTooltipClasses;
    const amount = (value: string) =>
      `<div class="${classes.value}">${escape(value)}<span class="${classes.unit}">${escape(row.unit)}</span></div>`;
    if (row.kind === "unit") {
      return `<div class="${classes.unitRow}">${escape(row.name)}${amount(row.value)}</div>`;
    }
    const total =
      row.total === undefined
        ? ""
        : `<div class="${classes.total}">Total${amount(row.total)}</div>`;
    return `<div class="${classes.swatchRow}"><div class="${classes.swatch}" style="background: var(--sw-chart-color-${escape(row.key)})"></div>${escape(row.name)}${amount(row.value)}${total}</div>`;
  }

  /** shadcn's formatter props on a tooltip content, from the catalog format. */
  const formatter = $derived.by(() => {
    const row = entry.format?.row;
    return row
      ? (value: unknown, name: string, item: unknown, index: number) => {
          const markup = rowMarkup(row(value, name, item as never, index));
          return createRawSnippet(() => ({ render: () => markup }));
        }
      : undefined;
  });
  const labelFormatter = $derived.by(() => {
    const label = entry.format?.label;
    return label ? (value: unknown) => label(value) : undefined;
  });
</script>

{#snippet formatted()}<ChartTooltipContent
    formatter={formatter as never}
    {labelFormatter}
  />{/snippet}

<div
  class={[
    "bg-card text-card-foreground flex min-w-0 flex-col gap-6 rounded-xl border shadow-sm",
    control?.kind === "range" ? "pb-6" : control?.kind === "series" ? "" : "py-6",
    entry.fullWidth && "md:col-span-2 lg:col-span-3",
  ]}
  data-chart-gallery-card={entry.id}
>
  {#if control?.kind === "range"}
    <div class="flex items-center gap-2 border-b px-6 py-5 sm:flex-row">
      <div class="grid flex-1 gap-1">
        <h3 class="leading-none font-semibold">{entry.title}</h3>
        <p class="text-muted-foreground text-sm">{entry.description}</p>
      </div>
      <select
        bind:value={range}
        class="border-input dark:bg-input/30 focus-visible:border-outline focus-visible:ring-outline/50 hidden h-9 w-[160px] rounded-lg border bg-transparent px-3 text-sm shadow-xs outline-none focus-visible:ring-[3px] sm:ml-auto sm:flex"
        aria-label={control.label}
        data-chart-gallery-range
      >
        {#each control.options as option (option.value)}
          <option value={option.value}>{option.label}</option>
        {/each}
      </select>
    </div>
  {:else if control?.kind === "series"}
    <div class="flex flex-col items-stretch border-b sm:flex-row">
      <div class="flex flex-1 flex-col justify-center gap-1 px-6 pt-4 pb-3 sm:py-0">
        <h3 class="leading-none font-semibold">{entry.title}</h3>
        <p class="text-muted-foreground text-sm">{entry.description}</p>
      </div>
      <div class="flex">
        {#each control.options as option (option.key)}
          <button
            type="button"
            class="data-[active=true]:bg-muted/50 relative z-30 flex flex-1 flex-col justify-center gap-1 border-t px-6 py-4 text-left even:border-l sm:border-t-0 sm:border-l sm:px-8 sm:py-6"
            data-active={option.key === series ? "true" : "false"}
            aria-pressed={option.key === series}
            data-chart-gallery-series={option.key}
            onclick={() => (series = option.key)}
          >
            <span class="text-muted-foreground text-xs">{option.label}</span>
            <span class="text-lg leading-none font-bold sm:text-3xl">{option.total}</span>
          </button>
        {/each}
      </div>
    </div>
  {:else if control?.kind === "active"}
    <div class="flex items-start gap-2 px-6">
      <div class="grid gap-1">
        <h3 class="leading-none font-semibold">{entry.title}</h3>
        <p class="text-muted-foreground text-sm">{entry.description}</p>
      </div>
      <select
        bind:value={range}
        class="border-input dark:bg-input/30 focus-visible:border-outline focus-visible:ring-outline/50 ml-auto h-7 w-[130px] rounded-lg border bg-transparent py-0 pr-2 pl-2.5 text-xs shadow-xs outline-none focus-visible:ring-[3px]"
        aria-label={control.label}
        data-chart-gallery-active
      >
        {#each control.options as option (option.value)}
          <option value={option.value}>{option.label}</option>
        {/each}
      </select>
    </div>
  {:else}
    <div class="grid gap-2 px-6">
      <h3 class="leading-none font-semibold">{entry.title}</h3>
      <p class="text-muted-foreground text-sm">{entry.description}</p>
    </div>
  {/if}

  <div
    class={[
      "px-6",
      control?.kind === "series" && "px-2 sm:p-6",
      entry.square && "flex flex-1 items-center",
    ]}
  >
    <div
      class={[entry.square && "mx-auto w-full"]}
      style={entry.square ? `max-width: ${entry.square}px` : undefined}
    >
      <ChartContainer
        id={entry.id}
        chart={entry.chart}
        config={entry.config}
        {data}
        {visible}
        tooltip={entry.tooltip}
      >
        {#if entry.format}<ChartTooltip content={formatted} />{/if}
        {#if entry.legend}<ChartLegend />{/if}
      </ChartContainer>
    </div>
  </div>

  {#if entry.footer}
    <div
      class={["flex flex-col gap-2 px-6 text-sm", entry.square ? "items-center" : "items-start"]}
    >
      <div class="flex items-center gap-2 leading-none font-medium">
        {entry.footer.trend}
        <svg
          class="size-4"
          viewBox={trendingUpIcon.viewBox}
          fill="none"
          stroke="currentColor"
          stroke-width="2"
          stroke-linecap="round"
          stroke-linejoin="round"
          aria-hidden="true"
        >
          {#each trendingUpIcon.paths as path (path)}<path d={path} />{/each}
        </svg>
      </div>
      <div class="text-muted-foreground leading-none">{entry.footer.detail}</div>
    </div>
  {/if}
</div>
