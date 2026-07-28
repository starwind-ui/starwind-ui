<script setup lang="ts">
import * as SwitchPrimitive from "@starwind-ui/vue/switch";
import type { ClassValue, VariantProps } from "tailwind-variants";
import { type ButtonHTMLAttributes, computed, useAttrs } from "vue";
import { switchButton, switchLabel, switchToggle, switchWrapper } from "./variants";

defineOptions({ inheritAttrs: false });

export type SwitchProps = Omit<
  ButtonHTMLAttributes,
  | "aria-checked"
  | "checked"
  | "class"
  | "defaultChecked"
  | "disabled"
  | "form"
  | "id"
  | "label"
  | "name"
  | "onChange"
  | "padding"
  | "readOnly"
  | "required"
  | "role"
  | "type"
  | "uncheckedValue"
  | "value"
> &
  VariantProps<typeof switchButton> &
  VariantProps<typeof switchToggle> & {
    checked?: boolean;
    defaultChecked?: boolean;
    disabled?: boolean;
    form?: string;
    id: string;
    label?: string;
    name?: string;
    padding?: number;
    readOnly?: boolean;
    required?: boolean;
    uncheckedValue?: string;
    value?: string;
    class?: ClassValue;
  };
type SwitchDeclaredProps = {
  checked?: boolean;
  defaultChecked?: boolean;
  disabled?: boolean;
  form?: string;
  id: string;
  label?: string;
  name?: string;
  padding?: number;
  readOnly?: boolean;
  required?: boolean;
  uncheckedValue?: string;
  value?: string;
  class?: ClassValue;
  variant?: SwitchProps["variant"];
  size?: SwitchProps["size"];
} & /* @vue-ignore */ SwitchProps;
const {
  variant = "default",
  size = "md",
  checked = undefined,
  defaultChecked,
  disabled = false,
  form,
  id,
  label,
  name,
  padding,
  readOnly = false,
  required = false,
  uncheckedValue,
  value,
  class: className,
} = defineProps<SwitchDeclaredProps>();
defineSlots<{}>();
const attrs = useAttrs();
const emit = defineEmits<{
  checkedChange: [
    value: boolean,
    detail: import("@starwind-ui/vue/switch").SwitchCheckedChangeDetails,
  ];
  "update:checked": [value: boolean];
}>();
const resolvedPadding = computed(() => padding ?? (size === "sm" ? 2.5 : size === "lg" ? 4 : 3));
const sizeMultiplier = computed(() => (size === "sm" ? 4 : size === "lg" ? 6 : 5));
const ariaLabel = computed(() => attrs["aria-label"] ?? label ?? "switch");
const switchStyle = computed(() => ({
  "--padding": `${resolvedPadding.value}px`,
  "--height": `calc((var(--spacing) * ${sizeMultiplier.value}) + (var(--padding) * 2))`,
  "--width": `calc((var(--spacing) * ${sizeMultiplier.value} * 2) + (var(--padding) * 3))`,
  "--border-offset": "1px",
}));
const thumbStyle = computed(() => ({
  "--translation": `calc((var(--spacing) * ${sizeMultiplier.value}) + (var(--padding) * 2) - var(--border-offset))`,
}));
function handleCheckedChange(
  value: boolean,
  detail: import("@starwind-ui/vue/switch").SwitchCheckedChangeDetails,
): void {
  emit("checkedChange", value, detail);
}
</script>

<template>
  <div :class="switchWrapper()" data-sw-switch-wrapper data-slot="switch-wrapper">
    <SwitchPrimitive.SwitchRoot
      :class="switchButton({ variant, class: className })"
      :checked="checked"
      :default-checked="defaultChecked"
      :disabled="disabled"
      :form="form"
      :id="id"
      :name="name"
      nativeButton
      :read-only="readOnly"
      :required="required"
      :unchecked-value="uncheckedValue"
      :value="value"
      v-bind="{ ...attrs, 'aria-label': ariaLabel }"
      data-slot="switch-button"
      :style="switchStyle"
      @update:checked="emit('update:checked', $event)"
      @checked-change="handleCheckedChange"
    >
      <SwitchPrimitive.SwitchThumb
        :class="switchToggle({ size })"
        data-slot="switch-toggle"
        :style="thumbStyle"
      />
    </SwitchPrimitive.SwitchRoot>
    <template v-if="label">
      <label :class="switchLabel({ size })" data-slot="switch-label" :for="id">
        {{ label }}
      </label>
    </template>
  </div>
</template>
