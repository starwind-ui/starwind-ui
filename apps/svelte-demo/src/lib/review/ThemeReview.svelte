<script lang="ts">
  import DocsExample from "./DocsExample.svelte";
  import source from "./examples/ThemeExample.svelte?raw";
  import { ThemeToggle } from "$lib/starwind-runtime/theme-toggle";
  const sizes = ["sm", "md", "lg"] as const;
</script>

<section
  data-styled-review="theme-toggle"
  id="theme-toggle-review"
  class="review-card"
  aria-labelledby="theme-toggle-heading"
>
  <div class="section-heading">
    <div>
      <p class="eyebrow">Page appearance</p>
      <h2 id="theme-toggle-heading">Theme Toggle</h2>
    </div>
    <span class="component-label hidden sm:inline-block">theme-toggle</span>
  </div>
  <p>
    Switch between light and dark. Each control follows the page theme, which stays selected when
    you return.
  </p>
  <DocsExample component="theme-toggle" />
  <div data-additional-examples>
    <h3 class="review-subheading">Additional examples</h3>
    <div class="review-grid">
      <div class="scenario">
        <h3 class="review-subheading">Variants and disabled state</h3>
        <div class="demo-row">
          <div class="grid justify-items-center gap-2">
            <span class="text-sm text-muted-foreground">Outline</span>
            <ThemeToggle ariaLabel="Toggle catalog theme" variant="outline" />
          </div>
          <div class="grid justify-items-center gap-2">
            <span class="text-sm text-muted-foreground">Default</span>
            <ThemeToggle ariaLabel="Toggle theme with text" variant="default" />
          </div>
          <div class="grid justify-items-center gap-2">
            <span class="text-sm text-muted-foreground">Unavailable</span>
            <ThemeToggle ariaLabel="Unavailable theme toggle" disabled />
          </div>
        </div>
      </div>
      <div class="scenario">
        <h3 class="review-subheading">Sizes</h3>
        <div class="demo-row">
          {#each sizes as size (size)}
            <div class="grid justify-items-center gap-2">
              <span class="text-sm text-muted-foreground">{size.toUpperCase()}</span>
              <ThemeToggle ariaLabel={`Toggle theme (${size})`} {size} />
            </div>
          {/each}
        </div>
      </div>
    </div>
    <details class="source-example">
      <summary>Source example</summary>
      <pre><code>{source}</code></pre>
    </details>
  </div>
</section>
