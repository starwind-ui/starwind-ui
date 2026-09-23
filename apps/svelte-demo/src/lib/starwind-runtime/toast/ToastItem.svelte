<script module lang="ts">
  import type { ComponentProps } from "svelte";
  import { ToastRoot } from "@starwind-ui/svelte/toast";
  import { cx } from "tailwind-variants";
  import type { VariantProps } from "tailwind-variants";
  import { toastAction, toastClose, toastContent, toastDescription, toastItem, toastTitle, toastViewport } from "./variants.js";
  import { ToastContent } from "@starwind-ui/svelte/toast";
  import { ToastClose } from "@starwind-ui/svelte/toast";

  export type ToastItemProps = ComponentProps<typeof ToastRoot> & VariantProps<typeof toastItem>;
</script>

<script lang="ts">
  let {
    "class": className,
    "variant": variant = "default",
    "children": children,
    ...rest
  }: ToastItemProps = $props();
</script>

<ToastRoot
  class={toastItem({ "variant": variant, "class": cx(className) })}
  variant={variant}
  {...rest}
  data-slot={"toast"}
>
  <ToastContent
    class={toastContent({  })}
    data-slot={"toast-content"}
  >
    {@render children?.()}
  </ToastContent>
  <ToastClose
    class={toastClose({  })}
    data-slot={"toast-close"}
  >
    <svg
      xmlns={"http://www.w3.org/2000/svg"}
      viewBox={"0 0 24 24"}
      fill={"none"}
      stroke={"currentColor"}
      stroke-width={"2"}
      stroke-linecap={"round"}
      stroke-linejoin={"round"}
      aria-hidden={"true"}
      class={"size-4"}
    >
      <path
        stroke={"none"}
        d={"M0 0h24v24H0z"}
        fill={"none"}
      />
      <path
        d={"M18 6l-12 12"}
      />
      <path
        d={"M6 6l12 12"}
      />
    </svg>
  </ToastClose>
</ToastRoot>
