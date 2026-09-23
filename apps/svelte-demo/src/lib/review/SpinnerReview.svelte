<script lang="ts">
  import DocsExample from "./DocsExample.svelte";
  import Example from "./examples/SpinnerExample.svelte";
  import source from "./examples/SpinnerExample.svelte?raw";
</script>

<section
  data-styled-review="spinner"
  id="spinner-review"
  class="review-card min-w-0"
  aria-labelledby="spinner-heading"
>
  <div class="section-heading">
    <h2 id="spinner-heading">Spinner</h2>
    <span class="component-label">spinner</span>
  </div>
  <p>Compare SVG sizes and try the loading state. Reduced motion stops each example animation.</p>
  <DocsExample component="spinner" />
  <div data-additional-examples>
    <h3 class="review-subheading">Additional examples</h3>
    <div class="scenario mt-4 min-w-0"><Example /></div>
    <p class="text-sm" data-example-overrides>
      The first spinner uses its default size. Explicit overrides set the other icons to 24px and
      32px.
    </p>
    <details class="source-example">
      <summary>Source example</summary>
      <pre><code>{source}</code></pre>
    </details>
  </div>
</section>
