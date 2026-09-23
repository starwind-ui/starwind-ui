<script lang="ts">
  import DocsExample from "./DocsExample.svelte";
  import Example from "./examples/ProgressExample.svelte";
  import source from "./examples/ProgressExample.svelte?raw";
</script>

<section
  data-styled-review="progress"
  id="progress-review"
  class="review-card min-w-0"
  aria-labelledby="progress-heading"
>
  <div class="section-heading">
    <h2 id="progress-heading">Progress</h2>
    <span class="component-label">progress</span>
  </div>
  <p>
    Advance the upload or select indeterminate progress. The final example uses a range from 20 to
    60.
  </p>
  <DocsExample component="progress" />
  <div data-additional-examples>
    <h3 class="review-subheading">Additional examples</h3>
    <div class="scenario mt-4 min-w-0"><Example /></div>
    <details class="source-example">
      <summary>Source example</summary>
      <pre><code>{source}</code></pre>
    </details>
  </div>
</section>
