<script setup lang="ts">
import * as MenuPrimitive from "@starwind-ui/vue/menu";
import type { ClassValue } from "tailwind-variants";
import { type HTMLAttributes } from "vue";
import { dropdownRadioItem, dropdownRadioItemIndicator } from "./variants";

defineOptions({ inheritAttrs: false });

export type DropdownRadioItemProps = Omit<
  HTMLAttributes,
  | "aria-checked"
  | "checked"
  | "class"
  | "closeOnClick"
  | "defaultChecked"
  | "disabled"
  | "indicatorClass"
  | "inset"
  | "role"
  | "showIndicator"
  | "value"
> & {
  value: string;
  checked?: boolean;
  defaultChecked?: boolean;
  closeOnClick?: boolean;
  inset?: boolean;
  disabled?: boolean;
  indicatorClass?: string;
  showIndicator?: boolean;
  class?: ClassValue;
};
type DropdownRadioItemDeclaredProps = {
  value: string;
  checked?: boolean;
  defaultChecked?: boolean;
  closeOnClick?: boolean;
  inset?: boolean;
  disabled?: boolean;
  indicatorClass?: string;
  showIndicator?: boolean;
  class?: ClassValue;
} & /* @vue-ignore */ DropdownRadioItemProps;
const {
  class: className,
  value,
  checked,
  defaultChecked = false,
  closeOnClick = false,
  inset = false,
  disabled = false,
  indicatorClass: indicatorClassName,
  showIndicator = true,
} = defineProps<DropdownRadioItemDeclaredProps>();
defineSlots<{
  default?: () => unknown;
  indicator?: () => unknown;
}>();
</script>

<template>
  <MenuPrimitive.MenuRadioItem
    :class="dropdownRadioItem({ inset, disabled, class: className })"
    :value="value"
    :checked="checked"
    :default-checked="defaultChecked"
    :close-on-click="closeOnClick"
    :disabled="disabled"
    v-bind="$attrs"
    data-slot="dropdown-radio-item"
  >
    <template v-if="showIndicator">
      <MenuPrimitive.MenuRadioItemIndicator
        :class="dropdownRadioItemIndicator({ class: indicatorClassName })"
        data-slot="dropdown-radio-item-indicator"
      >
        <slot name="indicator">
          <span class="size-2 rounded-full bg-current" />
        </slot>
      </MenuPrimitive.MenuRadioItemIndicator>
    </template>
    <slot />
  </MenuPrimitive.MenuRadioItem>
</template>
