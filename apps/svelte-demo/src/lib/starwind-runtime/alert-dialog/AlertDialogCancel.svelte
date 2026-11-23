<script module lang="ts">
  import type { ComponentProps, Snippet } from "svelte";
  import { __useAlertDialogControl } from "@starwind-ui/svelte/alert-dialog";
  import { cx } from "tailwind-variants";
  import { alertDialogBackdrop, alertDialogContent, alertDialogDescription, alertDialogFooter, alertDialogHeader, alertDialogTitle, alertDialogAction, alertDialogActionAsChild, alertDialogCancel, alertDialogCancelAsChild } from "./variants.js";
  import { Button } from "../button/index.js";

  export type AlertDialogCancelProps = ComponentProps<typeof Button>;
</script>

<script lang="ts">
  let {
    variant = "outline",
    size = "md",
    "class": className,
    children,
    ...rest
  }: AlertDialogCancelProps = $props();

  const controlAttachment = __useAlertDialogControl();
</script>

<Button
  variant={variant}
  size={size}
  class={alertDialogCancel({ "class": cx(className) })}
  {...rest}
  data-slot={"alert-dialog-cancel"}
  data-sw-alert-dialog-close
  {...controlAttachment}
>
  {@render children?.()}
</Button>
