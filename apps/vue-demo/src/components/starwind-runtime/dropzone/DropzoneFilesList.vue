<script setup lang="ts">
import * as DropzonePrimitive from "@starwind-ui/vue/dropzone";
import type { ClassValue } from "tailwind-variants";
import { type ComponentPublicInstance, type HTMLAttributes, nextTick, ref, useAttrs } from "vue";
import { dropzoneFilesList } from "./variants";

defineOptions({ inheritAttrs: false });

export type DropzoneFilesListProps = Omit<HTMLAttributes, "class"> & {
  class?: ClassValue;
};
type DropzoneFilesListDeclaredProps = {
  class?: ClassValue;
} & /* @vue-ignore */ DropzoneFilesListProps;
const { class: className } = defineProps<DropzoneFilesListDeclaredProps>();
defineSlots<{}>();
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
  <DropzonePrimitive.DropzoneFilesList
    :ref="setElement"
    :class="dropzoneFilesList({ class: className })"
    v-bind="{ 'aria-live': 'polite', 'aria-label': 'Uploaded files', ...attrs }"
    data-slot="dropzone-files-list"
  />
</template>
