<script module lang="ts">
  import type { ComponentProps, Snippet } from "svelte";
  import { DrawerDescription } from "@starwind-ui/svelte/drawer";
  import { cx } from "tailwind-variants";
  import { sheetBackdrop, sheetContent, sheetCloseButton, sheetDescription, sheetFooter, sheetHeader, sheetTitle } from "./variants.js";

  export type SheetDescriptionProps = ComponentProps<typeof DrawerDescription>;
</script>

<script lang="ts">
  let {
    "class": className,
    "children": children,
    ...rest
  }: SheetDescriptionProps = $props();
</script>

<DrawerDescription
  class={sheetDescription({ "class": cx(className) })}
  {...rest}
  data-slot={"sheet-description"}
>
  {@render children?.()}
</DrawerDescription>
