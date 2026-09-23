<script lang="ts">
  import DocsExample from "./DocsExample.svelte";
  import source from "./examples/AlertDialogExample.svelte?raw";
  import AlertDialogExample from "./examples/AlertDialogExample.svelte";
</script>

<section
  data-styled-review="alert-dialog"
  id="alert-dialog-review"
  class="review-card"
  aria-labelledby="alert-dialog-heading"
>
  <div class="section-heading">
    <div>
      <p class="eyebrow">Confirmation</p>
      <h2 id="alert-dialog-heading">Alert Dialog</h2>
    </div>
    <span class="component-label hidden sm:inline-block">alert-dialog</span>
  </div>
  <p>Review a confirmation before you continue. Escape closes the dialog and returns focus.</p>
  <DocsExample component="alert-dialog" />
  <div data-additional-examples>
    <h3 class="review-subheading">Additional examples</h3>
    <div class="scenario"><AlertDialogExample /></div>
    <details class="source-example">
      <summary>Source example</summary>
      <pre><code>{source}</code></pre>
    </details>
  </div>
</section>
