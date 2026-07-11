import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import zlib from "node:zlib";

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const distRoot = path.join(repoRoot, "apps/demo/dist");
const reportPath = path.join(repoRoot, "docs/portable-runtime/astro-demo-bundle-report.md");

const runtimeNestedSidebarForbiddenAssets = [
  [/^init-starwind\./, "global initStarwind bundle"],
  [/^accordion\./, "accordion runtime"],
  [/^AccordionRoot\.astro_/, "accordion root script"],
  [/^alert-dialog\./, "alert dialog runtime"],
  [/^AlertDialogRoot\.astro_/, "alert dialog root script"],
  [/^avatar\./, "avatar runtime"],
  [/^AvatarRoot\.astro_/, "avatar root script"],
  [/^carousel\./, "carousel runtime"],
  [/^CarouselRoot\.astro_/, "carousel root script"],
  [/^checkbox\./, "checkbox runtime"],
  [/^CheckboxRoot\.astro_/, "checkbox root script"],
  [/^checkbox-group\./, "checkbox group runtime"],
  [/^CheckboxGroupRoot\.astro_/, "checkbox group root script"],
  [/^combobox\./, "combobox runtime"],
  [/^ComboboxRoot\.astro_/, "combobox root script"],
  [/^context-menu\./, "context menu runtime"],
  [/^ContextMenuRoot\.astro_/, "context menu root script"],
  [/^dropzone\./, "dropzone runtime"],
  [/^DropzoneRoot\.astro_/, "dropzone root script"],
  [/^field\./, "field runtime"],
  [/^FieldRoot\.astro_/, "field root script"],
  [/^input\./, "input runtime"],
  [/^InputRoot\.astro_/, "input root script"],
  [/^input-otp\./, "input OTP runtime"],
  [/^InputOtpRoot\.astro_/, "input OTP root script"],
  [/^menu\./, "menu runtime"],
  [/^MenuRoot\.astro_/, "menu root script"],
  [/^popover\./, "popover runtime"],
  [/^PopoverRoot\.astro_/, "popover root script"],
  [/^preview-card\./, "preview card runtime"],
  [/^PreviewCardRoot\.astro_/, "preview card root script"],
  [/^progress\./, "progress runtime"],
  [/^ProgressRoot\.astro_/, "progress root script"],
  [/^radio\./, "radio runtime"],
  [/^RadioRoot\.astro_/, "radio root script"],
  [/^radio-group\./, "radio group runtime"],
  [/^RadioGroupRoot\.astro_/, "radio group root script"],
  [/^scroll-area\./, "scroll area runtime"],
  [/^ScrollAreaRoot\.astro_/, "scroll area root script"],
  [/^select\./, "select runtime"],
  [/^SelectRoot\.astro_/, "select root script"],
  [/^slider\./, "slider runtime"],
  [/^SliderRoot\.astro_/, "slider root script"],
  [/^switch\./, "switch runtime"],
  [/^SwitchRoot\.astro_/, "switch root script"],
  [/^tabs\./, "tabs runtime"],
  [/^TabsRoot\.astro_/, "tabs root script"],
  [/^toast\./, "toast runtime"],
  [/^ToastViewport\.astro_/, "toast viewport script"],
  [/^toggle-group\./, "toggle group runtime"],
  [/^ToggleGroupRoot\.astro_/, "toggle group root script"],
];

const routeExpectations = [
  {
    budget: {
      maxInitialExternalGzipBytes: 6_000,
      maxInitialExternalRawBytes: 18_000,
      maxInitialJsGzipBytes: 10_000,
      maxStaticChunkCount: 8,
    },
    forbiddenAssets: [[/^init-starwind\./, "global initStarwind bundle"]],
    label: "Classic nested sidebar",
    route: "pages/sidebar-nested/index.html",
  },
  {
    budget: {
      maxInitialExternalGzipBytes: 34_000,
      maxInitialExternalRawBytes: 100_000,
      maxInitialJsGzipBytes: 36_000,
      maxStaticChunkCount: 18,
    },
    forbiddenAssets: runtimeNestedSidebarForbiddenAssets,
    label: "Runtime nested sidebar",
    route: "pages/runtime-nested-sidebar/index.html",
  },
];

if (isCliEntrypoint()) {
  main();
}

function main() {
  if (!fs.existsSync(distRoot)) {
    throw new Error(`Missing demo dist at ${distRoot}. Run pnpm demo:build first.`);
  }

  const failures = [];
  const routeReports = routeExpectations.map((expectation) => analyzeRoute(expectation));

  for (const report of routeReports) {
    const routeFailures = validateRouteReport(report);
    failures.push(...routeFailures);

    console.log(
      [
        `${routeFailures.length > 0 ? "FAIL" : "OK"} ${report.route}`,
        `${report.initialExternal.count} initial/static JS chunks`,
        `${formatBytes(report.initialExternal.rawBytes)} raw`,
        `${formatBytes(report.initialExternal.gzipBytes)} gzip`,
        `${report.inlineScripts.count} inline script(s)`,
        `${formatBytes(report.initialJsGzipBytes)} initial JS gzip`,
      ].join(": "),
    );
  }

  writeMarkdownReport(routeReports);

  if (failures.length > 0) {
    console.error(`\nBundle regression check failed:\n\n${failures.join("\n\n")}`);
    process.exitCode = 1;
  }
}

function analyzeRoute(expectation) {
  const htmlPath = path.join(distRoot, expectation.route);
  if (!fs.existsSync(htmlPath)) {
    throw new Error(`Missing built route at ${htmlPath}. Run pnpm demo:build first.`);
  }

  const html = fs.readFileSync(htmlPath, "utf8");
  const initialGraph = collectRouteJsGraph(html);
  const dynamicGraph = collectDynamicJsGraph(initialGraph);
  const initialAssets = initialGraph.map(readAssetStats);
  const dynamicAssets = dynamicGraph.map(readAssetStats);
  const inlineScripts = collectInlineScripts(html);
  const inlineScriptStats = summarizeInlineScripts(inlineScripts);
  const initialExternal = summarizeAssets(initialAssets);
  const dynamicOnly = summarizeAssets(dynamicAssets);

  return {
    budget: expectation.budget,
    dynamicAssets,
    dynamicOnly,
    forbiddenMatches: findForbiddenAssets(initialGraph, expectation.forbiddenAssets),
    initialAssets,
    initialExternal,
    initialJsGzipBytes: initialExternal.gzipBytes + inlineScriptStats.gzipBytes,
    initialJsRawBytes: initialExternal.rawBytes + inlineScriptStats.rawBytes,
    inlineScripts: inlineScriptStats,
    label: expectation.label,
    route: expectation.route,
    routeHtml: {
      gzipBytes: gzipSize(html),
      rawBytes: Buffer.byteLength(html),
    },
  };
}

function validateRouteReport(report) {
  const routeFailures = [];
  const { budget } = report;

  if (report.initialExternal.count > budget.maxStaticChunkCount) {
    routeFailures.push(
      `${report.route} loaded ${report.initialExternal.count} initial/static JS chunks, expected at most ${
        budget.maxStaticChunkCount
      }.\n${formatGraph(report.initialAssets.map((asset) => asset.asset))}`,
    );
  }

  if (report.initialExternal.rawBytes > budget.maxInitialExternalRawBytes) {
    routeFailures.push(
      `${report.route} initial/static external JS raw bytes exceeded budget: ${formatBytes(
        report.initialExternal.rawBytes,
      )} > ${formatBytes(budget.maxInitialExternalRawBytes)}.\n${formatBudgetContext(report)}`,
    );
  }

  if (report.initialExternal.gzipBytes > budget.maxInitialExternalGzipBytes) {
    routeFailures.push(
      `${report.route} initial/static external JS gzip bytes exceeded budget: ${formatBytes(
        report.initialExternal.gzipBytes,
      )} > ${formatBytes(budget.maxInitialExternalGzipBytes)}.\n${formatBudgetContext(report)}`,
    );
  }

  if (report.initialJsGzipBytes > budget.maxInitialJsGzipBytes) {
    routeFailures.push(
      `${report.route} initial JS gzip bytes exceeded budget: ${formatBytes(
        report.initialJsGzipBytes,
      )} > ${formatBytes(budget.maxInitialJsGzipBytes)}.\n${formatBudgetContext(report)}`,
    );
  }

  if (report.forbiddenMatches.length > 0) {
    routeFailures.push(
      `${report.route} loaded forbidden runtime assets:\n${report.forbiddenMatches
        .map(({ asset, label }) => `  - ${asset} (${label})`)
        .join("\n")}\n${formatGraph(report.initialAssets.map((asset) => asset.asset))}`,
    );
  }

  return routeFailures;
}

function collectRouteJsGraph(html) {
  const seen = new Set();
  const queue = [...new Set(collectHtmlJsAssets(html))];

  while (queue.length > 0) {
    const asset = queue.shift();
    if (seen.has(asset)) continue;

    seen.add(asset);
    const assetPath = resolveDistAsset(asset);
    if (!fs.existsSync(assetPath)) continue;

    const source = fs.readFileSync(assetPath, "utf8");
    for (const importedAsset of collectStaticJsImports(source, assetPath)) {
      if (!seen.has(importedAsset)) {
        queue.push(importedAsset);
      }
    }
  }

  return [...seen].sort();
}

function collectDynamicJsGraph(initialGraph) {
  const initialAssets = new Set(initialGraph);
  const seen = new Set();
  const queue = [];

  for (const asset of initialGraph) {
    const assetPath = resolveDistAsset(asset);
    if (!fs.existsSync(assetPath)) continue;

    const source = fs.readFileSync(assetPath, "utf8");
    queue.push(...collectDynamicJsImports(source, assetPath));
  }

  while (queue.length > 0) {
    const asset = queue.shift();
    if (initialAssets.has(asset) || seen.has(asset)) continue;

    seen.add(asset);
    const assetPath = resolveDistAsset(asset);
    if (!fs.existsSync(assetPath)) continue;

    const source = fs.readFileSync(assetPath, "utf8");
    for (const importedAsset of [
      ...collectStaticJsImports(source, assetPath),
      ...collectDynamicJsImports(source, assetPath),
    ]) {
      if (!initialAssets.has(importedAsset) && !seen.has(importedAsset)) {
        queue.push(importedAsset);
      }
    }
  }

  return [...seen].sort();
}

export function collectHtmlJsAssets(html) {
  const assets = [];

  for (const match of html.matchAll(/<script\b([^>]*)>/gi)) {
    const src = getAttribute(match[1] ?? "", "src");
    if (isAstroJsAsset(src)) {
      assets.push(src);
    }
  }

  for (const match of html.matchAll(/<link\b([^>]*)>/gi)) {
    const attributes = match[1] ?? "";
    const href = getAttribute(attributes, "href");
    if (!isAstroJsAsset(href) || !isScriptPreload(attributes)) continue;

    assets.push(href);
  }

  return assets;
}

export function collectStaticJsImports(source, importerPath) {
  const imports = [];
  const importPattern = /(?:import|export)\s*(?:[^"']*?from\s*)?["'](\.\/[^"']+\.js)["']/g;

  for (const match of source.matchAll(importPattern)) {
    imports.push(resolveImportedAsset(importerPath, match[1]));
  }

  return imports;
}

export function collectDynamicJsImports(source, importerPath) {
  const imports = [];
  const dynamicImportPattern = /\bimport\(\s*["'](\.\/[^"']+\.js)["']\s*\)/g;

  for (const match of source.matchAll(dynamicImportPattern)) {
    imports.push(resolveImportedAsset(importerPath, match[1]));
  }

  return imports;
}

function isScriptPreload(attributes) {
  const rel = getAttribute(attributes, "rel")?.toLowerCase();
  if (!rel) return false;

  const relValues = rel.split(/\s+/);
  if (relValues.includes("modulepreload")) return true;
  if (!relValues.includes("preload")) return false;

  const as = getAttribute(attributes, "as")?.toLowerCase();
  return as === "script";
}

function getAttribute(attributes, name) {
  const pattern = new RegExp(`\\b${name}\\s*=\\s*(?:"([^"]*)"|'([^']*)'|([^\\s>]+))`, "i");
  const match = attributes.match(pattern);
  return match?.[1] ?? match?.[2] ?? match?.[3] ?? null;
}

function isAstroJsAsset(value) {
  return typeof value === "string" && /^\/_astro\/[^"'>\s]+\.js\b/.test(value);
}

function collectInlineScripts(html) {
  const scripts = [];
  const scriptPattern = /<script\b([^>]*)>([\s\S]*?)<\/script>/gi;

  for (const match of html.matchAll(scriptPattern)) {
    const attributes = match[1] ?? "";
    const content = match[2] ?? "";
    if (/\bsrc\s*=/.test(attributes)) continue;
    if (!isJavaScriptScript(attributes)) continue;
    if (content.trim().length === 0) continue;

    scripts.push({ attributes: normalizeWhitespace(attributes), content });
  }

  return scripts;
}

function isJavaScriptScript(attributes) {
  const typeMatch = attributes.match(/\btype\s*=\s*["']?([^"'\s>]+)/i);
  if (!typeMatch) return true;

  return ["module", "text/javascript", "application/javascript"].includes(
    typeMatch[1].toLowerCase(),
  );
}

function summarizeInlineScripts(scripts) {
  const rawBytes = scripts.reduce((total, script) => total + Buffer.byteLength(script.content), 0);

  return {
    count: scripts.length,
    gzipBytes: scripts.reduce((total, script) => total + gzipSize(script.content), 0),
    rawBytes,
    scripts: scripts.map((script, index) => ({
      attributes: script.attributes || "(no attributes)",
      gzipBytes: gzipSize(script.content),
      index: index + 1,
      rawBytes: Buffer.byteLength(script.content),
    })),
  };
}

function summarizeAssets(assets) {
  return {
    count: assets.length,
    gzipBytes: assets.reduce((total, asset) => total + asset.gzipBytes, 0),
    rawBytes: assets.reduce((total, asset) => total + asset.rawBytes, 0),
  };
}

function readAssetStats(asset) {
  const assetPath = resolveDistAsset(asset);
  const source = fs.existsSync(assetPath) ? fs.readFileSync(assetPath, "utf8") : "";

  return {
    asset,
    gzipBytes: gzipSize(source),
    rawBytes: Buffer.byteLength(source),
  };
}

function findForbiddenAssets(graph, forbiddenAssets) {
  const matches = [];

  for (const asset of graph) {
    const fileName = path.posix.basename(asset);
    for (const [pattern, label] of forbiddenAssets) {
      if (pattern.test(fileName)) {
        matches.push({ asset, label });
      }
    }
  }

  return matches;
}

function formatBudgetContext(report) {
  return [
    `See ${path.relative(repoRoot, reportPath)} for the full route bundle report.`,
    "Largest initial/static gzip contributors:",
    ...formatTopContributors(report.initialAssets, 5),
  ].join("\n");
}

function formatTopContributors(assets, count) {
  return [...assets]
    .sort((a, b) => b.gzipBytes - a.gzipBytes)
    .slice(0, count)
    .map((asset) => `  - ${asset.asset}: ${formatBytes(asset.gzipBytes)} gzip`);
}

function resolveImportedAsset(importerPath, importPath) {
  const importedPath = path.resolve(path.dirname(importerPath), importPath);
  return `/_astro/${path.basename(importedPath)}`;
}

function resolveDistAsset(asset) {
  return path.join(distRoot, asset.replace(/^\//, ""));
}

function writeMarkdownReport(reports) {
  const lines = [
    "# Astro Demo Bundle Report",
    "",
    `Generated: ${new Date().toISOString().slice(0, 10)}`,
    "",
    "## Method",
    "",
    "- Route artifacts come from `apps/demo/dist` after `pnpm demo:build`.",
    "- Initial/static external JavaScript follows route HTML JS assets and their static `import`/`export ... from` edges.",
    "- Inline scripts are counted separately so JavaScript embedded in HTML is not hidden from comparisons.",
    "- Dynamic imports are reported separately and are not counted as initial JavaScript.",
    "- Gzip uses Node zlib default gzip settings on each asset or inline script.",
    "",
    "## Route Summary",
    "",
    "| Route | Initial chunks | External raw | External gzip | Inline scripts | Inline raw | Inline gzip | Initial JS gzip | Dynamic-only chunks | Dynamic-only gzip | HTML raw | HTML gzip |",
    "| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |",
    ...reports.map((report) =>
      [
        `| \`${report.route}\``,
        report.initialExternal.count,
        formatBytes(report.initialExternal.rawBytes),
        formatBytes(report.initialExternal.gzipBytes),
        report.inlineScripts.count,
        formatBytes(report.inlineScripts.rawBytes),
        formatBytes(report.inlineScripts.gzipBytes),
        formatBytes(report.initialJsGzipBytes),
        report.dynamicOnly.count,
        formatBytes(report.dynamicOnly.gzipBytes),
        formatBytes(report.routeHtml.rawBytes),
        `${formatBytes(report.routeHtml.gzipBytes)} |`,
      ].join(" | "),
    ),
    "",
    "## Budgets",
    "",
    "| Route | Max initial chunks | Max external raw | Max external gzip | Max initial JS gzip |",
    "| --- | ---: | ---: | ---: | ---: |",
    ...reports.map((report) =>
      [
        `| \`${report.route}\``,
        report.budget.maxStaticChunkCount,
        formatBytes(report.budget.maxInitialExternalRawBytes),
        formatBytes(report.budget.maxInitialExternalGzipBytes),
        `${formatBytes(report.budget.maxInitialJsGzipBytes)} |`,
      ].join(" | "),
    ),
    "",
  ];

  for (const report of reports) {
    lines.push(...formatRouteDetail(report));
  }

  while (lines.at(-1) === "") {
    lines.pop();
  }

  fs.writeFileSync(reportPath, `${lines.join("\n")}\n`);
}

function formatRouteDetail(report) {
  const topAssets = [...report.initialAssets].sort((a, b) => b.gzipBytes - a.gzipBytes);

  return [
    `## ${report.label}`,
    "",
    `Route: \`${report.route}\``,
    "",
    "### Largest Initial/Static Contributors",
    "",
    "| Asset | Raw | Gzip |",
    "| --- | ---: | ---: |",
    ...topAssets
      .slice(0, 12)
      .map(
        (asset) =>
          `| \`${asset.asset}\` | ${formatBytes(asset.rawBytes)} | ${formatBytes(asset.gzipBytes)} |`,
      ),
    "",
    "### Inline Scripts",
    "",
    ...(report.inlineScripts.scripts.length > 0
      ? [
          "| Script | Attributes | Raw | Gzip |",
          "| ---: | --- | ---: | ---: |",
          ...report.inlineScripts.scripts.map(
            (script) =>
              `| ${script.index} | \`${script.attributes}\` | ${formatBytes(
                script.rawBytes,
              )} | ${formatBytes(script.gzipBytes)} |`,
          ),
        ]
      : ["No inline JavaScript scripts found."]),
    "",
    "### Dynamic-Only Imports",
    "",
    ...(report.dynamicAssets.length > 0
      ? [
          "| Asset | Raw | Gzip |",
          "| --- | ---: | ---: |",
          ...report.dynamicAssets.map(
            (asset) =>
              `| \`${asset.asset}\` | ${formatBytes(asset.rawBytes)} | ${formatBytes(
                asset.gzipBytes,
              )} |`,
          ),
        ]
      : ["No dynamic-only JavaScript imports found from the initial/static graph."]),
    "",
  ];
}

function gzipSize(source) {
  return zlib.gzipSync(Buffer.from(source)).length;
}

function formatBytes(bytes) {
  if (bytes < 1024) return `${bytes} B`;
  return `${(bytes / 1024).toFixed(1)} KiB`;
}

function normalizeWhitespace(value) {
  return value.trim().replace(/\s+/g, " ");
}

function formatGraph(graph) {
  return graph.map((asset) => `  - ${asset}`).join("\n");
}

function isCliEntrypoint() {
  return process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);
}
