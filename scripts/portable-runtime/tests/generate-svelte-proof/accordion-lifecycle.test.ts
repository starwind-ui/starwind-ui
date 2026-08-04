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

describe("generated Svelte Accordion lifecycle", () => {
  it("preserves SSR, hydration, cancellation, dynamic items, nested roots, and cleanup", async () => {
    expect(globalThis).not.toHaveProperty("window");
    expect(globalThis).not.toHaveProperty("document");
    const root = await createHarness();
    const ssrServer = await createProofServer(root, true);
    servers.push(ssrServer);
    const appModule = await ssrServer.ssrLoadModule("/App.svelte");
    const [firstRender, secondRender] = await Promise.all([
      Promise.resolve(render(appModule.default).body),
      Promise.resolve(render(appModule.default).body),
    ]);
    expect(secondRender).toBe(firstRender);
    expect(firstRender).toContain("data-sw-accordion");
    expect(firstRender).toContain('aria-expanded="false"');
    expect(globalThis).not.toHaveProperty("window");
    expect(globalThis).not.toHaveProperty("document");

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
    if (!url) throw new Error("Svelte Accordion proof server did not expose a local URL.");
    await page.goto(url);
    await page.waitForFunction(
      () => document.documentElement.dataset.svelteAccordionResult,
      undefined,
      { timeout: 20_000 },
    );
    const result = await page.evaluate(() =>
      JSON.parse(document.documentElement.dataset.svelteAccordionResult ?? "{}"),
    );

    expect(messages.filter((message) => !message.includes("Failed to load resource"))).toEqual([]);
    expect(result.error).toBeUndefined();
    expect(result).toMatchObject({
      accepted: { binding: "beta", callbackCount: 2, callbackSawPreviousBinding: true },
      canceled: { binding: "alpha", callbackCount: 1, alphaExpanded: "true" },
      disabledCallbackCount: 2,
      dynamic: {
        added: { gammaExpanded: "true", gammaHidden: false, value: ["alpha", "gamma"] },
        removed: { gammaPanelPresent: false, gammaTriggerPresent: false, value: ["alpha"] },
        remounted: { gammaExpanded: "false", gammaHidden: true, value: ["alpha"] },
        reopened: { gammaExpanded: "true", gammaHidden: false, value: ["alpha", "gamma"] },
      },
      hydrationExact: true,
      nested: { innerExpanded: "true", outerExpanded: "true" },
      panelStyle: { animationName: "none", consumerProperty: "kept" },
      rootCountAfterUnmount: 0,
    });
    expect(result.lifecycle.connects).toBe(result.lifecycle.destroys);
    expect(result.lifecycle.connects).toBeGreaterThanOrEqual(4);
  }, 120_000);
});

async function createHarness(): Promise<string> {
  const root = await mkdtemp(path.join(process.cwd(), ".svelte-accordion-browser-"));
  temporaryRoots.push(root);
  const accordionRoot = path.join(root, "accordion");
  await mkdir(accordionRoot);
  for (const file of await readdir(path.join(process.cwd(), "packages/svelte/src/accordion"))) {
    await copyFile(
      path.join(process.cwd(), "packages/svelte/src/accordion", file),
      path.join(accordionRoot, file),
    );
  }
  const runtime = path
    .join(process.cwd(), "packages/runtime/src/components/accordion/accordion.ts")
    .replaceAll("\\", "/");
  await writeFile(
    path.join(root, "runtime.ts"),
    `import { createAccordion as createActualAccordion } from "${runtime}";
const proof = globalThis.__accordionLifecycle ??= { connects: 0, destroys: 0, setValue: 0 };
const instances = globalThis.__accordionInstances ??= new WeakMap();
export function createAccordion(root, options) {
  proof.connects += 1;
  const instance = createActualAccordion(root, options);
  const proxy = new Proxy(instance, { get(target, property) {
    const value = Reflect.get(target, property);
    if (property === "destroy") return () => { proof.destroys += 1; instances.delete(root); return target.destroy(); };
    if (property === "setValue") return (...args) => { proof.setValue += 1; return target.setValue(...args); };
    return typeof value === "function" ? value.bind(target) : value;
  }});
  instances.set(root, proxy);
  return proxy;
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
    resolve: { alias: { "@starwind-ui/runtime/accordion": path.join(root, "runtime.ts") } },
    root,
    server: middlewareMode
      ? { middlewareMode: true }
      : { host: "127.0.0.1", port: 0, strictPort: false },
  });
}

const APP_SOURCE = String.raw`<script lang="ts">
  import { AccordionHeader, AccordionItem, AccordionPanel, AccordionRoot, AccordionTrigger } from "./accordion/index";
  let controlled = $state<string | string[] | null>("alpha");
  let cancel = $state(true);
  let callbackCount = $state(0);
  let callbackSawPreviousBinding = $state(false);
  let dynamic = $state(["alpha", "beta"]);
  function onValueChange(next, detail) {
    callbackCount += 1;
    callbackSawPreviousBinding = controlled === detail.previousValue;
    if (cancel) detail.cancel();
  }
  export function accept() { cancel = false; }
  export function addGamma() { dynamic = [...dynamic, "gamma"]; }
  export function removeGamma() { dynamic = dynamic.filter((item) => item !== "gamma"); }
  export function remountGamma() { dynamic = [...dynamic, "gamma"]; }
  export function snapshot() { return { callbackCount, callbackSawPreviousBinding, controlled }; }
</script>

<AccordionRoot bind:value={controlled} onValueChange={onValueChange} data-case="controlled">
  <AccordionItem value="alpha"><AccordionHeader><AccordionTrigger data-trigger="alpha">Alpha</AccordionTrigger></AccordionHeader><AccordionPanel data-panel="consumer-style" style="--consumer-panel: kept">Alpha panel</AccordionPanel></AccordionItem>
  <AccordionItem value="beta"><AccordionHeader><AccordionTrigger data-trigger="beta">Beta</AccordionTrigger></AccordionHeader><AccordionPanel>Beta panel</AccordionPanel></AccordionItem>
  <AccordionItem value="disabled" disabled><AccordionHeader><AccordionTrigger data-trigger="disabled">Disabled</AccordionTrigger></AccordionHeader><AccordionPanel>Disabled panel</AccordionPanel></AccordionItem>
</AccordionRoot>

<AccordionRoot type="multiple" defaultValue={["alpha"]} data-case="dynamic">
  {#each dynamic as item (item)}
    <AccordionItem value={item}><AccordionHeader><AccordionTrigger data-dynamic={item}>{item}</AccordionTrigger></AccordionHeader><AccordionPanel>{item} panel</AccordionPanel></AccordionItem>
  {/each}
</AccordionRoot>

<AccordionRoot defaultValue="outer" data-case="outer">
  <AccordionItem value="outer"><AccordionHeader><AccordionTrigger data-trigger="outer">Outer</AccordionTrigger></AccordionHeader><AccordionPanel>
    <AccordionRoot defaultValue="inner-a" data-case="inner">
      <AccordionItem value="inner-a"><AccordionHeader><AccordionTrigger data-trigger="inner-a">Inner A</AccordionTrigger></AccordionHeader><AccordionPanel>A</AccordionPanel></AccordionItem>
      <AccordionItem value="inner-b"><AccordionHeader><AccordionTrigger data-trigger="inner-b">Inner B</AccordionTrigger></AccordionHeader><AccordionPanel>B</AccordionPanel></AccordionItem>
    </AccordionRoot>
  </AccordionPanel></AccordionItem>
</AccordionRoot>
`;

const MAIN_SOURCE = String.raw`import { flushSync, hydrate, unmount } from "svelte";
import App from "./App.svelte";
const query = (selector) => document.querySelector(selector);
const tick = async () => { flushSync(); await new Promise((resolve) => setTimeout(resolve, 0)); flushSync(); };
void (async () => { try {
  const target = query("#app");
  const beforeParts = Array.from(target.querySelectorAll("[data-sw-part]")).map((node) => node.getAttribute("data-sw-part")).join("|");
  const instance = hydrate(App, { target });
  await tick();
  const consumerPanel = query('[data-panel="consumer-style"]');
  const panelStyle = { animationName: consumerPanel?.style.animationName, consumerProperty: consumerPanel?.style.getPropertyValue("--consumer-panel").trim() };
  const afterParts = Array.from(target.querySelectorAll("[data-sw-part]")).map((node) => node.getAttribute("data-sw-part")).join("|");
  query('[data-trigger="beta"]')?.click(); await tick();
  let snapshot = instance.snapshot();
  const canceled = { binding: snapshot.controlled, callbackCount: snapshot.callbackCount, alphaExpanded: query('[data-trigger="alpha"]')?.getAttribute("aria-expanded") };
  instance.accept(); query('[data-trigger="beta"]')?.click(); await tick();
  snapshot = instance.snapshot();
  const accepted = { binding: snapshot.controlled, callbackCount: snapshot.callbackCount, callbackSawPreviousBinding: snapshot.callbackSawPreviousBinding };
  query('[data-trigger="disabled"]')?.click(); await tick();
  const disabledCallbackCount = instance.snapshot().callbackCount;
  instance.addGamma(); await tick(); query('[data-dynamic="gamma"]')?.click(); await tick();
  const dynamicRoot = query('[data-case="dynamic"]');
  const dynamicValue = () => globalThis.__accordionInstances.get(dynamicRoot)?.getValue();
  const dynamicAdded = { gammaExpanded: query('[data-dynamic="gamma"]')?.getAttribute("aria-expanded"), gammaHidden: query('[data-dynamic="gamma"]')?.closest('[data-sw-accordion-item]')?.querySelector('[data-sw-accordion-content]')?.hidden, value: dynamicValue() };
  instance.removeGamma(); await tick();
  const dynamicRemoved = { gammaPanelPresent: Boolean(dynamicRoot?.querySelector('[data-sw-accordion-item][data-value="gamma"] [data-sw-accordion-content]')), gammaTriggerPresent: Boolean(query('[data-dynamic="gamma"]')), value: dynamicValue() };
  instance.remountGamma(); await tick();
  const remountedGammaTrigger = query('[data-dynamic="gamma"]');
  const remountedGammaPanel = remountedGammaTrigger?.closest('[data-sw-accordion-item]')?.querySelector('[data-sw-accordion-content]');
  const dynamicRemounted = { gammaExpanded: remountedGammaTrigger?.getAttribute("aria-expanded"), gammaHidden: remountedGammaPanel?.hidden, value: dynamicValue() };
  remountedGammaTrigger?.click(); await tick();
  const dynamicReopened = { gammaExpanded: remountedGammaTrigger?.getAttribute("aria-expanded"), gammaHidden: remountedGammaPanel?.hidden, value: dynamicValue() };
  query('[data-trigger="inner-b"]')?.click(); await tick();
  const nested = { innerExpanded: query('[data-trigger="inner-b"]')?.getAttribute("aria-expanded"), outerExpanded: query('[data-trigger="outer"]')?.getAttribute("aria-expanded") };
  const lifecycle = globalThis.__accordionLifecycle;
  await unmount(instance);
  document.documentElement.dataset.svelteAccordionResult = JSON.stringify({ accepted, canceled, disabledCallbackCount, dynamic: { added: dynamicAdded, removed: dynamicRemoved, remounted: dynamicRemounted, reopened: dynamicReopened }, hydrationExact: beforeParts === afterParts, lifecycle, nested, panelStyle, rootCountAfterUnmount: target.querySelectorAll("[data-sw-accordion]").length });
} catch (error) { document.documentElement.dataset.svelteAccordionResult = JSON.stringify({ error: error instanceof Error ? error.stack : String(error) }); } })();
`;
