<script setup lang="ts">
import { ref } from "vue";

import PrimitiveSelect, { type ReviewSelectItem } from "./PrimitiveSelect.vue";

const baseItems: ReviewSelectItem[] = [
  { label: "Apple", value: "apple" },
  { label: "Banana", value: "banana" },
];
const dynamicItems = ref<ReviewSelectItem[]>([...baseItems]);
const controlledValue = ref<string | null>("apple");
const controlledOpen = ref(false);
const selectFormResult = ref("not submitted");
const cleanupMounted = ref(true);

function addCherry(): void {
  if (!dynamicItems.value.some((item) => item.value === "cherry")) {
    dynamicItems.value.push({ label: "Cherry", value: "cherry" });
  }
}

function removeBanana(): void {
  dynamicItems.value = dynamicItems.value.filter((item) => item.value !== "banana");
}

function submitSelectForm(event: Event): void {
  const form = event.currentTarget;
  if (!(form instanceof HTMLFormElement)) return;
  selectFormResult.value = JSON.stringify(Object.fromEntries(new FormData(form)));
}
</script>

<template>
  <section id="select-review" class="review-card" data-testid="select-review">
    <div class="section-heading">
      <div>
        <p class="eyebrow">Models, cancellation, collections, forms, portals, cleanup</p>
        <h2>Select</h2>
      </div>
    </div>

    <div class="review-grid">
      <article class="scenario">
        <h3>Uncontrolled models and portal presence</h3>
        <PrimitiveSelect test-id="select-uncontrolled" default-value="apple" :items="baseItems" />
      </article>

      <article class="scenario">
        <h3>Controlled value and open models</h3>
        <PrimitiveSelect
          v-model="controlledValue"
          v-model:open="controlledOpen"
          test-id="select-controlled"
          :items="baseItems"
        />
        <output data-testid="select-controlled-parent-state">
          parent value={{ controlledValue }}, open={{ controlledOpen }}
        </output>
      </article>

      <article class="scenario">
        <h3>Cancelable open change</h3>
        <PrimitiveSelect test-id="select-cancel-open" cancel-open :items="baseItems" />
      </article>

      <article class="scenario">
        <h3>Cancelable value change</h3>
        <PrimitiveSelect
          test-id="select-cancel-value"
          cancel-value
          default-open
          default-value="apple"
          :items="baseItems"
        />
      </article>

      <article class="scenario">
        <h3>Dynamic collection</h3>
        <PrimitiveSelect test-id="select-dynamic" default-value="apple" :items="dynamicItems" />
        <div class="demo-row">
          <button
            type="button"
            class="review-action"
            data-testid="select-add-item"
            @click="addCherry"
          >
            Add Cherry
          </button>
          <button
            type="button"
            class="review-action"
            data-testid="select-remove-item"
            @click="removeBanana"
          >
            Remove Banana
          </button>
        </div>
      </article>

      <article class="scenario">
        <h3>Multiple isolated instances</h3>
        <PrimitiveSelect test-id="select-instance-one" default-value="apple" :items="baseItems" />
        <PrimitiveSelect test-id="select-instance-two" default-value="banana" :items="baseItems" />
      </article>

      <article class="scenario">
        <h3>Unmount and remount cleanup</h3>
        <PrimitiveSelect
          v-if="cleanupMounted"
          test-id="select-cleanup"
          default-value="apple"
          :items="baseItems"
        />
        <button
          type="button"
          class="review-action"
          data-testid="select-cleanup-toggle"
          @click="cleanupMounted = !cleanupMounted"
        >
          {{ cleanupMounted ? "Unmount" : "Remount" }}
        </button>
        <output data-testid="select-cleanup-state">
          {{ cleanupMounted ? "mounted" : "unmounted" }}
        </output>
      </article>
    </div>

    <form class="scenario" data-testid="select-form" @submit.prevent="submitSelectForm">
      <h3>Native form participation</h3>
      <PrimitiveSelect
        test-id="select-form-control"
        default-value="apple"
        name="fruit"
        :items="baseItems"
      />
      <button type="submit" class="review-action" data-testid="select-form-submit">
        Submit Select form
      </button>
      <output data-testid="select-form-result">{{ selectFormResult }}</output>
    </form>
  </section>
</template>
