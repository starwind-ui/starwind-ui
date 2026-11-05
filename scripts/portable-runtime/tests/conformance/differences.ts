// The named ledger of every way a target may differ. A new difference fails the suite until it is
// fixed or listed here with a reason. A fixed defect also fails the suite, because `it.fails` then
// passes, so its entry must be removed.

type Target = "astro" | "react" | "vue" | "svelte";

/** A target is expected to differ. The scenario does not run on that target. */
export type IntendedDifference = {
  name: string;
  targets: readonly Target[];
  scenarios: RegExp;
  reason: string;
};

/** A product defect the suite found. The scenario runs and must fail until the defect is fixed. */
export type KnownDefect = {
  name: string;
  targets: readonly Target[];
  scenarios: RegExp;
  reproduction: string;
};

/** A difference in the attributes of one part, compared with Astro. */
export type AttributeDifference = {
  name: string;
  kind: "intended" | "defect";
  targets: readonly Target[];
  phases?: readonly ("first" | "after")[];
  parts: RegExp;
  attributes: RegExp;
  reason: string;
};

export const intendedDifferences: IntendedDifference[] = [
  {
    name: "astro-has-no-parent-model",
    targets: ["astro"],
    scenarios: /parent-held|, parent text$/,
    reason:
      "Astro renders once on the server. No parent re-renders props, so only Runtime DOM events and cancellation exist there.",
  },
  {
    name: "astro-has-no-ref-callback",
    targets: ["astro"],
    scenarios: /^link child ref:/,
    reason: "Astro renders on the server, so a component has no client ref to call.",
  },
  {
    name: "react-warns-on-textarea-value-and-default",
    targets: ["react"],
    scenarios: /^form textarea, parent-held with a default:/,
    reason:
      "React logs an error for a textarea with both props. Its field then shows the default while the state keeps the old text, so the parent cannot see the reset.",
  },
];

export const knownDefects: KnownDefect[] = [];

export const attributeDifferences: AttributeDifference[] = [
  {
    name: "react-activates-select-and-combobox-on-first-use",
    kind: "intended",
    targets: ["react"],
    phases: ["first"],
    parts: /^a[sc]-/,
    attributes: /.*/,
    reason:
      "React starts the Select and Combobox controllers and mounts their popup at first use, to keep first render cost low. Attributes that the Runtime writes appear then, and match after the first interaction.",
  },
  {
    name: "adapter-selected-label-cache",
    kind: "intended",
    targets: ["react", "vue", "svelte"],
    phases: ["after"],
    parts: /^as-root$/,
    attributes: /^data-selected-(value|label)$/,
    reason:
      "Adapters keep the committed label on the root, so the Runtime can render a label while the popup is unmounted. Astro items are always in the DOM, so it reads the item directly.",
  },
  {
    name: "unchecked-indicator-is-not-rendered",
    kind: "intended",
    targets: ["react", "svelte"],
    parts: /^ak-indicator$/,
    attributes: /.*/,
    reason:
      "React and Svelte skip the indicator while unchecked unless keepMounted is set. Astro markup is fixed on the server, so the Runtime hides it there. The visible result matches.",
  },
];

export function attributeDifferenceIsListed(
  target: Target,
  phase: string,
  part: string,
  attribute: string,
): boolean {
  return attributeDifferences.some(
    (entry) =>
      entry.targets.includes(target) &&
      (!entry.phases || entry.phases.some((listed) => listed === phase)) &&
      entry.parts.test(part) &&
      entry.attributes.test(attribute),
  );
}
