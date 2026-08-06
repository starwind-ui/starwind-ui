<script setup lang="ts">
import type { ClassValue, VariantProps } from "tailwind-variants";
import { type HTMLAttributes, useAttrs } from "vue";
import { buttonGroup } from "./variants";

defineOptions({ inheritAttrs: false });

export type ButtonGroupProps = Omit<HTMLAttributes, "class"> &
  VariantProps<typeof buttonGroup> & {
    class?: ClassValue;
  };
type ButtonGroupDeclaredProps = {
  class?: ClassValue;
  orientation?: ButtonGroupProps["orientation"];
} & /* @vue-ignore */ ButtonGroupProps;
const { orientation = "horizontal", class: className } = defineProps<ButtonGroupDeclaredProps>();
defineSlots<{
  default?: () => unknown;
}>();
const attrs = useAttrs();
</script>

<template>
  <div
    role="group"
    :data-orientation="orientation"
    :class="buttonGroup({ orientation, class: className })"
    v-bind="attrs"
    data-slot="button-group"
  >
    <slot />
  </div>
</template>
