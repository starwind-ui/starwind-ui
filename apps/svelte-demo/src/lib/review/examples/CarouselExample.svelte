<script lang="ts">
  import Carousel from "$lib/starwind-runtime/carousel";
  import { Button } from "$lib/starwind-runtime/button";
  let slides = $state(["First card", "Second card"]);
</script>

<div class="grid w-full justify-items-center gap-5">
  <div class="w-full max-w-md px-12">
    <Carousel.Root aria-label="Custom slide collection" opts={{ align: "start" }}>
      <Carousel.Content>
        {#each slides as slide (slide)}
          <Carousel.Item>
            <article
              class="flex min-h-36 flex-col justify-center rounded-xl border bg-card p-6 text-card-foreground"
            >
              <h4 class="font-medium">{slide}</h4>
              <p class="mt-2 text-sm text-muted-foreground">
                Each slide can contain your own content.
              </p>
            </article>
          </Carousel.Item>
        {/each}
      </Carousel.Content>
      <Carousel.Previous />
      <Carousel.Next />
    </Carousel.Root>
  </div>
  <Button
    variant="outline"
    size="sm"
    onclick={() => {
      slides = [...slides, `Card ${slides.length + 1}`];
    }}
  >
    Add a slide
  </Button>
</div>
