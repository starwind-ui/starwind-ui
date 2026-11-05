---
"@starwind-ui/astro": minor
"starwind": patch
---

Astro Primitive Dialog, Alert Dialog, and Drawer `Trigger` and `Close` parts now accept `asChild`, so you can use your own button inside them. Before, a button child inside one of these parts made a control that did nothing.

Astro `TooltipTrigger` with plain text and `asChild` now renders a button, so keyboard users can focus it. The Styled `TooltipTrigger` uses `asChild` by default, so this also fixes plain text in the Styled component.
