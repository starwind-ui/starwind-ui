<script setup lang="ts">
import { computed, h, ref } from "vue";

import {
  type ChartGalleryEntry,
  type ChartGalleryTooltipRow,
  chartGalleryRows,
  chartGalleryTooltipClasses,
  trendingUpIcon,
} from "../chart/chart-catalog";
import {
  ChartContainer,
  ChartLegend,
  ChartTooltip,
  ChartTooltipContent,
} from "../starwind-runtime/chart";

const props = defineProps<{ entry: ChartGalleryEntry }>();

const control = computed(() => props.entry.control);
const range = ref(
  control.value?.kind === "range" || control.value?.kind === "active"
    ? control.value.initial
    : undefined,
);
const series = ref(control.value?.kind === "series" ? control.value.initial : undefined);
const data = computed(() => chartGalleryRows(props.entry, range.value));
const visible = computed(() => (series.value ? [series.value] : undefined));

/** A formatted tooltip row from the catalog, as Vue VNodes. */
function tooltipRow(row: ChartGalleryTooltipRow) {
  const classes = chartGalleryTooltipClasses;
  const amount = (value: string) =>
    h("div", { class: classes.value }, [value, h("span", { class: classes.unit }, row.unit)]);
  if (row.kind === "unit")
    return h("div", { class: classes.unitRow }, [row.name, amount(row.value)]);
  return h("div", { class: classes.swatchRow }, [
    h("div", { class: classes.swatch, style: { background: `var(--sw-chart-color-${row.key})` } }),
    row.name,
    amount(row.value),
    row.total !== undefined
      ? h("div", { class: classes.total }, ["Total", amount(row.total)])
      : null,
  ]);
}

/** shadcn's formatter props on a tooltip content, from the catalog format. */
const formatter = computed(() => {
  const row = props.entry.format?.row;
  return row
    ? (value: unknown, name: string, item: unknown, index: number) =>
        tooltipRow(row(value, name, item as never, index))
    : undefined;
});
const labelFormatter = computed(() => {
  const label = props.entry.format?.label;
  return label ? (value: unknown) => label(value) : undefined;
});
</script>

<template>
  <div
    :class="[
      'bg-card text-card-foreground flex min-w-0 flex-col gap-6 rounded-xl border shadow-sm',
      control?.kind === 'range' ? 'pb-6' : control?.kind === 'series' ? '' : 'py-6',
      entry.fullWidth && 'md:col-span-2 lg:col-span-3',
    ]"
    :data-chart-gallery-card="entry.id"
  >
    <div
      v-if="control?.kind === 'range'"
      class="flex items-center gap-2 border-b px-6 py-5 sm:flex-row"
    >
      <div class="grid flex-1 gap-1">
        <h3 class="leading-none font-semibold">{{ entry.title }}</h3>
        <p class="text-muted-foreground text-sm">{{ entry.description }}</p>
      </div>
      <select
        v-model="range"
        class="border-input dark:bg-input/30 focus-visible:border-outline focus-visible:ring-outline/50 hidden h-9 w-[160px] rounded-lg border bg-transparent px-3 text-sm shadow-xs outline-none focus-visible:ring-[3px] sm:ml-auto sm:flex"
        :aria-label="control.label"
        data-chart-gallery-range
      >
        <option v-for="option in control.options" :key="option.value" :value="option.value">
          {{ option.label }}
        </option>
      </select>
    </div>
    <div
      v-else-if="control?.kind === 'series'"
      class="flex flex-col items-stretch border-b sm:flex-row"
    >
      <div class="flex flex-1 flex-col justify-center gap-1 px-6 pt-4 pb-3 sm:py-0">
        <h3 class="leading-none font-semibold">{{ entry.title }}</h3>
        <p class="text-muted-foreground text-sm">{{ entry.description }}</p>
      </div>
      <div class="flex">
        <button
          v-for="option in control.options"
          :key="option.key"
          type="button"
          class="data-[active=true]:bg-muted/50 relative z-30 flex flex-1 flex-col justify-center gap-1 border-t px-6 py-4 text-left even:border-l sm:border-t-0 sm:border-l sm:px-8 sm:py-6"
          :data-active="option.key === series ? 'true' : 'false'"
          :aria-pressed="option.key === series"
          :data-chart-gallery-series="option.key"
          @click="series = option.key"
        >
          <span class="text-muted-foreground text-xs">{{ option.label }}</span>
          <span class="text-lg leading-none font-bold sm:text-3xl">{{ option.total }}</span>
        </button>
      </div>
    </div>
    <div v-else-if="control?.kind === 'active'" class="flex items-start gap-2 px-6">
      <div class="grid gap-1">
        <h3 class="leading-none font-semibold">{{ entry.title }}</h3>
        <p class="text-muted-foreground text-sm">{{ entry.description }}</p>
      </div>
      <select
        v-model="range"
        class="border-input dark:bg-input/30 focus-visible:border-outline focus-visible:ring-outline/50 ml-auto h-7 w-[130px] rounded-lg border bg-transparent py-0 pr-2 pl-2.5 text-xs shadow-xs outline-none focus-visible:ring-[3px]"
        :aria-label="control.label"
        data-chart-gallery-active
      >
        <option v-for="option in control.options" :key="option.value" :value="option.value">
          {{ option.label }}
        </option>
      </select>
    </div>
    <div v-else class="grid gap-2 px-6">
      <h3 class="leading-none font-semibold">{{ entry.title }}</h3>
      <p class="text-muted-foreground text-sm">{{ entry.description }}</p>
    </div>

    <div
      :class="[
        'px-6',
        control?.kind === 'series' && 'px-2 sm:p-6',
        entry.square && 'flex flex-1 items-center',
      ]"
    >
      <div
        :class="[entry.square && 'mx-auto w-full']"
        :style="entry.square ? { maxWidth: `${entry.square}px` } : undefined"
      >
        <ChartContainer
          :id="entry.id"
          :chart="entry.chart"
          :config="entry.config"
          :data="data"
          :visible="visible"
          :tooltip="entry.tooltip"
        >
          <ChartTooltip v-if="entry.format">
            <template #content>
              <ChartTooltipContent :formatter="formatter" :label-formatter="labelFormatter" />
            </template>
          </ChartTooltip>
          <ChartLegend v-if="entry.legend" />
        </ChartContainer>
      </div>
    </div>

    <div
      v-if="entry.footer"
      :class="['flex flex-col gap-2 px-6 text-sm', entry.square ? 'items-center' : 'items-start']"
    >
      <div class="flex items-center gap-2 leading-none font-medium">
        {{ entry.footer.trend }}
        <svg
          class="size-4"
          :viewBox="trendingUpIcon.viewBox"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
          stroke-linecap="round"
          stroke-linejoin="round"
          aria-hidden="true"
        >
          <path v-for="path in trendingUpIcon.paths" :key="path" :d="path" />
        </svg>
      </div>
      <div class="text-muted-foreground leading-none">{{ entry.footer.detail }}</div>
    </div>
  </div>
</template>
