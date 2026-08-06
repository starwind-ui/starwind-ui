<script setup lang="ts">
import * as ContextMenuPrimitive from "@starwind-ui/vue/context-menu";
import type { ClassValue } from "tailwind-variants";
import { type HTMLAttributes, useAttrs } from "vue";
import { contextMenuShortcut } from "./variants";

defineOptions({ inheritAttrs: false });

export type ContextMenuShortcutProps = Omit<HTMLAttributes, "class"> & {
  class?: ClassValue;
};
type ContextMenuShortcutDeclaredProps = {
  class?: ClassValue;
} & /* @vue-ignore */ ContextMenuShortcutProps;
const { class: className } = defineProps<ContextMenuShortcutDeclaredProps>();
defineSlots<{
  default?: () => unknown;
}>();
const attrs = useAttrs();
</script>

<template>
  <ContextMenuPrimitive.ContextMenuShortcut
    :class="contextMenuShortcut({ class: className })"
    v-bind="attrs"
    data-slot="context-menu-shortcut"
  >
    <slot />
  </ContextMenuPrimitive.ContextMenuShortcut>
</template>
