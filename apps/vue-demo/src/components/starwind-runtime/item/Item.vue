<script setup lang="ts">
import type { ClassValue, VariantProps } from "tailwind-variants";
import { type AnchorHTMLAttributes, type HTMLAttributes, ref, useAttrs } from "vue";
import { item } from "./variants";

defineOptions({ inheritAttrs: false });

export type ItemProps = Omit<HTMLAttributes, "as" | "class"> &
  Omit<AnchorHTMLAttributes, "as" | "class" | "type"> &
  VariantProps<typeof item> & {
    as?: string;
    class?: ClassValue;
  };
type ItemDeclaredProps = {
  as?: string;
  class?: ClassValue;
  variant?: ItemProps["variant"];
  size?: ItemProps["size"];
} & /* @vue-ignore */ ItemProps;
const {
  variant = "default",
  size = "md",
  as: Tag = "div",
  class: className,
} = defineProps<ItemDeclaredProps>();
defineSlots<{
  default?: () => unknown;
}>();
const attrs = useAttrs();
const element = ref<HTMLElement | null>(null);
defineExpose({ element });
</script>

<template>
  <component
    :is="Tag"
    ref="element"
    data-sw-item
    :class="item({ variant, size, class: className })"
    v-bind="attrs"
    data-slot="item"
  >
    <slot />
  </component>
</template>
