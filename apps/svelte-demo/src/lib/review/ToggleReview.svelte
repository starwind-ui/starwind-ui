<script lang="ts">
  import DocsExample from "./DocsExample.svelte";
  import Toggle from "$lib/starwind-runtime/toggle";
  import { Button } from "$lib/starwind-runtime/button";
  import source from "./examples/ToggleExample.svelte?raw";
  let pressed = $state<boolean | undefined>();
  let changes = $state(0);
  let button: HTMLButtonElement | null = null;
</script>

<section
  data-styled-review="toggle"
  id="toggle-review"
  class="review-card"
  aria-labelledby="toggle-heading"
>
  <div class="section-heading">
    <div>
      <p class="eyebrow">Text controls</p>
      <h2 id="toggle-heading">Toggle</h2>
    </div>
    <span class="component-label hidden sm:inline-block">toggle</span>
  </div>
  <p>Press Bold to change the text option. Its paired control shares the same state.</p>
  <DocsExample component="toggle" />
  <div data-additional-examples>
    <h3 class="review-subheading">Additional examples</h3>
    <div class="review-grid">
      <div class="scenario">
        <h3 class="review-subheading">Shared state</h3>
        <div class="demo-row">
          <Toggle
            bind:pressed
            syncGroup="review-bold"
            onPressedChange={() => changes++}
            ref={(node: HTMLButtonElement | null) => (button = node)}>Bold</Toggle
          ><Toggle syncGroup="review-bold">Paired bold</Toggle>
        </div>
        <output data-toggle-status class="review-output" aria-live="polite"
          >Pressed: {String(pressed ?? false)}. Changes: {changes}.</output
        ><Button variant="outline" onclick={() => button?.focus()}>Focus bold</Button>
      </div>
      <div class="scenario">
        <h3 class="review-subheading">Outline and sizes</h3>
        <div class="demo-row">
          <Toggle variant="outline" size="sm">Small</Toggle><Toggle variant="outline" defaultPressed
            >Medium</Toggle
          ><Toggle variant="outline" size="lg">Large</Toggle><Toggle disabled>Unavailable</Toggle>
        </div>
      </div>
    </div>
    <details class="source-example">
      <summary>Source example</summary>
      <pre><code>{source}</code></pre>
    </details>
  </div>
</section>
