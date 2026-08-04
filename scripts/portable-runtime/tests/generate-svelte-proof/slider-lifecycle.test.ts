import { copyFile, mkdir, mkdtemp, readFile, readdir, rm, writeFile } from "node:fs/promises";
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

describe("generated Svelte Slider lifecycle", () => {
  it("preserves Slider state, forms, geometry delegation, identity, SSR, and cleanup", async () => {
    const generatedRoot = await readFile(
      path.join(process.cwd(), "packages/svelte/src/slider/SliderRoot.svelte"),
      "utf8",
    );
    expect(generatedRoot.match(/subscribe\("stateSync"/g)).toHaveLength(1);
    expect(generatedRoot).toMatch(
      /unsubscribeStateSync\(\);[\s\S]*unsubscribeChange\(\);[\s\S]*unsubscribeCommitted\(\);[\s\S]*instance\.destroy\(\)/,
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
      controlledReset: { after: [20, 70, 80], before: [20, 70, 80] },
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
const proof = globalThis.__sliderLifecycle ??= { connects: 0, destroys: 0, refreshes: 0, silentSetValues: 0, calls: [] };
export function createSlider(root, options) {
  proof.connects += 1;
  const instance = createActualSlider(root, options);
  let destroyed = false;
  return new Proxy(instance, { get(target, property) {
    const value = Reflect.get(target, property);
    if (property === "destroy") return () => { if (!destroyed) { destroyed = true; proof.destroys += 1; } return target.destroy(); };
    if (property === "refresh") return () => { proof.refreshes += 1; proof.calls.push("refresh"); return target.refresh(); };
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
    configFile: false,
    logLevel: "silent",
    plugins: [svelte()],
    resolve: { alias: { "@starwind-ui/runtime/slider": path.join(root, "runtime.ts") } },
    root,
    server: middlewareMode
      ? { middlewareMode: true }
      : { host: "127.0.0.1", port: 0, strictPort: false },
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

<SliderRoot bind:value={controlled} {disabled} {form} {largeStep} {max} {min} {minStepsBetweenValues} {name} {orientation} {step} onValueChange={onValueChange} onValueCommitted={onValueCommitted} data-case="controlled" data-consumer="forwarded" ref={(element) => refs.root = element !== null}>
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
  scalarForm.reset(); await tick();
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
  const controlledSyncCalls = globalThis.__sliderLifecycle.calls;
  const refreshIndex = controlledSyncCalls.lastIndexOf("refresh");
  const setValueIndex = controlledSyncCalls.findIndex((entry, index) => index > refreshIndex && entry === "setValue:false");
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
  controlledForm.reset(); await tick();
  const controlledReset = { after: sliderValue(controlledRoot), before: controlledBefore.map(Number) };
  const resetRoot = query('[data-case="reset"]');
  key(resetRoot.querySelector("[data-sw-slider-thumb]"), "ArrowRight"); await tick();
  const resetForm = query("#reset-form");
  const resetBefore = values(resetForm, "reset", 2);
  resetForm.reset(); await tick();
  const reset = { after: values(resetForm, "reset", 2), before: resetBefore, rootValue: JSON.parse(resetRoot.getAttribute("data-value")), runtime: sliderValue(resetRoot), snippetValue: JSON.parse(query("[data-reset-snippet]").textContent) };
  const lifecycle = globalThis.__sliderLifecycle;
  const refs = { ...globalThis.__sliderRefs };
  fieldInstance.destroy();
  await unmount(instance); await tick();
  document.documentElement.dataset.svelteSliderResult = JSON.stringify({ accepted, canceled, controlledReset, controlledSync, disabled, dynamic, field, formMove, hydrationExact: beforeParts === afterParts, lifecycle, nested, options, pointer, refs, refsAfterUnmount: globalThis.__sliderRefs, reset, rootsAfterUnmount: target.querySelectorAll("[data-sw-slider]").length, scalar, scalarReset, uncontrolled });
} catch (error) { document.documentElement.dataset.svelteSliderResult = JSON.stringify({ error: error instanceof Error ? error.stack : String(error) }); } })();
`;
