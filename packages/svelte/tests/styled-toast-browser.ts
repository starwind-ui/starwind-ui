import assert from "node:assert/strict";
import { once } from "node:events";
import { readFile } from "node:fs/promises";
import { createServer } from "node:http";
import path from "node:path";
import { chromium } from "playwright";
import { BROWSER_BUILD } from "./compatibility-hydration.js";
import type { DistConsumer } from "./dist-consumer.js";

export async function verifyStyledToast(consumer: DistConsumer) {
  await consumer.write({
    "Toast.svelte": APP,
    "hydrate-main.js": CLIENT,
    "build-toast.mjs": BROWSER_BUILD,
    "toast-ssr.mjs": `import assert from "node:assert/strict";import {render} from "svelte/server";import App from "./Toast.svelte";import Parts,* as named from "./toast/index.js";import {toast as primitiveToast} from "@starwind-ui/svelte/toast";import {getToastManager} from "@starwind-ui/runtime/toast";
assert.equal(globalThis.document,undefined);assert.equal(getToastManager(),null);assert.equal(named.toast,primitiveToast);assert.deepEqual(Object.keys(Parts).sort(),["Action","Close","Content","Description","Item","Template","Title","Viewport"]);for(const [key,value]of Object.entries(Parts))assert.equal(value,named[key==="Viewport"?"Toaster":"Toast"+key]);const body=render(App).body;assert.equal(body,render(App).body);assert.equal(getToastManager(),null);console.log(JSON.stringify({body}));`,
  });
  const { body } = JSON.parse(await consumer.run("toast-ssr.mjs", { loader: true }));
  assert.equal(body.match(/data-sw-toast-template=/g)?.length, 6);
  assert.match(body, /data-slot="toast-viewport"/);
  const build = JSON.parse(await consumer.run("build-toast.mjs"));
  assert.ok(build.inputs.includes(path.join(consumer.root, "toast/styles.css")));
  const javascript = await readFile(path.join(consumer.root, "browser.js"));
  const css = await readFile(path.join(consumer.root, "browser.css"));
  assert.match(css.toString(), /--toast-swipe-movement-x/);
  const server = createServer((request, response) => {
    if (request.url === "/browser.js") {
      response.setHeader("Content-Type", "text/javascript");
      response.end(javascript);
    } else if (request.url === "/browser.css") {
      response.setHeader("Content-Type", "text/css");
      response.end(css);
    } else {
      response.setHeader("Content-Type", "text/html");
      response.end(
        `<link rel="icon" href="data:,"><link rel="stylesheet" href="/browser.css"><div id="app">${body}</div><script type="module" src="/browser.js"></script>`,
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
    await page.waitForFunction(
      () => document.documentElement.dataset.styledToastResult,
      undefined,
      { timeout: 30_000 },
    );
    const result = await page.evaluate(() =>
      JSON.parse(document.documentElement.dataset.styledToastResult!),
    );
    assert.deepEqual(diagnostics, []);
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

const APP = `<script lang="ts">
import {Toaster,ToastTemplate,ToastItem,ToastTitle,ToastDescription,ToastAction} from "./toast/index.js";
import {createAttachmentKey,type Attachment} from "svelte/attachments";
let custom=$state(false),position=$state<"top-left"|"bottom-center">("top-left"),limit=$state(1),duration=$state(12000),gap=$state("10px"),peek=$state("20px");
const refs=new Map<string,HTMLElement>(),attachments=new Map<string,HTMLElement>();
const ref=(name:string)=>(node:HTMLElement|null)=>{if(node)refs.set(name,node);else refs.delete(name);};
const attrs=(name:string)=>({[createAttachmentKey()]:((node)=>{attachments.set(name,node);return()=>attachments.delete(name);}) satisfies Attachment<HTMLElement>});
const viewportRef=ref("viewport"),templateRef=ref("template"),itemRef=ref("item"),titleRef=ref("title"),actionRef=ref("action");
const viewportAttrs=attrs("viewport"),templateAttrs=attrs("template"),itemAttrs=attrs("item"),titleAttrs=attrs("title"),actionAttrs=attrs("action");
let templateClicks=0;
export function configure(){position="bottom-center";limit=2;duration=9000;gap="12px";peek="24px";}
export function useCustom(){custom=true;}
export function snapshot(){return {refs:refs.size,attachments:attachments.size,ownersMatch:[...refs].every(([name,node])=>attachments.get(name)===node),templateClicks,template:refs.get("template")};}
</script>
{#snippet templates()}
<ToastTemplate variant="default" data-custom-template="source" ref={templateRef} {...templateAttrs}>
 <ToastItem ref={itemRef} {...itemAttrs} data-custom-item="source">
  <span data-custom-copy>Custom markup</span>
  <ToastTitle ref={titleRef} {...titleAttrs}>{#snippet icon()}<span data-custom-icon aria-hidden="true">★</span>{/snippet}Title</ToastTitle>
  <ToastDescription>Description</ToastDescription>
  <ToastAction ref={actionRef} {...actionAttrs} onclick={()=>templateClicks++}>Action</ToastAction>
 </ToastItem>
</ToastTemplate>
{/snippet}
<Toaster id="notifications" {position} {limit} {duration} {gap} {peek} style="--caller: ready" class="caller-viewport" ref={viewportRef} {...viewportAttrs} children={custom?templates:undefined} />`;

const CLIENT = `import {hydrate,flushSync,tick,unmount} from "svelte";
import App from "./Toast.svelte";
import {toast} from "./toast/index.js";
import {getToastManager} from "@starwind-ui/runtime/toast";
const assert=(value,message)=>{if(!value)throw new Error(message);};
const settle=async()=>{flushSync();await tick();flushSync();await new Promise(resolve=>setTimeout(resolve,20));};
const until=async(check)=>{for(let i=0;i<60;i++){await settle();if(check())return;}throw new Error("Timed out waiting for Toast composition");};
const target=document.querySelector("#app"),viewport=document.querySelector("#notifications");
assert(getToastManager()===null,"imports created a manager");
const app=hydrate(App,{target});
try{
 await settle();
 const result={};
 assert(viewport===document.querySelector("#notifications"),"hydrated viewport identity");
 const manager=getToastManager();
 assert(manager?.viewport===viewport&&app.snapshot().ownersMatch,"viewport manager and native owner");
 const templates=[...viewport.querySelectorAll("template[data-sw-toast-template]")];
 assert(templates.map(node=>node.dataset.swToastTemplate).join(",")==="default,success,error,warning,info,loading","six default templates");
 for(const template of templates){
  const variant=template.dataset.swToastTemplate;
  const id=toast({id:"variant-"+variant,variant,title:"Notice "+variant,description:"Details",duration:0});
  const node=viewport.querySelector('[data-toast-id="'+id+'"]');
  assert(node?.querySelector('[data-slot="toast-title-text"]').textContent==="Notice "+variant,"default title population "+variant);
  assert(node.querySelectorAll('[data-slot="toast-title"] svg').length===(variant==="default"?0:1),"variant icon "+variant);
  assert(node.querySelector('[data-slot="toast-close"]').getAttribute("aria-label")==="Close notification","default close label");
 }
 await settle();result.defaults=true;
 assert(getComputedStyle(viewport.querySelector("[data-toast-id]")).transform!=="none","contract stylesheet applied");result.stylesheet=true;
 assert(viewport.dataset.position==="top-left"&&viewport.dataset.limit==="1"&&viewport.dataset.duration==="12000","initial config");
 assert(viewport.style.getPropertyValue("--gap")==="10px"&&viewport.style.getPropertyValue("--peek")==="20px"&&viewport.style.getPropertyValue("--caller").trim()==="ready","initial gap, peek and native style");
 app.configure();await settle();
 assert(getToastManager()===manager&&viewport.dataset.position==="bottom-center"&&viewport.dataset.limit==="2"&&viewport.dataset.duration==="9000","current config forwarding");
 assert(viewport.style.getPropertyValue("--gap")==="12px"&&viewport.style.getPropertyValue("--peek")==="24px","updated gap and peek");
 const configured=toast("Configured");assert(manager.getToasts().find(item=>item.id===configured).duration===9000,"default duration forwarding");result.config=true;
 let actions=0;
 const action=toast({title:"Saved",description:"Changes stored",duration:0,action:{label:"Undo",onClick:()=>actions++}});
 toast.update(action,{title:"Updated",description:"Latest description"});
 const node=viewport.querySelector('[data-toast-id="'+action+'"]');
 assert(node.querySelector('[data-slot="toast-title-text"]').textContent==="Updated"&&node.querySelector('[data-slot="toast-description"]').textContent==="Latest description","service update");
 const button=node.querySelector('[data-slot="toast-action"]');assert(button instanceof HTMLButtonElement&&button.type==="button","native service action");button.click();await until(()=>!node.isConnected);assert(actions===1,"service action callback");
 toast.dismiss();await until(()=>!viewport.querySelector("[data-toast-id]"));
 let finish;const pending=toast.promise(new Promise(resolve=>finish=resolve),{loading:"Working",success:{title:"Finished",duration:0},error:"Failed"});
 assert(viewport.querySelector('[data-toast-id][data-variant="loading"] [data-slot="toast-title"] svg'),"loading template");
 finish("done");assert(await pending==="done","promise result");await settle();
 assert(viewport.querySelector('[data-toast-id][data-variant="success"] [data-slot="toast-title-text"]').textContent==="Finished","promise success template");
 toast.dismiss();await until(()=>!viewport.querySelector("[data-toast-id]"));result.service=true;
 app.useCustom();await settle();
 assert(viewport.querySelectorAll("template[data-sw-toast-template]").length===1,"custom children replace defaults");
 let state=app.snapshot();assert(state.refs===5&&state.attachments===5&&state.ownersMatch&&state.template instanceof HTMLTemplateElement,"custom template and part owners");
 const source=state.template.content.querySelector('[data-custom-item]');
 const custom=toast({title:"Custom title",description:"Custom detail",duration:0,action:{label:"Custom action",onClick:()=>actions++}});
 const clone=viewport.querySelector('[data-toast-id="'+custom+'"]');
 assert(clone!==source&&clone.querySelector("[data-custom-copy]").textContent==="Custom markup"&&clone.querySelector("[data-custom-icon]"),"custom markup cloned");
 assert(clone.querySelector('[data-slot="toast-title-text"]').textContent==="Custom title","custom title populated without replacing icon");
 clone.querySelector('[data-slot="toast-action"]').click();await until(()=>!clone.isConnected);
 assert(actions===2&&app.snapshot().templateClicks===0,"cloned actions use service callbacks");result.custom=true;result.owners=true;
 toast({title:"Unmount pending",duration:9000});
 await unmount(app);await settle();
 assert(getToastManager()===null&&!target.querySelector("[data-toast-id]")&&!target.querySelector("[data-slot]")&&app.snapshot().refs===0&&app.snapshot().attachments===0,"Toaster teardown");result.teardown=true;
 document.documentElement.dataset.styledToastResult=JSON.stringify(result);
}catch(error){await unmount(app);document.documentElement.dataset.styledToastResult=JSON.stringify({error:error.stack??String(error)});}`;
