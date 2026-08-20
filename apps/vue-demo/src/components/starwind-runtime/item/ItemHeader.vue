<script setup lang="ts">
import type { ClassValue } from "tailwind-variants";
import { type HTMLAttributes, ref } from "vue";
import { itemHeader } from "./variants";

defineOptions({ inheritAttrs: false });

export type ItemHeaderProps = Omit<HTMLAttributes, "class"> & {
  class?: ClassValue;
};
type ItemHeaderDeclaredProps = {
  class?: ClassValue;
} & /* @vue-ignore */ ItemHeaderProps;
const { class: className } = defineProps<ItemHeaderDeclaredProps>();
defineSlots<{
  default?: () => unknown;
}>();
const element = ref<HTMLDivElement | null>(null);
defineExpose({ element });
</script>

<template>
  <div
    ref="element"
    :class="itemHeader({ class: className })"
    v-bind="$attrs"
    data-slot="item-header"
  >
    <slot />
  </div>
</template>
