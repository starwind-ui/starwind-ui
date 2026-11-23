<script setup lang="ts">
import type { ClassValue, VariantProps } from "tailwind-variants";
import { computed, type HTMLAttributes, useAttrs } from "vue";
import { aspectRatio } from "./variants";

defineOptions({ inheritAttrs: false });

export type AspectRatioProps = Omit<HTMLAttributes, "as" | "class" | "ratio" | "style"> &
  VariantProps<typeof aspectRatio> & {
    as?: string;
    style?: import("vue").StyleValue;
    ratio?: number;
    class?: ClassValue;
  };
type AspectRatioDeclaredProps = {
  as?: string;
  style?: import("vue").StyleValue;
  ratio?: number;
  class?: ClassValue;
} & /* @vue-ignore */ AspectRatioProps;
const {
  ratio = 1,
  as: Tag = "div",
  class: className,
  style,
} = defineProps<AspectRatioDeclaredProps>();
defineSlots<{
  default?: () => unknown;
}>();
const attrs = useAttrs();
const ratioStyle = computed(() => [{ "--ratio": ratio }, style]);
</script>

<template>
  <template
    v-if="
      [
        'area',
        'base',
        'br',
        'col',
        'embed',
        'hr',
        'img',
        'input',
        'link',
        'meta',
        'param',
        'source',
        'track',
        'wbr',
      ].includes(Tag)
    "
  >
    <component
      :is="Tag"
      v-bind="attrs"
      :class="aspectRatio({ class: className })"
      :style="ratioStyle"
      data-slot="aspect-ratio"
    />
  </template>
  <template v-else>
    <component
      :is="Tag"
      v-bind="attrs"
      :class="aspectRatio({ class: className })"
      :style="ratioStyle"
      data-slot="aspect-ratio"
    >
      <slot />
    </component>
  </template>
</template>
