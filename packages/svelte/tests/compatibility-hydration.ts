import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { createServer } from "node:http";
import { once } from "node:events";

import { chromium } from "playwright";

import type { DistConsumer } from "./dist-consumer.js";

export async function verifyCompatibilityHydration(consumer: DistConsumer) {
  await consumer.write({
    "Hydration.svelte": HYDRATION_COMPONENT,
    "hydrate-main.js": HYDRATION_CLIENT,
    "hydrate-ssr.mjs": `import { render } from "svelte/server"; import App from "./Hydration.svelte";
if (typeof window !== "undefined" || typeof document !== "undefined") throw new Error("SSR has DOM globals");
console.log(JSON.stringify({ body: render(App).body }));`,
    "build-browser.mjs": BROWSER_BUILD,
  });
  const { body } = JSON.parse(await consumer.run("hydrate-ssr.mjs", { loader: true }));
  const build = JSON.parse(await consumer.run("build-browser.mjs")) as {
    bundler: string;
    compiler: string;
    inputs: string[];
  };
  const javascript = await readFile(`${consumer.root}/browser.js`);
  const server = createServer((request, response) => {
    if (request.url === "/browser.js") {
      response.setHeader("Content-Type", "text/javascript");
      response.end(javascript);
    } else if (request.url === "/") {
      response.setHeader("Content-Type", "text/html");
      response.end(
        `<link rel="icon" href="data:,"><div id="app">${body}</div><script type="module" src="/browser.js"></script>`,
      );
    } else {
      response.statusCode = 404;
      response.end();
    }
  });
  server.listen(0, "127.0.0.1");
  await once(server, "listening");
  let browser;
  try {
    browser = await chromium.launch({ channel: "chrome", headless: true });
    const page = await browser.newPage();
    const diagnostics: string[] = [];
    let failPage!: (error: Error) => void;
    const pageFailure = new Promise<never>((_, reject) => {
      failPage = reject;
    });
    page.on("pageerror", (error) => failPage(error));
    page.on("console", (message) => {
      if (["warning", "error"].includes(message.type())) diagnostics.push(message.text());
    });
    page.on("response", (response) => {
      if (response.status() >= 400)
        failPage(new Error(`HTTP ${response.status()} ${response.url()}`));
    });
    const address = server.address();
    if (!address || typeof address === "string")
      throw new Error("Compatibility server has no port");
    await Promise.race([
      (async () => {
        await page.goto(`http://127.0.0.1:${address.port}`);
        await page.waitForFunction(
          () => document.documentElement.dataset.compatibilityResult,
          undefined,
          { timeout: 30_000 },
        );
      })(),
      pageFailure,
    ]);
    const result = await page.evaluate(() =>
      JSON.parse(document.documentElement.dataset.compatibilityResult!),
    );
    assert.deepEqual(diagnostics, [], "Hydration emitted browser diagnostics");
    assert.deepEqual(result, {
      hydrated: true,
      clicks: 1,
      checked: true,
      selectValue: "beta",
      selectOpen: false,
      sliderValue: 30,
      colorValue: "#00ff00",
      colorFormat: "rgb",
      changes: {
        checked: 1,
        selectValue: 1,
        selectOpen: 2,
        sliderValue: 1,
        colorValue: 1,
        colorFormat: 1,
        sidebarOpen: 1,
      },
      sidebarOpen: false,
      sidebarClicks: 1,
      refs: { setups: 6, cleanups: 6 },
      remainingNodes: 0,
      staleCallbacks: 0,
    });
    return { result, build };
  } finally {
    await browser?.close();
    await new Promise<void>((resolve, reject) =>
      server.close((error) => (error ? reject(error) : resolve())),
    );
  }
}

const HYDRATION_COMPONENT = `<script lang="ts">
import { ButtonRoot } from "@starwind-ui/svelte/button";
import { CheckboxRoot } from "@starwind-ui/svelte/checkbox";
import Select from "@starwind-ui/svelte/select";
import Slider from "@starwind-ui/svelte/slider";
import Picker,{type ColorPickerValue,type ColorPickerFormat} from "@starwind-ui/svelte/color-picker";
import Sidebar,{type SidebarMenuButtonChildPayload} from "@starwind-ui/svelte/sidebar";
let checked = $state<boolean | undefined>(undefined);
let selectOpen = $state<boolean | undefined>(undefined);
let selectValue = $state<string | null | undefined>(undefined);
let sliderValue = $state<number | number[] | undefined>(undefined);
let colorValue=$state.raw<ColorPickerValue|undefined>(),colorFormat=$state<ColorPickerFormat|undefined>();
let sidebarOpen=$state<boolean|undefined>(),sidebarClicks=0;
let disabled = $state(false);
let clicks = 0;
const changes = { checked: 0, selectValue: 0, selectOpen: 0, sliderValue: 0, colorValue: 0, colorFormat: 0, sidebarOpen: 0 };
const refs = { setups: 0, cleanups: 0 };
const ref = (element: HTMLElement | null) => { if (element) refs.setups++; else refs.cleanups++; };
export function disable() { disabled = true; }
export function snapshot() { return { clicks, checked, selectValue, selectOpen, sliderValue, colorValue: typeof colorValue==="string"?colorValue:colorValue?.toString("hex"), colorFormat, sidebarOpen, sidebarClicks, changes: { ...changes }, refs: { ...refs } }; }
</script>
{#snippet sidebarChild(payload:SidebarMenuButtonChildPayload)}{#if payload.kind==="anchor"}<a {...payload.props}>{@render payload.children?.()}</a>{:else}<button {...payload.props}>{@render payload.children?.()}</button>{/if}{/snippet}
<Sidebar.Provider data-compatibility="sidebar" bind:open={sidebarOpen} {ref} onOpenChange={()=>changes.sidebarOpen++}><Sidebar.Trigger>Sidebar</Sidebar.Trigger><Sidebar.MenuButton href="#sidebar-compatibility" child={sidebarChild} onclick={()=>sidebarClicks++}>Destination</Sidebar.MenuButton></Sidebar.Provider>
<ButtonRoot data-compatibility="button" {disabled} {ref} onclick={() => clicks++}>Activate</ButtonRoot>
<CheckboxRoot data-compatibility="checkbox" nativeButton bind:checked defaultChecked={false} {ref} onCheckedChange={() => changes.checked++} aria-label="Compatible checkbox" />
<Select.Root data-compatibility="select" bind:open={selectOpen} bind:value={selectValue} defaultValue="alpha" {ref} onOpenChange={() => changes.selectOpen++} onValueChange={() => changes.selectValue++}>
  <Select.Trigger id="select-trigger"><Select.Value placeholder="Select an item" /></Select.Trigger>
  <Select.Portal><Select.Positioner><Select.Popup><Select.List>
    <Select.Item value="alpha"><Select.ItemText>Alpha</Select.ItemText></Select.Item>
    <Select.Item value="beta"><Select.ItemText>Beta</Select.ItemText></Select.Item>
  </Select.List></Select.Popup></Select.Positioner></Select.Portal>
</Select.Root>
<Slider.Root data-compatibility="slider" bind:value={sliderValue} defaultValue={20} step={10} {ref} onValueChange={() => changes.sliderValue++}>
  <Slider.Label>Compatible slider</Slider.Label><Slider.Control><Slider.Track /><Slider.Thumb /></Slider.Control>
</Slider.Root>
<Picker.Root data-compatibility="color-picker" bind:value={()=>colorValue,(next)=>{colorValue=next;}} bind:format={colorFormat} defaultValue="#123456" {ref} onValueChange={()=>changes.colorValue++} onFormatChange={()=>changes.colorFormat++}><Picker.ValueInput/><Picker.Swatch swatchValue="#00ff00">Green</Picker.Swatch><Picker.FormatSelect><option value="hex">Hex</option><option value="rgb">RGB</option></Picker.FormatSelect><Picker.HiddenInput/></Picker.Root>
`;

const HYDRATION_CLIENT = `
import { hydrate, flushSync, tick, unmount } from "svelte";
import App from "./Hydration.svelte";
const assert = (value, message) => { if (!value) throw new Error(message); };
const target = document.querySelector("#app");
const part = (name) => document.querySelector('[data-compatibility="' + name + '"]');
const before = ["button", "checkbox", "select", "slider", "color-picker", "sidebar"].map(part);
const instance = hydrate(App, { target });
const settle = async () => { flushSync(); await tick(); flushSync(); };
await settle();
assert(before.every((element, index) => element && element === part(["button", "checkbox", "select", "slider", "color-picker", "sidebar"][index])), "Hydration replaced SSR nodes");
const button = part("button");
const checkbox = part("checkbox");
button.click(); await settle();
instance.disable(); await settle(); button.click(); await settle();
assert(button.disabled && instance.snapshot().clicks === 1, "Button disabled behavior");
checkbox.click(); await settle();
assert(checkbox.getAttribute("aria-checked") === "true", "Checkbox interaction");
const trigger = document.getElementById("select-trigger");
trigger.click(); await settle();
assert(instance.snapshot().selectOpen === true, "Select did not open");
document.querySelector('[data-sw-select-item][data-value="beta"]').click(); await settle();
assert(part("select").getAttribute("data-value") === "beta", "Select did not accept value");
const thumb = document.querySelector("[data-sw-slider-thumb]");
thumb.dispatchEvent(new KeyboardEvent("keydown", { key: "ArrowRight", bubbles: true }));
await settle();
assert(thumb.getAttribute("aria-valuenow") === "30", "Slider keyboard interaction");
const swatch = part("color-picker").querySelector("[data-sw-color-picker-swatch]");
swatch.click(); await settle();
const formatSelect = part("color-picker").querySelector("[data-sw-color-picker-format-select]");
formatSelect.value="rgb"; formatSelect.dispatchEvent(new Event("change",{bubbles:true})); await settle();
assert(instance.snapshot().colorValue==="#00ff00"&&instance.snapshot().colorFormat==="rgb","Color Picker accepted function and format bindings");
const sidebarTrigger=part("sidebar").querySelector("[data-sw-sidebar-trigger]"),sidebarLink=part("sidebar").querySelector("[data-sw-sidebar-menu-button]");
sidebarTrigger.click();sidebarLink.click();await settle();assert(instance.snapshot().sidebarOpen===false&&sidebarLink.tagName==="A"&&location.hash==="#sidebar-compatibility","Sidebar native tagged child and accepted model");
const beforeUnmount = instance.snapshot();
await unmount(instance); await settle();
sidebarTrigger.click(); swatch.click(); checkbox.click(); trigger.click(); thumb.dispatchEvent(new KeyboardEvent("keydown", { key: "ArrowRight", bubbles: true }));
await settle();
const final = instance.snapshot();
const staleCallbacks = Object.keys(final.changes).reduce((sum, key) => sum + final.changes[key] - beforeUnmount.changes[key], 0);
document.documentElement.dataset.compatibilityResult = JSON.stringify({ hydrated: true, ...final, remainingNodes: document.querySelectorAll("[data-sw-button], [data-sw-checkbox], [data-sw-select], [data-sw-select-portal], [data-sw-slider], [data-sw-color-picker], [data-sw-sidebar-provider]").length, staleCallbacks });
`;

export function createBrowserBuildScript(dev = false) {
  return `
import assert from "node:assert/strict";
import { readFile, realpath } from "node:fs/promises";
import { createRequire } from "node:module";
import path from "node:path";
import { build } from "esbuild";
import { compile, compileModule } from "svelte/compiler";
const root = process.cwd();
const require = createRequire(import.meta.url);
const local = async (file) => {
  const resolved = await realpath(file);
  assert.ok(resolved.startsWith(root + path.sep), "Browser build escaped consumer: " + resolved);
  return resolved;
};
const bundler = await local(require.resolve("esbuild"));
const compiler = await local(require.resolve("svelte/compiler"));
const clientRuntime = await local(require.resolve("svelte/internal/client"));
const result = await build({
  absWorkingDir: root, entryPoints: ["hydrate-main.js"], outfile: "browser.js", bundle: true,
  format: "esm", platform: "browser", target: "es2022", conditions: ["browser", "svelte"],
  metafile: true, logLevel: "silent", plugins: [{ name: "consumer-svelte", setup(build) {
    build.onLoad({ filter: /\\.svelte$/ }, async ({ path: filename }) => {
      await local(filename);
      const output = compile(await readFile(filename, "utf8"), { filename, generate: "client", dev: ${dev} });
      assert.deepEqual(output.warnings, []);
      return { contents: output.js.code, loader: "js", resolveDir: path.dirname(filename) };
    });
    build.onLoad({ filter: /\\.svelte\\.js$/ }, async ({ path: filename }) => {
      await local(filename);
      const output = compileModule(await readFile(filename, "utf8"), { filename, generate: "client", dev: ${dev} });
      assert.deepEqual(output.warnings, []);
      return { contents: output.js.code, loader: "js", resolveDir: path.dirname(filename) };
    });
  } }],
});
assert.deepEqual(result.warnings, []);
const inputs = await Promise.all(Object.keys(result.metafile.inputs).map(file => local(path.resolve(root, file))));
for (const file of inputs) if (file.includes("/node_modules/@starwind-ui/")) assert.ok(file.includes("/dist/"), file);
assert.ok(inputs.includes(clientRuntime), "No consumer Svelte client runtime in bundle");
console.log(JSON.stringify({ bundler, compiler, inputs }));
`;
}
export const BROWSER_BUILD = createBrowserBuildScript();
