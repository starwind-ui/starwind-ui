<script setup lang="ts">
import type { ClassValue, VariantProps } from "tailwind-variants";
import { ref, type SelectHTMLAttributes, useAttrs } from "vue";
import { nativeSelect, nativeSelectIcon, nativeSelectWrapper } from "./variants";

defineOptions({ inheritAttrs: false });

export type NativeSelectProps = Omit<SelectHTMLAttributes, "class" | "size"> &
  VariantProps<typeof nativeSelect> & {
    class?: ClassValue;
  };
type NativeSelectDeclaredProps = {
  class?: ClassValue;
  size?: NativeSelectProps["size"];
} & /* @vue-ignore */ NativeSelectProps;
const { size, class: className } = defineProps<NativeSelectDeclaredProps>();
defineSlots<{
  default?: () => unknown;
  icon?: () => unknown;
}>();
const attrs = useAttrs();
const element = ref<HTMLSelectElement | null>(null);
defineExpose({ element });
</script>

<template>
  <div :class="nativeSelectWrapper()" :data-size="size" data-slot="native-select-wrapper">
    <select
      ref="element"
      :class="nativeSelect({ size, class: className })"
      v-bind="attrs"
      data-slot="native-select"
    >
      <slot />
    </select>
    <slot name="icon">
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        stroke-width="2"
        stroke-linecap="round"
        stroke-linejoin="round"
        aria-hidden="true"
        :class="nativeSelectIcon({ size })"
        data-slot="native-select-icon"
      >
        <path stroke="none" d="M0 0h24v24H0z" fill="none" />
        <path d="M6 9l6 6l6 -6" />
      </svg>
    </slot>
  </div>
</template>
