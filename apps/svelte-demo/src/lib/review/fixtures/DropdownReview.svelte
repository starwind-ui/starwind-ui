<script lang="ts">
  import Dropdown from "$lib/starwind-runtime/dropdown";
  import { Button } from "$lib/starwind-runtime/button";
  let open = $state<boolean | undefined>(false);
  let checked = $state<boolean | undefined>(true);
  let value = $state<string | undefined>("one");
  let cancel = $state(false);
  let key = $state(0);
</script>

<section id="dropdown-fixture" class="review-card" aria-labelledby="dropdown-fixture-heading">
  <h2 id="dropdown-fixture-heading">Dropdown lifecycle</h2>
  <div class="flex flex-wrap gap-3">
    <Button
      variant="outline"
      onclick={() => {
        key++;
      }}>Replace Dropdown parts</Button
    >
    <Button
      variant="outline"
      onclick={() => {
        cancel = !cancel;
      }}>Cancel proposals: {cancel ? "on" : "off"}</Button
    >
    <Dropdown.Root bind:open>
      {#key key}
        <Dropdown.Trigger
          >{#snippet child({ props, children })}<Button {...props} variant="outline"
              >{@render children?.()}</Button
            >{/snippet}Fixture menu</Dropdown.Trigger
        >
        <Dropdown.Content data-dropdown-fixture>
          <Dropdown.CheckboxItem
            bind:checked
            onCheckedChange={(_next, detail) => {
              if (cancel) detail.cancel();
            }}>Notifications</Dropdown.CheckboxItem
          >
          <Dropdown.RadioGroup
            bind:value
            onValueChange={(_next, detail) => {
              if (cancel) detail.cancel();
            }}
          >
            <Dropdown.RadioItem value="one">First</Dropdown.RadioItem><Dropdown.RadioItem
              value="two">Second</Dropdown.RadioItem
            >
          </Dropdown.RadioGroup>
          <Dropdown.Item>Done</Dropdown.Item>
        </Dropdown.Content>
      {/key}
    </Dropdown.Root>
  </div>
  <output data-dropdown-fixture-models
    >Open: {String(open)} · Checked: {String(checked)} · Value: {value}</output
  >
</section>
