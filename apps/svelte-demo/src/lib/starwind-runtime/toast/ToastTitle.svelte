<script module lang="ts">
  import type { ComponentProps, Snippet } from "svelte";
  import { ToastTitle } from "@starwind-ui/svelte/toast";
  import { cx } from "tailwind-variants";
  import type { VariantProps } from "tailwind-variants";
  import { toastAction, toastClose, toastContent, toastDescription, toastItem, toastTitle, toastViewport } from "./variants.js";
  import { ToastTitleText } from "@starwind-ui/svelte/toast";

  export type ToastTitleProps = ComponentProps<typeof ToastTitle> & VariantProps<typeof toastTitle> & { icon?: Snippet };
</script>

<script lang="ts">
  let {
    "class": className,
    "variant": variant = "default",
    "children": children,
    "icon": icon,
    ...rest
  }: ToastTitleProps = $props();
</script>

<ToastTitle
  class={toastTitle({ "variant": variant, "class": cx(className) })}
  {...rest}
  data-slot={"toast-title"}
>
  {#if icon}{@render icon()}{:else}{#if variant === "success"}
    <svg
      xmlns={"http://www.w3.org/2000/svg"}
      viewBox={"0 0 24 24"}
      fill={"none"}
      stroke={"currentColor"}
      stroke-width={"2"}
      stroke-linecap={"round"}
      stroke-linejoin={"round"}
      aria-hidden={"true"}
    >
      <path
        stroke={"none"}
        d={"M0 0h24v24H0z"}
        fill={"none"}
      />
      <path
        d={"M12 12m-9 0a9 9 0 1 0 18 0a9 9 0 1 0 -18 0"}
      />
      <path
        d={"M9 12l2 2l4 -4"}
      />
    </svg>
  {/if}
  {#if variant === "error"}
    <svg
      xmlns={"http://www.w3.org/2000/svg"}
      viewBox={"0 0 24 24"}
      fill={"none"}
      stroke={"currentColor"}
      stroke-width={"2"}
      stroke-linecap={"round"}
      stroke-linejoin={"round"}
      aria-hidden={"true"}
    >
      <path
        stroke={"none"}
        d={"M0 0h24v24H0z"}
        fill={"none"}
      />
      <path
        d={"M12 12m-9 0a9 9 0 1 0 18 0a9 9 0 1 0 -18 0"}
      />
      <path
        d={"M10 10l4 4m0 -4l-4 4"}
      />
    </svg>
  {/if}
  {#if variant === "warning"}
    <svg
      xmlns={"http://www.w3.org/2000/svg"}
      viewBox={"0 0 24 24"}
      fill={"none"}
      stroke={"currentColor"}
      stroke-width={"2"}
      stroke-linecap={"round"}
      stroke-linejoin={"round"}
      aria-hidden={"true"}
    >
      <path
        stroke={"none"}
        d={"M0 0h24v24H0z"}
        fill={"none"}
      />
      <path
        d={"M12 9v4"}
      />
      <path
        d={"M10.3 3.7l-8 14a2 2 0 0 0 1.7 3h16a2 2 0 0 0 1.7 -3l-8 -14a2 2 0 0 0 -3.4 0z"}
      />
      <path
        d={"M12 17h.01"}
      />
    </svg>
  {/if}
  {#if variant === "info"}
    <svg
      xmlns={"http://www.w3.org/2000/svg"}
      viewBox={"0 0 24 24"}
      fill={"none"}
      stroke={"currentColor"}
      stroke-width={"2"}
      stroke-linecap={"round"}
      stroke-linejoin={"round"}
      aria-hidden={"true"}
    >
      <path
        stroke={"none"}
        d={"M0 0h24v24H0z"}
        fill={"none"}
      />
      <path
        d={"M12 12m-9 0a9 9 0 1 0 18 0a9 9 0 1 0 -18 0"}
      />
      <path
        d={"M12 8l.01 0"}
      />
      <path
        d={"M11 12l1 0l0 4l1 0"}
      />
    </svg>
  {/if}
  {#if variant === "loading"}
    <svg
      xmlns={"http://www.w3.org/2000/svg"}
      viewBox={"0 0 24 24"}
      fill={"none"}
      stroke={"currentColor"}
      stroke-width={"2"}
      stroke-linecap={"round"}
      stroke-linejoin={"round"}
      aria-hidden={"true"}
      class={"animate-spin"}
    >
      <path
        stroke={"none"}
        d={"M0 0h24v24H0z"}
        fill={"none"}
      />
      <path
        d={"M12 3a9 9 0 1 0 9 9"}
      />
    </svg>
  {/if}{/if}
  <ToastTitleText
    data-slot={"toast-title-text"}
  >
    {@render children?.()}
  </ToastTitleText>
</ToastTitle>
