export type VuePackageExportTarget = {
  import: `./dist/${string}.js`;
  types: `./dist/${string}.d.ts`;
};

export type VuePackageSubpath = {
  buildEntry: string;
  exportTarget: VuePackageExportTarget;
  source: string;
  subpath: "." | `./${string}`;
};

type VueRuntimePrimitiveInventoryEntry = {
  component: string;
  sourceFiles: readonly string[];
};

type VueManualFacadeInventoryEntry = {
  component: string;
  sourceFiles: readonly string[];
};

export type VueAdapterInventory = {
  manualFacades: readonly VueManualFacadeInventoryEntry[];
  packageSubpaths: readonly VuePackageSubpath[];
  runtimePrimitives: readonly VueRuntimePrimitiveInventoryEntry[];
  styledComponents: readonly string[];
};

function createComponentPackageSubpath(component: string): VuePackageSubpath {
  return {
    buildEntry: `${component}/index`,
    exportTarget: {
      import: `./dist/${component}/index.js`,
      types: `./dist/${component}/index.d.ts`,
    },
    source: `src/${component}/index.ts`,
    subpath: `./${component}`,
  };
}

export type VueInventoryDiagnostics = {
  packageExports: {
    conditionKeysMissing: string[];
    conditionKeysUnexpected: string[];
    extra: string[];
    mismatched: string[];
    missing: string[];
  };
  sourceFiles: {
    extra: string[];
    missing: string[];
  };
};

const vueRuntimePrimitives = [
  {
    component: "avatar",
    sourceFiles: [
      "avatar/AvatarFallback.vue",
      "avatar/AvatarImage.vue",
      "avatar/AvatarRoot.vue",
      "avatar/index.ts",
    ],
  },
  {
    component: "button",
    sourceFiles: ["button/ButtonRoot.vue", "button/index.ts"],
  },
  {
    component: "checkbox",
    sourceFiles: [
      "checkbox/CheckboxIndicator.vue",
      "checkbox/CheckboxRoot.vue",
      "checkbox/index.ts",
    ],
  },
  {
    component: "progress",
    sourceFiles: [
      "progress/ProgressIndicator.vue",
      "progress/ProgressLabel.vue",
      "progress/ProgressRoot.vue",
      "progress/ProgressTrack.vue",
      "progress/ProgressValue.vue",
      "progress/index.ts",
    ],
  },
  {
    component: "scroll-area",
    sourceFiles: [
      "scroll-area/ScrollAreaContent.vue",
      "scroll-area/ScrollAreaCorner.vue",
      "scroll-area/ScrollAreaRoot.vue",
      "scroll-area/ScrollAreaScrollbar.vue",
      "scroll-area/ScrollAreaThumb.vue",
      "scroll-area/ScrollAreaViewport.vue",
      "scroll-area/index.ts",
    ],
  },
  {
    component: "select",
    sourceFiles: [
      "select/SelectGroup.vue",
      "select/SelectGroupLabel.vue",
      "select/SelectIcon.vue",
      "select/SelectItem.vue",
      "select/SelectItemIndicator.vue",
      "select/SelectItemText.vue",
      "select/SelectLabel.vue",
      "select/SelectList.vue",
      "select/SelectPopup.vue",
      "select/SelectPortal.vue",
      "select/SelectPositioner.vue",
      "select/SelectRoot.vue",
      "select/SelectScrollDownArrow.vue",
      "select/SelectScrollUpArrow.vue",
      "select/SelectSeparator.vue",
      "select/SelectTrigger.vue",
      "select/SelectValue.vue",
      "select/index.ts",
    ],
  },
] as const satisfies readonly VueRuntimePrimitiveInventoryEntry[];

const vueManualFacades = [
  { component: "theme", sourceFiles: ["theme/index.ts"] },
] as const satisfies readonly VueManualFacadeInventoryEntry[];

const vuePortableStyledComponents = [
  "avatar",
  "button",
  "checkbox",
  "progress",
  "scroll-area",
  "select",
  "theme-toggle",
] as const;

export const vueAdapterInventory = {
  runtimePrimitives: vueRuntimePrimitives,
  manualFacades: vueManualFacades,
  styledComponents: vuePortableStyledComponents,
  packageSubpaths: [
    {
      buildEntry: "index",
      exportTarget: { import: "./dist/index.js", types: "./dist/index.d.ts" },
      source: "src/index.ts",
      subpath: ".",
    },
    ...[...vueRuntimePrimitives, ...vueManualFacades].map(({ component }) =>
      createComponentPackageSubpath(component),
    ),
  ],
} as const satisfies VueAdapterInventory;

export const vueRuntimePrimitiveComponents = vueAdapterInventory.runtimePrimitives.map(
  ({ component }) => component,
);

export const vueManualPrimitiveComponents = vueAdapterInventory.manualFacades.map(
  ({ component }) => component,
);

export const vuePrimitiveComponents = [
  ...vueRuntimePrimitiveComponents,
  ...vueManualPrimitiveComponents,
] as const;

export const vueStyledComponents = [...vueAdapterInventory.styledComponents] as const;

export const vuePackageSubpaths = [...vueAdapterInventory.packageSubpaths] as const;

export const vuePackageExports = Object.fromEntries(
  vuePackageSubpaths.map(({ exportTarget, subpath }) => [subpath, exportTarget]),
) as Record<string, VuePackageExportTarget>;

export const vueBuildEntryPoints = Object.fromEntries(
  vuePackageSubpaths.map(({ buildEntry, source }) => [buildEntry, source]),
) as Record<string, string>;

export const vueGeneratedSourceFiles = [
  "index.ts",
  ...vueAdapterInventory.runtimePrimitives.flatMap(({ sourceFiles }) => sourceFiles),
  ...vueAdapterInventory.manualFacades.flatMap(({ sourceFiles }) => sourceFiles),
].sort();

const vueStyledComponentSet: ReadonlySet<string> = new Set(vueStyledComponents);

export function isVueInventoryStyledComponent(component: string): boolean {
  return vueStyledComponentSet.has(component);
}

export function validateVueInventorySnapshot({
  packageExports,
  sourceFiles,
}: {
  packageExports: Record<string, unknown>;
  sourceFiles: readonly string[];
}): VueInventoryDiagnostics {
  const expectedExportNames = Object.keys(vuePackageExports);
  const actualExportNames = Object.keys(packageExports);
  const expectedSourceFiles = new Set(vueGeneratedSourceFiles);
  const actualSourceFiles = new Set(sourceFiles);

  const conditionKeysMissing: string[] = [];
  const conditionKeysUnexpected: string[] = [];
  const mismatched = expectedExportNames.flatMap((subpath) => {
    const expected = vuePackageExports[subpath];
    const actual = packageExports[subpath];
    if (!expected || !Object.hasOwn(packageExports, subpath)) return [];

    const actualTarget = isStringRecord(actual) ? actual : {};
    const expectedConditionKeys = Object.keys(expected) as Array<keyof VuePackageExportTarget>;
    const actualConditionKeys = Object.keys(actualTarget);
    conditionKeysMissing.push(
      ...expectedConditionKeys
        .filter((field) => !Object.hasOwn(actualTarget, field))
        .map((field) => `${subpath}: ${field}`),
    );
    conditionKeysUnexpected.push(
      ...actualConditionKeys
        .filter((field) => !Object.hasOwn(expected, field))
        .map((field) => `${subpath}: ${field}`),
    );

    return expectedConditionKeys.flatMap((field) => {
      if (!Object.hasOwn(actualTarget, field) || actualTarget[field] === expected[field]) return [];
      return [
        `${subpath} ${field}: expected ${JSON.stringify(expected[field])}, received ${JSON.stringify(actualTarget[field])}`,
      ];
    });
  });

  return {
    packageExports: {
      conditionKeysMissing: conditionKeysMissing.sort(),
      conditionKeysUnexpected: conditionKeysUnexpected.sort(),
      extra: actualExportNames.filter((name) => !Object.hasOwn(vuePackageExports, name)).sort(),
      mismatched: mismatched.sort(),
      missing: expectedExportNames.filter((name) => !Object.hasOwn(packageExports, name)).sort(),
    },
    sourceFiles: {
      extra: [...actualSourceFiles].filter((file) => !expectedSourceFiles.has(file)).sort(),
      missing: [...expectedSourceFiles].filter((file) => !actualSourceFiles.has(file)).sort(),
    },
  };
}

export function hasVueInventoryDiagnostics(diagnostics: VueInventoryDiagnostics): boolean {
  return (
    diagnostics.packageExports.extra.length > 0 ||
    diagnostics.packageExports.conditionKeysMissing.length > 0 ||
    diagnostics.packageExports.conditionKeysUnexpected.length > 0 ||
    diagnostics.packageExports.mismatched.length > 0 ||
    diagnostics.packageExports.missing.length > 0 ||
    diagnostics.sourceFiles.extra.length > 0 ||
    diagnostics.sourceFiles.missing.length > 0
  );
}

export function formatVueInventoryDiagnostics(diagnostics: VueInventoryDiagnostics): string {
  const lines = ["Vue adapter inventory drift detected:"];
  const entries: Array<[string, readonly string[]]> = [
    ["package exports missing", diagnostics.packageExports.missing],
    ["package exports extra", diagnostics.packageExports.extra],
    ["package export condition keys missing", diagnostics.packageExports.conditionKeysMissing],
    [
      "package export condition keys unexpected",
      diagnostics.packageExports.conditionKeysUnexpected,
    ],
    ["package export paths mismatched", diagnostics.packageExports.mismatched],
    ["generated source files missing", diagnostics.sourceFiles.missing],
    ["generated source files extra", diagnostics.sourceFiles.extra],
  ];
  for (const [label, values] of entries) {
    if (values.length > 0) lines.push(`- ${label}: ${values.join(", ")}`);
  }
  return lines.join("\n");
}

function isStringRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

export function assertVueInventorySnapshot(
  snapshot: Parameters<typeof validateVueInventorySnapshot>[0],
): void {
  const diagnostics = validateVueInventorySnapshot(snapshot);
  if (hasVueInventoryDiagnostics(diagnostics)) {
    throw new Error(formatVueInventoryDiagnostics(diagnostics));
  }
}
