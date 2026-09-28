import assert from "node:assert/strict";
import { once } from "node:events";
import { readFile } from "node:fs/promises";
import { createServer } from "node:http";
import { chromium } from "playwright";
import { createBrowserBuildScript } from "./compatibility-hydration.js";
import type { DistConsumer } from "./dist-consumer.js";

export type AlertDialogCase = {
  id: string;
  mode?: "omitted" | "plain" | "bound" | "function";
  initial?: boolean;
  defaultOpen?: boolean;
  modal?: boolean;
  proposal?: string;
  setter?: string;
  portal?: boolean;
  missingPopup?: boolean;
  nested?: boolean;
  controlsInitially?: boolean;
};

/** Runs the same public model and lifecycle assertions through either generated surface. */
export async function verifyAlertDialogBrowser(
  consumer: DistConsumer,
  configs: AlertDialogCase[],
  actions: string,
  styled = false,
) {
  await consumer.write({
    "Case.svelte": alertDialogCaseSource(styled),
    "App.svelte": `<script lang="ts">import Case from "./Case.svelte"; const configs = ${JSON.stringify(configs)}; const cases: Record<string, any> = {}; export function getCases() { return cases; }</script>{#each configs as config (config.id)}<Case {...config} bind:this={cases[config.id]} />{/each}`,
    "hydrate-main.js": main(actions),
    "build-browser.mjs": createBrowserBuildScript(true),
    "ssr.mjs":
      'import { render } from "svelte/server"; import App from "./App.svelte"; console.log(JSON.stringify({body: render(App).body}));',
  });
  const first = JSON.parse(await consumer.run("ssr.mjs", { loader: true }));
  const second = JSON.parse(await consumer.run("ssr.mjs", { loader: true }));
  assert.equal(first.body, second.body, "SSR must be deterministic and request-local");
  const build = JSON.parse(await consumer.run("build-browser.mjs"));
  const javascript = await readFile(`${consumer.root}/browser.js`);
  const server = createServer((request, response) => {
    if (request.url === "/browser.js") {
      response.setHeader("Content-Type", "text/javascript");
      response.end(javascript);
    } else {
      response.setHeader("Content-Type", "text/html");
      response.end(
        `<link rel="icon" href="data:,"><button id="outside">Outside</button><div id="app">${first.body}</div><div id="portal-a"></div><div id="portal-b"></div><script type="module" src="/browser.js"></script>`,
      );
    }
  });
  server.listen(0, "127.0.0.1");
  await once(server, "listening");
  let browser;
  try {
    browser = await chromium.launch({ channel: "chrome", headless: true });
    const page = await browser.newPage();
    const errors: string[] = [];
    page.on("pageerror", (error) => errors.push(error.message));
    page.on("console", (message) => {
      if (["warning", "error"].includes(message.type())) errors.push(message.text());
    });
    const address = server.address();
    assert.ok(address && typeof address === "object");
    await page.goto(`http://127.0.0.1:${address.port}`);
    await page.waitForFunction(
      () => document.documentElement.dataset.alertDialogResult,
      undefined,
      { timeout: 30_000 },
    );
    const result = await page.evaluate(() =>
      JSON.parse(document.documentElement.dataset.alertDialogResult!),
    );
    assert.deepEqual(errors, []);
    assert.equal(result.error, undefined, result.stack ?? result.error);
    return { ...result, build };
  } finally {
    await browser?.close();
    await new Promise<void>((resolve, reject) =>
      server.close((error) => (error ? reject(error) : resolve())),
    );
  }
}

export function alertDialogCaseSource(styled: boolean): string {
  const importLine = styled
    ? 'import Overlay, { type AlertDialogProps as RootProps } from "./alert-dialog/index.js";'
    : 'import Overlay from "@starwind-ui/svelte/alert-dialog"; import type { ComponentProps } from "svelte"; type RootProps = ComponentProps<typeof Overlay.Root>;';
  const popup = styled ? "Content" : "Popup";
  const controls = styled
    ? `<Overlay.Footer>{#key closeKey}{#if anchor}<Overlay.Action href="#confirmed" onclick={(event) => event.preventDefault()} data-close={id}>Confirm</Overlay.Action>{:else}<Overlay.Action data-close={id} ref={closeRef}>{#snippet child({ props, children })}<button {...props}>{@render children?.()}</button>{/snippet}Confirm</Overlay.Action>{/if}<Overlay.Cancel data-cancel={id}>Cancel</Overlay.Cancel>{/key}</Overlay.Footer>`
    : `{#key closeKey}<Overlay.Close data-close={id} ref={closeRef}>{#snippet child({ props, children })}<button {...props}>{@render children?.()}</button>{/snippet}Close</Overlay.Close>{/key}`;
  return `<script lang="ts">
import { flushSync, untrack } from "svelte";
import { createAttachmentKey, type Attachment } from "svelte/attachments";
${importLine}
import Primitive, { AlertDialogPortal } from "@starwind-ui/svelte/alert-dialog";
import Dialog from "@starwind-ui/svelte/dialog";
import type { AlertDialogOpenChangeDetails } from "@starwind-ui/svelte/alert-dialog";
let { id, mode = "function", initial, defaultOpen, modal: initialModal = true, proposal = "accept", setter = "identity", portal = false, missingPopup = false, nested = false, controlsInitially = true }: { id: string; mode?: string; initial?: boolean; defaultOpen?: boolean; modal?: boolean; proposal?: string; setter?: string; portal?: boolean; missingPopup?: boolean; nested?: boolean; controlsInitially?: boolean } = $props();
let model = $state<boolean | undefined>(untrack(() => initial));
let modal = $state(untrack(() => initialModal));
let escape = $state(true);
let shown = $state(true);
let showPopup = $state(!untrack(() => missingPopup));
let popupKey = $state(0), backdropKey = $state(0), closeKey = $state(0), triggerKey = $state(0), portalKey = $state(0);
let titleKey = $state(0), descriptionKey = $state(0), viewportKey = $state(0);
let anchor = $state(false), second = $state(false);
let showControls = $state(untrack(() => controlsInitially));
let container = $state<string | HTMLElement>("#portal-a"), disablePortal = $state(false);
let className = $state("before");
const writes: boolean[] = [], callbacks: { next: boolean; previous: boolean | string; owner: string }[] = [], completions: { model: boolean | string; native: boolean | undefined }[] = [];
const refs: string[] = [], closeRefs: string[] = [], attachments: string[] = [], popupRefs: string[] = [];
const refA = (element: HTMLButtonElement | null) => { refs.push("a:" + (element?.tagName ?? "null")); };
const refB = (element: HTMLButtonElement | null) => { refs.push("b:" + (element?.tagName ?? "null")); };
const closeRef = (element: HTMLButtonElement | null) => { closeRefs.push("close:" + (element?.tagName ?? "null")); };
const popupA = (element: HTMLDialogElement | null) => { popupRefs.push("a:" + (element?.tagName ?? "null")); };
const popupB = (element: HTMLDialogElement | null) => { popupRefs.push("b:" + (element?.tagName ?? "null")); };
const attachment = (owner: string): Attachment<HTMLButtonElement> => () => { attachments.push(owner + ":setup"); return () => { attachments.push(owner + ":cleanup"); }; };
const key = createAttachmentKey();
let forwarded = $state.raw({ [key]: attachment("a") });
function handle(owner: string, next: boolean, detail: AlertDialogOpenChangeDetails) {
 callbacks.push({ next, previous: model ?? "undefined", owner });
 if (proposal === "cancel") detail.cancel();
 if (proposal === "command-cancel") { model = true; flushSync(); detail.cancel(); }
 if (proposal === "two-commands") { model = true; flushSync(); model = false; flushSync(); }
 if (proposal === "unmount") { shown = false; flushSync(); }
}
const proposalA = (next: boolean, detail: AlertDialogOpenChangeDetails) => handle("a", next, detail);
const proposalB = (next: boolean, detail: AlertDialogOpenChangeDetails) => handle("b", next, detail);
function publish(next: boolean | undefined) { if (next === undefined) throw new Error("Undefined Alert Dialog publication"); writes.push(next); if (setter === "invert") model = !next; else if (setter !== "retain") model = next; }
function complete() { completions.push({ model: model ?? "undefined", native: document.querySelector<HTMLDialogElement>('[data-popup="' + id + '"]')?.open }); }
let common = $derived({ "data-case": id, defaultOpen, modal, closeOnEscape: escape, onOpenChange: second ? proposalB : proposalA, onCloseComplete: complete } satisfies RootProps);
export function setModel(next: boolean | undefined) { model = next; }
export function options() { modal = !modal; escape = !escape; }
export function replace(part: string) { if (part === "popup") popupKey++; else if (part === "backdrop") backdropKey++; else if (part === "close") closeKey++; else if (part === "trigger") triggerKey++; else if (part === "portal") portalKey++; else if (part === "title") titleKey++; else if (part === "description") descriptionKey++; else if (part === "viewport") viewportKey++; }
export function setAnchor(value: boolean) { anchor = value; closeKey++; }
export function setControls(value: boolean) { showControls = value; }
export function setPopup(value: boolean) { showPopup = value; }
export function place(value: string | HTMLElement, disabled = false) { container = value; disablePortal = disabled; }
export function replaceOwners() { second = true; forwarded = { [key]: attachment("b") }; }
export function changeClass() { className = "after"; }
export function hide() { shown = false; }
export function snapshot() { return { model: model ?? "undefined", writes: [...writes], callbacks: [...callbacks], completions: [...completions], refs: [...refs], closeRefs: [...closeRefs], popupRefs: [...popupRefs], attachments: [...attachments] }; }
</script>
{#snippet surface()}
${styled ? "" : "{#key backdropKey}<Overlay.Backdrop data-backdrop={id} />{/key}"}
${styled ? "" : "{#key viewportKey}<Overlay.Viewport data-viewport={id}>"}
{#if showPopup}{#key popupKey}<Overlay.${popup} data-popup={id} style="transition: opacity 40ms" ref={second ? popupB : popupA}>
${styled ? "{#snippet backdrop()}{#key backdropKey}<div data-sw-alert-dialog-backdrop data-backdrop={id} hidden></div>{/key}{/snippet}<Overlay.Header>" : ""}
{#key titleKey}<Overlay.Title data-title={id}>Confirm {id}</Overlay.Title>{/key}{#key descriptionKey}<Overlay.Description data-description={id}>Review this confirmation</Overlay.Description>{/key}
${styled ? "</Overlay.Header>" : ""}
<input aria-label="Name" data-input={id} />{#if showControls}${controls}{/if}
{#if nested}
<Primitive.Root data-nested-root={id}><Primitive.Trigger data-nested-trigger={id}>Nested confirmation</Primitive.Trigger><Primitive.Portal><Primitive.Popup data-nested-popup={id}><Primitive.Title>Nested confirmation</Primitive.Title><Primitive.Close data-nested-close={id}>Close nested</Primitive.Close></Primitive.Popup></Primitive.Portal></Primitive.Root>
<Dialog.Root><Dialog.Trigger data-dialog-trigger={id}>Nested dialog</Dialog.Trigger><Dialog.Popup data-dialog-popup={id}><Dialog.Title>Dialog</Dialog.Title><Dialog.Close data-dialog-close={id}>Close Dialog</Dialog.Close></Dialog.Popup></Dialog.Root>
{/if}
</Overlay.${popup}>{/key}{/if}
${styled ? "" : "</Overlay.Viewport>{/key}"}
{/snippet}
{#snippet parts(accepted: boolean)}
<output data-rendered={id}>{String(accepted)}</output>
{#key triggerKey}<Overlay.Trigger data-trigger={id} {...forwarded} ref={second ? refB : refA} class={className}>{#snippet child({ props, children })}<button {...props}>{@render children?.()}</button>{/snippet}Open {id}</Overlay.Trigger>{/key}
{#if portal}{#key portalKey}<AlertDialogPortal data-portal={id} {container} disabled={disablePortal}>{@render surface()}</AlertDialogPortal>{/key}{:else}{@render surface()}{/if}
{/snippet}
{#if shown}
{#if mode === "omitted"}<Overlay.Root {...common} children={parts} />
{:else if mode === "plain"}<Overlay.Root {...common} open={model} children={parts} />
{:else if mode === "bound"}<Overlay.Root {...common} bind:open={model} children={parts} />
{:else}<Overlay.Root {...common} bind:open={() => model, publish} children={parts} />{/if}
{/if}`;
}

function main(actions: string): string {
  return `import { hydrate, unmount, flushSync, tick } from "svelte"; import App from "./App.svelte";
import { createAlertDialog } from "@starwind-ui/runtime/alert-dialog";
const assert = (value, message) => { if (!value) throw new Error(message); };
try {
const target = document.getElementById("app"), before = [...target.querySelectorAll("[data-sw-part], [data-slot]")];
const app = hydrate(App, { target });
const settle = async () => { flushSync(); await tick(); await new Promise(resolve => setTimeout(resolve, 0)); flushSync(); };
const finish = async () => { for (let index = 0; index < 10; index++) { await new Promise(requestAnimationFrame); await settle(); } };
await settle();
const cases = app.getCases();
const directRefCase = Object.values(cases).find((entry) => entry.snapshot().closeRefs[0]);
if (directRefCase) assert(directRefCase.snapshot().refs[0] === "a:BUTTON" && directRefCase.snapshot().closeRefs[0] === "close:BUTTON", "Alert Dialog direct child refs");
const root = (id) => document.querySelector('[data-case="' + id + '"]');
const popup = (id) => document.querySelector('[data-popup="' + id + '"]');
const button = (id) => document.querySelector('[data-trigger="' + id + '"]');
const trigger = (id) => button(id)?.click();
const close = (id) => document.querySelector('[data-close="' + id + '"]')?.click();
const state = (id) => ({ ...cases[id].snapshot(), native: popup(id)?.open ?? null, topLayer: popup(id)?.matches(":modal") ?? false, rendered: document.querySelector('[data-rendered="' + id + '"]')?.textContent ?? null });
assert(before.every(node => node.isConnected), "Alert Dialog hydration replaced owners");
const result = await (async () => { ${actions} })();
const oldCases = { ...cases }, staleButtons = Object.keys(cases).map(button).filter(Boolean), stalePopups = Object.keys(cases).map(popup).filter(Boolean);
await unmount(app); await finish();
const final = Object.fromEntries(Object.entries(oldCases).map(([id, entry]) => [id, entry.snapshot()]));
const finalDirectRefCase = Object.values(final).find((entry) => entry.closeRefs.length);
if (finalDirectRefCase) assert(finalDirectRefCase.refs.at(-1)?.endsWith(":null") && finalDirectRefCase.closeRefs.at(-1) === "close:null", "Alert Dialog direct child ref cleanup");
const beforeStale = Object.values(oldCases).map(entry => entry.snapshot().callbacks.length);
for (const node of staleButtons) node.click(); for (const node of stalePopups) node.dispatchEvent(new Event("cancel", { cancelable: true })); await finish();
assert(JSON.stringify(beforeStale) === JSON.stringify(Object.values(oldCases).map(entry => entry.snapshot().callbacks.length)), "Alert Dialog stale callbacks");
assert(document.querySelectorAll("[data-sw-alert-dialog], [data-sw-alert-dialog-portal], :modal").length === 0, "Alert Dialog leaked native or portal owners");
assert(!document.body.hasAttribute("data-sw-scroll-locked"), "Alert Dialog leaked scroll lock");
document.documentElement.dataset.alertDialogResult = JSON.stringify({ ...result, hydrationExact: true, teardown: true, final });
} catch(error) { document.documentElement.dataset.alertDialogResult = JSON.stringify({ error: String(error), stack: error.stack }); }`;
}

export const alertDialogLifecycleCases: AlertDialogCase[] = [
  ...(["omitted", "plain", "bound", "function"] as const).map((mode) => ({
    id: mode,
    mode,
    defaultOpen: true,
    modal: false,
  })),
  { id: "defined", initial: false, defaultOpen: true, modal: false },
  ...["cancel", "command-cancel", "two-commands", "unmount"].map((proposal) => ({
    id: proposal,
    proposal,
    initial: false,
    modal: false,
  })),
  ...["retain", "invert"].map((setter) => ({ id: setter, setter, initial: false, modal: false })),
  { id: "dom", initial: false, modal: false },
  { id: "native", initial: false, portal: true, nested: true },
  { id: "missing", initial: true, missingPopup: true, modal: false },
  { id: "pending-popup", initial: false, portal: true },
  { id: "pending-root", initial: false, portal: true },
];

export const alertDialogLifecycleActions = `
for (const id of ["function", "bound", "plain", "omitted"]) {
 assert(state(id).native && state(id).rendered === "true", id + " initial default");
 close(id); await finish(); assert(!state(id).native && state(id).rendered === "false", id + " accepted close");
 if (id !== "omitted") { cases[id].setModel(true); await finish(); assert(state(id).native, id + " parent command"); close(id); await finish(); }
}
assert(!state("defined").native && state("defined").writes.length === 0, "defined false precedes default");
cases.defined.options(); await finish(); assert(!state("defined").native, "option update keeps accepted closed state");
trigger("cancel"); await finish(); assert(!state("cancel").native && state("cancel").writes.length === 0, "callback cancellation");
root("dom").addEventListener("starwind:open-change", event => event.preventDefault(), {once:true});
trigger("dom"); await finish(); assert(!state("dom").native && state("dom").writes.length === 0, "DOM cancellation");
const wrapper = () => document.querySelector('[data-portal="native"]');
document.getElementById("outside").focus(); trigger("native"); await finish();
assert(state("native").native && state("native").topLayer, "native modal open");
assert(popup("native").getAttribute("role") === "alertdialog", "alertdialog role");
assert(wrapper().parentElement.id === "portal-a", "initial explicit portal placement");
cases.native.place("#portal-b"); await finish(); assert(wrapper().parentElement.id === "portal-b" && state("native").native, "ordinary portal retarget");
const parentCallbacks = state("native").callbacks.length;
document.querySelector('[data-nested-trigger="native"]').click(); await finish();
assert(document.querySelector('[data-nested-popup="native"]').matches(":modal"), "nested same-family portal opens");
document.dispatchEvent(new KeyboardEvent("keydown",{key:"Escape",bubbles:true})); await finish();
assert(!document.querySelector('[data-nested-popup="native"]').open && state("native").native, "nested Escape retains parent");
document.querySelector('[data-dialog-trigger="native"]').click(); await finish();
assert(document.querySelector('[data-dialog-popup="native"]').open, "nested Dialog opens independently");
document.querySelector('[data-dialog-close="native"]').click(); await finish();
assert(!document.querySelector('[data-dialog-popup="native"]').open && state("native").native && state("native").callbacks.length === parentCallbacks, "nested Dialog closes independently");
document.querySelector('[data-backdrop="native"]').click(); await finish(); assert(state("native").native, "outside dismissal defaults false");
cases.native.options(); await finish(); assert(state("native").native, "later options preserve accepted open"); cases.native.options(); await finish();
document.dispatchEvent(new KeyboardEvent("keydown", {key:"Escape", bubbles:true})); await finish();
assert(!state("native").native && !document.body.hasAttribute("data-sw-scroll-locked"), "Escape closes and releases lock");
return { complete:true, modelTruthTable:true, cancellation:true, parentCommands:true, refsAndAttachments:true, partReplacement:false, portalLifecycle:true, focusAndLock:true, closeComplete:true };
`;

export async function verifyAlertDialogLifecycle(consumer: DistConsumer, styled = false) {
  const actions = styled
    ? alertDialogLifecycleActions.replace(', "viewport"', "").replace(
        "return { complete:",
        `
trigger("native"); await finish(); const retiredButton = document.querySelector('[data-close="native"]');
cases.native.setAnchor(true); await finish(); const anchor = document.querySelector('[data-close="native"]');
assert(anchor.tagName === "A" && anchor.getAttribute("href") === "#confirmed", "Styled inherited anchor props");
const previous = state("native").callbacks.length; retiredButton.click(); await finish(); assert(state("native").callbacks.length === previous, "retired Styled button");
anchor.click(); await finish(); assert(!state("native").native, "Styled anchor closes");
trigger("native"); await finish(); cases.native.setAnchor(false); await finish(); anchor.click(); await finish(); assert(state("native").native, "retired Styled anchor");
assert(document.querySelector('[data-close="native"]').tagName === "BUTTON", "Styled semantic button child");
document.querySelector('[data-cancel="native"]').click(); await finish(); assert(!state("native").native, "Styled Cancel replacement");
return { complete:`,
      )
    : alertDialogLifecycleActions;
  const { build, ...result } = await verifyAlertDialogBrowser(
    consumer,
    alertDialogLifecycleCases,
    actions,
    styled,
  );
  return { result, build };
}
