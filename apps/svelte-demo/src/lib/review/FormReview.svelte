<script lang="ts">
  import DocsExample from "./DocsExample.svelte";
  import Example from "./examples/FormExample.svelte";
  import source from "./examples/FormExample.svelte?raw";
</script>

<section
  data-styled-review="form"
  id="form-review"
  class="review-card min-w-0"
  aria-labelledby="form-heading"
>
  <div class="section-heading">
    <h2 id="form-heading">Form</h2>
    <span class="component-label">form</span>
  </div>
  <p>
    Submit an empty field to see the stock error summary. Fieldset controls native disabled
    behavior. The server error button uses the native form ref.
  </p>
  <DocsExample component="form" />
  <div data-additional-examples>
    <h3 class="review-subheading">Additional examples</h3>
    <div class="scenario mt-4 min-w-0"><Example /></div>
    <details class="source-example">
      <summary>Source example</summary>
      <pre><code>{source}</code></pre>
    </details>
  </div>
</section>
