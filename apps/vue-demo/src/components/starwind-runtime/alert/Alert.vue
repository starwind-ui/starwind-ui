<script setup lang="ts">
import type { ClassValue, VariantProps } from "tailwind-variants";
import { computed, type HTMLAttributes, ref } from "vue";
import { alert } from "./variants";

defineOptions({ inheritAttrs: false });

export type AlertProps = Omit<HTMLAttributes, "class"> &
  VariantProps<typeof alert> & {
    class?: ClassValue;
  };
type AlertDeclaredProps = {
  class?: ClassValue;
  variant?: AlertProps["variant"];
  role?: AlertProps["role"];
} & /* @vue-ignore */ AlertProps;
const { variant, role, class: className } = defineProps<AlertDeclaredProps>();
defineSlots<{
  default?: () => unknown;
}>();
const inferredRole = computed(
  () => role ?? (variant === "error" || variant === "warning" ? "alert" : "status"),
);
const element = ref<HTMLDivElement | null>(null);
defineExpose({ element });
</script>

<template>
  <div
    ref="element"
    data-sw-alert
    :class="alert({ variant, class: className })"
    :role="inferredRole"
    v-bind="$attrs"
    data-slot="alert"
  >
    <slot />
  </div>
</template>
