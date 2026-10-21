---
"@starwind-ui/runtime": patch
---

Fixed large bundles when page code imports from the root `@starwind-ui/runtime` entry. Before, a page that imported only `createButton` from `@starwind-ui/runtime` shipped every Runtime component, about 141 KB gzipped in a Vite production build. Now your bundler keeps only the components you import, the same as an import from a component path such as `@starwind-ui/runtime/button`. You do not need to change your imports.
