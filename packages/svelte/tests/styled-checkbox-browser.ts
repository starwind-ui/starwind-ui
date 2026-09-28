import assert from "node:assert/strict";
import path from "node:path";
import { svelte } from "@sveltejs/vite-plugin-svelte";
import { chromium } from "playwright";
import { createServer } from "vite";
import type { DistConsumer } from "./dist-consumer.js";

export async function verifyStyledCheckboxBrowser(consumer: DistConsumer) {
  await consumer.write({
    "Case.svelte": CASE,
    "App.svelte": APP,
    "main.js": MAIN,
    "ssr.mjs":
      'import { render } from "svelte/server"; import App from "./App.svelte"; console.log(JSON.stringify({body: render(App).body}));',
  });
  const { body } = JSON.parse(await consumer.run("ssr.mjs", { loader: true }));
  await consumer.write({
    "index.html": `<link rel="icon" href="data:,"><div id="app">${body}</div><script type="module" src="/main.js"></script>`,
  });
  const server = await createServer({
    root: consumer.root,
    configFile: false,
    plugins: [svelte({ configFile: false })],
    logLevel: "silent",
    cacheDir: path.join(consumer.root, ".vite-checkbox"),
    resolve: { dedupe: ["svelte"] },
    server: { host: "127.0.0.1", port: 0, hmr: false, watch: null },
  });
  let browser;
  try {
    await server.listen();
    browser = await chromium.launch({ channel: "chrome", headless: true });
    const page = await browser.newPage();
    const errors: string[] = [];
    page.on("pageerror", (error) => errors.push(error.message));
    page.on("console", (message) => {
      if (["warning", "error"].includes(message.type())) errors.push(message.text());
    });
    const url = server.resolvedUrls?.local[0];
    assert.ok(url);
    await page.goto(url);
    await page.waitForFunction(() => document.documentElement.dataset.styledCheckbox, undefined, {
      timeout: 30_000,
    });
    const result = await page.evaluate(() =>
      JSON.parse(document.documentElement.dataset.styledCheckbox!),
    );
    assert.deepEqual(errors, []);
    assert.equal(result.error, undefined, result.error);
    return result;
  } finally {
    await browser?.close();
    await server.close();
  }
}

const CASE = `<script lang="ts">
import { untrack } from "svelte";
import { createAttachmentKey, type Attachment } from "svelte/attachments";
import Checkbox, { type CheckboxProps } from "./checkbox/index.js";
import type { CheckboxCheckedChangeDetails } from "@starwind-ui/svelte/checkbox";
let { id, mode = "bound", initial, defaultChecked, behavior = "accept" }: { id: string; mode?: string; initial?: boolean; defaultChecked?: boolean; behavior?: string } = $props();
let model = $state<boolean | undefined>(untrack(() => initial));
let seed = $state(untrack(() => defaultChecked));
let disabled = $state(false);
let mixed = $state(false);
let readOnly = $state(false);
let shown = $state(true);
let second = $state(false);
let className = $state("before");
const callbacks: { next: boolean; previous: boolean | string; owner: string }[] = [];
const writes: boolean[] = [];
const refs: string[] = [];
const attachments: string[] = [];
const refA = (element: HTMLSpanElement | HTMLButtonElement | null) => { refs.push("a:" + (element?.tagName ?? "null")); };
const refB = (element: HTMLSpanElement | HTMLButtonElement | null) => { refs.push("b:" + (element?.tagName ?? "null")); };
const attachment = (name: string): Attachment<HTMLElement> => () => { attachments.push(name + ":setup"); return () => { attachments.push(name + ":cleanup"); }; };
const key = createAttachmentKey();
let forwarded = $state.raw({ [key]: attachment("a") });
function propose(owner: string, next: boolean, detail: CheckboxCheckedChangeDetails) {
  callbacks.push({ next, previous: model ?? "undefined", owner });
  if (behavior === "cancel") detail.cancel();
}
const proposalA = (next: boolean, detail: CheckboxCheckedChangeDetails) => propose("a", next, detail);
const proposalB = (next: boolean, detail: CheckboxCheckedChangeDetails) => propose("b", next, detail);
function publish(next: boolean | undefined) { if (next === undefined) throw new Error("Unexpected undefined publication"); writes.push(next); model = next; }
let common = $derived({ id: id + "-input", "data-case": id, defaultChecked: seed, disabled, indeterminate: mixed, readOnly, name: "choice", value: "yes", uncheckedValue: "no", label: id, class: className, ref: second ? refB : refA, onCheckedChange: second ? proposalB : proposalA, ...forwarded } satisfies CheckboxProps);
export function setModel(next: boolean | undefined) { model = next; }
export function setDefault(next: boolean) { seed = next; }
export function setDisabled(next: boolean) { disabled = next; }
export function setMixed(next: boolean) { mixed = next; }
export function setReadOnly(next: boolean) { readOnly = next; }
export function changeClass() { className = "after"; }
export function replaceOwners() { second = true; forwarded = { [key]: attachment("b") }; }
export function hide() { shown = false; }
export function show() { shown = true; }
export function snapshot() { return { model: model ?? "undefined", callbacks: [...callbacks], writes: [...writes], refs: [...refs], attachments: [...attachments] }; }
</script>
<form id={id}>
{#if shown}
  {#if mode === "omitted"}<Checkbox {...common} />
  {:else if mode === "plain"}<Checkbox {...common} checked={model} />
  {:else if mode === "function"}<Checkbox {...common} bind:checked={() => model, publish} />
  {:else}<Checkbox {...common} bind:checked={model} />{/if}
{/if}
</form>`;

const APP = `<script lang="ts">
import Case from "./Case.svelte";
import Checkbox from "./checkbox/index.js";
const cases: Record<string, any> = {};
const configs = [
{ id: "omitted", mode: "omitted" }, { id: "defaulted", mode: "omitted", defaultChecked: true },
{ id: "plain", mode: "plain", initial: false, defaultChecked: true }, { id: "undefined", defaultChecked: true },
{ id: "bound", initial: false }, { id: "function", mode: "function", initial: false },
{ id: "cancel", mode: "function", initial: false, behavior: "cancel" }, { id: "dom", mode: "function", initial: false },
{ id: "owners", initial: false }
];
export function getCases() { return cases; }
</script>
{#each configs as config (config.id)}<Case {...config} bind:this={cases[config.id]} />{/each}
<form id="native-form"><Checkbox id="native-input" data-case="native" nativeButton name="native" value="yes" label="Native button" /></form>`;

const MAIN = `import { hydrate, unmount, flushSync, tick } from "svelte"; import App from "./App.svelte";
const assert = (value, message) => { if (!value) throw new Error(message); };
try {
const target = document.getElementById("app");
const before = [...target.querySelectorAll("[data-slot=checkbox]")];
const app = hydrate(App, { target });
const settle = async () => { flushSync(); await tick(); await Promise.resolve(); flushSync(); };
const resetSettled = async () => { await new Promise((resolve) => setTimeout(resolve, 20)); await settle(); };
await settle();
const cases = app.getCases();
const root = (id) => document.querySelector('[data-case="' + id + '"]');
const state = (id) => ({ ...cases[id].snapshot(), checked: root(id).getAttribute("aria-checked"), form: new FormData(document.getElementById(id)).get("choice") });
assert(before.every((node,index) => node === target.querySelectorAll("[data-slot=checkbox]")[index]), "Checkbox hydration replaced semantic owners");
const initial = Object.fromEntries(Object.keys(cases).map((id) => [id, state(id)]));
for (const id of ["omitted", "defaulted", "plain", "undefined", "bound", "function"]) { root(id).click(); await settle(); }
const interactions = Object.fromEntries(["omitted", "defaulted", "plain", "undefined", "bound", "function"].map((id) => [id,state(id)]));
const observations = [];
for (const id of ["cancel", "dom"]) root(id).addEventListener("starwind:checked-change", (event) => {
  observations.push({ id, canceled: event.detail.isCanceled, model: cases[id].snapshot().model });
  if (id === "dom") event.preventDefault();
});
for (const id of ["cancel", "dom"]) { root(id).click(); await settle(); }
const cancellation = Object.fromEntries(["cancel", "dom"].map((id) => [id, state(id)]));
cases.plain.setModel(true); await settle(); cases.plain.setModel(undefined); await settle();
const laterUndefined = state("plain");
cases.plain.setModel(false); await settle(); const silent = state("plain");
cases.plain.setDefault(false); await settle(); document.getElementById("plain").reset(); await resetSettled(); const reset = state("plain");
cases.bound.setDisabled(true); await settle(); const disabled = state("bound");
cases.bound.setDisabled(false); cases.bound.setMixed(true); await settle(); const mixed = state("bound");
cases.bound.setReadOnly(true); await settle(); root("bound").click(); await settle(); const readOnly = state("bound");
const owner = root("owners"); const ownersBefore = state("owners");
cases.owners.changeClass(); await settle(); const ownersClass = state("owners");
cases.owners.replaceOwners(); await settle(); const ownersReplaced = state("owners");
owner.click(); await settle(); const ownersClicked = state("owners");
assert(owner === root("owners"), "Checkbox callback replacement replaced its root");
const native = root("native"); assert(native.tagName === "BUTTON" && native.querySelectorAll("input").length === 0 && native.nextElementSibling.hasAttribute("data-sw-checkbox-input"), "Checkbox native form placement");
document.querySelector('label[for="native-input"]').click(); await settle();
const nativeForm = new FormData(document.getElementById("native-form")).get("native");
const oldCases = { ...cases }; await unmount(app); await settle();
owner.click(); native.click(); await settle();
const finalOwners = oldCases.owners.snapshot();
assert(!target.querySelector("[data-slot=checkbox], input"), "Checkbox left form inputs after teardown");
document.documentElement.dataset.styledCheckbox = JSON.stringify({ initial, interactions, observations, cancellation, laterUndefined, silent, reset, disabled, mixed, readOnly, ownersBefore, ownersClass, ownersReplaced, ownersClicked, finalOwners, nativeForm });
} catch (error) { document.documentElement.dataset.styledCheckbox = JSON.stringify({error: String(error)}); }`;
