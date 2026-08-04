<script setup lang="ts">
import * as RadioPrimitive from "@starwind-ui/vue/radio";
import type { ClassValue, VariantProps } from "tailwind-variants";
import { type HTMLAttributes, useAttrs } from "vue";
import { radioControl, radioIndicator, radioItem, radioWrapper } from "./variants";

defineOptions({ inheritAttrs: false });

export type RadioGroupItemProps = Omit<
  HTMLAttributes,
  | "class"
  | "defaultChecked"
  | "disabled"
  | "form"
  | "id"
  | "name"
  | "nativeButton"
  | "onChange"
  | "readOnly"
  | "required"
  | "value"
> &
  VariantProps<typeof radioControl> & {
    disabled?: boolean;
    form?: string;
    id?: string;
    name?: string;
    nativeButton?: boolean;
    readOnly?: boolean;
    required?: boolean;
    value: string;
    class?: ClassValue;
  };
type RadioGroupItemDeclaredProps = {
  disabled?: boolean;
  form?: string;
  id?: string;
  name?: string;
  nativeButton?: boolean;
  readOnly?: boolean;
  required?: boolean;
  value: string;
  class?: ClassValue;
  variant?: RadioGroupItemProps["variant"];
} & /* @vue-ignore */ RadioGroupItemProps;
const {
  variant,
  disabled = false,
  form,
  id,
  name,
  nativeButton = false,
  readOnly = false,
  required = false,
  value,
  class: className,
} = defineProps<RadioGroupItemDeclaredProps>();
defineSlots<{
  icon?: () => unknown;
}>();
const attrs = useAttrs();
const emit = defineEmits<{
  checkedChange: [
    value: boolean,
    detail: import("@starwind-ui/vue/radio").RadioCheckedChangeDetails,
  ];
}>();
function handleCheckedChange(
  value: boolean,
  detail: import("@starwind-ui/vue/radio").RadioCheckedChangeDetails,
): void {
  emit("checkedChange", value, detail);
}
</script>

<template>
  <div :class="radioWrapper()" data-slot="radio-group-item-wrapper">
    <RadioPrimitive.RadioRoot
      :class="radioItem()"
      :disabled="disabled"
      :form="form"
      :id="id"
      :name="name"
      :native-button="nativeButton"
      :read-only="readOnly"
      :required="required"
      :value="value"
      v-bind="attrs"
      data-slot="radio-group-item"
      @checked-change="handleCheckedChange"
    >
      <span
        :class="radioControl({ variant, class: className })"
        data-slot="radio-group-item-control"
      >
        <RadioPrimitive.RadioIndicator
          :class="radioIndicator()"
          data-slot="radio-group-item-indicator"
        >
          <slot name="icon">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="currentColor"
              aria-hidden="true"
            >
              <path d="M12 2a10 10 0 1 0 0 20a10 10 0 0 0 0-20z" stroke="none" />
            </svg>
          </slot>
        </RadioPrimitive.RadioIndicator>
      </span>
    </RadioPrimitive.RadioRoot>
  </div>
</template>
