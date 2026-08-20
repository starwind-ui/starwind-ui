<script setup lang="ts">
import * as ToastPrimitive from "@starwind-ui/vue/toast";
import type { ClassValue, VariantProps } from "tailwind-variants";
import { type HTMLAttributes } from "vue";
import { toastClose, toastContent, toastItem } from "./variants";

defineOptions({ inheritAttrs: false });

export type ToastItemProps = Omit<HTMLAttributes, "class"> &
  VariantProps<typeof toastItem> & {
    class?: ClassValue;
  };
type ToastItemDeclaredProps = {
  class?: ClassValue;
  variant?: ToastItemProps["variant"];
} & /* @vue-ignore */ ToastItemProps;
const { class: className, variant = "default" } = defineProps<ToastItemDeclaredProps>();
defineSlots<{
  default?: () => unknown;
}>();
</script>

<template>
  <ToastPrimitive.ToastRoot
    :class="toastItem({ variant, class: className })"
    :variant="variant"
    v-bind="$attrs"
    data-slot="toast"
  >
    <ToastPrimitive.ToastContent :class="toastContent()" data-slot="toast-content">
      <slot />
    </ToastPrimitive.ToastContent>
    <ToastPrimitive.ToastClose :class="toastClose()" data-slot="toast-close">
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        stroke-width="2"
        stroke-linecap="round"
        stroke-linejoin="round"
        aria-hidden="true"
        class="size-4"
      >
        <path stroke="none" d="M0 0h24v24H0z" fill="none" />
        <path d="M18 6l-12 12" />
        <path d="M6 6l12 12" />
      </svg>
    </ToastPrimitive.ToastClose>
  </ToastPrimitive.ToastRoot>
</template>
