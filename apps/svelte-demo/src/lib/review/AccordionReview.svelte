<script lang="ts">
  import DocsExample from "./DocsExample.svelte";
  import Example from "./fixtures/AccordionReview.svelte";
  import source from "./fixtures/AccordionReview.svelte?raw";
</script>

<section
  data-styled-review="accordion"
  id="accordion-review"
  class="review-card min-w-0"
  aria-labelledby="accordion-heading"
>
  <div class="section-heading">
    <h2 id="accordion-heading">Accordion</h2>
    <span class="component-label">accordion</span>
  </div>
  <p>Open a section to read its content.</p>
  <DocsExample component="accordion" />
  <div data-additional-examples>
    <h3 class="review-subheading">Additional examples</h3>
    <div class="scenario mt-4 min-w-0"><Example /></div>
    <details class="source-example">
      <summary>Source example</summary>
      <pre><code>{source}</code></pre>
    </details>
  </div>
</section>
