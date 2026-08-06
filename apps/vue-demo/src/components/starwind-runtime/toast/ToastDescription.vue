<script setup lang="ts">
import * as ToastPrimitive from "@starwind-ui/vue/toast";
import type { ClassValue } from "tailwind-variants";
import { type HTMLAttributes, useAttrs } from "vue";
import { toastDescription } from "./variants";

defineOptions({ inheritAttrs: false });

export type ToastDescriptionProps = Omit<HTMLAttributes, "class"> & {
  class?: ClassValue;
};
type ToastDescriptionDeclaredProps = {
  class?: ClassValue;
} & /* @vue-ignore */ ToastDescriptionProps;
const { class: className } = defineProps<ToastDescriptionDeclaredProps>();
defineSlots<{
  default?: () => unknown;
}>();
const attrs = useAttrs();
</script>

<template>
  <ToastPrimitive.ToastDescription
    :class="toastDescription({ class: className })"
    v-bind="attrs"
    data-slot="toast-description"
  >
    <slot />
  </ToastPrimitive.ToastDescription>
</template>
