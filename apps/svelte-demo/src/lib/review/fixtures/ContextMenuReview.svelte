<script lang="ts">
  import ContextMenu from "$lib/starwind-runtime/context-menu";
  import { Button } from "$lib/starwind-runtime/button";
  let open = $state<boolean | undefined>(false);
  let checked = $state<boolean | undefined>(true);
  let value = $state<string | undefined>("one");
  let cancel = $state(false);
  let key = $state(0);
</script>

<section
  id="context-menu-fixture"
  class="review-card"
  aria-labelledby="context-menu-fixture-heading"
>
  <h2 id="context-menu-fixture-heading">Context Menu lifecycle</h2>
  <div class="flex flex-wrap gap-3">
    <Button
      variant="outline"
      onclick={() => {
        key++;
      }}>Replace Context Menu parts</Button
    >
    <Button
      variant="outline"
      onclick={() => {
        cancel = !cancel;
      }}>Cancel Context proposals: {cancel ? "on" : "off"}</Button
    >
    <ContextMenu.Root bind:open>
      {#key key}
        <ContextMenu.Trigger
          class="rounded-lg border border-dashed p-6"
          data-context-fixture-trigger>Fixture context menu</ContextMenu.Trigger
        >
        <ContextMenu.Content data-context-fixture>
          <ContextMenu.CheckboxItem
            bind:checked
            onCheckedChange={(_next, detail) => {
              if (cancel) detail.cancel();
            }}>Notifications</ContextMenu.CheckboxItem
          >
          <ContextMenu.RadioGroup
            bind:value
            onValueChange={(_next, detail) => {
              if (cancel) detail.cancel();
            }}
          >
            <ContextMenu.RadioItem value="one">First</ContextMenu.RadioItem>
            <ContextMenu.RadioItem value="two">Second</ContextMenu.RadioItem>
          </ContextMenu.RadioGroup>
          <ContextMenu.Item>Done</ContextMenu.Item>
        </ContextMenu.Content>
      {/key}
    </ContextMenu.Root>
  </div>
  <output data-context-fixture-models
    >Open: {String(open)} · Checked: {String(checked)} · Value: {value}</output
  >
</section>
