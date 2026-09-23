<script lang="ts">
  import DocsExample from "./DocsExample.svelte";
  import ColorPickerExample from "./examples/ColorPickerExample.svelte";
  import source from "./examples/ColorPickerExample.svelte?raw";
</script>

<section
  data-styled-review="color-picker"
  id="color-picker-review"
  class="review-card"
  aria-labelledby="color-picker-heading"
>
  <div class="section-heading">
    <div>
      <p class="eyebrow">Color editing</p>
      <h2 id="color-picker-heading">Color Picker</h2>
    </div>
    <span class="component-label hidden sm:inline-block">color-picker</span>
  </div>
  <p>Choose a color in a popup or keep the editor beside your content.</p>
  <DocsExample component="color-picker" />
  <div data-additional-examples>
    <h3 class="review-subheading">Custom palette</h3>
    <div class="scenario"><ColorPickerExample /></div>
    <details class="source-example">
      <summary>Source example</summary>
      <pre><code>{source}</code></pre>
    </details>
  </div>
</section>
