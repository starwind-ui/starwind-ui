export const CHANGESET_IGNORED_PACKAGES = Object.freeze([
  "demo",
  "react-demo",
  "vue-demo",
  "@starwind-ui/core",
  "@starwind-ui/vue",
]);

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
