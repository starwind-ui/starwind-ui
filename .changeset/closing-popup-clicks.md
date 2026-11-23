---
"@starwind-ui/runtime": patch
"@starwind-ui/astro": patch
"@starwind-ui/react": patch
"@starwind-ui/vue": patch
"@starwind-ui/svelte": patch
"starwind": patch
---

A click during a popup's close animation now goes to the page below the popup. Before, the closing popup caught the click until it was hidden, so a quick click on a trigger or button under it did nothing. Buttons and links inside the closing popup also let the click through, even when they set their own `pointer-events`. This applies to Popover, Color Picker, Tooltip, Preview Card (Styled Hover Card), Menu (Styled Dropdown), Context Menu, Select, Combobox, Navigation Menu, and Styled Sidebar tooltips. When you close a Popover, Menu, Context Menu or Select with focus inside it, or a Navigation Menu with Escape, focus goes back to the trigger as the close starts. The closing popup takes no keyboard input until it hides. A popup that opens again during its close animation takes clicks again at once. An `inert` attribute that your app sets on the popup or its positioner stays as you set it. An optional Popover or Preview Card backdrop still covers the page until it is hidden.

If an end-to-end test types into a popup right after it closes the popup, change the test to open the popup again before it types.
