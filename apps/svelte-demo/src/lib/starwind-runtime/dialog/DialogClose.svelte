<script module lang="ts">
  import type { ComponentProps, Snippet } from "svelte";
  import { DialogClose } from "@starwind-ui/svelte/dialog";
  import { cx } from "tailwind-variants";
  import { dialogBackdrop, dialogContent, dialogCloseButton, dialogDescription, dialogFooter, dialogHeader, dialogTitle } from "./variants.js";

  export type DialogCloseProps = ComponentProps<typeof DialogClose>;
</script>

<script lang="ts">
  let {
    "class": className,
    "children": children,
    ...rest
  }: DialogCloseProps = $props();

  let closeClassName = $derived(className);
</script>

<DialogClose
  class={closeClassName}
  {...rest}
  data-slot={"dialog-close"}
>
  {#if children}{@render children()}{:else}Close{/if}
</DialogClose>
