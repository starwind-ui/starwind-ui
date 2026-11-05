import type { EmissionTarget } from "./render";

/** One named exception from the contract emission check. Unused entries fail the check. */
export type EmissionException = {
  name: string;
  /** `intended` is a design fact. `gap` is a real difference to fix or decide. */
  kind: "intended" | "gap";
  targets: readonly EmissionTarget[];
  family?: RegExp;
  part?: RegExp;
  /** A prop name, or an attribute name, that the target does not handle. */
  fact: RegExp;
  reason: string;
};

const ALL: readonly EmissionTarget[] = ["astro", "react", "vue", "svelte"];

export const emissionExceptions: EmissionException[] = [
  {
    name: "astro-has-no-parent-model",
    kind: "intended",
    targets: ["astro"],
    fact: /^(open|value|inputValue|mobileOpen)$/,
    reason:
      "Astro renders once on the server, so no parent can hold state. The contract lists these parent-held props for the framework targets, and Astro offers the default form of each.",
  },
  {
    name: "runtime-interaction-state",
    kind: "intended",
    targets: ALL,
    fact: /^data-(focused|dragging|rejected|invalid|selected)$/,
    reason:
      "The Runtime writes these while a person focuses, drags, drops, types invalid text, or picks a swatch. Render and mount cannot produce them. The browser suite covers the shared cases.",
  },
  {
    name: "carousel-disabled-needs-measured-slides",
    kind: "intended",
    targets: ALL,
    family: /^carousel$/,
    part: /^(previous|next)$/,
    fact: /^(aria-disabled|data-disabled)$/,
    reason: "Embla decides this from measured slides, and the check renders none.",
  },
  {
    name: "progress-text-marker-needs-authored-text",
    kind: "intended",
    targets: ALL,
    family: /^progress$/,
    part: /^value$/,
    fact: /^data-preserve-text$/,
    reason: "All targets print this only for authored text, and the check renders no text.",
  },
  {
    name: "as-child-marker-needs-a-wrapper",
    kind: "intended",
    targets: ["astro", "svelte"],
    part: /^trigger$/,
    fact: /^data-as-child$/,
    reason:
      "Astro prints the wrapper marker only when a real element child is present, and the check renders no child. Svelte composes through the `child` snippet and has no asChild prop (ADR 0018).",
  },
  {
    name: "svelte-composes-through-the-child-snippet",
    kind: "intended",
    targets: ["svelte"],
    fact: /^asChild$/,
    reason: "Svelte offers a `child` snippet in place of the asChild prop (ADR 0018).",
  },
  {
    name: "combobox-input-text-is-a-dom-property",
    kind: "intended",
    targets: ["astro", "vue"],
    family: /^combobox$/,
    part: /^input$/,
    fact: /^value$/,
    reason:
      "These targets set the text as a DOM property at mount, so no attribute appears. The browser suite asserts the text on all targets.",
  },
  {
    name: "react-avatar-image-renders-after-load",
    kind: "intended",
    targets: ["react"],
    family: /^avatar$/,
    part: /^(image|fallback)$/,
    fact: /^(alt|hidden)$/,
    reason:
      "React renders the image only after it loads, and alt passes through its native props. A render with no network shows neither.",
  },
  {
    name: "navigation-menu-controlled-marker",
    kind: "intended",
    targets: ALL,
    family: /^navigation-menu$/,
    part: /^root$/,
    fact: /^data-controlled-value$/,
    reason:
      "Astro prints this only for a null value, which marks a closed menu. Framework targets hold the same fact in their model, so no attribute exists there.",
  },
];
