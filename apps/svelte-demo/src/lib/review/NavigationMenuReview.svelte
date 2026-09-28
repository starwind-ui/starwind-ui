<script lang="ts">
  import DocsExample from "./DocsExample.svelte";
  import NavigationMenuExample from "./examples/NavigationMenuExample.svelte";
  import source from "./examples/NavigationMenuExample.svelte?raw";
</script>

<section
  data-styled-review="navigation-menu"
  id="navigation-menu-review"
  class="review-card"
  aria-labelledby="navigation-menu-heading"
>
  <div class="section-heading">
    <div>
      <p class="eyebrow">Site navigation</p>
      <h2 id="navigation-menu-heading">Navigation Menu</h2>
    </div>
    <span class="component-label hidden sm:inline-block">navigation-menu</span>
  </div>
  <p>Open a navigation panel to browse related links. Arrow keys move focus through the menu.</p>
  <DocsExample component="navigation-menu" />
  <div data-additional-examples>
    <h3 class="review-subheading">Additional examples</h3>
    <div class="scenario"><NavigationMenuExample /></div>
    <details class="source-example">
      <summary>Source example</summary>
      <pre><code>{source}</code></pre>
    </details>
  </div>
</section>
