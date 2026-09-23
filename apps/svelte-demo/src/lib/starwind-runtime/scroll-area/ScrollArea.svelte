<script module lang="ts">
  import type { ComponentProps, Snippet } from "svelte";
  import { ScrollAreaRoot as PrimitivePart } from "@starwind-ui/svelte/scroll-area";
  import { cx } from "tailwind-variants";
  import { scrollArea, scrollAreaViewport, scrollAreaContent, scrollAreaCorner, scrollAreaScrollbar, scrollAreaThumb } from "./variants.js";
  import { ScrollAreaRoot } from "@starwind-ui/svelte/scroll-area";
  import { ScrollAreaViewport } from "@starwind-ui/svelte/scroll-area";
  import { ScrollAreaContent } from "@starwind-ui/svelte/scroll-area";
  import { ScrollAreaScrollbar } from "@starwind-ui/svelte/scroll-area";
  import { ScrollAreaThumb } from "@starwind-ui/svelte/scroll-area";
  import { ScrollAreaCorner } from "@starwind-ui/svelte/scroll-area";
  import "./styles.css";

  export type ScrollAreaProps = ComponentProps<typeof PrimitivePart> & { autoViewport?: boolean; viewportClass?: string; scrollbar?: Snippet };
</script>

<script lang="ts">
  let {
    "overflowEdgeThreshold": overflowEdgeThreshold,
    "class": className,
    "children": children,
    "autoViewport": autoViewport = true,
    "viewportClass": viewportClass,
    "scrollbar": scrollbar,
    ...rest
  }: ScrollAreaProps = $props();
</script>

<ScrollAreaRoot
  class={scrollArea({ "class": cx(className) })}
  overflowEdgeThreshold={overflowEdgeThreshold}
  {...rest}
  data-slot={"scroll-area"}
>
  {#if autoViewport}
    <ScrollAreaViewport
      class={scrollAreaViewport({ "class": cx(viewportClass) })}
      data-slot={"scroll-area-viewport"}
    >
      <ScrollAreaContent
        class={scrollAreaContent({  })}
        data-slot={"scroll-area-content"}
      >
        {@render children?.()}
      </ScrollAreaContent>
    </ScrollAreaViewport>
  {:else}
    {@render children?.()}
  {/if}
  {#if scrollbar}{@render scrollbar()}{:else}<ScrollAreaScrollbar
    class={scrollAreaScrollbar({  })}
    data-slot={"scroll-area-scrollbar"}
  >
    <ScrollAreaThumb
      class={scrollAreaThumb({  })}
      data-slot={"scroll-area-thumb"}
    />
  </ScrollAreaScrollbar>{/if}
  <ScrollAreaCorner
    class={scrollAreaCorner({  })}
    data-slot={"scroll-area-corner"}
  />
</ScrollAreaRoot>
