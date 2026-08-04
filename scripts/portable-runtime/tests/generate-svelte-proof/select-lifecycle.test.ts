import { copyFile, mkdir, mkdtemp, readdir, rm, writeFile } from "node:fs/promises";
import path from "node:path";

import { svelte } from "@sveltejs/vite-plugin-svelte";
import { chromium, type Browser } from "playwright";
import { render } from "svelte/server";
import { afterEach, describe, expect, it } from "vitest";
import { createServer, type ViteDevServer } from "vite";

const temporaryRoots: string[] = [];
const servers: ViteDevServer[] = [];
const browsers: Browser[] = [];

afterEach(async () => {
  await Promise.all(browsers.splice(0).map((browser) => browser.close()));
  await Promise.all(servers.splice(0).map((server) => server.close()));
  await Promise.all(
    temporaryRoots.splice(0).map((root) => rm(root, { force: true, recursive: true })),
  );
});

describe("generated Svelte Select lifecycle", () => {
  it("preserves SSR, hydration, bindings, cancellation, forms, portals, identity, refs, and cleanup", async () => {
    expect(globalThis).not.toHaveProperty("window");
    expect(globalThis).not.toHaveProperty("document");

    const root = await createHarness();
    const ssrServer = await createProofServer(root, true);
    servers.push(ssrServer);
    const appModule = await ssrServer.ssrLoadModule("/App.svelte");
    const serverMarkup = render(appModule.default).body;

    expect(serverMarkup).toContain('data-case="controlled"');
    expect(serverMarkup).toContain('data-sw-select-portal=""');
    expect(serverMarkup.indexOf('data-case="controlled"')).toBeLessThan(
      serverMarkup.indexOf('data-sw-select-portal=""'),
    );
    expect(globalThis).not.toHaveProperty("window");
    expect(globalThis).not.toHaveProperty("document");

    await writeFile(
      path.join(root, "index.html"),
      `<div id="app">${serverMarkup}</div><div id="portal-a"></div><div id="portal-b"></div><script type="module" src="/main.ts"></script>`,
      "utf8",
    );
    const browserServer = await createProofServer(root, false);
    servers.push(browserServer);
    await browserServer.listen();
    const browser = await chromium.launch({ channel: "chrome", headless: true });
    browsers.push(browser);
    const page = await browser.newPage();
    const errors: string[] = [];
    page.on("console", (message) => {
      if (
        (message.type() === "error" || message.type() === "warning") &&
        !message.text().includes("Failed to load resource")
      ) {
        errors.push(message.text());
      }
    });
    const url = browserServer.resolvedUrls?.local[0];
    if (!url) throw new Error("Svelte Select proof server did not expose a local URL.");
    await page.goto(url);
    await page.waitForFunction(
      () => document.documentElement.dataset.svelteSelectResult,
      undefined,
      {
        timeout: 20_000,
      },
    );
    const result = await page.evaluate(() =>
      JSON.parse(document.documentElement.dataset.svelteSelectResult ?? "{}"),
    );

    expect(errors).toEqual([]);
    expect(result.error).toBeUndefined();
    expect(result).toMatchObject({
      acceptedOpen: { binding: true, callbackCount: 2, formValue: "", state: "open" },
      acceptedValue: {
        callbackCount: 2,
        explicitEmptyLabel: "",
        formValue: "empty",
        value: "empty",
      },
      canceledOpen: { binding: false, callbackCount: 1, state: "closed" },
      canceledValue: { callbackCount: 1, formValue: "", value: null },
      external: { callbackCount: 2, formValue: "alpha", value: "alpha" },
      hydration: { exactPartInventory: true, portalMovedAfterHydration: true },
      isolation: { label: "Other", value: "other" },
      keyedIdentityPreserved: true,
      ownership: {
        afterOpenGain: { open: false, value: "alpha" },
        afterOpenRemoval: { open: false, value: "empty" },
        afterValueGain: { open: false, value: "missing" },
        afterValueRemoval: { open: true, value: "empty" },
        controlledAccepted: { callbackCount: 3, open: true },
        controlledCanceled: { callbackCount: 2, open: false },
        externalSuppressed: { callbackCount: 3, open: false },
        reset: { after: "alpha", before: "empty" },
      },
      portal: { initialParent: "portal-a", retargetedParent: "portal-b" },
      reset: { afterReset: "alpha", beforeReset: "empty" },
      rootCountAfterUnmount: 0,
    });
    expect(result.refs).toEqual({ cleanups: 10, connects: 10 });
    expect(result.lifecycle.byCase.ownership).toEqual({ connects: 5, destroys: 5 });
    expect(result.lifecycle.connects).toBe(9);
    expect(result.lifecycle.destroys).toBe(9);
    expect(result.lifecycle.setOpen).toBeGreaterThanOrEqual(2);
    expect(result.lifecycle.setValue).toBeGreaterThanOrEqual(2);
  }, 120_000);
});

async function createHarness(): Promise<string> {
  const root = await mkdtemp(path.join(process.cwd(), ".svelte-select-browser-"));
  temporaryRoots.push(root);
  const selectRoot = path.join(root, "select");
  await mkdir(selectRoot);
  const fixtureRoot = path.join(process.cwd(), "packages/svelte/src/select");
  for (const file of await readdir(fixtureRoot)) {
    await copyFile(path.join(fixtureRoot, file), path.join(selectRoot, file));
  }
  const actualRuntime = path
    .join(process.cwd(), "packages/runtime/src/components/select/select.ts")
    .replaceAll("\\", "/");
  await writeFile(
    path.join(root, "runtime.ts"),
    `import { createSelect as createActualSelect } from "${actualRuntime}";

const proof = globalThis.__selectLifecycle ??= {
  connects: 0,
  destroys: 0,
  setOpen: 0,
  setValue: 0,
};

export function createSelect(root, options) {
  proof.connects += 1;
  const caseName = root.getAttribute("data-case") ?? "unknown";
  const caseProof = proof.byCase ??= {};
  const caseCounts = caseProof[caseName] ??= { connects: 0, destroys: 0 };
  caseCounts.connects += 1;
  let instance;
  try {
    instance = createActualSelect(root, options);
  } catch (error) {
    throw new Error("Select case " + root.getAttribute("data-case") + " parts: " + Array.from(root.querySelectorAll("[data-sw-part]")).map((element) => element.getAttribute("data-sw-part")).join(","), { cause: error });
  }
  return new Proxy(instance, {
    get(target, property) {
      const value = Reflect.get(target, property);
      if (property === "destroy") return () => { proof.destroys += 1; caseCounts.destroys += 1; return target.destroy(); };
      if (property === "setOpen") return (...args) => { proof.setOpen += 1; return target.setOpen(...args); };
      if (property === "setValue") return (...args) => { proof.setValue += 1; return target.setValue(...args); };
      return typeof value === "function" ? value.bind(target) : value;
    },
  });
}

export type * from "${actualRuntime}";
`,
    "utf8",
  );
  await writeFile(path.join(root, "OwnershipHarness.svelte"), OWNERSHIP_SOURCE, "utf8");
  await writeFile(path.join(root, "App.svelte"), APP_SOURCE, "utf8");
  await writeFile(path.join(root, "main.ts"), MAIN_SOURCE, "utf8");
  return root;
}

async function createProofServer(root: string, middlewareMode: boolean): Promise<ViteDevServer> {
  return createServer({
    appType: middlewareMode ? "custom" : "spa",
    configFile: false,
    logLevel: "silent",
    plugins: [svelte()],
    resolve: { alias: { "@starwind-ui/runtime/select": path.join(root, "runtime.ts") } },
    root,
    server: middlewareMode
      ? { middlewareMode: true }
      : { host: "127.0.0.1", port: 0, strictPort: false },
  });
}

const APP_SOURCE = String.raw`<script lang="ts">
  import OwnershipHarness from "./OwnershipHarness.svelte";
  import {
    SelectItem,
    SelectItemIndicator,
    SelectItemText,
    SelectList,
    SelectPopup,
    SelectPortal,
    SelectPositioner,
    SelectRoot,
    SelectTrigger,
    SelectValue,
  } from "./select/index";

  let open = $state(false);
  let value = $state<string | null>(null);
  let cancelOpen = $state(true);
  let cancelValue = $state(true);
  let openCallbackCount = $state(0);
  let valueCallbackCount = $state(0);
  let portalTarget = $state("#portal-a");
  let mounted = $state(true);
  let items = $state([
    { id: "stable-alpha", value: "alpha", label: "Alpha", explicit: true },
    { id: "stable-empty", value: "empty", label: "", explicit: true },
    { id: "stable-missing", value: "missing", label: "", explicit: false },
  ]);
  let refConnects = $state(0);
  let refCleanups = $state(0);
  let ownershipHarness: {
    acceptOpen(): void;
    controlOpen(value: boolean): void;
    controlValue(value: boolean): void;
    setExternalOpen(value: boolean): void;
    setExternalValue(value: string | null): void;
    snapshot(): { openCallbackCount: number };
  } | undefined;

  function trackRef(element: Element | null) {
    if (element) refConnects += 1;
    else refCleanups += 1;
  }
  function handleOpen(next: boolean, detail: { cancel(): void }) {
    openCallbackCount += 1;
    if (cancelOpen) detail.cancel();
  }
  function handleValue(next: string | null, detail: { cancel(): void }) {
    valueCallbackCount += 1;
    if (cancelValue) detail.cancel();
  }

  export function acceptOpen() { cancelOpen = false; }
  export function acceptValue() { cancelValue = false; }
  export function setValue(next: string | null) { value = next; }
  export function reorder() { items = [items[2]!, items[1]!, items[0]!]; }
  export function retarget() { portalTarget = "#portal-b"; }
  export function setMounted(next: boolean) { mounted = next; }
  export function snapshot() {
    return { open, openCallbackCount, ownership: ownershipHarness?.snapshot(), refCleanups, refConnects, value, valueCallbackCount };
  }
  export function ownershipAcceptOpen() { ownershipHarness?.acceptOpen(); }
  export function ownershipControlOpen(next: boolean) { ownershipHarness?.controlOpen(next); }
  export function ownershipControlValue(next: boolean) { ownershipHarness?.controlValue(next); }
  export function ownershipSetExternalOpen(next: boolean) { ownershipHarness?.setExternalOpen(next); }
  export function ownershipSetExternalValue(next: string | null) { ownershipHarness?.setExternalValue(next); }
</script>

<form id="proof-form">
  {#if mounted}
    <SelectRoot bind:open bind:value name="choice" modal={false} onOpenChange={handleOpen} onValueChange={handleValue} data-case="controlled" ref={trackRef}>
      <SelectTrigger data-case="controlled-trigger" ref={trackRef}>Choose <SelectValue placeholder="None" /></SelectTrigger>
      <SelectPortal container={portalTarget} data-case="controlled-portal" ref={trackRef}>
        <SelectPositioner>
          <SelectPopup>
            <SelectList>
              {#each items as item (item.id)}
                <SelectItem value={item.value} data-item-id={item.id} ref={item.id === "stable-alpha" ? trackRef : undefined}>
                  {#if item.explicit}<SelectItemText>{item.label}</SelectItemText>{/if}
                  <SelectItemIndicator>Selected</SelectItemIndicator>
                </SelectItem>
              {/each}
            </SelectList>
          </SelectPopup>
        </SelectPositioner>
      </SelectPortal>
    </SelectRoot>
  {/if}

  <SelectRoot defaultValue="alpha" name="reset-choice" modal={false} data-case="reset" ref={trackRef}>
    <SelectTrigger data-case="reset-trigger">Reset</SelectTrigger>
    <SelectPortal disabled>
      <SelectPopup><SelectItem value="alpha"><SelectItemText>Alpha</SelectItemText></SelectItem><SelectItem value="empty"><SelectItemText></SelectItemText></SelectItem></SelectPopup>
    </SelectPortal>
  </SelectRoot>
</form>

<SelectRoot defaultValue="other" modal={false} data-case="isolation" ref={trackRef}>
  <SelectTrigger>Other</SelectTrigger>
  <SelectPortal disabled><SelectPopup><SelectItem value="other"><SelectItemText>Other</SelectItemText></SelectItem></SelectPopup></SelectPortal>
</SelectRoot>

<OwnershipHarness bind:this={ownershipHarness} />
`;

const OWNERSHIP_SOURCE = String.raw`<script lang="ts">
  import { SelectItem, SelectItemText, SelectPopup, SelectPortal, SelectRoot, SelectTrigger } from "./select/index";

  let controlsOpen = $state(false);
  let controlsValue = $state(false);
  let externalOpen = $state(false);
  let externalValue = $state<string | null>("alpha");
  let cancelOpen = $state(true);
  let openCallbackCount = $state(0);
  let valueCallbackCount = $state(0);
  let ownedProps = $derived({
    ...(controlsOpen ? { open: externalOpen } : {}),
    ...(controlsValue ? { value: externalValue } : {}),
  });

  function handleOpen(next: boolean, detail: { cancel(): void; isCanceled: boolean }) {
    openCallbackCount += 1;
    if (cancelOpen) detail.cancel();
    if (!detail.isCanceled && controlsOpen) externalOpen = next;
  }
  function handleValue(next: string | null, detail: { isCanceled: boolean }) {
    valueCallbackCount += 1;
    if (!detail.isCanceled && controlsValue) externalValue = next;
  }

  export function acceptOpen() { cancelOpen = false; }
  export function controlOpen(value: boolean) { controlsOpen = value; }
  export function controlValue(value: boolean) { controlsValue = value; }
  export function setExternalOpen(value: boolean) { externalOpen = value; }
  export function setExternalValue(value: string | null) { externalValue = value; }
  export function snapshot() { return { externalOpen, externalValue, openCallbackCount, valueCallbackCount }; }
</script>

<form id="ownership-form">
  <SelectRoot {...ownedProps} defaultValue="alpha" name="ownership-choice" modal={false} onOpenChange={handleOpen} onValueChange={handleValue} data-case="ownership">
    <SelectTrigger data-case="ownership-trigger">Ownership</SelectTrigger>
    <SelectPortal disabled>
      <SelectPopup>
        <SelectItem value="alpha"><SelectItemText>Alpha</SelectItemText></SelectItem>
        <SelectItem value="empty"><SelectItemText></SelectItemText></SelectItem>
        <SelectItem value="missing"><SelectItemText>Missing</SelectItemText></SelectItem>
      </SelectPopup>
    </SelectPortal>
  </SelectRoot>
</form>
`;

const MAIN_SOURCE = String.raw`import { flushSync, hydrate, unmount } from "svelte";
import App from "./App.svelte";

const query = (selector) => document.querySelector(selector);
const formValue = (name) => new FormData(query("#proof-form")).get(name);
const ownershipFormValue = () => new FormData(query("#ownership-form")).get("ownership-choice");
const partInventory = () => Array.from(document.querySelectorAll("[data-sw-part]"))
  .map((element) => element.getAttribute("data-sw-part"))
  .sort()
  .join("|");
const tick = async () => { flushSync(); await new Promise((resolve) => setTimeout(resolve, 0)); flushSync(); };

void (async () => {
try {
  const target = query("#app");
  if (!(target instanceof HTMLElement)) throw new Error("Missing Select hydration target.");
  const beforeParts = partInventory();
  const instance = hydrate(App, { target });
  await tick();
  const afterParts = partInventory();

  const controlledRoot = () => query('[data-case="controlled"]');
  const trigger = () => query('[data-case="controlled-trigger"]');
  trigger()?.click();
  await tick();
  let snapshot = instance.snapshot();
  const canceledOpen = {
    binding: snapshot.open,
    callbackCount: snapshot.openCallbackCount,
    state: controlledRoot()?.getAttribute("data-state"),
  };

  instance.acceptOpen();
  trigger()?.click();
  await tick();
  snapshot = instance.snapshot();
  const acceptedOpen = {
    binding: snapshot.open,
    callbackCount: snapshot.openCallbackCount,
    formValue: formValue("choice"),
    state: controlledRoot()?.getAttribute("data-state"),
  };

  const emptyItem = query('[data-item-id="stable-empty"]');
  emptyItem?.dispatchEvent(new PointerEvent("pointerdown", { bubbles: true }));
  emptyItem?.click();
  await tick();
  snapshot = instance.snapshot();
  const canceledValue = {
    callbackCount: snapshot.valueCallbackCount,
    formValue: formValue("choice"),
    value: snapshot.value,
  };

  instance.acceptValue();
  emptyItem?.dispatchEvent(new PointerEvent("pointerdown", { bubbles: true }));
  emptyItem?.click();
  await tick();
  snapshot = instance.snapshot();
  const acceptedValue = {
    callbackCount: snapshot.valueCallbackCount,
    explicitEmptyLabel: controlledRoot()?.getAttribute("data-selected-label"),
    formValue: formValue("choice"),
    value: snapshot.value,
  };

  instance.setValue("alpha");
  await tick();
  snapshot = instance.snapshot();
  const external = {
    callbackCount: snapshot.valueCallbackCount,
    formValue: formValue("choice"),
    value: snapshot.value,
  };

  const alphaBefore = query('[data-item-id="stable-alpha"]');
  instance.reorder();
  await tick();
  const keyedIdentityPreserved = alphaBefore?.isSameNode(query('[data-item-id="stable-alpha"]')) ?? false;

  const initialParent = query('[data-case="controlled-portal"]')?.parentElement?.id;
  instance.retarget();
  await tick();
  const retargetedParent = query('[data-case="controlled-portal"]')?.parentElement?.id;

  query('[data-case="reset-trigger"]')?.click();
  await tick();
  const resetEmpty = query('[data-case="reset"] [data-value="empty"]');
  resetEmpty?.dispatchEvent(new PointerEvent("pointerdown", { bubbles: true }));
  resetEmpty?.click();
  await tick();
  const beforeReset = formValue("reset-choice");
  query("#proof-form")?.dispatchEvent(new Event("reset"));
  await new Promise((resolve) => setTimeout(resolve, 10));
  await tick();
  const afterReset = formValue("reset-choice");

  const isolationRoot = query('[data-case="isolation"]');
  const isolation = {
    label: isolationRoot?.getAttribute("data-selected-label"),
    value: isolationRoot?.getAttribute("data-value"),
  };

  const ownershipRoot = () => query('[data-case="ownership"]');
  const ownershipTrigger = () => query('[data-case="ownership-trigger"]');
  ownershipTrigger()?.click();
  await tick();
  instance.ownershipControlOpen(true);
  await tick();
  const afterOpenGain = { open: ownershipRoot()?.getAttribute("data-state") === "open", value: ownershipRoot()?.getAttribute("data-value") };
  ownershipTrigger()?.click();
  await tick();
  let ownershipSnapshot = instance.snapshot().ownership;
  const controlledCanceled = { callbackCount: ownershipSnapshot?.openCallbackCount, open: ownershipRoot()?.getAttribute("data-state") === "open" };
  instance.ownershipAcceptOpen();
  ownershipTrigger()?.click();
  await tick();
  ownershipSnapshot = instance.snapshot().ownership;
  const controlledAccepted = { callbackCount: ownershipSnapshot?.openCallbackCount, open: ownershipRoot()?.getAttribute("data-state") === "open" };
  instance.ownershipSetExternalOpen(false);
  await tick();
  ownershipSnapshot = instance.snapshot().ownership;
  const externalSuppressed = { callbackCount: ownershipSnapshot?.openCallbackCount, open: ownershipRoot()?.getAttribute("data-state") === "open" };
  instance.ownershipSetExternalValue("missing");
  instance.ownershipControlValue(true);
  await tick();
  const afterValueGain = { open: ownershipRoot()?.getAttribute("data-state") === "open", value: ownershipRoot()?.getAttribute("data-value") };
  ownershipTrigger()?.click();
  await tick();
  query('[data-case="ownership"] [data-value="empty"]')?.click();
  await tick();
  instance.ownershipControlOpen(false);
  await tick();
  const afterOpenRemoval = { open: ownershipRoot()?.getAttribute("data-state") === "open", value: ownershipRoot()?.getAttribute("data-value") };
  ownershipTrigger()?.click();
  await tick();
  instance.ownershipControlValue(false);
  await tick();
  const afterValueRemoval = { open: ownershipRoot()?.getAttribute("data-state") === "open", value: ownershipRoot()?.getAttribute("data-value") };
  const ownershipResetBefore = ownershipFormValue();
  query("#ownership-form")?.dispatchEvent(new Event("reset"));
  await new Promise((resolve) => setTimeout(resolve, 10));
  await tick();
  const ownershipResetAfter = ownershipFormValue();

  instance.setMounted(false);
  await tick();
  instance.setMounted(true);
  await tick();
  await unmount(instance);
  snapshot = instance.snapshot();
  document.documentElement.dataset.svelteSelectResult = JSON.stringify({
    acceptedOpen,
    acceptedValue,
    canceledOpen,
    canceledValue,
    external,
    hydration: {
      exactPartInventory: beforeParts === afterParts,
      portalMovedAfterHydration: initialParent === "portal-a",
    },
    isolation,
    keyedIdentityPreserved,
    lifecycle: globalThis.__selectLifecycle,
    portal: { initialParent, retargetedParent },
    ownership: {
      afterOpenGain,
      afterOpenRemoval,
      afterValueGain,
      afterValueRemoval,
      controlledAccepted,
      controlledCanceled,
      externalSuppressed,
      reset: { after: ownershipResetAfter, before: ownershipResetBefore },
    },
    refs: { cleanups: snapshot.refCleanups, connects: snapshot.refConnects },
    reset: { afterReset, beforeReset },
    rootCountAfterUnmount: document.querySelectorAll("[data-sw-select]").length,
  });
} catch (error) {
  document.documentElement.dataset.svelteSelectResult = JSON.stringify({
    error: error instanceof Error ? error.stack ?? error.message : String(error),
  });
}
})();
`;
