import assert from "node:assert/strict";
import { once } from "node:events";
import { readFile } from "node:fs/promises";
import { createServer } from "node:http";
import { chromium } from "playwright";
import { createBrowserBuildScript } from "./compatibility-hydration.js";
import type { DistConsumer } from "./dist-consumer.js";

export async function verifySidebarLifecycle(consumer: DistConsumer) {
  await consumer.write({
    "Case.svelte": CASE,
    "App.svelte": APP,
    "Probe.svelte": PROBE,
    "Bridge.svelte": BRIDGE,
    "Nested.svelte": NESTED,
    "ForwardAnchor.svelte": FORWARD_ANCHOR,
    "storage.js": STORAGE,
    "hydrate-main.js": CLIENT,
    "build-browser.mjs": createBrowserBuildScript(true),
    "ssr.mjs": `import assert from "node:assert/strict";import {render} from "svelte/server";import App from "./App.svelte";import {accesses} from "./storage.js";import Sidebar,* as named from "@starwind-ui/svelte/sidebar";import * as root from "@starwind-ui/svelte";assert.equal(globalThis.document,undefined);assert.equal(Sidebar,named.Sidebar);assert.equal(Object.keys(Sidebar).length,5);for(const name of ["SidebarProvider","SidebarComponent","SidebarTrigger","SidebarRail","SidebarMenuButton","SidebarContext","useSidebarContext"])assert.equal(named[name],root[name]);const body=render(App).body;assert.equal(render(App).body,body);assert.equal(accesses.length,0);assert.match(body,/data-model="bound">undefined\\|undefined/);console.log(JSON.stringify({body}));`,
  });
  const { body } = JSON.parse(await consumer.run("ssr.mjs", { loader: true }));
  await consumer.run("build-browser.mjs");
  const javascript = await readFile(`${consumer.root}/browser.js`);
  const server = createServer((request, response) => {
    if (request.url === "/browser.js") {
      response.setHeader("Content-Type", "text/javascript");
      response.end(javascript);
    } else {
      response.setHeader("Content-Type", "text/html");
      response.end(
        `<link rel="icon" href="data:,"><button id="outside">Outside</button><div id="app">${body}</div><script type="module" src="/browser.js"></script>`,
      );
    }
  });
  let browser;
  try {
    server.listen(0, "127.0.0.1");
    await once(server, "listening");
    const address = server.address();
    assert.ok(address && typeof address !== "string");
    browser = await chromium.launch({ channel: "chrome", headless: true });
    const page = await browser.newPage();
    const diagnostics: string[] = [];
    page.on("pageerror", (error) => diagnostics.push(error.message));
    page.on("console", (message) => {
      if (["warning", "error"].includes(message.type())) diagnostics.push(message.text());
    });
    await page.goto(`http://127.0.0.1:${address.port}`);
    await page.waitForFunction(() => document.documentElement.dataset.sidebarResult, undefined, {
      timeout: 30_000,
    });
    const result = await page.evaluate(() =>
      JSON.parse(document.documentElement.dataset.sidebarResult!),
    );
    assert.deepEqual(diagnostics, [], result.error);
    assert.equal(result.error, undefined, result.error);
    return result;
  } finally {
    await browser?.close();
    if (server.listening)
      await new Promise<void>((resolve, reject) =>
        server.close((error) => (error ? reject(error) : resolve())),
      );
  }
}
const STORAGE = `export const accesses=[];export const values=new Map([["stored","false"],["plain","true"],["func","false"],["invalid","invalid"]]);export const storage={getItem(key){if(typeof document==="undefined")throw new Error("SSR storage read");accesses.push(["get",key]);return values.get(key)??null;},setItem(key,value){if(typeof document==="undefined")throw new Error("SSR storage write");accesses.push(["set",key,value]);values.set(key,value);},removeItem(key){values.delete(key);},clear(){values.clear();},key(index){return [...values.keys()][index]??null;},get length(){return values.size;}};export const unavailable={...storage,getItem(){throw new Error("unavailable");},setItem(){throw new Error("unavailable");}};`;
const PROBE = `<script lang="ts">import {useSidebarContext} from "@starwind-ui/svelte/sidebar";let {id}:{id:string}=$props();const context=useSidebarContext();export function snapshot(){return {open:context.open,mobileOpen:context.mobileOpen,state:context.state,expanded:context.expanded,isMobile:context.isMobile};}export function acceptMobile(next:boolean){context.setMobileOpen(next);}</script><output data-context={id}>{context.state}|{String(context.mobileOpen)}|{String(context.expanded)}</output>`;
const FORWARD_ANCHOR = `<script lang="ts">import type {Snippet} from "svelte";import type {AnchorChildProps} from "@starwind-ui/svelte/sidebar";let {children,...props}:AnchorChildProps&{children?:Snippet}=$props();</script><a {...props}>{@render children?.()}</a>`;
const CASE = `<script lang="ts">
import {flushSync,untrack} from "svelte";import {createAttachmentKey,type Attachment} from "svelte/attachments";
import Sidebar,{type SidebarMenuButtonChildPayload,type SidebarPersistenceStorage} from "@starwind-ui/svelte/sidebar";import {createSidebarController} from "@starwind-ui/runtime/sidebar";
import Probe from "./Probe.svelte";import ForwardAnchor from "./ForwardAnchor.svelte";import {storage,unavailable} from "./storage.js";
let {id,mode="bound",initialOpen,initialMobile,initialHref,initialChild=false,defaultOpen=true,persist=false,storageMode="supplied"}:{id:string;mode?:string;initialOpen?:boolean;initialMobile?:boolean;initialHref?:string;initialChild?:boolean;defaultOpen?:boolean;persist?:boolean;storageMode?:string}=$props();
let open=$state<boolean|undefined>(untrack(()=>initialOpen)),mobileOpen=$state<boolean|undefined>(untrack(()=>initialMobile)),seed=$state(untrack(()=>defaultOpen));
let key=$state(untrack(()=>id)),persistOpen=$state(untrack(()=>persist)),persistenceStorage=$state.raw<SidebarPersistenceStorage>(untrack(()=>storageMode==="supplied"?storage:storageMode==="unavailable"?unavailable:storageMode==="disabled"?false:storageMode as "cookie"|"localStorage"));
let query=$state("desktop"),shortcut=$state("b"),maxAge=$state(604800),href=$state<string|undefined>(untrack(()=>initialHref)),child=$state(untrack(()=>initialChild)),partKey=$state(0),showParts=$state(true),callbackVersion=$state(0),newRef=$state(false),attachmentRead=$state(0),secondAttachment=$state(true);
let provider:HTMLDivElement|null=null,probe:Probe;let transform="accept",command:boolean|undefined,commandMobile:boolean|undefined;
const events:any[]=[],writes:any[]=[],refs:string[]=[],attachments:string[]=[],clicks:string[]=[];
const refA=(node:HTMLButtonElement|HTMLAnchorElement|null)=>refs.push("a:"+(node?.tagName??"null")),refB=(node:HTMLButtonElement|HTMLAnchorElement|null)=>refs.push("b:"+(node?.tagName??"null"));
const keyA=createAttachmentKey(),keyB=createAttachmentKey();const attachmentA:Attachment<HTMLElement>=(node)=>{const read=attachmentRead;attachments.push("a:"+read+":"+node.tagName+":on");return()=>attachments.push("a:"+read+":"+node.tagName+":off");};const attachmentB:Attachment<HTMLElement>=(node)=>{attachments.push("b:"+node.tagName+":on");return()=>attachments.push("b:"+node.tagName+":off");};
let attrs=$derived({[keyA]:attachmentA,...(secondAttachment?{[keyB]:attachmentB}:{})});
function writeOpen(next:boolean|undefined){writes.push(["open",next]);if(transform!=="retain")open=next;}
function writeMobile(next:boolean|undefined){writes.push(["mobile",next]);if(transform!=="retain")mobileOpen=next;}
function notify(next:boolean,details:any,mobile:boolean,version:number){events.push({next,mobile,reason:details.reason,version,cancel:"cancel" in details,accepted:mobile?createSidebarController(provider!).getMobileOpen():createSidebarController(provider!).getOpen()});if(command!==undefined||commandMobile!==undefined)flushSync(()=>{if(command!==undefined)open=command;if(commandMobile!==undefined)mobileOpen=commandMobile;});}
let onOpen=$derived((next:boolean,details:any)=>notify(next,details,false,callbackVersion)),onMobile=$derived((next:boolean,details:any)=>notify(next,details,true,callbackVersion));
let common=$derived({id,defaultOpen:seed,defaultMobileOpen:false,persistOpen,persistenceKey:key,persistenceStorage,persistenceMaxAge:maxAge,mobileQuery:query,keyboardShortcut:shortcut,onOpenChange:onOpen,onMobileOpenChange:onMobile,ref:(node:HTMLDivElement|null)=>{provider=node;}});
export function configure(options:any){if("open"in options)open=options.open;if("mobileOpen"in options)mobileOpen=options.mobileOpen;if("defaultOpen"in options)seed=options.defaultOpen;if("key"in options)key=options.key;if("storage"in options)persistenceStorage=options.storage;if("persist"in options)persistOpen=options.persist;if("query"in options)query=options.query;if("shortcut"in options)shortcut=options.shortcut;if("maxAge"in options)maxAge=options.maxAge;if("href"in options)href=options.href;if("child"in options)child=options.child;if("parts"in options)showParts=options.parts;if(options.replace)partKey++;if(options.callback)callbackVersion++;if(options.ref)newRef=true;if(options.attachment)attachmentRead++;if("secondAttachment"in options)secondAttachment=options.secondAttachment;if("transform"in options)transform=options.transform;if("command"in options)command=options.command;if("commandMobile"in options)commandMobile=options.commandMobile;}
export function acceptMobile(next:boolean){probe.acceptMobile(next);}
export function snapshot(){return {provider,open,mobileOpen,context:probe?.snapshot(),events:[...events],writes:[...writes],refs:[...refs],attachments:[...attachments],clicks:[...clicks]};}
</script>
{#snippet menuChild(payload:SidebarMenuButtonChildPayload)}{#if payload.kind==="button"}<button {...payload.props}>{@render payload.children?.()}</button>{:else}<ForwardAnchor {...payload.props}>{@render payload.children?.()}</ForwardAnchor>{/if}{/snippet}
{#snippet parts()}<Probe {id} bind:this={probe}/>{#if showParts}{#key partKey}<Sidebar.Sidebar collapsible="icon"><Sidebar.Trigger data-trigger={id}>{#snippet child({props,children})}<button {...props}>{@render children?.()}</button>{/snippet}Toggle {id}</Sidebar.Trigger><Sidebar.Rail data-rail={id} aria-label="Toggle sidebar"/><Sidebar.MenuButton {href} child={child?menuChild:undefined} data-menu={id} ref={newRef?refB:refA} {...attrs} onclick={event=>{clicks.push(event.currentTarget.tagName);if(href==="")event.preventDefault();}}>Destination</Sidebar.MenuButton></Sidebar.Sidebar>{/key}{/if}{/snippet}
{#if mode==="plain"}<Sidebar.Provider {...common} {open} {mobileOpen} children={parts}/>{:else if mode==="omitted"}<Sidebar.Provider {...common} children={parts}/>{:else if mode==="function"}<Sidebar.Provider {...common} bind:open={()=>open,writeOpen} bind:mobileOpen={()=>mobileOpen,writeMobile} children={parts}/>{:else}<Sidebar.Provider {...common} bind:open bind:mobileOpen children={parts}/>{/if}
<output data-model={id}>{open===undefined?"undefined":String(open)}|{mobileOpen===undefined?"undefined":String(mobileOpen)}</output>`;
const BRIDGE = `<script lang="ts">
import {createAttachmentKey,type Attachment} from "svelte/attachments";import {useSidebarContext} from "@starwind-ui/svelte/sidebar";import Sheet from "./sheet/index.js";
let {id}:{id:string}=$props();const context=useSidebarContext();let cancel=$state(false);const requests:any[]=[],completions:any[]=[];let commands=0;
const bridge:Attachment<HTMLDivElement>=(root)=>{
  // Provider commands reach Sheet as defined model inputs. Runtime sends discovery commands only to this Provider's Sheet.
  const command=(event:Event)=>{commands++;event.stopImmediatePropagation();};
  // Sheet's DOM event is a cancelable proposal. Only its accepted binding output reaches Provider.
  const proposal=(event:Event)=>event.stopPropagation();
  root.addEventListener("dialog:open",command,true);root.addEventListener("dialog:close",command,true);root.addEventListener("starwind:open-change",proposal);
  return()=>{root.removeEventListener("dialog:open",command,true);root.removeEventListener("dialog:close",command,true);root.removeEventListener("starwind:open-change",proposal);};
};
const bridgeProps={[createAttachmentKey()]:bridge};
export function setCancel(next:boolean){cancel=next;}export function snapshot(){return {requests:[...requests],completions:[...completions],commands};}
</script>
<Sheet.Root data-sidebar="mobile" data-sheet={id} {...bridgeProps} bind:open={()=>context.mobileOpen,next=>{if(next!==undefined)context.setMobileOpen(next);}} onOpenChange={(next,detail)=>{requests.push({next,reason:detail.reason});if(cancel)detail.cancel();}} onCloseComplete={()=>completions.push(context.mobileOpen)}>
<Sheet.Content data-popup={id}><Sheet.Title>Navigation {id}</Sheet.Title><Sheet.Description>Sidebar actions</Sheet.Description><Sheet.Close data-sheet-close={id}>Close</Sheet.Close></Sheet.Content>
</Sheet.Root>`;
const NESTED = `<script lang="ts">import Sidebar from "@starwind-ui/svelte/sidebar";import Probe from "./Probe.svelte";import Bridge from "./Bridge.svelte";let outerOpen=$state<boolean|undefined>(true),outerMobile=$state<boolean|undefined>(false),innerOpen=$state<boolean|undefined>(false),innerMobile=$state<boolean|undefined>(false);let outer:Probe,inner:Probe,outerSheet:Bridge,innerSheet:Bridge;const events:string[]=[];export function command(next:boolean){outerMobile=next;}export function snapshot(){return {outer:outer.snapshot(),inner:inner.snapshot(),events:[...events],outerSheet:outerSheet.snapshot(),innerSheet:innerSheet.snapshot()};}export function cancel(next:boolean){outerSheet.setCancel(next);}</script>
<Sidebar.Provider id="outer" mobileQuery="mobile" bind:open={outerOpen} bind:mobileOpen={outerMobile} onMobileOpenChange={()=>events.push("outer")}><Probe id="outer" bind:this={outer}/><Sidebar.Sidebar/><Sidebar.Trigger data-trigger="outer">Outer</Sidebar.Trigger>
<Sidebar.Provider id="inner" mobileQuery="mobile" bind:open={innerOpen} bind:mobileOpen={innerMobile} onMobileOpenChange={()=>events.push("inner")}><Probe id="inner" bind:this={inner}/><Sidebar.Sidebar/><Sidebar.Trigger data-trigger="inner">Inner</Sidebar.Trigger><Bridge id="inner" bind:this={innerSheet}/></Sidebar.Provider>
<Bridge id="outer" bind:this={outerSheet}/></Sidebar.Provider>`;
const APP = `<script lang="ts">import Case from "./Case.svelte";import Nested from "./Nested.svelte";const cases:any={};let nested:Nested;export function get(id:string){return cases[id];}export function getNested(){return nested;}</script>
<Case id="bound" bind:this={cases.bound}/><Case id="plain" mode="plain" initialOpen={false} initialMobile persist bind:this={cases.plain}/><Case id="omitted" mode="omitted" bind:this={cases.omitted}/><Case id="func" mode="function" persist bind:this={cases.func}/><Case id="stored" persist bind:this={cases.stored}/><Case id="invalid" persist defaultOpen={false} bind:this={cases.invalid}/><Case id="unavailable" persist storageMode="unavailable" bind:this={cases.unavailable}/><Case id="disabled" persist storageMode="disabled" bind:this={cases.disabled}/><Case id="local" persist storageMode="localStorage" bind:this={cases.local}/><Case id="cookie" persist storageMode="cookie" bind:this={cases.cookie}/><Case id="custom-anchor" initialHref="#custom" initialChild bind:this={cases.customAnchor}/><Case id="custom-button" initialChild bind:this={cases.customButton}/><Nested bind:this={nested}/>`;
const CLIENT = `import {hydrate,unmount,flushSync,tick} from "svelte";import {createSidebarController} from "@starwind-ui/runtime/sidebar";import App from "./App.svelte";import {accesses,values,storage} from "./storage.js";
const assert=(value,message)=>{if(!value)throw new Error(message);};
const settle=async()=>{flushSync();await tick();await new Promise(resolve=>setTimeout(resolve,15));flushSync();};
const finish=async()=>{for(let i=0;i<5;i++){await new Promise(requestAnimationFrame);await settle();}};
const originalMedia=window.matchMedia,queries=new Map([["mobile",true]]),lists=[];
class Query extends EventTarget{constructor(query){super();this.media=query;this.matches=queries.get(query)??false;this.listeners=new Set();}addEventListener(type,listener,options){super.addEventListener(type,listener,options);if(type==="change")this.listeners.add(listener);}removeEventListener(type,listener,options){super.removeEventListener(type,listener,options);if(type==="change")this.listeners.delete(listener);}addListener(listener){this.addEventListener("change",listener);}removeListener(listener){this.removeEventListener("change",listener);}}
window.matchMedia=(query)=>{const list=new Query(query);lists.push(list);return list;};
const media=(query,matches)=>{queries.set(query,matches);for(const list of lists.filter(list=>list.media===query)){if(list.matches!==matches){list.matches=matches;list.dispatchEvent(new Event("change"));}}};
const listeners=query=>lists.filter(list=>query===undefined||list.media===query).reduce((sum,list)=>sum+list.listeners.size,0);
localStorage.setItem("local","false");document.cookie="cookie=false; path=/";
const target=document.getElementById("app"),before=[...target.querySelectorAll("[data-sw-part]")];let app;
try{
 app=hydrate(App,{target});assert(before.every(node=>target.contains(node)),"hydration preserves SSR owners");await finish();
 const result={},c=id=>app.get(id),s=id=>c(id).snapshot(),api=id=>createSidebarController(s(id).provider),trigger=id=>document.querySelector('[data-trigger="'+id+'"]'),menu=id=>document.querySelector('[data-menu="'+id+'"]');
 assert(s("bound").open===true&&s("bound").mobileOpen===false,"undefined models publish defaults");assert(!s("stored").open&&!s("local").open&&!s("cookie").open,"stored desktop state is adopted on initial undefined open");assert(!api("plain").getOpen()&&api("plain").getMobileOpen(),"defined models override storage and defaults");assert(!s("invalid").open&&s("unavailable").open&&s("disabled").open,"invalid unavailable and disabled persistence use defaults");assert(!accesses.some(entry=>entry[1]==="disabled"),"disabled persistence has no storage work");const customAnchor=c("customAnchor"),customButton=c("customButton");assert(customAnchor.snapshot().refs.includes("a:A")&&customButton.snapshot().refs.includes("a:BUTTON"),"custom anchor and button receive their initial public refs");
 trigger("plain").click();await settle();assert(api("plain").getOpen()&&!s("plain").open,"plain model permits local acceptance");trigger("omitted").click();await settle();assert(!api("omitted").getOpen(),"omitted models accept interaction");
 c("bound").configure({open:false,mobileOpen:true});await settle();assert(!api("bound").getOpen()&&api("bound").getMobileOpen()&&s("bound").events.length===0,"independent silent commands");c("bound").configure({open:undefined,mobileOpen:undefined});await settle();assert(!api("bound").getOpen()&&api("bound").getMobileOpen(),"undefined retains both accepted models");trigger("bound").click();await settle();assert(s("bound").open&&s("bound").events.at(-1).accepted===true&&!s("bound").events.at(-1).cancel,"notification follows Runtime commit without cancellation");
 c("bound").configure({mobileOpen:false});await settle();c("bound").configure({open:undefined});await settle();const ordinaryBefore=api("bound").getOpen();trigger("bound").click();await settle();assert(api("bound").getOpen()!==ordinaryBefore,"ordinary desktop trigger toggles");
 const func=c("func");func.configure({transform:"accept",open:true,mobileOpen:true});await settle();const oldController=api("func");values.set("recreated","false");func.configure({key:"recreated",maxAge:60,defaultOpen:false});await settle();assert(api("func")!==oldController&&!api("func").getOpen()&&api("func").getMobileOpen(),"option reconstruction reads persistence");assert(values.get("recreated")==="false"&&accesses.some(entry=>entry[0]==="get"&&entry[1]==="recreated"),"Runtime owns persistence");
 func.configure({open:false});await settle();func.acceptMobile(false);await settle();assert(!api("func").getOpen()&&!api("func").getMobileOpen(),"ordinary parent and Sheet commands apply");result.models=true;result.persistence=true;

 const oldListeners=listeners("desktop");c("bound").configure({query:"narrow",mobileOpen:false});await settle();assert(listeners("desktop")===oldListeners-2&&listeners("narrow")===2,"query replacement releases old listeners");media("narrow",true);await settle();assert(s("bound").context.isMobile&&!s("bound").context.expanded,"context mirrors effective mobile expansion");const desktop=api("bound").getOpen();trigger("bound").click();await settle();assert(s("bound").context.expanded&&api("bound").getOpen()===desktop&&s("bound").mobileOpen,"mobile toggle retains desktop model");media("narrow",false);await settle();assert(!s("bound").mobileOpen&&!s("bound").context.isMobile,"Runtime resize closes mobile state");c("bound").configure({shortcut:"x"});await settle();const beforeKey=api("bound").getOpen();trigger("bound").focus();document.dispatchEvent(new KeyboardEvent("keydown",{key:"x",ctrlKey:true,bubbles:true}));await settle();assert(api("bound").getOpen()!==beforeKey,"constructor shortcut option reaches Runtime");result.media=true;

 const initialMenu=menu("bound");assert(initialMenu.tagName==="BUTTON"&&initialMenu.type==="button","absent href selects native button");initialMenu.click();await settle();assert(s("bound").clicks.at(-1)==="BUTTON","button handler forwards once");c("bound").configure({href:""});await settle();assert(menu("bound").tagName==="A"&&menu("bound").getAttribute("href")===""&&!initialMenu.isConnected,"defined empty href selects anchor and releases button");menu("bound").click();await settle();assert(s("bound").clicks.join(",")==="BUTTON,A","empty anchor retains native handler");c("bound").configure({href:"#destination",child:true});await settle();assert(menu("bound").tagName==="A","tagged child forwards to native anchor component");menu("bound").click();await settle();assert(location.hash==="#destination"&&s("bound").clicks.join(",")==="BUTTON,A,A","nonempty link preserves navigation and one handler");const stableMenu=menu("bound");c("bound").configure({open:!api("bound").getOpen()});await settle();assert(menu("bound")===stableMenu&&s("bound").refs.includes("a:A"),"state attributes keep the custom semantic owner and public ref");c("bound").configure({ref:true,attachment:true,secondAttachment:false});await settle();assert(menu("bound").tagName==="A","ref update retains anchor owner");assert(s("bound").attachments.includes("a:1:A:on")&&s("bound").attachments.includes("b:A:off"),"forwarded attachments update independently");c("bound").configure({href:undefined});await settle();assert(menu("bound").tagName==="BUTTON","tagged payload follows selected button element");document.querySelector('[data-rail="bound"]').click();await settle();assert(s("bound").events.at(-1).reason==="rail-click","native rail reaches nearest controller");result.children=true;

 const nested=app.getNested(),sheet=id=>document.querySelector('[data-sheet="'+id+'"]'),popup=id=>document.querySelector('[data-popup="'+id+'"]'),close=id=>document.querySelector('[data-sheet-close="'+id+'"]');
 assert(document.getElementById("outer").querySelector('[data-sidebar="mobile"]')===sheet("inner"),"fixture exercises first-descendant discovery through nested Provider");assert(sheet("outer").dataset.slot==="sheet"&&sheet("outer").dataset.sidebar==="mobile","stock Sheet retains its mobile discovery hook");trigger("outer").click();await finish();assert(nested.snapshot().outer.mobileOpen&&popup("outer").open&&!nested.snapshot().inner.mobileOpen&&!popup("inner").open&&nested.snapshot().innerSheet.commands===0&&nested.snapshot().outerSheet.commands>0,"Runtime discovery commands reach only the owned Sheet bridge");assert(nested.snapshot().outerSheet.requests.length===0,"Provider command is a silent defined Sheet input");trigger("inner").click();await finish();assert(nested.snapshot().inner.mobileOpen&&nested.snapshot().outer.mobileOpen&&popup("inner").open,"nearest nested mobile controls");close("inner").click();await finish();assert(!nested.snapshot().inner.mobileOpen&&nested.snapshot().outer.mobileOpen&&!popup("inner").open&&popup("outer").open,"accepted inner Sheet close retains outer state");
 nested.cancel(true);close("outer").click();await finish();assert(nested.snapshot().outer.mobileOpen&&popup("outer").open,"canceled Sheet callback preserves Provider");nested.cancel(false);sheet("outer").addEventListener("starwind:open-change",event=>event.preventDefault(),{once:true});close("outer").click();await finish();assert(nested.snapshot().outer.mobileOpen&&popup("outer").open,"canceled Sheet DOM proposal preserves Provider");const providerEvents=nested.snapshot().events.length;close("outer").click();await finish();assert(!nested.snapshot().outer.mobileOpen&&!popup("outer").open&&nested.snapshot().events.length===providerEvents,"accepted Sheet close updates Provider silently");assert(nested.snapshot().outerSheet.completions.length>0,"Sheet close completion is observable");nested.command(true);await finish();nested.command(false);flushSync();await tick();nested.command(true);await finish();popup("outer").dispatchEvent(new Event("transitionend"));await finish();assert(nested.snapshot().outer.mobileOpen&&popup("outer").open,"stale close completion cannot replace newer Provider command");
 media("mobile",false);await finish();const outerDesktop=nested.snapshot().outer.open;trigger("inner").click();await settle();assert(nested.snapshot().inner.open&&nested.snapshot().outer.open===outerDesktop,"nearest nested desktop controls");trigger("outer").click();await settle();assert(nested.snapshot().outer.open!==outerDesktop&&nested.snapshot().inner.open,"outer desktop control leaves inner state");result.sheet=true;result.nested=true;

 nested.command(true);await finish();assert(document.body.hasAttribute("data-sw-scroll-locked"),"active Sheet owns scroll lock");const old=c("bound"),oldNode=trigger("bound"),oldMenu=menu("bound"),beforeEvents=old.snapshot().events.length;await unmount(app);await finish();const accessCount=accesses.length;oldNode.click();oldMenu.click();document.dispatchEvent(new KeyboardEvent("keydown",{key:"b",ctrlKey:true,bubbles:true}));media("narrow",true);await settle();assert(!target.querySelector("[data-sw-sidebar-provider]")&&!document.querySelector(":modal")&&!document.body.hasAttribute("data-sw-scroll-locked")&&!document.documentElement.hasAttribute("data-starwind-sidebar-tooltips"),"teardown releases providers Sheet and tooltip state");assert(listeners()===0&&accesses.length===accessCount&&old.snapshot().events.length===beforeEvents,"teardown releases media keyboard and accepted subscriptions");const balancedRefs=entry=>entry.refs.filter(item=>!item.endsWith("null")).length===entry.refs.filter(item=>item.endsWith("null")).length,final=old.snapshot();assert(balancedRefs(final)&&balancedRefs(customAnchor.snapshot())&&balancedRefs(customButton.snapshot()),"built-in and custom semantic owners clean up public refs");assert(final.attachments.filter(item=>item.endsWith(":on")).length===final.attachments.filter(item=>item.endsWith(":off")).length,"balanced forwarded attachments");result.teardown=true;document.documentElement.dataset.sidebarResult=JSON.stringify(result);
}catch(error){if(app)await unmount(app);document.documentElement.dataset.sidebarResult=JSON.stringify({error:error.stack??String(error)});}finally{window.matchMedia=originalMedia;}`;
