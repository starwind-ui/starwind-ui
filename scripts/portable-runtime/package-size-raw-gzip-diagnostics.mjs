const rawGzipDiagnosticTargets = [
  {
    comparisonSet: "all-three-overlap",
    label: "All-three overlap - Starwind combined",
    note: "Primary continuation gate.",
    provider: "starwind",
    scope: "combined support set",
  },
  {
    component: "select",
    label: "Isolated Starwind Select",
    note: "Existing tracer cold-import guard.",
    provider: "starwind",
    scope: "isolated component",
  },
  {
    component: "combobox",
    label: "Isolated Starwind Combobox",
    note: "Combobox migration cold-import guard.",
    provider: "starwind",
    scope: "isolated component",
  },
  {
    component: "menu",
    label: "Isolated Starwind Menu",
    note: "Menu migration cold-import guard.",
    provider: "starwind",
    scope: "isolated component",
  },
  {
    component: "context-menu",
    label: "Isolated Starwind Context Menu",
    note: "Menu-family regression guard.",
    provider: "starwind",
    scope: "isolated component",
  },
];

export function buildRawGzipDiagnostics({ supportResults }) {
  return rawGzipDiagnosticTargets.map((target) => {
    const result = target.component
      ? findSupportComponentResult(supportResults, target.component, target.provider)
      : findSupportResult(supportResults, target.comparisonSet, target.provider);
    const gzipBytes = getRequiredGzipBytes(result, target);

    return {
      gzipBytes,
      label: target.label,
      note: target.note,
      roundedGzip: formatRoundedBytes(gzipBytes),
      scope: target.scope,
    };
  });
}

export function formatRawGzipDiagnosticsMarkdown(rows) {
  return [
    "## Raw Gzip Diagnostics",
    "",
    "These exact gzip byte counts are the decision source for the reopened Combobox/Menu overlap optimization. Use the rounded KiB tables for public-facing comparison copy, but use this section for before/after migration gates.",
    "",
    "| Gate row | Scope | Raw gzip bytes | Rounded min+gzip | Notes |",
    "| --- | --- | ---: | ---: | --- |",
    ...rows.map((row) =>
      [row.label, row.scope, formatExactBytes(row.gzipBytes), row.roundedGzip, row.note]
        .join(" | ")
        .replace(/^/, "| ")
        .replace(/$/, " |"),
    ),
    "",
    "Tradeoff gate:",
    "",
    "- Future Combobox/Menu migrations should compare raw gzip bytes against this section, not only the rounded one-decimal KiB report values.",
    "- A slight isolated Combobox or Menu increase is acceptable only when `All-three overlap - Starwind combined` raw gzip bytes decrease and the isolated component remains clearly below the comparable Zag React and Base UI rows.",
    "- Any isolated Combobox or Menu increase of 1.0 KiB min+gzip or more is a `ready-for-human` decision unless the all-three overlap reduction is larger and explicitly justified.",
    "- Source-owner byte relocation alone does not count as a product size win.",
  ];
}

function findSupportResult(results, comparisonSet, provider) {
  return results.find((row) => row.comparisonSet === comparisonSet && row.provider === provider);
}

function findSupportComponentResult(results, component, provider) {
  return results.find((row) => row.component === component && row.provider === provider);
}

function getRequiredGzipBytes(result, target) {
  if (!result || typeof result.gzipBytes !== "number") {
    throw new Error(`Missing raw gzip diagnostic for ${target.label}`);
  }

  return result.gzipBytes;
}

function formatExactBytes(bytes) {
  return `${bytes} B`;
}

function formatRoundedBytes(bytes) {
  if (bytes < 1024) return `${bytes} B`;
  return `${(bytes / 1024).toFixed(1)} KiB`;
}
