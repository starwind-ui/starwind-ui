<script module lang="ts">
  import type { ComponentProps } from "svelte";
  import { CollapsiblePanel as PrimitivePart } from "@starwind-ui/svelte/collapsible";
  import { cx } from "tailwind-variants";
  import { collapsible, collapsibleContent, collapsibleTrigger } from "./variants.js";
  import { CollapsiblePanel } from "@starwind-ui/svelte/collapsible";

  export type CollapsibleContentProps = ComponentProps<typeof PrimitivePart>;
</script>

<script lang="ts">
  let {
    "class": className,
    "children": children,
    ...rest
  }: CollapsibleContentProps = $props();
</script>

<CollapsiblePanel
  class={collapsibleContent({ "class": cx(className) })}
  {...rest}
  data-slot={"collapsible-content"}
>
  {@render children?.()}
</CollapsiblePanel>
