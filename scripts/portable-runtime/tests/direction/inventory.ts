import assert from "node:assert/strict";
import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import type { Page } from "playwright";
import ts from "typescript";
import { starwindStyledContracts } from "../../contracts/styled/starwind.js";
import type { FrameworkTarget, StyledAdapterContract } from "../../contracts/styled/types.js";
import {
  getManualHelperPrimitiveInventoryEntries,
  getRuntimeAdapterPrimitiveInventoryEntries,
} from "../../renderers/primitive-inventory.js";
import type { DirectionAssertionContext } from "./assertion-receipts.js";

export const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../../..");
export const TARGETS = ["astro", "react", "vue", "svelte"] as const;
export type Target = (typeof TARGETS)[number];
export type InventoryMode = "inventory" | "stage" | "final";
export type DirectionFixture = {
  /** Render the framework component on the server and hydrate the same tree. */
  ssr?: boolean;
  /** Compile and visit this byte-identical source case while retaining independent receipts. */
  buildAs?: string;
  source: string;
  exports: string[];
  assertions: string[];
};
export type DirectionCase = {
  id: string;
  row: string;
  acceptance: string[];
  fixtures: Partial<Record<Target, DirectionFixture>>;
  physicalExceptions?: string[];
  rawEntrypoints?: ("factory" | "initStarwind")[];
};
export type DirectionExpectation = {
  id: string;
  layer: "raw-html" | "generated" | "styled" | "legacy" | "theme" | "harness";
  run: (page: Page, target: Target, ctx: DirectionAssertionContext) => Promise<void>;
};
export type MatrixRow = { id: string; exports: string[]; targets: Target[]; legacy: boolean };
export type DirectionCohort = { cohort: string; caseIds: string[] };
export const DIRECTION_HOME = path.join(ROOT, "scripts/portable-runtime/tests/direction");

const targetRoots: Record<Target, string> = {
  astro: "apps/demo/src/components/starwind-runtime",
  react: "apps/react-demo/src/components/starwind-runtime",
  vue: "apps/vue-demo/src/components/starwind-runtime",
  svelte: "apps/svelte-demo/src/lib/starwind-runtime",
};

export async function readMatrixRows(): Promise<MatrixRow[]> {
  return JSON.parse(
    await readFile(path.join(DIRECTION_HOME, "inventory/component-matrix.json"), "utf8"),
  );
}

function unique(values: string[], label: string): void {
  assert.equal(new Set(values).size, values.length, `Duplicate ${label}`);
}

export function validateRows(rows: MatrixRow[], contracts = starwindStyledContracts): void {
  unique(
    rows.map((row) => row.id),
    "matrix row",
  );
  unique(
    contracts.map((contract) => contract.component),
    "Styled contract",
  );
  assert.equal(rows.length, 56, "Styled matrix must contain 56 groups");
  assert.equal(
    rows.reduce((count, row) => count + row.exports.length, 0),
    295,
    "Styled matrix must contain 295 named exports",
  );
  assert.deepEqual(
    rows.map((row) => row.id).sort(),
    contracts.map((contract) => contract.component).sort(),
    "Matrix and contract IDs differ",
  );
  for (const row of rows) {
    const contract = contracts.find((item) => item.component === row.id)!;
    unique(row.exports, `${row.id} export`);
    assert.deepEqual(
      row.exports,
      contract.publicExports,
      `${row.id} exports differ from the contract`,
    );
    assert.deepEqual(
      row.targets,
      contractTargets(contract),
      `${row.id} target exception differs from the contract`,
    );
    assert(row.exports.length > 0, `${row.id} has no exports`);
  }
  for (const target of TARGETS) {
    const expected = target === "astro" ? 56 : 55;
    assert.equal(
      rows.filter((row) => row.targets.includes(target)).length,
      expected,
      `${target} group count`,
    );
  }
  assert.deepEqual(
    rows.filter((row) => !row.targets.includes("react")).map((row) => row.id),
    ["image"],
    "Only Image can omit a non-Astro target",
  );
  assert.equal(rows.filter((row) => row.legacy).length, 49, "Legacy group count");
}

function contractTargets(contract: StyledAdapterContract): Target[] {
  return TARGETS.filter((target) =>
    (contract.frameworks ?? TARGETS).includes(target as FrameworkTarget),
  );
}

async function modulePaths(home: string): Promise<string[]> {
  const entries = await readdir(home, { withFileTypes: true }).catch(
    (error: NodeJS.ErrnoException) => {
      if (error.code === "ENOENT") return [];
      throw error;
    },
  );
  const nested = await Promise.all(
    entries.map(async (entry) => {
      const file = path.join(home, entry.name);
      if (entry.isDirectory()) return modulePaths(file);
      return entry.isFile() && entry.name.endsWith(".ts") && !entry.name.endsWith(".d.ts")
        ? [file]
        : [];
    }),
  );
  return nested.flat().sort();
}

export async function loadCases(directionHome = DIRECTION_HOME): Promise<DirectionCase[]> {
  const files = await modulePaths(path.join(directionHome, "cases"));
  const cases: DirectionCase[] = [];
  for (const file of files) {
    const module = (await import(file)) as {
      cases?: DirectionCase[];
      expectations?: DirectionExpectation[];
    };
    assert(module.cases || module.expectations, `${file} must export cases or expectations`);
    if (module.cases) {
      assert(Array.isArray(module.cases), `${file} cases must be an array`);
      cases.push(...module.cases);
    }
  }
  unique(
    cases.map((item) => item.id),
    "direction case ID",
  );
  return cases;
}

export async function loadExpectations(
  directionHome = DIRECTION_HOME,
): Promise<DirectionExpectation[]> {
  const files = [
    ...(await modulePaths(path.join(directionHome, "cases"))),
    ...(await modulePaths(path.join(directionHome, "expectations"))),
  ];
  const expectations: DirectionExpectation[] = [];
  for (const file of files) {
    const module = (await import(file)) as {
      cases?: DirectionCase[];
      expectations?: DirectionExpectation[];
    };
    assert(module.cases || module.expectations, `${file} must export cases or expectations`);
    if (module.expectations) {
      assert(Array.isArray(module.expectations), `${file} expectations must be an array`);
      expectations.push(...module.expectations);
    }
  }
  unique(
    expectations.map((item) => item.id),
    "expectation case ID",
  );
  return expectations;
}

export async function loadCohorts(
  directionHome: string,
  cases: DirectionCase[],
): Promise<DirectionCohort[]> {
  const folder = path.join(directionHome, "staging");
  const entries = await readdir(folder).catch((error: NodeJS.ErrnoException) => {
    if (error.code === "ENOENT") return [];
    throw error;
  });
  const cohorts: DirectionCohort[] = [];
  for (const name of entries.filter((entry) => entry.endsWith(".json")).sort()) {
    const cohort = name.slice(0, -5);
    const data = JSON.parse(await readFile(path.join(folder, name), "utf8")) as DirectionCohort;
    assert.equal(data.cohort, cohort, `${name} cohort slug differs from its filename`);
    assert(Array.isArray(data.caseIds) && data.caseIds.length > 0, `${name} needs caseIds`);
    unique(data.caseIds, `${cohort} case ID`);
    const moduleFiles = await modulePaths(path.join(directionHome, "cases", cohort));
    assert(moduleFiles.length > 0, `${cohort} has no nested case modules`);
    const nested = await loadCasesFromFiles(moduleFiles);
    assert.deepEqual(
      data.caseIds.slice().sort(),
      nested.map((item) => item.id).sort(),
      `${cohort} staging IDs differ from nested fixtures`,
    );
    for (const id of data.caseIds)
      assert(
        cases.some((item) => item.id === id),
        `${cohort}/${id} is undiscovered`,
      );
    cohorts.push(data);
  }
  const cohortDirs = (await readdir(path.join(directionHome, "cases"), { withFileTypes: true }))
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name);
  for (const cohort of cohortDirs)
    assert(
      cohorts.some((item) => item.cohort === cohort),
      `${cohort} lacks staging/${cohort}.json`,
    );
  unique(
    cohorts.flatMap((item) => item.caseIds),
    "cohort case ID",
  );
  for (const cohort of cohorts)
    assert(
      !cases.some((item) => item.id === cohort.cohort),
      `${cohort.cohort} conflicts with an exact case ID`,
    );
  return cohorts;
}

async function loadCasesFromFiles(files: string[]): Promise<DirectionCase[]> {
  const cases: DirectionCase[] = [];
  for (const file of files) {
    const module = (await import(file)) as { cases?: DirectionCase[] };
    if (module.cases) cases.push(...module.cases);
  }
  return cases;
}

export function selectCases(
  id: string | undefined,
  cases: DirectionCase[],
  cohorts: DirectionCohort[],
): DirectionCase[] {
  if (!id) return cases;
  const cohort = cohorts.find((item) => item.cohort === id);
  return cohort
    ? cohort.caseIds.map((caseId) => cases.find((item) => item.id === caseId)!)
    : cases.filter((item) => item.id === id);
}

export function validateCases(
  rows: MatrixRow[],
  cases: DirectionCase[],
  mode: InventoryMode,
): void {
  const byRow = new Map(rows.map((row) => [row.id, row]));
  const runtimeIds = getRuntimeAdapterPrimitiveInventoryEntries().map(
    (item) => `runtime:${item.component}`,
  );
  const legacyIds = rows.filter((row) => row.legacy).map((row) => `legacy:${row.id}`);
  for (const item of cases) {
    if (item.id === "harness-smoke") {
      assert.equal(item.row, "harness-smoke", "Smoke case stays outside component inventory");
      assert.deepEqual(
        Object.keys(item.fixtures).sort(),
        [...TARGETS].sort(),
        "Smoke case must compile all four targets",
      );
    } else {
      assert(
        byRow.has(item.row) ||
          runtimeIds.includes(item.row) ||
          legacyIds.includes(item.row) ||
          item.row === "theme",
        `Unknown matrix row ${item.row}`,
      );
    }
    assert(item.acceptance.length > 0, `${item.id} has no acceptance owner`);
    assert(Object.keys(item.fixtures).length > 0, `${item.id} has no fixture`);
    for (const [target, fixture] of Object.entries(item.fixtures)) {
      assert(TARGETS.includes(target as Target), `${item.id} uses unknown target ${target}`);
      assert(fixture?.source.trim(), `${item.id}/${target} has an empty fixture`);
      assert(fixture.assertions.length > 0, `${item.id}/${target} has no assertions`);
      unique(fixture.assertions, `${item.id}/${target} assertion`);
      if (byRow.has(item.row)) {
        assert(
          byRow.get(item.row)!.targets.includes(target as Target),
          `${item.id}/${target} is unavailable by contract`,
        );
        for (const name of fixture.exports)
          assert(
            byRow.get(item.row)!.exports.includes(name),
            `${item.id}/${target} claims unknown export ${name}`,
          );
      }
    }
  }
  if (mode === "final") {
    for (const row of rows)
      for (const target of row.targets) {
        const covered = new Set(
          cases
            .filter((item) => item.row === row.id)
            .flatMap((item) => item.fixtures[target]?.exports ?? []),
        );
        for (const name of row.exports)
          assert(covered.has(name), `${row.id}/${target}/${name} lacks a fixture`);
      }
    for (const id of [...runtimeIds, ...legacyIds, "theme"])
      assert(
        cases.some((item) => item.row === id),
        `${id} lacks a coverage case`,
      );
    for (const entrypoint of ["factory", "initStarwind"] as const)
      assert(
        cases.some((item) => item.rawEntrypoints?.includes(entrypoint)),
        `${entrypoint} lacks Raw HTML coverage`,
      );
  }
}

export function validateGeneratedIndex(source: string, row: MatrixRow, target: Target): void {
  const file = ts.createSourceFile(
    `${target}/${row.id}/index.ts`,
    source,
    ts.ScriptTarget.Latest,
    true,
  );
  const exported = new Set<string>();
  for (const statement of file.statements) {
    if (
      ts.isExportDeclaration(statement) &&
      statement.exportClause &&
      ts.isNamedExports(statement.exportClause)
    ) {
      for (const element of statement.exportClause.elements)
        if (!element.isTypeOnly && !statement.isTypeOnly) exported.add(element.name.text);
    }
    if (
      ts.canHaveModifiers(statement) &&
      ts.getModifiers(statement)?.some((modifier) => modifier.kind === ts.SyntaxKind.ExportKeyword)
    ) {
      if (ts.isVariableStatement(statement))
        for (const declaration of statement.declarationList.declarations)
          if (ts.isIdentifier(declaration.name)) exported.add(declaration.name.text);
      if (
        (ts.isClassDeclaration(statement) || ts.isFunctionDeclaration(statement)) &&
        statement.name
      )
        exported.add(statement.name.text);
    }
  }
  for (const name of row.exports)
    assert(
      exported.has(name),
      `${target}/${row.id}/${name} is missing from generated index exports`,
    );
}

export async function validateInventory(
  mode: InventoryMode = "inventory",
  directionHome = DIRECTION_HOME,
) {
  const rows = await readMatrixRows();
  validateRows(rows);
  const runtime = getRuntimeAdapterPrimitiveInventoryEntries();
  const helpers = getManualHelperPrimitiveInventoryEntries();
  assert.equal(runtime.length, 37, "Runtime family count");
  assert(
    helpers.some((item) => item.component === "theme"),
    "Theme helper is missing",
  );
  const legacy = await readdir(path.join(ROOT, "apps/demo/src/components/starwind"), {
    withFileTypes: true,
  });
  const legacyIds = legacy
    .filter((entry) => entry.isDirectory() && rows.some((row) => row.id === entry.name))
    .map((entry) => entry.name);
  assert.deepEqual(
    rows
      .filter((row) => row.legacy)
      .map((row) => row.id)
      .sort(),
    legacyIds.sort(),
    "Legacy scope differs from matrix",
  );
  for (const target of TARGETS)
    for (const row of rows.filter((item) => item.targets.includes(target))) {
      const index = await readFile(
        path.join(ROOT, targetRoots[target], row.id, "index.ts"),
        "utf8",
      );
      validateGeneratedIndex(index, row, target);
    }
  const cases = await loadCases(directionHome);
  validateCases(rows, cases, mode);
  const expectations = await loadExpectations(directionHome);
  const cohorts = await loadCohorts(directionHome, cases);
  unique(
    expectations.map((item) => item.id),
    "expectation case ID",
  );
  for (const item of cases)
    assert(
      expectations.some((expectation) => expectation.id === item.id),
      `${item.id} lacks an expectation shard`,
    );
  for (const expectation of expectations)
    assert(
      cases.some((item) => item.id === expectation.id),
      `${expectation.id} lacks a fixture shard`,
    );
  return {
    rows,
    cases,
    expectations,
    cohorts,
    runtime: runtime.map((item) => item.component),
    helpers: helpers.map((item) => item.component),
  };
}

export async function selfTest(): Promise<void> {
  const rows = await readMatrixRows();
  validateRows(rows);
  assert.throws(
    () => validateRows(rows.map((row) => (row.id === "button" ? { ...row, exports: [] } : row))),
    /294|exports/,
  );
  assert.throws(() => validateRows([...rows, rows[0]!]), /Duplicate matrix row/);
  assert.throws(
    () =>
      validateRows(
        rows.map((row) => (row.id === "image" ? { ...row, targets: [...TARGETS] } : row)),
      ),
    /target exception/,
  );
  const button = rows.find((row) => row.id === "button")!;
  const index = await readFile(path.join(ROOT, targetRoots.astro, "button/index.ts"), "utf8");
  validateGeneratedIndex(index, button, "astro");
  const withoutPublicExport = index.replace(
    /export\s*\{\s*Button\s*,\s*ButtonVariants\s*\};/,
    "export { ButtonVariants };",
  );
  assert.notEqual(withoutPublicExport, index, "Button index mutation was not applied");
  assert(
    withoutPublicExport.includes('import Button from "./Button.astro"'),
    "Button import must remain in negative probe",
  );
  assert.throws(
    () => validateGeneratedIndex(withoutPublicExport, button, "astro"),
    /button\/Button is missing from generated index exports/,
  );
  const cohortHome = path.join(DIRECTION_HOME, "test-fixtures/cohort");
  const cohortCases = await loadCases(cohortHome);
  const cohortExpectations = await loadExpectations(cohortHome);
  const cohorts = await loadCohorts(cohortHome, cohortCases);
  validateCases(rows, cohortCases, "stage");
  assert.deepEqual(
    selectCases("fixture-cohort", cohortCases, cohorts)
      .map((item) => item.row)
      .sort(),
    ["badge", "button"],
  );
  assert.deepEqual(cohortExpectations.map((item) => item.id).sort(), [
    "cohort-badge",
    "cohort-button",
  ]);
}
