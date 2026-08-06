<script setup lang="ts">
import * as ComboboxPrimitive from "@starwind-ui/vue/combobox";
import type { ClassValue } from "tailwind-variants";
import { type HTMLAttributes, useAttrs } from "vue";
import { combobox } from "./variants";

defineOptions({ inheritAttrs: false });

export type ComboboxProps = Omit<
  HTMLAttributes,
  | "autoComplete"
  | "class"
  | "defaultInputValue"
  | "defaultOpen"
  | "defaultValue"
  | "disabled"
  | "filterMode"
  | "form"
  | "highlightItemOnHover"
  | "inputValue"
  | "locale"
  | "modal"
  | "modelValue"
  | "name"
  | "onChange"
  | "open"
  | "readOnly"
  | "required"
> & {
  autoComplete?: string;
  defaultInputValue?: string;
  defaultOpen?: boolean;
  defaultValue?: string | null;
  disabled?: boolean;
  filterMode?: "contains" | "startsWith";
  form?: string;
  highlightItemOnHover?: boolean;
  inputValue?: string;
  locale?: string;
  modal?: boolean;
  name?: string;
  open?: boolean;
  readOnly?: boolean;
  required?: boolean;
  class?: ClassValue;
  modelValue?: string | null;
};
type ComboboxDeclaredProps = {
  autoComplete?: string;
  defaultInputValue?: string;
  defaultOpen?: boolean;
  defaultValue?: string | null;
  disabled?: boolean;
  filterMode?: "contains" | "startsWith";
  form?: string;
  highlightItemOnHover?: boolean;
  inputValue?: string;
  locale?: string;
  modal?: boolean;
  name?: string;
  open?: boolean;
  readOnly?: boolean;
  required?: boolean;
  class?: ClassValue;
  modelValue?: string | null;
} & /* @vue-ignore */ ComboboxProps;
const {
  autoComplete,
  defaultInputValue,
  defaultOpen = false,
  defaultValue,
  disabled = false,
  filterMode = "contains",
  form,
  highlightItemOnHover = true,
  inputValue,
  locale,
  modal = false,
  name,
  open = undefined,
  readOnly = false,
  required = false,
  class: className,
  modelValue,
} = defineProps<ComboboxDeclaredProps>();
defineSlots<{
  default?: () => unknown;
}>();
const attrs = useAttrs();
const emit = defineEmits<{
  inputValueChange: [
    inputValue: string,
    detail: import("@starwind-ui/vue/combobox").ComboboxInputValueChangeDetails,
  ];
  openChange: [
    open: boolean,
    detail: import("@starwind-ui/vue/combobox").ComboboxOpenChangeDetails,
  ];
  valueChange: [
    value: string | null,
    detail: import("@starwind-ui/vue/combobox").ComboboxValueChangeDetails,
  ];
  "update:inputValue": [value: string];
  "update:open": [value: boolean];
  "update:modelValue": [value: string | null];
}>();
function handleInputValueChange(
  inputValue: string,
  detail: import("@starwind-ui/vue/combobox").ComboboxInputValueChangeDetails,
): void {
  emit("inputValueChange", inputValue, detail);
}

function handleOpenChange(
  open: boolean,
  detail: import("@starwind-ui/vue/combobox").ComboboxOpenChangeDetails,
): void {
  emit("openChange", open, detail);
}

function handleValueChange(
  value: string | null,
  detail: import("@starwind-ui/vue/combobox").ComboboxValueChangeDetails,
): void {
  emit("valueChange", value, detail);
}
</script>

<template>
  <ComboboxPrimitive.ComboboxRoot
    :class="combobox({ class: className })"
    :auto-complete="autoComplete"
    :default-input-value="defaultInputValue"
    :default-open="defaultOpen"
    :default-value="defaultValue"
    :disabled="disabled"
    :filter-mode="filterMode"
    :form="form"
    :highlight-item-on-hover="highlightItemOnHover"
    :input-value="inputValue"
    :locale="locale"
    :modal="modal"
    :name="name"
    :open="open"
    :read-only="readOnly"
    :required="required"
    :model-value="modelValue"
    v-bind="attrs"
    data-slot="combobox"
    @update:input-value="emit('update:inputValue', $event)"
    @update:open="emit('update:open', $event)"
    @update:model-value="emit('update:modelValue', $event)"
    @input-value-change="handleInputValueChange"
    @open-change="handleOpenChange"
    @value-change="handleValueChange"
  >
    <slot />
  </ComboboxPrimitive.ComboboxRoot>
</template>
