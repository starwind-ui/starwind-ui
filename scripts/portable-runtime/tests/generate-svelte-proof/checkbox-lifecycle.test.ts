import { copyFile, mkdir, mkdtemp, rm, writeFile } from "node:fs/promises";
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
    expect(result).toEqual({
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
      externalAttachment: { cleanups: 1, connects: 1 },
      group: {
        callbackCount: 0,
        checkedAfterContextUpdate: false,
        disabledAfterContextUpdate: false,
        initiallyChecked: true,
        initiallyDisabled: true,
      },
      hydrationExact: true,
      runtimeDom: {
        primaryInputs: 6,
        styledInputs: 6,
        uncheckedInputs: 1,
      },
      lifecycle: {
        checkedSets: 5,
        connects: 7,
        destroys: 7,
        disabledSets: 1,
        indeterminateSets: 2,
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
        explicitHidden: true,
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

async function createHarness(): Promise<string> {
  const root = await mkdtemp(path.join(process.cwd(), ".svelte-checkbox-browser-"));
  temporaryRoots.push(root);
  const checkboxRoot = path.join(root, "checkbox");
  await mkdir(checkboxRoot);
  for (const file of ["CheckboxRoot.svelte", "CheckboxIndicator.svelte", "index.ts"]) {
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
      ? { middlewareMode: true }
      : { host: "127.0.0.1", port: 0, strictPort: false },
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
      styledInputs: runtimeInputs.filter((input) => input.getAttribute('style')?.includes('position: absolute')).length,
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
