<script lang="ts">
  import Checkbox, { CheckboxVariants } from "$lib/starwind-runtime/checkbox";
  import { Button } from "$lib/starwind-runtime/button";
  import type { VariantProps } from "tailwind-variants";
  let updates = $state<boolean | undefined>(undefined);
  let cancel = $state(true);
  let approval = $state(false);
  let proposals = $state(0);
  let submitted = $state("Submit the form to inspect its values.");
  const variants = Object.keys(CheckboxVariants.checkbox.variants.variant) as NonNullable<
    VariantProps<typeof CheckboxVariants.checkbox>["variant"]
  >[];
  const sizes = ["sm", "md", "lg"] as const;
  const source = `<Checkbox\n  id="updates"\n  label="Receive product updates"\n  name="updates"\n  defaultChecked\n  bind:checked={updates}\n/>`;
</script>

<section id="checkbox-review" class="review-card mb-6" aria-labelledby="checkbox-heading">
  <div class="section-heading">
    <div>
      <p class="eyebrow">Form choices</p>
      <h2 id="checkbox-heading">Checkbox</h2>
    </div>
    <span class="component-label">checkbox</span>
  </div>
  <p>
    Use a labeled choice for a boolean value. Try the form reset and compare the available states.
  </p>
  <div class="review-grid">
    <form
      class="scenario"
      onsubmit={(event) => {
        event.preventDefault();
        submitted = JSON.stringify(Object.fromEntries(new FormData(event.currentTarget)));
      }}
    >
      <h3 class="review-subheading">Binding and form reset</h3>
      <Checkbox
        id="review-updates"
        label="Receive product updates"
        name="updates"
        value="yes"
        uncheckedValue="no"
        defaultChecked
        bind:checked={updates}
        variant="primary"
      />
      <div class="mt-4">
        <Checkbox
          id="review-disabled-choice"
          label="Unavailable choice"
          name="unavailable"
          value="yes"
          disabled
          defaultChecked
        />
      </div>
      <output class="review-output" aria-live="polite" aria-label="Updates binding"
        >Updates: {updates === undefined ? "unset" : String(updates)}</output
      >
      <div class="demo-row mt-4">
        <Button type="submit" size="sm">Submit choices</Button><Button
          type="reset"
          size="sm"
          variant="outline">Reset choices</Button
        >
      </div>
      <output class="review-output" aria-live="polite" aria-label="Submitted choices"
        >{submitted}</output
      >
    </form>
    <div class="scenario">
      <h3 class="review-subheading">Cancel a change</h3>
      <Checkbox
        id="review-approval"
        label="Approve the change"
        bind:checked={approval}
        onCheckedChange={(_next, detail) => {
          proposals++;
          if (cancel) detail.cancel();
        }}
      />
      <output class="review-output" aria-live="polite" aria-label="Approval state"
        >Approved: {String(approval)} · Proposals: {proposals}</output
      >
      <Button class="mt-4" size="sm" variant="secondary" onclick={() => (cancel = !cancel)}
        >{cancel ? "Allow changes" : "Cancel changes"}</Button
      >
      <p>{cancel ? "Changes are canceled by the callback." : "Changes are accepted."}</p>
    </div>
    <div class="scenario">
      <h3 class="review-subheading">Mixed and read-only states</h3>
      <div class="grid gap-4">
        <Checkbox id="review-mixed" label="Mixed selection" variant="secondary" indeterminate />
        <Checkbox id="review-readonly" label="Read-only selection" readOnly defaultChecked />
      </div>
    </div>
    <div class="scenario">
      <h3 class="review-subheading">Sizes</h3>
      <div class="grid gap-4">
        {#each sizes as size (size)}<Checkbox
            id={`review-checkbox-${size}`}
            label={size.toUpperCase()}
            {size}
            defaultChecked
          />{/each}
      </div>
    </div>
    <div class="scenario full-width">
      <h3 class="review-subheading">Variants</h3>
      <div class="demo-row">
        {#each variants as variant (variant)}<Checkbox
            id={`review-checkbox-${variant}`}
            label={variant[0].toUpperCase() + variant.slice(1)}
            {variant}
            defaultChecked
          />{/each}
      </div>
    </div>
  </div>
  <details class="source-example">
    <summary>Source example</summary>
    <pre><code>{source}</code></pre>
  </details>
</section>
