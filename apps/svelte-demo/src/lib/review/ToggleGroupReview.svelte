<script lang="ts">
  import DocsExample from "./DocsExample.svelte";
  import Group from "$lib/starwind-runtime/toggle-group";
  import { Button } from "$lib/starwind-runtime/button";
  import source from "./examples/ToggleGroupExample.svelte?raw";
  let value = $state<string[] | undefined>();
  let changes = $state(0);
  let root: HTMLDivElement | null = null;
</script>

<section
  data-styled-review="toggle-group"
  id="toggle-group-review"
  class="review-card"
  aria-labelledby="toggle-group-heading"
>
  <div class="section-heading">
    <div>
      <p class="eyebrow">Grouped choices</p>
      <h2 id="toggle-group-heading">Toggle Group</h2>
    </div>
    <span class="component-label hidden sm:inline-block">toggle-group</span>
  </div>
  <p>Select text options together. Arrow keys move focus between the choices.</p>
  <DocsExample component="toggle-group" />
  <div data-additional-examples>
    <h3 class="review-subheading">Additional examples</h3>
    <div class="review-grid">
      <div class="scenario">
        <h3 class="review-subheading">Text options</h3>
        <Group.Root
          aria-label="Text options"
          multiple
          defaultValue={["bold"]}
          bind:value
          onValueChange={() => changes++}
          ref={(node) => (root = node)}
          tabindex={-1}
          ><Group.Item value="bold">Bold</Group.Item><Group.Item value="italic">Italic</Group.Item
          ><Group.Item value="underline">Underline</Group.Item></Group.Root
        ><output data-toggle-group-status class="review-output" aria-live="polite"
          >Selected: {value?.join(", ") || "none"}. Changes: {changes}.</output
        ><Button variant="outline" onclick={() => root?.focus()}>Focus options</Button>
      </div>
      <div class="scenario">
        <h3 class="review-subheading">Connected outline</h3>
        <Group.Root
          aria-label="Alignment"
          variant="outline"
          spacing={0}
          size="sm"
          defaultValue={["left"]}
          ><Group.Item value="left">Left</Group.Item><Group.Item value="center">Center</Group.Item
          ><Group.Item value="right" disabled>Right</Group.Item></Group.Root
        >
        <h3 class="review-subheading">Vertical choices</h3>
        <Group.Root aria-label="View" variant="outline" size="lg" orientation="vertical"
          ><Group.Item value="list">List</Group.Item><Group.Item value="grid">Grid</Group.Item
          ></Group.Root
        >
      </div>
    </div>
    <details class="source-example">
      <summary>Source example</summary>
      <pre><code>{source}</code></pre>
    </details>
  </div>
</section>
