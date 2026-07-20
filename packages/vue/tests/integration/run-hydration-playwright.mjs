import { createRequire } from "node:module";
import { createServer } from "node:http";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { createSSRApp, Fragment, h } from "vue";
import { renderToString } from "vue/server-renderer";

import { AvatarFallback, AvatarImage, AvatarRoot } from "@starwind-ui/vue/avatar";
import { ButtonRoot } from "@starwind-ui/vue/button";
import { CheckboxIndicator, CheckboxRoot } from "@starwind-ui/vue/checkbox";
import {
  ProgressIndicator,
  ProgressLabel,
  ProgressRoot,
  ProgressTrack,
  ProgressValue,
} from "@starwind-ui/vue/progress";
import {
  ScrollAreaContent,
  ScrollAreaCorner,
  ScrollAreaRoot,
  ScrollAreaScrollbar,
  ScrollAreaThumb,
  ScrollAreaViewport,
} from "@starwind-ui/vue/scroll-area";
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
const vueDemoRequire = createRequire(path.join(repoRoot, "apps/vue-demo/package.json"));
const { chromium } = vueDemoRequire("playwright");
const runtimeRequire = createRequire(path.join(repoRoot, "packages/runtime/package.json"));
const floatingDomRoot = path.dirname(runtimeRequire.resolve("@floating-ui/dom/package.json"));
const floatingDomRequire = createRequire(path.join(floatingDomRoot, "package.json"));
const floatingCoreRoot = path.dirname(floatingDomRequire.resolve("@floating-ui/core/package.json"));
const floatingCoreRequire = createRequire(path.join(floatingCoreRoot, "package.json"));
const floatingUtilsRoot = path.dirname(
  floatingCoreRequire.resolve("@floating-ui/utils/package.json"),
);

const serverMarkup = await renderToString(createSSRApp({ render: renderFixture }));
const roots = {
  fixture: path.join(packageRoot, "tests/integration/hydration.playwright.fixture.js"),
  floatingCore: path.join(floatingCoreRoot, "dist/floating-ui.core.browser.mjs"),
  floatingDom: path.join(floatingDomRoot, "dist/floating-ui.dom.browser.mjs"),
  floatingUtils: path.join(floatingUtilsRoot, "dist/floating-ui.utils.mjs"),
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
    <div id="hydration-host">${serverMarkup}</div>
    <div id="hydration-overlays"></div>
    <script type="importmap">
      {"imports":{"vue":"/vendor/vue.js","@starwind-ui/runtime/avatar":"/runtime/avatar.js","@starwind-ui/runtime/button":"/runtime/button.js","@starwind-ui/runtime/checkbox":"/runtime/checkbox.js","@starwind-ui/runtime/progress":"/runtime/progress.js","@starwind-ui/runtime/scroll-area":"/runtime/scroll-area.js","@starwind-ui/runtime/select":"/runtime/select.js","@floating-ui/dom":"/vendor/floating-ui-dom.mjs","@floating-ui/core":"/vendor/floating-ui-core.mjs","@floating-ui/utils":"/vendor/floating-ui-utils.mjs"}}
    </script>
    <script type="module">
      try {
        const { runHydrationChecks } = await import("/fixture.js");
        await runHydrationChecks();
        window.__STARWIND_HYDRATION_RESULT__ = { ok: true };
      } catch (error) {
        window.__STARWIND_HYDRATION_RESULT__ = { ok: false, error: error?.stack ?? String(error) };
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
if (!address || typeof address === "string") throw new Error("Hydration server did not bind.");
let browser;
try {
  browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  const browserErrors = [];
  page.on("pageerror", (error) => browserErrors.push(error.stack ?? error.message));
  page.on("console", (message) => {
    if (message.type() === "error") browserErrors.push(`console.error: ${message.text()}`);
  });
  page.on("requestfailed", (request) => {
    browserErrors.push(
      `request failed: ${request.url()} (${request.failure()?.errorText ?? "unknown error"})`,
    );
  });
  page.on("response", (response) => {
    if (response.status() >= 400)
      browserErrors.push(`HTTP ${response.status()}: ${response.url()}`);
  });

  await page.goto(`http://127.0.0.1:${address.port}/`);
  try {
    await page.waitForFunction(
      () => window.__STARWIND_HYDRATION_RESULT__ !== undefined,
      undefined,
      { timeout: 15_000 },
    );
  } catch (error) {
    if (browserErrors.length > 0) throw new Error(browserErrors.join("\n"), { cause: error });
    throw error;
  }
  const result = await page.evaluate(() => window.__STARWIND_HYDRATION_RESULT__);
  if (!result.ok) throw new Error(result.error);
  if (browserErrors.length > 0) throw new Error(browserErrors.join("\n"));
  console.log(`Vue built hydration checks passed in Chromium ${await browser.version()}.`);
} finally {
  await browser?.close();
  await new Promise((resolve, reject) =>
    server.close((error) => (error ? reject(error) : resolve())),
  );
}

function renderFixture() {
  return h("main", null, [
    h(
      ButtonRoot,
      { focusableWhenDisabled: true, id: "hydrated-button" },
      { default: () => "Save" },
    ),
    h(
      CheckboxRoot,
      { defaultChecked: false, id: "hydrated-checkbox", label: "Accept terms" },
      { default: () => h(CheckboxIndicator, null, { default: () => "Selected" }) },
    ),
    h(Fragment, null, [
      h(
        AvatarRoot,
        { id: "hydrated-avatar" },
        {
          default: () => [
            h(AvatarImage, {
              alt: "Hydrated profile",
              src: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16'/%3E",
            }),
            h(AvatarFallback, null, { default: () => "HP" }),
          ],
        },
      ),
      h(
        ProgressRoot,
        { max: 100, min: 0, value: 40 },
        {
          default: () => [
            h(ProgressLabel, null, { default: () => "Hydration progress" }),
            h(ProgressTrack, null, { default: () => h(ProgressIndicator) }),
            h(ProgressValue),
          ],
        },
      ),
      h("button", { id: "hydrated-progress-update", type: "button" }, "Update progress"),
      h(
        ScrollAreaRoot,
        { id: "hydrated-scroll-area", style: "height:120px;position:relative;width:200px" },
        {
          default: () => [
            h(
              ScrollAreaViewport,
              { style: "height:120px;width:200px" },
              {
                default: () =>
                  h(
                    ScrollAreaContent,
                    { style: "height:400px;width:600px" },
                    { default: () => "Hydrated scroll content" },
                  ),
              },
            ),
            h(
              ScrollAreaScrollbar,
              { keepMounted: true, style: "height:120px;width:10px" },
              {
                default: () =>
                  h(ScrollAreaThumb, { style: "height:var(--scroll-area-thumb-height)" }),
              },
            ),
            h(ScrollAreaCorner),
          ],
        },
      ),
    ]),
    h(
      SelectRoot,
      { defaultValue: "apple", modal: false },
      {
        default: () => [
          h(
            SelectTrigger,
            { id: "hydrated-select-trigger" },
            { default: () => h(SelectValue, { placeholder: "Choose fruit" }) },
          ),
          h(
            SelectPortal,
            { container: "#hydration-overlays" },
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
                            default: () => [
                              renderItem("apple", "Apple"),
                              renderItem("banana", "Banana"),
                            ],
                          }),
                      }),
                  },
                ),
            },
          ),
        ],
      },
    ),
  ]);
}

function renderItem(value, label) {
  return h(
    SelectItem,
    { value },
    {
      default: () => [
        h(SelectItemText, null, { default: () => label }),
        h(SelectItemIndicator, null, { default: () => "Selected" }),
      ],
    },
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
