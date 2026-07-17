import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

import {
  comparisonGroups,
  comparisonMetadata,
  comparisonRows,
  followUpPriorities,
  overlapComponents,
  packageSizeOverlapSeedComponents,
  runtimeOnlyComponents,
  supportStatuses,
} from "./zag-feature-comparison-data.mjs";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, "../..");
const reportPath = path.join(repoRoot, comparisonMetadata.generatedPath);

export function validateZagFeatureComparison(data = getDefaultData(), options = {}) {
  const errors = [];
  const validPriorities = new Set(followUpPriorities);
  const validStatuses = new Set(supportStatuses);
  const validGroups = new Set(Object.keys(comparisonGroups));
  const componentEntries = new Map();

  for (const entry of data.overlapComponents) {
    if (!entry.component) errors.push("Overlap entry is missing component.");
    if (!entry.issue) errors.push(`${entry.component} is missing issue.`);
    if (!validGroups.has(entry.group)) {
      errors.push(`${entry.component} uses unknown group '${entry.group}'.`);
    }
    if (!Array.isArray(entry.zagPackages) || entry.zagPackages.length === 0) {
      errors.push(`${entry.component} is missing Zag packages.`);
    }
    if (!Array.isArray(entry.starwindEvidence) || entry.starwindEvidence.length === 0) {
      errors.push(`${entry.component} is missing Starwind evidence roots.`);
    }
    if (componentEntries.has(entry.component)) {
      errors.push(`${entry.component} appears more than once in overlapComponents.`);
    }
    componentEntries.set(entry.component, entry);
  }

  for (const component of packageSizeOverlapSeedComponents) {
    const entry = componentEntries.get(component);
    if (!entry) {
      errors.push(`Package-size seed component '${component}' is missing from overlapComponents.`);
    } else if (!entry.packageSizeSeed) {
      errors.push(`Package-size seed component '${component}' must keep packageSizeSeed: true.`);
    }
  }

  for (const entry of data.runtimeOnlyComponents) {
    if (componentEntries.has(entry.component)) {
      errors.push(`${entry.component} cannot be both runtime-only and Zag-overlap.`);
    }
    if (!entry.reason) errors.push(`${entry.component} runtime-only entry is missing reason.`);
  }

  for (const row of data.comparisonRows) {
    if (!componentEntries.has(row.component)) {
      errors.push(
        `Comparison row '${row.feature}' references unknown component '${row.component}'.`,
      );
    }
    if (!row.category) errors.push(`${row.component} row '${row.feature}' is missing category.`);
    if (!row.feature) errors.push(`${row.component} comparison row is missing feature.`);
    if (!validStatuses.has(row.starwind)) {
      errors.push(
        `${row.component} '${row.feature}' uses invalid Starwind status '${row.starwind}'.`,
      );
    }
    if (!validStatuses.has(row.zag)) {
      errors.push(`${row.component} '${row.feature}' uses invalid Zag status '${row.zag}'.`);
    }
    if (!Array.isArray(row.starwindEvidence) || row.starwindEvidence.length === 0) {
      errors.push(`${row.component} '${row.feature}' is missing Starwind evidence.`);
    }
    if (!Array.isArray(row.zagEvidence) || row.zagEvidence.length === 0) {
      errors.push(`${row.component} '${row.feature}' is missing Zag evidence.`);
    }
    if (!validPriorities.has(row.followUpPriority)) {
      errors.push(
        `${row.component} '${row.feature}' uses invalid follow-up priority '${row.followUpPriority}'.`,
      );
    }
  }

  if (options.requireFeatureRows) {
    const componentsWithRows = new Set(data.comparisonRows.map((row) => row.component));
    for (const entry of data.overlapComponents) {
      if (!componentsWithRows.has(entry.component)) {
        errors.push(`${entry.component} has no feature comparison rows.`);
      }
    }
  }

  return {
    errors,
    ok: errors.length === 0,
  };
}

export function renderZagFeatureComparisonReport(data = getDefaultData()) {
  const validation = validateZagFeatureComparison(data);
  if (!validation.ok) {
    throw new Error(`Zag feature comparison is invalid:\n${validation.errors.join("\n")}`);
  }

  const lines = [
    "# Zag Runtime Feature Comparison",
    "",
    `Generated from local comparison data on ${comparisonMetadata.starwindEvidenceDate}.`,
    "",
    "## Scope",
    "",
    "This report compares Zag implementation features against Starwind Runtime features for components where the current Starwind Runtime has a direct or close Zag equivalent. It is feature evidence, not an architecture proposal; Zag remains a reference rather than the Starwind Runtime foundation.",
    "",
    "## Source Versions",
    "",
    `- Starwind evidence date: ${comparisonMetadata.starwindEvidenceDate}`,
    `- Starwind evidence roots: ${comparisonMetadata.starwindEvidenceSources.map(code).join(", ")}`,
    `- Zag evidence date: ${comparisonMetadata.zagEvidenceDate}`,
    `- Zag package version: ${code(comparisonMetadata.zagPackageVersion)}`,
    `- Zag package source: ${code(comparisonMetadata.zagPackageSource)}`,
    "",
    "## Executive Summary",
    "",
    "| Metric | Value |",
    "| --- | --- |",
    tableRow(["Confirmed overlap components", String(data.overlapComponents.length)]),
    tableRow([
      "Package-size seed components",
      String(data.overlapComponents.filter((entry) => entry.packageSizeSeed).length),
    ]),
    tableRow([
      "Validated extra overlap",
      data.overlapComponents
        .filter((entry) => !entry.packageSizeSeed)
        .map((entry) => code(entry.component))
        .join(", ") || "None",
    ]),
    tableRow(["Feature comparison rows", String(data.comparisonRows.length)]),
    tableRow([
      "Open follow-up rows",
      String(data.comparisonRows.filter((row) => row.followUpPriority !== "none").length),
    ]),
    "",
    "### Size Context",
    "",
    "These size numbers come from the current package-size report. They are context for public answers, not proof of feature support.",
    "",
    "| Comparison set | Components | Starwind min+gzip | Zag React min+gzip | Base UI min+gzip | Source |",
    "| --- | ---: | ---: | ---: | ---: | --- |",
    ...comparisonMetadata.packageSizeContext.map((entry) =>
      tableRow([
        entry.comparison,
        String(entry.starwindComponents),
        entry.starwindMinGzip,
        entry.zagMinGzip,
        entry.baseUiMinGzip,
        code(entry.source),
      ]),
    ),
    "",
    "## Public Framing Guardrails",
    "",
    "- Say Starwind Runtime is heavier than the old one-off component scripts because it now owns real cross-component behavior.",
    "- Say the current matched-support size report still has Starwind lighter than Zag React and Base UI for the measured overlap rows.",
    "- Say the extra Runtime bytes buy documented behavior: forms, dynamic collections, overlays, cancellation, lifecycle cleanup, and copied-component initialization.",
    "- Keep public wording aligned with the root and Runtime READMEs: Astro-first, framework-portable, accessible UI components with Starwind/shadcn-style ergonomics.",
    '- Do not claim zero runtime dependencies, full Zag parity, every-framework support, or "Base UI for Astro."',
    "",
    "## Starwind Strengths",
    "",
    "| Strength | Evidence | Product relevance |",
    "| --- | --- | --- |",
    ...starwindStrengthRows().map((entry) =>
      tableRow([entry.strength, entry.evidence.map(code).join(", "), entry.relevance]),
    ),
    "",
    "## Zag Strengths",
    "",
    "| Strength | Evidence | Product relevance |",
    "| --- | --- | --- |",
    ...zagStrengthRows().map((entry) =>
      tableRow([entry.strength, entry.evidence.map(code).join(", "), entry.relevance]),
    ),
    "",
    "## Component Summary",
    "",
    "| Component | Starwind support | Zag support | Follow-ups | Overall note |",
    "| --- | --- | --- | --- | --- |",
    ...componentSummaryRows(data).map((entry) =>
      tableRow([code(entry.component), entry.starwind, entry.zag, entry.followUps, entry.note]),
    ),
    "",
    "## Gap Backlog",
    "",
    "Rows in this backlog are analysis follow-ups, not accepted implementation work. `high` means a user-facing correctness or accessibility gap should be triaged soon; `medium` means meaningful product capability; `low` means useful parity or polish.",
    "",
    ...gapBacklogLines(data.comparisonRows),
    "",
    "## Support Status",
    "",
    "| Status | Meaning |",
    "| --- | --- |",
    "| `supported` | The feature is implemented for the compared component. |",
    "| `partial` | Some meaningful support exists, but important behavior or API coverage is missing. |",
    "| `not-supported` | The feature appears absent from the compared component. |",
    "| `not-applicable` | The feature does not apply to that component or API shape. |",
    "| `unknown` | Evidence is not strong enough yet. |",
    "",
    "## Overlap Inventory",
    "",
    "| Component | Zag package | Package-size seed | Issue slice | Notes |",
    "| --- | --- | --- | --- | --- |",
    ...data.overlapComponents.map((entry) =>
      tableRow([
        code(entry.component),
        entry.zagPackages.map(code).join(", "),
        entry.packageSizeSeed ? "Yes" : "No",
        `Issue ${entry.issue}`,
        entry.note ?? "",
      ]),
    ),
    "",
    "## Runtime-Only Appendix",
    "",
    "| Starwind component | Reason | Evidence |",
    "| --- | --- | --- |",
    ...data.runtimeOnlyComponents.map((entry) =>
      tableRow([code(entry.component), entry.reason, entry.starwindEvidence.map(code).join(", ")]),
    ),
    "",
    "## Component Matrix",
    "",
  ];

  for (const [groupKey, groupLabel] of Object.entries(comparisonGroups)) {
    const components = data.overlapComponents.filter((entry) => entry.group === groupKey);
    lines.push(`### ${groupLabel}`, "");

    for (const component of components) {
      const rows = data.comparisonRows.filter((row) => row.component === component.component);
      lines.push(`#### ${component.component}`, "");
      lines.push(`Zag package: ${component.zagPackages.map(code).join(", ")}`);
      if (component.note) {
        lines.push("", component.note);
      }
      lines.push("");

      if (rows.length === 0) {
        lines.push("_Feature rows pending._", "");
        continue;
      }

      lines.push(
        "| Category | Feature | Starwind | Zag | Follow-up | Evidence | Notes |",
        "| --- | --- | --- | --- | --- | --- | --- |",
      );
      for (const row of rows) {
        lines.push(
          tableRow([
            row.category,
            row.feature,
            statusCell(row.starwind),
            statusCell(row.zag),
            priorityCell(row.followUpPriority),
            renderEvidence(row),
            row.notes ?? "",
          ]),
        );
      }
      lines.push("");
    }
  }

  return `${lines.join("\n").trimEnd()}\n`;
}

export async function writeZagFeatureComparisonReport({
  check = false,
  outputPath = reportPath,
  requireFeatureRows = false,
} = {}) {
  const data = getDefaultData();
  const validation = validateZagFeatureComparison(data, { requireFeatureRows });
  if (!validation.ok) {
    throw new Error(`Zag feature comparison is invalid:\n${validation.errors.join("\n")}`);
  }

  const contents = renderZagFeatureComparisonReport(data);

  if (check) {
    const current = await readFile(outputPath, "utf8").catch((error) => {
      if (error.code === "ENOENT") return null;
      throw error;
    });
    if (current === null) return;
    if (current !== contents) {
      const displayedPath = path.relative(repoRoot, outputPath).replaceAll("\\", "/");
      throw new Error(`${displayedPath} is out of date. Run pnpm runtime:zag:compare.`);
    }
    return;
  }

  await mkdir(path.dirname(outputPath), { recursive: true });
  await writeFile(outputPath, contents);
}

function getDefaultData() {
  return {
    comparisonRows,
    overlapComponents,
    runtimeOnlyComponents,
  };
}

function starwindStrengthRows() {
  return [
    {
      evidence: [
        "packages/runtime/src/init-starwind.ts",
        "packages/runtime/src/components/*/*.browser.test.ts",
      ],
      relevance:
        "Copied Astro/React components can initialize and clean up behavior from normal DOM rather than requiring users to wire every controller manually.",
      strength: "Raw HTML initialization and copied-component lifecycle",
    },
    {
      evidence: [
        "packages/runtime/src/components/accordion/accordion.browser.test.ts",
        "packages/runtime/src/components/checkbox-group/checkbox-group.browser.test.ts",
        "packages/runtime/src/components/combobox/combobox.browser.test.ts",
        "packages/runtime/src/components/select/select.browser.test.ts",
        "packages/runtime/src/components/scroll-area/scroll-area.browser.test.ts",
      ],
      relevance:
        "Dynamic item add/remove, disabled-state changes, reordered collections, and mutable DOM options are a Starwind Runtime selling point for copied components.",
      strength: "Dynamic DOM and mutable option refresh where proven",
    },
    {
      evidence: [
        "packages/runtime/src/components/checkbox/checkbox.browser.test.ts",
        "packages/runtime/src/components/collapsible/collapsible.browser.test.ts",
        "packages/runtime/src/components/menu/menu.browser.test.ts",
        "packages/runtime/src/components/tabs/tabs.browser.test.ts",
      ],
      relevance:
        "Cancelable DOM events let application code veto uncontrolled commits before the Runtime mutates state.",
      strength: "Base UI-style event details and cancellation behavior",
    },
    {
      evidence: [
        "packages/runtime/src/components/field/",
        "packages/runtime/src/components/form/",
        "packages/runtime/src/components/checkbox/checkbox.browser.test.ts",
        "packages/runtime/src/components/dropzone/dropzone.browser.test.ts",
        "packages/runtime/src/components/radio-group/radio-group.browser.test.ts",
      ],
      relevance:
        "Native form participation, reset synchronization, labels, descriptions, errors, and Field-owned state are core Starwind product differentiators.",
      strength: "Native forms, field integration, and reset lifecycle coverage",
    },
    {
      evidence: ["packages/runtime/src/components/toast/toast.browser.test.ts", "README.md"],
      relevance:
        "Styled components remain understandable and editable while shared behavior lives in the Runtime.",
      strength: "Starwind/shadcn-style copied-component ergonomics",
    },
  ];
}

function zagStrengthRows() {
  const zagVersion = comparisonMetadata.zagPackageVersion;

  return [
    {
      evidence: [
        `@zag-js/core@${zagVersion}/dist/types.d.ts`,
        `@zag-js/*@${zagVersion}/dist/*.types.d.ts`,
      ],
      relevance:
        "Zag's machine/connect model gives framework adapters a consistent way to derive part props and state APIs.",
      strength: "Machine/connect architecture with generated part props",
    },
    {
      evidence: [
        "docs/portable-runtime/package-size-comparison.md",
        `@zag-js/react@${zagVersion}`,
        `@zag-js/vue@${zagVersion}`,
        `@zag-js/solid@${zagVersion}`,
        `@zag-js/svelte@${zagVersion}`,
      ],
      relevance:
        "Zag currently ships adapters for more frameworks than Starwind's first-party Astro and React primitive adapters.",
      strength: "Framework adapter breadth",
    },
    {
      evidence: [
        `@zag-js/collection@${zagVersion}/dist/types.d.ts`,
        `@zag-js/combobox@${zagVersion}/dist/combobox.types.d.ts`,
        `@zag-js/select@${zagVersion}/dist/select.types.d.ts`,
      ],
      relevance:
        "ListCollection and item-state APIs are a strong reference for complex select, combobox, and collection-heavy components.",
      strength: "Collection APIs for complex selection components",
    },
    {
      evidence: [
        `@zag-js/types@${zagVersion}/dist/index.d.ts`,
        `@zag-js/core@${zagVersion}/dist/scope.d.ts`,
        `@zag-js/dom-query@${zagVersion}/dist/scope.d.ts`,
      ],
      relevance:
        "The installed Zag type surface includes getRootNode/custom-environment hooks for shadow-root, iframe, and nonstandard document contexts.",
      strength: "Custom root-node and environment hooks",
    },
    {
      evidence: [
        `@zag-js/carousel@${zagVersion}/dist/carousel.types.d.ts`,
        `@zag-js/drawer@${zagVersion}/dist/drawer.types.d.ts`,
        `@zag-js/file-upload@${zagVersion}/dist/file-upload.types.d.ts`,
        `@zag-js/toast@${zagVersion}/dist/toast.types.d.ts`,
      ],
      relevance:
        "Zag exposes richer APIs in several components, including carousel autoplay/progress, drawer snap/swipe, file-upload validation, and toast store controls.",
      strength: "Advanced high-level component APIs",
    },
  ];
}

function componentSummaryRows(data) {
  return data.overlapComponents.map((entry) => {
    const rows = data.comparisonRows.filter((row) => row.component === entry.component);

    return {
      component: entry.component,
      followUps: summarizeFollowUps(rows),
      note: summarizeComponent(entry, rows),
      starwind: summarizeStatuses(rows, "starwind"),
      zag: summarizeStatuses(rows, "zag"),
    };
  });
}

function summarizeStatuses(rows, side) {
  const counts = supportStatuses
    .map((status) => ({
      count: rows.filter((row) => row[side] === status).length,
      status,
    }))
    .filter((entry) => entry.count > 0);

  if (counts.length === 0) return "No rows";

  return counts.map((entry) => `${entry.count} ${code(entry.status)}`).join("<br>");
}

function summarizeFollowUps(rows) {
  const counts = ["high", "medium", "low"]
    .map((priority) => ({
      count: rows.filter((row) => row.followUpPriority === priority).length,
      priority,
    }))
    .filter((entry) => entry.count > 0);

  if (counts.length === 0) return "None";

  return counts.map((entry) => `${entry.count} ${code(entry.priority)}`).join("<br>");
}

function summarizeComponent(entry, rows) {
  if (rows.length === 0) return "No feature rows have been recorded yet.";

  const sharedSupported = rows.filter(
    (row) => row.starwind === "supported" && row.zag === "supported",
  ).length;
  const starwindSpecific = rows.filter(
    (row) =>
      row.starwind === "supported" &&
      ["not-applicable", "not-supported", "partial"].includes(row.zag),
  );
  const zagLeads = rows.filter((row) => row.zag === "supported" && row.starwind !== "supported");
  const unknowns = rows.filter((row) => row.starwind === "unknown" || row.zag === "unknown");

  const parts = [];
  if (sharedSupported > 0) {
    parts.push(`${sharedSupported} shared supported ${sharedSupported === 1 ? "row" : "rows"}`);
  }
  if (starwindSpecific.length > 0) {
    parts.push(`Starwind-specific or stronger: ${briefFeatures(starwindSpecific)}`);
  }
  if (zagLeads.length > 0) {
    parts.push(`Zag stronger: ${briefFeatures(zagLeads)}`);
  }
  if (unknowns.length > 0) {
    parts.push(`Unknown evidence remains for ${briefFeatures(unknowns)}`);
  }
  if (entry.note) parts.push(entry.note);

  return ensureSentence(parts.join(". "));
}

function briefFeatures(rows) {
  return rows
    .slice(0, 2)
    .map((row) => `${row.category.toLowerCase()} (${row.feature})`)
    .join("; ");
}

function gapBacklogLines(rows) {
  const lines = [];
  for (const priority of ["high", "medium", "low"]) {
    const priorityRows = rows
      .filter((row) => row.followUpPriority === priority)
      .sort((left, right) => left.component.localeCompare(right.component));

    lines.push(`### ${capitalize(priority)} Priority`, "");

    if (priorityRows.length === 0) {
      lines.push("_No current rows._", "");
      continue;
    }

    lines.push(
      "| Component | Product relevance | Feature | Starwind | Zag | Notes |",
      "| --- | --- | --- | --- | --- | --- |",
    );
    for (const row of priorityRows) {
      lines.push(
        tableRow([
          code(row.component),
          productRelevance(row),
          row.feature,
          statusCell(row.starwind),
          statusCell(row.zag),
          row.notes ?? "",
        ]),
      );
    }
    lines.push("");
  }

  return lines;
}

function productRelevance(row) {
  if (["Accessibility", "Forms", "Keyboard", "Dismissal", "Validation"].includes(row.category)) {
    return "User-facing accessibility or form correctness";
  }
  if (["Collections", "Dynamic DOM", "Lifecycle"].includes(row.category)) {
    return "Copied-component runtime robustness";
  }
  if (["Floating", "Focus", "Pointer", "Touch"].includes(row.category)) {
    return "Overlay or interaction polish";
  }
  if (["Anatomy", "API", "Rich APIs"].includes(row.category)) {
    return "Primitive API breadth";
  }
  return "Product capability or parity";
}

function capitalize(value) {
  return `${value.slice(0, 1).toUpperCase()}${value.slice(1)}`;
}

function ensureSentence(value) {
  return /[.!?]$/.test(value) ? value : `${value}.`;
}

function code(value) {
  return `\`${value}\``;
}

function renderEvidence(row) {
  const starwind = row.starwindEvidence.map(code).join(", ");
  const zag = row.zagEvidence.map(code).join(", ");
  return `Starwind: ${starwind}<br>Zag: ${zag}`;
}

function tableRow(cells) {
  return `| ${cells.join(" | ")} |`;
}

function statusCell(status) {
  return code(status);
}

function priorityCell(priority) {
  return code(priority);
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  const args = new Set(process.argv.slice(2));
  writeZagFeatureComparisonReport({
    check: args.has("--check"),
    requireFeatureRows: args.has("--require-feature-rows"),
  }).catch((error) => {
    console.error(error.message);
    process.exitCode = 1;
  });
}
