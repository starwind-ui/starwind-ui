<script setup lang="ts">
import { ref } from "vue";
import {
  Dropdown,
  DropdownTrigger,
  DropdownContent,
  DropdownItem,
  DropdownLabel,
  DropdownSeparator,
  DropdownSub,
  DropdownSubTrigger,
  DropdownSubContent,
} from "./starwind-runtime/dropdown";

defineProps<{ context: string; id: string }>();
const selected = ref("None");
</script>

<template>
  <div class="mt-4 space-y-2">
    <Dropdown>
      <DropdownTrigger class="review-action" :data-testid="`${id}-trigger`"
        >Open Dropdown inside {{ context }}</DropdownTrigger
      >
      <DropdownContent :data-testid="`${id}-content`">
        <DropdownLabel>{{ context }} actions</DropdownLabel>
        <DropdownItem @click="selected = 'Edit'">Edit</DropdownItem>
        <DropdownSub>
          <DropdownSubTrigger :data-testid="`${id}-sub-trigger`">Share</DropdownSubTrigger>
          <DropdownSubContent :data-testid="`${id}-sub-content`">
            <DropdownItem @click="selected = 'Copy link'">Copy link</DropdownItem>
            <DropdownItem @click="selected = 'Invite team'">Invite team</DropdownItem>
          </DropdownSubContent>
        </DropdownSub>
        <DropdownSeparator />
        <DropdownItem disabled>Unavailable action</DropdownItem>
      </DropdownContent>
    </Dropdown>
    <p class="text-muted-foreground text-sm" :data-testid="`${id}-result`">
      Selected: {{ selected }}
    </p>
  </div>
</template>
