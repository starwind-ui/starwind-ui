<script lang="ts">
  import DocsExample from "./DocsExample.svelte";
  import Example from "./examples/TextareaExample.svelte";
  import source from "./examples/TextareaExample.svelte?raw";
</script>

<section
  data-styled-review="textarea"
  id="textarea-review"
  class="review-card min-w-0"
  aria-labelledby="textarea-heading"
>
  <div class="section-heading">
    <h2 id="textarea-heading">Textarea</h2>
    <span class="component-label">textarea</span>
  </div>
  <p>Edit the draft and reset it. Compare sizes, validation feedback, and the disabled state.</p>
  <DocsExample component="textarea" />
  <div data-additional-examples>
    <h3 class="review-subheading">Additional examples</h3>
    <div class="scenario mt-4 min-w-0"><Example /></div>
    <details class="source-example">
      <summary>Source example</summary>
      <pre><code>{source}</code></pre>
    </details>
  </div>
</section>
