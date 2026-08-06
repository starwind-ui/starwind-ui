<script setup lang="ts">
import type { ClassValue } from "tailwind-variants";
import { computed, type HTMLAttributes, useAttrs } from "vue";
import { Skeleton } from "../skeleton";
import { sidebarMenuSkeleton } from "./variants";

defineOptions({ inheritAttrs: false });

export type SidebarMenuSkeletonProps = Omit<HTMLAttributes, "class" | "showIcon" | "width"> & {
  showIcon?: boolean;
  width?: string;
  class?: ClassValue;
};
type SidebarMenuSkeletonDeclaredProps = {
  showIcon?: boolean;
  width?: string;
  class?: ClassValue;
} & /* @vue-ignore */ SidebarMenuSkeletonProps;
const {
  showIcon = false,
  width,
  class: className,
} = defineProps<SidebarMenuSkeletonDeclaredProps>();
defineSlots<{}>();
const attrs = useAttrs();
const skeletonWidth = computed(() => width ?? "70%");
const skeletonStyle = computed(() => ({ "--skeleton-width": skeletonWidth.value }));
</script>

<template>
  <div
    :class="sidebarMenuSkeleton({ class: className })"
    data-sidebar="menu-skeleton"
    v-bind="attrs"
    data-slot="sidebar-menu-skeleton"
  >
    <template v-if="showIcon">
      <Skeleton class="size-4 rounded-md" data-sidebar="menu-skeleton-icon" />
    </template>
    <Skeleton
      class="h-4 max-w-(--skeleton-width) flex-1"
      :style="skeletonStyle"
      data-sidebar="menu-skeleton-text"
    />
  </div>
</template>
