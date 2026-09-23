<script lang="ts">
  import DocsExample from "./DocsExample.svelte";
  import Example from "./examples/InputExample.svelte";
  import source from "./examples/InputExample.svelte?raw";
</script>

<section
  data-styled-review="input"
  id="input-review"
  class="review-card min-w-0"
  aria-labelledby="input-heading"
>
  <div class="section-heading">
    <h2 id="input-heading">Input</h2>
    <span class="component-label">input</span>
  </div>
  <p>
    Edit the name and reset the form. Focus uses the native input ref. Each size uses its stock
    classes.
  </p>
  <DocsExample component="input" />
  <div data-additional-examples>
    <h3 class="review-subheading">Additional examples</h3>
    <div class="scenario mt-4 min-w-0"><Example /></div>
    <details class="source-example">
      <summary>Source example</summary>
      <pre><code>{source}</code></pre>
    </details>
  </div>
</section>
