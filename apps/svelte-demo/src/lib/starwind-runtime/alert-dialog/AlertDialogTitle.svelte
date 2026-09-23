<script module lang="ts">
  import type { ComponentProps, Snippet } from "svelte";
  import { AlertDialogTitle } from "@starwind-ui/svelte/alert-dialog";
  import { cx } from "tailwind-variants";
  import { alertDialogBackdrop, alertDialogContent, alertDialogDescription, alertDialogFooter, alertDialogHeader, alertDialogTitle, alertDialogAction, alertDialogActionAsChild, alertDialogCancel, alertDialogCancelAsChild } from "./variants.js";

  export type AlertDialogTitleProps = ComponentProps<typeof AlertDialogTitle>;
</script>

<script lang="ts">
  let {
    "class": className,
    "children": children,
    ...rest
  }: AlertDialogTitleProps = $props();
</script>

<AlertDialogTitle
  class={alertDialogTitle({ "class": cx(className) })}
  {...rest}
  data-slot={"alert-dialog-title"}
>
  {@render children?.()}
</AlertDialogTitle>
