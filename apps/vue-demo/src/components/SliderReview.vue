<script setup lang="ts">
import * as SliderPrimitive from "@starwind-ui/vue/slider";
import { ref } from "vue";

import { Slider } from "./starwind-runtime/slider";

const value = ref<number | number[]>(35);
const range = ref<number | number[]>([20, 80]);
const cancelNext = ref(false);
const show = ref(true);

function handleChange(
  _value: import("@starwind-ui/vue/slider").SliderValue,
  detail: import("@starwind-ui/vue/slider").SliderValueChangeDetails,
): void {
  if (cancelNext.value) {
    detail.cancel();
    cancelNext.value = false;
  }
}
</script>

<template>
  <section id="slider-review" class="review-card" data-testid="slider-review">
    <div class="section-heading">
      <div>
        <p class="eyebrow">Range control, form bridge, and dynamic thumbs</p>
        <h2>Slider</h2>
      </div>
    </div>

    <div class="review-grid">
      <article class="scenario">
        <h3>Primitive controlled and cancelable</h3>
        <SliderPrimitive.SliderRoot v-model="value" name="volume" @value-change="handleChange">
          <SliderPrimitive.SliderLabel>Volume</SliderPrimitive.SliderLabel>
          <SliderPrimitive.SliderControl class="review-slider-control">
            <SliderPrimitive.SliderTrack>
              <SliderPrimitive.SliderIndicator />
            </SliderPrimitive.SliderTrack>
            <SliderPrimitive.SliderThumb :index="0" />
          </SliderPrimitive.SliderControl>
        </SliderPrimitive.SliderRoot>
        <output data-testid="slider-value">{{ JSON.stringify(value) }}</output>
        <button class="review-action" type="button" @click="cancelNext = true">
          Cancel next change
        </button>
      </article>

      <article class="scenario">
        <h3>Styled multiple thumbs</h3>
        <Slider
          v-if="show"
          v-model="range"
          class="review-slider"
          data-testid="styled-slider"
          name="price"
          variant="primary"
        />
        <output data-testid="slider-range-value">{{ JSON.stringify(range) }}</output>
        <button
          class="review-action"
          type="button"
          @click="range = Array.isArray(range) && range.length === 2 ? [20, 50, 80] : [20, 80]"
        >
          Toggle thumb count
        </button>
        <button class="review-action" type="button" @click="show = !show">
          {{ show ? "Unmount Slider" : "Remount Slider" }}
        </button>
      </article>

      <article class="scenario">
        <h3>Vertical</h3>
        <Slider
          class="review-slider review-slider-vertical"
          :default-value="60"
          orientation="vertical"
          variant="secondary"
        />
      </article>
    </div>
  </section>
</template>
