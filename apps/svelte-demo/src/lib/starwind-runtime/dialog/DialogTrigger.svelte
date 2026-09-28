<script module lang="ts">
  import type { ComponentProps, Snippet } from "svelte";
  import { DialogTrigger } from "@starwind-ui/svelte/dialog";
  import { cx } from "tailwind-variants";
  import { dialogBackdrop, dialogContent, dialogCloseButton, dialogDescription, dialogFooter, dialogHeader, dialogTitle } from "./variants.js";

  export type DialogTriggerProps = ComponentProps<typeof DialogTrigger>;
</script>

<script lang="ts">
  let {
    "targetId": targetId,
    "class": className,
    "children": children,
    ...rest
  }: DialogTriggerProps = $props();

  let triggerClassName = $derived(className);
</script>

<DialogTrigger
  class={triggerClassName}
  targetId={targetId}
  {...rest}
  data-slot={"dialog-trigger"}
>
  {@render children?.()}
</DialogTrigger>
