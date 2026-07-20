import { createServer } from "node:http";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";

import { createSSRApp, h } from "vue";
import { renderToString } from "vue/server-renderer";

import {
  SelectItem,
  SelectItemIndicator,
  SelectItemText,
  SelectList,
  SelectPopup,
  SelectPortal,
  SelectPositioner,
  SelectRoot,
  SelectTrigger,
  SelectValue,
} from "@starwind-ui/vue/select";

const packageRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const repoRoot = path.resolve(packageRoot, "../..");
const reactDemoRequire = createRequire(path.join(repoRoot, "apps/react-demo/package.json"));
const { chromium } = reactDemoRequire("playwright");
const runtimeRequire = createRequire(path.join(repoRoot, "packages/runtime/package.json"));
const floatingDomPackageRoot = path.dirname(
  runtimeRequire.resolve("@floating-ui/dom/package.json"),
);
const floatingDomRequire = createRequire(path.join(floatingDomPackageRoot, "package.json"));
const floatingCorePackageRoot = path.dirname(
  floatingDomRequire.resolve("@floating-ui/core/package.json"),
);
const floatingCoreRequire = createRequire(path.join(floatingCorePackageRoot, "package.json"));
const floatingUtilsPackageRoot = path.dirname(
  floatingCoreRequire.resolve("@floating-ui/utils/package.json"),
);

const serverMarkup = await renderToString(
  createSSRApp({
    render: () =>
      h(
        SelectRoot,
        { defaultValue: "apple", name: "hydrated-fruit" },
        {
          default: () => [
            h(SelectTrigger, null, {
              default: () => h(SelectValue, { placeholder: "Pick fruit" }),
            }),
            h(
              SelectPortal,
              { container: "#built-hydration-overlays" },
              {
                default: () =>
                  h(
                    SelectPositioner,
                    { alignItemWithTrigger: false },
                    {
                      default: () =>
                        h(SelectPopup, null, {
                          default: () =>
                            h(SelectList, null, {
                              default: () =>
                                h(
                                  SelectItem,
                                  { value: "apple" },
                                  {
                                    default: () => [
                                      h(SelectItemText, null, { default: () => "Apple" }),
                                      h(SelectItemIndicator, null, { default: () => "✓" }),
                                    ],
                                  },
                                ),
                            }),
                        }),
                    },
                  ),
              },
            ),
          ],
        },
      ),
  }),
);

const roots = {
  fixture: path.join(packageRoot, "tests/select/select.playwright.fixture.js"),
  floatingCore: path.join(floatingCorePackageRoot, "dist/floating-ui.core.browser.mjs"),
  floatingDom: path.join(floatingDomPackageRoot, "dist/floating-ui.dom.browser.mjs"),
  floatingUtils: path.join(floatingUtilsPackageRoot, "dist/floating-ui.utils.mjs"),
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
      {"imports":{"vue":"/vendor/vue.js","@starwind-ui/runtime/select":"/runtime/select.js","@floating-ui/dom":"/vendor/floating-ui-dom.mjs","@floating-ui/core":"/vendor/floating-ui-core.mjs","@floating-ui/utils":"/vendor/floating-ui-utils.mjs"}}
    </script>
    <script type="module">
      try {
        const { runSelectBrowserChecks } = await import("/fixture.js");
        await runSelectBrowserChecks(${JSON.stringify(serverMarkup)});
        window.__STARWIND_SELECT_RESULT__ = { ok: true };
      } catch (error) {
        window.__STARWIND_SELECT_RESULT__ = { ok: false, error: error?.stack ?? String(error) };
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
if (!address || typeof address === "string") throw new Error("Select test server did not bind.");
let browser;
try {
  browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  const browserErrors = [];
  page.on("pageerror", (webError) => {
    const error = typeof webError?.error === "function" ? webError.error() : webError;
    browserErrors.push(error?.stack ?? error?.message ?? String(error ?? webError));
  });
  page.on("console", (message) => {
    if (message.type() === "error") browserErrors.push(`console.error: ${message.text()}`);
  });
  page.on("requestfailed", (request) => {
    browserErrors.push(
      `request failed: ${request.url()} (${request.failure()?.errorText ?? "unknown error"})`,
    );
  });
  page.on("response", (response) => {
    if (response.status() >= 400) {
      browserErrors.push(`HTTP ${response.status()}: ${response.url()}`);
    }
  });
  await page.goto(`http://127.0.0.1:${address.port}/`);
  try {
    await page.waitForFunction(() => window.__STARWIND_SELECT_RESULT__ !== undefined, undefined, {
      timeout: 15_000,
    });
  } catch (error) {
    if (browserErrors.length > 0) throw new Error(browserErrors.join("\n"), { cause: error });
    throw error;
  }
  const result = await page.evaluate(() => window.__STARWIND_SELECT_RESULT__);
  if (!result.ok) throw new Error(result.error);
  if (browserErrors.length > 0) throw new Error(browserErrors.join("\n"));
  console.log(`Vue Select built browser checks passed in Chromium ${await browser.version()}.`);
} finally {
  await browser?.close();
  await new Promise((resolve, reject) =>
    server.close((error) => (error ? reject(error) : resolve())),
  );
}

function resolveRequestFile(pathname) {
  if (pathname === "/fixture.js") return roots.fixture;
  if (pathname === "/vendor/floating-ui-core.mjs") return roots.floatingCore;
  if (pathname === "/vendor/floating-ui-dom.mjs") return roots.floatingDom;
  if (pathname === "/vendor/floating-ui-utils.mjs") return roots.floatingUtils;
  if (pathname === "/vendor/vue.js") return roots.vueRuntime;
  if (pathname.startsWith("/vue/")) return safeResolve(roots.vue, pathname.slice(5));
  if (pathname.startsWith("/runtime/")) return safeResolve(roots.runtime, pathname.slice(9));
}

function safeResolve(root, relativePath) {
  const resolved = path.resolve(root, relativePath);
  if (resolved !== root && !resolved.startsWith(`${root}${path.sep}`)) return;
  return resolved;
}
