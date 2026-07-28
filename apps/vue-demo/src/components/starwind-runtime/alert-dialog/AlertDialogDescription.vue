<script setup lang="ts">
import * as AlertDialogPrimitive from "@starwind-ui/vue/alert-dialog";
import type { ClassValue } from "tailwind-variants";
import { type ComponentPublicInstance, type HTMLAttributes, nextTick, ref, useAttrs } from "vue";
import { alertDialogDescription } from "./variants";

defineOptions({ inheritAttrs: false });

export type AlertDialogDescriptionProps = Omit<HTMLAttributes, "class"> & {
  class?: ClassValue;
};
type AlertDialogDescriptionDeclaredProps = {
  class?: ClassValue;
} & /* @vue-ignore */ AlertDialogDescriptionProps;
const { class: className } = defineProps<AlertDialogDescriptionDeclaredProps>();
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
  <AlertDialogPrimitive.AlertDialogDescription
    :ref="setElement"
    :class="alertDialogDescription({ class: className })"
    v-bind="attrs"
    data-slot="alert-dialog-description"
  >
    <slot />
  </AlertDialogPrimitive.AlertDialogDescription>
</template>
