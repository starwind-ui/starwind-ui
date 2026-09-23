<script lang="ts">
  import DocsExample from "./DocsExample.svelte";
  import Example from "./examples/SeparatorExample.svelte";
  import source from "./examples/SeparatorExample.svelte?raw";
</script>

<section
  data-styled-review="separator"
  id="separator-review"
  class="review-card"
  aria-labelledby="separator-heading"
>
  <div class="section-heading">
    <h2 id="separator-heading">Separator</h2>
    <span class="component-label">separator</span>
  </div>
  <p>Compare horizontal and vertical dividers. The accent divider uses a custom data-slot.</p>
  <DocsExample component="separator" />
  <div data-additional-examples>
    <h3 class="review-subheading">Additional examples</h3>
    <div class="scenario mt-4"><Example /></div>
    <p class="text-sm" data-example-overrides>
      Explicit override: the final separator uses the primary color.
    </p>
    <details class="source-example mt-4">
      <summary>Example source</summary>
      <pre class="mt-3 overflow-x-auto rounded-md bg-muted p-4 text-sm"><code>{source}</code></pre>
    </details>
  </div>
</section>
