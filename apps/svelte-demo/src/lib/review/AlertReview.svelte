<script lang="ts">
  import DocsExample from "./DocsExample.svelte";
  import Example from "./examples/AlertExample.svelte";
  import source from "./examples/AlertExample.svelte?raw";
</script>

<section
  data-styled-review="alert"
  id="alert-review"
  class="review-card min-w-0"
  aria-labelledby="alert-heading"
>
  <div class="section-heading">
    <h2 id="alert-heading">Alert</h2>
    <span class="component-label">alert</span>
  </div>
  <p>
    Compare the available tones. Warning and error messages use the alert role; other tones use
    status.
  </p>
  <DocsExample component="alert" />
  <div data-additional-examples>
    <h3 class="review-subheading">Additional examples</h3>
    <div class="scenario mt-4 min-w-0"><Example /></div>
    <details class="source-example">
      <summary>Source example</summary>
      <pre><code>{source}</code></pre>
    </details>
  </div>
</section>
