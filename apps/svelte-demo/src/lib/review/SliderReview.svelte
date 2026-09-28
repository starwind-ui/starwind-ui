<script lang="ts">
  import DocsExample from "./DocsExample.svelte";
  import Example from "./fixtures/SliderReview.svelte";
  import source from "./fixtures/SliderReview.svelte?raw";
</script>

<section
  data-styled-review="slider"
  id="slider-review"
  class="review-card min-w-0"
  aria-labelledby="slider-heading"
>
  <div class="section-heading">
    <h2 id="slider-heading">Slider</h2>
    <span class="component-label">slider</span>
  </div>
  <p>Drag a thumb or use the arrow keys to adjust a value.</p>
  <DocsExample component="slider" />
  <div data-additional-examples>
    <h3 class="review-subheading">Additional examples</h3>
    <div class="scenario mt-4 min-w-0"><Example /></div>
    <details class="source-example">
      <summary>Source example</summary>
      <pre><code>{source}</code></pre>
    </details>
  </div>
</section>
