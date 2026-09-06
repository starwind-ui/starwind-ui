export function subtractFrameworkShell(scenario, empty) {
  return Object.fromEntries(
    ["minifiedBytes", "gzipBytes", "brotliBytes"].map((key) => [
      key,
      Math.max(0, (scenario?.[key] ?? 0) - (empty?.[key] ?? 0)),
    ]),
  );
}

export function formatProductSizeReport({ generatedAt, react, site, vue }) {
  return [
    "# Unstyled library browser-size comparison",
    "",
    `Generated: ${generatedAt}`,
    "",
    "This report measures JavaScript that a browser downloads. Synthetic component rows bundle each complete public component surface. React, React DOM, and Vue are external in those rows. Gzip and Brotli use the same minified output.",
    "",
    ...formatCurrentReading(react, vue),
    ...formatFramework("React", react),
    ...formatFramework("Vue", vue),
    ...formatSite(site),
    "## Method",
    "",
    "- Individual rows retain the complete component subpath surface through namespace imports. Reka UI uses all named exports with the component prefix because it publishes one package root.",
    "- Overlap rows import all matched component surfaces into one bundle. Shared code is counted once.",
    "- Synthetic bundles are minified with esbuild. Gzip uses level 9. Brotli uses quality 11.",
    "- Competitor values come from versioned snapshots. Normal Starwind refreshes do not install or bundle competitors.",
    "- Site totals come from controlled browser entries. The Astro entry imports the named Runtime controllers that rendered Astro roots require. Astro component source runs at build time and adds no framework adapter to the browser. The React entry renders named Primitive parts and includes React plus React DOM.",
    "- Site values exclude CSS, application code, images, and network headers. Component-added values subtract the same framework's empty entry.",
    "",
    "## Refresh commands",
    "",
    "```bash",
    "# Normal offline refresh: rebuild Starwind, measure site entries, and rewrite this report.",
    "pnpm runtime:size:product",
    "",
    "# Occasional comparator refresh after a material release.",
    "pnpm runtime:size:comparators:refresh --ark-react",
    "pnpm runtime:size:comparators:refresh --base-react",
    "pnpm runtime:size:comparators:refresh --ark-vue",
    "pnpm runtime:size:comparators:refresh --reka-vue",
    "```",
    "",
  ].join("\n");
}

export function formatProductAttributionReport({ generatedAt, react, vue }) {
  return [
    "# Starwind product-overlap source attribution",
    "",
    `Generated: ${generatedAt}`,
    "",
    "This internal diagnostic attributes minified bytes in the exact product-overlap bundles. Gzip and Brotli remain whole-bundle measurements because compressed bytes cannot be assigned cleanly to individual source files.",
    "",
    ...formatAttributionSection("React", react),
    "",
    ...formatAttributionSection("Vue", vue),
    "",
  ].join("\n");
}

function formatFramework(label, data) {
  const starwindId = `starwind-${label.toLowerCase()}`;
  const overlapId = `${label.toLowerCase()}-exact-three-way`;
  const combined = data.overlaps[overlapId];
  const combinedComparisons = data.providers
    .filter(({ id }) => id !== starwindId)
    .map(
      ({ id, label: providerLabel }) =>
        `${formatPercentDifference(combined?.[starwindId]?.gzipBytes, combined?.[id]?.gzipBytes)} ${providerLabel}`,
    );
  const providerHeaders = data.providers.map(
    ({ label: providerLabel, version }) => `${providerLabel}${version ? ` ${version}` : ""}`,
  );
  const componentRows = Object.entries(data.components).map(([component, values]) => [
    component,
    ...data.providers.map(({ id }) => formatSize(values[id])),
  ]);
  const overlapRows = Object.entries(data.overlaps).map(([overlap, values]) => [
    formatOverlapLabel(overlap),
    data.overlapMetadata?.[overlap]?.componentCount ?? "",
    ...data.providers.map(({ id }) => formatSize(values[id])),
  ]);

  return [
    `## ${label} individual components`,
    "",
    markdownTable(["Component", ...providerHeaders], componentRows),
    "",
    `## ${label} overlap bundles`,
    "",
    `In the ${data.overlapMetadata?.[overlapId]?.componentCount ?? "N/A"}-component combined bundle, Starwind is ${combinedComparisons.join(" and ")}. Shared code is counted once in each bundle.`,
    "",
    markdownTable(["Overlap", "Components", ...providerHeaders], overlapRows),
    "",
    `### ${label} complete package-root diagnostic`,
    "",
    "This secondary row retains every public root export. It is useful for package-wide trend checks. Normal apps should prefer component subpaths.",
    "",
    markdownTable(
      ["Library", "Complete root gzip / Brotli"],
      data.providers.map(({ id, label: providerLabel }) => [
        providerLabel,
        formatSize(data.catalog?.[id]),
      ]),
    ),
    "",
  ];
}

function formatSite(site) {
  const scenarioIds = [
    ...new Set([...Object.keys(site.astro ?? {}), ...Object.keys(site.react ?? {})]),
  ];
  const rows = scenarioIds.flatMap((scenarioId) =>
    ["astro", "react"].map((framework) => {
      const total = site[framework]?.[scenarioId];
      const added = subtractFrameworkShell(total, site[framework]?.empty);
      return [titleCase(scenarioId), titleCase(framework), formatSize(total), formatSize(added)];
    }),
  );
  return [
    "## Astro versus React site delivery",
    "",
    `For the Starwind Select site, Astro sends ${formatBytes(site.astro?.select?.gzipBytes)} gzip initially. React sends ${formatBytes(site.react?.select?.gzipBytes)} because the visitor also receives React and React DOM.`,
    "",
    "Total initial JS is the visitor-facing number for the controlled entry. The added column isolates the component cost above each framework's empty shell.",
    "",
    markdownTable(
      [
        "Scenario",
        "Starwind target",
        "Total initial gzip / Brotli",
        "Component-added JS gzip / Brotli",
      ],
      rows,
    ),
    "",
  ];
}

function formatAttributionSection(framework, analysis) {
  if (!analysis) {
    return [`## ${framework} exact-overlap attribution`, "", "No attribution was captured."];
  }
  return [
    `## ${framework} exact-overlap attribution`,
    "",
    markdownTable(
      ["Modules", "Combined gzip", "Isolated sum", "Shared-code savings"],
      [
        [
          analysis.componentCount,
          formatBytes(analysis.combinedGzipBytes),
          formatBytes(analysis.isolatedGzipBytes),
          formatSavings(analysis.sharedSavingsGzipBytes, analysis.isolatedGzipBytes),
        ],
      ],
    ),
    "",
    markdownTable(
      ["Category", "Minified bytes in output", "Share"],
      analysis.categories.map((category) => [
        category.label,
        formatBytes(category.bytes),
        formatPercent(category.bytes, analysis.totalBytes),
      ]),
    ),
    "",
    "The following rows attribute bytes to built inputs. A built input can contain several source modules. The report lists every contained source marker and does not assign the whole input to its first marker.",
    "",
    markdownTable(
      ["Rank", "Category", "Built input", "Contained source modules", "Minified contribution"],
      analysis.topLocalInputs.map((input, index) => [
        index + 1,
        input.category,
        `\`${input.path}\``,
        input.sourceModules.length > 0
          ? input.sourceModules.map((source) => `\`${source}\``).join("<br>")
          : "No source marker",
        formatBytes(input.bytes),
      ]),
    ),
  ];
}

function formatSize(size, missing = "N/A") {
  if (!size) return missing;
  return `${formatBytes(size.gzipBytes)} / ${formatBytes(size.brotliBytes)}`;
}

function formatCurrentReading(react, vue) {
  const reactWins = countProviderWins(react, "react-exact-three-way", "starwind-react");
  const vueWins = countProviderWins(vue, "vue-exact-three-way", "starwind-vue");
  const majority = [reactWins, vueWins].every(({ wins, total }) => wins > total / 2);
  const comparisons = [
    ["Starwind UI React vs Ark UI React", react, "starwind-react", "ark-react"],
    ["Starwind UI React vs Base UI React", react, "starwind-react", "base-react"],
    ["Starwind UI Vue vs Ark UI Vue", vue, "starwind-vue", "ark-vue"],
    ["Starwind UI Vue vs Reka UI Vue", vue, "starwind-vue", "reka-vue"],
  ];
  return [
    "## Small imports for the components your page uses",
    "",
    majority
      ? "Starwind UI has the smallest imports in the majority of comparisons."
      : "Individual component import sizes vary by library. The tables below compare each measured category.",
    "",
    "For a page that uses a few components, start with individual import sizes. This scorecard compares gzip sizes across the component categories measured for both libraries in each pair.",
    "",
    markdownTable(
      ["Comparison", "Starwind smaller", "Median reduction per component"],
      comparisons.map(([label, data, starwindId, comparatorId]) => {
        const { smaller, total, medianReduction } = summarizeComponentComparison(
          data,
          starwindId,
          comparatorId,
        );
        return [
          label,
          total > 0 ? `**${smaller} of ${total}**` : "N/A",
          medianReduction == null ? "N/A" : `**${medianReduction.toFixed(1)}%**`,
        ];
      }),
    ),
    "",
    "The median includes every shared measured category, including rows where Starwind is larger. The smaller count excludes ties. A page with several components needs a combined measurement to account for shared code.",
    "",
  ];
}

function summarizeComponentComparison(data, starwindId, comparatorId) {
  const reductions = Object.values(data.components)
    .filter(
      (values) =>
        Number.isFinite(values[starwindId]?.gzipBytes) &&
        values[starwindId].gzipBytes >= 0 &&
        Number.isFinite(values[comparatorId]?.gzipBytes) &&
        values[comparatorId].gzipBytes > 0,
    )
    .map((values) => (1 - values[starwindId].gzipBytes / values[comparatorId].gzipBytes) * 100)
    .sort((left, right) => left - right);
  const middle = (reductions.length - 1) / 2;
  return {
    smaller: reductions.filter((reduction) => reduction > 0).length,
    total: reductions.length,
    medianReduction:
      reductions.length > 0
        ? (reductions[Math.floor(middle)] + reductions[Math.ceil(middle)]) / 2
        : null,
  };
}

function countProviderWins(data, overlapId, providerId) {
  const componentNames = data.overlapComponentNames?.[overlapId] ?? [];
  let wins = 0;
  let total = 0;
  for (const componentName of componentNames) {
    const sizes = data.providers.map(({ id }) => data.components[componentName]?.[id]?.gzipBytes);
    if (!sizes.every((bytes) => Number.isFinite(bytes) && bytes >= 0)) continue;
    total += 1;
    const providerSize = data.components[componentName]?.[providerId]?.gzipBytes;
    if (
      providerSize === Math.min(...sizes) &&
      sizes.filter((bytes) => bytes === providerSize).length === 1
    ) {
      wins += 1;
    }
  }
  return { total, wins };
}

function formatPercentDifference(value, comparator) {
  if (!Number.isFinite(value) || !Number.isFinite(comparator) || comparator === 0) {
    return "N/A versus";
  }
  const percent = ((value - comparator) / comparator) * 100;
  return `${Math.abs(percent).toFixed(1)}% ${percent >= 0 ? "larger than" : "smaller than"}`;
}

function formatPercent(value, total) {
  if (!Number.isFinite(value) || !Number.isFinite(total) || total === 0) return "0.0%";
  return `${((value / total) * 100).toFixed(1)}%`;
}

function formatSavings(value, total) {
  return `${formatBytes(value)} (${formatPercent(value, total)})`;
}

function formatOverlapLabel(overlapId) {
  const labels = {
    "react-ark-react-overlap": "Starwind / Ark React category overlap",
    "react-base-react-overlap": "Starwind / Base UI category overlap",
    "react-exact-three-way": "React three-way category overlap",
    "vue-ark-vue-overlap": "Starwind / Ark Vue category overlap",
    "vue-exact-three-way": "Vue three-way category overlap",
    "vue-reka-vue-overlap": "Starwind / Reka UI category overlap",
  };
  return labels[overlapId] ?? overlapId;
}

function formatBytes(bytes) {
  if (!Number.isFinite(bytes)) return "N/A";
  return `${(bytes / 1024).toFixed(1)} KiB`;
}

function markdownTable(headers, rows) {
  return [
    `| ${headers.join(" | ")} |`,
    `| ${headers.map(() => "---").join(" | ")} |`,
    ...rows.map((row) => `| ${row.join(" | ")} |`),
  ].join("\n");
}

function titleCase(value) {
  if (value === "full-overlap") return "Full Category Overlap";
  return value
    .split("-")
    .map((word) => word[0].toUpperCase() + word.slice(1))
    .join(" ");
}
