---
"@starwind-ui/runtime": patch
"@starwind-ui/astro": patch
"@starwind-ui/react": patch
"@starwind-ui/vue": patch
"@starwind-ui/svelte": patch
"starwind": patch
---

Tooltip and Navigation Menu now stay on screen when their trigger is at the edge of the screen, for example on a phone. Before, the popup kept its alignment, so part of it went off screen. Now the popup moves along its trigger until it is inside the viewport padding. It stays next to the trigger and keeps its side. This also applies to Styled Sidebar tooltips.

The Styled Tooltip arrow now points at the center of the trigger for every `align` value. It stays inside the popup and away from its rounded corners. When the trigger is too narrow or partly off screen, the arrow points at the nearest part of the trigger that it can reach.

The Primitive Tooltip arrow and the Primitive Navigation Menu arrow get the same placement when the arrow has a width and a height. The positioner sets `--sw-floating-arrow-x` for a top or bottom side and `--sw-floating-arrow-y` for a left or right side. Each value is the distance from the left or top edge of the popup to the same edge of the arrow, in RTL too. To use it, position a custom arrow absolutely inside the popup, set `left: var(--sw-floating-arrow-x)` or `top: var(--sw-floating-arrow-y)`, and remove any centering transform on that axis.

Styled Navigation Menu content with no set width now takes the width of its links. Before, it filled the full width of the screen. This content is never wider than the screen minus 2rem. To set a width, add a width class to `NavigationMenuContent`.
