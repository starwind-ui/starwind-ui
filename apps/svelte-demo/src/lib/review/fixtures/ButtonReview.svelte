<script lang="ts">
  import { Button, ButtonVariants } from "$lib/starwind-runtime/button";
  import type { VariantProps } from "tailwind-variants";
  let activations = $state(0);
  const iconSizes = ["icon-sm", "icon", "icon-lg"] as const;
  const variants = Object.keys(ButtonVariants.button.variants.variant) as NonNullable<
    VariantProps<typeof ButtonVariants.button>["variant"]
  >[];
  const example = `<Button variant="primary" onclick={() => activations++}>\n  Try Button\n</Button>\n<Button as="a" href="#button-sizes" variant="outline">\n  Jump to sizes\n</Button>\n<Button disabled>Unavailable action</Button>`;
</script>

<section id="button-review" class="review-card" aria-labelledby="button-heading">
  <div class="section-heading">
    <div>
      <p class="eyebrow">Actions and links</p>
      <h2 id="button-heading">Button</h2>
    </div>
    <span class="component-label">button</span>
  </div>
  <p>Use a button for an action or an anchor to move to another location.</p>
  <div class="review-grid">
    <div class="scenario">
      <h3 class="review-subheading">Try an action</h3>
      <p>Activate with a click, Enter, or Space.</p>
      <Button variant="primary" onclick={() => activations++}>Try Button</Button>
      <output class="review-output" aria-live="polite">Activations: {activations}</output>
    </div>
    <div class="scenario">
      <h3 class="review-subheading">Links and disabled states</h3>
      <div class="demo-row">
        <Button as="a" href="#button-sizes" variant="outline">Jump to sizes</Button>
        <Button disabled>Unavailable action</Button>
        <Button as="a" href="#button-sizes" disabled variant="outline">Unavailable link</Button>
      </div>
    </div>
    <div class="scenario full-width">
      <h3 class="review-subheading">Variants</h3>
      <div class="demo-row">
        {#each variants as variant (variant)}
          <Button {variant}>{variant[0].toUpperCase() + variant.slice(1)}</Button>
        {/each}
      </div>
    </div>
    <div id="button-sizes" class="scenario full-width">
      <h3 class="review-subheading">Sizes</h3>
      <div class="demo-row">
        <Button size="sm" variant="secondary">Small</Button>
        <Button size="md" variant="secondary">Medium</Button>
        <Button size="lg" variant="secondary">Large</Button>
        {#each iconSizes as size (size)}
          <Button {size} variant="outline" aria-label={`Add item (${size})`}>
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
              aria-hidden="true"><path d="M12 5v14M5 12h14" /></svg
            >
          </Button>
        {/each}
      </div>
    </div>
  </div>
  <details class="source-example" open>
    <summary>Source example</summary>
    <pre><code>{example}</code></pre>
  </details>
</section>
