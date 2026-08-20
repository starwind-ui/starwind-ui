<script setup lang="ts">
import type { ClassValue } from "tailwind-variants";
import { type HTMLAttributes } from "vue";
import { inputGroup } from "./variants";

defineOptions({ inheritAttrs: false });

export type InputGroupProps = Omit<HTMLAttributes, "class"> & {
  class?: ClassValue;
};
type InputGroupDeclaredProps = {
  class?: ClassValue;
} & /* @vue-ignore */ InputGroupProps;
const { class: className } = defineProps<InputGroupDeclaredProps>();
defineSlots<{
  default?: () => unknown;
}>();
</script>

<template>
  <div
    role="group"
    :class="inputGroup({ class: className })"
    data-slot="input-group"
    v-bind="$attrs"
  >
    <slot />
  </div>
</template>
