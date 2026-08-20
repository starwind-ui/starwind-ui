<script setup lang="ts">
import * as MenuPrimitive from "@starwind-ui/vue/menu";
import type { ClassValue } from "tailwind-variants";
import { type HTMLAttributes } from "vue";

defineOptions({ inheritAttrs: false });

export type DropdownSubProps = Omit<HTMLAttributes, "class" | "closeDelay"> & {
  closeDelay?: number;
  class?: ClassValue;
};
type DropdownSubDeclaredProps = {
  closeDelay?: number;
  class?: ClassValue;
} & /* @vue-ignore */ DropdownSubProps;
const { class: className, closeDelay = 200 } = defineProps<DropdownSubDeclaredProps>();
defineSlots<{
  default?: () => unknown;
}>();
</script>

<template>
  <MenuPrimitive.MenuSubmenuRoot
    :class="['relative', className].filter(Boolean).join(' ')"
    :close-delay="closeDelay"
    v-bind="$attrs"
    data-slot="dropdown-sub"
  >
    <slot />
  </MenuPrimitive.MenuSubmenuRoot>
</template>
