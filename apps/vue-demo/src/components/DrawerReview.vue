<script setup lang="ts">
import { computed, ref } from "vue";

import {
  DrawerBackdrop,
  DrawerClose,
  DrawerDescription,
  DrawerPopup,
  DrawerPortal,
  DrawerRoot,
  DrawerTitle,
  DrawerTrigger,
  DrawerViewport,
} from "@starwind-ui/vue/drawer";

const side = ref<"top" | "right" | "bottom" | "left">("right");
const open = ref(false);
const mounted = ref(true);
const portalMode = ref<"body" | "custom" | "inline">("body");
const customPortalTarget = ref<HTMLElement | null>(null);
const portalContainer = computed(() =>
  portalMode.value === "custom" ? (customPortalTarget.value ?? "body") : "body",
);
const modal = ref(true);
const nestedParentOpen = ref(false);
const nestedChildOpen = ref(false);
</script>

<template>
  <section id="drawer-review" class="review-card" data-testid="drawer-review">
    <div class="section-heading">
      <div>
        <p class="eyebrow">Primitive native-overlay checkpoint</p>
        <h2>Drawer</h2>
      </div>
      <output data-testid="drawer-state">
        open: {{ open }}, side: {{ side }}, portal: {{ portalMode }}
      </output>
    </div>
    <div class="demo-row">
      <label>
        Side
        <select v-model="side" data-testid="drawer-side">
          <option v-for="value in ['top', 'right', 'bottom', 'left']" :key="value" :value="value">
            {{ value }}
          </option>
        </select>
      </label>
      <label><input v-model="modal" type="checkbox" /> Modal</label>
      <label>
        Portal owner
        <select v-model="portalMode" data-testid="drawer-portal-mode">
          <option value="body">body</option>
          <option value="custom">custom target</option>
          <option value="inline">inline</option>
        </select>
      </label>
      <button class="review-action" data-testid="drawer-remount" @click="mounted = !mounted">
        {{ mounted ? "Unmount" : "Remount" }}
      </button>
    </div>
    <DrawerRoot v-if="mounted" v-model:open="open" :modal="modal">
      <DrawerTrigger class="review-action" data-testid="drawer-trigger">Open Drawer</DrawerTrigger>
      <DrawerPortal :container="portalContainer" :disabled="portalMode === 'inline'">
        <DrawerViewport>
          <DrawerBackdrop class="fixed inset-0 z-40 bg-black/55" />
          <DrawerPopup
            :side="side"
            class="bg-background text-foreground fixed z-50 max-h-[80vh] max-w-[80vw] border p-6"
            :class="{
              'inset-x-0 top-0': side === 'top',
              'inset-y-0 right-0': side === 'right',
              'inset-x-0 bottom-0': side === 'bottom',
              'inset-y-0 left-0': side === 'left',
            }"
            data-testid="drawer-popup"
          >
            <DrawerTitle class="text-lg font-semibold">Vue Primitive Drawer</DrawerTitle>
            <DrawerDescription
              >Runtime owns focus, dismissal, locks, and presence.</DrawerDescription
            >
            <DrawerClose class="review-action" data-testid="drawer-close">Close</DrawerClose>
          </DrawerPopup>
        </DrawerViewport>
      </DrawerPortal>
    </DrawerRoot>
    <div
      ref="customPortalTarget"
      class="scenario mt-4 min-h-12 border border-dashed p-2"
      data-testid="drawer-custom-target"
    >
      <span data-testid="drawer-custom-target-label">Custom Drawer portal owner</span>
    </div>

    <div class="scenario mt-4" data-testid="drawer-nested-scenario">
      <h3>Nested Primitive Drawers</h3>
      <DrawerRoot v-model:open="nestedParentOpen">
        <DrawerTrigger class="review-action" data-testid="drawer-nested-parent-trigger">
          Open parent Drawer
        </DrawerTrigger>
        <DrawerPortal>
          <DrawerViewport>
            <DrawerBackdrop class="fixed inset-0 z-40 bg-black/55" />
            <DrawerPopup
              side="right"
              class="bg-background text-foreground fixed inset-y-0 right-0 z-50 w-96 border p-6"
              data-testid="drawer-nested-parent-popup"
            >
              <DrawerTitle class="text-lg font-semibold">Parent Drawer</DrawerTitle>
              <DrawerDescription>The child Drawer becomes the topmost overlay.</DrawerDescription>
              <DrawerRoot v-model:open="nestedChildOpen">
                <DrawerTrigger class="review-action" data-testid="drawer-nested-child-trigger">
                  Open child Drawer
                </DrawerTrigger>
                <DrawerPortal>
                  <DrawerViewport>
                    <DrawerBackdrop class="fixed inset-0 z-[60] bg-black/45" />
                    <DrawerPopup
                      side="bottom"
                      class="bg-background text-foreground fixed inset-x-0 bottom-0 z-[70] border p-6"
                      data-testid="drawer-nested-child-popup"
                    >
                      <DrawerTitle class="text-lg font-semibold">Child Drawer</DrawerTitle>
                      <DrawerDescription
                        >Escape closes this topmost Drawer first.</DrawerDescription
                      >
                      <DrawerClose class="review-action" data-testid="drawer-nested-child-close">
                        Close child
                      </DrawerClose>
                    </DrawerPopup>
                  </DrawerViewport>
                </DrawerPortal>
              </DrawerRoot>
              <DrawerClose class="review-action" data-testid="drawer-nested-parent-close">
                Close parent
              </DrawerClose>
            </DrawerPopup>
          </DrawerViewport>
        </DrawerPortal>
      </DrawerRoot>
      <output data-testid="drawer-nested-state">
        parent: {{ nestedParentOpen }}, child: {{ nestedChildOpen }}
      </output>
    </div>
  </section>
</template>
