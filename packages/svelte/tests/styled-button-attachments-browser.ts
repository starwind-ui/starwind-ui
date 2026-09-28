import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import path from "node:path";
import type { DistConsumer } from "./dist-consumer.js";
import { createBrowserBuildScript } from "./compatibility-hydration.js";
import { once } from "node:events";
import { createServer } from "node:http";
import { chromium } from "playwright";

/** Custom semantic owners keep each public symbol alive until that symbol or owner changes. */
export async function verifyStyledButtonAttachmentIsolation(consumer: DistConsumer) {
  await consumer.write({
    "ButtonAttachmentIsolation.svelte": APP,
    "hydrate-main.js": CLIENT,
    "build-button-attachments.mjs": createBrowserBuildScript(),
    "button-attachments-ssr.mjs":
      'import assert from "node:assert/strict";import {render} from "svelte/server";import App from "./ButtonAttachmentIsolation.svelte";assert.equal(globalThis.document,undefined);const body=render(App).body;assert.equal(body,render(App).body);console.log(JSON.stringify({body}));',
  });
  const { body } = JSON.parse(await consumer.run("button-attachments-ssr.mjs", { loader: true }));
  await consumer.run("build-button-attachments.mjs");
  const result = await runBrowser(consumer, body, "buttonAttachmentResult");
  assert.equal(result.error, undefined, result.error);
  assert.deepEqual(result.failures, []);
  assert.equal(result.hydrated, true);
  assert.equal(result.remaining, 0);
  for (const [mode, counts] of Object.entries(result.counts)) {
    assert.ok((counts as any).refs > 0, `${mode} did not receive a public ref`);
    assert.equal((counts as any).refs, (counts as any).refCleanups);
    assert.equal((counts as any).first, (counts as any).firstCleanups);
    assert.equal((counts as any).second, (counts as any).secondCleanups);
  }
  return result;
}

async function runBrowser(consumer: DistConsumer, body: string, key: string) {
  const javascript = await readFile(path.join(consumer.root, "browser.js"));
  const server = createServer((request, response) => {
    response.setHeader(
      "Content-Type",
      request.url === "/browser.js" ? "text/javascript" : "text/html",
    );
    response.end(
      request.url === "/browser.js"
        ? javascript
        : `<link rel="icon" href="data:,"><div id="app">${body}</div><script type="module" src="/browser.js"></script>`,
    );
  });
  let browser;
  try {
    server.listen(0, "127.0.0.1");
    await once(server, "listening");
    const address = server.address();
    assert.ok(address && typeof address !== "string");
    browser = await chromium.launch({ channel: "chrome", headless: true });
    const page = await browser.newPage(),
      diagnostics: string[] = [];
    page.on("pageerror", (error) => diagnostics.push(error.message));
    page.on("console", (message) => {
      if (["warning", "error"].includes(message.type())) diagnostics.push(message.text());
    });
    await page.goto(`http://127.0.0.1:${address.port}`);
    await page.waitForFunction((key) => document.documentElement.dataset[key], key, {
      timeout: 30000,
    });
    const result = await page.evaluate(
      (key) => JSON.parse(document.documentElement.dataset[key]!),
      key,
    );
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
import {Button,type ButtonProps} from "./button/index.js";
import Pagination from "./pagination/index.js";
import {createAttachmentKey,type Attachment} from "svelte/attachments";
let firstValue=$state(0),secondValue=$state(0),replaced=$state(false),changed=$state(false),present=$state(true),secondPresent=$state(true),secondRef=$state(false),generation=$state(0),buttonMode=$state(false),disabled=$state(false);
const firstKey=createAttachmentKey(),secondKey=createAttachmentKey();
function pair(){
 const events:string[]=[],refs:string[]=[],live=new Map<string,HTMLAnchorElement|HTMLButtonElement>();let owner:HTMLAnchorElement|HTMLButtonElement|null=null,calls=0;
 const attach=(label:string,slot:string,getValue:()=>number):Attachment<HTMLAnchorElement|HTMLButtonElement>=>node=>{
  const value=getValue();if(typeof document==="undefined"||!(node instanceof HTMLAnchorElement||node instanceof HTMLButtonElement))throw new Error("invalid attachment owner");if(live.has(slot))throw new Error("overlapping symbol "+slot);live.set(slot,node);events.push(label+":"+value+":setup");
  return()=>{if(live.get(slot)!==node)throw new Error("cleanup changed owner");live.delete(slot);events.push(label+":"+value+":cleanup");};
 };
 const reference=(name:string)=>(node:HTMLAnchorElement|HTMLButtonElement|null)=>{if(typeof document==="undefined")throw new Error("SSR ref");if(node&&owner)throw new Error("overlapping refs");owner=node;refs.push(name+":"+(node?.tagName??"null"));};
 return{first:attach("first","first",()=>firstValue),second:attach("second","second",()=>secondValue),replacement:attach("replacement","second",()=>secondValue),refA:reference("a"),refB:reference("b"),onpointerdown:(event:PointerEvent)=>{if(event.currentTarget!==owner)throw new Error("stale event owner");calls++;},snapshot:()=>({events:[...events],refs:[...refs]}),calls:()=>calls,verify:(node:Element|null,slots:string[])=>{if(owner!==node)throw new Error("ref owner mismatch");if(JSON.stringify([...live.keys()].sort())!==JSON.stringify(slots))throw new Error("live symbol set mismatch");if([...live.values()].some(value=>value!==node))throw new Error("attachment owner mismatch");}};
}
const modes=["explicit","inferred","page","previous","next"] as const;
const pairs={explicit:pair(),inferred:pair(),page:pair(),previous:pair(),next:pair()},native=pair();
function symbols(value:ReturnType<typeof pair>){return present?{[firstKey]:value.first,...(secondPresent?{[secondKey]:replaced?value.replacement:value.second}:{})}:{};}
function props(mode:typeof modes[number]){const value=pairs[mode];return{...symbols(value),ref:secondRef?value.refB:value.refA,"data-composition":mode,title:changed?"changed":"initial",class:changed?"updated":"initial",style:"--probe: ready",tabindex:3,onpointerdown:value.onpointerdown};}
let href=$derived(changed?"#changed":"#initial");
let inferredProps=$derived<ButtonProps>(buttonMode?{as:"button"}:{href});
export function updateFirst(){firstValue++;}export function updateSecond(){secondValue++;}export function replaceSecond(){replaced=true;}export function changeAttrs(){changed=true;}export function removeSecond(){secondPresent=false;}export function restoreSecond(){secondPresent=true;}export function removeAll(){present=false;}export function restoreAll(){present=true;}export function replaceRef(){secondRef=true;}export function replaceOwners(){generation++;}export function toButton(){buttonMode=true;}export function toAnchor(){buttonMode=false;}export function disable(){disabled=true;}export function enable(){disabled=false;}
export function snapshot(){return{...Object.fromEntries(modes.map(mode=>[mode,pairs[mode].snapshot()])),native:native.snapshot()};}
export function calls(){return modes.reduce((sum,mode)=>sum+pairs[mode].calls(),0);}
export function verify(unmounted=false){for(const mode of modes)pairs[mode].verify(unmounted?null:document.querySelector('[data-composition="'+mode+'"]'),unmounted||!present?[]:secondPresent?["first","second"]:["first"]);}
</script>
{#key generation}
<Button as="a" {href} {...props("explicit")} {disabled}>Explicit anchor</Button>
<Button {...inferredProps} {...props("inferred")} {disabled}>Inferred branch</Button>
<Pagination.Root><Pagination.Content><Pagination.Item><Pagination.Previous {href} {...props("previous")} {disabled}>Previous</Pagination.Previous></Pagination.Item><Pagination.Item><Pagination.Link {href} {...props("page")} {disabled} isActive={!changed}>2</Pagination.Link></Pagination.Item><Pagination.Item><Pagination.Next {href} {...props("next")} {disabled}>Next</Pagination.Next></Pagination.Item></Pagination.Content></Pagination.Root>
{/key}
<a data-comparison href="#native" title={changed?"changed":"initial"} {...symbols(native)}>Native comparison</a>`;

const CLIENT = `import{hydrate,flushSync,tick,unmount}from"svelte";import App from"./ButtonAttachmentIsolation.svelte";
const modes=["explicit","inferred","page","previous","next"],failures=[];
const same=(actual,expected,message)=>{if(JSON.stringify(actual)!==JSON.stringify(expected))failures.push({message,actual:structuredClone(actual),expected:structuredClone(expected)});};
const settle=async()=>{flushSync();await tick();flushSync();await tick();flushSync();};
const owners=()=>modes.map(mode=>document.querySelector('[data-composition="'+mode+'"]')),part=mode=>document.querySelector('[data-composition="'+mode+'"]'),dispatch=node=>node.dispatchEvent(new PointerEvent("pointerdown",{bubbles:true}));
try{
 const before=owners(),app=hydrate(App,{target:document.querySelector("#app")});await settle();same(owners().map((node,index)=>node===before[index]),[true,true,true,true,true],"hydration owner identity");app.verify();
 same(owners().map(node=>node.tagName),["A","A","A","A","A"],"semantic anchors");same(owners().map(node=>node.dataset.slot),["button","button","pagination-link","pagination-previous","pagination-next"],"contract slots");same(part("page").getAttribute("aria-current"),"page","active page");same(part("page").closest("nav").getAttribute("aria-label"),"pagination","actual pagination navigation");for(const node of before)dispatch(node);same(app.calls(),5,"native handlers");
 const expected=Object.fromEntries(modes.map(mode=>[mode,{events:[],refs:[]}]));
 const check=()=>{app.verify();};
 const events=()=>{};
 check("initial");app.updateFirst();await settle();events("first:0:cleanup","first:1:setup");check("independent first dependency");
 const nativeBefore=app.snapshot().native.events.length;app.replaceSecond();await settle();const nativeReplacement=app.snapshot().native.events.slice(nativeBefore);events("second:0:cleanup","replacement:0:setup");check("second callback identity");
 app.updateSecond();await settle();events("replacement:0:cleanup","replacement:1:setup");check("replacement reactive dependency");app.updateFirst();await settle();events("first:1:cleanup","first:2:setup");check("retained sibling reactive dependency");
 app.changeAttrs();await settle();check("ordinary attributes");same(owners().map((node,index)=>node===before[index]&&node.title==="changed"&&node.classList.contains("updated")&&node.getAttribute("href")==="#changed"&&node.style.getPropertyValue("--probe")==="ready"),[true,true,true,true,true],"updated native props");same(part("page").hasAttribute("aria-current"),false,"inactive page");
 app.disable();await settle();check("disabled anchors");same(owners().map(node=>!node.hasAttribute("href")&&node.getAttribute("aria-disabled")==="true"&&node.tabIndex===-1),[true,true,true,true,true],"disabled native semantics");app.enable();await settle();check("enabled anchors");same(owners().map(node=>node.getAttribute("href")==="#changed"&&!node.hasAttribute("aria-disabled")&&node.tabIndex===3),[true,true,true,true,true],"restored native semantics");
 app.removeSecond();await settle();events("replacement:1:cleanup");check("second removal");app.restoreSecond();await settle();events("replacement:1:setup");check("same callback restoration");
 app.removeAll();await settle();events("first:2:cleanup","replacement:1:cleanup");check("all symbols removed");app.restoreAll();await settle();events("first:2:setup","replacement:1:setup");check("all symbols restored");
 app.replaceRef();await settle();check("ref callback replacement");same(owners().map((node,index)=>node===before[index]),[true,true,true,true,true],"callback changes preserve owners");
 const oldAnchor=part("inferred");app.toButton();await settle();check("Primitive button branch");const button=part("inferred");same(button.tagName,"BUTTON","button branch element");same(button.type,"button","Primitive default button type");same(button.hasAttribute("data-sw-button"),true,"Primitive button hook");same(button===oldAnchor,false,"anchor branch was retired");dispatch(button);dispatch(oldAnchor);same(app.calls(),6,"retired anchor events");
 app.toAnchor();await settle();check("restored anchor branch");same(part("inferred").tagName,"A","restored anchor element");same(part("inferred").getAttribute("href"),"#changed","restored anchor href");dispatch(part("inferred"));dispatch(button);same(app.calls(),7,"retired button events");
 const oldOwners=owners();app.replaceOwners();await settle();check("component owner replacement");same(owners().map((node,index)=>node===oldOwners[index]),[false,false,false,false,false],"component replacement scope");for(const node of oldOwners)dispatch(node);same(app.calls(),7,"retired component events");
 const finalOwners=owners();await unmount(app);await settle();app.verify(true);app.updateFirst();app.updateSecond();await settle();for(const node of finalOwners)dispatch(node);same(app.calls(),7,"unmounted native events");const final=app.snapshot();
 const counts=Object.fromEntries(modes.map(mode=>{const log=final[mode];return[mode,{refs:log.refs.filter(value=>!value.endsWith(":null")).length,refCleanups:log.refs.filter(value=>value.endsWith(":null")).length,first:log.events.filter(value=>value.startsWith("first:")&&value.endsWith(":setup")).length,firstCleanups:log.events.filter(value=>value.startsWith("first:")&&value.endsWith(":cleanup")).length,second:log.events.filter(value=>!value.startsWith("first:")&&value.endsWith(":setup")).length,secondCleanups:log.events.filter(value=>!value.startsWith("first:")&&value.endsWith(":cleanup")).length}];}));
 document.documentElement.dataset.buttonAttachmentResult=JSON.stringify({failures,nativeReplacement,counts,hydrated:true,remaining:document.querySelector("#app").children.length});
}catch(error){document.documentElement.dataset.buttonAttachmentResult=JSON.stringify({error:String(error),failures});}`;
