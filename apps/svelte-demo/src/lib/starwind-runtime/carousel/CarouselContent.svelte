<script module lang="ts">
  import type { ComponentProps } from "svelte";
  import { CarouselViewport } from "@starwind-ui/svelte/carousel";
  import { cx } from "tailwind-variants";
  import { carousel, carouselContent, carouselContainer, carouselItem, carouselNext, carouselPrevious, carouselControl } from "./variants.js";
  import { CarouselContainer } from "@starwind-ui/svelte/carousel";

  export type CarouselContentProps = ComponentProps<typeof CarouselViewport>;
</script>

<script lang="ts">
  let {
    "class": className,
    "children": children,
    ...rest
  }: CarouselContentProps = $props();
</script>

<CarouselViewport
  class={carouselContent({  })}
  {...rest}
  data-slot={"carousel-content"}
>
  <CarouselContainer
    class={carouselContainer({ "class": cx(className) })}
    data-slot={"carousel-container"}
  >
    {@render children?.()}
  </CarouselContainer>
</CarouselViewport>
