<script setup lang="ts">
import type { ClassValue } from "tailwind-variants";
import { type HTMLAttributes, ref } from "vue";
import { itemFooter } from "./variants";

defineOptions({ inheritAttrs: false });

export type ItemFooterProps = Omit<HTMLAttributes, "class"> & {
  class?: ClassValue;
};
type ItemFooterDeclaredProps = {
  class?: ClassValue;
} & /* @vue-ignore */ ItemFooterProps;
const { class: className } = defineProps<ItemFooterDeclaredProps>();
defineSlots<{
  default?: () => unknown;
}>();
const element = ref<HTMLDivElement | null>(null);
defineExpose({ element });
</script>

<template>
  <div
    ref="element"
    :class="itemFooter({ class: className })"
    v-bind="$attrs"
    data-slot="item-footer"
  >
    <slot />
  </div>
</template>
