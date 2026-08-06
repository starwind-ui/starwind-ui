<script setup lang="ts">
import * as NavigationMenuPrimitive from "@starwind-ui/vue/navigation-menu";
import type { ClassValue } from "tailwind-variants";
import { computed, type HTMLAttributes, useAttrs } from "vue";
import NavigationMenuPositioner from "./NavigationMenuPositioner.vue";
import { navigationMenu } from "./variants";

defineOptions({ inheritAttrs: false });

export type NavigationMenuProps = Omit<
  HTMLAttributes,
  | "align"
  | "alignOffset"
  | "avoidCollisions"
  | "class"
  | "closeDelay"
  | "closeOnEscape"
  | "closeOnOutsideInteract"
  | "collisionPadding"
  | "contentSize"
  | "defaultValue"
  | "modelValue"
  | "onChange"
  | "openDelay"
  | "orientation"
  | "side"
  | "sideOffset"
  | "size"
  | "value"
> & {
  defaultValue?: string | null;
  openDelay?: number;
  closeDelay?: number;
  closeOnEscape?: boolean;
  closeOnOutsideInteract?: boolean;
  orientation?: "horizontal" | "vertical";
  side?: "top" | "right" | "bottom" | "left";
  align?: "start" | "center" | "end";
  sideOffset?: number;
  alignOffset?: number;
  avoidCollisions?: boolean;
  collisionPadding?: number;
  size?: "sm" | "md";
  contentSize?: "sm" | "md";
  class?: ClassValue;
  modelValue?: import("@starwind-ui/vue/navigation-menu").NavigationMenuValue;
};
type NavigationMenuDeclaredProps = {
  defaultValue?: string | null;
  openDelay?: number;
  closeDelay?: number;
  closeOnEscape?: boolean;
  closeOnOutsideInteract?: boolean;
  orientation?: "horizontal" | "vertical";
  side?: "top" | "right" | "bottom" | "left";
  align?: "start" | "center" | "end";
  sideOffset?: number;
  alignOffset?: number;
  avoidCollisions?: boolean;
  collisionPadding?: number;
  size?: "sm" | "md";
  contentSize?: "sm" | "md";
  class?: ClassValue;
  modelValue?: import("@starwind-ui/vue/navigation-menu").NavigationMenuValue;
} & /* @vue-ignore */ NavigationMenuProps;
const {
  defaultValue = null,
  openDelay = 50,
  closeDelay = 50,
  closeOnEscape = true,
  closeOnOutsideInteract = true,
  orientation = "horizontal",
  side = "bottom",
  align = "start",
  sideOffset = 8,
  alignOffset = 0,
  avoidCollisions = true,
  collisionPadding = 8,
  size = "md",
  contentSize: __vueDependentProp13,
  class: className,
  modelValue,
} = defineProps<NavigationMenuDeclaredProps>();
defineSlots<{
  default?: () => unknown;
}>();
const attrs = useAttrs();
const emit = defineEmits<{
  valueChange: [
    value: import("@starwind-ui/vue/navigation-menu").NavigationMenuValue,
    detail: import("@starwind-ui/vue/navigation-menu").NavigationMenuValueChangeDetails,
  ];
  "update:modelValue": [value: import("@starwind-ui/vue/navigation-menu").NavigationMenuValue];
}>();
const contentSize = computed(() =>
  __vueDependentProp13 === undefined ? size : __vueDependentProp13,
);
function handleValueChange(
  value: import("@starwind-ui/vue/navigation-menu").NavigationMenuValue,
  detail: import("@starwind-ui/vue/navigation-menu").NavigationMenuValueChangeDetails,
): void {
  emit("valueChange", value, detail);
}
</script>

<template>
  <NavigationMenuPrimitive.NavigationMenuRoot
    :class="navigationMenu({ class: className })"
    :default-value="defaultValue"
    :model-value="modelValue"
    :open-delay="openDelay"
    :close-delay="closeDelay"
    :close-on-escape="closeOnEscape"
    :close-on-outside-interact="closeOnOutsideInteract"
    :orientation="orientation"
    v-bind="attrs"
    :data-size="size"
    data-slot="navigation-menu"
    @update:model-value="emit('update:modelValue', $event)"
    @value-change="handleValueChange"
  >
    <slot />
    <NavigationMenuPositioner
      :side="side"
      :align="align"
      :side-offset="sideOffset"
      :align-offset="alignOffset"
      :avoid-collisions="avoidCollisions"
      :collision-padding="collisionPadding"
      :size="contentSize"
    />
  </NavigationMenuPrimitive.NavigationMenuRoot>
</template>
