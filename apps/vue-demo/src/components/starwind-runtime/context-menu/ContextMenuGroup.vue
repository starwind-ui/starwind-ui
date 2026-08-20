<script setup lang="ts">
import * as ContextMenuPrimitive from "@starwind-ui/vue/context-menu";
import type { ClassValue } from "tailwind-variants";
import { type HTMLAttributes } from "vue";

defineOptions({ inheritAttrs: false });

export type ContextMenuGroupProps = Omit<HTMLAttributes, "class"> & {
  class?: ClassValue;
};
type ContextMenuGroupDeclaredProps = {
  class?: ClassValue;
} & /* @vue-ignore */ ContextMenuGroupProps;
const { class: className } = defineProps<ContextMenuGroupDeclaredProps>();
defineSlots<{
  default?: () => unknown;
}>();
</script>

<template>
  <ContextMenuPrimitive.ContextMenuGroup
    :class="className"
    v-bind="$attrs"
    data-slot="context-menu-group"
  >
    <slot />
  </ContextMenuPrimitive.ContextMenuGroup>
</template>
