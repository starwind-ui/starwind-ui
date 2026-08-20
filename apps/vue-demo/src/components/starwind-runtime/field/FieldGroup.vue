<script setup lang="ts">
import type { ClassValue, VariantProps } from "tailwind-variants";
import { type HTMLAttributes, ref } from "vue";
import { fieldGroup } from "./variants";

defineOptions({ inheritAttrs: false });

export type FieldGroupProps = Omit<HTMLAttributes, "class"> &
  VariantProps<typeof fieldGroup> & {
    class?: ClassValue;
  };
type FieldGroupDeclaredProps = {
  class?: ClassValue;
  variant?: FieldGroupProps["variant"];
} & /* @vue-ignore */ FieldGroupProps;
const { variant = "default", class: className } = defineProps<FieldGroupDeclaredProps>();
defineSlots<{
  default?: () => unknown;
}>();
const element = ref<HTMLDivElement | null>(null);
defineExpose({ element });
</script>

<template>
  <div
    ref="element"
    :class="fieldGroup({ variant, class: className })"
    :data-variant="variant"
    v-bind="$attrs"
    data-slot="field-group"
  >
    <slot />
  </div>
</template>
