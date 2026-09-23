<script module lang="ts">
  import type { ComponentProps, Snippet } from "svelte";
  import { PopoverTrigger } from "@starwind-ui/svelte/popover";
  import { cx } from "tailwind-variants";
  import { popover, popoverContent, popoverDescription, popoverHeader, popoverTitle, popoverTrigger } from "./variants.js";

  export type PopoverTriggerProps = ComponentProps<typeof PopoverTrigger>;
</script>

<script lang="ts">
  let {
    "class": className,
    "child": child,
    "children": children,
    ...rest
  }: PopoverTriggerProps = $props();

  let triggerBaseClassName = $derived(popoverTrigger({ "class": cx(className) }));

  let triggerClassName = $derived(child ? className : triggerBaseClassName);
</script>

<PopoverTrigger
  class={triggerClassName}
  {...rest}
  data-slot={"popover-trigger"}
  child={child}
>
  {@render children?.()}
</PopoverTrigger>
