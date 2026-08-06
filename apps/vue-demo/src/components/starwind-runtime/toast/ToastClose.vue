<script setup lang="ts">
import * as ToastPrimitive from "@starwind-ui/vue/toast";
import type { ClassValue } from "tailwind-variants";
import { type ButtonHTMLAttributes, useAttrs } from "vue";
import { toastClose } from "./variants";

defineOptions({ inheritAttrs: false });

export type ToastCloseProps = Omit<ButtonHTMLAttributes, "class" | "showIcon"> & {
  showIcon?: boolean;
  class?: ClassValue;
};
type ToastCloseDeclaredProps = {
  showIcon?: boolean;
  class?: ClassValue;
} & /* @vue-ignore */ ToastCloseProps;
const { class: className, showIcon = true } = defineProps<ToastCloseDeclaredProps>();
defineSlots<{
  default?: () => unknown;
}>();
const attrs = useAttrs();
</script>

<template>
  <ToastPrimitive.ToastClose
    :class="toastClose({ class: className })"
    v-bind="attrs"
    data-slot="toast-close"
  >
    <slot />
    <template v-if="showIcon">
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
    </template>
  </ToastPrimitive.ToastClose>
</template>
