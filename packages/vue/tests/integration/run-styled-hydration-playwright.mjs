import { createRequire } from "node:module";
import { createServer } from "node:http";
import path from "node:path";
import { pathToFileURL } from "node:url";

import { createSSRApp } from "vue";
import { renderToString } from "vue/server-renderer";

const repoRoot = path.resolve(import.meta.dirname, "../../../..");
const vueDemoRequire = createRequire(path.join(repoRoot, "apps/vue-demo/package.json"));
const { chromium } = vueDemoRequire("playwright");
const { createServer: createViteServer } = await import(
  pathToFileURL(vueDemoRequire.resolve("vite")).href
);
const { default: vue } = await import(
  pathToFileURL(vueDemoRequire.resolve("@vitejs/plugin-vue")).href
);
const vueDist = path.join(repoRoot, "packages/vue/dist");
const fixturePath = "/apps/vue-demo/tests/styled-hydration.fixture.ts";

const vite = await createViteServer({
  appType: "custom",
  configFile: false,
  plugins: [vue()],
  resolve: {
    alias: [
      { find: /^@starwind-ui\/vue\/(.+)$/, replacement: `${vueDist}/$1/index.js` },
      { find: "@starwind-ui/vue", replacement: `${vueDist}/index.js` },
    ],
    dedupe: ["vue"],
  },
  root: repoRoot,
  server: { middlewareMode: true },
});

const { renderStyledFixture } = await vite.ssrLoadModule(fixturePath);
const markup = await renderToString(createSSRApp({ render: renderStyledFixture }));
const html = await vite.transformIndexHtml(
  "/",
  `<!doctype html>
<html>
  <body>
    <div id="styled-hydration-host">${markup}</div>
    <style>
      #hydrated-styled-scroll-area { height: 120px; position: relative; width: 200px; }
      #hydrated-styled-scroll-area [data-sw-scroll-area-viewport] { height: 120px; width: 200px; }
      #hydrated-styled-scroll-area .hydrated-scroll-content { height: 400px; width: 600px; }
      #hydrated-styled-scroll-area [data-sw-scroll-area-scrollbar] { height: 120px; width: 10px; }
      #hydrated-styled-scroll-area [data-sw-scroll-area-thumb] { height: var(--scroll-area-thumb-height); }
    </style>
    <script type="module">
      import { runStyledHydrationChecks } from ${JSON.stringify(fixturePath)};
      try {
        await runStyledHydrationChecks();
        window.__STARWIND_STYLED_HYDRATION_RESULT__ = { ok: true };
      } catch (error) {
        window.__STARWIND_STYLED_HYDRATION_RESULT__ = {
          ok: false,
          error: error?.stack ?? String(error),
        };
      }
    </script>
  </body>
</html>`,
);

const server = createServer((request, response) => {
  if (new URL(request.url ?? "/", "http://127.0.0.1").pathname === "/") {
    response.setHeader("content-type", "text/html; charset=utf-8");
    response.end(html);
    return;
  }
  vite.middlewares(request, response, (error) => {
    response.statusCode = 500;
    response.end(error instanceof Error ? error.stack : String(error ?? "Vite middleware failed"));
  });
});

await new Promise((resolve, reject) => {
  server.once("error", reject);
  server.listen(0, "127.0.0.1", resolve);
});
const address = server.address();
if (!address || typeof address === "string")
  throw new Error("Styled hydration server did not bind.");

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
      () => window.__STARWIND_STYLED_HYDRATION_RESULT__ !== undefined,
      undefined,
      { timeout: 15_000 },
    );
  } catch (error) {
    if (browserErrors.length > 0) throw new Error(browserErrors.join("\n"), { cause: error });
    throw error;
  }
  const result = await page.evaluate(() => window.__STARWIND_STYLED_HYDRATION_RESULT__);
  if (!result.ok) throw new Error(result.error);
  if (browserErrors.length > 0) throw new Error(browserErrors.join("\n"));
  console.log(`Vue Styled hydration checks passed in Chromium ${await browser.version()}.`);
} finally {
  await browser?.close();
  await new Promise((resolve, reject) =>
    server.close((error) => (error ? reject(error) : resolve())),
  );
  await vite.close();
}
