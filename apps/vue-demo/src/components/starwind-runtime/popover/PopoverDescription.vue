<script setup lang="ts">
import * as PopoverPrimitive from "@starwind-ui/vue/popover";
import type { ClassValue } from "tailwind-variants";
import { type HTMLAttributes, useAttrs } from "vue";
import { popoverDescription } from "./variants";

defineOptions({ inheritAttrs: false });

export type PopoverDescriptionProps = Omit<HTMLAttributes, "class"> & {
  class?: ClassValue;
};
type PopoverDescriptionDeclaredProps = {
  class?: ClassValue;
} & /* @vue-ignore */ PopoverDescriptionProps;
const { class: className } = defineProps<PopoverDescriptionDeclaredProps>();
defineSlots<{
  default?: () => unknown;
}>();
const attrs = useAttrs();
</script>

<template>
  <PopoverPrimitive.PopoverDescription
    :class="popoverDescription({ class: className })"
    v-bind="attrs"
    data-slot="popover-description"
  >
    <slot />
  </PopoverPrimitive.PopoverDescription>
</template>
