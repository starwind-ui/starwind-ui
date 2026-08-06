<script setup lang="ts">
import type { ClassValue, VariantProps } from "tailwind-variants";
import { type HTMLAttributes, ref, useAttrs } from "vue";
import { label } from "./variants";

defineOptions({ inheritAttrs: false });

export type LabelProps = Omit<HTMLAttributes, "class"> &
  VariantProps<typeof label> & {
    class?: ClassValue;
  };
type LabelDeclaredProps = {
  class?: ClassValue;
  size?: LabelProps["size"];
} & /* @vue-ignore */ LabelProps;
const { size, class: className } = defineProps<LabelDeclaredProps>();
defineSlots<{
  default?: () => unknown;
}>();
const attrs = useAttrs();
const element = ref<HTMLLabelElement | null>(null);
defineExpose({ element });
</script>

<template>
  <label
    ref="element"
    data-sw-label
    :class="label({ size, class: className })"
    v-bind="attrs"
    data-slot="label"
  >
    <slot />
  </label>
</template>
