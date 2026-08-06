<script setup lang="ts">
import type { ClassValue } from "tailwind-variants";
import { type HTMLAttributes, useAttrs } from "vue";
import { inputGroupText } from "./variants";

defineOptions({ inheritAttrs: false });

export type InputGroupTextProps = Omit<HTMLAttributes, "class"> & {
  class?: ClassValue;
};
type InputGroupTextDeclaredProps = {
  class?: ClassValue;
} & /* @vue-ignore */ InputGroupTextProps;
const { class: className } = defineProps<InputGroupTextDeclaredProps>();
defineSlots<{
  default?: () => unknown;
}>();
const attrs = useAttrs();
</script>

<template>
  <span :class="inputGroupText({ class: className })" v-bind="attrs">
    <slot />
  </span>
</template>
