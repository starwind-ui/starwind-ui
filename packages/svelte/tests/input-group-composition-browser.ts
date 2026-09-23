import { verifyInputLifecycle } from "./input-native-model-browser.js";
import assert from "node:assert/strict";
import { once } from "node:events";
import { readFile } from "node:fs/promises";
import { createServer } from "node:http";
import path from "node:path";
import { chromium } from "playwright";
import type { DistConsumer } from "./dist-consumer.js";
import { BROWSER_BUILD } from "./compatibility-hydration.js";

export async function verifyInputGroupParts(consumer: DistConsumer) {
  await consumer.write({
    "GroupLifecycle.svelte": APP,
    "hydrate-main.js": CLIENT,
    "build-group.mjs": BROWSER_BUILD,
    "group-ssr.mjs": `import assert from "node:assert/strict";import {render} from "svelte/server";import App from "./GroupLifecycle.svelte";import Group,* as named from "./input-group/index.js";
assert.equal(globalThis.document,undefined);assert.deepEqual(Object.keys(named).sort(),["InputGroup","InputGroupAddon","InputGroupButton","InputGroupInput","InputGroupText","InputGroupTextarea","InputGroupVariants","default"]);const expected={Root:"InputGroup",Addon:"InputGroupAddon",Button:"InputGroupButton",Input:"InputGroupInput",Text:"InputGroupText",Textarea:"InputGroupTextarea"};for(const [part,name] of Object.entries(expected)){assert.equal(Group[part],named[name]);render(Group[part],{props:{ref(){throw new Error("SSR ref write")}}});}const body=render(App).body;assert.equal(body,render(App).body);console.log(JSON.stringify({body}));`,
  });
  const { body } = JSON.parse(await consumer.run("group-ssr.mjs", { loader: true }));
  assert.match(body, /data-slot="input-group"/);
  assert.doesNotMatch(body, /\[object Object\]/);
  const build = JSON.parse(await consumer.run("build-group.mjs"));
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
    await page.waitForFunction(() => document.documentElement.dataset.groupResult, undefined, {
      timeout: 30000,
    });
    const result = await page.evaluate(() =>
      JSON.parse(document.documentElement.dataset.groupResult!),
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

export async function verifyInputGroupLifecycle(consumer: DistConsumer) {
  return {
    input: await verifyInputLifecycle(consumer, "input-group"),
    composition: await verifyInputGroupParts(consumer),
  };
}
const APP = `<script lang="ts">
import Group from "./input-group/index.js";
import Textarea from "./textarea/index.js";
import {createAttachmentKey} from "svelte/attachments";
let value=$state<string|null|undefined>(), functional=$state<string|null|undefined>("initial"), plain=$state<string|null>("plain");
let key=$state(0), attached=$state(true), disabled=$state(false);
let align=$state<"inline-start"|"inline-end"|"block-start"|"block-end">("inline-start");
let inputValue=$state<string|number|string[]|undefined>();
let peerValue=$state<string|null|undefined>();
const calls={attach:0,detach:0,textareaInput:0,textareaChange:0,setter:0,button:0,addon:0};
let rootNode=$state<HTMLDivElement>(),addonNode=$state<HTMLDivElement>(),textNode=$state<HTMLSpanElement>(),buttonNode=$state<HTMLButtonElement>(),textareaNode=$state<HTMLTextAreaElement>(),anchorNode=$state<HTMLAnchorElement>();
const buttonRef=(node:HTMLButtonElement|null)=>{buttonNode=node??undefined;},anchorRef=(node:HTMLAnchorElement|null)=>{anchorNode=node??undefined;};
const attachmentKey=createAttachmentKey();
let attachments=$derived(attached ? {[attachmentKey]:(node:HTMLElement)=>{if(!["DIV","SPAN","BUTTON","INPUT","TEXTAREA"].includes(node.tagName))throw new Error("wrong native attachment");calls.attach++;return()=>{calls.detach++;};}} : {});
export function configure(next:{align?:typeof align;disabled?:boolean;attached?:boolean;value?:string|null;plain?:string|null}) {if(next.align)align=next.align;if(next.disabled!==undefined)disabled=next.disabled;if(next.attached!==undefined)attached=next.attached;if('value'in next)value=next.value;if('plain'in next)plain=next.plain??null;}
export function replace(){key++;}
export function snapshot(){return{value,peerValue,functional,plain,inputValue,refTags:[rootNode,addonNode,textNode,buttonNode,textareaNode,anchorNode].map(node=>node?.tagName??null),calls:{...calls}};}
</script>
<form id="group-form" onsubmit={event=>event.preventDefault()}>
{#key key}<Group.Root id="group" bind:ref={rootNode} {...attachments}>
<Group.Addon id="addon" {align} bind:ref={addonNode} {...attachments} onclick={()=>calls.addon++}><Group.Text id="text" bind:ref={textNode} {...attachments}>Passive addon</Group.Text><Group.Button id="button" ref={buttonRef} {...attachments} onclick={()=>calls.button++}>Run</Group.Button></Group.Addon>
<Group.Input id="independent-input" name="input" defaultValue="input seed" bind:value={inputValue} {...attachments}/>
<Group.Textarea id="textarea" name="textarea" defaultValue="textarea seed" bind:value {disabled} bind:ref={textareaNode} {...attachments} oninput={()=>calls.textareaInput++} onchange={()=>calls.textareaChange++}/>
</Group.Root><Textarea id="peer-textarea" defaultValue="textarea seed" bind:value={peerValue}/>{/key}
<Group.Root id="slot-override" data-slot="caller-root"><Group.Addon id="fixed-slot" data-slot="caller-addon">Slot</Group.Addon><Group.Input id="fixed-control" data-slot="caller-input"/></Group.Root>
<Group.Textarea id="functional" name="functional" bind:value={()=>functional,next=>{calls.setter++;functional=next;}}/>
<Group.Textarea id="plain-textarea" name="plain-textarea" value={plain}/>
<Group.Button id="submit" type="submit" variant="outline" size="icon-sm" aria-label="Submit icon">+</Group.Button>
<Group.Button id="anchor" as="a" href="#group" ref={anchorRef}>Link</Group.Button>
</form>
`;
const CLIENT = `import {hydrate,flushSync,tick,unmount} from "svelte";import App from "./GroupLifecycle.svelte";
const result={},node=id=>document.getElementById(id),assert=(value,message)=>{if(!value)throw new Error(message)};
const app=hydrate(App,{target:node("app")});const settle=async()=>{flushSync();await tick();await new Promise(resolve=>setTimeout(resolve,20));flushSync();};const type=(id,value)=>{node(id).value=value;node(id).dispatchEvent(new Event("input",{bubbles:true}));};
try{
await settle();assert(app.snapshot().value==="textarea seed" && app.snapshot().inputValue==="input seed","independent omitted defaults");assert(node("group").getAttribute("role")==="group" && node("addon").getAttribute("role")==="group" && node("addon").dataset.align==="inline-start","group and addon anatomy");
assert(node("slot-override").dataset.slot==="caller-root" && node("fixed-slot").dataset.slot==="input-group-addon" && node("fixed-control").dataset.slot==="input-group-control","contract data-slot order");
node("button").focus();node("text").click();await settle();assert(document.activeElement===node("button") && app.snapshot().calls.addon===1,"passive addon preserves focus");node("button").click();await settle();assert(app.snapshot().calls.button===1 && node("button").type==="button","button default and callback");assert(node("submit").type==="submit" && node("anchor").tagName==="A","explicit Button native branch");
for(const align of ["inline-end","block-start","block-end"]){app.configure({align});await settle();assert(node("addon").dataset.align===align,"live addon alignment");}
type("textarea","edited textarea");await settle();assert(app.snapshot().value==="edited textarea" && app.snapshot().inputValue==="input seed" && app.snapshot().calls.textareaInput===1,"independent textarea publication");node("textarea").dispatchEvent(new Event("change",{bubbles:true}));await settle();assert(app.snapshot().calls.textareaChange===1,"native textarea change once");
type("functional","function edit");await settle();assert(app.snapshot().functional==="function edit" && app.snapshot().calls.setter===1,"textarea function binding");type("plain-textarea","native edit");await settle();assert(app.snapshot().plain==="plain" && node("plain-textarea").value==="native edit","plain native textarea semantics");app.configure({plain:"command",value:"command"});await settle();assert(node("plain-textarea").value==="command" && node("textarea").value==="command" && app.snapshot().calls.textareaInput===1,"silent textarea commands");
app.configure({disabled:true});await settle();assert(node("textarea").disabled && !new FormData(node("group-form")).has("textarea"),"textarea disabled omission");app.configure({disabled:false});await settle();
node("group-form").addEventListener("reset",event=>event.preventDefault(),{once:true});node("group-form").reset();await settle();assert(node("textarea").value==="command","canceled textarea reset");node("group-form").reset();await settle();assert(app.snapshot().value==="textarea seed" && app.snapshot().inputValue==="input seed" && app.snapshot().calls.textareaInput===1,"native reset independent seeds");
assert(JSON.stringify(app.snapshot().refTags)===JSON.stringify(["DIV","DIV","SPAN","BUTTON","TEXTAREA","A"]),"bindable refs expose each current native owner "+JSON.stringify(app.snapshot().refTags));
app.configure({attached:false});await settle();assert(app.snapshot().calls.attach===app.snapshot().calls.detach,"symbol removal");app.configure({attached:true});await settle();assert(app.snapshot().calls.attach===app.snapshot().calls.detach+6,"symbol restoration on six native owners");
const retired=node("textarea"),retiredPeer=node("peer-textarea"),beforeCalls=app.snapshot().calls.textareaInput;app.replace();await settle();for(const element of [retired,retiredPeer]){element.value="retired";element.dispatchEvent(new Event("input",{bubbles:true}));}await settle();assert(app.snapshot().value===app.snapshot().peerValue && app.snapshot().calls.textareaInput===beforeCalls,"retired textarea retains native binding parity and releases callback");await unmount(app);await settle();const final=app.snapshot();assert(final.calls.attach===final.calls.detach && final.refTags.every(tag=>tag===null) && !node("app").children.length,"all part teardown clears bound refs");result.complete=true;
}catch(error){result.error=error.stack??String(error)}document.documentElement.dataset.groupResult=JSON.stringify(result);
`;
