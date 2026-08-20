<script setup lang="ts">
import * as ContextMenuPrimitive from "@starwind-ui/vue/context-menu";
import type { ClassValue } from "tailwind-variants";
import { type HTMLAttributes } from "vue";
import { contextMenuCheckboxItem, contextMenuCheckboxItemIndicator } from "./variants";

defineOptions({ inheritAttrs: false });

export type ContextMenuCheckboxItemProps = Omit<
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
> & {
  checked?: boolean;
  defaultChecked?: boolean;
  closeOnClick?: boolean;
  inset?: boolean;
  disabled?: boolean;
  indicatorClass?: string;
  showIndicator?: boolean;
  class?: ClassValue;
};
type ContextMenuCheckboxItemDeclaredProps = {
  checked?: boolean;
  defaultChecked?: boolean;
  closeOnClick?: boolean;
  inset?: boolean;
  disabled?: boolean;
  indicatorClass?: string;
  showIndicator?: boolean;
  class?: ClassValue;
} & /* @vue-ignore */ ContextMenuCheckboxItemProps;
const {
  class: className,
  checked,
  defaultChecked = false,
  closeOnClick = false,
  inset = false,
  disabled = false,
  indicatorClass: indicatorClassName,
  showIndicator = true,
} = defineProps<ContextMenuCheckboxItemDeclaredProps>();
defineSlots<{
  default?: () => unknown;
  indicator?: () => unknown;
}>();
</script>

<template>
  <ContextMenuPrimitive.ContextMenuCheckboxItem
    :class="contextMenuCheckboxItem({ inset, disabled, class: className })"
    :checked="checked"
    :default-checked="defaultChecked"
    :close-on-click="closeOnClick"
    :disabled="disabled"
    v-bind="$attrs"
    data-slot="context-menu-checkbox-item"
  >
    <template v-if="showIndicator">
      <ContextMenuPrimitive.ContextMenuCheckboxItemIndicator
        :class="contextMenuCheckboxItemIndicator({ class: indicatorClassName })"
        data-slot="context-menu-checkbox-item-indicator"
      >
        <slot name="indicator">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
            aria-hidden="true"
            class="size-4"
          >
            <path stroke="none" d="M0 0h24v24H0z" fill="none" />
            <path d="M5 12l5 5l10 -10" />
          </svg>
        </slot>
      </ContextMenuPrimitive.ContextMenuCheckboxItemIndicator>
    </template>
    <slot />
  </ContextMenuPrimitive.ContextMenuCheckboxItem>
</template>
