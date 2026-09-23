import { nativeAttachmentOwnership } from "./styled-native-lifecycle.js";
import assert from "node:assert/strict";
import { once } from "node:events";
import { readFile } from "node:fs/promises";
import { createServer } from "node:http";
import path from "node:path";
import { chromium } from "playwright";
import type { DistConsumer } from "./dist-consumer.js";
import { BROWSER_BUILD } from "./compatibility-hydration.js";
import { proseSpinnerImports } from "./styled-prose-spinner-consumer.js";
export async function verifyStyledProseSpinnerBrowser(consumer: DistConsumer) {
  await consumer.write({
    "ProseSpinnerLifecycle.svelte": APP,
    "hydrate-main.js": CLIENT,
    "build-prose-spinner.mjs": BROWSER_BUILD,
    "prose-spinner-ssr.mjs": `import assert from "node:assert/strict";import {render} from "svelte/server";import App from "./ProseSpinnerLifecycle.svelte";import Prose,* as prose from "./prose/index.js";import Spinner,* as spinner from "./spinner/index.js";
assert.equal(globalThis.document,undefined);assert.equal(Prose,prose.Prose);assert.equal(Spinner,spinner.Spinner);assert.deepEqual(Object.keys(prose).sort(),["Prose","ProseVariants","default"]);assert.deepEqual(Object.keys(spinner).sort(),["Spinner","SpinnerVariants","default"]);assert.deepEqual(Object.keys(prose.ProseVariants),["prose"]);assert.deepEqual(Object.keys(spinner.SpinnerVariants),["spinner"]);const body=render(App).body;assert.equal(body,render(App).body);console.log(JSON.stringify({body}));`,
  });
  const { body } = JSON.parse(await consumer.run("prose-spinner-ssr.mjs", { loader: true }));
  assert.match(body, /M12 3a9 9 0 1 0 9 9/);
  assert.match(body, /role="status"/);
  assert.match(body, /aria-label="Loading"/);
  assert.doesNotMatch(body, /Wrong label|mode="fast"/);
  const build = JSON.parse(await consumer.run("build-prose-spinner.mjs"));
  assert.ok(
    build.inputs.includes(path.join(consumer.root, "prose/styles.css")),
    "Prose stylesheet absent from consumer build",
  );
  const javascript = await readFile(path.join(consumer.root, "browser.js")),
    css = await readFile(path.join(consumer.root, "browser.css"));
  assert.match(css.toString(), /--sw-prose-line-height/);
  assert.match(css.toString(), /\.not-sw-prose/);
  const server = createServer((req, res) => {
    if (req.url === "/browser.js") {
      res.setHeader("Content-Type", "text/javascript");
      res.end(javascript);
    } else if (req.url === "/browser.css") {
      res.setHeader("Content-Type", "text/css");
      res.end(css);
    } else {
      res.setHeader("Content-Type", "text/html");
      res.end(
        `<link rel="icon" href="data:,"><style>body {font-size:16px} h2 {font-size:16px;font-weight:400;margin:0} :root {--foreground:rgb(0,0,0);--muted:rgb(220,220,220);--border:rgb(150,150,150)}</style><link rel="stylesheet" href="/browser.css"><div id="app">${body}</div><script type="module" src="/browser.js"></script>`,
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
    page.on("pageerror", (e) => diagnostics.push(e.message));
    page.on("console", (m) => {
      if (["warning", "error"].includes(m.type())) diagnostics.push(m.text());
    });
    await page.goto(`http://127.0.0.1:${address.port}`);
    await page.waitForFunction(
      () => document.documentElement.dataset.proseSpinnerResult,
      undefined,
      { timeout: 30000 },
    );
    const result = await page.evaluate(() =>
      JSON.parse(document.documentElement.dataset.proseSpinnerResult!),
    );
    assert.deepEqual(diagnostics, []);
    assert.equal(result.error, undefined, result.error);
    assert.ok(result.attachments.setups >= 6);
    assert.equal(result.attachments.setups, result.attachments.cleanups);
    assert.deepEqual(result, {
      parts: 2,
      hydrated: true,
      stylesheet: true,
      refs: result.refs,
      attachments: result.attachments,
      calls: 2,
      remaining: 0,
    });
    return { build, result };
  } finally {
    await browser?.close();
    if (server.listening)
      await new Promise<void>((resolve, reject) =>
        server.close((e) => (e ? reject(e) : resolve())),
      );
  }
}
const APP = `<script lang="ts">
${nativeAttachmentOwnership}
${proseSpinnerImports}
import {createAttachmentKey,type Attachment} from "svelte/attachments";
let generation=$state(0),second=$state(false),changed=$state(false),first=$state(0),other=$state(0),proseRef=$state<HTMLDivElement>();
const refs:string[]=[],attachments:string[]=[],reactive:string[]=[],calls:Record<string,number>={};const owners=new Map<string,Element>(),references=new Map<string,(node:Element|null)=>void>(),attaches=new Map<string,Attachment<Element>>();const key=createAttachmentKey(),firstKey=createAttachmentKey(),otherKey=createAttachmentKey();
function reference<T extends Element>(name:string):(node:T|null)=>void{const label=name+(second?"-b":"-a");if(!references.has(label))references.set(label,node=>{if(typeof document==="undefined")throw new Error("SSR ref");if(node&&owners.has(name))throw new Error("overlapping ref owner");refs.push(label+":"+(node?.tagName??"null"));if(node)owners.set(name,node);else owners.delete(name);});return references.get(label)!;}
function attributes(name:string){const label=name+(second?"-b":"-a");if(!attaches.has(label))attaches.set(label,node=>{const release=beginAttachment(name,node);attachments.push(label+":setup");return()=>{release();attachments.push(label+":cleanup");};});return{[key]:attaches.get(label),"data-prose-spinner-part":name,class:"native-"+name+(changed?" updated":""),style:"--probe: ready; --prose-color: rgb(30,40,50); --prose-h2-size:"+(changed?"2":"1.5")+"em; --prose-line-height:"+(changed?"2":"1.6")+";",onpointerdown:(event:PointerEvent)=>{if(event.target===event.currentTarget)calls[name]=(calls[name]??0)+1;}};}
function track(name:string,value:number){reactive.push(name+":"+value+":setup");return()=>{reactive.push(name+":"+value+":cleanup");};}
const componentFirst:Attachment<SVGSVGElement>=()=>track("component-first",first),componentOther:Attachment<SVGSVGElement>=()=>track("component-other",other),nativeFirst:Attachment<SVGSVGElement>=()=>track("native-first",first),nativeOther:Attachment<SVGSVGElement>=()=>track("native-other",other);const independent={[firstKey]:componentFirst,[otherKey]:componentOther};
const unsafe:Record<string,unknown>={role:"img","aria-label":"Wrong label",mode:"fast",children:()=>{throw new Error("Spinner invoked unsupported children");}};
export function changeProps(){changed=true;}export function updateFirst(){first++;}export function updateOther(){other++;}export function replaceCallbacks(){second=true;}export function replaceOwners(){generation++;}export function snapshot(){verifyAttachmentOwners(owners);return{refTag:proseRef?.tagName??null,refs:[...refs],attachments:[...attachments],reactive:[...reactive],calls:{...calls}};}
</script>
{#key generation}<Prose {...attributes("Prose")} bind:ref={proseRef} lang={changed?"fr":"en"}><h2 data-prose-heading>Guide</h2><p>Read <a href="#next">the next page</a>.</p><ul><li>Entry</li></ul><div class="not-sw-prose"><h2 data-prose-escape>Unstyled heading</h2></div></Prose>
<Spinner {...unsafe} {...attributes("Spinner")} {...independent} ref={reference<SVGSVGElement>("Spinner")} aria-hidden={false} width={changed?32:24} height={changed?32:24} viewBox={changed?"0 0 32 32":"0 0 24 24"} stroke-width={changed?3:2}/>{/key}
<Spinner data-default-spinner/>
<svg data-native-probe viewBox="0 0 24 24" {@attach nativeFirst} {@attach nativeOther}><title>Native probe</title></svg>`;
const CLIENT = `import {hydrate,flushSync,tick,unmount} from "svelte";import App from "./ProseSpinnerLifecycle.svelte";
const assert=(v,m)=>{if(!v)throw new Error(m);};const settle=async()=>{flushSync();await tick();flushSync();};const part=name=>document.querySelector('[data-prose-spinner-part="'+name+'"]');const elements=()=>[part("Prose"),part("Spinner")];const dispatch=node=>node.dispatchEvent(new PointerEvent("pointerdown",{bubbles:true}));
try{const before=elements(),app=hydrate(App,{target:document.querySelector("#app")});await settle();assert(elements().every((node,i)=>node===before[i]),"hydration changed owner");assert(app.snapshot().attachments.length===2&&app.snapshot().refTag==="DIV","initial attachment and bound ref");const prose=part("Prose"),spinner=part("Spinner");assert(prose instanceof HTMLDivElement&&prose.dataset.slot==="prose"&&prose.hasAttribute("data-sw-prose")&&prose.classList.contains("sw-prose"),"Prose native owner");assert(spinner instanceof SVGSVGElement&&spinner.namespaceURI==="http://www.w3.org/2000/svg"&&spinner.dataset.slot==="spinner"&&spinner.classList.contains("animate-spin")&&spinner.classList.contains("size-4"),"Spinner native SVG owner");assert(spinner.children.length===2&&spinner.children[1].getAttribute("d")==="M12 3a9 9 0 1 0 9 9","contract SVG paths");assert(spinner.getAttribute("role")==="status"&&spinner.getAttribute("aria-label")==="Loading"&&!spinner.hasAttribute("mode")&&!spinner.hasAttribute("children")&&spinner.getAttribute("aria-hidden")==="false","protected Spinner semantics");assert(document.querySelector("[data-default-spinner]").getAttribute("aria-hidden")==="true","default SVG asset semantics");assert(getComputedStyle(prose).lineHeight==="25.6px"&&getComputedStyle(prose.querySelector("[data-prose-heading]")).fontSize==="24px"&&getComputedStyle(prose.querySelector("[data-prose-escape]")).fontSize==="16px","included stylesheet typography and escape");for(const node of before){assert(node.style.getPropertyValue("--probe").trim()==="ready","native style");dispatch(node);}assert(Object.keys(app.snapshot().calls).length===2&&Object.values(app.snapshot().calls).every(n=>n===1),"native events");
const compare=()=>{const log=app.snapshot().reactive;for(const key of ["first","other"])assert(JSON.stringify(log.filter(x=>x.startsWith("component-"+key)).map(x=>x.replace("component-","")))===JSON.stringify(log.filter(x=>x.startsWith("native-"+key)).map(x=>x.replace("native-",""))),"independent SVG attachment "+key);};compare();app.updateFirst();await settle();compare();assert(app.snapshot().reactive.filter(x=>x.startsWith("component-other")).length===1,"unrelated attachment rerun");app.updateOther();await settle();compare();
const paths=[...spinner.children];app.changeProps();await settle();assert(elements().every((node,i)=>node===before[i])&&paths.every((node,i)=>node===spinner.children[i]),"prop update replaced SVG or HTML owner");assert(prose.lang==="fr"&&getComputedStyle(prose).lineHeight==="32px"&&getComputedStyle(prose.querySelector("[data-prose-heading]")).fontSize==="32px","reactive Prose CSS variables");assert(spinner.getAttribute("width")==="32"&&spinner.getAttribute("viewBox")==="0 0 32 32"&&spinner.getAttribute("stroke-width")==="3"&&spinner.classList.contains("updated"),"reactive SVG attrs");
app.replaceCallbacks();await settle();assert(elements().every((node,i)=>node===before[i]),"callback prop change replaced owner");app.replaceOwners();await settle();const current=elements();assert(current.every((node,i)=>node!==before[i]),"keyed replacement");for(const node of before)dispatch(node);await unmount(app);await settle();for(const node of current)dispatch(node);const log=app.snapshot();assert(log.refTag===null,"bound Prose ref cleanup");const calls=Object.values(log.calls).reduce((a,b)=>a+b,0);assert(calls===2,"retired native handlers");document.documentElement.dataset.proseSpinnerResult=JSON.stringify({parts:2,hydrated:true,stylesheet:true,refs:{setups:1,cleanups:log.refTag===null?1:0},attachments:{setups:log.attachments.filter(x=>x.endsWith(":setup")).length,cleanups:log.attachments.filter(x=>x.endsWith(":cleanup")).length},calls,remaining:document.querySelector("#app").children.length});}catch(error){document.documentElement.dataset.proseSpinnerResult=JSON.stringify({error:String(error)});}`;
