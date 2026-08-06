<script setup lang="ts">
import type { ClassValue } from "tailwind-variants";
import { type OptionHTMLAttributes, ref, useAttrs } from "vue";

defineOptions({ inheritAttrs: false });

export type NativeSelectOptionProps = Omit<OptionHTMLAttributes, "class"> & {
  class?: ClassValue;
};
type NativeSelectOptionDeclaredProps = {
  class?: ClassValue;
} & /* @vue-ignore */ NativeSelectOptionProps;
const { class: className } = defineProps<NativeSelectOptionDeclaredProps>();
defineSlots<{
  default?: () => unknown;
}>();
const attrs = useAttrs();
const element = ref<HTMLOptionElement | null>(null);
defineExpose({ element });
</script>

<template>
  <option
    ref="element"
    :class="['bg-[Canvas] text-[CanvasText]', className].filter(Boolean).join(' ')"
    v-bind="attrs"
    data-slot="native-select-option"
  >
    <slot />
  </option>
</template>
