import { describe, expect, it } from "vitest";

import {
  collectDynamicJsImports,
  collectHtmlJsAssets,
  collectStaticJsImports,
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
});
