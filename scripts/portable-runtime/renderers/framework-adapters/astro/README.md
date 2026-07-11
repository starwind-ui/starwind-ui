# Astro Framework Adapter

This folder is the home for Astro-specific Adapter Output Model printing. A framework adapter author
should be able to inspect this folder to understand how Astro projects files, imports, props,
defaults, render trees, lifecycle setup, refs, events, context markers, portals, helper files, index
exports, and type facades.

Astro exports `astroFrameworkAdapterTarget` from this folder. That target registration wraps the
Astro Framework Adapter, package metadata, public support metadata, primitive output writer, styled
capability, and CLI registry artifact metadata so the central Framework Adapter target registry can
discover Astro from one target home.

## Local Structure

- `adapter.ts`: Astro Adapter Output Model projection.
- `index.ts`: target registration exported to the central target registry.
- `primitive-output-writer.ts` and `primitive-package.ts`: Astro package file writing.
- `manual-primitives.ts`: target-owned manual helper facade output such as Theme.
- `exports.ts`: package export and type facade helpers.
- `styled.ts` and `styled/`: styled component projection, printing, and writing for Astro
  demo/runtime wrappers.
- `lifecycle-projection.ts`: Astro lifecycle/frontmatter/script helpers.
- `*-overlay.ts`, `engine-viewport.ts`, and related modules: specialized family projection helpers.

For the renderer fragment/helper pattern future targets should follow, see
`docs/portable-runtime/framework-renderer-authoring.md`.

## Capability Checklist

- Print `.astro` component files plus helper, index, and type-facade files.
- Project imports and type imports into Astro frontmatter or client scripts.
- Project props, default values, native attributes, and boolean attributes into `Astro.props` and
  markup.
- Project render trees into Astro elements, expressions, text, and slots.
- Project Runtime lifecycle setup and cleanup into Astro-compatible scripts.
- Project refs, event bridges, controlled state sync, context markers, and portal targets without
  adding component-specific behavior.
- Keep target-local helper names aligned with sibling framework homes where practical, while
  preserving Astro-specific frontmatter, script, and static-markup semantics.
- Keep generated artifact extensions and CLI output roots in `index.ts` `cliRegistry` metadata
  instead of shared registry-generator branches.
