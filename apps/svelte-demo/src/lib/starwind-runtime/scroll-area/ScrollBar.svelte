<script module lang="ts">
  import type { ComponentProps, Snippet } from "svelte";
  import { ScrollAreaScrollbar as PrimitivePart } from "@starwind-ui/svelte/scroll-area";
  import { cx } from "tailwind-variants";
  import { scrollArea, scrollAreaViewport, scrollAreaContent, scrollAreaCorner, scrollAreaScrollbar, scrollAreaThumb } from "./variants.js";
  import { ScrollAreaScrollbar } from "@starwind-ui/svelte/scroll-area";
  import { ScrollAreaThumb } from "@starwind-ui/svelte/scroll-area";

  export type ScrollBarProps = ComponentProps<typeof PrimitivePart>;
</script>

<script lang="ts">
  let {
    "keepMounted": keepMounted = false,
    "orientation": orientation = "vertical",
    "class": className,
    "children": children,
    ...rest
  }: ScrollBarProps = $props();
</script>

<ScrollAreaScrollbar
  class={scrollAreaScrollbar({ "class": cx(className) })}
  keepMounted={keepMounted}
  orientation={orientation}
  {...rest}
  data-orientation={orientation}
  data-slot={"scroll-area-scrollbar"}
>
  {#if children}{@render children()}{:else}<ScrollAreaThumb
    class={scrollAreaThumb({  })}
    data-slot={"scroll-area-thumb"}
  />{/if}
</ScrollAreaScrollbar>
