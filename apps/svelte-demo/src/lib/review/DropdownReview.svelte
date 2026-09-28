<script lang="ts">
  import DocsExample from "./DocsExample.svelte";
  import DropdownExample from "./examples/DropdownExample.svelte";
  import source from "./examples/DropdownExample.svelte?raw";
</script>

<section
  data-styled-review="dropdown"
  id="dropdown-review"
  class="review-card"
  aria-labelledby="dropdown-heading"
>
  <div class="section-heading">
    <div>
      <p class="eyebrow">Menu actions</p>
      <h2 id="dropdown-heading">Dropdown</h2>
    </div>
    <span class="component-label hidden sm:inline-block">dropdown</span>
  </div>
  <p>Choose an account action or change the workspace options. Arrow keys move through the menu.</p>
  <DocsExample component="dropdown" />
  <div data-additional-examples>
    <h3 class="review-subheading">Additional examples</h3>
    <div class="scenario"><DropdownExample /></div>
    <details class="source-example">
      <summary>Source example</summary>
      <pre><code>{source}</code></pre>
    </details>
  </div>
</section>
