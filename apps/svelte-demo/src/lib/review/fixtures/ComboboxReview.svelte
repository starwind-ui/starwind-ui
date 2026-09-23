<script lang="ts">
  import Box from "$lib/starwind-runtime/combobox";
  import { Button } from "$lib/starwind-runtime/button";
  let value = $state<string | null | undefined>(undefined),
    inputValue = $state<string | undefined>(undefined),
    open = $state<boolean | undefined>(undefined);
  let inputKey = $state(0),
    popupKey = $state(0),
    cancel = $state(false),
    disabled = $state(false),
    readOnly = $state(false);
</script>

<section id="combobox-fixture" class="review-card" aria-labelledby="combobox-fixture-heading">
  <h2 id="combobox-fixture-heading">Combobox lifecycle</h2>
  <div class="flex flex-wrap gap-3">
    <Button variant="outline" onclick={() => inputKey++}>Replace Combobox Input</Button><Button
      variant="outline"
      onclick={() => popupKey++}>Replace Combobox Popup</Button
    >
    <Button variant="outline" onclick={() => (cancel = !cancel)}
      >Cancel Combobox selection: {cancel ? "on" : "off"}</Button
    ><Button variant="outline" onclick={() => (disabled = !disabled)}
      >Combobox disabled: {disabled ? "on" : "off"}</Button
    ><Button variant="outline" onclick={() => (readOnly = !readOnly)}
      >Combobox read only: {readOnly ? "on" : "off"}</Button
    >
  </div>
  <form class="grid w-full max-w-sm gap-3" onsubmit={(event) => event.preventDefault()}>
    <Box.Root
      name="fixture-framework"
      defaultValue="astro"
      bind:value
      bind:inputValue
      bind:open
      {disabled}
      {readOnly}
      onValueChange={(_next, detail) => {
        if (cancel) detail.cancel();
      }}
    >
      <Box.Label>Fixture framework</Box.Label>
      {#key inputKey}<Box.Input
          data-combobox-fixture-input
          placeholder="Find a framework"
          showClear
        />{/key}
      {#key popupKey}<Box.Content data-combobox-fixture-popup
          ><Box.Empty>No matching framework.</Box.Empty><Box.Item value="astro">Astro</Box.Item
          ><Box.Item value="react">React</Box.Item><Box.Item value="vue">Vue</Box.Item><Box.Item
            value="svelte">Svelte</Box.Item
          ></Box.Content
        >{/key}
    </Box.Root>
    <Button type="reset" variant="outline">Reset Combobox</Button>
  </form>
  <output data-combobox-fixture-model
    >Selection: {value ?? "none"}. Text: {inputValue ?? ""}. Open: {String(open ?? false)}.</output
  >
</section>
