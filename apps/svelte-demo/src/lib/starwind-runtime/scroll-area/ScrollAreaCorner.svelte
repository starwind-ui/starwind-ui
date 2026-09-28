<script module lang="ts">
  import type { ComponentProps, Snippet } from "svelte";
  import { ScrollAreaCorner as PrimitivePart } from "@starwind-ui/svelte/scroll-area";
  import { cx } from "tailwind-variants";
  import { scrollArea, scrollAreaViewport, scrollAreaContent, scrollAreaCorner, scrollAreaScrollbar, scrollAreaThumb } from "./variants.js";
  import { ScrollAreaCorner } from "@starwind-ui/svelte/scroll-area";

  export type ScrollAreaCornerProps = ComponentProps<typeof PrimitivePart>;
</script>

<script lang="ts">
  let {
    "class": className,
    "children": children,
    ...rest
  }: ScrollAreaCornerProps = $props();
</script>

<ScrollAreaCorner
  class={scrollAreaCorner({ "class": cx(className) })}
  {...rest}
  data-slot={"scroll-area-corner"}
>
  {@render children?.()}
</ScrollAreaCorner>
