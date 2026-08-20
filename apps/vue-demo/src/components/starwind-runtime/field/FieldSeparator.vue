<script setup lang="ts">
import type { ClassValue } from "tailwind-variants";
import { type HTMLAttributes, ref, useSlots } from "vue";
import { Separator } from "../separator";
import { fieldSeparator, fieldSeparatorContent } from "./variants";

defineOptions({ inheritAttrs: false });

export type FieldSeparatorProps = Omit<HTMLAttributes, "class"> & {
  class?: ClassValue;
};
type FieldSeparatorDeclaredProps = {
  class?: ClassValue;
} & /* @vue-ignore */ FieldSeparatorProps;
const { class: className } = defineProps<FieldSeparatorDeclaredProps>();
defineSlots<{
  default?: () => unknown;
}>();
const element = ref<HTMLDivElement | null>(null);
defineExpose({ element });

const hasContent = Boolean(useSlots().default);
</script>

<template>
  <div
    ref="element"
    :class="fieldSeparator({ class: className })"
    v-bind="$attrs"
    data-slot="field-separator"
  >
    <Separator class="absolute inset-0 top-1/2" />
    <template v-if="hasContent">
      <span :class="fieldSeparatorContent()" data-slot="field-separator-content">
        <slot />
      </span>
    </template>
  </div>
</template>
