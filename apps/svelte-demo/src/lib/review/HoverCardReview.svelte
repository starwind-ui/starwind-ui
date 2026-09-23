<script lang="ts">
  import DocsExample from "./DocsExample.svelte";
  import source from "./examples/HoverCardExample.svelte?raw";
  import HoverCardExample from "./examples/HoverCardExample.svelte";
</script>

<section
  data-styled-review="hover-card"
  id="hover-card-review"
  class="review-card"
  aria-labelledby="hover-card-heading"
>
  <div class="section-heading">
    <div>
      <p class="eyebrow">Profile preview</p>
      <h2 id="hover-card-heading">Hover Card</h2>
    </div>
    <span class="component-label hidden sm:inline-block">hover-card</span>
  </div>
  <p>Focus or hover over the profile link to open its details.</p>
  <DocsExample component="hover-card" />
  <div data-additional-examples>
    <h3 class="review-subheading">Additional examples</h3>
    <div class="scenario"><HoverCardExample /></div>
    <details class="source-example">
      <summary>Source example</summary>
      <pre><code>{source}</code></pre>
    </details>
  </div>
</section>
