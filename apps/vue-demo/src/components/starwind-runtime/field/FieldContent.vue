<script setup lang="ts">
import type { ClassValue, VariantProps } from "tailwind-variants";
import { type HTMLAttributes, ref, useAttrs } from "vue";
import { fieldContent } from "./variants";

defineOptions({ inheritAttrs: false });

export type FieldContentProps = Omit<HTMLAttributes, "class"> &
  VariantProps<typeof fieldContent> & {
    class?: ClassValue;
  };
type FieldContentDeclaredProps = {
  class?: ClassValue;
} & /* @vue-ignore */ FieldContentProps;
const { class: className } = defineProps<FieldContentDeclaredProps>();
defineSlots<{
  default?: () => unknown;
}>();
const attrs = useAttrs();
const element = ref<HTMLDivElement | null>(null);
defineExpose({ element });
</script>

<template>
  <div
    ref="element"
    :class="fieldContent({ class: className })"
    v-bind="attrs"
    data-slot="field-content"
  >
    <slot />
  </div>
</template>
