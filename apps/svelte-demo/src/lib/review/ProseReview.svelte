<script lang="ts">
  import DocsExample from "./DocsExample.svelte";
  import Example from "./examples/ProseExample.svelte";
  import source from "./examples/ProseExample.svelte?raw";
</script>

<section
  data-styled-review="prose"
  id="prose-review"
  class="review-card min-w-0"
  aria-labelledby="prose-heading"
>
  <div class="section-heading">
    <h2 id="prose-heading">Prose</h2>
    <span class="component-label">prose</span>
  </div>
  <p>
    Read the article and inspect the nested content. The inset panel uses the typography escape
    class.
  </p>
  <DocsExample component="prose" />
  <div data-additional-examples>
    <h3 class="review-subheading">Additional examples</h3>
    <div class="scenario mt-4 min-w-0"><Example /></div>
    <details class="source-example">
      <summary>Source example</summary>
      <pre><code>{source}</code></pre>
    </details>
  </div>
</section>
