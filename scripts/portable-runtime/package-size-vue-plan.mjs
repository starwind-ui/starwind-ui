// Frozen size baseline and performance evidence use this version.
export const ZAG_VUE_COMPARATOR_VERSION = "1.42.0";
export const ZAG_SIZE_COMPARATOR_VERSION = "1.43.3";

export const starwindVueRuntimeComponents = Object.freeze([
  "accordion",
  "alert-dialog",
  "avatar",
  "button",
  "carousel",
  "checkbox",
  "checkbox-group",
  "collapsible",
  "color-picker",
  "combobox",
  "context-menu",
  "dialog",
  "drawer",
  "dropzone",
  "field",
  "fieldset",
  "form",
  "input",
  "input-otp",
  "menu",
  "navigation-menu",
  "popover",
  "preview-card",
  "progress",
  "radio",
  "radio-group",
  "scroll-area",
  "select",
  "sidebar",
  "slider",
  "switch",
  "tabs",
  "toast",
  "toggle",
  "toggle-group",
  "tooltip",
]);

export const starwindVueManualFacades = Object.freeze(["theme"]);

export const starwindVueRootHeadlineComponents = Object.freeze(
  [...starwindVueRuntimeComponents, ...starwindVueManualFacades].sort(),
);

export const starwindVueStyledComponents = Object.freeze(
  [
    "accordion",
    "alert-dialog",
    "avatar",
    "button",
    "carousel",
    "checkbox",
    "checkbox-group",
    "collapsible",
    "combobox",
    "color-picker",
    "context-menu",
    "dialog",
    "dropzone",
    "dropdown",
    "field",
    "sheet",
    "form",
    "hover-card",
    "input",
    "input-otp",
    "navigation-menu",
    "popover",
    "progress",
    "radio-group",
    "scroll-area",
    "select",
    "separator",
    "sidebar",
    "slider",
    "switch",
    "tabs",
    "theme-toggle",
    "toast",
    "toggle",
    "toggle-group",
    "tooltip",
    "alert",
    "aspect-ratio",
    "badge",
    "breadcrumb",
    "button-group",
    "card",
    "input-group",
    "item",
    "kbd",
    "label",
    "native-select",
    "pagination",
    "prose",
    "skeleton",
    "spinner",
    "table",
    "textarea",
    "video",
  ].sort(),
);

export const starwindVueStyledExclusions = Object.freeze([
  {
    component: "image",
    reason: "Astro-only Styled contract",
  },
]);

export const starwindZagVueOverlapMappings = Object.freeze([
  { starwind: "accordion", zag: "@zag-js/accordion" },
  { starwind: "alert-dialog", zag: "@zag-js/dialog", sharedMachine: "dialog" },
  { starwind: "avatar", zag: "@zag-js/avatar" },
  { starwind: "carousel", zag: "@zag-js/carousel" },
  { starwind: "checkbox", zag: "@zag-js/checkbox" },
  { starwind: "checkbox-group", zag: "@zag-js/checkbox", sharedMachine: "checkbox" },
  { starwind: "collapsible", zag: "@zag-js/collapsible" },
  { starwind: "color-picker", zag: "@zag-js/color-picker" },
  { starwind: "combobox", zag: "@zag-js/combobox" },
  { starwind: "context-menu", zag: "@zag-js/menu", sharedMachine: "menu" },
  { starwind: "dialog", zag: "@zag-js/dialog" },
  { starwind: "drawer", zag: "@zag-js/drawer" },
  { starwind: "dropzone", zag: "@zag-js/file-upload" },
  { starwind: "input-otp", zag: "@zag-js/pin-input" },
  { starwind: "menu", zag: "@zag-js/menu" },
  { starwind: "navigation-menu", zag: "@zag-js/navigation-menu" },
  { starwind: "popover", zag: "@zag-js/popover" },
  { starwind: "preview-card", zag: "@zag-js/hover-card" },
  { starwind: "progress", zag: "@zag-js/progress" },
  { starwind: "radio", zag: "@zag-js/radio-group", sharedMachine: "radio-group" },
  { starwind: "radio-group", zag: "@zag-js/radio-group" },
  { starwind: "scroll-area", zag: "@zag-js/scroll-area" },
  { starwind: "select", zag: "@zag-js/select" },
  { starwind: "slider", zag: "@zag-js/slider" },
  { starwind: "switch", zag: "@zag-js/switch" },
  { starwind: "tabs", zag: "@zag-js/tabs" },
  { starwind: "toast", zag: "@zag-js/toast" },
  { starwind: "toggle", zag: "@zag-js/toggle" },
  { starwind: "toggle-group", zag: "@zag-js/toggle-group" },
  { starwind: "tooltip", zag: "@zag-js/tooltip" },
]);

export const zagVueMachinePackages = Object.freeze(
  [...new Set(starwindZagVueOverlapMappings.map(({ zag }) => zag))].sort(),
);

export const zagVueInfrastructurePackages = Object.freeze(["@zag-js/core"]);

export const zagVueComparatorPackages = Object.freeze(
  ["@zag-js/vue", ...zagVueInfrastructurePackages, ...zagVueMachinePackages].sort(),
);

export const zagVueComparatorInstallSpecifiers = Object.freeze(
  zagVueComparatorPackages.map((packageName) => `${packageName}@${ZAG_VUE_COMPARATOR_VERSION}`),
);

export const zagVueExpectedResolvedVersions = Object.freeze(
  Object.fromEntries(
    zagVueComparatorPackages.map((packageName) => [packageName, ZAG_VUE_COMPARATOR_VERSION]),
  ),
);

export const zagVueLiveComparatorInstallSpecifiers = Object.freeze(
  zagVueComparatorPackages.map((packageName) => `${packageName}@${ZAG_SIZE_COMPARATOR_VERSION}`),
);

export const zagVueLiveExpectedResolvedVersions = Object.freeze(
  Object.fromEntries(
    zagVueComparatorPackages.map((packageName) => [packageName, ZAG_SIZE_COMPARATOR_VERSION]),
  ),
);

export function getZagVueSizeComparatorPlan({ baselineVue = false, checkOnly = false } = {}) {
  const frozen = baselineVue || checkOnly;
  return {
    version: frozen ? ZAG_VUE_COMPARATOR_VERSION : ZAG_SIZE_COMPARATOR_VERSION,
    installSpecifiers: checkOnly
      ? []
      : frozen
        ? zagVueComparatorInstallSpecifiers
        : zagVueLiveComparatorInstallSpecifiers,
    expectedResolvedVersions: frozen
      ? zagVueExpectedResolvedVersions
      : zagVueLiveExpectedResolvedVersions,
    validateResolvedVersions: frozen
      ? validateZagVueResolvedVersions
      : validateLiveZagVueResolvedVersions,
  };
}

export function buildNamespaceImportEntry(specifiers, prefix = "pkg") {
  const stableSpecifiers = [...new Set(specifiers)].sort();
  const imports = stableSpecifiers.map(
    (specifier, index) => `import * as ${prefix}${index} from "${specifier}";`,
  );
  const bindings = stableSpecifiers.map((_, index) => `${prefix}${index}`);
  return `${imports.join("\n")}\nconsole.log(${bindings.join(", ")});`;
}

export function buildStarwindVueEntry(components = starwindVueRootHeadlineComponents) {
  return buildNamespaceImportEntry(
    components.map((component) => `@starwind-ui/vue/${component}`),
    "component",
  );
}

export function buildStarwindVueRootEntry() {
  return buildNamespaceImportEntry(["@starwind-ui/vue"], "pkg");
}

export function buildZagVueEntry(mappings = starwindZagVueOverlapMappings) {
  return buildNamespaceImportEntry(
    ["@zag-js/vue", ...zagVueInfrastructurePackages, ...mappings.map(({ zag }) => zag)],
    "pkg",
  );
}

export const starwindVueColdImportRows = Object.freeze(
  starwindVueRuntimeComponents.map((component) => ({
    component,
    entry: buildStarwindVueEntry([component]),
    packageName: `@starwind-ui/vue/${component}`,
  })),
);

export const starwindVueThemeHelperRow = Object.freeze({
  component: "theme",
  entry: buildStarwindVueEntry(["theme"]),
  packageName: "@starwind-ui/vue/theme",
});

export const starwindVueRootHeadlineRow = Object.freeze({
  components: starwindVueRootHeadlineComponents,
  entry: buildStarwindVueRootEntry(),
  packageName: "@starwind-ui/vue",
});

export const zagVueAdapterOnlyRow = Object.freeze({
  entry: buildNamespaceImportEntry(["@zag-js/vue"]),
  incompleteComponentCost: true,
  packageName: "@zag-js/vue",
});

export const zagVueMatchedSupportRow = Object.freeze({
  entry: buildZagVueEntry(),
  machinePackages: zagVueMachinePackages,
  mappings: starwindZagVueOverlapMappings,
});

export const zagVueAdapterPlusMachineRows = Object.freeze(
  starwindZagVueOverlapMappings.map((mapping) => ({
    entry: buildZagVueEntry([mapping]),
    machinePackage: mapping.zag,
    starwindComponent: mapping.starwind,
  })),
);

export const STARWIND_VUE_MEASUREMENT_LABELS = Object.freeze({
  adapterOnly: "@starwind-ui/vue (adapter only)",
  combined: "@starwind-ui/vue + runtime",
  completeCatalog: "@starwind-ui/vue complete catalog",
  matchedStarwind: "Starwind/Zag Vue overlap - Starwind Vue",
  matchedZag: "Starwind/Zag Vue overlap - Zag Vue",
  theme: "@starwind-ui/vue/theme",
});

export function buildStarwindVueBrowserMeasurementRows({ vueAlias, runtimeAlias }) {
  const required = true;
  const vueExternal = ["vue", "vue/*"];

  return Object.freeze({
    bundleRows: Object.freeze([
      {
        group: "Starwind Vue private",
        label: STARWIND_VUE_MEASUREMENT_LABELS.adapterOnly,
        entry: starwindVueRootHeadlineRow.entry,
        external: ["@starwind-ui/runtime", "@starwind-ui/runtime/*", ...vueExternal],
        plugins: [vueAlias],
        required,
        versionPackage: "@starwind-ui/vue",
      },
      {
        group: "Starwind Vue private",
        label: STARWIND_VUE_MEASUREMENT_LABELS.combined,
        entry: starwindVueRootHeadlineRow.entry,
        external: vueExternal,
        plugins: [vueAlias, runtimeAlias],
        required,
        versionPackage: "@starwind-ui/vue",
      },
      {
        components: starwindVueRootHeadlineComponents,
        group: "Starwind Vue private catalog",
        label: STARWIND_VUE_MEASUREMENT_LABELS.completeCatalog,
        entry: buildStarwindVueEntry(),
        external: vueExternal,
        plugins: [vueAlias, runtimeAlias],
        required,
        versionPackage: "@starwind-ui/vue",
      },
    ]),
    coldImportRows: Object.freeze([
      ...starwindVueColdImportRows.map((row) => ({
        ...row,
        group: "Starwind Vue private cold import",
        label: row.packageName,
        external: vueExternal,
        plugins: [vueAlias, runtimeAlias],
        provider: "starwind-vue",
        required,
        versionPackage: "@starwind-ui/vue",
      })),
      {
        ...starwindVueThemeHelperRow,
        group: "Starwind Vue private helper",
        label: STARWIND_VUE_MEASUREMENT_LABELS.theme,
        external: vueExternal,
        plugins: [vueAlias, runtimeAlias],
        provider: "starwind-vue",
        required,
        versionPackage: "@starwind-ui/vue",
      },
    ]),
    matchedRows: Object.freeze([
      {
        comparisonSet: "starwind-zag-vue-overlap",
        componentCount: starwindZagVueOverlapMappings.length,
        entry: buildStarwindVueEntry(starwindZagVueOverlapMappings.map(({ starwind }) => starwind)),
        external: vueExternal,
        group: "Starwind Vue private matched support",
        label: STARWIND_VUE_MEASUREMENT_LABELS.matchedStarwind,
        plugins: [vueAlias, runtimeAlias],
        provider: "starwind-vue",
        required,
        versionPackage: "@starwind-ui/vue",
      },
      {
        comparisonSet: "starwind-zag-vue-overlap",
        comparatorInstall: "zag-vue-exact",
        componentCount: starwindZagVueOverlapMappings.length,
        entry: zagVueMatchedSupportRow.entry,
        group: "Starwind Vue private matched support",
        label: STARWIND_VUE_MEASUREMENT_LABELS.matchedZag,
        machinePackages: zagVueMachinePackages,
        provider: "zag-vue",
        required,
        versionPackage: "@zag-js/vue",
      },
    ]),
  });
}

export function validateZagVueResolvedVersions(resolvedVersions) {
  validateZagVueVersions(resolvedVersions, ZAG_VUE_COMPARATOR_VERSION);
}

export function validateLiveZagVueResolvedVersions(resolvedVersions) {
  validateZagVueVersions(resolvedVersions, ZAG_SIZE_COMPARATOR_VERSION);
}

function validateZagVueVersions(resolvedVersions, expectedVersion) {
  const expectedPackages = new Set(zagVueComparatorPackages);
  const missing = zagVueComparatorPackages.filter(
    (packageName) => !Object.hasOwn(resolvedVersions, packageName),
  );
  const unexpected = Object.keys(resolvedVersions)
    .filter((packageName) => !expectedPackages.has(packageName))
    .sort();
  const mismatched = zagVueComparatorPackages
    .filter(
      (packageName) =>
        Object.hasOwn(resolvedVersions, packageName) &&
        resolvedVersions[packageName] !== expectedVersion,
    )
    .map(
      (packageName) =>
        `${packageName}: expected ${expectedVersion}, received ${resolvedVersions[packageName]}`,
    );

  if (missing.length > 0 || unexpected.length > 0 || mismatched.length > 0) {
    throw new Error(
      [
        "Zag Vue comparator version validation failed:",
        ...(missing.length > 0 ? [`- missing: ${missing.join(", ")}`] : []),
        ...(unexpected.length > 0 ? [`- unexpected: ${unexpected.join(", ")}`] : []),
        ...(mismatched.length > 0 ? [`- mismatched: ${mismatched.join(", ")}`] : []),
      ].join("\n"),
    );
  }
}

// This snapshot characterizes the public React-oriented map in measure-package-sizes.mjs.
// Vue-only matches stay in the private plan above.
export const existingPublicSupportMappingSnapshot = Object.freeze([
  { starwind: "accordion", zag: ["@zag-js/accordion"], base: "accordion" },
  { starwind: "alert-dialog", zag: ["@zag-js/dialog"], base: "alert-dialog" },
  { starwind: "avatar", zag: ["@zag-js/avatar"], base: "avatar" },
  { starwind: "button", base: "button" },
  { starwind: "carousel", zag: ["@zag-js/carousel"] },
  { starwind: "checkbox", zag: ["@zag-js/checkbox"], base: "checkbox" },
  { starwind: "checkbox-group", zag: ["@zag-js/checkbox"], base: "checkbox-group" },
  { starwind: "collapsible", zag: ["@zag-js/collapsible"], base: "collapsible" },
  { starwind: "combobox", zag: ["@zag-js/combobox"], base: "combobox" },
  { starwind: "context-menu", zag: ["@zag-js/menu"], base: "context-menu" },
  { starwind: "dialog", zag: ["@zag-js/dialog"], base: "dialog" },
  { starwind: "drawer", zag: ["@zag-js/drawer"], base: "drawer" },
  { starwind: "dropzone", zag: ["@zag-js/file-upload"] },
  { starwind: "field", base: "field" },
  { starwind: "input", base: "input" },
  { starwind: "input-otp", zag: ["@zag-js/pin-input"], base: "otp-field" },
  { starwind: "menu", zag: ["@zag-js/menu"], base: "menu" },
  { starwind: "popover", zag: ["@zag-js/popover"], base: "popover" },
  { starwind: "preview-card", zag: ["@zag-js/hover-card"], base: "preview-card" },
  { starwind: "progress", zag: ["@zag-js/progress"], base: "progress" },
  { starwind: "radio", zag: ["@zag-js/radio-group"], base: "radio" },
  { starwind: "radio-group", zag: ["@zag-js/radio-group"], base: "radio-group" },
  { starwind: "scroll-area", zag: ["@zag-js/scroll-area"], base: "scroll-area" },
  { starwind: "select", zag: ["@zag-js/select"], base: "select" },
  { starwind: "slider", zag: ["@zag-js/slider"], base: "slider" },
  { starwind: "switch", zag: ["@zag-js/switch"], base: "switch" },
  { starwind: "tabs", zag: ["@zag-js/tabs"], base: "tabs" },
  { starwind: "toast", zag: ["@zag-js/toast"], base: "toast" },
  { starwind: "toggle", zag: ["@zag-js/toggle"], base: "toggle" },
  { starwind: "toggle-group", zag: ["@zag-js/toggle-group"], base: "toggle-group" },
  { starwind: "tooltip", zag: ["@zag-js/tooltip"], base: "tooltip" },
]);
