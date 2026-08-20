<script setup lang="ts">
import * as TabsPrimitive from "@starwind-ui/vue/tabs";
import type { ClassValue } from "tailwind-variants";
import { type ComponentPublicInstance, type HTMLAttributes, nextTick, ref } from "vue";
import { tabsList } from "./variants";

defineOptions({ inheritAttrs: false });

export type TabsListProps = Omit<HTMLAttributes, "activateOnFocus" | "class" | "loopFocus"> & {
  activateOnFocus?: boolean;
  loopFocus?: boolean;
  class?: ClassValue;
};
type TabsListDeclaredProps = {
  activateOnFocus?: boolean;
  loopFocus?: boolean;
  class?: ClassValue;
} & /* @vue-ignore */ TabsListProps;
const { activateOnFocus, loopFocus, class: className } = defineProps<TabsListDeclaredProps>();
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
  <TabsPrimitive.TabsList
    :ref="setElement"
    :class="tabsList({ class: className })"
    :activate-on-focus="activateOnFocus"
    :loop-focus="loopFocus"
    v-bind="$attrs"
    data-slot="tabs-list"
  >
    <slot />
  </TabsPrimitive.TabsList>
</template>
