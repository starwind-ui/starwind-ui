import { copyFile, mkdtemp, rm, writeFile } from "node:fs/promises";
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

describe("generated Svelte Button lifecycle", () => {
  it("renders without DOM globals and hydrates with balanced attachment ownership", async () => {
    expect(globalThis).not.toHaveProperty("window");
    expect(globalThis).not.toHaveProperty("document");

    const root = await createHarness();
    const ssrServer = await createProofServer(root, true);
    servers.push(ssrServer);
    const appModule = await ssrServer.ssrLoadModule("/App.svelte");
    const serverMarkup = render(appModule.default).body;

    expect(serverMarkup.match(/<button\b/g)).toHaveLength(1);
    expect(serverMarkup).toContain('data-native="forwarded"');
    expect(serverMarkup).toContain('aria-label="Svelte proof"');
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
    const url = browserServer.resolvedUrls?.local[0];
    if (!url) throw new Error("Svelte proof Vite server did not expose a local URL.");
    await page.goto(url);
    await page.waitForFunction(() => document.documentElement.dataset.svelteProofResult);
    const result = await page.evaluate(() =>
      JSON.parse(document.documentElement.dataset.svelteProofResult ?? "{}"),
    );

    expect(result).toEqual({
      activations: 1,
      afterDisabled: { ariaDisabled: "true", dataDisabled: true, nativeDisabled: false },
      connection: { connects: 2, destroys: 2, updates: 2 },
      externalAttachment: { cleanups: 1, connects: 1 },
      forwarded: {
        ariaLabel: "Svelte proof",
        className: "native-class",
        dataNative: "forwarded",
        id: "proof-button",
      },
      hydrationExact: true,
      rootCount: 1,
      rootCountAfterUnmount: 0,
    });
  }, 60_000);
});

async function createHarness(): Promise<string> {
  const root = await mkdtemp(path.join(process.cwd(), ".svelte-proof-browser-"));
  temporaryRoots.push(root);
  await copyFile(
    path.join(process.cwd(), "packages/svelte/src/button/ButtonRoot.svelte"),
    path.join(root, "ButtonRoot.svelte"),
  );
  await writeFile(
    path.join(root, "runtime.ts"),
    `const proof = globalThis.__connectionProof ??= { connects: 0, destroys: 0, updates: 0 };
export function createButton() {
  proof.connects += 1;
  return {
    destroy() { proof.destroys += 1; },
    setDisabled() { proof.updates += 1; },
  };
}
`,
    "utf8",
  );
  await writeFile(
    path.join(root, "App.svelte"),
    `<script lang="ts">
  import { createAttachmentKey, type Attachment } from "svelte/attachments";
  import ButtonRoot from "./ButtonRoot.svelte";

  let disabled = $state(false);
  let focusableWhenDisabled = $state(true);
  let activations = $state(0);
  const externalAttachment: Attachment<HTMLButtonElement> = (root) => {
    const proof = (globalThis as any).__externalAttachmentProof ??= { connects: 0, cleanups: 0 };
    proof.connects += 1;
    return () => { proof.cleanups += 1; };
  };
  const attachmentProps = { [createAttachmentKey()]: externalAttachment };

  export function setDisabled(value: boolean) { disabled = value; }
  export function setFocusableWhenDisabled(value: boolean) { focusableWhenDisabled = value; }
  export function getActivations() { return activations; }
</script>

<ButtonRoot
  {...attachmentProps}
  id="proof-button"
  class="native-class"
  data-native="forwarded"
  aria-label="Svelte proof"
  {disabled}
  {focusableWhenDisabled}
  onclick={() => activations += 1}
>
  Proof {activations}
</ButtonRoot>
`,
    "utf8",
  );
  await writeFile(
    path.join(root, "main.ts"),
    `import { flushSync, hydrate, unmount } from "svelte";
import App from "./App.svelte";

try {
  const target = document.querySelector("#app");
  if (!(target instanceof HTMLElement)) throw new Error("Missing hydration target.");
  const before = target.innerHTML;
  const instance = hydrate(App, { target });
  flushSync();
  const afterHydration = target.innerHTML;
  const button = target.querySelector("button");
  if (!(button instanceof HTMLButtonElement)) throw new Error("Missing generated button.");
  button.click();
  flushSync();
  instance.setDisabled(true);
  flushSync();
  const afterDisabled = {
    ariaDisabled: button.getAttribute("aria-disabled"),
    dataDisabled: button.hasAttribute("data-disabled"),
    nativeDisabled: button.disabled,
  };
  instance.setDisabled(false);
  flushSync();
  instance.setFocusableWhenDisabled(false);
  flushSync();
  instance.setFocusableWhenDisabled(true);
  flushSync();
  const proof = {
    activations: instance.getActivations(),
    afterDisabled,
    connection: globalThis.__connectionProof,
    externalAttachment: globalThis.__externalAttachmentProof,
    forwarded: {
      ariaLabel: button.getAttribute("aria-label"),
      className: button.className,
      dataNative: button.dataset.native,
      id: button.id,
    },
    hydrationExact: before === afterHydration,
    rootCount: target.querySelectorAll("button").length,
  };
  await unmount(instance);
  document.documentElement.dataset.svelteProofResult = JSON.stringify({
    ...proof,
    rootCountAfterUnmount: target.querySelectorAll("button").length,
  });
} catch (error) {
  document.documentElement.dataset.svelteProofResult = JSON.stringify({
    error: error instanceof Error ? error.stack ?? error.message : String(error),
  });
}
`,
    "utf8",
  );
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
        "@starwind-ui/runtime/button": path.join(root, "runtime.ts"),
      },
    },
    root,
    server: middlewareMode
      ? { middlewareMode: true }
      : { host: "127.0.0.1", port: 0, strictPort: false },
  });
}
