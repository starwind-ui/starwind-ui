# `@starwind-ui/svelte`

This Svelte 5 public-beta adapter package stays at source version `0.0.0` until the normal release
flow applies its first beta version. The target inventory in
`scripts/portable-runtime/renderers/framework-adapters/svelte/inventory.ts` lists its implemented
Primitive families and their test owners. Generated Styled groups live in the Svelte demo at
`apps/svelte-demo/src/lib/starwind-runtime`. The implemented inventory contains 36 Primitive
families plus Theme and 54 Styled roots. The general review route has 53 inline groups and links
to Sidebar's dedicated owner at `/review/sidebar/`.

Color Picker exports 23 Primitive parts and its Runtime facade through the public subpath and
package root. Its optional value and format bindings publish accepted Runtime values after mount.
Color objects keep their immutable methods. Form reset restores separate frozen value and format
seeds, with cancellation and newer commands handled at the connected form owner.

Styled Color Picker supplies twelve exports with popup, inline, and custom compositions. Value and
format bind through the Primitive, while Popover owns accepted open state. Each branch retains the
hidden form input. The review catalog shows popup and inline editors with native and Styled format
controls. Nested Dialog content keeps its authored Color Picker owner through the Portal option.

Sidebar exports five Primitive parts, its namespace, and reactive Provider context. Optional desktop
and mobile bindings follow accepted Runtime state. Stored desktop state can seed the first mount;
reconstruction preserves current state. MenuButton selects a native button or link from href and
exposes a tagged child snippet with native props, refs, and attachments. The lifecycle proof
connects mobile state to the existing Sheet through defined model inputs and accepted binding output.

Styled Carousel provides five components, a default namespace, and CarouselVariants. Its Root
forwards orientation, options, plugins, and the API callback to the existing Primitive service.
Content sends native props, refs, and attachments to the Viewport, while its class styles the
inner Container. Native Previous and Next buttons keep the Button recipe variants. The public-beta
`/review/` catalog includes horizontal and vertical examples with source snippets.

Styled Toast supplies Toaster and seven template parts with ToastVariants and the existing toast
service. Toaster loads the contract stylesheet and supplies six default templates. Custom children
replace them. Runtime clones template markup, so service `action.onClick` handles cloned actions.
Svelte state and handlers remain on the template source. The review example shows both
compositions through one mounted Toaster.

Do not edit `src` by hand. Change framework-neutral behavior facts in
`scripts/portable-runtime/contracts/primitive`, shared generation plans under
`scripts/portable-runtime/renderers`, or Svelte-specific syntax under
`scripts/portable-runtime/renderers/framework-adapters/svelte`, then run
`pnpm runtime:generate:svelte`.

The package, normal CLI registry, demo, and generated docs metadata expose Svelte 5 as public beta.
The source version remains `0.0.0`, and Changesets remains unchanged until the release ticket
materializes the approved `0.1.0` beta plan.

Run `pnpm svelte:verify --component=<name>` from the repository root for the affected owners,
consumer types, and generation drift. The command checks committed output without rewriting it.
The [verification policy](../../docs/agents/svelte-verification.md) defines the reduced `--all`
suite and explicit compatibility/packed-host checks. Compiler pins remain 5.29.0 and 5.57.0.

The public beta supports Svelte 5 from 5.29.0 through the current 5.x line. Compiler checks remain
pinned to 5.29.0 and 5.57.0. Starwind Pro support is outside this beta.

The Styled Sidebar demo is at `/review/sidebar/`, linked from the component catalog. Its
23 exports retain independent desktop/mobile models, native button/link children, and the existing
Sheet for mobile navigation. Collapsed desktop links use the existing Tooltip service and contract
CSS. The page includes source and a separate key for optional desktop persistence.
