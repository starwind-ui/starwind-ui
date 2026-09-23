<script lang="ts">
  import Picker from "$lib/starwind-runtime/color-picker";
  import type { ColorPickerValue } from "@starwind-ui/svelte/color-picker";
  let value = $state.raw<ColorPickerValue | undefined>("#2563eb");
</script>

<form class="w-full max-w-sm" data-color-picker-custom>
  <Picker.Root inline bind:value name="custom-accent" clearable label="Custom palette">
    <p class="text-sm font-medium">Choose a palette color</p>
    <Picker.SwatchGroup aria-label="Palette">
      <Picker.Swatch value="#2563eb" aria-label="Blue" />
      <Picker.Swatch value="#7c3aed" aria-label="Violet" />
      <Picker.Swatch value="#0d9488" aria-label="Teal" />
    </Picker.SwatchGroup>
    <Picker.Input formatControl="none" />
    <Picker.Clear class="self-start">Clear selection</Picker.Clear>
  </Picker.Root>
</form>
