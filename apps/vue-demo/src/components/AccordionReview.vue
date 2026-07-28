<script setup lang="ts">
import { ref } from "vue";

import type { AccordionValue, AccordionValueChangeDetails } from "@starwind-ui/vue/accordion";
import {
  AccordionHeader,
  AccordionItem,
  AccordionPanel,
  AccordionRoot,
  AccordionTrigger,
} from "@starwind-ui/vue/accordion";
import {
  Accordion as StyledAccordion,
  AccordionContent as StyledAccordionContent,
  AccordionItem as StyledAccordionItem,
  AccordionTrigger as StyledAccordionTrigger,
} from "./starwind-runtime/accordion";

const controlledValue = ref<AccordionValue>("alpha");
const cancelNext = ref(true);
const items = ref(["alpha", "beta"]);
const show = ref(true);
const proposals = ref<string[]>([]);

function handleValueChange(value: AccordionValue, detail: AccordionValueChangeDetails): void {
  proposals.value.push(`${String(value)}:${cancelNext.value ? "canceled" : "accepted"}`);
  if (cancelNext.value) detail.cancel();
}
</script>

<template>
  <section id="accordion-review" class="review-card" data-testid="accordion-review">
    <div class="section-heading">
      <div>
        <p class="eyebrow">Repeated disclosure, cancellation, dynamic items, and presence</p>
        <h2>Accordion</h2>
      </div>
    </div>

    <div class="scenario">
      <h3>Default multiple value and dynamic items</h3>
      <AccordionRoot type="multiple" :default-value="['alpha']">
        <AccordionItem v-for="item in items" :key="item" :value="item">
          <AccordionHeader>
            <AccordionTrigger :data-testid="`accordion-dynamic-${item}`">
              {{ item }}
            </AccordionTrigger>
          </AccordionHeader>
          <AccordionPanel :data-testid="`accordion-dynamic-panel-${item}`">
            Runtime-owned presence for {{ item }}
          </AccordionPanel>
        </AccordionItem>
      </AccordionRoot>
      <button
        class="review-action"
        data-testid="accordion-add-item"
        type="button"
        @click="items.push(`item-${items.length + 1}`)"
      >
        Add item
      </button>
    </div>

    <div class="scenario">
      <h3>Controlled, cancelable, form-adjacent value</h3>
      <input name="accordion-review-value" type="hidden" :value="String(controlledValue)" />
      <AccordionRoot
        v-model="controlledValue"
        data-testid="accordion-controlled"
        @value-change="handleValueChange"
      >
        <AccordionItem value="alpha">
          <AccordionTrigger>Alpha</AccordionTrigger>
          <AccordionPanel>Alpha content</AccordionPanel>
        </AccordionItem>
        <AccordionItem value="beta">
          <AccordionTrigger data-testid="accordion-controlled-beta">Beta</AccordionTrigger>
          <AccordionPanel>Beta content</AccordionPanel>
        </AccordionItem>
      </AccordionRoot>
      <button
        class="review-action"
        data-testid="accordion-cancel-toggle"
        type="button"
        @click="cancelNext = !cancelNext"
      >
        {{ cancelNext ? "Accept next proposal" : "Cancel next proposal" }}
      </button>
      <output data-testid="accordion-controlled-state">
        value={{ String(controlledValue) }}, proposals={{ proposals.join(",") }}
      </output>
    </div>

    <div class="scenario">
      <h3>Styled composition and remount cleanup</h3>
      <StyledAccordion v-if="show" default-value="styled">
        <StyledAccordionItem value="styled">
          <StyledAccordionTrigger data-testid="styled-accordion-trigger">
            Styled trigger
          </StyledAccordionTrigger>
          <StyledAccordionContent data-testid="styled-accordion-content">
            Styled content
          </StyledAccordionContent>
        </StyledAccordionItem>
      </StyledAccordion>
      <button
        class="review-action"
        data-testid="accordion-remount"
        type="button"
        @click="show = !show"
      >
        {{ show ? "Unmount Accordion" : "Remount Accordion" }}
      </button>
    </div>
  </section>
</template>
