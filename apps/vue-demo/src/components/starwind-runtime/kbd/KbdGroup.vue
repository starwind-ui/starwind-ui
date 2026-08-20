<script setup lang="ts">
import type { ClassValue } from "tailwind-variants";
import { type HTMLAttributes, ref } from "vue";
import { kbdGroup } from "./variants";

defineOptions({ inheritAttrs: false });

export type KbdGroupProps = Omit<HTMLAttributes, "class"> & {
  class?: ClassValue;
};
type KbdGroupDeclaredProps = {
  class?: ClassValue;
} & /* @vue-ignore */ KbdGroupProps;
const { class: className } = defineProps<KbdGroupDeclaredProps>();
defineSlots<{
  default?: () => unknown;
}>();
const element = ref<HTMLElement | null>(null);
defineExpose({ element });
</script>

<template>
  <kbd
    ref="element"
    data-sw-kbd-group
    :class="kbdGroup({ class: className })"
    v-bind="$attrs"
    data-slot="kbd-group"
  >
    <slot />
  </kbd>
</template>
