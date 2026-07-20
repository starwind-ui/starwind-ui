<script setup lang="ts">
import ThemeToggle from "./starwind-runtime/theme-toggle/ThemeToggle.vue";
</script>

<template>
  <header class="demo-header" data-testid="vue-demo-header">
    <div class="demo-header__inner">
      <a class="demo-header__brand" href="/">Starwind Vue</a>
      <nav aria-label="Demo pages">
        <a href="/">Overview</a>
        <a href="/review">Review</a>
      </nav>
      <ThemeToggle id="header-theme-toggle" data-testid="header-theme-toggle" />
    </div>
  </header>
</template>
