<script setup lang="ts">
import { ref } from "vue";

import type { RadioGroupValueChangeDetails } from "@starwind-ui/vue/radio-group";
import { RadioGroupRoot } from "@starwind-ui/vue/radio-group";
import { RadioIndicator, RadioRoot } from "@starwind-ui/vue/radio";

const value = ref("alpha");
const cancelNext = ref(false);
const showGamma = ref(false);
const changeCount = ref(0);

function handleValueChange(_value: string, detail: RadioGroupValueChangeDetails): void {
  changeCount.value += 1;
  if (cancelNext.value) {
    detail.cancel();
    cancelNext.value = false;
  }
}
</script>

<template>
  <section id="radio-group-review" class="review-card" data-testid="radio-group-review">
    <div class="section-heading">
      <div>
        <p class="eyebrow">Exclusive selection and Runtime-owned navigation</p>
        <h2>Radio Group</h2>
      </div>
      <output data-testid="radio-group-state">
        value: {{ value }}, changes: {{ changeCount }}
      </output>
    </div>

    <form id="radio-review-form" class="scenario">
      <RadioGroupRoot
        v-model="value"
        aria-label="Primitive choices"
        form="radio-review-form"
        name="primitive-choice"
        orientation="horizontal"
        required
        data-testid="primitive-radio-group"
        @value-change="handleValueChange"
      >
        <RadioRoot
          v-for="option in ['alpha', 'beta', ...(showGamma ? ['gamma'] : [])]"
          :key="option"
          :value="option"
          class="review-action"
          :data-testid="`primitive-radio-${option}`"
        >
          <RadioIndicator aria-hidden="true">●</RadioIndicator>
          {{ option }}
        </RadioRoot>
      </RadioGroupRoot>
    </form>

    <div class="demo-row">
      <button class="review-action" type="button" @click="cancelNext = true">
        Cancel next selection
      </button>
      <button class="review-action" type="button" @click="showGamma = !showGamma">
        {{ showGamma ? "Remove gamma" : "Add gamma" }}
      </button>
      <button class="review-action" form="radio-review-form" type="reset">Reset</button>
    </div>
  </section>
</template>
