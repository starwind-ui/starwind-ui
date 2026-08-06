<script setup lang="ts">
import type { ClassValue, VariantProps } from "tailwind-variants";
import { type HTMLAttributes, ref, useAttrs } from "vue";
import { separator } from "./variants";

defineOptions({ inheritAttrs: false });

export type SeparatorProps = Omit<
  HTMLAttributes,
  "aria-orientation" | "class" | "data-slot" | "role"
> &
  VariantProps<typeof separator> & {
    "data-slot"?: string;
    class?: ClassValue;
  };
type SeparatorDeclaredProps = {
  dataSlot?: string;
  class?: ClassValue;
  orientation?: SeparatorProps["orientation"];
} & /* @vue-ignore */ Omit<SeparatorProps, "data-slot">;
const {
  orientation = "horizontal",
  dataSlot = "separator",
  class: className,
} = defineProps<SeparatorDeclaredProps>();
defineSlots<{}>();
const attrs = useAttrs();
const element = ref<HTMLDivElement | null>(null);
defineExpose({ element });
</script>

<template>
  <div
    ref="element"
    data-sw-separator
    role="separator"
    :aria-orientation="orientation"
    :data-orientation="orientation"
    :class="separator({ orientation, class: className })"
    v-bind="attrs"
    :data-slot="dataSlot"
  />
</template>
