<script module lang="ts">
  import type { ComponentProps, Snippet } from "svelte";
  import { DrawerClose } from "@starwind-ui/svelte/drawer";
  import { cx } from "tailwind-variants";
  import { sheetBackdrop, sheetContent, sheetCloseButton, sheetDescription, sheetFooter, sheetHeader, sheetTitle } from "./variants.js";

  export type SheetCloseProps = ComponentProps<typeof DrawerClose>;
</script>

<script lang="ts">
  let {
    "class": className,
    "children": children,
    ...rest
  }: SheetCloseProps = $props();

  let closeClassName = $derived(className);
</script>

<DrawerClose
  class={closeClassName}
  {...rest}
  data-slot={"sheet-close"}
>
  {#if children}{@render children()}{:else}Close{/if}
</DrawerClose>
