<script setup lang="ts">
import type { ClassValue } from "tailwind-variants";
import { type HTMLAttributes, ref } from "vue";
import { kbd } from "./variants";

defineOptions({ inheritAttrs: false });

export type KbdProps = Omit<HTMLAttributes, "class"> & {
  class?: ClassValue;
};
type KbdDeclaredProps = {
  class?: ClassValue;
} & /* @vue-ignore */ KbdProps;
const { class: className } = defineProps<KbdDeclaredProps>();
defineSlots<{
  default?: () => unknown;
}>();
const element = ref<HTMLElement | null>(null);
defineExpose({ element });
</script>

<template>
  <kbd ref="element" data-sw-kbd :class="kbd({ class: className })" v-bind="$attrs" data-slot="kbd">
    <slot />
  </kbd>
</template>
