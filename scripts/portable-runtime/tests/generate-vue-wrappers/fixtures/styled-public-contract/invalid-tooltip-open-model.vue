<script setup lang="ts">
import { ref } from "vue";

import Tooltip from "#candidate/tooltip/Tooltip.vue";

const open = ref("open");
</script>

<template>
  <Tooltip v-model:open="open" />
</template>
