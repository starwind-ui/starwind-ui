<script setup lang="ts">
import type { ClassValue } from "tailwind-variants";
import { type HTMLAttributes, ref } from "vue";
import { itemDescription } from "./variants";

defineOptions({ inheritAttrs: false });

export type ItemDescriptionProps = Omit<HTMLAttributes, "class"> & {
  class?: ClassValue;
};
type ItemDescriptionDeclaredProps = {
  class?: ClassValue;
} & /* @vue-ignore */ ItemDescriptionProps;
const { class: className } = defineProps<ItemDescriptionDeclaredProps>();
defineSlots<{
  default?: () => unknown;
}>();
const element = ref<HTMLParagraphElement | null>(null);
defineExpose({ element });
</script>

<template>
  <p
    ref="element"
    :class="itemDescription({ class: className })"
    v-bind="$attrs"
    data-slot="item-description"
  >
    <slot />
  </p>
</template>
