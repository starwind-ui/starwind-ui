---
"starwind": patch
---

Updated the CLI to zod 4.6.7 to fix a high-severity security advisory. Before, validating a very large array could make zod run out of memory. You don't need to change anything.
