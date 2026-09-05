# Release Versioning

Version each public surface from the contract that changed. Starwind has three release surfaces:

- The `starwind` package versions CLI commands, options, configuration, and the bundled registry
  payload that makes component releases available.
- Styled and Primitive component versions describe delivered public behavior.

Runtime, Astro, and React form a separate fixed package group. ADR 0007 owns their lockstep release
policy.

## CLI Version Policy

| Change                                                                               | Component version               | `starwind` version              |
| ------------------------------------------------------------------------------------ | ------------------------------- | ------------------------------- |
| Compatible correction to an existing component                                       | patch                           | patch                           |
| Backward-compatible capability in an existing component                              | minor                           | patch                           |
| Breaking API or behavior change in an existing component                             | major                           | patch                           |
| Brand-new stable Styled component or vendorable Primitive                            | explicit initial stable version | minor                           |
| Compatible CLI correction                                                            | none                            | patch                           |
| New CLI command, option, configuration capability, or supported workflow             | none                            | minor                           |
| Breaking CLI command, option, configuration, output, default, or automation contract | none                            | major with express user consent |
| Tests, internal tooling, documentation, or private adapter work                      | none                            | none                            |

An existing component change always schedules at least a `starwind` patch so users can receive the
new bundled registry payload. The component bump does not set the CLI bump. A new stable component
expands the CLI's installable catalog and schedules a `starwind` minor.

When one feature contains component delivery and an independent CLI capability, record separable
release intent. Changesets will apply the highest `starwind` bump during versioning.

## CLI Major Authority

An agent must never create, modify, or approve a `starwind` major Changeset unless the user gives
express consent for that CLI major in the current planning or implementation task. A component
major does not grant this authority.

Record granted consent in the spec's Release Plan with its scope. `write-tickets` must copy that
decision into the release-owning ticket. If implementation discovers a need for an unapproved CLI
major, stop and ask the user. Never infer approval from the feature's risk, a component bump, or a
previous release.

The user owns the real npm publication command and can inspect release intent again in the
Changeset, Version Packages PR, dry run, and publication handoff.

## Component Intent

### Shared framework versions

Each Styled component and vendorable Primitive has one version history shared across its framework
implementations. Different components keep their own histories. A new framework implementation
starts at that component's current `version` and `sourceVersion`; it does not restart at `0.x`.
Adding a framework requires a CLI minor release. When existing implementations and shared metadata
stay unchanged, the addition requires no component bump. Release guards compare existing targets
separately from additions, and still reject unversioned changes or removals of existing targets.

After its first delivery, a Vue-only component source change advances the shared component version
using the usual patch/minor/major intent and schedules CLI delivery. Other frameworks may see that
shared version advance even when their files stay unchanged. Their adapter npm packages need no
release solely because Vue changed. Changes to shared Runtime behavior still follow the fixed-group
rules below.

Vue's npm package has a separate beta version history, starting at `0.1.0` on the `beta` tag while
preserving `latest`. Component versions do not determine package beta status. Stable graduation and
package alignment require a separate approved decision. The initial Vue release keeps all existing
component versions and publishes CLI `3.3.0` with Vue `0.1.0`.

Each existing Styled or vendorable Primitive has two values. `version` is the SemVer of delivered
public behavior. `sourceVersion` is the component version from the most recent release that changed
canonical installable files. A source version is valid SemVer and must not exceed its version. A new
component starts with equal values.

A release intent declares one impact for every entry in its file:

- `source impact` changes canonical installable files.
- `behavior impact` changes delivered Runtime-backed behavior while canonical installable files stay
  unchanged.

The optional intent field is `impact: "source" | "behavior"`. Omitted impact means source impact
for existing intent-file compatibility. Separate files hold mixed impacts.

For an existing Styled component, add the deferred intent under
`.changeset/styled-components/`. For an existing vendorable Primitive, add it under
`.changeset/primitive-components/`. Use component SemVer:

- `patch` for a compatible correction.
- `minor` for a backward-compatible capability.
- `major` for a breaking component API or behavior change.

Keep the released manifest value unchanged in the implementation change. `pnpm release:version`
aggregates pending intents and applies the highest component bump once in the Version Packages PR.
Source impact wins when aggregation combines both impacts for the same component. The Version
Packages PR always advances `version`. It sets `sourceVersion` to the new version for source impact
and preserves `sourceVersion` for behavior impact.

Source impact requires a matching canonical source fingerprint change. Behavior impact is valid only
for a Runtime-backed first-party component or Primitive. It requires a `starwind` release intent and
the complete Runtime, Astro, and React fixed package group from ADR 0007. Existing component
releases still require a `starwind` Changeset.

The pending Context Menu source changes and mobile Runtime correction ship in one combined batch.
Keep only the existing source-impact intents because source impact wins aggregation and advances
`version` and `sourceVersion` together. A later behavior-only release can preserve that source
baseline while it advances `version`.

Give each new stable component an explicit initial version in its manifest. Existing legacy
components continue their published history. New stable components normally start at `1.0.0`.

## Spec And Ticket Ownership

Decide release impact in the spec before ticket decomposition. The spec Release Plan records:

- Package releases.
- Component releases.
- CLI contract impact.
- CLI major approval when applicable.
- Release materialization ownership once tickets exist.

Each ticket declares one release responsibility:

- `none`: the ticket has no release-artifact work.
- `this-ticket`: the ticket writes the declared Changeset, deferred component intent, or version
  manifest entry. Include the complete `## Release Plan` in this ticket.
- `deferred-to-NN`: ticket `NN` owns the release artifacts. Omit the full Release Plan from the
  current ticket.

For one small implementation ticket, keep release artifacts in that ticket. For a multi-ticket
feature, prefer one late serialized release ticket after every source or generation ticket that can
change the affected component inventory. The release classification remains fixed by the spec;
the late ticket materializes that decision against the final integrated diff.

Release-owning tickets must include `.changeset` and any registry artifacts in their write scope.
Reviewers compare package and component bumps independently against this guide.
