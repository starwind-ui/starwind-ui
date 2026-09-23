<script module lang="ts">
  import type { ComponentProps } from "svelte";
  import { ToastContent } from "@starwind-ui/svelte/toast";
  import { cx } from "tailwind-variants";
  import { toastAction, toastClose, toastContent, toastDescription, toastItem, toastTitle, toastViewport } from "./variants.js";

  export type ToastContentProps = ComponentProps<typeof ToastContent>;
</script>

<script lang="ts">
  let {
    "class": className,
    "children": children,
    ...rest
  }: ToastContentProps = $props();
</script>

<ToastContent
  class={toastContent({ "class": cx(className) })}
  {...rest}
  data-slot={"toast-content"}
>
  {@render children?.()}
</ToastContent>
