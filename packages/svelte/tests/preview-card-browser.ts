import assert from "node:assert/strict";
import { once } from "node:events";
import { readFile } from "node:fs/promises";
import { createServer } from "node:http";
import { chromium } from "playwright";
import { createBrowserBuildScript } from "./compatibility-hydration.js";
import type { DistConsumer } from "./dist-consumer.js";

export type PreviewCardCase = {
  id: string;
  mode?: "omitted" | "plain" | "bound" | "function";
  initial?: boolean;
  defaultOpen?: boolean;
  proposal?: string;
  setter?: string;
  missingPopup?: boolean;
  disabled?: boolean;
  nativeOwner?: boolean;
  nested?: boolean;
  componentChild?: boolean;
  triggerOpenDelay?: number;
  triggerCloseDelay?: number;
  rawOpenDelay?: string;
  rawCloseDelay?: string;
};

/** Runs the same public model and lifecycle assertions through either generated surface. */
export async function verifyPreviewCardBrowser(
  consumer: DistConsumer,
  configs: PreviewCardCase[],
  actions: string,
  styled = false,
) {
  await consumer.write({
    "Case.svelte": previewCardCaseSource(styled),
    "LocalAnchor.svelte": `<script lang="ts">import type {Snippet} from "svelte"; import type {HTMLAnchorAttributes} from "svelte/elements"; let {children, ...props}: HTMLAnchorAttributes & {children?:Snippet} = $props();</script><a {...props}>{@render children?.()}</a>`,
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
  return { ...(await runPreviewCardBrowser(consumer, first.body)), build };
}

async function runPreviewCardBrowser(consumer: DistConsumer, body: string) {
  const javascript = await readFile(`${consumer.root}/browser.js`);
  const server = createServer((request, response) => {
    if (request.url === "/browser.js") {
      response.setHeader("Content-Type", "text/javascript");
      response.end(javascript);
    } else {
      response.setHeader("Content-Type", "text/html");
      response.end(
        `<link rel="icon" href="data:,"><button id="outside">Outside</button><div id="app">${body}</div><div id="portal-a"></div><div id="portal-b"></div><script type="module" src="/browser.js"></script>`,
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
      () => document.documentElement.dataset.previewCardResult,
      undefined,
      {
        timeout: 90_000,
      },
    );
    const result = await page.evaluate(() =>
      JSON.parse(document.documentElement.dataset.previewCardResult!),
    );
    assert.deepEqual(errors, []);
    assert.equal(result.error, undefined, result.stack ?? result.error);
    return result;
  } finally {
    await browser?.close();
    await new Promise<void>((resolve, reject) =>
      server.close((error) => (error ? reject(error) : resolve())),
    );
  }
}

export function previewCardCaseSource(styled: boolean): string {
  const popup = styled ? "Content" : "Popup";
  return `<script lang="ts">
import { flushSync, untrack, type ComponentProps } from "svelte";
import { createAttachmentKey, type Attachment } from "svelte/attachments";
import Overlay from "${styled ? "./hover-card/index.js" : "@starwind-ui/svelte/preview-card"}";
import Dialog from "@starwind-ui/svelte/dialog";
import LocalAnchor from "./LocalAnchor.svelte";
import Primitive, { type PreviewCardOpenChangeDetails } from "@starwind-ui/svelte/preview-card";
let { id, mode = "function", initial, defaultOpen, proposal = "accept", setter = "identity", missingPopup = false, disabled: initialDisabled = false, nativeOwner = false, nested = false, componentChild = false, triggerOpenDelay: initialTriggerOpenDelay, triggerCloseDelay: initialTriggerCloseDelay, rawOpenDelay, rawCloseDelay }: { id: string; mode?: string; initial?: boolean; defaultOpen?: boolean; proposal?: string; setter?: string; missingPopup?: boolean; disabled?: boolean; nativeOwner?: boolean; nested?: boolean; componentChild?: boolean; triggerOpenDelay?: number; triggerCloseDelay?: number; rawOpenDelay?: string; rawCloseDelay?: string } = $props();
let triggerOpenDelay = $state(untrack(() => initialTriggerOpenDelay)), triggerCloseDelay = $state(untrack(() => initialTriggerCloseDelay));
let showSecond = $state(true), foreignSecond = $state(false), cancelSecond = $state(false);
let model = $state<boolean | undefined>(untrack(() => initial));
let disabled = $state(untrack(() => initialDisabled)), openDelay = $state(600), closeDelay = $state(300), disableHoverableContent = $state(false), escape = $state(true);
let shown = $state(true), showPopup = $state(!untrack(() => missingPopup)), second = $state(false), key = $state(0), popupKey = $state(0), portalKey = $state(0), positionerKey = $state(0), arrowKey = $state(0), backdropKey = $state(0), viewportKey = $state(0);
let container = $state<string | HTMLElement>("#portal-a"), disablePortal = $state(false), side = $state<"top" | "bottom" | "left" | "right">(untrack(()=>id==="floating"?"right":"bottom")), align = $state<"start" | "center" | "end">(untrack(()=>id==="floating"||id.startsWith("restore-")?"start":"center")), sideOffset = $state(untrack(()=>id==="floating"?24:${styled ? 4 : 0})), avoidCollisions = $state(false), className = $state("before");
let ownerOpen = $state<boolean | undefined>(false), childOpen = $state<boolean | undefined>(false), cancelClose = $state(false);
const childCallbacks: boolean[] = [];
const callbacks: unknown[] = [], writes: boolean[] = [], refs: string[] = [], popupRefs: string[] = [], attachments: string[] = [];
const attachmentKey = createAttachmentKey(), firstKey = createAttachmentKey(), otherKey = createAttachmentKey();
let firstDependency = $state(0), otherDependency = $state(0);
const reactive: string[] = []; let clicks = 0;
const firstAttachment: Attachment<HTMLAnchorElement> = node => { const value = firstDependency; reactive.push("first:" + value + ":set"); return () => reactive.push("first:" + value + ":clear"); };
const otherAttachment: Attachment<HTMLAnchorElement> = node => { const value = otherDependency; reactive.push("other:" + value + ":set"); return () => reactive.push("other:" + value + ":clear"); };
const reactiveProps = {[firstKey]:firstAttachment,[otherKey]:otherAttachment};
const attach = (name: string): Attachment<HTMLAnchorElement> => node => { attachments.push(name + ":set"); return () => attachments.push(name + ":clear"); };
let forwarded = $state({ [attachmentKey]: attach("a") });
const refA = (node: HTMLAnchorElement | null) => refs.push("a:" + (node ? "set" : "clear"));
const refB = (node: HTMLAnchorElement | null) => refs.push("b:" + (node ? "set" : "clear"));
const popupA = (node: HTMLDivElement | null) => popupRefs.push("a:" + (node ? "set" : "clear"));
const popupB = (node: HTMLDivElement | null) => popupRefs.push("b:" + (node ? "set" : "clear"));
function handle(owner: string, next: boolean, detail: PreviewCardOpenChangeDetails) {
 callbacks.push({owner, next, model: model ?? "undefined"});
 if (cancelSecond && detail.trigger?.getAttribute("data-trigger-b") === id) detail.cancel();
 if (proposal === "cancel" || (cancelClose && !next)) detail.cancel();
 if (proposal === "command-cancel") { model = true; flushSync(); detail.cancel(); }
 if (proposal === "two-commands") { model = true; flushSync(); model = false; flushSync(); detail.cancel(); }
 if (proposal === "unmount") { shown = false; flushSync(); }
}
function publish(next: boolean | undefined) { if (next === undefined) throw new Error("Undefined PreviewCard publication"); writes.push(next); if (setter === "invert") model = !next; else if (setter !== "retain") model = next; }
let common = $derived({ "data-case": id, defaultOpen, openDelay, closeDelay, disableHoverableContent, closeOnEscape: escape, onOpenChange: (next: boolean, detail: PreviewCardOpenChangeDetails) => handle(second ? "b" : "a", next, detail), style: "display:inline-block;margin:28px" } satisfies ComponentProps<typeof Overlay.Root>);
export function updateAttachment(which: "first" | "other") { if (which === "first") firstDependency++; else otherDependency++; }
export function secondary(show: boolean, foreign = false) { showSecond = show; foreignSecond = foreign; }
export function cancelSecondary(value: boolean) { cancelSecond = value; }
export function setModel(value: boolean | undefined) { model = value; }
export function setDisabled(value: boolean) { disabled = value; }
export function triggerDelays(open: number | undefined, close: number | undefined) { triggerOpenDelay = open; triggerCloseDelay = close; }
export function delays(open: number, close = 200) { openDelay = open; closeDelay = close; }
export function options() { escape = !escape; }
export function hoverable(value: boolean) { disableHoverableContent = !value; }
export function replace(part: string) { if (part === "trigger") key++; if (part === "popup") popupKey++; if (part === "portal") portalKey++; if (part === "positioner") positionerKey++; if (part === "arrow") arrowKey++; if (part === "backdrop") backdropKey++; if (part === "viewport") viewportKey++; }
export function placement(value: typeof side, alignment: typeof align = "center", offset = 8, collisions = false) { side = value; align = alignment; sideOffset = offset; avoidCollisions = collisions; }
export function setPopup(value: boolean) { showPopup = value; }
export function place(value: string | HTMLElement, off = false) { container = value; disablePortal = off; }
export function replaceOwners() { second = true; forwarded = { [attachmentKey]: attach("b") }; }
export function changeClass() { className = "after"; }
export function setOwner(value: boolean) { ownerOpen = value; }
export function cancelClosing(value: boolean) { cancelClose = value; }
export function hide() { shown = false; }
export function snapshot() { return { clicks, reactive:[...reactive], childOpen, childCallbacks:[...childCallbacks], model: model ?? "undefined", writes: [...writes], callbacks: [...callbacks], refs: [...refs], popupRefs: [...popupRefs], attachments: [...attachments] }; }
</script>
{#snippet surface()}
${styled ? "" : "{#key backdropKey}<Primitive.Backdrop data-backdrop={id} />{/key}{#key viewportKey}<Primitive.Viewport data-viewport={id}>{#key positionerKey}<Primitive.Positioner {side} {align} {sideOffset} {avoidCollisions}>"}
{#if showPopup}{#key popupKey}<Overlay.${popup} {side} {align} {sideOffset} {avoidCollisions} data-popup={id} tabindex={0} style="display:flow-root;width:180px;min-height:30px;transition:opacity 20ms" ref={second ? popupB : popupA}${styled ? ' portalContainer={typeof container === "string" ? container : undefined} {disablePortal}' : ""}>
<a href={"#content-" + id} data-content-link={id}>Interactive profile</a> <button data-content-button={id}>Follow</button> ${styled ? "" : "{#key arrowKey}<Primitive.Arrow data-arrow={id} />{/key}"}
</Overlay.${popup}>{/key}{/if}
${styled ? "" : "</Primitive.Positioner>{/key}</Primitive.Viewport>{/key}"}
{/snippet}
{#snippet parts(accepted: boolean)}
<output data-rendered={id}>{String(accepted)}</output>
{#key key}<Overlay.Trigger href={"#destination-" + id} {disabled} openDelay={triggerOpenDelay} closeDelay={triggerCloseDelay} data-trigger={id} data-open-delay={rawOpenDelay} data-close-delay={rawCloseDelay} title={"Profile " + id} tabindex={2} onclick={() => clicks++} {...reactiveProps} {...forwarded} ref={second ? refB : refA} class={className}>{#snippet child({ props, children })}{#if componentChild}<LocalAnchor {...props}>{@render children?.()}</LocalAnchor>{:else}<a {...props}>{@render children?.()}</a>{/if}{/snippet}Show {id}</Overlay.Trigger>{/key}
{#if id.startsWith("restore-") && showSecond}<div data-sw-preview-card={foreignSecond ? "" : undefined}><Overlay.Trigger data-trigger-b={id} style="position:fixed;left:700px;top:120px;width:80px;height:30px">{#snippet child({ props, children })}<a {...props}>{@render children?.()}</a>{/snippet}Second</Overlay.Trigger></div>{/if}
{#key portalKey}${styled ? "{@render surface()}" : "<Primitive.Portal {container} disabled={disablePortal}>{@render surface()}</Primitive.Portal>"}{/key}
{#if nested}<Primitive.Root data-child-root={id} bind:open={childOpen} onOpenChange={next => childCallbacks.push(next)} openDelay={0}><Primitive.Trigger data-child-trigger={id}>Nested help</Primitive.Trigger><Primitive.Portal><Primitive.Popup data-child-popup={id}>Nested description</Primitive.Popup></Primitive.Portal></Primitive.Root>{/if}
{/snippet}
{#snippet rootContent()}
{#if shown}
{#if mode === "omitted"}<Overlay.Root {...common} children={parts} />
{:else if mode === "plain"}<Overlay.Root {...common} open={model} children={parts} />
{:else if mode === "bound"}<Overlay.Root {...common} bind:open={model} children={parts} />
{:else}<Overlay.Root {...common} bind:open={() => model, publish} children={parts} />{/if}
{/if}
{/snippet}
{#if nativeOwner}<Dialog.Root bind:open={ownerOpen}><Dialog.Popup data-owner-popup={id}><Dialog.Title>Owner</Dialog.Title>{@render rootContent()}</Dialog.Popup></Dialog.Root>{:else}{@render rootContent()}{/if}`;
}

function main(actions: string): string {
  return `import { hydrate, unmount, flushSync, tick } from "svelte"; import App from "./App.svelte";
const assert = (value, message) => { if (!value) throw new Error(message); };
try {
const target = document.getElementById("app"), before = [...target.querySelectorAll("[data-sw-part], [data-slot]")];
const app = hydrate(App, { target });
const settle = async () => { flushSync(); await tick(); await new Promise(resolve => setTimeout(resolve, 0)); flushSync(); };
const wait = async ms => { await new Promise(resolve => setTimeout(resolve, ms)); await settle(); };
const finish = async () => { for (let i = 0; i < 6; i++) { await new Promise(requestAnimationFrame); await settle(); } };
await settle(); const cases = app.getCases();
const root = id => document.querySelector('[data-case="' + id + '"]');
const popup = id => document.querySelector('[data-popup="' + id + '"]');
const button = id => document.querySelector('[data-trigger="' + id + '"]');
const hover = id => button(id).dispatchEvent(new PointerEvent("pointerenter", {pointerType:"mouse"}));
const trigger = async id => { document.getElementById("outside").focus(); document.dispatchEvent(new KeyboardEvent("keydown", {key:"Tab", bubbles:true})); button(id).focus(); await wait(650); };
const close = id => button(id).dispatchEvent(new FocusEvent("focusout", {relatedTarget:document.getElementById("outside"), bubbles:true}));
const wrapper = id => popup(id)?.closest('[data-sw-preview-card-portal]');
const state = id => ({ ...cases[id].snapshot(), visible: popup(id) ? !popup(id).hidden : null, rendered: document.querySelector('[data-rendered="' + id + '"]')?.textContent ?? null });
assert(before.every(node => node.isConnected), "PreviewCard hydration replaced owners");
const result = await (async () => { ${actions} })();
const oldCases = {...cases}, staleButtons = Object.keys(cases).map(button).filter(Boolean);
await unmount(app); await finish();
for (const entry of Object.values(oldCases)) { const log=entry.snapshot(); for (const key of ["refs","popupRefs","attachments","reactive"]) assert(log[key].filter(value=>value.endsWith(":set")).length === log[key].filter(value=>value.endsWith(":clear")).length,"unmount releases every " + key); }
const snapshots = Object.values(oldCases).map(entry => JSON.stringify(entry.snapshot()));
for (const node of staleButtons) { node.dispatchEvent(new PointerEvent("pointerenter", {pointerType:"mouse"})); node.focus(); }
await wait(700);
assert(JSON.stringify(snapshots) === JSON.stringify(Object.values(oldCases).map(entry => JSON.stringify(entry.snapshot()))), "PreviewCard stale callback or model write");
assert(document.querySelectorAll("[data-sw-preview-card], [data-sw-preview-card-portal]").length === 0, "PreviewCard leaked owners");
document.documentElement.dataset.previewCardResult = JSON.stringify({ ...result, hydrationExact:true, teardown:true });
} catch(error) { document.documentElement.dataset.previewCardResult = JSON.stringify({ error: String(error), stack:error.stack }); }`;
}

/** Disabled triggers reject ordinary hover activation. */
export async function verifyPreviewCardDisabledTimer(consumer: DistConsumer, styled = false) {
  return verifyPreviewCardBrowser(
    consumer,
    [{ id: "pending", initial: false }],
    `
cases.pending.setDisabled(true); await settle(); hover("pending");
await wait(700);
assert(!state("pending").visible && state("pending").callbacks.length === 0, "Disabled PreviewCard opened " + JSON.stringify(state("pending")));
return { disabledTimer:true };
`,
    styled,
  );
}

function parentTimerActions(pending: "open" | "close"): string {
  const id = `parent-${pending}`;
  const accepted = pending === "close";
  return `
  cases["${id}"].setModel(${accepted}); await finish();
  cases["${id}"].setModel(undefined); await settle();
  const ${pending}Callbacks = state("${id}").callbacks.length;
  const ${pending}Writes = state("${id}").writes.length;
  ${pending === "open" ? `hover("${id}");` : `button("${id}").dispatchEvent(new PointerEvent("pointerleave", {pointerType:"mouse",clientX:-100,clientY:-100}));`}
  await wait(40);
  assert(state("${id}").visible === ${accepted}, "pending ${pending} waits for its delay");
  cases["${id}"].setModel(${accepted}); await settle(); await wait(700); await finish();
  assert(state("${id}").visible === ${accepted} && state("${id}").model === ${accepted}, "Newly defined parent ${accepted ? "open" : "close"} must retire pending ${pending}: " + JSON.stringify(state("${id}")));
  assert(state("${id}").callbacks.length === ${pending}Callbacks && state("${id}").writes.length === ${pending}Writes, "Silent same-state parent command does not emit or republish");
  `;
}

export function verifyPreviewCardParentTimerCommand(
  consumer: DistConsumer,
  pending: "open" | "close",
  styled = false,
) {
  return verifyPreviewCardBrowser(
    consumer,
    [{ id: `parent-${pending}`, initial: pending === "close" }],
    parentTimerActions(pending) + "return { parentRetiresTimer:true };",
    styled,
  );
}

export const previewCardLifecycleCases: PreviewCardCase[] = [
  ...(["omitted", "plain", "bound", "function"] as const).map((mode) => ({
    id: mode,
    mode,
    defaultOpen: true,
  })),
  { id: "defined", initial: false, defaultOpen: true },
  ...["cancel", "unmount"].map((proposal) => ({
    id: proposal,
    proposal,
    initial: false,
  })),
  { id: "dom", initial: false },
  { id: "floating", initial: false },
  { id: "restore-function", initial: false },
  { id: "restore-omitted", mode: "omitted" },
  { id: "component", initial: false, componentChild: true },
  { id: "timed", initial: false },
  { id: "override", initial: false, triggerOpenDelay: 15, triggerCloseDelay: 20 },
  { id: "raw", initial: false, rawOpenDelay: "15", rawCloseDelay: "20" },
  { id: "intent", initial: false },
  { id: "constructor", initial: false },
  { id: "parent-open", initial: false },
  { id: "parent-close", initial: false },
  { id: "pending-open", initial: false },
  { id: "pending-close", initial: false },
  { id: "nested", initial: false, nested: true },
  { id: "owner", initial: false, nativeOwner: true },
  { id: "disabled", initial: true, disabled: true },
];
export async function verifyPreviewCardLifecycle(consumer: DistConsumer, styled = false) {
  const { build, ...result } = await verifyPreviewCardBrowser(
    consumer,
    previewCardLifecycleCases,
    `
for (const id of ["function","bound","plain","omitted"]) {
 assert(state(id).visible && state(id).rendered === "true", id + " default open");
 close(id); await finish(); assert(!state(id).visible && state(id).rendered === "false", id + " accepted close");
 if (id !== "omitted") {
  cases[id].setModel(true); await finish(); assert(state(id).visible, id + " parent open command");
  cases[id].setModel(undefined); await settle(); assert(state(id).visible, id + " undefined retains accepted value");
  close(id); await finish();
 }
}

assert(!state("defined").visible && state("defined").writes.length === 0, "false model overrides default");
cases.defined.options(); await finish(); assert(!state("defined").visible, "closed reconstruction");
for (const id of ["cancel","unmount"]) {
 await trigger(id); await finish();
 if (id === "unmount") assert(state(id).visible === null, "proposal unmount");
 else assert(!state(id).visible, id + " accepted result " + JSON.stringify(state(id)));
 assert(state(id).writes.length === 0, id + " writes " + JSON.stringify(state(id)));
}
root("dom").addEventListener("starwind:open-change", event => event.preventDefault(), {once:true});
await trigger("dom"); await finish(); assert(!state("dom").visible && state("dom").writes.length === 0, "DOM cancellation");
assert(state("disabled").visible && state("disabled").rendered === "true", "disabled anchor preserves accepted open");
cases.disabled.setDisabled(false); await finish(); assert(state("disabled").visible, "re-enable retains open");
cases.disabled.setModel(false); await finish();
await trigger("disabled"); await finish(); assert(state("disabled").visible, "re-enabled trigger opens");
const disabledCallbacks = state("disabled").callbacks.length;
cases.disabled.setDisabled(true); await finish(); assert(state("disabled").visible && state("disabled").callbacks.length === disabledCallbacks, "disabled anchor does not command root");
cases.disabled.setModel(false); await finish();
button("intent").focus(); await wait(70); assert(!state("intent").visible,"focus waits for opening delay"); await wait(600); assert(state("intent").visible,"focus opens after delay"); close("intent"); await finish();
hover("constructor"); await wait(50); cases.constructor.delays(400); await wait(200); assert(!state("constructor").visible && state("constructor").callbacks.length === 0,"constructor change retires open timer");
cases.constructor.delays(200); await settle(); hover("constructor"); await wait(80); cases.constructor.replaceOwners(); await wait(150); assert(state("constructor").visible && state("constructor").callbacks.at(-1).owner === "b","callback replacement retains pending timer and current callback"); close("constructor"); await finish();
hover("timed"); await wait(70); assert(!state("timed").visible, "default 600ms delay"); await wait(570); assert(state("timed").visible, "default hover opens");
button("timed").dispatchEvent(new PointerEvent("pointerleave",{pointerType:"mouse",clientX:-100,clientY:-100})); await wait(70); assert(state("timed").visible, "default close delay");
popup("timed").dispatchEvent(new PointerEvent("pointerenter",{pointerType:"mouse"})); await wait(350); assert(state("timed").visible, "hoverable content cancels close");
popup("timed").dispatchEvent(new PointerEvent("pointerleave",{pointerType:"mouse",clientX:-100,clientY:-100})); await wait(700); assert(!state("timed").visible, "content leave closes");
hover("timed"); await wait(60); button("timed").dispatchEvent(new PointerEvent("pointerleave",{pointerType:"mouse",clientX:-100,clientY:-100})); await wait(40); hover("timed"); await wait(70); assert(!state("timed").visible,"rapid re-entry restarts hover opening"); await wait(560); assert(state("timed").visible,"re-entry accepts one opening"); close("timed"); await finish();
cases.timed.hoverable(false); await settle(); hover("timed"); await wait(700); button("timed").dispatchEvent(new PointerEvent("pointerleave",{pointerType:"mouse",clientX:-100,clientY:-100})); popup("timed").dispatchEvent(new PointerEvent("pointerenter",{pointerType:"mouse"})); await wait(700); assert(!state("timed").visible,"non-hoverable content preserves closing"); cases.timed.hoverable(true); await settle();
hover("raw"); await wait(60); assert(state("raw").visible, "native raw opening delay attribute"); button("raw").dispatchEvent(new PointerEvent("pointerleave",{pointerType:"mouse"})); await wait(60); assert(!state("raw").visible, "native raw closing delay attribute");
cases.raw.triggerDelays(100,110); await settle(); assert(button("raw").getAttribute("data-open-delay") === "100" && button("raw").getAttribute("data-close-delay") === "110", "typed delay props override raw attributes"); cases.raw.triggerDelays(undefined,undefined); await settle(); assert(button("raw").getAttribute("data-open-delay") === "15" && button("raw").getAttribute("data-close-delay") === "20", "removing typed delays restores raw attributes");
assert(button("override").getAttribute("data-open-delay") === "15" && button("override").getAttribute("data-close-delay") === "20", "initial public Trigger delay props");
hover("override"); await wait(60); assert(state("override").visible, "initial public opening override"); button("override").dispatchEvent(new PointerEvent("pointerleave",{pointerType:"mouse"})); await wait(60); assert(!state("override").visible, "initial public closing override");
cases.override.triggerDelays(120,120); await settle(); hover("override"); await wait(45); assert(!state("override").visible, "reactive opening override waits"); await wait(110); assert(state("override").visible, "reactive opening override applies"); button("override").dispatchEvent(new PointerEvent("pointerleave",{pointerType:"mouse"})); await wait(45); assert(state("override").visible, "reactive closing override waits"); await wait(110); assert(!state("override").visible, "reactive closing override applies");
cases.override.triggerDelays(undefined,undefined); await settle(); assert(!button("override").hasAttribute("data-open-delay") && !button("override").hasAttribute("data-close-delay"), "undefined override removes attributes"); hover("override"); await wait(160); assert(!state("override").visible, "removed opening override uses Root default"); await wait(500); assert(state("override").visible, "Root opening after removal"); button("override").dispatchEvent(new PointerEvent("pointerleave",{pointerType:"mouse"})); await wait(160); assert(state("override").visible, "removed closing override uses Root default"); await wait(200); assert(!state("override").visible, "Root closing after removal");
cases.timed.setDisabled(true); await settle(); hover("timed"); await wait(700); assert(!state("timed").visible, "disabled trigger rejects hover"); cases.timed.setDisabled(false); await settle();
await trigger("component"); assert(state("component").visible && button("component") instanceof HTMLAnchorElement, "component child forwards semantic owner"); close("component"); await finish();
const navigation = button("defined"); assert(navigation instanceof HTMLAnchorElement, "native anchor owner"); navigation.click(); await settle(); assert(location.hash === "#destination-defined", "enabled anchor navigation"); assert(state("defined").clicks === 1 && navigation.title === "Profile defined" && navigation.tabIndex === 2, "native attributes and callback forwarded once");
cases.defined.setDisabled(true); await settle(); assert(!navigation.hasAttribute("href") && navigation.tabIndex === -1 && navigation.getAttribute("aria-disabled") === "true", "disabled anchor markers"); location.hash = "#disabled"; navigation.click(); await settle(); assert(location.hash === "#disabled", "disabled navigation prevented"); assert(state("defined").clicks === 1, "disabled activation guards consumer callback"); cases.defined.setDisabled(false); await settle(); assert(navigation.getAttribute("href") === "#destination-defined", "enabled href restored"); assert(navigation.tabIndex === 2, "enabled authored tabindex restored");
await trigger("floating"); await finish();
assert(state("floating").visible && document.activeElement === button("floating"), "keyboard opens without moving focus");
assert(popup("floating").getAttribute("role") === "tooltip" && popup("floating").tabIndex === 0, "description role and authored tabindex " + popup("floating").outerHTML);
assert(button("floating").getAttribute("aria-describedby") === popup("floating").id && popup("floating").id, "description linkage");
const interactiveLink = popup("floating").querySelector("[data-content-link]"); interactiveLink.focus(); await finish(); assert(state("floating").visible && document.activeElement === interactiveLink, "trigger-to-content focus remains open");
const interactiveButton = popup("floating").querySelector("[data-content-button]"); interactiveButton.focus(); interactiveButton.click(); await finish(); assert(state("floating").visible && document.activeElement === interactiveButton, "interactive content accepts focus and activation");
assert(document.body.style.overflow === "" && document.documentElement.style.overflow === "", "Preview Card does not lock document scrolling");
const stablePopup = popup("floating"), originalWrapper = wrapper("floating");
cases.floating.updateAttachment("first"); await settle(); assert(state("floating").reactive.join("|") === "first:0:set|other:0:set|first:0:clear|first:1:set", "reactive attachment dependency runs with sibling isolation");
cases.floating.updateAttachment("other"); await settle(); assert(state("floating").reactive.slice(-2).join("|") === "other:0:clear|other:1:set", "second attachment keeps independent dependency");

cases.floating.changeClass(); await settle(); assert(state("floating").refs.join("|") === "a:set", "unrelated class preserves ref");
cases.floating.replaceOwners(); await settle();
assert(popup("floating") === stablePopup && state("floating").refs.at(-1) === "b:set", "replacement callback receives the current trigger without replacing the popup");
assert(state("floating").attachments.filter(value=>value.endsWith(":set")).length===state("floating").attachments.filter(value=>value.endsWith(":clear")).length+1,"forwarded attachment replacement leaves one current owner");
await finish();
let box = popup("floating").getBoundingClientRect(), anchor = button("floating").getBoundingClientRect();
assert(Math.abs(box.left-anchor.right-24)<2 && popup("floating").dataset.side === "right", "right placement");
button("floating").focus(); await finish();
for (const target of ["#portal-b","[invalid","#missing-target"${styled ? "" : ', document.getElementById("portal-a"), originalWrapper, document.createElement("div")'}]) {
 cases.floating.place(target); await finish();
 const expected = typeof target === "object" && target.id === "portal-a" ? target : target === "#portal-b" ? document.getElementById("portal-b") : document.body;
 assert(wrapper("floating") === originalWrapper && originalWrapper.parentElement === expected && state("floating").visible, "portal retarget retains wrapper");
}
cases.floating.place("#portal-a",true); await finish(); assert(root("floating").contains(originalWrapper), "inline portal");
cases.floating.place("#portal-a"); await finish(); document.getElementById("portal-a").remove(); await finish(); assert(originalWrapper.parentElement === document.body,"removed target fallback");
const replacement = document.createElement("div"); replacement.id="portal-a"; document.body.appendChild(replacement); await finish(); assert(originalWrapper.parentElement === replacement,"replacement target");
document.getElementById("outside").focus(); await finish(); cases.floating.setModel(true); await finish();

button("floating").dispatchEvent(new KeyboardEvent("keydown",{key:"Escape",bubbles:true,cancelable:true})); await finish(); assert(!state("floating").visible,"Escape dismissal");
await trigger("floating"); await finish(); document.getElementById("outside").dispatchEvent(new PointerEvent("pointerdown",{bubbles:true})); await finish(); assert(!state("floating").visible,"outside dismissal");
cases.nested.setModel(true); await finish(); const childTrigger=document.querySelector('[data-child-trigger="nested"]'), childPopup=document.querySelector('[data-child-popup="nested"]'); childTrigger.dispatchEvent(new PointerEvent("pointerenter",{pointerType:"mouse"})); await finish(); assert(state("nested").visible && state("nested").childOpen && !childPopup.hidden,"nested roots retain separate portal ownership"); cases.nested.setModel(false); await finish(); assert(!state("nested").visible && !childPopup.hidden,"outer model does not command nested root"); childTrigger.dispatchEvent(new FocusEvent("focusout",{relatedTarget:document.getElementById("outside")})); await finish();
cases.owner.setOwner(true); await finish(); button("owner").dispatchEvent(new PointerEvent("pointerenter",{pointerType:"mouse"})); await wait(700); assert(state("owner").visible,"PreviewCard inside native owner opens " + JSON.stringify({state:state("owner"),modal:document.querySelector('[data-owner-popup="owner"]')?.open})); cases.owner.setOwner(false); await finish(); assert(!state("owner").visible && state("owner").model === false,"native owner closure publishes accepted state");
cases["pending-close"].setModel(true); await finish(); button("pending-close").dispatchEvent(new PointerEvent("pointerleave",{pointerType:"mouse",clientX:-100,clientY:-100})); hover("pending-open");

for (const id of ["restore-function", "restore-omitted"]) {
 const first = button(id).matches("button,a") ? button(id) : button(id).querySelector("button,a");
 const secondHost = document.querySelector('[data-trigger-b="'+id+'"]');
 const second = secondHost.matches("button,a") ? secondHost : secondHost.querySelector("button,a");
 const enter = node => node.dispatchEvent(new PointerEvent("pointerenter", {pointerType:"mouse"}));
 const leave = node => node.dispatchEvent(new PointerEvent("pointerleave", {pointerType:"mouse",clientX:-100,clientY:-100}));
 const at = node => { const rect = popup(id).getBoundingClientRect(), anchor = node.getBoundingClientRect(); assert(state(id).visible && Math.abs(rect.left-anchor.left)<2, id+" retained geometry "+JSON.stringify({left:rect.left,anchor:anchor.left,state:state(id)})); };
 cases[id].placement("bottom","start",8); cases[id].delays(0,0); await finish();
 enter(first); await finish(); at(first);
 enter(second); await finish(); at(second);
 let count=state(id).callbacks.length;
 cases[id].options(); await finish(); at(second); assert(state(id).callbacks.length===count, "silent option restoration");
 leave(second); await finish(); enter(first); await finish(); at(first);
 cases[id].cancelSecondary(true); enter(second); await finish(); cases[id].options(); await finish(); at(first);
 cases[id].cancelSecondary(false);
 root(id).addEventListener("starwind:open-change", event => event.preventDefault(), {once:true});
 enter(second); await finish(); cases[id].options(); await finish(); at(first);
 enter(second); await finish(); at(second);
 leave(second); await finish(); enter(first); await finish(); at(first);
 leave(first); await finish(); cases[id].delays(120,0); await finish();
 enter(first); await wait(30); assert(!state(id).visible,"positive pending timer control");
 count=state(id).callbacks.length; cases[id].replaceOwners(); await settle(); await wait(130); await finish();
 at(first); assert(state(id).callbacks.length===count+1,"callback/ref update preserves pending timer");
 leave(first); await finish();
}
return {complete:true,activeTriggerRestoration:true,parentRetiresPendingOpen:true,parentRetiresPendingClose:true,modelTruthTable:true,cancellation:true,parentCommands:true,refsAndAttachments:true,portalLifecycle:true,placement:true,timing:true,anchorNavigation:true,hoverableContent:true};
`,
    styled,
  );
  return { result, build };
}

/** Ref and attachment updates preserve the active timer and use the current proposal callback. */
export function verifyPreviewCardPendingOwners(consumer: DistConsumer, styled = false) {
  return verifyPreviewCardBrowser(
    consumer,
    [{ id: "owners", initial: false }],
    `
 cases.owners.delays(200); await settle(); hover("owners"); await wait(60);
 cases.owners.replaceOwners(); await settle(); await wait(180);
 const snapshot = state("owners");
 assert(snapshot.visible && snapshot.callbacks.length === 1 && snapshot.callbacks[0].owner === "b", "Current callback accepts pending delay " + JSON.stringify(snapshot));
 assert(snapshot.refs.join("|") === "a:set|a:clear|b:set" && snapshot.attachments.join("|") === "a:set|a:clear|b:set", "Pending timer keeps semantic owner and transfers ref/attachment once");
 return {pendingOwners:true};`,
    styled,
  );
}

export async function verifyPreviewCardDiagnostics(consumer: DistConsumer, styled = false) {
  await consumer.write({
    "PreviewCardDiagnostics.svelte": diagnosticsSource(styled),
    "hydrate-main.js": PREVIEW_DIAGNOSTICS_CLIENT,
    "build-browser.mjs": createBrowserBuildScript(true),
  });
  await consumer.run("build-browser.mjs");
  const result = await runPreviewCardBrowser(consumer, "");
  assert.deepEqual(result, { invalidCases: 4, recovered: true });
  return result;
}
function diagnosticsSource(styled: boolean) {
  return `<script lang="ts">
import Overlay, {type AnchorChildPayload} from "${styled ? "./hover-card/index.js" : "@starwind-ui/svelte/preview-card"}";
let {mode="valid"}:{mode?:"valid"|"wrong"|"missing"|"stripped"|"multiple"}=$props();let generation=$state(0),second=$state(false);
const refs:(string|null)[]=[];let current:string|null=null;
const refA=(node:HTMLAnchorElement|null)=>{if(node&&!(node instanceof HTMLAnchorElement))throw new Error("wrong owner exposed");current=node?.id??null;refs.push(current);},refB=(node:HTMLAnchorElement|null)=>refA(node);
export function setMode(value:typeof mode){mode=value;}export function replace(){generation++;}export function callbacks(){second=!second;}export function snapshot(){return {refs:[...refs],current};}
</script>
{#snippet child({props,children}:AnchorChildPayload)}
{#if mode==="missing"}<a href="#missing" id="missing">Missing</a>
{:else if mode==="stripped"}<a {...Object.fromEntries(Object.entries(props))} id="stripped">Stripped</a>
{:else if mode==="wrong"}<button {...(props as Record<string,unknown>)} id="wrong">Wrong</button>
{:else}{#key generation}<a {...props} id="main">{@render children?.()}</a>{/key}{#if mode==="multiple"}<a {...props} id="extra">Extra</a>{/if}{/if}
{/snippet}
<Overlay.Root><Overlay.Trigger href="#docs" {child} ref={second?refB:refA}>Docs</Overlay.Trigger>${styled ? "<Overlay.Content>Preview</Overlay.Content>" : "<Overlay.Portal><Overlay.Popup>Preview</Overlay.Popup></Overlay.Portal>"}</Overlay.Root>`;
}
const PREVIEW_DIAGNOSTICS_CLIENT = `import {mount,flushSync,tick,unmount} from "svelte";import App from "./PreviewCardDiagnostics.svelte";
const assert=(v,m)=>{if(!v)throw new Error(m);};const settle=async()=>{flushSync();await tick();flushSync();await tick();flushSync();};const warnings=[];const warn=console.warn;console.warn=(message)=>warnings.push(String(message));
try{const target=document.querySelector("#app");for(const mode of ["wrong","missing","stripped","multiple"]){warnings.length=0;const app=mount(App,{target,props:{mode}});await settle();assert(warnings.length===1,"diagnostic count "+mode+JSON.stringify(warnings));assert(warnings[0].includes(mode==="wrong"?"HTMLAnchorElement":mode==="multiple"?"multiple owners":"did not attach"),"diagnostic category "+mode);assert(app.snapshot().current===null,"invalid owner retained "+mode);const retained=document.querySelector("#main");app.setMode("valid");await settle();assert(app.snapshot().current==="main","recovery "+mode);if(mode==="multiple")assert(retained===document.querySelector("#main"),"recovery replaced surviving anchor");assert(warnings.length===1,"recovery warning");await unmount(app);await settle();assert(app.snapshot().current===null,"unmount retained ref");}
warnings.length=0;const app=mount(App,{target});await settle();app.callbacks();await settle();app.replace();await settle();app.setMode("missing");app.setMode("valid");await settle();await unmount(app);await settle();assert(warnings.length===0,"valid lifecycle warning "+JSON.stringify(warnings));document.documentElement.dataset.previewCardResult=JSON.stringify({invalidCases:4,recovered:true});}catch(error){document.documentElement.dataset.previewCardResult=JSON.stringify({error:String(error)});}finally{console.warn=warn;}`;

export async function verifyPreviewCardOrdinaryModel(consumer: DistConsumer, styled = false) {
  const { build, ...result } = await verifyPreviewCardBrowser(
    consumer,
    [
      { id: "ordinary", mode: "bound", initial: false, rawOpenDelay: "0", rawCloseDelay: "0" },
      {
        id: "cancel",
        mode: "bound",
        initial: false,
        proposal: "cancel",
        rawOpenDelay: "0",
        rawCloseDelay: "0",
      },
    ],
    `
await trigger("ordinary"); await finish(); assert(state("ordinary").visible && state("ordinary").model === true, "accepted trigger publishes open");
close("ordinary"); await finish(); assert(!state("ordinary").visible && state("ordinary").model === false, "accepted close publishes closed");
cases.ordinary.options(); await finish(); assert(!state("ordinary").visible && state("ordinary").model === false, "closed state survives option recreation");
await trigger("cancel"); await finish(); assert(!state("cancel").visible && state("cancel").model === false, "canceled proposal preserves closed");
cases.cancel.setModel(true); await finish(); assert(state("cancel").visible && state("cancel").model === true, "later parent command opens");
cases.cancel.setModel(false); await finish(); assert(!state("cancel").visible && state("cancel").model === false, "later parent command closes");
return { ordinaryModel: true };
`,
    styled,
  );
  return { result, build };
}
