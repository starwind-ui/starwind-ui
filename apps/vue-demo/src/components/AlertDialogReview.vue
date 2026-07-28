<script setup lang="ts">
import { ref } from "vue";

import {
  AlertDialogBackdrop,
  AlertDialogClose,
  AlertDialogDescription,
  AlertDialogPopup,
  AlertDialogPortal,
  AlertDialogRoot,
  AlertDialogTitle,
  AlertDialogTrigger,
  AlertDialogViewport,
} from "@starwind-ui/vue/alert-dialog";

const open = ref(false);
const cancelNextOpen = ref(true);
const show = ref(true);
const showDefaultOpen = ref(false);
const portalTarget = ref<HTMLElement | null>(null);

function handleOpenChange(nextOpen: boolean, detail: { cancel(): void }): void {
  if (nextOpen && cancelNextOpen.value) {
    cancelNextOpen.value = false;
    detail.cancel();
  }
}
</script>

<template>
  <section id="alert-dialog-review" class="review-card" data-testid="alert-dialog-review">
    <div class="section-heading">
      <div>
        <p class="eyebrow">Owner-scoped delayed Teleport</p>
        <h2>Alert Dialog</h2>
      </div>
      <output data-testid="alert-dialog-state">open: {{ open }}</output>
    </div>
    <div ref="portalTarget" data-testid="alert-dialog-portal-target" />
    <div class="demo-row">
      <button
        class="review-action"
        type="button"
        data-testid="alert-dialog-remount"
        @click="show = !show"
      >
        {{ show ? "Unmount Alert Dialog" : "Remount Alert Dialog" }}
      </button>
      <AlertDialogRoot
        v-if="show"
        v-model:open="open"
        data-testid="primitive-alert-dialog"
        @open-change="handleOpenChange"
      >
        <AlertDialogTrigger class="review-action" data-testid="alert-dialog-trigger">
          {{ cancelNextOpen ? "Try canceled open" : "Delete project" }}
        </AlertDialogTrigger>
        <AlertDialogPortal :container="portalTarget ?? 'body'" data-testid="alert-dialog-portal">
          <AlertDialogViewport>
            <AlertDialogBackdrop class="fixed inset-0 z-40 bg-black/60" />
            <AlertDialogPopup
              class="bg-background fixed top-1/2 left-1/2 z-50 w-96 -translate-x-1/2 -translate-y-1/2 rounded-lg border p-6 shadow-xl"
              data-testid="alert-dialog-popup"
            >
              <AlertDialogTitle class="font-heading text-xl">Delete project?</AlertDialogTitle>
              <AlertDialogDescription class="text-muted-foreground">
                This action cannot be undone. Outside interaction is intentionally locked.
              </AlertDialogDescription>
              <div class="mt-4 flex justify-end gap-2">
                <AlertDialogClose class="review-action" data-testid="alert-dialog-cancel">
                  Cancel
                </AlertDialogClose>
                <AlertDialogClose class="review-action" data-testid="alert-dialog-confirm">
                  Confirm delete
                </AlertDialogClose>
              </div>
            </AlertDialogPopup>
          </AlertDialogViewport>
        </AlertDialogPortal>
      </AlertDialogRoot>
    </div>
    <div class="demo-row">
      <div>
        <p class="eyebrow">Uncontrolled lifecycle</p>
        <h3>Mounted-on-demand default-open Alert Dialog</h3>
      </div>
      <button
        class="review-action"
        type="button"
        data-testid="alert-dialog-default-toggle"
        @click="showDefaultOpen = !showDefaultOpen"
      >
        {{
          showDefaultOpen ? "Unmount default-open Alert Dialog" : "Mount default-open Alert Dialog"
        }}
      </button>
      <output data-testid="alert-dialog-default-state">
        {{ showDefaultOpen ? "mounted" : "unmounted" }}
      </output>
      <AlertDialogRoot
        v-if="showDefaultOpen"
        :default-open="true"
        data-testid="primitive-alert-dialog-default-open"
      >
        <AlertDialogTrigger class="review-action">Reopen default Alert Dialog</AlertDialogTrigger>
        <AlertDialogPortal
          :container="portalTarget ?? 'body'"
          data-testid="alert-dialog-default-portal"
        >
          <AlertDialogViewport>
            <AlertDialogBackdrop class="fixed inset-0 z-40 bg-black/60" />
            <AlertDialogPopup
              class="bg-background fixed top-1/2 left-1/2 z-50 w-96 -translate-x-1/2 -translate-y-1/2 rounded-lg border p-6 shadow-xl"
              data-testid="alert-dialog-default-popup"
            >
              <AlertDialogTitle class="font-heading text-xl">
                Default-open lifecycle
              </AlertDialogTitle>
              <AlertDialogDescription class="text-muted-foreground">
                This uncontrolled instance opens only when explicitly mounted.
              </AlertDialogDescription>
              <div class="mt-4 flex justify-end">
                <AlertDialogClose class="review-action" data-testid="alert-dialog-default-close">
                  Close default-open dialog
                </AlertDialogClose>
              </div>
            </AlertDialogPopup>
          </AlertDialogViewport>
        </AlertDialogPortal>
      </AlertDialogRoot>
    </div>
  </section>
</template>
