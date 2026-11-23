---
"starwind": patch
---

The Svelte Styled `TooltipTrigger` with text content now has the same classes as in React and Vue. A Svelte `TooltipTrigger` without a `child` snippet no longer adds `inline-flex`. To use your own element as the trigger, use the `child` snippet. To keep the old layout on a text trigger, add `class="inline-flex"`.
