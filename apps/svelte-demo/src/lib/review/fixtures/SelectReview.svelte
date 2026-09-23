<script lang="ts">
  import Select from "$lib/starwind-runtime/select";
  import { Button } from "$lib/starwind-runtime/button";
  let value = $state<string | null | undefined>(undefined);
  let open = $state<boolean | undefined>(undefined);
  let approved = $state<string | null>("alpha");
  let cancel = $state(true);
  let proposals = $state(0);
  let shown = $state(true);
  let submitted = $state("Submit the form to inspect its value.");
  const sizes = ["sm", "md", "lg"] as const;
  const source = `<Select.Root name="choice" defaultValue="alpha" bind:value bind:open>\n  <Select.Trigger aria-label="Choice" placeholder="Choose" />\n  <Select.Content>\n    <Select.Item value="alpha">Alpha</Select.Item>\n    <Select.Item value="beta">Beta</Select.Item>\n  </Select.Content>\n</Select.Root>`;
  const childSource = `<Select.Trigger aria-label="Action choice">\n  {#snippet child({ props, children })}\n    <Button {...props} variant="outline">\n      {@render children?.()}\n    </Button>\n  {/snippet}\n  <Select.Value placeholder="Choose" />\n</Select.Trigger>`;
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

<section id="select-review" class="review-card mb-6" aria-labelledby="select-heading">
  <div class="section-heading">
    <div>
      <p class="eyebrow">Choose one</p>
      <h2 id="select-heading">Select</h2>
    </div>
    <span class="component-label">select</span>
  </div>
  <p>Open a list with Enter or Space. Use the arrow keys to move, then press Enter to select.</p>
  <div class="review-grid">
    <form
      class="scenario"
      onsubmit={(event) => {
        event.preventDefault();
        submitted = JSON.stringify(Object.fromEntries(new FormData(event.currentTarget)));
      }}
    >
      <h3 class="review-subheading">Binding and form reset</h3>
      <Select.Root name="choice" defaultValue="alpha" bind:value bind:open>
        <Select.Trigger aria-label="Form choice" class="w-full" placeholder="Choose" />
        <Select.Content aria-label="Form choices">{@render choices()}</Select.Content>
      </Select.Root>
      <output class="review-output" aria-label="Select binding" aria-live="polite"
        >Choice: {value ?? "unset"} · Open: {String(open)}</output
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
      <h3 class="review-subheading">Cancel a selection</h3>
      <Select.Root
        bind:value={approved}
        onValueChange={(_next, detail) => {
          proposals++;
          if (cancel) detail.cancel();
        }}
      >
        <Select.Trigger aria-label="Approval choice" class="w-full" placeholder="Choose" />
        <Select.Content aria-label="Approval choices">{@render choices()}</Select.Content>
      </Select.Root>
      <output class="review-output" aria-label="Select approval" aria-live="polite"
        >Approved: {approved} · Proposals: {proposals}</output
      >
      <Button class="mt-4" size="sm" variant="secondary" onclick={() => (cancel = !cancel)}
        >{cancel ? "Allow selection" : "Cancel selection"}</Button
      >
      <p>{cancel ? "The callback cancels each proposed value." : "Selections update the value."}</p>
    </div>
    <div class="scenario">
      <h3 class="review-subheading">Styled Button trigger</h3>
      {#if shown}
        <Select.Root defaultValue="beta">
          <Select.Trigger aria-label="Action choice" class="w-full">
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
      {/if}
      <Button class="mt-4" size="sm" variant="secondary" onclick={() => (shown = !shown)}
        >{shown ? "Remove Select" : "Restore Select"}</Button
      >
      <p>Remove and restore this example to check its portal cleanup.</p>
    </div>
    <div class="scenario">
      <h3 class="review-subheading">Disabled and read-only states</h3>
      <div class="grid gap-4">
        <Select.Root disabled defaultValue="alpha"
          ><Select.Trigger aria-label="Disabled choice" class="w-full" /><Select.Content
            >{@render choices()}</Select.Content
          ></Select.Root
        >
        <Select.Root readOnly defaultValue="beta"
          ><Select.Trigger aria-label="Read-only choice" class="w-full" /><Select.Content
            >{@render choices()}</Select.Content
          ></Select.Root
        >
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
  <details class="source-example">
    <summary>Source example</summary>
    <pre><code>{source}</code></pre>
  </details>
  <details class="source-example">
    <summary>Button trigger source</summary>
    <pre><code>{childSource}</code></pre>
  </details>
</section>
