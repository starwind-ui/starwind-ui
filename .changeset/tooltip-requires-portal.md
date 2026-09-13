---
"@starwind-ui/runtime": minor
"@starwind-ui/astro": minor
"@starwind-ui/react": minor
"starwind": patch
---

React Tooltip now requires an explicit `Tooltip.Portal`. Wrap the Positioner and Popup in Portal; use `disabled` on that Portal for inline placement. Missing Portal composition throws a clear error before Runtime starts. Styled Tooltip already supplies Portal.

The published Primitive example omitted Portal. Consumers following that example must add the wrapper. This minor release corrects the example and enforces the intended Portal composition. Runtime, Astro, and React advance together under the fixed package group policy. Runtime and Astro implementation code is unchanged by this correction. CLI delivery remains a patch.
