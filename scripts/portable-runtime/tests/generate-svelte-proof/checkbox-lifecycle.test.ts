import { copyFile, mkdir, mkdtemp, rm, writeFile } from "node:fs/promises";
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

describe("generated Svelte Checkbox lifecycle", () => {
  it("preserves cancellation, binding, forms, context, presence, refs, and cleanup", async () => {
    expect(globalThis).not.toHaveProperty("window");
    expect(globalThis).not.toHaveProperty("document");

    const root = await createHarness();
    const ssrServer = await createProofServer(root, true);
    servers.push(ssrServer);
    const appModule = await ssrServer.ssrLoadModule("/App.svelte");
    const serverMarkup = render(appModule.default).body;

    expect(serverMarkup).toContain('data-case="controlled"');
    expect(serverMarkup).toContain('data-case="native"');
    expect(serverMarkup.match(/data-sw-checkbox(?:\s|=)/g)).toHaveLength(6);
    expect(globalThis).not.toHaveProperty("window");
    expect(globalThis).not.toHaveProperty("document");

    await writeFile(
      path.join(root, "index.html"),
      `<div id="app">${serverMarkup}</div><script type="module" src="/main.ts"></script>`,
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
        !message
          .text()
          .includes("Failed to load resource: the server responded with a status of 404")
      ) {
        errors.push(message.text());
      }
    });
    const url = browserServer.resolvedUrls?.local[0];
    if (!url) throw new Error("Svelte Checkbox proof server did not expose a local URL.");
    await page.goto(url);
    try {
      await page.waitForFunction(
        () => document.documentElement.dataset.svelteCheckboxResult,
        undefined,
        { timeout: 20_000 },
      );
    } catch (error) {
      throw new Error(
        `Checkbox browser proof did not complete. Console: ${errors.join(" | ") || "none"}`,
        { cause: error },
      );
    }
    const result = await page.evaluate(() =>
      JSON.parse(document.documentElement.dataset.svelteCheckboxResult ?? "{}"),
    );

    expect(errors).toEqual([]);
    expect(result.externalAttachment.connects).toBeGreaterThan(0);
    expect(result.externalAttachment.cleanups).toBe(result.externalAttachment.connects);
    const { externalAttachment: _externalAttachment, lifecycle, ...ordinaryResult } = result;
    expect(lifecycle.connects).toBeGreaterThan(0);
    expect(lifecycle.destroys).toBe(lifecycle.connects);
    expect(ordinaryResult).toEqual({
      accepted: {
        binding: true,
        callbackCount: 2,
        callbackSawPreviousBinding: true,
        formValue: "yes",
        indicatorPresent: true,
      },
      afterExternalControlled: {
        binding: false,
        callbackCount: 2,
        formValue: "no",
      },
      canceled: {
        binding: false,
        callbackCount: 1,
        formValue: "no",
        indicatorPresent: false,
      },
      group: {
        callbackCount: 0,
        checkedAfterContextUpdate: false,
        disabledAfterContextUpdate: false,
        initiallyChecked: true,
        initiallyDisabled: true,
      },
      hydrationExact: false,
      runtimeDom: {
        primaryInputs: 6,
        styledInputs: 6,
        uncheckedInputs: 1,
      },
      native: {
        inputIsSibling: true,
        nestedInputCount: 0,
        popoverTarget: "native-popover",
        popoverTargetAction: "show",
        rootTag: "BUTTON",
      },
      nativeHandlerCount: 2,
      presence: {
        explicitHidden: false,
        keptVisible: true,
        unkeptAfterFalse: false,
        unkeptAfterTrue: true,
      },
      refs: {
        indicatorCleanups: 1,
        indicatorConnects: 1,
        rootCleanups: 1,
        rootConnects: 1,
      },
      reset: {
        afterClick: "off",
        afterReset: "on",
        bindingAfterReset: true,
      },
      rootCountAfterUnmount: 0,
    });
  }, 120_000);
});

describe("Checkbox model commands and accepted publication", () => {
  it("applies the model input table and reads function bindings once", async () => {
    const result = await runModelCases(
      [
        { id: "omitted", mode: "omitted" },
        { id: "defaulted", mode: "omitted", defaultChecked: true },
        { id: "plain", mode: "plain", initial: false, defaultChecked: true },
        { id: "undefined", mode: "bound", defaultChecked: true },
        { id: "initial", mode: "bound", initial: true },
        { id: "identity", mode: "function", initial: false },
      ],
      `
      const initial = Object.fromEntries(Object.keys(cases).map((id) => [id, state(id)]));
      click("plain"); await settle();
      const plainInteraction = state("plain");
      cases.plain.setModel(true); await settle();
      cases.plain.setModel(undefined); await settle();
      const laterUndefined = state("plain");
      cases.plain.setModel(false); await settle();
      const parentCommand = state("plain");
      cases.plain.setDefault(false); await settle();
      reset("plain"); await resetSettled();
      const frozenDefault = state("plain");
      cases.undefined.setModel(undefined); await settle();
      click("undefined"); await settle();
      const undefinedInteraction = state("undefined");
      click("initial"); await settle();
      cases.initial.setReadOnly(true); await settle();
      const recreated = state("initial");
      reset("initial"); await resetSettled();
      const initialResetSeed = state("initial");
      click("identity"); await settle();
      return { initial, plainInteraction, laterUndefined, parentCommand, frozenDefault,
        undefinedInteraction, recreated, initialResetSeed,
        functions: { identity: state("identity") } };
    `,
    );
    expect(result.initial).toMatchObject({
      omitted: { checked: false, model: "undefined", callbacks: [], formValue: "no" },
      defaulted: { checked: true, model: "undefined", callbacks: [], formValue: "yes" },
      plain: { checked: false, model: false, callbacks: [] },
      undefined: { checked: true, model: true, callbacks: [] },
      initial: { checked: true, model: true, callbacks: [] },
    });
    expect(result.plainInteraction).toMatchObject({
      checked: true,
      model: false,
      formValue: "yes",
    });
    expect(result.laterUndefined).toMatchObject({ checked: true, model: "undefined" });
    expect(result.parentCommand).toMatchObject({ checked: false, model: false, formValue: "no" });
    expect(result.frozenDefault).toMatchObject({ checked: true, model: false, formValue: "yes" });
    expect(result.undefinedInteraction).toMatchObject({
      checked: false,
      model: false,
      formValue: "no",
    });
    expect(result.recreated).toMatchObject({ checked: false, model: false });
    expect(result.initialResetSeed).toMatchObject({ checked: true, model: true });
    expect(result.functions.identity).toMatchObject({ checked: true, model: true, writes: [true] });
  }, 60_000);

  it("publishes after DOM veto and reconciles reentrant parent commands without proposal echoes", async () => {
    const result = await runModelCases(
      [
        { id: "callback", mode: "function", initial: false, proposal: "cancel" },
        { id: "dom", mode: "function", initial: false },
        { id: "unmount", mode: "function", initial: false, proposal: "unmount" },
      ],
      `
      const observations = [];
      root("callback").addEventListener("starwind:checked-change", (event) => {
        observations.push({ id: "callback", canceled: event.detail.isCanceled, model: cases.callback.snapshot().model });
      });
      const cancelDom = (event) => {
        observations.push({ id: "dom", canceled: event.detail.isCanceled, model: cases.dom.snapshot().model });
        event.preventDefault();
      };
      root("dom").addEventListener("starwind:checked-change", cancelDom);
      for (const id of Object.keys(cases)) { click(id); await settle(); }
      const canceled = Object.fromEntries(Object.keys(cases).map((id) => [id, state(id)]));
      root("dom").removeEventListener("starwind:checked-change", cancelDom);
      click("dom"); await settle();
      return { observations, canceled, accepted: state("dom") };
    `,
    );
    expect(result.observations).toEqual([
      { id: "callback", canceled: true, model: false },
      { id: "dom", canceled: false, model: false },
    ]);
    for (const id of ["callback", "dom"]) {
      expect(result.canceled[id]).toMatchObject({
        checked: false,
        model: false,
        writes: [],
        formValue: "no",
      });
    }
    expect(result.canceled.unmount).toMatchObject({ exists: false, model: false, writes: [] });
    expect(result.accepted).toMatchObject({
      checked: true,
      model: true,
      writes: [true],
      formValue: "yes",
    });
    expect(result.accepted.callbacks).toEqual([
      { next: true, previousModel: false },
      { next: true, previousModel: false },
    ]);
  }, 60_000);

  it("reconciles parent commands flushed after accepted publication", async () => {
    const configs: CheckboxModelCase[] = (["bound", "function"] as const).flatMap((mode) =>
      [false, true].map((initial) => ({ id: mode + "-" + initial, mode, initial })),
    );
    const result = await runModelCases(
      configs,
      `
      const accepted = {};
      const commanded = {};
      for (const id of Object.keys(cases)) {
        const initial = id.endsWith("true");
        click(id);
        flushSync();
        accepted[id] = state(id);
        cases[id].setModel(initial);
        flushSync();
        await settle();
        commanded[id] = state(id);
      }
      return { accepted, commanded };
    `,
    );
    for (const { id, mode, initial } of configs) {
      expect(result.accepted[id]).toMatchObject({
        model: !initial,
        checked: !initial,
        nativeChecked: !initial,
        ariaChecked: String(!initial),
        formValue: initial ? "no" : "yes",
      });
      expect(result.commanded[id]).toMatchObject({
        model: initial,
        checked: initial,
        nativeChecked: initial,
        ariaChecked: String(initial),
        formValue: initial ? "yes" : "no",
        writes: mode === "function" ? [!initial] : [],
        callbacks: [{ next: !initial, previousModel: initial }],
      });
    }
    expect(result.cleanup.connects).toBe(4);
    expect(result.cleanup.destroys).toBe(4);
  }, 60_000);

  // Public CheckboxGroup ownership is exercised in checkbox-group-ownership.test.ts.
  it("preserves frozen reset seeds, ordinary indeterminate updates, and unmount", async () => {
    const result = await runModelCases(
      [
        { id: "seed", mode: "function", initial: true, defaultChecked: false },
        { id: "parent", mode: "function", initial: false, defaultChecked: false },
        { id: "removed", mode: "function", initial: true, defaultChecked: false },
      ],
      `
      cases.seed.setDefault(true); await settle();
      reset("seed"); await resetSettled();
      cases.parent.setIndeterminate(true); await settle();
      cases.removed.hide(); flushSync(); await settle();
      return { states: Object.fromEntries(Object.keys(cases).map((id) => [id, state(id)])) };
    `,
    );
    expect(result.states.seed).toMatchObject({
      checked: false,
      model: false,
      writes: [false],
      callbacks: [],
    });
    expect(result.states.parent).toMatchObject({
      checked: false,
      model: false,
      indeterminate: true,
      ariaChecked: "mixed",
      writes: [],
      callbacks: [],
    });
    expect(result.states.removed).toMatchObject({
      exists: false,
      model: true,
      writes: [],
      callbacks: [],
    });
  }, 60_000);
});

type CheckboxModelCase = {
  id: string;
  mode: "omitted" | "plain" | "bound" | "function";
  initial?: boolean;
  group?: boolean;
  defaultChecked?: boolean;
  indeterminate?: boolean;
  setter?: "identity" | "retain" | "invert";
  proposal?:
    | "readonly-accept"
    | "readonly-cancel"
    | "id-accept"
    | "id-cancel"
    | "accept"
    | "cancel"
    | "command-cancel"
    | "two-commands"
    | "unmount";
};

async function runModelCases(configs: CheckboxModelCase[], actions: string): Promise<any> {
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
  await writeFile(
    path.join(directory, "index.html"),
    `<link rel="icon" href="data:,"><div id="app"></div><script type="module" src="/main.ts"></script>`,
    "utf8",
  );
  await writeFile(
    path.join(directory, "main.ts"),
    `import { mount, flushSync, tick, unmount } from "svelte";
import App from "./App.svelte";
try {
  const app = mount(App, { target: document.querySelector("#app")! });
  const settle = async () => { flushSync(); await tick(); flushSync(); };
  const resetSettled = async () => { await new Promise((resolve) => setTimeout(resolve, 10)); await settle(); };
  await settle();
  const cases = app.getCases();
  const root = (id) => document.querySelector('[data-model-case="' + id + '"]');
  const form = (id) => document.querySelector('[data-model-form="' + id + '"]');
  const click = (id) => root(id)?.click();
  const reset = (id) => form(id).reset();
  const state = (id) => {
    const element = root(id);
    return { ...cases[id].snapshot(), exists: Boolean(element),
      checked: element?.hasAttribute("data-checked") ?? null,
      inputId: element?.querySelector("input")?.id ?? null,
      ariaChecked: element?.getAttribute("aria-checked") ?? null,
      nativeChecked: element?.querySelector("input")?.checked ?? null,
      readOnly: element?.getAttribute("aria-readonly") ?? null,
      indeterminate: element?.querySelector("input")?.indeterminate ?? null,
      formId: element?.querySelector("input")?.form?.id ?? null,
      formValue: new FormData(element?.querySelector("input")?.form ?? form(id)).get("choice"),
    };
  };
  const result = await (async () => { ${actions} })();
  await unmount(app);
  await resetSettled();
  document.documentElement.dataset.svelteCheckboxResult = JSON.stringify({ ...result, cleanup: { ...globalThis.__checkboxLifecycle } });
} catch (error) {
  document.documentElement.dataset.svelteCheckboxResult = JSON.stringify({ error: String(error) });
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
  if (!url) throw new Error("Missing Checkbox model proof URL.");
  await page.goto(url);
  await page.waitForFunction(() => document.documentElement.dataset.svelteCheckboxResult);
  const result = await page.evaluate(() =>
    JSON.parse(document.documentElement.dataset.svelteCheckboxResult ?? "{}"),
  );
  expect(errors).toEqual([]);
  expect(result).not.toHaveProperty("error");
  return result;
}

const MODEL_CASE_SOURCE = String.raw`<script lang="ts">
import { flushSync, setContext, untrack } from "svelte";
import { CheckboxRoot, CheckboxIndicator, CheckboxGroupContext } from "./checkbox/index.js";
let { id, mode, initial, defaultChecked, group, indeterminate: initialIndeterminate = false, setter = "identity", proposal = "accept" } = $props();
let model = $state<boolean | undefined>(untrack(() => initial));
let seed = $state<boolean | undefined>(untrack(() => defaultChecked));
let mixed = $state(untrack(() => initialIndeterminate));
let readOnly = $state(false);
let runtimeId = $state<string | undefined>(undefined);
let associatedForm = $state<string | undefined>(undefined);
let shown = $state(true);
let grouped = $state(untrack(() => group));
if (untrack(() => group !== undefined)) {
  setContext(CheckboxGroupContext, { disabled: false, get value() { return grouped ? ["yes"] : []; } });
}
const writes: boolean[] = [];
const callbacks: { next: boolean; previousModel: boolean | undefined }[] = [];
function handleProposal(next, detail) {
  callbacks.push({ next, previousModel: model });
  if (proposal.startsWith("readonly-")) { readOnly = true; flushSync(); }
  if (proposal.startsWith("id-")) { runtimeId = id + "-changed"; flushSync(); }
  if (proposal.endsWith("-cancel")) detail.cancel();
  if (proposal === "cancel") detail.cancel();
  if (proposal === "command-cancel") { model = next; detail.cancel(); }
  if (proposal === "two-commands") { model = next; flushSync(); model = !next; flushSync(); }
  if (proposal === "unmount") { shown = false; flushSync(); }
}
function publish(next) {
  writes.push(next);
  if (setter === "identity") model = next;
  else if (setter === "invert") model = !next;
}
export function setGroup(next: boolean) { grouped = next; }
export function setModel(next: boolean | undefined) { model = next; }
export function setDefault(next: boolean | undefined) { seed = next; }
export function setForm(next: string) { associatedForm = next; }
export function setId(next: string) { runtimeId = next; }
export function setReadOnly(next: boolean) { readOnly = next; }
export function setIndeterminate(next: boolean) { mixed = next; }
export function hide() { shown = false; }
export function snapshot() { return { model: model ?? "undefined", writes: [...writes], callbacks: [...callbacks] }; }
</script>
<form id={id + "-other"}></form>
<form data-model-form={id}>
{#if shown}
  {#if mode === "omitted"}
    <CheckboxRoot data-model-case={id} defaultChecked={seed} indeterminate={mixed} {readOnly} id={runtimeId} form={associatedForm} name="choice" value="yes" uncheckedValue="no" onCheckedChange={handleProposal}>Choice<CheckboxIndicator /></CheckboxRoot>
  {:else if mode === "plain"}
    <CheckboxRoot data-model-case={id} checked={model} defaultChecked={seed} indeterminate={mixed} {readOnly} id={runtimeId} form={associatedForm} name="choice" value="yes" uncheckedValue="no" onCheckedChange={handleProposal}>Choice<CheckboxIndicator /></CheckboxRoot>
  {:else if mode === "function"}
    <CheckboxRoot data-model-case={id} bind:checked={() => model, publish} defaultChecked={seed} indeterminate={mixed} {readOnly} id={runtimeId} form={associatedForm} name="choice" value="yes" uncheckedValue="no" onCheckedChange={handleProposal}>Choice<CheckboxIndicator /></CheckboxRoot>
  {:else}
    <CheckboxRoot data-model-case={id} bind:checked={model} defaultChecked={seed} indeterminate={mixed} {readOnly} id={runtimeId} form={associatedForm} name="choice" value="yes" uncheckedValue="no" onCheckedChange={handleProposal}>Choice<CheckboxIndicator /></CheckboxRoot>
  {/if}
{/if}
</form>`;

async function createHarness(): Promise<string> {
  const root = await mkdtemp(path.join(process.cwd(), ".svelte-checkbox-browser-"));
  temporaryRoots.push(root);
  await mkdir(path.join(root, "_internal"));
  await copyFile(
    path.join(process.cwd(), "packages/svelte/src/_internal/ref-attachment.ts"),
    path.join(root, "_internal/ref-attachment.ts"),
  );
  const checkboxRoot = path.join(root, "checkbox");
  await mkdir(checkboxRoot);
  for (const file of [
    "CheckboxRoot.svelte",
    "CheckboxIndicator.svelte",
    "CheckboxGroupContext.svelte.ts",
    "index.ts",
  ]) {
    await copyFile(
      path.join(process.cwd(), "packages/svelte/src/checkbox", file),
      path.join(checkboxRoot, file),
    );
  }
  const actualRuntime = path
    .join(process.cwd(), "packages/runtime/src/components/checkbox/checkbox.ts")
    .replaceAll("\\", "/");
  await writeFile(
    path.join(root, "runtime.ts"),
    `import { createCheckbox as createActualCheckbox } from "${actualRuntime}";

const proof = globalThis.__checkboxLifecycle ??= {
  checkedSets: 0,
  connects: 0,
  destroys: 0,
  disabledSets: 0,
  indeterminateSets: 0,
};

export function createCheckbox(root, options) {
  proof.connects += 1;
  const instance = createActualCheckbox(root, options);
  return new Proxy(instance, {
    get(target, property) {
      const value = Reflect.get(target, property);
      if (property === "destroy") return () => { proof.destroys += 1; return target.destroy(); };
      if (property === "setChecked") return (...args) => { proof.checkedSets += 1; return target.setChecked(...args); };
      if (property === "setDisabled") return (...args) => { proof.disabledSets += 1; return target.setDisabled(...args); };
      if (property === "setIndeterminate") return (...args) => { proof.indeterminateSets += 1; return target.setIndeterminate(...args); };
      return typeof value === "function" ? value.bind(target) : value;
    },
  });
}
`,
    "utf8",
  );
  await writeFile(path.join(root, "GroupHarness.svelte"), GROUP_HARNESS_SOURCE, "utf8");
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
    resolve: {
      alias: {
        "@starwind-ui/runtime/checkbox": path.join(root, "runtime.ts"),
      },
    },
    root,
    server: middlewareMode
      ? { middlewareMode: true, watch: null, hmr: false }
      : { host: "127.0.0.1", port: 0, strictPort: false, watch: null, hmr: false },
  });
}

const GROUP_HARNESS_SOURCE = String.raw`<script lang="ts">
  import { setContext } from "svelte";
  import {
    CheckboxGroupContext,
    CheckboxIndicator,
    CheckboxRoot,
    type CheckboxGroupContextValue,
  } from "./checkbox/index";

  let disabled = $state(true);
  let value = $state<readonly string[]>(["group-value"]);
  let callbackCount = $state(0);
  const context: CheckboxGroupContextValue = {
    get disabled() { return disabled; },
    get value() { return value; },
  };
  setContext(CheckboxGroupContext, context);

  export function updateContext() {
    disabled = false;
    value = [];
  }
  export function getCallbackCount() { return callbackCount; }
</script>

<CheckboxRoot
  id="group-checkbox"
  data-case="group"
  value="group-value"
  onCheckedChange={() => callbackCount += 1}
>
  <CheckboxIndicator data-case="group-indicator">Group</CheckboxIndicator>
</CheckboxRoot>
`;

const APP_SOURCE = String.raw`<script lang="ts">
  import { createAttachmentKey, type Attachment } from "svelte/attachments";
  import { CheckboxIndicator, CheckboxRoot } from "./checkbox/index";
  import GroupHarness from "./GroupHarness.svelte";

  let controlled = $state(false);
  let cancelNext = $state(true);
  let callbackCount = $state(0);
  let callbackSawPreviousBinding = $state(false);
  let nativeHandlerCount = $state(0);
  let uncontrolled = $state<boolean | undefined>(undefined);
  let presenceChecked = $state(false);
  let remount = $state(true);
  let groupHarness: { updateContext(): void; getCallbackCount(): number } | undefined;
  let rootConnects = $state(0);
  let rootCleanups = $state(0);
  let indicatorConnects = $state(0);
  let indicatorCleanups = $state(0);

  const externalAttachment: Attachment<HTMLElement> = () => {
    const proof = (globalThis as any).__checkboxExternalAttachment ??= { connects: 0, cleanups: 0 };
    proof.connects += 1;
    return () => { proof.cleanups += 1; };
  };
  const attachmentProps = { [createAttachmentKey()]: externalAttachment };

  function handleControlled(next: boolean, detail: { isCanceled: boolean; cancel(): void }) {
    callbackCount += 1;
    callbackSawPreviousBinding = controlled === false;
    if (cancelNext) detail.cancel();
  }
  function rootRef(element: HTMLElement | null) {
    if (element) rootConnects += 1;
    else rootCleanups += 1;
  }
  function indicatorRef(element: HTMLSpanElement | null) {
    if (element) indicatorConnects += 1;
    else indicatorCleanups += 1;
  }

  export function acceptNext() { cancelNext = false; }
  export function setControlled(value: boolean) { controlled = value; }
  export function setPresence(value: boolean) { presenceChecked = value; }
  export function setRemount(value: boolean) { remount = value; }
  export function updateGroup() { groupHarness?.updateContext(); }
  export function snapshot() {
    return {
      callbackCount,
      callbackSawPreviousBinding,
      controlled,
      groupCallbackCount: groupHarness?.getCallbackCount() ?? -1,
      indicatorCleanups,
      indicatorConnects,
      nativeHandlerCount,
      rootCleanups,
      rootConnects,
      uncontrolled,
    };
  }
</script>

<form id="proof-form">
  <CheckboxRoot
    {...attachmentProps}
    bind:checked={controlled}
    id="controlled-checkbox"
    data-case="controlled"
    aria-label="Controlled checkbox"
    name="terms"
    uncheckedValue="no"
    value="yes"
    onCheckedChange={handleControlled}
    onclick={() => nativeHandlerCount += 1}
    ref={rootRef}
  >
    <CheckboxIndicator data-case="controlled-indicator" ref={indicatorRef}>
      Controlled
    </CheckboxIndicator>
  </CheckboxRoot>

  <CheckboxRoot
    bind:checked={uncontrolled}
    id="uncontrolled-checkbox"
    data-case="uncontrolled"
    defaultChecked
    name="reset-value"
    uncheckedValue="off"
    value="on"
  >
    <CheckboxIndicator data-case="uncontrolled-indicator">Uncontrolled</CheckboxIndicator>
  </CheckboxRoot>

  <CheckboxRoot nativeButton id="native-checkbox" data-case="native" aria-label="Native checkbox" popovertarget="native-popover" popovertargetaction="show">
    Native
  </CheckboxRoot>
  <div id="native-popover" popover>Native popover</div>
</form>

<CheckboxRoot bind:checked={presenceChecked} id="presence-checkbox" data-case="presence">
  <CheckboxIndicator data-case="presence-unkept">Unkept</CheckboxIndicator>
  <CheckboxIndicator data-case="presence-kept" keepMounted>Kept</CheckboxIndicator>
  <CheckboxIndicator data-case="presence-hidden" keepMounted hidden>Hidden</CheckboxIndicator>
</CheckboxRoot>

{#if remount}
  <CheckboxRoot id="remount-checkbox" data-case="remount">Remount</CheckboxRoot>
{/if}

<GroupHarness bind:this={groupHarness} />
`;

const MAIN_SOURCE = String.raw`import { flushSync, hydrate, unmount } from "svelte";
import App from "./App.svelte";

const formValue = (name) => new FormData(document.querySelector("#proof-form")).get(name);
const query = (selector) => document.querySelector(selector);
const publicMarkup = (html) => {
  const template = document.createElement("template");
  template.innerHTML = html;
  template.content
    .querySelectorAll("[data-sw-checkbox-input], [data-sw-checkbox-unchecked-input]")
    .forEach((input) => input.remove());
  template.content.querySelectorAll("[data-starting-style], [data-ending-style]").forEach((element) => {
    element.removeAttribute("data-starting-style");
    element.removeAttribute("data-ending-style");
  });
  template.content.querySelectorAll("*").forEach((element) => {
    const attributes = Array.from(element.attributes)
      .map(({ name, value }) => [name, value])
      .sort(([left], [right]) => left.localeCompare(right));
    for (const { name } of Array.from(element.attributes)) element.removeAttribute(name);
    for (const [name, value] of attributes) element.setAttribute(name, value);
  });
  return template.innerHTML;
};

void (async () => {
try {
  const target = document.querySelector("#app");
  if (!(target instanceof HTMLElement)) throw new Error("Missing Checkbox hydration target.");
  const before = target.innerHTML;
  const instance = hydrate(App, { target });
  flushSync();
  await Promise.resolve();
  const afterHydration = target.innerHTML;
  const beforePublic = publicMarkup(before);
  const afterPublic = publicMarkup(afterHydration);
  const runtimeInputs = Array.from(target.querySelectorAll('[data-sw-checkbox-input]'));

  const controlled = query('[data-case="controlled"]');
  if (!(controlled instanceof HTMLElement)) throw new Error("Missing controlled Checkbox.");
  controlled.click();
  flushSync();
  const canceledSnapshot = instance.snapshot();
  const canceled = {
    binding: canceledSnapshot.controlled,
    callbackCount: canceledSnapshot.callbackCount,
    formValue: formValue("terms"),
    indicatorPresent: Boolean(query('[data-case="controlled-indicator"]')),
  };

  instance.acceptNext();
  controlled.click();
  flushSync();
  const acceptedSnapshot = instance.snapshot();
  const accepted = {
    binding: acceptedSnapshot.controlled,
    callbackCount: acceptedSnapshot.callbackCount,
    callbackSawPreviousBinding: acceptedSnapshot.callbackSawPreviousBinding,
    formValue: formValue("terms"),
    indicatorPresent: Boolean(query('[data-case="controlled-indicator"]')),
  };

  instance.setControlled(false);
  flushSync();
  const externalSnapshot = instance.snapshot();
  const afterExternalControlled = {
    binding: externalSnapshot.controlled,
    callbackCount: externalSnapshot.callbackCount,
    formValue: formValue("terms"),
  };

  const uncontrolled = query('[data-case="uncontrolled"]');
  if (!(uncontrolled instanceof HTMLElement)) throw new Error("Missing uncontrolled Checkbox.");
  uncontrolled.click();
  flushSync();
  const resetAfterClick = formValue("reset-value");
  document.querySelector("#proof-form").reset();
  await new Promise((resolve) => setTimeout(resolve, 10));
  flushSync();
  const resetSnapshot = instance.snapshot();
  const reset = {
    afterClick: resetAfterClick,
    afterReset: formValue("reset-value"),
    bindingAfterReset: resetSnapshot.uncontrolled,
  };

  const native = query('[data-case="native"]');
  const nativeInput = native?.nextElementSibling;
  const nativeProof = {
    inputIsSibling: nativeInput instanceof HTMLInputElement && nativeInput.hasAttribute("data-sw-checkbox-input"),
    nestedInputCount: native?.querySelectorAll("input").length ?? -1,
    popoverTarget: native?.getAttribute("popovertarget"),
    popoverTargetAction: native?.getAttribute("popovertargetaction"),
    rootTag: native?.tagName,
  };

  const group = query('[data-case="group"]');
  const groupInitial = {
    checked: group?.hasAttribute("data-checked") ?? false,
    disabled: group?.hasAttribute("data-disabled") ?? false,
  };
  instance.updateGroup();
  flushSync();
  const groupSnapshot = instance.snapshot();
  const groupProof = {
    callbackCount: groupSnapshot.groupCallbackCount,
    checkedAfterContextUpdate: group?.hasAttribute("data-checked") ?? true,
    disabledAfterContextUpdate: group?.hasAttribute("data-disabled") ?? true,
    initiallyChecked: groupInitial.checked,
    initiallyDisabled: groupInitial.disabled,
  };

  const keptVisible = query('[data-case="presence-kept"]')?.hidden === false;
  const explicitHidden = query('[data-case="presence-hidden"]')?.hidden === true;
  instance.setPresence(true);
  flushSync();
  const unkeptAfterTrue = Boolean(query('[data-case="presence-unkept"]'));
  instance.setPresence(false);
  flushSync();
  const unkeptAfterFalse = Boolean(query('[data-case="presence-unkept"]'));

  instance.setRemount(false);
  flushSync();
  instance.setRemount(true);
  flushSync();

  const beforeUnmount = instance.snapshot();
  const proof = {
    accepted,
    afterExternalControlled,
    canceled,
    group: groupProof,
    hydrationExact: beforePublic === afterPublic,
    runtimeDom: {
      primaryInputs: runtimeInputs.length,
      styledInputs: runtimeInputs.filter((input) => input.style.position === 'absolute').length,
      uncheckedInputs: target.querySelectorAll('[data-sw-checkbox-unchecked-input]').length,
    },
    native: nativeProof,
    nativeHandlerCount: beforeUnmount.nativeHandlerCount,
    presence: { explicitHidden, keptVisible, unkeptAfterFalse, unkeptAfterTrue },
    reset,
  };
  await unmount(instance);
  const afterUnmount = instance.snapshot();
  document.documentElement.dataset.svelteCheckboxResult = JSON.stringify({
    ...proof,
    externalAttachment: globalThis.__checkboxExternalAttachment,
    lifecycle: globalThis.__checkboxLifecycle,
    refs: {
      indicatorCleanups: afterUnmount.indicatorCleanups,
      indicatorConnects: afterUnmount.indicatorConnects,
      rootCleanups: afterUnmount.rootCleanups,
      rootConnects: afterUnmount.rootConnects,
    },
    rootCountAfterUnmount: target.querySelectorAll("[data-sw-checkbox]").length,
  });
} catch (error) {
  document.documentElement.dataset.svelteCheckboxResult = JSON.stringify({
    error: error instanceof Error ? error.stack ?? error.message : String(error),
  });
}
})();
`;
