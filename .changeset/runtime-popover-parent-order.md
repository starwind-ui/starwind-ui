---
"@starwind-ui/runtime": patch
---

Keep nested Popover ownership correct when framework lifecycle hooks create a child controller
before its parent, including hover coordination and parent controller recreation.
