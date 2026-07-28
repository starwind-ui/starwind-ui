<script setup lang="ts">
import * as CollapsiblePrimitive from "@starwind-ui/vue/collapsible";
import type { ClassValue } from "tailwind-variants";
import { type HTMLAttributes, useAttrs } from "vue";
import { collapsibleContent } from "./variants";

defineOptions({ inheritAttrs: false });

export type CollapsibleContentProps = Omit<HTMLAttributes, "class"> & {
  class?: ClassValue;
};
type CollapsibleContentDeclaredProps = {
  class?: ClassValue;
} & /* @vue-ignore */ CollapsibleContentProps;
const { class: className } = defineProps<CollapsibleContentDeclaredProps>();
defineSlots<{
  default?: () => unknown;
}>();
const attrs = useAttrs();
</script>

<template>
  <CollapsiblePrimitive.CollapsiblePanel
    :class="collapsibleContent({ class: className })"
    v-bind="attrs"
    data-slot="collapsible-content"
  >
    <slot />
  </CollapsiblePrimitive.CollapsiblePanel>
</template>
