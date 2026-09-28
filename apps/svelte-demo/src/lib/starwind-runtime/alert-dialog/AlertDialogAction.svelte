<script module lang="ts">
  import type { ComponentProps, Snippet } from "svelte";
  import { createAttachmentKey } from "svelte/attachments";
  import { getAlertDialogControlRefresh } from "@starwind-ui/svelte/alert-dialog";
  import { cx } from "tailwind-variants";
  import { alertDialogBackdrop, alertDialogContent, alertDialogDescription, alertDialogFooter, alertDialogHeader, alertDialogTitle, alertDialogAction, alertDialogActionAsChild, alertDialogCancel, alertDialogCancelAsChild } from "./variants.js";
  import { Button } from "../button/index.js";

  export type AlertDialogActionProps = ComponentProps<typeof Button>;
</script>

<script lang="ts">
  let {
    "variant": variant = "default",
    "size": size = "md",
    "class": className,
    "children": children,
    ...rest
  }: AlertDialogActionProps = $props();

  const requestRefresh = getAlertDialogControlRefresh();
  const controlAttachment = { [createAttachmentKey()]: () => {
    requestRefresh?.();
    return () => requestRefresh?.();
  } };
</script>

<Button
  variant={variant}
  size={size}
  class={alertDialogAction({ "class": cx(className) })}
  {...rest}
  data-slot={"alert-dialog-action"}
  data-sw-alert-dialog-close
  {...controlAttachment}
>
  {@render children?.()}
</Button>
