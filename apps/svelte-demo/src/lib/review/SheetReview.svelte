<script lang="ts">
  import DocsExample from "./DocsExample.svelte";
  import source from "./examples/SheetExample.svelte?raw";
  import SheetExample from "./examples/SheetExample.svelte";
</script>

<section
  data-styled-review="sheet"
  id="sheet-review"
  class="review-card"
  aria-labelledby="sheet-heading"
>
  <div class="section-heading">
    <div>
      <p class="eyebrow">Side panels</p>
      <h2 id="sheet-heading">Sheet</h2>
    </div>
    <span class="component-label hidden sm:inline-block">sheet</span>
  </div>
  <p>Open a sheet from any edge. Escape closes the panel and returns focus.</p>
  <DocsExample component="sheet" />
  <div data-additional-examples>
    <h3 class="review-subheading">Additional examples</h3>
    <div class="scenario"><SheetExample /></div>
    <details class="source-example">
      <summary>Source example</summary>
      <pre><code>{source}</code></pre>
    </details>
  </div>
</section>
