<script setup lang="ts">
import { ref } from "vue";

import Combobox from "#candidate/combobox/Combobox.vue";
import ContextMenu from "#candidate/context-menu/ContextMenu.vue";
import ContextMenuRadioGroup from "#candidate/context-menu/ContextMenuRadioGroup.vue";
import Dropdown from "#candidate/dropdown/Dropdown.vue";
import DropdownRadioGroup from "#candidate/dropdown/DropdownRadioGroup.vue";
import HoverCard from "#candidate/hover-card/HoverCard.vue";
import NavigationMenu from "#candidate/navigation-menu/NavigationMenu.vue";
import Tooltip from "#candidate/tooltip/Tooltip.vue";

const tooltipOpen = ref(false);
const hoverCardOpen = ref(false);
const dropdownOpen = ref(false);
const contextMenuOpen = ref(false);
const dropdownValue = ref("alpha");
const contextMenuValue = ref("alpha");
const navigationValue = ref<string | null>(null);
const comboboxInputValue = ref("");
const comboboxOpen = ref(false);
const comboboxValue = ref<string | null>(null);
</script>

<template>
  <Tooltip
    v-model:open="tooltipOpen"
    data-review="tooltip"
    @open-change="(_open, detail) => detail.cancel()"
  >
    Tooltip
  </Tooltip>
  <HoverCard
    v-model:open="hoverCardOpen"
    aria-label="Profile"
    @open-change="(_open, detail) => detail.cancel()"
  >
    Hover card
  </HoverCard>
  <Dropdown
    v-model:open="dropdownOpen"
    data-review="dropdown"
    @close-complete="() => undefined"
    @open-change="(_open, detail) => detail.cancel()"
  >
    <DropdownRadioGroup v-model="dropdownValue" @value-change="(_value, detail) => detail.cancel()">
      Dropdown radio group
    </DropdownRadioGroup>
  </Dropdown>
  <ContextMenu
    v-model:open="contextMenuOpen"
    data-review="context-menu"
    @close-complete="() => undefined"
    @open-change="(_open, detail) => detail.cancel()"
  >
    <ContextMenuRadioGroup
      v-model="contextMenuValue"
      @value-change="(_value, detail) => detail.cancel()"
    >
      Context menu radio group
    </ContextMenuRadioGroup>
  </ContextMenu>
  <NavigationMenu
    v-model="navigationValue"
    data-review="navigation-menu"
    @value-change="(_value, detail) => detail.cancel()"
  >
    Navigation menu
  </NavigationMenu>
  <Combobox
    v-model="comboboxValue"
    v-model:input-value="comboboxInputValue"
    v-model:open="comboboxOpen"
    data-review="combobox"
    @input-value-change="(_value, detail) => detail.cancel()"
    @open-change="(_open, detail) => detail.cancel()"
    @value-change="(_value, detail) => detail.cancel()"
  >
    Combobox
  </Combobox>
</template>
