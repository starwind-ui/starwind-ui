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
    "## ELI5 guide",
    "",
    "Think of a page as a backpack. The empty route is the backpack before components go inside. Total initial JS is the complete backpack a visitor downloads. Component-added JS is the extra weight after we subtract that framework's own empty backpack.",
    "",
    "A component row answers: how large is one complete tool? An overlap bundle answers: how large is one toolbox after shared pieces appear only once? The site table answers: what does the visitor carry on an equivalent Starwind page?",
    "",
    ...formatCurrentReading(react, vue, site),
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

function formatCurrentReading(react, vue, site) {
  const reactExact = react.overlaps["react-exact-three-way"];
  const vueExact = vue.overlaps["vue-exact-three-way"];
  const reactStarwind = reactExact?.["starwind-react"]?.gzipBytes;
  const reactArk = reactExact?.["ark-react"]?.gzipBytes;
  const reactBase = reactExact?.["base-react"]?.gzipBytes;
  const vueStarwind = vueExact?.["starwind-vue"]?.gzipBytes;
  const vueArk = vueExact?.["ark-vue"]?.gzipBytes;
  const vueReka = vueExact?.["reka-vue"]?.gzipBytes;
  const astroSelect = site.astro?.select?.gzipBytes;
  const reactSelect = site.react?.select?.gzipBytes;
  const reactWins = countProviderWins(react, "react-exact-three-way", "starwind-react");
  const vueWins = countProviderWins(vue, "vue-exact-three-way", "starwind-vue");
  return [
    "## What the current numbers say",
    "",
    `- React three-way category overlap: Starwind is ${formatPercentDifference(reactStarwind, reactArk)} Ark UI and ${formatPercentDifference(reactStarwind, reactBase)} Base UI.`,
    `- Starwind is the smallest React option in ${reactWins.wins} of the ${reactWins.total} three-way category-match individual rows. Ark's shared code catches up when all ${reactWins.total} components enter one bundle.`,
    `- Vue three-way category overlap: Starwind is ${formatPercentDifference(vueStarwind, vueArk)} Ark UI and ${formatPercentDifference(vueStarwind, vueReka)} Reka UI.`,
    `- Starwind is the smallest Vue option in ${vueWins.wins} of the ${vueWins.total} three-way category-match individual rows. Reka has the best combined deduplication result.`,
    `- Starwind Select site: Astro sends ${formatBytes(astroSelect)} gzip initially. React sends ${formatBytes(reactSelect)} because the visitor also receives React and React DOM.`,
    "",
  ];
}

function countProviderWins(data, overlapId, providerId) {
  const componentNames = data.overlapComponentNames?.[overlapId] ?? [];
  let wins = 0;
  for (const componentName of componentNames) {
    const sizes = Object.values(data.components[componentName] ?? {})
      .map(({ gzipBytes }) => gzipBytes)
      .filter(Number.isFinite);
    const providerSize = data.components[componentName]?.[providerId]?.gzipBytes;
    if (Number.isFinite(providerSize) && providerSize === Math.min(...sizes)) wins += 1;
  }
  return { total: componentNames.length, wins };
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
