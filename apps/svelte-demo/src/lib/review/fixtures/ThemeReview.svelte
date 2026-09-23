<script lang="ts">
  import { ThemeToggle } from "$lib/starwind-runtime/theme-toggle";
  import { Button } from "$lib/starwind-runtime/button";
  let showExtra = $state(true);
  const sizes = ["sm", "md", "lg"] as const;
  const source = `<ThemeToggle ariaLabel="Toggle page theme" />\n<ThemeToggle ariaLabel="Switch appearance">\n  Switch appearance\n</ThemeToggle>`;
</script>

<section id="theme-toggle-review" class="review-card mb-6" aria-labelledby="theme-toggle-heading">
  <div class="section-heading">
    <div>
      <p class="eyebrow">Page appearance</p>
      <h2 id="theme-toggle-heading">Theme Toggle</h2>
    </div>
    <span class="component-label">theme-toggle</span>
  </div>
  <p>
    Switch between light and dark. Each control follows the page theme, which stays selected when
    you return.
  </p>
  <div class="review-grid">
    <div class="scenario">
      <h3 class="review-subheading">Shared controls</h3>
      <div class="demo-row">
        <ThemeToggle ariaLabel="Toggle catalog theme" />
        <ThemeToggle ariaLabel="Toggle theme with text" variant="default"
          >Switch appearance</ThemeToggle
        >
        <ThemeToggle ariaLabel="Unavailable theme toggle" disabled />
      </div>
    </div>
    <div class="scenario">
      <h3 class="review-subheading">Custom icons and sizes</h3>
      <div class="demo-row">
        {#each sizes as size (size)}
          <ThemeToggle ariaLabel={`Toggle theme (${size})`} {size}>
            {#snippet lightIcon()}<span
                aria-hidden="true"
                data-theme-icon
                class="hidden group-data-[state=off]:data-ready:inline">☀</span
              >{/snippet}
            {#snippet darkIcon()}<span
                aria-hidden="true"
                data-theme-icon
                class="hidden group-data-[state=on]:data-ready:inline">☾</span
              >{/snippet}
          </ThemeToggle>
        {/each}
      </div>
    </div>
    <div class="scenario full-width">
      <h3 class="review-subheading">Mount another control</h3>
      <p>Remove this control and add it again. Its appearance follows the selected theme.</p>
      <div class="demo-row">
        <Button variant="secondary" onclick={() => (showExtra = !showExtra)}
          >{showExtra ? "Remove extra control" : "Add extra control"}</Button
        >
        {#if showExtra}<ThemeToggle ariaLabel="Extra theme toggle" />{/if}
      </div>
    </div>
  </div>
  <details class="source-example">
    <summary>Source example</summary>
    <pre><code>{source}</code></pre>
  </details>
</section>
