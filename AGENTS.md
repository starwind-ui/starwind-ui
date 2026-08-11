# AGENTS.md

## Project Shape

Starwind UI is a pnpm/Turbo monorepo for Astro and React components, framework-neutral Runtime
controllers, generated Primitive adapters, and the `starwind` CLI.

- `packages/runtime`: behavior-only DOM controllers and component subpath exports.
- `packages/astro` and `packages/react`: generated first-party Primitive adapters.
- `packages/vue`: private, non-shipping Vue adapter verification output; it is not an npm or CLI
  support surface until a dedicated release transition removes the quarantine.
- `packages/svelte`: private, non-shipping Svelte adapter verification output for Button,
  Checkbox, and Select; it is not an npm or CLI support surface.
- `packages/cli`: CLI commands, registries, migrations, and project integration.
- `apps/demo` and `apps/react-demo`: complete Astro and React integration demos.
- `apps/vue-demo`: private Vue integration verification for the quarantined adapter.
- `scripts/portable-runtime`: adapter contracts, generators, smoke tests, and measurement tooling.

Use pnpm for package work. Package metadata requires Node `>=22.12.0`; CI uses Node 24.

## Useful Commands

```bash
pnpm install
pnpm build
pnpm verify
pnpm test:run
pnpm test:coverage
pnpm typecheck
pnpm lint:check
pnpm format:check
pnpm demo:smoke
pnpm react-demo:smoke
pnpm runtime:generate:all
pnpm runtime:registry:generate
pnpm runtime:size:check
```

## Contribution Conventions

- Runtime behavior belongs in `packages/runtime`; framework adapters wire props, refs, events, and
  markup to Runtime behavior rather than reimplementing it.
- Generated adapter outputs should be changed through contracts, specs, or generators and then
  regenerated.
- Keep TypeScript strict and ESM-only.
- Put tests in the established `tests` homes rather than adding colocated `__tests__` directories.
- Preserve `data-slot` for public part identity and use `data-sw-*` for Runtime discovery hooks.
- Add deferred styled version intent under `.changeset/styled-components/` for changed existing
  components; the generated Version Packages PR consolidates manifest bumps. Regenerate registry
  artifacts rather than editing generated registry JSON by hand.
- Add deferred primitive version intent under `.changeset/primitive-components/` for changed
  existing vendored primitives. Use normal SemVer: `patch` for compatible fixes, `minor` for
  backward-compatible capabilities, and `major` for breaking changes.
- Add a Changeset for package-facing changes. Never add Changesets for `@starwind-ui/vue`,
  `@starwind-ui/svelte`, and `vue-demo` while they remain quarantined.
- Use conventional commits such as `feat(runtime): ...`, `fix(cli): ...`, or `docs: ...`.

Before handoff, run the narrowest relevant tests and report any checks that were not run.
