import assert from "node:assert/strict";
import { once } from "node:events";
import { readFile } from "node:fs/promises";
import { createServer } from "node:http";
import { chromium } from "playwright";
import { createBrowserBuildScript } from "./compatibility-hydration.js";
import type { DistConsumer } from "./dist-consumer.js";

export type PopoverCase = {
  id: string;
  mode?: "omitted" | "plain" | "bound" | "function";
  initial?: boolean;
  defaultOpen?: boolean;
  modal?: boolean;
  proposal?: string;
  setter?: string;
  missingPopup?: boolean;
  hover?: boolean;
  nativeOwner?: boolean;
  nested?: "parent-first" | "child-first";
};

/** Runs the same public model and lifecycle assertions through either generated surface. */
export async function verifyPopoverBrowser(
  consumer: DistConsumer,
  configs: PopoverCase[],
  actions: string,
  styled = false,
) {
  await consumer.write({
    "Case.svelte": popoverCaseSource(styled),
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
    await page.waitForFunction(() => document.documentElement.dataset.popoverResult, undefined, {
      timeout: 30_000,
    });
    const result = await page.evaluate(() =>
      JSON.parse(document.documentElement.dataset.popoverResult!),
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

export function popoverCaseSource(styled: boolean): string {
  const importLine = styled
    ? 'import Overlay, { type PopoverProps as RootProps } from "./popover/index.js";'
    : 'import Overlay from "@starwind-ui/svelte/popover"; import type { ComponentProps } from "svelte"; type RootProps = ComponentProps<typeof Overlay.Root>;';
  const popup = styled ? "Content" : "Popup";
  return `<script lang="ts">
import { flushSync, untrack } from "svelte";
import { createAttachmentKey, type Attachment } from "svelte/attachments";
${importLine}
import Primitive from "@starwind-ui/svelte/popover";
import Dialog from "@starwind-ui/svelte/dialog";
import type { PopoverOpenChangeDetails } from "@starwind-ui/svelte/popover";
let { id, mode = "function", initial, defaultOpen, modal: initialModal = false, proposal = "accept", setter = "identity", missingPopup = false, hover = false, nativeOwner = false, nested }: { id: string; mode?: string; initial?: boolean; defaultOpen?: boolean; modal?: boolean; proposal?: string; setter?: string; missingPopup?: boolean; hover?: boolean; nativeOwner?: boolean; nested?: string } = $props();
let model = $state<boolean | undefined>(untrack(() => initial));
let modal = $state(untrack(() => initialModal));
let escape = $state(true), hoverEnabled = $state(untrack(() => hover)), closeDelay = $state(100);
let shown = $state(true), showPopup = $state(!untrack(() => missingPopup));
let showTrigger = $state(untrack(() => nested) !== "child-first");
let showSecondTrigger = $state(untrack(() => id) === "multiple-triggers");
let childShown = $state(untrack(() => nested) === "child-first");
let childOpen = $state<boolean | undefined>(undefined), cancelChild = $state(false), cancelParentClose = $state(false);
let ownerOpen = $state<boolean | undefined>(false);
let popupKey = $state(0), backdropKey = $state(0), closeKey = $state(0), triggerKey = $state(0), portalKey = $state(0), positionerKey = $state(0), arrowKey = $state(0), viewportKey = $state(0), titleKey = $state(0), descriptionKey = $state(0);
let side = $state<"top" | "right" | "bottom" | "left">("bottom"), align = $state<"start" | "center" | "end">("center"), sideOffset = $state(4), avoidCollisions = $state(false), collisionStrategy = $state<"initial-placement" | "best-fit">("initial-placement");
let container = $state<string | HTMLElement>("#portal-a"), disablePortal = $state(false);
let second = $state(false), className = $state("before");
const writes: boolean[] = [], callbacks: { next: boolean; previous: boolean | string; owner: string; reason: string }[] = [], completions: { model: boolean | string; hidden: boolean | undefined }[] = [];
const refs: string[] = [], attachments: string[] = [], popupRefs: string[] = [], childProposals: boolean[] = [];
const refA = (element: HTMLButtonElement | null) => { refs.push("a:" + (element?.tagName ?? "null")); };
const refB = (element: HTMLButtonElement | null) => { refs.push("b:" + (element?.tagName ?? "null")); };
const popupA = (element: HTMLDivElement | null) => { popupRefs.push("a:" + (element?.tagName ?? "null")); };
const popupB = (element: HTMLDivElement | null) => { popupRefs.push("b:" + (element?.tagName ?? "null")); };
const attachment = (owner: string): Attachment<HTMLButtonElement> => () => { attachments.push(owner + ":setup"); return () => { attachments.push(owner + ":cleanup"); }; };
const key = createAttachmentKey(); let forwarded = $state.raw({ [key]: attachment("a") });
function handle(owner: string, next: boolean, detail: PopoverOpenChangeDetails) {
 callbacks.push({ next, previous: model ?? "undefined", owner, reason: detail.reason });
 if (proposal === "cancel" || (cancelParentClose && !next)) detail.cancel();
 if (proposal === "command-cancel") { model = true; flushSync(); detail.cancel(); }
 if (proposal === "two-commands") { model = true; flushSync(); model = false; flushSync(); }
 if (proposal === "unmount") { shown = false; flushSync(); }
}
const proposalA = (next: boolean, detail: PopoverOpenChangeDetails) => handle("a", next, detail);
const proposalB = (next: boolean, detail: PopoverOpenChangeDetails) => handle("b", next, detail);
function publish(next: boolean | undefined) { if (next === undefined) throw new Error("Undefined Popover publication"); writes.push(next); if (setter === "invert") model = !next; else if (setter !== "retain") model = next; }
function complete() { completions.push({ model: model ?? "undefined", hidden: document.querySelector<HTMLElement>('[data-popup="' + id + '"]')?.hidden }); }
let common = $derived({ "data-case": id, defaultOpen, modal, openOnHover: hoverEnabled, closeDelay, closeOnEscape: escape, onOpenChange: second ? proposalB : proposalA, onCloseComplete: complete, style: "display:inline-block;margin:16px" } satisfies RootProps);
export function setModel(next: boolean | undefined) { model = next; }
export function options() { escape = !escape; }
export function setModal(value: boolean) { modal = value; }
export function setHover(value: boolean) { hoverEnabled = value; }
export function setDelay(value: number) { closeDelay = value; }
export function replace(part: string) { if (part === "popup") popupKey++; else if (part === "backdrop") backdropKey++; else if (part === "close") closeKey++; else if (part === "trigger") triggerKey++; else if (part === "portal") portalKey++; else if (part === "positioner") positionerKey++; else if (part === "arrow") arrowKey++; else if (part === "viewport") viewportKey++; else if (part === "title") titleKey++; else if (part === "description") descriptionKey++; }
export function placement(nextSide: typeof side, nextAlign: typeof align = "center", offset = 4, collisions = false, strategy: typeof collisionStrategy = "initial-placement") { side = nextSide; align = nextAlign; sideOffset = offset; avoidCollisions = collisions; collisionStrategy = strategy; }
export function setPopup(value: boolean) { showPopup = value; }
export function removeSecondTrigger() { showSecondTrigger = false; }
export function place(value: string | HTMLElement, disabled = false) { container = value; disablePortal = disabled; }
export function replaceOwners() { second = true; forwarded = { [key]: attachment("b") }; }
export function changeClass() { className = "after"; }
export function hide() { shown = false; }
export function connectNested() { showTrigger = true; childShown = true; }
export function cancelNested(value: boolean) { cancelChild = value; }
export function cancelClosing(value: boolean) { cancelParentClose = value; }
export function setOwner(value: boolean) { ownerOpen = value; }
export function snapshot() { return { model: model ?? "undefined", writes: [...writes], callbacks: [...callbacks], completions: [...completions], refs: [...refs], popupRefs: [...popupRefs], attachments: [...attachments], childOpen: childOpen ?? false, childProposals: [...childProposals] }; }
</script>
{#snippet contents()}
${styled ? "<Overlay.Header>" : ""}
{#key titleKey}<Overlay.Title data-title={id}>Popover {id}</Overlay.Title>{/key}
{#key descriptionKey}<Overlay.Description data-description={id}>Details</Overlay.Description>{/key}
${styled ? "</Overlay.Header>" : ""}
<input aria-label="Name" data-input={id} />
{#key closeKey}<Primitive.Close data-close={id}>Close</Primitive.Close>{/key}
{#if childShown}
<Primitive.Root data-child-root={id} bind:open={childOpen} onOpenChange={(next, detail) => { childProposals.push(next); if (cancelChild && !next) detail.cancel(); }}>
 <Primitive.Trigger data-child-trigger={id}>Nested child</Primitive.Trigger>
 <Primitive.Portal><Primitive.Popup data-child-popup={id} style="position:fixed;width:120px;background:white" avoidCollisions={false}><Primitive.Title>Child</Primitive.Title><Primitive.Close data-child-close={id}>Close child</Primitive.Close></Primitive.Popup></Primitive.Portal>
</Primitive.Root>
{/if}
{/snippet}
{#snippet surface()}
${styled ? "" : "{#key backdropKey}<Primitive.Backdrop data-backdrop={id} />{/key}{#key viewportKey}<Primitive.Viewport data-viewport={id}>{#key positionerKey}<Primitive.Positioner data-positioner={id} {side} {align} {sideOffset} {avoidCollisions} {collisionStrategy}>"}
{#if showPopup}{#key popupKey}<Overlay.${popup} {side} {align} {sideOffset} {avoidCollisions} {collisionStrategy} data-popup={id} style="display:flow-root;width:180px;transition:opacity 40ms" ref={second ? popupB : popupA}${styled ? ' portalContainer={typeof container === "string" ? container : undefined} {disablePortal}' : ""}>
 {@render contents()}
 ${styled ? "" : "{#key arrowKey}<Primitive.Arrow data-arrow={id} />{/key}"}
</Overlay.${popup}>{/key}{/if}
${styled ? "" : "</Primitive.Positioner>{/key}</Primitive.Viewport>{/key}"}
{/snippet}
{#snippet parts(accepted: boolean)}
<output data-rendered={id}>{String(accepted)}</output>
{#if showTrigger}{#key triggerKey}<Overlay.Trigger data-trigger={id} {...forwarded} ref={second ? refB : refA} class={className}>{#snippet child({ props, children })}<button {...props}>{@render children?.()}</button>{/snippet}Open {id}</Overlay.Trigger>{/key}{/if}
{#if showSecondTrigger}<Overlay.Trigger data-second-trigger={id} style="margin-left:120px">Second trigger</Overlay.Trigger>{/if}
{#key portalKey}${styled ? "{@render surface()}" : "<Primitive.Portal {container} disabled={disablePortal}>{@render surface()}</Primitive.Portal>"}{/key}
{/snippet}
{#snippet rootContent()}
{#if shown}
{#if mode === "omitted"}<Overlay.Root {...common} children={parts} />
{:else if mode === "plain"}<Overlay.Root {...common} open={model} children={parts} />
{:else if mode === "bound"}<Overlay.Root {...common} bind:open={model} children={parts} />
{:else}<Overlay.Root {...common} bind:open={() => model, publish} children={parts} />{/if}
{/if}
{/snippet}
{#if nativeOwner}
<Dialog.Root bind:open={ownerOpen}><Dialog.Popup data-owner-popup={id}><Dialog.Title>Owner</Dialog.Title>{@render rootContent()}</Dialog.Popup></Dialog.Root>
{:else}{@render rootContent()}{/if}`;
}

function main(actions: string): string {
  return `import { hydrate, unmount, flushSync, tick } from "svelte"; import App from "./App.svelte";
const assert = (value, message) => { if (!value) throw new Error(message); };
try {
const target = document.getElementById("app"), before = [...target.querySelectorAll("[data-sw-part], [data-slot]")];
const app = hydrate(App, { target });
const settle = async () => { flushSync(); await tick(); await new Promise(resolve => setTimeout(resolve, 0)); flushSync(); };
const finish = async () => { for (let index = 0; index < 6; index++) { await new Promise(requestAnimationFrame); await settle(); } };
const wait = async ms => { await new Promise(resolve => setTimeout(resolve, ms)); await settle(); };
await settle(); const cases = app.getCases();
const root = id => document.querySelector('[data-case="' + id + '"]');
const popup = id => document.querySelector('[data-popup="' + id + '"]');
const button = id => document.querySelector('[data-trigger="' + id + '"]');
const trigger = id => button(id)?.click();
const close = id => document.querySelector('[data-close="' + id + '"]')?.click();
const wrapper = id => popup(id)?.closest('[data-sw-popover-portal]');
const state = id => ({ ...cases[id].snapshot(), visible: popup(id) ? !popup(id).hidden : null, rendered: document.querySelector('[data-rendered="' + id + '"]')?.textContent ?? null });
const hover = id => button(id).dispatchEvent(new PointerEvent("pointerenter", {pointerType:"mouse"}));
const leave = id => popup(id).dispatchEvent(new PointerEvent("pointerleave", {pointerType:"mouse"}));
const locked = () => document.body.hasAttribute("data-sw-scroll-locked");
assert(before.every(node => node.isConnected), "Popover hydration replaced owners");
const result = await (async () => { ${actions} })();
const oldCases = {...cases}, staleButtons = Object.keys(cases).map(button).filter(Boolean);
await unmount(app); await finish();
const snapshots = Object.values(oldCases).map(entry => JSON.stringify(entry.snapshot()));
for (const node of staleButtons) { node.click(); node.dispatchEvent(new PointerEvent("pointerenter", {pointerType:"mouse"})); }
await wait(150);
assert(JSON.stringify(snapshots) === JSON.stringify(Object.values(oldCases).map(entry => JSON.stringify(entry.snapshot()))), "Popover stale model or callback write");
assert(document.querySelectorAll("[data-sw-popover], [data-sw-popover-portal], :modal").length === 0, "Popover leaked owners");
assert(!locked(), "Popover leaked scroll lock");
document.documentElement.dataset.popoverResult = JSON.stringify({ ...result, hydrationExact: true, teardown: true });
} catch(error) { document.documentElement.dataset.popoverResult = JSON.stringify({ error: String(error), stack: error.stack }); }`;
}

export async function verifyPopoverOrdinaryModel(consumer: DistConsumer, styled = false) {
  const { build, ...result } = await verifyPopoverBrowser(
    consumer,
    [
      { id: "ordinary", mode: "bound", initial: false },
      { id: "cancel", mode: "bound", initial: false, proposal: "cancel" },
      { id: "hover-bound", mode: "bound", initial: false, modal: true, hover: true },
    ],
    `
trigger("ordinary"); await finish(); assert(state("ordinary").visible && state("ordinary").model === true, "accepted trigger publishes open");
close("ordinary"); await finish(); assert(!state("ordinary").visible && state("ordinary").model === false, "accepted close publishes closed");
cases.ordinary.options(); await finish(); assert(!state("ordinary").visible && state("ordinary").model === false, "closed state survives option recreation");
trigger("cancel"); await finish(); assert(!state("cancel").visible && state("cancel").model === false, "canceled proposal preserves closed");
cases.cancel.setModel(true); await finish(); assert(state("cancel").visible && state("cancel").model === true, "later parent command opens");
cases.cancel.setModel(false); await finish(); assert(!state("cancel").visible && state("cancel").model === false, "later parent command closes");
cases["hover-bound"].placement("right", "start", 20); await finish(); hover("hover-bound"); await finish();
let hoverBox = popup("hover-bound").getBoundingClientRect(), hoverAnchor = button("hover-bound").getBoundingClientRect();
assert(state("hover-bound").visible && state("hover-bound").model === true && !locked(), "accepted bound hover keeps hover reason after model flush");
assert(Math.abs(hoverBox.left - hoverAnchor.right - 20) < 2 && button("hover-bound").getAttribute("aria-expanded") === "true", "accepted bound hover uses active trigger geometry");
cases["hover-bound"].options(); await finish(); hoverBox = popup("hover-bound").getBoundingClientRect(); hoverAnchor = button("hover-bound").getBoundingClientRect();
assert(state("hover-bound").visible && locked(), "option recreation uses peer imperative modal reason");
assert(Math.abs(hoverBox.left - hoverAnchor.right - 20) < 2 && button("hover-bound").getAttribute("aria-expanded") === "true", "option recreation retains trigger geometry");
return { ordinaryModel: true };
`,
    styled,
  );
  return { result, build };
}

export async function verifyPopoverOwnerOrdinary(consumer: DistConsumer, styled = false) {
  const { build, ...result } = await verifyPopoverBrowser(
    consumer,
    [
      { id: "floating", mode: "bound", initial: false },
      { id: "multiple-triggers", mode: "bound", initial: false },
      { id: "hover", mode: "bound", initial: false, modal: true, hover: true },
    ],
    `
trigger("floating"); await finish(); assert(state("floating").visible && document.activeElement === document.querySelector('[data-input="floating"]'), "custom button trigger opens and moves focus");
const stableWrapper = wrapper("floating"); assert(stableWrapper.parentElement.id === "portal-a", "initial portal target");
cases.floating.place("#portal-b"); await finish(); assert(wrapper("floating") === stableWrapper && stableWrapper.parentElement.id === "portal-b" && state("floating").visible, "portal retarget retains open wrapper");
close("floating"); await finish(); assert(!state("floating").visible && document.activeElement === button("floating"), "close returns focus to custom button trigger");
const second = document.querySelector('[data-second-trigger="multiple-triggers"]'); cases["multiple-triggers"].placement("bottom", "start", 18); await finish(); second.click(); await finish();
let box = popup("multiple-triggers").getBoundingClientRect(), anchor = second.getBoundingClientRect();
assert(state("multiple-triggers").visible && Math.abs(box.top - anchor.bottom - 18) < 2 && second.getAttribute("aria-expanded") === "true", "ordinary second trigger owns geometry and ARIA");
close("multiple-triggers"); await finish(); assert(document.activeElement === second, "secondary trigger receives focus return");
hover("hover"); await finish(); assert(state("hover").visible && state("hover").model === true && !locked(), "ordinary bound hover opens without modal lock");
return { ownerOrdinary: true };
`,
    styled,
  );
  return { result, build };
}
