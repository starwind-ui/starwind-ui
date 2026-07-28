<script setup lang="ts">
import type { TogglePressedChangeDetails } from "@starwind-ui/vue/toggle";
import { ToggleRoot } from "@starwind-ui/vue/toggle";
import { ref } from "vue";

const controlledPressed = ref(false);
const cancelCount = ref(0);
const showCleanupToggle = ref(true);

function cancelPressedChange(_pressed: boolean, detail: TogglePressedChangeDetails): void {
  cancelCount.value += 1;
  detail.cancel();
}
</script>

<template>
  <section id="toggle-review" class="review-card" data-testid="toggle-review">
    <div class="section-heading">
      <div>
        <p class="eyebrow">Single boolean Runtime control</p>
        <h2>Toggle</h2>
      </div>
    </div>

    <div class="scenario-grid">
      <article class="scenario">
        <h3>Uncontrolled native button</h3>
        <ToggleRoot
          aria-label="Pin message"
          class="review-action"
          data-testid="toggle-uncontrolled"
        >
          Pin message
        </ToggleRoot>
      </article>

      <article class="scenario">
        <h3>Controlled pressed model</h3>
        <ToggleRoot
          v-model:pressed="controlledPressed"
          aria-label="Controlled pin"
          class="review-action"
          data-testid="toggle-controlled"
        >
          Controlled pin
        </ToggleRoot>
        <output data-testid="toggle-controlled-state"> pressed: {{ controlledPressed }} </output>
      </article>

      <article class="scenario">
        <h3>Cancelable detail</h3>
        <ToggleRoot
          aria-label="Canceled pin"
          class="review-action"
          data-testid="toggle-canceled"
          @pressed-change="cancelPressedChange"
        >
          Cancel this change
        </ToggleRoot>
        <output data-testid="toggle-cancel-state">canceled: {{ cancelCount }}</output>
      </article>

      <article class="scenario">
        <h3>Synchronized peers</h3>
        <div class="demo-row">
          <ToggleRoot
            class="review-action"
            data-testid="toggle-sync-alpha"
            sync-group="review-pins"
            value="alpha"
          >
            Alpha
          </ToggleRoot>
          <ToggleRoot
            :native-button="false"
            class="review-action"
            data-testid="toggle-sync-beta"
            sync-group="review-pins"
            value="beta"
          >
            Beta span
          </ToggleRoot>
        </div>
      </article>

      <article class="scenario">
        <h3>Lifecycle cleanup</h3>
        <ToggleRoot
          v-if="showCleanupToggle"
          class="review-action"
          data-testid="toggle-cleanup-instance"
        >
          Cleanup target
        </ToggleRoot>
        <button
          class="review-action"
          data-testid="toggle-cleanup-toggle"
          type="button"
          @click="showCleanupToggle = !showCleanupToggle"
        >
          {{ showCleanupToggle ? "Unmount Toggle" : "Remount Toggle" }}
        </button>
      </article>
    </div>
  </section>
</template>
