<script setup lang="ts">
import type { ClassValue, VariantProps } from "tailwind-variants";
import { onBeforeUnmount, onMounted, ref, type TextareaHTMLAttributes, useAttrs } from "vue";
import { textarea } from "./variants";

defineOptions({ inheritAttrs: false });

export type TextareaProps = Omit<
  TextareaHTMLAttributes,
  "children" | "class" | "data-slot" | "defaultValue" | "modelValue"
> &
  VariantProps<typeof textarea> & {
    defaultValue?: string | null;
    "data-slot"?: string;
    class?: ClassValue;
    modelValue?: string | null;
  };
type TextareaDeclaredProps = {
  defaultValue?: string | null;
  dataSlot?: string;
  class?: ClassValue;
  modelValue?: string | null;
  size?: TextareaProps["size"];
} & /* @vue-ignore */ Omit<TextareaProps, "data-slot">;
const {
  size,
  defaultValue,
  dataSlot = "textarea",
  class: className,
  modelValue,
} = defineProps<TextareaDeclaredProps>();
defineSlots<{}>();
const attrs = useAttrs();
const emit = defineEmits<{
  "update:modelValue": [value: string | null];
}>();
const element = ref<HTMLTextAreaElement | null>(null);
defineExpose({ element });

let composing = false;

function handleNativeModelUpdate(event: Event): void {
  if (composing) return;
  emit("update:modelValue", (event.target as HTMLTextAreaElement).value);
}

function handleCompositionStart(): void {
  composing = true;
}

// As Vue's native v-model does, the model takes composed text once composition ends.
function handleCompositionEnd(event: Event): void {
  composing = false;
  handleNativeModelUpdate(event);
}

// As on React and Svelte, an authored default wins over the model at native reset. The model takes
// that default, so it agrees with the field and the submitted value.
function handleFormReset(event: Event): void {
  const control = element.value;
  if (defaultValue == null || modelValue === undefined || event.target !== control?.form) return;
  window.setTimeout(() => {
    if (event.defaultPrevented) return;
    control.value = defaultValue;
    emit("update:modelValue", defaultValue);
  }, 0);
}

onMounted(() => document.addEventListener("reset", handleFormReset));
onBeforeUnmount(() => document.removeEventListener("reset", handleFormReset));
</script>

<template>
  <textarea
    ref="element"
    data-sw-textarea
    :class="textarea({ size, class: className })"
    :data-slot="dataSlot"
    v-bind="modelValue === undefined ? attrs : { ...attrs, value: modelValue }"
    @input="handleNativeModelUpdate"
    @compositionstart="handleCompositionStart"
    @compositionend="handleCompositionEnd"
    >{{ modelValue === undefined ? (attrs.value ?? defaultValue) : modelValue }}</textarea
  >
</template>
