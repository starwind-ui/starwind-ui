<script module lang="ts">
  import type { ComponentProps, Snippet } from "svelte";
  import { untrack } from "svelte";
  import type { HTMLAttributes } from "svelte/elements";
  import type { Attachment } from "svelte/attachments";
  import { cx } from "tailwind-variants";
  import { dialogBackdrop, dialogContent, dialogCloseButton, dialogDescription, dialogFooter, dialogHeader, dialogTitle } from "./variants.js";

  export type DialogFooterProps = HTMLAttributes<HTMLDivElement> & { ref?: (element: HTMLDivElement | null) => void; children?: Snippet };
</script>

<script lang="ts">
  let {
    "class": className,
    "ref": ref,
    "children": children,
    ...rest
  }: DialogFooterProps = $props();

  let nativeProps = $derived({ ...rest });
  const attachNative: Attachment<HTMLDivElement> = (element) => {
    $effect(() => { const callback = ref; untrack(() => callback?.(element)); return () => untrack(() => callback?.(null)); });
  };
</script>

<div
  class={dialogFooter({ "class": cx(className) })}
  {...nativeProps}
  data-slot={"dialog-footer"}
  {@attach attachNative}
>
  {@render children?.()}
</div>
