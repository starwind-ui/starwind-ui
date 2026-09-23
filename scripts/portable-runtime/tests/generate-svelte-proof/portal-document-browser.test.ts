import { mkdtemp, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import { svelte } from "@sveltejs/vite-plugin-svelte";
import { chromium } from "playwright";
import { createServer, type ViteDevServer } from "vite";
import { expect, it } from "vitest";

it("shares placement and capture observation through hydration, retargeting, disabling and teardown", async () => {
  const root = await mkdtemp(path.join(process.cwd(), ".svelte-portal-observer-"));
  const servers: ViteDevServer[] = [];
  let browser;
  try {
    const select = path.join(process.cwd(), "packages/svelte/src/select/index.ts");
    const popover = path.join(process.cwd(), "packages/svelte/src/popover/index.ts");
    await writeFile(
      path.join(root, "App.svelte"),
      `<script lang="ts">
import { SelectRoot, SelectTrigger, SelectPortal, SelectPopup, SelectList, SelectItem, SelectItemText } from ${JSON.stringify(select)};
import { PopoverRoot, PopoverTrigger, PopoverPortal, PopoverPopup } from ${JSON.stringify(popover)};
let shown=$state(true), selectDisabled=$state(false), popoverDisabled=$state(false), container=$state("#late");
export function disableSelect(value:boolean){selectDisabled=value;}
export function disablePopover(value:boolean){popoverDisabled=value;}
export function retarget(value:string){container=value;}
export function show(value:boolean){shown=value;}
</script>
{#if shown}
<SelectRoot data-owner="select"><SelectTrigger>Select</SelectTrigger><SelectPortal disabled={selectDisabled} {container}><SelectPopup><SelectList><SelectItem value="a"><SelectItemText>A</SelectItemText></SelectItem></SelectList><button id="select-content">Select portal content</button></SelectPopup></SelectPortal></SelectRoot>
<PopoverRoot data-owner="popover"><PopoverTrigger>Popover</PopoverTrigger><PopoverPortal disabled={popoverDisabled} {container}><PopoverPopup><button id="popover-content">Popover portal content</button></PopoverPopup></PopoverPortal></PopoverRoot>
{/if}`,
    );
    await writeFile(path.join(root, "main.ts"), CLIENT);
    const server = await createServer({
      configFile: false,
      root,
      logLevel: "silent",
      plugins: [svelte({ hot: false })],
      resolve: { dedupe: ["svelte"] },
      server: { host: "127.0.0.1", port: 0, watch: null, hmr: false },
    });
    servers.push(server);
    expect(globalThis).not.toHaveProperty("document");
    const app = await server.ssrLoadModule("/App.svelte");
    const { render } = await server.ssrLoadModule("svelte/server");
    const markup = render(app.default).body;
    expect(markup).toContain('data-sw-select-portal=""');
    expect(markup).toContain('data-sw-popover-portal=""');
    expect(globalThis).not.toHaveProperty("document");
    await writeFile(
      path.join(root, "index.html"),
      `<link rel="icon" href="data:,"><div id="app">${markup}</div><script type="module" src="/main.ts"></script>`,
    );
    await server.listen();
    browser = await chromium.launch({ channel: "chrome", headless: true });
    const page = await browser.newPage();
    await page.addInitScript(() => {
      const Native = window.MutationObserver;
      const observers: { active: boolean }[] = [];
      window.MutationObserver = class extends Native {
        record = { active: false };
        observe(target: Node, options: MutationObserverInit) {
          // Root placement bindings can also observe the document. Identify the target helper
          // from its dev-server module frame so Runtime observers do not enter this count.
          if (
            target === document &&
            options.childList &&
            options.subtree &&
            !options.attributes &&
            new Error().stack?.includes("/_internal/portal-document-observer.ts")
          ) {
            if (!observers.includes(this.record)) observers.push(this.record);
            this.record.active = true;
          }
          return super.observe(target, options);
        }
        disconnect() {
          this.record.active = false;
          super.disconnect();
        }
      };
      Object.assign(window, {
        portalObserverCount: () => observers.filter((record) => record.active).length,
      });
    });
    const errors: string[] = [];
    page.on("pageerror", (error) => errors.push(error.message));
    page.on("console", (message) => {
      if (["warning", "error"].includes(message.type())) errors.push(message.text());
    });
    await page.goto(server.resolvedUrls!.local[0]);
    await page.waitForFunction(
      () => document.documentElement.dataset.portalObserverResult,
      undefined,
      { timeout: 30000 },
    );
    const result = await page.evaluate(() =>
      JSON.parse(document.documentElement.dataset.portalObserverResult!),
    );
    expect(errors).toEqual([]);
    expect(result).toEqual({
      hydration: true,
      shared: 1,
      oneDisabled: 1,
      allDisabled: 0,
      lateContainer: true,
      removedContainer: true,
      retargeted: true,
      teardown: 0,
      remount: 1,
    });
  } finally {
    await browser?.close();
    await Promise.all(servers.map((server) => server.close()));
    await rm(root, { recursive: true, force: true });
  }
}, 60_000);

const CLIENT = `import {hydrate,flushSync,tick,unmount} from "svelte";import App from "./App.svelte";
const assert=(value,message)=>{if(!value)throw new Error(message)};
const settle=async()=>{flushSync();await tick();await new Promise(resolve=>setTimeout(resolve,0));flushSync();await tick();};
const count=()=>window.portalObserverCount();
try{
const select=document.querySelector("#select-content"),popover=document.querySelector("#popover-content");
const selectPortal=select.closest("[data-sw-select-portal]"),popoverPortal=popover.closest("[data-sw-popover-portal]");
const app=hydrate(App,{target:document.querySelector("#app")});await settle();
assert(select===document.querySelector("#select-content")&&popover===document.querySelector("#popover-content"),"hydration identity");
const shared=count();assert(shared===1,"two families must share one observer: "+shared);
const late=document.createElement("div");late.id="late";document.body.append(late);await settle();
assert(selectPortal.parentElement===late&&popoverPortal.parentElement===late,"late target insertion");
late.remove();await settle();assert(selectPortal.parentElement===document.body&&popoverPortal.parentElement===document.body,"removed target fallback");
const target=document.createElement("div");target.id="next";document.body.append(target);app.retarget("#next");await settle();
assert(selectPortal.parentElement===target&&popoverPortal.parentElement===target,"container prop replacement");
app.disableSelect(true);await settle();const oneDisabled=count();assert(oneDisabled===1,"sibling retained observer");assert(document.querySelector('[data-owner="select"]').contains(selectPortal),"disabled Select restores authored placement");
const replacement=document.createElement("div");replacement.id="next";target.replaceWith(replacement);await settle();assert(popoverPortal.parentElement===replacement,"remaining family responds to target replacement");
app.disablePopover(true);await settle();const allDisabled=count();assert(allDisabled===0,"disabled portals release shared observer");
app.disableSelect(false);app.disablePopover(false);await settle();assert(count()===1,"re-enable shares observer");
replacement.append(document.createElement("span"));app.show(false);await settle();const teardown=count();assert(teardown===0,"teardown releases queued observer");assert(!selectPortal.isConnected&&!popoverPortal.isConnected,"teardown removes wrappers");
app.show(true);await settle();const remount=count();assert(remount===1,"remount shares fresh observer");await unmount(app);await settle();assert(count()===0,"final unmount releases observer");replacement.remove();
document.documentElement.dataset.portalObserverResult=JSON.stringify({hydration:true,shared,oneDisabled,allDisabled,lateContainer:true,removedContainer:true,retargeted:true,teardown,remount});
}catch(error){document.documentElement.dataset.portalObserverResult=JSON.stringify({error:String(error)});}`;
