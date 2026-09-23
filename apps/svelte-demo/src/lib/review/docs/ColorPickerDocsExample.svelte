<script lang="ts">
  import { ColorPicker } from "$lib/starwind-runtime/color-picker";
  import type { ColorPickerValue, ColorPickerFormat } from "@starwind-ui/svelte/color-picker";
  let accent = $state.raw<ColorPickerValue | undefined>("#7c3aed");
  let format = $state<ColorPickerFormat | undefined>("hex");
  let open = $state<boolean | undefined>(false);
  let canvas = $state.raw<ColorPickerValue | undefined>("#0d9488");
  // portalContainer must stay inside its owning Color Picker. External targets and targets
  // inside another picker use local placement so editing and submitted values stay connected.
  const swatches = [
    { value: "#7c3aed", label: "Violet" },
    { value: "#2563eb", label: "Blue" },
    { value: "#0d9488", label: "Teal" },
    { value: "#ea580c", label: "Orange" },
  ];
</script>

<form class="grid w-full gap-8 lg:grid-cols-2" data-color-picker-form>
  <div class="min-h-112 min-w-0" data-color-picker-example="popup">
    <h4 class="mb-4 text-sm font-medium">Brand accent</h4>
    <ColorPicker
      bind:value={accent}
      bind:format
      bind:open
      label="Accent"
      name="accent"
      {swatches}
      clearable
      showEyeDropper={false}
      size="sm"
    />
    <p class="mt-4 max-w-xs text-sm text-muted-foreground">
      Open the editor to choose a color. Switch formats or enter a value.
    </p>
    <output class="mt-3 block text-sm font-mono" data-color-picker-value
      >{typeof accent === "string" ? accent : (accent?.toString("hex") ?? "Empty")}</output
    >
  </div>
  <div class="min-w-0" data-color-picker-example="inline">
    <h4 class="mb-4 text-sm font-medium">Canvas color</h4>
    <ColorPicker
      inline
      bind:value={canvas}
      label="Canvas"
      name="canvas"
      formatControl="native"
      {swatches}
      size="sm"
      showEyeDropper={false}
      class="w-full max-w-xs rounded-xl border bg-card p-4 shadow-xs"
    />
  </div>
</form>
