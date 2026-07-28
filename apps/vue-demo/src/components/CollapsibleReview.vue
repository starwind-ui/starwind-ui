<script setup lang="ts">
import { ref } from "vue";

import type { CollapsibleOpenChangeDetails } from "@starwind-ui/vue/collapsible";
import {
  CollapsiblePanel,
  CollapsibleRoot,
  CollapsibleTrigger,
} from "@starwind-ui/vue/collapsible";

const controlledOpen = ref(false);
const cancelNext = ref(true);
const showRemount = ref(true);
const childClicks = ref(0);
const wrapperClicks = ref(0);
const proposalLog = ref<string[]>([]);

function handleControlledChange(open: boolean, detail: CollapsibleOpenChangeDetails): void {
  proposalLog.value.push(
    `${open ? "open" : "close"}:${cancelNext.value ? "canceled" : "accepted"}`,
  );
  if (cancelNext.value) detail.cancel();
}
</script>

<template>
  <section id="collapsible-review" class="review-card" data-testid="collapsible-review">
    <div class="section-heading">
      <div>
        <p class="eyebrow">Disclosure family, cancellation, composition, and presence</p>
        <h2>Collapsible</h2>
      </div>
    </div>

    <div class="scenario">
      <h3>Default state and Runtime-owned presence</h3>
      <CollapsibleRoot default-open data-testid="collapsible-default-root">
        <CollapsibleTrigger data-testid="collapsible-default-trigger">
          Toggle default disclosure
        </CollapsibleTrigger>
        <CollapsiblePanel data-testid="collapsible-default-panel">
          The panel remains mounted while Runtime owns its hidden and state attributes.
        </CollapsiblePanel>
      </CollapsibleRoot>
    </div>

    <div class="scenario">
      <h3>Controlled and cancelable open proposals</h3>
      <CollapsibleRoot
        v-model:open="controlledOpen"
        data-testid="collapsible-controlled-root"
        @open-change="handleControlledChange"
      >
        <CollapsibleTrigger data-testid="collapsible-controlled-trigger">
          Propose controlled change
        </CollapsibleTrigger>
        <CollapsiblePanel hidden-until-found data-testid="collapsible-controlled-panel">
          Controlled content
        </CollapsiblePanel>
      </CollapsibleRoot>
      <button
        class="review-action"
        data-testid="collapsible-cancel-toggle"
        type="button"
        @click="cancelNext = !cancelNext"
      >
        {{ cancelNext ? "Accept next proposal" : "Cancel next proposal" }}
      </button>
      <output data-testid="collapsible-controlled-state">
        open={{ controlledOpen }}, next={{ cancelNext ? "cancel" : "accept" }}, proposals={{
          proposalLog.join(",")
        }}
      </output>
    </div>

    <div class="scenario">
      <h3>Strict Trigger asChild</h3>
      <CollapsibleRoot>
        <CollapsibleTrigger
          as-child
          class="wrapper-trigger"
          @click="wrapperClicks += 1"
        >
          <button
            class="review-action child-trigger"
            data-testid="collapsible-as-child"
            @click="childClicks += 1"
          >
            One semantic button
          </button>
        </CollapsibleTrigger>
        <CollapsiblePanel data-testid="collapsible-as-child-panel">
          Composed content
        </CollapsiblePanel>
      </CollapsibleRoot>
      <output data-testid="collapsible-listener-state">
        child-clicks={{ childClicks }}, wrapper-clicks={{ wrapperClicks }}
      </output>
    </div>

    <div class="scenario">
      <h3>Unmount and remount cleanup</h3>
      <CollapsibleRoot v-if="showRemount" data-testid="collapsible-remount-root">
        <CollapsibleTrigger>Remounted trigger</CollapsibleTrigger>
        <CollapsiblePanel>Remounted content</CollapsiblePanel>
      </CollapsibleRoot>
      <button
        class="review-action"
        data-testid="collapsible-remount-toggle"
        type="button"
        @click="showRemount = !showRemount"
      >
        {{ showRemount ? "Unmount Collapsible" : "Remount Collapsible" }}
      </button>
      <output data-testid="collapsible-remount-state">
        {{ showRemount ? "mounted" : "unmounted" }}
      </output>
    </div>
  </section>
</template>
