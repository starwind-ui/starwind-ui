import assert from "node:assert/strict";
import { once } from "node:events";
import { readFile } from "node:fs/promises";
import { createServer } from "node:http";
import path from "node:path";
import { chromium } from "playwright";
import type { DistConsumer } from "./dist-consumer.js";
import { BROWSER_BUILD } from "./compatibility-hydration.js";

export async function verifySwitchLifecycle(consumer: DistConsumer, styled = false) {
  await consumer.write({
    "SwitchLifecycle.svelte": appSource(styled),
    "hydrate-main.js": CLIENT,
    "build-switch.mjs": BROWSER_BUILD,
    "switch-ssr.mjs": `import assert from "node:assert/strict";import {render} from "svelte/server";import App from "./SwitchLifecycle.svelte";import Primitive,* as named from "@starwind-ui/svelte/switch";import Styled,* as styled from "./switch/index.js";
assert.equal(globalThis.document,undefined);assert.equal(Primitive.Root,named.SwitchRoot);assert.equal(Primitive.Thumb,named.SwitchThumb);assert.deepEqual(Object.keys(named).sort(),["Switch","SwitchRoot","SwitchThumb","default"]);assert.equal(Styled,styled.Switch);const ref=()=>{throw new Error("SSR ref write")};render(Primitive.Root,{props:{ref,inputRef:ref,checked:true}});render(Primitive.Thumb,{props:{ref}});render(Styled,{props:{id:"ssr",ref,onCheckedChange(){throw new Error("SSR callback")}}});const body=render(App).body;assert.equal(body,render(App).body);console.log(JSON.stringify({body}));`,
  });
  const { body } = JSON.parse(await consumer.run("switch-ssr.mjs", { loader: true }));
  assert.match(body, /data-sw-switch/);
  assert.doesNotMatch(body, /\[object Object\]/);
  const build = JSON.parse(await consumer.run("build-switch.mjs"));
  const javascript = await readFile(path.join(consumer.root, "browser.js"));
  const server = createServer((request, response) => {
    if (request.url === "/browser.js") {
      response.setHeader("Content-Type", "text/javascript");
      response.end(javascript);
    } else {
      response.setHeader("Content-Type", "text/html");
      response.end(
        `<link rel="icon" href="data:,"><div id="app">${body}</div><script type="module" src="/browser.js"></script>`,
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
    await page.waitForFunction(() => document.documentElement.dataset.switchResult, undefined, {
      timeout: 30000,
    });
    const result = await page.evaluate(() =>
      JSON.parse(document.documentElement.dataset.switchResult!),
    );
    assert.deepEqual(diagnostics, []);
    assert.equal(result.error, undefined, JSON.stringify(result));
    assert.equal(result.complete, true, JSON.stringify(result));
    return { result, build };
  } finally {
    await browser?.close();
    await new Promise<void>((resolve, reject) =>
      server.close((error) => (error ? reject(error) : resolve())),
    );
  }
}

function appSource(styled: boolean) {
  return `<script lang="ts">
import Primitive from "@starwind-ui/svelte/switch";
import Main from "${styled ? "./switch/index.js" : "@starwind-ui/svelte/switch"}";
import {createAttachmentKey} from "svelte/attachments";
let checked=$state<boolean|undefined>(), plain=$state<boolean|undefined>(false), functional=$state<boolean|undefined>(), defined=$state<boolean|undefined>(false);
let disabled=$state(false),readOnly=$state(false),required=$state(false),form=$state("external"),identifier=$state("bound"),name=$state<string|undefined>("choice"),value=$state<string|undefined>("yes"),uncheckedValue=$state<string|undefined>("no");
let native=$state(false),key=$state(0),refVersion=$state(0),attached=$state(true),size=$state<"sm"|"md"|"lg">("md");
let attachmentVersion=$state(0);
let cancel=false,command:boolean|undefined,recreate=false,mode="identity";
const calls={proposal:0,native:0,setter:0,refs:0,clear:0,inputs:0,inputClear:0,attach:0,detach:0,spanAttach:0,spanDetach:0,siblingAttach:0,siblingDetach:0};const log:string[]=[];
const callback=(version:number)=>(node:HTMLButtonElement|null)=>{calls[node?"refs":"clear"]++;log.push(version+(node?":set":":clear"));};let rootRef=$derived(callback(refVersion));
const inputRef=(node:HTMLInputElement|null)=>{calls[node?"inputs":"inputClear"]++;};
const symbol=createAttachmentKey(),siblingSymbol=createAttachmentKey(),spanSymbol=createAttachmentKey();
const reactiveAttachment=(node:HTMLButtonElement)=>{const version=attachmentVersion;if(node.tagName!=="BUTTON")throw new Error("native attachment owner");calls.attach++;log.push("attach:"+version);return()=>{calls.detach++;log.push("detach:"+version);};};
const siblingAttachment=()=>{calls.siblingAttach++;return()=>{calls.siblingDetach++;};};
const spanAttachments={[spanSymbol]:(node:HTMLElement)=>{const version=attachmentVersion;calls.spanAttach++;log.push("spanAttach:"+version);return()=>{calls.spanDetach++;log.push("spanDetach:"+version);};}};
let attachments=$derived(attached?{[symbol]:reactiveAttachment,[siblingSymbol]:siblingAttachment}:{});
const onCheckedChange=(next:boolean,detail:import("@starwind-ui/svelte/switch").SwitchCheckedChangeDetails)=>{calls.proposal++;log.push("proposal:"+next+":before:"+checked);if(cancel)detail.cancel();if(command!==undefined)checked=command;if(recreate)readOnly=true;};
export function set(next:boolean|undefined){checked=next;}export function setPlain(next:boolean|undefined){plain=next;}
export function configure(next:{disabled?:boolean;readOnly?:boolean;required?:boolean;form?:string;id?:string;name?:string|null;value?:string|null;uncheckedValue?:string|null;cancel?:boolean;command?:boolean;recreate?:boolean;native?:boolean;size?:"sm"|"md"|"lg";attached?:boolean;mode?:string}){
if(next.disabled!==undefined)disabled=next.disabled;if(next.readOnly!==undefined)readOnly=next.readOnly;if(next.required!==undefined)required=next.required;if(next.form)form=next.form;if(next.id)identifier=next.id;if('name'in next)name=next.name??undefined;if('value'in next)value=next.value??undefined;if('uncheckedValue'in next)uncheckedValue=next.uncheckedValue??undefined;if(next.native!==undefined)native=next.native;if(next.size)size=next.size;if(next.attached!==undefined)attached=next.attached;if(next.mode)mode=next.mode;cancel=next.cancel??false;command=next.command;recreate=next.recreate??false;}
export function updateAttachment(){attachmentVersion++;}
export function replaceRef(){refVersion++;}export function replace(){key++;}
export function snapshot(){return{checked,plain,functional,defined,calls:{...calls},log:[...log]};}
</script>
<form id="external"></form><form id="other"></form>
{#key key}
${styled ? "<Main" : "<Main.Root nativeButton"} data-case="bound" id={identifier} {disabled} {readOnly} {required} {form} {name} {value} {uncheckedValue} defaultChecked bind:checked ref={rootRef} {inputRef} {...attachments} {onCheckedChange} onclick={()=>calls.native++} ${styled ? 'label="Receive updates" {size}/>' : '><Primitive.Thumb data-case="bound-thumb"/></Main.Root>'}
{/key}
<Primitive.Root data-case="plain" checked={plain} defaultChecked={false}><Primitive.Thumb/></Primitive.Root>
<Primitive.Root data-case="functional" defaultChecked={false} bind:checked={()=>functional,next=>{calls.setter++;functional=mode==="retain"?functional:mode==="invert"?!next:next;}}><Primitive.Thumb/></Primitive.Root>
<Primitive.Root data-case="defined" name="defined" form="external" defaultChecked bind:checked={defined}><Primitive.Thumb/></Primitive.Root>
<Primitive.Root data-case="span" id="span-input" name="span" form="external" uncheckedValue="off" value="on" nativeButton={native} {...spanAttachments}><Primitive.Thumb data-case="span-thumb"/></Primitive.Root>
<Primitive.Root data-case="static-state" defaultChecked disabled readOnly required><Primitive.Thumb data-case="static-thumb"/></Primitive.Root>
<label for="span-input">Span label</label>
`;
}
const CLIENT = `import {hydrate,flushSync,tick,unmount} from "svelte";import {createSwitch} from "@starwind-ui/runtime/switch";import App from "./SwitchLifecycle.svelte";
const result={},part=name=>document.querySelector('[data-case="'+name+'"]'),node=id=>document.getElementById(id),input=root=>root.tagName==="BUTTON"?root.nextElementSibling:root.querySelector("[data-sw-switch-input]"),assert=(value,message)=>{if(!value)throw new Error(message+" "+JSON.stringify(app.snapshot()));};
const target=node("app"),before=part("bound"),app=hydrate(App,{target});const settle=async()=>{flushSync();await tick();await new Promise(resolve=>setTimeout(resolve,20));flushSync();};
try{
await settle();assert(part("bound")===before && app.snapshot().checked===true && app.snapshot().functional===false && app.snapshot().defined===false && app.snapshot().calls.proposal===0,"hydration and seed precedence");assert(part("static-thumb").hasAttribute("data-checked")&&part("static-thumb").hasAttribute("data-disabled")&&part("static-thumb").hasAttribute("data-readonly")&&part("static-thumb").hasAttribute("data-required"),"initial static Thumb state");
assert(part("bound").tagName==="BUTTON"&&input(part("bound")).parentElement===part("bound").parentElement&&input(part("bound")).id==="bound-input","native sibling input anatomy");assert(part("span").tagName==="SPAN"&&input(part("span")).parentElement===part("span")&&input(part("span")).id==="span-input","span input anatomy");assert(new FormData(node("external")).get("choice")==="yes" && new FormData(node("external")).get("span")==="off","checked and unchecked FormData");
const assertAttachmentRerun=async()=>{const previous=app.snapshot().calls;app.updateAttachment();await settle();const current=app.snapshot();assert(current.calls.attach===previous.attach+1&&current.calls.detach===previous.detach+1&&current.calls.spanAttach===previous.spanAttach+1&&current.calls.spanDetach===previous.spanDetach+1,"stable attachment body reruns for native and span owners");assert(current.calls.siblingAttach===previous.siblingAttach&&current.calls.siblingDetach===previous.siblingDetach,"independent sibling attachment retained");assert(current.log.filter(entry=>/^(attach|detach):/.test(entry)).slice(-2).map(entry=>entry.split(":")[0]).join()==="detach,attach"&&current.log.filter(entry=>/^(spanAttach|spanDetach):/.test(entry)).slice(-2).map(entry=>entry.split(":")[0]).join()==="spanDetach,spanAttach","attachment cleanup before reactive rerun");};await assertAttachmentRerun();
const controller=createSwitch(part("bound"));part("bound").click();await settle();assert(app.snapshot().checked===false && part("bound").getAttribute("aria-checked")==="false"&&new FormData(node("external")).get("choice")==="no"&&app.snapshot().calls.proposal===1&&app.snapshot().calls.native===1,"accepted checked notification once");
app.configure({cancel:true});part("bound").click();await settle();assert(app.snapshot().checked===false && !input(part("bound")).checked,"callback cancellation");app.configure({});part("bound").addEventListener("starwind:checked-change",event=>event.preventDefault(),{once:true});part("bound").click();await settle();assert(app.snapshot().checked===false,"DOM cancellation");
app.set(true);await settle();assert(app.snapshot().checked===true&&controller.getChecked()&&createSwitch(part("bound"))===controller,"silent parent command");app.set(undefined);await settle();assert(controller.getChecked(),"later undefined retains accepted");app.configure({readOnly:true});await settle();
const count=app.snapshot().calls.proposal;part("bound").click();await settle();assert(app.snapshot().calls.proposal===count,"readOnly suppresses toggle");app.configure({readOnly:false,disabled:true});await settle();assert(part("bound").disabled&&!new FormData(node("external")).has("choice"),"disabled native omission");app.configure({disabled:false});await settle();
part("functional").click();await settle();assert(app.snapshot().functional===true&&app.snapshot().calls.setter===2,"function binding accepted once");
part("plain").click();await settle();assert(app.snapshot().plain===false&&createSwitch(part("plain")).getChecked(),"plain native acceptance");app.setPlain(true);await settle();app.setPlain(false);await settle();assert(!createSwitch(part("plain")).getChecked(),"plain parent commands");
app.set(false);app.configure({required:true});await settle();assert(input(part("bound")).required&&!node("external").checkValidity(),"native required constraint");app.set(true);await settle();assert(node("external").checkValidity(),"checked satisfies required");app.configure({required:false,name:"renamed",value:"enabled",uncheckedValue:"disabled"});await settle();assert(new FormData(node("external")).get("renamed")==="enabled"&&!new FormData(node("external")).has("choice"),"live form names and value");app.set(false);await settle();assert(new FormData(node("external")).get("renamed")==="disabled","live unchecked value");app.configure({uncheckedValue:null});await settle();assert(!new FormData(node("external")).has("renamed")&&!input(part("bound")).nextElementSibling?.hasAttribute("data-sw-switch-unchecked-input"),"unchecked omission");
app.configure({id:"renamed-switch"});await settle();assert(part("bound").id==="renamed-switch"&&input(part("bound")).id==="renamed-switch-input","live id owner");const label=document.querySelector('label[data-slot="switch-label"]');if(label){assert(label.htmlFor==="renamed-switch"&&label.textContent==="Receive updates","Styled label target");assert(part("bound").style.getPropertyValue("--padding")==="3px"&&part("bound").querySelector("[data-sw-switch-thumb]").style.getPropertyValue("--translation").includes("var(--spacing)"),"Styled style variables");app.configure({size:"sm"});await settle();assert(part("bound").style.getPropertyValue("--padding")==="2.5px","live Styled size");label.click();await settle();assert(app.snapshot().checked===true,"Styled label native activation");}
app.set(false);await settle();node("external").reset();await settle();assert(app.snapshot().checked===true&&app.snapshot().defined===true,"native reset seeds");app.set(false);app.configure({form:"other"});await settle();node("other").reset();await settle();assert(app.snapshot().checked===true&&input(part("bound")).form===node("other"),"external form prop reset");
part("span").click();await settle();app.configure({native:true});await settle();assert(part("span").tagName==="BUTTON"&&createSwitch(part("span")).getChecked()&&input(part("span")).parentElement===part("span").parentElement,"native anatomy replacement retains state");
await assertAttachmentRerun();app.replaceRef();await settle();assert(app.snapshot().log.filter(entry=>/^\\d+:/.test(entry)).slice(-2).join()==="0:clear,1:set","ref replacement ordering");app.configure({attached:false});await settle();assert(app.snapshot().calls.attach===app.snapshot().calls.detach,"attachment removal");app.configure({attached:true});await settle();
const retired=part("bound");app.replace();await settle();const accepted=app.snapshot().checked;retired.click();await settle();assert(app.snapshot().checked===accepted,"retired proposal cleanup");await unmount(app);await settle();const final=app.snapshot();assert(final.calls.refs===final.calls.clear&&final.calls.inputs===final.calls.inputClear&&final.calls.attach===final.calls.detach&&final.calls.spanAttach===final.calls.spanDetach&&final.calls.siblingAttach===final.calls.siblingDetach&&!target.children.length,"teardown");result.complete=true;
}catch(error){result.error=error.stack??String(error)}document.documentElement.dataset.switchResult=JSON.stringify(result);
`;
