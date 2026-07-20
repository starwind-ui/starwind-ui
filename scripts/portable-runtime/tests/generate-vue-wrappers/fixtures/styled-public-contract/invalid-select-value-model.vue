<script setup lang="ts">
import { ref } from "vue";

import { Select } from "#styled/select";

const selected = ref(42);
</script>

<template>
  <Select v-model="selected" />
</template>
