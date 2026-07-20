<script setup lang="ts">
import * as SelectPrimitive from "@starwind-ui/vue/select";
import type { ClassValue } from "tailwind-variants";
import { type ComponentPublicInstance, type HTMLAttributes, nextTick, ref, useAttrs } from "vue";
import { select } from "./variants";

defineOptions({ inheritAttrs: false });

export type SelectProps = Omit<
  HTMLAttributes,
  | "autoComplete"
  | "class"
  | "defaultOpen"
  | "defaultValue"
  | "disabled"
  | "form"
  | "highlightItemOnHover"
  | "modal"
  | "modelValue"
  | "name"
  | "onChange"
  | "open"
  | "readOnly"
  | "required"
> & {
  autoComplete?: string;
  defaultOpen?: boolean;
  defaultValue?: string | null;
  disabled?: boolean;
  form?: string;
  highlightItemOnHover?: boolean;
  modal?: boolean;
  name?: string;
  readOnly?: boolean;
  required?: boolean;
  class?: ClassValue;
  modelValue?: string | null;
  open?: boolean;
};
type SelectDeclaredProps = {
  autoComplete?: string;
  defaultOpen?: boolean;
  defaultValue?: string | null;
  disabled?: boolean;
  form?: string;
  highlightItemOnHover?: boolean;
  modal?: boolean;
  name?: string;
  readOnly?: boolean;
  required?: boolean;
  class?: ClassValue;
  modelValue?: string | null;
  open?: boolean;
} & /* @vue-ignore */ SelectProps;
const {
  autoComplete,
  defaultOpen = false,
  defaultValue,
  disabled = false,
  form,
  highlightItemOnHover = true,
  modal = true,
  name,
  readOnly = false,
  required = false,
  class: className,
  modelValue,
  open = undefined,
} = defineProps<SelectDeclaredProps>();
defineSlots<{
  default?: () => unknown;
}>();
const attrs = useAttrs();
const emit = defineEmits<{
  openChange: [open: boolean, detail: import("@starwind-ui/vue/select").SelectOpenChangeDetails];
  valueChange: [
    value: string | null,
    detail: import("@starwind-ui/vue/select").SelectValueChangeDetails,
  ];
  "update:modelValue": [value: string | null];
  "update:open": [value: boolean];
}>();
function handleOpenChange(
  open: boolean,
  detail: import("@starwind-ui/vue/select").SelectOpenChangeDetails,
): void {
  emit("openChange", open, detail);
}

function handleValueChange(
  value: string | null,
  detail: import("@starwind-ui/vue/select").SelectValueChangeDetails,
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
  <SelectPrimitive.SelectRoot
    :ref="setElement"
    :class="select({ class: className })"
    :auto-complete="autoComplete"
    :default-open="defaultOpen"
    :default-value="defaultValue"
    :disabled="disabled"
    :form="form"
    :highlight-item-on-hover="highlightItemOnHover"
    :modal="modal"
    :name="name"
    :read-only="readOnly"
    :required="required"
    v-bind="attrs"
    data-slot="select"
    :model-value="modelValue"
    @update:model-value="emit('update:modelValue', $event)"
    :open="open"
    @update:open="emit('update:open', $event)"
    @open-change="handleOpenChange"
    @value-change="handleValueChange"
  >
    <slot />
  </SelectPrimitive.SelectRoot>
</template>
