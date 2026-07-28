<script setup lang="ts">
import { ref } from "vue";

import {
  DialogBackdrop,
  DialogClose,
  DialogDescription,
  DialogPopup,
  DialogRoot,
  DialogTitle,
  DialogTrigger,
} from "@starwind-ui/vue/dialog";

const open = ref(false);
const cancelNextOpen = ref(true);
const show = ref(true);
const changes = ref(0);

function handleOpenChange(nextOpen: boolean, detail: { cancel(): void }): void {
  changes.value += 1;
  if (nextOpen && cancelNextOpen.value) {
    cancelNextOpen.value = false;
    detail.cancel();
  }
}
</script>

<template>
  <section id="dialog-review" class="review-card" data-testid="dialog-review">
    <div class="section-heading">
      <div>
        <p class="eyebrow">Runtime-owned native overlay</p>
        <h2>Dialog</h2>
      </div>
      <output data-testid="dialog-state">open: {{ open }}, changes: {{ changes }}</output>
    </div>

    <div class="demo-row">
      <button
        class="review-action"
        data-testid="dialog-remount"
        type="button"
        @click="show = !show"
      >
        {{ show ? "Unmount Dialog" : "Remount Dialog" }}
      </button>
      <DialogRoot
        v-if="show"
        v-model:open="open"
        data-testid="primitive-dialog"
        @open-change="handleOpenChange"
      >
        <DialogTrigger class="review-action" data-testid="dialog-trigger">
          {{ cancelNextOpen ? "Try canceled open" : "Open Dialog" }}
        </DialogTrigger>
        <DialogBackdrop class="fixed inset-0 z-40 bg-black/60" />
        <DialogPopup
          class="bg-background fixed top-1/2 left-1/2 z-50 w-80 -translate-x-1/2 -translate-y-1/2 rounded-lg border p-6 shadow-xl"
          data-testid="dialog-popup"
        >
          <DialogTitle class="font-heading text-xl">Vue Dialog</DialogTitle>
          <DialogDescription class="text-muted-foreground">
            Focus, dismissal, scroll locking, presence, and nesting remain Runtime-owned.
          </DialogDescription>
          <input class="mt-4 rounded border p-2" aria-label="Dialog review input" />
          <DialogRoot :modal="false">
            <DialogTrigger class="review-action mt-4" data-testid="nested-dialog-trigger">
              Open nested Dialog
            </DialogTrigger>
            <DialogBackdrop class="fixed inset-0 z-50 bg-black/40" />
            <DialogPopup
              class="bg-background fixed top-1/2 left-1/2 z-60 w-64 -translate-x-1/2 -translate-y-1/2 rounded-lg border p-5"
            >
              <DialogTitle>Nested Dialog</DialogTitle>
              <DialogClose class="review-action mt-4">Close nested</DialogClose>
            </DialogPopup>
          </DialogRoot>
          <DialogClose class="review-action mt-4">Close Dialog</DialogClose>
        </DialogPopup>
      </DialogRoot>
    </div>
  </section>
</template>
