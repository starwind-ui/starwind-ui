<script setup lang="ts">
import type { ClassValue } from "tailwind-variants";
import { type HTMLAttributes, ref, useAttrs } from "vue";
import { itemGroup } from "./variants";

defineOptions({ inheritAttrs: false });

export type ItemGroupProps = Omit<HTMLAttributes, "class"> & {
  class?: ClassValue;
};
type ItemGroupDeclaredProps = {
  class?: ClassValue;
} & /* @vue-ignore */ ItemGroupProps;
const { class: className } = defineProps<ItemGroupDeclaredProps>();
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
    role="list"
    :class="itemGroup({ class: className })"
    v-bind="attrs"
    data-slot="item-group"
  >
    <slot />
  </div>
</template>
