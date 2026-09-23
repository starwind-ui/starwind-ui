import { nativeAttachmentOwnership } from "./styled-native-lifecycle.js";
import assert from "node:assert/strict";
import { once } from "node:events";
import { readFile } from "node:fs/promises";
import { createServer } from "node:http";
import path from "node:path";
import { chromium } from "playwright";
import type { DistConsumer } from "./dist-consumer.js";
import { createBrowserBuildScript } from "./compatibility-hydration.js";
import {
  breadcrumbImports,
  breadcrumbParts,
  BREADCRUMB_ROUTER_LINK,
} from "./styled-breadcrumb-consumer.js";

export async function verifyStyledBreadcrumbBrowser(consumer: DistConsumer) {
  await consumer.write({
    "BreadcrumbLifecycle.svelte": APP,
    "BreadcrumbRouterLink.svelte": BREADCRUMB_ROUTER_LINK,
    "hydrate-main.js": CLIENT,
    "build-breadcrumb.mjs": createBrowserBuildScript(),
    "breadcrumb-ssr.mjs": `import assert from "node:assert/strict"; import { render } from "svelte/server"; import App from "./BreadcrumbLifecycle.svelte"; import Breadcrumb, * as parts from "./breadcrumb/index.js";
assert.equal(globalThis.document, undefined); ${breadcrumbParts.map((p) => `assert.equal(Breadcrumb.${p.member}, parts.${p.name});`).join("\n")}
assert.deepEqual(Object.keys(parts).sort(), ${JSON.stringify([...breadcrumbParts.map((p) => p.name), "BreadcrumbVariants", "default"].sort())});
const body = render(App).body; assert.equal(body, render(App).body); console.log(JSON.stringify({body}));`,
  });
  const { body } = JSON.parse(await consumer.run("breadcrumb-ssr.mjs", { loader: true }));
  assert.equal((body.match(/<a\b/g) ?? []).length, 3);
  assert.match(body, /aria-current="page"/);
  assert.match(body, /aria-disabled="true"/);
  const build = JSON.parse(await consumer.run("build-breadcrumb.mjs"));
  const result = await runBreadcrumbBrowser(consumer, body, "breadcrumbResult");
  assert.equal(result.error, undefined, result.error);
  assert.equal(result.parts, 9);
  assert.equal(result.hydrated, true);
  assert.equal(result.remaining, 0);
  assert.ok(result.refs.setups >= 1);
  assert.equal(result.refs.setups, result.refs.cleanups);
  assert.equal(result.attachments.setups, result.attachments.cleanups);
  return { build, result };
}
export async function runBreadcrumbBrowser(consumer: DistConsumer, body: string, key: string) {
  const javascript = await readFile(path.join(consumer.root, "browser.js"));
  const server = createServer((req, res) => {
    res.setHeader("Content-Type", req.url === "/browser.js" ? "text/javascript" : "text/html");
    res.end(
      req.url === "/browser.js"
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
    const page = await browser.newPage();
    const diagnostics: string[] = [];
    page.on("pageerror", (e) => diagnostics.push(e.message));
    page.on("console", (m) => {
      if (["warning", "error"].includes(m.type())) diagnostics.push(m.text());
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
        server.close((e) => (e ? reject(e) : resolve())),
      );
  }
}
const owners = [
  ...breadcrumbParts,
  { name: "DirectLink", tag: "A", slot: undefined, element: "HTMLAnchorElement" },
  { name: "RouterLink", tag: "A", slot: undefined, element: "HTMLAnchorElement" },
];
const attrs = (name: string) =>
  `{...attributes("${name}")} ref={reference<${owners.find((p) => p.name === name)!.element}>("${name}")}`;
const APP = `<script lang="ts">
${nativeAttachmentOwnership}
${breadcrumbImports}
import RouterLink from "./BreadcrumbRouterLink.svelte";
import { untrack } from "svelte";
import { createAttachmentKey, type Attachment } from "svelte/attachments";
let generation=$state(0), second=$state(false), changed=$state(false), custom=$state(false);
const refs:string[]=[], attachments:string[]=[], calls:Record<string,number>={};
const nodes=new Map<string,HTMLElement>(), references=new Map<string,(node:HTMLElement|null)=>void>(), attaches=new Map<string,Attachment<HTMLElement>>();
const key=createAttachmentKey(), ignoredKey=createAttachmentKey();
function reference<T extends HTMLElement>(name:string):(node:T|null)=>void { const label=name+(second?"-b":"-a"); if(!references.has(label))references.set(label,node=>{if(typeof document==="undefined")throw new Error("SSR ref");if(node&&nodes.has(name))throw new Error("overlapping owner "+name);refs.push(label+":"+(node?.tagName??"null"));if(node)nodes.set(name,node);else nodes.delete(name);});return references.get(label)!; }
function attributes(name:string){const label=name+(second?"-b":"-a");if(!attaches.has(label))attaches.set(label,node=>{const release=beginAttachment(name,node);attachments.push(label+":setup");return()=>{release();attachments.push(label+":cleanup");};});return {[key]:attaches.get(label),"data-breadcrumb-part":name,title:name+(changed?" changed":""),class:"native-"+name+(changed?" updated":""),style:"--probe: ready; color: red;",onpointerdown:(event:PointerEvent)=>{if(event.target===event.currentTarget)calls[name]=(calls[name]??0)+1;}};}
function attachDirect(node:HTMLAnchorElement){const callback=reference<HTMLAnchorElement>("DirectLink");untrack(()=>callback(node));return()=>untrack(()=>callback(null));}
function forbidden(){throw new Error("custom link received wrapper callback");}
const ignored={href:"#wrapper",title:"wrapper",class:"wrapper-class",style:"color:green",target:"_blank","data-wrapper":"forbidden",onclick:forbidden,ref:forbidden,[ignoredKey]:forbidden};
function click(event:MouseEvent){event.preventDefault();calls.click=(calls.click??0)+1;}
export function changeProps(){changed=true;custom=true;} export function replaceCallbacks(){second=true;} export function replaceOwners(){generation++;}
export function snapshot(){verifyAttachmentOwners(nodes);return {refs:[...refs],attachments:[...attachments],calls:{...calls}};}
</script>
{#snippet slash()}<span data-custom-separator>/</span>{/snippet}
{#snippet icon()}<span data-custom-icon>+</span>{/snippet}
{#snippet label()}More pages{/snippet}
{#key generation}
<Breadcrumb ${attrs("Breadcrumb")} aria-label="Documentation">
  <BreadcrumbList ${attrs("BreadcrumbList")} start={2}>
    <BreadcrumbItem ${attrs("BreadcrumbItem")} value={2}><BreadcrumbLink ${attrs("BreadcrumbLink")} href={changed?"#new":"#home"} onclick={click}>Home</BreadcrumbLink></BreadcrumbItem>
    <BreadcrumbSeparator ${attrs("BreadcrumbSeparator")} children={custom?slash:undefined} />
    <BreadcrumbParts.Item><BreadcrumbEllipsis ${attrs("BreadcrumbEllipsis")} icon={custom?icon:undefined} children={custom?label:undefined}/></BreadcrumbParts.Item>
    <BreadcrumbParts.Item><BreadcrumbLink asChild {...ignored}><a {...attributes("DirectLink")} href={changed?"#new":"#docs"} onclick={click} {@attach attachDirect}>Docs</a></BreadcrumbLink></BreadcrumbParts.Item>
    <BreadcrumbParts.Item><BreadcrumbLink asChild {...ignored}><RouterLink ${attrs("RouterLink")} class={BreadcrumbVariants.breadcrumbLink({class: "native-RouterLink"+(changed?" updated":"")})} to={changed?"#new":"#components"} onclick={click}>Components</RouterLink></BreadcrumbLink></BreadcrumbParts.Item>
    <BreadcrumbParts.Item><BreadcrumbPage ${attrs("BreadcrumbPage")}>Breadcrumb</BreadcrumbPage></BreadcrumbParts.Item>
  </BreadcrumbList>
</Breadcrumb>
{/key}`;
const CLIENT = `import {hydrate,flushSync,tick,unmount} from "svelte";import App from "./BreadcrumbLifecycle.svelte";
const names=${JSON.stringify(owners)};const assert=(v,m)=>{if(!v)throw new Error(m);};const settle=async()=>{flushSync();await tick();flushSync();await tick();};const part=name=>document.querySelector('[data-breadcrumb-part="'+name+'"]');const elements=()=>names.map(p=>part(p.name));const dispatch=node=>node.dispatchEvent(new PointerEvent("pointerdown",{bubbles:true}));
try {
const before=elements(),app=hydrate(App,{target:document.querySelector("#app")});await settle();
assert(before.every((n,i)=>n===elements()[i]),"hydration replaced owners");assert(app.snapshot().attachments.length===9,"initial attachment count");
for(const {name,tag,slot} of names){const n=part(name);assert(n.tagName===tag&&n.dataset.slot===slot,"anatomy "+name);assert(n.title===name&&n.classList.contains("native-"+name)&&n.style.getPropertyValue("--probe").trim()==="ready","attributes "+name);dispatch(n);}
assert(Object.values(app.snapshot().calls).every(n=>n===1)&&Object.keys(app.snapshot().calls).length===9,"native events");
assert(part("BreadcrumbList").start===2&&part("BreadcrumbItem").value===2,"list attributes");assert(part("BreadcrumbPage").getAttribute("aria-current")==="page"&&part("BreadcrumbPage").getAttribute("aria-disabled")==="true","page semantics");
assert(part("BreadcrumbSeparator").querySelector("svg")&&part("BreadcrumbEllipsis").querySelector("svg")&&part("BreadcrumbEllipsis").textContent.trim()==="More","default icons and label");
assert(document.querySelectorAll("a").length===3,"extra anchor");
assert(part("BreadcrumbLink").classList.contains("transition-colors")&&part("BreadcrumbLink").hasAttribute("data-sw-breadcrumb-link"),"native anchor recipe");
assert(part("DirectLink").className==="native-DirectLink","custom class ownership");assert(part("RouterLink").hasAttribute("data-router-link")&&part("RouterLink").classList.contains("transition-colors"),"router props and explicit recipe");
for(const name of ["DirectLink","RouterLink"]){const n=part(name);assert(!n.hasAttribute("data-wrapper")&&!n.hasAttribute("target")&&!n.hasAttribute("data-sw-breadcrumb-link")&&!n.classList.contains("wrapper-class")&&n.style.color==="red","wrapper props transferred "+name);}
for(const name of ["BreadcrumbLink","DirectLink","RouterLink"]){part(name).click();assert(part(name).tagName==="A"&&part(name).getAttribute("href").startsWith("#"),"link href "+name);}assert(app.snapshot().calls.click===3,"link click callbacks");
app.changeProps();await settle();assert(before.every((n,i)=>n===elements()[i]),"prop update replaced owner");
assert(part("BreadcrumbSeparator").querySelector("[data-custom-separator]")&&!part("BreadcrumbSeparator").querySelector("svg")&&part("BreadcrumbEllipsis").querySelector("[data-custom-icon]")&&part("BreadcrumbEllipsis").textContent.includes("More pages"),"custom icon content");
for(const name of ["BreadcrumbLink","DirectLink","RouterLink"])assert(part(name).getAttribute("href")==="#new"&&part(name).classList.contains("updated")&&part(name).title===name+" changed","updated anchor props "+name);
app.replaceCallbacks();await settle();assert(before.every((n,i)=>n===elements()[i]),"callback prop change replaced owner");
app.replaceOwners();await settle();const current=elements();assert(current.every((n,i)=>n!==before[i]),"keyed owners");for(const node of before)dispatch(node);assert(Object.values(app.snapshot().calls).reduce((a,b)=>a+b,0)===12,"retired handlers");
await unmount(app);await settle();for(const node of current)dispatch(node);const log=app.snapshot();assert(Object.values(log.calls).reduce((a,b)=>a+b,0)===12,"unmounted handlers");
document.documentElement.dataset.breadcrumbResult=JSON.stringify({parts:9,hydrated:true,refs:{setups:log.refs.filter(x=>!x.endsWith(":null")).length,cleanups:log.refs.filter(x=>x.endsWith(":null")).length},attachments:{setups:log.attachments.filter(x=>x.endsWith(":setup")).length,cleanups:log.attachments.filter(x=>x.endsWith(":cleanup")).length},remaining:document.querySelector("#app").children.length});
}catch(error){document.documentElement.dataset.breadcrumbResult=JSON.stringify({error:String(error)});}`;
