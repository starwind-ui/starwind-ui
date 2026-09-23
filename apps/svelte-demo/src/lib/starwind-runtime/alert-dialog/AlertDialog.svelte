<script module lang="ts">
  import type { ComponentProps, Snippet } from "svelte";
  import { AlertDialogRoot } from "@starwind-ui/svelte/alert-dialog";
  import { cx } from "tailwind-variants";
  import { alertDialogBackdrop, alertDialogContent, alertDialogDescription, alertDialogFooter, alertDialogHeader, alertDialogTitle, alertDialogAction, alertDialogActionAsChild, alertDialogCancel, alertDialogCancelAsChild } from "./variants.js";

  export type AlertDialogProps = ComponentProps<typeof AlertDialogRoot>;
</script>

<script lang="ts">
  let {
    "defaultOpen": defaultOpen = false,
    "closeOnEscape": closeOnEscape = true,
    "closeOnOutsideInteract": closeOnOutsideInteract = false,
    "modal": modal = true,
    "class": className,
    open = $bindable(),
    "onOpenChange": onOpenChange,
    "onCloseComplete": onCloseComplete,
    "children": children,
    ...rest
  }: AlertDialogProps = $props();

  let rootClassName = $derived(className);
</script>

<AlertDialogRoot
  class={rootClassName}
  defaultOpen={defaultOpen}
  closeOnEscape={closeOnEscape}
  closeOnOutsideInteract={closeOnOutsideInteract}
  modal={modal}
  onCloseComplete={onCloseComplete}
  onOpenChange={onOpenChange}
  {...rest}
  data-slot={"alert-dialog"}
  children={children}
  bind:open={open}
>

</AlertDialogRoot>
