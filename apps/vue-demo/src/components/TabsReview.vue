<script setup lang="ts">
import { ref } from "vue";

import type { TabsValue, TabsValueChangeDetails } from "@starwind-ui/vue/tabs";
import { TabsIndicator, TabsList, TabsPanel, TabsRoot, TabsTab } from "@starwind-ui/vue/tabs";
import {
  Tabs as StyledTabs,
  TabsContent as StyledTabsContent,
  TabsList as StyledTabsList,
  TabsTrigger as StyledTabsTrigger,
} from "./starwind-runtime/tabs";

const controlledValue = ref<TabsValue>("account");
const cancelNext = ref(true);
const items = ref(["account", "password"]);
const show = ref(true);
const proposals = ref<string[]>([]);

function handleValueChange(value: TabsValue, detail: TabsValueChangeDetails): void {
  proposals.value.push(
    `${String(value)}:${detail.reason}:${cancelNext.value ? "canceled" : "accepted"}`,
  );
  if (cancelNext.value) detail.cancel();
}
</script>

<template>
  <section id="tabs-review" class="review-card" data-testid="tabs-review">
    <div class="section-heading">
      <div>
        <p class="eyebrow">Roving focus, cancellation, dynamic tabs, presence, and geometry</p>
        <h2>Tabs</h2>
      </div>
    </div>

    <div class="scenario">
      <h3>Automatic vertical activation and dynamic collection</h3>
      <TabsRoot default-value="account" orientation="vertical">
        <TabsList activate-on-focus data-testid="tabs-dynamic-list">
          <TabsTab
            v-for="item in items"
            :key="item"
            :data-testid="`tabs-dynamic-${item}`"
            :value="item"
          >
            {{ item }}
          </TabsTab>
          <TabsIndicator data-testid="tabs-indicator" />
        </TabsList>
        <TabsPanel v-for="item in items" :key="item" :value="item">
          Runtime-owned presence for {{ item }}
        </TabsPanel>
      </TabsRoot>
      <button
        class="review-action"
        data-testid="tabs-add-item"
        type="button"
        @click="items.push(`tab-${items.length + 1}`)"
      >
        Add tab
      </button>
    </div>

    <div class="scenario">
      <h3>Controlled, cancelable, synchronized value</h3>
      <TabsRoot
        v-model="controlledValue"
        data-testid="tabs-controlled"
        sync-key="review-settings"
        @value-change="handleValueChange"
      >
        <TabsList>
          <TabsTab value="account">Account</TabsTab>
          <TabsTab data-testid="tabs-controlled-password" value="password">Password</TabsTab>
        </TabsList>
        <TabsPanel value="account">Account content</TabsPanel>
        <TabsPanel keep-mounted value="password">Password content</TabsPanel>
      </TabsRoot>
      <button
        class="review-action"
        data-testid="tabs-cancel-toggle"
        type="button"
        @click="cancelNext = !cancelNext"
      >
        {{ cancelNext ? "Accept next proposal" : "Cancel next proposal" }}
      </button>
      <output data-testid="tabs-controlled-state">
        value={{ String(controlledValue) }}, proposals={{ proposals.join(",") }}
      </output>
    </div>

    <div class="scenario">
      <h3>Styled composition and remount cleanup</h3>
      <StyledTabs v-if="show" default-value="styled">
        <StyledTabsList>
          <StyledTabsTrigger data-testid="styled-tabs-trigger" value="styled">
            Styled tab
          </StyledTabsTrigger>
          <StyledTabsTrigger value="other">Other tab</StyledTabsTrigger>
        </StyledTabsList>
        <StyledTabsContent data-testid="styled-tabs-content" value="styled">
          Styled content
        </StyledTabsContent>
        <StyledTabsContent value="other">Other content</StyledTabsContent>
      </StyledTabs>
      <button class="review-action" data-testid="tabs-remount" type="button" @click="show = !show">
        {{ show ? "Unmount Tabs" : "Remount Tabs" }}
      </button>
    </div>
  </section>
</template>
