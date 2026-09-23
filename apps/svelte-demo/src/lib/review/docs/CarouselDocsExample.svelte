<script lang="ts">
  import {
    Carousel,
    CarouselContent,
    CarouselItem,
    CarouselPrevious,
    CarouselNext,
  } from "$lib/starwind-runtime/carousel";
  import type { CarouselInstance } from "@starwind-ui/svelte/carousel";

  const orientations = ["horizontal", "vertical"] as const;
  let selected = $state({ horizontal: 0, vertical: 0 });
  function observe(orientation: (typeof orientations)[number], api: CarouselInstance["api"]) {
    const update = () => {
      selected[orientation] = api.selectedScrollSnap();
    };
    update();
    api.on("select", update);
  }
</script>

<div class="grid w-full gap-8 lg:grid-cols-2">
  {#each orientations as orientation (orientation)}
    <div class="min-w-0 text-center" data-carousel-example={orientation}>
      <h4 class="text-sm font-medium capitalize">{orientation}</h4>
      <div class="flex min-h-80 items-center justify-center px-12 py-12">
        <Carousel
          {orientation}
          opts={{ align: "start" }}
          setApi={(api) => observe(orientation, api)}
          class="w-full max-w-xs"
          aria-label={`${orientation} slide collection`}
        >
          <CarouselContent class={orientation === "vertical" ? "h-52" : undefined}>
            {#each [1, 2, 3] as number (number)}
              <CarouselItem>
                <div
                  class="flex h-48 items-center justify-center rounded-xl border bg-card text-card-foreground shadow-sm"
                >
                  <span class="text-4xl font-semibold tabular-nums">{number}</span>
                </div>
              </CarouselItem>
            {/each}
          </CarouselContent>
          <CarouselPrevious />
          <CarouselNext />
        </Carousel>
      </div>
      <output class="text-sm text-muted-foreground" data-carousel-selection>
        Slide {selected[orientation] + 1} of 3
      </output>
    </div>
  {/each}
</div>
