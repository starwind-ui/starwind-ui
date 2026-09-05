import { randomUUID } from "node:crypto";
import { existsSync, mkdirSync, renameSync, rmSync, writeFileSync } from "node:fs";
import path from "node:path";

import { eligibleP95, median } from "./statistics.mjs";

export const runtimePerformanceMeasurementTypes = Object.freeze([
  "open",
  "hover",
  "filter",
  "mount",
  "submenu-open",
  "submenu-hover",
  "navigation-switch",
  "tabs-activation",
  "accordion-toggle",
  "radio-sweep",
]);

const measurementTypeSet = new Set(runtimePerformanceMeasurementTypes);

export const scenarioRows = defineRuntimePerformanceScenarios([
  {
    key: "dialog-open",
    category: "baseline-open",
    label: "Dialog open",
    cpuThrottle: 20,
    sampleCount: 5,
    type: "open",
    details: "10k outside nodes, Enter-to-visible",
  },
  {
    key: "select-open",
    category: "baseline-open",
    label: "Select open",
    cpuThrottle: 6,
    sampleCount: 5,
    type: "open",
    details: "1000 items, Enter-to-visible",
  },
  {
    key: "select-item-highlight",
    category: "baseline-hover",
    label: "Select item highlight",
    cpuThrottle: 1,
    sampleCount: 5,
    type: "hover",
    details: "Open select, scripted pointermove sweep across 1000 items",
  },
  {
    key: "menu-open",
    category: "baseline-open",
    label: "Menu open",
    cpuThrottle: 6,
    sampleCount: 5,
    type: "open",
    details: "1000 items, Enter-to-visible",
  },
  {
    key: "tooltip-trigger-mount",
    category: "baseline-mount",
    label: "Tooltip trigger mount",
    cpuThrottle: 1,
    groupCount: 5,
    iterationsPerGroup: 20,
    type: "mount",
    details: "1000 tooltip triggers, render + layout",
  },
  {
    key: "dialog-trigger-mount",
    category: "closed-overlay-candidate",
    label: "Dialog trigger mount",
    cpuThrottle: 1,
    groupCount: 5,
    iterationsPerGroup: 20,
    type: "mount",
    details: "1000 closed dialog triggers with content, render + layout",
  },
  {
    key: "popover-trigger-mount",
    category: "closed-overlay-candidate",
    label: "Popover trigger mount",
    cpuThrottle: 1,
    groupCount: 5,
    iterationsPerGroup: 20,
    type: "mount",
    details: "1000 closed popover triggers with content, render + layout",
  },
  {
    key: "preview-card-trigger-mount",
    category: "closed-overlay-candidate",
    label: "Preview card trigger mount",
    cpuThrottle: 1,
    groupCount: 5,
    iterationsPerGroup: 20,
    type: "mount",
    details: "1000 closed preview card triggers with content, render + layout",
  },
  {
    key: "select-trigger-mount",
    category: "baseline-mount",
    label: "Select trigger mount",
    cpuThrottle: 1,
    groupCount: 5,
    iterationsPerGroup: 20,
    type: "mount",
    details: "1000 select triggers, 10 items each, render + layout",
  },
  {
    key: "menu-item-highlight",
    category: "baseline-hover",
    label: "Menu item highlight",
    cpuThrottle: 1,
    sampleCount: 5,
    type: "hover",
    details: "Open menu, scripted pointermove sweep across 1000 items",
  },
  {
    key: "combobox-open",
    category: "combobox-candidate",
    label: "Combobox open",
    cpuThrottle: 6,
    sampleCount: 5,
    type: "open",
    openTarget: "[data-benchmark-input]",
    openKey: "ArrowDown",
    details: "1000 items, ArrowDown-to-visible",
  },
  {
    key: "combobox-trigger-mount",
    category: "combobox-candidate",
    label: "Combobox trigger mount",
    cpuThrottle: 1,
    groupCount: 5,
    iterationsPerGroup: 20,
    type: "mount",
    details: "1000 combobox triggers, 10 items each, render + layout",
  },
  {
    key: "combobox-item-highlight",
    category: "combobox-candidate",
    label: "Combobox item highlight",
    cpuThrottle: 1,
    sampleCount: 5,
    type: "hover",
    details: "Open combobox, scripted pointermove sweep across 1000 items",
  },
  {
    key: "combobox-filter-input",
    category: "combobox-candidate",
    label: "Combobox filter input",
    cpuThrottle: 1,
    sampleCount: 5,
    type: "filter",
    details: "Open combobox, type filter query, input-to-layout",
  },
  {
    key: "menu-submenu-open",
    category: "nested-menu-candidate",
    label: "Menu submenu open",
    cpuThrottle: 6,
    sampleCount: 5,
    type: "submenu-open",
    details: "Parent menu plus 1000-item submenu, activation-to-visible",
  },
  {
    key: "menu-submenu-item-highlight",
    category: "nested-menu-candidate",
    label: "Menu submenu item highlight",
    cpuThrottle: 1,
    sampleCount: 5,
    type: "submenu-hover",
    details: "Open submenu, scripted pointermove sweep across 1000 submenu items",
  },
  {
    key: "navigation-menu-content-switch",
    category: "navigation-menu-candidate",
    label: "Navigation menu content switch",
    cpuThrottle: 1,
    sampleCount: 5,
    type: "navigation-switch",
    details: "Large navigation content switch, click-to-visible",
  },
  {
    key: "tabs-high-count-mount",
    category: "non-floating-collection-candidate",
    label: "Tabs high-count mount",
    cpuThrottle: 1,
    groupCount: 5,
    iterationsPerGroup: 20,
    type: "mount",
    details: "1000 tabs and 1000 keep-mounted panels, render + layout",
  },
  {
    key: "tabs-activation-click",
    category: "non-floating-collection-candidate",
    label: "Tabs activation click",
    cpuThrottle: 1,
    sampleCount: 5,
    type: "tabs-activation",
    details: "1000 tabs and panels, last tab click-to-panel",
  },
  {
    key: "accordion-high-count-mount",
    category: "non-floating-collection-candidate",
    label: "Accordion high-count mount",
    cpuThrottle: 1,
    groupCount: 5,
    iterationsPerGroup: 20,
    type: "mount",
    details: "1000 closed accordion items with mounted panels, render + layout",
  },
  {
    key: "accordion-toggle-click",
    category: "non-floating-collection-candidate",
    label: "Accordion toggle click",
    cpuThrottle: 1,
    sampleCount: 5,
    type: "accordion-toggle",
    details: "1000 closed accordion items, last trigger click-to-panel",
  },
  {
    key: "radio-group-high-count-mount",
    category: "non-floating-collection-candidate",
    label: "Radio Group high-count mount",
    cpuThrottle: 1,
    groupCount: 5,
    iterationsPerGroup: 20,
    type: "mount",
    details: "1000 radio items in one group, render + layout",
  },
  {
    key: "radio-group-change-sweep",
    category: "non-floating-collection-candidate",
    label: "Radio Group change sweep",
    cpuThrottle: 1,
    sampleCount: 5,
    type: "radio-sweep",
    details: "Scripted click sweep across 1000 radio items",
  },
]);

export function defineRuntimePerformanceScenarios(scenarios) {
  if (!Array.isArray(scenarios) || scenarios.length === 0) {
    throw new Error("Runtime performance scenarios must be a nonempty array");
  }
  const normalized = scenarios.map(validateRuntimePerformanceScenario);
  const duplicate = findDuplicate(normalized.map(({ key }) => key));
  if (duplicate) throw new Error(`Duplicate runtime performance scenario: ${duplicate}`);
  return Object.freeze(normalized.map((scenario) => Object.freeze(scenario)));
}

export function validateRuntimePerformanceScenario(scenario, index = 0) {
  requirePlainObject(scenario, `scenarios[${index}]`);
  const allowedKeys = new Set([
    "category",
    "cpuThrottle",
    "details",
    "groupCount",
    "iterationsPerGroup",
    "key",
    "label",
    "openKey",
    "openTarget",
    "sampleCount",
    "type",
  ]);
  for (const key of Object.keys(scenario)) {
    if (!allowedKeys.has(key)) throw new Error(`Unknown scenario field: ${key}`);
  }
  for (const key of ["category", "details", "key", "label", "type"]) {
    requireNonemptyString(scenario[key], `scenario.${key}`);
  }
  if (!measurementTypeSet.has(scenario.type)) {
    throw new Error(`Unknown runtime performance measurement type: ${scenario.type}`);
  }
  requirePositiveNumber(scenario.cpuThrottle, "scenario.cpuThrottle");
  if (scenario.type === "mount") {
    if (scenario.sampleCount != null) {
      throw new Error("Mount scenarios must not define scenario.sampleCount");
    }
    requirePositiveInteger(scenario.groupCount, "scenario.groupCount");
    requirePositiveInteger(scenario.iterationsPerGroup, "scenario.iterationsPerGroup");
  } else {
    if (scenario.groupCount != null || scenario.iterationsPerGroup != null) {
      throw new Error(
        "Sampled scenarios must not define scenario.groupCount or scenario.iterationsPerGroup",
      );
    }
    requirePositiveInteger(scenario.sampleCount, "scenario.sampleCount");
  }
  for (const key of ["openKey", "openTarget"]) {
    if (scenario[key] != null) requireNonemptyString(scenario[key], `scenario.${key}`);
  }
  return { ...scenario };
}

export function createRuntimePerformanceResult({ metric, provider, samples, scenario }) {
  requireNonemptyString(metric, "result.metric");
  requireNonemptyString(provider, "result.provider");
  requireNonemptyString(scenario, "result.scenario");
  const rawSamples = normalizeMeasurements(samples, "result.samples");
  return Object.freeze({
    scenario,
    provider,
    metric,
    samples: Object.freeze(rawSamples),
    medianMs: median(rawSamples),
    p95Ms: eligibleP95(rawSamples),
  });
}

export function validateRuntimePerformanceResult(result) {
  requirePlainObject(result, "result");
  requireExactKeys(result, ["medianMs", "metric", "p95Ms", "provider", "samples", "scenario"]);
  const rebuilt = createRuntimePerformanceResult(result);
  if (result.medianMs !== rebuilt.medianMs || result.p95Ms !== rebuilt.p95Ms) {
    throw new Error("Runtime performance result summaries do not match raw samples");
  }
  return result;
}

export function createRuntimePerformanceEnvironment(environment) {
  requirePlainObject(environment, "environment");
  requireExactKeys(environment, [
    "architecture",
    "browserName",
    "browserRevision",
    "browserVersion",
    "commit",
    "framework",
    "garbageCollectionAvailable",
    "nodeVersion",
    "packageVersions",
    "platform",
    "viewport",
  ]);
  for (const key of [
    "architecture",
    "browserName",
    "browserRevision",
    "browserVersion",
    "commit",
    "framework",
    "nodeVersion",
    "platform",
  ]) {
    requireNonemptyString(environment[key], `environment.${key}`);
  }
  if (typeof environment.garbageCollectionAvailable !== "boolean") {
    throw new Error("environment.garbageCollectionAvailable must be a boolean");
  }
  requirePlainObject(environment.packageVersions, "environment.packageVersions");
  const packageVersions = Object.fromEntries(
    Object.entries(environment.packageVersions)
      .sort(([left], [right]) => left.localeCompare(right, "en"))
      .map(([name, version]) => {
        requireNonemptyString(name, "environment.packageVersions key");
        requireNonemptyString(version, `environment.packageVersions.${name}`);
        return [name, version];
      }),
  );
  requirePlainObject(environment.viewport, "environment.viewport");
  requireExactKeys(environment.viewport, ["deviceScaleFactor", "height", "width"]);
  requirePositiveNumber(
    environment.viewport.deviceScaleFactor,
    "environment.viewport.deviceScaleFactor",
  );
  requirePositiveInteger(environment.viewport.height, "environment.viewport.height");
  requirePositiveInteger(environment.viewport.width, "environment.viewport.width");
  return Object.freeze({
    ...environment,
    packageVersions: Object.freeze(packageVersions),
    viewport: Object.freeze({ ...environment.viewport }),
  });
}

export function validateRuntimePerformanceEnvironment(environment) {
  createRuntimePerformanceEnvironment(environment);
  return environment;
}

export function writeStagedArtifacts(outputs, fileSystem = {}) {
  if (!Array.isArray(outputs) || outputs.length === 0) {
    throw new Error("Runtime performance artifacts must be a nonempty array");
  }
  const normalized = outputs.map(normalizeArtifact);
  const duplicate = findDuplicate(normalized.map(({ path: destination }) => destination));
  if (duplicate) throw new Error(`Duplicate runtime performance artifact path: ${duplicate}`);
  const operations = {
    exists: existsSync,
    mkdir: (directory) => mkdirSync(directory, { recursive: true }),
    remove: (target) => rmSync(target, { force: true }),
    rename: renameSync,
    writeFile: writeFileSync,
    ...fileSystem,
  };
  const transactionId = `${process.pid}-${randomUUID()}`;
  const staged = normalized.map((output, index) => ({
    ...output,
    backupPath: `${output.path}.backup-${transactionId}-${index}`,
    stagedPath: `${output.path}.staged-${transactionId}-${index}`,
  }));

  try {
    for (const item of staged) {
      operations.mkdir(path.dirname(item.path));
      operations.writeFile(item.stagedPath, item.content);
    }
  } catch (error) {
    for (const item of staged) operations.remove(item.stagedPath);
    throw error;
  }

  const replaced = [];
  try {
    for (const item of staged) {
      const hadOriginal = operations.exists(item.path);
      if (hadOriginal) operations.rename(item.path, item.backupPath);
      try {
        operations.rename(item.stagedPath, item.path);
      } catch (error) {
        if (hadOriginal && operations.exists(item.backupPath)) {
          operations.rename(item.backupPath, item.path);
        }
        throw error;
      }
      replaced.push({ ...item, hadOriginal });
    }
  } catch (error) {
    for (const item of replaced.reverse()) {
      operations.remove(item.path);
      if (item.hadOriginal && operations.exists(item.backupPath)) {
        operations.rename(item.backupPath, item.path);
      }
    }
    for (const item of staged) operations.remove(item.stagedPath);
    throw error;
  }

  for (const item of replaced) operations.remove(item.backupPath);
  return normalized.map(({ path: destination }) => destination);
}

export const writeStagedReports = writeStagedArtifacts;

function normalizeArtifact(artifact) {
  requirePlainObject(artifact, "artifact");
  requireExactKeys(artifact, ["content", "path"]);
  requireNonemptyString(artifact.path, "artifact.path");
  if (!path.isAbsolute(artifact.path)) {
    throw new Error(`Runtime performance artifact path must be absolute: ${artifact.path}`);
  }
  if (typeof artifact.content !== "string" && !Buffer.isBuffer(artifact.content)) {
    throw new Error("artifact.content must be a string or Buffer");
  }
  return { content: artifact.content, path: path.resolve(artifact.path) };
}

function normalizeMeasurements(values, label) {
  if (!Array.isArray(values) || values.length === 0) {
    throw new Error(`${label} must be a nonempty array`);
  }
  return values.map((value, index) => {
    if (!Number.isFinite(value) || value < 0) {
      throw new Error(`${label}[${index}] must be a finite nonnegative number`);
    }
    return value;
  });
}

function requireExactKeys(value, keys) {
  const actual = Object.keys(value).sort();
  const expected = [...keys].sort();
  if (JSON.stringify(actual) !== JSON.stringify(expected)) {
    throw new Error(`Fields differ: expected ${expected.join(", ")}`);
  }
}

function requirePlainObject(value, label) {
  if (value == null || typeof value !== "object" || Array.isArray(value)) {
    throw new Error(`${label} must be an object`);
  }
}

function requireNonemptyString(value, label) {
  if (typeof value !== "string" || value.length === 0) {
    throw new Error(`${label} must be a nonempty string`);
  }
}

function requirePositiveInteger(value, label) {
  if (!Number.isInteger(value) || value <= 0)
    throw new Error(`${label} must be a positive integer`);
}

function requirePositiveNumber(value, label) {
  if (!Number.isFinite(value) || value <= 0) throw new Error(`${label} must be a positive number`);
}

function findDuplicate(values) {
  const seen = new Set();
  return values.find((value) => (seen.has(value) ? true : !seen.add(value)));
}
