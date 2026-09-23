<script module lang="ts">
  import type { ComponentProps, Snippet } from "svelte";
  import type { VariantProps } from "tailwind-variants";
  import { cx } from "tailwind-variants";
  import { colorPicker, colorPickerLabel, colorPickerControl, colorPickerTrigger, colorPickerContent, colorPickerInput, colorPickerValueInputLayout, colorPickerArea, colorPickerAreaThumb, colorPickerSliders, colorPickerSliderActionRow, colorPickerValueFormatRow, colorPickerSeparator, colorPickerChannelSlider, colorPickerChannelSliderThumb, colorPickerChannelInputLayout, colorPickerSwatch, colorPickerSwatchGroup, colorPickerValueSwatch, colorPickerFormatSelectTrigger, colorPickerAction, colorPickerHiddenInput, colorPickerChannelInput, colorPickerValueInput, colorPickerNativeFormatSelectWrapper, colorPickerNativeFormatSelect, colorPickerNativeFormatSelectIcon } from "./variants.js";
  import { untrack } from "svelte";
  import type { Attachment } from "svelte/attachments";
  import type { HTMLAttributes } from "svelte/elements";
  import { ColorPickerValueInput } from "@starwind-ui/svelte/color-picker";
  import { ColorPickerFormatSelect } from "@starwind-ui/svelte/color-picker";
  import { NativeSelectOption } from "../native-select/index.js";
  import { ColorPickerFormatControl } from "@starwind-ui/svelte/color-picker";
  import { Select } from "../select/index.js";
  import { SelectTrigger } from "../select/index.js";
  import { SelectContent } from "../select/index.js";
  import { SelectItem } from "../select/index.js";
  import "./styles.css";

  export type ColorPickerInputProps = HTMLAttributes<HTMLDivElement> & {ref?:(node:HTMLDivElement|null)=>void} & {children?:Snippet; formatControl?: "select" | "native" | "none"; formats?: readonly import("@starwind-ui/svelte/color-picker").ColorPickerFormat[]; formatContentSize?: "sm" | "md" | "lg"; portalContainer?: string; disablePortal?: boolean; };
</script>

<script lang="ts">
  let {
    "formatControl": formatControl = "select",
    "formats": formats = ["hex","rgb","hsl","hsb"],
    "formatContentSize": formatContentSize = "md",
    "portalContainer": portalContainer,
    "disablePortal": disablePortal = false,
    "class": className,
    "ref": ref,
    "children": children,
    ...rest
  }: ColorPickerInputProps = $props();

  let normalizedFormats = $derived(Array.from(new Set(formats)));

  const attachRef: Attachment<HTMLDivElement> = (node) => { $effect(() => { const callback=ref; untrack(()=>callback?.(node)); return()=>untrack(()=>callback?.(null)); }); };
</script>

<div
  class={colorPickerInput({ "class": cx(className) })}
  {...rest}
  data-slot={"color-picker-input"}
  {@attach attachRef}
>
  <ColorPickerValueInput
    class={[colorPickerValueInput({  }), colorPickerValueInputLayout({  })].filter(Boolean).join(" ")}
    data-slot={"color-picker-value-input"}
  >

  </ColorPickerValueInput>
  {#if formatControl === "native"}
    <div
      class={colorPickerNativeFormatSelectWrapper({  })}
      data-slot={"color-picker-native-format-select-wrapper"}
    >
      <ColorPickerFormatSelect
        class={colorPickerNativeFormatSelect({  })}
        aria-label={"Color format"}
        data-slot={"color-picker-native-format-select"}
      >
        {#each normalizedFormats as formatOption, formatIndex (formatIndex)}
          <NativeSelectOption
            value={formatOption}
          >
            {formatOption.toUpperCase()}
          </NativeSelectOption>
        {/each}
      </ColorPickerFormatSelect>
      <svg
        xmlns={"http://www.w3.org/2000/svg"}
        viewBox={"0 0 24 24"}
        fill={"none"}
        stroke={"currentColor"}
        stroke-width={"2"}
        stroke-linecap={"round"}
        stroke-linejoin={"round"}
        aria-hidden={"true"}
        class={colorPickerNativeFormatSelectIcon({  })}
        data-slot={"color-picker-native-format-select-icon"}
      >
        <path
          stroke={"none"}
          d={"M0 0h24v24H0z"}
          fill={"none"}
        />
        <path
          d={"M6 9l6 6l6 -6"}
        />
      </svg>
    </div>
  {/if}
  {#if formatControl === "select"}
    <ColorPickerFormatControl
      class={"shrink-0"}
      data-slot={"color-picker-format-control"}
    >
      <Select>
        <SelectTrigger
          aria-label={"Color format"}
          class={colorPickerFormatSelectTrigger({  })}
        >

        </SelectTrigger>
        <SelectContent
          size={formatContentSize}
          portalContainer={portalContainer}
          disablePortal={disablePortal}
          data-sw-color-picker-format-options={""}
        >
          {#each normalizedFormats as formatOption, formatIndex (formatIndex)}
            <SelectItem
              value={formatOption}
            >
              {formatOption.toUpperCase()}
            </SelectItem>
          {/each}
        </SelectContent>
      </Select>
    </ColorPickerFormatControl>
  {/if}
</div>
