<script lang="ts">
  import DocsExample from "./DocsExample.svelte";
  import Example from "./examples/TableExample.svelte";
  import source from "./examples/TableExample.svelte?raw";
</script>

<section
  data-styled-review="table"
  id="table-review"
  class="review-card min-w-0"
  aria-labelledby="table-heading"
>
  <div class="section-heading">
    <h2 id="table-heading">Table</h2>
    <span class="component-label">table</span>
  </div>
  <p>
    Review native column headers, a caption, and a summary row. Scroll the table on a small screen.
  </p>
  <DocsExample component="table" />
  <div data-additional-examples>
    <h3 class="review-subheading">Additional examples</h3>
    <div class="scenario mt-4 min-w-0"><Example /></div>
    <p class="text-sm" data-example-overrides>
      Explicit overrides: the table sets a 560px minimum width, emphasizes project names and aligns
      amounts.
    </p>
    <details class="source-example">
      <summary>Source example</summary>
      <pre><code>{source}</code></pre>
    </details>
  </div>
</section>
