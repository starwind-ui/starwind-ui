<script lang="ts">
  import ChartGalleryCard from "./ChartGalleryCard.svelte";
  import { type ChartGalleryType, chartGallery, chartGalleryTypes } from "./chart-catalog";

  let { type }: { type: ChartGalleryType } = $props();

  const entries = $derived(chartGallery[type]);
  const label = $derived(chartGalleryTypes.find((item) => item.type === type)?.label ?? type);
  // shadcn fills a 12-slot grid and shows the empty slots as dashed boxes on wide screens.
  const slots = $derived(
    Array.from({ length: Math.max(12, entries.length) }, (_, index) => entries[index]),
  );
</script>

<div class="space-y-6" data-chart-gallery={type}>
  <nav class="flex flex-wrap items-center" aria-label="Chart types">
    {#each chartGalleryTypes as item (item.type)}
      <a
        href={`/review/charts/${item.type}/`}
        class="text-muted-foreground hover:text-primary data-[active=true]:text-primary flex h-7 shrink-0 items-center justify-center px-4 text-center text-base font-medium transition-colors"
        data-active={item.type === type ? "true" : "false"}
        aria-current={item.type === type ? "page" : undefined}
        data-chart-gallery-nav={item.type}
      >
        {item.label}
      </a>
    {/each}
  </nav>

  <h2 class="sr-only">{label}</h2>
  {#if entries.length === 0}
    <p class="text-muted-foreground text-sm" data-chart-gallery-empty>
      This view has no charts yet.
    </p>
  {/if}
  <div
    class="grid flex-1 scroll-mt-20 items-stretch gap-10 md:grid-cols-2 md:gap-6 lg:grid-cols-3 xl:gap-10"
    data-chart-gallery-grid
  >
    {#each slots as entry, index (entry?.id ?? `empty-${index}`)}
      {#if entry}
        <ChartGalleryCard {entry} />
      {:else}
        <div class="hidden aspect-square w-full rounded-lg border border-dashed xl:block"></div>
      {/if}
    {/each}
  </div>
</div>
