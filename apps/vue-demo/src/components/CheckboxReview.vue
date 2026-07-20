<script setup lang="ts">
import type { CheckboxCheckedChangeDetails } from "@starwind-ui/vue/checkbox";
import { CheckboxIndicator, CheckboxRoot } from "@starwind-ui/vue/checkbox";
import { ref } from "vue";

const controlledChecked = ref(false);
const canceledAttempts = ref(0);
const canceledUpdates = ref(0);
const formResult = ref("not submitted");
const cleanupMounted = ref(true);

function cancelChange(_checked: boolean, detail: CheckboxCheckedChangeDetails): void {
  canceledAttempts.value += 1;
  detail.cancel();
}

function submitCheckboxForm(event: Event): void {
  const form = event.currentTarget;
  if (!(form instanceof HTMLFormElement)) return;
  formResult.value = JSON.stringify(Object.fromEntries(new FormData(form)));
}
</script>

<template>
  <section id="checkbox-review" class="review-card" data-testid="checkbox-review">
    <div class="section-heading">
      <div>
        <p class="eyebrow">Models, cancellation, forms, presence, cleanup</p>
        <h2>Checkbox</h2>
      </div>
    </div>

    <div class="review-grid">
      <article class="scenario">
        <h3>Uncontrolled and indicator presence</h3>
        <CheckboxRoot
          default-checked
          aria-label="Uncontrolled checkbox"
          class="primitive-checkbox"
          data-testid="checkbox-uncontrolled"
        >
          <CheckboxIndicator data-testid="checkbox-uncontrolled-indicator">✓</CheckboxIndicator>
        </CheckboxRoot>
        <p>
          Toggle the checkbox and verify the indicator mounts and hides through Runtime presence.
        </p>
      </article>

      <article class="scenario">
        <h3>Controlled named model</h3>
        <CheckboxRoot
          v-model:checked="controlledChecked"
          aria-label="Controlled checkbox"
          class="primitive-checkbox"
          data-testid="checkbox-controlled"
        >
          <CheckboxIndicator>✓</CheckboxIndicator>
        </CheckboxRoot>
        <output data-testid="checkbox-controlled-state">checked: {{ controlledChecked }}</output>
      </article>

      <article class="scenario">
        <h3>Cancelable detailed change</h3>
        <CheckboxRoot
          aria-label="Canceled checkbox"
          class="primitive-checkbox"
          data-testid="checkbox-canceled"
          @checked-change="cancelChange"
          @update:checked="canceledUpdates += 1"
        >
          <CheckboxIndicator>✓</CheckboxIndicator>
        </CheckboxRoot>
        <output data-testid="checkbox-cancel-state">
          attempts: {{ canceledAttempts }}, updates: {{ canceledUpdates }}
        </output>
      </article>

      <article class="scenario">
        <h3>Unmount and remount cleanup</h3>
        <CheckboxRoot
          v-if="cleanupMounted"
          aria-label="Cleanup checkbox"
          class="primitive-checkbox"
          data-testid="checkbox-cleanup-instance"
        >
          <CheckboxIndicator>✓</CheckboxIndicator>
        </CheckboxRoot>
        <button
          type="button"
          class="review-action"
          data-testid="checkbox-cleanup-toggle"
          @click="cleanupMounted = !cleanupMounted"
        >
          {{ cleanupMounted ? "Unmount" : "Remount" }}
        </button>
        <output data-testid="checkbox-cleanup-state">
          {{ cleanupMounted ? "mounted" : "unmounted" }}
        </output>
      </article>
    </div>

    <form class="scenario" data-testid="checkbox-form" @submit.prevent="submitCheckboxForm">
      <h3>Native form participation</h3>
      <label class="demo-row">
        <CheckboxRoot
          default-checked
          name="newsletter"
          unchecked-value="no"
          value="yes"
          aria-label="Newsletter"
          class="primitive-checkbox"
          data-testid="checkbox-form-control"
        >
          <CheckboxIndicator>✓</CheckboxIndicator>
        </CheckboxRoot>
        Newsletter
      </label>
      <button type="submit" class="review-action" data-testid="checkbox-form-submit">
        Submit checkbox form
      </button>
      <output data-testid="checkbox-form-result">{{ formResult }}</output>
    </form>
  </section>
</template>
