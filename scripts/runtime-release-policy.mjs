export const CHANGESET_IGNORED_PACKAGES = Object.freeze([
  "demo",
  "react-demo",
  "vue-demo",
]);

export const CHANGESET_PRIVATE_PACKAGE_POLICY = Object.freeze({
  version: false,
  tag: false,
});

export const RUNTIME_FIXED_GROUP = Object.freeze([
  "@starwind-ui/runtime",
  "@starwind-ui/astro",
  "@starwind-ui/react",
]);

export const RUNTIME_RELEASE_PACKAGE_SET = Object.freeze([
  Object.freeze({ directory: "packages/runtime", name: "@starwind-ui/runtime" }),
  Object.freeze({ directory: "packages/astro", name: "@starwind-ui/astro" }),
  Object.freeze({ directory: "packages/react", name: "@starwind-ui/react" }),
  Object.freeze({ directory: "packages/cli", name: "starwind" }),
]);

// Graduation requires an explicit policy change, independent of the package's SemVer.
export const VUE_RELEASE_POLICY = Object.freeze({
  directory: "packages/vue",
  name: "@starwind-ui/vue",
  tag: "beta",
});

export const ROUTINE_RELEASE_PACKAGE_SET = Object.freeze([
  ...RUNTIME_RELEASE_PACKAGE_SET.slice(0, 3),
  VUE_RELEASE_POLICY,
  RUNTIME_RELEASE_PACKAGE_SET[3],
]);
