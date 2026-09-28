<script lang="ts">
  import DocsExample from "./DocsExample.svelte";
  import source from "./examples/RadioGroupExample.svelte?raw";
  import RadioGroup from "$lib/starwind-runtime/radio-group";
  import Label from "$lib/starwind-runtime/label";
  import { Button } from "$lib/starwind-runtime/button";
  let delivery = $state<string | undefined>();
  let changes = $state(0);
  let submitted = $state("Submit to inspect the selected value.");
  let group: HTMLDivElement | null = null;
</script>

<section
  data-styled-review="radio-group"
  id="radio-group-review"
  class="review-card"
  aria-labelledby="radio-group-heading"
>
  <div class="section-heading">
    <div>
      <p class="eyebrow">Form choices</p>
      <h2 id="radio-group-heading">Radio Group</h2>
    </div>
    <span class="component-label hidden sm:inline-block">radio-group</span>
  </div>
  <p>Choose a delivery method. Reset restores the initial selection.</p>
  <DocsExample component="radio-group" />
  <div data-additional-examples>
    <h3 class="review-subheading">Additional examples</h3>
    <div class="review-grid">
      <form
        class="scenario"
        onsubmit={(event) => {
          event.preventDefault();
          submitted = String(new FormData(event.currentTarget).get("delivery"));
        }}
      >
        <h3 class="review-subheading">Delivery method</h3>
        <RadioGroup.Root
          defaultValue="standard"
          bind:value={delivery}
          name="delivery"
          legend="Delivery method"
          required
          tabindex={-1}
          onValueChange={() => changes++}
          ref={(node) => {
            group = node;
          }}
        >
          <div class="demo-row">
            <RadioGroup.Item
              id="delivery-standard"
              aria-labelledby="delivery-standard-label"
              value="standard"
            /><Label id="delivery-standard-label" for="delivery-standard">Standard delivery</Label>
          </div>
          <div class="demo-row">
            <RadioGroup.Item
              id="delivery-express"
              aria-labelledby="delivery-express-label"
              value="express"
            /><Label id="delivery-express-label" for="delivery-express">Express delivery</Label>
          </div>
          <div class="demo-row">
            <RadioGroup.Item
              id="delivery-pickup"
              aria-labelledby="delivery-pickup-label"
              value="pickup"
            /><Label id="delivery-pickup-label" for="delivery-pickup">Store pickup</Label>
          </div>
        </RadioGroup.Root>
        <output data-radio-status class="review-output" aria-live="polite"
          >Selected: {delivery ?? "none"}. Changes: {changes}.</output
        >
        <div class="demo-row mt-4">
          <Button type="submit" size="sm">Submit delivery</Button><Button
            type="reset"
            size="sm"
            variant="outline">Reset delivery</Button
          ><Button size="sm" variant="outline" onclick={() => group?.focus()}>Focus delivery</Button
          >
        </div>
        <output data-radio-submitted class="review-output" aria-live="polite">{submitted}</output>
      </form>
      <div class="scenario">
        <h3 class="review-subheading">Custom icon and unavailable option</h3>
        <RadioGroup.Root
          defaultValue="priority"
          legend="Priority"
          orientation="horizontal"
          size="lg"
        >
          <div class="demo-row">
            <RadioGroup.Item
              id="priority-custom"
              aria-labelledby="priority-custom-label"
              value="priority"
              variant="primary"
              >{#snippet icon()}<svg data-custom-radio-icon viewBox="0 0 24 24" aria-hidden="true"
                  ><path d="m12 2 3 7 7 3-7 3-3 7-3-7-7-3 7-3Z" /></svg
                >{/snippet}</RadioGroup.Item
            ><Label id="priority-custom-label" for="priority-custom">Priority</Label>
          </div>
          <div class="demo-row">
            <RadioGroup.Item
              id="priority-disabled"
              aria-labelledby="priority-disabled-label"
              value="unavailable"
              disabled
            /><Label id="priority-disabled-label" for="priority-disabled">Unavailable</Label>
          </div>
        </RadioGroup.Root>
      </div>
    </div>
    <details class="source-example">
      <summary>Source example</summary>
      <pre><code>{source}</code></pre>
    </details>
  </div>
</section>
