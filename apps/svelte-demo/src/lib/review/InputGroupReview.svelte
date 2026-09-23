<script lang="ts">
  import DocsExample from "./DocsExample.svelte";
  import Example from "./examples/InputGroupExample.svelte";
  import source from "./examples/InputGroupExample.svelte?raw";
</script>

<section
  data-styled-review="input-group"
  id="input-group-review"
  class="review-card min-w-0"
  aria-labelledby="input-group-heading"
>
  <div class="section-heading">
    <h2 id="input-group-heading">Input Group</h2>
    <span class="component-label">input-group</span>
  </div>
  <p>
    Addons show content on each edge. The input and textarea keep separate values. Use the focus
    button to test the native input ref.
  </p>
  <DocsExample component="input-group" />
  <div data-additional-examples>
    <h3 class="review-subheading">Additional examples</h3>
    <div class="scenario mt-4 min-w-0"><Example /></div>
    <details class="source-example">
      <summary>Source example</summary>
      <pre><code>{source}</code></pre>
    </details>
  </div>
</section>
