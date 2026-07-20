<script setup lang="ts">
import * as AvatarPrimitive from "@starwind-ui/vue/avatar";
import type { ClassValue } from "tailwind-variants";
import { type ComponentPublicInstance, type ImgHTMLAttributes, nextTick, ref, useAttrs } from "vue";
import { avatarImage } from "./variants";

defineOptions({ inheritAttrs: false });

export type AvatarImageProps = Omit<ImgHTMLAttributes, "alt" | "children" | "class"> & {
  alt: string;
  class?: ClassValue;
};
type AvatarImageDeclaredProps = {
  alt: string;
  class?: ClassValue;
} & /* @vue-ignore */ AvatarImageProps;
const { alt, class: className } = defineProps<AvatarImageDeclaredProps>();
defineSlots<{}>();
const attrs = useAttrs();
const emit = defineEmits<{
  loadingStatusChange: [
    status: import("@starwind-ui/vue/avatar").AvatarImageLoadingStatus,
    detail: import("@starwind-ui/vue/avatar").AvatarLoadingStatusChangeDetails,
  ];
}>();
function handleLoadingStatusChange(
  status: import("@starwind-ui/vue/avatar").AvatarImageLoadingStatus,
  detail: import("@starwind-ui/vue/avatar").AvatarLoadingStatusChangeDetails,
): void {
  emit("loadingStatusChange", status, detail);
}
const element = ref<HTMLImageElement | null>(null);
let pendingPrimitiveRef: ({ element?: HTMLImageElement | null } & ComponentPublicInstance) | null =
  null;
defineExpose({ element });

function setElement(value: Element | ComponentPublicInstance | null): void {
  if (value instanceof HTMLImageElement) {
    pendingPrimitiveRef = null;
    element.value = value;
    return;
  }
  const exposed = value as ({ element?: HTMLImageElement | null } & ComponentPublicInstance) | null;
  pendingPrimitiveRef = exposed;
  element.value = exposed?.element instanceof HTMLImageElement ? exposed.element : null;
  if (!exposed || element.value) return;

  void nextTick(() => {
    if (pendingPrimitiveRef !== exposed) return;
    element.value = exposed.element instanceof HTMLImageElement ? exposed.element : null;
  });
}
</script>

<template>
  <AvatarPrimitive.AvatarImage
    :ref="setElement"
    :class="avatarImage({ class: className })"
    @loading-status-change="handleLoadingStatusChange"
    :alt="alt"
    v-bind="attrs"
    data-slot="avatar-image"
  />
</template>
