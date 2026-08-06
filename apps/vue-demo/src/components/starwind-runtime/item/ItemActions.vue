<script setup lang="ts">
import type { ClassValue } from "tailwind-variants";
import { type HTMLAttributes, ref, useAttrs } from "vue";
import { itemActions } from "./variants";

defineOptions({ inheritAttrs: false });

export type ItemActionsProps = Omit<HTMLAttributes, "class"> & {
  class?: ClassValue;
};
type ItemActionsDeclaredProps = {
  class?: ClassValue;
} & /* @vue-ignore */ ItemActionsProps;
const { class: className } = defineProps<ItemActionsDeclaredProps>();
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
    :class="itemActions({ class: className })"
    v-bind="attrs"
    data-slot="item-actions"
  >
    <slot />
  </div>
</template>
