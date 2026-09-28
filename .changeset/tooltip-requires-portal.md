---
"@starwind-ui/runtime": minor
"@starwind-ui/astro": minor
"@starwind-ui/react": minor
"starwind": patch
---

React Tooltip now reports a clear error if its Primitive markup is missing `Tooltip.Portal`.

If you used the previous Primitive example, wrap `Tooltip.Positioner` and `Tooltip.Popup` in `Tooltip.Portal`. For inline rendering, keep the wrapper and set its `disabled` prop. Styled Tooltip already includes this wrapper and needs no change.
