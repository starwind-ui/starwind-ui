<script setup lang="ts">
import type { ClassValue, VariantProps } from "tailwind-variants";
import { type HTMLAttributes, ref } from "vue";
import { itemMedia } from "./variants";

defineOptions({ inheritAttrs: false });

export type ItemMediaProps = Omit<HTMLAttributes, "class"> &
  VariantProps<typeof itemMedia> & {
    class?: ClassValue;
  };
type ItemMediaDeclaredProps = {
  class?: ClassValue;
  variant?: ItemMediaProps["variant"];
} & /* @vue-ignore */ ItemMediaProps;
const { variant = "default", class: className } = defineProps<ItemMediaDeclaredProps>();
defineSlots<{
  default?: () => unknown;
}>();
const element = ref<HTMLDivElement | null>(null);
defineExpose({ element });
</script>

<template>
  <div
    ref="element"
    :class="itemMedia({ variant, class: className })"
    :data-variant="variant"
    v-bind="$attrs"
    data-slot="item-media"
  >
    <slot />
  </div>
</template>
