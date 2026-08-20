<script setup lang="ts">
import type { ClassValue, VariantProps } from "tailwind-variants";
import { type HTMLAttributes, ref } from "vue";
import { fieldTitle } from "./variants";

defineOptions({ inheritAttrs: false });

export type FieldTitleProps = Omit<HTMLAttributes, "class"> &
  VariantProps<typeof fieldTitle> & {
    class?: ClassValue;
  };
type FieldTitleDeclaredProps = {
  class?: ClassValue;
} & /* @vue-ignore */ FieldTitleProps;
const { class: className } = defineProps<FieldTitleDeclaredProps>();
defineSlots<{
  default?: () => unknown;
}>();
const element = ref<HTMLDivElement | null>(null);
defineExpose({ element });
</script>

<template>
  <div
    ref="element"
    :class="fieldTitle({ class: className })"
    v-bind="$attrs"
    data-slot="field-title"
  >
    <slot />
  </div>
</template>
