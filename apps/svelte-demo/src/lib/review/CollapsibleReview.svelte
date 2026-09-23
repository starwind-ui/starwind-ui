<script lang="ts">
  import DocsExample from "./DocsExample.svelte";
  import Example from "./examples/CollapsibleExample.svelte";
  import source from "./examples/CollapsibleExample.svelte?raw";
</script>

<section
  data-styled-review="collapsible"
  id="collapsible-review"
  class="review-card min-w-0"
  aria-labelledby="collapsible-heading"
>
  <div class="section-heading">
    <h2 id="collapsible-heading">Collapsible</h2>
    <span class="component-label">collapsible</span>
  </div>
  <p>
    Open the details with the trigger or send a parent command. A canceled close keeps the accepted
    state visible.
  </p>
  <DocsExample component="collapsible" />
  <div data-additional-examples>
    <h3 class="review-subheading">Additional examples</h3>
    <div class="scenario mt-4 min-w-0"><Example /></div>
    <details class="source-example">
      <summary>Source example</summary>
      <pre><code>{source}</code></pre>
    </details>
  </div>
</section>
