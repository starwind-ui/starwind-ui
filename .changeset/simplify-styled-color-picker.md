---
"starwind": minor
---

Simplify the styled Color Picker around a complete zero-child default and a smaller advanced
composition API. `ColorPicker` now renders either the popup shell or, with `inline`, the inline
editor; alpha remains enabled by default. Common customization moves to `formatControl`, `formats`,
`showEyeDropper`, `showValueText`, `clearable`, `swatches`, and `label` props.

Migrate `ColorPickerRoot` to `<ColorPicker inline>`. Use `label` or an authored label instead of
`ColorPickerLabel`, and an authored container instead of `ColorPickerControl`. `ColorPickerArea`
now includes its thumb, `ColorPickerInput` includes the value input and accepts
`formatControl="select" | "native" | "none"`, and `ColorPicker` always renders its hidden form
input. Replace `allowEmpty` plus `showClear` with `clearable`, and pass swatch data through the
`swatches` array for the default editor.

The styled API no longer supports requesting a visible Clear action while empty values are
forbidden, or replacing only the internal area thumb, format-selector anatomy, or hidden input.
Use the Color Picker Primitive when those raw anatomy customizations are required. Popup, inline,
input-only, swatch-only, native-select, forms, and custom channel layouts remain supported.
