import { cp, mkdir, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import path from "node:path";

import { svelte } from "@sveltejs/vite-plugin-svelte";
import { type Browser, chromium } from "playwright";
import { createServer, type ViteDevServer } from "vite";
import { afterEach, describe, expect, it } from "vitest";

import { chartStyledContract } from "../../contracts/styled/components/chart.js";

const repo = process.cwd();
const styledSource = path.join(repo, "apps/svelte-demo/src/lib/starwind-runtime/chart");
const fixtures = path
  .join(repo, "packages/runtime/tests/components/chart/fixtures.ts")
  .replaceAll("\\", "/");
const roots: string[] = [];
const servers: ViteDevServer[] = [];
const browsers: Browser[] = [];

afterEach(async () => {
  await Promise.all(browsers.splice(0).map((browser) => browser.close()));
  await Promise.all(servers.splice(0).map((server) => server.close()));
  await Promise.all(roots.splice(0).map((root) => rm(root, { force: true, recursive: true })));
});

describe("generated Svelte Styled chart", () => {
  it("uses one Styled file set that matches the contract and imports TanStack only for types", async () => {
    const index = await readFile(path.join(styledSource, "index.ts"), "utf8");
    const defaultEntries = Object.entries(chartStyledContract.defaultExport ?? {});
    expect(defaultEntries.map(([, exportName]) => exportName)).toEqual(
      chartStyledContract.publicExports,
    );
    expect(index).toContain(
      `const ChartParts = {\n${defaultEntries.map(([key, exportName]) => `  ${key}: ${exportName},\n`).join("")}};`,
    );
    expect(index).toContain("export default ChartParts;");
    expect(index).toMatch(
      /export \{ defineChartModule, isChartIcon \} from "@starwind-ui\/svelte\/chart";/,
    );
    const container = await readFile(path.join(styledSource, "ChartContainer.svelte"), "utf8");
    expect(container).toContain('import type { ChartValue } from "@tanstack/charts";');
    expect(container).toContain(
      "bind:visible={() => commandVisible, (next) => { visible = next; }}",
    );
    expect(container).not.toContain("<style");
  });

  it("server-renders the container and legend, then hydrates without a second SVG", async () => {
    const root = await createHarness();
    const ssr = await createProofServer(root, true);
    servers.push(ssr);
    const app = await ssr.ssrLoadModule("/App.svelte");
    const { render } = await ssr.ssrLoadModule("svelte/server");
    const html = render(app.default).body;
    expect(render(app.default).body).toBe(html);
    expect(html).toContain('data-slot="chart"');
    expect(html).toMatch(/data-chart="chart-[a-zA-Z0-9_-]+"/);
    expect(html).toContain('data-slot="chart-legend"');
    expect(html.match(/data-slot="chart-legend-item"/g)).toHaveLength(2);
    expect(html.match(/<svg[^>]*class="ts-chart/g)).toHaveLength(1);

    await writeFile(
      path.join(root, "index.html"),
      `<!doctype html><html><body><div id="app" style="width:600px">${html}</div><script type="module" src="/main.ts"></script></body></html>`,
      "utf8",
    );
    const server = await createProofServer(root, false);
    servers.push(server);
    await server.listen();
    const browser = await chromium.launch({ channel: "chrome", headless: true });
    browsers.push(browser);
    const page = await browser.newPage();
    const messages: string[] = [];
    page.on("console", (message) => {
      if (
        (message.type() === "error" || message.type() === "warning") &&
        !message.text().includes("Failed to load resource")
      )
        messages.push(message.text());
    });
    page.on("pageerror", (error) => messages.push(error.message));
    await page.goto(server.resolvedUrls!.local[0]!);
    await page.waitForFunction(() => document.documentElement.dataset.result !== undefined);
    const result = JSON.parse(
      await page.evaluate(() => document.documentElement.dataset.result!),
    ) as Record<string, unknown>;

    expect(messages).toEqual([]);
    expect(result).toEqual({
      error: undefined,
      sameSvg: true,
      svgCount: 1,
      sameId: true,
      state: "active",
      visible: ["mobile"],
      pressed: "false",
      bars: 3,
    });
  }, 120_000);
});

async function createHarness(): Promise<string> {
  const root = await mkdtemp(path.join(repo, ".svelte-styled-chart-"));
  roots.push(root);
  await mkdir(path.join(root, "primitive/_internal"), { recursive: true });
  await cp(path.join(repo, "packages/svelte/src/chart"), path.join(root, "primitive/chart"), {
    recursive: true,
  });
  await cp(
    path.join(repo, "packages/svelte/src/_internal/ref-attachment.ts"),
    path.join(root, "primitive/_internal/ref-attachment.ts"),
  );
  await cp(styledSource, path.join(root, "chart"), { recursive: true });
  await writeFile(path.join(root, "App.svelte"), APP_SOURCE, "utf8");
  await writeFile(path.join(root, "main.ts"), MAIN_SOURCE, "utf8");
  return root;
}

async function createProofServer(root: string, middlewareMode: boolean): Promise<ViteDevServer> {
  return createServer({
    appType: middlewareMode ? "custom" : "spa",
    configFile: false,
    cacheDir: path.join(root, middlewareMode ? ".vite-ssr" : ".vite-browser"),
    logLevel: "silent",
    plugins: [svelte()],
    resolve: {
      alias: {
        "@starwind-ui/runtime/chart": path.join(
          repo,
          "packages/runtime/src/components/chart/index.ts",
        ),
        "@starwind-ui/svelte/chart": path.join(root, "primitive/chart/index.ts"),
        "tailwind-variants": path.join(
          repo,
          "apps/svelte-demo/node_modules/tailwind-variants/dist/index.js",
        ),
      },
    },
    root,
    server: middlewareMode
      ? { middlewareMode: true, watch: null, hmr: false }
      : {
          host: "127.0.0.1",
          port: 0,
          strictPort: false,
          watch: null,
          hmr: false,
          fs: { allow: [repo] },
        },
    ssr: { noExternal: [/@tanstack\/charts/] },
  });
}

const APP_SOURCE = String.raw`<script lang="ts">
  import { ChartContainer, ChartLegend, type ChartConfig } from "./chart/index";
  import { visitorBars, visitorConfig, visitorData } from "${fixtures}";
  let visible = $state<string[] | undefined>(undefined);
  export function readVisible() { return visible; }
</script>

<ChartContainer chart={visitorBars} data={visitorData()} config={visitorConfig as ChartConfig} bind:visible>
  <ChartLegend />
</ChartContainer>
`;

const MAIN_SOURCE = String.raw`import { flushSync, hydrate } from "svelte";
import App from "./App.svelte";
const settle = async () => { flushSync(); await new Promise((resolve) => setTimeout(resolve, 50)); flushSync(); };
void (async () => { try {
  const target = document.querySelector("#app")!;
  const svg = target.querySelector("svg.ts-chart");
  const id = target.querySelector<HTMLElement>("[data-slot=chart]")!.dataset.chart;
  const app = hydrate(App, { target }) as unknown as { readVisible(): string[] | undefined };
  await settle();
  const root = target.querySelector<HTMLElement>("[data-slot=chart]")!;
  const desktop = target.querySelector<HTMLButtonElement>('[data-slot=chart-legend-item][data-key="desktop"]')!;
  desktop.click();
  await settle();
  document.documentElement.dataset.result = JSON.stringify({
    sameSvg: target.querySelector("svg.ts-chart") === svg,
    svgCount: target.querySelectorAll("svg.ts-chart").length,
    sameId: root.dataset.chart === id,
    state: root.dataset.state,
    visible: app.readVisible(),
    pressed: desktop.getAttribute("aria-pressed"),
    bars: target.querySelectorAll('rect[data-ts-key^="visitors:"]').length,
  });
} catch (error) {
  document.documentElement.dataset.result = JSON.stringify({ error: error instanceof Error ? error.stack : String(error) });
} })();
`;
