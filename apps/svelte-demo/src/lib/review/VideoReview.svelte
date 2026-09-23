<script lang="ts">
  import DocsExample from "./DocsExample.svelte";
  import Example from "./examples/VideoExample.svelte";
  import source from "./examples/VideoExample.svelte?raw";
</script>

<section
  data-styled-review="video"
  id="video-review"
  class="review-card min-w-0"
  aria-labelledby="video-heading"
>
  <div class="section-heading">
    <h2 id="video-heading">Video</h2>
    <span class="component-label">video</span>
  </div>
  <p>Play a local recording or explore an embedded preview.</p>
  <DocsExample component="video" />
  <div data-additional-examples>
    <h3 class="review-subheading">Additional examples</h3>
    <div class="scenario mt-4 min-w-0"><Example /></div>
    <details class="source-example">
      <summary>Source example</summary>
      <pre><code>{source}</code></pre>
    </details>
  </div>
</section>
