---
"@starwind-ui/vue": minor
"starwind": patch
---

Removed the slot props that only Vue passed to child content. These default slots now receive no props:

- The Tabs root, which passed `value` and `orientation`.
- The Accordion root, which passed `value`.
- `Tabs.Tab` and `Tabs.Panel`, which passed `active`.
- `Select.Value` and the Styled `SelectValue`, which passed `label` and `value`.

If you read `value` from a root slot, use `v-model` on the root instead.

If you read `orientation` from the Tabs root slot, use the `orientation` prop that you pass, or the root's `data-orientation` attribute.

If you read `active` in a Tab or Panel slot, style with the `data-state="active"` attribute, or compare the Tabs `v-model` with the item value.

If you read `label` or `value` in a `Select.Value` slot, use `v-model` on the Select root and find the label from that value. Leave `Select.Value` empty to show the selected label.

Update a copied Styled `SelectValue.vue` file with `starwind update select`.
