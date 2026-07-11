# AGENTS.md

## Project Shape

Starwind UI is a pnpm/Turbo monorepo for Astro and React components, framework-neutral Runtime
controllers, generated Primitive adapters, and the `starwind` CLI.

- `packages/core`: canonical styled component source and shared utilities.
- `packages/runtime`: behavior-only DOM controllers and component subpath exports.
- `packages/astro` and `packages/react`: generated first-party Primitive adapters.
- `packages/cli`: CLI commands, registries, migrations, and project integration.
- `apps/demo` and `apps/react-demo`: complete Astro and React integration demos.
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
- Update CLI registry version manifests and regenerate registry artifacts rather than editing
  generated registry JSON by hand.
- Add a Changeset for package-facing changes.
- Use conventional commits such as `feat(runtime): ...`, `fix(cli): ...`, or `docs: ...`.

Before handoff, run the narrowest relevant tests and report any checks that were not run.
