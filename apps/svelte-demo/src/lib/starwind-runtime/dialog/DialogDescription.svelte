<script module lang="ts">
  import type { ComponentProps, Snippet } from "svelte";
  import { DialogDescription } from "@starwind-ui/svelte/dialog";
  import { cx } from "tailwind-variants";
  import { dialogBackdrop, dialogContent, dialogCloseButton, dialogDescription, dialogFooter, dialogHeader, dialogTitle } from "./variants.js";

  export type DialogDescriptionProps = ComponentProps<typeof DialogDescription>;
</script>

<script lang="ts">
  let {
    "class": className,
    "children": children,
    ...rest
  }: DialogDescriptionProps = $props();
</script>

<DialogDescription
  class={dialogDescription({ "class": cx(className) })}
  {...rest}
  data-slot={"dialog-description"}
>
  {@render children?.()}
</DialogDescription>
