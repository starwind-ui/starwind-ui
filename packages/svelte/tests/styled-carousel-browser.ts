import assert from "node:assert/strict";
import { once } from "node:events";
import { readFile } from "node:fs/promises";
import { createServer } from "node:http";
import path from "node:path";
import { chromium } from "playwright";
import { BROWSER_BUILD } from "./compatibility-hydration.js";
import type { DistConsumer } from "./dist-consumer.js";

export async function verifyStyledCarousel(consumer: DistConsumer) {
  await consumer.write({
    "Carousel.svelte": APP,
    "hydrate-main.js": CLIENT,
    "build-carousel.mjs": BROWSER_BUILD,
    "carousel-ssr.mjs": `import assert from "node:assert/strict";import {render} from "svelte/server";import App from "./Carousel.svelte";import Parts,* as named from "./carousel/index.js";
assert.equal(globalThis.document,undefined);assert.deepEqual(Object.keys(Parts).sort(),["Content","Item","Next","Previous","Root"]);for(const [key,value] of Object.entries(Parts))assert.equal(value,named[key==="Root"?"Carousel":"Carousel"+key]);assert.equal(typeof named.CarouselVariants.carouselControl,"function");const body=render(App).body;assert.equal(body,render(App).body);console.log(JSON.stringify({body}));`,
  });
  const { body } = JSON.parse(await consumer.run("carousel-ssr.mjs", { loader: true }));
  assert.match(body, /data-slot="carousel-content"/);
  assert.match(body, /data-slot="carousel-container"/);
  assert.match(body, /aria-label="Previous slide"/);
  await consumer.run("build-carousel.mjs");
  const javascript = await readFile(path.join(consumer.root, "browser.js"));
  // Fixture geometry makes engine behavior deterministic. The demo check owns stock CSS layout.
  const css = `[data-slot=carousel]{width:300px;position:relative} [data-slot=carousel-content]{overflow:hidden} [data-slot=carousel-container]{display:flex} [data-slot=carousel-item]{flex:0 0 100%;min-width:0} [data-axis=y] [data-slot=carousel-container]{height:180px;flex-direction:column} [data-axis=y] [data-slot=carousel-item]{min-height:0}`;
  const server = createServer((request, response) => {
    response.setHeader(
      "Content-Type",
      request.url === "/browser.js" ? "text/javascript" : "text/html",
    );
    response.end(
      request.url === "/browser.js"
        ? javascript
        : `<link rel="icon" href="data:,"><style>${css}</style><div id="app">${body}</div><script type="module" src="/browser.js"></script>`,
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
    await page.waitForFunction(
      () => document.documentElement.dataset.styledCarouselResult,
      undefined,
      { timeout: 30_000 },
    );
    const result = await page.evaluate(() =>
      JSON.parse(document.documentElement.dataset.styledCarouselResult!),
    );
    assert.deepEqual(diagnostics, []);
    assert.equal(result.error, undefined, result.error);
    return result;
  } finally {
    await browser?.close();
    if (server.listening)
      await new Promise<void>((resolve, reject) =>
        server.close((error) => (error ? reject(error) : resolve())),
      );
  }
}

const APP = `<script lang="ts">
import Parts from "./carousel/index.js";
import type {CarouselInstance,CarouselOptions} from "@starwind-ui/svelte/carousel";
import {createAttachmentKey,type Attachment} from "svelte/attachments";
let orientation=$state<"horizontal"|"vertical">("horizontal");
let opts=$state<CarouselOptions["opts"]>({loop:false,duration:0});
const plugin=(name:string)=>({name,options:{},init(){},destroy(){}});
let plugins=$state<CarouselOptions["plugins"]>([plugin("initial")]);
let slides=$state(["One","Two"]);
let api:CarouselInstance["api"]|undefined, otherApi:CarouselInstance["api"]|undefined;
const callbacks={first:0,second:0};
let setApi=$state<(next:CarouselInstance["api"])=>void>((next)=>{api=next;callbacks.first++;});
const refs=new Map<string,HTMLElement>(),attachments=new Map<string,HTMLElement>();
const ref=(name:string)=>(node:HTMLElement|null)=>{if(node)refs.set(name,node);else refs.delete(name);};
const attrs=(name:string)=>({[createAttachmentKey()]:((node)=>{attachments.set(name,node);return()=>{attachments.delete(name);};}) satisfies Attachment<HTMLElement>});
const rootRef=ref("root"),contentRef=ref("content"),itemRef=ref("item"),prevRef=ref("previous"),nextRef=ref("next");
const rootAttrs=attrs("root"),contentAttrs=attrs("content"),itemAttrs=attrs("item"),prevAttrs=attrs("previous"),nextAttrs=attrs("next");
let clicks=0,submits=0;
export function snapshot(){return {api,otherApi,callbacks:{...callbacks},clicks,submits,refs:refs.size,attachments:attachments.size,ownersMatch:[...refs].every(([name,node])=>attachments.get(name)===node)};}
export function update(){opts={loop:true,duration:0};plugins=[plugin("replacement")];setApi=(next)=>{api=next;callbacks.second++;};}
export function addSlide(){slides=[...slides,"Three"];}
export function vertical(){orientation="vertical";}
</script>
<form onsubmit={(event)=>{event.preventDefault();submits++;}}>
<Parts.Root id="primary" {orientation} {opts} {plugins} {setApi} aria-label="Featured slides" ref={rootRef} {...rootAttrs}>
<Parts.Content class="custom-rail" ref={contentRef} {...contentAttrs}>
{#each slides as slide,index (slide)}<Parts.Item data-slide={slide} ref={index===0?itemRef:undefined} {...index===0?itemAttrs:{}}><strong>{slide}</strong></Parts.Item>{/each}
</Parts.Content>
<Parts.Previous ref={prevRef} {...prevAttrs} />
<Parts.Next ref={nextRef} {...nextAttrs} variant="secondary" onclick={()=>clicks++} />
</Parts.Root>
</form>
<Parts.Root id="other" setApi={(next)=>{otherApi=next;}}><Parts.Content><Parts.Item>Other one</Parts.Item><Parts.Item>Other two</Parts.Item></Parts.Content><Parts.Previous /><Parts.Next><span data-custom-control>Forward</span></Parts.Next></Parts.Root>`;

const CLIENT = `import {hydrate,flushSync,tick,unmount} from "svelte";
import App from "./Carousel.svelte";
const assert=(value,message)=>{if(!value)throw new Error(message);};
const settle=async()=>{flushSync();await tick();flushSync();await new Promise(resolve=>setTimeout(resolve,30));};
const until=async(check)=>{for(let i=0;i<50;i++){await settle();if(check())return;}throw new Error("Timed out waiting for Carousel service");};
const target=document.querySelector("#app"),before=[...target.querySelectorAll("[data-slot]")];
const app=hydrate(App,{target});
try{
 await settle();
 const root=document.querySelector("#primary"),part=name=>root.querySelector('[data-slot="carousel-'+name+'"]');
 const result={hydrationExact:before.every((node,index)=>node===target.querySelectorAll("[data-slot]")[index])};
 let state=app.snapshot();
 assert(state.api?.plugins().initial,"initial plugins forwarding");
 assert(state.callbacks.first===1&&state.callbacks.second===0,"initial API callback");
 assert(state.refs===5&&state.attachments===5&&state.ownersMatch,"wrapper native owners");
 assert(part("content")===part("container").parentElement&&part("container").classList.contains("custom-rail"),"viewport and custom container class");
 assert(part("previous") instanceof HTMLButtonElement&&part("next") instanceof HTMLButtonElement,"native controls");
 assert(part("previous").type==="button"&&part("next").type==="button","safe form control types");
 assert(part("previous").disabled&&!part("next").disabled,"initial disabled controls");
 assert(part("next").querySelector('svg[aria-hidden="true"]'),"stock icon");
 assert(document.querySelector("#other [data-custom-control]")&&!document.querySelector('#other [data-slot="carousel-next"] svg'),"custom control children");
 part("next").click();await until(()=>app.snapshot().api.selectedScrollSnap()===1);
 assert(app.snapshot().otherApi.selectedScrollSnap()===0&&part("next").disabled,"nearest service controls");
 part("previous").click();await until(()=>app.snapshot().api.selectedScrollSnap()===0);
 assert(app.snapshot().clicks===1&&app.snapshot().submits===0,"native handler forwarding");
 result.controls=true;
 const originalApi=app.snapshot().api;
 app.update();await settle();state=app.snapshot();
 assert(state.api===originalApi&&state.api.plugins().replacement&&!state.api.plugins().initial,"plugin update forwarding");
 assert(state.callbacks.first===1&&state.callbacks.second===1,"current callback receives current API");
 assert(!part("previous").disabled,"loop option forwarding");
 result.forwarding=true;
 app.addSlide();await until(()=>app.snapshot().api.slideNodes().length===3);
 assert(part("container").querySelectorAll("strong").length===3&&part("container").textContent.includes("Three"),"dynamic custom slides");
 app.vertical();await settle();
 assert(root.dataset.axis==="y"&&document.querySelector("#other").dataset.axis==="x","orientation forwarding");
 assert(getComputedStyle(part("container")).flexDirection==="column","vertical fixture geometry");
 result.customSlides=true;result.owners=app.snapshot().ownersMatch;
 await unmount(app);await settle();
 assert(app.snapshot().refs===0&&app.snapshot().attachments===0&&!target.querySelector("[data-slot]"),"wrapper teardown");
 result.teardown=true;
 document.documentElement.dataset.styledCarouselResult=JSON.stringify(result);
}catch(error){await unmount(app);document.documentElement.dataset.styledCarouselResult=JSON.stringify({error:error.stack??String(error)});}`;
