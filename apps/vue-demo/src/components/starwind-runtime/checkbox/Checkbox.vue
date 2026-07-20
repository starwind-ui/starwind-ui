<script setup lang="ts">
import type { ClassValue, VariantProps } from "tailwind-variants";
import {
  type ComponentPublicInstance,
  computed,
  type HTMLAttributes,
  nextTick,
  ref,
  useAttrs,
} from "vue";
import "./styles.css";
import * as CheckboxPrimitive from "@starwind-ui/vue/checkbox";
import { checkbox, checkboxIndicator, checkboxLabel, checkboxWrapper } from "./variants";

defineOptions({ inheritAttrs: false });

export type CheckboxProps = Omit<
  HTMLAttributes,
  | "checked"
  | "class"
  | "defaultChecked"
  | "disabled"
  | "form"
  | "id"
  | "indeterminate"
  | "label"
  | "name"
  | "nativeButton"
  | "onChange"
  | "readOnly"
  | "required"
  | "uncheckedValue"
  | "value"
> &
  VariantProps<typeof checkbox> & {
    checked?: boolean;
    defaultChecked?: boolean;
    disabled?: boolean;
    form?: string;
    id?: string;
    indeterminate?: boolean;
    label?: string;
    name?: string;
    nativeButton?: boolean;
    readOnly?: boolean;
    required?: boolean;
    uncheckedValue?: string;
    value?: string;
    class?: ClassValue;
  };
type CheckboxDeclaredProps = {
  checked?: boolean;
  defaultChecked?: boolean;
  disabled?: boolean;
  form?: string;
  id?: string;
  indeterminate?: boolean;
  label?: string;
  name?: string;
  nativeButton?: boolean;
  readOnly?: boolean;
  required?: boolean;
  uncheckedValue?: string;
  value?: string;
  class?: ClassValue;
  variant?: CheckboxProps["variant"];
  size?: CheckboxProps["size"];
} & /* @vue-ignore */ CheckboxProps;
const {
  variant,
  size,
  checked = undefined,
  defaultChecked,
  disabled = false,
  form,
  id,
  indeterminate = false,
  label,
  name,
  nativeButton = false,
  readOnly = false,
  required = false,
  uncheckedValue,
  value,
  class: className,
} = defineProps<CheckboxDeclaredProps>();
defineSlots<{}>();
const attrs = useAttrs();
const emit = defineEmits<{
  checkedChange: [
    value: boolean,
    detail: import("@starwind-ui/vue/checkbox").CheckboxCheckedChangeDetails,
  ];
  "update:checked": [value: boolean];
}>();
const ariaLabel = computed(() => attrs["aria-label"] ?? label);
function handleCheckedChange(
  value: boolean,
  detail: import("@starwind-ui/vue/checkbox").CheckboxCheckedChangeDetails,
): void {
  emit("checkedChange", value, detail);
}
const element = ref<HTMLElement | null>(null);
let pendingPrimitiveRef: ({ element?: HTMLElement | null } & ComponentPublicInstance) | null = null;
defineExpose({ element });

function setElement(value: Element | ComponentPublicInstance | null): void {
  if (value instanceof HTMLElement) {
    pendingPrimitiveRef = null;
    element.value = value;
    return;
  }
  const exposed = value as ({ element?: HTMLElement | null } & ComponentPublicInstance) | null;
  pendingPrimitiveRef = exposed;
  element.value = exposed?.element instanceof HTMLElement ? exposed.element : null;
  if (!exposed || element.value) return;

  void nextTick(() => {
    if (pendingPrimitiveRef !== exposed) return;
    element.value = exposed.element instanceof HTMLElement ? exposed.element : null;
  });
}
</script>

<template>
  <div :class="checkboxWrapper()" data-sw-checkbox-wrapper data-slot="checkbox-wrapper">
    <CheckboxPrimitive.CheckboxRoot
      :ref="setElement"
      :class="checkbox({ variant, size, class: className })"
      :default-checked="defaultChecked"
      :disabled="disabled"
      :form="form"
      :id="id"
      :indeterminate="indeterminate"
      :name="name"
      :native-button="nativeButton"
      :read-only="readOnly"
      :required="required"
      :unchecked-value="uncheckedValue"
      :value="value"
      v-bind="{ ...attrs, 'aria-label': ariaLabel }"
      data-slot="checkbox"
      :checked="checked"
      @update:checked="emit('update:checked', $event)"
      @checked-change="handleCheckedChange"
    >
      <CheckboxPrimitive.CheckboxIndicator
        keepMounted
        :class="checkboxIndicator({ variant, size })"
        data-slot="checkbox-indicator"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
          stroke-linecap="round"
          stroke-linejoin="round"
          aria-hidden="true"
          data-sw-checkbox-check-icon
        >
          <path stroke="none" d="M0 0h24v24H0z" fill="none" />
          <path d="M5 12l5 5l10 -10" />
        </svg>
      </CheckboxPrimitive.CheckboxIndicator>
    </CheckboxPrimitive.CheckboxRoot>
    <template v-if="label">
      <label :for="id" :class="checkboxLabel({ size })" data-slot="checkbox-label">
        {{ label }}
      </label>
    </template>
  </div>
</template>
