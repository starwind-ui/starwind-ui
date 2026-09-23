import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { once } from "node:events";
import { createServer } from "node:http";
import { createBrowserBuildScript } from "./compatibility-hydration.js";
import { chromium } from "playwright";
import type { DistConsumer } from "./dist-consumer.js";

export type DrawerCase = {
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
  side?: "top" | "right" | "bottom" | "left";
  iconProbe?: boolean;
};

/** Runs the same public model and lifecycle assertions through either generated surface. */
export async function verifyDrawerBrowser(
  consumer: DistConsumer,
  configs: DrawerCase[],
  actions: string,
  styled = false,
) {
  await consumer.write({
    "Case.svelte": drawerCaseSource(styled),
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
    await page.waitForFunction(() => document.documentElement.dataset.drawerResult, undefined, {
      timeout: 30_000,
    });
    const result = await page.evaluate(() =>
      JSON.parse(document.documentElement.dataset.drawerResult!),
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

export function drawerCaseSource(styled: boolean): string {
  const importLine = styled
    ? 'import Overlay, { type SheetProps as RootProps } from "./sheet/index.js";'
    : 'import Overlay from "@starwind-ui/svelte/drawer"; import type { ComponentProps } from "svelte"; type RootProps = ComponentProps<typeof Overlay.Root>;';
  const popup = styled ? "Content" : "Popup";
  const controls = `{#key closeKey}<Overlay.Close data-close={id} ref={closeRef}>{#snippet child({ props, children })}<button {...props}>{@render children?.()}</button>{/snippet}Close</Overlay.Close>{/key}`;
  return `<script lang="ts">
import { flushSync, untrack } from "svelte";
import { createAttachmentKey, type Attachment } from "svelte/attachments";
${importLine}
import Primitive, { DrawerPortal } from "@starwind-ui/svelte/drawer";
import Dialog from "@starwind-ui/svelte/dialog";
import type { DrawerOpenChangeDetails } from "@starwind-ui/svelte/drawer";
let { id, mode = "function", initial, defaultOpen, modal: initialModal = true, proposal = "accept", setter = "identity", portal = false, missingPopup = false, nested = false, side: initialSide = "right", iconProbe = false }: { id: string; mode?: string; initial?: boolean; defaultOpen?: boolean; modal?: boolean; proposal?: string; setter?: string; portal?: boolean; missingPopup?: boolean; nested?: boolean; side?: "top" | "right" | "bottom" | "left"; iconProbe?: boolean } = $props();
let side = $state(untrack(() => initialSide));
let model = $state<boolean | undefined>(untrack(() => initial));
let modal = $state(untrack(() => initialModal));
let escape = $state(true);
let shown = $state(true);
let showPopup = $state(!untrack(() => missingPopup));
let popupKey = $state(0), backdropKey = $state(0), closeKey = $state(0), triggerKey = $state(0), portalKey = $state(0);
let titleKey = $state(0), descriptionKey = $state(0), viewportKey = $state(0);
let second = $state(false);
let container = $state<string | HTMLElement>("#portal-a"), disablePortal = $state(false);
let className = $state("before");
const writes: boolean[] = [], callbacks: { next: boolean; previous: boolean | string; owner: string }[] = [], completions: { model: boolean | string; native: boolean | undefined }[] = [];
const refs: string[] = [], closeRefs: string[] = [], attachments: string[] = [], popupRefs: string[] = [];
const stockCloseOwners: HTMLButtonElement[] = [], stockCloseEvents: string[] = [];
const stockCloseAttachment: Attachment<SVGElement> = (icon) => { const owner = icon.parentElement; if (!(owner instanceof HTMLButtonElement)) throw new Error("Icon must attach inside stock close button"); stockCloseOwners.push(owner); stockCloseEvents.push("setup"); return () => { stockCloseEvents.push("cleanup"); }; };
const refA = (element: HTMLButtonElement | null) => { refs.push("a:" + (element?.tagName ?? "null")); };
const refB = (element: HTMLButtonElement | null) => { refs.push("b:" + (element?.tagName ?? "null")); };
const closeRef = (element: HTMLButtonElement | null) => { closeRefs.push("close:" + (element?.tagName ?? "null")); };
const popupA = (element: HTMLDialogElement | null) => { popupRefs.push("a:" + (element?.tagName ?? "null")); };
const popupB = (element: HTMLDialogElement | null) => { popupRefs.push("b:" + (element?.tagName ?? "null")); };
const attachment = (owner: string): Attachment<HTMLButtonElement> => () => { attachments.push(owner + ":setup"); return () => { attachments.push(owner + ":cleanup"); }; };
const key = createAttachmentKey();
let forwarded = $state.raw({ [key]: attachment("a") });
function handle(owner: string, next: boolean, detail: DrawerOpenChangeDetails) {
 callbacks.push({ next, previous: model ?? "undefined", owner });
 if (proposal === "cancel") detail.cancel();
 if (proposal === "command-cancel") { model = true; flushSync(); detail.cancel(); }
 if (proposal === "two-commands") { model = true; flushSync(); model = false; flushSync(); }
 if (proposal === "unmount") { shown = false; flushSync(); }
}
const proposalA = (next: boolean, detail: DrawerOpenChangeDetails) => handle("a", next, detail);
const proposalB = (next: boolean, detail: DrawerOpenChangeDetails) => handle("b", next, detail);
function publish(next: boolean | undefined) { if (next === undefined) throw new Error("Undefined Drawer publication"); writes.push(next); if (setter === "invert") model = !next; else if (setter !== "retain") model = next; }
function complete() { completions.push({ model: model ?? "undefined", native: document.querySelector<HTMLDialogElement>('[data-popup="' + id + '"]')?.open }); }
let common = $derived({ "data-case": id, defaultOpen, modal, closeOnEscape: escape, onOpenChange: second ? proposalB : proposalA, onCloseComplete: complete } satisfies RootProps);
export function stockCloseSnapshot() { return { owners: [...stockCloseOwners], events: [...stockCloseEvents] }; }
export function setModel(next: boolean | undefined) { model = next; }
export function options() { modal = !modal; escape = !escape; }
export function replace(part: string) { if (part === "popup") popupKey++; else if (part === "backdrop") backdropKey++; else if (part === "close") closeKey++; else if (part === "trigger") triggerKey++; else if (part === "portal") portalKey++; else if (part === "title") titleKey++; else if (part === "description") descriptionKey++; else if (part === "viewport") viewportKey++; }
export function setSide(value: "top" | "right" | "bottom" | "left") { side = value; }
export function setPopup(value: boolean) { showPopup = value; }
export function place(value: string | HTMLElement, disabled = false) { container = value; disablePortal = disabled; }
export function replaceOwners() { second = true; forwarded = { [key]: attachment("b") }; }
export function changeClass() { className = "after"; }
export function hide() { shown = false; }
export function snapshot() { return { model: model ?? "undefined", writes: [...writes], callbacks: [...callbacks], completions: [...completions], refs: [...refs], closeRefs: [...closeRefs], popupRefs: [...popupRefs], attachments: [...attachments] }; }
</script>
{#snippet closeIcon()}<svg viewBox="0 0 24 24" {@attach stockCloseAttachment}><path d="M6 6l12 12M18 6L6 18" /></svg>{/snippet}
{#snippet surface()}
${styled ? "" : "{#key backdropKey}<Overlay.Backdrop data-backdrop={id} />{/key}"}
${styled ? "" : "{#key viewportKey}<Overlay.Viewport data-viewport={id}>"}
{#if showPopup}{#key popupKey}<Overlay.${popup} {side} data-popup={id} style="transition: opacity 40ms" ref={second ? popupB : popupA}${styled ? " icon={iconProbe ? closeIcon : undefined}" : ""}>
${styled ? "{#snippet backdrop()}{#key backdropKey}<div data-sw-drawer-backdrop data-backdrop={id} hidden></div>{/key}{/snippet}<Overlay.Header>" : ""}
{#key titleKey}<Overlay.Title data-title={id}>Confirm {id}</Overlay.Title>{/key}{#key descriptionKey}<Overlay.Description data-description={id}>Review this confirmation</Overlay.Description>{/key}
${styled ? "</Overlay.Header>" : ""}
<input aria-label="Name" data-input={id} />${controls}
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
{#if portal}{#key portalKey}<DrawerPortal data-portal={id} {container} disabled={disablePortal}>{@render surface()}</DrawerPortal>{/key}{:else}{@render surface()}{/if}
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
const assert = (value, message) => { if (!value) throw new Error(message); };
try {
const target = document.getElementById("app"), before = [...target.querySelectorAll("[data-sw-part], [data-slot]")];
const app = hydrate(App, { target });
const settle = async () => { flushSync(); await tick(); await new Promise(resolve => setTimeout(resolve, 0)); flushSync(); };
const finish = async () => { for (let index = 0; index < 10; index++) { await new Promise(requestAnimationFrame); await settle(); } };
await settle();
const cases = app.getCases();
const directRefCase = Object.values(cases).find((entry) => entry.snapshot().closeRefs[0]);
assert(directRefCase?.snapshot().refs[0] === "a:BUTTON" && directRefCase.snapshot().closeRefs[0] === "close:BUTTON", "Drawer direct child refs");
const root = (id) => document.querySelector('[data-case="' + id + '"]');
const popup = (id) => document.querySelector('[data-popup="' + id + '"]');
const button = (id) => document.querySelector('[data-trigger="' + id + '"]');
const trigger = (id) => button(id)?.click();
const close = (id) => document.querySelector('[data-close="' + id + '"]')?.click();
const state = (id) => ({ ...cases[id].snapshot(), native: popup(id)?.open ?? null, topLayer: popup(id)?.matches(":modal") ?? false, rendered: document.querySelector('[data-rendered="' + id + '"]')?.textContent ?? null });
assert(before.every(node => node.isConnected), "Drawer hydration replaced owners");
const result = await (async () => { ${actions} })();
const oldCases = { ...cases }, staleButtons = Object.keys(cases).map(button).filter(Boolean), stalePopups = Object.keys(cases).map(popup).filter(Boolean);
await unmount(app); await finish();
const final = Object.fromEntries(Object.entries(oldCases).map(([id, entry]) => [id, entry.snapshot()]));
const finalDirectRefCase = Object.values(final).find((entry) => entry.closeRefs.length);
assert(finalDirectRefCase?.refs.at(-1)?.endsWith(":null") && finalDirectRefCase.closeRefs.at(-1) === "close:null", "Drawer direct child ref cleanup");
const beforeStale = Object.values(oldCases).map(entry => entry.snapshot().callbacks.length);
for (const node of staleButtons) node.click(); for (const node of stalePopups) node.dispatchEvent(new Event("cancel", { cancelable: true })); await finish();
assert(JSON.stringify(beforeStale) === JSON.stringify(Object.values(oldCases).map(entry => entry.snapshot().callbacks.length)), "Drawer stale callbacks");
assert(document.querySelectorAll("[data-sw-drawer], [data-sw-drawer-portal], :modal").length === 0, "Drawer leaked native or portal owners");
assert(!document.body.hasAttribute("data-sw-scroll-locked"), "Drawer leaked scroll lock");
document.documentElement.dataset.drawerResult = JSON.stringify({ ...result, hydrationExact: true, teardown: true, final });
} catch(error) { document.documentElement.dataset.drawerResult = JSON.stringify({ error: String(error), stack: error.stack }); }`;
}

export const drawerLifecycleCases: DrawerCase[] = [
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

export const drawerLifecycleActions = `
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
assert(popup("native").tagName === "DIALOG" && popup("native").getAttribute("data-side") === "right", "drawer dialog semantics");
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
document.querySelector('[data-backdrop="native"]').click(); await finish(); assert(!state("native").native, "outside dismissal defaults true"); trigger("native"); await finish();
cases.native.options(); await finish(); assert(state("native").native, "later options preserve accepted open"); cases.native.options(); await finish();
document.dispatchEvent(new KeyboardEvent("keydown", {key:"Escape", bubbles:true})); await finish();
assert(!state("native").native && !document.body.hasAttribute("data-sw-scroll-locked"), "Escape closes and releases lock");
return { complete:true, modelTruthTable:true, cancellation:true, parentCommands:true, refsAndAttachments:true, partReplacement:false, portalLifecycle:true, focusAndLock:true, closeComplete:true };
`;

export async function verifyDrawerLifecycle(consumer: DistConsumer, styled = false) {
  const actions = (
    styled ? drawerLifecycleActions.replace(', "viewport"', "") : drawerLifecycleActions
  ).replace(
    "return { complete:",
    `
trigger("native"); await finish();
for (const side of ["left", "top", "bottom", "right"]) {
 const current = popup("native"); cases.native.setSide(side); await settle();
 assert(popup("native") === current && current.getAttribute("data-side") === side && current.open, "reactive side preserves native owner");
 ${styled ? `assert(current.className.includes("slide-in-from-" + side) && current.className.includes("slide-out-to-" + side), "stock side variant " + side);` : ""}
}
${
  styled
    ? `
const builtIn = popup("native").querySelector('[data-slot="sheet-close"][data-sw-button]');
assert(builtIn.tagName === "BUTTON" && builtIn.querySelector("svg") && builtIn.textContent.includes("Close sheet"), "stock close icon owner");
builtIn.click(); await finish(); assert(!state("native").native, "stock close button works");
trigger("native"); await finish(); cases.native.replace("popup"); await finish();
const replacement = popup("native").querySelector('[data-slot="sheet-close"][data-sw-button]');
assert(!builtIn.isConnected && replacement !== builtIn && replacement.querySelector("svg"), "stock close replaced with Content");
const callbacks = state("native").callbacks.length; builtIn.click(); await finish();
assert(state("native").native && state("native").callbacks.length === callbacks, "retired stock close cannot propose");
replacement.click(); await finish(); assert(!state("native").native, "replacement stock close works");
`
    : 'close("native"); await finish();'
}
return { ${styled ? "sideVariants:true," : ""} complete:`,
  );
  const { build, ...result } = await verifyDrawerBrowser(
    consumer,
    drawerLifecycleCases,
    actions,
    styled,
  );
  if (styled) {
    await verifyDrawerBrowser(
      consumer,
      [{ id: "attachment", iconProbe: true }],
      `
trigger("attachment"); await finish();
const original = cases.attachment.stockCloseSnapshot().owners[0];
assert(original === popup("attachment").querySelector('[data-slot="sheet-close"][data-sw-button]'), "icon attachment reaches built-in close owner");
cases.attachment.replace("popup"); await finish();
const snapshot = cases.attachment.stockCloseSnapshot(), replacement = snapshot.owners[1];
assert(snapshot.events.join("|") === "setup|cleanup|setup" && !original.isConnected && replacement !== original, "stock close attachment replacement is balanced");
const callbacks = state("attachment").callbacks.length; original.click(); await finish();
assert(state("attachment").native && state("attachment").callbacks.length === callbacks, "retired attached stock close cannot propose");
replacement.click(); await finish(); assert(!state("attachment").native, "attached replacement stock close works");
cases.attachment.hide(); await finish();
assert(cases.attachment.stockCloseSnapshot().events.join("|") === "setup|cleanup|setup|cleanup", "stock close attachment teardown");
return { complete: true };
`,
      true,
    );
  }
  return { result, build };
}
