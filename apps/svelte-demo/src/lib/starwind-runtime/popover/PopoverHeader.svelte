<script module lang="ts">
  import type { ComponentProps, Snippet } from "svelte";
  import { untrack } from "svelte";
  import type { HTMLAttributes } from "svelte/elements";
  import type { Attachment } from "svelte/attachments";
  import { cx } from "tailwind-variants";
  import { popover, popoverContent, popoverDescription, popoverHeader, popoverTitle, popoverTrigger } from "./variants.js";

  export type PopoverHeaderProps = HTMLAttributes<HTMLDivElement> & { ref?: (element: HTMLDivElement | null) => void; children?: Snippet };
</script>

<script lang="ts">
  let {
    "class": className,
    "ref": ref,
    "children": children,
    ...rest
  }: PopoverHeaderProps = $props();

  let nativeProps = $derived({ ...rest });
  const attachNative: Attachment<HTMLDivElement> = (element) => {
    $effect(() => { const callback = ref; untrack(() => callback?.(element)); return () => untrack(() => callback?.(null)); });
  };
</script>

<div
  class={popoverHeader({ "class": cx(className) })}
  {...nativeProps}
  data-slot={"popover-header"}
  {@attach attachNative}
>
  {@render children?.()}
</div>
