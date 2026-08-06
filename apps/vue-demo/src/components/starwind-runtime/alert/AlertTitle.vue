<script setup lang="ts">
import type { ClassValue } from "tailwind-variants";
import { type HTMLAttributes, ref, useAttrs } from "vue";
import { alertTitle } from "./variants";

defineOptions({ inheritAttrs: false });

export type AlertTitleProps = Omit<HTMLAttributes, "class"> & {
  class?: ClassValue;
};
type AlertTitleDeclaredProps = {
  class?: ClassValue;
} & /* @vue-ignore */ AlertTitleProps;
const { class: className } = defineProps<AlertTitleDeclaredProps>();
defineSlots<{
  default?: () => unknown;
}>();
const attrs = useAttrs();
const element = ref<HTMLHeadingElement | null>(null);
defineExpose({ element });
</script>

<template>
  <h5
    ref="element"
    data-sw-alert-title
    :class="alertTitle({ class: className })"
    v-bind="attrs"
    data-slot="alert-title"
  >
    <slot />
  </h5>
</template>
