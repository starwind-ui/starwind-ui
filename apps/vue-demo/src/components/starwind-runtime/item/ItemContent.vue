<script setup lang="ts">
import type { ClassValue } from "tailwind-variants";
import { type HTMLAttributes, ref, useAttrs } from "vue";
import { itemContent } from "./variants";

defineOptions({ inheritAttrs: false });

export type ItemContentProps = Omit<HTMLAttributes, "class"> & {
  class?: ClassValue;
};
type ItemContentDeclaredProps = {
  class?: ClassValue;
} & /* @vue-ignore */ ItemContentProps;
const { class: className } = defineProps<ItemContentDeclaredProps>();
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
    :class="itemContent({ class: className })"
    v-bind="attrs"
    data-slot="item-content"
  >
    <slot />
  </div>
</template>
