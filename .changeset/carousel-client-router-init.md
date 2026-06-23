---
"@starwind-ui/core": patch
---

fix(carousel): initialize under client-side routing

The carousel relied on `DOMContentLoaded` for its initial setup, which never
fires when the component first appears via Astro's `<ClientRouter />`
view-transition navigations. On such navigations the module script runs only
after `DOMContentLoaded` has already fired and after `astro:after-swap` has
been dispatched, so neither handler ran and the carousel stayed
uninitialized.

Switch to the same initialization pattern used by every other Starwind
component: call `setupCarousels()` immediately when the script runs, and also
listen for `astro:after-swap` and `starwind:init`. This makes the carousel
work on initial load, hard navigations, and client-side transitions alike.
