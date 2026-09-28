<script module lang="ts">
  import type { ComponentProps } from "svelte";
  import { ToastClose } from "@starwind-ui/svelte/toast";
  import { cx } from "tailwind-variants";
  import { toastAction, toastClose, toastContent, toastDescription, toastItem, toastTitle, toastViewport } from "./variants.js";

  export type ToastCloseProps = ComponentProps<typeof ToastClose> & { showIcon?: boolean };
</script>

<script lang="ts">
  let {
    "class": className,
    "showIcon": showIcon = true,
    "children": children,
    ...rest
  }: ToastCloseProps = $props();
</script>

<ToastClose
  class={toastClose({ "class": cx(className) })}
  {...rest}
  data-slot={"toast-close"}
>
  {@render children?.()}
  {#if showIcon}
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
  {/if}
</ToastClose>
