import { createServer } from "node:http";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";

import { createSSRApp, h } from "vue";
import { renderToString } from "vue/server-renderer";

import { CheckboxIndicator, CheckboxRoot } from "@starwind-ui/vue/checkbox";

const packageRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const repoRoot = path.resolve(packageRoot, "../..");
const reactDemoRequire = createRequire(path.join(repoRoot, "apps/react-demo/package.json"));
const { chromium } = reactDemoRequire("playwright");

const serverMarkup = await renderToString(
  createSSRApp({
    render: () =>
      h(
        CheckboxRoot,
        {
          "aria-label": "Hydrated checkbox",
          defaultChecked: false,
          id: "hydrated-checkbox",
          name: "hydrated",
          nativeButton: true,
          uncheckedValue: "no",
          value: "yes",
        },
        { default: () => h(CheckboxIndicator, null, { default: () => "✓" }) },
      ),
  }),
);

const roots = {
  fixture: path.join(packageRoot, "tests/checkbox/checkbox.playwright.fixture.js"),
  runtime: path.join(repoRoot, "packages/runtime/dist"),
  vue: path.join(packageRoot, "dist"),
  vueRuntime: path.join(packageRoot, "node_modules/vue/dist/vue.esm-browser.js"),
};
const server = createServer(async (request, response) => {
  try {
    const pathname = new URL(request.url ?? "/", "http://127.0.0.1").pathname;
    if (pathname === "/") {
      response.setHeader("content-type", "text/html; charset=utf-8");
      response.end(`<!doctype html>
<html>
  <body>
    <script type="importmap">
      {"imports":{"vue":"/vendor/vue.js","@starwind-ui/runtime/checkbox":"/runtime/checkbox.js"}}
    </script>
    <script type="module">
      import { runCheckboxBrowserChecks } from "/fixture.js";
      try {
        await runCheckboxBrowserChecks(${JSON.stringify(serverMarkup)});
        window.__STARWIND_CHECKBOX_RESULT__ = { ok: true };
      } catch (error) {
        window.__STARWIND_CHECKBOX_RESULT__ = { ok: false, error: error?.stack ?? String(error) };
      }
    </script>
  </body>
</html>`);
      return;
    }

    const file = resolveRequestFile(pathname);
    if (!file) {
      response.statusCode = 404;
      response.end("Not found");
      return;
    }

    response.setHeader("content-type", "text/javascript; charset=utf-8");
    response.end(await readFile(file));
  } catch (error) {
    response.statusCode = 500;
    response.end(error instanceof Error ? error.stack : String(error));
  }
});

await new Promise((resolve, reject) => {
  server.once("error", reject);
  server.listen(0, "127.0.0.1", resolve);
});

const address = server.address();
if (!address || typeof address === "string") {
  throw new Error("Checkbox test server did not bind a port.");
}
let browser;
try {
  browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  await page.goto(`http://127.0.0.1:${address.port}/`);
  await page.waitForFunction(() => window.__STARWIND_CHECKBOX_RESULT__ !== undefined);
  const result = await page.evaluate(() => window.__STARWIND_CHECKBOX_RESULT__);
  if (!result.ok) throw new Error(result.error);
  console.log(`Vue Checkbox browser checks passed in Chromium ${await browser.version()}.`);
} finally {
  await browser?.close();
  await new Promise((resolve, reject) =>
    server.close((error) => (error ? reject(error) : resolve())),
  );
}

function resolveRequestFile(pathname) {
  if (pathname === "/fixture.js") return roots.fixture;
  if (pathname === "/vendor/vue.js") return roots.vueRuntime;
  if (pathname.startsWith("/vue/")) return safeResolve(roots.vue, pathname.slice(5));
  if (pathname.startsWith("/runtime/")) return safeResolve(roots.runtime, pathname.slice(9));
}

function safeResolve(root, relativePath) {
  const resolved = path.resolve(root, relativePath);
  if (resolved !== root && !resolved.startsWith(`${root}${path.sep}`)) return;
  return resolved;
}
