<script module lang="ts">
  import type { ComponentProps, Snippet } from "svelte";
  import { AlertDialogDescription } from "@starwind-ui/svelte/alert-dialog";
  import { cx } from "tailwind-variants";
  import { alertDialogBackdrop, alertDialogContent, alertDialogDescription, alertDialogFooter, alertDialogHeader, alertDialogTitle, alertDialogAction, alertDialogActionAsChild, alertDialogCancel, alertDialogCancelAsChild } from "./variants.js";

  export type AlertDialogDescriptionProps = ComponentProps<typeof AlertDialogDescription>;
</script>

<script lang="ts">
  let {
    "class": className,
    "children": children,
    ...rest
  }: AlertDialogDescriptionProps = $props();
</script>

<AlertDialogDescription
  class={alertDialogDescription({ "class": cx(className) })}
  {...rest}
  data-slot={"alert-dialog-description"}
>
  {@render children?.()}
</AlertDialogDescription>
