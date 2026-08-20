<script setup lang="ts">
import type { ClassValue } from "tailwind-variants";
import { type HTMLAttributes, ref } from "vue";
import { cardAction } from "./variants";

defineOptions({ inheritAttrs: false });

export type CardActionProps = Omit<HTMLAttributes, "class"> & {
  class?: ClassValue;
};
type CardActionDeclaredProps = {
  class?: ClassValue;
} & /* @vue-ignore */ CardActionProps;
const { class: className } = defineProps<CardActionDeclaredProps>();
defineSlots<{
  default?: () => unknown;
}>();
const element = ref<HTMLDivElement | null>(null);
defineExpose({ element });
</script>

<template>
  <div
    ref="element"
    data-sw-card-action
    :class="cardAction({ class: className })"
    v-bind="$attrs"
    data-slot="card-action"
  >
    <slot />
  </div>
</template>
