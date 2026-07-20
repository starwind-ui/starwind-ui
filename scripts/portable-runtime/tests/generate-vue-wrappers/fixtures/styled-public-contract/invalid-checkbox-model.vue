<script setup lang="ts">
import { ref } from "vue";

import { Checkbox } from "#styled/checkbox";

const checked = ref("yes");
</script>

<template>
  <Checkbox v-model:checked="checked" />
</template>
