# `@starwind-ui/svelte`

This is Starwind's private, non-shipping Svelte adapter verification package. Its exact Primitive
inventory is Button, Carousel, Checkbox, Select, Accordion, Dialog, Slider, and Toast. Carousel and
Toast are the approved order-10 cross-framework proofs. Sidebar, Color Picker, Styled output, and a
Svelte demo remain outside this package. The package exists so Svelte generation, build output,
types, SSR, hydration, lifecycle behavior, and package exports can be tested at a realistic
boundary.

Do not edit `src` by hand. Change framework-neutral behavior facts in
`scripts/portable-runtime/contracts/primitive`, shared generation plans under
`scripts/portable-runtime/renderers`, or Svelte-specific syntax under
`scripts/portable-runtime/renderers/framework-adapters/svelte`, then run
`pnpm runtime:generate:svelte`.

`private: true`, version `0.0.0`, Changesets exclusion, and absence from the CLI/release package
sets are deliberate. This package is not public Svelte support.

Run `pnpm svelte:verify` from the repository root to regenerate the package, check the committed
source fixed point, type-check, build, and run the package, SSR, hydration, browser lifecycle,
cleanup, declaration, and dist-only consumer evidence.
