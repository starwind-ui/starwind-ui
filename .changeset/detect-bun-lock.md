---
"starwind": patch
---

Fixed the CLI installing packages with npm in Bun projects. It did not recognize `bun.lock`, the lockfile Bun creates by default since version 1.2. The CLI now uses Bun when it finds `bun.lock` or the older `bun.lockb`. In a project with no lockfile, it also now uses Bun when you run the CLI through Bun.
