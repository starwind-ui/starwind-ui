<script module lang="ts">
  import type { ComponentProps, Snippet } from "svelte";
  import { AlertDialogTrigger } from "@starwind-ui/svelte/alert-dialog";
  import { cx } from "tailwind-variants";
  import { alertDialogBackdrop, alertDialogContent, alertDialogDescription, alertDialogFooter, alertDialogHeader, alertDialogTitle, alertDialogAction, alertDialogActionAsChild, alertDialogCancel, alertDialogCancelAsChild } from "./variants.js";

  export type AlertDialogTriggerProps = ComponentProps<typeof AlertDialogTrigger>;
</script>

<script lang="ts">
  let {
    "targetId": targetId,
    "class": className,
    "children": children,
    ...rest
  }: AlertDialogTriggerProps = $props();

  let triggerClassName = $derived(className);
</script>

<AlertDialogTrigger
  class={triggerClassName}
  targetId={targetId}
  {...rest}
  data-slot={"alert-dialog-trigger"}
>
  {@render children?.()}
</AlertDialogTrigger>
