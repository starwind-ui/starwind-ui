<script setup lang="ts">
import * as SheetPrimitive from "@starwind-ui/vue/drawer";
import type { ClassValue } from "tailwind-variants";
import { type ComponentPublicInstance, type HTMLAttributes, nextTick, ref } from "vue";
import { sheetTitle } from "./variants";

defineOptions({ inheritAttrs: false });

export type SheetTitleProps = Omit<HTMLAttributes, "class"> & {
  class?: ClassValue;
};
type SheetTitleDeclaredProps = {
  class?: ClassValue;
} & /* @vue-ignore */ SheetTitleProps;
const { class: className } = defineProps<SheetTitleDeclaredProps>();
defineSlots<{
  default?: () => unknown;
}>();
const element = ref<HTMLHeadingElement | null>(null);
let pendingPrimitiveRef:
  | ({ element?: HTMLHeadingElement | null } & ComponentPublicInstance)
  | null = null;
defineExpose({ element });

function setElement(value: Element | ComponentPublicInstance | null): void {
  if (value instanceof HTMLHeadingElement) {
    pendingPrimitiveRef = null;
    element.value = value;
    return;
  }
  const exposed = value as
    | ({ element?: HTMLHeadingElement | null } & ComponentPublicInstance)
    | null;
  pendingPrimitiveRef = exposed;
  element.value = exposed?.element instanceof HTMLHeadingElement ? exposed.element : null;
  if (!exposed || element.value) return;

  void nextTick(() => {
    if (pendingPrimitiveRef !== exposed) return;
    element.value = exposed.element instanceof HTMLHeadingElement ? exposed.element : null;
  });
}
</script>

<template>
  <SheetPrimitive.DrawerTitle
    :ref="setElement"
    :class="sheetTitle({ class: className })"
    v-bind="$attrs"
    data-slot="sheet-title"
  >
    <slot />
  </SheetPrimitive.DrawerTitle>
</template>
