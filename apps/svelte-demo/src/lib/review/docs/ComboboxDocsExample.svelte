<script lang="ts">
  import {
    Combobox,
    ComboboxContent,
    ComboboxEmpty,
    ComboboxInput,
    ComboboxItem,
    ComboboxLabel,
  } from "$lib/starwind-runtime/combobox";
</script>

<div class="w-full max-w-sm">
  <Combobox id="combobox-framework" name="framework" required>
    <ComboboxLabel>Framework</ComboboxLabel>
    <ComboboxInput placeholder="Search frameworks" />
    <ComboboxContent>
      <ComboboxEmpty>No framework found.</ComboboxEmpty>
      <ComboboxItem value="astro">Astro</ComboboxItem>
      <ComboboxItem value="react">React</ComboboxItem>
      <ComboboxItem value="vue">Vue</ComboboxItem>
      <ComboboxItem value="svelte">Svelte</ComboboxItem>
      <ComboboxItem value="solid">Solid</ComboboxItem>
    </ComboboxContent>
  </Combobox>
</div>
