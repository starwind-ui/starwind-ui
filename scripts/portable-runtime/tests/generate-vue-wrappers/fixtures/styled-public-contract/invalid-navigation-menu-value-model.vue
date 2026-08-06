<script setup lang="ts">
import { ref } from "vue";

import NavigationMenu from "#candidate/navigation-menu/NavigationMenu.vue";

const value = ref(1);
</script>

<template>
  <NavigationMenu v-model="value" />
</template>
