<script setup lang="ts">
import { ref } from "vue";

import AvatarReview from "./AvatarReview.vue";
import ButtonReview from "./ButtonReview.vue";
import CheckboxReview from "./CheckboxReview.vue";
import ProgressReview from "./ProgressReview.vue";
import ScrollAreaReview from "./ScrollAreaReview.vue";
import SelectReview from "./SelectReview.vue";
import StyledReview from "./StyledReview.vue";
import ThemeToggle from "./starwind-runtime/theme-toggle/ThemeToggle.vue";

const secondaryToggle = ref<InstanceType<typeof ThemeToggle> | null>(null);
const showSecondaryToggle = ref(true);
const themeClickCount = ref(0);
</script>

<template>
  <main class="review-shell" data-testid="vue-review-route">
    <header class="review-hero">
      <p class="eyebrow">Internal, non-shipping checkpoint</p>
      <h1>Starwind Vue adapter review</h1>
      <p>
        Primitive and generated Styled output for the verified Vue 3.5 vertical slice plus Theme,
        Avatar, Progress, and Scroll Area cohort.
      </p>
      <nav aria-label="Review sections">
        <a href="#button-review">Button</a>
        <a href="#avatar-review">Avatar</a>
        <a href="#checkbox-review">Checkbox</a>
        <a href="#progress-review">Progress</a>
        <a href="#scroll-area-review">Scroll Area</a>
        <a href="#select-review">Select</a>
        <a href="#styled-review">Styled</a>
      </nav>
    </header>

    <section class="review-card" data-testid="theme-toggle-review">
      <div class="section-heading">
        <div>
          <p class="eyebrow">Persistent document controller</p>
          <h2>Theme Toggle</h2>
        </div>
        <output data-testid="theme-toggle-click-count">clicks: {{ themeClickCount }}</output>
      </div>
      <div class="demo-row">
        <ThemeToggle
          v-if="showSecondaryToggle"
          id="review-theme-toggle"
          ref="secondaryToggle"
          aria-label="Toggle review theme"
          class="review-theme-toggle"
          data-forwarded="theme-toggle"
          data-testid="review-theme-toggle"
          @click="themeClickCount += 1"
        >
          <template #light-icon
            ><span
              class="hidden group-data-[state=off]:data-ready:inline"
              aria-hidden="true"
              data-custom-light-icon
              data-theme-icon
              >☀</span
            ></template
          >
          <template #dark-icon
            ><span
              class="hidden group-data-[state=on]:data-ready:inline"
              aria-hidden="true"
              data-custom-dark-icon
              data-theme-icon
              >☾</span
            ></template
          >
        </ThemeToggle>
        <button
          class="review-action"
          data-testid="theme-toggle-remount"
          type="button"
          @click="showSecondaryToggle = !showSecondaryToggle"
        >
          {{ showSecondaryToggle ? "Unmount review toggle" : "Remount review toggle" }}
        </button>
        <output data-testid="theme-toggle-ref-tag">
          ref: {{ secondaryToggle?.element?.tagName ?? "none" }}
        </output>
      </div>
    </section>

    <ButtonReview />
    <AvatarReview />
    <CheckboxReview />
    <ProgressReview />
    <ScrollAreaReview />
    <SelectReview />
    <StyledReview />
  </main>
</template>
