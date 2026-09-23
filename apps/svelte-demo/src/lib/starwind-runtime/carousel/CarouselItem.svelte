<script module lang="ts">
  import type { ComponentProps } from "svelte";
  import { CarouselItem } from "@starwind-ui/svelte/carousel";
  import { cx } from "tailwind-variants";
  import { carousel, carouselContent, carouselContainer, carouselItem, carouselNext, carouselPrevious, carouselControl } from "./variants.js";

  export type CarouselItemProps = ComponentProps<typeof CarouselItem>;
</script>

<script lang="ts">
  let {
    "class": className,
    "children": children,
    ...rest
  }: CarouselItemProps = $props();
</script>

<CarouselItem
  class={carouselItem({ "class": cx(className) })}
  {...rest}
  data-slot={"carousel-item"}
>
  {@render children?.()}
</CarouselItem>
