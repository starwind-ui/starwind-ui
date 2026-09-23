import assert from "node:assert/strict";
import path from "node:path";
import { svelte } from "@sveltejs/vite-plugin-svelte";
import { chromium } from "playwright";
import { createServer } from "vite";
import type { DistConsumer } from "./dist-consumer.js";

export async function verifyStyledDialogBrowser(
  consumer: DistConsumer,
  configs: DialogCase[],
  actions: string,
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
    "index.html": `<link rel="icon" href="data:,"><div id="app">${body}</div><div id="portal-a"></div><div id="portal-b"></div><script type="module" src="/main.js"></script>`,
  });
  const server = await createServer({
    root: consumer.root,
    configFile: false,
    plugins: [svelte({ configFile: false })],
    logLevel: "silent",
    cacheDir: path.join(consumer.root, ".vite-dialog"),
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
    await page.waitForFunction(() => document.documentElement.dataset.styledDialog, undefined, {
      timeout: 30_000,
    });
    const result = await page.evaluate(() =>
      JSON.parse(document.documentElement.dataset.styledDialog!),
    );
    assert.deepEqual(errors, []);
    assert.equal(result.error, undefined, result.error);
    return result;
  } finally {
    await browser?.close();
    await server.close();
  }
}

export type DialogCase = {
  id: string;
  mode?: string;
  initial?: boolean;
  defaultOpen?: boolean;
  modal?: boolean;
  proposal?: string;
  setter?: string;
  nested?: boolean;
};

const CASE = `<script lang="ts">
import { flushSync, untrack } from "svelte";
import { createAttachmentKey, type Attachment } from "svelte/attachments";
import Dialog, { type DialogProps } from "./dialog/index.js";
import { Button } from "./button/index.js";
import Select from "./select/index.js";
import type { DialogOpenChangeDetails } from "@starwind-ui/svelte/dialog";
let { id, mode = "function", initial, defaultOpen, modal: initialModal = false, proposal = "accept", setter = "identity", nested = false }: { id: string; mode?: string; initial?: boolean; defaultOpen?: boolean; modal?: boolean; proposal?: string; setter?: string; nested?: boolean } = $props();
let model = $state<boolean | undefined>(untrack(() => initial));
let modal = $state(untrack(() => initialModal));
let escape = $state(true);
let shown = $state(true);
let rootKey = $state(0);
let second = $state(false);
let className = $state("before");
let selected = $state<string | null | undefined>(undefined);
let selectOpen = $state<boolean | undefined>(undefined);
const writes: boolean[] = [];
const callbacks: { next: boolean; previous: boolean | string; owner: string }[] = [];
const completions: { model: boolean | string; native: boolean | undefined }[] = [];
const refs: string[] = [];
const closeRefs: string[] = [];
const popupRefs: string[] = [];
const headerRefs: string[] = [];
const attachments: string[] = [];
const headerAttachments: string[] = [];
const refA = (element: HTMLButtonElement | null) => { refs.push("a:" + (element?.tagName ?? "null")); };
const refB = (element: HTMLButtonElement | null) => { refs.push("b:" + (element?.tagName ?? "null")); };
const closeRef = (element: HTMLButtonElement | null) => { closeRefs.push("close:" + (element?.tagName ?? "null")); };
const popupA = (element: HTMLDialogElement | null) => { popupRefs.push("a:" + (element?.tagName ?? "null")); };
const popupB = (element: HTMLDialogElement | null) => { popupRefs.push("b:" + (element?.tagName ?? "null")); };
const headerA = (element: HTMLDivElement | null) => { headerRefs.push("a:" + (element?.tagName ?? "null")); };
const headerB = (element: HTMLDivElement | null) => { headerRefs.push("b:" + (element?.tagName ?? "null")); };
const attachment = (owner: string): Attachment<HTMLButtonElement> => () => { attachments.push(owner + ":setup"); return () => { attachments.push(owner + ":cleanup"); }; };
const headerAttachment = (owner: string): Attachment<HTMLDivElement> => () => { headerAttachments.push(owner + ":setup"); return () => { headerAttachments.push(owner + ":cleanup"); }; };
const key = createAttachmentKey(), headerKey = createAttachmentKey();
let forwarded = $state.raw({ [key]: attachment("a") });
let headerForwarded = $state.raw({ [headerKey]: headerAttachment("a") });
function handle(owner: string, next: boolean, detail: DialogOpenChangeDetails) {
 callbacks.push({ next, previous: model ?? "undefined", owner });
 if (proposal === "cancel") detail.cancel();
 if (proposal === "echo") model = next;
 if (proposal === "command-cancel") { model = true; flushSync(); detail.cancel(); }
 if (proposal === "two-commands") { model = true; flushSync(); model = false; flushSync(); }
 if (proposal === "unmount") { shown = false; flushSync(); }
}
const proposalA = (next: boolean, detail: DialogOpenChangeDetails) => handle("a", next, detail);
const proposalB = (next: boolean, detail: DialogOpenChangeDetails) => handle("b", next, detail);
function publish(next: boolean | undefined) { if (next === undefined) throw new Error("Undefined Dialog publication"); writes.push(next); if (setter === "invert") model = !next; else if (setter !== "retain") model = next; }
function complete() { completions.push({ model: model ?? "undefined", native: document.querySelector<HTMLDialogElement>('[data-popup="' + id + '"]')?.open }); }
let common = $derived({ "data-case": id, defaultOpen, modal, closeOnEscape: escape, onOpenChange: second ? proposalB : proposalA, onCloseComplete: complete } satisfies DialogProps);
export function setModel(next: boolean | undefined) { model = next; }
export function options() { modal = !modal; escape = !escape; }
export function replaceRoot() { rootKey++; }
export function replaceOwners() { second = true; forwarded = { [key]: attachment("b") }; headerForwarded = { [headerKey]: headerAttachment("b") }; }
export function changeClass() { className = "after"; }
export function hide() { shown = false; }
export function snapshot() { return { model: model ?? "undefined", selected: selected ?? null, selectOpen: selectOpen ?? false, writes: [...writes], callbacks: [...callbacks], completions: [...completions], refs: [...refs], closeRefs: [...closeRefs], popupRefs: [...popupRefs], headerRefs: [...headerRefs], attachments: [...attachments], headerAttachments: [...headerAttachments] }; }
</script>
{#snippet parts(accepted: boolean)}
  <output data-rendered={id}>{String(accepted)}</output>
  <Dialog.Trigger data-trigger={id} {...forwarded} ref={second ? refB : refA} class={className}>
    {#snippet child({ props, children })}<Button {...props}>{@render children?.()}</Button>{/snippet}Open {id}
  </Dialog.Trigger>
  <Dialog.Content data-popup={id} style="transition: opacity 40ms" ref={second ? popupB : popupA}>
    <Dialog.Header {...headerForwarded} ref={second ? headerB : headerA} class={className} data-owner={className}>
      <Dialog.Title>Dialog {id}</Dialog.Title><Dialog.Description>Choose and confirm</Dialog.Description>
    </Dialog.Header>
    <input aria-label="Name" />
    {#if nested}
      <Select.Root data-nested={id} bind:value={selected} bind:open={selectOpen} defaultValue="alpha">
        <Select.Trigger aria-label="Nested choice" placeholder="Choose">
          {#snippet child({ props, children })}<Button {...props} variant="outline">{@render children?.()}</Button>{/snippet}
          <Select.Value placeholder="Choose" />
        </Select.Trigger>
        <Select.Content aria-label="Nested choices"><Select.Item value="alpha">Alpha</Select.Item><Select.Item value="disabled" disabled>Disabled</Select.Item><Select.Item value="beta">Beta</Select.Item></Select.Content>
      </Select.Root>
    {/if}
    <Dialog.Footer><Dialog.Close data-close={id} ref={closeRef}>{#snippet child({ props, children })}<Button {...props} variant="outline">{@render children?.()}</Button>{/snippet}Close {id}</Dialog.Close></Dialog.Footer>
  </Dialog.Content>
{/snippet}
{#if shown}{#key rootKey}
  {#if mode === "omitted"}<Dialog.Root {...common} children={parts} />
  {:else if mode === "plain"}<Dialog.Root {...common} open={model} children={parts} />
  {:else if mode === "bound"}<Dialog.Root {...common} bind:open={model} children={parts} />
  {:else}<Dialog.Root {...common} bind:open={() => model, publish} children={parts} />{/if}
{/key}{/if}`;

function main(actions: string) {
  return `import { hydrate, unmount, flushSync, tick } from "svelte"; import App from "./App.svelte";
const assert = (value, message) => { if (!value) throw new Error(message); };
try {
const target = document.getElementById("app");
const before = [...target.querySelectorAll("[data-trigger]")];
const app = hydrate(App, { target });
const settle = async () => { flushSync(); await tick(); flushSync(); };
const finish = async () => { for (let index = 0; index < 8; index++) { await new Promise(requestAnimationFrame); await settle(); } };
await settle();
const cases = app.getCases();
assert(Object.values(cases).every((entry) => entry.snapshot().refs[0] === "a:BUTTON" && entry.snapshot().closeRefs[0] === "close:BUTTON"), "Dialog direct child refs");
const root = (id) => document.querySelector('[data-case="' + id + '"]');
const popup = (id) => document.querySelector('[data-popup="' + id + '"]');
const button = (id) => document.querySelector('[data-trigger="' + id + '"]');
const trigger = (id) => button(id)?.click();
const close = (id) => document.querySelector('[data-close="' + id + '"]')?.click();
const state = (id) => ({ ...cases[id].snapshot(), native: popup(id)?.open ?? null, topLayer: popup(id)?.matches(":modal") ?? false, rendered: document.querySelector('[data-rendered="' + id + '"]')?.textContent ?? null });
assert(before.every((node,index) => node === target.querySelectorAll("[data-trigger]")[index]), "Dialog hydration replaced trigger owners");
assert(before.every((node) => node.tagName === "BUTTON" && node.hasAttribute("data-sw-button") && node.querySelectorAll("button").length === 0 && node.getAttribute("data-slot") === "dialog-trigger"), "Dialog Styled Button composition ownership");
const result = await (async () => { ${actions} })();
const oldCases = { ...cases }, staleButtons = Object.keys(cases).map(button).filter(Boolean), stalePopups = Object.keys(cases).map(popup).filter(Boolean);
await unmount(app); await finish();
const final = Object.fromEntries(Object.entries(oldCases).map(([id, entry]) => [id, entry.snapshot()]));
assert(Object.values(final).every((entry) => entry.refs.at(-1)?.endsWith(":null") && entry.closeRefs.at(-1) === "close:null"), "Dialog direct child ref cleanup");
const beforeStale = Object.values(oldCases).map((entry) => entry.snapshot().callbacks.length);
for (const node of staleButtons) node.click(); for (const node of stalePopups) node.dispatchEvent(new Event("cancel", { cancelable: true })); await finish();
assert(JSON.stringify(beforeStale) === JSON.stringify(Object.values(oldCases).map((entry) => entry.snapshot().callbacks.length)), "Dialog stale callbacks");
assert(document.querySelectorAll("[data-sw-dialog], [data-sw-select-portal], :modal").length === 0, "Dialog leaked native or portal owners");
assert(!document.body.hasAttribute("data-sw-scroll-locked"), "Dialog leaked scroll lock");
document.documentElement.dataset.styledDialog = JSON.stringify({ ...result, final });
} catch (error) { document.documentElement.dataset.styledDialog = JSON.stringify({ error: String(error), stack: error.stack }); }
`;
}
