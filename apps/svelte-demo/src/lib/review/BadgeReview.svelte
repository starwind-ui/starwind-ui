<script lang="ts">
  import DocsExample from "./DocsExample.svelte";
  import Example from "./examples/BadgeExample.svelte";
  import source from "./examples/BadgeExample.svelte?raw";
</script>

<section
  data-styled-review="badge"
  id="badge-review"
  class="review-card min-w-0"
  aria-labelledby="badge-heading"
>
  <div class="section-heading">
    <h2 id="badge-heading">Badge</h2>
    <span class="component-label">badge</span>
  </div>
  <p>Compare variants, composed colors, and sizes. Enable the release link to check focus.</p>
  <DocsExample component="badge" />
  <div data-additional-examples>
    <h3 class="review-subheading">Additional examples</h3>
    <div class="scenario mt-4 min-w-0"><Example /></div>
    <details class="source-example">
      <summary>Source example</summary>
      <pre><code>{source}</code></pre>
    </details>
  </div>
</section>
