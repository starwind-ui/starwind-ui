---
"starwind": patch
---

Aspect Ratio now uses the browser's `aspect-ratio` CSS property instead of a `padding-bottom` percentage. The box keeps the same shape, and `ratio={16 / 9}` still gives a 16:9 box in Astro, React, Vue, and Svelte. The wrapper, the `data-slot` values, and the props are unchanged. Run `starwind update aspect-ratio` to get the update.
