<script lang="ts">
  import DocsExample from "./DocsExample.svelte";
  import source from "./examples/ToastExample.svelte?raw";
</script>

<section
  data-styled-review="toast"
  id="toast-review"
  class="review-card"
  aria-labelledby="toast-heading"
>
  <div class="section-heading">
    <div>
      <p class="eyebrow">Status and actions</p>
      <h2 id="toast-heading">Toast</h2>
    </div>
    <span class="component-label hidden sm:inline-block">toast</span>
  </div>
  <p>Keep a short status message on screen with an optional action.</p>
  <DocsExample component="toast" />
  <details class="source-example">
    <summary>Source example</summary>
    <pre><code>{source}</code></pre>
  </details>
</section>
