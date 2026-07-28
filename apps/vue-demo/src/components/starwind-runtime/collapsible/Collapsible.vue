<script setup lang="ts">
import * as CollapsiblePrimitive from "@starwind-ui/vue/collapsible";
import type { ClassValue } from "tailwind-variants";
import { type HTMLAttributes, useAttrs } from "vue";
import { collapsible } from "./variants";

defineOptions({ inheritAttrs: false });

export type CollapsibleProps = Omit<
  HTMLAttributes,
  "class" | "defaultOpen" | "disabled" | "open"
> & {
  defaultOpen?: boolean;
  disabled?: boolean;
  class?: ClassValue;
  open?: boolean;
};
type CollapsibleDeclaredProps = {
  defaultOpen?: boolean;
  disabled?: boolean;
  class?: ClassValue;
  open?: boolean;
} & /* @vue-ignore */ CollapsibleProps;
const {
  defaultOpen = false,
  disabled = false,
  class: className,
  open = undefined,
} = defineProps<CollapsibleDeclaredProps>();
defineSlots<{
  default?: () => unknown;
}>();
const attrs = useAttrs();
const emit = defineEmits<{
  openChange: [
    open: boolean,
    detail: import("@starwind-ui/vue/collapsible").CollapsibleOpenChangeDetails,
  ];
  "update:open": [value: boolean];
}>();
function handleOpenChange(
  open: boolean,
  detail: import("@starwind-ui/vue/collapsible").CollapsibleOpenChangeDetails,
): void {
  emit("openChange", open, detail);
}
</script>

<template>
  <CollapsiblePrimitive.CollapsibleRoot
    :class="collapsible({ class: className })"
    :default-open="defaultOpen"
    :disabled="disabled"
    v-bind="attrs"
    data-slot="collapsible"
    :open="open"
    @update:open="emit('update:open', $event)"
    @open-change="handleOpenChange"
  >
    <slot />
  </CollapsiblePrimitive.CollapsibleRoot>
</template>
