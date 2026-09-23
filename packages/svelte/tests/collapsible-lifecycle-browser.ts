import assert from "node:assert/strict";
import { once } from "node:events";
import { readFile } from "node:fs/promises";
import { createServer } from "node:http";
import path from "node:path";
import { chromium } from "playwright";
import { BROWSER_BUILD } from "./compatibility-hydration.js";
import type { DistConsumer } from "./dist-consumer.js";
import { collapsibleNativeHiddenReproduction } from "./styled-collapsible-consumer.js";

export async function verifyCollapsibleLifecycle(consumer: DistConsumer, styled = false) {
  await consumer.write({
    "NativeHidden.svelte": collapsibleNativeHiddenReproduction,
    "native-hidden-ssr.mjs": `import {render} from "svelte/server";import App from "./NativeHidden.svelte";console.log(JSON.stringify({body:render(App).body}));`,
    "CollapsibleLifecycle.svelte": createApp(styled),
    "hydrate-main.js": CLIENT,
    "build-collapsible.mjs": BROWSER_BUILD,
    "collapsible-ssr.mjs": `import assert from "node:assert/strict";import {render} from "svelte/server";import App from "./CollapsibleLifecycle.svelte";import Collapsible,* as named from "./collapsible/index.js";
assert.equal(globalThis.document,undefined);assert.equal(Collapsible.Root,named.Collapsible);const body=render(App).body;assert.equal(body,render(App).body);console.log(JSON.stringify({body}));`,
  });
  const { body } = JSON.parse(await consumer.run("collapsible-ssr.mjs", { loader: true }));
  const nativeHidden = JSON.parse(await consumer.run("native-hidden-ssr.mjs", { loader: true }));
  assert.match(nativeHidden.body, /id="native-hidden"/);
  assert.match(nativeHidden.body, / hidden(?:="until-found")?>/);
  assert.match(body, /data-sw-collapsible-panel/);
  assert.match(body, /data-default-open="true"/);
  assert.doesNotMatch(body, /aria-expanded="true"/);
  for (const tag of body.match(/<[^>]*data-sw-collapsible-trigger[^>]*>/g) ?? []) {
    assert.match(tag, /aria-expanded="false"/);
    assert.match(tag, /data-state="closed"/);
  }
  for (const tag of body.match(/<[^>]*data-sw-collapsible-panel[^>]*>/g) ?? []) {
    assert.match(tag, /data-state="closed"/);
    assert.match(tag, / hidden(?:[ =>])/);
  }
  assert.match(body, /data-hidden-until-found=""/);
  const build = JSON.parse(await consumer.run("build-collapsible.mjs"));
  const javascript = await readFile(path.join(consumer.root, "browser.js"));
  const css = `.animate [data-presence-test][data-state="closed"] { animation: collapse-close 140ms linear; } @keyframes collapse-close { from { opacity:1 } to { opacity:0 } }`;
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
    await page.waitForFunction(
      () => document.documentElement.dataset.collapsibleResult,
      undefined,
      {
        timeout: 30000,
      },
    );
    const result = await page.evaluate(() =>
      JSON.parse(document.documentElement.dataset.collapsibleResult!),
    );
    assert.deepEqual(diagnostics, []);
    assert.equal(result.error, undefined, JSON.stringify(result));
    for (const name of [
      "hydrationExact",
      "models",
      "cancellation",
      "construction",
      "presence",
      "composition",
      "cleanup",
      "disabledRelease",
    ])
      assert.equal(result[name], true, name);
    return { result, build, nativeHidden };
  } finally {
    await browser?.close();
    await new Promise<void>((resolve, reject) =>
      server.close((error) => (error ? reject(error) : resolve())),
    );
  }
}

function createApp(styled: boolean): string {
  return `<script lang="ts">
import Primitive, { type CollapsibleOpenChangeDetails, type ButtonChildPayload } from "@starwind-ui/svelte/collapsible";
import Styled from "./collapsible/index.js";
import Button from "@starwind-ui/svelte/button";
import { flushSync } from "svelte";
import { createAttachmentKey, type Attachment } from "svelte/attachments";
const Root = ${styled ? "Styled.Root" : "Primitive.Root"}, Trigger = ${styled ? "Styled.Trigger" : "Primitive.Trigger"}, Panel = ${styled ? "Styled.Content" : "Primitive.Panel"};
let open = $state<boolean | undefined>(), plain = $state<boolean | undefined>(false), empty = $state<boolean | undefined>();
let seed = $state(true), disabled = $state(false), ownDisabled = $state(false), untilFound = $state(true);
let callbackMode = $state("accept"), domMode = $state("accept");
let command = $state<boolean | undefined>(), optionInCallback = $state(false), flushInCallback = $state(false);
let triggerKey=$state(0), panelKey=$state(0), childKey=$state(0), wrapped=$state(false), dependency=$state(0), refVersion=$state(0), attachmentVersion=$state(0);
let triggerId=$state<string|undefined>("trigger-initial"), panelId=$state<string|undefined>("panel-initial"), className=$state("initial"), panelStyle=$state("background:red");
const events: string[]=[]; const counts={ callback:0, dom:0, clicks:0, omitted:0, plain:0 };
const refs=new Map<string,HTMLElement>(), attachments=new Map<string,HTMLElement>(), refLog:string[]=[], attachmentLog:string[]=[];let runs=0;
function onChange(next:boolean,detail:CollapsibleOpenChangeDetails){counts.callback++;events.push("callback:"+next+":"+open+":"+detail.previousOpen+":"+detail.reason);if(callbackMode==="cancel")detail.cancel();if(command!==undefined&&domMode!=="command")open=command;if(optionInCallback)disabled=!disabled;if(flushInCallback)flushSync();}
function onDom(event:Event){const detail=(event as CustomEvent<CollapsibleOpenChangeDetails>).detail;counts.dom++;events.push("dom:"+detail.open+":"+open+":"+detail.isCanceled);if(domMode==="cancel")event.preventDefault();if(domMode==="command"){open=command;flushSync();}}
const ref=(name:string,version=0)=>(node:HTMLElement|null)=>{if(node){if(refs.has(name))throw new Error("duplicate ref "+name);refs.set(name,node);}else refs.delete(name);refLog.push(name+":"+version+":"+(node?"set":"clear"));};
const attach=(name:string,version=0):Attachment<HTMLElement>=>node=>{void dependency;runs++;if(attachments.has(name))throw new Error("duplicate attachment");attachments.set(name,node);attachmentLog.push(name+":"+version+":set");if(name==="root")node.addEventListener("starwind:open-change",onDom);return()=>{if(name==="root")node.removeEventListener("starwind:open-change",onDom);attachments.delete(name);attachmentLog.push(name+":"+version+":clear");};};
const attrs=(name:string)=>({[createAttachmentKey()]:attach(name)});
const triggerRef=ref("trigger"),panelRef=ref("panel"),triggerAttrs=attrs("trigger"),panelAttrs=attrs("panel");
let rootRef=$derived(ref("root",refVersion));const rootKey=createAttachmentKey();let rootAttrs=$derived({[rootKey]:attach("root",attachmentVersion)});
export function setOpen(next:boolean|undefined){open=next;}
export function setPlain(next:boolean|undefined){plain=next;}
export function setSeed(next:boolean){seed=next;}
export function setDisabled(next:boolean){disabled=next;}
export function setOwnDisabled(next:boolean){ownDisabled=next;}
export function setUntilFound(next:boolean){untilFound=next;}
export function configure(callback="accept",dom="accept",next?:boolean,options=false,flush=false){callbackMode=callback;domMode=dom;command=next;optionInCallback=options;flushInCallback=flush;}
export function replace(name:string){if(name==="trigger")triggerKey++;if(name==="panel")panelKey++;if(name==="child")childKey++;}
export function setWrapped(next:boolean){wrapped=next;}
export function setIds(trigger?:string,panel?:string){triggerId=trigger;panelId=panel;}
export function updatePresentation(){className="updated";panelStyle="background:blue";}
export function replaceRef(){refVersion++;}
export function replaceAttachment(){attachmentVersion++;}
export function updateDependency(){dependency++;}
export function snapshot(){return{open,plain,empty,counts:{...counts},events:[...events],refs:refs.size,attachments:attachments.size,ownersMatch:[...refs].every(([name,node])=>attachments.get(name)===node),runs,refLog:[...refLog],attachmentLog:[...attachmentLog]};}
</script>
{#snippet child({props,children}:ButtonChildPayload)}{#key childKey}{#if wrapped}<Button.Root {...props}>{@render children?.()}</Button.Root>{:else}<button {...props}>{@render children?.()}</button>{/if}{/key}<span data-child-sibling>Hint</span>{/snippet}
<Root id="collapsible-root" bind:open defaultOpen={seed} {disabled} onOpenChange={onChange} ref={rootRef} {...rootAttrs} class={className}>
 {#snippet children(accepted)}
 {#key triggerKey}<Trigger id={triggerId} {child} disabled={ownDisabled} ref={triggerRef} {...triggerAttrs} onclick={()=>counts.clicks++}>Toggle main</Trigger>{/key}
 {#key panelKey}<Panel id={panelId} data-presence-test hiddenUntilFound={untilFound} ref={panelRef} {...panelAttrs} class={className} style={panelStyle}><p>Main content</p></Panel>{/key}
 <output data-accepted>{String(accepted)}</output>
 {/snippet}
</Root>
<Root id="omitted-root" onOpenChange={()=>counts.omitted++}><Trigger>Omitted</Trigger><Panel>Omitted content</Panel></Root>
<Root id="plain-root" open={plain} defaultOpen={seed} onOpenChange={()=>counts.plain++}><Trigger>Plain</Trigger><Panel>Plain content</Panel></Root>
<Root id="empty-root" bind:open={empty}><Trigger>Empty</Trigger><Panel hiddenUntilFound>Empty content</Panel></Root>
<Root id="outer-root"><Trigger>Outer</Trigger><Panel><Root id="nested-root" defaultOpen><Trigger>Nested</Trigger><Panel>Nested content</Panel></Root></Panel></Root>
`;
}

const CLIENT = `import {hydrate,flushSync,tick,unmount} from "svelte";
import App from "./CollapsibleLifecycle.svelte";
const result={};const assert=(condition,message)=>{if(!condition)throw new Error(message);};const pause=ms=>new Promise(resolve=>setTimeout(resolve,ms));
const settle=async()=>{flushSync();await tick();flushSync();await Promise.resolve();};
const target=document.getElementById("app"),root=()=>document.getElementById("collapsible-root"),trigger=()=>root().querySelector('[data-sw-collapsible-trigger]'),panel=()=>root().querySelector('[data-sw-collapsible-panel]');
const get=id=>document.getElementById(id),button=id=>get(id).querySelector('[data-sw-collapsible-trigger]'),isOpen=id=>get(id).getAttribute("data-state")==="open";
const before=[root(),trigger(),panel()];const app=hydrate(App,{target});
try{
 await settle();
 result.hydrationExact=before.every((node,index)=>node===[root(),trigger(),panel()][index]);
 assert(app.snapshot().open===true&&app.snapshot().empty===false,"initial undefined normalization");
 assert(app.snapshot().counts.callback===0&&app.snapshot().counts.dom===0,"initialization emitted proposals");
 assert(isOpen("collapsible-root")&&!panel().hidden&&trigger().getAttribute("aria-expanded")==="true"&&root().querySelector('[data-accepted]').textContent==="true","initial accepted state");
 assert(!isOpen("plain-root")&&!isOpen("omitted-root")&&isOpen("nested-root")&&!isOpen("outer-root"),"initial plain/default/nested state");
 assert(app.snapshot().refs===3&&app.snapshot().attachments===3&&app.snapshot().ownersMatch&&root().querySelectorAll("button").length===1,"initial semantic owners");
  app.setOpen(false);await settle();assert(!isOpen("collapsible-root")&&panel().hidden&&app.snapshot().counts.callback===0 ,"silent parent command");
 app.setOpen(undefined);await settle();assert(!isOpen("collapsible-root")&&app.snapshot().open===undefined,"later undefined retention");
 trigger().click();await settle();assert(isOpen("collapsible-root")&&app.snapshot().open===true,"accepted bound interaction");
 assert(app.snapshot().events.slice(-2).join(",")==="callback:true:undefined:false:trigger-press,dom:true:undefined:false","proposal and DOM publication order");
 button("omitted-root").click();button("plain-root").click();await settle();assert(isOpen("omitted-root")&&isOpen("plain-root")&&app.snapshot().plain===false,"omitted and plain local interactions");
 app.setPlain(undefined);await settle();assert(isOpen("plain-root"),"plain later undefined");app.setPlain(false);await settle();assert(!isOpen("plain-root")&&app.snapshot().counts.plain===1,"plain defined silent command");
 result.models=true;
 app.setOpen(true);await settle();
 app.configure("cancel");let counts=app.snapshot().counts;trigger().click();await settle();assert(isOpen("collapsible-root")&&app.snapshot().open===true&&app.snapshot().counts.callback===counts.callback+1&&app.snapshot().counts.dom===counts.dom+1&&!panel().hidden,"callback cancellation");
 app.configure("accept","cancel");trigger().click();await settle();assert(isOpen("collapsible-root")&&app.snapshot().open===true&&!panel().hidden,"DOM cancellation");result.cancellation=true;
 app.setOwnDisabled(true);await settle();assert(trigger().disabled,"own disabled input");app.setOwnDisabled(false);await settle();assert(!trigger().disabled,"own disabled removal");
 app.setOpen(false);await settle();app.setSeed(true);await settle();assert(!isOpen("collapsible-root")&&panel().hidden,"frozen construction default");
 result.construction=true;
 assert(panel().getAttribute("hidden")==="until-found","initial hiddenUntilFound option");app.configure("cancel");panel().dispatchEvent(new Event("beforematch"));panel().removeAttribute("hidden");await pause(20);await settle();assert(panel().getAttribute("hidden")==="until-found"&&!isOpen("collapsible-root"),"canceled find-in-page restoration");
 app.configure();panel().dispatchEvent(new Event("beforematch"));await settle();assert(isOpen("collapsible-root")&&!panel().hidden&&app.snapshot().events.some(event=>event.endsWith(":beforematch")),"accepted find-in-page open");
 document.documentElement.classList.add("animate");app.setUntilFound(false);await settle();app.setOpen(false);await settle();assert(!panel().hidden&&panel().hasAttribute("data-ending-style"),"close animation presence");app.setOpen(true);await settle();await pause(200);assert(!panel().hidden&&isOpen("collapsible-root")&&!panel().hasAttribute("data-ending-style"),"rapid reopen preserved visibility");
 app.setOpen(false);await settle();await pause(200);assert(panel().hidden,"close completion");document.documentElement.classList.remove("animate");result.presence=true;
 app.setOpen(true);await settle();
 app.updatePresentation();await settle();assert(panel().style.background==="blue"&&!panel().hidden ,"presentation preserves visibility");
 assert(root().querySelectorAll("button").length===1&&app.snapshot().refs===3&&app.snapshot().ownersMatch,"initial child composition");result.composition=true;
 assert(trigger().getAttribute("aria-controls")===panel().id&&panel().getAttribute("aria-labelledby")===trigger().id,"Runtime initial ARIA links");
 app.setOpen(true);app.setDisabled(true);await settle();assert(trigger().disabled&&trigger().hasAttribute("data-disabled"),"root disabled application");app.setDisabled(false);await settle();result.disabledRelease=!trigger().disabled&&!trigger().hasAttribute("data-disabled");
 document.documentElement.classList.add("animate");app.setOpen(false);await settle();const detached=panel(),oldButton=trigger(),beforeCleanup=app.snapshot().counts.callback;await unmount(app);await settle();const hidden=detached.hidden;oldButton.click();detached.dispatchEvent(new Event("beforematch"));await pause(200);assert(app.snapshot().counts.callback===beforeCleanup&&app.snapshot().refs===0&&app.snapshot().attachments===0&&target.children.length===0&&detached.hidden===hidden,"unmount listener, ref and close-animation cleanup");result.cleanup=true;
}catch(error){result.error=error.stack??String(error);}
document.documentElement.dataset.collapsibleResult=JSON.stringify(result);
`;
