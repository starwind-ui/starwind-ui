<script setup lang="ts">
import * as ContextMenuPrimitive from "@starwind-ui/vue/context-menu";
import type { ClassValue } from "tailwind-variants";
import { type HTMLAttributes, useAttrs } from "vue";

defineOptions({ inheritAttrs: false });

export type ContextMenuSubProps = Omit<HTMLAttributes, "class" | "closeDelay"> & {
  closeDelay?: number;
  class?: ClassValue;
};
type ContextMenuSubDeclaredProps = {
  closeDelay?: number;
  class?: ClassValue;
} & /* @vue-ignore */ ContextMenuSubProps;
const { class: className, closeDelay = 200 } = defineProps<ContextMenuSubDeclaredProps>();
defineSlots<{
  default?: () => unknown;
}>();
const attrs = useAttrs();
</script>

<template>
  <ContextMenuPrimitive.ContextMenuSubmenuRoot
    :class="['relative', className].filter(Boolean).join(' ')"
    :close-delay="closeDelay"
    v-bind="attrs"
    data-slot="context-menu-sub"
  >
    <slot />
  </ContextMenuPrimitive.ContextMenuSubmenuRoot>
</template>
