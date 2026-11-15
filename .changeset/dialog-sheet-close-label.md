---
"starwind": patch
---

DialogContent and SheetContent now take a `closeLabel` prop that sets the close button's accessible name and its screen-reader text, so you can translate it. It defaults to "Close dialog" and "Close sheet". The sheet close button also now has an `aria-label`, which it lacked before. The same prop works in Astro, React, Vue, and Svelte. Run `starwind update dialog sheet` to get it.
