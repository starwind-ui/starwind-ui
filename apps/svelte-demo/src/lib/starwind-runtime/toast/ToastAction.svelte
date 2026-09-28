<script module lang="ts">
  import type { ComponentProps } from "svelte";
  import { ToastAction } from "@starwind-ui/svelte/toast";
  import { cx } from "tailwind-variants";
  import { toastAction, toastClose, toastContent, toastDescription, toastItem, toastTitle, toastViewport } from "./variants.js";

  export type ToastActionProps = ComponentProps<typeof ToastAction>;
</script>

<script lang="ts">
  let {
    "class": className,
    "children": children,
    ...rest
  }: ToastActionProps = $props();
</script>

<ToastAction
  class={toastAction({ "class": cx(className) })}
  {...rest}
  data-slot={"toast-action"}
>
  {@render children?.()}
</ToastAction>
