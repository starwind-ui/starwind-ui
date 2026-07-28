<script setup lang="ts">
import { InputRoot } from "@starwind-ui/vue/input";
import { ref } from "vue";

const controlledValue = ref("Vue");
const formResult = ref("not submitted");
const mounted = ref(true);

function submitInputForm(event: Event): void {
  const form = event.currentTarget;
  if (!(form instanceof HTMLFormElement)) return;
  formResult.value = JSON.stringify(Object.fromEntries(new FormData(form)));
}
</script>

<template>
  <section id="input-review" class="review-card" data-testid="input-review">
    <div class="section-heading">
      <div>
        <p class="eyebrow">Native models, forms, reset, attrs, and cleanup</p>
        <h2>Input</h2>
      </div>
    </div>

    <div class="review-grid">
      <article class="scenario">
        <h3>Default model</h3>
        <InputRoot
          v-model="controlledValue"
          aria-label="Controlled input"
          class="review-input"
          data-testid="input-controlled"
        />
        <output data-testid="input-controlled-state">value: {{ controlledValue }}</output>
      </article>

      <article class="scenario">
        <h3>Unmount and remount cleanup</h3>
        <InputRoot
          v-if="mounted"
          default-value="remount me"
          aria-label="Cleanup input"
          class="review-input"
          data-testid="input-cleanup-instance"
        />
        <button
          type="button"
          class="review-action"
          data-testid="input-cleanup-toggle"
          @click="mounted = !mounted"
        >
          {{ mounted ? "Unmount" : "Remount" }}
        </button>
      </article>
    </div>

    <form class="scenario" data-testid="input-form" @submit.prevent="submitInputForm">
      <h3>Native form participation</h3>
      <label>
        Search
        <InputRoot
          default-value="initial query"
          class="review-input"
          data-testid="input-form-control"
          name="query"
          required
        />
      </label>
      <div class="demo-row">
        <button type="reset" class="review-action" data-testid="input-form-reset">Reset</button>
        <button type="submit" class="review-action" data-testid="input-form-submit">Submit</button>
      </div>
      <output data-testid="input-form-result">{{ formResult }}</output>
    </form>
  </section>
</template>
