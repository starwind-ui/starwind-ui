<script setup lang="ts">
import { computed, type ComponentPublicInstance, ref, useTemplateRef } from "vue";

import type { ToggleGroupValueChangeDetails } from "@starwind-ui/vue/toggle-group";
import { ToggleGroupRoot } from "@starwind-ui/vue/toggle-group";
import { ToggleRoot } from "@starwind-ui/vue/toggle";

const singleValue = ref(["left"]);
const multipleValue = ref(["bold"]);
const cancelNext = ref(false);
const showUnderline = ref(false);
const changeCount = ref(0);
const singleEntries = ref(["left", "center", "right"]);
const loopFocus = ref(false);
const nativeClickCount = ref(0);
const detailPublication = ref({ current: ["left"], previous: [] as string[] });
const singleGroupRef = useTemplateRef<
  { element?: HTMLDivElement | null } & ComponentPublicInstance
>("singleGroupRef");
const leftItemRef = ref<({ element?: HTMLElement | null } & ComponentPublicInstance) | null>(null);
const exposedRefState = computed(
  () =>
    `${singleGroupRef.value?.element?.tagName ?? "-"}/${leftItemRef.value?.element?.tagName ?? "-"}`,
);

function handleSingleChange(value: string[], detail: ToggleGroupValueChangeDetails): void {
  changeCount.value += 1;
  detailPublication.value = {
    current: [...value],
    previous: [...detail.previousValue],
  };
  if (cancelNext.value) {
    detail.cancel();
    cancelNext.value = false;
  }
}

function setLeftElement(value: Element | ComponentPublicInstance | null): void {
  const exposed = value as ({ element?: HTMLElement | null } & ComponentPublicInstance) | null;
  leftItemRef.value = exposed;
}

function reorderSingleEntries(): void {
  singleEntries.value = [...singleEntries.value].reverse();
}
</script>

<template>
  <section id="toggle-group-review" class="review-card" data-testid="toggle-group-review">
    <div class="section-heading">
      <div>
        <p class="eyebrow">Array models and Runtime-owned roving focus</p>
        <h2>Toggle Group</h2>
      </div>
      <output data-testid="toggle-group-state">
        single: {{ JSON.stringify(singleValue) }}, changes: {{ changeCount }}
      </output>
    </div>

    <div class="scenario-grid">
      <article class="scenario">
        <h3>Single selection</h3>
        <ToggleGroupRoot
          ref="singleGroupRef"
          v-model="singleValue"
          aria-label="Text alignment"
          class="demo-row"
          data-consumer="forwarded"
          data-testid="toggle-group-single"
          :loop-focus="loopFocus"
          title="Primitive Toggle Group"
          @click="nativeClickCount += 1"
          @value-change="handleSingleChange"
        >
          <ToggleRoot
            v-for="option in singleEntries"
            :key="option"
            :ref="option === 'left' ? setLeftElement : undefined"
            :value="option"
            class="review-action"
            :data-testid="`toggle-group-single-${option}`"
          >
            {{ option }}
          </ToggleRoot>
        </ToggleGroupRoot>
        <button class="review-action" type="button" @click="cancelNext = true">
          Cancel next selection
        </button>
        <button
          class="review-action"
          data-testid="toggle-group-reorder"
          type="button"
          @click="reorderSingleEntries"
        >
          Reverse items
        </button>
        <button
          class="review-action"
          data-testid="toggle-group-loop"
          type="button"
          @click="loopFocus = !loopFocus"
        >
          loopFocus: {{ loopFocus }}
        </button>
        <output data-testid="toggle-group-detail-state">
          previous={{ JSON.stringify(detailPublication.previous) }}, current={{
            JSON.stringify(detailPublication.current)
          }}
        </output>
        <output data-testid="toggle-group-public-state">
          clicks={{ nativeClickCount }}, refs={{ exposedRefState }}
        </output>
      </article>

      <article class="scenario">
        <h3>Multiple and dynamic membership</h3>
        <ToggleGroupRoot
          v-model="multipleValue"
          aria-label="Text formatting"
          class="demo-row"
          multiple
          orientation="vertical"
          data-testid="toggle-group-multiple"
        >
          <ToggleRoot class="review-action" value="bold">Bold</ToggleRoot>
          <ToggleRoot class="review-action" value="italic">Italic</ToggleRoot>
          <ToggleRoot v-if="showUnderline" class="review-action" value="underline">
            Underline
          </ToggleRoot>
        </ToggleGroupRoot>
        <output data-testid="toggle-group-multiple-state">
          multiple: {{ JSON.stringify(multipleValue) }}
        </output>
        <button class="review-action" type="button" @click="showUnderline = !showUnderline">
          {{ showUnderline ? "Remove underline" : "Add underline" }}
        </button>
      </article>
    </div>
  </section>
</template>
