<script lang="ts">
  import DocsExample from "./DocsExample.svelte";
  import Example from "./examples/AvatarExample.svelte";
  import source from "./examples/AvatarExample.svelte?raw";
</script>

<section
  data-styled-review="avatar"
  id="avatar-review"
  class="review-card min-w-0"
  aria-labelledby="avatar-heading"
>
  <div class="section-heading">
    <h2 id="avatar-heading">Avatar</h2>
    <span class="component-label">avatar</span>
  </div>
  <p>Load a portrait and switch to the delayed initials fallback. Compare sizes and borders.</p>
  <DocsExample component="avatar" />
  <div data-additional-examples>
    <h3 class="review-subheading">Additional examples</h3>
    <div class="scenario mt-4 min-w-0"><Example /></div>
    <details class="source-example">
      <summary>Source example</summary>
      <pre><code>{source}</code></pre>
    </details>
  </div>
</section>
