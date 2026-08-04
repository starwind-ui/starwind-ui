<script setup lang="ts">
import * as InputOtpPrimitive from "@starwind-ui/vue/input-otp";
import type { ClassValue, VariantProps } from "tailwind-variants";
import { type ComponentPublicInstance, type HTMLAttributes, nextTick, ref, useAttrs } from "vue";
import { inputOtp } from "./variants";

defineOptions({ inheritAttrs: false });

export type InputOtpProps = Omit<
  HTMLAttributes,
  | "class"
  | "defaultValue"
  | "disabled"
  | "form"
  | "id"
  | "maxLength"
  | "modelValue"
  | "name"
  | "onChange"
  | "pattern"
  | "readOnly"
  | "required"
  | "size"
  | "value"
> &
  VariantProps<typeof inputOtp> & {
    defaultValue?: string;
    disabled?: boolean;
    form?: string;
    id?: string;
    maxLength?: number;
    name?: string;
    pattern?: RegExp | string;
    readOnly?: boolean;
    required?: boolean;
    size?: "sm" | "md" | "lg";
    class?: ClassValue;
    modelValue?: string | undefined;
  };
type InputOtpDeclaredProps = {
  defaultValue?: string;
  disabled?: boolean;
  form?: string;
  id?: string;
  maxLength?: number;
  name?: string;
  pattern?: RegExp | string;
  readOnly?: boolean;
  required?: boolean;
  size?: "sm" | "md" | "lg";
  class?: ClassValue;
  modelValue?: string | undefined;
} & /* @vue-ignore */ InputOtpProps;
const {
  defaultValue,
  disabled = false,
  form,
  id,
  maxLength = 6,
  name,
  pattern,
  readOnly = false,
  required = false,
  size = "md",
  class: className,
  modelValue,
} = defineProps<InputOtpDeclaredProps>();
defineSlots<{
  default?: () => unknown;
}>();
const attrs = useAttrs();
const emit = defineEmits<{
  valueChange: [
    value: string,
    detail: import("@starwind-ui/vue/input-otp").InputOtpValueChangeDetails,
  ];
  "update:modelValue": [value: string | undefined];
}>();
function handleValueChange(
  value: string,
  detail: import("@starwind-ui/vue/input-otp").InputOtpValueChangeDetails,
): void {
  emit("valueChange", value, detail);
}
const element = ref<HTMLDivElement | null>(null);
let pendingPrimitiveRef: ({ element?: HTMLDivElement | null } & ComponentPublicInstance) | null =
  null;
defineExpose({ element });

function setElement(value: Element | ComponentPublicInstance | null): void {
  if (value instanceof HTMLDivElement) {
    pendingPrimitiveRef = null;
    element.value = value;
    return;
  }
  const exposed = value as ({ element?: HTMLDivElement | null } & ComponentPublicInstance) | null;
  pendingPrimitiveRef = exposed;
  element.value = exposed?.element instanceof HTMLDivElement ? exposed.element : null;
  if (!exposed || element.value) return;

  void nextTick(() => {
    if (pendingPrimitiveRef !== exposed) return;
    element.value = exposed.element instanceof HTMLDivElement ? exposed.element : null;
  });
}
</script>

<template>
  <InputOtpPrimitive.InputOtpRoot
    :ref="setElement"
    :class="inputOtp({ class: className })"
    :default-value="defaultValue"
    :disabled="disabled"
    :form="form"
    :id="id"
    :max-length="maxLength"
    :name="name"
    :pattern="pattern"
    :read-only="readOnly"
    :required="required"
    :model-value="modelValue"
    v-bind="attrs"
    :data-size="size"
    data-slot="input-otp"
    @update:model-value="emit('update:modelValue', $event)"
    @value-change="handleValueChange"
  >
    <slot />
  </InputOtpPrimitive.InputOtpRoot>
</template>
