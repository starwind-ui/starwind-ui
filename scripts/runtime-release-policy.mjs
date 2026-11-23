export const CHANGESET_IGNORED_PACKAGES = Object.freeze(["demo", "react-demo", "vue-demo"]);

export const CHANGESET_PRIVATE_PACKAGE_POLICY = Object.freeze({
  version: false,
  tag: false,
});

// Vue and Svelte joined the fixed group when they graduated from beta to stable (ADR 0007).
export const RUNTIME_FIXED_GROUP = Object.freeze([
  "@starwind-ui/runtime",
  "@starwind-ui/astro",
  "@starwind-ui/react",
  "@starwind-ui/vue",
  "@starwind-ui/svelte",
]);

// The fixed group before graduation. Only the legacy first Vue beta recovery reads it.
export const LEGACY_BETA_RUNTIME_FIXED_GROUP = Object.freeze([
  "@starwind-ui/runtime",
  "@starwind-ui/astro",
  "@starwind-ui/react",
]);

// The publication order is Runtime, the adapters, then the CLI.
export const RUNTIME_RELEASE_PACKAGE_SET = Object.freeze([
  Object.freeze({ directory: "packages/runtime", name: "@starwind-ui/runtime" }),
  Object.freeze({ directory: "packages/astro", name: "@starwind-ui/astro" }),
  Object.freeze({ directory: "packages/react", name: "@starwind-ui/react" }),
  Object.freeze({ directory: "packages/vue", name: "@starwind-ui/vue" }),
  Object.freeze({ directory: "packages/svelte", name: "@starwind-ui/svelte" }),
  Object.freeze({ directory: "packages/cli", name: "starwind" }),
]);

export const ROUTINE_RELEASE_PACKAGE_SET = RUNTIME_RELEASE_PACKAGE_SET;

// The packages that left the beta channel at graduation. A stable publication points their old
// `beta` dist-tag at the new stable version, so `@beta` installs from older guides get stable.
export const GRADUATED_BETA_PACKAGES = Object.freeze(["@starwind-ui/vue", "@starwind-ui/svelte"]);

/**
 * The last beta versions on `main` before the graduation release versions the fixed group. Until
 * Changesets versions the group, these manifests trail it. Release metadata accepts that state only
 * when both packages still hold these exact versions and the rest of the group is at
 * `GRADUATION_START_GROUP_VERSION`. The publisher refuses that state before it plans anything.
 * Remove this after the first stable fixed-group release (1.6.0).
 */
export const GRADUATION_START_GROUP_VERSION = "1.5.0";

export const GRADUATION_PENDING_VERSIONS = Object.freeze({
  "@starwind-ui/vue": "0.4.0",
  "@starwind-ui/svelte": "0.3.0",
});
