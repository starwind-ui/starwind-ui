<script setup lang="ts">
import { computed } from "vue";

import { type ChartGalleryType, chartGallery, chartGalleryTypes } from "../chart/chart-catalog";
import ChartGalleryCard from "./ChartGalleryCard.vue";

const props = defineProps<{ type: ChartGalleryType }>();

const entries = computed(() => chartGallery[props.type]);
const label = computed(
  () => chartGalleryTypes.find((item) => item.type === props.type)?.label ?? props.type,
);
// shadcn fills a 12-slot grid and shows the empty slots as dashed boxes on wide screens.
const slots = computed(() =>
  Array.from({ length: Math.max(12, entries.value.length) }, (_, index) => entries.value[index]),
);
</script>

<template>
  <div class="space-y-6" :data-chart-gallery="type">
    <nav class="flex flex-wrap items-center" aria-label="Chart types">
      <a
        v-for="item in chartGalleryTypes"
        :key="item.type"
        :href="`/review/charts/${item.type}`"
        class="text-muted-foreground hover:text-primary data-[active=true]:text-primary flex h-7 shrink-0 items-center justify-center px-4 text-center text-base font-medium transition-colors"
        :data-active="item.type === type ? 'true' : 'false'"
        :aria-current="item.type === type ? 'page' : undefined"
        :data-chart-gallery-nav="item.type"
      >
        {{ item.label }}
      </a>
    </nav>

    <h2 class="sr-only">{{ label }}</h2>
    <p v-if="entries.length === 0" class="text-muted-foreground text-sm" data-chart-gallery-empty>
      This view has no charts yet.
    </p>
    <div
      class="grid flex-1 scroll-mt-20 items-stretch gap-10 md:grid-cols-2 md:gap-6 lg:grid-cols-3 xl:gap-10"
      data-chart-gallery-grid
    >
      <template v-for="(entry, index) in slots" :key="entry?.id ?? `empty-${index}`">
        <ChartGalleryCard v-if="entry" :entry="entry" />
        <div v-else class="hidden aspect-square w-full rounded-lg border border-dashed xl:block" />
      </template>
    </div>
  </div>
</template>
