import assert from "node:assert/strict";
import { once } from "node:events";
import { readFile } from "node:fs/promises";
import { createServer } from "node:http";
import { chromium } from "playwright";
import { createBrowserBuildScript } from "./compatibility-hydration.js";
import type { DistConsumer } from "./dist-consumer.js";

export type TooltipCase = {
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
  directPopup?: boolean;
};

/** Runs the same public model and lifecycle assertions through either generated surface. */
export async function verifyTooltipBrowser(
  consumer: DistConsumer,
  configs: TooltipCase[],
  actions: string,
  styled = false,
) {
  await consumer.write({
    "Case.svelte": tooltipCaseSource(styled),
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
    await page.waitForFunction(() => document.documentElement.dataset.tooltipResult, undefined, {
      timeout: 30_000,
    });
    const result = await page.evaluate(() =>
      JSON.parse(document.documentElement.dataset.tooltipResult!),
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

export function tooltipCaseSource(styled: boolean): string {
  const popup = styled ? "Content" : "Popup";
  return `<script lang="ts">
import { flushSync, untrack, type ComponentProps } from "svelte";
import { createAttachmentKey, type Attachment } from "svelte/attachments";
import Overlay from "${styled ? "./tooltip/index.js" : "@starwind-ui/svelte/tooltip"}";
import Dialog from "@starwind-ui/svelte/dialog";
import Primitive, { type TooltipOpenChangeDetails } from "@starwind-ui/svelte/tooltip";
let { id, mode = "function", initial, defaultOpen, proposal = "accept", setter = "identity", missingPopup = false, disabled: initialDisabled = false, nativeOwner = false, nested = false, directPopup = false }: { id: string; mode?: string; initial?: boolean; defaultOpen?: boolean; proposal?: string; setter?: string; missingPopup?: boolean; disabled?: boolean; nativeOwner?: boolean; nested?: boolean; directPopup?: boolean } = $props();
let showSecond = $state(true), foreignSecond = $state(false), cancelSecond = $state(false);
let model = $state<boolean | undefined>(untrack(() => initial));
let disabled = $state(untrack(() => initialDisabled)), openDelay = $state(200), closeDelay = $state(200), disableHoverableContent = $state(false), escape = $state(true);
let portalError = $state<string>();
let shown = $state(true), showPopup = $state(!untrack(() => missingPopup)), second = $state(false), key = $state(0), popupKey = $state(0), portalKey = $state(0), positionerKey = $state(0), arrowKey = $state(0);
let container = $state<string | HTMLElement>("#portal-a"), disablePortal = $state(false), side = $state<"top" | "bottom" | "left" | "right">(untrack(()=>id==="floating"?"right":"top")), align = $state<"start" | "center" | "end">(untrack(()=>id==="floating"||id.startsWith("restore-")?"start":"center")), sideOffset = $state(untrack(()=>id==="floating"?24:8)), avoidCollisions = $state(false), className = $state("before");
let ownerOpen = $state<boolean | undefined>(false), childOpen = $state<boolean | undefined>(false), cancelClose = $state(false);
const childCallbacks: boolean[] = [];
const callbacks: unknown[] = [], writes: boolean[] = [], refs: string[] = [], popupRefs: string[] = [], attachments: string[] = [];
const attachmentKey = createAttachmentKey();
const attach = (name: string): Attachment<HTMLButtonElement> => node => { attachments.push(name + ":set"); return () => attachments.push(name + ":clear"); };
let forwarded = $state({ [attachmentKey]: attach("a") });
const refA = (node: HTMLButtonElement | null) => refs.push("a:" + (node ? "set" : "clear"));
const refB = (node: HTMLButtonElement | null) => refs.push("b:" + (node ? "set" : "clear"));
const popupA = (node: HTMLDivElement | null) => popupRefs.push("a:" + (node ? "set" : "clear"));
const popupB = (node: HTMLDivElement | null) => popupRefs.push("b:" + (node ? "set" : "clear"));
function handle(owner: string, next: boolean, detail: TooltipOpenChangeDetails) {
 callbacks.push({owner, next, model: model ?? "undefined"});
 if (cancelSecond && detail.trigger?.getAttribute("data-trigger-b") === id) detail.cancel();
 if (proposal === "cancel" || (cancelClose && !next)) detail.cancel();
 if (proposal === "command-cancel") { model = true; flushSync(); detail.cancel(); }
 if (proposal === "two-commands") { model = true; flushSync(); model = false; flushSync(); detail.cancel(); }
 if (proposal === "unmount") { shown = false; flushSync(); }
}
function publish(next: boolean | undefined) { if (next === undefined) throw new Error("Undefined Tooltip publication"); writes.push(next); if (setter === "invert") model = !next; else if (setter !== "retain") model = next; }
let common = $derived({ "data-case": id, defaultOpen, disabled, openDelay, closeDelay, disableHoverableContent, closeOnEscape: escape, onOpenChange: (next: boolean, detail: TooltipOpenChangeDetails) => handle(second ? "b" : "a", next, detail), style: "display:inline-block;margin:28px" } satisfies ComponentProps<typeof Overlay.Root>);
export function secondary(show: boolean, foreign = false) { showSecond = show; foreignSecond = foreign; }
export function cancelSecondary(value: boolean) { cancelSecond = value; }
export function setModel(value: boolean | undefined) { model = value; }
export function setDisabled(value: boolean) { disabled = value; }
export function delays(open: number, close = 200) { openDelay = open; closeDelay = close; }
export function options() { escape = !escape; }
export function hoverable(value: boolean) { disableHoverableContent = !value; }
export function replace(part: string) { if (part === "trigger") key++; if (part === "popup") popupKey++; if (part === "portal") portalKey++; if (part === "positioner") positionerKey++; if (part === "arrow") arrowKey++; }
export function placement(value: typeof side, alignment: typeof align = "center", offset = 8, collisions = false) { side = value; align = alignment; sideOffset = offset; avoidCollisions = collisions; }
export function setPopup(value: boolean) { showPopup = value; }
export function place(value: string | HTMLElement, off = false) { container = value; disablePortal = off; }
export function replaceOwners() { second = true; forwarded = { [attachmentKey]: attach("b") }; }
export function changeClass() { className = "after"; }
export function setOwner(value: boolean) { ownerOpen = value; }
export function cancelClosing(value: boolean) { cancelClose = value; }
export function hide() { shown = false; }
export function snapshot() { return { portalError, childOpen, childCallbacks:[...childCallbacks], model: model ?? "undefined", writes: [...writes], callbacks: [...callbacks], refs: [...refs], popupRefs: [...popupRefs], attachments: [...attachments] }; }
</script>
{#snippet surface()}
${styled ? "" : "{#if directPopup}{@render content()}{:else}"}
${styled ? "" : "{#key positionerKey}<Primitive.Positioner {side} {align} {sideOffset} {avoidCollisions}>"}
{@render content()}
${styled ? "" : "</Primitive.Positioner>{/key}{/if}"}
{/snippet}
{#snippet content()}
{#if showPopup}{#key popupKey}<Overlay.${popup} {side} {align} {sideOffset} {avoidCollisions} data-popup={id} style="display:flow-root;width:180px;height:30px;transition:opacity 20ms" ref={second ? popupB : popupA}${styled ? ' portalContainer={typeof container === "string" ? container : undefined} {disablePortal}' : ""}>
Tooltip description ${styled ? "" : "{#key arrowKey}<Primitive.Arrow data-arrow={id} />{/key}"}
</Overlay.${popup}>{/key}{/if}
{/snippet}
{#snippet parts(accepted: boolean)}
<output data-rendered={id}>{String(accepted)}</output>
{#key key}<Overlay.Trigger data-trigger={id} {...forwarded} ref={second ? refB : refA} class={className}>{#snippet child({ props, children })}<button {...props}>{@render children?.()}</button>{/snippet}Show {id}</Overlay.Trigger>{/key}
{#if id.startsWith("restore-") && showSecond}<div data-sw-tooltip={foreignSecond ? "" : undefined}><Overlay.Trigger data-trigger-b={id} style="position:fixed;left:700px;top:120px;width:80px;height:30px">{#snippet child({ props, children })}<button {...props}>{@render children?.()}</button>{/snippet}Second</Overlay.Trigger></div>{/if}
{#key portalKey}${styled ? "{@render surface()}" : "{#if directPopup}{@render surface()}{:else}<Primitive.Portal {container} disabled={disablePortal}>{@render surface()}</Primitive.Portal>{/if}"}{/key}
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
{#if directPopup}<div data-expected-portal-error><svelte:boundary onerror={error => { portalError = (error as Error).message; }}>{@render rootContent()}</svelte:boundary></div>{:else if nativeOwner}<Dialog.Root bind:open={ownerOpen}><Dialog.Popup data-owner-popup={id}><Dialog.Title>Owner</Dialog.Title>{@render rootContent()}</Dialog.Popup></Dialog.Root>{:else}{@render rootContent()}{/if}`;
}

function main(actions: string): string {
  return `import { hydrate, unmount, flushSync, tick } from "svelte"; import App from "./App.svelte";
const assert = (value, message) => { if (!value) throw new Error(message); };
try {
const target = document.getElementById("app"), before = [...target.querySelectorAll("[data-sw-part], [data-slot]")].filter(node => !node.closest("[data-expected-portal-error]"));
const app = hydrate(App, { target });
const settle = async () => { flushSync(); await tick(); await new Promise(resolve => setTimeout(resolve, 0)); flushSync(); };
const wait = async ms => { await new Promise(resolve => setTimeout(resolve, ms)); await settle(); };
const finish = async () => { for (let i = 0; i < 6; i++) { await new Promise(requestAnimationFrame); await settle(); } };
await settle(); const cases = app.getCases();
const root = id => document.querySelector('[data-case="' + id + '"]');
const popup = id => document.querySelector('[data-popup="' + id + '"]');
const button = id => document.querySelector('[data-trigger="' + id + '"]');
const hover = id => button(id).dispatchEvent(new PointerEvent("pointerenter", {pointerType:"mouse"}));
const trigger = async id => { document.getElementById("outside").focus(); document.dispatchEvent(new KeyboardEvent("keydown", {key:"Tab", bubbles:true})); button(id).focus(); await settle(); };
const close = id => button(id).dispatchEvent(new FocusEvent("focusout", {relatedTarget:document.getElementById("outside"), bubbles:true}));
const wrapper = id => popup(id)?.closest('[data-sw-tooltip-portal]');
const state = id => ({ ...cases[id].snapshot(), visible: popup(id) ? !popup(id).hidden : null, rendered: document.querySelector('[data-rendered="' + id + '"]')?.textContent ?? null });
assert(before.every(node => node.isConnected), "Tooltip hydration replaced owners");
const result = await (async () => { ${actions} })();
const oldCases = {...cases}, staleButtons = Object.keys(cases).map(button).filter(Boolean);
await unmount(app); await finish();
const snapshots = Object.values(oldCases).map(entry => JSON.stringify(entry.snapshot()));
for (const node of staleButtons) { node.dispatchEvent(new PointerEvent("pointerenter", {pointerType:"mouse"})); node.focus(); }
await wait(250);
assert(JSON.stringify(snapshots) === JSON.stringify(Object.values(oldCases).map(entry => JSON.stringify(entry.snapshot()))), "Tooltip stale callback or model write");
assert(document.querySelectorAll("[data-sw-tooltip], [data-sw-tooltip-portal], [data-sw-tooltip-popup]").length === 0, "Tooltip leaked owners or popups");
document.documentElement.dataset.tooltipResult = JSON.stringify({ ...result, hydrationExact:true, teardown:true });
} catch(error) { document.documentElement.dataset.tooltipResult = JSON.stringify({ error: String(error), stack:error.stack }); }`;
}

/** Tooltip rejects omitted Portal composition before Runtime can move the popup. */
export function verifyTooltipPortalRequirement(consumer: DistConsumer) {
  return verifyTooltipBrowser(
    consumer,
    [
      { id: "controlled", mode: "plain", initial: true, directPopup: true },
      { id: "default", mode: "omitted", defaultOpen: true, directPopup: true },
      { id: "closed", initial: false, directPopup: true },
      { id: "valid", mode: "plain", initial: true },
    ],
    `
for (const id of ["controlled", "default", "closed"]) {
  assert(cases[id].snapshot().portalError === "Starwind UI: <Tooltip.Portal> is missing.", id + " missing Portal error");
  assert(!root(id) && !popup(id), id + " rejected subtree cleanup");
  assert(cases[id].snapshot().callbacks.length === 0, id + " rejected before opening");
}
assert(state("valid").visible, "standard Portal opens");
cases.valid.place("#portal-a", true); await finish();
assert(state("valid").visible && root("valid").contains(popup("valid")), "disabled Portal stays inline");
return { portalRequired: true };
`,
  );
}

/** Regression: disabling a closed Tooltip must cancel its queued hover opening. */
export async function verifyTooltipDisabledTimer(consumer: DistConsumer, styled = false) {
  return verifyTooltipBrowser(
    consumer,
    [{ id: "pending", initial: false }],
    `
hover("pending"); await wait(40);
cases.pending.setDisabled(true); await settle(); cases.pending.setDisabled(false); await settle();
await wait(250);
assert(!state("pending").visible && state("pending").callbacks.length === 0, "Tooltip pending hover reopened after disable/re-enable " + JSON.stringify(state("pending")));
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
  cases["${id}"].setModel(${accepted}); await settle(); await wait(250); await finish();
  assert(state("${id}").visible === ${accepted} && state("${id}").model === ${accepted}, "Newly defined parent ${accepted ? "open" : "close"} must retire pending ${pending}: " + JSON.stringify(state("${id}")));
  assert(state("${id}").callbacks.length === ${pending}Callbacks && state("${id}").writes.length === ${pending}Writes, "Silent same-state parent command does not emit or republish");
  `;
}

export function verifyTooltipParentTimerCommand(
  consumer: DistConsumer,
  pending: "open" | "close",
  styled = false,
) {
  return verifyTooltipBrowser(
    consumer,
    [{ id: `parent-${pending}`, initial: pending === "close" }],
    parentTimerActions(pending) + "return { parentRetiresTimer:true };",
    styled,
  );
}

export const tooltipLifecycleCases: TooltipCase[] = [
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
  { id: "timed", initial: false },
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
export async function verifyTooltipLifecycle(consumer: DistConsumer, styled = false) {
  const { build, ...result } = await verifyTooltipBrowser(
    consumer,
    tooltipLifecycleCases,
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
assert(!state("disabled").visible && state("disabled").rendered === "false", "initial disabled normalizes open");
cases.disabled.setDisabled(false); await finish(); assert(!state("disabled").visible, "re-enable stays closed");
await trigger("disabled"); await finish(); assert(state("disabled").visible, "re-enabled trigger opens");
const disabledCallbacks = state("disabled").callbacks.length;
cases.disabled.setDisabled(true); await finish(); assert(!state("disabled").visible && state("disabled").model === false && state("disabled").callbacks.length === disabledCallbacks, "disabled closes silently");
cases.disabled.setModel(true); await finish(); assert(state("disabled").model === false && !state("disabled").visible, "disabled parent open normalized");
button("intent").dispatchEvent(new PointerEvent("pointerdown",{bubbles:true,pointerType:"mouse"}));
button("intent").focus(); await wait(70); assert(!state("intent").visible,"pointer-origin focus does not bypass hover delay");
await trigger("intent"); await settle(); assert(state("intent").visible,"keyboard focus opens immediately"); close("intent"); await finish();
hover("constructor"); await wait(50); cases.constructor.delays(400); await wait(200); assert(!state("constructor").visible && state("constructor").callbacks.length === 0,"constructor change retires open timer");
cases.constructor.delays(200); await settle(); hover("constructor"); await wait(80); cases.constructor.replaceOwners(); await wait(150); assert(state("constructor").visible && state("constructor").callbacks.at(-1).owner === "b","callback replacement retains pending timer and current callback"); close("constructor"); await finish();
hover("timed"); await wait(70); assert(!state("timed").visible, "default 200ms delay"); await wait(170); assert(state("timed").visible, "default hover opens");
button("timed").dispatchEvent(new PointerEvent("pointerleave",{pointerType:"mouse",clientX:-100,clientY:-100})); await wait(70); assert(state("timed").visible, "default close delay");
popup("timed").dispatchEvent(new PointerEvent("pointerenter",{pointerType:"mouse"})); await wait(200); assert(state("timed").visible, "hoverable content cancels close");
popup("timed").dispatchEvent(new PointerEvent("pointerleave",{pointerType:"mouse",clientX:-100,clientY:-100})); await wait(250); assert(!state("timed").visible, "content leave closes");
hover("timed"); await wait(60); button("timed").dispatchEvent(new PointerEvent("pointerleave",{pointerType:"mouse",clientX:-100,clientY:-100})); await wait(40); hover("timed"); await wait(70); assert(!state("timed").visible,"rapid re-entry restarts hover opening"); await wait(160); assert(state("timed").visible,"re-entry accepts one opening"); close("timed"); await finish();
cases.timed.hoverable(false); await settle(); hover("timed"); await wait(240); button("timed").dispatchEvent(new PointerEvent("pointerleave",{pointerType:"mouse",clientX:-100,clientY:-100})); popup("timed").dispatchEvent(new PointerEvent("pointerenter",{pointerType:"mouse"})); await wait(250); assert(!state("timed").visible,"non-hoverable content preserves closing"); cases.timed.hoverable(true); await settle();
button("timed").setAttribute("data-open-delay","15"); button("timed").setAttribute("data-close-delay","15"); hover("timed"); await wait(50); assert(state("timed").visible, "trigger delay override");
button("timed").dispatchEvent(new PointerEvent("pointerleave",{pointerType:"mouse",clientX:-100,clientY:-100})); await wait(70); assert(!state("timed").visible, "trigger close override");
button("timed").removeAttribute("data-open-delay"); hover("timed"); await wait(40); cases.timed.setDisabled(true); await settle(); cases.timed.setDisabled(false); await settle(); await wait(250); assert(!state("timed").visible, "pending hover canceled by disabled");
await trigger("floating"); await finish();
assert(state("floating").visible && document.activeElement === button("floating"), "keyboard opens without moving focus");
assert(popup("floating").getAttribute("role") === "tooltip" && !popup("floating").hasAttribute("tabindex"), "non-focusable description popup");
assert(button("floating").getAttribute("aria-describedby") === popup("floating").id && popup("floating").id, "description linkage");
const stablePopup = popup("floating"), originalWrapper = wrapper("floating");
cases.floating.changeClass(); await settle(); assert(state("floating").refs.join("|") === "a:set", "unrelated class preserves ref");
cases.floating.replaceOwners(); await settle();
assert(popup("floating") === stablePopup && state("floating").refs.at(-1) === "b:set", "replacement callback receives the current trigger without replacing the popup");
assert(state("floating").attachments.filter(value=>value.endsWith(":set")).length===state("floating").attachments.filter(value=>value.endsWith(":clear")).length+1,"forwarded attachment replacement leaves one current owner");
await finish();
let box = popup("floating").getBoundingClientRect(), anchor = button("floating").getBoundingClientRect();
assert(Math.abs(box.left-anchor.right-24)<2 && popup("floating").dataset.side === "right", "right placement");
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
cases.owner.setOwner(true); await finish(); button("owner").dispatchEvent(new PointerEvent("pointerenter",{pointerType:"mouse"})); await wait(250); assert(state("owner").visible,"Tooltip inside native owner opens " + JSON.stringify({state:state("owner"),modal:document.querySelector('[data-owner-popup="owner"]')?.open})); cases.owner.setOwner(false); await finish(); assert(!state("owner").visible && state("owner").model === false,"native owner closure publishes accepted state");
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
return {complete:true,activeTriggerRestoration:true,parentRetiresPendingOpen:true,parentRetiresPendingClose:true,modelTruthTable:true,cancellation:true,parentCommands:true,refsAndAttachments:true,portalLifecycle:true,placement:true,timing:true,disabledNormalization:true,descriptionSemantics:true};
`,
    styled,
  );
  return { result, build };
}

export async function verifyTooltipOrdinaryModel(consumer: DistConsumer, styled = false) {
  const { build, ...result } = await verifyTooltipBrowser(
    consumer,
    [
      { id: "ordinary", mode: "bound", initial: false },
      { id: "cancel", mode: "bound", initial: false, proposal: "cancel" },
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
