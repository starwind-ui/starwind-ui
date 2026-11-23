---
"starwind": patch
---

`starwind add` and `starwind update` now install the RTL-aware Styled components. New stylesheet setup includes scoped `rtl` and `ltr` variants. Use `starwind update` to review copied Styled components. Use `starwind primitives update --all` to update vendored Primitive files with the matching Runtime package.

Styled Dropdown and Context Menu submenus now open toward the reading end when there is room. In RTL they open on the left, and in LTR they open on the right. Near a screen edge, a submenu can still flip to the other side. A `side` that you set keeps its meaning. Styled Progress fills from the right in RTL.

`starwind init` and `starwind setup` now install `tailwind-merge` `^3.7.0` for Astro, React, Vue, and Svelte. Vue and Svelte setup did not install it before, although their Styled components import it. `starwind add` and `starwind update` raise an older `tailwind-merge` to `^3.7.0` when you add or update one of the 30 Styled components that changed for RTL. With an older version, a `px-*` class that you pass to one of these components does not replace its `ps-*` and `pe-*` padding.

An existing stylesheet needs the two scoped variants only if your app puts LTR content inside an RTL page, or if your own `ltr:` classes must work inside an RTL area. A page with one direction works without them, and so do RTL sections inside an LTR page. To add them, follow the [RTL guide](https://starwind.dev/docs/getting-started/rtl/), and review your own custom variant definitions first. The variants need no change to your Vite config, and Vite 8 production builds give the same result as dev.

The component styles read the `dir` attribute. When the text direction of a control is different from the page, set `dir="rtl"` or `dir="ltr"` on the control or its container. The guide explains the `dir="auto"` rules and the edge cases of stock Tailwind `ltr:`.
