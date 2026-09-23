<script module lang="ts">
  import type { ComponentProps, Snippet } from "svelte";
  import { DrawerTrigger } from "@starwind-ui/svelte/drawer";
  import { cx } from "tailwind-variants";
  import { sheetBackdrop, sheetContent, sheetCloseButton, sheetDescription, sheetFooter, sheetHeader, sheetTitle } from "./variants.js";

  export type SheetTriggerProps = ComponentProps<typeof DrawerTrigger>;
</script>

<script lang="ts">
  let {
    "targetId": targetId,
    "class": className,
    "children": children,
    ...rest
  }: SheetTriggerProps = $props();

  let triggerClassName = $derived(className);
</script>

<DrawerTrigger
  class={triggerClassName}
  targetId={targetId}
  {...rest}
  data-slot={"sheet-trigger"}
>
  {@render children?.()}
</DrawerTrigger>
