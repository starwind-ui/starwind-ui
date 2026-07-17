import * as React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { ColorPicker } from "../src/color-picker/index";

describe("React Color Picker initial projection", () => {
  it("renders coherent non-default state for every stateful primitive surface", () => {
    const html = renderToStaticMarkup(
      <ColorPicker.Root
        defaultValue="#33669980"
        format="hsb"
        allowEmpty
        disabled
        readOnly
        required
        name="accent"
        form="theme-form"
        locale="de-DE"
        dir="rtl"
        getAreaRoleDescription={() => "Color surface"}
      >
        <ColorPicker.ValueInput />
        <ColorPicker.ValueSwatch />
        <ColorPicker.ValueText />
        <ColorPicker.Area xChannel="hue" yChannel="alpha" xStep={7} yStep={5}>
          <ColorPicker.AreaBackground />
          <ColorPicker.AreaThumb />
          <ColorPicker.AreaInput axis="x" />
          <ColorPicker.AreaInput axis="y" />
        </ColorPicker.Area>
        <ColorPicker.ChannelSlider channel="hue" orientation="vertical" step={7}>
          <ColorPicker.ChannelSliderTrack />
          <ColorPicker.ChannelSliderThumb />
          <ColorPicker.ChannelSliderInput />
        </ColorPicker.ChannelSlider>
        <ColorPicker.ChannelInput channel="alpha" />
        <ColorPicker.FormatSelect>
          <option value="hsb">HSB</option>
        </ColorPicker.FormatSelect>
        <ColorPicker.FormatControl />
        <ColorPicker.SwatchGroup>
          <ColorPicker.Swatch swatchValue="#33669980">Current</ColorPicker.Swatch>
        </ColorPicker.SwatchGroup>
        <ColorPicker.EyeDropperTrigger />
        <ColorPicker.Clear />
        <ColorPicker.HiddenInput />
      </ColorPicker.Root>,
    );

    expect(html).toContain('data-value="hsba(210, 66.7%, 60%, 0.502)"');
    expect(html).toContain('data-format="hsb"');
    expect(html).toContain('data-locale="de-DE"');
    expect(html).toContain('dir="rtl"');
    expect(html).toContain("--sw-color-picker-color:#33669980");
    expect(html).toContain("--sw-color-picker-area-thumb-color:#336699");
    expect(html).toContain("--sw-color-picker-channel-thumb-color:#0080ff");
    expect(html).toContain('data-axis="x"');
    expect(html).toContain('max="357"');
    expect(html).toContain('step="7"');
    expect(html).toContain('aria-roledescription="Color surface"');
    expect(html).toContain('aria-orientation="vertical"');
    expect(html).toContain('data-selected=""');
    expect(html).toContain('aria-pressed="true"');
    expect(html).toMatch(
      /<div(?=[^>]*data-sw-color-picker-format-control)(?=[^>]*data-format="hsb")(?=[^>]*data-disabled="")(?=[^>]*data-readonly="")[^>]*>/,
    );
    expect(html).toContain('name="accent"');
    expect(html).toContain('form="theme-form"');
    const formProxy = html.match(/<input[^>]*data-sw-color-picker-hidden-input[^>]*>/)?.[0];
    expect(formProxy).toContain('type="text"');
    expect(formProxy).toContain('aria-hidden="true"');
    expect(formProxy).toContain('tabindex="-1"');
    expect(formProxy).toContain("position:absolute");
    expect(formProxy).not.toContain(" hidden=");
    expect(html).toContain("data-sw-color-picker-initial-owned");
  });

  it("keeps explicit false ARIA strings while omitting false presence attributes", () => {
    const html = renderToStaticMarkup(
      <ColorPicker.Root defaultValue="#ff0000">
        <ColorPicker.ValueInput />
        <ColorPicker.FormatSelect />
        <ColorPicker.FormatControl />
        <ColorPicker.Area>
          <ColorPicker.AreaThumb />
        </ColorPicker.Area>
        <ColorPicker.ChannelSlider channel="hue">
          <ColorPicker.ChannelSliderThumb />
        </ColorPicker.ChannelSlider>
        <ColorPicker.Swatch swatchValue="#00ff00">Green</ColorPicker.Swatch>
      </ColorPicker.Root>,
    );

    expect(html).toContain('aria-invalid="false"');
    expect(html).toContain('aria-readonly="false"');
    expect(html).toContain('aria-pressed="false"');
    expect(html).not.toMatch(
      /data-(?:allow-empty|disabled|dragging|focused|invalid|readonly|required|selected|unsupported)="false"/,
    );
    const root = html.match(/<div[^>]*data-sw-color-picker=""[^>]*>/)?.[0];
    const formatControl = html.match(/<div[^>]*data-sw-color-picker-format-control[^>]*>/)?.[0];
    const swatch = html.match(/<button[^>]*data-sw-color-picker-swatch[^>]*>/)?.[0];
    expect(root).not.toContain(" data-disabled=");
    expect(root).not.toContain(" data-readonly=");
    expect(formatControl).not.toContain(" data-disabled=");
    expect(formatControl).not.toContain(" data-readonly=");
    expect(swatch).not.toContain(" data-selected=");
    expect(html).toContain("--sw-color-picker-area-thumb-color:#ff0000");
    expect(html).toContain("--sw-color-picker-channel-thumb-color:#ff0000");
  });

  it("isolates sibling and nested Root snapshots through the nearest context", () => {
    const html = renderToStaticMarkup(
      <>
        <ColorPicker.Root defaultValue="#ff0000">
          <ColorPicker.ValueText />
          <ColorPicker.Root defaultValue="#0000ff">
            <ColorPicker.ValueText />
          </ColorPicker.Root>
        </ColorPicker.Root>
        <ColorPicker.Root defaultValue={null} allowEmpty>
          <ColorPicker.ValueText />
          <ColorPicker.HiddenInput />
        </ColorPicker.Root>
      </>,
    );

    expect(html).toContain(">#ff0000<");
    expect(html).toContain(">#0000ff<");
    expect(html).toContain('data-allow-empty=""');
    expect(html).toContain('data-value=""');
  });

  it("preserves authored ARIA while marking only projected ownership", () => {
    const html = renderToStaticMarkup(
      <ColorPicker.Root defaultValue="#ff0000">
        <ColorPicker.Area>
          <ColorPicker.AreaInput
            axis="x"
            aria-label="Authored area label"
            aria-labelledby="authored-area-label"
            aria-roledescription="Authored area role"
          />
        </ColorPicker.Area>
        <ColorPicker.ChannelSlider channel="hue">
          <ColorPicker.ChannelSliderInput
            aria-label="Authored slider label"
            aria-labelledby="authored-slider-label"
            aria-roledescription="Authored slider role"
          />
        </ColorPicker.ChannelSlider>
      </ColorPicker.Root>,
    );

    const areaInput = html.match(/<input[^>]*data-sw-color-picker-area-input[^>]*>/)?.[0];
    const sliderInput = html.match(/<input[^>]*data-sw-color-picker-channel-input[^>]*>/)?.[0];
    expect(areaInput).toContain('aria-label="Authored area label"');
    expect(areaInput).toContain('aria-labelledby="authored-area-label"');
    expect(areaInput).toContain('aria-roledescription="Authored area role"');
    expect(areaInput).not.toContain("a:aria-roledescription");
    expect(sliderInput).toContain('aria-label="Authored slider label"');
    expect(sliderInput).toContain('aria-labelledby="authored-slider-label"');
    expect(sliderInput).toContain('aria-roledescription="Authored slider role"');
  });
});
