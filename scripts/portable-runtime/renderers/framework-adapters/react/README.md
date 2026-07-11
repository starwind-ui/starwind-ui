# React Framework Adapter

This folder is the home for React-specific Adapter Output Model printing. A framework adapter author
should be able to inspect this folder to understand how React projects files, imports, props,
defaults, render trees, lifecycle setup, refs, events, context markers, portals, helper files, index
exports, and type facades.

React exports `reactFrameworkAdapterTarget` from this folder. That target registration wraps the
React Framework Adapter, package metadata, public support metadata, primitive output writer, styled
capability, and CLI registry artifact metadata so the central Framework Adapter target registry can
discover React from one target home.

## Local Structure

- `adapter.ts`: React Adapter Output Model projection.
- `index.ts`: target registration exported to the central target registry.
- `primitive-output-writer.ts` and `primitive-package.ts`: React package file writing.
- `manual-primitives.ts`: target-owned manual helper facade output such as Theme.
- `exports.ts`: package export and type facade helpers.
- `styled.ts` and `styled/`: styled component projection, printing, and writing for React
  demo/runtime wrappers.
- `lifecycle-projection.ts`: React ref/effect/callback helpers.
- `*-overlay.ts`, `engine-viewport.ts`, and related modules: specialized family projection helpers.

For the renderer fragment/helper pattern future targets should follow, see
`docs/portable-runtime/framework-renderer-authoring.md`.

## Capability Checklist

- Print `.tsx` component files plus helper, index, and type-facade files.
- Project imports and type imports into React modules.
- Project props, default values, native attributes, and boolean attributes into prop types and JSX.
- Project render trees into JSX elements, expressions, text, and `children`.
- Project Runtime lifecycle setup and cleanup through React effects.
- Project refs, event bridges, controlled state sync, context markers, and portals without adding
  component-specific behavior.
- Keep target-local helper names aligned with sibling framework homes where practical, while
  preserving React-specific refs, effects, context, portals, and controlled-state semantics.
- Keep generated artifact extensions and CLI output roots in `index.ts` `cliRegistry` metadata
  instead of shared registry-generator branches.
