<script setup lang="ts">
import type { ClassValue } from "tailwind-variants";
import { type OptgroupHTMLAttributes, ref } from "vue";

defineOptions({ inheritAttrs: false });

export type NativeSelectOptGroupProps = Omit<OptgroupHTMLAttributes, "class"> & {
  class?: ClassValue;
};
type NativeSelectOptGroupDeclaredProps = {
  class?: ClassValue;
} & /* @vue-ignore */ NativeSelectOptGroupProps;
const { class: className } = defineProps<NativeSelectOptGroupDeclaredProps>();
defineSlots<{
  default?: () => unknown;
}>();
const element = ref<HTMLOptGroupElement | null>(null);
defineExpose({ element });
</script>

<template>
  <optgroup
    ref="element"
    :class="['bg-[Canvas] text-[CanvasText]', className].filter(Boolean).join(' ')"
    v-bind="$attrs"
    data-slot="native-select-optgroup"
  >
    <slot />
  </optgroup>
</template>
