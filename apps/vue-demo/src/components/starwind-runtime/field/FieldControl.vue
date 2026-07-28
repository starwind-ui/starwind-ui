<script setup lang="ts">
import * as FieldPrimitive from "@starwind-ui/vue/field";
import type { ClassValue, VariantProps } from "tailwind-variants";
import {
  type ComponentPublicInstance,
  type InputHTMLAttributes,
  nextTick,
  ref,
  useAttrs,
} from "vue";
import { fieldControl } from "./variants";

defineOptions({ inheritAttrs: false });

export type FieldControlProps = Omit<
  InputHTMLAttributes,
  "children" | "class" | "defaultValue" | "disabled" | "modelValue" | "size" | "value"
> &
  VariantProps<typeof fieldControl> & {
    defaultValue?: import("@starwind-ui/vue/field").InputValue;
    disabled?: boolean;
    class?: ClassValue;
    modelValue?: import("@starwind-ui/vue/field").InputValue | undefined;
  };
type FieldControlDeclaredProps = {
  defaultValue?: import("@starwind-ui/vue/field").InputValue;
  disabled?: boolean;
  class?: ClassValue;
  modelValue?: import("@starwind-ui/vue/field").InputValue | undefined;
  size?: "sm" | "md" | "lg";
};
const {
  size,
  defaultValue,
  disabled = false,
  class: className,
  modelValue,
} = defineProps<FieldControlDeclaredProps>();
defineSlots<{}>();
const attrs = useAttrs();
const emit = defineEmits<{
  valueChange: [value: string, detail: import("@starwind-ui/vue/field").InputValueChangeDetails];
  "update:modelValue": [value: import("@starwind-ui/vue/field").InputValue | undefined];
}>();
function handleValueChange(
  value: string,
  detail: import("@starwind-ui/vue/field").InputValueChangeDetails,
): void {
  emit("valueChange", value, detail);
}
const element = ref<HTMLInputElement | null>(null);
let pendingPrimitiveRef: ({ element?: HTMLInputElement | null } & ComponentPublicInstance) | null =
  null;
defineExpose({ element });

function setElement(value: Element | ComponentPublicInstance | null): void {
  if (value instanceof HTMLInputElement) {
    pendingPrimitiveRef = null;
    element.value = value;
    return;
  }
  const exposed = value as ({ element?: HTMLInputElement | null } & ComponentPublicInstance) | null;
  pendingPrimitiveRef = exposed;
  element.value = exposed?.element instanceof HTMLInputElement ? exposed.element : null;
  if (!exposed || element.value) return;

  void nextTick(() => {
    if (pendingPrimitiveRef !== exposed) return;
    element.value = exposed.element instanceof HTMLInputElement ? exposed.element : null;
  });
}
</script>

<template>
  <FieldPrimitive.FieldControl
    :ref="setElement"
    :class="fieldControl({ size, class: className })"
    :default-value="defaultValue"
    :disabled="disabled"
    :model-value="modelValue"
    v-bind="attrs"
    data-slot="field-control"
    @update:model-value="emit('update:modelValue', $event)"
    @value-change="handleValueChange"
  />
</template>
