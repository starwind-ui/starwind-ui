<script setup lang="ts">
import type { ClassValue } from "tailwind-variants";
import { type HTMLAttributes, ref } from "vue";
import { avatarGroup } from "./variants";

defineOptions({ inheritAttrs: false });

export type AvatarGroupProps = Omit<HTMLAttributes, "class"> & {
  class?: ClassValue;
};
type AvatarGroupDeclaredProps = {
  class?: ClassValue;
} & /* @vue-ignore */ AvatarGroupProps;
const { class: className } = defineProps<AvatarGroupDeclaredProps>();
defineSlots<{
  default?: () => unknown;
}>();
const element = ref<HTMLDivElement | null>(null);
defineExpose({ element });
</script>

<template>
  <div
    ref="element"
    :class="avatarGroup({ class: className })"
    v-bind="$attrs"
    data-slot="avatar-group"
  >
    <slot />
  </div>
</template>
