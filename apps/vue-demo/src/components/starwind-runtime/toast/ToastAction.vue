<script setup lang="ts">
import * as ToastPrimitive from "@starwind-ui/vue/toast";
import type { ClassValue } from "tailwind-variants";
import { type ButtonHTMLAttributes, useAttrs } from "vue";
import { toastAction } from "./variants";

defineOptions({ inheritAttrs: false });

export type ToastActionProps = Omit<ButtonHTMLAttributes, "class"> & {
  class?: ClassValue;
};
type ToastActionDeclaredProps = {
  class?: ClassValue;
} & /* @vue-ignore */ ToastActionProps;
const { class: className } = defineProps<ToastActionDeclaredProps>();
defineSlots<{
  default?: () => unknown;
}>();
const attrs = useAttrs();
</script>

<template>
  <ToastPrimitive.ToastAction
    :class="toastAction({ class: className })"
    v-bind="attrs"
    data-slot="toast-action"
  >
    <slot />
  </ToastPrimitive.ToastAction>
</template>
