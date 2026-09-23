import assert from "node:assert/strict";
import { once } from "node:events";
import { readFile } from "node:fs/promises";
import { createServer } from "node:http";
import path from "node:path";
import { chromium } from "playwright";
import { BROWSER_BUILD } from "./compatibility-hydration.js";
import type { DistConsumer } from "./dist-consumer.js";

export async function verifyCheckboxGroupOwnership(consumer: DistConsumer, styled = false) {
  await consumer.write({
    "CheckboxGroupOwnership.svelte": appSource(styled),
    "hydrate-main.js": CLIENT,
    "build-checkbox-group.mjs": BROWSER_BUILD,
    "checkbox-group-ssr.mjs": `import assert from "node:assert/strict";import {render} from "svelte/server";import App from "./CheckboxGroupOwnership.svelte";import Primitive,* as named from "@starwind-ui/svelte/checkbox-group";import Styled,* as styled from "./checkbox-group/index.js";assert.equal(globalThis.document,undefined);assert.equal(Primitive.Root,named.CheckboxGroupRoot);assert.deepEqual(Object.keys(named).sort(),["CheckboxGroup","CheckboxGroupRoot","default"]);assert.equal(Styled,styled.CheckboxGroup);const ref=()=>{throw new Error("SSR ref publication")};render(Primitive.Root,{props:{ref,value:["a"]}});render(Styled,{props:{ref,defaultValue:["a"]}});const body=render(App).body;assert.equal(body,render(App).body);assert.match(body,/data-ssr-models="">undefined,false,true,undefined,0/);console.log(JSON.stringify({body}));`,
  });
  const { body } = JSON.parse(await consumer.run("checkbox-group-ssr.mjs", { loader: true }));
  assert.match(body, /data-sw-checkbox-group/);
  assert.doesNotMatch(body, /\[object Object\]/);
  const build = JSON.parse(await consumer.run("build-checkbox-group.mjs"));
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
    await page.waitForFunction(
      () => document.documentElement.dataset.checkboxGroupResult,
      undefined,
      {
        timeout: 30000,
      },
    );
    const result = await page.evaluate(() =>
      JSON.parse(document.documentElement.dataset.checkboxGroupResult!),
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
  const group = styled ? "Main" : "Main.Root";
  const child = (props: string, label: string) =>
    styled
      ? `<StyledCheckbox ${props} label="${label}" />`
      : `<Checkbox.Root ${props}><Checkbox.Indicator keepMounted />${label}</Checkbox.Root>`;
  return `<script lang="ts">
import {createCheckboxGroup} from "@starwind-ui/runtime/checkbox-group";
import Primitive from "@starwind-ui/svelte/checkbox-group";
import Main from "${styled ? "./checkbox-group/index.js" : "@starwind-ui/svelte/checkbox-group"}";
import Checkbox from "@starwind-ui/svelte/checkbox";
import StyledCheckbox from "./checkbox/index.js";
import {createAttachmentKey} from "svelte/attachments";
let value=$state<string[]|undefined>(),defaults=$state(["a"]),falseChild=$state<boolean|undefined>(false),trueChild=$state<boolean|undefined>(true),undefinedChild=$state<boolean|undefined>(),standalone=$state(false);
let disabled=$state(false),ownDisabled=$state(true),form=$state("main-form"),extra=$state(false),childKey=$state(0),groupKey=$state(0),native=$state(false),attachmentVersion=$state(0),refVersion=$state(0),attached=$state(true);
let functionValue=$state<string[]|undefined>(),plain=$state<string[]>(["pa"]),definedValue=$state<string[]|undefined>(["defined"]);
let mode="identity",cancel=false,childCancel=false,command:string[]|undefined,mutateCallback=false,external:string[]|undefined;
const calls={proposals:0,child:0,childWrites:0,undefinedWrites:0,setter:0,refs:0,clear:0,attach:0,detach:0,sibling:0,siblingClear:0,native:0};const log:string[]=[];
const callback=(version:number)=>(node:HTMLDivElement|null)=>{calls[node?"refs":"clear"]++;log.push("ref:"+version+(node?":set":":clear"));};let rootRef=$derived(callback(refVersion));
const symbol=createAttachmentKey(),sibling=createAttachmentKey();
const attachment=(node:HTMLDivElement)=>{const version=attachmentVersion;if(node.tagName!=="DIV")throw new Error("group native attachment owner");calls.attach++;log.push("attach:"+version);return()=>{calls.detach++;log.push("detach:"+version);};};
const siblingAttachment=()=>{calls.sibling++;return()=>{calls.siblingClear++;};};
let attachments=$derived(attached?{[symbol]:attachment,[sibling]:siblingAttachment}:{});
const onValueChange=(next:string[],details:import("@starwind-ui/svelte/checkbox-group").CheckboxGroupValueChangeDetails)=>{calls.proposals++;log.push("proposal:"+JSON.stringify(next)+":before:"+JSON.stringify(value));if(mutateCallback)next.push("poison");if(cancel)details.cancel();if(command)value=[...command];};
const onChildChange=(_next:boolean,detail:import("@starwind-ui/runtime/checkbox").CheckboxCheckedChangeDetails)=>{calls.child++;if(childCancel)detail.cancel();};
export function set(next:string[]|undefined){external=next;value=next;}export function mutateSource(){external?.push("poison");}export function setPlain(next:string[]){plain=next;}export function mutatePlain(){plain=[];}
export function configure(next:{disabled?:boolean;ownDisabled?:boolean;form?:string;extra?:boolean;native?:boolean;cancel?:boolean;childCancel?:boolean;command?:string[];mutateCallback?:boolean;mode?:string;attached?:boolean;defaults?:string[]}){
if(next.disabled!==undefined)disabled=next.disabled;if(next.ownDisabled!==undefined)ownDisabled=next.ownDisabled;if(next.form)form=next.form;if(next.extra!==undefined)extra=next.extra;if(next.native!==undefined)native=next.native;if(next.mode)mode=next.mode;if(next.attached!==undefined)attached=next.attached;if(next.defaults)defaults=next.defaults;cancel=next.cancel??false;childCancel=next.childCancel??false;command=next.command;mutateCallback=next.mutateCallback??false;}
export function updateAttachment(){attachmentVersion++;}export function replaceRef(){refVersion++;}export function replaceChild(){childKey++;}export function replace(){groupKey++;}
export function snapshot(){return{value:value&&[...value],falseChild,trueChild,undefinedChild,standalone,functionValue:functionValue&&[...functionValue],plain:[...plain],definedValue:definedValue&&[...definedValue],calls:{...calls},log:[...log]};}
</script>
<output data-ssr-models>{String(value)},{String(falseChild)},{String(trueChild)},{String(undefinedChild)},{calls.childWrites}</output>
<form id="main-form"></form><form id="other-form"></form>
{#key groupKey}
<${group} data-case="main" id="main-group" defaultValue={defaults} bind:value {disabled} ref={rootRef} {...attachments} {onValueChange} onclick={()=>calls.native++}>
  ${child('data-case="a" nativeButton id="child-a" name="own-a" value="a" {form} defaultChecked={false} bind:checked={falseChild} onCheckedChange={onChildChange}', "A")}
  {#key childKey}${child('data-case="b" nativeButton id="child-b" name="own-b" value="b" {form} defaultChecked bind:checked={()=>trueChild,next=>{calls.childWrites++;trueChild=next;}} onCheckedChange={onChildChange}', "B")}{/key}
  ${child('data-case="c" id="child-c" name="own-c" value="c" {form} nativeButton={native} defaultChecked bind:checked={()=>undefinedChild,next=>{calls.undefinedWrites++;undefinedChild=next;}} onCheckedChange={onChildChange}', "C")}
  ${child('data-case="fallback" id="child-fallback" name="fallback" {form}', "Name key")}
  ${child('data-case="disabled" id="child-disabled" name="own-disabled" value="disabled" {form} disabled={ownDisabled}', "Disabled")}
  {#if extra}${child('data-case="extra" nativeButton id="child-extra" name="own-extra" value="extra" {form}', "Extra")}{/if}
  <Primitive.Root data-case="nested" defaultValue={["inner"]}><Checkbox.Root data-case="inner" value="inner" form="main-form">Inner</Checkbox.Root></Primitive.Root>
</${group}>
{/key}
<div data-sw-field data-name="standalone" id="standalone-field"><Checkbox.Root data-sw-field-control data-case="standalone" name="standalone" value="yes" form="main-form" bind:checked={standalone}>Standalone</Checkbox.Root></div>
<Primitive.Root data-case="function" defaultValue={[]} bind:value={()=>functionValue,next=>{calls.setter++;functionValue=mode==="retain"?functionValue:mode==="reverse"?[...(next??[])].reverse():next;}}><Checkbox.Root data-case="fx" value="fx">FX</Checkbox.Root><Checkbox.Root data-case="fy" value="fy">FY</Checkbox.Root></Primitive.Root>
<${group} data-case="plain" value={plain}><Checkbox.Root data-case="pa" value="pa" form="plain-form">PA</Checkbox.Root><Checkbox.Root data-case="pb" value="pb" form="plain-form">PB</Checkbox.Root></${group}><form id="plain-form"></form>
<Primitive.Root data-case="defined" defaultValue={["seed"]} bind:value={definedValue}><Checkbox.Root data-case="defined-child" value="defined" form="main-form">Defined</Checkbox.Root><Checkbox.Root data-case="seed" value="seed" form="main-form">Seed</Checkbox.Root></Primitive.Root>
`;
}
const CLIENT = `import {hydrate,flushSync,tick,unmount} from "svelte";import {createCheckboxGroup} from "@starwind-ui/runtime/checkbox-group";import {createField} from "@starwind-ui/runtime/field";import App from "./CheckboxGroupOwnership.svelte";
const result={},part=name=>document.querySelector('[data-case="'+name+'"]'),node=id=>document.getElementById(id),input=name=>{const root=part(name);return root.querySelector("[data-sw-checkbox-input]")??root.nextElementSibling;},same=(left,right)=>JSON.stringify(left)===JSON.stringify(right),target=node("app"),before=part("main"),app=hydrate(App,{target}),assert=(condition,message)=>{if(!condition)throw new Error(message+" "+JSON.stringify(app.snapshot()));};
const settle=async()=>{flushSync();await tick();await new Promise(resolve=>setTimeout(resolve,20));flushSync();};
const checked=(name,value)=>assert(part(name).getAttribute("aria-checked")===String(value)&&input(name).checked===value,"checked "+name+" "+value);
try {
await settle();const group=createCheckboxGroup(part("main"));group.setName("choices");await settle();assert(part("main")===before&&same(app.snapshot().value,["a"])&&app.snapshot().calls.proposals===0,"SSR hydration and default publication");checked("a",true);checked("b",false);checked("c",false);assert(app.snapshot().falseChild===false&&app.snapshot().trueChild===true&&app.snapshot().undefinedChild===undefined&&app.snapshot().calls.childWrites===0&&app.snapshot().calls.undefinedWrites===0,"group owns defined and undefined child models");checked("standalone",false);assert(same(new FormData(node("main-form")).getAll("choices"),["a"]),"initial group name and form value");
part("b").click();await settle();assert(same(app.snapshot().value,["a","b"])&&app.snapshot().calls.proposals===1&&app.snapshot().calls.child===1&&app.snapshot().calls.childWrites===0,"accepted group transaction");checked("b",true);
app.configure({cancel:true});part("c").click();await settle();assert(same(app.snapshot().value,["a","b"]),"group callback cancellation");checked("c",false);app.configure({});part("main").addEventListener("starwind:value-change",event=>event.preventDefault(),{once:true});part("c").click();await settle();assert(same(app.snapshot().value,["a","b"]),"group DOM cancellation");checked("c",false);
app.configure({childCancel:true});const canceledCount=app.snapshot().calls.proposals;part("c").click();await settle();assert(app.snapshot().calls.proposals===canceledCount&&same(app.snapshot().value,["a","b"]),"child callback cancellation");app.configure({});
app.configure({mutateCallback:true});part("b").click();await settle();assert(same(app.snapshot().value,["a"])&&!group.getValue().includes("poison"),"callback arrays copied");app.configure({});
const proposalCount=app.snapshot().calls.proposals;app.set(["c"]);await settle();assert(same(group.getValue(),["c"])&&createCheckboxGroup(part("main"))===group&&app.snapshot().calls.proposals===proposalCount,"silent parent array command");app.mutateSource();assert(same(group.getValue(),["c"]),"input array copy");app.set(undefined);await settle();assert(same(group.getValue(),["c"]),"later undefined retains group value");app.set(["a"]);await settle();const read=group.getValue();read.push("poison");assert(same(group.getValue(),["a"]),"public getter array copy");
part("fallback").click();await settle();assert(same(app.snapshot().value,["a","fallback"]),"name fallback membership");const nested=createCheckboxGroup(part("nested"));part("inner").click();await settle();assert(same(nested.getValue(),[])&&same(app.snapshot().value,["a","fallback"]),"nested group isolation");
app.configure({disabled:true});await settle();assert(input("a").disabled&&input("disabled").disabled&&!new FormData(node("main-form")).has("choices"),"group disabled inheritance");app.configure({disabled:false});await settle();assert(!input("a").disabled&&input("disabled").disabled,"own disabled survives group enabled");app.configure({ownDisabled:false});group.setName("renamed");await settle();assert(!input("disabled").disabled&&input("a").name==="renamed","live disabled and group name");group.setName(undefined);await settle();assert(input("a").name==="own-a"&&input("b").name==="own-b","own names restored");group.setName("choices");await settle();
app.configure({extra:true});await settle();part("extra").click();await settle();assert(app.snapshot().value.includes("extra"),"dynamic child collection");const retiredExtra=part("extra");app.configure({extra:false});await settle();assert(!app.snapshot().value.includes("extra"),"removed child prunes normalized value");retiredExtra.click();await settle();assert(!app.snapshot().value.includes("extra"),"retired child cleanup");
app.set(["b","c"]);await settle();const retiredB=part("b");app.replaceChild();await settle();checked("b",true);assert(same(group.getValue(),["b","c"]),"keyed child preserves accepted membership");retiredB.click();await settle();assert(same(group.getValue(),["b","c"]),"keyed retired events released");app.configure({native:true});await settle();assert(part("c").tagName==="BUTTON","child native root replacement");checked("c",true);part("c").click();await settle();assert(same(app.snapshot().value,["b"]),"new child owner toggles once");
assert(same(app.snapshot().functionValue,[])&&app.snapshot().calls.setter===1,"undefined function model initializes once");part("fx").click();await settle();assert(same(app.snapshot().functionValue,["fx"])&&app.snapshot().calls.setter===2,"function accepted once");
part("pb").click();await settle();assert(same(app.snapshot().plain,["pa"])&&same(createCheckboxGroup(part("plain")).getValue(),["pa","pb"]),"plain group accepts locally");app.mutatePlain();await settle();assert(same(createCheckboxGroup(part("plain")).getValue(),[]),"replacement plain array command after publication");app.setPlain(["pb"]);await settle();assert(same(createCheckboxGroup(part("plain")).getValue(),["pb"]),"plain parent command");node("plain-form").reset();await settle();assert(same(app.snapshot().plain,["pb"])&&same(createCheckboxGroup(part("plain")).getValue(),["pa"]),"plain reset publishes locally");app.mutatePlain();await settle();assert(same(createCheckboxGroup(part("plain")).getValue(),[]),"replacement plain array command after reset");
app.configure({defaults:["c"]});app.set(["b"]);await settle();const beforeResetCount=app.snapshot().calls.proposals;node("main-form").reset();await settle();assert(same(app.snapshot().value,["a"])&&same(app.snapshot().definedValue,["seed"])&&app.snapshot().calls.proposals===beforeResetCount,"frozen reset seeds and no callback");assert(app.snapshot().falseChild===false&&app.snapshot().trueChild===true&&app.snapshot().undefinedChild===undefined&&app.snapshot().calls.childWrites===0&&app.snapshot().calls.undefinedWrites===0,"group reset leaves child bindings unchanged");
app.configure({form:"other-form"});await settle();app.set(["b"]);await settle();node("main-form").reset();await settle();assert(same(app.snapshot().value,["b"]),"old form reset detached");node("other-form").reset();await settle();assert(same(app.snapshot().value,["a"]),"external form reassociation reset");const oldForm=node("other-form"),replacement=document.createElement("form");replacement.id="other-form";oldForm.replaceWith(replacement);await settle();app.set(["b"]);await settle();replacement.reset();await settle();assert(same(app.snapshot().value,["a"]),"same-ID external form replacement");
const field=createField(node("standalone-field"));assert(part("standalone").getAttribute("role")==="checkbox"&&!part("standalone").hasAttribute("data-sw-checkbox-group"),"standalone retains raw Field Checkbox identity");part("standalone").click();await settle();assert(app.snapshot().standalone===true&&field.getFormRegistration().value==="yes","outside group keeps standalone binding");field.destroy();
const attachmentsBefore=app.snapshot().calls;app.updateAttachment();await settle();assert(app.snapshot().calls.attach===attachmentsBefore.attach+1&&app.snapshot().calls.detach===attachmentsBefore.detach+1&&app.snapshot().calls.sibling===attachmentsBefore.sibling,"reactive attachment rerun keeps sibling");assert(app.snapshot().log.filter(entry=>/^(attach|detach):/.test(entry)).slice(-2).join()==="detach:0,attach:1","attachment cleanup order");app.replaceRef();await settle();assert(app.snapshot().log.filter(entry=>entry.startsWith("ref:")).slice(-2).join()==="ref:0:clear,ref:1:set"&&createCheckboxGroup(part("main"))===group,"ref replacement preserves controller");app.configure({attached:false});await settle();assert(app.snapshot().calls.attach===app.snapshot().calls.detach&&app.snapshot().calls.sibling===app.snapshot().calls.siblingClear,"attachment removal");app.configure({attached:true});await settle();
const retiredRoot=part("main");node("other-form").reset();app.replace();await settle();const current=app.snapshot().value;retiredRoot.dispatchEvent(new CustomEvent("starwind:checked-change",{bubbles:true,detail:{checked:true,isCanceled:false,cancel(){}}}));await settle();assert(same(app.snapshot().value,current),"retired group cannot publish");node("other-form").reset();await unmount(app);await settle();const final=app.snapshot();assert(final.calls.refs===final.calls.clear&&final.calls.attach===final.calls.detach&&final.calls.sibling===final.calls.siblingClear&&!target.children.length,"pending reset and attachment teardown");result.complete=true;
}catch(error){result.error=error.stack??String(error);}document.documentElement.dataset.checkboxGroupResult=JSON.stringify(result);`;
