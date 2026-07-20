<script setup lang="ts">
import { ref } from "vue";

import { Select } from "#styled/select";

const open = ref("open");
</script>

<template>
  <Select v-model:open="open" />
</template>
