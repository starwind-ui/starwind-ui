import { verifyStyledButtonAttachmentIsolation } from "./styled-button-attachments-browser.js";
import { nativeAttachmentOwnership } from "./styled-native-lifecycle.js";
import assert from "node:assert/strict";
import { once } from "node:events";
import { readFile } from "node:fs/promises";
import { createServer } from "node:http";
import path from "node:path";
import { chromium } from "playwright";
import type { DistConsumer } from "./dist-consumer.js";
import { BROWSER_BUILD } from "./compatibility-hydration.js";
import { navigationImports, navigationParts } from "./styled-navigation-consumer.js";

export async function verifyStyledNavigationBrowser(consumer: DistConsumer) {
  await consumer.write({
    "NavigationLifecycle.svelte": APP,
    "hydrate-main.js": CLIENT,
    "build-navigation.mjs": BROWSER_BUILD,
    "navigation-ssr.mjs": `import assert from "node:assert/strict";import {render} from "svelte/server";import App from "./NavigationLifecycle.svelte";
import ButtonGroup,* as group from "./button-group/index.js";import Pagination,* as pagination from "./pagination/index.js";
assert.equal(globalThis.document,undefined);
${navigationParts.map((p) => `assert.equal(${p.root === "pagination" ? "Pagination" : "ButtonGroup"}.${p.member},${p.root === "pagination" ? "pagination" : "group"}.${p.name});`).join("\n")}
assert.deepEqual(Object.keys(group).sort(),${JSON.stringify([...navigationParts.filter((p) => p.root === "button-group").map((p) => p.name), "ButtonGroupVariants", "default"].sort())});
assert.deepEqual(Object.keys(pagination).sort(),${JSON.stringify([...navigationParts.filter((p) => p.root === "pagination").map((p) => p.name), "PaginationVariants", "default"].sort())});
const body=render(App).body;assert.equal(body,render(App).body);console.log(JSON.stringify({body}));`,
  });
  const { body } = JSON.parse(await consumer.run("navigation-ssr.mjs", { loader: true }));
  assert.match(body, /aria-current="page"/);
  assert.match(body, /aria-label="Go to previous page"/);
  assert.match(body, /aria-hidden="true"/);
  assert.match(body, /More pages/);
  const build = JSON.parse(await consumer.run("build-navigation.mjs"));
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
    page.on("pageerror", (error) => diagnostics.push(error.message));
    page.on("console", (message) => {
      if (["warning", "error"].includes(message.type())) diagnostics.push(message.text());
    });
    await page.goto(`http://127.0.0.1:${address.port}`);
    await page.waitForFunction(() => document.documentElement.dataset.navigationResult, undefined, {
      timeout: 30000,
    });
    const result = await page.evaluate(() =>
      JSON.parse(document.documentElement.dataset.navigationResult!),
    );
    assert.deepEqual(diagnostics, []);
    assert.equal(result.error, undefined, result.error);
    assert.ok(result.attachments.setups >= 30);
    assert.equal(result.attachments.setups, result.attachments.cleanups);
    assert.deepEqual(result, {
      parts: 10,
      hydrated: true,
      attachments: result.attachments,
      calls: 13,
      remaining: 0,
    });
    await verifyStyledButtonAttachmentIsolation(consumer);
    return { build, result };
  } finally {
    await browser?.close();
    if (server.listening)
      await new Promise<void>((resolve, reject) =>
        server.close((error) => (error ? reject(error) : resolve())),
      );
  }
}
const attrs = (name: string) => `{...attributes("${name}")}`;
const APP = `<script lang="ts">
${nativeAttachmentOwnership}
${navigationImports}
import {Button} from "./button/index.js";
import {createAttachmentKey,type Attachment} from "svelte/attachments";
let generation=$state(0),second=$state(false),changed=$state(false),disabled=$state(false),first=$state(0),other=$state(0);
const attachments:string[]=[],reactive:string[]=[],calls:Record<string,number>={};
const attaches=new Map<string,Attachment<HTMLElement>>();const key=createAttachmentKey(),firstKey=createAttachmentKey(),otherKey=createAttachmentKey();
function attributes(name:string){const label=name+(second?"-b":"-a");if(!attaches.has(label))attaches.set(label,node=>{const release=beginAttachment(name,node);attachments.push(label+":setup");return()=>{release();attachments.push(label+":cleanup");};});return{[key]:attaches.get(label),"data-navigation-part":name,title:name+(changed?" changed":""),class:"native-"+name+(changed?" updated":""),style:"--native-probe: ready; color: red;",onpointerdown:(event:PointerEvent)=>{if(event.target===event.currentTarget)calls[name]=(calls[name]??0)+1;}};}
function track(name:string,value:number){reactive.push(name+":"+value+":setup");return()=>{reactive.push(name+":"+value+":cleanup");};}
const linkFirst:Attachment<HTMLAnchorElement>=()=>track("link-first",first),linkOther:Attachment<HTMLAnchorElement>=()=>track("link-other",other),nativeFirst:Attachment<HTMLAnchorElement>=()=>track("native-first",first),nativeOther:Attachment<HTMLAnchorElement>=()=>track("native-other",other);const independent={[firstKey]:linkFirst,[otherKey]:linkOther};
function click(event:MouseEvent){event.preventDefault();calls.click=(calls.click??0)+1;}
export function changeProps(){changed=true;}export function disable(){disabled=true;}export function enable(){disabled=false;}export function updateFirst(){first++;}export function updateOther(){other++;}export function replaceCallbacks(){second=true;}export function replaceOwners(){generation++;}export function snapshot(){return{attachments:[...attachments],reactive:[...reactive],calls:{...calls}};}
</script>
{#snippet previousIcon()}<span data-custom-previous>←</span>{/snippet}
{#snippet nextIcon()}<span data-custom-next>→</span>{/snippet}
{#snippet dots()}<span data-custom-dots>+</span>{/snippet}
{#snippet more()}<span class="sr-only">More results</span>{/snippet}
{#key generation}
<ButtonGroup ${attrs("ButtonGroup")} orientation={changed?"vertical":"horizontal"} aria-label="Actions"><Button>Save</Button><ButtonGroupSeparator ${attrs("ButtonGroupSeparator")} orientation={changed?"horizontal":"vertical"}/><ButtonGroupText ${attrs("ButtonGroupText")}>Saved</ButtonGroupText></ButtonGroup>
<Pagination ${attrs("Pagination")}><PaginationContent ${attrs("PaginationContent")}><PaginationItem ${attrs("PaginationItem")}><PaginationPrevious ${attrs("PaginationPrevious")} href={changed?"#new-before":"#before"} icon={changed?previousIcon:undefined} size={changed?"sm":"md"} onclick={click}>Previous</PaginationPrevious></PaginationItem><Parts1.Item><PaginationLink ${attrs("PaginationLink")} {...independent} href={changed?"#new-page":"#page"} isActive={!changed} size={changed?"icon-sm":"icon"} {disabled} onclick={click}>2</PaginationLink></Parts1.Item><Parts1.Item><PaginationEllipsis ${attrs("PaginationEllipsis")} size={changed?"icon-lg":"icon"} icon={changed?dots:undefined} children={changed?more:undefined}/></Parts1.Item><Parts1.Item><PaginationNext ${attrs("PaginationNext")} href={changed?"#new-after":"#after"} icon={changed?nextIcon:undefined} onclick={click}>Next</PaginationNext></Parts1.Item></PaginationContent></Pagination>
{/key}
<a href="#native" data-native-probe {@attach nativeFirst} {@attach nativeOther}>Native probe</a>`;
const CLIENT = `import {hydrate,flushSync,tick,unmount} from "svelte";import App from "./NavigationLifecycle.svelte";
const parts=${JSON.stringify(navigationParts)};const assert=(value,message)=>{if(!value)throw new Error(message);};const settle=async()=>{flushSync();await tick();flushSync();};const part=name=>document.querySelector('[data-navigation-part="'+name+'"]');const elements=()=>parts.map(({name})=>part(name));const dispatch=node=>node.dispatchEvent(new PointerEvent("pointerdown",{bubbles:true}));
try{const before=elements(),app=hydrate(App,{target:document.querySelector("#app")});await settle();assert(before.every((node,i)=>node===elements()[i]),"hydration owners");assert(app.snapshot().attachments.length===10,"initial attachment count");for(const {name,tag,slot}of parts){const node=part(name);assert(node.tagName===tag&&node.dataset.slot===slot,"anatomy "+name);assert(node.title===name&&node.classList.contains("native-"+name)&&node.style.getPropertyValue("--native-probe").trim()==="ready","native props "+name);dispatch(node);}
assert(part("ButtonGroup").getAttribute("role")==="group"&&part("ButtonGroup").dataset.orientation==="horizontal","group semantics");assert(part("ButtonGroupSeparator").getAttribute("role")==="separator"&&part("ButtonGroupSeparator").getAttribute("aria-orientation")==="vertical"&&part("ButtonGroupSeparator").dataset.swSeparator!==undefined,"separator dependency");assert(part("Pagination").getAttribute("aria-label")==="pagination"&&part("PaginationContent").parentElement===part("Pagination"),"pagination navigation");assert(part("PaginationLink").getAttribute("aria-current")==="page"&&part("PaginationLink").classList.contains("border")&&part("PaginationLink").classList.contains("size-11"),"active Button variant");assert(part("PaginationPrevious").getAttribute("aria-label")==="Go to previous page"&&part("PaginationPrevious").firstElementChild.tagName.toLowerCase()==="svg"&&part("PaginationNext").lastElementChild.tagName.toLowerCase()==="svg","previous/next labels and icons");assert(part("PaginationEllipsis").getAttribute("aria-hidden")==="true"&&part("PaginationEllipsis").querySelector("svg")&&part("PaginationEllipsis").textContent.trim()==="More pages","default ellipsis");
for(const name of ["PaginationPrevious","PaginationLink","PaginationNext"]){part(name).click();assert(part(name).tagName==="A","anchor dependency");}assert(app.snapshot().calls.click===3,"composed native click count");
const compare=()=>{const log=app.snapshot().reactive;for(const key of ["first","other"])assert(JSON.stringify(log.filter(x=>x.startsWith("link-"+key)).map(x=>x.replace("link-","")))===JSON.stringify(log.filter(x=>x.startsWith("native-"+key)).map(x=>x.replace("native-",""))),"independent inherited attachment "+key);};compare();app.updateFirst();await settle();compare();assert(app.snapshot().reactive.filter(x=>x.startsWith("link-other")).length===1,"unrelated attachment rerun");app.updateOther();await settle();compare();
app.changeProps();await settle();assert(elements().every((node,i)=>node===before[i]),"prop update replaced owner");assert(part("ButtonGroup").dataset.orientation==="vertical"&&part("ButtonGroup").classList.contains("flex-col")&&part("ButtonGroupSeparator").getAttribute("aria-orientation")==="horizontal","reactive orientation");assert(!part("PaginationLink").hasAttribute("aria-current")&&!part("PaginationLink").classList.contains("border")&&part("PaginationLink").classList.contains("size-9"),"inactive Button variant and size");assert(part("PaginationPrevious").querySelector("[data-custom-previous]")&&part("PaginationNext").querySelector("[data-custom-next]")&&part("PaginationEllipsis").querySelector("[data-custom-dots]")&&!part("Pagination").querySelector("svg")&&part("PaginationEllipsis").textContent.includes("More results"),"custom icons and label");for(const {name}of parts)assert(part(name).classList.contains("updated")&&part(name).title===name+" changed","updated native props "+name);
app.disable();await settle();assert(!part("PaginationLink").hasAttribute("href")&&part("PaginationLink").getAttribute("aria-disabled")==="true"&&part("PaginationLink").tabIndex===-1,"inherited disabled anchor");app.enable();await settle();assert(part("PaginationLink").getAttribute("href")==="#new-page"&&!part("PaginationLink").hasAttribute("aria-disabled"),"restored anchor href");
app.replaceCallbacks();await settle();assert(elements().every((node,i)=>node===before[i]),"attachment callback changed owner");
app.replaceOwners();await settle();const current=elements();assert(current.every((node,i)=>node!==before[i]),"keyed replacement");for(const node of before)dispatch(node);await unmount(app);await settle();for(const node of current)dispatch(node);const log=app.snapshot(),calls=Object.values(log.calls).reduce((a,b)=>a+b,0);assert(calls===13,"retired native handlers");document.documentElement.dataset.navigationResult=JSON.stringify({parts:10,hydrated:true,attachments:{setups:log.attachments.filter(x=>x.endsWith(":setup")).length,cleanups:log.attachments.filter(x=>x.endsWith(":cleanup")).length},calls,remaining:document.querySelector("#app").children.length});
}catch(error){document.documentElement.dataset.navigationResult=JSON.stringify({error:String(error)});}`;
