<script setup lang="ts">
import type { ClassValue } from "tailwind-variants";
import { type HTMLAttributes, ref, useAttrs } from "vue";
import { itemTitle } from "./variants";

defineOptions({ inheritAttrs: false });

export type ItemTitleProps = Omit<HTMLAttributes, "class"> & {
  class?: ClassValue;
};
type ItemTitleDeclaredProps = {
  class?: ClassValue;
} & /* @vue-ignore */ ItemTitleProps;
const { class: className } = defineProps<ItemTitleDeclaredProps>();
defineSlots<{
  default?: () => unknown;
}>();
const attrs = useAttrs();
const element = ref<HTMLDivElement | null>(null);
defineExpose({ element });
</script>

<template>
  <div ref="element" :class="itemTitle({ class: className })" v-bind="attrs" data-slot="item-title">
    <slot />
  </div>
</template>
