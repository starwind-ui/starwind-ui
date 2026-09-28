<script lang="ts">
  import DocsExample from "./DocsExample.svelte";
  import Example from "./fixtures/TabsReview.svelte";
  import source from "./fixtures/TabsReview.svelte?raw";
</script>

<section
  data-styled-review="tabs"
  id="tabs-review"
  class="review-card min-w-0"
  aria-labelledby="tabs-heading"
>
  <div class="section-heading">
    <h2 id="tabs-heading">Tabs</h2>
    <span class="component-label">tabs</span>
  </div>
  <p>Select a tab to read its content.</p>
  <DocsExample component="tabs" />
  <div data-additional-examples>
    <h3 class="review-subheading">Additional examples</h3>
    <div class="scenario mt-4 min-w-0"><Example /></div>
    <details class="source-example">
      <summary>Source example</summary>
      <pre><code>{source}</code></pre>
    </details>
  </div>
</section>
