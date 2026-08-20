<script setup lang="ts">
import * as DropzonePrimitive from "@starwind-ui/vue/dropzone";
import type { ClassValue } from "tailwind-variants";
import { type ComponentPublicInstance, type HTMLAttributes, nextTick, ref } from "vue";
import { dropzoneLoadingIndicator } from "./variants";

defineOptions({ inheritAttrs: false });

export type DropzoneLoadingIndicatorProps = Omit<HTMLAttributes, "class" | "isUploading"> & {
  isUploading?: boolean;
  class?: ClassValue;
};
type DropzoneLoadingIndicatorDeclaredProps = {
  isUploading?: boolean;
  class?: ClassValue;
} & /* @vue-ignore */ DropzoneLoadingIndicatorProps;
const { isUploading = false, class: className } =
  defineProps<DropzoneLoadingIndicatorDeclaredProps>();
defineSlots<{
  default?: () => unknown;
}>();
const element = ref<HTMLDivElement | null>(null);
let pendingPrimitiveRef: ({ element?: HTMLDivElement | null } & ComponentPublicInstance) | null =
  null;
defineExpose({ element });

function setElement(value: Element | ComponentPublicInstance | null): void {
  if (value instanceof HTMLDivElement) {
    pendingPrimitiveRef = null;
    element.value = value;
    return;
  }
  const exposed = value as ({ element?: HTMLDivElement | null } & ComponentPublicInstance) | null;
  pendingPrimitiveRef = exposed;
  element.value = exposed?.element instanceof HTMLDivElement ? exposed.element : null;
  if (!exposed || element.value) return;

  void nextTick(() => {
    if (pendingPrimitiveRef !== exposed) return;
    element.value = exposed.element instanceof HTMLDivElement ? exposed.element : null;
  });
}
</script>

<template>
  <DropzonePrimitive.DropzoneLoadingIndicator
    :ref="setElement"
    :class="dropzoneLoadingIndicator({ class: className })"
    :is-uploading="isUploading"
    v-bind="$attrs"
    data-slot="dropzone-loading-indicator"
  >
    <slot>
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        stroke-width="2"
        stroke-linecap="round"
        stroke-linejoin="round"
        aria-hidden="true"
        class="mx-auto size-10 animate-spin"
      >
        <path stroke="none" d="M0 0h24v24H0z" fill="none" />
        <path d="M12 3a9 9 0 1 0 9 9" />
        <path d="M12 7v5l3 3" />
      </svg>
      <p class="mt-1 text-sm">Uploading file(s)...</p>
    </slot>
  </DropzonePrimitive.DropzoneLoadingIndicator>
</template>
