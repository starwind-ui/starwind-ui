<script setup lang="ts">
import type { ClassValue } from "tailwind-variants";
import { type HTMLAttributes, ref } from "vue";
import "./styles.css";
import { prose } from "./variants";

defineOptions({ inheritAttrs: false });

export type ProseProps = Omit<HTMLAttributes, "class"> & {
  class?: ClassValue;
};
type ProseDeclaredProps = {
  class?: ClassValue;
} & /* @vue-ignore */ ProseProps;
const { class: className } = defineProps<ProseDeclaredProps>();
defineSlots<{
  default?: () => unknown;
}>();
const element = ref<HTMLDivElement | null>(null);
defineExpose({ element });
</script>

<template>
  <div
    ref="element"
    data-sw-prose
    :class="prose({ class: className })"
    v-bind="$attrs"
    data-slot="prose"
  >
    <slot />
  </div>
</template>
