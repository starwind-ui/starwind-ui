<script module lang="ts">
  import type { ComponentProps, Snippet } from "svelte";
  import { TooltipTrigger } from "@starwind-ui/svelte/tooltip";
  import { cx } from "tailwind-variants";
  import { tooltip, tooltipPositioner, tooltipContent, tooltipCaret } from "./variants.js";

  export type TooltipTriggerProps = ComponentProps<typeof TooltipTrigger>;
</script>

<script lang="ts">
  let {
    "disabled": disabled = false,
    "class": className,
    "child": child,
    "children": children,
    ...rest
  }: TooltipTriggerProps = $props();

  let triggerClassName = $derived(cx(child ? undefined : "inline-flex", className));
</script>

<TooltipTrigger
  class={triggerClassName}
  disabled={disabled}
  {...rest}
  data-slot={"tooltip-trigger"}
  child={child}
>
  {@render children?.()}
</TooltipTrigger>
