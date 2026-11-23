---
"@starwind-ui/vue": patch
"starwind": patch
---

`@starwind-ui/vue` now needs Vue 3.5.21 or newer. Vue 3.5.0 to 3.5.20 throw an error when a hydrated component that renders a portal unmounts. The `vue` peer range is now `>=3.5.21`.

If your project uses an older Vue 3.5 version, upgrade Vue in the same step as `@starwind-ui/vue`, for example `npm install @starwind-ui/vue vue@^3.5.21`. Copied Styled components and vendored Primitive files ask for the same Vue range.
