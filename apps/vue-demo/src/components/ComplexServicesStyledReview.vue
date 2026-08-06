<script setup lang="ts">
import { computed, ref } from "vue";
import { toast } from "@starwind-ui/vue/toast";
import type { ColorPickerFormat, ColorPickerValue } from "@starwind-ui/vue/color-picker";

import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
  type CarouselProps,
} from "./starwind-runtime/carousel";
import { ColorPicker } from "./starwind-runtime/color-picker";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarTrigger,
} from "./starwind-runtime/sidebar";
import { Toaster } from "./starwind-runtime/toast";

type CarouselApi = Parameters<NonNullable<CarouselProps["setApi"]>>[0];

const carouselItems = ref(["Alpha", "Beta", "Gamma"]);
const carouselMounted = ref(true);
const carouselApi = ref<CarouselApi | null>(null);
const sidebarOpen = ref(true);
const sidebarMobileOpen = ref(false);
const sidebarMounted = ref(true);
const sidebarProvider = ref<InstanceType<typeof SidebarProvider> | null>(null);
const colorValue = ref<ColorPickerValue>("#2563eb");
const colorFormat = ref<ColorPickerFormat>("hex");
const colorOpen = ref(false);
const colorMounted = ref(true);
const colorPicker = ref<InstanceType<typeof ColorPicker> | null>(null);
const colorEvents = ref<string[]>([]);
const colorFormResult = ref("not submitted");
const uncontrolledColorLabel = ref("Uncontrolled format A");
const toasterMounted = ref(true);
const toaster = ref<InstanceType<typeof Toaster> | null>(null);
const secondaryToasterMounted = ref(true);
const toastCount = ref(0);

const carouselApiState = computed(() => (carouselApi.value ? "ready" : "pending"));

function captureCarouselApi(api: CarouselApi): void {
  carouselApi.value = api;
}

function addCarouselItem(): void {
  carouselItems.value.push(`Item ${carouselItems.value.length + 1}`);
}

function updateColor(value: ColorPickerValue): void {
  if (value) colorValue.value = value;
  colorEvents.value.push(`value:${value?.toString() ?? "empty"}`);
}

function submitColorForm(event: Event): void {
  const form = event.currentTarget;
  if (!(form instanceof HTMLFormElement)) return;
  colorFormResult.value = JSON.stringify(Object.fromEntries(new FormData(form)));
}

function showToast(variant: "success" | "error" | "warning" | "info"): void {
  toastCount.value += 1;
  toast[variant](`Vue ${variant} ${toastCount.value}`, {
    description: "Generated Styled Toast service review",
  });
}

function showPromiseToast(): void {
  void toast.promise(Promise.resolve("complete"), {
    loading: "Saving Vue review",
    success: (value) => `Saved: ${value}`,
    error: "Save failed",
  });
}
</script>

<template>
  <section class="review-card" data-testid="styled-complex-services-review">
    <div class="section-heading">
      <div>
        <p class="eyebrow">Generated Styled complex services</p>
        <h2>Carousel, Sidebar, Color Picker, and Toast</h2>
      </div>
    </div>

    <div class="review-grid">
      <article id="styled-carousel-review" class="scenario" data-testid="styled-carousel-review">
        <h3>Carousel API, dynamic items, instances, and cleanup</h3>
        <Carousel
          v-if="carouselMounted"
          ref="carousel"
          class="max-w-md"
          :opts="{ loop: true }"
          :set-api="captureCarouselApi"
          data-testid="styled-carousel-controlled"
        >
          <CarouselContent>
            <CarouselItem v-for="item in carouselItems" :key="item">
              <div class="scenario" :data-carousel-item="item">{{ item }}</div>
            </CarouselItem>
          </CarouselContent>
          <CarouselPrevious data-testid="styled-carousel-previous" />
          <CarouselNext data-testid="styled-carousel-next" />
        </Carousel>
        <Carousel orientation="vertical" class="max-w-xs" data-testid="styled-carousel-second">
          <CarouselContent>
            <CarouselItem><div class="scenario">Vertical one</div></CarouselItem>
            <CarouselItem><div class="scenario">Vertical two</div></CarouselItem>
          </CarouselContent>
        </Carousel>
        <div class="demo-row">
          <button
            class="review-action"
            type="button"
            data-testid="styled-carousel-add"
            @click="addCarouselItem"
          >
            Add item
          </button>
          <button
            class="review-action"
            type="button"
            data-testid="styled-carousel-cleanup-toggle"
            @click="carouselMounted = !carouselMounted"
          >
            {{ carouselMounted ? "Unmount Carousel" : "Remount Carousel" }}
          </button>
        </div>
        <output data-testid="styled-carousel-state">
          api: {{ carouselApiState }}, items: {{ carouselItems.length }}
        </output>
      </article>

      <article id="styled-sidebar-review" class="scenario" data-testid="styled-sidebar-review">
        <h3>Sidebar controlled, default, responsive, refs, and remount</h3>
        <SidebarProvider
          v-if="sidebarMounted"
          ref="sidebarProvider"
          v-model:open="sidebarOpen"
          v-model:mobile-open="sidebarMobileOpen"
          :persist-open="false"
          class="min-h-72 overflow-hidden rounded-lg border"
        >
          <Sidebar collapsible="none" data-testid="styled-sidebar-controlled">
            <SidebarHeader><SidebarTrigger data-testid="styled-sidebar-trigger" /></SidebarHeader>
            <SidebarContent>
              <SidebarGroup>
                <SidebarGroupLabel>Workspace</SidebarGroupLabel>
                <SidebarGroupContent>
                  <SidebarMenu>
                    <SidebarMenuItem v-for="item in carouselItems.slice(0, 3)" :key="item">
                      <SidebarMenuButton :tooltip="item">{{ item }}</SidebarMenuButton>
                    </SidebarMenuItem>
                  </SidebarMenu>
                </SidebarGroupContent>
              </SidebarGroup>
            </SidebarContent>
            <SidebarFooter>Vue Sidebar</SidebarFooter>
          </Sidebar>
          <main class="p-4">Responsive sidebar inset</main>
        </SidebarProvider>
        <div class="demo-row">
          <button
            class="review-action"
            type="button"
            data-testid="styled-sidebar-open-toggle"
            @click="sidebarOpen = !sidebarOpen"
          >
            Toggle desktop
          </button>
          <button
            class="review-action"
            type="button"
            data-testid="styled-sidebar-mobile-toggle"
            @click="sidebarMobileOpen = !sidebarMobileOpen"
          >
            Toggle mobile
          </button>
          <button
            class="review-action"
            type="button"
            data-testid="styled-sidebar-cleanup-toggle"
            @click="sidebarMounted = !sidebarMounted"
          >
            {{ sidebarMounted ? "Unmount Sidebar" : "Remount Sidebar" }}
          </button>
        </div>
        <output data-testid="styled-sidebar-state">
          open: {{ sidebarOpen }}, mobile: {{ sidebarMobileOpen }}, ref:
          {{ sidebarProvider?.element?.tagName ?? "none" }}
        </output>
      </article>

      <article
        id="styled-color-picker-review"
        class="scenario"
        data-testid="styled-color-picker-review"
      >
        <h3>Color Picker controlled, default, form, inline, refs, and cleanup</h3>
        <form
          class="demo-row"
          data-testid="styled-color-picker-form"
          @submit.prevent="submitColorForm"
        >
          <ColorPicker
            v-if="colorMounted"
            ref="colorPicker"
            :model-value="colorValue"
            v-model:format="colorFormat"
            v-model:open="colorOpen"
            format-control="native"
            name="reviewColor"
            label="Brand color"
            :swatches="['#2563eb', '#16a34a', '#dc2626']"
            data-testid="styled-color-picker-controlled"
            @update:model-value="updateColor"
            @value-change="
              (_, detail) => colorEvents.push(`detail:${detail.value?.toString() ?? 'empty'}`)
            "
            @format-change="
              (format, detail) => colorEvents.push(`format:${format}:${detail.format}`)
            "
          />
          <button class="review-action" type="submit" data-testid="styled-color-picker-submit">
            Submit color
          </button>
        </form>
        <ColorPicker
          inline
          default-value="#16a34a"
          format-control="native"
          :label="uncontrolledColorLabel"
          data-testid="styled-color-picker-inline"
        />
        <div class="demo-row">
          <button
            class="review-action"
            type="button"
            data-testid="styled-color-picker-unrelated-update"
            @click="uncontrolledColorLabel = `${uncontrolledColorLabel} updated`"
          >
            Update unrelated label
          </button>
          <button
            class="review-action"
            type="button"
            data-testid="styled-color-picker-open-toggle"
            @click="colorOpen = !colorOpen"
          >
            Toggle picker
          </button>
          <button
            class="review-action"
            type="button"
            data-testid="styled-color-picker-cleanup-toggle"
            @click="colorMounted = !colorMounted"
          >
            {{ colorMounted ? "Unmount Color Picker" : "Remount Color Picker" }}
          </button>
        </div>
        <output data-testid="styled-color-picker-state">
          value: {{ colorValue }}, format: {{ colorFormat }}, open: {{ colorOpen }}, ref:
          {{ colorPicker?.element?.tagName ?? "none" }}, form: {{ colorFormResult }}, events:
          {{ colorEvents.join("|") }}
        </output>
      </article>

      <article id="styled-toast-review" class="scenario" data-testid="styled-toast-review">
        <h3>Toast service variants, promise, instances, and cleanup</h3>
        <Toaster
          v-if="toasterMounted"
          ref="toaster"
          position="bottom-right"
          :limit="4"
          data-testid="styled-toaster"
        />
        <Toaster
          v-if="secondaryToasterMounted"
          position="top-right"
          :limit="4"
          data-testid="styled-toaster-secondary"
        />
        <div class="demo-row">
          <button
            class="review-action"
            type="button"
            data-testid="styled-toast-secondary-cleanup-toggle"
            @click="secondaryToasterMounted = !secondaryToasterMounted"
          >
            {{ secondaryToasterMounted ? "Unmount Secondary" : "Remount Secondary" }}
          </button>
          <button
            v-for="variant in ['success', 'error', 'warning', 'info'] as const"
            :key="variant"
            class="review-action"
            type="button"
            :data-testid="`styled-toast-${variant}`"
            @click="showToast(variant)"
          >
            {{ variant }} toast
          </button>
          <button
            class="review-action"
            type="button"
            data-testid="styled-toast-promise"
            @click="showPromiseToast"
          >
            Promise toast
          </button>
          <button
            class="review-action"
            type="button"
            data-testid="styled-toast-dismiss"
            @click="toast.dismiss()"
          >
            Dismiss
          </button>
          <button
            class="review-action"
            type="button"
            data-testid="styled-toast-cleanup-toggle"
            @click="toasterMounted = !toasterMounted"
          >
            {{ toasterMounted ? "Unmount Toaster" : "Remount Toaster" }}
          </button>
        </div>
        <output data-testid="styled-toast-state">
          sent: {{ toastCount }}, secondary: {{ secondaryToasterMounted }}, ref:
          {{ toaster?.element?.tagName ?? "none" }}
        </output>
      </article>
    </div>
  </section>
</template>
