<script module lang="ts">
  import type { ComponentProps, Snippet } from "svelte";
  import { DialogRoot } from "@starwind-ui/svelte/dialog";
  import { cx } from "tailwind-variants";
  import { dialogBackdrop, dialogContent, dialogCloseButton, dialogDescription, dialogFooter, dialogHeader, dialogTitle } from "./variants.js";

  export type DialogProps = ComponentProps<typeof DialogRoot>;
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
  }: DialogProps = $props();

  let rootClassName = $derived(className);
</script>

<DialogRoot
  class={rootClassName}
  defaultOpen={defaultOpen}
  closeOnEscape={closeOnEscape}
  closeOnOutsideInteract={closeOnOutsideInteract}
  modal={modal}
  onCloseComplete={onCloseComplete}
  onOpenChange={onOpenChange}
  {...rest}
  data-slot={"dialog"}
  children={children}
  bind:open={open}
>

</DialogRoot>
