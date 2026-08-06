import { copyFile, mkdir, mkdtemp, readdir, rm, writeFile } from "node:fs/promises";
import path from "node:path";

import { svelte } from "@sveltejs/vite-plugin-svelte";
import { chromium, type Browser } from "playwright";
import { render } from "svelte/server";
import { afterEach, describe, expect, it } from "vitest";
import { createServer, type ViteDevServer } from "vite";

const temporaryRoots: string[] = [];
const servers: ViteDevServer[] = [];
const browsers: Browser[] = [];

afterEach(async () => {
  await Promise.all(browsers.splice(0).map((browser) => browser.close()));
  await Promise.all(servers.splice(0).map((server) => server.close()));
  await Promise.all(
    temporaryRoots.splice(0).map((root) => rm(root, { force: true, recursive: true })),
  );
});

describe("generated Svelte Carousel lifecycle", () => {
  it("preserves SSR, hydration, option sync, callback replacement, remounts, isolation, and cleanup", async () => {
    const generatedRoot = await readFileSource("CarouselRoot.svelte");
    expect(generatedRoot).toContain("{@attach attachRuntime}");
    expect(generatedRoot).toMatch(/instance\.reInit\(options, nextPlugins\)/);
    expect(generatedRoot).toContain("return () => instance.destroy()");
    expect(globalThis).not.toHaveProperty("window");
    expect(globalThis).not.toHaveProperty("document");

    const root = await createHarness();
    const ssrServer = await createProofServer(root, true);
    servers.push(ssrServer);
    const appModule = await ssrServer.ssrLoadModule("/App.svelte");
    const firstRender = render(appModule.default).body;
    const secondRender = render(appModule.default).body;
    expect(secondRender).toBe(firstRender);
    expect(firstRender.match(/data-sw-carousel=""/g)).toHaveLength(3);
    expect(firstRender).toContain('data-auto-init="false"');
    expect(firstRender).toContain('aria-roledescription="carousel"');

    await writeFile(
      path.join(root, "index.html"),
      `<div id="app">${firstRender}</div><script type="module" src="/main.ts"></script>`,
      "utf8",
    );
    const browserServer = await createProofServer(root, false);
    servers.push(browserServer);
    await browserServer.listen();
    const browser = await chromium.launch({ channel: "chrome", headless: true });
    browsers.push(browser);
    const page = await browser.newPage();
    const messages: string[] = [];
    page.on("console", (message) => {
      if (message.type() === "error" || message.type() === "warning") messages.push(message.text());
    });
    const url = browserServer.resolvedUrls?.local[0];
    if (!url) throw new Error("Svelte Carousel proof server did not expose a local URL.");
    await page.goto(url);
    await page.waitForTimeout(3_000);
    const result = await page.evaluate(() =>
      JSON.parse(document.documentElement.dataset.svelteCarouselResult ?? "{}"),
    );

    expect(messages.filter((message) => !message.includes("Failed to load resource"))).toEqual([]);
    expect(result.error).toBeUndefined();
    expect(result).toMatchObject({
      axes: ["y", "x", "x"],
      callbackReplacement: { first: 1, second: 1 },
      dynamicSlides: ["One", "Two", "Three"],
      hydrationExact: true,
      imperativeMethod: { after: 1, before: 0 },
      isolated: true,
      refs: { first: true, second: true },
      refsAfterUnmount: { first: false, second: false },
      rootsAfterUnmount: 0,
    });
    expect(result.lifecycle.connects).toBe(4);
    expect(result.lifecycle.destroys).toBe(4);
    expect(result.lifecycle.reInits).toBeGreaterThanOrEqual(1);
    expect(result.lifecycle.pluginReInits).toBeGreaterThanOrEqual(1);
  }, 120_000);
});

async function readFileSource(file: string): Promise<string> {
  return import("node:fs/promises").then(({ readFile }) =>
    readFile(path.join(process.cwd(), "packages/svelte/src/carousel", file), "utf8"),
  );
}

async function createHarness(): Promise<string> {
  const root = await mkdtemp(path.join(process.cwd(), ".svelte-carousel-browser-"));
  temporaryRoots.push(root);
  const carouselRoot = path.join(root, "carousel");
  await mkdir(carouselRoot);
  for (const file of await readdir(path.join(process.cwd(), "packages/svelte/src/carousel"))) {
    await copyFile(
      path.join(process.cwd(), "packages/svelte/src/carousel", file),
      path.join(carouselRoot, file),
    );
  }
  const runtime = path
    .join(process.cwd(), "packages/runtime/src/components/carousel/carousel.ts")
    .replaceAll("\\", "/");
  await writeFile(
    path.join(root, "runtime.ts"),
    `import { createCarousel as createActualCarousel } from "${runtime}";
const proof = globalThis.__carouselLifecycle ??= { connects: 0, destroys: 0, pluginReInits: 0, reInits: 0 };
export function createCarousel(root, options) {
  proof.connects += 1;
  const instance = createActualCarousel(root, options);
  let destroyed = false;
  return new Proxy(instance, { get(target, property) {
    const value = Reflect.get(target, property);
    if (property === "destroy") return () => { if (!destroyed) { destroyed = true; proof.destroys += 1; } return target.destroy(); };
    if (property === "reInit") return (...args) => { proof.reInits += 1; if (args[1]?.length) proof.pluginReInits += 1; return target.reInit(...args); };
    return typeof value === "function" ? value.bind(target) : value;
  }});
}
export type * from "${runtime}";
`,
    "utf8",
  );
  await writeFile(path.join(root, "App.svelte"), APP_SOURCE, "utf8");
  await writeFile(path.join(root, "main.ts"), MAIN_SOURCE, "utf8");
  return root;
}

async function createProofServer(root: string, middlewareMode: boolean): Promise<ViteDevServer> {
  return createServer({
    appType: middlewareMode ? "custom" : "spa",
    configFile: false,
    logLevel: "silent",
    plugins: [svelte()],
    resolve: { alias: { "@starwind-ui/runtime/carousel": path.join(root, "runtime.ts") } },
    root,
    server: middlewareMode
      ? { middlewareMode: true }
      : { host: "127.0.0.1", port: 0, strictPort: false },
  });
}

const APP_SOURCE = String.raw`<script lang="ts">
  import { CarouselContainer, CarouselItem, CarouselNext, CarouselPrevious, CarouselRoot, CarouselViewport } from "./carousel/index";
  let orientation = $state<"horizontal" | "vertical">("horizontal");
  let opts = $state({ loop: false, duration: 1 });
  let plugins = $state<any[]>([]);
  let slides = $state(["One", "Two"]);
  let showConditional = $state(true);
  const calls = (globalThis as any).__carouselApiCalls ??= { first: 0, second: 0 };
  let api: any;
  let callback = $state<(nextApi: any) => void>((nextApi) => { api = nextApi; calls.first += 1; });
  const refs = (globalThis as any).__carouselRefs ??= { first: false, second: false };
  export function invokeApi() { const before = api.selectedScrollSnap(); api.scrollNext(true); return { before, after: api.selectedScrollSnap() }; }
  export function update() { orientation = "vertical"; opts = { loop: true, duration: 2 }; plugins = [{ name: "proof-plugin", options: {}, init() {}, destroy() {} }]; }
  export function addSlide() { slides = [...slides, "Three"]; }
  export function replaceCallback() { callback = (nextApi) => { api = nextApi; calls.second += 1; }; }
  export function removeConditional() { showConditional = false; }
  export function restoreConditional() { showConditional = true; }
  export function snapshot() { return { firstCalls: calls.first, secondCalls: calls.second }; }
</script>

<CarouselRoot {orientation} {opts} {plugins} setApi={callback} ref={(element) => refs.first = element !== null} data-case="first">
  <CarouselViewport style="overflow:hidden;width:300px"><CarouselContainer style="display:flex">{#each slides as slide (slide)}<CarouselItem style="flex:0 0 100%">{slide}</CarouselItem>{/each}</CarouselContainer></CarouselViewport>
  <CarouselPrevious>Previous</CarouselPrevious><CarouselNext>Next</CarouselNext>
</CarouselRoot>
<CarouselRoot ref={(element) => refs.second = element !== null} data-case="second"><CarouselViewport><CarouselContainer><CarouselItem>Other</CarouselItem></CarouselContainer></CarouselViewport></CarouselRoot>
{#if showConditional}<CarouselRoot data-case="conditional"><CarouselViewport><CarouselContainer><CarouselItem>Conditional</CarouselItem></CarouselContainer></CarouselViewport></CarouselRoot>{/if}
`;

const MAIN_SOURCE = String.raw`import { flushSync, hydrate, unmount } from "svelte";
import App from "./App.svelte";
const tick = async () => { flushSync(); await new Promise((resolve) => setTimeout(resolve, 0)); flushSync(); };
void (async () => { try {
  const target = document.querySelector("#app");
  const before = Array.from(target.querySelectorAll("[data-sw-part]"), (node) => node.getAttribute("data-sw-part")).join("|");
  const instance = hydrate(App, { target }); await tick();
  const after = Array.from(target.querySelectorAll("[data-sw-part]"), (node) => node.getAttribute("data-sw-part")).join("|");
  const imperativeMethod = instance.invokeApi(); await tick();
  instance.update(); await tick();
  instance.addSlide(); await tick();
  instance.replaceCallback(); await tick();
  instance.removeConditional(); await tick();
  instance.restoreConditional(); await tick();
  const axes = Array.from(target.querySelectorAll("[data-sw-carousel]"), (node) => node.getAttribute("data-axis"));
  const isolated = target.querySelector('[data-case="second"]').getAttribute("data-axis") === "x";
  const callbackReplacement = { first: instance.snapshot().firstCalls, second: instance.snapshot().secondCalls };
  const dynamicSlides = Array.from(target.querySelectorAll('[data-case="first"] [data-sw-carousel-item]'), (node) => node.textContent);
  const lifecycle = globalThis.__carouselLifecycle;
  const refs = { ...globalThis.__carouselRefs };
  await unmount(instance); await tick();
  document.documentElement.dataset.svelteCarouselResult = JSON.stringify({ axes, callbackReplacement, dynamicSlides, hydrationExact: before === after, imperativeMethod, isolated, lifecycle, refs, refsAfterUnmount: globalThis.__carouselRefs, rootsAfterUnmount: target.querySelectorAll("[data-sw-carousel]").length });
} catch (error) { document.documentElement.dataset.svelteCarouselResult = JSON.stringify({ error: error instanceof Error ? error.stack : String(error) }); } })();
`;
