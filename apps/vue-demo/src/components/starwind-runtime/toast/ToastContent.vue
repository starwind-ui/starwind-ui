<script setup lang="ts">
import * as ToastPrimitive from "@starwind-ui/vue/toast";
import type { ClassValue } from "tailwind-variants";
import { type HTMLAttributes } from "vue";
import { toastContent } from "./variants";

defineOptions({ inheritAttrs: false });

export type ToastContentProps = Omit<HTMLAttributes, "class"> & {
  class?: ClassValue;
};
type ToastContentDeclaredProps = {
  class?: ClassValue;
} & /* @vue-ignore */ ToastContentProps;
const { class: className } = defineProps<ToastContentDeclaredProps>();
defineSlots<{
  default?: () => unknown;
}>();
</script>

<template>
  <ToastPrimitive.ToastContent
    :class="toastContent({ class: className })"
    v-bind="$attrs"
    data-slot="toast-content"
  >
    <slot />
  </ToastPrimitive.ToastContent>
</template>
