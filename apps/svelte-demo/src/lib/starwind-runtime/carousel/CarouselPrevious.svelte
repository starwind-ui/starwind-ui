<script module lang="ts">
  import type { ComponentProps } from "svelte";
  import { CarouselPrevious } from "@starwind-ui/svelte/carousel";
  import { cx } from "tailwind-variants";
  import type { VariantProps } from "tailwind-variants";
  import { carousel, carouselContent, carouselContainer, carouselItem, carouselNext, carouselPrevious, carouselControl } from "./variants.js";

  export type CarouselPreviousProps = ComponentProps<typeof CarouselPrevious> & VariantProps<typeof carouselControl>;
</script>

<script lang="ts">
  let {
    "variant": variant = "outline",
    "size": size = "icon",
    "class": className,
    "children": children,
    ...rest
  }: CarouselPreviousProps = $props();

  let controlClassName = $derived(carouselPrevious({ "class": cx(className) }));
</script>

<CarouselPrevious
  aria-label={"Previous slide"}
  class={carouselControl({ "variant": variant, "size": size, "class": cx(controlClassName) })}
  {...rest}
  data-slot={"carousel-previous"}
>
  {#if children}{@render children()}{:else}<svg
    xmlns={"http://www.w3.org/2000/svg"}
    viewBox={"0 0 24 24"}
    fill={"none"}
    stroke={"currentColor"}
    stroke-width={"2"}
    stroke-linecap={"round"}
    stroke-linejoin={"round"}
    aria-hidden={"true"}
  >
    <path
      stroke={"none"}
      d={"M0 0h24v24H0z"}
      fill={"none"}
    />
    <path
      d={"M15 6l-6 6l6 6"}
    />
  </svg>
  <span
    class={"sr-only"}
  >
    Previous slide
  </span>{/if}
</CarouselPrevious>
