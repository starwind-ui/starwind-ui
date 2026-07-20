<script setup lang="ts">
import DemoHeader from "./components/DemoHeader.vue";
import ReviewPage from "./components/ReviewPage.vue";

const route = window.location.pathname.replace(/\/$/, "") || "/";
</script>

<template>
  <DemoHeader />
  <ReviewPage v-if="route === '/review'" />
  <main v-else class="review-shell" data-testid="vue-review-index">
    <section class="review-hero">
      <p class="eyebrow">Internal, non-shipping checkpoint</p>
      <h1>Starwind Vue adapter</h1>
      <p>Open the verified Vue Primitive and generated Styled review surface.</p>
      <a class="review-link" href="/review">Open the review surface</a>
    </section>
  </main>
</template>
