<script module lang="ts">
  import type { ComponentProps, Snippet } from "svelte";
  import { DialogRoot } from "@starwind-ui/svelte/dialog";
  import { cx } from "tailwind-variants";
  import { dialogBackdrop, dialogContent, dialogCloseButton, dialogDescription, dialogFooter, dialogHeader, dialogTitle } from "./variants.js";

  export type DialogProps = ComponentProps<typeof DialogRoot>;
</script>

<script lang="ts">
  let {
    defaultOpen = false,
    closeOnEscape = true,
    closeOnOutsideInteract = true,
    modal = true,
    "class": className,
    open = $bindable(),
    onOpenChange,
    onCloseComplete,
    children,
    "open": commandOpen,
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
  bind:open={() => commandOpen, (next) => { open = next; }}
>

</DialogRoot>
