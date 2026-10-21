---
"starwind": patch
---

Checkbox now shows a clear mixed state. When you set `indeterminate`, the box fills with the variant color and shows a minus icon. Before, the default variant looked unchecked in light mode, and the other variants showed only a faint check.

Switch now takes its accessible name from a `<label for>` that points at its `id`. Before, a Switch without a `label` or `aria-label` prop was announced as "switch" and ignored the label next to it.

If a Switch has no visible label, add a `label` prop, an `aria-label`, or a `<label for>` that points at its `id`. Without one of these, screen readers no longer announce a name for it.
