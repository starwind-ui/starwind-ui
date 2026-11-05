---
"starwind": patch
---

Fixed `starwind init` for Vue on Astro 5 and Astro 6. The CLI installed the newest `@astrojs/vue`, which needs Astro 7, and npm stopped with an `ERESOLVE` error. The CLI now picks the `@astrojs/vue` version that matches your Astro major.

Fixed `starwind init` on Astro 5 projects with a low declared range such as `"astro": "^5.0.0"` and a current Astro installed. The CLI wrote `experimental.svg`, and `astro build` then failed. The CLI now reads the installed Astro version. This also applies to Svelte on Astro.
