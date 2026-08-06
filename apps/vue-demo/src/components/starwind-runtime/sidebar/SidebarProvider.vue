<script setup lang="ts">
import * as SidebarPrimitive from "@starwind-ui/vue/sidebar";
import type { ClassValue } from "tailwind-variants";
import {
  type ComponentPublicInstance,
  computed,
  type HTMLAttributes,
  nextTick,
  ref,
  useAttrs,
} from "vue";
import { sidebarProvider } from "./variants";

defineOptions({ inheritAttrs: false });

export type SidebarProviderProps = Omit<
  HTMLAttributes,
  | "class"
  | "defaultMobileOpen"
  | "defaultOpen"
  | "keyboardShortcut"
  | "mobileOpen"
  | "mobileQuery"
  | "open"
  | "persistOpen"
  | "persistenceKey"
  | "persistenceMaxAge"
  | "persistenceStorage"
> & {
  defaultOpen?: boolean;
  defaultMobileOpen?: boolean;
  open?: boolean;
  mobileOpen?: boolean;
  keyboardShortcut?: string;
  mobileQuery?: string;
  persistOpen?: boolean;
  persistenceKey?: string;
  persistenceStorage?: "localStorage" | "cookie" | false;
  persistenceMaxAge?: number;
  class?: ClassValue;
};
type SidebarProviderDeclaredProps = {
  defaultOpen?: boolean;
  defaultMobileOpen?: boolean;
  open?: boolean;
  mobileOpen?: boolean;
  keyboardShortcut?: string;
  mobileQuery?: string;
  persistOpen?: boolean;
  persistenceKey?: string;
  persistenceStorage?: "localStorage" | "cookie" | false;
  persistenceMaxAge?: number;
  class?: ClassValue;
  style?: unknown;
} & /* @vue-ignore */ SidebarProviderProps;
const {
  defaultOpen = true,
  defaultMobileOpen = false,
  open = undefined,
  mobileOpen = undefined,
  keyboardShortcut = "b",
  mobileQuery = "(max-width: 767.98px)",
  persistOpen = false,
  persistenceKey,
  persistenceStorage,
  persistenceMaxAge = 604800,
  style,
  class: className,
} = defineProps<SidebarProviderDeclaredProps>();
defineSlots<{
  default?: () => unknown;
}>();
const attrs = useAttrs();
const emit = defineEmits<{
  openChange: [open: boolean, detail: import("@starwind-ui/vue/sidebar").SidebarOpenChangeDetails];
  mobileOpenChange: [
    open: boolean,
    detail: import("@starwind-ui/vue/sidebar").SidebarMobileOpenChangeDetails,
  ];
  "update:open": [value: boolean];
  "update:mobileOpen": [value: boolean];
}>();
const providerStyle = computed(() => [
  { "--sidebar-width": "18rem", "--sidebar-width-icon": "3.5rem" },
  style,
]);
function handleOpenChange(
  open: boolean,
  detail: import("@starwind-ui/vue/sidebar").SidebarOpenChangeDetails,
): void {
  emit("openChange", open, detail);
}

function handleMobileOpenChange(
  open: boolean,
  detail: import("@starwind-ui/vue/sidebar").SidebarMobileOpenChangeDetails,
): void {
  emit("mobileOpenChange", open, detail);
}
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
  <SidebarPrimitive.SidebarProvider
    :ref="setElement"
    :class="sidebarProvider({ class: className })"
    :default-open="defaultOpen"
    :default-mobile-open="defaultMobileOpen"
    :open="open"
    :mobile-open="mobileOpen"
    :data-keyboard-shortcut="keyboardShortcut"
    :data-mobile-query="mobileQuery"
    :keyboard-shortcut="keyboardShortcut"
    :mobile-query="mobileQuery"
    :persist-open="persistOpen"
    :persistence-key="persistenceKey"
    :persistence-storage="persistenceStorage"
    :persistence-max-age="persistenceMaxAge"
    :style="providerStyle"
    v-bind="attrs"
    data-slot="sidebar-provider"
    @update:open="emit('update:open', $event)"
    @update:mobile-open="emit('update:mobileOpen', $event)"
    @open-change="handleOpenChange"
    @mobile-open-change="handleMobileOpenChange"
  >
    <slot />
  </SidebarPrimitive.SidebarProvider>
</template>
