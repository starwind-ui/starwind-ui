<script setup lang="ts">
import * as ContextMenuPrimitive from "@starwind-ui/vue/context-menu";
import type { ClassValue } from "tailwind-variants";
import { type HTMLAttributes, useAttrs } from "vue";
import { contextMenuRadioItem, contextMenuRadioItemIndicator } from "./variants";

defineOptions({ inheritAttrs: false });

export type ContextMenuRadioItemProps = Omit<
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
type ContextMenuRadioItemDeclaredProps = {
  value: string;
  checked?: boolean;
  defaultChecked?: boolean;
  closeOnClick?: boolean;
  inset?: boolean;
  disabled?: boolean;
  indicatorClass?: string;
  showIndicator?: boolean;
  class?: ClassValue;
} & /* @vue-ignore */ ContextMenuRadioItemProps;
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
} = defineProps<ContextMenuRadioItemDeclaredProps>();
defineSlots<{
  default?: () => unknown;
  indicator?: () => unknown;
}>();
const attrs = useAttrs();
</script>

<template>
  <ContextMenuPrimitive.ContextMenuRadioItem
    :class="contextMenuRadioItem({ inset, disabled, class: className })"
    :value="value"
    :checked="checked"
    :default-checked="defaultChecked"
    :close-on-click="closeOnClick"
    :disabled="disabled"
    v-bind="attrs"
    data-slot="context-menu-radio-item"
  >
    <template v-if="showIndicator">
      <ContextMenuPrimitive.ContextMenuRadioItemIndicator
        :class="contextMenuRadioItemIndicator({ class: indicatorClassName })"
        data-slot="context-menu-radio-item-indicator"
      >
        <slot name="indicator">
          <span class="size-2 rounded-full bg-current" />
        </slot>
      </ContextMenuPrimitive.ContextMenuRadioItemIndicator>
    </template>
    <slot />
  </ContextMenuPrimitive.ContextMenuRadioItem>
</template>
