---
"starwind": patch
---

Fixed the CLI not recognizing Bun projects that have a `bun.lock` file, which Bun creates by default since version 1.2. Those projects could get packages installed with npm. The CLI now uses Bun when it finds `bun.lock` or the older `bun.lockb`.
