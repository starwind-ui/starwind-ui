---
"starwind": minor
---

`starwind update` and `starwind primitives update` now offer to update `@starwind-ui/runtime` if it's in your `package.json` and out of date. Before, it could stay on an older version than your other Starwind packages. Any other Starwind package that is out of date gets updated with it. Use `--yes` to skip the question, or `--dry-run` to see what would change. If you accept and the install fails, the command exits with an error.

You won't see this offer if `@starwind-ui/runtime` isn't in your `package.json`, or if your project uses a custom component registry. The CLI also leaves it alone if you set its version with `workspace:`, `catalog:`, a tag such as `latest`, or `*`.
