import assert from "node:assert/strict";
import { once } from "node:events";
import { readFile } from "node:fs/promises";
import { createServer } from "node:http";
import path from "node:path";
import { chromium } from "playwright";
import { BROWSER_BUILD } from "./compatibility-hydration.js";
import type { DistConsumer } from "./dist-consumer.js";

export async function verifyTabs(consumer: DistConsumer, styled = false) {
  await consumer.write({
    "TabsCase.svelte": caseSource(styled),
    "TabsApp.svelte": appSource(styled),
    "hydrate-main.js": `const styled = ${styled};\n${CLIENT}`,
    "tabs-build.mjs": BROWSER_BUILD,
    "tabs-ssr.mjs": `import assert from "node:assert/strict";import {render} from "svelte/server";import App from "./TabsApp.svelte";import Tabs,* as named from "@starwind-ui/svelte/tabs";
assert.equal(globalThis.document,undefined);assert.equal(Tabs.Root,named.TabsRoot);assert.deepEqual(Object.keys(Tabs).sort(),["Indicator","List","Panel","Root","Tab"]);const ref=()=>{throw new Error("SSR callback")};render(Tabs.Root,{props:{ref}});const body=render(App).body;assert.equal(body,render(App).body);console.log(JSON.stringify({body}));`,
  });
  const { body } = JSON.parse(await consumer.run("tabs-ssr.mjs", { loader: true }));
  assert.match(body, /role="tab"/);
  assert.match(body, /role="tabpanel"/);
  assert.doesNotMatch(body, /\[object Object\]/);
  const build = JSON.parse(await consumer.run("tabs-build.mjs"));
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
    await page.waitForFunction(() => document.documentElement.dataset.tabsResult, undefined, {
      timeout: 30000,
    });
    const result = await page.evaluate(() =>
      JSON.parse(document.documentElement.dataset.tabsResult!),
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

function caseSource(styled: boolean) {
  const imports = styled
    ? 'import Tabs from "./tabs/index.js";'
    : 'import Tabs from "@starwind-ui/svelte/tabs";';
  const tab = styled ? "Trigger" : "Tab",
    panel = styled ? "Content" : "Panel";
  return `<script lang="ts">
${imports}import {untrack,flushSync} from "svelte";import {createAttachmentKey} from "svelte/attachments";import {createTabs,type TabsValueChangeDetails} from "@starwind-ui/runtime/tabs";
let {caseId,mode="bound",initial,initialDefault,storage}:{caseId:string;mode?:string;initial?:string|null;initialDefault?:string|null;storage?:string}=$props();
let model=$state<string|null|undefined>(untrack(()=>initial)),syncKey=$state(untrack(()=>storage)),orientation=$state<"horizontal"|"vertical">("horizontal"),auto=$state(false),loop=$state(true),disabled=$state(false),items=$state(["a","b","c",""]),version=$state(0),refVersion=$state(0),symbolVersion=$state(0),callbackVersion=$state(0),visible=$state(true),cancel=$state(false),command=$state<string|null|undefined>(),remove=$state(false);
const proposals:{next:string|null;previous:string|null;reason:string;model:string|null|undefined;version:number}[]=[],references:{part:string;version:number;node:Element|null}[]=[],attachments:string[]=[];let native=0;
const reference=(part:string,v:number)=>(node:Element|null)=>{references.push({part,version:v,node});};const rootRef=$derived(reference("root",refVersion)),listRef=$derived(reference("list",refVersion)),tabRef=$derived(reference("tab",refVersion)),panelRef=$derived(reference("panel",refVersion)),indicatorRef=$derived(reference("indicator",refVersion));
const symbol=createAttachmentKey();const attached=$derived({[symbol]:symbolVersion===2?undefined:((v:number)=>(node:Element)=>{attachments.push("set:"+v);return()=>attachments.push("clear:"+v);})(symbolVersion)});
const onChange=$derived(((v:number)=>(next:string|null,detail:TabsValueChangeDetails)=>{proposals.push({next,previous:detail.previousValue,reason:detail.reason,model,version:v});if(cancel)detail.cancel();if(command!==undefined){model=command;flushSync();}if(remove){visible=false;flushSync();}})(callbackVersion));
export function setModel(next:string|null|undefined){model=next;}export function options(next:{syncKey?:string;orientation?:"horizontal"|"vertical";auto?:boolean;loop?:boolean;disabled?:boolean;cancel?:boolean;command?:string|null;remove?:boolean}){if("syncKey"in next)syncKey=next.syncKey;if(next.orientation)orientation=next.orientation;if(next.auto!==undefined)auto=next.auto;if(next.loop!==undefined)loop=next.loop;if(next.disabled!==undefined)disabled=next.disabled;if(next.cancel!==undefined)cancel=next.cancel;if("command"in next)command=next.command;if(next.remove!==undefined)remove=next.remove;}
export function replace(part:string){if(part==="parts")version++;if(part==="ref")refVersion++;if(part==="attachment")symbolVersion++;if(part==="callback")callbackVersion++;}export function collection(next:string[]){items=next;}export function show(next:boolean){visible=next;}export function refs(){return [...references];}export function snapshot(){return {model,proposals:[...proposals],attachments:[...attachments],native};}
</script>
{#snippet content(accepted:string|null)}<output data-accepted>{JSON.stringify(accepted)}</output>{#key version}<Tabs.List activateOnFocus={auto} loopFocus={loop} ref={listRef} style="display:flex;position:relative;width:400px">{#each items as item(item)}<Tabs.${tab} value={item} disabled={item==="b"&&disabled} ref={item==="b"?tabRef:undefined} {...(item==="b"?attached:{})} data-tab={item} onclick={()=>native++} style="width:100px;height:32px">{#snippet children(active)}{item||"Empty"}<span data-active-snippet>{String(active)}</span>{/snippet}</Tabs.${tab}>{/each}${styled ? "" : "<Tabs.Indicator ref={indicatorRef} data-indicator/>"}</Tabs.List>{#each items as item(item)}<Tabs.${panel} value={item} keepMounted={item==="c"} ref={item==="b"?panelRef:undefined} data-panel={item}>{#snippet children(active)}<span data-panel-active>{String(active)}</span>{/snippet}</Tabs.${panel}>{/each}{/key}{/snippet}
{#if visible}{#if mode==="omitted"}<Tabs.Root data-case={caseId} defaultValue={initialDefault} {syncKey} {orientation} onValueChange={onChange} ref={rootRef} children={content}/>{:else if mode==="plain"}<Tabs.Root data-case={caseId} value={model} defaultValue={initialDefault} {syncKey} {orientation} onValueChange={onChange} ref={rootRef} children={content}/>{:else}<Tabs.Root data-case={caseId} bind:value={model} defaultValue={initialDefault} {syncKey} {orientation} onValueChange={onChange} ref={rootRef} children={content}/>{/if}{/if}`;
}
function appSource(styled: boolean) {
  const tab = styled ? "Trigger" : "Tab",
    panel = styled ? "Content" : "Panel";
  return `<script lang="ts">import Case from "./TabsCase.svelte";import Tabs from "${styled ? "./tabs/index.js" : "@starwind-ui/svelte/tabs"}";let cases:Record<string,Case>={};let outer=$state<string|null>("outer"),inner=$state<string|null>("a");let nestedCalls=0;export function getCases(){return cases;}export function nested(){return {outer,inner,nestedCalls};}</script>
${["bound", "plain", "omitted", "undefined", "cancel", "dom", "life", "remove", "keyboard"].map((id) => `<Case caseId="${id}" mode="${["plain", "omitted"].includes(id) ? id : "bound"}" ${id === "undefined" || id === "omitted" ? "" : 'initial="a"'} initialDefault="c" bind:this={cases.${id}}/>`).join("\n")}
<Case caseId="storage" mode="omitted" initialDefault="a" storage="stored" bind:this={cases.storage}/><Case caseId="explicit" initial="a" storage="explicit" bind:this={cases.explicit}/><Case caseId="syncA" initial="a" storage="shared" bind:this={cases.syncA}/><Case caseId="syncB" initial="a" storage="shared" bind:this={cases.syncB}/>
<Tabs.Root data-case="outer" bind:value={outer}><Tabs.List><Tabs.${tab} value="outer">Outer</Tabs.${tab}></Tabs.List><Tabs.${panel} value="outer"><Tabs.Root data-case="inner" bind:value={inner} onValueChange={()=>nestedCalls++}><Tabs.List><Tabs.${tab} data-tab="a" value="a">A</Tabs.${tab}><Tabs.${tab} data-tab="b" value="b">B</Tabs.${tab}></Tabs.List><Tabs.${panel} value="a">A</Tabs.${panel}><Tabs.${panel} value="b">B</Tabs.${panel}></Tabs.Root></Tabs.${panel}></Tabs.Root>`;
}
const CLIENT = `import {hydrate,tick,unmount} from "svelte";import App from "./TabsApp.svelte";import {createTabs} from "@starwind-ui/runtime/tabs";
const target=document.querySelector('#app'),equal=(actual,expected,label)=>{if(JSON.stringify(actual)!==JSON.stringify(expected))throw Error(label+': '+JSON.stringify(actual)+' != '+JSON.stringify(expected));},ok=(value,label)=>{if(!value)throw Error(label);},settle=async()=>{await tick();await new Promise(resolve=>setTimeout(resolve,10));await tick();},root=id=>document.querySelector('[data-case="'+id+'"]'),tab=(id,value='b')=>root(id).querySelector('[data-tab="'+value+'"]'),click=(id,value='b')=>tab(id,value).click(),state=id=>({value:createTabs(root(id)).getValue(),rendered:JSON.parse(root(id).querySelector('[data-accepted]').textContent),selected:[...root(id).querySelectorAll('[data-tab][aria-selected="true"]')].map(node=>node.dataset.tab)});
try{localStorage.clear();localStorage.setItem('starwind-tabs-stored','c');localStorage.setItem('starwind-tabs-explicit','c');localStorage.setItem('starwind-tabs-shared','a');const owners=[...target.querySelectorAll('[data-sw-tabs]')],app=hydrate(App,{target});await settle();const cases=app.getCases();ok(owners.every(node=>node.isConnected),'SSR owners retained');equal(cases.bound.snapshot().proposals,[],'initialization silent');equal(state('storage').value,'c','storage initializes');equal(state('explicit').value,'a','explicit command wins storage');equal(cases.undefined.snapshot().model,'c','undefined initializes default');
for(const id of ['bound','plain','omitted']){click(id);await settle();equal(state(id),{value:'b',rendered:'b',selected:['b']},id+' selection');equal(cases[id].snapshot().native,1,'native callback once');}equal(cases.plain.snapshot().model,'a','plain parent untouched');cases.plain.setModel('c');await settle();equal(state('plain').value,'c','plain later command');cases.plain.setModel(undefined);await settle();equal(state('plain').value,'c','undefined retains');
for(const [value,expected]of [[null,null],['',''],['null',null]]){cases.bound.setModel(value);await settle();equal(state('bound').value,expected,'presence command');equal(cases.bound.snapshot().model,expected,'normalized binding');}cases.bound.setModel('a');await settle();
cases.cancel.options({cancel:true});await settle();click('cancel');await settle();equal(state('cancel').value,'a','callback cancellation');const prevent=e=>e.preventDefault();root('dom').addEventListener('starwind:value-change',prevent);click('dom');await settle();equal(state('dom').value,'a','DOM cancellation');root('dom').removeEventListener('starwind:value-change',prevent);
const life=root('life'),controller=createTabs(life);const old=tab('life');cases.life.replace('parts');await settle();ok(tab('life')!==old,'parts replaced');ok(createTabs(life)===controller,'parts preserve controller');old.click();await settle();equal(state('life').value,'a','old listener removed');click('life');await settle();equal(state('life').value,'b','new tab connects');const before=cases.life.refs().length;cases.life.replace('ref');await settle();for(const part of ['root','list','tab','panel',...(styled?[]:['indicator'])])equal(cases.life.refs().slice(before).filter(r=>r.part===part).map(r=>[r.version,Boolean(r.node)]),[[0,false],[1,true]],part+' refs');cases.life.replace('attachment');await settle();cases.life.replace('attachment');await settle();const attached=cases.life.snapshot().attachments;equal(attached.filter(x=>x.startsWith('set:')).length,attached.filter(x=>x.startsWith('clear:')).length,'symbols balanced');cases.life.replace('callback');await settle();click('life','c');await settle();equal(cases.life.snapshot().proposals.at(-1).version,1,'latest callback');
cases.life.collection(['a','b','']);await settle();equal(state('life').value,'a','missing fallback');equal(cases.life.snapshot().proposals.at(-1).reason,'missing','missing reason');click('life');await settle();cases.life.options({disabled:true,cancel:true});await settle();equal(state('life').value,'a','disabled fallback noncancelable');equal(cases.life.snapshot().proposals.at(-1).reason,'disabled','disabled reason');cases.life.setModel(null);await settle();equal(state('life').value,null,'null command clears');cases.life.options({orientation:'vertical'});await settle();equal(state('life').value,'a','later refresh fallback');ok(createTabs(life)===controller,'orientation preserves controller');
for(const node of root('bound').querySelectorAll('[data-tab]')){const panel=document.getElementById(node.getAttribute('aria-controls'));ok(panel&&panel.getAttribute('aria-labelledby')===node.id,'ID linkage');equal(panel.hidden,node.getAttribute('aria-selected')!=='true','panel visibility');equal(panel.querySelector('[data-panel-active]').textContent,String(!panel.hidden),'panel snippet');}equal(root('bound').querySelectorAll('[data-panel]').length,4,'all panels present');
const key=(value,key)=>tab('keyboard',value).dispatchEvent(new KeyboardEvent('keydown',{key,bubbles:true,cancelable:true}));tab('keyboard','a').focus();key('a','ArrowRight');await settle();equal(document.activeElement,tab('keyboard','b'),'manual focus moves');equal(state('keyboard').value,'a','manual value retained');key('b','Enter');await settle();equal(state('keyboard').value,'b','manual enter selects');cases.keyboard.options({auto:true,disabled:true,loop:false,orientation:'vertical'});await settle();tab('keyboard','a').focus();key('a','ArrowDown');await settle();equal(state('keyboard').value,'c','automatic disabled skip');key('c','End');await settle();equal(state('keyboard').value,'','End empty tab');key('','ArrowDown');await settle();equal(state('keyboard').value,'','loop false boundary');cases.keyboard.options({loop:true});await settle();key('','ArrowDown');await settle();equal(state('keyboard').value,'a','loop true wrap');
click('inner');await settle();equal(app.nested(),{outer:'outer',inner:'b',nestedCalls:1},'nested ownership');click('syncA');await settle();equal(state('syncA').value,'b','fixed-key sync source');equal(state('syncB').value,'b','fixed-key sync receiver');equal(localStorage.getItem('starwind-tabs-shared'),'b','fixed-key storage');
const previousStorageRoot=root('storage');cases.storage.show(false);await settle();const storageGet=Storage.prototype.getItem;Storage.prototype.getItem=function(){throw Error('storage blocked');};cases.storage.show(true);await settle();equal(state('storage').value,'a','storage read failure adopts frozen default');ok(root('storage')!==previousStorageRoot,'remount creates fresh owner');Storage.prototype.getItem=storageGet;
if(!styled){const indicator=root('bound').querySelector('[data-indicator]');ok(indicator,'indicator retained');const geometry=getComputedStyle(indicator);equal(parseFloat(geometry.getPropertyValue('--active-tab-width')),100,'indicator width');equal(parseFloat(geometry.getPropertyValue('--active-tab-height')),32,'indicator height');equal(parseFloat(geometry.getPropertyValue('--active-tab-left')),0,'indicator left');equal(parseFloat(geometry.getPropertyValue('--active-tab-top')),0,'indicator top');cases.bound.setModel(null);await settle();equal(indicator.hidden,true,'null hides indicator');cases.bound.setModel('missing');await settle();equal(state('bound').value,'missing','missing command remains accepted');equal(indicator.hidden,true,'missing accepted value keeps Runtime indicator hidden');cases.bound.setModel('b');await settle();equal(indicator.hidden,false,'valid value reveals indicator');equal(parseFloat(getComputedStyle(indicator).getPropertyValue('--active-tab-left')),100,'valid value remeasures indicator');}
const removed=root('remove');cases.remove.options({remove:true});await settle();click('remove');await settle();ok(!root('remove'),'callback unmount');removed.querySelector('[data-tab="c"]').click();await settle();equal(cases.remove.snapshot().proposals.length,1,'retired listeners removed');const refs=Object.values(cases);await unmount(app);await settle();for(const entry of refs)for(const part of ['root','list','tab','panel',...(styled?[]:['indicator'])])equal(entry.refs().filter(r=>r.part===part&&r.node).length,entry.refs().filter(r=>r.part===part&&!r.node).length,part+' cleanup');document.documentElement.dataset.tabsResult=JSON.stringify({complete:true,models:true,storage:true,collections:true,keyboard:true,cleanup:true});}catch(error){document.documentElement.dataset.tabsResult=JSON.stringify({error:String(error),stack:error.stack});}`;
