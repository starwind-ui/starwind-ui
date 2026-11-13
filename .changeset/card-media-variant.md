---
"starwind": patch
---

Card now has a `variant` prop with `default`, `media`, and `flat` values. Use `variant="media"` for cards that start with an image or Aspect Ratio and need no outer padding or gap. Use `variant="flat"` for a single thin border with no ring or shadow. A Card that starts with an Aspect Ratio now drops its top padding, as it already did for an `img`. Run `starwind update card` to get these changes. Existing cards look the same unless you pass `variant`.
