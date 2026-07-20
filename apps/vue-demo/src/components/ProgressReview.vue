<script setup lang="ts">
import * as ProgressPrimitive from "@starwind-ui/vue/progress";
import { ref } from "vue";

import Progress from "./starwind-runtime/progress/Progress.vue";

const variants = [
  "default",
  "primary",
  "secondary",
  "info",
  "success",
  "warning",
  "error",
] as const;
const controlledValue = ref(35);
const indeterminateValue = ref<number | null>(null);
const showRemount = ref(true);
const styledProgress = ref<InstanceType<typeof Progress> | null>(null);
</script>

<template>
  <section id="progress-review" class="review-card" data-testid="progress-review">
    <div class="section-heading">
      <div>
        <p class="eyebrow">Range and status</p>
        <h2>Progress</h2>
      </div>
      <output data-testid="progress-ref-state">
        ref: {{ styledProgress?.element?.tagName ?? "none" }}
      </output>
    </div>

    <div class="review-grid progress-review-grid">
      <article class="scenario">
        <h3>Primitive semantics</h3>
        <ProgressPrimitive.ProgressRoot
          aria-labelledby="primitive-progress-label"
          data-testid="progress-primitive-root"
          :value="42"
        >
          <ProgressPrimitive.ProgressLabel id="primitive-progress-label">
            Primitive upload
          </ProgressPrimitive.ProgressLabel>
          <ProgressPrimitive.ProgressTrack>
            <ProgressPrimitive.ProgressIndicator />
          </ProgressPrimitive.ProgressTrack>
          <ProgressPrimitive.ProgressValue data-testid="progress-primitive-value" />
        </ProgressPrimitive.ProgressRoot>
      </article>

      <article class="scenario">
        <h3>Controlled determinate</h3>
        <p id="controlled-progress-description" class="progress-label">Processed files</p>
        <Progress
          ref="styledProgress"
          aria-describedby="controlled-progress-description"
          class="review-progress"
          data-forwarded="progress"
          data-testid="progress-controlled"
          label="Processed files"
          :value="controlledValue"
          variant="primary"
        />
        <div class="demo-row progress-actions">
          <button
            class="review-action"
            data-testid="progress-increment"
            type="button"
            @click="controlledValue = Math.min(controlledValue + 15, 100)"
          >
            Increase
          </button>
          <output data-testid="progress-controlled-state">value: {{ controlledValue }}</output>
        </div>
      </article>

      <article class="scenario">
        <h3>Indeterminate transition</h3>
        <p class="progress-label">Background sync</p>
        <Progress
          class="review-progress"
          data-testid="progress-indeterminate"
          label="Background sync"
          :value="indeterminateValue"
          variant="info"
        />
        <button
          class="review-action"
          data-testid="progress-indeterminate-toggle"
          type="button"
          @click="indeterminateValue = indeterminateValue === null ? 60 : null"
        >
          Toggle state
        </button>
      </article>

      <article class="scenario">
        <h3>Custom range</h3>
        <p class="progress-label">Range 20 to 80</p>
        <Progress
          class="review-progress"
          data-testid="progress-range"
          label="Range 20 to 80"
          :max="80"
          :min="20"
          :value="50"
          variant="warning"
        />
      </article>

      <div class="sr-only" aria-hidden="true">
        <Progress data-testid="progress-reversed" :min="100" :max="0" :value="25" />
        <Progress data-testid="progress-equal-complete" :min="10" :max="10" :value="10" />
        <Progress data-testid="progress-equal-progressing" :min="10" :max="10" :value="9" />
        <Progress
          data-testid="progress-invalid-bounds"
          :min="Number.NaN"
          :max="Infinity"
          :value="25"
        />
        <Progress data-testid="progress-nan" :value="Number.NaN" />
        <Progress data-testid="progress-positive-infinity" :value="Infinity" />
        <Progress data-testid="progress-negative-infinity" :value="-Infinity" />
      </div>

      <article class="scenario progress-variants-scenario">
        <h3>Color variants and instances</h3>
        <div data-testid="progress-variants">
          <div v-for="(variant, index) in variants" :key="variant" class="progress-variant-row">
            <span>{{ variant }}</span>
            <Progress
              class="review-progress"
              :data-testid="`progress-variant-${variant}`"
              :label="`${variant} progress`"
              :value="20 + index * 10"
              :variant="variant"
            />
          </div>
        </div>
      </article>

      <article class="scenario">
        <h3>Mount and cleanup</h3>
        <Progress
          v-if="showRemount"
          class="review-progress"
          data-testid="progress-remount-instance"
          label="Remount progress"
          :value="70"
          variant="primary"
        />
        <button
          class="review-action"
          data-testid="progress-remount-toggle"
          type="button"
          @click="showRemount = !showRemount"
        >
          {{ showRemount ? "Unmount Progress" : "Remount Progress" }}
        </button>
      </article>
    </div>
  </section>
</template>
