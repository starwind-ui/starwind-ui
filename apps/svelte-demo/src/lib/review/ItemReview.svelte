<script lang="ts">
  import DocsExample from "./DocsExample.svelte";
  import Example from "./examples/ItemExample.svelte";
  import source from "./examples/ItemExample.svelte?raw";
</script>

<section
  data-styled-review="item"
  id="item-review"
  class="review-card min-w-0"
  aria-labelledby="item-heading"
>
  <div class="section-heading">
    <h2 id="item-heading">Item</h2>
    <span class="component-label">item</span>
  </div>
  <p>Use the action to follow a workspace. The resource list shows compact rows and separators.</p>
  <DocsExample component="item" />
  <div data-additional-examples>
    <h3 class="review-subheading">Additional examples</h3>
    <div class="scenario mt-4 min-w-0"><Example /></div>
    <details class="source-example">
      <summary>Source example</summary>
      <pre><code>{source}</code></pre>
    </details>
  </div>
</section>
