<script setup lang="ts">
import { computed, ref } from "vue";

import {
  DialogClose,
  DialogDescription,
  DialogPopup,
  DialogRoot,
  DialogTitle,
  DialogTrigger,
} from "@starwind-ui/vue/dialog";
import {
  PopoverArrow,
  PopoverClose,
  PopoverDescription,
  PopoverPopup,
  PopoverPortal,
  PopoverPositioner,
  PopoverRoot,
  PopoverTitle,
  PopoverTrigger,
} from "@starwind-ui/vue/popover";

const align = ref<"start" | "center" | "end">("center");
const mounted = ref(true);
const modal = ref(false);
const open = ref(false);
const portalMode = ref<"body" | "custom" | "inline">("body");
const customPortalTarget = ref<HTMLElement | null>(null);
const portalContainer = computed(() =>
  portalMode.value === "custom" ? (customPortalTarget.value ?? "body") : "body",
);
const side = ref<"top" | "right" | "bottom" | "left">("bottom");
const dialogOpen = ref(false);
const nestedOpen = ref(false);
</script>

<template>
  <section id="popover-review" class="review-card" data-testid="popover-review">
    <div class="section-heading">
      <div>
        <p class="eyebrow">Primitive floating-overlay checkpoint</p>
        <h2>Popover</h2>
      </div>
      <output data-testid="popover-state">
        open: {{ open }}, {{ side }} / {{ align }}, portal: {{ portalMode }}
      </output>
    </div>

    <div class="demo-row">
      <label>
        Side
        <select v-model="side" data-testid="popover-side">
          <option v-for="value in ['top', 'right', 'bottom', 'left']" :key="value" :value="value">
            {{ value }}
          </option>
        </select>
      </label>
      <label>
        Align
        <select v-model="align" data-testid="popover-align">
          <option v-for="value in ['start', 'center', 'end']" :key="value" :value="value">
            {{ value }}
          </option>
        </select>
      </label>
      <label><input v-model="modal" type="checkbox" data-testid="popover-modal" /> Modal</label>
      <label>
        Portal owner
        <select v-model="portalMode" data-testid="popover-portal-mode">
          <option value="body">body</option>
          <option value="custom">custom target</option>
          <option value="inline">inline</option>
        </select>
      </label>
      <button class="review-action" data-testid="popover-remount" @click="mounted = !mounted">
        {{ mounted ? "Unmount" : "Remount" }}
      </button>
    </div>

    <PopoverRoot v-if="mounted" v-model:open="open" :modal="modal">
      <PopoverTrigger class="review-action" data-testid="popover-trigger">
        Open Popover
      </PopoverTrigger>
      <PopoverPortal :container="portalContainer" :disabled="portalMode === 'inline'">
        <PopoverPositioner :side="side" :align="align" :side-offset="10">
          <PopoverPopup
            :side="side"
            :align="align"
            :side-offset="10"
            class="bg-background text-foreground z-50 w-72 rounded-lg border p-4 shadow-xl"
            data-testid="popover-popup"
          >
            <PopoverArrow class="fill-background size-3 rotate-45 border" />
            <PopoverTitle class="font-semibold">Vue Primitive Popover</PopoverTitle>
            <PopoverDescription class="text-muted-foreground text-sm">
              Runtime owns placement, dismissal, focus return, and presence.
            </PopoverDescription>
            <PopoverClose class="review-action mt-3" data-testid="popover-close">
              Close
            </PopoverClose>
          </PopoverPopup>
        </PopoverPositioner>
      </PopoverPortal>
    </PopoverRoot>

    <div
      ref="customPortalTarget"
      class="scenario mt-4 min-h-12 border border-dashed p-2"
      data-testid="popover-custom-target"
    >
      Custom Popover portal owner
    </div>

    <div class="scenario mt-4" data-testid="popover-dialog-scenario">
      <h3>Popover nested in Dialog</h3>
      <DialogRoot v-model:open="dialogOpen">
        <DialogTrigger class="review-action" data-testid="popover-dialog-trigger">
          Open Dialog
        </DialogTrigger>
        <DialogPopup
          class="bg-background text-foreground fixed top-1/2 left-1/2 z-40 w-96 -translate-x-1/2 -translate-y-1/2 border p-6"
          data-testid="popover-dialog-popup"
        >
          <DialogTitle class="font-semibold">Parent Dialog</DialogTitle>
          <DialogDescription>The Popover is the nested topmost overlay.</DialogDescription>
          <PopoverRoot v-model:open="nestedOpen">
            <PopoverTrigger class="review-action" data-testid="popover-nested-trigger">
              Open nested Popover
            </PopoverTrigger>
            <PopoverPortal>
              <PopoverPositioner side="right" align="start">
                <PopoverPopup
                  side="right"
                  align="start"
                  class="bg-background text-foreground z-50 w-64 rounded-lg border p-4 shadow-xl"
                  data-testid="popover-nested-popup"
                >
                  <PopoverTitle class="font-semibold">Nested Popover</PopoverTitle>
                  <PopoverDescription
                    >Escape closes this overlay before the Dialog.</PopoverDescription
                  >
                  <PopoverClose class="review-action" data-testid="popover-nested-close">
                    Close nested
                  </PopoverClose>
                </PopoverPopup>
              </PopoverPositioner>
            </PopoverPortal>
          </PopoverRoot>
          <DialogClose class="review-action" data-testid="popover-dialog-close">
            Close Dialog
          </DialogClose>
        </DialogPopup>
      </DialogRoot>
      <output data-testid="popover-nested-state">
        dialog: {{ dialogOpen }}, popover: {{ nestedOpen }}
      </output>
    </div>
  </section>
</template>
