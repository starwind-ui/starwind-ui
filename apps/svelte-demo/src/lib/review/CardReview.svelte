<script lang="ts">
  import DocsExample from "./DocsExample.svelte";
  import Example from "./examples/CardExample.svelte";
  import source from "./examples/CardExample.svelte?raw";
</script>

<section
  data-styled-review="card"
  id="card-review"
  class="review-card min-w-0"
  aria-labelledby="card-heading"
>
  <div class="section-heading">
    <h2 id="card-heading">Card</h2>
    <span class="component-label">card</span>
  </div>
  <p>Compare regular and compact spacing. Use Save to check the action and footer response.</p>
  <DocsExample component="card" />
  <div data-additional-examples>
    <h3 class="review-subheading">Additional examples</h3>
    <div class="scenario mt-4 min-w-0"><Example /></div>
    <details class="source-example">
      <summary>Source example</summary>
      <pre><code>{source}</code></pre>
    </details>
  </div>
</section>
