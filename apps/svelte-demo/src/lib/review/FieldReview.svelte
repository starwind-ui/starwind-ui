<script lang="ts">
  import DocsExample from "./DocsExample.svelte";
  import Example from "./fixtures/FieldReview.svelte";
  import source from "./fixtures/FieldReview.svelte?raw";
</script>

<section
  data-styled-review="field"
  id="field-review"
  class="review-card min-w-0"
  aria-labelledby="field-heading"
>
  <div class="section-heading">
    <h2 id="field-heading">Field</h2>
    <span class="component-label">field</span>
  </div>
  <p>
    Labels and validation messages follow the native controls. Submit the form to show required
    errors.
  </p>
  <DocsExample component="field" />
  <div data-additional-examples>
    <h3 class="review-subheading">Additional examples</h3>
    <div class="scenario mt-4 min-w-0"><Example /></div>
    <details class="source-example">
      <summary>Source example</summary>
      <pre><code>{source}</code></pre>
    </details>
  </div>
</section>
