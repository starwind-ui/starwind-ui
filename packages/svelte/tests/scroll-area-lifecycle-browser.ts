import assert from "node:assert/strict";
import { once } from "node:events";
import { readFile } from "node:fs/promises";
import { createServer } from "node:http";
import path from "node:path";
import { chromium } from "playwright";
import type { DistConsumer } from "./dist-consumer.js";
import { BROWSER_BUILD } from "./compatibility-hydration.js";

export async function verifyScrollAreaLifecycle(consumer: DistConsumer) {
  await consumer.write({
    "ScrollAreaLifecycle.svelte": APP,
    "hydrate-main.js": CLIENT,
    "build-scroll-area.mjs": BROWSER_BUILD,
    "scroll-area-ssr.mjs": `import assert from "node:assert/strict";import {render} from "svelte/server";import App from "./ScrollAreaLifecycle.svelte";import ScrollArea,* as named from "./scroll-area/index.js";
assert.equal(globalThis.document,undefined);assert.equal(ScrollArea.Root,named.ScrollArea);const body=render(App).body;assert.equal(body,render(App).body);console.log(JSON.stringify({body}));`,
  });
  const { body } = JSON.parse(await consumer.run("scroll-area-ssr.mjs", { loader: true }));
  assert.match(body, /data-sw-scroll-area-viewport/);
  assert.match(body, /overflow:scroll!important/);
  assert.match(body, /tabindex="-1"/);
  assert.match(body, /data-orientation="horizontal"/);
  assert.doesNotMatch(body, /\[object Object\]/);
  const build = JSON.parse(await consumer.run("build-scroll-area.mjs"));
  const javascript = await readFile(path.join(consumer.root, "browser.js"));
  const css = await readFile(path.join(consumer.root, "browser.css"), "utf8");
  const server = createServer((request, response) => {
    if (request.url === "/browser.js") {
      response.setHeader("Content-Type", "text/javascript");
      response.end(javascript);
    } else {
      response.setHeader("Content-Type", "text/html");
      response.end(
        `<link rel="icon" href="data:,"><style>${css}</style><div id="app">${body}</div><script type="module" src="/browser.js"></script>`,
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
    await page.waitForFunction(() => document.documentElement.dataset.scrollAreaResult, undefined, {
      timeout: 30000,
    });
    const result = await page.evaluate(() =>
      JSON.parse(document.documentElement.dataset.scrollAreaResult!),
    );
    assert.deepEqual(diagnostics, []);
    assert.equal(result.error, undefined, JSON.stringify(result));
    for (const name of [
      "hydrationExact",
      "thresholds",
      "geometry",
      "input",
      "structure",
      "nativeOwnership",
      "styled",
      "cleanup",
    ])
      assert.equal(result[name], true, name);
    return { result, build };
  } finally {
    await browser?.close();
    await new Promise<void>((resolve, reject) =>
      server.close((error) => (error ? reject(error) : resolve())),
    );
  }
}

const APP = `<script lang="ts">
import Primitive, { type ScrollAreaOverflowEdgeThreshold } from "@starwind-ui/svelte/scroll-area";
import Styled from "./scroll-area/index.js";
import { createAttachmentKey, type Attachment } from "svelte/attachments";
let threshold = $state<ScrollAreaOverflowEdgeThreshold | undefined>(0);
let width = $state(600), height = $state(500), viewportKey = $state(0), barKey = $state(0), thumbKey = $state(0), contentKey = $state(0);
let showViewport = $state(true);
let viewportStyle = $state("width:200px;height:150px;overflow:hidden!important"), presentation = $state("initial");
let auto = $state(true), customBar = $state(false), dependency = $state(0), refVersion = $state(0), attachmentVersion = $state(0);
const refs = new Map<string, HTMLElement>(), attachments = new Map<string, HTMLElement>();
const refLog: string[] = [], attachmentLog: string[] = [];
let runs = 0, clicks = 0;
const ref = (name: string, version = 0) => (node: HTMLDivElement | null) => { if (node) { if(refs.has(name)) throw new Error("duplicate ref"); refs.set(name,node); } else refs.delete(name); refLog.push(name+":"+version+":"+(node?"set":"clear")); };
const attach = (name: string, version = 0): Attachment<HTMLDivElement> => node => { void dependency; runs++; if(attachments.has(name)) throw new Error("duplicate attachment"); attachments.set(name,node); attachmentLog.push(name+":"+version+":set"); return () => { attachments.delete(name); attachmentLog.push(name+":"+version+":clear"); }; };
const attrs = (name: string) => ({ [createAttachmentKey()]: attach(name) });
const vpRef = ref("viewport"), contentRef = ref("content"), barRef = ref("bar"), thumbRef = ref("thumb"), cornerRef = ref("corner"), styledRef = ref("styled");
const vpAttrs = attrs("viewport"), contentAttrs = attrs("content"), barAttrs = attrs("bar"), thumbAttrs = attrs("thumb"), cornerAttrs = attrs("corner"), styledAttrs = attrs("styled");
const key = createAttachmentKey(); let rootRef = $derived(ref("root",refVersion)), rootAttrs = $derived({ [key]: attach("root",attachmentVersion) });
export function setThreshold(next: ScrollAreaOverflowEdgeThreshold | undefined) { threshold = next; }
export function mutateThreshold() { if (typeof threshold === "object") threshold.xEnd = 999; }
export function setSize(w: number, h: number) { width=w; height=h; }
export function replacePart(name: string) { if(name==="viewport") viewportKey++; if(name==="bar") barKey++; if(name==="thumb") thumbKey++; if(name==="content") contentKey++; }
export function setViewport(next: boolean) { showViewport=next; }
export function updatePresentation() { viewportStyle="width:200px;height:150px;background:blue;overflow:hidden!important"; presentation="updated"; }
export function setAuto(next: boolean) { auto=next; }
export function setCustomBar(next: boolean) { customBar=next; }
export function replaceRef() { refVersion++; }
export function replaceAttachment() { attachmentVersion++; }
export function updateDependency() { dependency++; }
export function snapshot() { return { refs: refs.size, attachments: attachments.size, ownersMatch: [...refs].every(([name,node])=>attachments.get(name)===node), runs, clicks, refLog:[...refLog], attachmentLog:[...attachmentLog] }; }
</script>
<Primitive.Root id="scroll-root" overflowEdgeThreshold={threshold} style="position:relative;width:200px;height:150px" class={presentation} ref={rootRef} {...rootAttrs}>
 {#if showViewport}{#key viewportKey}<Primitive.Viewport data-part="viewport" style={viewportStyle} class={presentation} ref={vpRef} {...vpAttrs}>
   {#key contentKey}<Primitive.Content data-part="content" style={"width:"+width+"px;height:"+height+"px"} ref={contentRef} {...contentAttrs}><span>Scrollable content</span></Primitive.Content>{/key}
 </Primitive.Viewport>{/key}{/if}
 {#key barKey}<Primitive.Scrollbar data-part="bar" orientation="vertical" style="position:absolute;right:0;top:0;width:10px;height:150px" ref={barRef} {...barAttrs}>
   {#key thumbKey}<Primitive.Thumb data-part="thumb" style="background:red" ref={thumbRef} {...thumbAttrs} onclick={() => clicks++}/>{/key}
 </Primitive.Scrollbar>{/key}
 <Primitive.Scrollbar data-part="horizontal" orientation="horizontal" style="position:absolute;bottom:0;left:0;width:200px;height:10px"><Primitive.Thumb style="background:green"/></Primitive.Scrollbar>
 <Primitive.Corner data-part="corner" ref={cornerRef} {...cornerAttrs}/>
</Primitive.Root>
<Primitive.Root id="keep-root"><Primitive.Viewport style="width:50px;height:50px"><Primitive.Content style="width:20px;height:20px"/></Primitive.Viewport><Primitive.Scrollbar keepMounted><Primitive.Thumb/></Primitive.Scrollbar></Primitive.Root>
<Primitive.Root id="nested-holder"><Primitive.Viewport style="width:50px;height:50px"><Primitive.Content style="width:20px;height:20px"><Primitive.Root id="nested-scroll"><Primitive.Viewport style="width:20px;height:20px"><Primitive.Content style="width:60px;height:60px"/></Primitive.Viewport><Primitive.Scrollbar><Primitive.Thumb/></Primitive.Scrollbar></Primitive.Root></Primitive.Content></Primitive.Viewport></Primitive.Root>
{#snippet bars()}<Styled.Scrollbar data-part="custom-horizontal" orientation="horizontal" style="width:200px;height:10px"><Styled.Thumb/></Styled.Scrollbar>{/snippet}
<Styled.Root id="styled-scroll" autoViewport={auto} viewportClass="custom-viewport" overflowEdgeThreshold={threshold} scrollbar={customBar ? bars : undefined} style="width:200px;height:150px" ref={styledRef} {...styledAttrs}>
 {#if auto}<div style={"width:"+width+"px;height:"+height+"px"}>Styled auto</div>{:else}<Styled.Viewport data-part="manual-viewport" style="width:200px;height:150px"><Styled.Content style={"width:"+width+"px;height:"+height+"px"}>Manual viewport</Styled.Content></Styled.Viewport>{/if}
</Styled.Root>
`;

const CLIENT = `import { hydrate, flushSync, tick, unmount } from "svelte";
import { createScrollArea } from "@starwind-ui/runtime/scroll-area";
import App from "./ScrollAreaLifecycle.svelte";
const result={}; const assert=(value,message)=>{if(!value)throw new Error(message);};
const pause=ms=>new Promise(resolve=>setTimeout(resolve,ms));
const settle=async()=>{flushSync();await tick();flushSync();await pause(60);};
const target=document.getElementById("app"), root=()=>document.getElementById("scroll-root"), part=name=>root().querySelector('[data-part="'+name+'"]'), styled=()=>document.getElementById("styled-scroll");
const before=[root(),part("viewport"),part("content"),part("bar"),part("thumb"),part("corner"),styled()];
// Svelte retains its document observer; Runtime observers target component elements.
const observers=[];
for(const key of ["ResizeObserver","MutationObserver"]){const Original=window[key];window[key]=class extends Original{constructor(fn){super(fn);this.active=false;observers.push(this);}observe(...args){this.active=true;this.target=args[0];this.kind=key;return super.observe(...args);}disconnect(){this.active=false;return super.disconnect();}};}
const app=hydrate(App,{target});
try {
 await settle();
 result.hydrationExact=before.every((node,index)=>node===[root(),part("viewport"),part("content"),part("bar"),part("thumb"),part("corner"),styled()][index]);
 assert(app.snapshot().refs===7 && app.snapshot().attachments===7 && app.snapshot().ownersMatch,"initial owners");
 assert(part("viewport").style.overflow==="scroll" && part("viewport").tabIndex===0,"viewport semantics");
 for(const name of ["data-has-overflow-x","data-has-overflow-y","data-overflow-x-end","data-overflow-y-end"])assert(root().hasAttribute(name),"initial overflow "+name);
 assert(part("thumb").style.height && part("corner").style.display==="block","geometry");
 assert(!document.querySelector("#keep-root [data-sw-scroll-area-scrollbar]").hidden&&!document.querySelector("#keep-root [data-sw-scroll-area-thumb]").hidden,"initial keepMounted");
 const controller=createScrollArea(root());
 app.setThreshold(999);await settle();assert(!root().hasAttribute("data-overflow-x-end") && !root().hasAttribute("data-overflow-y-end"),"scalar threshold update");
 app.setThreshold({xStart:-5,xEnd:0,yStart:NaN,yEnd:999});await settle();assert(root().getAttribute("data-overflow-edge-threshold-x-start")==="0" && !root().hasAttribute("data-overflow-edge-threshold-y-start") && !root().hasAttribute("data-overflow-edge-threshold"),"edge normalization");
 assert(root().hasAttribute("data-overflow-x-end") && !root().hasAttribute("data-overflow-y-end"),"per-edge threshold");
 app.mutateThreshold();await settle();assert(!root().hasAttribute("data-overflow-x-end"),"nested edge mutation");
 app.setThreshold(undefined);await settle();assert(root().hasAttribute("data-overflow-y-end") && createScrollArea(root())===controller,"threshold public refresh");result.thresholds=true;
 app.setSize(20,20);await settle();assert(!root().hasAttribute("data-has-overflow-y") && part("bar").hidden && part("viewport").tabIndex===-1 && part("corner").style.display==="none","resize no overflow");
 app.setSize(600,500);await settle();assert(root().hasAttribute("data-has-overflow-y") && part("thumb").style.transform.includes("translateY"),"resize restore");
 app.updatePresentation();await settle();assert(part("viewport").style.overflow==="scroll" && part("viewport").style.background==="blue" && part("viewport").classList.contains("updated") && root().style.getPropertyValue("--scroll-area-overflow-y-end"),"native presentation and Runtime style ownership");result.geometry=true;
 const wheel=(node,dy,dx=0)=>{const event=new WheelEvent("wheel",{deltaY:dy,deltaX:dx,bubbles:true,cancelable:true});node.dispatchEvent(event);return event.defaultPrevented;};
 assert(wheel(part("bar"),40),"vertical wheel prevention");await settle();assert(part("viewport").scrollTop===40,"vertical wheel exactly once");
 assert(wheel(part("horizontal"),0,30),"horizontal wheel");await settle();assert(part("viewport").scrollLeft===30,"horizontal wheel exactly once");
 const pointer=(node,type,x,y)=>node.dispatchEvent(new PointerEvent(type,{bubbles:true,cancelable:true,button:0,pointerType:"mouse",isPrimary:true,clientX:x,clientY:y}));
 pointer(part("thumb"),"pointerdown",195,20);pointer(document,"pointermove",195,50);await settle();assert(part("viewport").scrollTop>40,"thumb drag");pointer(document,"pointerup",195,50);
 part("viewport").scrollTop=0;pointer(part("bar"),"pointerdown",195,100);await settle();assert(part("viewport").scrollTop>0,"track pointer jump");result.input=true;
 app.replaceRef();await settle();assert(app.snapshot().refLog.slice(-2).join(",")==="root:0:clear,root:1:set","ref replace order");
 app.replaceAttachment();await settle();assert(app.snapshot().attachmentLog.slice(-2).join(",")==="root:0:clear,root:1:set","attachment replace order");
 const runs=app.snapshot().runs;app.updateDependency();await settle();assert(app.snapshot().runs===runs+7 && app.snapshot().ownersMatch,"native reactive attachments");part("thumb").click();assert(app.snapshot().clicks===1,"native click once");result.nativeOwnership=true;
 assert(!document.getElementById("nested-holder").hasAttribute("data-has-overflow-y")&&document.getElementById("nested-scroll").hasAttribute("data-has-overflow-y"),"nested root isolation");result.structure=true;
 assert(styled().querySelector('[data-slot="scroll-area-viewport"]').classList.contains("custom-viewport")&&styled().querySelectorAll('[data-sw-scroll-area-viewport]').length===1,"Styled auto anatomy");
 assert(styled().querySelector('[data-sw-scroll-area-scrollbar]').getAttribute("data-orientation")==="vertical"&&styled().querySelector('[data-sw-scroll-area-thumb]')&&styled().querySelector('[data-sw-scroll-area-corner]'),"Styled default anatomy");
 app.setAuto(false);app.setCustomBar(true);await settle();assert(styled().querySelectorAll('[data-sw-scroll-area-viewport]').length===1&&styled().querySelector('[data-part="manual-viewport"]')&&styled().querySelectorAll('[data-sw-scroll-area-scrollbar]').length===1&&styled().querySelector('[data-part="custom-horizontal"]'),"Styled manual viewport and scrollbar snippet");
 assert(wheel(styled().querySelector('[data-part="custom-horizontal"]'),0,25),"Styled horizontal wheel");await settle();assert(styled().querySelector('[data-part="manual-viewport"]').scrollLeft===25,"Styled wheel target");result.styled=true;
 const detached=root(),viewport=part("viewport"),bar=part("bar"),thumb=part("thumb");pointer(thumb,"pointerdown",195,20);await unmount(app);await settle();const position=viewport.scrollTop;pointer(document,"pointermove",195,80);wheel(bar,40);viewport.dispatchEvent(new Event("scroll"));detached.append(document.createElement("span"));await pause(150);assert(viewport.scrollTop===position&&observers.filter(observer=>observer.target!==document).every(observer=>!observer.active)&&app.snapshot().refs===0&&app.snapshot().attachments===0&&target.children.length===0,"listener, drag, observer, ref cleanup " + JSON.stringify({position,current:viewport.scrollTop,active:observers.filter(observer=>observer.active).map(observer=>({kind:observer.kind,target:observer.target?.nodeName,id:observer.target?.id})),refs:app.snapshot().refs,attachments:app.snapshot().attachments,children:target.children.length}));result.cleanup=true;
}catch(error){result.error=error.stack??String(error);}
document.documentElement.dataset.scrollAreaResult=JSON.stringify(result);
`;
