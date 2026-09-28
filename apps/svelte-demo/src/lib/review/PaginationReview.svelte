<script lang="ts">
  import DocsExample from "./DocsExample.svelte";
  import Example from "./examples/PaginationExample.svelte";
  import source from "./examples/PaginationExample.svelte?raw";
</script>

<section
  data-styled-review="pagination"
  id="pagination-review"
  class="review-card min-w-0"
  aria-labelledby="pagination-heading"
>
  <div class="section-heading">
    <h2 id="pagination-heading">Pagination</h2>
    <span class="component-label">pagination</span>
  </div>
  <p>Choose a page and check the active style. Use Tab to reach a link, then press Enter.</p>
  <DocsExample component="pagination" />
  <div data-additional-examples>
    <h3 class="review-subheading">Additional examples</h3>
    <div class="scenario mt-4 min-w-0"><Example /></div>
    <p class="text-sm" data-example-overrides>
      Explicit layout override: pagination content wraps on narrow screens.
    </p>
    <details class="source-example">
      <summary>Source example</summary>
      <pre><code>{source}</code></pre>
    </details>
  </div>
</section>
