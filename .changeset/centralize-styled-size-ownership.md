---
"starwind": minor
---

Centralize styled component sizing around one explicit owner per visual scope. Existing `sm`, `md`,
and `lg` size families continue to default to `md`.

Migrate compound components by moving child sizes to their root:

```diff
-<PaginationLink size="sm" />
+<Pagination size="sm"><PaginationLink /></Pagination>

-<RadioGroupItem size="lg" value="one" />
+<RadioGroup size="lg"><RadioGroupItem value="one" /></RadioGroup>

-<InputOtpSlot size="sm" index={0} />
+<InputOtp size="sm"><InputOtpSlot index={0} /></InputOtp>

-<ToggleGroupItem size="lg" value="bold" />
+<ToggleGroup size="lg"><ToggleGroupItem value="bold" /></ToggleGroup>
```

Select and Combobox controls remain independently sizeable from their portaled content. Set both
props when they should match, or set them differently on purpose:

```astro
<SelectTrigger size="sm" />
<SelectContent size="lg">...</SelectContent>

<ComboboxInputGroup size="sm">...</ComboboxInputGroup>
<ComboboxContent size="lg">...</ComboboxContent>
```

Color Picker now owns trigger-side and inline sizing on `ColorPicker`, while
`ColorPickerContent` independently owns the portaled editor. Remove `size` from inner Color Picker
parts. For a custom `ColorPickerInput`, use `formatContentSize` only when its nested Select popup
needs an explicit size:

```diff
-<ColorPicker size="sm"><ColorPickerTrigger size="sm" /></ColorPicker>
+<ColorPicker size="sm"><ColorPickerTrigger /></ColorPicker>

-<ColorPickerInput size="sm" />
+<ColorPickerInput formatContentSize="sm" />
```
