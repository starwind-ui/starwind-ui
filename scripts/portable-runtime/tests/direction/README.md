# Direction fixture shards

Add a case module under `cases/<ticket-slug>/`. It can export `cases`, `expectations`, or both. Each case needs a unique ID, an inventory row, acceptance IDs, framework source, named exports used by that source, and assertion names. An expectation with the same ID runs the browser checks. The loader reads nested modules in file path order.

An expectation uses `run(page, target, ctx)`. Every name in the target fixture's `assertions` array must call `await ctx.check(name, async () => { /* browser assertion */ })`. The callback throws when its assertion fails. `ctx.observe(name, value)` records a JSON-compatible measurement, including one made before a failed check. The runner records each check as passed, failed, or unrun. Unknown, duplicate, and missing checks fail the case. The browser and atlas reports include checks, observations, failed assertion IDs, and a separate case status. A failed check does not stop later checks, so an expectation can keep useful measurements.

Add `staging/<ticket-slug>.json` with this shape:

```json
{
  "cohort": "ticket-slug",
  "caseIds": ["first-case", "second-case"]
}
```

The listed IDs must exactly match the cases under that folder. `pnpm direction:test --case ticket-slug` runs the full cohort. An exact case ID runs one case. The staging ledger can add fields for expected failures and remediation ownership when the comparator lands.

The `test-fixtures/cohort` folder proves nested discovery without adding its Button and Badge cases to the production inventory. Run its browser check with `--fixture-root` pointing to that folder.

The test-only `receipt-failure` fixture deliberately fails one check. Its atlas report keeps the failed check, later passing check, measurements, and screenshot while the command exits with failure.

The disposable consumer links installed dependencies declared by the demo packages. Styled and Primitive imports still resolve to generated candidate files. A legacy Astro case imports `@direction/legacy-astro/<group>` and adds the old Astro component tree to Tailwind source scanning. Astro assets use Astro's native `astro:assets` integration.

The `audit-source-occurrences` case compares each scanned file with `inventory/physical-tokens.json` by token count, spellings and statement hashes. A change to the text of a line that holds a token fails it, and moving lines does not. After you add, remove or change a physical token on purpose, run `pnpm direction:ledger` to rewrite the ledger, then review its diff.
