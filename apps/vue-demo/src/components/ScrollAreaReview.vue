<script setup lang="ts">
import * as ScrollAreaPrimitive from "@starwind-ui/vue/scroll-area";
import { ref } from "vue";

import {
  ScrollArea,
  ScrollAreaContent,
  ScrollAreaCorner,
  ScrollAreaThumb,
  ScrollAreaViewport,
  ScrollBar,
} from "./starwind-runtime/scroll-area";

const verticalItems = Array.from({ length: 12 }, (_, index) => `Vertical item ${index + 1}`);
const horizontalItems = Array.from({ length: 10 }, (_, index) => `Column ${index + 1}`);
const dynamicItems = ref(2);
const showCleanup = ref(true);
const styledRoot = ref<InstanceType<typeof ScrollArea> | null>(null);
</script>

<template>
  <section id="scroll-area-review" class="review-card" data-testid="scroll-area-review">
    <div class="section-heading">
      <div>
        <p class="eyebrow">Measured viewport and tracks</p>
        <h2>Scroll Area</h2>
      </div>
      <output data-testid="scroll-area-ref-state">
        ref: {{ styledRoot?.element?.tagName ?? "none" }}
      </output>
    </div>

    <div class="review-grid scroll-area-review-grid">
      <article class="scenario">
        <h3>Primitive anatomy</h3>
        <ScrollAreaPrimitive.ScrollAreaRoot
          class="review-scroll-area"
          data-testid="scroll-area-primitive-root"
        >
          <ScrollAreaPrimitive.ScrollAreaViewport>
            <ScrollAreaPrimitive.ScrollAreaContent class="scroll-area-stack">
              <div v-for="item in verticalItems.slice(0, 6)" :key="item" class="scroll-area-item">
                {{ item }}
              </div>
            </ScrollAreaPrimitive.ScrollAreaContent>
          </ScrollAreaPrimitive.ScrollAreaViewport>
          <ScrollAreaPrimitive.ScrollAreaScrollbar>
            <ScrollAreaPrimitive.ScrollAreaThumb />
          </ScrollAreaPrimitive.ScrollAreaScrollbar>
          <ScrollAreaPrimitive.ScrollAreaCorner />
        </ScrollAreaPrimitive.ScrollAreaRoot>
      </article>

      <article class="scenario">
        <h3>Styled vertical</h3>
        <ScrollArea
          ref="styledRoot"
          class="review-scroll-area"
          data-testid="scroll-area-vertical"
          viewportClass="review-scroll-viewport custom-viewport-class"
        >
          <div class="scroll-area-stack">
            <div v-for="item in verticalItems" :key="item" class="scroll-area-item">{{ item }}</div>
          </div>
        </ScrollArea>
      </article>

      <article class="scenario">
        <h3>Styled horizontal</h3>
        <ScrollArea class="review-scroll-area" data-testid="scroll-area-horizontal">
          <div class="scroll-area-strip">
            <div v-for="item in horizontalItems" :key="item" class="scroll-area-tile">
              {{ item }}
            </div>
          </div>
          <template #scrollbar>
            <ScrollBar orientation="horizontal">
              <ScrollAreaThumb />
            </ScrollBar>
          </template>
        </ScrollArea>
      </article>

      <article class="scenario">
        <h3>Dual tracks</h3>
        <ScrollArea class="review-scroll-area" data-testid="scroll-area-dual">
          <div class="scroll-area-dual-content">
            <div v-for="item in verticalItems" :key="item" class="scroll-area-item">{{ item }}</div>
          </div>
          <template #scrollbar>
            <ScrollBar orientation="vertical"><ScrollAreaThumb /></ScrollBar>
            <ScrollBar orientation="horizontal"><ScrollAreaThumb /></ScrollBar>
          </template>
        </ScrollArea>
      </article>

      <article class="scenario">
        <h3>Custom six-part composition</h3>
        <ScrollAreaPrimitive.ScrollAreaRoot
          class="review-scroll-area relative overflow-hidden"
          data-testid="scroll-area-custom"
        >
          <ScrollAreaViewport class="review-scroll-viewport custom-standalone-viewport">
            <ScrollAreaContent class="scroll-area-dual-content">
              <div v-for="item in verticalItems" :key="item" class="scroll-area-item">
                {{ item }}
              </div>
            </ScrollAreaContent>
          </ScrollAreaViewport>
          <ScrollBar orientation="vertical"><ScrollAreaThumb /></ScrollBar>
          <ScrollBar orientation="horizontal"><ScrollAreaThumb /></ScrollBar>
          <ScrollAreaCorner />
        </ScrollAreaPrimitive.ScrollAreaRoot>
      </article>

      <article class="scenario">
        <h3>Resize refresh</h3>
        <ScrollArea class="review-scroll-area" data-testid="scroll-area-resize">
          <div class="scroll-area-stack" data-testid="scroll-area-resize-content">
            <div v-for="index in dynamicItems" :key="index" class="scroll-area-item">
              Dynamic item {{ index }}
            </div>
          </div>
        </ScrollArea>
        <button
          class="review-action scroll-area-action"
          data-testid="scroll-area-resize-toggle"
          type="button"
          @click="dynamicItems = dynamicItems === 2 ? 12 : 2"
        >
          {{ dynamicItems === 2 ? "Grow content" : "Shrink content" }}
        </button>
      </article>

      <article class="scenario scroll-area-multiple-scenario">
        <h3>Multiple isolated instances</h3>
        <div class="scroll-area-multiple" data-testid="scroll-area-multiple">
          <ScrollArea
            class="review-scroll-area review-scroll-area--small"
            data-testid="scroll-area-instance-one"
          >
            <div class="scroll-area-stack">
              <div v-for="item in verticalItems" :key="item" class="scroll-area-item">
                {{ item }}
              </div>
            </div>
          </ScrollArea>
          <ScrollArea
            class="review-scroll-area review-scroll-area--small"
            data-testid="scroll-area-instance-two"
          >
            <div class="scroll-area-stack">
              <div v-for="item in verticalItems" :key="item" class="scroll-area-item">
                {{ item }}
              </div>
            </div>
          </ScrollArea>
        </div>
      </article>

      <article class="scenario">
        <h3>Mount and cleanup</h3>
        <ScrollArea
          v-if="showCleanup"
          class="review-scroll-area"
          data-testid="scroll-area-cleanup-instance"
        >
          <div class="scroll-area-stack">
            <div v-for="item in verticalItems" :key="item" class="scroll-area-item">{{ item }}</div>
          </div>
        </ScrollArea>
        <button
          class="review-action scroll-area-action"
          data-testid="scroll-area-cleanup-toggle"
          type="button"
          @click="showCleanup = !showCleanup"
        >
          {{ showCleanup ? "Unmount Scroll Area" : "Remount Scroll Area" }}
        </button>
      </article>
    </div>
  </section>
</template>
