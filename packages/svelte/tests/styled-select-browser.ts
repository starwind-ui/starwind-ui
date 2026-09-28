import assert from "node:assert/strict";
import path from "node:path";
import { svelte } from "@sveltejs/vite-plugin-svelte";
import { chromium } from "playwright";
import { createServer } from "vite";
import type { DistConsumer } from "./dist-consumer.js";

export async function verifyStyledSelectBrowser(
  consumer: DistConsumer,
  configs: SelectCase[],
  actions: string,
  css = "",
) {
  await consumer.write({
    "Case.svelte": CASE,
    "App.svelte": `<script lang="ts">import Case from "./Case.svelte"; const configs = ${JSON.stringify(configs)}; const cases: Record<string, any> = {}; export function getCases() { return cases; }</script>{#each configs as config (config.id)}<Case {...config} bind:this={cases[config.id]} />{/each}`,
    "main.js": main(actions),
    "ssr.mjs":
      'import { render } from "svelte/server"; import App from "./App.svelte"; console.log(JSON.stringify({body: render(App).body}));',
  });
  const { body } = JSON.parse(await consumer.run("ssr.mjs", { loader: true }));
  await consumer.write({
    "index.html": `<link rel="icon" href="data:,"><style>${css}</style><div id="app">${body}</div><div id="portal-a"></div><div id="portal-b"></div><script type="module" src="/main.js"></script>`,
  });
  const server = await createServer({
    root: consumer.root,
    configFile: false,
    plugins: [svelte({ configFile: false })],
    logLevel: "silent",
    cacheDir: path.join(consumer.root, ".vite-select"),
    resolve: { dedupe: ["svelte"] },
    server: { host: "127.0.0.1", port: 0, hmr: false, watch: null },
  });
  let browser;
  try {
    await server.listen();
    browser = await chromium.launch({ channel: "chrome", headless: true });
    const page = await browser.newPage();
    await page.exposeFunction("resizeSelectViewport", (width: number) =>
      page.setViewportSize({ width, height: 800 }),
    );
    const errors: string[] = [];
    page.on("pageerror", (error) => errors.push(error.message));
    page.on("console", (message) => {
      if (["warning", "error"].includes(message.type())) errors.push(message.text());
    });
    const url = server.resolvedUrls?.local[0];
    assert.ok(url);
    await page.goto(url);
    await page.waitForFunction(() => document.documentElement.dataset.styledSelect, undefined, {
      timeout: 30_000,
    });
    const result = await page.evaluate(() =>
      JSON.parse(document.documentElement.dataset.styledSelect!),
    );
    assert.deepEqual(errors, []);
    assert.equal(result.error, undefined, result.error);
    return result;
  } finally {
    await browser?.close();
    await server.close();
  }
}

export type SelectCase = {
  id: string;
  mode?: string;
  initialOpen?: boolean;
  initialValue?: string | null;
  defaultOpen?: boolean;
  defaultValue?: string | null;
  openProposal?: string;
  valueProposal?: string;
  openSetter?: string;
  valueSetter?: string;
};

const CASE = `<script lang="ts">
import { flushSync, untrack } from "svelte";
import { createAttachmentKey, type Attachment } from "svelte/attachments";
import Select, { type SelectProps } from "./select/index.js";
import { Button } from "./button/index.js";
import type { SelectOpenChangeDetails, SelectValueChangeDetails } from "@starwind-ui/svelte/select";
let { id, mode = "function", initialOpen, initialValue, defaultOpen, defaultValue, openSetter = "identity", valueSetter = "identity", openProposal = "accept", valueProposal = "accept" }: { id: string; mode?: string; initialOpen?: boolean; initialValue?: string | null; defaultOpen?: boolean; defaultValue?: string | null; openSetter?: string; valueSetter?: string; openProposal?: string; valueProposal?: string } = $props();
let openModel = $state<boolean | undefined>(untrack(() => initialOpen));
let valueModel = $state<string | null | undefined>(untrack(() => initialValue));
let openSeed = $state(untrack(() => defaultOpen));
let valueSeed = $state(untrack(() => defaultValue));
let shown = $state(true);
let readOnly = $state(false);
let disabled = $state(false);
let disablePortal = $state(false);
let container = $state<string | HTMLElement>("#portal-a");
let triggerKey = $state(0);
let second = $state(false);
let className = $state("before");
let popupClass = $state("");
let popupStyle = $state("");
const openWrites: boolean[] = [];
const valueWrites: (string | null)[] = [];
const openCallbacks: {next: boolean; open: boolean | undefined; value: string | null | undefined; owner: string}[] = [];
const valueCallbacks: {next: string | null; open: boolean | undefined; value: string | null | undefined}[] = [];
const refs: string[] = [];
const attachments: string[] = [];
const popupRefs: string[] = [];
const rootRefs: string[] = [];
const refA = (element: HTMLButtonElement | null) => { refs.push("a:" + (element?.tagName ?? "null")); };
const refB = (element: HTMLButtonElement | null) => { refs.push("b:" + (element?.tagName ?? "null")); };
const popupA = (element: HTMLDivElement | null) => { popupRefs.push("a:" + (element?.tagName ?? "null")); };
const popupB = (element: HTMLDivElement | null) => { popupRefs.push("b:" + (element?.tagName ?? "null")); };
const rootRef = (element: HTMLDivElement | null) => { rootRefs.push(element?.tagName ?? "null"); };
const attachment = (owner: string): Attachment<HTMLButtonElement> => () => { attachments.push(owner + ":setup"); return () => { attachments.push(owner + ":cleanup"); }; };
const key = createAttachmentKey();
let forwarded = $state.raw({ [key]: attachment("a") });
function handleOpen(owner: string, next: boolean, detail: SelectOpenChangeDetails) {
  openCallbacks.push({ next, open: openModel, value: valueModel, owner });
  if (openProposal === "cancel") detail.cancel();
  if (openProposal === "echo") openModel = next;
  if (openProposal === "value-command-cancel") { valueModel = "gamma"; flushSync(); detail.cancel(); }
}
const openA = (next: boolean, detail: SelectOpenChangeDetails) => handleOpen("a", next, detail);
const openB = (next: boolean, detail: SelectOpenChangeDetails) => handleOpen("b", next, detail);
function handleValue(next: string | null, detail: SelectValueChangeDetails) {
  valueCallbacks.push({ next, open: openModel, value: valueModel });
  if (valueProposal === "cancel") detail.cancel();
  if (valueProposal === "echo") valueModel = next;
  if (valueProposal === "both-command-cancel") { openModel = false; flushSync(); openModel = true; valueModel = "gamma"; flushSync(); detail.cancel(); }
}
function publishOpen(next: boolean | undefined) { if (next === undefined) throw new Error("Undefined open publication"); openWrites.push(next); if (openSetter === "identity") openModel = next; }
function publishValue(next: string | null | undefined) { if (next === undefined) throw new Error("Undefined value publication"); valueWrites.push(next); if (valueSetter === "identity") valueModel = next; else if (valueSetter === "transform") valueModel = next === "beta" ? "gamma" : next; }
let common = $derived({ "data-case": id, defaultOpen: openSeed, defaultValue: valueSeed, disabled, readOnly, modal: false, name: "choice", onOpenChange: second ? openB : openA, onValueChange: handleValue, ref: rootRef } satisfies SelectProps);
export function setOpen(next: boolean | undefined) { openModel = next; }
export function setValue(next: string | null | undefined) { valueModel = next; }
export function setDefault(next: string | null | undefined) { valueSeed = next; }
export function setDisabled(next: boolean) { disabled = next; }
export function setReadOnly(next: boolean) { readOnly = next; }
export function retarget(next: string | HTMLElement) { container = next; }
export function setDisablePortal(next: boolean) { disablePortal = next; }
export function stylePopup(className: string, style: string) { popupClass = className; popupStyle = style; }
export function changeClass() { className = "after"; }
export function replaceOwners() { second = true; forwarded = { [key]: attachment("b") }; }
export function replaceTrigger() { triggerKey += 1; }
export function hide() { shown = false; }
export function snapshot() { return { openModel: openModel ?? "undefined", valueModel: valueModel === undefined ? "undefined" : valueModel, openWrites: [...openWrites], valueWrites: [...valueWrites], openCallbacks: [...openCallbacks], valueCallbacks: [...valueCallbacks], refs: [...refs], attachments: [...attachments], popupRefs: [...popupRefs], rootRefs: [...rootRefs] }; }
</script>
<form id={id + "-form"}>
{#snippet parts()}
  <Select.Trigger ref={second ? refB : refA} {...forwarded} class={className} aria-label={id} placeholder="Choose">
    {#snippet child({ props, children })}{#key triggerKey}<Button {...props} variant="outline">{@render children?.()}</Button>{/key}{/snippet}
    <Select.Value placeholder="Choose" />
  </Select.Trigger>
  <Select.Content class={popupClass} style={popupStyle} data-model-popup={id} portalContainer={container} {disablePortal} ref={second ? popupB : popupA}>
    <Select.Group><Select.Label>Choices</Select.Label>
      <Select.Item value="alpha">Alpha</Select.Item><Select.Item value="disabled" disabled>Disabled</Select.Item>
      <Select.Item value="beta">Beta</Select.Item><Select.Item value="gamma">Gamma</Select.Item>
    </Select.Group>
    <Select.Separator /><Select.Item value="">Empty</Select.Item>
  </Select.Content>
{/snippet}
{#if shown}
  {#if mode === "omitted"}<Select.Root {...common} children={parts} />
  {:else if mode === "plain"}<Select.Root {...common} open={openModel} value={valueModel} children={parts} />
  {:else if mode === "bound"}<Select.Root {...common} bind:open={openModel} bind:value={valueModel} children={parts} />
  {:else if mode === "open-only"}<Select.Root {...common} bind:open={() => openModel, publishOpen} children={parts} />
  {:else if mode === "value-only"}<Select.Root {...common} bind:value={() => valueModel, publishValue} children={parts} />
  {:else}<Select.Root {...common} bind:open={() => openModel, publishOpen} bind:value={() => valueModel, publishValue} children={parts} />{/if}
{/if}
<output>{String(openModel)}:{String(valueModel)}:{openWrites.length}:{valueWrites.length}</output>
</form>`;

function main(actions: string) {
  return `import { hydrate, unmount, flushSync, tick } from "svelte"; import App from "./App.svelte";
const assert = (value, message) => { if (!value) throw new Error(message); };
try {
const target = document.getElementById("app");
const before = [...target.querySelectorAll("[data-sw-select-trigger]")];
const app = hydrate(App, { target });
const settle = async () => { flushSync(); await tick(); flushSync(); };
const resetSettled = async () => { await new Promise((resolve) => setTimeout(resolve, 20)); await settle(); };
await settle();
const cases = app.getCases();
const root = (id) => document.querySelector('[data-case="' + id + '"]');
const popup = (id) => document.querySelector('[data-model-popup="' + id + '"]');
const portal = (id) => popup(id)?.closest("[data-sw-select-portal]");
const form = (id) => document.getElementById(id + "-form");
const button = (id) => root(id)?.querySelector("[data-sw-select-trigger]");
const trigger = (id) => button(id)?.click();
const choose = (id, value) => popup(id)?.querySelector('[data-sw-select-item][data-value="' + value + '"]')?.click();
const reset = (id) => form(id).reset();
const state = (id) => ({ ...cases[id].snapshot(), exists: !!root(id), open: root(id)?.getAttribute("data-state") === "open", value: root(id)?.getAttribute("data-value") ?? null, label: button(id)?.querySelector("[data-slot=select-value]")?.textContent.trim(), formValue: new FormData(form(id)).get("choice"), portalParent: portal(id)?.parentElement?.id ?? null, popupHidden: popup(id)?.hidden ?? null });
assert(before.every((node,index) => node === target.querySelectorAll("[data-sw-select-trigger]")[index]), "Select hydration replaced trigger owners");
assert(before.every((node) => node.tagName === "BUTTON" && node.hasAttribute("data-sw-button") && node.querySelectorAll("button").length === 0 && node.getAttribute("data-slot") === "select-trigger"), "Styled trigger composition changed native ownership");
const result = await (async () => { ${actions} })();
const oldCases = { ...cases }; const staleButtons = Object.keys(cases).map(button).filter(Boolean);
await unmount(app); await resetSettled();
const beforeStale = Object.values(oldCases).map((entry) => entry.snapshot().openCallbacks.length);
for (const node of staleButtons) node.click(); await settle();
assert(JSON.stringify(beforeStale) === JSON.stringify(Object.values(oldCases).map((entry) => entry.snapshot().openCallbacks.length)), "Select stale trigger callbacks");
assert(document.querySelectorAll("[data-sw-select], [data-sw-select-portal]").length === 0, "Select leaked portal or root after unmount");
document.documentElement.dataset.styledSelect = JSON.stringify({ ...result, final: Object.fromEntries(Object.entries(oldCases).map(([id, entry]) => [id, entry.snapshot()])) });
} catch (error) { document.documentElement.dataset.styledSelect = JSON.stringify({ error: String(error), stack: error.stack }); }
`;
}
