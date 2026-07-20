<script setup lang="ts">
import { ButtonRoot } from "@starwind-ui/vue/button";
import { computed, ref, type ComponentPublicInstance } from "vue";

import { Button as StyledButton } from "./starwind-runtime/button";

type ButtonExposed = ComponentPublicInstance & { element: HTMLButtonElement | null };

const primitiveRef = ref<ButtonExposed | null>(null);
const clickCount = ref(0);
const slotLabel = ref("Primitive slot content");
const refTag = computed(() => primitiveRef.value?.element?.tagName ?? "unmounted");
</script>

<template>
  <section id="button-review" class="review-card" data-testid="button-review">
    <div class="section-heading">
      <div>
        <p class="eyebrow">Semantic element, attrs, listeners, slots, refs</p>
        <h2>Button</h2>
      </div>
      <output data-testid="button-ref-tag">ref: {{ refTag }}</output>
    </div>

    <div class="demo-row">
      <ButtonRoot
        id="vue-primitive-button"
        ref="primitiveRef"
        class="primitive-control"
        aria-label="Run primitive Button review"
        data-review-attr="forwarded"
        data-testid="button-primitive"
        @click="clickCount += 1"
      >
        <span data-testid="button-slot">{{ slotLabel }}</span>
      </ButtonRoot>
      <button type="button" class="review-action" @click="slotLabel = 'Updated slot content'">
        Update slot
      </button>
      <output data-testid="button-click-count">clicks: {{ clickCount }}</output>
    </div>

    <div class="demo-row" aria-label="Styled Button element selection and variants">
      <StyledButton data-testid="button-styled-primary" variant="primary">Primary</StyledButton>
      <StyledButton data-testid="button-styled-outline" variant="outline">Outline</StyledButton>
      <StyledButton as="a" href="#styled-review" data-testid="button-styled-anchor" variant="ghost">
        Anchor element
      </StyledButton>
    </div>
  </section>
</template>
