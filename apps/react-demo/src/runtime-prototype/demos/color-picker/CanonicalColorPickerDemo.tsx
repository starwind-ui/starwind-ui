import type { ColorPickerFormat } from "@starwind-ui/react/color-picker";
import { useState } from "react";

import {
  ColorPicker,
  ColorPickerContent,
  ColorPickerControl,
  ColorPickerHiddenInput,
  ColorPickerInput,
  ColorPickerLabel,
  ColorPickerRoot,
  ColorPickerSwatch,
  ColorPickerSwatchGroup,
  ColorPickerTrigger,
} from "../../../components/starwind-runtime/color-picker";

const SWATCHES = [
  { label: "Red", value: "#ef4444" },
  { label: "Amber", value: "#f59e0b" },
  { label: "Emerald", value: "#10b981" },
  { label: "Sky", value: "#0ea5e9" },
  { label: "Violet", value: "#8b5cf6" },
] as const;

const SIZES = [
  { label: "Small", size: "sm", value: "#ef4444" },
  { label: "Medium", size: "md", value: "#10b981" },
  { label: "Large", size: "lg", value: "#8b5cf6" },
] as const;

const ANATOMY = [
  ["Closed control", "ColorPickerLabel + ColorPickerControl + ColorPickerTrigger"],
  ["Color surface", "ColorPickerArea + ColorPickerAreaThumb"],
  ["Channels", "ColorPickerSliders + ColorPickerChannelSlider"],
  ["Exact editing", "ColorPickerValueInput + ColorPickerFormatSelect"],
  ["Native editing", "ColorPickerNativeFormatSelect"],
  ["Actions", "ColorPickerEyeDropper + ColorPickerClear"],
  ["Consumer colors", "ColorPickerSwatchGroup + ColorPickerSwatch"],
  ["Form value", "ColorPickerHiddenInput"],
] as const;

export function CanonicalColorPickerDemo() {
  const [format, setFormat] = useState<ColorPickerFormat>("hex");
  const [nativeFormat, setNativeFormat] = useState<ColorPickerFormat>("rgb");

  return (
    <>
      <section className="space-y-4" data-testid="canonical-docs-color-picker">
        <header className="space-y-1">
          <div className="bg-primary text-primary-foreground inline-flex rounded-full px-3 py-1 text-xs font-semibold tracking-wide uppercase">
            Canonical docs example
          </div>
          <h3 className="font-heading text-2xl font-semibold">Proposed documentation default</h3>
          <p className="text-muted-foreground max-w-3xl text-sm">
            This is the main styled example shown first on the Color Picker documentation page. It
            includes alpha, value text, and consumer-provided swatches without enabling Clear.
          </p>
        </header>

        <div className="bg-card rounded-xl border p-6 shadow-sm">
          <div className="w-full max-w-sm" data-color-picker-example="default">
            <ColorPicker
              id="react-runtime-prototype-docs-canonical-color-picker"
              defaultValue="#ff000080"
              format="hex"
              alpha
              name="brand-color"
            >
              <ColorPickerLabel>Brand color</ColorPickerLabel>
              <ColorPickerControl>
                <ColorPickerTrigger showValueText aria-label="Open brand color picker" />
              </ColorPickerControl>
              <ColorPickerContent
                aria-label="Brand color editor"
                data-testid="canonical-docs-color-picker-content"
                swatches={
                  <ColorPickerSwatchGroup aria-label="Suggested brand colors">
                    {SWATCHES.map(({ label, value }) => (
                      <ColorPickerSwatch key={value} value={value} aria-label={`${label} swatch`} />
                    ))}
                  </ColorPickerSwatchGroup>
                }
              />
              <ColorPickerHiddenInput />
            </ColorPicker>
          </div>
        </div>
      </section>

      <section className="space-y-3" data-testid="canonical-color-picker">
        <header className="flex flex-wrap items-baseline gap-x-4 gap-y-1">
          <h3 className="font-heading text-lg font-semibold">Product surface</h3>
          <p className="text-muted-foreground max-w-3xl text-sm">
            Styled Popover composition with Starwind format controls, actions, and consumer
            swatches.
          </p>
        </header>

        <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(18rem,0.8fr)]">
          <div className="bg-card space-y-4 rounded-xl border p-3 shadow-sm">
            <ColorPicker
              id="canonical-color-picker-root"
              defaultValue="rgba(255, 0, 0, 0.5)"
              format={format}
              alpha
              allowEmpty
              name="canonicalColor"
              onFormatChange={setFormat}
            >
              <ColorPickerLabel>Brand color</ColorPickerLabel>
              <ColorPickerControl>
                <ColorPickerTrigger
                  aria-label="Open canonical brand color picker"
                  data-testid="canonical-color-picker-trigger"
                >
                  Brand
                </ColorPickerTrigger>
              </ColorPickerControl>
              <ColorPickerContent
                showClear
                aria-label="Canonical brand color editor"
                data-testid="canonical-color-picker-content"
                swatches={
                  <ColorPickerSwatchGroup
                    aria-label="Suggested brand colors"
                    data-testid="canonical-color-picker-swatches"
                  >
                    {SWATCHES.map(({ label, value }) => (
                      <ColorPickerSwatch key={value} value={value} aria-label={`${label} swatch`} />
                    ))}
                  </ColorPickerSwatchGroup>
                }
              />
              <ColorPickerHiddenInput />
            </ColorPicker>
            <p className="text-muted-foreground text-sm">
              The red default places the area and hue thumbs on track boundaries so their projected
              fill remains directly reviewable.
            </p>
          </div>

          <div className="bg-card space-y-4 rounded-xl border p-3 shadow-sm">
            <h4 className="font-heading text-base font-semibold">Native format control</h4>
            <p className="text-muted-foreground text-sm">
              The native option keeps progressive enhancement while sharing the same value editor
              and Color Picker state.
            </p>
            <ColorPickerRoot
              id="canonical-native-color-picker"
              defaultValue="rgb(37, 99, 235)"
              format={nativeFormat}
              alpha={false}
              data-testid="canonical-native-color-picker"
              onFormatChange={setNativeFormat}
            >
              <ColorPickerLabel>Accent color</ColorPickerLabel>
              <ColorPickerInput
                formatControl="native"
                data-testid="canonical-native-color-picker-input"
              />
              <ColorPickerHiddenInput />
            </ColorPickerRoot>
          </div>
        </div>

        <div className="bg-card space-y-4 rounded-xl border p-5 shadow-sm">
          <div className="space-y-1">
            <h4 className="font-heading text-base font-semibold">Swatch-only trigger</h4>
            <p className="text-muted-foreground text-sm">
              The same Popover composition can use a compact color swatch button without value text.
            </p>
          </div>
          <ColorPicker defaultValue="#0ea5e9" format="hex" alpha={false} name="swatchOnlyColor">
            <ColorPickerLabel>Swatch-only color</ColorPickerLabel>
            <ColorPickerControl>
              <ColorPickerTrigger
                showValueText={false}
                className="size-11 p-2"
                aria-label="Open swatch-only color picker"
                data-testid="canonical-color-picker-swatch-trigger"
              />
            </ColorPickerControl>
            <ColorPickerContent
              alpha={false}
              showEyeDropper={false}
              aria-label="Swatch-only color editor"
            />
            <ColorPickerHiddenInput />
          </ColorPicker>
        </div>

        <div className="space-y-3" data-testid="canonical-color-picker-sizes">
          <h4 className="font-heading text-base font-semibold">Starwind size scale</h4>
          <div className="grid gap-4 sm:grid-cols-3">
            {SIZES.map(({ label, size, value }) => (
              <div key={size} className="bg-card rounded-xl border p-4">
                <ColorPicker defaultValue={value} format="hex" alpha={false} size={size}>
                  <ColorPickerLabel size={size}>{label}</ColorPickerLabel>
                  <ColorPickerControl size={size}>
                    <ColorPickerTrigger
                      size={size}
                      aria-label={`Open ${label.toLowerCase()} color picker`}
                      data-testid={`canonical-color-picker-${size}-trigger`}
                    >
                      {label}
                    </ColorPickerTrigger>
                  </ColorPickerControl>
                  <ColorPickerContent
                    size={size}
                    alpha={false}
                    showEyeDropper={false}
                    aria-label={`${label} color editor`}
                    data-testid={`canonical-color-picker-${size}-content`}
                    swatches={
                      <ColorPickerSwatchGroup size={size} aria-label={`${label} suggested colors`}>
                        <ColorPickerSwatch
                          size={size}
                          value={value}
                          aria-label={`${label} sample swatch`}
                        />
                      </ColorPickerSwatchGroup>
                    }
                  />
                </ColorPicker>
              </div>
            ))}
          </div>
        </div>

        <div className="space-y-3" aria-labelledby="react-color-picker-anatomy-heading">
          <h4
            id="react-color-picker-anatomy-heading"
            className="font-heading text-base font-semibold"
          >
            Public anatomy
          </h4>
          <dl className="bg-border grid gap-px overflow-hidden rounded-xl border sm:grid-cols-2">
            {ANATOMY.map(([label, components]) => (
              <div key={label} className="bg-card grid gap-1 p-4">
                <dt className="font-medium">{label}</dt>
                <dd className="text-muted-foreground font-mono text-xs leading-relaxed">
                  {components}
                </dd>
              </div>
            ))}
          </dl>
        </div>
      </section>
    </>
  );
}
