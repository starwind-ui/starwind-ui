import { validateVuePerformanceEvidence } from "./vue-run-evidence.mjs";
import {
  rekaUiScenarioDecisions,
  vuePerformanceProviderOrder,
  vuePerformanceTopology,
} from "./vue-plan.mjs";

const scenarioLabels = Object.freeze({
  "accordion-high-count-mount": "Accordion high-count mount",
  "accordion-toggle-click": "Accordion toggle click",
  "combobox-item-highlight": "Combobox item highlight",
  "combobox-filter-input": "Combobox filter input",
  "combobox-open": "Combobox open",
  "combobox-trigger-mount": "Combobox trigger mount",
  "dialog-open": "Dialog open",
  "dialog-trigger-mount": "Dialog trigger mount",
  "menu-item-highlight": "Menu item highlight",
  "menu-open": "Menu open",
  "menu-submenu-item-highlight": "Submenu item highlight",
  "menu-submenu-open": "Submenu open",
  "navigation-menu-content-switch": "Navigation Menu content switch",
  "popover-trigger-mount": "Popover trigger mount",
  "preview-card-trigger-mount": "Preview Card trigger mount",
  "radio-group-change-sweep": "Radio Group change sweep",
  "radio-group-high-count-mount": "Radio Group high-count mount",
  "select-item-highlight": "Select item highlight",
  "select-open": "Select open",
  "select-trigger-mount": "Select trigger mount",
  "tabs-activation-click": "Tabs activation click",
  "tabs-high-count-mount": "Tabs high-count mount",
  "tooltip-trigger-mount": "Tooltip trigger mount",
});

const rekaExclusionSummaries = Object.freeze({
  "combobox-filter-input":
    "The providers perform different filtering and item-DOM work, so no common public-API measurement remains.",
  "navigation-menu-content-switch":
    "Exact Reka UI 2.10.3 has no Navigation Menu Portal and cannot match the approved portal ownership.",
  "select-item-highlight":
    "Exact Reka UI 2.10.3 cannot complete the common synthetic pointermove action without changing the measured behavior.",
  "select-trigger-mount":
    "Exact Reka UI 2.10.3 exceeds the fixed lifecycle limit at the approved 1,000-root scale.",
});

export function renderVuePerformanceEvidenceMarkdown(evidence, options = {}) {
  validateVuePerformanceEvidence(evidence, options);
  const { environment, machine, revision } = evidence.collection;
  const rowsById = new Map(evidence.rows.map((row) => [row.id, row]));
  const candidates = new Map(
    evidence.rows
      .filter(({ candidate }) => candidate)
      .map(({ candidate }) => [candidate.id, candidate]),
  );
  return `${[
    "# Private Vue Runtime Performance Evidence",
    "",
    "> Private order-14 evidence. Comparator results are advisory and are not release gates or catalog scores.",
    "",
    "## Method",
    "",
    "- Each result is the median of five measured samples with zero warmups.",
    "- Open and activation rows measure the accepted action through a visible endpoint and forced layout.",
    "- Mount rows reuse one loaded browser lifecycle for five in-page mount, layout, assertion, and unmount cycles.",
    "- Highlight rows measure a sequential pointermove sweep across the complete mounted collection.",
    "- Garbage collection runs before each sample when available and stays outside timing.",
    "",
    "## Package versions",
    "",
    "| Library | Version |",
    "| --- | ---: |",
    `| Starwind Runtime | ${environment.packageVersions["@starwind-ui/runtime"]} |`,
    `| Starwind Vue | ${environment.packageVersions["@starwind-ui/vue"]} |`,
    `| Zag Vue | ${environment.packageVersions["@zag-js/vue"]} |`,
    `| Reka UI | ${environment.packageVersions["reka-ui"]} |`,
    `| Vue | ${environment.packageVersions.vue} |`,
    "",
    "## Comparison results",
    "",
    "| Scenario | Details | CPU | Metric | Starwind | Zag Vue | Reka UI |",
    "| --- | --- | ---: | --- | ---: | ---: | ---: |",
    ...vuePerformanceTopology.map((topology) => {
      const providerCells = vuePerformanceProviderOrder.map((provider) =>
        formatComparisonResult(rowsById.get(`${topology.scenario}:${provider}`)),
      );
      return `| ${scenarioLabels[topology.scenario]} | ${describeScenario(topology)} | ${topology.cpuThrottle}x | \`${topology.metric}\` | ${providerCells.join(" | ")} |`;
    }),
    "",
    "## Excluded Reka comparisons",
    "",
    "| Scenario | Reason |",
    "| --- | --- |",
    ...rekaUiScenarioDecisions
      .filter(({ decision }) => decision === "exclude")
      .map(
        ({ scenario }) =>
          `| ${scenarioLabels[scenario] ?? titleCaseScenario(scenario)} | ${rekaExclusionSummaries[scenario]} |`,
      ),
    "",
    "## Reading the numbers",
    "",
    "- Highlight results measure a complete sequential sweep across 1,000 items, not one item transition.",
    "- Radio Group change sweep covers 100 checked-state changes.",
    "- Open results include the action, framework update, visible endpoint assertion, and forced layout.",
    "- Mount results include mount, layout, lifecycle assertions, and unmount. They exclude navigation and bundle parsing.",
    "- An unstable marker means the five samples exceeded the recorded within-row stability limits.",
    "- Compare providers only within the same scenario row. These local results are not universal performance claims.",
    "",
    "## Detailed evidence",
    "",
    "### Collection provenance",
    "",
    `- Revision: \`${revision}\``,
    `- Runtime: Node ${environment.nodeVersion} on ${environment.platform} ${environment.architecture}`,
    `- CPU: ${machine.cpuModel} (${machine.logicalCoreCount} logical cores)`,
    `- Browser: ${environment.browserName} ${environment.browserVersion} (${environment.browserRevision})`,
    `- Vue framework: ${environment.framework}`,
    `- Viewport: ${environment.viewport.width} x ${environment.viewport.height} at ${environment.viewport.deviceScaleFactor}x`,
    `- Browser garbage collection available: ${environment.garbageCollectionAvailable ? "yes" : "no"}`,
    "- Garbage collection policy: collect before each sample when available, outside timing",
    "- Warmups per row: 0",
    "- Measured samples per row: 5",
    "- Mount lifecycle: one loaded context, page, CDP session, and navigation for five in-page cycles",
    `- Reviewed Reka audit: \`${evidence.audit.source}\` (SHA-256 \`${evidence.audit.sha256}\`)`,
    "- Full resolved package versions:",
    ...Object.entries(environment.packageVersions)
      .sort(([left], [right]) => left.localeCompare(right, "en"))
      .map(([name, version]) => `  - \`${name}@${version}\``),
    "",
    "### Raw samples and stability",
    "",
    "| Row | Raw samples (ms) | Median | Min | Max | Spread | MAD | CV | Stable |",
    "| --- | --- | ---: | ---: | ---: | ---: | ---: | ---: | :---: |",
    ...evidence.rows.map(
      (row) =>
        `| \`${row.id}\` | ${row.result.samples.map(formatMs).join(", ")} | ${formatMs(row.stability.medianMs)} | ${formatMs(row.stability.minimumMs)} | ${formatMs(row.stability.maximumMs)} | ${formatMs(row.stability.spreadMs)} | ${formatMs(row.stability.madMs)} | ${row.stability.coefficientOfVariation == null ? "unavailable" : formatPercent(row.stability.coefficientOfVariation)} | ${row.stability.stable ? "yes" : "no"} |`,
    ),
    "",
    "## Non-blocking Starwind candidate ceilings",
    "",
    "| Row | Status | Reason | Maximum | MAD | Headroom | Candidate ceiling |",
    "| --- | --- | --- | ---: | ---: | ---: | ---: |",
    ...evidence.rows
      .filter(({ id }) => candidates.has(id))
      .map(({ id }) => {
        const candidate = candidates.get(id);
        return candidate.status === "ceiling-available"
          ? `| \`${id}\` | ceiling available |  | ${formatMs(candidate.maximumMs)} | ${formatMs(candidate.madMs)} | ${formatMs(candidate.headroomMs)} | ${formatMs(candidate.ceilingMs)} |`
          : `| \`${id}\` | unstable, no ceiling | ${candidate.reason} | unavailable | unavailable | unavailable | unavailable |`;
      }),
    "",
    "These Starwind ceilings remain private review data. Comparator-relative values do not pass or fail this command.",
  ]
    .join("\n")
    .trimEnd()}\n`;
}

function formatComparisonResult(row) {
  if (!row) return "excluded";
  return `${formatMs(row.stability.medianMs)} ${row.stability.stable ? "stable" : "unstable"}`;
}

function describeScenario(topology) {
  if (topology.metric === "pointermove-sweep") {
    const qualifier = topology.scenario.startsWith("menu-submenu") ? "submenu " : "mounted ";
    return `Sequential pointermove sweep across ${formatCount(topology.itemCount)} ${qualifier}items`;
  }
  if (topology.metric === "radio-click-sweep") {
    return `Sequential click sweep across ${formatCount(topology.itemCount)} radio items`;
  }
  if (topology.metric === "render-layout") {
    if (topology.scenario === "radio-group-high-count-mount") {
      return `${formatCount(topology.itemCount)} radio items, mount + layout`;
    }
    if (topology.scenario.startsWith("tabs-")) {
      return `${formatCount(topology.itemCount)} tabs and mounted panels, mount + layout`;
    }
    if (topology.scenario.startsWith("accordion-")) {
      return `${formatCount(topology.itemCount)} accordion items and mounted panels, mount + layout`;
    }
    return `${formatCount(topology.componentCount)} closed ${humanizeComponent(topology.component)} roots, mount + layout`;
  }
  if (topology.scenario === "dialog-open") {
    return `${formatCount(topology.outsideNodeCount)} outside nodes, trigger to visible`;
  }
  if (topology.scenario === "navigation-menu-content-switch") {
    return `${formatCount(topology.itemCount)} links, secondary content switch to visible`;
  }
  if (topology.scenario === "tabs-activation-click") {
    return `${formatCount(topology.itemCount)} tabs and mounted panels, last tab to visible panel`;
  }
  if (topology.scenario === "accordion-toggle-click") {
    return `${formatCount(topology.itemCount)} accordion items, last toggle to visible panel`;
  }
  if (topology.scenario === "menu-submenu-open") {
    return `Parent menu plus ${formatCount(topology.itemCount)}-item submenu, activation to visible`;
  }
  return `${formatCount(topology.itemCount)} items, activation to visible`;
}

function formatCount(value) {
  return Number(value).toLocaleString("en-US");
}

function humanizeComponent(component) {
  return component.replaceAll("-", " ");
}

function titleCaseScenario(scenario) {
  return scenario
    .split("-")
    .map((word) => `${word[0].toUpperCase()}${word.slice(1)}`)
    .join(" ");
}

export function renderVuePerformanceRunMarkdown({ environment, flags, focused, rows }) {
  return `${[
    focused
      ? "# Private Focused Vue Runtime Performance Run"
      : "# Private Vue Runtime Performance Run",
    "",
    "> Diagnostic output only. Comparator-relative values are advisory.",
    "",
    `Commit: \`${environment.commit}\``,
    "Warmups: 0",
    `Measured samples: ${flags.smoke ? 1 : 5}`,
    "",
    "| Row | Median | Samples | Lifecycle |",
    "| --- | ---: | --- | :---: |",
    ...rows.map(
      (row) =>
        `| \`${row.id}\` | ${formatMs(row.result.medianMs)} | ${row.result.samples.map(formatMs).join(", ")} | ${row.lifecycle.passed ? "pass" : "fail"} |`,
    ),
    "",
  ].join("\n")}`;
}

function formatMs(value) {
  return `${Number(value).toFixed(3)} ms`;
}
function formatPercent(value) {
  return `${(value * 100).toFixed(2)}%`;
}
