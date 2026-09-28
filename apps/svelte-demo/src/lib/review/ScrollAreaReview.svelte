<script lang="ts">
  import DocsExample from "./DocsExample.svelte";
  import Example from "./examples/ScrollAreaExample.svelte";
  import source from "./examples/ScrollAreaExample.svelte?raw";
</script>

<section
  data-styled-review="scroll-area"
  id="scroll-area-review"
  class="review-card min-w-0"
  aria-labelledby="scroll-area-heading"
>
  <div class="section-heading">
    <h2 id="scroll-area-heading">Scroll Area</h2>
    <span class="component-label">scroll-area</span>
  </div>
  <p>
    Change the content size and axis to inspect the scrollbars. The edge threshold controls when the
    overflow markers appear.
  </p>
  <DocsExample component="scroll-area" />
  <div data-additional-examples>
    <h3 class="review-subheading">Additional examples</h3>
    <div class="scenario mt-4 min-w-0"><Example /></div>
    <p class="text-sm" data-example-overrides>
      Explicit overrides: the scroll example sets height, width, a border and viewport padding.
    </p>
    <p class="text-sm" data-example-overrides>
      Explicit overrides: the scroll example sets height, width, a border and viewport padding.
    </p>
    <details class="source-example">
      <summary>Source example</summary>
      <pre><code>{source}</code></pre>
    </details>
  </div>
</section>
