<script setup lang="ts">
import * as SidebarPrimitive from "@starwind-ui/vue/sidebar";
import type { ClassValue } from "tailwind-variants";
import { computed, type HTMLAttributes, useAttrs } from "vue";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "../sheet";
import {
  sidebar,
  sidebarContainer,
  sidebarGap,
  sidebarInner,
  sidebarMobileContent,
} from "./variants";

defineOptions({ inheritAttrs: false });

export type SidebarProps = Omit<HTMLAttributes, "class" | "collapsible" | "side" | "variant"> & {
  side?: "left" | "right";
  variant?: "sidebar" | "floating" | "inset";
  collapsible?: "offcanvas" | "icon" | "none";
  class?: ClassValue;
};
type SidebarDeclaredProps = {
  side?: "left" | "right";
  variant?: "sidebar" | "floating" | "inset";
  collapsible?: "offcanvas" | "icon" | "none";
  class?: ClassValue;
} & /* @vue-ignore */ SidebarProps;
const {
  side = "left",
  variant = "sidebar",
  collapsible = "offcanvas",
  class: className,
} = defineProps<SidebarDeclaredProps>();
defineSlots<{
  default?: () => unknown;
}>();
const attrs = useAttrs();
const mobileStyle = computed(() => ({ "--sidebar-width": "18rem" }));
</script>

<template>
  <template v-if="collapsible === 'none'">
    <div
      :class="
        ['bg-sidebar text-sidebar-foreground flex h-full w-(--sidebar-width) flex-col', className]
          .filter(Boolean)
          .join(' ')
      "
      v-bind="attrs"
      data-slot="sidebar"
    >
      <slot />
    </div>
  </template>
  <template v-else>
    <SidebarPrimitive.SidebarComponent
      :class="sidebar({ class: className })"
      data-state="expanded"
      data-collapsible=""
      :data-collapsible-mode="collapsible"
      :collapsible="collapsible"
      :data-variant="variant"
      :variant="variant"
      :data-side="side"
      :side="side"
      data-slot="sidebar"
    >
      <div data-slot="sidebar-gap" :class="sidebarGap({ variant })" />
      <div
        :class="sidebarContainer({ side, variant })"
        v-bind="attrs"
        data-slot="sidebar-container"
      >
        <div data-sidebar="sidebar" data-slot="sidebar-inner" :class="sidebarInner({ variant })">
          <slot />
        </div>
      </div>
    </SidebarPrimitive.SidebarComponent>
    <Sheet class="md:hidden" data-sidebar="mobile" data-slot="sidebar-mobile">
      <SheetContent
        :side="side"
        :class="sidebarMobileContent()"
        :style="mobileStyle"
        data-sidebar="sidebar"
        data-slot="sidebar-mobile-content"
      >
        <SheetHeader class="sr-only">
          <SheetTitle> Sidebar </SheetTitle>
          <SheetDescription> Mobile navigation sidebar </SheetDescription>
        </SheetHeader>
        <div class="flex h-full w-full flex-col">
          <slot />
        </div>
      </SheetContent>
    </Sheet>
  </template>
</template>
