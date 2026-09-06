import path from "node:path";

import { checkAcceptedVuePerformanceEvidence } from "../../../measure-vue-runtime-performance.mjs";
import { checkVueBaselineEvidence } from "../../../package-size-vue-baseline-runner.mjs";
import { validateVuePackageSizeBaselineEvidence } from "../../../vue-package-size-baseline.mjs";
import { starwindStyledContracts } from "../../../contracts/styled/starwind.js";
import {
  getManualHelperPrimitiveInventoryEntries,
  getRuntimeAdapterPrimitiveInventoryEntries,
} from "../../../renderers/primitive-inventory.js";
import { vueAdapterInventory, vuePackageSubpaths, vueStyledComponents } from "./inventory.js";
import { supportsVueScope } from "./styled/scope.js";

export const vueBetaEvidenceCategories = [
  "inventory",
  "generation",
  "export",
  "compiler-type",
  "ssr",
  "hydration-risk",
  "public-behavior",
  "browser",
  "cleanup",
  "demo",
  "cli",
  "clean-consumer",
  "size",
  "performance",
] as const;

export type VueBetaEvidenceCategory = (typeof vueBetaEvidenceCategories)[number];
export type VueBetaReadinessKind =
  | "runtime-primitive"
  | "theme-facade"
  | "portable-styled"
  | "astro-only-styled";

export type VueBetaEvidenceAssignment =
  | { applicability: "required"; sources: readonly string[] }
  | { applicability: "excluded"; reason: string; sources: readonly string[] }
  | { applicability: "not-applicable"; reason: string };

export type VueBetaOfflineValidation = {
  diagnostic?: string;
  result: "valid" | "invalid";
};

export type VueBetaReadinessEntry = {
  evidence: Record<VueBetaEvidenceCategory, VueBetaEvidenceAssignment>;
  kind: VueBetaReadinessKind;
  name: string;
};

export type VueBetaReadinessAudit = {
  entries: readonly VueBetaReadinessEntry[];
  coverageResult: "complete" | "blocking-failure";
  blockers: readonly string[];
};

export type VueBetaReadinessSources = {
  centralManualFacades: readonly string[];
  centralRuntimePrimitives: readonly string[];
  explicitStyledExclusions: readonly string[];
  matrixEntries: readonly VueBetaReadinessEntry[];
  packageExportComponents: readonly string[];
  portableStyledRoots: readonly string[];
  offlineValidation: {
    performance: VueBetaOfflineValidation;
    size: VueBetaOfflineValidation;
  };
  vueManualFacades: readonly string[];
  vueRuntimePrimitives: readonly string[];
  vueStyledRoots: readonly string[];
};

const sharedEvidence = {
  "compiler-type": [
    "scripts/portable-runtime/tests/generate-vue-wrappers/package-foundation.test.ts",
    "packages/vue/tsconfig.json",
  ],
  "hydration-risk": [
    "packages/vue/tests/integration/run-hydration-playwright.mjs",
    "packages/vue/tests/integration/run-styled-hydration-playwright.mjs",
  ],
  cleanup: [
    "packages/vue/tests/run-browser-tests.mjs",
    "scripts/portable-runtime/tests/smoke/vue/verify-demo.mjs",
  ],
  demo: ["apps/vue-demo/src/App.vue", "scripts/portable-runtime/tests/smoke/vue/verify-demo.mjs"],
  cli: [
    "scripts/portable-runtime/renderers/framework-adapters/vue/cli-registry.ts",
    "packages/cli/tests/commands/primitives.integration.test.ts",
  ],
  "clean-consumer": [
    "scripts/vue-cli-host-acceptance.mjs",
    "packages/vue/tests/release/release-package.test.ts",
  ],
  export: [
    "packages/vue/tests/integration/all-exports.ssr.test.ts",
    "packages/vue/tests/release/release-package.test.ts",
  ],
  generation: [
    "scripts/portable-runtime/tests/generate-vue-wrappers/generation.test.ts",
    "scripts/portable-runtime/tests/generate-vue-wrappers/portable-styled-closure.test.ts",
  ],
  inventory: [
    "scripts/portable-runtime/renderers/primitive-inventory.ts",
    "scripts/portable-runtime/renderers/framework-adapters/vue/inventory.ts",
  ],
  performance: [
    "scripts/portable-runtime/measure-vue-runtime-performance.mjs",
    ".scratch/vue-runtime-performance-comparison/evidence/vue-runtime-performance-baseline.json",
  ],
  size: [
    "scripts/portable-runtime/measure-package-sizes.mjs",
    "docs/portable-runtime/diagnostics/package-size-diagnostics.md",
  ],
} as const satisfies Partial<Record<VueBetaEvidenceCategory, readonly string[]>>;

function required(sources: readonly string[]): VueBetaEvidenceAssignment {
  return { applicability: "required", sources };
}

function requiredSharedEvidence(): Partial<
  Record<VueBetaEvidenceCategory, VueBetaEvidenceAssignment>
> {
  return Object.fromEntries(
    Object.entries(sharedEvidence).map(([category, sources]) => [category, required(sources)]),
  );
}

function createPrimitiveEntry(name: string): VueBetaReadinessEntry {
  const componentTestRoot = `packages/vue/tests/${name}`;
  return {
    kind: "runtime-primitive",
    name,
    evidence: {
      ...requiredSharedEvidence(),
      browser: required([`${componentTestRoot}/${name}.browser.test.ts`]),
      "public-behavior": required([`${componentTestRoot}/${name}.browser.test.ts`]),
      ssr: required([`${componentTestRoot}/${name}.ssr.test.ts`]),
    },
  } as VueBetaReadinessEntry;
}

function createThemeEntry(): VueBetaReadinessEntry {
  return {
    kind: "theme-facade",
    name: "theme",
    evidence: {
      ...requiredSharedEvidence(),
      cli: required([
        "scripts/portable-runtime/renderers/framework-adapters/vue/cli-registry.ts",
        "packages/cli/tests/commands/primitives.integration.test.ts",
      ]),
      "clean-consumer": required([
        "scripts/vue-cli-host-acceptance.mjs",
        "packages/vue/tests/release/release-package.test.ts",
      ]),
      browser: required(["packages/vue/tests/theme/theme-facade.test.ts"]),
      "public-behavior": required(["packages/vue/tests/theme/theme-facade.test.ts"]),
      ssr: required(["packages/vue/tests/theme/theme-toggle.ssr.test.ts"]),
    },
  } as VueBetaReadinessEntry;
}

function createStyledEntry(name: string): VueBetaReadinessEntry {
  return {
    kind: "portable-styled",
    name,
    evidence: {
      ...requiredSharedEvidence(),
      browser: required(["scripts/portable-runtime/tests/smoke/vue/verify-demo.mjs"]),
      "public-behavior": required([
        "packages/vue/tests/integration/all-exports.ssr.test.ts",
        "scripts/portable-runtime/tests/smoke/vue/verify-demo.mjs",
      ]),
      ssr: required(["packages/vue/tests/integration/all-exports.ssr.test.ts"]),
    },
  } as VueBetaReadinessEntry;
}

function createAstroOnlyEntry(name: string): VueBetaReadinessEntry {
  const exclusionEvidence = [
    "scripts/portable-runtime/contracts/styled/components/image.ts",
    "scripts/portable-runtime/tests/generate-vue-wrappers/portable-styled-closure.test.ts",
  ];
  return {
    kind: "astro-only-styled",
    name,
    evidence: Object.fromEntries(
      vueBetaEvidenceCategories.map((category) => [
        category,
        category === "inventory" || category === "generation"
          ? {
              applicability: "excluded",
              reason: "Image is an explicit Astro-only Styled contract.",
              sources: exclusionEvidence,
            }
          : {
              applicability: "not-applicable",
              reason: "Image is outside the Vue public-beta package surface.",
            },
      ]),
    ) as Record<VueBetaEvidenceCategory, VueBetaEvidenceAssignment>,
  };
}

function collectOfflineValidation(): VueBetaReadinessSources["offlineValidation"] {
  return {
    performance: runOfflineValidator(() => checkAcceptedVuePerformanceEvidence()),
    size: runOfflineValidator(() => {
      const { evidence } = checkVueBaselineEvidence({
        evidenceDirectory: path.resolve("scripts/portable-runtime/evidence"),
      });
      validateVuePackageSizeBaselineEvidence(evidence);
    }),
  };
}

function runOfflineValidator(validate: () => unknown): VueBetaOfflineValidation {
  try {
    validate();
    return { result: "valid" };
  } catch (error) {
    return {
      diagnostic: error instanceof Error ? error.message : String(error),
      result: "invalid",
    };
  }
}

export function createVueBetaReadinessSources(): VueBetaReadinessSources {
  const centralRuntimePrimitives = getRuntimeAdapterPrimitiveInventoryEntries().map(
    ({ component }) => component,
  );
  const centralManualFacades = getManualHelperPrimitiveInventoryEntries().map(
    ({ component }) => component,
  );
  const portableStyledRoots = starwindStyledContracts
    .filter(({ frameworks }) => supportsVueScope(frameworks))
    .map(({ component }) => component);
  const explicitStyledExclusions = starwindStyledContracts
    .filter(({ frameworks }) => !supportsVueScope(frameworks))
    .map(({ component }) => component);

  return {
    centralManualFacades,
    centralRuntimePrimitives,
    explicitStyledExclusions,
    matrixEntries: [
      ...centralRuntimePrimitives.map(createPrimitiveEntry),
      ...centralManualFacades.map(createThemeEntry),
      ...portableStyledRoots.map(createStyledEntry),
      ...explicitStyledExclusions.map(createAstroOnlyEntry),
    ],
    offlineValidation: collectOfflineValidation(),
    packageExportComponents: vuePackageSubpaths
      .map(({ subpath }) => (subpath === "." ? undefined : subpath.slice(2)))
      .filter((component): component is string => component !== undefined),
    portableStyledRoots,
    vueManualFacades: vueAdapterInventory.manualFacades.map(({ component }) => component),
    vueRuntimePrimitives: vueAdapterInventory.runtimePrimitives.map(({ component }) => component),
    vueStyledRoots: vueStyledComponents,
  };
}

export function validateVueBetaReadiness(
  sources: VueBetaReadinessSources = createVueBetaReadinessSources(),
): VueBetaReadinessAudit {
  const blockers: string[] = [];
  const expected = {
    "astro-only-styled": sources.explicitStyledExclusions,
    "portable-styled": sources.portableStyledRoots,
    "runtime-primitive": sources.centralRuntimePrimitives,
    "theme-facade": sources.centralManualFacades,
  } as const;

  requireExactCount(
    blockers,
    "Runtime-backed Primitive families",
    sources.centralRuntimePrimitives,
    36,
  );
  requireExactCount(blockers, "manual Theme facades", sources.centralManualFacades, 1);
  requireExactCount(blockers, "portable Styled roots", sources.portableStyledRoots, 54);
  requireExactCount(blockers, "Astro-only Styled exclusions", sources.explicitStyledExclusions, 1);
  requireExactSet(
    blockers,
    "Vue Runtime Primitive ownership",
    sources.centralRuntimePrimitives,
    sources.vueRuntimePrimitives,
  );
  requireExactSet(
    blockers,
    "Vue manual facade ownership",
    sources.centralManualFacades,
    sources.vueManualFacades,
  );
  requireExactSet(
    blockers,
    "Vue portable Styled ownership",
    sources.portableStyledRoots,
    sources.vueStyledRoots,
  );
  requireExactSet(
    blockers,
    "Vue package exports",
    [...sources.centralRuntimePrimitives, ...sources.centralManualFacades],
    sources.packageExportComponents,
  );

  for (const [gate, validation] of Object.entries(sources.offlineValidation)) {
    if (validation.result === "invalid") {
      blockers.push(
        `offline ${gate} evidence invalid: ${validation.diagnostic ?? "no diagnostic supplied"}`,
      );
    }
  }

  if (sources.centralManualFacades[0] !== "theme") {
    blockers.push(
      `manual facade classification: expected theme; received ${formatNames(sources.centralManualFacades)}`,
    );
  }
  if (sources.explicitStyledExclusions[0] !== "image") {
    blockers.push(
      `Astro-only Styled classification: expected image; received ${formatNames(sources.explicitStyledExclusions)}`,
    );
  }

  for (const kind of Object.keys(expected) as VueBetaReadinessKind[]) {
    const entries = sources.matrixEntries.filter((entry) => entry.kind === kind);
    requireExactSet(
      blockers,
      `${kind} matrix ownership`,
      expected[kind],
      entries.map(({ name }) => name),
    );
  }

  for (const entry of sources.matrixEntries) {
    const missingCategories: VueBetaEvidenceCategory[] = [];
    const invalidApplicability: VueBetaEvidenceCategory[] = [];
    for (const category of vueBetaEvidenceCategories) {
      const assignment = entry.evidence[category];
      if (assignment === undefined) {
        missingCategories.push(category);
        continue;
      }
      if (entry.kind === "astro-only-styled") {
        const expected =
          category === "inventory" || category === "generation" ? "excluded" : "not-applicable";
        if (assignment.applicability !== expected) invalidApplicability.push(category);
        if (assignment.applicability === "excluded" && assignment.sources.length === 0) {
          missingCategories.push(category);
        }
        continue;
      }
      if (assignment.applicability !== "required") {
        invalidApplicability.push(category);
      } else if (assignment.sources.length === 0) {
        missingCategories.push(category);
      }
    }
    if (missingCategories.length > 0) {
      blockers.push(
        `${entry.kind} ${entry.name} missing evidence: ${missingCategories.join(", ")}`,
      );
    }
    if (invalidApplicability.length > 0) {
      blockers.push(
        `${entry.kind} ${entry.name} invalid evidence applicability: ${invalidApplicability.join(", ")}`,
      );
    }
  }

  return {
    blockers: [...new Set(blockers)].sort(),
    entries: [...sources.matrixEntries].sort(compareEntries),
    coverageResult: blockers.length === 0 ? "complete" : "blocking-failure",
  };
}

export function assertVueBetaReadinessCoverage(
  sources: VueBetaReadinessSources = createVueBetaReadinessSources(),
): VueBetaReadinessAudit {
  const audit = validateVueBetaReadiness(sources);
  if (audit.coverageResult === "blocking-failure") {
    throw new Error(formatVueBetaReadinessBlockers(audit.blockers));
  }
  return audit;
}

export function formatVueBetaReadinessBlockers(blockers: readonly string[]): string {
  return ["Vue beta readiness audit blocked:", ...blockers.map((blocker) => `- ${blocker}`)].join(
    "\n",
  );
}

export function renderVueBetaReadinessAudit(audit = assertVueBetaReadinessCoverage()): string {
  const counts = countKinds(audit.entries);
  const lines = [
    "<!-- Generated by scripts/portable-runtime/renderers/framework-adapters/vue/beta-readiness-audit.ts. -->",
    "# Vue Beta Readiness Coverage Audit",
    "",
    `Structural coverage: **${audit.coverageResult.toUpperCase()}**`,
    "",
    "This generated matrix checks inventory closure, evidence assignments, and durable offline size and performance evidence. It does not execute or certify the live release gates. It changes no Runtime or component behavior.",
    "",
    "## Inventory closure",
    "",
    `- Runtime-backed Primitive families: ${counts["runtime-primitive"]}`,
    `- Theme facades: ${counts["theme-facade"]}`,
    `- Portable Styled roots: ${counts["portable-styled"]}`,
    `- Explicit Astro-only Styled exclusions: ${counts["astro-only-styled"]}`,
    "",
    "## Evidence categories",
    "",
    "Each public-beta candidate row has required assignments for inventory, generation, export, compiler and type, SSR, hydration-risk, public behavior, browser, cleanup, demo, CLI, clean-consumer, size, and performance evidence. Source paths identify the checks that own each claim. Path presence does not mean that a live check passed.",
    "",
    "Runtime Primitive profile: the shared inventory, generation, built export, compiler and type, hydration, demo, size, and performance sources plus `packages/vue/tests/<entry>/<entry>.ssr.test.ts` and `packages/vue/tests/<entry>/<entry>.browser.test.ts`.",
    "",
    "Theme profile: the shared sources plus `packages/vue/tests/theme/theme-facade.test.ts`, `packages/vue/tests/theme/theme-toggle.ssr.test.ts`, CLI registry coverage, and `scripts/vue-cli-host-acceptance.mjs` clean-consumer coverage.",
    "",
    "Portable Styled profile: the shared sources plus every-export SSR, styled hydration, and production demo smoke evidence. These checks cover generated exports, `data-slot` identity, browser behavior, and cleanup.",
    "",
    "Astro-only Styled profile: inventory and generation record an explicit exclusion. All Vue package, runtime, browser, size, and performance categories are marked not applicable.",
    "",
    "| Classification | Entry | Evidence profile |",
    "| --- | --- | --- |",
  ];

  for (const entry of audit.entries) {
    lines.push(`| ${entry.kind} | ${entry.name} | ${entry.kind} |`);
  }

  lines.push(
    "",
    "## Required live gates",
    "",
    "Release readiness requires every command below to pass on the same revision. The generated structural result does not replace these command results.",
    "",
    "- `pnpm runtime:generate:vue:test`",
    "- `pnpm runtime:size:check:prepared:private`",
    "- `pnpm runtime:perf:vue:evidence:check`",
    "- `pnpm vue:verify` (orchestrator checkpoint)",
    "",
    "The audit calls the existing read-only validators for committed Vue package-size baseline evidence and saved accepted Runtime performance evidence. Current timing requires a new controlled capture. Invalid offline evidence blocks structural coverage. The absolute size measurement remains a live command. Comparator-relative timing remains advisory.",
    "",
  );
  return lines.join("\n");
}

function requireExactCount(
  blockers: string[],
  label: string,
  values: readonly string[],
  expectedCount: number,
): void {
  const duplicates = duplicateNames(values);
  if (values.length !== expectedCount) {
    blockers.push(`${label}: expected ${expectedCount}; received ${values.length}`);
  }
  if (duplicates.length > 0) blockers.push(`${label} duplicate: ${formatNames(duplicates)}`);
}

function requireExactSet(
  blockers: string[],
  label: string,
  expected: readonly string[],
  actual: readonly string[],
): void {
  const expectedSet = new Set(expected);
  const actualSet = new Set(actual);
  const duplicates = duplicateNames(actual);
  const missing = [...expectedSet].filter((name) => !actualSet.has(name)).sort();
  const unowned = [...actualSet].filter((name) => !expectedSet.has(name)).sort();
  if (duplicates.length > 0) blockers.push(`${label} duplicate: ${formatNames(duplicates)}`);
  if (missing.length > 0) blockers.push(`${label} missing: ${formatNames(missing)}`);
  if (unowned.length > 0) blockers.push(`${label} unowned: ${formatNames(unowned)}`);
}

function duplicateNames(values: readonly string[]): string[] {
  const seen = new Set<string>();
  const duplicates = new Set<string>();
  for (const value of values) {
    if (seen.has(value)) duplicates.add(value);
    seen.add(value);
  }
  return [...duplicates].sort();
}

function formatNames(values: readonly string[]): string {
  return values.length > 0 ? [...values].sort().join(", ") : "none";
}

function compareEntries(left: VueBetaReadinessEntry, right: VueBetaReadinessEntry): number {
  return left.kind.localeCompare(right.kind) || left.name.localeCompare(right.name);
}

function countKinds(
  entries: readonly VueBetaReadinessEntry[],
): Record<VueBetaReadinessKind, number> {
  return {
    "astro-only-styled": entries.filter(({ kind }) => kind === "astro-only-styled").length,
    "portable-styled": entries.filter(({ kind }) => kind === "portable-styled").length,
    "runtime-primitive": entries.filter(({ kind }) => kind === "runtime-primitive").length,
    "theme-facade": entries.filter(({ kind }) => kind === "theme-facade").length,
  };
}
