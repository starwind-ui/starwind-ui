---
"@starwind-ui/runtime": patch
"@starwind-ui/react": patch
"starwind": patch
---

Normalize cancelable Runtime state proposals so callbacks and DOM events share one details object before accepted state commits. Update React Primitive adapters to preserve pre-commit cancellation, accepted-only synchronization, Combobox command cancellation, and Switch native form association. Synchronize the affected vendored React Primitive sources in the CLI.
