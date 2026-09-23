<script module lang="ts">
  import type { ComponentProps, Snippet } from "svelte";
  import { AlertDialogPopup } from "@starwind-ui/svelte/alert-dialog";
  import { cx } from "tailwind-variants";
  import { alertDialogBackdrop, alertDialogContent, alertDialogDescription, alertDialogFooter, alertDialogHeader, alertDialogTitle, alertDialogAction, alertDialogActionAsChild, alertDialogCancel, alertDialogCancelAsChild } from "./variants.js";
  import { AlertDialogBackdrop } from "@starwind-ui/svelte/alert-dialog";

  export type AlertDialogContentProps = ComponentProps<typeof AlertDialogPopup> & { backdrop?: Snippet; };
</script>

<script lang="ts">
  let {
    "class": className,
    "children": children,
    "backdrop": backdrop,
    ...rest
  }: AlertDialogContentProps = $props();
</script>

{#if backdrop}{@render backdrop()}{:else}<AlertDialogBackdrop
  class={alertDialogBackdrop({  })}
  data-state={"closed"}
  hidden
  data-slot={"alert-dialog-backdrop"}
/>{/if}
<AlertDialogPopup
  class={alertDialogContent({ "class": cx(className) })}
  role={"alertdialog"}
  data-state={"closed"}
  {...rest}
  data-slot={"alert-dialog-content"}
>
  {@render children?.()}
</AlertDialogPopup>
