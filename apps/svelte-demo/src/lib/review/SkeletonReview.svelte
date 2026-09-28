<script lang="ts">
  import DocsExample from "./DocsExample.svelte";
  import Example from "./examples/SkeletonExample.svelte";
  import source from "./examples/SkeletonExample.svelte?raw";
</script>

<section
  data-styled-review="skeleton"
  id="skeleton-review"
  class="review-card"
  aria-labelledby="skeleton-heading"
>
  <div class="section-heading">
    <h2 id="skeleton-heading">Skeleton</h2>
    <span class="component-label">skeleton</span>
  </div>
  <p>Use placeholders while content loads. The status names the loading region.</p>
  <DocsExample component="skeleton" />
  <div data-additional-examples>
    <h3 class="review-subheading">Additional examples</h3>
    <div class="scenario mt-4"><Example /></div>
    <p class="text-sm" data-example-overrides>
      Explicit overrides: profile placeholders set their dimensions and avatar rounding.
    </p>
    <details class="source-example mt-4">
      <summary>Example source</summary>
      <pre class="mt-3 overflow-x-auto rounded-md bg-muted p-4 text-sm"><code>{source}</code></pre>
    </details>
  </div>
</section>
