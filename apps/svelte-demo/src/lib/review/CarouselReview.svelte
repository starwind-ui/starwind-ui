<script lang="ts">
  import DocsExample from "./DocsExample.svelte";
  import CarouselExample from "./examples/CarouselExample.svelte";
  import source from "./examples/CarouselExample.svelte?raw";
</script>

<section
  data-styled-review="carousel"
  id="carousel-review"
  class="review-card"
  aria-labelledby="carousel-heading"
>
  <div class="section-heading">
    <div>
      <p class="eyebrow">Slide collections</p>
      <h2 id="carousel-heading">Carousel</h2>
    </div>
    <span class="component-label hidden sm:inline-block">carousel</span>
  </div>
  <p>Use the arrow buttons to move through the slides. Drag a card to scroll the collection.</p>
  <DocsExample component="carousel" />
  <div data-additional-examples>
    <h3 class="review-subheading">Custom slides</h3>
    <div class="scenario"><CarouselExample /></div>
    <details class="source-example">
      <summary>Source example</summary>
      <pre><code>{source}</code></pre>
    </details>
  </div>
</section>
