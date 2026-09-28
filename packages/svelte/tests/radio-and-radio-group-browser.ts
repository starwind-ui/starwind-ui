import assert from "node:assert/strict";
import { once } from "node:events";
import { readFile } from "node:fs/promises";
import { createServer } from "node:http";
import path from "node:path";
import { chromium } from "playwright";
import type { DistConsumer } from "./dist-consumer.js";
import { BROWSER_BUILD } from "./compatibility-hydration.js";

export async function verifyRadioGroupLifecycle(consumer: DistConsumer, styled = false) {
  await consumer.write({
    "RadioLifecycle.svelte": appSource(styled),
    "hydrate-main.js": CLIENT,
    "build-radio-group.mjs": BROWSER_BUILD,
    "radio-group-ssr.mjs": `import assert from "node:assert/strict";import {render} from "svelte/server";import App from "./RadioLifecycle.svelte";import Primitive,* as named from "@starwind-ui/svelte/radio-group";import Radio,* as radio from "@starwind-ui/svelte/radio";import Styled,* as styled from "./radio-group/index.js";assert.equal(globalThis.document,undefined);assert.equal(Primitive.Root,named.RadioGroupRoot);assert.deepEqual(Object.keys(named).sort(),["RadioGroup","RadioGroupRoot","default"]);assert.equal(Radio.Root,radio.RadioRoot);assert.equal(Radio.Indicator,radio.RadioIndicator);assert.equal(Styled.Root,styled.RadioGroup);assert.equal(Styled.Item,styled.RadioGroupItem);const ref=()=>{throw new Error("SSR ref publication")};render(Primitive.Root,{props:{ref,value:"a"}});render(Styled.Root,{props:{ref,defaultValue:"a"}});const body=render(App).body;assert.equal(body,render(App).body);assert.match(body,/<span(?=[^>]*data-case="solo-indicator")(?=[^>]*hidden)[^>]*>/);assert.match(body,/<input(?=[^>]*name="held-group")(?=[^>]*form="fb")(?=[^>]*disabled)(?=[^>]*required)[^>]*>/);assert.match(body,/data-ssr-models="">undefined,false,true,undefined/);console.log(JSON.stringify({body}));`,
  });
  const { body } = JSON.parse(await consumer.run("radio-group-ssr.mjs", { loader: true }));
  assert.match(body, /data-sw-radio-group/);
  assert.doesNotMatch(body, /\[object Object\]/);
  const build = JSON.parse(await consumer.run("build-radio-group.mjs"));
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
    await page.waitForFunction(() => document.documentElement.dataset.radioResult, undefined, {
      timeout: 30000,
    });
    const result = await page.evaluate(() =>
      JSON.parse(document.documentElement.dataset.radioResult!),
    );
    assert.deepEqual(diagnostics, [], JSON.stringify({ diagnostics, result }));
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
  const child = (props: string) =>
    styled
      ? `<Main.Item ${props}/>`
      : `<Radio.Root ${props}><Radio.Indicator keepMounted /></Radio.Root>`;
  return `<script lang="ts">
	import Main from "${styled ? "./radio-group/index.js" : "@starwind-ui/svelte/radio-group"}";import Radio from "@starwind-ui/svelte/radio";import Group from "@starwind-ui/svelte/radio-group";import {createAttachmentKey} from "svelte/attachments";
let value=$state<string|undefined>(),defaults=$state("a"),falseChild=$state<boolean|undefined>(false),trueChild=$state<boolean|undefined>(true),undefinedChild=$state<boolean|undefined>(),standalone=$state<boolean|undefined>(),functionValue=$state<string|undefined>(),plain=$state<string|undefined>("pa");
let disabled=$state(false),readOnly=$state(false),required=$state(true),orientation=$state<"horizontal"|"vertical">("vertical"),name=$state<string|undefined>("choice"),form=$state<string|undefined>(),extra=$state(false),native=$state(false),key=$state(0),groupKey=$state(0),attachmentVersion=$state(0),refVersion=$state(0),attached=$state(true),indicator=$state(true),standaloneNative=$state(false),standaloneId=$state("solo");
let keepIndicator=$state(false);
let childId=$state("child-b"),childReadOnly=$state(false);
let heldDisabled=$state(true),heldReadOnly=$state(true),heldRequired=$state(true),heldForm=$state<string|undefined>("fb"),heldName=$state<string|undefined>("held-group");
let cancel=false,childCancel=false,command:string|undefined,retain=false;
const calls={proposals:0,child:0,writes:0,standalone:0,setters:0,refs:0,clear:0,attach:0,detach:0,sibling:0,siblingClear:0};const log:string[]=[];
const callback=(version:number)=>(node:HTMLDivElement|null)=>{calls[node?"refs":"clear"]++;log.push("ref:"+version+(node?":set":":clear"));};let rootRef=$derived(callback(refVersion));
const attachment=(node:HTMLDivElement)=>{const version=attachmentVersion;calls.attach++;log.push("attach:"+version);void node;return()=>{calls.detach++;log.push("detach:"+version);}};const sibling=()=>{calls.sibling++;return()=>{calls.siblingClear++;}};const key1=createAttachmentKey(),key2=createAttachmentKey();let attachments=$derived(attached?{[key1]:attachment,[key2]:sibling}:{});
function changed(next:string,detail:import("@starwind-ui/runtime/radio-group").RadioGroupValueChangeDetails){calls.proposals++;if(value===next)throw new Error("publication before callback");if(cancel)detail.cancel();if(command!==undefined)value=command;}
function childChanged(_next:boolean,detail:import("@starwind-ui/runtime/radio").RadioCheckedChangeDetails){calls.child++;if(childCancel)detail.cancel();}
export function releaseHeld(){heldDisabled=false;heldReadOnly=false;heldRequired=false;heldForm=undefined;heldName=undefined;}
export function set(next:string|undefined){value=next;}export function setPlain(next:string|undefined){plain=next;}export function setSolo(next:boolean|undefined){standalone=next;}
export function configure(next:Record<string,any>){cancel=next.cancel??false;childCancel=next.childCancel??false;command=next.command;retain=next.retain??false;for(const [k,v] of Object.entries(next)){if(k==="keepIndicator")keepIndicator=v;if(k==="childId")childId=v;if(k==="childReadOnly")childReadOnly=v;if(k==="disabled")disabled=v;if(k==="readOnly")readOnly=v;if(k==="required")required=v;if(k==="name")name=v;if(k==="orientation")orientation=v;if(k==="form")form=v;if(k==="extra")extra=v;if(k==="native")native=v;if(k==="defaults")defaults=v;if(k==="attached")attached=v;if(k==="indicator")indicator=v;if(k==="standaloneNative")standaloneNative=v;if(k==="standaloneId")standaloneId=v;}}
export function replaceChild(){key++;}export function replace(){groupKey++;}export function updateAttachment(){attachmentVersion++;}export function replaceRef(){refVersion++;}
export function snapshot(){return{value,falseChild,trueChild,undefinedChild,standalone,functionValue,plain,calls:{...calls},log:[...log]};}
</script><output data-ssr-models>{String(value)},{String(falseChild)},{String(trueChild)},{String(undefinedChild)}</output><form id="fa"></form><form id="fb"></form><form id="fc"></form><form id="plain-form"></form>
{#key groupKey}<Main.Root data-case="main" defaultValue={defaults} bind:value {disabled} {readOnly} {required} {orientation} {name} {form} onValueChange={changed} ref={rootRef} {...attachments} ${styled ? 'legend="Delivery" size="md"' : ""}>
${child('data-case="a" nativeButton value="a" form="fa" defaultChecked={false} bind:checked={falseChild} onCheckedChange={childChanged} aria-label="A"')}
{#key key}${child('data-case="b" nativeButton id={childId} readOnly={childReadOnly} value="b" form="fb" defaultChecked bind:checked={()=>trueChild,next=>{calls.writes++;trueChild=next;}} onCheckedChange={childChanged} aria-label="B"')}{/key}
${child('data-case="c" value="c" form="fa" nativeButton={native} defaultChecked bind:checked={()=>undefinedChild,next=>{calls.writes++;undefinedChild=next;}} onCheckedChange={childChanged} aria-label="C"')}
${child('data-case="disabled" value="disabled" disabled form="fa" aria-label="Disabled"')}
{#if extra}${child('data-case="extra" value="extra" form="fa" aria-label="Extra"')}{/if}
</Main.Root>{/key}
<Group.Root data-case="held" defaultValue="held-a" disabled={heldDisabled} readOnly={heldReadOnly} required={heldRequired} form={heldForm} name={heldName}><Radio.Root value="held-a" name="held-own" form="fa" data-case="held-a" aria-label="Held A"/><Radio.Root value="held-b" name="held-own" form="fa" data-case="held-b" aria-label="Held B"/></Group.Root>
<Group.Root data-case="empty"><Radio.Root value="empty" data-case="empty-child" aria-label="Empty" /></Group.Root>
	<Radio.Root data-case="solo" value="yes" form="fa" name="solo" id={standaloneId} nativeButton={standaloneNative} bind:checked={standalone} onCheckedChange={()=>calls.standalone++} aria-label="Standalone">{#if indicator}<Radio.Indicator data-case="solo-indicator" keepMounted={keepIndicator} />{/if}</Radio.Root>
<Group.Root data-case="function" bind:value={()=>functionValue,next=>{calls.setters++;functionValue=retain?functionValue:next;}}><Radio.Root value="fx" data-case="fx" aria-label="FX"/><Radio.Root value="fy" data-case="fy" aria-label="FY"/></Group.Root>
<Main.Root data-case="plain" value={plain}><Radio.Root value="pa" form="plain-form" data-case="pa" aria-label="PA"/><Radio.Root value="pb" form="plain-form" data-case="pb" aria-label="PB"/></Main.Root>
${styled ? '<Main.Root data-case="custom" defaultValue="custom"><Main.Item value="custom">{#snippet icon()}<svg data-custom-icon aria-hidden="true"><path d="M0 0h4v4H0z"/></svg>{/snippet}</Main.Item></Main.Root>' : ""}`;
}
const CLIENT = `import {hydrate,flushSync,tick,unmount} from "svelte";import {createRadioGroup} from "@starwind-ui/runtime/radio-group";import {createRadio} from "@starwind-ui/runtime/radio";import App from "./RadioLifecycle.svelte";
const result={},part=name=>document.querySelector('[data-case="'+name+'"]'),form=name=>document.getElementById(name),input=name=>part(name).querySelector("[data-sw-radio-input]")??part(name).nextElementSibling;
const assert=(condition,message)=>{if(!condition)throw new Error(message);};const settle=async()=>{flushSync();await tick();await new Promise(resolve=>setTimeout(resolve,35));flushSync();await tick();};const checked=(name,value)=>assert(part(name).getAttribute("aria-checked")===String(value)&&input(name).checked===value,"checked "+name+" "+value);
try{const target=document.querySelector("#app"),app=hydrate(App,{target});await settle();const group=createRadioGroup(part("main"));assert(input("held-a").disabled&&input("held-a").required&&input("held-a").form===form("fb"),"initial group effective props");app.releaseHeld();await settle();assert(!input("held-a").disabled&&!input("held-a").required&&input("held-a").name==="held-own"&&input("held-a").form===form("fa"),"released initial group props restore own values");part("held-b").click();await settle();assert(createRadioGroup(part("held")).getValue()==="held-b","released initial readonly permits selection");assert(app.snapshot().value==="a","initial frozen seed publication");checked("a",true);checked("b",false);checked("c",false);assert(app.snapshot().falseChild===false&&app.snapshot().trueChild===true&&app.snapshot().undefinedChild===undefined&&app.snapshot().calls.writes===0,"group child models untouched");assert(createRadioGroup(part("empty")).getValue()===undefined,"empty selection");
part("b").click();await settle();assert(app.snapshot().value==="b","accepted child group selection");checked("a",false);checked("b",true);app.configure({cancel:true});part("a").click();await settle();assert(app.snapshot().value==="b","group callback cancellation");app.configure({childCancel:true});part("a").click();await settle();assert(app.snapshot().value==="b","child callback cancellation");app.configure({});part("main").addEventListener("starwind:value-change",event=>event.preventDefault(),{once:true});part("a").click();await settle();assert(app.snapshot().value==="b","group DOM cancellation");part("a").addEventListener("starwind:checked-change",event=>event.preventDefault(),{once:true});part("a").click();await settle();assert(app.snapshot().value==="b","child DOM cancellation");
app.set(undefined);await settle();assert(group.getValue()==="b","later undefined retains");app.set("a");await settle();const count=app.snapshot().calls.proposals;group.setValue("b",{emit:false});await settle();assert(app.snapshot().value==="a"&&group.getValue()==="b"&&app.snapshot().calls.proposals===count,"silent imperative setter is not notification");app.set("c");await settle();assert(group.getValue()==="c","parent command after silent setter");
app.configure({orientation:"vertical"});app.set("a");await settle();part("a").dispatchEvent(new KeyboardEvent("keydown",{key:"ArrowDown",bubbles:true,cancelable:true}));await settle();assert(app.snapshot().value==="b"&&document.activeElement===part("b"),"vertical keyboard selection");app.configure({orientation:"horizontal"});await settle();part("b").dispatchEvent(new KeyboardEvent("keydown",{key:"ArrowRight",bubbles:true,cancelable:true}));await settle();assert(app.snapshot().value==="c","horizontal keyboard selection");part("c").dispatchEvent(new KeyboardEvent("keydown",{key:"Home",bubbles:true,cancelable:true}));await settle();assert(app.snapshot().value==="a","Home selection");
app.configure({disabled:true});await settle();assert(input("a").disabled&&input("disabled").disabled,"disabled inheritance");app.configure({disabled:false,readOnly:true});await settle();assert(!input("a").disabled&&input("disabled").disabled,"own disabled retained");part("b").click();await settle();assert(app.snapshot().value==="a","readonly inheritance");app.configure({readOnly:false,name:"renamed"});await settle();assert(input("a").name==="renamed"&&input("a").required&&new FormData(form("fa")).get("renamed")==="a","required name association");
app.configure({extra:true});await settle();part("extra").click();await settle();assert(app.snapshot().value==="extra","dynamic collection selection");const retired=part("extra");app.configure({extra:false});await settle();assert(group.getValue()===undefined,"removed selected item leaves Runtime empty");retired.click();await settle();assert(group.getValue()===undefined,"retired item cleanup");app.set("b");await settle();app.replaceChild();await settle();checked("b",true);part("a").click();await settle();part("b").click();await settle();assert(app.snapshot().value==="b","keyed child owner reconnects");app.configure({childId:"new-child-b"});await settle();part("a").click();await settle();part("b").click();await settle();assert(app.snapshot().value==="b","same root id recreation reconnects group owner");app.configure({childReadOnly:true});await settle();part("a").click();await settle();part("b").click();await settle();assert(app.snapshot().value==="a","own readonly prevents group selection");app.configure({childReadOnly:false});await settle();part("b").click();await settle();assert(app.snapshot().value==="b","own readonly release preserves group owner");app.configure({native:true});await settle();assert(part("c").tagName==="BUTTON"&&input("c").previousElementSibling===part("c"),"native-button sibling input");part("c").click();await settle();assert(app.snapshot().value==="c","replacement child callbacks");
app.configure({defaults:"c"});app.set("b");await settle();const resetCount=app.snapshot().calls.proposals;form("fa").reset();await settle();assert(app.snapshot().value==="b","unrelated mixed form reset preserves selection");form("fb").reset();await settle();assert(app.snapshot().value===undefined,"selected-only form reset clears");form("fa").reset();await settle();assert(app.snapshot().value==="a"&&app.snapshot().calls.proposals===resetCount,"seed-associated form restores silently");assert(app.snapshot().calls.writes===0&&app.snapshot().falseChild===false&&app.snapshot().trueChild===true&&app.snapshot().undefinedChild===undefined,"resets preserve child bindings");
app.configure({form:"fc"});await settle();app.set("b");await settle();form("fa").reset();await settle();assert(app.snapshot().value==="b","old form detached");form("fc").reset();await settle();assert(app.snapshot().value==="a","group form override reset");const oldForm=form("fc"),replacement=document.createElement("form");replacement.id="fc";oldForm.replaceWith(replacement);await settle();app.set("b");await settle();replacement.reset();await settle();assert(app.snapshot().value==="a","same-ID form replacement");
assert(app.snapshot().standalone===false&&part("solo-indicator").hidden,"standalone initializes with hidden indicator");app.configure({keepIndicator:true});await settle();assert(!part("solo-indicator").hidden,"live keepMounted shows unchecked indicator");app.configure({keepIndicator:false});await settle();assert(part("solo-indicator").hidden,"live keepMounted false restores hidden indicator");part("solo").click();await settle();assert(app.snapshot().standalone===true&&app.snapshot().calls.standalone===1,"standalone accepted checked");app.setSolo(undefined);await settle();checked("solo",true);app.configure({indicator:false,standaloneId:"solo-new"});await settle();checked("solo",true);app.configure({indicator:true,standaloneNative:true});await settle();checked("solo",true);assert(part("solo-indicator").hasAttribute("data-checked"),"indicator recreation accepted state");const soloCount=app.snapshot().calls.standalone;form("fa").reset();await settle();assert(app.snapshot().standalone===false&&app.snapshot().calls.standalone===soloCount,"standalone frozen reset without callback");
part("fx").click();await settle();assert(app.snapshot().functionValue==="fx"&&app.snapshot().calls.setters===1,"function binding one accepted write");part("pb").click();await settle();assert(app.snapshot().plain==="pa"&&createRadioGroup(part("plain")).getValue()==="pb","plain model accepts locally");app.setPlain("pb");await settle();form("plain-form").reset();await settle();assert(createRadioGroup(part("plain")).getValue()==="pa","plain model reset");app.setPlain("pa");await settle();app.setPlain("pb");await settle();assert(createRadioGroup(part("plain")).getValue()==="pb","plain command after local publication");
if(part("custom")){assert(part("main").querySelector('[data-slot="radio-group-legend"]').textContent==="Delivery","styled legend");assert(part("a").querySelector("svg")&&part("custom").querySelector("[data-custom-icon]"),"default custom icons");}
const before=app.snapshot().calls;app.updateAttachment();await settle();assert(app.snapshot().calls.attach===before.attach+1&&app.snapshot().calls.detach===before.detach+1&&app.snapshot().calls.sibling===before.sibling,"independent reactive attachment");app.replaceRef();await settle();assert(app.snapshot().log.filter(x=>x.startsWith("ref:")).slice(-2).join()==="ref:0:clear,ref:1:set"&&createRadioGroup(part("main"))===group,"ref replacement order");app.configure({attached:false});await settle();assert(app.snapshot().calls.attach===app.snapshot().calls.detach&&app.snapshot().calls.sibling===app.snapshot().calls.siblingClear,"attachment removal");replacement.reset();app.replace();await settle();replacement.reset();await unmount(app);await settle();assert(!target.children.length&&app.snapshot().calls.refs===app.snapshot().calls.clear,"pending reset unmount cleanup");result.complete=true;
}catch(error){result.error=error.stack??String(error);}document.documentElement.dataset.radioResult=JSON.stringify(result);`;
