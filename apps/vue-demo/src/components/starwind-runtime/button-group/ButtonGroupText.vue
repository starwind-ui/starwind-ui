<script setup lang="ts">
import type { ClassValue } from "tailwind-variants";
import { type HTMLAttributes } from "vue";
import { buttonGroupText } from "./variants";

defineOptions({ inheritAttrs: false });

export type ButtonGroupTextProps = Omit<HTMLAttributes, "class"> & {
  class?: ClassValue;
};
type ButtonGroupTextDeclaredProps = {
  class?: ClassValue;
} & /* @vue-ignore */ ButtonGroupTextProps;
const { class: className } = defineProps<ButtonGroupTextDeclaredProps>();
defineSlots<{
  default?: () => unknown;
}>();
</script>

<template>
  <div :class="buttonGroupText({ class: className })" v-bind="$attrs" data-slot="button-group-text">
    <slot />
  </div>
</template>
