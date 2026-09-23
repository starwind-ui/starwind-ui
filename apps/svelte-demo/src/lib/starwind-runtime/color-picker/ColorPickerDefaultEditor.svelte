<script module lang="ts">
  import type { ComponentProps, Snippet } from "svelte";
  import type { VariantProps } from "tailwind-variants";
  import { cx } from "tailwind-variants";
  import { colorPicker, colorPickerLabel, colorPickerControl, colorPickerTrigger, colorPickerContent, colorPickerInput, colorPickerValueInputLayout, colorPickerArea, colorPickerAreaThumb, colorPickerSliders, colorPickerSliderActionRow, colorPickerValueFormatRow, colorPickerSeparator, colorPickerChannelSlider, colorPickerChannelSliderThumb, colorPickerChannelInputLayout, colorPickerSwatch, colorPickerSwatchGroup, colorPickerValueSwatch, colorPickerFormatSelectTrigger, colorPickerAction, colorPickerHiddenInput, colorPickerChannelInput, colorPickerValueInput, colorPickerNativeFormatSelectWrapper, colorPickerNativeFormatSelect, colorPickerNativeFormatSelectIcon } from "./variants.js";
  import { default as ColorPickerArea } from "./ColorPickerArea.svelte";
  import { default as ColorPickerChannelSlider } from "./ColorPickerChannelSlider.svelte";
  import { default as ColorPickerEyeDropper } from "./ColorPickerEyeDropper.svelte";
  import { default as ColorPickerInput } from "./ColorPickerInput.svelte";
  import { default as ColorPickerSwatchGroup } from "./ColorPickerSwatchGroup.svelte";
  import { default as ColorPickerSwatch } from "./ColorPickerSwatch.svelte";
  import { default as ColorPickerClear } from "./ColorPickerClear.svelte";

  export type ColorPickerDefaultEditorProps = {} & {children?:Snippet; size?: "sm" | "md" | "lg"; showEyeDropper?: boolean; portalContainer?: string; disablePortal?: boolean; formatControl?: "select" | "native" | "none"; formats?: readonly import("@starwind-ui/svelte/color-picker").ColorPickerFormat[]; swatches?: readonly (import("@starwind-ui/svelte/color-picker").ColorPickerValue | { value: import("@starwind-ui/svelte/color-picker").ColorPickerValue; label: string; disabled?: boolean })[]; };
</script>

<script lang="ts">
  let {
    "size": size = "md",
    "showEyeDropper": showEyeDropper = true,
    "portalContainer": portalContainer,
    "disablePortal": disablePortal = false,
    "formatControl": formatControl = "select",
    "formats": formats = ["hex","rgb","hsl","hsb"],
    "swatches": swatches = [],
    "children": children
  }: ColorPickerDefaultEditorProps = $props();

  let isSwatchDescriptor = $derived((swatch: (typeof swatches)[number]): swatch is Extract<(typeof swatches)[number], { value: unknown }> => typeof swatch === "object" && swatch !== null && "value" in swatch && "label" in swatch);

  let normalizedSwatches = $derived(swatches.map((swatch) => isSwatchDescriptor(swatch) ? swatch : { value: swatch, label: String(swatch), disabled: undefined }));

  let hasSwatchesAttribute = $derived(normalizedSwatches.length > 0 ? "true" : "false");
</script>

<ColorPickerArea>

</ColorPickerArea>
<div
  class={colorPickerSliderActionRow({  })}
  data-slot={"color-picker-slider-action-row"}
>
  <div
    class={colorPickerSliders({ "class": cx("min-w-0 flex-1") })}
    data-slot={"color-picker-sliders"}
  >
    <ColorPickerChannelSlider
      channel={"hue"}
    >

    </ColorPickerChannelSlider>
    <ColorPickerChannelSlider
      channel={"alpha"}
    >

    </ColorPickerChannelSlider>
  </div>
  {#if showEyeDropper}
    <ColorPickerEyeDropper
      aria-label={"Pick a color from the screen"}
    >
      <svg
        xmlns={"http://www.w3.org/2000/svg"}
        viewBox={"0 0 24 24"}
        fill={"none"}
        stroke={"currentColor"}
        stroke-width={"2"}
        stroke-linecap={"round"}
        stroke-linejoin={"round"}
        aria-hidden={"true"}
        class={"size-4"}
      >
        <path
          stroke={"none"}
          d={"M0 0h24v24H0z"}
          fill={"none"}
        />
        <path
          d={"M11 7l6 6"}
        />
        <path
          d={"M4 16l11.7 -11.7a1 1 0 0 1 3 3l-11.7 11.7h-3v-3z"}
        />
      </svg>
    </ColorPickerEyeDropper>
  {/if}
</div>
<div
  class={colorPickerValueFormatRow({  })}
  data-slot={"color-picker-value-format-row"}
>
  <ColorPickerInput
    formatContentSize={size}
    formatControl={formatControl}
    formats={formats}
    portalContainer={portalContainer}
    disablePortal={disablePortal}
    class={"min-w-0 flex-1"}
  >

  </ColorPickerInput>
</div>
<div
  class={"contents"}
  data-has-swatches={hasSwatchesAttribute}
  data-slot={"color-picker-footer"}
>
  <div
    class={colorPickerSeparator({  })}
    role={"separator"}
    aria-hidden={"true"}
    data-slot={"color-picker-separator"}
  >

  </div>
  {#if normalizedSwatches.length > 0}
    <ColorPickerSwatchGroup
      aria-label={"Suggested colors"}
    >
      {#each normalizedSwatches as swatch, swatchIndex (swatchIndex)}
        <ColorPickerSwatch
          value={swatch.value}
          disabled={swatch.disabled}
          aria-label={swatch.label}
        >

        </ColorPickerSwatch>
      {/each}
    </ColorPickerSwatchGroup>
  {/if}
  <ColorPickerClear
    aria-label={"Clear color"}
  >
    Clear
  </ColorPickerClear>
</div>
