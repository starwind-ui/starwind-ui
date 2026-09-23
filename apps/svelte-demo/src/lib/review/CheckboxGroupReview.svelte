<script lang="ts">
  import DocsExample from "./DocsExample.svelte";
  import source from "./examples/CheckboxGroupExample.svelte?raw";
  import CheckboxGroup from "$lib/starwind-runtime/checkbox-group";
  import Checkbox from "$lib/starwind-runtime/checkbox";
  import { Button } from "$lib/starwind-runtime/button";
  let channels = $state<string[] | undefined>();
  let changes = $state(0);
  let submitted = $state("Submit to inspect the selected values.");
  let group: HTMLDivElement | null = null;
</script>

<section
  data-styled-review="checkbox-group"
  id="checkbox-group-review"
  class="review-card"
  aria-labelledby="checkbox-group-heading"
>
  <div class="section-heading">
    <div>
      <p class="eyebrow">Form choices</p>
      <h2 id="checkbox-group-heading">Checkbox Group</h2>
    </div>
    <span class="component-label hidden sm:inline-block">checkbox-group</span>
  </div>
  <p>Select the channels that you want to use. Reset restores the initial selection.</p>
  <DocsExample component="checkbox-group" />
  <div data-additional-examples>
    <h3 class="review-subheading">Additional examples</h3>
    <div class="review-grid">
      <form
        class="scenario"
        onsubmit={(event) => {
          event.preventDefault();
          submitted = JSON.stringify(new FormData(event.currentTarget).getAll("channels"));
        }}
      >
        <h3 class="review-subheading">Contact channels</h3>
        <CheckboxGroup
          id="review-channel-group"
          defaultValue={["email"]}
          bind:value={channels}
          onValueChange={() => changes++}
          aria-label="Contact channels"
          tabindex={-1}
          ref={(node) => {
            group = node;
          }}
        >
          <Checkbox id="review-channel-email" name="channels" value="email" label="Email" />
          <Checkbox id="review-channel-sms" name="channels" value="sms" label="Text message" />
          <Checkbox id="review-channel-post" name="channels" value="post" label="Post" />
        </CheckboxGroup>
        <output data-checkbox-group-status class="review-output" aria-live="polite"
          >Selected: {channels?.join(", ") || "none"}. Changes: {changes}.</output
        >
        <div class="demo-row mt-4">
          <Button type="submit" size="sm">Submit channels</Button><Button
            type="reset"
            size="sm"
            variant="outline">Reset channels</Button
          ><Button type="button" size="sm" variant="outline" onclick={() => group?.focus()}
            >Focus group</Button
          >
        </div>
        <output data-checkbox-group-submitted class="review-output" aria-live="polite"
          >{submitted}</output
        >
      </form>
      <div class="scenario">
        <h3 class="review-subheading">Unavailable group</h3>
        <CheckboxGroup
          id="review-disabled-channels"
          defaultValue={["email"]}
          disabled
          aria-label="Unavailable channels"
        >
          <Checkbox
            id="review-disabled-email"
            name="channels"
            value="email"
            label="Email delivery"
          />
          <Checkbox id="review-disabled-sms" name="channels" value="sms" label="Text delivery" />
        </CheckboxGroup>
      </div>
    </div>
    <details class="source-example">
      <summary>Source example</summary>
      <pre><code>{source}</code></pre>
    </details>
  </div>
</section>
