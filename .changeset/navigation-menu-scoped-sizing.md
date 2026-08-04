---
"starwind": minor
---

Add `sm` and `md` sizing to the styled Navigation Menu. `size` controls native triggers,
List spacing, indicators, and Links using `navigationMenuTriggerStyle()`. `contentSize` controls the
shared portaled popup and defaults to the resolved `size`, so matching sizes require one prop while
intentional root/content mismatches remain possible.

Correct the styled `NavigationMenuTrigger asChild` visual-ownership contract. A native Trigger still
receives Navigation Menu's complete trigger recipe and generated chevron. A composed control now
keeps its own markup and complete appearance while preserving the existing Primitive composition
behavior, child-owned attribute precedence, and consumer-provided Trigger class.

Migration: styled composed controls no longer receive Navigation Menu's default trigger recipe,
root sizing, or generated chevron. Style the child directly and place any desired icon inside it.
