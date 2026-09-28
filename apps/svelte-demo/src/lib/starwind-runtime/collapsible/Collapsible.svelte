<script module lang="ts">
  import type { ComponentProps } from "svelte";
  import { CollapsibleRoot as PrimitivePart } from "@starwind-ui/svelte/collapsible";
  import { cx } from "tailwind-variants";
  import { collapsible, collapsibleContent, collapsibleTrigger } from "./variants.js";
  import { CollapsibleRoot } from "@starwind-ui/svelte/collapsible";

  export type CollapsibleProps = ComponentProps<typeof PrimitivePart>;
</script>

<script lang="ts">
  let {
    "defaultOpen": defaultOpen = false,
    "disabled": disabled = false,
    "class": className,
    "children": children,
    open = $bindable(),
    "onOpenChange": onOpenChange,
    ...rest
  }: CollapsibleProps = $props();
</script>

<CollapsibleRoot
  class={collapsible({ "class": cx(className) })}
  defaultOpen={defaultOpen}
  disabled={disabled}
  onOpenChange={onOpenChange}
  {...rest}
  data-slot={"collapsible"}
  children={children}
  bind:open={open}
>

</CollapsibleRoot>
