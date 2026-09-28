<script lang="ts">
  import DocsExample from "./DocsExample.svelte";
  import Example from "./fixtures/DropzoneReview.svelte";
  import source from "./fixtures/DropzoneReview.svelte?raw";
</script>

<section
  data-styled-review="dropzone"
  id="dropzone-review"
  class="review-card min-w-0"
  aria-labelledby="dropzone-heading"
>
  <div class="section-heading">
    <h2 id="dropzone-heading">Dropzone</h2>
    <span class="component-label">dropzone</span>
  </div>
  <p>Choose files with the picker or drop them into the upload area.</p>
  <DocsExample component="dropzone" />
  <div data-additional-examples>
    <h3 class="review-subheading">Additional examples</h3>
    <div class="scenario mt-4 min-w-0"><Example /></div>
    <details class="source-example">
      <summary>Source example</summary>
      <pre><code>{source}</code></pre>
    </details>
  </div>
</section>
