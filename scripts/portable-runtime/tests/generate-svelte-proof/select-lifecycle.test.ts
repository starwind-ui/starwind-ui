import { copyFile, mkdir, mkdtemp, readdir, rm, writeFile } from "node:fs/promises";
import path from "node:path";

import { svelte } from "@sveltejs/vite-plugin-svelte";
import { type Browser, chromium } from "playwright";
import { render } from "svelte/server";
import { createServer, type ViteDevServer } from "vite";
import { afterEach, describe, expect, it } from "vitest";

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
      portal: {
        crossDocumentParent: "BODY",
        disconnectedParent: "BODY",
        initialParent: "portal-a",
        nestedParent: "controlled-portal",
        retargetedParent: "portal-b",
      },
      portalEvents: { delegatedClicks: 2, readyAfterMove: true },
      reset: { afterReset: "alpha", beforeReset: "empty" },
      rootCountAfterUnmount: 0,
    });
    expect(result.refs).toEqual({ cleanups: 10, connects: 10 });
    expect(result.lifecycle.byCase.ownership).toEqual({ connects: 1, destroys: 1 });
    expect(result.lifecycle.connects).toBe(7);
    expect(result.lifecycle.destroys).toBe(7);
    expect(result.lifecycle.setOpen).toBeGreaterThanOrEqual(1);
    expect(result.lifecycle.setValue).toBeGreaterThanOrEqual(2);
  }, 120_000);
});

async function createHarness(): Promise<string> {
  const root = await mkdtemp(path.join(process.cwd(), ".svelte-select-browser-"));
  temporaryRoots.push(root);
  await mkdir(path.join(root, "_internal"));
  await copyFile(
    path.join(process.cwd(), "packages/svelte/src/_internal/ref-attachment.ts"),
    path.join(root, "_internal/ref-attachment.ts"),
  );
  await copyFile(
    path.join(process.cwd(), "packages/svelte/src/_internal/portal-document-observer.ts"),
    path.join(root, "_internal/portal-document-observer.ts"),
  );
  await copyFile(
    path.join(process.cwd(), "packages/svelte/src/_internal/portal-placement.ts"),
    path.join(root, "_internal/portal-placement.ts"),
  );
  const selectRoot = path.join(root, "select");
  await mkdir(selectRoot);
  const fixtureRoot = path.join(process.cwd(), "packages/svelte/src/select");
  for (const file of await readdir(fixtureRoot)) {
    await copyFile(path.join(fixtureRoot, file), path.join(selectRoot, file));
  }
  const actualRuntime = path
    .join(process.cwd(), "packages/runtime/src/components/select/index.ts")
    .replaceAll("\\", "/");
  await writeFile(
    path.join(root, "runtime.ts"),
    `import {
  createSelect as createActualSelect,
  reportPortalPlacement as reportActualPortalPlacement,
  resolvePortalPlacement as resolveActualPortalPlacement,
} from "${actualRuntime}";

const proof = globalThis.__selectLifecycle ??= {
  connects: 0,
  destroys: 0,
  portalReports: [],
  setOpen: 0,
  setValue: 0,
};

export function resolvePortalPlacement(wrapper, options) {
  return resolveActualPortalPlacement(wrapper, options);
}

export function reportPortalPlacement(wrapper, placement) {
  proof.portalReports.push({
    parentMatches: placement ? wrapper.parentElement === placement.target : null,
    ready: placement?.ready ?? null,
  });
  return reportActualPortalPlacement(wrapper, placement);
}

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
    // Concurrent proof servers must own their optimized dependencies.
    cacheDir: path.join(root, middlewareMode ? ".vite-ssr" : ".vite-browser"),
    configFile: false,
    logLevel: "silent",
    plugins: [svelte()],
    resolve: { alias: { "@starwind-ui/runtime/select": path.join(root, "runtime.ts") } },
    root,
    server: middlewareMode
      ? { middlewareMode: true, watch: null, hmr: false }
      : { host: "127.0.0.1", port: 0, strictPort: false, watch: null, hmr: false },
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
  let portalTarget = $state<string | HTMLElement>("#portal-a");
  let mounted = $state(true);
  let items = $state([
    { id: "stable-alpha", value: "alpha", label: "Alpha", explicit: true },
    { id: "stable-empty", value: "empty", label: "", explicit: true },
    { id: "stable-missing", value: "missing", label: "", explicit: false },
  ]);
  let refConnects = $state(0);
  let refCleanups = $state(0);
  let delegatedClicks = $state(0);
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
  export function retargetElement(next: HTMLElement) { portalTarget = next; }
  export function setMounted(next: boolean) { mounted = next; }
  export function snapshot() {
    return { delegatedClicks, open, openCallbackCount, ownership: ownershipHarness?.snapshot(), refCleanups, refConnects, value, valueCallbackCount };
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
                <SelectItem value={item.value} data-item-id={item.id} ref={item.id === "stable-alpha" ? trackRef : undefined} onclick={item.id === "stable-empty" ? () => delegatedClicks += 1 : undefined}>
                  {#if item.explicit}<SelectItemText>{item.label}</SelectItemText>{/if}
                  <SelectItemIndicator>Selected</SelectItemIndicator>
                </SelectItem>
              {/each}
            </SelectList>
          </SelectPopup>
        </SelectPositioner>
        <SelectRoot defaultValue="nested" modal={false} data-case="nested">
          <SelectTrigger>Nested trigger</SelectTrigger>
          <SelectPortal data-case="nested-portal">
            <SelectPositioner>
              <SelectPopup><SelectItem value="nested"><SelectItemText>Nested</SelectItemText></SelectItem></SelectPopup>
            </SelectPositioner>
          </SelectPortal>
        </SelectRoot>
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
const waitFor = async (predicate, label) => {
  for (let attempt = 0; attempt < 60; attempt += 1) {
    flushSync();
    if (predicate()) return;
    await new Promise((resolve) => requestAnimationFrame(resolve));
  }
  throw new Error("Timed out waiting for " + label + ".");
};

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
  const nestedParent = query('[data-case="nested-portal"]')?.parentElement?.dataset.case;
  instance.retarget();
  await tick();
  const retargetedParent = query('[data-case="controlled-portal"]')?.parentElement?.id;
  query("#portal-b")?.remove();
  await tick();
  const disconnectedParent = query('[data-case="controlled-portal"]')?.parentElement?.tagName;
  const foreignFrame = document.createElement("iframe");
  document.body.append(foreignFrame);
  const foreignTarget = foreignFrame.contentDocument?.body;
  if (!foreignTarget) throw new Error("Missing cross-document portal target.");
  instance.retargetElement(foreignTarget);
  await tick();
  const crossDocumentParent = query('[data-case="controlled-portal"]')?.parentElement?.tagName;
  foreignFrame.remove();

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
  ownershipTrigger()?.focus();
  ownershipTrigger()?.click();
  await tick();
  instance.ownershipControlOpen(true);
  await tick();
  const afterOpenGain = { open: ownershipRoot()?.getAttribute("data-state") === "open", value: ownershipRoot()?.getAttribute("data-value") };
  ownershipTrigger()?.focus();
  ownershipTrigger()?.click();
  await tick();
  let ownershipSnapshot = instance.snapshot().ownership;
  const controlledCanceled = { callbackCount: ownershipSnapshot?.openCallbackCount, open: ownershipRoot()?.getAttribute("data-state") === "open" };
  instance.ownershipAcceptOpen();
  ownershipTrigger()?.focus();
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
  await waitFor(
    () => query('[data-case="ownership"] [data-sw-select-popup]')?.hidden === true,
    "the ownership Select close before a new selection",
  );
  ownershipTrigger()?.focus();
  ownershipTrigger()?.click();
  await waitFor(
    () => ownershipRoot()?.getAttribute("data-state") === "open" && query('[data-case="ownership"] [data-sw-select-popup]')?.hidden === false,
    "the ownership Select popup before selection",
  );
  query('[data-case="ownership"] [data-value="empty"]')?.click();
  await waitFor(
    () => ownershipRoot()?.getAttribute("data-value") === "empty",
    "the accepted ownership Select value",
  );
  await tick();
  instance.ownershipControlOpen(false);
  await tick();
  const afterOpenRemoval = { open: ownershipRoot()?.getAttribute("data-state") === "open", value: ownershipRoot()?.getAttribute("data-value") };
  await waitFor(
    () => query('[data-case="ownership"] [data-sw-select-popup]')?.hidden === true,
    "the ownership Select close lifecycle",
  );
  ownershipTrigger()?.focus();
  ownershipTrigger()?.click();
  await waitFor(
    () => ownershipRoot()?.getAttribute("data-state") === "open",
    "the ownership Select open state",
  );
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
    portal: { crossDocumentParent, disconnectedParent, initialParent, nestedParent, retargetedParent },
    portalEvents: {
      delegatedClicks: snapshot.delegatedClicks,
      readyAfterMove: (globalThis.__selectLifecycle?.portalReports ?? [])
        .filter((report) => report.ready === true)
        .every((report) => report.parentMatches === true),
    },
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

// These consumers exercise the public Runtime through generated Svelte components.
type SelectModelCase = {
  id: string;
  mode: "omitted" | "plain" | "bound" | "function";
  initialOpen?: boolean;
  initialValue?: string | null;
  defaultOpen?: boolean;
  defaultValue?: string | null;
  openSetter?: "identity" | "retain" | "invert";
  valueSetter?: "identity" | "retain" | "transform";
  openProposal?: "accept" | "cancel" | "value-command-cancel";
  valueProposal?:
    | "accept"
    | "cancel"
    | "open-two-commands"
    | "both-command-cancel"
    | "two-values"
    | "options"
    | "unmount";
};

async function runSelectModelCases(
  configs: SelectModelCase[],
  actions: string,
  expectedConnections: Record<string, number> = {},
): Promise<any> {
  const directory = await createHarness();
  await writeFile(path.join(directory, "ModelCase.svelte"), MODEL_CASE_SOURCE, "utf8");
  await writeFile(
    path.join(directory, "App.svelte"),
    `<script lang="ts">
import ModelCase from "./ModelCase.svelte";
const configs = ${JSON.stringify(configs)};
const cases: Record<string, any> = {};
export function getCases() { return cases; }
</script>
{#each configs as config (config.id)}<ModelCase {...config} bind:this={cases[config.id]} />{/each}`,
    "utf8",
  );
  const ssrServer = await createProofServer(directory, true);
  servers.push(ssrServer);
  const appModule = await ssrServer.ssrLoadModule("/App.svelte");
  const renderer = await ssrServer.ssrLoadModule("svelte/server");
  const serverMarkup = renderer.render(appModule.default).body;
  expect(globalThis).not.toHaveProperty("window");
  expect(globalThis).not.toHaveProperty("document");
  await writeFile(
    path.join(directory, "index.html"),
    `<link rel="icon" href="data:,"><div id="app">${serverMarkup}</div><div id="portal-a"></div><div id="portal-b"></div><script type="module" src="/main.ts"></script>`,
    "utf8",
  );
  await writeFile(
    path.join(directory, "main.ts"),
    `import { hydrate, flushSync, tick, unmount } from "svelte";
import App from "./App.svelte";
try {
  const app = hydrate(App, { target: document.querySelector("#app")! });
  const settle = async () => { flushSync(); await tick(); flushSync(); };
  const resetSettled = async () => { await new Promise((resolve) => setTimeout(resolve, 10)); await settle(); };
  await settle();
  const cases = app.getCases();
  const root = (id) => document.querySelector('[data-case="' + id + '"]');
  const portal = (id) => document.querySelector('[data-model-portal="' + id + '"]');
  const form = (id) => document.querySelector('[data-model-form="' + id + '"]');
  const trigger = (id) => root(id)?.querySelector("[data-sw-select-trigger]")?.click();
  const choose = (id, value) => portal(id)?.querySelector('[data-sw-select-item][data-value="' + value + '"]')?.click();
  const reset = (id) => form(id).reset();
  const state = (id) => {
    const element = root(id);
    const input = element?.querySelector("input");
    return { ...cases[id].snapshot(), exists: Boolean(element),
      open: element?.getAttribute("data-state") === "open",
      value: element?.getAttribute("data-value") ?? null,
      label: element?.getAttribute("data-selected-label") ?? null,
      nativeValue: input?.value ?? null,
      formId: input?.form?.id ?? null,
      formValue: new FormData(input?.form ?? form(id)).get("choice"),
      readOnly: element?.querySelector("[data-sw-select-trigger]")?.getAttribute("aria-readonly") ?? null,
      portalParent: portal(id)?.parentElement?.id ?? null,
      popupHidden: portal(id)?.querySelector("[data-sw-select-popup]")?.hidden ?? null,
    };
  };
  const result = await (async () => { ${actions} })();
  await unmount(app);
  await resetSettled();
  document.documentElement.dataset.svelteSelectResult = JSON.stringify({ ...result,
    cleanup: globalThis.__selectLifecycle,
    remainingPortals: document.querySelectorAll("[data-model-portal]").length,
  });
} catch (error) {
  document.documentElement.dataset.svelteSelectResult = JSON.stringify({ error: String(error), stack: error.stack });
}`,
    "utf8",
  );
  const server = await createProofServer(directory, false);
  servers.push(server);
  await server.listen();
  const browser = await chromium.launch({ channel: "chrome", headless: true });
  browsers.push(browser);
  const page = await browser.newPage();
  const errors: string[] = [];
  page.on("console", (message) => {
    if (message.type() === "error" || message.type() === "warning") errors.push(message.text());
  });
  page.on("pageerror", (error) => errors.push(error.message));
  const url = server.resolvedUrls?.local[0];
  if (!url) throw new Error("Missing Select model proof URL.");
  const pageFailure = new Promise<never>((_, reject) => {
    page.on("pageerror", reject);
    page.on("requestfailed", (request) =>
      reject(new Error(`${request.url()}: ${request.failure()?.errorText}`)),
    );
    page.on("response", (response) => {
      if (response.status() >= 400)
        reject(new Error(`HTTP ${response.status()} ${response.statusText()}: ${response.url()}`));
    });
  });
  try {
    await Promise.race([
      (async () => {
        await page.goto(url);
        await page.waitForFunction(() => document.documentElement.dataset.svelteSelectResult);
      })(),
      pageFailure,
    ]);
  } catch (error) {
    throw new Error(`Select model fixture ${JSON.stringify(configs)} failed: ${String(error)}`);
  }
  const result = await page.evaluate(() =>
    JSON.parse(document.documentElement.dataset.svelteSelectResult ?? "{}"),
  );
  expect(errors).toEqual([]);
  expect(result).not.toHaveProperty("error");
  expect(result.remainingPortals).toBe(0);
  expect(result.cleanup.connects).toBe(result.cleanup.destroys);
  for (const [id, counts] of Object.entries(result.cleanup.byCase)) {
    const expected = expectedConnections[id] ?? 1;
    expect(counts).toEqual({ connects: expected, destroys: expected });
  }
  return { ...result, serverMarkup };
}

const MODEL_CASE_SOURCE = String.raw`<script lang="ts">
import { flushSync, untrack } from "svelte";
import { SelectRoot, SelectTrigger, SelectValue, SelectPortal, SelectPopup, SelectItem, SelectItemText } from "./select/index";
let { id, mode, initialOpen, initialValue, defaultOpen, defaultValue, openSetter = "identity", valueSetter = "identity", openProposal = "accept", valueProposal = "accept" } = $props();
let openModel = $state<boolean | undefined>(untrack(() => initialOpen));
let valueModel = $state<string | null | undefined>(untrack(() => initialValue));
let openSeed = $state<boolean | undefined>(untrack(() => defaultOpen));
let valueSeed = $state<string | null | undefined>(untrack(() => defaultValue));
let shown = $state(true);
let readOnly = $state(false);
let disabled = $state(false);
let modal = $state(false);
let associatedForm = $state<string | undefined>(undefined);
let container = $state("#portal-a");
let triggerKey = $state(0);
const openWrites: boolean[] = [];
const valueWrites: (string | null)[] = [];
const openCallbacks: any[] = [];
const valueCallbacks: any[] = [];
function handleOpen(next, detail) {
  openCallbacks.push({ next, open: openModel, value: valueModel });
  if (openProposal === "cancel") detail.cancel();
  if (openProposal === "value-command-cancel") { valueModel = "gamma"; flushSync(); detail.cancel(); }
}
function handleValue(next, detail) {
  valueCallbacks.push({ next, open: openModel, value: valueModel });
  if (valueProposal === "cancel") detail.cancel();
  if (valueProposal === "open-two-commands" || valueProposal === "both-command-cancel") {
    openModel = false; flushSync(); openModel = true; flushSync();
  }
  if (valueProposal === "both-command-cancel") { valueModel = "gamma"; flushSync(); detail.cancel(); }
  if (valueProposal === "two-values") { valueModel = next; flushSync(); valueModel = "gamma"; flushSync(); }
  if (valueProposal === "options") { readOnly = true; modal = true; container = "#portal-b"; flushSync(); }
  if (valueProposal === "unmount") { shown = false; flushSync(); }
}
function publishOpen(next) {
  openWrites.push(next);
  if (openSetter === "identity") openModel = next;
  else if (openSetter === "invert") openModel = !next;
}
function publishValue(next) {
  valueWrites.push(next);
  if (valueSetter === "identity") valueModel = next;
  else if (valueSetter === "transform") valueModel = next === "beta" ? "gamma" : next;
}
export function setOpen(next: boolean | undefined) { openModel = next; }
export function setValue(next: string | null | undefined) { valueModel = next; }
export function setDefault(next: string | null | undefined) { valueSeed = next; }
export function setDefaultOpen(next: boolean) { openSeed = next; }
export function setForm(next: string) { associatedForm = next; }
export function setReadOnly(next: boolean) { readOnly = next; }
export function setDisabled(next: boolean) { disabled = next; }
export function retarget(next: string) { container = next; }
export function replaceTrigger() { triggerKey += 1; }
export function hide() { shown = false; }
export function snapshot() { return {
  openModel: openModel ?? "undefined", valueModel: valueModel === undefined ? "undefined" : valueModel,
  openWrites: [...openWrites], valueWrites: [...valueWrites],
  openCallbacks: [...openCallbacks], valueCallbacks: [...valueCallbacks],
}; }
</script>
<form id={id + "-other"}></form>
<form data-model-form={id}>
{#snippet parts()}
  {#snippet triggerChild({ props, children })}{#key triggerKey}<button {...props}>{@render children?.()}</button>{/key}{/snippet}
  <SelectTrigger child={triggerChild}><SelectValue placeholder="Choose" /></SelectTrigger>
  <SelectPortal {container} data-model-portal={id}>
    <SelectPopup>
      <SelectItem value="alpha"><SelectItemText>Alpha</SelectItemText></SelectItem>
      <SelectItem value="beta"><SelectItemText>Beta</SelectItemText></SelectItem>
      <SelectItem value="gamma"><SelectItemText>Gamma</SelectItemText></SelectItem>
      <SelectItem value=""><SelectItemText>Empty</SelectItemText></SelectItem>
    </SelectPopup>
  </SelectPortal>
{/snippet}
{#if shown}
  {#if mode === "omitted"}
    <SelectRoot data-case={id} defaultOpen={openSeed} defaultValue={valueSeed} {disabled} {readOnly} {modal} form={associatedForm} name="choice" onOpenChange={handleOpen} onValueChange={handleValue} children={parts} />
  {:else if mode === "plain"}
    <SelectRoot data-case={id} open={openModel} value={valueModel} defaultOpen={openSeed} defaultValue={valueSeed} {disabled} {readOnly} {modal} form={associatedForm} name="choice" onOpenChange={handleOpen} onValueChange={handleValue} children={parts} />
  {:else if mode === "function"}
    <SelectRoot data-case={id} bind:open={() => openModel, publishOpen} bind:value={() => valueModel, publishValue} defaultOpen={openSeed} defaultValue={valueSeed} {disabled} {readOnly} {modal} form={associatedForm} name="choice" onOpenChange={handleOpen} onValueChange={handleValue} children={parts} />
  {:else}
    <SelectRoot data-case={id} bind:open={openModel} bind:value={valueModel} defaultOpen={openSeed} defaultValue={valueSeed} {disabled} {readOnly} {modal} form={associatedForm} name="choice" onOpenChange={handleOpen} onValueChange={handleValue} children={parts} />
  {/if}
{/if}
<output data-model-ssr={id}>{String(openModel)}:{String(valueModel)}:{openWrites.length}:{valueWrites.length}</output>
</form>`;

describe("Select portal presence lifecycle", () => {
  it("retains placement through exit completion, replacement, interrupted close, and unmount", async () => {
    const result = await runSelectModelCases(
      [{ id: "presence", mode: "function", initialOpen: true, initialValue: "alpha" }],
      `const id = "presence";
      const originalPortal = portal(id);
      const popup = originalPortal.querySelector("[data-sw-select-popup]");
      const pendingExit = () => {
        const animation = popup.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 60_000 });
        animation.pause();
        return animation;
      };
      const firstExit = pendingExit();
      cases[id].setOpen(false); await settle();
      const pending = { open: state(id).open, hidden: popup.hidden, ending: popup.hasAttribute("data-ending-style") };
      cases[id].retarget("#portal-b"); await settle();
      const movedPending = { samePortal: portal(id) === originalPortal, parent: originalPortal.parentElement.id, hidden: popup.hidden };
      firstExit.finish(); await firstExit.finished; await settle();
      const completed = { hidden: popup.hidden, ending: popup.hasAttribute("data-ending-style"), parent: originalPortal.parentElement.id };
      cases[id].setOpen(true); cases[id].retarget("#portal-a"); await settle();
      const retired = root(id).querySelector("[data-sw-select-trigger]");
      cases[id].replaceTrigger(); flushSync();
      retired.click();
      await settle();
      const replacement = { samePortal: portal(id) === originalPortal, samePopup: originalPortal.querySelector("[data-sw-select-popup]") === popup,
        parent: originalPortal.parentElement.id, open: state(id).open, hidden: popup.hidden,
        retiredDetached: !retired.isConnected, callbacks: state(id).openCallbacks.length };
      const currentTrigger = root(id).querySelector("[data-sw-select-trigger]");
      currentTrigger.focus(); currentTrigger.click(); await settle();
      const liveCallbacks = state(id).openCallbacks.length;
      cases[id].setOpen(true); await settle();
      const interruptedExit = pendingExit();
      cases[id].setOpen(false); await settle();
      cases[id].setOpen(true); cases[id].retarget("#portal-b"); await settle();
      interruptedExit.finish(); await interruptedExit.finished; await settle();
      const reopened = { open: state(id).open, hidden: popup.hidden, parent: originalPortal.parentElement.id };
      const detachedExit = pendingExit();
      cases[id].setOpen(false); await settle();
      cases[id].hide(); flushSync();
      currentTrigger.click();
      detachedExit.finish(); await detachedExit.finished; await settle();
      return { pending, movedPending, completed, replacement, liveCallbacks, reopened,
        detached: !originalPortal.isConnected, final: cases[id].snapshot() };`,
      { presence: 2 },
    );
    expect(result).toMatchObject({
      pending: { open: false, hidden: false, ending: true },
      movedPending: { samePortal: true, parent: "portal-b", hidden: false },
      completed: { hidden: true, ending: false, parent: "portal-b" },
      replacement: {
        samePortal: true,
        samePopup: true,
        parent: "portal-a",
        open: true,
        hidden: false,
        retiredDetached: true,
        callbacks: 0,
      },
      liveCallbacks: 1,
      reopened: { open: true, hidden: false, parent: "portal-b" },
      detached: true,
      final: {
        openWrites: [false],
        valueWrites: [],
        openCallbacks: [{ next: false, open: true, value: "alpha" }],
        valueCallbacks: [],
      },
    });
  }, 60_000);
});

describe("Select accepted models", () => {
  it("uses initial commands and defaults, normalizes empty values, and retains state on undefined", async () => {
    const result = await runSelectModelCases(
      [
        { id: "component", mode: "omitted" },
        { id: "defaults", mode: "omitted", defaultValue: "alpha", defaultOpen: true },
        { id: "undefined", mode: "function", defaultValue: "beta", defaultOpen: true },
        { id: "undefined-bound", mode: "bound", defaultValue: "gamma", defaultOpen: true },
        {
          id: "model",
          mode: "function",
          initialOpen: true,
          initialValue: "gamma",
          defaultOpen: false,
          defaultValue: null,
        },
        { id: "plain", mode: "plain", initialOpen: false, initialValue: "alpha" },
        {
          id: "null",
          mode: "function",
          initialOpen: false,
          initialValue: null,
          defaultValue: "alpha",
          defaultOpen: true,
        },
        {
          id: "empty",
          mode: "function",
          initialOpen: false,
          initialValue: "",
          defaultValue: "alpha",
        },
      ],
      `
      const initial = Object.fromEntries(Object.keys(cases).map((id) => [id, state(id)]));
      cases.plain.setOpen(true); cases.plain.setValue("beta"); await settle();
      const plainCommand = state("plain");
      choose("plain", "gamma"); await settle();
      const plainAccepted = state("plain");
      cases.plain.setValue("beta"); await settle();
      const samePlainCommand = state("plain");
      cases.plain.setValue(undefined); await settle();
      const plainUndefined = state("plain");
      cases.undefined.setOpen(undefined); cases.undefined.setValue(undefined); await settle();
      const omittedLater = state("undefined");
      cases.undefined.setValue(""); await settle();
      const normalizedLater = state("undefined");
      return { initial, plainCommand, plainAccepted, samePlainCommand, plainUndefined, omittedLater, normalizedLater };
    `,
    );
    expect(result.initial.component).toMatchObject({
      open: false,
      value: null,
      nativeValue: "",
      openCallbacks: [],
      valueCallbacks: [],
    });
    expect(result.initial.defaults).toMatchObject({ open: true, value: "alpha", label: "Alpha" });
    expect(result.initial.undefined).toMatchObject({
      open: true,
      value: "beta",
      openModel: "undefined",
      valueModel: "undefined",
      openWrites: [],
      valueWrites: [],
    });
    expect(result.initial["undefined-bound"]).toMatchObject({
      open: true,
      value: "gamma",
      openModel: "undefined",
      valueModel: "undefined",
    });
    expect(result.initial.model).toMatchObject({
      open: true,
      value: "gamma",
      openWrites: [],
      valueWrites: [],
    });
    expect(result.initial.null).toMatchObject({
      open: false,
      value: null,
      valueModel: null,
      valueWrites: [],
      openWrites: [],
    });
    expect(result.initial.empty).toMatchObject({
      value: null,
      valueModel: "",
      valueWrites: [],
      formValue: "",
    });
    expect(result.plainCommand).toMatchObject({
      open: true,
      value: "beta",
      valueCallbacks: [],
      openCallbacks: [],
    });
    expect(result.plainAccepted).toMatchObject({
      open: false,
      value: "gamma",
      openModel: true,
      valueModel: "beta",
      formValue: "gamma",
    });
    expect(result.samePlainCommand).toMatchObject({ value: "gamma", valueModel: "beta" });
    expect(result.plainUndefined).toMatchObject({ value: "gamma", valueModel: "undefined" });
    expect(result.omittedLater).toMatchObject({
      open: true,
      value: "beta",
      openModel: "undefined",
      valueModel: "undefined",
    });
    expect(result.normalizedLater).toMatchObject({
      value: null,
      valueModel: "",
      valueWrites: [],
      valueCallbacks: [],
    });
    expect(result.serverMarkup).toContain('data-model-ssr="undefined">undefined:undefined:0:0');
  }, 60_000);

  it("publishes accepted transitions once through function bindings", async () => {
    const result = await runSelectModelCases(
      [
        { id: "open", mode: "function", initialOpen: false, initialValue: "alpha" },
        { id: "value", mode: "function", initialOpen: true, initialValue: "alpha" },
      ],
      `trigger("open"); await settle(); const opened=state("open"); cases.open.setOpen(false); await settle(); choose("value","beta"); await settle(); return {opened,selected:state("value")};`,
    );
    expect(result.opened).toMatchObject({ open: true, openModel: true, openWrites: [true] });
    expect(result.selected).toMatchObject({
      value: "beta",
      valueModel: "beta",
      valueWrites: ["beta"],
      open: false,
      openWrites: [false],
      formValue: "beta",
    });
    expect(result.selected.valueCallbacks).toEqual([{ next: "beta", open: true, value: "alpha" }]);
  }, 60_000);

  it("keeps callback and DOM cancellation ahead of publication for both models", async () => {
    const result = await runSelectModelCases(
      [
        {
          id: "open-callback",
          mode: "function",
          initialOpen: false,
          initialValue: "alpha",
          openProposal: "cancel",
        },
        { id: "open-dom", mode: "function", initialOpen: false, initialValue: "alpha" },
        {
          id: "value-callback",
          mode: "function",
          initialOpen: true,
          initialValue: "alpha",
          valueProposal: "cancel",
        },
        { id: "value-dom", mode: "function", initialOpen: true, initialValue: "alpha" },
      ],
      `
      const observations = [];
      for (const id of Object.keys(cases)) {
        const isOpen = id.startsWith("open-");
        root(id).addEventListener(isOpen ? "starwind:open-change" : "starwind:value-change", (event) => {
          observations.push({ id, canceled: event.detail.isCanceled, open: cases[id].snapshot().openModel, value: cases[id].snapshot().valueModel });
          if (id.endsWith("-dom")) event.preventDefault();
        });
        if (isOpen) trigger(id); else choose(id, "beta");
        await settle();
      }
      return { observations, states: Object.fromEntries(Object.keys(cases).map((id) => [id, state(id)])) };
    `,
    );
    for (const id of ["open-callback", "open-dom"])
      expect(result.states[id]).toMatchObject({
        open: false,
        openModel: false,
        openWrites: [],
        valueWrites: [],
      });
    for (const id of ["value-callback", "value-dom"])
      expect(result.states[id]).toMatchObject({
        open: true,
        value: "alpha",
        valueModel: "alpha",
        valueWrites: [],
        openWrites: [],
        formValue: "alpha",
      });
    expect(result.observations.map((entry: any) => entry.canceled)).toEqual([
      true,
      false,
      true,
      false,
    ]);
    expect(result.observations.every((entry: any) => entry.value === "alpha")).toBe(true);
  }, 60_000);

  it("applies option normalization without proposals or a new owner", async () => {
    const result = await runSelectModelCases(
      [{ id: "disabled", mode: "function", initialOpen: true, initialValue: "alpha" }],
      `
      cases.disabled.setDisabled(true); await settle();
      const disabled = state("disabled");
      cases.disabled.setOpen(true); await settle();
      const commandWhileDisabled = state("disabled");
      cases.disabled.setDisabled(false); await settle();
      const enabled = state("disabled");
      return { disabled, commandWhileDisabled, enabled };
    `,
    );
    expect(result.disabled).toMatchObject({
      open: false,
      openModel: true,
      openWrites: [],
      value: "alpha",
      valueWrites: [],
      openCallbacks: [],
      valueCallbacks: [],
    });
    expect(result.commandWhileDisabled).toMatchObject({
      open: false,
      openModel: true,
      openWrites: [],
      openCallbacks: [],
    });
    expect(result.enabled).toMatchObject({
      open: true,
      openModel: true,
      value: "alpha",
      openWrites: [],
    });
  }, 60_000);

  it("resets the frozen value seed while preserving cancellation and newer state", async () => {
    const result = await runSelectModelCases(
      [
        {
          id: "seed",
          mode: "function",
          initialOpen: false,
          initialValue: "beta",
          defaultValue: "alpha",
        },
        { id: "model-seed", mode: "function", initialOpen: false, initialValue: "gamma" },
        {
          id: "null-seed",
          mode: "function",
          initialOpen: false,
          initialValue: "beta",
          defaultValue: null,
        },
        {
          id: "empty-seed",
          mode: "function",
          initialOpen: false,
          initialValue: "beta",
          defaultValue: "",
        },
        {
          id: "cancel",
          mode: "function",
          initialOpen: false,
          initialValue: "beta",
          defaultValue: "alpha",
        },
        {
          id: "parent",
          mode: "function",
          initialOpen: false,
          initialValue: "alpha",
          defaultValue: "alpha",
        },
        {
          id: "interaction",
          mode: "function",
          initialOpen: true,
          initialValue: "alpha",
          defaultValue: "alpha",
        },
        {
          id: "open-only",
          mode: "function",
          initialOpen: false,
          initialValue: "beta",
          defaultValue: "alpha",
        },
        {
          id: "unmount",
          mode: "function",
          initialOpen: false,
          initialValue: "beta",
          defaultValue: "alpha",
        },
      ],
      `
      cases.seed.setDefault("gamma"); await settle(); reset("seed"); await resetSettled();
      cases["model-seed"].setValue("beta"); await settle(); reset("model-seed"); await resetSettled();
      reset("null-seed"); reset("empty-seed"); await resetSettled();
      form("cancel").addEventListener("reset", (event) => event.preventDefault()); reset("cancel"); await resetSettled();
      reset("parent"); cases.parent.setValue("gamma"); flushSync(); await resetSettled();
      reset("interaction"); choose("interaction", "beta"); await resetSettled();
      reset("open-only"); cases["open-only"].setOpen(true); cases["open-only"].setDefaultOpen(true); flushSync(); await resetSettled();
      reset("unmount"); cases.unmount.hide(); flushSync(); await resetSettled();
      return { states: Object.fromEntries(Object.keys(cases).map((id) => [id, state(id)])) };
    `,
    );
    expect(result.states.seed).toMatchObject({
      value: "alpha",
      valueModel: "alpha",
      formValue: "alpha",
      valueWrites: ["alpha"],
      valueCallbacks: [],
    });
    expect(result.states["model-seed"]).toMatchObject({
      value: "gamma",
      valueModel: "gamma",
      valueWrites: ["gamma"],
    });
    for (const id of ["null-seed", "empty-seed"])
      expect(result.states[id]).toMatchObject({
        value: null,
        valueModel: null,
        valueWrites: [null],
        formValue: "",
      });
    expect(result.states.cancel).toMatchObject({
      value: "beta",
      valueModel: "beta",
      valueWrites: [],
    });
    expect(result.states.parent).toMatchObject({
      value: "gamma",
      valueModel: "gamma",
      valueWrites: [],
    });
    expect(result.states.interaction).toMatchObject({
      value: "beta",
      valueModel: "beta",
      valueWrites: ["beta"],
    });
    expect(result.states["open-only"]).toMatchObject({
      open: true,
      openModel: true,
      value: "alpha",
      valueWrites: ["alpha"],
      openWrites: [],
    });
    expect(result.states.unmount).toMatchObject({
      exists: false,
      valueModel: "beta",
      valueWrites: [],
    });
  }, 60_000);
});
