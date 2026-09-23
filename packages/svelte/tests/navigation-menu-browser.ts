import assert from "node:assert/strict";
import { once } from "node:events";
import { readFile } from "node:fs/promises";
import { createServer } from "node:http";
import { chromium } from "playwright";
import { createBrowserBuildScript } from "./compatibility-hydration.js";
import type { DistConsumer } from "./dist-consumer.js";

function navigationMenuCaseSource(styled: boolean): string {
  const icon = styled ? "Indicator" : "Icon";
  const trigger = `<Menu.Trigger data-trigger={id+"-a"} class={className} disabled={disabledA} openDelay={triggerOpenDelay} closeDelay={triggerCloseDelay} ref={triggerRef} {...attachmentProps} onclick={nativeClick} child={childMode === "default" ? undefined : child}>A<Menu.${icon}/></Menu.Trigger>`;
  const content = `<Menu.Content data-content={id+"-a"} class={contentClass} ref={contentRef}><div data-text={id} style="width:200px;min-height:72px">{label}<button data-update={id} onclick={()=>{counter++;if(id==="body")events.push("authored-button");}}>Count {counter}</button>{#if id==="body"}<a data-authored-link={id} href="#authored" onclick={event=>{event.preventDefault();events.push("authored-link");counter++;}}>Authored link</a>{/if}</div>{#key keys.link}<Menu.Link data-link={id+"-a"} href="#navigation-a" closeOnClick={linkClose} onclick={nativeLink}>Alpha</Menu.Link>{/key}<Menu.Link data-link={id+"-last"} href="#navigation-last" closeOnClick={false}>Last</Menu.Link>{#if extraLink}<Menu.Link data-link={id+"-extra"} href="#navigation-extra" closeOnClick={false}>Extra {counter}</Menu.Link>{/if}
{#if id === "nested"}<Primitive.Root data-nested={id} bind:value={nestedValue}><Primitive.List><Primitive.Item value="inside"><Primitive.Trigger data-nested-trigger={id}>Inside</Primitive.Trigger><Primitive.Content data-nested-content={id}>Nested content</Primitive.Content></Primitive.Item></Primitive.List><Primitive.Portal><Primitive.Popup data-nested-popup={id}><Primitive.Viewport/></Primitive.Popup></Primitive.Portal></Primitive.Root>{/if}
</Menu.Content>`;
  const list = `{#key keys.list}<Menu.List data-list={id}>{#if showItem}{#key keys.item}<Menu.Item value="a" data-item={id+"-a"}>{#key keys.trigger}${trigger}{/key}{#if showContent}{#key keys.content}${content}{/key}{/if}</Menu.Item>{/key}{/if}
<Menu.Item value="b" data-item={id+"-b"}><Menu.Trigger data-trigger={id+"-b"} disabled={disabledB}>B</Menu.Trigger><Menu.Content data-content={id+"-b"}><Menu.Link data-link={id+"-b"} href="#navigation-b" closeOnClick={false}>Beta</Menu.Link></Menu.Content></Menu.Item>
<Menu.Item value="" data-item={id+"-empty"}><Menu.Trigger data-trigger={id+"-empty"}>Empty value</Menu.Trigger><Menu.Content data-content={id+"-empty"}><Menu.Link href="#navigation-empty" closeOnClick={false}>Empty selection</Menu.Link></Menu.Content></Menu.Item>
<Menu.Item><Menu.Link data-top-link={id} href="#navigation-docs" active={activeLink} closeOnClick={false}>Docs</Menu.Link></Menu.Item>
{#if extraItem}<Menu.Item value="extra"><Menu.Trigger data-trigger={id+"-extra"}>Extra</Menu.Trigger><Menu.Content data-content={id+"-extra"}><Menu.Link href="#extra">Extra panel</Menu.Link></Menu.Content></Menu.Item>{/if}
</Menu.List>{/key}`;
  const implicitList = `<Menu.List data-list={id}>{#each implicitOrder as item (item)}<Menu.Item data-item={id+"-"+item}><Menu.Trigger data-trigger={id+"-"+item} class={className} ref={triggerRef} disabled={item === "b" && disabledB}>{item}</Menu.Trigger><Menu.Content data-content={id+"-"+item}><Menu.Link href={"#implicit-"+item} closeOnClick={false}>{item} content</Menu.Link></Menu.Content></Menu.Item>{/each}</Menu.List>`;
  const viewport = `{#key keys.viewport}<Primitive.Viewport data-viewport={id}/>{/key}`;
  const primitiveSurface = `{#key keys.portal}<Primitive.Portal {container} disabled={disablePortal} data-portal={id}>{#key keys.positioner}<Primitive.Positioner data-positioner={id} {side} {align} sideOffset={offset} avoidCollisions={false}>{#key keys.popup}<Primitive.Popup data-popup={id} {side} {align}>{#if !separatePopup}${viewport}{/if}{#if showArrow}<Primitive.Arrow/>{/if}</Primitive.Popup>{/key}{#if separatePopup}${viewport}{/if}</Primitive.Positioner>{/key}</Primitive.Portal>{/key}`;
  const surface = styled
    ? `{#if separatePopup}${primitiveSurface}{:else}{#key keys.surface}<Menu.Positioner portalContainer={container} {disablePortal} {side} {align} sideOffset={offset} avoidCollisions={false} data-positioner={id}/>{/key}{/if}`
    : primitiveSurface;
  const rootProps =
    "data-root={id} ref={rootRef} defaultValue={seed} {openDelay} {closeDelay} {closeOnEscape} {closeOnOutsideInteract} {orientation} onValueChange={propose}";
  const renderRoot = (name: string, binding: string, custom: boolean) =>
    `<${name} ${rootProps} ${binding} ${styled && !custom ? "portalContainer={container} {disablePortal} {side} {align} sideOffset={offset} avoidCollisions={false}" : ""}>{#snippet children(accepted)}<output data-accepted={id}>{JSON.stringify(accepted)}</output>${`{#if id === "implicit"}${implicitList}{:else}${list}{/if}`}${custom || !styled ? `{#if showSurface}${surface}{/if}` : ""}{/snippet}</${name}>`;
  const rootModes = (name: string, custom: boolean) =>
    `{#if mode === "function"}${renderRoot(name, "bind:value={getValue,putValue}", custom)}{:else if mode === "bound"}${renderRoot(name, "bind:value={model}", custom)}{:else}${renderRoot(name, '{...(mode === "plain" ? {value:model} : {})}', custom)}{/if}`;
  return `<script lang="ts">
import {flushSync,untrack} from "svelte";
import {createAttachmentKey,type Attachment} from "svelte/attachments";
import Primitive,{type ButtonChildPayload,type NavigationMenuValueChangeDetails} from "@starwind-ui/svelte/navigation-menu";
import Button from "@starwind-ui/svelte/button";
import ForwardButton from "./ForwardButton.svelte";
${styled ? 'import Menu from "./navigation-menu/index.js";' : "const Menu=Primitive;"}
let {id,mode="bound",value:initialValue,defaultValue:initialDefault,proposal,setter,missing=false,customSurface=false,separatePopup=false}:{id:string;mode?:"omitted"|"plain"|"bound"|"function";value?:string|null;defaultValue?:string|null;proposal?:string;setter?:string;missing?:boolean;customSurface?:boolean;separatePopup?:boolean}=$props();
let model=$state<string|null|undefined>(untrack(()=>initialValue));let seed=$state<string|null|undefined>(untrack(()=>initialDefault));
let shown=$state(true),showSurface=$state(!untrack(()=>missing)),showItem=$state(true),showContent=$state(true),showArrow=$state(true),extraItem=$state(false),extraLink=$state(false);
let implicitOrder=$state(["a","b"]);
let keys=$state<Record<string,number>>({root:0,list:0,item:0,trigger:0,content:0,link:0,portal:0,positioner:0,popup:0,viewport:0,surface:0});
let className=$state("before"),contentClass=$state("content-before"),label=$state("Initial content"),counter=$state(0),parentCounter=$state(0);
let openDelay=$state(0),closeDelay=$state(0),triggerOpenDelay=$state<number|undefined>(),triggerCloseDelay=$state<number|undefined>();
let orientation=$state<"horizontal"|"vertical">("horizontal"),closeOnEscape=$state(true),closeOnOutsideInteract=$state(true),disabledA=$state(false),disabledB=$state(false),linkClose=$state(true),activeLink=$state(false);
let side=$state<"top"|"right"|"bottom"|"left">("bottom"),align=$state<"start"|"center"|"end">("start"),offset=$state(8),container=$state<string|HTMLElement|undefined>(untrack(()=>id==="body"?undefined:"#portal-a")),disablePortal=$state(false);
let childMode=$state("default"),newRef=$state(false),refRead=$state(0),attachmentRead=$state(0),withB=$state(true),nestedValue=$state<string|null|undefined>();
const refs:string[]=[],attachments:string[]=[],events:string[]=[],writes:(string|null|undefined)[]=[],callbacks:{value:string|null;before:string|null|undefined}[]=[];
let rootNode:HTMLElement|null=null,contentNode:HTMLDivElement|null=null;const rootRef=(node:HTMLElement|null)=>{rootNode=node;refs.push("root:"+(node?.tagName??"null"));};
const oldTriggerRef=(node:HTMLButtonElement|null)=>{void refRead;refs.push("old:"+(node?.tagName??"null"));};const newTriggerRef=(node:HTMLButtonElement|null)=>{void refRead;refs.push("new:"+(node?.tagName??"null"));};let triggerRef=$derived(newRef?newTriggerRef:oldTriggerRef);
const contentRef=(node:HTMLDivElement|null)=>{contentNode=node;void refRead;refs.push("content:"+(node?.tagName??"null"));};
const keyA=createAttachmentKey(),keyB=createAttachmentKey();
const attachA:Attachment<HTMLButtonElement>=(node)=>{const read=attachmentRead;attachments.push("A:start:"+read+":"+node.tagName);return()=>{attachments.push("A:end:"+read);};};
const attachB:Attachment<HTMLButtonElement>=(node)=>{attachments.push("B:start:"+node.tagName);return()=>{attachments.push("B:end");};};
let attachmentProps=$derived({[keyA]:attachA,...(withB?{[keyB]:attachB}:{})});
function nativeClick(event:MouseEvent){events.push("native");if(id==="links")event.preventDefault();}
function nativeLink(event:MouseEvent){events.push("native-link");event.preventDefault();}
function propose(next:string|null,detail:NavigationMenuValueChangeDetails){events.push("proposal");callbacks.push({value:next,before:model});if(proposal==="cancel"||proposal==="command-cancel")detail.cancel();if(proposal?.startsWith("command")||proposal==="two-commands")flushSync(()=>{model="b";});if(proposal==="two-commands")flushSync(()=>{model="";});if(proposal==="unmount")flushSync(()=>{shown=false;});}
function getValue(){return model;}function putValue(next:string|null|undefined){events.push("write");writes.push(next);if(setter!=="retain")model=setter==="transform"&&next==="a"?"b":next;}
export function snapshot(){return {model,callbacks:[...callbacks],writes:[...writes],events:[...events],refs:[...refs],attachments:[...attachments],shown,nestedValue};}
export function setModel(next:string|null|undefined){flushSync(()=>{model=next;});}
export function setDefault(next:string|null){seed=next;}
export function replace(part:string){keys[part]++;}
export function content(){return contentNode;}export function root(){return rootNode;}
export function show(part:string,next:boolean){if(part==="item")showItem=next;else if(part==="content")showContent=next;else if(part==="arrow")showArrow=next;else showSurface=next;}
export function updateContent(){label="Updated content";counter++;extraLink=true;}
export function updateParent(){parentCounter++;}
export function addItem(next:boolean){extraItem=next;}
export function orderImplicit(next:string[]){implicitOrder=next;}
export function changeClass(){className=className==="before"?"after":"before";contentClass=contentClass==="content-before"?"content-after":"content-before";}
export function changeRef(){newRef=!newRef;}
export function readRef(){refRead++;}
export function readAttachment(){attachmentRead++;}
export function symbolB(next:boolean){withB=next;}
export function modeChild(next:string){childMode=next;}
export function delays(open:number,close:number){openDelay=open;closeDelay=close;}
export function triggerDelays(open:number|undefined,close:number|undefined){triggerOpenDelay=open;triggerCloseDelay=close;}
export function direction(next:"horizontal"|"vertical"){orientation=next;}
export function disable(item:string,next:boolean){if(item==="a")disabledA=next;else disabledB=next;}
export function dismissal(escape:boolean,outside:boolean){closeOnEscape=escape;closeOnOutsideInteract=outside;}
export function linkOptions(close:boolean,active=false){linkClose=close;activeLink=active;}
export function place(next:string|HTMLElement|undefined,disabled=false){container=next;disablePortal=disabled;}
export function placement(next:"top"|"right"|"bottom"|"left",nextAlign:"start"|"center"|"end",nextOffset:number){side=next;align=nextAlign;offset=nextOffset;}
export function hide(){shown=false;}
</script>
{#snippet child({props,children}:ButtonChildPayload)}{#if childMode==="component"}<ForwardButton {props} {children}/>{:else if childMode==="primitive"}<Button.Root {...props}>{@render children?.()}</Button.Root>{:else}<button {...props}>{@render children?.()}</button>{/if}{/snippet}
<div data-fixture={id}><output data-parent={id}>{parentCounter}</output>{#if shown}{#key keys.root}${styled ? `{#if customSurface}${rootModes("Primitive.Root", true)}{:else}${rootModes("Menu.Root", false)}{/if}` : rootModes("Menu.Root", true)}{/key}{/if}</div>`;
}

export type NavigationMenuCase = {
  id: string;
  mode?: "omitted" | "plain" | "bound" | "function";
  value?: string | null;
  defaultValue?: string | null;
  proposal?: "cancel" | "command-cancel" | "command-accept" | "two-commands" | "unmount";
  setter?: "retain" | "transform";
  missing?: boolean;
  customSurface?: boolean;
  separatePopup?: boolean;
};

export const navigationMenuLifecycleCases: NavigationMenuCase[] = [
  ...(["omitted", "plain", "bound", "function"] as const).map((mode) => ({
    id: mode,
    mode,
    defaultValue: "a",
  })),
  { id: "defined", value: null, defaultValue: "a" },
  { id: "empty", value: "", defaultValue: "a" },
  { id: "unknown", value: "unknown" },
  ...(["cancel", "command-cancel", "command-accept", "two-commands", "unmount"] as const).map(
    (proposal) => ({ id: proposal, proposal, value: null }),
  ),
  ...(["retain", "transform"] as const).map((setter) => ({
    id: setter,
    mode: "function" as const,
    setter,
    value: null,
  })),
  ...[
    "dom",
    "lifetime",
    "movement",
    "keyboard",
    "timing",
    "nested",
    "pending",
    "links",
    "body",
    "placement",
    "implicit",
  ].map((id) => ({ id, value: null })),
  { id: "surface", value: null, customSurface: true },
  { id: "missing", value: "a", missing: true, customSurface: true },
  { id: "refresh", value: null, separatePopup: true, customSurface: true },
];

function navigationMenuActions(styled: boolean): string {
  return [
    navigationHelpers,
    modelActions,
    lifetimeActions,
    movementActions,
    implicitValueActions,
    surfaceActions(styled),
    portalActions,
    keyboardActions,
    timingAndNestedActions,
    linkActions,
    bodyPortalActions,
    beforeUnmountActions,
  ].join("\n");
}

const navigationHelpers = `
const cases=app.getCases();
const query=(attribute,value)=>document.querySelector("["+attribute+"="+JSON.stringify(value)+"]");
const trigger=(id,item="a")=>query("data-trigger",id+"-"+item);
const panel=(id,item="a")=>query("data-content",id+"-"+item);
const root=id=>query("data-root",id);
const popup=id=>query("data-popup",id)??document.getElementById((trigger(id)??trigger(id,"b"))?.getAttribute("aria-controls"));
const viewport=id=>query("data-viewport",id)??popup(id)?.querySelector("[data-sw-nav-menu-viewport]");
const portal=id=>popup(id)?.closest("[data-sw-nav-menu-portal]");
const accepted=id=>JSON.parse(query("data-accepted",id)?.textContent??"null");
const state=id=>cases[id].snapshot();
const click=element=>element.dispatchEvent(new MouseEvent("click",{bubbles:true,cancelable:true}));
const key=(element,name,options={})=>element.dispatchEvent(new KeyboardEvent("keydown",{key:name,bubbles:true,cancelable:true,...options}));
const pointer=(element,type,relatedTarget=null)=>element.dispatchEvent(new PointerEvent(type,{pointerType:"mouse",bubbles:false,relatedTarget}));
const open=async(id,item="a")=>{cases[id].setModel(item==="empty"?"":item);await finish();assert(accepted(id)===(item==="empty"?"":item)&&!popup(id).hidden,"silent opening "+id);};
const close=async id=>{cases[id].setModel(null);await finish();};
`;

const modelActions = `
for(const mode of ["omitted","plain","bound","function"]){
 assert(accepted(mode)==="a"&&!popup(mode).hidden,mode+" uses the initial explicit default");assert(state(mode).callbacks.length===0,mode+" initialization is silent");
 if(mode==="bound"||mode==="function")assert(state(mode).model===undefined,mode+" leaves initial binding undefined");
 click(trigger(mode,"b"));await finish();assert(accepted(mode)==="b",mode+" accepts a local interaction");
 cases[mode].setDefault("b");await finish();cases[mode].setDefault("a");await finish();assert(accepted(mode)==="b",mode+" freezes its initial default");
 if(mode!=="omitted"){
  cases[mode].setModel(null);await finish();assert(accepted(mode)===null&&popup(mode).hidden,mode+" accepts explicit null");
  cases[mode].setModel("");await finish();assert(accepted(mode)===""&&!popup(mode).hidden,mode+" preserves empty string");
  cases[mode].setModel(undefined);await finish();assert(accepted(mode)===""&&!popup(mode).hidden,mode+" later undefined retains accepted state");
  cases[mode].setModel("missing");await finish();assert(accepted(mode)===null&&popup(mode).hidden,mode+" reads unknown-value normalization");
 }
}
assert(accepted("defined")===null&&popup("defined").hidden,"initial defined null overrides an open default");
assert(accepted("empty")===""&&!popup("empty").hidden,"initial defined empty string is an open selection");
assert(accepted("unknown")===null&&state("unknown").model==="unknown","initial unknown value normalizes Runtime without publication");
click(trigger("cancel"));await finish();assert(accepted("cancel")===null&&state("cancel").model===null,"cancel retains the accepted state");
assert(state("cancel").callbacks.length===1&&state("cancel").callbacks[0].before===null,"cancel proposes before bound output");
const dom=root("dom"),domOrder=[];
const cancel=event=>{if(event.target!==dom)return;domOrder.push("dom");assert(state("dom").events.at(-1)==="proposal","callback precedes cancelable DOM dispatch");event.preventDefault();};
dom.addEventListener("starwind:value-change",cancel);click(trigger("dom"));await finish();assert(accepted("dom")===null&&state("dom").model===null&&domOrder.length===1,"later DOM cancellation retains accepted state");dom.removeEventListener("starwind:value-change",cancel);
await close("dom");
const retiredUnmountTrigger=trigger("unmount");click(retiredUnmountTrigger);await finish();assert(!root("unmount")&&state("unmount").model===null,"unmount during proposal discards stale publication");click(retiredUnmountTrigger);await finish();assert(state("unmount").callbacks.length===1,"unmounted Trigger retires its Runtime listener");
result.modelTruthTable=true;result.cancellation=true;result.parentCommands=true;
`;

const lifetimeActions = `
const activeAttachment=(log,name)=>log.filter(value=>value.startsWith(name+":start")).length-log.filter(value=>value.startsWith(name+":end")).length;
const life="lifetime";await open(life);const originalContent=panel(life);assert(cases[life].content()===originalContent,"Content ref points to the actual moved public div");
for(const mode of ["default","direct","component","primitive"]){
 cases[life].modeChild(mode);await finish();let before=state(life);const button=trigger(life),beforeClass=button.className;
 assert(button instanceof HTMLButtonElement&&!button.querySelector("button"),mode+" owns one semantic button");assert(button.getAttribute("aria-expanded")==="true"&&button.getAttribute("data-sw-part")==="trigger",mode+" preserves Navigation Menu identity");
 cases[life].changeClass();await settle();let after=state(life);assert(button===trigger(life)&&after.attachments.filter(value=>value.endsWith(":cleanup")).length<after.attachments.length,mode+" ordinary props keep current element and attachment ownership");assert(button.className!==beforeClass,mode+" forwards an actual changed class");assert(panel(life)===originalContent&&!originalContent.hidden,mode+" prop updates preserve moved Content");
 cases[life].changeRef();await settle();let swapped=state(life);assert(trigger(life)===button&&swapped.refs.at(-1).endsWith(":BUTTON"),mode+" replacement callback receives the current button");
 cases[life].readRef();await settle();assert(state(life).refs.length===swapped.refs.length,mode+" reactive reads inside callbacks do not reconnect refs");
 const start=state(life).attachments.length;cases[life].readAttachment();await settle();let changed=state(life).attachments.slice(start);assert(changed.length===2&&changed[0].startsWith("A:end:")&&changed[1].startsWith("A:start:"),mode+" reactive symbol A restarts independently");
 cases[life].symbolB(false);await settle();assert(activeAttachment(state(life).attachments,"A")===1&&activeAttachment(state(life).attachments,"B")===0,mode+" removing B keeps A active");
 cases[life].symbolB(true);await settle();assert(activeAttachment(state(life).attachments,"A")===1&&activeAttachment(state(life).attachments,"B")===1,mode+" adding B keeps both current owners active");
 const keyStart=state(life),oldButton=trigger(life);cases[life].replace("trigger");await finish();let keyed=state(life);const events=keyed.attachments.slice(keyStart.attachments.length);
 assert(!oldButton.isConnected&&trigger(life)!==oldButton,mode+" keyed Trigger replaces its owner");assert(events.length===4&&events.findIndex(event=>event.startsWith("A:end"))<events.findIndex(event=>event.startsWith("A:start"))&&events.indexOf("B:end")<events.indexOf("B:start:BUTTON"),mode+" keyed owner cleans each symbol before restart");
 assert(keyed.refs.at(-1).endsWith(":BUTTON"),mode+" keyed owner publishes the current ref");
 const callbacks=keyed.callbacks.length;click(oldButton);await finish();assert(state(life).callbacks.length===callbacks&&accepted(life)==="a",mode+" retired Trigger loses behavior");
}
const oldParent=Number(query("data-parent",life).textContent),stableRefCount=state(life).refs.length;cases[life].updateParent();await finish();assert(Number(query("data-parent",life).textContent)===oldParent+1&&state(life).refs.length===stableRefCount,"a parent rerender preserves element ownership");
result.refsAndAttachments=true;result.buttonChild=true;
`;

const movementActions = `
const move="movement";await open(move);const first=panel(move),firstRefCount=state(move).refs.filter(event=>event.startsWith("content:")).length;
assert(first.parentElement===viewport(move),"Runtime moves Content to the shared Viewport");cases[move].updateContent();await finish();assert(panel(move)===first&&first.textContent.includes("Updated content")&&first.textContent.includes("Count 1")&&first.querySelector('[data-link="movement-extra"]'),"reactive text and conditional children remain live after movement");
click(query("data-update",move));await settle();assert(first.textContent.includes("Count 2"),"a Svelte child callback works after movement");assert(state(move).refs.filter(event=>event.startsWith("content:")).length===firstRefCount,"physical movement preserves Content ref lifetime");await close(move);assert(first.parentElement?.hasAttribute("data-sw-nav-menu-content-carrier")&&first.closest('[data-item="movement-a"]')&&first.hidden,"closing restores Content to its authored Item after animation");
for(const part of ["content","item","link","trigger","list"]){
 await open(move);const before=part==="link"?query("data-link",move+"-a"):part==="trigger"?trigger(move):part==="list"?query("data-list",move):part==="item"?query("data-item",move+"-a"):panel(move);
 cases[move].replace(part);await finish();const next=part==="link"?query("data-link",move+"-a"):part==="trigger"?trigger(move):part==="list"?query("data-list",move):part==="item"?query("data-item",move+"-a"):panel(move);
 assert(!before.isConnected&&next!==before&&accepted(move)==="a"&&panel(move).parentElement===viewport(move),part+" replacement preserves accepted value and content ownership");
 if(part==="link"||part==="trigger"){const callbacks=state(move).callbacks.length;click(before);await finish();assert(state(move).callbacks.length===callbacks&&accepted(move)==="a",part+" retired element loses behavior");}
}
cases[move].show("item",false);await finish();assert(!panel(move)&&accepted(move)===null&&state(move).model==="a","active Item removal publishes normalized null "+JSON.stringify({accepted:accepted(move),state:state(move),panel:!!panel(move)}));cases[move].show("item",true);await finish();assert(accepted(move)==="a","restoring an Item applies the current parent value");
cases[move].addItem(true);await finish();await open(move,"extra");cases[move].addItem(false);await finish();assert(accepted(move)===null&&state(move).model==="extra","dynamic collection removal normalizes the public getter");
await open(move);cases[move].show("arrow",false);await finish();assert(accepted(move)==="a","optional Arrow removal keeps the selection");
for(let index=0;index<5;index++){
 const live=panel(move);cases[move].setModel(null);await wait(10);cases[move].delays(index+1,index+1);cases[move].setModel("a");await finish();assert(panel(move)===live&&live.parentElement===viewport(move)&&!live.hidden&&accepted(move)==="a","retired close callbacks cannot reclaim surviving Content");
 const carriers=[...root(move).querySelectorAll('[data-sw-nav-menu-content-carrier]')];assert(carriers.length===3&&carriers.every(carrier=>carrier.childNodes.length<=2),"repeated recreation keeps bounded target-owned scaffolding");
}
result.viewportMovement=true;result.reactiveContent=true;result.collectionOwnership=true;
`;

const implicitValueActions = `
const implicit="implicit";click(trigger(implicit,"b"));await finish();const implicitValue=accepted(implicit);assert(typeof implicitValue==="string"&&implicitValue.length>0,"an omitted Item value receives the public Runtime selection");
const implicitNodes=new Map(["a","b"].map(item=>[item,{item:query("data-item",implicit+"-"+item),trigger:trigger(implicit,item),content:panel(implicit,item)}]));
function assertImplicitState(active,phase){
 assert(accepted(implicit)===implicitValue&&state(implicit).model===implicitValue,phase+" retains the same accepted and bound Runtime value");
 const items=[...query("data-list",implicit).querySelectorAll("[data-sw-nav-menu-item]")];
 for(const item of items){
  const name=item.getAttribute("data-item").slice(implicit.length+1),button=trigger(implicit,name),content=panel(implicit,name),open=name===active,expected=open?"open":"closed";
  const observed={item:item.getAttribute("data-state"),trigger:button.getAttribute("data-state"),content:content.getAttribute("data-state"),expanded:button.getAttribute("aria-expanded"),hidden:content.hidden,moved:content.parentElement===viewport(implicit)};
  assert(observed.item===expected&&observed.trigger===expected&&observed.content===expected&&observed.expanded===String(open)&&observed.hidden===!open&&observed.moved===open,phase+" keeps implicit "+name+" Item, Trigger, Content and aria-expanded coherent: "+JSON.stringify(observed));
 }
 for(const [name,nodes] of implicitNodes){assert(query("data-item",implicit+"-"+name)===nodes.item&&trigger(implicit,name)===nodes.trigger&&panel(implicit,name)===nodes.content,phase+" preserves keyed "+name+" owners");}
}
assertImplicitState("b","initial implicit opening");
cases[implicit].orderImplicit(["x","a","b"]);await finish();assertImplicitState("a","inserting an omitted-value Item before the active Item");
const implicitClass=trigger(implicit,"a").className;cases[implicit].changeClass();await finish();assert(trigger(implicit,"a").className!==implicitClass,"ordinary Trigger class updates reach the remapped implicit owner");assertImplicitState("a","ordinary class update after insertion");
cases[implicit].changeRef();await finish();assertImplicitState("a","callback-ref update after insertion");cases[implicit].disable("b",true);await finish();assert(trigger(implicit,"b").disabled,"a closed implicit Trigger accepts disabled");assertImplicitState("a","ordinary disabled update after insertion");cases[implicit].disable("b",false);await finish();
cases[implicit].orderImplicit(["b","x","a"]);await finish();assertImplicitState("x","reordering surviving omitted-value Items");cases[implicit].changeClass();await finish();assertImplicitState("x","ordinary class update after keyed reordering");cases[implicit].changeRef();await finish();assertImplicitState("x","callback-ref update after keyed reordering");await close(implicit);
result.collectionOwnership=true;result.partReplacement=true;
`;

function surfaceActions(styled: boolean): string {
  return `
const surface="surface";await open(surface);const survivor=panel(surface);
for(const part of ${JSON.stringify(styled ? ["surface"] : ["viewport", "popup", "positioner", "portal"])}){
 const previous=popup(surface);cases[surface].replace(part);await finish();assert(accepted(surface)==="a"&&panel(surface)===survivor&&survivor.parentElement===viewport(surface)&&!popup(surface).hidden,part+" surface replacement restores the accepted panel");if(part!=="viewport")assert(!previous.isConnected&&popup(surface)!==previous,part+" releases the old Popup");
}
cases.missing.show("surface",true);await finish();assert(accepted("missing")==="a"&&panel("missing").parentElement===viewport("missing"),"connection waits for missing required surfaces then restores the initial command");const missingPanel=panel("missing");cases.missing.show("surface",false);await finish();assert(accepted("missing")==="a"&&!popup("missing"),"removing required surfaces retains accepted state while disconnected");cases.missing.show("surface",true);await finish();assert(panel("missing")===missingPanel&&missingPanel.parentElement===viewport("missing"),"returning required surfaces reconnects the surviving Content");
await open("refresh");const refreshViewport=viewport("refresh"),refreshContent=panel("refresh"),refreshPopup=popup("refresh");cases.refresh.replace("popup");await finish();assert(!refreshPopup.isConnected&&viewport("refresh")===refreshViewport&&panel("refresh")===refreshContent&&refreshContent.parentElement===refreshViewport&&accepted("refresh")==="a","a separate Popup replacement refreshes the surviving public surface");
result.partReplacement=true;
`;
}

const portalActions = `
const place="placement";await open(place);const placedContent=panel(place),wrapper=portal(place);assert(wrapper.parentElement.id==="portal-a","Portal resolves its selector after mount");
for(const target of ["#portal-b",document.getElementById("portal-a")]){query("data-link",place+"-a").focus();cases[place].place(target);await finish();assert(portal(place)===wrapper&&placedContent.parentElement===viewport(place)&&document.activeElement===query("data-link",place+"-a"),"Portal retargeting preserves wrapper, Content and focus");}
cases[place].place("#portal-b",true);await finish();assert(root(place).contains(wrapper)&&!popup(place).hidden,"disabled Portal restores its authored parent");
cases[place].place("[bad");await finish();assert(wrapper.parentElement===document.body&&!popup(place).hidden,"invalid selectors use the public Runtime fallback");
cases[place].place("#appearing-target");await finish();assert(wrapper.parentElement===document.body,"missing target begins at the fallback");const appearing=document.createElement("div");appearing.id="appearing-target";document.body.append(appearing);await finish();assert(wrapper.parentElement===appearing,"Portal observes a target added after mount");appearing.remove();await finish();assert(wrapper.parentElement===document.body,"Portal recovers after its target is removed");
cases[place].placement("right","start",18);await finish();const positioner=popup(place).closest('[data-sw-nav-menu-positioner]');assert(positioner.getAttribute("data-side")==="right"&&positioner.getAttribute("data-side-offset")==="18"&&accepted(place)==="a","placement options reconnect with the accepted value");
const triggerBox=trigger(place).getBoundingClientRect(),popupBox=popup(place).getBoundingClientRect();assert(Math.abs(popupBox.left-triggerBox.right-18)<3,"floating geometry uses the requested side and offset");await close(place);
result.portalLifecycle=true;result.placement=true;
`;

const keyboardActions = `
const keyboard="keyboard";await close(keyboard);trigger(keyboard).focus();key(trigger(keyboard),"ArrowRight");await settle();assert(document.activeElement===trigger(keyboard,"b"),"horizontal ArrowRight moves trigger focus");
key(trigger(keyboard,"b"),"End");await settle();assert(document.activeElement===trigger(keyboard,"empty"),"End reaches the last enabled trigger");key(trigger(keyboard,"empty"),"Home");await settle();assert(document.activeElement===trigger(keyboard),"Home returns to the first trigger");
cases[keyboard].disable("b",true);await finish();trigger(keyboard).focus();key(trigger(keyboard),"ArrowRight");await settle();assert(document.activeElement===trigger(keyboard,"empty"),"disabled Trigger is skipped by roving focus");cases[keyboard].disable("b",false);await finish();
trigger(keyboard).focus();key(trigger(keyboard),"ArrowDown");await finish();assert(accepted(keyboard)==="a"&&document.activeElement===query("data-update",keyboard),"horizontal ArrowDown opens and focuses Content");key(document.activeElement,"ArrowUp");await settle();assert(document.activeElement===query("data-link",keyboard+"-last"),"Content ArrowUp wraps to the last control");key(document,"Escape");await finish();assert(accepted(keyboard)===null&&document.activeElement===trigger(keyboard),"Escape closes and restores the Trigger focus");
cases[keyboard].direction("vertical");await finish();assert(root(keyboard).getAttribute("data-orientation")==="vertical","vertical orientation reaches the semantic root");trigger(keyboard).focus();key(trigger(keyboard),"ArrowDown");await settle();assert(document.activeElement===trigger(keyboard,"b"),"vertical ArrowDown moves trigger focus");trigger(keyboard).focus();key(trigger(keyboard),"ArrowRight");await finish();assert(accepted(keyboard)==="a"&&document.activeElement===query("data-update",keyboard),"vertical ArrowRight opens the content");await close(keyboard);
cases[keyboard].disable("a",true);await finish();const disabledCallbacks=state(keyboard).callbacks.length;click(trigger(keyboard));key(trigger(keyboard),"Enter");await finish();assert(accepted(keyboard)===null&&state(keyboard).callbacks.length===disabledCallbacks&&trigger(keyboard).disabled,"disabled Trigger blocks activation");cases[keyboard].disable("a",false);await finish();
`;
const linkActions = `
const links="links";
for(const mode of ["default","direct","component","primitive"]){
 await close(links);cases[links].modeChild(mode);await finish();const eventStart=state(links).events.length;const proposals=state(links).callbacks.length;
 click(trigger(links));await finish();assert(accepted(links)==="a"&&state(links).events.slice(eventStart).join(",")==="proposal,native"&&state(links).callbacks.length===proposals+1,mode+" native Svelte ordering delivers each callback once and retains the existing default-prevention policy: "+JSON.stringify(state(links)));
}
cases[links].linkOptions(false,true);await finish();assert(query("data-top-link",links).getAttribute("aria-current")==="page"&&query("data-top-link",links).hasAttribute("data-active"),"active link exposes both public states");click(query("data-link",links+"-a"));await finish();assert(accepted(links)==="a","closeOnClick false retains accepted selection");cases[links].linkOptions(true);await finish();click(query("data-link",links+"-a"));await finish();assert(accepted(links)===null&&state(links).events.filter(event=>event==="native-link").length===2,"link activation closes once and forwards its native callback once: "+JSON.stringify({accepted:accepted(links),state:state(links)}));
result.keyboardAndFocus=true;
`;

const timingAndNestedActions = `
const timing="timing";cases[timing].delays(120,140);await finish();pointer(trigger(timing),"pointerenter");await wait(50);assert(accepted(timing)===null,"openDelay holds the pending hover");await wait(100);await settle();assert(accepted(timing)==="a","openDelay accepts the hover at its deadline");pointer(trigger(timing),"pointerleave",document.getElementById("outside"));await wait(60);assert(accepted(timing)==="a","closeDelay retains the active panel before its deadline");await wait(110);await finish();assert(accepted(timing)===null,"closeDelay closes after its deadline");
cases[timing].triggerDelays(15,20);await finish();pointer(trigger(timing),"pointerenter");await wait(45);await settle();assert(accepted(timing)==="a","Trigger openDelay overrides the Root delay");pointer(trigger(timing),"pointerleave",document.getElementById("outside"));await wait(45);await finish();assert(accepted(timing)===null,"Trigger closeDelay overrides the Root delay");
cases[timing].triggerDelays(undefined,undefined);cases[timing].delays(120,120);await finish();const retiredTimedTrigger=trigger(timing);pointer(retiredTimedTrigger,"pointerenter");await wait(20);cases[timing].replace("trigger");await wait(160);await finish();assert(accepted(timing)===null,"Trigger replacement cancels a pending hover timer");
result.timing=true;
const nested="nested";await open(nested);const nestedTrigger=query("data-nested-trigger",nested),nestedContent=query("data-nested-content",nested),parentCallbacks=state(nested).callbacks.length;click(nestedTrigger);key(nestedTrigger,"Enter");await finish();assert(nestedContent.hidden&&state(nested).nestedValue===undefined&&accepted(nested)==="a"&&state(nested).callbacks.length===parentCallbacks,"nested Navigation Menu remains inert after parent Content moves "+JSON.stringify({hidden:nestedContent.hidden,nestedValue:state(nested).nestedValue,accepted:accepted(nested),callbacks:state(nested).callbacks.length,parentCallbacks}));cases[nested].replace("content");await finish();click(query("data-nested-trigger",nested));await finish();assert(query("data-nested-content",nested).hidden&&accepted(nested)==="a","replacement preserves logical nested-root ownership");
result.nestedOwnership=true;
`;
const beforeUnmountActions = `
cases.pending.delays(120,120);await finish();pointer(trigger("pending"),"pointerenter");await wait(20);
const lifetimeOwner=cases[life],pendingOwner=cases.pending,finalState=state(life),finalTrigger=trigger(life);const attachmentBalance=events=>events.filter(event=>event.includes(":start")).length-events.filter(event=>event.includes(":end")).length;assert(attachmentBalance(finalState.attachments)===2,"two forwarded symbols remain live before unmount");
`;

const bodyPortalActions = `
const body="body",bodyOwner=cases[body];await open(body);const bodyContent=panel(body),bodyButton=query("data-update",body),bodyAnchor=query("data-authored-link",body),bodyLink=query("data-link",body+"-a");
assert(portal(body).parentElement===document.body&&!document.getElementById("app").contains(bodyContent),"default body Portal moves live Content outside the Svelte mount container");
const contentRefStarts=state(body).refs.filter(event=>event==="content:DIV").length;
for(let cycle=0;cycle<2;cycle++){
 if(cycle){await open(body);cases[body].updateContent();await finish();assert(bodyContent.textContent.includes("Updated content")&&bodyContent.querySelector('[data-link="body-extra"]'),"body-portaled Content keeps reactive text and conditional children after reopening");}
 const before=state(body).events.length;const countBefore=Number(bodyButton.textContent.replace("Count ",""));click(bodyButton);click(bodyAnchor);await finish();assert(Number(bodyButton.textContent.replace("Count ",""))===countBefore+2,"authored body-portaled button and anchor callbacks each update reactive children once");assert(state(body).events.slice(before).join(",")==="authored-button,authored-link","ordinary authored callbacks each run once outside the app mount container");
 click(bodyLink);await finish();assert(accepted(body)===null&&state(body).events.filter(event=>event==="native-link").length===cycle+1,"NavigationMenu.Link callback runs once and closes through the body Portal");assert(panel(body)===bodyContent&&bodyContent.parentElement.hasAttribute("data-sw-nav-menu-content-carrier"),"body Portal closing restores the same authored Content owner");
}
assert(state(body).refs.filter(event=>event==="content:DIV").length===contentRefStarts,"body Portal movement and reopen preserve the Content ref lifetime");await open(body);const bodyEventCount=state(body).events.length;
`;

const navigationMenuAfterUnmount = `
assert(attachmentBalance(lifetimeOwner.snapshot().attachments)===0,"root unmount releases every forwarded symbol");
assert(lifetimeOwner.snapshot().refs.at(-1).endsWith(":null"),"root unmount releases the last callback ref");
const unmountedCallbacks=lifetimeOwner.snapshot().callbacks.length;click(finalTrigger);await wait(180);assert(lifetimeOwner.snapshot().callbacks.length===unmountedCallbacks,"retained Trigger has no Runtime behavior after unmount");
assert(pendingOwner.snapshot().callbacks.length===0,"root unmount cancels a pending open timer");
assert(!bodyContent.isConnected&&bodyOwner.content()===null,"body Portal unmount removes moved Content and releases its ref");click(bodyButton);click(bodyAnchor);click(bodyLink);await settle();assert(bodyOwner.snapshot().events.length===bodyEventCount,"body Portal teardown retires ordinary and component callbacks");
`;

export async function verifyNavigationMenuLifecycle(consumer: DistConsumer, styled = false) {
  const checked = await verifyNavigationMenuFixture(
    consumer,
    {
      "Case.svelte": navigationMenuCaseSource(styled),
      "ForwardButton.svelte":
        '<script lang="ts">import type { ButtonChildPayload } from "@starwind-ui/svelte/navigation-menu";let {props,children}:ButtonChildPayload=$props();</script><button {...props}>{@render children?.()}</button>',
      "App.svelte": `<script lang="ts">import Case from "./Case.svelte";const configs=${JSON.stringify(navigationMenuLifecycleCases)} as const;const cases:Record<string,any>={};export function getCases(){return cases;}</script>{#each configs as config (config.id)}<Case {...config} bind:this={cases[config.id]} />{/each}`,
    },
    navigationMenuActions(styled),
    navigationMenuAfterUnmount,
  );
  const { build, ...result } = checked;
  return { result, build };
}

export async function verifyNavigationMenuOrdinary(consumer: DistConsumer) {
  const { build, ...result } = await verifyNavigationMenuFixture(
    consumer,
    {
      "Case.svelte": navigationMenuCaseSource(false),
      "ForwardButton.svelte":
        '<script lang="ts">import type { ButtonChildPayload } from "@starwind-ui/svelte/navigation-menu";let {props,children}:ButtonChildPayload=$props();</script><button {...props}>{@render children?.()}</button>',
      "App.svelte": `<script lang="ts">import Case from "./Case.svelte";const cases:Record<string,any>={};export function getCases(){return cases;}</script><Case id="body" mode="bound" value={null} bind:this={cases.body}/><Case id="cancel" mode="bound" value={null} proposal="cancel" bind:this={cases.cancel}/><Case id="keyboard" mode="bound" value={null} bind:this={cases.keyboard}/><Case id="timing" mode="bound" value={null} bind:this={cases.timing}/><Case id="placement" mode="bound" value={null} bind:this={cases.placement}/>`,
    },
    navigationHelpers +
      `
click(trigger("body")); await finish();
assert(accepted("body") === "a" && state("body").model === "a", "bound interaction publishes the accepted value");
assert(portal("body").parentElement === document.body && viewport("body").contains(panel("body")), "initial body portal connects live Content to the shared Viewport");
cases.body.setModel("b"); await finish();
assert(accepted("body") === "b" && !popup("body").hidden, "a later parent command selects another Item");
cases.body.setModel(null); await finish();
assert(accepted("body") === null && popup("body").hidden, "a later parent command closes the menu");
click(trigger("cancel")); await finish();
assert(accepted("cancel") === null && state("cancel").model === null, "cancellation retains the closed model");
cases.cancel.setModel("b"); await finish();
assert(accepted("cancel") === "b", "a later parent command follows cancellation");
cases.cancel.setModel(null); await finish();
trigger("keyboard").focus(); key(trigger("keyboard"), "ArrowDown"); await finish();
assert(accepted("keyboard") === "a" && document.activeElement === query("data-update", "keyboard"), "keyboard opening publishes state and focuses Content");
key(document, "Escape"); await finish();
assert(accepted("keyboard") === null && document.activeElement === trigger("keyboard"), "Escape closes and restores trigger focus");
pointer(trigger("timing"), "pointerenter"); await finish();
assert(accepted("timing") === "a", "hover opens and publishes the accepted value");
pointer(trigger("timing"), "pointerleave", document.getElementById("outside")); await finish();
assert(accepted("timing") === null, "hover leave closes and publishes the accepted value");
await open("placement"); const wrapper = portal("placement"), content = panel("placement");
query("data-link", "placement-a").focus(); cases.placement.place("#portal-b"); await finish();
assert(portal("placement") === wrapper && wrapper.parentElement.id === "portal-b" && content.parentElement === viewport("placement") && document.activeElement === query("data-link", "placement-a"), "portal retargeting preserves live Content and focus");
result.ordinary = true;
`,
  );
  return { result, build };
}

export async function verifyStyledNavigationComposition(consumer: DistConsumer) {
  const { build, ...result } = await verifyNavigationMenuFixture(
    consumer,
    {
      "Case.svelte": navigationMenuCaseSource(true),
      "ForwardButton.svelte":
        '<script lang="ts">import type { ButtonChildPayload } from "@starwind-ui/svelte/navigation-menu";let {props,children}:ButtonChildPayload=$props();</script><button {...props}>{@render children?.()}</button>',
      "App.svelte":
        '<script lang="ts">import Case from "./Case.svelte";const cases:Record<string,any>={};export function getCases(){return cases;}</script><Case id="body" mode="bound" value={null} bind:this={cases.body}/><Case id="cancel" value={null} proposal="cancel" bind:this={cases.cancel}/>',
    },
    navigationHelpers +
      `
click(trigger("body")); await finish();
assert(state("body").model === "a" && accepted("body") === "a", "Styled Root publishes its accepted value");
const owner = cases.body, content = panel("body"), staleTrigger = trigger("body");
assert(portal("body").parentElement === document.body && viewport("body").contains(content), "Root composes a body portal and moves live Content");
cases.body.updateContent(); await finish();
assert(content.textContent.includes("Updated content"), "Content stays reactive inside the composed viewport");
cases.body.modeChild("component"); await finish();
cases.body.setModel(null); await finish(); click(trigger("body")); await finish();
assert(accepted("body") === "a", "Styled Trigger forwards a component child");
cases.body.place("#portal-b"); await finish();
assert(portal("body").parentElement.id === "portal-b", "Root forwards a changed portal target");
cases.body.setModel(null); await finish();
click(trigger("cancel")); await finish();
assert(accepted("cancel") === null && state("cancel").callbacks.length === 1, "Styled Root forwards cancellation");
result.composition = true;
`,
    `
assert(owner.content() === null && !content.isConnected, "composed Content releases its ref and DOM");
const before = owner.snapshot().callbacks.length; click(staleTrigger); await settle();
assert(owner.snapshot().callbacks.length === before, "retired child cannot publish");
const attachments = owner.snapshot().attachments;
assert(attachments.filter(item => item.includes(":start")).length === attachments.filter(item => item.includes(":end")).length, "composed Trigger releases every attachment");
`,
  );
  return { result, build };
}

/** Run the navigation ownership cases through consumer-local compilation and SSR. */
export async function verifyNavigationMenuFixture(
  consumer: DistConsumer,
  files: Record<string, string>,
  actions: string,
  afterUnmount = "",
) {
  await consumer.write({
    ...files,
    "build-browser.mjs": createBrowserBuildScript(true),
    "ssr.mjs":
      'import { render } from "svelte/server"; import App from "./App.svelte"; console.log(JSON.stringify({body:render(App).body}));',
    "hydrate-main.js": `import { hydrate, unmount, tick, flushSync } from "svelte"; import App from "./App.svelte";
const assert=(condition,message)=>{if(!condition)throw new Error(message)};
const wait=ms=>new Promise(resolve=>setTimeout(resolve,ms));
const settle=async()=>{flushSync();await tick();await wait(30);flushSync();};
const finish=async()=>{await settle();await wait(150);};
try {
const target=document.getElementById("app"),ssr=target.innerHTML;
const app=hydrate(App,{target});
assert(target.innerHTML===ssr,"hydration preserves first markup before effects");
await finish();
let result={};
${actions}
await unmount(app);await finish();
assert(!document.querySelector("[data-sw-nav-menu-content]"),"unmount releases moved Content");
assert(!document.querySelector("[data-sw-nav-menu-portal]"),"unmount releases the Portal");
${afterUnmount}
document.documentElement.dataset.navigationResult=JSON.stringify({...result,complete:true,hydrationExact:true,teardown:true});
}catch(error){document.documentElement.dataset.navigationResult=JSON.stringify({error:error.message,stack:error.stack});}`,
  });
  const first = JSON.parse(await consumer.run("ssr.mjs", { loader: true }));
  assert.equal((await consumer.run("ssr.mjs", { loader: true })).trim(), JSON.stringify(first));
  const build = JSON.parse(await consumer.run("build-browser.mjs"));
  const javascript = await readFile(`${consumer.root}/browser.js`);
  const server = createServer((request, response) => {
    if (request.url === "/browser.js") {
      response.setHeader("Content-Type", "text/javascript");
      response.end(javascript);
    } else {
      response.setHeader("Content-Type", "text/html");
      response.end(
        `<link rel="icon" href="data:,"><style>[data-sw-nav-menu-content]{transition:opacity 100ms;padding:8px;background:white;}[data-sw-nav-menu-content][data-state=closed]{opacity:0}[data-sw-nav-menu-content][data-state=open]{opacity:1}[data-sw-nav-menu-popup]{background:white;padding:8px;}[data-sw-nav-menu-trigger]{margin:4px}</style><button id="outside">Outside</button><div id="app">${first.body}</div><div id="portal-a"></div><div id="portal-b"></div><script type="module" src="/browser.js"></script>`,
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
    await page.waitForFunction(() => document.documentElement.dataset.navigationResult, undefined, {
      timeout: 60_000,
    });
    const result = await page.evaluate(() =>
      JSON.parse(document.documentElement.dataset.navigationResult!),
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
