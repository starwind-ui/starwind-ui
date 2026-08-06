<script setup lang="ts">
import type { ClassValue } from "tailwind-variants";
import { type HTMLAttributes, ref, useAttrs } from "vue";
import { alertDescription } from "./variants";

defineOptions({ inheritAttrs: false });

export type AlertDescriptionProps = Omit<HTMLAttributes, "class"> & {
  class?: ClassValue;
};
type AlertDescriptionDeclaredProps = {
  class?: ClassValue;
} & /* @vue-ignore */ AlertDescriptionProps;
const { class: className } = defineProps<AlertDescriptionDeclaredProps>();
defineSlots<{
  default?: () => unknown;
}>();
const attrs = useAttrs();
const element = ref<HTMLParagraphElement | null>(null);
defineExpose({ element });
</script>

<template>
  <p
    ref="element"
    data-sw-alert-description
    :class="alertDescription({ class: className })"
    v-bind="attrs"
    data-slot="alert-description"
  >
    <slot />
  </p>
</template>
