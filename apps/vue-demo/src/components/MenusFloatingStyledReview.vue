<script setup lang="ts">
import { ref } from "vue";

import {
  Combobox,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxInput,
  ComboboxItem,
  ComboboxItemText,
  ComboboxLabel,
} from "./starwind-runtime/combobox";
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuLabel,
  ContextMenuSub,
  ContextMenuSubContent,
  ContextMenuSubTrigger,
  ContextMenuTrigger,
} from "./starwind-runtime/context-menu";
import {
  Dropdown,
  DropdownContent,
  DropdownItem,
  DropdownLabel,
  DropdownSub,
  DropdownSubContent,
  DropdownSubTrigger,
  DropdownTrigger,
} from "./starwind-runtime/dropdown";
import { HoverCard, HoverCardContent, HoverCardTrigger } from "./starwind-runtime/hover-card";
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
} from "./starwind-runtime/navigation-menu";
import { Tooltip, TooltipContent, TooltipTrigger } from "./starwind-runtime/tooltip";

type Fruit = { label: string; value: string };

const tooltipOpen = ref(false);
const tooltipMounted = ref(true);
const hoverCardOpen = ref(false);
const dropdownOpen = ref(false);
const contextMenuOpen = ref(false);
const navigationValue = ref<string | null>(null);
const navigationItems = ref([
  { label: "Guides", value: "guides" },
  { label: "Examples", value: "examples" },
]);
const comboboxValue = ref<string | null>("apple");
const comboboxOpen = ref(false);
const comboboxInputValue = ref("");
const comboboxMounted = ref(true);
const comboboxFormResult = ref("not submitted");
const fruits = ref<Fruit[]>([
  { label: "Apple", value: "apple" },
  { label: "Banana", value: "banana" },
]);

function addNavigationItem(): void {
  if (navigationItems.value.some((item) => item.value === "patterns")) return;
  navigationItems.value.push({ label: "Patterns", value: "patterns" });
}

function addFruit(): void {
  if (fruits.value.some((fruit) => fruit.value === "cherry")) return;
  fruits.value.push({ label: "Cherry", value: "cherry" });
}

function submitComboboxForm(event: Event): void {
  const form = event.currentTarget;
  if (!(form instanceof HTMLFormElement)) return;
  comboboxFormResult.value = JSON.stringify(Object.fromEntries(new FormData(form)));
}
</script>

<template>
  <section class="review-card" data-testid="styled-menus-floating-review">
    <div class="section-heading">
      <div>
        <p class="eyebrow">Generated Styled overlays and collection composition</p>
        <h2>Menus and floating UI</h2>
      </div>
    </div>

    <div class="review-grid">
      <article id="styled-tooltip-review" class="scenario" data-testid="styled-tooltip-review">
        <h3>Tooltip controlled, default, instances, and cleanup</h3>
        <div class="demo-row">
          <Tooltip v-if="tooltipMounted" v-model:open="tooltipOpen" :open-delay="0">
            <TooltipTrigger>
              <button class="review-action" data-testid="styled-tooltip-controlled-trigger">
                Controlled tooltip
              </button>
            </TooltipTrigger>
            <TooltipContent data-testid="styled-tooltip-controlled-content">
              Controlled Vue tooltip
            </TooltipContent>
          </Tooltip>
          <Tooltip :open-delay="0">
            <TooltipTrigger>
              <button class="review-action" data-testid="styled-tooltip-default-trigger">
                Default tooltip
              </button>
            </TooltipTrigger>
            <TooltipContent data-testid="styled-tooltip-default-content">
              Default Vue tooltip
            </TooltipContent>
          </Tooltip>
          <Tooltip :open-delay="0">
            <TooltipTrigger>
              <button class="review-action" data-testid="styled-tooltip-second-trigger">
                Second instance
              </button>
            </TooltipTrigger>
            <TooltipContent>Second Vue tooltip</TooltipContent>
          </Tooltip>
        </div>
        <button
          type="button"
          class="review-action"
          data-testid="styled-tooltip-cleanup-toggle"
          @click="tooltipMounted = !tooltipMounted"
        >
          {{ tooltipMounted ? "Unmount controlled Tooltip" : "Remount controlled Tooltip" }}
        </button>
        <output data-testid="styled-tooltip-state">
          open: {{ tooltipOpen }}, {{ tooltipMounted ? "mounted" : "unmounted" }}
        </output>
      </article>

      <article
        id="styled-hover-card-review"
        class="scenario"
        data-testid="styled-hover-card-review"
      >
        <h3>Hover Card controlled and default instances</h3>
        <div class="demo-row">
          <HoverCard v-model:open="hoverCardOpen" :open-delay="0" :close-delay="0">
            <HoverCardTrigger data-testid="styled-hover-card-controlled-trigger">
              @starwind
            </HoverCardTrigger>
            <HoverCardContent data-testid="styled-hover-card-controlled-content">
              Controlled Hover Card content
            </HoverCardContent>
          </HoverCard>
          <HoverCard :open-delay="0" :close-delay="0">
            <HoverCardTrigger data-testid="styled-hover-card-default-trigger">
              @runtime
            </HoverCardTrigger>
            <HoverCardContent data-testid="styled-hover-card-default-content">
              Default Hover Card content
            </HoverCardContent>
          </HoverCard>
        </div>
        <output data-testid="styled-hover-card-state">open: {{ hoverCardOpen }}</output>
      </article>

      <article id="styled-dropdown-review" class="scenario" data-testid="styled-dropdown-review">
        <h3>Dropdown controlled and nested</h3>
        <Dropdown v-model:open="dropdownOpen">
          <DropdownTrigger class="review-action" data-testid="styled-dropdown-trigger">
            Open Dropdown
          </DropdownTrigger>
          <DropdownContent data-testid="styled-dropdown-content">
            <DropdownLabel>Project actions</DropdownLabel>
            <DropdownItem data-testid="styled-dropdown-rename">Rename</DropdownItem>
            <DropdownSub>
              <DropdownSubTrigger data-testid="styled-dropdown-sub-trigger">
                Move to
              </DropdownSubTrigger>
              <DropdownSubContent data-testid="styled-dropdown-sub-content">
                <DropdownItem data-testid="styled-dropdown-archive">Archive</DropdownItem>
              </DropdownSubContent>
            </DropdownSub>
          </DropdownContent>
        </Dropdown>
        <output data-testid="styled-dropdown-state">open: {{ dropdownOpen }}</output>
      </article>

      <article
        id="styled-context-menu-review"
        class="scenario"
        data-testid="styled-context-menu-review"
      >
        <h3>Context Menu default and nested</h3>
        <ContextMenu v-model:open="contextMenuOpen">
          <ContextMenuTrigger data-testid="styled-context-menu-trigger">
            Right-click this review canvas
          </ContextMenuTrigger>
          <ContextMenuContent data-testid="styled-context-menu-content">
            <ContextMenuLabel>Canvas</ContextMenuLabel>
            <ContextMenuItem data-testid="styled-context-menu-rename">Rename</ContextMenuItem>
            <ContextMenuSub>
              <ContextMenuSubTrigger data-testid="styled-context-menu-sub-trigger">
                Insert
              </ContextMenuSubTrigger>
              <ContextMenuSubContent data-testid="styled-context-menu-sub-content">
                <ContextMenuItem data-testid="styled-context-menu-frame">Frame</ContextMenuItem>
              </ContextMenuSubContent>
            </ContextMenuSub>
          </ContextMenuContent>
        </ContextMenu>
        <output data-testid="styled-context-menu-state">open: {{ contextMenuOpen }}</output>
      </article>

      <article
        id="styled-navigation-menu-review"
        class="scenario"
        data-testid="styled-navigation-menu-review"
      >
        <h3>Navigation Menu controlled and dynamic</h3>
        <NavigationMenu v-model="navigationValue">
          <NavigationMenuList>
            <NavigationMenuItem
              v-for="item in navigationItems"
              :key="item.value"
              :value="item.value"
            >
              <NavigationMenuTrigger :data-testid="`styled-navigation-trigger-${item.value}`">
                {{ item.label }}
              </NavigationMenuTrigger>
              <NavigationMenuContent :data-testid="`styled-navigation-content-${item.value}`">
                <NavigationMenuLink :href="`#${item.value}`">
                  Read {{ item.label.toLowerCase() }}
                </NavigationMenuLink>
              </NavigationMenuContent>
            </NavigationMenuItem>
          </NavigationMenuList>
        </NavigationMenu>
        <button
          type="button"
          class="review-action"
          data-testid="styled-navigation-add-item"
          @click="addNavigationItem"
        >
          Add Patterns
        </button>
        <output data-testid="styled-navigation-state">value: {{ navigationValue }}</output>
      </article>

      <article id="styled-combobox-review" class="scenario" data-testid="styled-combobox-review">
        <h3>Combobox controlled, dynamic, form, and cleanup</h3>
        <form data-testid="styled-combobox-form" @submit.prevent="submitComboboxForm">
          <Combobox
            v-if="comboboxMounted"
            v-model="comboboxValue"
            v-model:open="comboboxOpen"
            v-model:input-value="comboboxInputValue"
            name="fruit"
          >
            <ComboboxLabel>Fruit</ComboboxLabel>
            <ComboboxInput
              placeholder="Search fruit"
              show-clear
              data-testid="styled-combobox-input"
            />
            <ComboboxContent data-testid="styled-combobox-content">
              <ComboboxEmpty>No fruit found.</ComboboxEmpty>
              <ComboboxItem
                v-for="fruit in fruits"
                :key="fruit.value"
                :value="fruit.value"
                :data-testid="`styled-combobox-item-${fruit.value}`"
              >
                <ComboboxItemText>{{ fruit.label }}</ComboboxItemText>
              </ComboboxItem>
            </ComboboxContent>
          </Combobox>
          <button type="submit" class="review-action" data-testid="styled-combobox-submit">
            Submit Combobox form
          </button>
        </form>
        <div class="demo-row">
          <button
            type="button"
            class="review-action"
            data-testid="styled-combobox-add-item"
            @click="addFruit"
          >
            Add Cherry
          </button>
          <button
            type="button"
            class="review-action"
            data-testid="styled-combobox-cleanup-toggle"
            @click="comboboxMounted = !comboboxMounted"
          >
            {{ comboboxMounted ? "Unmount Combobox" : "Remount Combobox" }}
          </button>
        </div>
        <output data-testid="styled-combobox-state">
          value: {{ comboboxValue }}, open: {{ comboboxOpen }}, input: {{ comboboxInputValue }}
        </output>
        <output data-testid="styled-combobox-form-result">{{ comboboxFormResult }}</output>
      </article>
    </div>
  </section>
</template>
