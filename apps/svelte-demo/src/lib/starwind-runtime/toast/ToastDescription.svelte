<script module lang="ts">
  import type { ComponentProps } from "svelte";
  import { ToastDescription } from "@starwind-ui/svelte/toast";
  import { cx } from "tailwind-variants";
  import { toastAction, toastClose, toastContent, toastDescription, toastItem, toastTitle, toastViewport } from "./variants.js";

  export type ToastDescriptionProps = ComponentProps<typeof ToastDescription>;
</script>

<script lang="ts">
  let {
    "class": className,
    "children": children,
    ...rest
  }: ToastDescriptionProps = $props();
</script>

<ToastDescription
  class={toastDescription({ "class": cx(className) })}
  {...rest}
  data-slot={"toast-description"}
>
  {@render children?.()}
</ToastDescription>
