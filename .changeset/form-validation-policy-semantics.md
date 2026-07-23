---
"@starwind-ui/runtime": minor
"@starwind-ui/astro": minor
"@starwind-ui/react": minor
"starwind": patch
---

Replace additive Form validation timing with before- and after-submit policies, add the imperative
validation, visibility, reset, and external-error APIs, and refresh generated adapters and vendored
Primitive artifacts.

For the beta migration, both the previous `input` timing and the previous committed-only meaning of
`change` map to semantic `change`, which runs for every accepted value revision. Committed-only
validation timing is no longer available. Defaults remain validation on `submit`, revalidation on
`change`, and error visibility on `submit`; after the first submission attempt,
`revalidationTiming` replaces `validationTiming` instead of being additive.
