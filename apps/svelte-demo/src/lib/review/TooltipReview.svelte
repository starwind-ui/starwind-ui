<script lang="ts">
  import DocsExample from "./DocsExample.svelte";
  import source from "./examples/TooltipExample.svelte?raw";
  import TooltipExample from "./examples/TooltipExample.svelte";
</script>

<section
  data-styled-review="tooltip"
  id="tooltip-review"
  class="review-card"
  aria-labelledby="tooltip-heading"
>
  <div class="section-heading">
    <div>
      <p class="eyebrow">Contextual help</p>
      <h2 id="tooltip-heading">Tooltip</h2>
    </div>
    <span class="component-label hidden sm:inline-block">tooltip</span>
  </div>
  <p>Focus or hover over the help button to read its description.</p>
  <DocsExample component="tooltip" />
  <div data-additional-examples>
    <h3 class="review-subheading">Additional examples</h3>
    <div class="scenario"><TooltipExample /></div>
    <details class="source-example">
      <summary>Source example</summary>
      <pre><code>{source}</code></pre>
    </details>
  </div>
</section>
