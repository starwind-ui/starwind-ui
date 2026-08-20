<script setup lang="ts">
import type { ClassValue } from "tailwind-variants";
import { type HTMLAttributes } from "vue";
import { spinner } from "./variants";

defineOptions({ inheritAttrs: false });

export type SpinnerProps = Omit<HTMLAttributes, "aria-label" | "class" | "mode" | "role"> & {
  class?: ClassValue;
};
type SpinnerDeclaredProps = {
  class?: ClassValue;
} & /* @vue-ignore */ SpinnerProps;
const { class: className } = defineProps<SpinnerDeclaredProps>();
defineSlots<{}>();
</script>

<template>
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    stroke-width="2"
    stroke-linecap="round"
    stroke-linejoin="round"
    aria-hidden="true"
    role="status"
    aria-label="Loading"
    :class="spinner({ class: className })"
    v-bind="$attrs"
    data-slot="spinner"
  >
    <path stroke="none" d="M0 0h24v24H0z" fill="none" />
    <path d="M12 3a9 9 0 1 0 9 9" />
    <path d="M12 7v5l3 3" />
  </svg>
</template>
