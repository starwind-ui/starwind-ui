<script setup lang="ts">
import * as ContextMenuPrimitive from "@starwind-ui/vue/context-menu";
import type { ClassValue } from "tailwind-variants";
import { type HTMLAttributes } from "vue";
import { contextMenuSeparator } from "./variants";

defineOptions({ inheritAttrs: false });

export type ContextMenuSeparatorProps = Omit<HTMLAttributes, "class"> & {
  class?: ClassValue;
};
type ContextMenuSeparatorDeclaredProps = {
  class?: ClassValue;
} & /* @vue-ignore */ ContextMenuSeparatorProps;
const { class: className } = defineProps<ContextMenuSeparatorDeclaredProps>();
defineSlots<{}>();
</script>

<template>
  <ContextMenuPrimitive.ContextMenuSeparator
    :class="contextMenuSeparator({ class: className })"
    v-bind="$attrs"
    data-slot="context-menu-separator"
  />
</template>
