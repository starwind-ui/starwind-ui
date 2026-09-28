<script module lang="ts">
  import type { ComponentProps, Snippet } from "svelte";
  import { PopoverDescription } from "@starwind-ui/svelte/popover";
  import { cx } from "tailwind-variants";
  import { popover, popoverContent, popoverDescription, popoverHeader, popoverTitle, popoverTrigger } from "./variants.js";

  export type PopoverDescriptionProps = ComponentProps<typeof PopoverDescription>;
</script>

<script lang="ts">
  let {
    "class": className,
    "children": children,
    ...rest
  }: PopoverDescriptionProps = $props();
</script>

<PopoverDescription
  class={popoverDescription({ "class": cx(className) })}
  {...rest}
  data-slot={"popover-description"}
>
  {@render children?.()}
</PopoverDescription>
