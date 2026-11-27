---
"starwind": patch
---

New projects now get a `--font-heading` theme token in `starwind.css`, set to your sans font by default. Before, components that use `font-heading` (card, alert, dialog, and sheet titles) had no token to resolve. Change the value to give headings their own font.
