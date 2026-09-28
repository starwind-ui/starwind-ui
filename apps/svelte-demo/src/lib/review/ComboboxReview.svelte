<script lang="ts">
  import DocsExample from "./DocsExample.svelte";
  import ComboboxExample from "./examples/ComboboxExample.svelte";
  import source from "./examples/ComboboxExample.svelte?raw";
</script>

<section
  data-styled-review="combobox"
  id="combobox-review"
  class="review-card"
  aria-labelledby="combobox-heading"
>
  <div class="section-heading">
    <div>
      <p class="eyebrow">Search and select</p>
      <h2 id="combobox-heading">Combobox</h2>
    </div>
    <span class="component-label hidden sm:inline-block">combobox</span>
  </div>
  <p>Type to find a framework. Use the arrow keys to move through results and Enter to select.</p>
  <DocsExample component="combobox" />
  <div data-additional-examples>
    <h3 class="review-subheading">Additional examples</h3>
    <div class="scenario"><ComboboxExample /></div>
    <details class="source-example">
      <summary>Source example</summary>
      <pre><code>{source}</code></pre>
    </details>
  </div>
</section>
