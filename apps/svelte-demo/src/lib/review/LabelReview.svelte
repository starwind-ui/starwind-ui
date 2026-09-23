<script lang="ts">
  import DocsExample from "./DocsExample.svelte";
  import Example from "./examples/LabelExample.svelte";
  import source from "./examples/LabelExample.svelte?raw";
</script>

<section
  data-styled-review="label"
  id="label-review"
  class="review-card"
  aria-labelledby="label-heading"
>
  <div class="section-heading">
    <h2 id="label-heading">Label</h2>
    <span class="component-label">label</span>
  </div>
  <p>Click a label to focus its control. Compare text sizes and the disabled state.</p>
  <DocsExample component="label" />
  <div data-additional-examples>
    <h3 class="review-subheading">Additional examples</h3>
    <div class="scenario mt-4"><Example /></div>
    <details class="source-example mt-4">
      <summary>Example source</summary>
      <pre class="mt-3 overflow-x-auto rounded-md bg-muted p-4 text-sm"><code>{source}</code></pre>
    </details>
  </div>
</section>
