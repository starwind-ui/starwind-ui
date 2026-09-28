import assert from "node:assert/strict";
import { once } from "node:events";
import { readFile } from "node:fs/promises";
import { createServer } from "node:http";
import path from "node:path";
import { chromium } from "playwright";
import { BROWSER_BUILD } from "./compatibility-hydration.js";
import type { DistConsumer } from "./dist-consumer.js";

export async function verifyToggleLifecycle(consumer: DistConsumer, styled = false) {
  await consumer.write({
    "ToggleLifecycle.svelte": appSource(styled),
    "hydrate-main.js": CLIENT,
    "build-toggle-group.mjs": BROWSER_BUILD,
    "toggle-group-ssr.mjs": `import assert from "node:assert/strict";import {render} from "svelte/server";import App from "./ToggleLifecycle.svelte";import Group,{ToggleGroupRoot} from "@starwind-ui/svelte/toggle-group";import Toggle,{ToggleRoot} from "@starwind-ui/svelte/toggle";assert.equal(Group.Root,ToggleGroupRoot);assert.equal(Toggle.Root,ToggleRoot);assert.equal(globalThis.document,undefined);const ref=()=>{throw new Error("SSR ref publication")};render(ToggleRoot,{props:{ref,pressed:true}});render(ToggleGroupRoot,{props:{ref,value:["a"]}});const body=render(App).body;assert.equal(body,render(App).body);assert.match(body,/data-ssr-models="">undefined,false,true,undefined/);console.log(JSON.stringify({body}));`,
  });
  const { body } = JSON.parse(await consumer.run("toggle-group-ssr.mjs", { loader: true }));
  assert.match(body, /data-sw-toggle-group/);
  assert.match(body, /<button(?=[^>]*data-case="a")(?=[^>]*\sdisabled(?:\s|=|>))[^>]*>/);
  assert.doesNotMatch(body, /\[object Object\]/);
  const build = JSON.parse(await consumer.run("build-toggle-group.mjs"));
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
    await page.waitForFunction(() => document.documentElement.dataset.toggleResult, undefined, {
      timeout: 30000,
    });
    const result = await page.evaluate(() =>
      JSON.parse(document.documentElement.dataset.toggleResult!),
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
    `<${styled ? "Main.Item" : "Toggle.Root"} ${props}>Item</${styled ? "Main.Item" : "Toggle.Root"}>`;
  return `<script lang="ts">
import Main from "${styled ? "./toggle-group/index.js" : "@starwind-ui/svelte/toggle-group"}";import Solo from "${styled ? "./toggle/index.js" : "@starwind-ui/svelte/toggle"}";import Toggle from "@starwind-ui/svelte/toggle";import Group from "@starwind-ui/svelte/toggle-group";import {createToggleGroup} from "@starwind-ui/runtime/toggle-group";import {createAttachmentKey} from "svelte/attachments";
let value=$state<string[]|undefined>(),pressed=$state<boolean|undefined>(),falseChild=$state<boolean|undefined>(false),trueChild=$state<boolean|undefined>(true),undefinedChild=$state<boolean|undefined>();
let plain=$state<boolean|undefined>(false),plainGroup=$state<string[]|undefined>(["pa"]),functionValue=$state<string[]|undefined>(),functionPressed=$state<boolean|undefined>();
let multiple=$state(true),disabled=$state(true),loopFocus=$state(true),orientation=$state<"horizontal"|"vertical">("horizontal"),native=$state(true),childValue=$state<string|undefined>("b"),syncGroup=$state<string|undefined>("one"),defaults=$state(true),extra=$state(false),key=$state(0),refVersion=$state(0),attachmentVersion=$state(0),attached=$state(true);
let omittedTitle=$state("Initial item");
let cancel=false,childCancel=false,soloCancel=false,retain=false,command:string[]|undefined;
const calls={group:0,child:0,solo:0,writes:0,functionGroup:0,functionSolo:0,refs:0,clear:0,attach:0,detach:0,direct:0,directClear:0,sibling:0,siblingClear:0};const log:string[]=[];
const refFor=(version:number)=>(node:HTMLDivElement|null)=>{if(node)createToggleGroup(node);calls[node?"refs":"clear"]++;log.push("ref:"+version+(node?":set":":clear"));};let rootRef=$derived(refFor(refVersion));
const a=(node:HTMLDivElement)=>{void node;const version=attachmentVersion;void version;calls.attach++;return()=>{calls.detach++;}};const b=()=>{calls.sibling++;return()=>{calls.siblingClear++;}};const ak=createAttachmentKey(),bk=createAttachmentKey();let attachments=$derived(attached?{[ak]:a,[bk]:b}:{});
const direct=(node:HTMLButtonElement)=>{if(node.tagName!=="BUTTON")throw new Error("wrong attachment owner");calls.direct++;return()=>{calls.directClear++;}};
function changed(next:string[],detail:import("@starwind-ui/runtime/toggle-group").ToggleGroupValueChangeDetails){calls.group++;if(cancel)detail.cancel();if(command){detail.cancel();value=[...command];};void next;}
function childChanged(_next:boolean,detail:import("@starwind-ui/runtime/toggle").TogglePressedChangeDetails){calls.child++;if(childCancel)detail.cancel();}
function soloChanged(_next:boolean,detail:import("@starwind-ui/runtime/toggle").TogglePressedChangeDetails){calls.solo++;if(soloCancel)detail.cancel();}
export function mutate(){if(value)value=[...value,"b"];}export function set(next:string[]|undefined){value=next;}export function solo(next:boolean|undefined){pressed=next;}export function setPlain(next:boolean|undefined){plain=next;}export function setPlainGroup(next:string[]|undefined){plainGroup=next;}
export function configure(next:Record<string,any>){cancel=next.cancel??false;childCancel=next.childCancel??false;soloCancel=next.soloCancel??false;retain=next.retain??false;command=next.command;for(const [k,v] of Object.entries(next)){if(k==="omittedTitle")omittedTitle=v;if(k==="multiple")multiple=v;if(k==="disabled")disabled=v;if(k==="loopFocus")loopFocus=v;if(k==="orientation")orientation=v;if(k==="native")native=v;if(k==="childValue")childValue=v;if(k==="syncGroup")syncGroup=v;if(k==="defaults")defaults=v;if(k==="extra")extra=v;if(k==="attached")attached=v;}}
export function replace(){key++;}export function changeRef(){refVersion++;}export function changeAttachment(){attachmentVersion++;}
export function snapshot(){return{value,pressed,falseChild,trueChild,undefinedChild,functionValue,functionPressed,plain,plainGroup,calls:{...calls},log:[...log]};}
</script><output data-ssr-models>{String(value)},{String(falseChild)},{String(trueChild)},{String(undefinedChild)}</output>
<Main.Root data-case="main" defaultValue={["a"]} bind:value {multiple} {disabled} {loopFocus} {orientation} onValueChange={changed} ref={rootRef} {...attachments} ${styled ? 'variant="outline" size="sm" spacing={0} style="--gap: 3"' : ""}>
${child('data-case="a" value="a" defaultPressed={false} bind:pressed={falseChild} onPressedChange={childChanged}')}
{#key key}${child('data-case="b" value={childValue} nativeButton={native} defaultPressed bind:pressed={()=>trueChild,next=>{calls.writes++;trueChild=next;}} onPressedChange={childChanged}')}{/key}
${child('data-case="omitted" title={omittedTitle} bind:pressed={()=>undefinedChild,next=>{calls.writes++;undefinedChild=next;}} onPressedChange={childChanged}')}
${child('data-case="disabled" value="disabled" disabled')}
{#if extra}${child('data-case="extra" value="extra"')}{/if}
</Main.Root>
<${styled ? "Solo" : "Solo.Root"} data-case="solo" bind:pressed defaultPressed={defaults} {syncGroup} nativeButton={native} onPressedChange={soloChanged}>Solo</${styled ? "Solo" : "Solo.Root"}>
<Toggle.Root data-case="sync" {syncGroup}>Sync</Toggle.Root>
<Toggle.Root data-case="fx-solo" bind:pressed={()=>functionPressed,next=>{calls.functionSolo++;if(!retain)functionPressed=next;}}>Function</Toggle.Root>
<Group.Root data-case="function" bind:value={()=>functionValue,next=>{calls.functionGroup++;if(!retain)functionValue=next;}}><Toggle.Root value="fx" data-case="fx"/><Toggle.Root value="fy" data-case="fy"/></Group.Root>
<Toggle.Root data-case="plain" pressed={plain} {@attach direct}/><Group.Root data-case="plain-group" value={plainGroup}><Toggle.Root value="pa" data-case="pa"/><Toggle.Root value="pb" data-case="pb"/></Group.Root>
`;
}
const CLIENT = `import {hydrate,tick,unmount} from "svelte";import App from "./ToggleLifecycle.svelte";import {createToggle} from "@starwind-ui/runtime/toggle";import {createToggleGroup} from "@starwind-ui/runtime/toggle-group";
const result={};try{const target=document.querySelector("#app"),app=hydrate(App,{target});const settle=async()=>{await tick();await new Promise(r=>setTimeout(r,15));await tick();};const part=name=>document.querySelector('[data-case="'+name+'"]');const assert=(condition,message)=>{if(!condition)throw new Error(message+" "+JSON.stringify(app.snapshot()));};const same=(a,b)=>JSON.stringify(a)===JSON.stringify(b);const state=(name,pressed)=>assert(part(name).getAttribute("aria-pressed")===String(pressed),name+" state");await settle();const group=createToggleGroup(part("main"));
const assignedKey=part("omitted").getAttribute("data-value");assert(assignedKey!==null,"Runtime assigns omitted key before updates");assert(part("a").disabled&&part("b").disabled&&part("disabled").disabled,"initial inherited disabled");app.configure({disabled:false});await settle();assert(!part("a").disabled&&!part("b").disabled&&part("disabled").disabled,"initial inherited disabled releases");assert(app.snapshot().calls.writes===0,"disabled release preserves child bindings");
assert(same(app.snapshot().value,["a"]),"initial default");state("a",true);state("b",false);const omitted=part("omitted").getAttribute("data-value");assert(omitted===assignedKey,"Runtime generated key survives disabled update");app.configure({omittedTitle:"Updated item"});await settle();assert(part("omitted").title==="Updated item"&&part("omitted").getAttribute("data-value")===assignedKey,"Runtime generated key survives native attribute update");assert(app.snapshot().calls.writes===0,"group child binding untouched");
part("b").click();await settle();assert(same(app.snapshot().value,["a","b"]),"multiple accepted");app.configure({cancel:true});part("a").click();await settle();assert(same(group.getValue(),["a","b"]),"group cancellation");app.configure({childCancel:true});part("a").click();await settle();state("a",true);app.configure({});part("main").addEventListener("starwind:value-change",event=>event.preventDefault(),{once:true});part("a").click();await settle();state("a",true);document.addEventListener("starwind:pressed-change",event=>event.preventDefault(),{once:true});part("a").click();await settle();assert(same(group.getValue(),["b"]),"late document cancellation follows accepted group state");
app.configure({command:[omitted]});part("a").click();await settle();assert(same(group.getValue(),[omitted]),"new callback command");app.configure({});state("omitted",true);const count=app.snapshot().calls.group;const input=["a","a","","b"];app.set(input);await settle();assert(same(group.getValue(),["a","b"])&&same(input,["a","a","","b"]),"normalization copies");assert(app.snapshot().calls.group===count,"silent parent command");app.set(undefined);await settle();assert(same(group.getValue(),["a","b"]),"undefined retains");app.set(["a"]);await settle();app.mutate();await settle();assert(same(group.getValue(),["a","b"]),"array mutation command");app.configure({multiple:false});await settle();assert(same(app.snapshot().value,["a"]),"multiple false normalized publication");part("a").click();await settle();assert(same(app.snapshot().value,[]),"empty single array");
app.configure({disabled:true});await settle();assert(part("a").disabled,"group disabled");app.replace();app.configure({disabled:true,extra:true});await settle();assert(part("b").disabled&&part("extra").disabled,"replacement and new child inherit disabled");app.configure({disabled:false});await settle();assert(!part("a").disabled&&part("disabled").disabled,"own disabled retained");assert(!part("b").disabled&&!part("extra").disabled,"replacement and new child disabled releases");const childCalls=app.snapshot().calls.child;app.configure({childCancel:true});part("b").click();await settle();assert(app.snapshot().calls.child===childCalls+1&&same(app.snapshot().value,[]),"replacement child callback can cancel");app.configure({});part("b").click();await settle();assert(same(app.snapshot().value,["b"]),"released replacement child selects");part("extra").click();await settle();assert(same(app.snapshot().value,["extra"])&&app.snapshot().calls.writes===0,"released new child selects with bindings untouched");app.configure({extra:false});await settle();part("a").focus();part("a").dispatchEvent(new KeyboardEvent("keydown",{key:"ArrowRight",bubbles:true,cancelable:true}));await settle();assert(document.activeElement===part("b"),"roving keyboard");app.configure({orientation:"vertical",loopFocus:false});await settle();part("omitted").focus();part("omitted").dispatchEvent(new KeyboardEvent("keydown",{key:"ArrowDown",bubbles:true,cancelable:true}));assert(document.activeElement===part("omitted"),"loop false");app.configure({loopFocus:true});await settle();part("omitted").dispatchEvent(new KeyboardEvent("keydown",{key:"ArrowDown",bubbles:true,cancelable:true}));assert(document.activeElement===part("a"),"loop true");
app.configure({extra:true});await settle();part("extra").click();await settle();assert(same(app.snapshot().value,["extra"]),"dynamic member");const retired=part("extra");app.configure({extra:false});await settle();assert(same(app.snapshot().value,[]),"removal publication");retired.click();await settle();assert(same(group.getValue(),[]),"retired cleanup");app.set(["b"]);await settle();app.replace();await settle();state("b",true);app.configure({childValue:"new-b",native:false});await settle();part("b").click();await settle();assert(same(app.snapshot().value,["new-b"])&&part("b").tagName==="SPAN","replacement child connection");assert(app.snapshot().calls.writes===0&&app.snapshot().falseChild===false&&app.snapshot().trueChild===true&&app.snapshot().undefinedChild===undefined,"ownership after replacements");
state("solo",true);part("solo").click();await settle();assert(app.snapshot().pressed===false,"solo accepted");state("sync",false);app.configure({soloCancel:true});part("solo").click();await settle();state("solo",false);app.configure({});app.solo(true);await settle();state("sync",true);const soloCount=app.snapshot().calls.solo;app.solo(undefined);await settle();state("solo",true);app.configure({defaults:false,syncGroup:"two",native:true});await settle();state("solo",true);assert(app.snapshot().calls.solo===soloCount,"recreation silent");part("sync").click();await settle();state("solo",false);assert(app.snapshot().pressed===false,"sync notification publication");
const fg=app.snapshot().calls.functionGroup,fs=app.snapshot().calls.functionSolo;part("fx").click();part("fx-solo").click();await settle();assert(same(app.snapshot().functionValue,["fx"])&&app.snapshot().functionPressed===true&&app.snapshot().calls.functionGroup===fg+1&&app.snapshot().calls.functionSolo===fs+1,"function binding single writes");app.configure({retain:true});part("fy").click();part("fx-solo").click();await settle();assert(same(createToggleGroup(part("function")).getValue(),["fx"]),"group canonical readback");state("fx-solo",true);app.configure({});
part("plain").click();part("pb").click();await settle();state("plain",true);assert(app.snapshot().plain===false&&same(app.snapshot().plainGroup,["pa"]),"plain models local acceptance");app.setPlain(true);app.setPlainGroup(["pb"]);await settle();app.setPlain(false);app.setPlainGroup(["pa"]);await settle();state("plain",false);assert(same(createToggleGroup(part("plain-group")).getValue(),["pa"]),"plain model command aliases");
if(part("main").hasAttribute("data-spacing"))assert(part("main").style.getPropertyValue("--gap").trim()==="3"&&part("main").dataset.size==="sm"&&part("main").dataset.variant==="outline","stock spacing merge");
const before=app.snapshot().calls;app.changeAttachment();await settle();assert(app.snapshot().calls.attach===before.attach+1&&app.snapshot().calls.detach===before.detach+1&&app.snapshot().calls.sibling===before.sibling,"independent attachment update");app.changeRef();await settle();assert(app.snapshot().log.slice(-2).join()==="ref:0:clear,ref:1:set"&&createToggleGroup(part("main"))===group,"ref replacement order");app.configure({attached:false});await settle();assert(app.snapshot().calls.attach===app.snapshot().calls.detach&&app.snapshot().calls.sibling===app.snapshot().calls.siblingClear,"spread cleanup");await unmount(app);await settle();assert(!target.children.length&&app.snapshot().calls.refs===app.snapshot().calls.clear&&app.snapshot().calls.direct===app.snapshot().calls.directClear,"unmount cleanup");result.complete=true;
}catch(error){result.error=error.stack??String(error);}document.documentElement.dataset.toggleResult=JSON.stringify(result);`;
