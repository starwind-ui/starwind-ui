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
  await mkdir(path.join(root, "_internal"));
  await copyFile(
    path.join(process.cwd(), "packages/svelte/src/_internal/ref-attachment.ts"),
    path.join(root, "_internal/ref-attachment.ts"),
  );
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
    // Concurrent proof servers must own their optimized dependencies.
    cacheDir: path.join(root, middlewareMode ? ".vite-ssr" : ".vite-browser"),
    configFile: false,
    logLevel: "silent",
    plugins: [svelte()],
    resolve: { alias: { "@starwind-ui/runtime/accordion": path.join(root, "runtime.ts") } },
    root,
    server: middlewareMode
      ? { middlewareMode: true, watch: null, hmr: false }
      : { host: "127.0.0.1", port: 0, strictPort: false, watch: null, hmr: false },
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

type AccordionModelValue = string | string[] | null;
type AccordionModelCase = {
  id: string;
  mode: "omitted" | "plain" | "bound" | "function";
  initialValue?: AccordionModelValue;
  defaultValue?: AccordionModelValue;
  type?: "single" | "multiple";
  setter?: "identity" | "retain" | "transform";
  proposal?:
    | "accept"
    | "cancel"
    | "command-cancel"
    | "two-commands"
    | "type"
    | "type-cancel"
    | "type-command-cancel"
    | "unmount";
};

async function runAccordionModelCases(
  configs: AccordionModelCase[],
  actions: string,
): Promise<any> {
  const directory = await createHarness();
  await writeFile(path.join(directory, "ModelCase.svelte"), MODEL_CASE_SOURCE, "utf8");
  await writeFile(
    path.join(directory, "App.svelte"),
    `<script lang="ts">
import ModelCase from "./ModelCase.svelte";
const configs = ${JSON.stringify(configs)};
const cases: Record<string, any> = {};
export function getCases() { return cases; }
</script>
{#each configs as config (config.id)}<ModelCase {...config} bind:this={cases[config.id]} />{/each}`,
    "utf8",
  );
  const ssrServer = await createProofServer(directory, true);
  servers.push(ssrServer);
  const appModule = await ssrServer.ssrLoadModule("/App.svelte");
  const renderer = await ssrServer.ssrLoadModule("svelte/server");
  const serverMarkup = renderer.render(appModule.default).body;
  expect(globalThis).not.toHaveProperty("window");
  expect(globalThis).not.toHaveProperty("document");
  await writeFile(
    path.join(directory, "index.html"),
    `<link rel="icon" href="data:,"><div id="app">${serverMarkup}</div><script type="module" src="/main.ts"></script>`,
    "utf8",
  );
  await writeFile(
    path.join(directory, "main.ts"),
    `import { hydrate, flushSync, tick, unmount } from "svelte";
import App from "./App.svelte";
try {
  const app = hydrate(App, { target: document.querySelector("#app")! });
  const settle = async () => { flushSync(); await tick(); flushSync(); };
  await settle();
  const cases = app.getCases();
  const root = (id) => document.querySelector('[data-case="' + id + '"]');
  const click = (id, value = "beta") => root(id)?.querySelector('[data-model-trigger="' + value + '"]')?.click();
  const state = (id) => {
    const element = root(id);
    return { ...cases[id].snapshot(), exists: Boolean(element),
      runtime: element ? globalThis.__accordionInstances.get(element)?.getValue() : null,
      rendered: element ? JSON.parse(element.querySelector("[data-model-rendered]").textContent) : null,
      type: element?.getAttribute("data-type") ?? null,
      collapsible: element?.getAttribute("data-collapsible") ?? null,
      expanded: Array.from(element?.querySelectorAll('[aria-expanded="true"][data-model-trigger]') ?? []).map((node) => node.getAttribute("data-model-trigger")),
    };
  };
  const result = await (async () => { ${actions} })();
  const live = globalThis.__accordionLifecycle.connects - globalThis.__accordionLifecycle.destroys;
  await unmount(app);
  await settle();
  document.documentElement.dataset.svelteAccordionResult = JSON.stringify({ ...result, live, cleanup: globalThis.__accordionLifecycle });
} catch (error) { document.documentElement.dataset.svelteAccordionResult = JSON.stringify({ error: String(error), stack: error.stack }); }
`,
    "utf8",
  );
  const server = await createProofServer(directory, false);
  servers.push(server);
  await server.listen();
  const browser = await chromium.launch({ channel: "chrome", headless: true });
  browsers.push(browser);
  const page = await browser.newPage();
  const messages: string[] = [];
  page.on("console", (message) => {
    if (message.type() === "error" || message.type() === "warning") messages.push(message.text());
  });
  page.on("pageerror", (error) => messages.push(error.message));
  const url = server.resolvedUrls?.local[0];
  if (!url) throw new Error("Missing Accordion model proof URL.");
  await page.goto(url);
  await page.waitForFunction(() => document.documentElement.dataset.svelteAccordionResult);
  const result = await page.evaluate(() =>
    JSON.parse(document.documentElement.dataset.svelteAccordionResult ?? "{}"),
  );
  expect(messages).toEqual([]);
  expect(result).not.toHaveProperty("error");
  expect(result.cleanup.connects).toBe(result.cleanup.destroys);
  return {
    ...result,
    serverMarkup,
    cacheDirs: [ssrServer.config.cacheDir, server.config.cacheDir],
  };
}

const MODEL_CASE_SOURCE = String.raw`<script lang="ts">
import { flushSync, untrack } from "svelte";
import { AccordionRoot, AccordionItem, AccordionTrigger, AccordionPanel } from "./accordion/index";
let { id, mode, initialValue, defaultValue, type: initialType = "single", setter = "identity", proposal = "accept" } = $props();
let model = $state<string | string[] | null | undefined>(untrack(() => initialValue));
let seed = $state<string | string[] | null | undefined>(untrack(() => defaultValue));
let type = $state<"single" | "multiple">(untrack(() => initialType));
let collapsible = $state(true);
let shown = $state(true);
const initialArray = untrack(() => Array.isArray(model) ? model : undefined);
const writes: any[] = [];
const callbacks: any[] = [];
let lastProposal: unknown;
let lastPublication: unknown;
const copy = (next) => Array.isArray(next) ? [...next] : next;
function handleProposal(next, detail) {
  lastProposal = next;
  callbacks.push({ next: copy(next), previous: copy(model) });
  if (proposal === "cancel") detail.cancel();
  if (proposal === "command-cancel") { model = ["gamma"]; flushSync(); detail.cancel(); }
  if (proposal === "two-commands") { model = next; flushSync(); model = ["gamma"]; flushSync(); }
  if (proposal.startsWith("type")) { type = "single"; collapsible = false; flushSync(); }
  if (proposal === "type-command-cancel") { model = ["gamma"]; flushSync(); }
  if (proposal.endsWith("cancel")) detail.cancel();
  if (proposal === "unmount") { shown = false; flushSync(); }
}
function publish(next) {
  writes.push(copy(next));
  lastPublication = next;
  if (setter === "identity") model = next;
  else if (setter === "transform") {
    if (Array.isArray(next)) { next.splice(0, next.length, "gamma"); model = next; }
    else model = "gamma";
  }
}
export function setModel(next: string | string[] | null | undefined) { model = next; }
export function setType(next: "single" | "multiple") { type = next; }
export function setCollapsible(next: boolean) { collapsible = next; }
export function setDefault(next: string | string[] | null | undefined) { seed = next; }
export function mutateDefault() { if (Array.isArray(seed)) seed.push("gamma"); }
export function snapshot() { return {
  model: model === undefined ? "undefined" : copy(model), writes: writes.map(copy), callbacks: [...callbacks],
  initialArray: initialArray ? [...initialArray] : null,
  publicationAliasedProposal: lastPublication !== undefined && lastPublication === lastProposal,
}; }
</script>
{#snippet parts(accepted)}
  <output data-model-rendered={id}>{JSON.stringify(accepted)}</output>
  {#each ["alpha", "beta", "gamma", ""] as item (item)}
    <AccordionItem value={item}><AccordionTrigger data-model-trigger={item}>{item || "Empty"}</AccordionTrigger><AccordionPanel>{item} panel</AccordionPanel></AccordionItem>
  {/each}
{/snippet}
{#if shown}
  {#if mode === "omitted"}
    <AccordionRoot data-case={id} {type} {collapsible} defaultValue={seed} onValueChange={handleProposal} children={parts} />
  {:else if mode === "plain"}
    <AccordionRoot data-case={id} {type} {collapsible} value={model} defaultValue={seed} onValueChange={handleProposal} children={parts} />
  {:else if mode === "function"}
    <AccordionRoot data-case={id} {type} {collapsible} bind:value={() => model, publish} defaultValue={seed} onValueChange={handleProposal} children={parts} />
  {:else}
    <AccordionRoot data-case={id} {type} {collapsible} bind:value={model} defaultValue={seed} onValueChange={handleProposal} children={parts} />
  {/if}
{/if}
<output data-model-ssr={id}>{JSON.stringify(model) ?? "undefined"}:{writes.length}</output>`;

describe("Accordion accepted models", () => {
  it("keeps concurrent fixture dependency caches separate", async () => {
    const results = await Promise.all(
      ["first", "second"].map((id) =>
        runAccordionModelCases(
          [{ id, mode: "function", initialValue: "alpha" }],
          `const id=Object.keys(cases)[0]; click(id); await settle(); return {accepted:state(id)};`,
        ),
      ),
    );
    const cacheDirs = results.flatMap((result) => result.cacheDirs);
    expect(new Set(cacheDirs).size).toBe(cacheDirs.length);
    for (const result of results)
      expect(result.accepted).toMatchObject({
        model: "beta",
        runtime: "beta",
        expanded: ["beta"],
        writes: ["beta"],
      });
  }, 60_000);
  it("initializes undefined models, normalizes shapes, and retains state for ordinary props", async () => {
    const result = await runAccordionModelCases(
      [
        { id: "component", mode: "omitted", type: "multiple" },
        { id: "undefined", mode: "function", type: "multiple", defaultValue: ["alpha", "alpha"] },
        { id: "bound", mode: "bound", type: "multiple", defaultValue: "beta" },
        { id: "plain", mode: "plain", initialValue: "alpha" },
        {
          id: "array-single",
          mode: "function",
          initialValue: ["alpha", "beta"],
          defaultValue: "gamma",
        },
        { id: "null", mode: "function", initialValue: null, defaultValue: "alpha" },
        { id: "empty-array", mode: "function", initialValue: [] },
        { id: "empty-string", mode: "function", initialValue: "" },
      ],
      `
      const initial = Object.fromEntries(Object.keys(cases).map((id) => [id, state(id)]));
      click("plain"); await settle(); const plainAccepted = state("plain");
      cases.plain.setModel(undefined); await settle(); const plainUndefined = state("plain");
      cases.plain.setModel("gamma"); await settle(); const plainCommand = state("plain");
      cases.undefined.setModel(undefined); await settle(); const undefinedLater = state("undefined");
      cases.bound.setModel(["beta"]); await settle();
      return { initial, plainAccepted, plainUndefined, plainCommand, undefinedLater, bound: state("bound") };
    `,
    );
    expect(result.initial.component).toMatchObject({ runtime: [], rendered: [], callbacks: [] });
    expect(result.initial.undefined).toMatchObject({
      model: ["alpha"],
      runtime: ["alpha"],
      writes: [["alpha"]],
    });
    expect(result.initial.bound).toMatchObject({ model: ["beta"], runtime: ["beta"] });
    expect(result.initial["array-single"]).toMatchObject({
      model: "alpha",
      runtime: "alpha",
      writes: ["alpha"],
      initialArray: ["alpha", "beta"],
    });
    expect(result.initial.null).toMatchObject({ model: null, runtime: null, writes: [] });
    expect(result.initial["empty-array"]).toMatchObject({
      model: null,
      runtime: null,
      writes: [null],
      initialArray: [],
    });
    expect(result.initial["empty-string"]).toMatchObject({
      model: "",
      runtime: "",
      expanded: [""],
    });
    expect(result.plainAccepted).toMatchObject({
      model: "alpha",
      runtime: "beta",
      rendered: "beta",
      expanded: ["beta"],
    });
    expect(result.plainUndefined).toMatchObject({ model: "undefined", runtime: "beta" });
    expect(result.plainCommand).toMatchObject({ model: "gamma", runtime: "gamma" });
    expect(result.undefinedLater).toMatchObject({ model: "undefined", runtime: ["alpha"] });
    expect(result.serverMarkup).toContain('data-model-ssr="undefined">undefined:0');
    expect(result.serverMarkup).toContain('data-model-rendered="array-single">["alpha","beta"]');
  }, 60_000);

  it("handles ordinary callback and DOM cancellation plus later parent commands", async () => {
    const result = await runAccordionModelCases(
      [
        {
          id: "callback",
          mode: "function",
          type: "multiple",
          initialValue: ["alpha"],
          proposal: "cancel",
        },
        { id: "dom", mode: "function", type: "multiple", initialValue: ["alpha"] },
        {
          id: "unmount",
          mode: "function",
          type: "multiple",
          initialValue: ["alpha"],
          proposal: "unmount",
        },
        { id: "after-accepted", mode: "function", type: "multiple", initialValue: ["alpha"] },
      ],
      `
      const observed = [];
      root("dom").addEventListener("starwind:value-change", (event) => { observed.push(cases.dom.snapshot().model); event.preventDefault(); });
      for (const id of Object.keys(cases)) { click(id); if (id === "after-accepted") { cases[id].setModel(["gamma"]); flushSync(); } await settle(); }
      return { observed, states: Object.fromEntries(Object.keys(cases).map((id) => [id, state(id)])) };
    `,
    );
    expect(result.observed).toEqual([["alpha"]]);
    for (const id of ["callback", "dom"])
      expect(result.states[id]).toMatchObject({
        model: ["alpha"],
        runtime: ["alpha"],
        writes: [],
        expanded: ["alpha"],
      });
    expect(result.states.unmount).toMatchObject({ exists: false, model: ["alpha"], writes: [] });
    expect(result.states["after-accepted"]).toMatchObject({
      model: ["gamma"],
      runtime: ["gamma"],
      writes: [["alpha", "beta"]],
      expanded: ["gamma"],
    });
  }, 60_000);

  it("normalizes ordinary parent mode changes", async () => {
    const result = await runAccordionModelCases(
      [
        {
          id: "mode",
          mode: "function",
          type: "multiple",
          initialValue: ["alpha"],
          defaultValue: ["gamma"],
        },
      ],
      `
      click("mode", "beta"); await settle(); click("mode", "alpha"); await settle();
      const accepted = state("mode"); cases.mode.setType("single"); await settle();
      const single = state("mode"); cases.mode.setType("multiple"); await settle();
      const multiple = state("mode"); cases.mode.setCollapsible(false); await settle();
      return { accepted, single, multiple, afterCollapsible: state("mode") };
    `,
    );
    expect(result.accepted).toMatchObject({ model: ["beta"], runtime: ["beta"] });
    expect(result.single).toMatchObject({
      model: "beta",
      runtime: "beta",
      initialArray: ["alpha"],
    });
    expect(result.multiple).toMatchObject({
      model: ["beta"],
      runtime: ["beta"],
    });
    expect(result.afterCollapsible).toMatchObject({
      model: ["beta"],
      runtime: ["beta"],
      type: "multiple",
      collapsible: "false",
    });
    expect(result.live).toBe(1);
  }, 60_000);
});
