---
"@starwind-ui/astro": patch
"starwind": patch
---

Fixed Astro components ignoring an attribute that you set when the component already sets the same attribute. For example, your `role` or `aria-label` lost to the component's default, because the browser keeps the first copy of a repeated attribute. Your value now wins, as it does in React.

Styled Combobox Input Group in Astro now renders `data-slot="combobox-input-group"`, as it does in React.
