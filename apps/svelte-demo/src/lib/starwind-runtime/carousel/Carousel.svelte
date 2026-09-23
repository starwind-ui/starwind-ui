<script module lang="ts">
  import type { ComponentProps } from "svelte";
  import { CarouselRoot } from "@starwind-ui/svelte/carousel";
  import { cx } from "tailwind-variants";
  import { carousel, carouselContent, carouselContainer, carouselItem, carouselNext, carouselPrevious, carouselControl } from "./variants.js";

  export type CarouselProps = ComponentProps<typeof CarouselRoot>;
</script>

<script lang="ts">
  let {
    "orientation": orientation = "horizontal",
    "opts": opts,
    "plugins": plugins,
    "setApi": setApi,
    "class": className,
    "children": children,
    ...rest
  }: CarouselProps = $props();
</script>

<CarouselRoot
  orientation={orientation}
  opts={opts}
  plugins={plugins}
  setApi={setApi}
  class={carousel({ "class": cx(className) })}
  {...rest}
  data-slot={"carousel"}
>
  {@render children?.()}
</CarouselRoot>
