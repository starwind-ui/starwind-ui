<script lang="ts">
  import ChartGallery from "$lib/review/chart/ChartGallery.svelte";
  import { chartGalleryTypes } from "$lib/review/chart/chart-catalog";
  import type { PageData } from "./$types";

  let { data }: { data: PageData } = $props();

  const label = $derived(chartGalleryTypes.find((item) => item.type === data.type)?.label);
</script>

<svelte:head><title>{label} · Chart gallery · Starwind Svelte</title></svelte:head>
<main id="main" class="mx-auto w-full max-w-7xl px-6 py-12">
  <header class="mb-8 space-y-3">
    <p class="text-muted-foreground text-sm font-medium tracking-wide uppercase">
      Runtime chart gallery
    </p>
    <h1 class="text-4xl font-semibold tracking-tight">Charts</h1>
    <p class="text-muted-foreground max-w-3xl">
      Compare each chart with the same chart on the shadcn charts page. Check light and dark mode,
      and move the pointer over each chart to see its tooltip.
    </p>
    <a class="text-sm font-medium underline underline-offset-4" href="/review/#chart-review">
      Back to the chart examples
    </a>
  </header>
  {#key data.type}
    <ChartGallery type={data.type} />
  {/key}
</main>
