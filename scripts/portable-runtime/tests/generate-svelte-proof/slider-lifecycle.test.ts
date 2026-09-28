import { copyFile, mkdir, mkdtemp, readdir, readFile, rm, writeFile } from "node:fs/promises";
import path from "node:path";

import { svelte } from "@sveltejs/vite-plugin-svelte";
import { type Browser, chromium } from "playwright";
import { render } from "svelte/server";
import { createServer, type ViteDevServer } from "vite";
import { afterEach, describe, expect, it } from "vitest";

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

describe("generated Svelte Slider lifecycle", () => {
  it("preserves Slider state, forms, geometry delegation, identity, SSR, and cleanup", async () => {
    const generatedRoot = await readFile(
      path.join(process.cwd(), "packages/svelte/src/slider/SliderRoot.svelte"),
      "utf8",
    );

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
    expect(firstRender).toContain("data-sw-slider");
    expect(firstRender).toContain('data-default-value="[20,80]"');
    expect(firstRender.match(/data-sw-slider-input/g)?.length).toBe(9);
    expect(globalThis).not.toHaveProperty("window");
    expect(globalThis).not.toHaveProperty("document");

    await writeFile(
      path.join(root, "index.html"),
      `<form id="form-a"></form><form id="form-b"></form><form id="reset-form"></form><form id="scalar-form"></form><div id="app">${firstRender}</div><script type="module" src="/main.ts"></script>`,
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
    if (!url) throw new Error("Svelte Slider proof server did not expose a local URL.");
    await page.goto(url);
    await page.waitForFunction(
      () => document.documentElement.dataset.svelteSliderResult,
      undefined,
      { timeout: 20_000 },
    );
    const result = await page.evaluate(() =>
      JSON.parse(document.documentElement.dataset.svelteSliderResult ?? "{}"),
    );

    expect(messages.filter((message) => !message.includes("Failed to load resource"))).toEqual([]);
    expect(result.error).toBeUndefined();
    expect(result).toMatchObject({
      accepted: {
        binding: [21, 80],
        events: ["change:[21,80]:binding:[20,80]", "commit:[21,80]:binding:[21,80]"],
        value: [21, 80],
      },
      canceled: {
        binding: [20, 80],
        events: ["change:[21,80]:binding:[20,80]"],
        value: [20, 80],
      },
      controlledReset: { after: [20, 80], before: [20, 70, 80] },
      controlledSync: { inputValues: [25, 55, 85], value: [25, 55, 85] },
      disabled: { disabled: true, unchanged: true },
      dynamic: {
        identities: ["first", "second", null],
        inputNames: ["price[0]", "price[1]", "price[2]"],
        inputValues: ["20", "50", "80"],
        value: [20, 50, 80],
      },
      field: { disabled: true, name: "field-range" },
      formMove: { oldValues: [], values: ["20", "70", "80"] },
      hydrationExact: true,
      nested: { inner: 11, outer: 40 },
      options: {
        largeStep: "20",
        max: "120",
        orientation: "horizontal",
        step: "5",
        value: [20, 70, 80],
      },
      pointer: { committed: true, value: [50, 80] },
      refs: { input: true, root: true, thumb: true },
      reset: {
        after: ["20", "80"],
        before: ["21", "80"],
        rootValue: [20, 80],
        runtime: [20, 80],
        snippetValue: [20, 80],
      },
      scalar: { submitted: "31", value: 31 },
      scalarReset: {
        binding: 30,
        eventsAfter: ["change:31", "commit:31"],
        eventsBefore: ["change:31", "commit:31"],
        rootValue: 30,
        runtime: 30,
        snippetValue: 30,
        submitted: "30",
      },
      uncontrolled: 26,
    });
    expect(result.controlledSync.syncOrder).toEqual(["refresh", "setValue:false"]);
    expect(result.lifecycle.connects).toBe(7);
    expect(result.lifecycle.destroys).toBe(7);
    expect(result.lifecycle.refreshes).toBeGreaterThanOrEqual(1);
    expect(result.lifecycle.silentSetValues).toBeGreaterThanOrEqual(1);
    expect(result.refsAfterUnmount).toEqual({ input: false, root: false, thumb: false });
    expect(result.rootsAfterUnmount).toBe(0);
  }, 120_000);
});

async function createHarness(): Promise<string> {
  const root = await mkdtemp(path.join(process.cwd(), ".svelte-slider-browser-"));
  temporaryRoots.push(root);
  await mkdir(path.join(root, "_internal"));
  await copyFile(
    path.join(process.cwd(), "packages/svelte/src/_internal/ref-attachment.ts"),
    path.join(root, "_internal/ref-attachment.ts"),
  );
  const sliderRoot = path.join(root, "slider");
  await mkdir(sliderRoot);
  for (const file of await readdir(path.join(process.cwd(), "packages/svelte/src/slider"))) {
    await copyFile(
      path.join(process.cwd(), "packages/svelte/src/slider", file),
      path.join(sliderRoot, file),
    );
  }
  const runtime = path
    .join(process.cwd(), "packages/runtime/src/components/slider/slider.ts")
    .replaceAll("\\", "/");
  const fieldRuntime = path
    .join(process.cwd(), "packages/runtime/src/components/field/field.ts")
    .replaceAll("\\", "/");
  await writeFile(
    path.join(root, "runtime.ts"),
    `import { createSlider as createActualSlider } from "${runtime}";
const proof = globalThis.__sliderLifecycle ??= { connects: 0, destroys: 0, refreshes: 0, staleRefreshes: 0, silentSetValues: 0, calls: [] };
export function createSlider(root, options) {
  proof.connects += 1;
  const instance = createActualSlider(root, options);
  (globalThis.__sliderInstances ??= new WeakMap()).set(root, instance);
  let destroyed = false;
  return new Proxy(instance, { get(target, property) {
    const value = Reflect.get(target, property);
    if (property === "destroy") return () => { if (!destroyed) { destroyed = true; proof.destroys += 1; } return target.destroy(); };
    if (property === "refresh") return () => { if (destroyed) proof.staleRefreshes += 1; proof.refreshes += 1; proof.calls.push("refresh"); return target.refresh(); };
    if (property === "setValue") return (...args) => { if (args[1]?.emit === false) { proof.silentSetValues += 1; proof.calls.push("setValue:false"); } return target.setValue(...args); };
    return typeof value === "function" ? value.bind(target) : value;
  }});
}
export type * from "${runtime}";
export { createField } from "${fieldRuntime}";
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
    resolve: { alias: { "@starwind-ui/runtime/slider": path.join(root, "runtime.ts") } },
    root,
    server: middlewareMode
      ? { middlewareMode: true, watch: null, hmr: false }
      : { host: "127.0.0.1", port: 0, strictPort: false, watch: null, hmr: false },
  });
}

const APP_SOURCE = String.raw`<script lang="ts">
  import { SliderControl, SliderIndicator, SliderLabel, SliderRoot, SliderThumb, SliderTrack } from "./slider/index";
  let controlled = $state<number | number[]>([20, 80]);
  let cancel = $state(true);
  let disabled = $state(false);
  let form = $state("form-a");
  let name = $state("price");
  let largeStep = $state(10);
  let max = $state(100);
  let min = $state(0);
  let minStepsBetweenValues = $state(0);
  let orientation = $state<"horizontal" | "vertical">("horizontal");
  let step = $state(1);
  let events = $state<string[]>([]);
  let scalarValue = $state<number | number[] | undefined>();
  let scalarEvents = $state<string[]>([]);
  const refs = (globalThis as any).__sliderRefs ??= { input: false, root: false, thumb: false };
  const serialize = (next: number | number[]) => JSON.stringify(next);
  function onValueChange(next, detail) { events.push("change:" + serialize(next) + ":binding:" + serialize(controlled)); if (cancel) detail.cancel(); }
  function onValueCommitted(next) { events.push("commit:" + serialize(next) + ":binding:" + serialize(controlled)); }
  function onScalarValueChange(next) { scalarEvents.push("change:" + serialize(next)); }
  function onScalarValueCommitted(next) { scalarEvents.push("commit:" + serialize(next)); }
  export function accept() { cancel = false; events = []; }
  export function setControlled(next) { controlled = next; }
  export function setDisabled(next) { disabled = next; }
  export function setForm(next) { form = next; }
  export function setName(next) { name = next; }
  export function setOptions(next) { ({ largeStep, max, min, minStepsBetweenValues, orientation, step } = next); }
  export function snapshot() { return { controlled, events: [...events], scalarEvents: [...scalarEvents], scalarValue }; }
</script>

<SliderRoot defaultValue={[20,80]} bind:value={controlled} {disabled} {form} {largeStep} {max} {min} {minStepsBetweenValues} {name} {orientation} {step} onValueChange={onValueChange} onValueCommitted={onValueCommitted} data-case="controlled" data-consumer="forwarded" ref={(element) => refs.root = element !== null}>
  {#snippet children(currentValue)}
    <SliderLabel>Price</SliderLabel>
    <SliderControl data-control="controlled" style="display:block;height:20px;position:relative;width:200px">
      <SliderTrack><SliderIndicator /></SliderTrack>
      {#each (Array.isArray(currentValue) ? currentValue : [currentValue]) as _, index (index)}
        <SliderThumb {index} data-thumb="controlled" ref={(element) => { if (index === 0) refs.thumb = element !== null; }} inputRef={(element) => { if (index === 0) refs.input = element !== null; }} />
      {/each}
    </SliderControl>
  {/snippet}
</SliderRoot>

<SliderRoot defaultValue={25} data-case="uncontrolled"><SliderControl><SliderTrack /><SliderThumb index={0} /></SliderControl></SliderRoot>
<SliderRoot defaultValue={40} data-case="outer"><SliderControl><SliderTrack /><SliderThumb index={0} /></SliderControl><SliderRoot defaultValue={10} data-case="inner"><SliderControl><SliderTrack /><SliderThumb index={0} /></SliderControl></SliderRoot></SliderRoot>
<SliderRoot defaultValue={[20, 80]} name="reset" form="reset-form" data-case="reset">
  {#snippet children(currentValue)}
    <output data-reset-snippet>{JSON.stringify(currentValue)}</output>
    <SliderControl><SliderTrack /><SliderThumb index={0} /><SliderThumb index={1} /></SliderControl>
  {/snippet}
</SliderRoot>
<SliderRoot bind:value={scalarValue} defaultValue={30} name="scalar" form="scalar-form" data-case="scalar" onValueChange={onScalarValueChange} onValueCommitted={onScalarValueCommitted}>
  {#snippet children(currentValue)}
    <output data-scalar-snippet>{JSON.stringify(currentValue)}</output>
    <SliderControl><SliderTrack /><SliderThumb index={0} /></SliderControl>
  {/snippet}
</SliderRoot>
<div data-sw-field data-case="field"><SliderRoot defaultValue={35}><SliderControl><SliderTrack /><SliderThumb index={0} /></SliderControl></SliderRoot></div>
`;

const MAIN_SOURCE = String.raw`import { flushSync, hydrate, unmount } from "svelte";
import App from "./App.svelte";
import { createField } from "./runtime";
const query = (selector) => document.querySelector(selector);
const tick = async () => { flushSync(); await new Promise((resolve) => setTimeout(resolve, 0)); flushSync(); };
const values = (form, name, count) => Array.from({ length: count }, (_, index) => new FormData(form).get(name + "[" + index + "]"));
const key = (element, key) => element.dispatchEvent(new KeyboardEvent("keydown", { bubbles: true, key }));
const sliderValue = (root) => Array.from(root.querySelectorAll("[data-sw-slider-input]"), (input) => Number(input.value));
void (async () => { try {
  const target = query("#app");
  const beforeParts = Array.from(target.querySelectorAll("[data-sw-part]")).map((node) => node.getAttribute("data-sw-part")).join("|");
  const instance = hydrate(App, { target }); await tick();
  const fieldInstance = createField(query('[data-case="field"]'), { disabled: true, name: "field-range" }); await tick();
  const afterParts = Array.from(target.querySelectorAll("[data-sw-part]")).map((node) => node.getAttribute("data-sw-part")).join("|");
  const controlledRoot = query('[data-case="controlled"]');
  const controlledThumb = () => controlledRoot.querySelectorAll('[data-thumb="controlled"]')[0];
  key(controlledThumb(), "ArrowRight"); await tick();
  let snapshot = instance.snapshot();
  const canceled = { binding: snapshot.controlled, events: snapshot.events, value: sliderValue(controlledRoot) };
  instance.accept(); key(controlledThumb(), "ArrowRight"); await tick();
  snapshot = instance.snapshot();
  const accepted = { binding: snapshot.controlled, events: snapshot.events, value: sliderValue(controlledRoot) };
  const uncontrolledRoot = query('[data-case="uncontrolled"]');
  key(uncontrolledRoot.querySelector("[data-sw-slider-thumb]"), "ArrowRight"); await tick();
  const uncontrolled = Number(uncontrolledRoot.querySelector("[data-sw-slider-input]").value);
  const scalarRoot = query('[data-case="scalar"]');
  key(scalarRoot.querySelector("[data-sw-slider-thumb]"), "ArrowRight"); await tick();
  const scalar = { submitted: new FormData(query("#scalar-form")).get("scalar"), value: Number(scalarRoot.querySelector("[data-sw-slider-input]").value) };
  const scalarEventsBeforeReset = instance.snapshot().scalarEvents;
  const scalarForm = query("#scalar-form");
  scalarForm.reset(); await new Promise(resolve=>setTimeout(resolve,10)); await tick();
  const scalarSnapshot = instance.snapshot();
  const scalarReset = { binding: scalarSnapshot.scalarValue, eventsAfter: scalarSnapshot.scalarEvents, eventsBefore: scalarEventsBeforeReset, rootValue: Number(scalarRoot.getAttribute("data-value")), runtime: Number(scalarRoot.querySelector("[data-sw-slider-input]").value), snippetValue: Number(query("[data-scalar-snippet]").textContent), submitted: new FormData(scalarForm).get("scalar") };
  const innerRoot = query('[data-case="inner"]');
  key(innerRoot.querySelector("[data-sw-slider-thumb]"), "ArrowRight"); await tick();
  const nested = { inner: Number(innerRoot.querySelector("[data-sw-slider-input]").value), outer: Number(query('[data-case="outer"] > [data-sw-slider-control] [data-sw-slider-input]').value) };
  const control = query('[data-control="controlled"]');
  const rect = control.getBoundingClientRect();
  const commitsBeforePointer = instance.snapshot().events.filter((event) => event.startsWith("commit:")).length;
  control.dispatchEvent(new PointerEvent("pointerdown", { bubbles: true, button: 0, buttons: 1, clientX: rect.left + rect.width / 2, clientY: rect.top + rect.height / 2, pointerId: 7 }));
  document.dispatchEvent(new PointerEvent("pointerup", { bubbles: true, button: 0, clientX: rect.left + rect.width / 2, clientY: rect.top + rect.height / 2, pointerId: 7 }));
  await tick();
  const pointerSnapshot = instance.snapshot();
  const pointer = { committed: pointerSnapshot.events.filter((event) => event.startsWith("commit:")).length > commitsBeforePointer, value: pointerSnapshot.controlled };
  const existingThumbs = controlledRoot.querySelectorAll('[data-thumb="controlled"]');
  existingThumbs[0].dataset.identity = "first"; existingThumbs[1].dataset.identity = "second";
  globalThis.__sliderLifecycle.calls = [];
  instance.setControlled([20, 50, 80]); await tick();
  const dynamicThumbs = controlledRoot.querySelectorAll('[data-thumb="controlled"]');
  const dynamic = { identities: Array.from(dynamicThumbs, (thumb) => thumb.dataset.identity ?? null), inputNames: Array.from(controlledRoot.querySelectorAll("[data-sw-slider-input]"), (input) => input.name), inputValues: Array.from(controlledRoot.querySelectorAll("[data-sw-slider-input]"), (input) => input.value), value: instance.snapshot().controlled };
  globalThis.__sliderLifecycle.calls = [];
  instance.setControlled([25, 55, 85]); await tick();
  const controlledSyncCalls = [...globalThis.__sliderLifecycle.calls];
  const setValueIndex = controlledSyncCalls.indexOf("setValue:false");
  const refreshIndex = controlledSyncCalls.findLastIndex((entry, index) => index < setValueIndex && entry === "refresh");
  const controlledSync = { inputValues: sliderValue(controlledRoot), syncOrder: setValueIndex > refreshIndex && refreshIndex >= 0 ? [controlledSyncCalls[refreshIndex], controlledSyncCalls[setValueIndex]] : controlledSyncCalls, value: instance.snapshot().controlled };
  instance.setControlled([20, 50, 80]); await tick();
  instance.setOptions({ largeStep: 20, max: 120, min: 0, minStepsBetweenValues: 1, orientation: "horizontal", step: 5 }); await tick();
  key(controlledRoot.querySelectorAll('[data-thumb="controlled"]')[1], "PageUp"); await tick();
  const optionsSnapshot = instance.snapshot();
  const options = { largeStep: controlledRoot.getAttribute("data-large-step"), max: controlledRoot.getAttribute("data-max"), orientation: controlledRoot.getAttribute("data-orientation"), step: controlledRoot.getAttribute("data-step"), value: optionsSnapshot.controlled };
  instance.setName("range"); instance.setForm("form-b"); await tick();
  const formMove = { oldValues: Array.from(new FormData(query("#form-a")).values()), values: values(query("#form-b"), "range", 3) };
  const fieldInput = query('[data-case="field"] [data-sw-slider-input]');
  const field = { disabled: fieldInput.disabled, name: fieldInput.name };
  instance.setDisabled(true); await tick();
  const beforeDisabledKey = JSON.stringify(instance.snapshot().controlled);
  key(controlledThumb(), "ArrowRight"); await tick();
  const disabled = { disabled: controlledRoot.querySelector("[data-sw-slider-input]").disabled, unchanged: JSON.stringify(instance.snapshot().controlled) === beforeDisabledKey };
  instance.setDisabled(false); await tick();
  const controlledForm = query("#form-b");
  const controlledBefore = values(controlledForm, "range", 3);
  controlledForm.reset(); await new Promise(resolve=>setTimeout(resolve,10)); await tick();
  const controlledReset = { after: sliderValue(controlledRoot), before: controlledBefore.map(Number) };
  const resetRoot = query('[data-case="reset"]');
  key(resetRoot.querySelector("[data-sw-slider-thumb]"), "ArrowRight"); await tick();
  const resetForm = query("#reset-form");
  const resetBefore = values(resetForm, "reset", 2);
  resetForm.reset(); await new Promise(resolve=>setTimeout(resolve,10)); await tick();
  const reset = { after: values(resetForm, "reset", 2), before: resetBefore, rootValue: JSON.parse(resetRoot.getAttribute("data-value")), runtime: sliderValue(resetRoot), snippetValue: JSON.parse(query("[data-reset-snippet]").textContent) };
  const lifecycle = globalThis.__sliderLifecycle;
  const refs = { ...globalThis.__sliderRefs };
  fieldInstance.destroy();
  await unmount(instance); await tick();
  document.documentElement.dataset.svelteSliderResult = JSON.stringify({ accepted, canceled, controlledReset, controlledSync, disabled, dynamic, field, formMove, hydrationExact: beforeParts === afterParts, lifecycle, nested, options, pointer, refs, refsAfterUnmount: globalThis.__sliderRefs, reset, rootsAfterUnmount: target.querySelectorAll("[data-sw-slider]").length, scalar, scalarReset, uncontrolled });
} catch (error) { document.documentElement.dataset.svelteSliderResult = JSON.stringify({ error: error instanceof Error ? error.stack : String(error) }); } })();
`;

async function runSliderModels(configs: Record<string, unknown>[], actions: string): Promise<any> {
  const directory = await createHarness();
  await writeFile(path.join(directory, "ModelCase.svelte"), SLIDER_MODEL_SOURCE, "utf8");
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
  const ssr = await createProofServer(directory, true);
  servers.push(ssr);
  const appModule = await ssr.ssrLoadModule("/App.svelte");
  const renderer = await ssr.ssrLoadModule("svelte/server");
  const markup = renderer.render(appModule.default).body;
  expect(renderer.render(appModule.default).body).toBe(markup);
  expect(globalThis).not.toHaveProperty("document");
  expect(globalThis).not.toHaveProperty("window");
  await writeFile(
    path.join(directory, "index.html"),
    `<link rel="icon" href="data:,"><div id="app">${markup}</div><script type="module" src="/main.ts"></script>`,
    "utf8",
  );
  await writeFile(
    path.join(directory, "main.ts"),
    `import { hydrate, flushSync, tick, unmount } from "svelte";
import App from "./App.svelte";
try {
 const app = hydrate(App, { target: document.querySelector("#app") });
 const settle = async () => { flushSync(); await tick(); await tick(); flushSync(); };
 const resetSettled = async () => { await new Promise(resolve => setTimeout(resolve, 10)); await settle(); };
 await settle();
 const cases = app.getCases();
 const root = id => document.querySelector('[data-model-case="' + id + '"]');
 const form = id => document.querySelector('[data-model-form="' + id + '"]');
 const runtime = id => globalThis.__sliderInstances.get(root(id));
 const key = (id, name="ArrowRight", index=0) => root(id)?.querySelectorAll("[data-sw-slider-thumb]")[index]?.dispatchEvent(new KeyboardEvent("keydown", {bubbles:true,key:name}));
 const state = id => {
   const element = root(id);
   const inputs = Array.from(element?.querySelectorAll("[data-sw-slider-input]") ?? []);
   return { ...cases[id].snapshot(), exists: Boolean(element),
     runtime: element ? runtime(id).getValue() : null,
     rendered: element ? JSON.parse(element.querySelector("[data-rendered]").textContent) : null,
     valueAttribute: element ? JSON.parse(element.getAttribute("data-value")) : null,
     inputs: inputs.map(input => Number(input.value)),
     names: inputs.map(input => input.name),
     aria: Array.from(element?.querySelectorAll("[data-sw-slider-thumb]") ?? []).map(thumb => Number(thumb.getAttribute("aria-valuenow"))),
     form: inputs[0]?.form?.id ?? null,
     submitted: Array.from(new FormData(inputs[0]?.form ?? form(id)).values()).map(Number),
   };
 };
 const result = await (async () => { ${actions} })();
 const live = globalThis.__sliderLifecycle.connects - globalThis.__sliderLifecycle.destroys;
 await unmount(app); await resetSettled();
 document.documentElement.dataset.svelteSliderResult = JSON.stringify({...result,live,cleanup:globalThis.__sliderLifecycle});
} catch(error) { document.documentElement.dataset.svelteSliderResult = JSON.stringify({error:String(error),stack:error.stack}); }`,
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
    if (["warning", "error"].includes(message.type())) messages.push(message.text());
  });
  page.on("pageerror", (error) => messages.push(error.message));
  await page.goto(server.resolvedUrls!.local[0]!);
  await page.waitForFunction(() => document.documentElement.dataset.svelteSliderResult);
  const result = await page.evaluate(() =>
    JSON.parse(document.documentElement.dataset.svelteSliderResult ?? "{}"),
  );
  expect(messages).toEqual([]);
  expect(result).not.toHaveProperty("error");
  expect(result.cleanup.connects).toBe(result.cleanup.destroys);
  expect(result.cleanup.staleRefreshes).toBe(0);
  return { ...result, markup };
}
const SLIDER_MODEL_SOURCE = String.raw`<script lang="ts">
import { flushSync, untrack } from "svelte";
import { SliderRoot, SliderControl, SliderTrack, SliderThumb } from "./slider/index";
let { id, mode="function", initial, defaultValue, initialStep=1, initialMin=0, initialMax=100, setter="identity", proposal="accept", nonfinite=false } = $props();
let model = $state<number | number[] | undefined>(untrack(() => nonfinite ? [NaN, Infinity] : initial));
let seed = $state<number | number[] | undefined>(untrack(() => defaultValue));
let step = $state(untrack(() => initialStep));
let min = $state(untrack(() => initialMin));
let max = $state(untrack(() => initialMax));
let spacing = $state(0);
let associatedForm = $state<string | undefined>(undefined);
let shown = $state(true);
const initialArray = untrack(() => Array.isArray(model) ? model : undefined);
const copy = next => Array.isArray(next) ? [...next] : next;
const writes: unknown[] = [];
const callbacks: unknown[] = [];
const commits: unknown[] = [];
let lastProposal: unknown;
let lastPublication: unknown;
function handleProposal(next, detail) {
 lastProposal=next; callbacks.push({next:copy(next),previous:copy(model)});
 if(proposal === "cancel") detail.cancel();
 if(proposal === "command-cancel") {model=40;flushSync();detail.cancel();}
 if(proposal === "two-commands") {model=30;flushSync();model=40;flushSync();}
 if(proposal === "options") {max=20;flushSync();}
 if(proposal === "options-cancel") {min=40;flushSync();detail.cancel();}
 if(proposal === "unmount") {shown=false;flushSync();}
}
function publish(next) {
 writes.push(copy(next)); lastPublication=next;
 if(setter === "identity") model=next;
 if(setter === "transform") { if(Array.isArray(next)){ next.splice(0,next.length,30,70); model=next; } else model=30; }
}
function commit(next,detail) {commits.push({next:copy(next),model:copy(model),previous:copy(detail.previousValue)});}
export function setModel(next) {model=next;}
export function mutateModel(next) {if(Array.isArray(model)) model[0]=next;}
export function setDefault(next) {seed=next;}
export function mutateDefault() {if(Array.isArray(seed)) seed.splice(0,seed.length,10,90);}
export function setOptions(next) {if(next.step !== undefined) step=next.step;if(next.min !== undefined) min=next.min;if(next.max !== undefined) max=next.max;if(next.spacing !== undefined) spacing=next.spacing;}
export function setForm(next) {associatedForm=next;}
export function hide() {shown=false;}
export function snapshot() {return {model:model === undefined ? "undefined" : copy(model),writes:writes.map(copy),callbacks:[...callbacks],commits:[...commits],initialArray:initialArray ? [...initialArray] : null,aliased:lastProposal !== undefined && lastProposal === lastPublication};}
</script>
{#snippet parts(accepted)}
 <output data-rendered>{JSON.stringify(accepted)}</output>
 <SliderControl><SliderTrack />{#each (Array.isArray(accepted) ? accepted : [accepted]) as _,index (index)}<SliderThumb {index} />{/each}</SliderControl>
{/snippet}
<form id={id + "-other"}></form>
<form id={id + "-form"} data-model-form={id}>
{#if shown}
 {#if mode === "omitted"}<SliderRoot data-model-case={id} {min} {max} {step} minStepsBetweenValues={spacing} name="choice" form={associatedForm} defaultValue={seed} onValueChange={handleProposal} onValueCommitted={commit} children={parts} />
 {:else if mode === "plain"}<SliderRoot data-model-case={id} {min} {max} {step} minStepsBetweenValues={spacing} name="choice" form={associatedForm} value={model} defaultValue={seed} onValueChange={handleProposal} onValueCommitted={commit} children={parts} />
 {:else if mode === "bound"}<SliderRoot data-model-case={id} {min} {max} {step} minStepsBetweenValues={spacing} name="choice" form={associatedForm} bind:value={model} defaultValue={seed} onValueChange={handleProposal} onValueCommitted={commit} children={parts} />
 {:else}<SliderRoot data-model-case={id} {min} {max} {step} minStepsBetweenValues={spacing} name="choice" form={associatedForm} bind:value={() => model,publish} defaultValue={seed} onValueChange={handleProposal} onValueCommitted={commit} children={parts} />{/if}
{/if}
</form>
<output data-ssr={id}>{JSON.stringify(model) ?? "undefined"}:{writes.length}</output>`;

describe("Slider accepted models", () => {
  it("initializes undefined and ordinary models through Runtime numeric normalization", async () => {
    const result = await runSliderModels(
      [
        { id: "omitted", mode: "omitted", defaultValue: 25, initialStep: 10 },
        { id: "bound", mode: "bound" },
        { id: "undefined", defaultValue: [17, 83], initialStep: 10 },
        { id: "plain", mode: "plain", initial: 20, defaultValue: 80 },
        { id: "zero", initial: 0, defaultValue: 80 },
        { id: "empty", initial: [], initialMin: 10 },
        { id: "single-array", initial: [23], initialStep: 5 },
        { id: "sorted", initial: [90, -10, 33], initialStep: 10 },
        { id: "nonfinite", nonfinite: true, initialMin: 10 },
      ],
      `
   const initial=Object.fromEntries(Object.keys(cases).map(id=>[id,state(id)]));
   key("plain"); await settle(); const accepted=state("plain");
   cases.plain.setModel(20); await settle(); const same=state("plain");
   cases.plain.setModel(50); await settle(); cases.plain.setModel(undefined); await settle();
   cases.undefined.setModel(undefined); await settle();
   return {initial,accepted,same,command:state("plain"),laterUndefined:state("undefined")};
  `,
    );
    for (const [id, value] of Object.entries({
      omitted: 30,
      bound: 0,
      undefined: [20, 80],
      plain: 20,
      zero: 0,
      empty: 10,
      "single-array": 25,
      sorted: [0, 30, 90],
      nonfinite: [10, 10],
    })) {
      expect(result.initial[id]).toMatchObject({
        runtime: value,
        rendered: value,
        valueAttribute: value,
        inputs: Array.isArray(value) ? value : [value],
        callbacks: [],
        commits: [],
      });
    }
    expect(result.initial.undefined).toMatchObject({ model: [20, 80], writes: [[20, 80]] });
    expect(result.initial["single-array"]).toMatchObject({
      model: 25,
      writes: [25],
      initialArray: [23],
    });
    expect(result.markup).toContain('data-ssr="undefined">undefined:0');
    expect(result.accepted).toMatchObject({ model: 20, runtime: 21, submitted: [21] });
    expect(result.same).toMatchObject({ model: 20, runtime: 21 });
    expect(result.command).toMatchObject({ model: "undefined", runtime: 50, inputs: [50] });
    expect(result.laterUndefined).toMatchObject({
      model: "undefined",
      runtime: [20, 80],
      writes: [[20, 80]],
    });
    expect(result.live).toBe(9);
  }, 120_000);
  it("copies arrays and separates accepted binding readback from commit details", async () => {
    const result = await runSliderModels(
      ["identity", "retain", "transform"].map((setter) => ({
        id: setter,
        setter,
        initial: [20, 80],
      })),
      `
   for(const id of Object.keys(cases)){key(id);await settle();}
   return {states:Object.fromEntries(Object.keys(cases).map(id=>[id,state(id)]))};
  `,
    );
    for (const [id, value] of Object.entries({
      identity: [21, 80],
      retain: [20, 80],
      transform: [30, 70],
    })) {
      expect(result.states[id]).toMatchObject({
        model: value,
        runtime: value,
        inputs: value,
        submitted: value,
        writes: [[21, 80]],
        initialArray: [20, 80],
        aliased: false,
        callbacks: [{ next: [21, 80], previous: [20, 80] }],
        commits: [{ next: [21, 80], model: value, previous: [20, 80] }],
      });
    }
  }, 120_000);
  it("keeps cancellation and later parent commands", async () => {
    const result = await runSliderModels(
      [
        { id: "cancel", initial: 20, proposal: "cancel" },
        { id: "dom", initial: 20 },
        { id: "accepted", initial: 20 },
      ],
      `root("dom").addEventListener("starwind:value-change",event=>event.preventDefault());
      for(const id of Object.keys(cases)){key(id);await settle();}
      const accepted=state("accepted"); cases.accepted.setModel(40); await settle();
      return {accepted,states:Object.fromEntries(Object.keys(cases).map(id=>[id,state(id)]))};`,
    );
    for (const id of ["cancel", "dom"])
      expect(result.states[id]).toMatchObject({
        model: 20,
        runtime: 20,
        writes: [],
        commits: [],
        submitted: [20],
      });
    expect(result.accepted).toMatchObject({
      model: 21,
      runtime: 21,
      writes: [21],
      commits: [{ next: 21, model: 21 }],
    });
    expect(result.states.accepted).toMatchObject({
      model: 40,
      runtime: 40,
      submitted: [40],
      writes: [21],
    });
  }, 120_000);
  it("normalizes option and array commands while refreshing new inputs after Svelte flush", async () => {
    const result = await runSliderModels(
      [
        { id: "range", initial: [20, 80] },
        { id: "queued", initial: [20, 80] },
      ],
      `
   cases.range.setOptions({max:60,step:10});await settle();const options=state("range");
   cases.range.setModel([-10,87]);await settle();const command=state("range");
   cases.range.setOptions({spacing:2});await settle();key("range","End");await settle();const spaced=state("range");
   cases.range.setModel([0,20,40]);await settle();const expanded=state("range");
   cases.range.setModel([10,20,40]);await settle();const mutated=state("range");
   cases.range.setModel([10,20,40]);await settle();const same=state("range");
   cases.queued.setModel([10,30,50]);flushSync();cases.queued.hide();flushSync();await settle();
   return {options,command,spaced,expanded,mutated,same,removed:state("queued")};
  `,
    );
    expect(result.options).toMatchObject({
      model: [20, 60],
      runtime: [20, 60],
      writes: [[20, 60]],
      callbacks: [],
      commits: [],
    });
    expect(result.command).toMatchObject({
      model: [0, 60],
      runtime: [0, 60],
      writes: [
        [20, 60],
        [0, 60],
      ],
      callbacks: [],
      commits: [],
    });
    expect(result.spaced).toMatchObject({ model: [40, 60], runtime: [40, 60] });
    expect(result.expanded).toMatchObject({
      model: [0, 20, 40],
      runtime: [0, 20, 40],
      inputs: [0, 20, 40],
      submitted: [0, 20, 40],
      names: ["choice[0]", "choice[1]", "choice[2]"],
    });
    expect(result.mutated).toMatchObject({
      model: [10, 20, 40],
      runtime: [10, 20, 40],
      inputs: [10, 20, 40],
    });
    expect(result.same.writes).toEqual(result.mutated.writes);
    expect(result.removed).toMatchObject({ exists: false, writes: [], callbacks: [], commits: [] });
    expect(result.cleanup.connects).toBe(2);
  }, 120_000);
  it("normalizes the frozen normalized reset seed against changed constraints", async () => {
    const result = await runSliderModels(
      [
        { id: "range", initial: [40, 60], defaultValue: [17, 83], initialStep: 10 },
        { id: "scalar", initial: 40, defaultValue: 17, initialStep: 10 },
      ],
      `
   cases.range.mutateDefault();cases.range.setOptions({step:5});await settle();
   cases.scalar.setDefault(99);cases.scalar.setOptions({step:5});await settle();
   form("range").reset();form("scalar").reset();await resetSettled();
   return {range:state("range"),scalar:state("scalar")};
  `,
    );
    expect(result.range).toMatchObject({
      model: [20, 80],
      runtime: [20, 80],
      inputs: [20, 80],
      submitted: [20, 80],
      writes: [[20, 80]],
      callbacks: [],
      commits: [],
      initialArray: [40, 60],
    });
    expect(result.scalar).toMatchObject({
      model: 20,
      runtime: 20,
      submitted: [20],
      writes: [20],
      callbacks: [],
      commits: [],
    });
  }, 120_000);
  it("resets native forms and honors canceled resets", async () => {
    const result = await runSliderModels(
      ["reset", "cancel"].map((id) => ({ id, initial: 40, defaultValue: 20 })),
      `
      form("cancel").addEventListener("reset",event=>event.preventDefault());
      for(const id of Object.keys(cases)) form(id).reset();
      await resetSettled();return {states:Object.fromEntries(Object.keys(cases).map(id=>[id,state(id)]))};`,
    );
    expect(result.states.reset).toMatchObject({
      model: 20,
      runtime: 20,
      inputs: [20],
      submitted: [20],
      writes: [20],
      callbacks: [],
      commits: [],
    });
    expect(result.states.cancel).toMatchObject({
      model: 40,
      runtime: 40,
      inputs: [40],
      submitted: [40],
      writes: [],
      callbacks: [],
      commits: [],
    });
  }, 120_000);
  it("publishes public silent state sync without change or commit callbacks", async () => {
    const result = await runSliderModels(
      [{ id: "service", initial: [20, 80] }],
      `
   runtime("service").setValue([30,70],{emit:false});await settle();const silent=state("service");
   runtime("service").setValue([40,60]);await settle();return {silent,accepted:state("service")};
  `,
    );
    expect(result.silent).toMatchObject({
      model: [30, 70],
      runtime: [30, 70],
      writes: [[30, 70]],
      callbacks: [],
      commits: [],
    });
    expect(result.accepted).toMatchObject({
      model: [40, 60],
      runtime: [40, 60],
      writes: [
        [30, 70],
        [40, 60],
      ],
      callbacks: [{ next: [40, 60], previous: [30, 70] }],
      commits: [],
    });
  }, 120_000);
});
