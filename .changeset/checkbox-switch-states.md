---
"starwind": patch
---

Checkbox now shows a clear mixed state. When you set `indeterminate`, the box fills with the variant color and shows a minus icon. Before, the default variant looked unchecked in light mode, and the other variants showed only a faint check.

A Switch now gets its name from a `<label for>` that points at its `id`. Before, a Switch without a `label` or `aria-label` prop was always read as "switch", and screen readers ignored the label next to it. The Switch no longer uses "switch" as a fallback name.

If a Switch has no visible label, give it a `label` prop, an `aria-label`, or a `<label for>` that points at its `id`. Without one of these, screen readers do not announce a name for it.
