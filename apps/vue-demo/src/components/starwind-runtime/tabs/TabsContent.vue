<script setup lang="ts">
import * as TabsPrimitive from "@starwind-ui/vue/tabs";
import type { ClassValue } from "tailwind-variants";
import { type ComponentPublicInstance, type HTMLAttributes, nextTick, ref } from "vue";
import { tabsContent } from "./variants";

defineOptions({ inheritAttrs: false });

export type TabsContentProps = Omit<HTMLAttributes, "class" | "keepMounted" | "value"> & {
  keepMounted?: boolean;
  value: string;
  class?: ClassValue;
};
type TabsContentDeclaredProps = {
  keepMounted?: boolean;
  value: string;
  class?: ClassValue;
} & /* @vue-ignore */ TabsContentProps;
const { keepMounted, value, class: className } = defineProps<TabsContentDeclaredProps>();
defineSlots<{
  default?: () => unknown;
}>();
const element = ref<HTMLElement | null>(null);
let pendingPrimitiveRef: ({ element?: HTMLElement | null } & ComponentPublicInstance) | null = null;
defineExpose({ element });

function setElement(value: Element | ComponentPublicInstance | null): void {
  if (value instanceof HTMLElement) {
    pendingPrimitiveRef = null;
    element.value = value;
    return;
  }
  const exposed = value as ({ element?: HTMLElement | null } & ComponentPublicInstance) | null;
  pendingPrimitiveRef = exposed;
  element.value = exposed?.element instanceof HTMLElement ? exposed.element : null;
  if (!exposed || element.value) return;

  void nextTick(() => {
    if (pendingPrimitiveRef !== exposed) return;
    element.value = exposed.element instanceof HTMLElement ? exposed.element : null;
  });
}
</script>

<template>
  <TabsPrimitive.TabsPanel
    :ref="setElement"
    :class="tabsContent({ class: className })"
    :keep-mounted="keepMounted"
    :value="value"
    v-bind="$attrs"
    data-slot="tabs-content"
  >
    <slot />
  </TabsPrimitive.TabsPanel>
</template>
