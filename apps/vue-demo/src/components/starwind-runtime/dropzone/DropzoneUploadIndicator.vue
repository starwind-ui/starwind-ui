<script setup lang="ts">
import * as DropzonePrimitive from "@starwind-ui/vue/dropzone";
import type { ClassValue } from "tailwind-variants";
import { type ComponentPublicInstance, type HTMLAttributes, nextTick, ref, useAttrs } from "vue";
import { dropzoneUploadIndicator } from "./variants";

defineOptions({ inheritAttrs: false });

export type DropzoneUploadIndicatorProps = Omit<HTMLAttributes, "class" | "isUploading"> & {
  isUploading?: boolean;
  class?: ClassValue;
};
type DropzoneUploadIndicatorDeclaredProps = {
  isUploading?: boolean;
  class?: ClassValue;
} & /* @vue-ignore */ DropzoneUploadIndicatorProps;
const { isUploading = false, class: className } =
  defineProps<DropzoneUploadIndicatorDeclaredProps>();
defineSlots<{
  default?: () => unknown;
}>();
const attrs = useAttrs();
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
  <DropzonePrimitive.DropzoneUploadIndicator
    :ref="setElement"
    :class="dropzoneUploadIndicator({ class: className })"
    :is-uploading="isUploading"
    v-bind="attrs"
    data-slot="dropzone-upload-indicator"
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
        class="mx-auto size-10"
      >
        <path stroke="none" d="M0 0h24v24H0z" fill="none" />
        <path
          d="M7 18a4.6 4.4 0 0 1 0 -9c.26 -3.008 2.42 -4.508 5 -4.508c2.58 0 4.74 1.5 5 4.508h.5a3.5 3.5 0 0 1 0 7h-.5"
        />
        <path d="M9 15l3 -3l3 3" />
        <path d="M12 12l0 9" />
      </svg>
      <p class="mt-1 text-sm">Click to upload or drag and drop</p>
    </slot>
  </DropzonePrimitive.DropzoneUploadIndicator>
</template>
