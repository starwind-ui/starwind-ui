import { existsSync, mkdtempSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { describe, expect, it } from "vitest";

import {
  collectDynamicJsImports,
  collectHtmlJsAssets,
  collectStaticJsImports,
  findAttributedStaticChunk,
  writeMarkdownReport,
} from "../assert-astro-demo-bundles.mjs";

describe("assert-astro-demo-bundles helpers", () => {
  it("collects only initial-loading route HTML JavaScript assets", () => {
    const html = `
      <script type="module" src="/_astro/entry.js"></script>
      <link rel="modulepreload" href="/_astro/modulepreload.js">
      <link rel="preload" as="script" href="/_astro/preload.js">
      <link rel="stylesheet" href="/_astro/not-script.js">
      <a href="/_astro/download.js">Download</a>
    `;

    expect(collectHtmlJsAssets(html)).toEqual([
      "/_astro/entry.js",
      "/_astro/modulepreload.js",
      "/_astro/preload.js",
    ]);
  });

  it("separates static and dynamic JavaScript import edges", () => {
    const source = `
      import { shared } from "./shared.js";
      export { other } from "./other.js";
      const lazy = () => import("./lazy.js");
    `;
    const importerPath = "C:/tmp/starwind/_astro/entry.js";

    expect(collectStaticJsImports(source, importerPath)).toEqual([
      "/_astro/shared.js",
      "/_astro/other.js",
    ]);
    expect(collectDynamicJsImports(source, importerPath)).toEqual(["/_astro/lazy.js"]);
  });

  it("attributes the nested-sidebar lifecycle chunk to its exact static importer", () => {
    const report = {
      staticImportEdges: [
        {
          imported: "/_astro/controller-lifecycle.DmuKRW05.js",
          importer: "/_astro/SidebarProvider.astro_astro_type_script_index_0_lang.DUG3d4hi.js",
        },
      ],
    };

    expect(
      findAttributedStaticChunk(report, {
        assetPattern: /^controller-lifecycle\./,
        importerPattern: /^SidebarProvider\.astro_astro_type_script_index_0_lang\./,
      }),
    ).toEqual(report.staticImportEdges[0]);
  });

  it("creates the configured diagnostics directory before writing a report", () => {
    const root = mkdtempSync(path.join(tmpdir(), "starwind-astro-bundle-report-"));
    const reportPath = path.join(root, "diagnostics", "astro-demo-bundle-report.md");

    try {
      writeMarkdownReport(
        [
          {
            attributedStaticChunks: [],
            budget: {
              maxInitialExternalGzipBytes: 1,
              maxInitialExternalRawBytes: 1,
              maxInitialJsGzipBytes: 1,
              maxStaticChunkCount: 1,
            },
            dynamicAssets: [],
            dynamicOnly: { count: 0, gzipBytes: 0, rawBytes: 0 },
            initialAssets: [],
            initialExternal: { count: 0, gzipBytes: 0, rawBytes: 0 },
            initialJsGzipBytes: 0,
            inlineScripts: { count: 0, gzipBytes: 0, rawBytes: 0, scripts: [] },
            label: "Fixture",
            route: "fixture/index.html",
            routeHtml: { gzipBytes: 0, rawBytes: 0 },
            staticImportEdges: [],
          },
        ],
        reportPath,
      );

      expect(existsSync(reportPath)).toBe(true);
      expect(readFileSync(reportPath, "utf8")).toContain("# Astro Demo Bundle Report");
    } finally {
      rmSync(root, { force: true, recursive: true });
    }
  });
});
