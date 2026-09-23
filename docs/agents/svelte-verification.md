# Svelte verification

Use `pnpm svelte:verify` for Svelte changes. It selects tests from the working-tree diff against
`HEAD`, including untracked files. Set `--base=<ref>` to include committed branch work. The command
prints each selected test and the reason for its selection before execution.

```sh
pnpm svelte:verify --component=combobox
pnpm svelte:verify --base=main --dry-run
pnpm svelte:verify --files=scripts/portable-runtime/renderers/framework-adapters/svelte/attachments.ts
pnpm svelte:verify --all
```

`--component` selects an explicit component instead of reading the Git diff. `--all` runs the reduced
local suite with a demo smoke and portal composition checks. Builds run once per invocation. The command checks generation drift
without changing committed output. It does not install isolated consumers or collect visual evidence.

## Select checks from the change

| Change                                                                          | Verification                                                                     |
| ------------------------------------------------------------------------------- | -------------------------------------------------------------------------------- |
| Primitive component or contract                                                 | Its inventory test owner, affected Styled composition, and the shared type batch |
| Styled component or contract                                                    | Its owner tests and the compositions that depend on it                           |
| Shared Svelte helper                                                            | Dependent printer families; use the printed selection to inspect the scope       |
| Shared target or generator entry                                                | Reduced Svelte suite and generator type checks                                   |
| Demo example                                                                    | Changed example smoke; source and catalog checks share one template witness      |
| Portal composition source, route, or browser test                               | Existing portal composition browser suite                                        |
| Layout or theme lifecycle                                                       | Demo shell smoke and layout teardown check                                       |
| Package exports, declarations, build, or dependency resolution                  | Package tests plus `pnpm svelte:hosts --host=vite`                               |
| Compiler pins, attachment semantics, snippets, or shared model/lifecycle wiring | `pnpm svelte:compatibility` plus affected local behavior tests                   |
| Shared SSR/hydration or host navigation                                         | Relevant `pnpm svelte:hosts --host=sveltekit` or `--host=astro` checks           |
| Host fixture or host dependency                                                 | That host's check                                                                |

Compatibility and packed-host commands are explicit integration checks. Run them when the relevant
row applies. They can install packages and start browsers. Ordinary component and style edits use the
local checks. Preserve any manual review or landing approval required by the current task.

Portal checks run automatically for `PortalCompositions.svelte`, its `/review/portals/+page.svelte`
route, and `tests/portal-compositions.mjs` under `apps/svelte-demo`. Component selection also adds
this suite when the affected Styled set contains Button, Color Picker, Select, Dialog, Sheet,
Popover, or Dropdown after dependency expansion. Primitive Drawer and Menu use the existing Sheet
and Dropdown mapping. Each selected component keeps its current owner tests.

A portal-only app edit builds Runtime, Svelte, and the production demo once, then runs
`pnpm --filter=svelte-demo exec node tests/portal-compositions.mjs`. Overlapping inputs schedule
one portal command. The script owns its ephemeral preview and browser cleanup. Direct invocation
keeps its existing width, theme, and evidence options.

Select several affected hosts with `pnpm svelte:hosts --hosts=vite,sveltekit,astro`. That invocation
builds and packs the workspace packages once, then installs the same archives into each host.
The runner generates the Svelte registry capability and invokes the repository command APIs
in an isolated child. Each host runs `init` twice and installs the five representative Styled roots.
Its build reads the configuration and canonical stylesheet that those commands prepared. Vite also
checks source updates, behavior updates, remove/re-add, discovery, and a vendored Select witness.
Packed Runtime and Svelte packages remain the consumer dependencies. The CLI runs from repository
source so the check can validate the current workspace before package release.

An edit to `packages/cli/tests/commands/svelte-delivery.integration.test.ts` selects its focused CLI
command as an additional check. The command unsets `npm_execpath` because pnpm 11 supplies a native
executable where the existing generator formatter expects a JavaScript entry point.

## Keep one behavior owner

The Primitive and Styled inventory names the tests that own each adapter. Keep direct regressions
for ordinary accepted model publication, cancellation, parent commands, hydration identity, and
cleanup. Add node replacement coverage when the current family contract supports replacement.
Specialized collection and overlay wiring needs its own cases. Runtime tests own the interaction
algorithms.

Styled checks cover the composition, forwarding, and bindable element refs added by the wrapper. Browser helpers
compile their fixtures for SSR and the browser. They do not launch a type checker. The shared consumer
test checks positive consumers together, then checks negative witnesses in one batch. Negative cases
represent generated type shapes and specialized API branches.

The compatibility command checks representative hydration and both known native compiler regressions
with isolated Svelte 5.29.0 and 5.57.0 tools. It also checks independent forwarded attachments. Component
behavior suites run on the installed workspace compiler.

## Visual changes

Choose the affected scene and a width and theme that exercise the change:

```sh
pnpm svelte:demo:build
pnpm svelte:demo:test --component=combobox --visual
pnpm svelte:demo:test --component=combobox --visual --width=390 --theme=dark
```

Each command uses one browser configuration. Add configurations when responsive layout or theme is
part of the change. Browser failures save a diagnostic screenshot. Routine behavior changes have no
required screenshot count. Existing rollout evidence stays historical.

## Performance tools

The Svelte rollout economics runner is retired. Framework comparisons against other
libraries remain available through `runtime:perf`, `runtime:perf:vue`, and the product size commands.
Run those measurements only when requested. They are separate from Svelte correctness verification.

`pnpm runtime:size:svelte` lists the current Primitive size scope. Use its explicit `--capture`
mode to measure all providers, or `--check` to validate saved evidence offline. See
[the measurement guide](../portable-runtime/svelte-measurements.md). Capture is excluded from
this verifier and routine builds.

`pnpm runtime:perf:svelte` lists four targeted interaction workloads. Its explicit `--capture` runs
the complete fixed matrix; `--smoke` with provider/workload filters diagnoses a fixture. Use
`--check` for offline integrity. The timing command shares the frozen size environment and stays
outside this verifier, update hooks and CI.

## Cost

Aim for under one minute for a warm component check and under three minutes for the reduced local
suite. Record measured wall time in `docs/agents/test-health.md`. Review setup, duplicate assertions,
and scope if a command exceeds those targets. Preserve each retained behavior's regression coverage.
