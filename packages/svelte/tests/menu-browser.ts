import assert from "node:assert/strict";
import { once } from "node:events";
import { readFile } from "node:fs/promises";
import { createServer } from "node:http";
import { chromium } from "playwright";
import { createBrowserBuildScript } from "./compatibility-hydration.js";
import type { DistConsumer } from "./dist-consumer.js";

export type MenuCase = {
  id: string;
  mode?: "omitted" | "plain" | "bound" | "function";
  open?: boolean;
  checked?: boolean;
  value?: string;
  defaultOpen?: boolean;
  defaultChecked?: boolean;
  defaultValue?: string;
  checkedRadio?: boolean;
  proposal?: string;
  setter?: string;
  modal?: boolean;
  hover?: boolean;
  missing?: boolean;
};

export const menuLifecycleCases: MenuCase[] = [
  ...(["omitted", "plain", "bound", "function"] as const).map((mode) => ({
    id: mode,
    mode,
    defaultOpen: true,
    defaultChecked: true,
    defaultValue: "beta",
  })),
  {
    id: "defined",
    open: false,
    checked: false,
    value: "",
    defaultOpen: true,
    defaultChecked: true,
    defaultValue: "beta",
  },
  { id: "seed", checkedRadio: true },
  { id: "empty" },
  { id: "group-precedence", value: "beta", checkedRadio: true },
  ...["cancel", "command-cancel", "unmount"].map((proposal) => ({
    id: proposal,
    proposal,
    open: false,
    checked: false,
    value: "alpha",
  })),
  ...["retain", "transform"].map((setter) => ({
    id: setter,
    setter,
    open: false,
    checked: false,
    value: "alpha",
  })),
  ...["dom", "lifecycle", "nested", "pending", "disabled", "links", "keyboard"].map((id) => ({
    id,
    open: false,
    checked: false,
    value: "alpha",
  })),
  { id: "missing", open: true, missing: true },
  { id: "hover", open: false, modal: true, hover: true },
];

/** Exercise compiled distribution consumers; Svelte owns the props and Runtime owns all interaction. */
export async function verifyMenuBrowser(
  consumer: DistConsumer,
  configs: MenuCase[],
  actions: string,
  styled = false,
  contextMenu = false,
) {
  await consumer.write({
    "Case.svelte": menuCaseSource(styled, contextMenu),
    "ForwardButton.svelte": `<script lang="ts">import type { ButtonChildPayload } from "@starwind-ui/svelte/menu"; let { props, children }: ButtonChildPayload = $props();</script><button {...props}>{@render children?.()}</button>`,
    "App.svelte": `<script lang="ts">import Case from "./Case.svelte"; const configs = ${JSON.stringify(configs)}; const cases: Record<string, any> = {}; export function getCases() { return cases; }</script>{#each configs as config (config.id)}<Case {...config} bind:this={cases[config.id]} />{/each}`,
    "hydrate-main.js": main(actions, contextMenu),
    "build-browser.mjs": createBrowserBuildScript(true),
    "ssr.mjs":
      'import { render } from "svelte/server"; import App from "./App.svelte"; console.log(JSON.stringify({body: render(App).body}));',
  });
  const first = JSON.parse(await consumer.run("ssr.mjs", { loader: true }));
  const second = JSON.parse(await consumer.run("ssr.mjs", { loader: true }));
  assert.equal(first.body, second.body, "Menu SSR is deterministic and request-local");
  const build = JSON.parse(await consumer.run("build-browser.mjs"));
  const javascript = await readFile(`${consumer.root}/browser.js`);
  const server = createServer((request, response) => {
    if (request.url === "/browser.js") {
      response.setHeader("Content-Type", "text/javascript");
      response.end(javascript);
    } else {
      response.setHeader("Content-Type", "text/html");
      response.end(
        `<link rel="icon" href="data:,"><style>[data-sw-menu-popup]{background:white;padding:8px;min-width:140px;transition:opacity 70ms;}[data-sw-menu-popup][data-state=closed]{opacity:0}[data-sw-menu-popup][data-state=open]{opacity:1}[data-sw-menu-trigger]{margin:8px} [data-sw-menu-item],[data-sw-menu-radio-item],[data-sw-menu-checkbox-item],[data-sw-menu-submenu-trigger]{padding:4px}</style><button id="outside">Outside</button><div id="app">${first.body}</div><div id="portal-a"></div><div id="portal-b"></div><script type="module" src="/browser.js"></script>`,
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
    await page.waitForFunction(() => document.documentElement.dataset.menuResult, undefined, {
      timeout: 30_000,
    });
    const result = await page.evaluate(() =>
      JSON.parse(document.documentElement.dataset.menuResult!),
    );
    assert.deepEqual(errors, [], result.stack ?? result.error);
    assert.equal(result.error, undefined, result.stack ?? result.error);
    return { ...result, build };
  } finally {
    await browser?.close();
    await new Promise<void>((resolve, reject) =>
      server.close((error) => (error ? reject(error) : resolve())),
    );
  }
}

export function menuCaseSource(styled: boolean, contextMenu = false): string {
  const triggerElement = contextMenu ? "HTMLDivElement" : "HTMLButtonElement";
  const primitive = contextMenu ? "context-menu" : "menu";
  const link = contextMenu && styled ? "Primitive.LinkItem" : "Menu.LinkItem";
  const content = (body: string, sub = false) =>
    styled
      ? `<Menu.${sub ? "SubContent" : "Content"} portalContainer={container} {disablePortal} side={${sub ? '"right"' : "side"}} align=${contextMenu && !sub ? "{align}" : '"start"'} sideOffset={${sub ? "4" : "offset"}} avoidCollisions={false} data-popup={${sub ? 'id + "-sub"' : "id"}} ref={popupRef}>${body}</Menu.${sub ? "SubContent" : "Content"}>`
      : `<Primitive.Portal {container} disabled={disablePortal}><Primitive.Positioner side={${sub ? '"right"' : "side"}} align=${contextMenu && !sub ? "{align}" : '"start"'} sideOffset={${sub ? "4" : "offset"}} avoidCollisions={false}><Primitive.Popup data-popup={${sub ? 'id + "-sub"' : "id"}} ref={popupRef}>${body}</Primitive.Popup></Primitive.Positioner></Primitive.Portal>`;
  const items = `
<Menu.Group><Menu.Label>Actions</Menu.Label>
{#key keys.item}<Menu.Item data-item={id + "-alpha"} closeOnClick={false}>${contextMenu ? "{itemLabel}" : "Alpha"}<Menu.Shortcut>⌘A</Menu.Shortcut></Menu.Item>{/key}
<Menu.Item data-item={id + "-disabled"} disabled>Disabled</Menu.Item><Menu.Item data-item={id + "-beta"} closeOnClick={false}>Beta</Menu.Item>
<${link} href="#menu-link" data-item={id + "-link"} closeOnClick={linkClose}>Link</${link}><${link} href="#disabled-link" disabled data-item={id + "-disabled-link"}>Disabled link</${link}>
<Menu.Item data-item={id + "-close"}>Close</Menu.Item>${contextMenu ? "{#if extraItem}<Menu.Item data-extra-item={id} closeOnClick={false}>Conditional action</Menu.Item>{/if}" : ""}</Menu.Group><Menu.Separator />
{#key keys.checkbox}
 {#if mode === "function"}<Menu.CheckboxItem bind:checked={getChecked, putChecked} {defaultChecked} data-check={id} onCheckedChange={checkedProposal} ${styled ? "showIndicator={false}" : ""}>{@render checkContent()}</Menu.CheckboxItem>
 {:else if mode === "bound"}<Menu.CheckboxItem bind:checked={checkedModel} {defaultChecked} data-check={id} onCheckedChange={checkedProposal} ${styled ? "showIndicator={false}" : ""}>{@render checkContent()}</Menu.CheckboxItem>
 {:else}<Menu.CheckboxItem {...(mode === "plain" ? { checked: checkedModel } : {})} {defaultChecked} data-check={id} onCheckedChange={checkedProposal} ${styled ? "showIndicator={false}" : ""}>{@render checkContent()}</Menu.CheckboxItem>{/if}
{/key}
{#key keys.group}
 {#if mode === "function"}<Menu.RadioGroup bind:value={getValue, putValue} {defaultValue} data-group={id} onValueChange={valueProposal}>{@render radioContent()}</Menu.RadioGroup>
 {:else if mode === "bound"}<Menu.RadioGroup bind:value={valueModel} {defaultValue} data-group={id} onValueChange={valueProposal}>{@render radioContent()}</Menu.RadioGroup>
 {:else}<Menu.RadioGroup {...(mode === "plain" ? { value: valueModel } : {})} {defaultValue} data-group={id} onValueChange={valueProposal}>{@render radioContent()}</Menu.RadioGroup>{/if}
{/key}
{#if showSub}{#key keys.sub}<Menu.${styled ? "Sub" : "SubmenuRoot"} closeDelay={delay} data-subroot={id}>
 {#key keys.subtrigger}<Menu.${styled ? "SubTrigger" : "SubmenuTrigger"} data-subtrigger={id} disabled={subDisabled}>More</Menu.${styled ? "SubTrigger" : "SubmenuTrigger"}>{/key}
 {#key keys.subpopup}${content('<Menu.Item data-item={id + "-nested"} closeOnClick={false}>Nested</Menu.Item><Menu.CheckboxItem data-check={id + "-sub"}>Sub check</Menu.CheckboxItem><Menu.Item data-item={id + "-sub-close"}>Close submenu tree</Menu.Item>', true)}{/key}
</Menu.${styled ? "Sub" : "SubmenuRoot"}>{/key}{/if}`;
  return `<script lang="ts">
import { flushSync, untrack } from "svelte";
import { createAttachmentKey, type Attachment } from "svelte/attachments";
import Primitive, { ${contextMenu ? "type ContextMenuOpenChangeDetails as MenuOpenChangeDetails" : "type ButtonChildPayload, type MenuOpenChangeDetails"}, type MenuCheckedChangeDetails, type MenuValueChangeDetails } from "@starwind-ui/svelte/${primitive}";
import Button from "@starwind-ui/svelte/button";
import Dialog from "@starwind-ui/svelte/dialog";
import ForwardButton from "./ForwardButton.svelte";
${styled ? `import Menu from "./${contextMenu ? "context-menu" : "dropdown"}/index.js";` : "const Menu = Primitive;"}
let { id, mode = "function", open, checked, value, defaultOpen, defaultChecked, defaultValue, checkedRadio = false, proposal = "accept", setter = "identity", modal: initialModal = false, hover = false, missing = false }: { id: string; mode?: string; open?: boolean; checked?: boolean; value?: string; defaultOpen?: boolean; defaultChecked?: boolean; defaultValue?: string; checkedRadio?: boolean; proposal?: string; setter?: string; modal?: boolean; hover?: boolean; missing?: boolean } = $props();
let openModel = $state(untrack(() => open)), checkedModel = $state(untrack(() => checked)), valueModel = $state(untrack(() => value));
let shown = $state(true), showPopup = $state(!untrack(() => missing)), showTrigger = $state(true), showSub = $state(true);
let keys = $state({ root:0, trigger:0, popup:0, item:0, checkbox:0, indicator:0, group:0, radio:0, sub:0, subtrigger:0, subpopup:0 });
let modal = $state(untrack(() => initialModal)), disabled = $state(false), triggerDisabled = $state(false), subDisabled = $state(false), openOnHover = $state(untrack(() => hover)), delay = $state(120), linkClose = $state(false);
let container = $state<string | HTMLElement>("#portal-a"), disablePortal = $state(false), side = $state<"bottom" | "right">("bottom"), offset = $state(4);
let secondRef = $state(false), className = $state("before"), refRead = $state(0), aRead = $state(0), bRead = $state(0), childMode = $state("direct"), nativeOwner = $state(false), dialogOpen = $state<boolean | undefined>(false);
${
  contextMenu
    ? `let parentRevision = $state(0), itemLabel = $state("Alpha"), extraItem = $state(false), align = $state<"start" | "end">("start");
export function changeParent() { parentRevision++; }
export function setItemLabel(next: string) { itemLabel = next; }
export function setExtraItem(next: boolean) { extraItem = next; }
export function setSide(next: "bottom" | "right") { side = next; }
export function setAlign(next: "start" | "end") { align = next; }
export function setOffset(next: number) { offset = next; }`
    : ""
}
const writes: { kind:string; next:boolean | string | undefined }[] = [], callbacks: { kind:string; reason?: string; next:boolean | string; previous:boolean | string | undefined }[] = [], refs: string[] = [], attachments: string[] = [], popupRefs: string[] = [], completions: boolean[] = [];
const keyA = createAttachmentKey(), keyB = createAttachmentKey();
const attachA: Attachment<${triggerElement}> = () => { attachments.push("a:" + aRead); return () => { attachments.push("a:cleanup"); }; };
const attachB: Attachment<${triggerElement}> = () => { attachments.push("b:" + bRead); return () => { attachments.push("b:cleanup"); }; };
let forwarded = $state.raw({ [keyA]: attachA, [keyB]: attachB });
const refA = (node: ${triggerElement} | null) => { refs.push("a:" + (node?.tagName ?? "null") + ":" + refRead); };
const refB = (node: ${triggerElement} | null) => { refs.push("b:" + (node?.tagName ?? "null") + ":" + refRead); };
const popupRef = (node: HTMLDivElement | null) => { popupRefs.push(node ? "DIV" : "null"); };
${contextMenu ? "" : "function uncheckedChild(payload: ButtonChildPayload) { return payload.props as Record<string, unknown>; }"}
function getOpen() { return openModel; } function getChecked() { return checkedModel; } function getValue() { return valueModel; }
function putOpen(next: boolean | undefined) { writes.push({kind:"open",next}); if (setter !== "retain") openModel = setter === "transform" ? false : next; }
function putChecked(next: boolean | undefined) { writes.push({kind:"checked",next}); if (setter !== "retain") checkedModel = setter === "transform" ? false : next; }
function putValue(next: string | undefined) { writes.push({kind:"value",next}); if (setter !== "retain") valueModel = setter === "transform" ? "alpha" : next; }
function command(kind: string, next: boolean | string | undefined) { if (kind === "open") openModel = next as boolean | undefined; else if (kind === "checked") checkedModel = next as boolean | undefined; else valueModel = next as string | undefined; }
let proposalKind = "all", cancelClosing = false;
function handle(kind: string, next: boolean | string, detail: MenuOpenChangeDetails | MenuCheckedChangeDetails | MenuValueChangeDetails) {
 callbacks.push({kind,next,reason: detail.reason,previous: kind === "open" ? openModel : kind === "checked" ? checkedModel : valueModel});
 if (kind === "open" && next === false && cancelClosing) detail.cancel();
 if (proposalKind !== "all" && proposalKind !== kind) return;
 if (proposal === "cancel") detail.cancel();
 if (proposal === "command-cancel") { detail.cancel(); command(kind, kind === "value" ? "command" : true); }
 if (proposal === "unmount") { shown = false; flushSync(); }
}
const openProposal = (next: boolean, detail: MenuOpenChangeDetails) => handle("open",next,detail);
const checkedProposal = (next: boolean, detail: MenuCheckedChangeDetails) => handle("checked",next,detail);
const valueProposal = (next: string, detail: MenuValueChangeDetails) => handle("value",next,detail);
export function setModel(kind: string, next: boolean | string | undefined) { command(kind,next); }
export function cancelClose(next: boolean) { cancelClosing = next; }
export function only(kind: string) { proposalKind = kind; }
export function replace(part: keyof typeof keys) { keys[part]++; }
export function place(next: string | HTMLElement, off = false) { container = next; disablePortal = off; }
export function placement() { side = side === "bottom" ? "right" : "bottom"; offset = 18; }
export function options() { modal = !modal; delay += 20; }
export function setModal(next: boolean) { modal = next; }
export function setDisabled(next: boolean) { disabled = next; }
export function setTriggerDisabled(next: boolean) { triggerDisabled = next; }
export function setSubDisabled(next: boolean) { subDisabled = next; }
export function setPopup(next: boolean) { showPopup = next; }
export function setTrigger(next: boolean) { showTrigger = next; }
export function setSub(next: boolean) { showSub = next; }
export function setLinkClose(next: boolean) { linkClose = next; }
export function setDelay(next: number) { delay = next; }
export function changeClass() { className = className === "before" ? "after" : "before"; }
export function changeRef() { secondRef = !secondRef; }
export function readRef() { refRead++; }
export function readAttachment(kind: string) { if (kind === "a") aRead++; else bRead++; }
export function removeAttachment() { forwarded = { [keyA]: attachA }; }
export function addAttachment() { forwarded = { [keyA]: attachA, [keyB]: attachB }; }
export function compose(next: string) { childMode = next; }
export function hide() { shown = false; }
export function show() { shown = true; }
export function owner(next: boolean) { nativeOwner = true; dialogOpen = next; }
export function snapshot() { return { open:openModel, checked:checkedModel, value:valueModel, writes:[...writes], callbacks:[...callbacks], refs:[...refs], attachments:[...attachments], popupRefs:[...popupRefs], completions:[...completions], trigger:{ref:secondRef ? "b" : "a",className,refRead,aRead,bRead} }; }
</script>
{#snippet checkContent()}Check{#key keys.indicator}<Menu.CheckboxItemIndicator data-indicator={id}>✓</Menu.CheckboxItemIndicator>{/key}{/snippet}
{#snippet radioContent()}
 {#key keys.radio}<Menu.RadioItem value="alpha" checked={checkedRadio} data-radio={id + "-alpha"} ${styled ? "showIndicator={false}" : ""}>Alpha radio<Menu.RadioItemIndicator data-radio-indicator={id + "-alpha"}>●</Menu.RadioItemIndicator></Menu.RadioItem>{/key}
 <Menu.RadioItem value="beta" data-radio={id + "-beta"} ${styled ? "showIndicator={false}" : ""}>Beta radio<Menu.RadioItemIndicator data-radio-indicator={id + "-beta"}>●</Menu.RadioItemIndicator></Menu.RadioItem>
 <Menu.RadioGroup defaultValue="inner" data-inner-group={id}><Menu.RadioItem value="inner" data-inner-radio={id}>Inner</Menu.RadioItem><Menu.RadioItem value="other" data-inner-other={id}>Other</Menu.RadioItem></Menu.RadioGroup>
{/snippet}
${contextMenu ? "" : `{#snippet child(payload: ButtonChildPayload)}{#if childMode === "wrong"}<div {...uncheckedChild(payload)}>Wrong owner</div>{:else if childMode === "missing"}<span>Missing owner</span>{:else if childMode === "multiple"}<button {...payload.props}>First owner</button><button {...payload.props}>Second owner</button>{:else if childMode === "component"}<ForwardButton {...payload}/>{:else if childMode === "primitive"}<Button.Root {...payload.props}>{@render payload.children?.()}</Button.Root>{:else}<button {...payload.props}>{@render payload.children?.()}</button>{/if}{/snippet}`}
{#snippet anatomy(accepted: boolean)}
 <output data-rendered={id}>{String(accepted)}</output>
 {#if showTrigger}{#key keys.trigger}<Menu.Trigger ${contextMenu ? "disabled={triggerDisabled}" : "{child}"} data-trigger={id} class={className} title="Menu trigger" ref={secondRef ? refB : refA} {...forwarded}>Open {id}</Menu.Trigger>{/key}{/if}
 {#if showPopup}{#key keys.popup}${content(items)}{/key}{/if}
{/snippet}
{#snippet menuTree()}
 {#if shown}{#key keys.root}
 {#if mode === "function"}<Menu.Root bind:open={getOpen,putOpen} {defaultOpen} {disabled} {modal} ${contextMenu ? "" : "{openOnHover}"} closeDelay={delay} data-case={id} onOpenChange={openProposal} onCloseComplete={() => { completions.push(openModel ?? false); }} children={anatomy}/>
 {:else if mode === "bound"}<Menu.Root bind:open={openModel} {defaultOpen} {disabled} {modal} ${contextMenu ? "" : "{openOnHover}"} closeDelay={delay} data-case={id} onOpenChange={openProposal} onCloseComplete={() => { completions.push(openModel ?? false); }} children={anatomy}/>
 {:else}<Menu.Root {...(mode === "plain" ? {open:openModel} : {})} {defaultOpen} {disabled} {modal} ${contextMenu ? "" : "{openOnHover}"} closeDelay={delay} data-case={id} onOpenChange={openProposal} onCloseComplete={() => { completions.push(openModel ?? false); }} children={anatomy}/>{/if}
 {/key}{/if}
{/snippet}
${contextMenu ? "<output data-parent-revision={id}>{parentRevision}</output>" : ""}
{#if nativeOwner}<Dialog.Root bind:open={dialogOpen}><Dialog.Popup data-dialog={id}><Dialog.Title>Owner</Dialog.Title><Dialog.Description>Nested menu</Dialog.Description>{@render menuTree()}<Dialog.Close>Close owner</Dialog.Close></Dialog.Popup></Dialog.Root>{:else}{@render menuTree()}{/if}`;
}

function main(actions: string, contextMenu = false): string {
  return `import { hydrate, unmount, flushSync, tick } from "svelte"; import App from "./App.svelte";
const assert = (value,message) => { if (!value) throw new Error(message); };
try {
const target = document.getElementById("app"), before = [...target.querySelectorAll("[data-sw-part], [data-slot]")];
const app = hydrate(App,{target});
const settle = async () => { flushSync(); await tick(); await new Promise(resolve => setTimeout(resolve,0)); flushSync(); };
const wait = async ms => { await new Promise(resolve => setTimeout(resolve,ms)); await settle(); };
const finish = async () => { for(let i=0;i<6;i++) { await new Promise(requestAnimationFrame); await settle(); } };
await finish(); const cases = app.getCases();
const query = (attr,id) => document.querySelector('['+attr+'="'+id+'"]');
const root = id => query("data-case",id), popup = id => query("data-popup",id), button = id => query("data-trigger",id), checkbox = id => query("data-check",id), group = id => query("data-group",id), radio = (id,value) => query("data-radio",id+"-"+value), item = (id,value) => query("data-item",id+"-"+value);
const state = id => ({ ...cases[id].snapshot(), visible: popup(id) ? !popup(id).hidden : null, rendered: query("data-rendered",id)?.textContent });
const wrapper = id => popup(id)?.closest("[data-sw-menu-portal]");
const key = (element,key,options={}) => element.dispatchEvent(new KeyboardEvent("keydown",{key,bubbles:true,cancelable:true,...options}));
const activateTrigger = element => ${contextMenu ? 'key(element,"ContextMenu")' : "element.click()"};
const contextPoint = (element,x,y) => element.dispatchEvent(new MouseEvent("contextmenu",{bubbles:true,cancelable:true,clientX:x,clientY:y,button:2}));
const contextAnchor = (x,y) => [...document.querySelectorAll("[data-sw-context-menu-anchor]")].find(node=>Math.abs(node.getBoundingClientRect().left-x)<1 && Math.abs(node.getBoundingClientRect().top-y)<1);
const pointer = (element,type) => element.dispatchEvent(new PointerEvent(type,{pointerType:"mouse",bubbles:type === "pointermove" || type === "pointerdown",cancelable:true}));
const locked = () => document.body.hasAttribute("data-sw-scroll-locked");
const openCase = async id => { cases[id].only("none"); cases[id].setModel("open",true); await finish(); };
assert(before.every(node => node.isConnected), "Menu hydration retained every authored owner");
const result = await (async () => { ${actions} })();
const retained = {...cases}, stale = [...document.querySelectorAll("[data-sw-menu-trigger], [data-sw-menu-item], [data-sw-menu-submenu-trigger]")];
await unmount(app); await finish();
const snapshots = Object.values(retained).map(entry => JSON.stringify(entry.snapshot()));
for(const node of stale) { node.click(); pointer(node,"pointerenter"); key(node,"ArrowDown"); ${contextMenu ? 'key(node,"ContextMenu");' : ""} }
await wait(${contextMenu ? "550" : "200"});
assert(JSON.stringify(snapshots) === JSON.stringify(Object.values(retained).map(entry => JSON.stringify(entry.snapshot()))), "teardown discards delayed proposals and binding publication");
assert(document.querySelectorAll("[data-sw-menu], [data-sw-menu-portal], :modal").length === 0, "teardown releases Menu and portal owners");
assert(!locked(), "teardown releases modal locks");
${contextMenu ? 'assert(document.querySelectorAll("[data-sw-context-menu-anchor]").length === 0, "teardown releases every Runtime anchor and pending long press");' : ""}
document.documentElement.dataset.menuResult=JSON.stringify({...result,hydrationExact:true,teardown:true});
} catch(error) { document.documentElement.dataset.menuResult=JSON.stringify({error:String(error),stack:error.stack}); }`;
}

export async function verifyMenuLifecycle(consumer: DistConsumer, styled = false) {
  const { build, ...result } = await verifyMenuBrowser(
    consumer,
    menuLifecycleCases,
    menuModelActions + menuLifecycleActions(styled),
    styled,
  );
  return { result, build };
}

/** Styled wrappers own binding forwarding and automatic portal/indicator composition. */
export async function verifyStyledMenuComposition(consumer: DistConsumer, contextMenu = false) {
  const { build, ...result } = await verifyMenuBrowser(
    consumer,
    [
      { id: "main", mode: "bound", open: false, checked: false, value: "alpha" },
      {
        id: "cancel",
        mode: "function",
        proposal: "cancel",
        open: false,
        checked: false,
        value: "alpha",
      },
    ],
    `
activateTrigger(button("main")); await finish();
assert(state("main").open === true && state("main").visible, "Styled Root publishes accepted opening");
checkbox("main").click(); await settle();
assert(state("main").checked === true && query("data-indicator","main").hasAttribute("data-visible"), "Styled CheckboxItem forwards binding and indicator");
radio("main","beta").click(); await settle();
assert(state("main").value === "beta", "Styled RadioGroup publishes accepted value");
cases.main.place("#portal-b"); await finish();
assert(wrapper("main").parentElement.id === "portal-b", "Content forwards its portal target");
const retired = popup("main"); cases.main.replace("popup"); await finish();
assert(popup("main") !== retired && state("main").open === true, "Content replacement keeps accepted Root state");
key(query("data-subtrigger","main"),"ArrowRight"); await finish();
assert(!popup("main-sub").hidden, "Styled Sub composes an owned submenu");
cases.main.setModel("open",false); await finish();
activateTrigger(button("cancel")); await finish();
assert(!state("cancel").visible && state("cancel").writes.length === 0, "Styled Root forwards cancellation");
cases.main.hide(); await finish();
assert(state("main").popupRefs.at(-1) === "null", "Content releases its ref");
return { composition: true };
`,
    true,
    contextMenu,
  );
  return { result, build };
}

export const menuModelActions = `
for(const id of ["function","bound","plain","omitted"]) {
 assert(state(id).visible && state(id).rendered === "true", id+" root default");
 assert(checkbox(id).getAttribute("aria-checked") === "true",id+" checked default");
 assert(group(id).dataset.value === "beta",id+" value default");
}
assert(!state("defined").visible && checkbox("defined").getAttribute("aria-checked") === "false" && group("defined").dataset.value === "", "defined false and empty string precede defaults");
assert(state("defined").writes.length === 0,"defined values produce no startup write");
assert(state("seed").value === undefined && radio("seed","alpha").getAttribute("aria-checked") === "true", "checked child renders before first bound publication");
assert(state("empty").value === undefined && !group("empty").hasAttribute("data-value"),"unselected group remains undefined");
assert(group("group-precedence").dataset.value === "beta" && radio("group-precedence","alpha").getAttribute("aria-checked") === "false","defined group precedes checked child");
for(const id of ["function","bound","plain","omitted"]) {
 checkbox(id).click(); await settle(); assert(checkbox(id).getAttribute("aria-checked") === "false",id+" accepted checkbox interaction");
 radio(id,"alpha").click(); await settle(); assert(group(id).dataset.value === "alpha",id+" accepted group interaction");
 assert(query("data-inner-group",id).dataset.value === "inner" && query("data-inner-radio",id).getAttribute("aria-checked") === "true",id+" nested group owns its projection");
 item(id,"close").click(); await finish(); assert(!state(id).visible && state(id).rendered === "false",id+" accepted close");
 if(id !== "omitted") {
  cases[id].setModel("open",true); cases[id].setModel("checked",true); cases[id].setModel("value","beta"); await finish();
  assert(state(id).visible && checkbox(id).getAttribute("aria-checked") === "true" && group(id).dataset.value === "beta",id+" later ordinary commands");
  for(const kind of ["open","checked","value"]) cases[id].setModel(kind,undefined); await settle();
  assert(state(id).visible && checkbox(id).getAttribute("aria-checked") === "true" && group(id).dataset.value === "beta",id+" later undefined retains accepted values");
  cases[id].setModel("open",false); await finish();
 }
}
for(const kind of ["open","checked","value"]) {
 for(const id of ["cancel","command-cancel"]) {
  await openCase(id); cases[id].setModel("checked",false); cases[id].setModel("value","alpha");
  if(kind === "open") { cases[id].setModel("open",false); await finish(); }
  cases[id].only(kind); const before=state(id); const writes=before.writes.filter(write=>write.kind === kind).length;
  if(kind === "open") activateTrigger(button(id)); else if(kind === "checked") checkbox(id).click(); else radio(id,"beta").click();
  await finish(); const current=state(id);
  const expected = id === "command-cancel" || id === "command-accept" ? (kind === "value" ? "command" : true) : id === "two-commands" ? (kind === "value" ? "last" : false) : (kind === "value" ? "alpha" : false);
  const actual = kind === "open" ? current.visible : kind === "checked" ? checkbox(id).getAttribute("aria-checked") === "true" : group(id).dataset.value;
  assert(actual === expected,id+" "+kind+" cancellation/command/readback "+JSON.stringify({actual,expected,current}));
  const added=current.writes.filter(write=>write.kind === kind).length-writes;
  assert(added === (id === "retain" || id === "transform" ? 1 : 0),id+" "+kind+" writes once after acceptance");
  assert(current.callbacks.at(-1).previous === (kind === "value" ? "alpha" : false),id+" "+kind+" callback sees accepted model");
  cases[id].only("none"); cases[id].setModel("open",false); await finish();
 }
 await openCase("dom"); cases.dom.setModel("checked",false); cases.dom.setModel("value","alpha"); if(kind === "open") cases.dom.setModel("open",false); await finish();
 const target = kind === "open" ? root("dom") : kind === "checked" ? checkbox("dom") : group("dom");
 const event = kind === "open" ? "starwind:open-change" : kind === "checked" ? "starwind:checked-change" : "starwind:value-change";
 const activate=()=>kind === "open" ? activateTrigger(button("dom")) : kind === "checked" ? checkbox("dom").click() : radio("dom","beta").click();
 target.addEventListener(event,e=>e.preventDefault(),{once:true}); const writes=state("dom").writes.length; activate(); await finish();
 assert(state("dom")[kind] === (kind === "value" ? "alpha" : false) && state("dom").writes.length === writes,kind+" later DOM cancellation preserves binding");
 target.addEventListener(event,e=>{e.preventDefault();cases.dom.setModel(kind,kind === "value" ? "newer" : true);},{once:true}); activate(); await finish();
 assert(state("dom")[kind] === (kind === "value" ? "newer" : true),kind+" DOM cancellation preserves newer parent command");
 cases.dom.setModel("open",false); await finish();
 await openCase("unmount"); cases.unmount.only(kind); if(kind === "open") {cases.unmount.setModel("open",false);await finish();}
 const snapshot=state("unmount").writes.length;
 if(kind === "open") activateTrigger(button("unmount")); else if(kind === "checked") checkbox("unmount").click(); else radio("unmount","beta").click();
 await finish();assert(state("unmount").visible === null && state("unmount").writes.length === snapshot,kind+" unmount discards stale work");cases.unmount.only("none");cases.unmount.show();await finish();
}
`;

export function menuLifecycleActions(
  styled: boolean,
  contextMenu = false,
  contextActions = "",
): string {
  const triggerTag = contextMenu ? "DIV" : "BUTTON";
  return `
const id="lifecycle"; await openCase(id);
checkbox(id).click(); radio(id,"beta").click(); await settle();
assert(checkbox(id).hasAttribute("data-checked") && !checkbox(id).hasAttribute("data-unchecked") && query("data-indicator",id).dataset.state === "checked" && query("data-indicator",id).hasAttribute("data-visible") && !query("data-indicator",id).hasAttribute("data-hidden"),"accepted checkbox projection includes indicator state and visibility");
assert(radio(id,"beta").hasAttribute("data-checked") && query("data-radio-indicator",id+"-beta").dataset.state === "checked","accepted radio indicator projection");
for(const mode of ${contextMenu ? '["direct"]' : '["direct","component","primitive"]'}) {
 cases[id].compose(mode); await finish();
 assert(button(id).tagName === "${triggerTag}" && button(id).title === "Menu trigger" && root(id).querySelectorAll("[data-trigger]").length === 1,"typed child forwards one semantic button through "+mode);
 const stablePopup=popup(id), stableButton=button(id), initial=state(id);
 const activeAttachment=(snapshot,name)=>snapshot.attachments.filter(value=>value.startsWith(name+":")&&!value.endsWith(":cleanup")).length-snapshot.attachments.filter(value=>value===name+":cleanup").length;
 cases[id].changeClass(); cases[id].readRef(); await settle();
 const changed=state(id);
 assert(changed.trigger.className !== initial.trigger.className && changed.trigger.refRead === initial.trigger.refRead+1 && button(id).classList.contains(changed.trigger.className),mode+" ordinary props and ref reads change on each repetition");
 assert(popup(id) === stablePopup && button(id) === stableButton && activeAttachment(changed,"a")===1 && activeAttachment(changed,"b")===1,mode+" ordinary prop update keeps current owners active");
 cases[id].changeRef(); await settle();
 const replacedRef=state(id);
 assert(replacedRef.trigger.ref !== changed.trigger.ref && button(id) === stableButton && replacedRef.refs.at(-1).includes("${triggerTag}") && activeAttachment(replacedRef,"a")===1 && activeAttachment(replacedRef,"b")===1,mode+" replacement callback receives the current semantic owner");
 const attachmentStart=state(id); cases[id].readAttachment("a"); await settle();
 assert(activeAttachment(state(id),"a")===1&&activeAttachment(state(id),"b")===1,mode+" reactive attachment update keeps both current owners active");
 const removed=state(id).attachments.length; cases[id].removeAttachment(); await settle();
 assert(activeAttachment(state(id),"a")===1&&activeAttachment(state(id),"b")===0,mode+" removing a symbol keeps the remaining attachment active");
 const added=state(id); cases[id].addAttachment(); await settle();
 assert(activeAttachment(state(id),"a")===1&&activeAttachment(state(id),"b")===1,mode+" adding a symbol attaches both current owners");
 const beforeOwner=state(id); cases[id].replace("trigger"); await finish();
 const afterOwner=state(id), ownerAttachments=afterOwner.attachments.slice(beforeOwner.attachments.length);
 assert(!stableButton.isConnected && button(id) !== stableButton && popup(id) === stablePopup && afterOwner.visible && afterOwner.checked === true && afterOwner.value === "beta",mode+" keyed trigger replacement preserves popup and accepted models");
 assert(afterOwner.refs.at(-1).includes("${triggerTag}")&&activeAttachment(afterOwner,"a")===1&&activeAttachment(afterOwner,"b")===1,mode+" keyed trigger replacement publishes the current ref and attachments");
 const callbacks=afterOwner.callbacks.length; activateTrigger(stableButton); await settle();
 assert(state(id).callbacks.length === callbacks,mode+" retired child owner loses behavior");
}
${
  contextMenu
    ? ""
    : `cases[id].compose("direct"); await finish();
const childDiagnostics=[], originalWarn=console.warn;
console.warn=(...values) => { childDiagnostics.push(values.join(" ")); };
try {
 for(const mode of ["wrong","missing","multiple"]) { cases[id].compose(mode); await finish(); }
 cases[id].compose("direct"); await finish();
} finally { console.warn=originalWarn; }
assert(childDiagnostics.length===3 && childDiagnostics[0].includes("must attach to an HTMLButtonElement") && childDiagnostics[1].includes("did not attach to a button after mount") && childDiagnostics[2].includes("multiple owners were attached"), "semantic child diagnostics identify wrong, missing and multiple owners: "+JSON.stringify(childDiagnostics));`
}
for(const part of ["trigger","popup","item","checkbox","indicator","group","radio","sub","subtrigger","subpopup"]) {
 const retired = part === "trigger" ? button(id) : part === "popup" ? popup(id) : part === "item" ? item(id,"alpha") : part === "checkbox" ? checkbox(id) : part === "indicator" ? query("data-indicator",id) : part === "group" ? group(id) : part === "radio" ? radio(id,"alpha") : part === "sub" ? query("data-subroot",id) : part === "subtrigger" ? query("data-subtrigger",id) : popup(id+"-sub");
 cases[id].replace(part); await finish();
 assert(!retired.isConnected && state(id).visible && state(id).checked === true && state(id).value === "beta",part+" replacement preserves accepted models "+JSON.stringify(state(id)));
 const before=state(id).callbacks.length;retired.click();${contextMenu ? "activateTrigger(retired);" : ""}await settle();assert(state(id).callbacks.length === before,part+" retired element loses behavior");
 assert(checkbox(id).getAttribute("aria-checked") === "true" && group(id).dataset.value === "beta" && query("data-inner-group",id).dataset.value === "inner",part+" replacement restores complete item projection");
}
const originalWrapper=wrapper(id);
for(const target of ["#portal-b","[invalid","#missing",document.getElementById("portal-a")]) {cases[id].place(target);await finish();const expected=typeof target === "object"?target:target === "#portal-b"?document.getElementById("portal-b"):document.body;assert(wrapper(id)===originalWrapper && wrapper(id).parentElement===expected && state(id).visible,"portal retarget/fallback preserves wrapper");}
cases[id].place("#portal-a",true);await finish();assert(root(id).contains(originalWrapper),"disabled portal returns authored node");cases[id].place("#portal-a");await finish();
cases[id].placement();await finish();${contextMenu ? "contextPoint(button(id),210,140);await finish();" : ""}let surface=popup(id).getBoundingClientRect(),anchor=${contextMenu ? "contextAnchor(210,140)" : "button(id)"}.getBoundingClientRect();assert(Math.abs(surface.left-anchor.right-18)<2,"placement options reconnect against the Runtime reference "+JSON.stringify({surface:surface.toJSON(),anchor:anchor.toJSON()}));
cases[id].options();await finish();assert(state(id).visible && locked(),"constructor options restore accepted open and modal lock");
item(id,"close").click();flushSync();assert(state(id).open === false && !popup(id).hidden,"accepted close precedes Runtime presence completion");const completions=state(id).completions.length;await finish();assert(state(id).completions.length === completions+1 && !locked(),"close completes once");cases[id].setDelay(180);await finish();
await openCase(id);key(document,"Escape");await finish();assert(!state(id).visible && document.activeElement===button(id),"Escape restores trigger focus");
await openCase(id);pointer(document.getElementById("outside"),"pointerdown");await finish();assert(!state(id).visible && !locked(),"outside dismissal releases lock");
assert(popup("missing")===null,"missing required popup defers construction");cases.missing.setPopup(true);await finish();assert(state("missing").visible,"required popup addition restores accepted open");cases.missing.setPopup(false);await finish();cases.missing.setModel("open",false);cases.missing.setPopup(true);await finish();assert(!state("missing").visible,"command during missing anatomy wins");
cases.missing.setTrigger(false);await finish();cases.missing.setModel("open",true);cases.missing.setTrigger(true);await finish();assert(state("missing").visible,"trigger replacement reconnects");cases.missing.setModel("open",false);await finish();
await openCase("disabled");cases.disabled.setDisabled(true);await finish();assert(state("disabled").visible && state("disabled").open===true,"disabled option retains the accepted state under the silent setter policy");cases.disabled.setModel("open",false);await finish();activateTrigger(button("disabled"));await finish();assert(!state("disabled").visible,"disabled root rejects activation");cases.disabled.setDisabled(false);await finish();
const keyboard="keyboard";button(keyboard).focus();key(button(keyboard),"${contextMenu ? "ContextMenu" : "ArrowDown"}");await finish();assert(state(keyboard).visible && document.activeElement===item(keyboard,"alpha"),"keyboard opening focuses first item");key(document.activeElement,"ArrowDown");await settle();assert(document.activeElement===item(keyboard,"disabled"),"roving retains Runtime focusability for disabled items");key(document.activeElement,"Enter");await settle();assert(state(keyboard).visible,"disabled keyboard activation preserves menu");key(document.activeElement,"ArrowDown");await settle();assert(document.activeElement===item(keyboard,"beta"),"roving advances after disabled item");key(document.activeElement,"Home");await settle();assert(document.activeElement===item(keyboard,"alpha"),"Home focuses first item");key(document.activeElement,"b");await settle();assert(document.activeElement===item(keyboard,"beta"),"typeahead reaches Beta");key(document.activeElement,"End");await settle();assert(document.activeElement===query("data-subtrigger",keyboard),"End reaches last root item");cases.keyboard.setModel("open",false);await finish();
await openCase("links");item("links","disabled").click();assert(state("links").visible,"disabled item does not close");item("links","disabled-link").click();await settle();assert(location.hash!=="#disabled-link" && state("links").visible,"disabled link prevents navigation");item("links","link").click();await settle();assert(location.hash==="#menu-link" && state("links").visible,"native link activates without default close");cases.links.setLinkClose(true);await settle();item("links","link").click();await finish();assert(!state("links").visible,"link closeOnClick command");
const nested="nested";await openCase(nested);let sub=query("data-subtrigger",nested);sub.focus();key(sub,"ArrowRight");await finish();assert(!popup(nested+"-sub").hidden && document.activeElement===item(nested,"nested"),"submenu keyboard opens its own collection");key(document.activeElement,"ArrowLeft");await finish();assert(popup(nested+"-sub").hidden && document.activeElement===sub && state(nested).visible,"submenu left returns to trigger");pointer(sub,"pointerenter");await finish();assert(!popup(nested+"-sub").hidden,"submenu pointer entry opens");pointer(sub,"pointerleave");await wait(30);assert(!popup(nested+"-sub").hidden,"submenu delay retains content before deadline");pointer(popup(nested+"-sub"),"pointerenter");await wait(150);assert(!popup(nested+"-sub").hidden,"submenu popup enter cancels delay");
const rootCallbacks=state(nested).callbacks.length;checkbox(nested+"-sub").click();await settle();assert(checkbox(nested+"-sub").getAttribute("aria-checked")==="true" && state(nested).checked===false && state(nested).callbacks.length===rootCallbacks,"submenu item event stays with its own item");
cases.nested.place("#portal-b");await finish();assert(wrapper(nested+"-sub").parentElement.id==="portal-b" && !popup(nested+"-sub").hidden,"submenu portal retarget keeps logical owner and accepted open state");
item(nested,"sub-close").click();await finish();assert(!state(nested).visible && popup(nested+"-sub").hidden,"submenu close item closes its root tree");
await openCase(nested);cases.nested.setSubDisabled(true);await finish();sub=query("data-subtrigger",nested);pointer(sub,"pointerenter");key(sub,"ArrowRight");await finish();assert(popup(nested+"-sub").hidden,"disabled submenu rejects keyboard and pointer activation");cases.nested.setSubDisabled(false);await finish();
cases.nested.setSub(false);await finish();cases.nested.setSub(true);await finish();key(query("data-subtrigger",nested),"ArrowRight");await finish();assert(!popup(nested+"-sub").hidden,"conditional submenu recreates correct owner");cases.nested.setModel("open",false);await finish();
${contextMenu ? "" : `cases.hover.setDelay(160);await finish();pointer(button("hover"),"pointerenter");await finish();assert(state("hover").visible && !locked(),"modal hover opens without locking click focus");pointer(popup("hover"),"pointerleave");await wait(30);assert(state("hover").visible,"root hover close delay");await wait(200);await finish();assert(!state("hover").visible,"root hover timer closes");`}
await openCase("pending");item("pending","close").click();flushSync();activateTrigger(button("pending"));await finish();assert(state("pending").visible && state("pending").completions.length===0,"reopen retires pending completion");
cases.pending.hide();await finish();
cases[id].setModal(false);cases[id].owner(true);await finish();await openCase(id);const dialog=query("data-dialog",id);assert(dialog.contains(wrapper(id)) && state(id).visible,"native overlay owns nested Menu portal placement");pointer(popup(id),"pointerdown");await finish();assert(dialog.open && state(id).visible,"nested Menu input stays inside owner");key(document,"Escape");await finish();assert(dialog.open && !state(id).visible,"Escape closes top nested Menu first");
await openCase(id);const ownerCallbacks=state(id).callbacks.length;cases[id].owner(false);await finish();
assert(state(id).open===false && !state(id).visible && state(id).rendered==="false", "native owner closure publishes accepted state");
assert(state(id).callbacks.length===ownerCallbacks+1,"native owner normalization has one proposal without an echo");
cases[id].owner(true);await finish();assert(!state(id).visible,"native owner reopen retains closed Menu");cases[id].owner(false);await finish();
${contextActions}
return {complete:true,modelTruthTable:true,cancellation:true,parentCommands:true,refsAndAttachments:true,partReplacement:true,portalLifecycle:true,placement:true,itemModels:true,collectionOwnership:true,submenuLifecycle:true,keyboardAndTypeahead:true,focusAndLock:true,closeComplete:true,${contextMenu ? "contextActivation:true,anchorLifecycle:true" : "buttonChild:true"}};
`;
}
