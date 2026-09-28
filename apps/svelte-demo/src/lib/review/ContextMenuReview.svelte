<script lang="ts">
  import DocsExample from "./DocsExample.svelte";
  import ContextMenuExample from "./examples/ContextMenuExample.svelte";
  import source from "./examples/ContextMenuExample.svelte?raw";
</script>

<section
  data-styled-review="context-menu"
  id="context-menu-review"
  class="review-card"
  aria-labelledby="context-menu-heading"
>
  <div class="section-heading">
    <div>
      <p class="eyebrow">Context actions</p>
      <h2 id="context-menu-heading">Context Menu</h2>
    </div>
    <span class="component-label hidden sm:inline-block">context-menu</span>
  </div>
  <p>Open a context menu with a right click or a long press. Keyboard users can press Shift+F10.</p>
  <DocsExample component="context-menu" />
  <div data-additional-examples>
    <h3 class="review-subheading">Additional examples</h3>
    <div class="scenario"><ContextMenuExample /></div>
    <details class="source-example">
      <summary>Source example</summary>
      <pre><code>{source}</code></pre>
    </details>
  </div>
</section>
