<script module lang="ts">
  import type { ComponentProps, Snippet } from "svelte";
  import { ScrollAreaContent as PrimitivePart } from "@starwind-ui/svelte/scroll-area";
  import { cx } from "tailwind-variants";
  import { scrollArea, scrollAreaViewport, scrollAreaContent, scrollAreaCorner, scrollAreaScrollbar, scrollAreaThumb } from "./variants.js";
  import { ScrollAreaContent } from "@starwind-ui/svelte/scroll-area";

  export type ScrollAreaContentProps = ComponentProps<typeof PrimitivePart>;
</script>

<script lang="ts">
  let {
    "class": className,
    "children": children,
    ...rest
  }: ScrollAreaContentProps = $props();
</script>

<ScrollAreaContent
  class={scrollAreaContent({ "class": cx(className) })}
  {...rest}
  data-slot={"scroll-area-content"}
>
  {@render children?.()}
</ScrollAreaContent>
