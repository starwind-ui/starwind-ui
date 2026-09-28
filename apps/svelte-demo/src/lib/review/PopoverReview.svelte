<script lang="ts">
  import DocsExample from "./DocsExample.svelte";
  import source from "./examples/PopoverExample.svelte?raw";
  import PopoverExample from "./examples/PopoverExample.svelte";
</script>

<section
  data-styled-review="popover"
  id="popover-review"
  class="review-card"
  aria-labelledby="popover-heading"
>
  <div class="section-heading">
    <div>
      <p class="eyebrow">Anchored content</p>
      <h2 id="popover-heading">Popover</h2>
    </div>
    <span class="component-label hidden sm:inline-block">popover</span>
  </div>
  <p>Open the display options. Escape closes the popover and returns focus.</p>
  <DocsExample component="popover" />
  <div data-additional-examples>
    <h3 class="review-subheading">Additional examples</h3>
    <div class="scenario"><PopoverExample /></div>
    <details class="source-example">
      <summary>Source example</summary>
      <pre><code>{source}</code></pre>
    </details>
  </div>
</section>
