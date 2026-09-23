<script lang="ts">
  import DocsExample from "./DocsExample.svelte";
  import Example from "./examples/KbdExample.svelte";
  import source from "./examples/KbdExample.svelte?raw";
</script>

<section
  data-styled-review="kbd"
  id="kbd-review"
  class="review-card min-w-0"
  aria-labelledby="kbd-heading"
>
  <div class="section-heading">
    <h2 id="kbd-heading">Kbd</h2>
    <span class="component-label">kbd</span>
  </div>
  <p>Show a key or a shortcut with readable keyboard labels.</p>
  <DocsExample component="kbd" />
  <div data-additional-examples>
    <h3 class="review-subheading">Additional examples</h3>
    <div class="scenario mt-4 min-w-0"><Example /></div>
    <details class="source-example">
      <summary>Source example</summary>
      <pre><code>{source}</code></pre>
    </details>
  </div>
</section>
