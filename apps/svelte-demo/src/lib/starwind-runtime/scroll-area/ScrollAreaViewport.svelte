<script module lang="ts">
  import type { ComponentProps, Snippet } from "svelte";
  import { ScrollAreaViewport as PrimitivePart } from "@starwind-ui/svelte/scroll-area";
  import { cx } from "tailwind-variants";
  import { scrollArea, scrollAreaViewport, scrollAreaContent, scrollAreaCorner, scrollAreaScrollbar, scrollAreaThumb } from "./variants.js";
  import { ScrollAreaViewport } from "@starwind-ui/svelte/scroll-area";
  import "./styles.css";

  export type ScrollAreaViewportProps = ComponentProps<typeof PrimitivePart>;
</script>

<script lang="ts">
  let {
    "class": className,
    "children": children,
    ...rest
  }: ScrollAreaViewportProps = $props();
</script>

<ScrollAreaViewport
  class={scrollAreaViewport({ "class": cx(className) })}
  {...rest}
  data-slot={"scroll-area-viewport"}
>
  {@render children?.()}
</ScrollAreaViewport>
