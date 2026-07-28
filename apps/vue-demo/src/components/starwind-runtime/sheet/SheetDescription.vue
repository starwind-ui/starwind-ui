<script setup lang="ts">
import * as SheetPrimitive from "@starwind-ui/vue/drawer";
import type { ClassValue } from "tailwind-variants";
import { type ComponentPublicInstance, type HTMLAttributes, nextTick, ref, useAttrs } from "vue";
import { sheetDescription } from "./variants";

defineOptions({ inheritAttrs: false });

export type SheetDescriptionProps = Omit<HTMLAttributes, "class"> & {
  class?: ClassValue;
};
type SheetDescriptionDeclaredProps = {
  class?: ClassValue;
} & /* @vue-ignore */ SheetDescriptionProps;
const { class: className } = defineProps<SheetDescriptionDeclaredProps>();
defineSlots<{
  default?: () => unknown;
}>();
const attrs = useAttrs();
const element = ref<HTMLParagraphElement | null>(null);
let pendingPrimitiveRef:
  | ({ element?: HTMLParagraphElement | null } & ComponentPublicInstance)
  | null = null;
defineExpose({ element });

function setElement(value: Element | ComponentPublicInstance | null): void {
  if (value instanceof HTMLParagraphElement) {
    pendingPrimitiveRef = null;
    element.value = value;
    return;
  }
  const exposed = value as
    | ({ element?: HTMLParagraphElement | null } & ComponentPublicInstance)
    | null;
  pendingPrimitiveRef = exposed;
  element.value = exposed?.element instanceof HTMLParagraphElement ? exposed.element : null;
  if (!exposed || element.value) return;

  void nextTick(() => {
    if (pendingPrimitiveRef !== exposed) return;
    element.value = exposed.element instanceof HTMLParagraphElement ? exposed.element : null;
  });
}
</script>

<template>
  <SheetPrimitive.DrawerDescription
    :ref="setElement"
    :class="sheetDescription({ class: className })"
    v-bind="attrs"
    data-slot="sheet-description"
  >
    <slot />
  </SheetPrimitive.DrawerDescription>
</template>
