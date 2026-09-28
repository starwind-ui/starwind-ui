<script lang="ts">
  import DocsExample from "./DocsExample.svelte";
  import Example from "./examples/NativeSelectExample.svelte";
  import source from "./examples/NativeSelectExample.svelte?raw";
</script>

<section
  data-styled-review="native-select"
  id="native-select-review"
  class="review-card min-w-0"
  aria-labelledby="native-select-heading"
>
  <div class="section-heading">
    <h2 id="native-select-heading">Native Select</h2>
    <span class="component-label">native-select</span>
  </div>
  <p>Choose a delivery option, select several channels, and reset the form.</p>
  <DocsExample component="native-select" />
  <div data-additional-examples>
    <h3 class="review-subheading">Additional examples</h3>
    <div class="scenario mt-4 min-w-0"><Example /></div>
    <p class="text-sm" data-example-overrides>
      Explicit override: the multiple-select example sets a minimum height and vertical padding.
    </p>
    <details class="source-example">
      <summary>Source example</summary>
      <pre><code>{source}</code></pre>
    </details>
  </div>
</section>
