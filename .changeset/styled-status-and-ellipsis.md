---
"starwind": patch
---

The Vue and Svelte Styled Spinner now announces its loading status to screen readers, as in Astro and React. Before, the icon hid the status.

The Styled Pagination Ellipsis is now hidden from screen readers in Astro, React, Vue and Svelte, with `aria-hidden="true"`.

In Vue, the Styled Pagination Next and Previous parts now accept your own `aria-label`, and Pagination Link accepts your own `aria-current`. Before, the default value replaced yours.
