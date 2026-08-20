<script setup lang="ts">
import * as ToastPrimitive from "@starwind-ui/vue/toast";
import type { ClassValue, VariantProps } from "tailwind-variants";
import { type HTMLAttributes } from "vue";
import { toastTitle } from "./variants";

defineOptions({ inheritAttrs: false });

export type ToastTitleProps = Omit<HTMLAttributes, "class"> &
  VariantProps<typeof toastTitle> & {
    class?: ClassValue;
  };
type ToastTitleDeclaredProps = {
  class?: ClassValue;
  variant?: ToastTitleProps["variant"];
} & /* @vue-ignore */ ToastTitleProps;
const { class: className, variant = "default" } = defineProps<ToastTitleDeclaredProps>();
defineSlots<{
  default?: () => unknown;
  icon?: () => unknown;
}>();
</script>

<template>
  <ToastPrimitive.ToastTitle
    :class="toastTitle({ variant, class: className })"
    v-bind="$attrs"
    data-slot="toast-title"
  >
    <slot name="icon">
      <template v-if="variant === 'success'">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
          stroke-linecap="round"
          stroke-linejoin="round"
          aria-hidden="true"
        >
          <path stroke="none" d="M0 0h24v24H0z" fill="none" />
          <path d="M12 12m-9 0a9 9 0 1 0 18 0a9 9 0 1 0 -18 0" />
          <path d="M9 12l2 2l4 -4" />
        </svg>
      </template>
      <template v-if="variant === 'error'">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
          stroke-linecap="round"
          stroke-linejoin="round"
          aria-hidden="true"
        >
          <path stroke="none" d="M0 0h24v24H0z" fill="none" />
          <path d="M12 12m-9 0a9 9 0 1 0 18 0a9 9 0 1 0 -18 0" />
          <path d="M10 10l4 4m0 -4l-4 4" />
        </svg>
      </template>
      <template v-if="variant === 'warning'">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
          stroke-linecap="round"
          stroke-linejoin="round"
          aria-hidden="true"
        >
          <path stroke="none" d="M0 0h24v24H0z" fill="none" />
          <path d="M12 9v4" />
          <path d="M10.3 3.7l-8 14a2 2 0 0 0 1.7 3h16a2 2 0 0 0 1.7 -3l-8 -14a2 2 0 0 0 -3.4 0z" />
          <path d="M12 17h.01" />
        </svg>
      </template>
      <template v-if="variant === 'info'">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
          stroke-linecap="round"
          stroke-linejoin="round"
          aria-hidden="true"
        >
          <path stroke="none" d="M0 0h24v24H0z" fill="none" />
          <path d="M12 12m-9 0a9 9 0 1 0 18 0a9 9 0 1 0 -18 0" />
          <path d="M12 8l.01 0" />
          <path d="M11 12l1 0l0 4l1 0" />
        </svg>
      </template>
      <template v-if="variant === 'loading'">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
          stroke-linecap="round"
          stroke-linejoin="round"
          aria-hidden="true"
          class="animate-spin"
        >
          <path stroke="none" d="M0 0h24v24H0z" fill="none" />
          <path d="M12 3a9 9 0 1 0 9 9" />
          <path d="M12 7v5l3 3" />
        </svg>
      </template>
    </slot>
    <ToastPrimitive.ToastTitleText data-slot="toast-title-text">
      <slot />
    </ToastPrimitive.ToastTitleText>
  </ToastPrimitive.ToastTitle>
</template>
