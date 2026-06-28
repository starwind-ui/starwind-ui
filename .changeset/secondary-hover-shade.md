---
"@starwind-ui/core": patch
---

fix(button): make `secondary` variant hover a real shade change instead of an opacity reduction

The `secondary` variant used `hover:bg-secondary/90` to darken on hover. Lowering opacity only blends the background through, so when `--secondary` is a near-white neutral on a near-white `--background` (the default: `neutral-200` on white) the hover is imperceptible and actually shifts the color slightly lighter. The hover now mixes the token toward black in light mode and toward white in dark mode, so it produces a visible, correct-direction shade change regardless of how light the token is.
