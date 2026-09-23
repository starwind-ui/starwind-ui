<script module lang="ts">
  import type { ComponentProps, Snippet } from "svelte";
  import { DrawerRoot } from "@starwind-ui/svelte/drawer";
  import { cx } from "tailwind-variants";
  import { sheetBackdrop, sheetContent, sheetCloseButton, sheetDescription, sheetFooter, sheetHeader, sheetTitle } from "./variants.js";

  export type SheetProps = ComponentProps<typeof DrawerRoot>;
</script>

<script lang="ts">
  let {
    "defaultOpen": defaultOpen = false,
    "closeOnEscape": closeOnEscape = true,
    "closeOnOutsideInteract": closeOnOutsideInteract = true,
    "modal": modal = true,
    "class": className,
    open = $bindable(),
    "onOpenChange": onOpenChange,
    "onCloseComplete": onCloseComplete,
    "children": children,
    ...rest
  }: SheetProps = $props();

  let rootClassName = $derived(className);
</script>

<DrawerRoot
  class={rootClassName}
  defaultOpen={defaultOpen}
  closeOnEscape={closeOnEscape}
  closeOnOutsideInteract={closeOnOutsideInteract}
  modal={modal}
  onCloseComplete={onCloseComplete}
  onOpenChange={onOpenChange}
  {...rest}
  data-slot={"sheet"}
  children={children}
  bind:open={open}
>

</DrawerRoot>
