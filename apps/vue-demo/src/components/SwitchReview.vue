<script setup lang="ts">
import type { SwitchCheckedChangeDetails } from "@starwind-ui/vue/switch";
import { SwitchRoot, SwitchThumb } from "@starwind-ui/vue/switch";
import { ref } from "vue";

const controlledChecked = ref(false);
const canceledAttempts = ref(0);
const canceledUpdates = ref(0);
const formResult = ref("not submitted");
const cleanupMounted = ref(true);

function cancelChange(_checked: boolean, detail: SwitchCheckedChangeDetails): void {
  canceledAttempts.value += 1;
  detail.cancel();
}

function submitSwitchForm(event: Event): void {
  const form = event.currentTarget;
  if (!(form instanceof HTMLFormElement)) return;
  formResult.value = JSON.stringify(Object.fromEntries(new FormData(form)));
}
</script>

<template>
  <section id="switch-review" class="review-card" data-testid="switch-review">
    <div class="section-heading">
      <div>
        <p class="eyebrow">Models, cancellation, forms, keyboard, cleanup</p>
        <h2>Switch</h2>
      </div>
    </div>

    <div class="review-grid">
      <article class="scenario">
        <h3>Uncontrolled</h3>
        <SwitchRoot
          default-checked
          aria-label="Uncontrolled switch"
          class="primitive-switch"
          data-testid="switch-uncontrolled"
        >
          <SwitchThumb class="primitive-switch-thumb" />
        </SwitchRoot>
      </article>

      <article class="scenario">
        <h3>Controlled named model</h3>
        <SwitchRoot
          v-model:checked="controlledChecked"
          aria-label="Controlled switch"
          class="primitive-switch"
          data-testid="switch-controlled"
        >
          <SwitchThumb class="primitive-switch-thumb" />
        </SwitchRoot>
        <output data-testid="switch-controlled-state">checked: {{ controlledChecked }}</output>
      </article>

      <article class="scenario">
        <h3>Cancelable detailed change</h3>
        <SwitchRoot
          aria-label="Canceled switch"
          class="primitive-switch"
          data-testid="switch-canceled"
          @checked-change="cancelChange"
          @update:checked="canceledUpdates += 1"
        >
          <SwitchThumb class="primitive-switch-thumb" />
        </SwitchRoot>
        <output data-testid="switch-cancel-state">
          attempts: {{ canceledAttempts }}, updates: {{ canceledUpdates }}
        </output>
      </article>

      <article class="scenario">
        <h3>Unmount and remount cleanup</h3>
        <SwitchRoot
          v-if="cleanupMounted"
          aria-label="Cleanup switch"
          class="primitive-switch"
          data-testid="switch-cleanup-instance"
        >
          <SwitchThumb class="primitive-switch-thumb" />
        </SwitchRoot>
        <button
          type="button"
          class="review-action"
          data-testid="switch-cleanup-toggle"
          @click="cleanupMounted = !cleanupMounted"
        >
          {{ cleanupMounted ? "Unmount" : "Remount" }}
        </button>
      </article>
    </div>

    <form class="scenario" data-testid="switch-form" @submit.prevent="submitSwitchForm">
      <h3>Native form participation</h3>
      <label class="demo-row">
        <SwitchRoot
          default-checked
          name="notifications"
          unchecked-value="no"
          value="yes"
          aria-label="Notifications"
          class="primitive-switch"
          data-testid="switch-form-control"
        >
          <SwitchThumb class="primitive-switch-thumb" />
        </SwitchRoot>
        Notifications
      </label>
      <button type="submit" class="review-action" data-testid="switch-form-submit">
        Submit switch form
      </button>
      <output data-testid="switch-form-result">{{ formResult }}</output>
    </form>
  </section>
</template>
