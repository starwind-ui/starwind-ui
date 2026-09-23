<script lang="ts">
  import DocsExample from "./DocsExample.svelte";
  import Example from "./examples/AspectRatioExample.svelte";
  import source from "./examples/AspectRatioExample.svelte?raw";
</script>

<section
  data-styled-review="aspect-ratio"
  id="aspect-ratio-review"
  class="review-card min-w-0"
  aria-labelledby="aspect-ratio-heading"
>
  <div class="section-heading">
    <h2 id="aspect-ratio-heading">AspectRatio</h2>
    <span class="component-label">aspect-ratio</span>
  </div>
  <p>
    Compare a wide cover with a square image. Change the preview ratio to see the container resize.
  </p>
  <DocsExample component="aspect-ratio" />
  <div data-additional-examples>
    <h3 class="review-subheading">Additional examples</h3>
    <div class="scenario mt-4 min-w-0"><Example /></div>
    <p class="text-sm" data-example-overrides>
      Explicit overrides: the preview content adds backgrounds, borders, padding and alignment.
    </p>
    <details class="source-example">
      <summary>Source example</summary>
      <pre><code>{source}</code></pre>
    </details>
  </div>
</section>
