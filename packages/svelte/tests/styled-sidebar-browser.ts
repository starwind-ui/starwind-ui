import assert from "node:assert/strict";
import { once } from "node:events";
import { readFile } from "node:fs/promises";
import { createServer } from "node:http";
import { chromium } from "playwright";
import { createBrowserBuildScript } from "./compatibility-hydration.js";
import type { DistConsumer } from "./dist-consumer.js";

export async function verifyStyledSidebar(consumer: DistConsumer) {
  await consumer.write({
    "App.svelte": APP,
    "hydrate-main.js": CLIENT,
    "build-browser.mjs": createBrowserBuildScript(true),
    "ssr.mjs": `import assert from "node:assert/strict";import {render} from "svelte/server";import App from "./App.svelte";import S,* as named from "./sidebar/index.js";assert.equal(globalThis.document,undefined);assert.equal(Object.keys(S).length,23);assert.equal(typeof named.SidebarVariants.sidebarMenuButton,"function");const body=render(App).body;assert.equal(render(App).body,body);console.log(JSON.stringify({body}));`,
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
    await page.waitForFunction(() => Boolean((window as any).runStyledSidebar));
    await page.evaluate(() => (window as any).runStyledSidebar("desktop"));
    await page.setViewportSize({ width: 390, height: 900 });
    await page.evaluate(() => (window as any).runStyledSidebar("mobile"));
    await page.setViewportSize({ width: 1200, height: 900 });
    const result = await page.evaluate(() => (window as any).runStyledSidebar("teardown"));
    assert.deepEqual(diagnostics, []);
    return result;
  } finally {
    await browser?.close();
    if (server.listening)
      await new Promise<void>((resolve, reject) =>
        server.close((error) => (error ? reject(error) : resolve())),
      );
  }
}
const APP = `<script lang="ts">
import S from "./sidebar/index.js";import {useSidebarContext} from "@starwind-ui/svelte/sidebar";import {createAttachmentKey,type Attachment} from "svelte/attachments";
let open=$state<boolean|undefined>(true),mobileOpen=$state<boolean|undefined>(false),innerMobile=$state<boolean|undefined>(false),side=$state<"left"|"right">("left"),variant=$state<"sidebar"|"floating"|"inset">("inset"),collapsible=$state<"icon"|"offcanvas"|"none">("icon"),href=$state<string|undefined>(),search=$state<string>();
const events:string[]=[],refs=new Set<HTMLElement>(),attached=new Set<HTMLElement>();const nodes=new Map<string,HTMLElement>();
const ref=(node:HTMLElement|null)=>{if(node)refs.add(node);};const attachment:Attachment<HTMLElement>=node=>{attached.add(node);return()=>attached.delete(node);};const attrs={[createAttachmentKey()]:attachment};
export function command(next:any){if("open"in next)open=next.open;if("mobileOpen"in next)mobileOpen=next.mobileOpen;if("collapsible"in next)collapsible=next.collapsible;if("variant"in next)variant=next.variant;if("side"in next)side=next.side;if("href"in next)href=next.href;}
export function snapshot(){return {open,mobileOpen,innerMobile,search,events:[...events],attached:attached.size,refs:[...refs].filter(node=>node.isConnected).length};}
</script>
{#snippet custom(payload:any)}{#if payload.kind==="anchor"}<a {...payload.props} data-forwarded>{@render payload.children?.()}</a>{:else}<button {...payload.props} data-forwarded>{@render payload.children?.()}</button>{/if}{/snippet}
<S.Root id="main" bind:open bind:mobileOpen persistenceKey="styled-sidebar-main" persistOpen onOpenChange={(next,details)=>events.push("desktop:"+next+":"+details.reason)} onMobileOpenChange={(next,details)=>events.push("mobile:"+next+":"+details.reason)}>
<S.Root id="inner" bind:mobileOpen={innerMobile}><S.Sidebar><S.Menu><S.MenuItem><S.MenuButton href="#inner">Inner page</S.MenuButton></S.MenuItem></S.Menu></S.Sidebar><S.Trigger data-trigger="inner"/></S.Root>
<S.Sidebar {collapsible} {side} {variant} data-surface="outer" {ref} {...attrs}>
<S.Header><S.Input bind:value={search} aria-label="Search workspace"/></S.Header><S.Content><S.Group><S.GroupLabel>Workspace</S.GroupLabel><S.GroupAction aria-label="Add">+</S.GroupAction><S.GroupContent><S.Menu>
<S.MenuItem><S.MenuButton href="#destination" tooltip="Overview" isActive data-overview {...attrs} {ref}>Overview</S.MenuButton><S.MenuAction aria-label="More" showOnHover>...</S.MenuAction><S.MenuBadge>3</S.MenuBadge><S.MenuSub><S.MenuSubItem><S.MenuSubButton href="#nested-page" isActive>Nested page</S.MenuSubButton></S.MenuSubItem></S.MenuSub></S.MenuItem>
<S.MenuItem><S.MenuButton {href} child={custom} data-custom {...attrs} {ref}>Custom control</S.MenuButton></S.MenuItem></S.Menu></S.GroupContent></S.Group><S.MenuSkeleton showIcon/></S.Content><S.Separator/><S.Footer>Workspace account</S.Footer><S.Rail data-rail/>
</S.Sidebar><S.Inset><S.Trigger data-trigger="outer"/><h1 id="destination">Workspace</h1></S.Inset></S.Root>`;
const CLIENT = `import {hydrate,unmount,flushSync,tick} from "svelte";import App from "./App.svelte";
const assert=(value,message)=>{if(!value)throw new Error(message);};const q=selector=>document.querySelector(selector),root=q("#main"),app=hydrate(App,{target:q("#app")});const settle=async()=>{flushSync();await tick();await new Promise(resolve=>setTimeout(resolve,30));flushSync();};const finish=async()=>{for(let i=0;i<5;i++){await new Promise(requestAnimationFrame);await settle();}};const click=async node=>{assert(node,"missing control");node.click();await finish();};const sidebar=()=>q('[data-surface="outer"]'),surface=()=>sidebar().closest('[data-sw-sidebar]'),sheet=()=>[...q("#main").querySelectorAll('[data-sidebar="mobile"]')].find(node=>node.closest('[data-sw-sidebar-provider]')===q("#main")),popup=()=>sheet().querySelector("dialog"),close=()=>sheet().querySelector('[data-sw-drawer-close]');
const result={hydration:false,layout:false,models:false,children:false,tooltip:false,sheet:false,teardown:false};
window.runStyledSidebar=async phase=>{
await finish();
if(phase==="desktop"){
assert(q("#main")===root&&app.snapshot().events.length===0,"deterministic hydration and silent initial models");result.hydration=true;
assert(surface().dataset.variant==="inset"&&surface().dataset.side==="left"&&surface().querySelector('[data-slot=sidebar-gap]'),"desktop gap/container anatomy");assert(sidebar().querySelector('[data-sidebar=menu-skeleton-text]').getAttribute("style").includes("70%"),"deterministic skeleton");
const native=sidebar().querySelector('[data-overview]');assert(native.tagName==="A"&&native.dataset.active==="true"&&!native.closest("button"),"native active navigation with tooltip");await click(native);assert(location.hash==="#destination","native href navigation");assert(sidebar().querySelector('[data-custom]').tagName==="BUTTON","absent href button child");app.command({href:""});await settle();assert(sidebar().querySelector('[data-custom]').tagName==="A","empty href selects anchor child");app.command({href:"#forwarded"});await settle();await click(sidebar().querySelector('[data-custom]'));assert(location.hash==="#forwarded"&&sidebar().querySelector('[data-custom]').hasAttribute("data-forwarded"),"tagged child forwarding");result.children=true;
await click(q('[data-trigger="outer"]'));assert(!app.snapshot().open&&surface().dataset.collapsible==="icon","accepted collapse and icon state");assert(document.documentElement.dataset.starwindSidebarTooltips==="enabled","Runtime document tooltip state");const trigger=sidebar().querySelector('[data-overview]');trigger.dispatchEvent(new PointerEvent("pointerenter",{pointerType:"mouse"}));await finish();const tooltip=document.querySelector('[data-sw-sidebar-tooltip-content][data-state="open"]');assert(tooltip&&tooltip.textContent.trim()==="Overview"&&trigger.getAttribute("aria-describedby"),"native anchor uses existing Tooltip service");result.tooltip=true;
const count=app.snapshot().events.length;app.command({open:true,variant:"floating",side:"right",collapsible:"offcanvas"});await finish();assert(app.snapshot().events.length===count&&surface().dataset.variant==="floating"&&surface().dataset.side==="right","silent model and variant forwarding");await click(sidebar().querySelector('[data-rail]'));assert(!app.snapshot().open&&surface().dataset.collapsible==="offcanvas","offcanvas rail");app.command({collapsible:"none"});await finish();assert(sidebar().dataset.slot==="sidebar"&&!sidebar().querySelector('[data-slot=sidebar-gap]'),"static none branch");app.command({collapsible:"icon",side:"left",variant:"sidebar",open:true});await finish();result.layout=true;result.models=true;
}else if(phase==="mobile"){
assert(!popup().open,"mobile initially closed");assert(q("#main").querySelector('[data-sidebar="mobile"]')!==sheet(),"nested first-descendant discovery is exercised");await click(q('[data-trigger="outer"]'));assert(app.snapshot().mobileOpen&&popup().open&&!app.snapshot().innerMobile,"owned mobile Sheet bridge contains nested discovery");const before=app.snapshot().events.length;sheet().addEventListener("starwind:open-change",event=>event.preventDefault(),{once:true});await click(close());assert(app.snapshot().mobileOpen&&popup().open,"canceled Sheet request retains accepted model");await click(close());assert(!app.snapshot().mobileOpen&&!popup().open&&app.snapshot().events.length===before,"accepted Sheet output updates Provider silently");app.command({mobileOpen:true});await finish();app.command({mobileOpen:false});flushSync();await tick();app.command({mobileOpen:true});await finish();popup().dispatchEvent(new Event("transitionend"));await finish();assert(app.snapshot().mobileOpen&&popup().open,"newer open survives old close completion");result.sheet=true;
}else{
assert(!app.snapshot().mobileOpen&&!popup().open,"crossing to desktop closes mobile Sheet");app.command({mobileOpen:true});await finish();assert(document.body.hasAttribute("data-sw-scroll-locked"),"Sheet owns active scroll lock");assert(app.snapshot().attached>0&&app.snapshot().refs>0,"native refs and attachments");await unmount(app);await finish();assert(app.snapshot().attached===0&&app.snapshot().refs===0&&!document.body.hasAttribute("data-sw-scroll-locked")&&!document.documentElement.hasAttribute("data-starwind-sidebar-tooltips")&&!q('[data-sw-tooltip]')&&!q(':modal'),"teardown releases Sheet, tooltip and native owners");result.teardown=true;return result;
}
};`;
