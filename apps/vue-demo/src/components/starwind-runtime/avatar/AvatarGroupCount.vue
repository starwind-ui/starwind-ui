<script setup lang="ts">
import type { ClassValue } from "tailwind-variants";
import { type HTMLAttributes, ref } from "vue";
import { avatarGroupCount } from "./variants";

defineOptions({ inheritAttrs: false });

export type AvatarGroupCountProps = Omit<HTMLAttributes, "class"> & {
  class?: ClassValue;
};
type AvatarGroupCountDeclaredProps = {
  class?: ClassValue;
} & /* @vue-ignore */ AvatarGroupCountProps;
const { class: className } = defineProps<AvatarGroupCountDeclaredProps>();
defineSlots<{
  default?: () => unknown;
}>();
const element = ref<HTMLDivElement | null>(null);
defineExpose({ element });
</script>

<template>
  <div
    ref="element"
    :class="avatarGroupCount({ class: className })"
    v-bind="$attrs"
    data-slot="avatar-group-count"
  >
    <slot />
  </div>
</template>
