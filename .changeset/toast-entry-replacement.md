---
"@starwind-ui/runtime": patch
"@starwind-ui/astro": patch
"@starwind-ui/react": patch
"starwind": patch
---

Fixed toasts skipping their entrance animation or leaving incorrect spacing when updated immediately, including when a promise resolves. Closing a toast also cancels any remaining entrance animation work.
