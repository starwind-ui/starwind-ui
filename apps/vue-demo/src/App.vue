<script setup lang="ts">
import ChartGalleryPage from "./components/chart-gallery/ChartGalleryPage.vue";
import DemoHeader from "./components/DemoHeader.vue";
import ReviewPage from "./components/ReviewPage.vue";
import SidebarStyledReviewPage from "./components/SidebarStyledReviewPage.vue";
import StyledCatalogReviewPage from "./components/StyledCatalogReviewPage.vue";

const route = window.location.pathname.replace(/\/$/, "") || "/";
const chartGalleryType = /^\/review\/charts\/([a-z]+)$/.exec(route)?.[1];
</script>

<template>
  <DemoHeader v-if="route !== '/review/sidebar'" />
  <SidebarStyledReviewPage v-if="route === '/review/sidebar'" />
  <StyledCatalogReviewPage v-else-if="route === '/review'" />
  <ChartGalleryPage v-else-if="chartGalleryType" :type="chartGalleryType" />
  <ReviewPage v-else-if="route === '/internal/adapter-review'" />
  <main v-else class="review-shell" data-testid="vue-review-index">
    <section class="review-hero">
      <p class="eyebrow">Vue 3.5</p>
      <h1>Starwind Vue</h1>
      <p>
        Review the full generated Styled component catalog in light and dark themes. Supported CLI
        hosts include Vite, Astro, Nuxt 3/4, Laravel with Inertia Vue, and Quasar Vite SPA/SSR.
      </p>
      <a class="review-link" href="/review">Open the Styled review</a>
      <a class="review-link" href="https://github.com/starwind-ui/starwind-ui/issues"
        >Report an issue</a
      >
    </section>
  </main>
</template>
