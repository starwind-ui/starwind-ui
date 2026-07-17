# Primitive Docs Enrichment Workflow

Primitive docs use generated Runtime and adapter facts as the canonical source of truth, then layer
authored prose on top. This keeps API details synchronized with contracts while still allowing the
docs to read like a useful human reference.

## Source Files

- `scripts/portable-runtime/docs/layered-docs/annotations.ts` owns authored primitive prose:
  summaries, behavior notes, usage guidelines, special sections, part descriptions, prop
  descriptions, data attribute descriptions, and framework notes.
- `scripts/portable-runtime/docs/layered-docs/examples.ts` owns structured examples by primitive,
  example id, and framework target.
- `scripts/portable-runtime/docs/layered-docs/generated/` is generated metadata output. Do not use
  it as the source for authored prose.
- An optional Starwind docs checkout receives generated MDX pages. Pass its repository root with
  `--docs-root <path>`; export is skipped when the checkout is absent unless `--require-docs` is
  also set.

Do not edit generated primitive docs pages or generated layered metadata by hand. Change the
annotation or example source, then regenerate.

## Adding Enrichment

1. Find the primitive contract under `scripts/portable-runtime/contracts/primitive/components/`.
2. Add or revise prose in `primitiveDocsEnrichment` in
   `scripts/portable-runtime/docs/layered-docs/annotations.ts`.
3. Add or revise framework examples in `scripts/portable-runtime/docs/layered-docs/examples.ts`.
4. Run `pnpm runtime:docs:metadata`.
5. Run `pnpm runtime:docs:metadata:check`.
6. When reviewing docs output, rerun the generator with `--docs-root <path>` and inspect the
   generated primitive MDX and markdown in that checkout.

## Prose Guardrails

- Treat Runtime contracts as the source for parts, props, state, events, setters, data attributes,
  form participation, floating behavior, and framework support.
- Check the relevant Runtime source, Runtime tests, adapter contracts, generated output, and
  current comparison docs before writing behavioral explanations.
- Use Base UI-style reference pages as a structure and readability reference, not as Starwind API
  facts.
- Prefer short, direct descriptions that explain what a part or prop does in Starwind terms.
- Do not claim future framework support until generated adapters, package exports, examples, and
  tests exist.
- If AI helps draft prose, review every claim against Runtime contracts, source/tests, generated
  output, and the relevant Base UI-style reference shape before committing.

## Validation Expectations

Generated API facts are required and checked by `pnpm runtime:docs:metadata:check`. Missing authored
prose is reported as an enrichment gap during rollout instead of blocking every incremental docs
improvement. Unknown enrichment targets, such as typoed part names, props, or data attributes, are
hard validation failures because they would create drift from the contract.

Tests should prove that authored descriptions come from the annotation source and that generated
files are recreated from that source. Generated files should never be the only place where a
summary, part description, prop description, data attribute description, usage guideline, special
section, framework note, or example is maintained.
