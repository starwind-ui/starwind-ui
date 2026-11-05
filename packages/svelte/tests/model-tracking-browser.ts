import assert from "node:assert/strict";
import { once } from "node:events";
import { readFile } from "node:fs/promises";
import { createServer } from "node:http";
import path from "node:path";
import { chromium } from "playwright";
import { BROWSER_BUILD } from "./compatibility-hydration.js";
import type { DistConsumer } from "./dist-consumer.js";

/** A model follows the parent state it reads, and only a changed input is a new command. */
export async function verifyModelTracking(consumer: DistConsumer) {
  await consumer.write({
    "ModelTracking.svelte": APP,
    "hydrate-main.js": CLIENT,
    "build-model-tracking.mjs": BROWSER_BUILD,
  });
  await consumer.run("build-model-tracking.mjs");
  const javascript = await readFile(path.join(consumer.root, "browser.js"));
  const server = createServer((request, response) => {
    if (request.url === "/browser.js") {
      response.setHeader("Content-Type", "text/javascript");
      response.end(javascript);
    } else {
      response.setHeader("Content-Type", "text/html");
      response.end(
        '<link rel="icon" href="data:,"><div id="app"></div><script type="module" src="/browser.js"></script>',
      );
    }
  });
  let browser;
  try {
    server.listen(0, "127.0.0.1");
    await once(server, "listening");
    const address = server.address();
    assert.ok(address && typeof address !== "string");
    browser = await chromium.launch({ channel: "chrome", headless: true });
    const page = await browser.newPage();
    await page.goto(`http://127.0.0.1:${address.port}`);
    await page.waitForFunction(() => document.documentElement.dataset.modelTracking, undefined, {
      timeout: 30000,
    });
    return (await page.evaluate(() =>
      JSON.parse(document.documentElement.dataset.modelTracking!),
    )) as { failures: string[] };
  } finally {
    await browser?.close();
    await new Promise<void>((resolve, reject) =>
      server.close((error) => (error ? reject(error) : resolve())),
    );
  }
}

const APP = `<script lang="ts">
import Accordion from "@starwind-ui/svelte/accordion";
import Checkbox from "@starwind-ui/svelte/checkbox";
import CheckboxGroup from "@starwind-ui/svelte/checkbox-group";
import Combobox from "@starwind-ui/svelte/combobox";
import Input from "@starwind-ui/svelte/input";
import Sidebar from "@starwind-ui/svelte/sidebar";
import Toggle from "@starwind-ui/svelte/toggle";
import ToggleGroup from "@starwind-ui/svelte/toggle-group";
let caretText = $state("abcd");
let boundChecks = $state(["a"]), plainChecks = $state(["a"]);
let boundToggles = $state(["a"]), plainToggles = $state(["a"]);
let boundPanels = $state(["a"]), plainPanels = $state(["a"]);
let lateInput = $state<string | undefined>(undefined);
let lateCombo = $state<string | undefined>(undefined), comboOpen = $state(false), comboReadOnly = $state(false);
let lateSidebar = $state<boolean | undefined>(undefined), sidebarMobile = $state(false);
export const arrays = {
  checks: { get bound() { return boundChecks; }, get plain() { return plainChecks; } },
  toggles: { get bound() { return boundToggles; }, get plain() { return plainToggles; } },
  panels: { get bound() { return boundPanels; }, get plain() { return plainPanels; } },
};
export function bound() { return { caretText, boundChecks: [...boundChecks], comboOpen }; }
export function loadInput(next: string) { lateInput = next; }
export function loadCombo(next: string) { lateCombo = next; }
export function setComboReadOnly(next: boolean) { comboReadOnly = next; }
export function loadSidebar(next: boolean) { lateSidebar = next; }
export function setMobile(next: boolean) { sidebarMobile = next; }
</script>
{#snippet items(id: string)}<Combobox.Input data-input={id}/><Combobox.Trigger data-trigger={id}>Open</Combobox.Trigger><Combobox.Portal><Combobox.Positioner><Combobox.Popup><Combobox.List><Combobox.Item value="astro" data-item={id + "-astro"}><Combobox.ItemText>Astro</Combobox.ItemText></Combobox.Item><Combobox.Item value="react" data-item={id + "-react"}><Combobox.ItemText>React</Combobox.ItemText></Combobox.Item></Combobox.List></Combobox.Popup></Combobox.Positioner></Combobox.Portal>{/snippet}
{#snippet checks(id: string)}<Checkbox.Root value="a" data-check={id + "-a"}/><Checkbox.Root value="b" data-check={id + "-b"}/>{/snippet}
{#snippet toggles(id: string)}<Toggle.Root value="a" data-toggle={id + "-a"}>A</Toggle.Root><Toggle.Root value="b" data-toggle={id + "-b"}>B</Toggle.Root>{/snippet}
{#snippet panels(id: string)}<Accordion.Item value="a" data-panel={id + "-a"}><Accordion.Header><Accordion.Trigger>A</Accordion.Trigger></Accordion.Header><Accordion.Panel>A</Accordion.Panel></Accordion.Item><Accordion.Item value="b" data-panel={id + "-b"}><Accordion.Header><Accordion.Trigger>B</Accordion.Trigger></Accordion.Header><Accordion.Panel>B</Accordion.Panel></Accordion.Item>{/snippet}
<Combobox.Root data-case="caret" bind:inputValue={caretText}>{@render items("caret")}</Combobox.Root>
<CheckboxGroup.Root bind:value={boundChecks}>{@render checks("bound")}</CheckboxGroup.Root>
<CheckboxGroup.Root value={plainChecks}>{@render checks("plain")}</CheckboxGroup.Root>
<ToggleGroup.Root multiple bind:value={boundToggles}>{@render toggles("bound")}</ToggleGroup.Root>
<ToggleGroup.Root multiple value={plainToggles}>{@render toggles("plain")}</ToggleGroup.Root>
<Accordion.Root type="multiple" bind:value={boundPanels}>{@render panels("bound")}</Accordion.Root>
<Accordion.Root type="multiple" value={plainPanels}>{@render panels("plain")}</Accordion.Root>
<Input.Root id="late-input" value={lateInput}/>
<Combobox.Root data-case="late-combo" value={lateCombo} bind:open={comboOpen} readOnly={comboReadOnly}>{@render items("late-combo")}</Combobox.Root>
<Sidebar.Provider id="late-sidebar" mobileQuery="not all" open={lateSidebar} bind:mobileOpen={sidebarMobile}><Sidebar.Sidebar/><Sidebar.Trigger data-trigger="late-sidebar">Toggle</Sidebar.Trigger></Sidebar.Provider>`;

const CLIENT = `import { flushSync, mount, tick } from "svelte";
import App from "./ModelTracking.svelte";
const failures = [];
const check = (value, message) => { if (!value) failures.push(message); };
const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
const settle = async () => { flushSync(); await tick(); await wait(40); flushSync(); };
const on = (element) => element.getAttribute("aria-checked") === "true" || element.getAttribute("aria-pressed") === "true" || element.getAttribute("data-state") === "open";
try {
  const app = mount(App, { target: document.getElementById("app") });
  await settle();

  const caret = document.querySelector('[data-input="caret"]');
  caret.focus();
  caret.value = "abXcd";
  caret.setSelectionRange(3, 3);
  caret.dispatchEvent(new InputEvent("input", { bubbles: true, data: "X", inputType: "insertText" }));
  await settle();
  check(caret.value === "abXcd" && app.bound().caretText === "abXcd", "bind:inputValue accepts typed text: " + caret.value);
  check(caret.selectionStart === 3, "bind:inputValue keeps the caret: " + caret.selectionStart);
  caret.blur();
  await settle();

  for (const [family, attribute] of [["checks", "data-check"], ["toggles", "data-toggle"], ["panels", "data-panel"]]) {
    for (const mode of ["bound", "plain"]) {
      const model = app.arrays[family][mode];
      const item = document.querySelector("[" + attribute + '="' + mode + '-b"]');
      check(!on(item), family + " " + mode + " starts without b");
      model.push("b");
      await settle();
      check(on(item), family + " " + mode + " follows push");
      model.splice(model.indexOf("b"), 1);
      await settle();
      check(!on(item), family + " " + mode + " follows splice");
    }
  }

  const late = document.getElementById("late-input");
  app.loadInput("loaded");
  await settle();
  check(late.value === "loaded", "late one-way Input value applies: " + late.value);
  late.value = "loaded!";
  late.dispatchEvent(new Event("input", { bubbles: true }));
  await settle();
  check(late.value === "loaded!", "late one-way Input stays Runtime-owned: " + late.value);
  app.loadInput("second");
  await settle();
  check(late.value === "second", "a changed late Input value still applies: " + late.value);

  const comboRoot = document.querySelector('[data-case="late-combo"]');
  const comboValue = () => comboRoot.querySelector("[data-sw-combobox-hidden-input]").value;
  app.loadCombo("astro");
  await settle();
  check(comboValue() === "astro", "late one-way Combobox value applies: " + comboValue());
  document.querySelector('[data-trigger="late-combo"]').click();
  await settle();
  check(app.bound().comboOpen === true, "bind:open opens");
  document.querySelector('[data-item="late-combo-react"]').click();
  await settle();
  check(app.bound().comboOpen === false, "bind:open closes");
  check(comboValue() === "react", "closing keeps the accepted Combobox value: " + comboValue());
  app.setComboReadOnly(true);
  await settle();
  check(comboValue() === "react", "a rebuilt Combobox keeps the accepted value: " + comboValue());
  app.setComboReadOnly(false);
  await settle();
  app.loadCombo("react");
  await settle();
  app.loadCombo("astro");
  await settle();
  check(comboValue() === "astro", "a changed late Combobox value still applies: " + comboValue());

  const sidebar = () => document.querySelector('[data-sw-sidebar-provider], #late-sidebar');
  const sidebarOpen = () => sidebar().getAttribute("data-open") ?? sidebar().querySelector("[data-state]")?.getAttribute("data-state");
  app.loadSidebar(true);
  await settle();
  const opened = sidebarOpen();
  document.querySelector('[data-trigger="late-sidebar"]').click();
  await settle();
  const closed = sidebarOpen();
  check(opened !== closed, "Sidebar trigger changes a Runtime-owned open: " + opened + " " + closed);
  app.setMobile(true);
  await settle();
  check(sidebarOpen() === closed, "a mobile model change keeps the accepted Sidebar open: " + sidebarOpen());
} catch (error) {
  failures.push(error.stack ?? String(error));
}
document.documentElement.dataset.modelTracking = JSON.stringify({ failures });
`;
