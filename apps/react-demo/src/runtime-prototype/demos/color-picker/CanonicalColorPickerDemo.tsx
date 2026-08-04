import type { ColorPickerFormat } from "@starwind-ui/react/color-picker";
import { useState } from "react";

import {
  ColorPicker,
  ColorPickerArea,
  ColorPickerContent,
  ColorPickerInput,
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
  ["Complete picker", "ColorPicker"],
  ["Popup shell", "ColorPickerTrigger + ColorPickerContent"],
  ["Color surface", "ColorPickerArea"],
  ["Channels", "ColorPickerChannelSlider + ColorPickerChannelInput"],
  ["Exact editing", "ColorPickerInput"],
  ["Actions", "ColorPickerEyeDropper + ColorPickerClear"],
  ["Consumer colors", "ColorPickerSwatchGroup + ColorPickerSwatch"],
  ["Form value", "Automatically rendered by ColorPicker"],
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
          <h3 className="font-heading text-2xl font-semibold">Simple common usage</h3>
          <p className="text-muted-foreground max-w-3xl text-sm">
            ColorPicker supplies the complete popup editor, alpha controls, EyeDropper, formatted
            input, swatches, and hidden form input when no children are provided.
          </p>
        </header>

        <div className="bg-card rounded-xl border p-6 shadow-sm">
          <div className="w-full max-w-sm" data-color-picker-example="default">
            <ColorPicker
              id="react-runtime-prototype-docs-canonical-color-picker"
              label="Brand color"
              name="brand-color"
              defaultValue="#ff000080"
              swatches={SWATCHES}
            />
          </div>
        </div>
      </section>

      <section className="space-y-3" data-testid="canonical-color-picker">
        <header className="flex flex-wrap items-baseline gap-x-4 gap-y-1">
          <h3 className="font-heading text-lg font-semibold">Product surface</h3>
          <p className="text-muted-foreground max-w-3xl text-sm">
            Convenience props handle common customization; children remain an escape hatch for
            authored layouts.
          </p>
        </header>

        <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(18rem,0.8fr)]">
          <div className="bg-card space-y-4 rounded-xl border p-3 shadow-sm">
            <ColorPicker
              id="canonical-color-picker-root"
              label="Brand color"
              defaultValue="rgba(255, 0, 0, 0.5)"
              format={format}
              clearable
              swatches={SWATCHES}
              name="canonicalColor"
              onFormatChange={setFormat}
            >
              <span className="text-sm font-medium">Brand color</span>
              <div className="flex items-center gap-2" data-slot="color-picker-control">
                <ColorPickerTrigger
                  aria-label="Open canonical brand color picker"
                  data-testid="canonical-color-picker-trigger"
                />
              </div>
              <ColorPickerContent
                swatches={SWATCHES}
                aria-label="Canonical brand color editor"
                data-testid="canonical-color-picker-content"
              />
            </ColorPicker>
            <p className="text-muted-foreground text-sm">
              The controlled format still updates through the styled selector.
            </p>
          </div>

          <div className="bg-card space-y-4 rounded-xl border p-3 shadow-sm">
            <h4 className="font-heading text-base font-semibold">Native format control</h4>
            <p className="text-muted-foreground text-sm">
              Native, styled, and absent format controls use the same value editor.
            </p>
            <ColorPicker
              id="canonical-native-color-picker"
              inline
              defaultValue="rgb(37, 99, 235)"
              format={nativeFormat}
              formats={["rgb", "hex"]}
              formatControl="native"
              alpha={false}
              showEyeDropper={false}
              data-testid="canonical-native-color-picker"
              onFormatChange={setNativeFormat}
            >
              <span className="text-sm font-medium">Accent color</span>
              <ColorPickerInput
                formatControl="native"
                formats={["rgb", "hex"]}
                data-testid="canonical-native-color-picker-input"
              />
            </ColorPicker>
          </div>
        </div>

        <div className="bg-card space-y-4 rounded-xl border p-5 shadow-sm">
          <div className="space-y-1">
            <h4 className="font-heading text-base font-semibold">Swatch-only trigger</h4>
            <p className="text-muted-foreground text-sm">
              Custom children replace the default visible anatomy; the hidden input remains
              automatic.
            </p>
          </div>
          <ColorPicker defaultValue="#0ea5e9" alpha={false} name="swatchOnlyColor">
            <span className="text-sm font-medium">Swatch-only color</span>
            <ColorPickerTrigger
              showValueText={false}
              className="size-11 p-2"
              aria-label="Open swatch-only color picker"
              data-testid="canonical-color-picker-swatch-trigger"
            />
            <ColorPickerContent showEyeDropper={false} aria-label="Swatch-only color editor" />
          </ColorPicker>
        </div>

        <div className="space-y-3" data-testid="canonical-color-picker-sizes">
          <h4 className="font-heading text-base font-semibold">Starwind size scale</h4>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {SIZES.map(({ label, size, value }) => (
              <div key={size} className="bg-card rounded-xl border p-4">
                <ColorPicker defaultValue={value} alpha={false} size={size}>
                  <span className="text-sm font-medium">{label}</span>
                  <div data-slot="color-picker-control">
                    <ColorPickerTrigger
                      aria-label={`Open ${label.toLowerCase()} color picker`}
                      data-testid={`canonical-color-picker-${size}-trigger`}
                    />
                  </div>
                  <ColorPickerContent
                    size={size}
                    showEyeDropper={false}
                    swatches={[{ value, label: `${label} sample swatch` }]}
                    aria-label={`${label} color editor`}
                    data-testid={`canonical-color-picker-${size}-content`}
                  />
                </ColorPicker>
              </div>
            ))}
            <div className="bg-card rounded-xl border p-4">
              <ColorPicker defaultValue="#0ea5e9" alpha={false} size="sm">
                <span className="text-sm font-medium">Independent popup</span>
                <div data-slot="color-picker-control">
                  <ColorPickerTrigger
                    aria-label="Open independently sized color picker"
                    data-testid="canonical-color-picker-mismatch-trigger"
                  />
                </div>
                <ColorPickerContent
                  size="lg"
                  aria-label="Large custom color editor"
                  data-testid="canonical-color-picker-mismatch-content"
                >
                  <ColorPickerArea />
                  <ColorPickerInput
                    formatContentSize="sm"
                    data-testid="canonical-color-picker-format-popup-sm"
                  />
                </ColorPickerContent>
              </ColorPicker>
            </div>
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
