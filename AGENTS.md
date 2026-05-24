# AGENTS.md

## Project Shape

Starwind UI is a pnpm/Turbo monorepo for Astro + Tailwind CSS components and the `starwind` CLI.

- `packages/core`: canonical component source, shared utilities, and `src/registry.json`.
- `packages/cli`: Commander CLI for `init`, `add`, `update`, `remove`, `docs`, `search`, and `setup`.
- `apps/demo`: Astro demo app using copied Starwind components.

Use pnpm for all package work. Package metadata requires Node `>=22.12.0`; CI uses Node 24.

## Docs Rule

Use Context7 MCP whenever a task asks about libraries, frameworks, SDKs, APIs, CLI tools, configuration, migrations, or version-specific usage. Resolve the library ID first, then query docs. For Starwind internals, prefer local source over external docs.

## Useful Commands

```bash
pnpm install
pnpm build
pnpm dev
pnpm test:run
pnpm test:coverage
pnpm typecheck
pnpm lint:check
pnpm format:check
pnpm format:ci
pnpm check
```

Workspace helpers:

```bash
pnpm core:build
pnpm core:dev
pnpm cli:build
pnpm cli:dev
pnpm --filter=starwind test:run
pnpm demo:dev
pnpm demo:build
pnpm demo:preview
```

Note: `CONTRIBUTING.md` mentions `pnpm lint`, but the current root script is `pnpm lint:check`.

## Component Conventions

Core components live in `packages/core/src/components/<component-name>/`.

Common files:

- `<Component>.astro`
- `variants.ts`
- `index.ts`

Follow existing patterns:

- Type Astro props with `HTMLAttributes` from `astro/types`.
- Use `VariantProps` from `tailwind-variants` when consuming local variant functions.
- Keep Tailwind variant definitions in `variants.ts`.
- Export components and variant collections from `index.ts`.
- Preserve `data-slot` attributes and Starwind class hooks.
- Interactive components use vanilla browser JS/TS inside `.astro` scripts.
- Reinitialize DOM behavior on `astro:after-swap` and `starwind:init` when matching existing components.
- Use instance tracking such as `WeakMap` for interactive DOM components when the local pattern does.

When adding or changing components, update `packages/core/src/registry.json` versions and dependencies as needed. Use `dependencies` for npm packages and Starwind component dependencies, and `fileDependencies` for shared utility files copied from `src/lib/utils/starwind`.

## CLI Conventions

- CLI entrypoint: `packages/cli/src/index.ts`.
- Commands: `packages/cli/src/commands/`.
- Shared helpers: `packages/cli/src/utils/`.
- Tests are colocated in `__tests__` directories.

Follow existing CLI patterns: Commander for commands, `@clack/prompts` for prompts, `zod` for validation, `fs-extra` for filesystem operations, and `execa` for subprocesses.

## Style And Safety

- TypeScript is strict and ESM-only.
- Prefer existing aliases such as `@/*` within package source.
- Formatting/linting uses Prettier, Biome, ESLint, Astro, and accessibility rules.
- Keep changes scoped; avoid broad refactors unless requested.
- Preserve user work in the tree. Do not revert unrelated changes.
- Add a changeset for package-impacting changes when preparing contribution-ready work.

## Contribution Notes

Use conventional commits such as `feat(scope): message`, `fix(scope): message`, or `refactor(scope): message`. Branch convention is `[type/scope]`, for example `fix/dropdown-hook`.

Before handoff, run the narrowest useful checks for the files changed and report any checks that were not run.
