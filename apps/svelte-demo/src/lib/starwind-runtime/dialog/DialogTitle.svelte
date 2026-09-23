<script module lang="ts">
  import type { ComponentProps, Snippet } from "svelte";
  import { DialogTitle } from "@starwind-ui/svelte/dialog";
  import { cx } from "tailwind-variants";
  import { dialogBackdrop, dialogContent, dialogCloseButton, dialogDescription, dialogFooter, dialogHeader, dialogTitle } from "./variants.js";

  export type DialogTitleProps = ComponentProps<typeof DialogTitle>;
</script>

<script lang="ts">
  let {
    "class": className,
    "children": children,
    ...rest
  }: DialogTitleProps = $props();
</script>

<DialogTitle
  class={dialogTitle({ "class": cx(className) })}
  {...rest}
  data-slot={"dialog-title"}
>
  {@render children?.()}
</DialogTitle>
