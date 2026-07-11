# `@starwind-ui/runtime`

Framework-neutral DOM controllers for Starwind UI behavior. Runtime owns state, events, focus,
forms, overlays, timers, and cleanup while rendering stays in framework adapters.

Install the Runtime through a first-party adapter for normal application use:

```bash
npm install @starwind-ui/runtime@beta @starwind-ui/astro@beta
# or
npm install @starwind-ui/runtime@beta @starwind-ui/react@beta
```

Controllers are exported from component subpaths such as `@starwind-ui/runtime/select`. Theme
helpers are exported from `@starwind-ui/runtime/theme`. Node 22.12 or newer is required.

Color Picker is not included in this beta.
