<script lang="ts">
  import DocsExample from "./DocsExample.svelte";
  import source from "./examples/SwitchExample.svelte?raw";
  import Switch from "$lib/starwind-runtime/switch";
  import { Button } from "$lib/starwind-runtime/button";
  let checked = $state<boolean | undefined>(undefined);
  let changes = $state(0);
  let button: HTMLButtonElement | null = null;
  let submitted = $state("Submit to inspect the form value.");
  const sizes = ["sm", "md", "lg"] as const;
</script>

<section
  data-styled-review="switch"
  id="switch-review"
  class="review-card"
  aria-labelledby="switch-heading"
>
  <div class="section-heading">
    <div>
      <p class="eyebrow">Form settings</p>
      <h2 id="switch-heading">Switch</h2>
    </div>
    <span class="component-label hidden sm:inline-block">switch</span>
  </div>
  <p>Change a setting with a labeled switch. Reset restores the initial form value.</p>
  <DocsExample component="switch" />
  <div data-additional-examples>
    <h3 class="review-subheading">Additional examples</h3>
    <div class="review-grid">
      <form
        class="scenario"
        onsubmit={(event) => {
          event.preventDefault();
          submitted = JSON.stringify(Object.fromEntries(new FormData(event.currentTarget)));
        }}
      >
        <h3 class="review-subheading">Binding and form reset</h3>
        <Switch
          id="review-switch-notifications"
          label="Enable notifications"
          name="notifications"
          value="yes"
          uncheckedValue="no"
          defaultChecked
          bind:checked
          onCheckedChange={() => changes++}
          ref={(node) => {
            button = node;
          }}
        />
        <output data-switch-status class="review-output" aria-live="polite"
          >Notifications: {checked ? "on" : "off"}. Changes: {changes}.</output
        >
        <div class="demo-row mt-4">
          <Button type="submit" size="sm">Submit setting</Button><Button
            type="reset"
            size="sm"
            variant="outline">Reset setting</Button
          ><Button type="button" size="sm" variant="outline" onclick={() => button?.focus()}
            >Focus switch</Button
          >
        </div>
        <output data-switch-submitted class="review-output" aria-live="polite">{submitted}</output>
      </form>
      <div class="scenario">
        <h3 class="review-subheading">States</h3>
        <div class="grid gap-4">
          <Switch id="review-switch-off" label="Unchecked setting" /><Switch
            id="review-switch-disabled"
            label="Unavailable setting"
            disabled
            defaultChecked
          /><Switch id="review-switch-readonly" label="Read-only setting" readOnly defaultChecked />
        </div>
      </div>
      <div class="scenario full-width">
        <h3 class="review-subheading">Sizes</h3>
        <div class="demo-row">
          {#each sizes as size (size)}<Switch
              id={`review-switch-${size}`}
              label={size.toUpperCase()}
              {size}
              defaultChecked
            />{/each}
        </div>
      </div>
    </div>
    <details class="source-example">
      <summary>Source example</summary>
      <pre><code>{source}</code></pre>
    </details>
  </div>
</section>
