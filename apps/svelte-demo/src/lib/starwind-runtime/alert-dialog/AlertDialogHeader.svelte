<script module lang="ts">
  import type { ComponentProps, Snippet } from "svelte";
  import { untrack } from "svelte";
  import type { HTMLAttributes } from "svelte/elements";
  import type { Attachment } from "svelte/attachments";
  import { cx } from "tailwind-variants";
  import { alertDialogBackdrop, alertDialogContent, alertDialogDescription, alertDialogFooter, alertDialogHeader, alertDialogTitle, alertDialogAction, alertDialogActionAsChild, alertDialogCancel, alertDialogCancelAsChild } from "./variants.js";

  export type AlertDialogHeaderProps = HTMLAttributes<HTMLDivElement> & { ref?: (element: HTMLDivElement | null) => void; children?: Snippet };
</script>

<script lang="ts">
  let {
    "class": className,
    "ref": ref,
    "children": children,
    ...rest
  }: AlertDialogHeaderProps = $props();

  let nativeProps = $derived({ ...rest });
  const attachNative: Attachment<HTMLDivElement> = (element) => {
    $effect(() => { const callback = ref; untrack(() => callback?.(element)); return () => untrack(() => callback?.(null)); });
  };
</script>

<div
  class={alertDialogHeader({ "class": cx(className) })}
  {...nativeProps}
  data-slot={"alert-dialog-header"}
  {@attach attachNative}
>
  {@render children?.()}
</div>
