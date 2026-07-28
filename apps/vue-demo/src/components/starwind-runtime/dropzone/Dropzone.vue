<script setup lang="ts">
import * as DropzonePrimitive from "@starwind-ui/vue/dropzone";
import type { ClassValue } from "tailwind-variants";
import {
  type ComponentPublicInstance,
  type InputHTMLAttributes,
  nextTick,
  ref,
  useAttrs,
} from "vue";
import DropzoneFilesList from "./DropzoneFilesList.vue";
import DropzoneLoadingIndicator from "./DropzoneLoadingIndicator.vue";
import DropzoneUploadIndicator from "./DropzoneUploadIndicator.vue";
import { dropzone } from "./variants";

defineOptions({ inheritAttrs: false });

export type DropzoneProps = Omit<
  InputHTMLAttributes,
  "class" | "disabled" | "isUploading" | "type"
> & {
  disabled?: boolean;
  isUploading?: boolean;
  class?: ClassValue;
};
type DropzoneDeclaredProps = {
  disabled?: boolean;
  isUploading?: boolean;
  class?: ClassValue;
  id?: DropzoneProps["id"];
  ariaInvalid?: DropzoneProps["aria-invalid"];
};
const {
  id,
  disabled = false,
  isUploading = false,
  ariaInvalid,
  class: className,
} = defineProps<DropzoneDeclaredProps>();
defineSlots<{
  default?: () => unknown;
}>();
const attrs = useAttrs();
const emit = defineEmits<{
  filesChange: [
    files: File[],
    detail: import("@starwind-ui/vue/dropzone").DropzoneFilesChangeDetails,
  ];
}>();
function handleFilesChange(
  files: File[],
  detail: import("@starwind-ui/vue/dropzone").DropzoneFilesChangeDetails,
): void {
  emit("filesChange", files, detail);
}
const element = ref<HTMLLabelElement | null>(null);
let pendingPrimitiveRef: ({ element?: HTMLLabelElement | null } & ComponentPublicInstance) | null =
  null;
defineExpose({ element });

function setElement(value: Element | ComponentPublicInstance | null): void {
  if (value instanceof HTMLLabelElement) {
    pendingPrimitiveRef = null;
    element.value = value;
    return;
  }
  const exposed = value as ({ element?: HTMLLabelElement | null } & ComponentPublicInstance) | null;
  pendingPrimitiveRef = exposed;
  element.value = exposed?.element instanceof HTMLLabelElement ? exposed.element : null;
  if (!exposed || element.value) return;

  void nextTick(() => {
    if (pendingPrimitiveRef !== exposed) return;
    element.value = exposed.element instanceof HTMLLabelElement ? exposed.element : null;
  });
}
</script>

<template>
  <DropzonePrimitive.DropzoneRoot
    :ref="setElement"
    :class="dropzone({ class: className })"
    :disabled="disabled"
    :is-uploading="isUploading"
    v-bind="{ id, 'aria-invalid': ariaInvalid }"
    data-slot="dropzone"
    @files-change="handleFilesChange"
  >
    <slot>
      <DropzoneUploadIndicator :is-uploading="isUploading" />
      <DropzoneLoadingIndicator :is-uploading="isUploading" />
      <DropzoneFilesList />
    </slot>
    <DropzonePrimitive.DropzoneInput
      :disabled="disabled"
      v-bind="{ ...attrs, 'aria-invalid': ariaInvalid }"
    />
  </DropzonePrimitive.DropzoneRoot>
</template>
