<script lang="ts">
  import DocsExample from "./DocsExample.svelte";
  import source from "./examples/SelectExample.svelte?raw";
  import childSource from "./examples/SelectChildExample.svelte?raw";
  import Select from "$lib/starwind-runtime/select";
  import { Button } from "$lib/starwind-runtime/button";
  let value = $state<string | null | undefined>(undefined);
  let open = $state<boolean | undefined>(undefined);
  let submitted = $state("Submit the form to inspect its value.");
  const sizes = ["sm", "md", "lg"] as const;
</script>

{#snippet choices()}
  <Select.Group>
    <Select.Label>Available choices</Select.Label>
    <Select.Item value="alpha">Alpha</Select.Item>
    <Select.Item value="unavailable" disabled>Unavailable</Select.Item>
    <Select.Item value="beta">Beta</Select.Item>
    <Select.Item value="gamma">Gamma</Select.Item>
  </Select.Group>
  <Select.Separator />
  <Select.Item value="delta">Delta</Select.Item>
{/snippet}

<section
  data-styled-review="select"
  id="select-review"
  class="review-card"
  aria-labelledby="select-heading"
>
  <div class="section-heading">
    <div>
      <p class="eyebrow">Choose one</p>
      <h2 id="select-heading">Select</h2>
    </div>
    <span class="component-label hidden sm:inline-block">select</span>
  </div>
  <p>Open a list with Enter or Space. Use the arrow keys to move, then press Enter to select.</p>
  <DocsExample component="select" />
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
        <span id="form-choice-label" class="mb-2 block font-medium">Form choice</span>
        <Select.Root name="choice" defaultValue="alpha" bind:value bind:open>
          <Select.Trigger aria-labelledby="form-choice-label" class="w-full" placeholder="Choose" />
          <Select.Content aria-label="Form choices">{@render choices()}</Select.Content>
        </Select.Root>
        <output class="review-output" aria-label="Select binding" aria-live="polite"
          >Choice: {value ?? "unset"} · List: {open ? "open" : "closed"}</output
        >
        <div class="demo-row mt-4">
          <Button type="submit" size="sm">Submit selection</Button><Button
            type="reset"
            size="sm"
            variant="outline">Reset selection</Button
          >
        </div>
        <output class="review-output" aria-label="Submitted selection" aria-live="polite"
          >{submitted}</output
        >
      </form>
      <div class="scenario">
        <h3 class="review-subheading">Styled Button trigger</h3>
        <span id="action-choice-label" class="mb-2 block font-medium">Action choice</span>
        <Select.Root defaultValue="beta">
          <Select.Trigger aria-labelledby="action-choice-label" class="w-full">
            {#snippet child({ props, children })}<Button
                {...props}
                variant="outline"
                class={["w-full", props.class]}
                >{@render children?.()}<span aria-hidden="true">⌄</span></Button
              >{/snippet}
            <Select.Value placeholder="Choose"
              >{#snippet children(label, selected)}{label ??
                  selected ??
                  "Choose"}{/snippet}</Select.Value
            >
          </Select.Trigger>
          <Select.Content aria-label="Action choices">{@render choices()}</Select.Content>
        </Select.Root>
      </div>
      <div class="scenario full-width">
        <h3 class="review-subheading">Disabled and read-only states</h3>
        <div class="grid gap-4 sm:grid-cols-2">
          <div class="grid gap-2">
            <span id="disabled-choice-label" class="font-medium">Disabled choice</span>
            <Select.Root disabled defaultValue="alpha">
              <Select.Trigger aria-labelledby="disabled-choice-label" class="w-full" />
              <Select.Content>{@render choices()}</Select.Content>
            </Select.Root>
          </div>
          <div class="grid gap-2">
            <span id="readonly-choice-label" class="font-medium">Read-only choice</span>
            <Select.Root readOnly defaultValue="beta">
              <Select.Trigger aria-labelledby="readonly-choice-label" class="w-full" />
              <Select.Content>{@render choices()}</Select.Content>
            </Select.Root>
          </div>
        </div>
      </div>
      <div class="scenario full-width">
        <h3 class="review-subheading">Sizes</h3>
        <div class="grid gap-4 sm:grid-cols-3">
          {#each sizes as size (size)}
            <Select.Root
              ><Select.Trigger
                aria-label={`Size ${size}`}
                {size}
                class="w-full"
                placeholder={size.toUpperCase()}
              /><Select.Content {size} aria-label={`Size ${size} choices`}
                >{@render choices()}</Select.Content
              ></Select.Root
            >
          {/each}
        </div>
      </div>
    </div>
    <p class="text-sm" data-example-overrides>
      Explicit layout overrides: triggers and forwarded buttons fill their form rows.
    </p>
    <details class="source-example">
      <summary>Source example</summary>
      <pre><code>{source}</code></pre>
    </details>
    <details class="source-example">
      <summary>Button trigger source</summary>
      <pre><code>{childSource}</code></pre>
    </details>
  </div>
</section>
