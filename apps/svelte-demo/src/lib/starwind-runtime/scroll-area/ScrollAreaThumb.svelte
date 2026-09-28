<script module lang="ts">
  import type { ComponentProps, Snippet } from "svelte";
  import { ScrollAreaThumb as PrimitivePart } from "@starwind-ui/svelte/scroll-area";
  import { cx } from "tailwind-variants";
  import { scrollArea, scrollAreaViewport, scrollAreaContent, scrollAreaCorner, scrollAreaScrollbar, scrollAreaThumb } from "./variants.js";
  import { ScrollAreaThumb } from "@starwind-ui/svelte/scroll-area";

  export type ScrollAreaThumbProps = ComponentProps<typeof PrimitivePart>;
</script>

<script lang="ts">
  let {
    "class": className,
    "children": children,
    ...rest
  }: ScrollAreaThumbProps = $props();
</script>

<ScrollAreaThumb
  class={scrollAreaThumb({ "class": cx(className) })}
  {...rest}
  data-slot={"scroll-area-thumb"}
>
  {@render children?.()}
</ScrollAreaThumb>
