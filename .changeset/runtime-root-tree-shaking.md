---
"@starwind-ui/runtime": patch
---

Importing one function from `@starwind-ui/runtime` no longer adds every component to your bundle. Before, a page that imported only `createButton` from `@starwind-ui/runtime` shipped the code for all components, about 141 KB gzipped in a Vite production build. Now your bundle has only the components that you import. This is the same as importing from a component path such as `@starwind-ui/runtime/button`. You do not need to change your imports.
