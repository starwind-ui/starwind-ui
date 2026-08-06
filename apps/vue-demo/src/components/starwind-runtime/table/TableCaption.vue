<script setup lang="ts">
import type { ClassValue } from "tailwind-variants";
import { type HTMLAttributes, ref, useAttrs } from "vue";
import { tableCaption } from "./variants";

defineOptions({ inheritAttrs: false });

export type TableCaptionProps = Omit<HTMLAttributes, "class"> & {
  class?: ClassValue;
};
type TableCaptionDeclaredProps = {
  class?: ClassValue;
} & /* @vue-ignore */ TableCaptionProps;
const { class: className } = defineProps<TableCaptionDeclaredProps>();
defineSlots<{
  default?: () => unknown;
}>();
const attrs = useAttrs();
const element = ref<HTMLTableCaptionElement | null>(null);
defineExpose({ element });
</script>

<template>
  <caption
    ref="element"
    :class="tableCaption({ class: className })"
    v-bind="attrs"
    data-slot="table-caption"
  >
    <slot />
  </caption>
</template>
