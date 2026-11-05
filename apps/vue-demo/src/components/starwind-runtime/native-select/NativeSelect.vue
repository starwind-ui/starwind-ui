<script setup lang="ts">
import type { ClassValue, VariantProps } from "tailwind-variants";
import { onMounted, onUpdated, ref, type SelectHTMLAttributes, useAttrs } from "vue";
import { nativeSelect, nativeSelectIcon, nativeSelectWrapper } from "./variants";

defineOptions({ inheritAttrs: false });

export type NativeSelectProps = Omit<SelectHTMLAttributes, "class" | "modelValue" | "size"> &
  VariantProps<typeof nativeSelect> & {
    class?: ClassValue;
    modelValue?: string | readonly string[] | null;
  };
type NativeSelectDeclaredProps = {
  class?: ClassValue;
  modelValue?: string | readonly string[] | null;
  size?: NativeSelectProps["size"];
} & /* @vue-ignore */ NativeSelectProps;
const { size, class: className, modelValue } = defineProps<NativeSelectDeclaredProps>();
defineSlots<{
  default?: () => unknown;
  icon?: () => unknown;
}>();
const attrs = useAttrs();
const emit = defineEmits<{
  "update:modelValue": [value: string | readonly string[] | null];
}>();
const element = ref<HTMLSelectElement | null>(null);
defineExpose({ element });

function handleNativeModelUpdate(event: Event): void {
  const control = event.target as HTMLSelectElement;
  emit(
    "update:modelValue",
    control.multiple
      ? Array.from(control.selectedOptions, (option) => option.value)
      : control.value,
  );
}

function applyNativeModel(): void {
  const control = element.value;
  if (!control || modelValue === undefined) return;
  if (typeof modelValue === "string" || modelValue === null) {
    const next = modelValue ?? "";
    if (control.value !== next) control.value = next;
    return;
  }
  for (const option of control.options) option.selected = modelValue.includes(option.value);
}

onMounted(applyNativeModel);
onUpdated(applyNativeModel);
</script>

<template>
  <div :class="nativeSelectWrapper()" :data-size="size" data-slot="native-select-wrapper">
    <select
      ref="element"
      :class="nativeSelect({ size, class: className })"
      v-bind="attrs"
      data-slot="native-select"
      @change="handleNativeModelUpdate"
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
