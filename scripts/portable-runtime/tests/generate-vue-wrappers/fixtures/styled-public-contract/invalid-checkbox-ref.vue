<script setup lang="ts">
import { ref } from "vue";

import { Checkbox } from "#styled/checkbox";

const checkbox = ref<InstanceType<typeof Checkbox> | null>(null);
const input: HTMLInputElement | null | undefined = checkbox.value?.element;
void input;
</script>

<template>
  <Checkbox ref="checkbox" />
</template>
