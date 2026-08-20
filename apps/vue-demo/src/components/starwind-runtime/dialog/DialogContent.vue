<script setup lang="ts">
import type { ClassValue } from "tailwind-variants";
import { type ComponentPublicInstance, type HTMLAttributes, nextTick, ref } from "vue";
import "./styles.css";
import * as DialogPrimitive from "@starwind-ui/vue/dialog";
import { Button } from "../button";
import { dialogBackdrop, dialogCloseButton, dialogContent } from "./variants";

defineOptions({ inheritAttrs: false });

export type DialogContentProps = Omit<HTMLAttributes, "class"> & {
  class?: ClassValue;
};
type DialogContentDeclaredProps = {
  class?: ClassValue;
} & /* @vue-ignore */ DialogContentProps;
const { class: className } = defineProps<DialogContentDeclaredProps>();
defineSlots<{
  default?: () => unknown;
  backdrop?: () => unknown;
  icon?: () => unknown;
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
    <DialogPrimitive.DialogBackdrop
      :class="dialogBackdrop()"
      data-state="closed"
      hidden
      data-slot="dialog-backdrop"
    />
  </slot>
  <DialogPrimitive.DialogPopup
    :ref="setElement"
    :class="dialogContent({ class: className })"
    data-state="closed"
    v-bind="$attrs"
    data-slot="dialog-content"
  >
    <slot />
    <Button
      variant="ghost"
      size="icon-sm"
      :class="dialogCloseButton()"
      aria-label="Close dialog"
      data-slot="dialog-close"
      data-sw-dialog-close
    >
      <slot name="icon">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
          stroke-linecap="round"
          stroke-linejoin="round"
          aria-hidden="true"
          class="size-5 transition-opacity"
        >
          <path stroke="none" d="M0 0h24v24H0z" fill="none" />
          <path d="M18 6l-12 12" />
          <path d="M6 6l12 12" />
        </svg>
      </slot>
      <span class="sr-only"> Close </span>
    </Button>
  </DialogPrimitive.DialogPopup>
</template>
