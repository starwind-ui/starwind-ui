<script module lang="ts">
  import type { ComponentProps, Snippet } from "svelte";
  import { PopoverTitle } from "@starwind-ui/svelte/popover";
  import { cx } from "tailwind-variants";
  import { popover, popoverContent, popoverDescription, popoverHeader, popoverTitle, popoverTrigger } from "./variants.js";

  export type PopoverTitleProps = ComponentProps<typeof PopoverTitle>;
</script>

<script lang="ts">
  let {
    "class": className,
    "children": children,
    ...rest
  }: PopoverTitleProps = $props();
</script>

<PopoverTitle
  class={popoverTitle({ "class": cx(className) })}
  {...rest}
  data-slot={"popover-title"}
>
  {@render children?.()}
</PopoverTitle>
