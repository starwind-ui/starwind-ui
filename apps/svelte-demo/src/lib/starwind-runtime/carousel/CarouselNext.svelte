<script module lang="ts">
  import type { ComponentProps } from "svelte";
  import { CarouselNext } from "@starwind-ui/svelte/carousel";
  import { cx } from "tailwind-variants";
  import type { VariantProps } from "tailwind-variants";
  import { carousel, carouselContent, carouselContainer, carouselItem, carouselNext, carouselPrevious, carouselControl } from "./variants.js";

  export type CarouselNextProps = ComponentProps<typeof CarouselNext> & VariantProps<typeof carouselControl>;
</script>

<script lang="ts">
  let {
    "variant": variant = "outline",
    "size": size = "icon",
    "class": className,
    "children": children,
    ...rest
  }: CarouselNextProps = $props();

  let controlClassName = $derived(carouselNext({ "class": cx(className) }));
</script>

<CarouselNext
  aria-label={"Next slide"}
  class={carouselControl({ "variant": variant, "size": size, "class": cx(controlClassName) })}
  {...rest}
  data-slot={"carousel-next"}
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
      d={"M9 6l6 6l-6 6"}
    />
  </svg>
  <span
    class={"sr-only"}
  >
    Next slide
  </span>{/if}
</CarouselNext>
