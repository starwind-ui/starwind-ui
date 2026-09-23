<script module lang="ts">
  import type { ComponentProps, Snippet } from "svelte";
  import { DrawerTitle } from "@starwind-ui/svelte/drawer";
  import { cx } from "tailwind-variants";
  import { sheetBackdrop, sheetContent, sheetCloseButton, sheetDescription, sheetFooter, sheetHeader, sheetTitle } from "./variants.js";

  export type SheetTitleProps = ComponentProps<typeof DrawerTitle>;
</script>

<script lang="ts">
  let {
    "class": className,
    "children": children,
    ...rest
  }: SheetTitleProps = $props();
</script>

<DrawerTitle
  class={sheetTitle({ "class": cx(className) })}
  {...rest}
  data-slot={"sheet-title"}
>
  {@render children?.()}
</DrawerTitle>
