<script setup lang="ts">
import * as AlertDialogPrimitive from "@starwind-ui/vue/alert-dialog";
import type { ClassValue } from "tailwind-variants";
import { type ComponentPublicInstance, type HTMLAttributes, nextTick, ref } from "vue";
import { alertDialogBackdrop, alertDialogContent } from "./variants";

defineOptions({ inheritAttrs: false });

export type AlertDialogContentProps = Omit<HTMLAttributes, "class"> & {
  class?: ClassValue;
};
type AlertDialogContentDeclaredProps = {
  class?: ClassValue;
} & /* @vue-ignore */ AlertDialogContentProps;
const { class: className } = defineProps<AlertDialogContentDeclaredProps>();
defineSlots<{
  default?: () => unknown;
  backdrop?: () => unknown;
}>();
const element = ref<HTMLDialogElement | null>(null);
let pendingPrimitiveRef: ({ element?: HTMLDialogElement | null } & ComponentPublicInstance) | null =
  null;
defineExpose({ element });

function setElement(value: Element | ComponentPublicInstance | null): void {
  if (value instanceof HTMLDialogElement) {
    pendingPrimitiveRef = null;
    element.value = value;
    return;
  }
  const exposed = value as
    | ({ element?: HTMLDialogElement | null } & ComponentPublicInstance)
    | null;
  pendingPrimitiveRef = exposed;
  element.value = exposed?.element instanceof HTMLDialogElement ? exposed.element : null;
  if (!exposed || element.value) return;

  void nextTick(() => {
    if (pendingPrimitiveRef !== exposed) return;
    element.value = exposed.element instanceof HTMLDialogElement ? exposed.element : null;
  });
}
</script>

<template>
  <slot name="backdrop">
    <AlertDialogPrimitive.AlertDialogBackdrop
      :class="alertDialogBackdrop()"
      data-state="closed"
      hidden
      data-slot="alert-dialog-backdrop"
    />
  </slot>
  <AlertDialogPrimitive.AlertDialogPopup
    :ref="setElement"
    :class="alertDialogContent({ class: className })"
    role="alertdialog"
    data-state="closed"
    v-bind="$attrs"
    data-slot="alert-dialog-content"
  >
    <slot />
  </AlertDialogPrimitive.AlertDialogPopup>
</template>
