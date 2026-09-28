# Standard docs examples

Each implemented Styled component has its first docs preview here. The catalog shows this preview
before its additional examples, with the Svelte source and a link to the component docs.

These files adapt the first `CodePreview` from each public Starwind component docs page and its
referenced demo files. The reference was checked at docs commit `613deb2` on September 9, 2026.
Keep the example content, component parts, default values, and variants aligned when the docs
change. These are hand-authored demo consumers of the Svelte 5 public beta.

The Svelte adaptations use typed native attributes and `child` snippets for composed triggers.
Hover Card uses an anchor with the Button variants because its Svelte trigger owns an anchor.
Example IDs have a component prefix so labels work when all previews share one page. Placeholder
links use catalog anchors or the real destination. Form submission stays in the local example.

Preview widths shrink on phones. Pagination can wrap its controls, while the skeleton text shapes
shrink to the available width. The video uses the same recording already present in `apps/demo`.
Avatar and Aspect Ratio retain the image URLs from the docs.

`tests/review.test.mjs` checks all 50 previews and their source panels before JavaScript. Its
`Docs examples` cases capture each preview at 390px and 1440px in both themes, exercise the composed
forms and controls, and capture the open overlays. Existing behavior checks use the additional
examples below each docs preview.

The target inventory names a source owner for each of the 50 first previews and ten open scenes.
The complete gate requires 240 docs PNGs across both widths and themes, along with the 280 catalog
PNGs. It rejects an omitted owner, missing file, changed hash, or invalid PNG signature.

Dropdown adapts the account menu from the first docs preview. Its named browser owner captures the
closed preview and the open menu at both widths in each theme.

Context Menu translates `ContextMenuExampleHero.astro` from the local docs clone. The focusable region, menu items, submenu, shortcuts, and default checkbox choices keep the docs composition.

Navigation Menu keeps the first documentation-navigation preview. Example content widths fit the narrow frame. Its Getting started, Components, With icon, and Docs entries retain their stock styles.

Combobox keeps the first framework search preview. Its stock Input and Content show typed filtering, an empty result, and selected text. The docs proof captures the open preview in both widths and themes.
