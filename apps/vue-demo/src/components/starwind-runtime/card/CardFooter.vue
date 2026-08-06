<script setup lang="ts">
import type { ClassValue } from "tailwind-variants";
import { type HTMLAttributes, ref, useAttrs } from "vue";
import { cardFooter } from "./variants";

defineOptions({ inheritAttrs: false });

export type CardFooterProps = Omit<HTMLAttributes, "class"> & {
  class?: ClassValue;
};
type CardFooterDeclaredProps = {
  class?: ClassValue;
} & /* @vue-ignore */ CardFooterProps;
const { class: className } = defineProps<CardFooterDeclaredProps>();
defineSlots<{
  default?: () => unknown;
}>();
const attrs = useAttrs();
const element = ref<HTMLDivElement | null>(null);
defineExpose({ element });
</script>

<template>
  <div
    ref="element"
    data-sw-card-footer
    :class="cardFooter({ class: className })"
    v-bind="attrs"
    data-slot="card-footer"
  >
    <slot />
  </div>
</template>
